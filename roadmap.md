# Appointment reminders
- [x] Add reminder timestamps and atomic database claiming.
- [x] Add authenticated due/result endpoints and reset timestamps on reschedule.
- [x] Test timing boundaries, concurrency, delivery results, and endpoint responses.

# Reminder safety audit
- [x] Audit live reminder filters, cancellation, and rescheduling.
- [x] Skip missing phones and test the reminder rules without touching live appointments.
- [x] Run both requested read-only simulations and list remaining test appointments.