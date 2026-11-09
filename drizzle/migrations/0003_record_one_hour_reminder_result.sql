CREATE FUNCTION public.record_1h_reminder_result(p_id uuid, p_sent boolean)
RETURNS TABLE (id uuid, reminder_1h_claimed_at timestamptz, reminder_1h_sent_at timestamptz)
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = public
AS $$
  UPDATE public.appointments AS a
  SET reminder_1h_sent_at = CASE WHEN p_sent THEN now() ELSE a.reminder_1h_sent_at END,
      reminder_1h_claimed_at = CASE WHEN p_sent THEN a.reminder_1h_claimed_at ELSE NULL END
  WHERE a.id = p_id
  RETURNING a.id, a.reminder_1h_claimed_at, a.reminder_1h_sent_at;
$$;
REVOKE ALL ON FUNCTION public.record_1h_reminder_result(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_1h_reminder_result(uuid, boolean) TO service_role;