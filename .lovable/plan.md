# Add WhatsApp appointment cancellation endpoint

## Implementation
- Add `POST /api/public/wa/cancel-appointment` with the existing WhatsApp API-key/shared-secret authentication.
- Validate `{ phone, appointmentId? }`, treating missing, empty, or invalid appointment IDs as absent exactly like rescheduling.
- Reuse `findUpcomingAppointments` so cancellation matches normalized phone numbers and only active future appointments.
- Return the existing `not_found` and `ambiguous_appointment` error shapes when selection is unsuccessful.
- Cancel one matched appointment by updating its status to `cancelled`, without deleting the record.
- Return only the requested appointment fields, including Google Calendar ID, email, and patient name.

## Verification
- Confirm the generated route and automatic project checks pass.
