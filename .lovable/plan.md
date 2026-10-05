# Hide the admin login link

## Change
- Remove **Admin Login** from the public footer.
- Keep `/admin` protected so unauthenticated staff are sent to the existing login screen.
- Leave the direct `/auth` page available internally for the `/admin` redirect.

## Verification
- Confirm the public footer no longer exposes an admin link.
- Confirm visiting `/admin` while signed out opens the staff login flow.
