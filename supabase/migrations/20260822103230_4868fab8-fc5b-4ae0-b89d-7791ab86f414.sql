CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

DROP POLICY "Admins can delete appointments" ON public.appointments;
DROP POLICY "Admins can update appointments" ON public.appointments;
DROP POLICY "Admins can view appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can view appointments" ON public.appointments FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY "Admins can delete contacts" ON public.contact_submissions;
DROP POLICY "Admins can update contacts" ON public.contact_submissions;
DROP POLICY "Admins can view contacts" ON public.contact_submissions;
CREATE POLICY "Admins can delete contacts" ON public.contact_submissions FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update contacts" ON public.contact_submissions FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can view contacts" ON public.contact_submissions FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY "Admins can delete reviews" ON public.reviews;
DROP POLICY "Admins can update reviews" ON public.reviews;
DROP POLICY "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can view all reviews" ON public.reviews FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY "Admins can view whatsapp sessions" ON public.whatsapp_sessions;
CREATE POLICY "Admins can view whatsapp sessions" ON public.whatsapp_sessions FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY "Admins can view notification log" ON public.notification_log;
CREATE POLICY "Admins can view notification log" ON public.notification_log FOR SELECT TO authenticated USING (public.is_admin());

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;