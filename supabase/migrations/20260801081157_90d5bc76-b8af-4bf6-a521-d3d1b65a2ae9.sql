-- 1. Phone normalization to E.164 (India default)
CREATE OR REPLACE FUNCTION public.normalize_phone_e164(_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  digits text;
BEGIN
  IF _phone IS NULL THEN RETURN NULL; END IF;
  digits := regexp_replace(_phone, '[^0-9]', '', 'g');
  IF digits = '' THEN RETURN NULL; END IF;
  -- strip leading zeros / trunk prefixes
  digits := regexp_replace(digits, '^0+', '');
  IF length(digits) = 10 THEN
    RETURN '+91' || digits;
  ELSIF length(digits) = 12 AND left(digits, 2) = '91' THEN
    RETURN '+' || digits;
  ELSIF length(digits) = 13 AND left(digits, 3) = '910' THEN
    RETURN '+91' || right(digits, 10);
  ELSE
    RETURN '+' || digits;
  END IF;
END;
$$;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS google_event_id text;

CREATE OR REPLACE FUNCTION public.appointments_set_phone_e164()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.phone_e164 := public.normalize_phone_e164(NEW.phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_phone_e164 ON public.appointments;
CREATE TRIGGER trg_appointments_phone_e164
BEFORE INSERT OR UPDATE OF phone ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_set_phone_e164();

UPDATE public.appointments
SET phone_e164 = public.normalize_phone_e164(phone)
WHERE phone_e164 IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_phone_e164 ON public.appointments (phone_e164);
CREATE INDEX IF NOT EXISTS idx_appointments_date_doctor ON public.appointments (appointment_date, doctor);

-- 2. Slot conflict enforcement: one active booking per doctor/date/time
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_active_slot
  ON public.appointments (appointment_date, appointment_time, doctor)
  WHERE status <> 'cancelled';

-- 3. Notification log (idempotent reminders)
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  kind text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  sent_at timestamptz NOT NULL DEFAULT now(),
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, kind)
);

GRANT SELECT ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification log"
ON public.notification_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));