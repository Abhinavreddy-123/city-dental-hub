import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";

// Endpoint handlers and the real shared lookup run against this isolated fake store.
// No requests or writes are made to the clinic database.
type Appointment = {
  id: string; name: string; email: string | null; phone: string; phone_e164: string;
  service: string; doctor: string; appointment_date: string; appointment_time: string;
  status: string; created_at: string;
};
let rows: Appointment[] = [];
let inserts = 0;
let updated: string[] = [];
let failLookup = false;
const clockStart = Date.now();
let clockStep = 0;

class Query {
  private filters: ((row: Appointment) => boolean)[] = [];
  private sort: { column: keyof Appointment; ascending: boolean }[] = [];
  private cap = Infinity;
  private payload: Record<string, unknown> | null = null;
  select(_columns: string) { return this; }
  eq(column: keyof Appointment, value: string) { this.filters.push((row) => row[column] === value); return this; }
  neq(column: keyof Appointment, value: string) { this.filters.push((row) => row[column] !== value); return this; }
  gte(column: keyof Appointment, value: string) { this.filters.push((row) => String(row[column]) >= value); return this; }
  order(column: keyof Appointment, options: { ascending: boolean }) { this.sort.push({ column, ...options }); return this; }
  limit(cap: number) { this.cap = cap; return this; }
  insert(payload: Record<string, unknown>) { this.payload = payload; return this; }
  private changes: Record<string, unknown> | null = null;
  update(changes: Record<string, unknown>) { this.changes = changes; return this; }
  private result() {
    const data = rows.filter((row) => this.filters.every((filter) => filter(row))).sort((a, b) => {
      for (const { column, ascending } of this.sort) {
        const diff = String(a[column]).localeCompare(String(b[column]));
        if (diff) return ascending ? diff : -diff;
      }
      return 0;
    }).slice(0, this.cap);
    return { data, error: failLookup ? { message: "Isolated lookup failure" } : null };
  }
  then(resolve: (value: ReturnType<Query["result"]>) => unknown) { return Promise.resolve(this.result()).then(resolve); }
  async maybeSingle() { const result = this.result(); return { data: result.data[0] ?? null, error: result.error }; }
  async single() {
    if (this.changes) {
      const matched = rows.filter((row) => this.filters.every((filter) => filter(row)));
      for (const row of matched) Object.assign(row, this.changes);
      updated.push(...matched.map((row) => row.id));
      return { data: matched[0] ?? null, error: matched.length === 1 ? null : { message: "no row" } };
    }
    if (!this.payload) throw new Error("Expected booking insert");
    inserts++;
    const appointment = { ...fixture(), ...this.payload, id: "new-booking" };
    rows.push(appointment as Appointment);
    return { data: appointment, error: null };
  }
}

mock.module("@supabase/supabase-js", () => ({ createClient: () => ({ from: () => new Query() }) }));
const { Route: bookRoute } = await import("../src/routes/api/public/wa/book-appointment");
const { Route: lookupRoute } = await import("../src/routes/api/public/wa/lookup-appointment");
const { Route: legacyLookupRoute } = await import("../src/routes/api/public/wa/lookup");
const { Route: cancelRoute } = await import("../src/routes/api/public/wa/cancel-appointment");
const { Route: rescheduleRoute } = await import("../src/routes/api/public/wa/reschedule");
const { DOCTORS, SERVICES, TIME_SLOTS } = await import("../src/lib/site");
const doctor = DOCTORS[0]?.name;
const service = SERVICES[0]?.title;
const time = TIME_SLOTS[0];
if (!doctor || !service || !time) throw new Error("Missing clinic configuration");

function fixture(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "existing", name: "Returning Patient", email: "patient@example.test", phone: "9000000001",
    phone_e164: "+919000000001", service: service ?? "Consultation", doctor: doctor ?? "Doctor",
    appointment_date: "2099-11-21", appointment_time: "01:30 PM", status: "pending",
    created_at: "2026-11-20T00:00:00Z", ...overrides,
  };
}

type Endpoint = { options: { server?: { handlers?: unknown } } };
async function call(route: Endpoint, body: unknown, key = "isolated-test-key") {
  const handlers = route.options.server?.handlers as { POST?: (args: { request: Request }) => Promise<Response> } | undefined;
  if (!handlers?.POST) throw new Error("Missing POST handler");
  const response = await handlers.POST({ request: new Request("http://localhost/api/public/wa/test", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key }, body: JSON.stringify(body),
  }) });
  return { status: response.status, body: await response.json() };
}
const booking = { name: "New Patient", phone_number: "9000000001", service, doctor, date: "2099-11-23", time_slot: time, email: "" };

beforeEach(() => {
  rows = []; inserts = 0; updated = []; failLookup = false;
  process.env["N8N_API_KEY"] = "isolated-test-key";
  process.env["SUPABASE_URL"] = "https://isolated.example.test";
  process.env["SUPABASE_SERVICE_ROLE_KEY"] = "isolated-not-a-real-key";
  // Each case needs an independent rate-limit window, without mocking lookup time.
  mock.restore();
  spyOn(Date, "now").mockReturnValue(clockStart + ++clockStep * 60 * 60_000);
});
afterAll(() => mock.restore());

test("no existing appointment inserts with unchanged 201 success response", async () => {
  const result = await call(bookRoute, booking);
  expect(result.status).toBe(201);
  expect(result.body.ok).toBe(true);
  expect(result.body.appointment.id).toBe("new-booking");
  expect(result.body.appointment.email).toBeNull();
  expect(inserts).toBe(1);
});

test("existing pending or confirmed future appointment returns exact 409 and never inserts", async () => {
  for (const status of ["pending", "confirmed"]) {
    rows = [fixture({ status })];
    const result = await call(bookRoute, booking);
    expect(result.status).toBe(409);
    expect(result.body).toEqual({ ok: false, error: "already_has_upcoming", appointment: {
      name: "Returning Patient", doctor, date: "2099-11-21", time: "01:30 PM",
    } });
    expect(inserts).toBe(0);
  }
});

test("cancelled appointment does not block insertion", async () => {
  rows = [fixture({ status: "cancelled" })];
  const result = await call(bookRoute, booking);
  expect(result.status).toBe(201);
  expect(inserts).toBe(1);
});

test("allow_additional true inserts despite an existing active appointment", async () => {
  rows = [fixture()];
  const result = await call(bookRoute, { ...booking, allow_additional: true });
  expect(result.status).toBe(201);
  expect(inserts).toBe(1);
});

test("completed and past appointments do not block insertion", async () => {
  rows = [fixture({ status: "completed" }), fixture({ appointment_date: "2000-01-01" })];
  const result = await call(bookRoute, booking);
  expect(result.status).toBe(201);
  expect(inserts).toBe(1);
});

test("string allow_additional is rejected by Zod", async () => {
  const result = await call(bookRoute, { ...booking, allow_additional: "true" });
  expect(result.status).toBe(400);
  expect(inserts).toBe(0);
});

test("allow_additional false still blocks an existing active appointment", async () => {
  rows = [fixture()];
  const result = await call(bookRoute, { ...booking, allow_additional: false });
  expect(result.status).toBe(409);
  expect(result.body.error).toBe("already_has_upcoming");
  expect(inserts).toBe(0);
});

test("allow_additional does not bypass the existing slot-taken response", async () => {
  rows = [fixture({ appointment_date: booking.date, appointment_time: time ?? "11:00 AM" })];
  const result = await call(bookRoute, { ...booking, allow_additional: true });
  expect(result.status).toBe(200);
  expect(result.body).toEqual({ ok: false, reason: "slot_taken" });
  expect(inserts).toBe(0);
});

test("lookup failures fail closed without inserting", async () => {
  failLookup = true;
  const result = await call(bookRoute, booking);
  expect(result.status).toBe(500);
  expect(result.body.error.code).toBe("db_error");
  expect(inserts).toBe(0);
});

test("API key still protects booking and lookup", async () => {
  expect((await call(bookRoute, booking, "wrong")).status).toBe(401);
  expect((await call(lookupRoute, { phone: "9000000001" }, "wrong")).status).toBe(401);
  expect(inserts).toBe(0);
});

test("lookup adds latest patient from any status without changing appointment keys", async () => {
  rows = [fixture(), fixture({ id: "latest", status: "cancelled", name: "Latest Patient", email: null, created_at: "2026-11-21T00:00:00Z" })];
  const result = await call(lookupRoute, { phone: "9000000001" });
  expect(result.status).toBe(200);
  expect(result.body).toEqual({ ok: true, patient: { name: "Returning Patient", email: "patient@example.test" }, appointments: [{
    id: "existing", doctor, service, appointment_date: "2099-11-21", appointment_time: "01:30 PM", patient_name: "Returning Patient",
  }] });
  expect(inserts).toBe(0);
});

test("lookup returns null patient and empty appointments for a new phone", async () => {
  expect((await call(lookupRoute, { phone: "9000000001" })).body).toEqual({ ok: true, patient: null, appointments: [] });
});

test("legacy bot lookup preserves its existing fields and adds patient", async () => {
  rows = [fixture({ status: "cancelled" })];
  expect((await call(legacyLookupRoute, { phone: "9000000001" })).body).toEqual({
    ok: true, phone_e164: "+919000000001", scope: "upcoming", count: 0, appointments: [],
    patient: { name: "Returning Patient", email: "patient@example.test" },
  });
});
const patientOf = async () => (await call(lookupRoute, { phone: "9000000001" })).body.patient;

test("patient: only one name", async () => {
  rows = [fixture({ id: "a", created_at: "2026-01-01" }), fixture({ id: "b", created_at: "2026-02-01", email: "new@example.test" })];
  expect(await patientOf()).toEqual({ name: "Returning Patient", email: "new@example.test" });
});

test("patient: first-booked name with more appointments wins over latest family name", async () => {
  rows = [
    fixture({ id: "a", name: "Ravi", email: "ravi@example.test", created_at: "2026-01-01" }),
    fixture({ id: "b", name: "Ravi", email: "ravi2@example.test", created_at: "2026-02-01" }),
    fixture({ id: "c", name: "Sita", email: "sita@example.test", created_at: "2026-03-01" }),
  ];
  expect(await patientOf()).toEqual({ name: "Ravi", email: "ravi2@example.test" });
});

test("patient: tie goes to earliest-created name", async () => {
  rows = [
    fixture({ id: "c", name: "Sita", created_at: "2026-03-01" }),
    fixture({ id: "a", name: "Ravi", created_at: "2026-01-01" }),
  ];
  expect((await patientOf()).name).toBe("Ravi");
});

test("patient: latest appointment under that name has no email gives null", async () => {
  rows = [
    fixture({ id: "a", name: "Ravi", email: "old@example.test", created_at: "2026-01-01" }),
    fixture({ id: "b", name: "Ravi", email: null, created_at: "2026-02-01" }),
  ];
  expect(await patientOf()).toEqual({ name: "Ravi", email: null });
});

test("patient: no history gives null", async () => {
  expect(await patientOf()).toBeNull();
});

const idA = "00000000-0000-4000-8000-00000000000a";
const idB = "00000000-0000-4000-8000-00000000000b";
const twoUpcoming = () => [
  fixture({ id: idA, name: "Ravi", appointment_date: "2099-11-21" }),
  fixture({ id: idB, name: "Sita", appointment_date: "2099-11-24", appointment_time: "05:30 PM" }),
];

test("cancel by appointmentId with two appointments cancels only that one", async () => {
  rows = twoUpcoming();
  const result = await call(cancelRoute, { phone: "9000000001", appointmentId: idB });
  expect(result.status).toBe(200);
  expect(result.body.appointment.id).toBe(idB);
  expect(updated).toEqual([idB]);
  expect(rows.find((r) => r.id === idA)?.status).toBe("pending");
});

test("cancel accepts appointment_id field name", async () => {
  rows = twoUpcoming();
  const result = await call(cancelRoute, { phone: "9000000001", appointment_id: idA });
  expect(result.body.appointment.id).toBe(idA);
  expect(updated).toEqual([idA]);
});

test("reschedule by appointmentId with two appointments moves only that one", async () => {
  rows = twoUpcoming();
  const result = await call(rescheduleRoute, { phone: "9000000001", appointmentId: idB, newDate: "2099-11-25", newTime: time });
  expect(result.status).toBe(200);
  expect(result.body.appointment.id).toBe(idB);
  expect(updated).toEqual([idB]);
});

test("id belonging to another phone returns not_found and changes nothing", async () => {
  for (const route of [cancelRoute, rescheduleRoute]) {
    rows = [fixture({ id: idA }), fixture({ id: idB, phone_e164: "+919000000002" })];
    const result = await call(route, { phone: "9000000001", appointmentId: idB, newDate: "2099-11-25", newTime: time });
    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe("not_found");
    expect(updated).toEqual([]);
  }
});

test("cancelled or junk id returns not_found and never falls back", async () => {
  rows = [fixture({ id: idA }), fixture({ id: idB, status: "cancelled" })];
  expect((await call(cancelRoute, { phone: "9000000001", appointmentId: idB })).status).toBe(404);
  expect((await call(cancelRoute, { phone: "9000000001", appointmentId: "not-a-uuid" })).status).toBe(404);
  expect((await call(cancelRoute, { phone: "9000000001", appointmentId: "12345" })).status).toBe(404);
  expect(updated).toEqual([]);
});

const PLACEHOLDERS = ["0", "null", "none", "undefined", "n/a", "na", "-", " N/A ", "NULL"];

test("placeholder ids are treated as not provided: one appointment is acted on", async () => {
  for (const placeholder of PLACEHOLDERS) {
    for (const route of [cancelRoute, rescheduleRoute]) {
      rows = [fixture({ id: idA })];
      updated = [];
      // Fresh rate-limit window per call, same trick as beforeEach.
      spyOn(Date, "now").mockReturnValue(clockStart + ++clockStep * 60 * 60_000);
      const result = await call(route, { phone: "9000000001", appointmentId: placeholder, newDate: "2099-11-25", newTime: time });
      expect(result.status).toBe(200);
      expect(result.body.appointment.id).toBe(idA);
      expect(updated).toEqual([idA]);
    }
  }
});

test("placeholder ids are treated as not provided: two appointments give ambiguous", async () => {
  for (const placeholder of PLACEHOLDERS) {
    for (const route of [cancelRoute, rescheduleRoute]) {
      rows = twoUpcoming();
      updated = [];
      spyOn(Date, "now").mockReturnValue(clockStart + ++clockStep * 60 * 60_000);
      const result = await call(route, { phone: "9000000001", appointment_id: placeholder, newDate: "2099-11-25", newTime: time });
      expect(result.status).toBe(409);
      expect(result.body.error.code).toBe("ambiguous_appointment");
      expect(updated).toEqual([]);
    }
  }
});

test("empty-string id is treated as not provided", async () => {
  rows = [fixture({ id: idA })];
  const result = await call(cancelRoute, { phone: "9000000001", appointmentId: "", appointment_id: "" });
  expect(result.status).toBe(200);
  expect(updated).toEqual([idA]);
});

test("no id with two appointments returns ambiguous list", async () => {
  for (const route of [cancelRoute, rescheduleRoute]) {
    rows = twoUpcoming();
    const result = await call(route, { phone: "9000000001", newDate: "2099-11-25", newTime: time });
    expect(result.status).toBe(409);
    expect(result.body.error.code).toBe("ambiguous_appointment");
    expect(result.body.error.details.appointments.map((a: { id: string; patient_name: string }) => [a.id, a.patient_name]))
      .toEqual([[idA, "Ravi"], [idB, "Sita"]]);
    expect(updated).toEqual([]);
  }
});
