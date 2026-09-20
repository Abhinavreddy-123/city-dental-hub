# Add WhatsApp appointment lookup endpoint

## Implementation
- Add `POST /api/public/wa/lookup-appointment` using the same API-key/shared-secret authentication pattern as the existing WhatsApp endpoints.
- Validate a JSON body containing `phone`, normalize it to `phone_e164`, and apply request rate limiting.
- Reuse the rescheduling lookup rules: active appointments only, exclude cancelled and completed records, and exclude appointments whose date and time have already passed in India time.
- Return `{ ok: true, appointments: [...] }` with only `id`, `doctor`, `service`, `appointment_date`, and `appointment_time`; return an empty array when none match.

## Technical details
- Extract the shared future-appointment lookup into the server-only WhatsApp helper so rescheduling and this endpoint cannot drift.
- Keep database access read-only in the new endpoint.
- Verify the new route is generated and passes the project’s automatic checks.
