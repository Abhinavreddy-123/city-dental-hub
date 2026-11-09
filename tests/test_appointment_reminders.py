"""Integration tests: python3 -m unittest discover -s tests -p 'test_appointment_reminders.py'.

Requires the configured API key and database service credentials in environment.
Uses isolated reminder-only fixtures, never sends WhatsApp messages, and cleans up.
"""
import concurrent.futures
import datetime as dt
import os
import unittest
import uuid
from zoneinfo import ZoneInfo

import requests


class ReminderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db_url = os.environ["SUPABASE_URL"] + "/rest/v1"
        cls.db_headers = {"apikey": os.environ["SUPABASE_SERVICE_ROLE_KEY"], "Prefer": "return=representation"}
        cls.api_headers = {"x-api-key": os.environ["N8N_API_KEY"]}
        cls.origin = "http://localhost:8080"

    def rpc(self, name, body):
        response = requests.post(self.db_url + "/rpc/" + name, headers=self.db_headers, json=body, timeout=30)
        self.assertEqual(response.status_code, 200, "Database RPC failed")
        return response.json()

    def due(self, **overrides):
        now = dt.datetime(2026, 11, 9, 18, tzinfo=dt.timezone.utc)
        start = now + dt.timedelta(minutes=overrides.pop("minutes", 60))
        local = start.astimezone(ZoneInfo("Asia/Kolkata"))
        args = {
            "p_status": "pending", "p_date": local.date().isoformat(),
            "p_time": local.strftime("%I:%M %p").lstrip("0"),
            "p_created_at": (now - dt.timedelta(minutes=61)).isoformat(),
            "p_claimed_at": None, "p_sent_at": None, "p_now": now.isoformat(),
        }
        if "age" in overrides:
            args["p_created_at"] = (now - dt.timedelta(minutes=overrides.pop("age"))).isoformat()
        if "claim_age" in overrides:
            args["p_claimed_at"] = (now - dt.timedelta(minutes=overrides.pop("claim_age"))).isoformat()
        args.update(overrides)
        return self.rpc("appointment_is_due_for_1h_reminder", args)

    def test_due_window_and_kolkata_date_boundary(self):
        for minutes, expected in [(49, False), (50, True), (60, True), (70, True), (71, False)]:
            with self.subTest(minutes=minutes):
                self.assertEqual(self.due(minutes=minutes), expected)

    def test_only_pending_or_confirmed(self):
        for status, expected in [("pending", True), ("confirmed", True), ("cancelled", False), ("completed", False)]:
            with self.subTest(status=status):
                self.assertEqual(self.due(p_status=status), expected)

    def test_booking_must_be_more_than_60_minutes_old(self):
        self.assertFalse(self.due(age=59))
        self.assertFalse(self.due(age=60))
        self.assertTrue(self.due(age=61))

    def test_sent_reminders_are_excluded(self):
        self.assertFalse(self.due(p_sent_at="2026-11-09T17:59:00Z"))

    def test_claim_must_be_older_than_15_minutes(self):
        self.assertFalse(self.due(claim_age=1))
        self.assertFalse(self.due(claim_age=15))
        self.assertTrue(self.due(claim_age=16))

    def post(self, path, body=None, authenticated=True):
        return requests.post(self.origin + "/api/public/wa/" + path,
                             headers=self.api_headers if authenticated else {}, json=body, timeout=30)

    def test_endpoint_auth_and_validation(self):
        for path in ["reminders-due", "reminder-result"]:
            self.assertEqual(self.post(path, authenticated=False).status_code, 401)
        self.assertEqual(self.post("reminder-result", {"id": "junk", "sent": True}).status_code, 400)
        self.assertEqual(self.post("reminder-result", {"id": str(uuid.uuid4()), "sent": "true"}).status_code, 400)
        self.assertEqual(self.post("reminder-result", {"id": str(uuid.uuid4()), "sent": True}).status_code, 404)

    def test_claim_retry_sent_and_reschedule_flow(self):
        identifier = str(uuid.uuid4())
        now = dt.datetime.now(dt.timezone.utc)
        local = (now + dt.timedelta(minutes=60)).astimezone(ZoneInfo("Asia/Kolkata"))
        fixture = {
            "id": identifier, "name": "Reminder integration test", "phone": "+919000000001",
            "service": "Not Sure / General Consultation", "doctor": "Reminder test " + identifier,
            "appointment_date": local.date().isoformat(),
            "appointment_time": local.strftime("%I:%M %p").lstrip("0"),
            "status": "pending", "created_at": (now - dt.timedelta(hours=2)).isoformat(),
            "change_source": "staff",
        }
        response = requests.post(self.db_url + "/appointments", headers=self.db_headers, json=fixture, timeout=30)
        self.assertEqual(response.status_code, 201, "Test fixture creation failed")
        try:
            # Parallel HTTP calls exercise real row-lock contention; only one may claim this fixture.
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                responses = list(pool.map(lambda _: self.post("reminders-due"), range(2)))
            for response in responses:
                self.assertEqual(response.status_code, 200)
            claimed = [a for r in responses for a in r.json()["appointments"] if a["id"] == identifier]
            self.assertEqual(len(claimed), 1)
            self.assertEqual(claimed[0], {k: fixture[k] for k in ["id", "name", "doctor", "appointment_time"]} | {"phone_e164": "+919000000001"})

            result = self.post("reminder-result", {"id": identifier, "sent": False})
            self.assertEqual(result.status_code, 200)
            self.assertIsNone(result.json()["appointment"]["reminder_1h_claimed_at"])
            retry = self.post("reminders-due").json()["appointments"]
            self.assertIn(identifier, [a["id"] for a in retry])
            result = self.post("reminder-result", {"id": identifier, "sent": True})
            self.assertEqual(result.status_code, 200)
            self.assertIsNotNone(result.json()["appointment"]["reminder_1h_sent_at"])
            self.assertNotIn(identifier, [a["id"] for a in self.post("reminders-due").json()["appointments"]])

            future_date = local.date() + dt.timedelta(days=1)
            while future_date.weekday() == 6:
                future_date += dt.timedelta(days=1)
            result = self.post("reschedule", {"phone": fixture["phone"], "appointmentId": identifier,
                                              "newDate": future_date.isoformat(), "newTime": "05:30 PM"})
            self.assertEqual(result.status_code, 200)
            row = requests.get(self.db_url + "/appointments", headers=self.db_headers,
                               params={"id": "eq." + identifier, "select": "reminder_1h_claimed_at,reminder_1h_sent_at"}, timeout=30).json()[0]
            self.assertEqual(row, {"reminder_1h_claimed_at": None, "reminder_1h_sent_at": None})
        finally:
            for table, column in [("appointment_digest_events", "appointment_id"), ("appointments", "id")]:
                cleaned = requests.delete(self.db_url + "/" + table, headers=self.db_headers,
                                          params={column: "eq." + identifier}, timeout=30)
                self.assertIn(cleaned.status_code, [200, 204], "Fixture cleanup failed")


if __name__ == "__main__":
    unittest.main()