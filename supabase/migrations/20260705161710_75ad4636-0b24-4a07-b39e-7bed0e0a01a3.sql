
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Anyone can book an appointment" ON public.appointments;
CREATE POLICY "Anyone can book an appointment" ON public.appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) > 0 AND length(phone) >= 7);

DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact" ON public.contact_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) > 0 AND length(phone) >= 7 AND length(message) > 0);

DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;
CREATE POLICY "Anyone can submit reviews" ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) > 0 AND length(message) > 0 AND rating BETWEEN 1 AND 5);
