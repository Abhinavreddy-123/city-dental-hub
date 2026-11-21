import { createFileRoute } from "@tanstack/react-router";
import { admin, findLatestPatient, jsonError, jsonOk, normalizePhone, rateLimit, requireSharedSecret } from "@/lib/wa.server";
import { z } from "zod";

const lookupSchema = z.object({
  phone: z.string().trim().min(7).max(20),
  scope: z.enum(["upcoming", "all"]).default("upcoming"),
});

async function handleLookup({ request }: { request: Request }) {
  const unauthorized = requireSharedSecret(request);
  if (unauthorized) return unauthorized;
  if (!rateLimit("lookup", 240, 60_000)) {
    return jsonError("rate_limited", "Too many requests.", 429);
  }

  let body: unknown;
  if (request.method === "POST") {
    try {
      body = await request.json();
    } catch {
      return jsonError("invalid_input", "Body must be valid JSON.", 400);
    }
  } else {
    const url = new URL(request.url);
    body = { phone: url.searchParams.get("phone"), scope: url.searchParams.get("scope") ?? "upcoming" };
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
  const { phone: phoneRaw, scope } = parsed.data;

  const phone_e164 = normalizePhone(phoneRaw);
  if (!phone_e164) return jsonError("invalid_input", "Could not parse `phone`.", 400);

  const supabase = admin();
  let query = supabase
    .from("appointments")
    .select(
      "id, name, phone, phone_e164, service, doctor, appointment_date, appointment_time, notes, status, google_event_id, created_at",
    )
    .eq("phone_e164", phone_e164);

  if (scope === "upcoming") {
    const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    query = query.gte("appointment_date", today).neq("status", "cancelled");
  }

  const { data, error } = await query
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(50);
  if (error) return jsonError("db_error", error.message, 500);

  const { patient, error: patientError } = await findLatestPatient(phone_e164);
  if (patientError) return jsonError("db_error", patientError.message, 500);
  return jsonOk({ phone_e164, scope, count: data?.length ?? 0, appointments: (data ?? []).map((a) => ({ ...a, patient_name: a.name })), patient });
}

export const Route = createFileRoute("/api/public/wa/lookup")({
  server: {
    handlers: {
      GET: handleLookup,
      POST: handleLookup,
    },
  },
});