import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { TIME_SLOTS, DOCTORS, SERVICES } from "@/lib/site";

export const WA_TIME_SLOTS = TIME_SLOTS;
export const WA_DOCTORS: string[] = DOCTORS.map((d) => d.name);
export const WA_SERVICES: string[] = SERVICES.map((s) => s.title);

export function admin() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export function jsonError(code: string, message: string, status: number, details?: unknown) {
  return Response.json({ ok: false, error: { code, message, details: details ?? null } }, { status });
}

export function jsonOk(data: Record<string, unknown>, status = 200) {
  return Response.json({ ok: true, ...data }, { status });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verifies the x-api-key (N8N_API_KEY) or x-n8n-secret (N8N_SHARED_SECRET) header. */
export function requireSharedSecret(request: Request): Response | null {
  const apiKey = process.env["N8N_API_KEY"];
  const shared = process.env["N8N_SHARED_SECRET"];
  if (!apiKey && !shared) {
    return jsonError("server_misconfigured", "No API credential is configured.", 500);
  }
  const providedKey = request.headers.get("x-api-key") ?? "";
  if (apiKey && providedKey && timingSafeEqual(providedKey, apiKey)) return null;
  const providedSecret = request.headers.get("x-n8n-secret") ?? "";
  if (shared && providedSecret && timingSafeEqual(providedSecret, shared)) return null;
  return jsonError("unauthorized", "Missing or invalid x-api-key header.", 401);
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "").replace(/^0+/, "");
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("910")) return `+91${digits.slice(-10)}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

/** true when the clinic is closed on that date (Sundays). date = YYYY-MM-DD */
export function isClosed(date: string): boolean {
  const d = new Date(`${date}T12:00:00+05:30`);
  return Number.isNaN(d.getTime()) || d.getUTCDay() === 0;
}

function timeToMinutes(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/** Finds active appointments whose scheduled time has not passed in India time. */
export async function findUpcomingAppointments(phoneE164: string, appointmentId?: string) {
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const today = nowIST.toISOString().slice(0, 10);
  const nowMinutes = nowIST.getUTCHours() * 60 + nowIST.getUTCMinutes();

  let query = admin()
    .from("appointments")
    .select(
      "id, name, phone, phone_e164, service, doctor, appointment_date, appointment_time, notes, status, google_event_id, created_at",
    )
    .eq("phone_e164", phoneE164)
    .gte("appointment_date", today)
    .neq("status", "cancelled")
    .neq("status", "completed");

  if (appointmentId) query = query.eq("id", appointmentId);

  const { data, error } = await query
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(50);

  if (error) return { appointments: [], error };

  const appointments = (data ?? []).filter((appointment) => {
    if (appointment.appointment_date > today) return true;
    if (appointment.appointment_date < today) return false;
    return timeToMinutes(appointment.appointment_time) > nowMinutes;
  });

  return { appointments, error: null };
}

/** In-memory best-effort limiter per worker instance. */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length <= limit;
}