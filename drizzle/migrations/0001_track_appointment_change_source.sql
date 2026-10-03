ALTER TABLE public.appointments
ADD COLUMN change_source text NOT NULL DEFAULT 'staff'
CHECK (change_source IN ('patient', 'staff'));

ALTER TABLE public.appointment_digest_events
ADD COLUMN source text NOT NULL DEFAULT 'staff'
CHECK (source IN ('patient', 'staff'));

CREATE OR REPLACE FUNCTION public.record_appointment_digest_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_digest_events (appointment_id, type, name, doctor, appointment_date, appointment_time, changed_at, source)
    VALUES (NEW.id, 'new_booking', NEW.name, NEW.doctor, NEW.appointment_date, NEW.appointment_time, NEW.created_at, NEW.change_source);
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
    INSERT INTO public.appointment_digest_events (appointment_id, type, name, doctor, appointment_date, appointment_time, source)
    VALUES (NEW.id, 'cancelled', NEW.name, NEW.doctor, NEW.appointment_date, NEW.appointment_time, NEW.change_source);
  ELSIF OLD.appointment_date IS DISTINCT FROM NEW.appointment_date OR OLD.appointment_time IS DISTINCT FROM NEW.appointment_time OR OLD.doctor IS DISTINCT FROM NEW.doctor THEN
    INSERT INTO public.appointment_digest_events (appointment_id, type, name, doctor, appointment_date, appointment_time, source)
    VALUES (NEW.id, 'rescheduled', NEW.name, NEW.doctor, NEW.appointment_date, NEW.appointment_time, NEW.change_source);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.record_appointment_digest_event() FROM PUBLIC, anon, authenticated;

CREATE INDEX appointment_digest_events_patient_changed_at_idx
ON public.appointment_digest_events (changed_at DESC)
WHERE source = 'patient';