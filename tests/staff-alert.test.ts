import { expect, test } from "bun:test";
import { sendStaffAlert, type StaffAlertPayload } from "../src/lib/staff-alert.server";

const payload: StaffAlertPayload = {
  event: "new_booking", source: "website", appointment_id: "a1", name: "Ravi", phone: "9876543210",
  email: null, doctor: "Dr. Srujana Kota", service: "Teeth Cleaning",
  appointment_date: "2099-01-05", appointment_time: "01:30 PM", notes: null,
};
const base = { url: "https://mock.invalid/hook", secret: "s", sleep: async () => {} };

test("sends secret header and payload once on success", async () => {
  const calls: RequestInit[] = [];
  const ok = await sendStaffAlert(payload, { ...base, fetchFn: (async (_u: unknown, init: RequestInit) => { calls.push(init); return new Response("", { status: 200 }); }) as typeof fetch });
  expect(ok).toBe(true);
  expect(calls.length).toBe(1);
  expect((calls[0]!.headers as Record<string, string>)["x-webhook-secret"]).toBe("s");
  expect(JSON.parse(calls[0]!.body as string)).toEqual(payload);
});

test("retries exactly once after 2 seconds, then gives up without throwing", async () => {
  let n = 0; const waits: number[] = [];
  const ok = await sendStaffAlert(payload, { ...base, sleep: async (ms) => { waits.push(ms); }, fetchFn: (async () => { n++; throw new Error("down"); }) as unknown as typeof fetch });
  expect(ok).toBe(false);
  expect(n).toBe(2);
  expect(waits).toEqual([2000]);
});
