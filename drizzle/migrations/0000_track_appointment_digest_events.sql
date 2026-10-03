CREATE TABLE public.appointment_digest_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_booking', 'rescheduled', 'cancelled')),
  name text NOT NULL,
  doctor text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.appointment_digest_events TO service_role;
ALTER TABLE public.appointment_digest_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX appointment_digest_events_changed_at_idx ON public.appointment_digest_events (changed_at DESC);
CREATE OR REPLACE FUNCTION public.record_appointment_digest_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_digest_events (appointment_id, type, name, doctor, appointment_date, appointment_time, changed_at)
    VALUES (NEW.id, 'new_booking', NEW.name, NEW.doctor, NEW.appointment_date, NEW.appointment_time, NEW.created_at);
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
    INSERT INTO public.appointment_digest_events (appointment_id, type, name, doctor, appointment_date, appointment_time)
    VALUES (NEW.id, 'cancelled', NEW.name, NEW.doctor, NEW.appointment_date, NEW.appointment_time);
  ELSIF OLD.appointment_date IS DISTINCT FROM NEW.appointment_date OR OLD.appointment_time IS DISTINCT FROM NEW.appointment_time OR OLD.doctor IS DISTINCT FROM NEW.doctor THEN
    INSERT INTO public.appointment_digest_events (appointment_id, type, name, doctor, appointment_date, appointment_time)
    VALUES (NEW.id, 'rescheduled', NEW.name, NEW.doctor, NEW.appointment_date, NEW.appointment_time);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.record_appointment_digest_event() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER record_appointment_digest_event_trigger
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.record_appointment_digest_event();
INSERT INTO public.appointment_digest_events (appointment_id, type, name, doctor, appointment_date, appointment_time, changed_at)
SELECT id, 'new_booking', name, doctor, appointment_date, appointment_time, created_at
FROM public.appointments
WHERE created_at >= now() - interval '24 hours';