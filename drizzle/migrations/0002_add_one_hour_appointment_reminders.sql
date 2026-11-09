ALTER TABLE public.appointments
  ADD COLUMN reminder_1h_claimed_at timestamptz,
  ADD COLUMN reminder_1h_sent_at timestamptz;

CREATE FUNCTION public.appointment_is_due_for_1h_reminder(
  p_status text, p_date date, p_time text, p_created_at timestamptz,
  p_claimed_at timestamptz, p_sent_at timestamptz, p_now timestamptz
) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public
AS $$
  SELECT p_status IN ('pending', 'confirmed')
    AND ((p_date + p_time::time) AT TIME ZONE 'Asia/Kolkata')
      BETWEEN p_now + interval '50 minutes' AND p_now + interval '70 minutes'
    AND p_created_at < p_now - interval '60 minutes'
    AND p_sent_at IS NULL
    AND (p_claimed_at IS NULL OR p_claimed_at < p_now - interval '15 minutes');
$$;
REVOKE ALL ON FUNCTION public.appointment_is_due_for_1h_reminder(text, date, text, timestamptz, timestamptz, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.appointment_is_due_for_1h_reminder(text, date, text, timestamptz, timestamptz, timestamptz, timestamptz) TO service_role;

CREATE FUNCTION public.claim_due_1h_reminders()
RETURNS TABLE (id uuid, name text, doctor text, appointment_time text, phone_e164 text)
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = public
AS $$
  UPDATE public.appointments AS a
  SET reminder_1h_claimed_at = now()
  WHERE a.id IN (
    SELECT candidate.id FROM public.appointments AS candidate
    WHERE public.appointment_is_due_for_1h_reminder(
      candidate.status, candidate.appointment_date, candidate.appointment_time,
      candidate.created_at, candidate.reminder_1h_claimed_at,
      candidate.reminder_1h_sent_at, now()
    )
    FOR UPDATE SKIP LOCKED
  )
  RETURNING a.id, a.name, a.doctor,
    to_char(a.appointment_time::time, 'FMHH12:MI AM'),
    coalesce(a.phone_e164, public.normalize_phone_e164(a.phone));
$$;
REVOKE ALL ON FUNCTION public.claim_due_1h_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_1h_reminders() TO service_role;