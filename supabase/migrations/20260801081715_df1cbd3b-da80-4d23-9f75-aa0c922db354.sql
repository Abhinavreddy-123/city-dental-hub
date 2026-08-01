REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.appointments_set_phone_e164() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.normalize_phone_e164(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.normalize_phone_e164(text) TO service_role;