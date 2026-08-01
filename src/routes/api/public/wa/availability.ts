import { createFileRoute } from "@tanstack/react-router";
import {
  admin,
  isClosed,
  jsonError,
  jsonOk,
  rateLimit,
  requireSharedSecret,
  WA_DOCTORS,
  WA_TIME_SLOTS,
} from "@/lib/wa.server";

async function handleAvailability({ request }: { request: Request }) {
  const unauthorized = requireSharedSecret(request);
  if (unauthorized) return unauthorized;
  if (!rateLimit("availability", 240, 60_000)) {
    return jsonError("rate_limited", "Too many requests. Try again shortly.", 429);
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const doctor = url.searchParams.get("doctor");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonError("invalid_input", "Query param `date` must be YYYY-MM-DD.", 400);
  }
  if (doctor && !WA_DOCTORS.includes(doctor)) {
    return jsonError("invalid_input", "Unknown `doctor`.", 400, { doctors: WA_DOCTORS });
  }
  if (isClosed(date)) {
    return jsonOk({ date, doctor: doctor ?? null, closed: true, slots: [], doctors: WA_DOCTORS });
  }

  const doctors = doctor ? [doctor] : [...WA_DOCTORS];
  const supabase = admin();
  const { data, error } = await supabase
    .from("appointments")
    .select("doctor, appointment_time, status")
    .eq("appointment_date", date)
    .neq("status", "cancelled");
  if (error) return jsonError("db_error", error.message, 500);

  const taken = new Set((data ?? []).map((r) => `${r.doctor}|${r.appointment_time}`));
  const slots = doctors.flatMap((doc) =>
    WA_TIME_SLOTS.map((time) => ({
      doctor: doc,
      time,
      available: !taken.has(`${doc}|${time}`),
    })),
  );

  return jsonOk({ date, doctor: doctor ?? null, closed: false, slots, doctors: WA_DOCTORS });
}

export const Route = createFileRoute("/api/public/wa/availability")({
  server: {
    handlers: {
      GET: handleAvailability,
      POST: handleAvailability,
    },
  },
});