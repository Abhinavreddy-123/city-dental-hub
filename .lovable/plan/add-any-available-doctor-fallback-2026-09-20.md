# Add Any Available doctor fallback

## Change
- Confirm the current website booking behavior for “Any Available.”
- For that choice, attempt Dr. Srujana Kota first.
- If her slot is occupied, retry the same date and time with Dr. P. Manoranjan Reddy.
- Show `slot_taken` only when neither doctor is available.
- Keep named-doctor bookings unchanged.

## Verification
- Run focused validation and test both conflict and fallback paths.
