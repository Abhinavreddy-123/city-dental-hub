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

/** Verifies the x-n8n-secret header. Returns null when authorized. */
export function requireSharedSecret(request: Request): Response | null {
  const expected = process.env["N8N_SHARED_SECRET"];
  if (!expected) return jsonError("server_misconfigured", "Shared secret is not configured.", 500);
  const provided = request.headers.get("x-n8n-secret") ?? "";
  if (!provided || !timingSafeEqual(provided, expected)) {
    return jsonError("unauthorized", "Missing or invalid x-n8n-secret header.", 401);
  }
  return null;
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