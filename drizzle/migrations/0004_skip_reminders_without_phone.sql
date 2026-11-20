CREATE OR REPLACE FUNCTION public.claim_due_1h_reminders()
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
      AND nullif(btrim(coalesce(candidate.phone_e164,
        public.normalize_phone_e164(candidate.phone))), '') ~ '^\+[1-9][0-9]{7,14}$'
    FOR UPDATE SKIP LOCKED
  )
  RETURNING a.id, a.name, a.doctor,
    to_char(a.appointment_time::time, 'FMHH12:MI AM'),
    coalesce(a.phone_e164, public.normalize_phone_e164(a.phone));
$$;
REVOKE ALL ON FUNCTION public.claim_due_1h_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_1h_reminders() TO service_role;