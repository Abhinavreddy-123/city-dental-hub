# Protect booking error details

## Change
- Log unexpected appointment-insert errors on the server.
- Return a fixed, patient-safe booking failure message instead of the database error text.
- Preserve the existing clean `slot_taken` handling for unique conflicts.

## Verification
- Run the focused TypeScript validation after the edit.
