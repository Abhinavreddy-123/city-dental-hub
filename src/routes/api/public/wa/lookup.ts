import { createFileRoute } from "@tanstack/react-router";
import { admin, jsonError, jsonOk, normalizePhone, rateLimit, requireSharedSecret } from "@/lib/wa.server";

async function handleLookup({ request }: { request: Request }) {
  const unauthorized = requireSharedSecret(request);
  if (unauthorized) return unauthorized;
  if (!rateLimit("lookup", 240, 60_000)) {
    return jsonError("rate_limited", "Too many requests.", 429);
  }

  let phoneRaw: string | null = null;
  let scope = "upcoming";
  if (request.method === "POST") {
    try {
      const body = (await request.json()) as { phone?: string; scope?: string };
      phoneRaw = body.phone ?? null;
      scope = body.scope ?? scope;
    } catch {
      return jsonError("invalid_input", "Body must be valid JSON.", 400);
    }
  } else {
    const url = new URL(request.url);
    phoneRaw = url.searchParams.get("phone");
    scope = url.searchParams.get("scope") ?? scope;
  }

  if (!phoneRaw) return jsonError("invalid_input", "`phone` is required.", 400);
  if (scope !== "upcoming" && scope !== "all") {
    return jsonError("invalid_input", "`scope` must be `upcoming` or `all`.", 400);
  }

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

  return jsonOk({ phone_e164, scope, count: data?.length ?? 0, appointments: data ?? [] });
}

export const Route = createFileRoute("/api/public/wa/lookup")({
  server: {
    handlers: {
      GET: handleLookup,
      POST: handleLookup,
    },
  },
});