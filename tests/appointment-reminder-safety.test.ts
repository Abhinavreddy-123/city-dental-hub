import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

// All writes and claims here are confined to an in-memory database, never the clinic database.
const db = new PGlite();
const id = "00000000-0000-4000-8000-000000000001";

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE public.appointments (
      id uuid PRIMARY KEY, name text, phone text, phone_e164 text, doctor text,
      status text, appointment_date date, appointment_time text, created_at timestamptz
    );
    CREATE FUNCTION public.normalize_phone_e164(_phone text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE AS $$
    DECLARE digits text;
    BEGIN
      IF _phone IS NULL THEN RETURN NULL; END IF;
      digits := regexp_replace(_phone, '[^0-9]', '', 'g');
      IF digits = '' THEN RETURN NULL; END IF;
      digits := regexp_replace(digits, '^0+', '');
      IF length(digits) = 10 THEN RETURN '+91' || digits;
      ELSIF length(digits) = 12 AND left(digits, 2) = '91' THEN RETURN '+' || digits;
      ELSIF length(digits) = 13 AND left(digits, 3) = '910' THEN RETURN '+91' || right(digits, 10);
      ELSE RETURN '+' || digits; END IF;
    END; $$;
  `);
  for (const migration of [
    "0002_add_one_hour_appointment_reminders.sql",
    "0003_record_one_hour_reminder_result.sql",
    "0004_skip_reminders_without_phone.sql",
  ]) {
    await db.exec(await readFile(new URL(`../drizzle/migrations/${migration}`, import.meta.url), "utf8"));
  }
});

beforeEach(async () => {
  await db.exec("TRUNCATE public.appointments");
});
afterAll(async () => { await db.close(); });

async function fixture(status = "pending", phone: string | null = "+919000000001", normalized: string | null = phone) {
  await db.query(`
    INSERT INTO public.appointments
      (id, name, phone, phone_e164, doctor, status, appointment_date, appointment_time, created_at)
    SELECT $1, 'Isolated reminder test', $2, $3, 'Test doctor', $4,
      ((now() + interval '60 minutes') AT TIME ZONE 'Asia/Kolkata')::date,
      to_char((now() + interval '60 minutes') AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM'),
      now() - interval '2 hours'
  `, [id, phone, normalized, status]);
}

async function claim() {
  return (await db.query<{ id: string; phone_e164: string }>("SELECT * FROM public.claim_due_1h_reminders()")).rows;
}

async function due(minutes: number, age = 61, claimAge: number | null = null) {
  const result = await db.query<{ due: boolean }>(`
    WITH clock AS (SELECT timestamptz '2026-11-21 12:25:00+05:30' AS t),
    start AS (SELECT t, (t + $1 * interval '1 minute') AT TIME ZONE 'Asia/Kolkata' AS local FROM clock)
    SELECT public.appointment_is_due_for_1h_reminder(
      'pending', local::date, to_char(local, 'HH12:MI AM'),
      t - $2 * interval '1 minute', t - $3 * interval '1 minute', NULL, t
    ) AS due FROM start
  `, [minutes, age, claimAge]);
  const row = result.rows[0];
  if (!row) throw new Error("Missing predicate result");
  return row.due;
}

test("only pending and confirmed are claimable; cancelled, completed, no-show and new statuses are excluded", async () => {
  for (const status of ["pending", "confirmed", "cancelled", "completed", "no-show", "unknown"]) {
    await db.exec("TRUNCATE public.appointments");
    await fixture(status);
    expect((await claim()).length).toBe(["pending", "confirmed"].includes(status) ? 1 : 0);
    if (!["pending", "confirmed"].includes(status)) {
      expect((await db.query("SELECT reminder_1h_claimed_at FROM public.appointments")).rows)
        .toEqual([{ reminder_1h_claimed_at: null }]);
    }
  }
});

test("missing, empty and unusable phones are skipped without claiming", async () => {
  for (const phone of [null, "", "   ", "letters", "000", "123"]) {
    await db.exec("TRUNCATE public.appointments");
    await fixture("pending", phone);
    expect(await claim()).toEqual([]);
    expect((await db.query("SELECT reminder_1h_claimed_at FROM public.appointments")).rows)
      .toEqual([{ reminder_1h_claimed_at: null }]);
  }
});

test("a usable raw phone is normalized when phone_e164 is absent", async () => {
  await fixture("pending", "9000000001", null);
  expect(await claim()).toEqual([expect.objectContaining({ id, phone_e164: "+919000000001" })]);
});

test("50 to 70 minutes is inclusive, using Asia/Kolkata", async () => {
  for (const [minutes, expected] of [[49, false], [50, true], [60, true], [70, true], [71, false]] as const) {
    expect(await due(minutes)).toBe(expected);
  }
});

test("booking must be strictly more than 60 minutes old", async () => {
  expect(await due(60, 59)).toBe(false);
  expect(await due(60, 60)).toBe(false);
  expect(await due(60, 61)).toBe(true);
});

test("claims retry only after strictly more than 15 minutes", async () => {
  expect(await due(60, 61, 15)).toBe(false);
  expect(await due(60, 61, 16)).toBe(true);
  await fixture();
  expect((await claim()).length).toBe(1);
  expect(await claim()).toEqual([]);
});

test("sent reminders never return again", async () => {
  await fixture();
  await db.query("SELECT * FROM public.record_1h_reminder_result($1, true)", [id]);
  expect(await claim()).toEqual([]);
});

test("rescheduling uses the new time and reset timestamps enable a fresh reminder", async () => {
  await fixture();
  await db.query("SELECT * FROM public.record_1h_reminder_result($1, true)", [id]);
  await db.exec(`UPDATE public.appointments SET
    appointment_date = ((now() + interval '120 minutes') AT TIME ZONE 'Asia/Kolkata')::date,
    appointment_time = to_char((now() + interval '120 minutes') AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM'),
    reminder_1h_claimed_at = NULL, reminder_1h_sent_at = NULL`);
  expect(await claim()).toEqual([]);
  await db.exec(`UPDATE public.appointments SET
    appointment_date = ((now() + interval '60 minutes') AT TIME ZONE 'Asia/Kolkata')::date,
    appointment_time = to_char((now() + interval '60 minutes') AT TIME ZONE 'Asia/Kolkata', 'HH12:MI AM')`);
  expect((await claim()).length).toBe(1);
});

test("recording either delivery outcome for a cancelled appointment is harmless", async () => {
  await fixture("cancelled");
  for (const sent of [true, false]) {
    expect((await db.query("SELECT * FROM public.record_1h_reminder_result($1, $2)", [id, sent])).rows.length).toBe(1);
    expect((await db.query("SELECT status FROM public.appointments")).rows).toEqual([{ status: "cancelled" }]);
    expect(await claim()).toEqual([]);
  }
});