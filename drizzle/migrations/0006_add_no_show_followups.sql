ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS followup_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_attempts integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.followup_candidates(p_now timestamptz DEFAULT now())
RETURNS SETOF public.appointments
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT c.* FROM public.appointments c
  WHERE c.status = 'no_show'
    AND c.followup_sent_at IS NULL
    AND c.followup_attempts < 3
    AND (c.followup_claimed_at IS NULL OR c.followup_claimed_at < p_now - interval '15 minutes')
    AND c.appointment_date BETWEEN (p_now AT TIME ZONE 'Asia/Kolkata')::date - 3
                               AND (p_now AT TIME ZONE 'Asia/Kolkata')::date - 1
    AND (p_now AT TIME ZONE 'Asia/Kolkata')::time >= time '10:00'
    AND (p_now AT TIME ZONE 'Asia/Kolkata')::time < time '20:00'
    AND nullif(btrim(coalesce(c.phone_e164, public.normalize_phone_e164(c.phone))), '') ~ '^\+[1-9][0-9]{7,14}$'
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments o
      WHERE o.id <> c.id
        AND o.phone_e164 = coalesce(c.phone_e164, public.normalize_phone_e164(c.phone))
        AND o.status IN ('pending', 'confirmed')
        AND (o.appointment_date + o.appointment_time::time) > (p_now AT TIME ZONE 'Asia/Kolkata')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments o
      WHERE o.id <> c.id
        AND o.phone_e164 = coalesce(c.phone_e164, public.normalize_phone_e164(c.phone))
        AND o.followup_sent_at > p_now - interval '14 days'
    )
$$;

CREATE OR REPLACE FUNCTION public.claim_due_followups(max_rows integer DEFAULT 20)
RETURNS TABLE (appointment_id uuid, patient_name text, phone text, doctor text, service text,
               appointment_date date, date_label text, appointment_time text)
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = public
AS $$
  UPDATE public.appointments AS a
  SET followup_claimed_at = now()
  WHERE a.id IN (
    SELECT f.id FROM public.followup_candidates(now()) f
    JOIN public.appointments lockrow ON lockrow.id = f.id
    ORDER BY f.appointment_date, f.appointment_time
    LIMIT greatest(least(coalesce(max_rows, 20), 100), 0)
    FOR UPDATE OF lockrow SKIP LOCKED
  )
  RETURNING a.id, a.name,
    coalesce(a.phone_e164, public.normalize_phone_e164(a.phone)),
    a.doctor, a.service, a.appointment_date,
    to_char(a.appointment_date, 'FMDay, FMDD Mon YYYY'),
    to_char(a.appointment_time::time, 'FMHH12:MI AM');
$$;

CREATE OR REPLACE FUNCTION public.record_followup_result(p_id uuid, p_success boolean)
RETURNS TABLE (id uuid, followup_sent_at timestamptz, followup_attempts integer)
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = public
AS $$
  UPDATE public.appointments a
  SET followup_sent_at = CASE WHEN p_success THEN coalesce(a.followup_sent_at, now()) ELSE a.followup_sent_at END,
      followup_attempts = CASE WHEN p_success THEN a.followup_attempts ELSE a.followup_attempts + 1 END,
      followup_claimed_at = NULL
  WHERE a.id = p_id
  RETURNING a.id, a.followup_sent_at, a.followup_attempts;
$$;

REVOKE ALL ON FUNCTION public.followup_candidates(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_due_followups(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_followup_result(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.followup_candidates(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_due_followups(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_followup_result(uuid, boolean) TO service_role;