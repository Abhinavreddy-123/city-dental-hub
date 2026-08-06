import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  admin,
  isClosed,
  jsonError,
  jsonOk,
  normalizePhone,
  rateLimit,
  WA_DOCTORS,
  WA_TIME_SLOTS,
} from "@/lib/wa.server";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone_number: z.string().trim().min(7).max(20),
  service: z.string().trim().min(2).max(100),
  doctor: z.string().trim().min(2).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slot: z.string().trim().min(4).max(10),
  notes: z.string().trim().max(1000).optional().nullable(),
  google_event_id: z.string().trim().max(200).optional().nullable(),
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/wa/book-appointment")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const expected = process.env["N8N_API_KEY"];
        if (!expected) return jsonError("server_misconfigured", "N8N_API_KEY is not configured.", 500);
        const provided = request.headers.get("x-api-key") ?? "";
        if (!provided || !timingSafeEqual(provided, expected)) {
          return jsonError("unauthorized", "Missing or invalid x-api-key header.", 401);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("invalid_input", "Body must be valid JSON.", 400);
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }
        const input = parsed.data;

        const phone_e164 = normalizePhone(input.phone_number);
        if (!phone_e164) return jsonError("invalid_input", "Could not parse `phone_number`.", 400);

        if (!rateLimit("book-appointment:global", 60, 60_000) || !rateLimit(`book-appointment:${phone_e164}`, 5, 60 * 60_000)) {
          return jsonError("rate_limited", "Too many booking attempts. Try again later.", 429);
        }
        if (!WA_DOCTORS.includes(input.doctor)) {
          return jsonError("invalid_input", "Unknown `doctor`.", 400, { doctors: WA_DOCTORS });
        }
        if (!WA_TIME_SLOTS.includes(input.time_slot)) {
          return jsonError("invalid_input", "Unknown `time_slot`.", 400, { time_slots: WA_TIME_SLOTS });
        }
        if (isClosed(input.date)) {
          return jsonError("clinic_closed", "The clinic is closed on Sundays.", 409);
        }

        const supabase = admin();

        // Re-run the availability check right before inserting.
        const { data: clash, error: clashError } = await supabase
          .from("appointments")
          .select("id")
          .eq("doctor", input.doctor)
          .eq("appointment_date", input.date)
          .eq("appointment_time", input.time_slot)
          .neq("status", "cancelled")
          .maybeSingle();
        if (clashError) return jsonError("db_error", clashError.message, 500);
        if (clash) return Response.json({ ok: false, reason: "slot_taken" }, { status: 200 });

        const { data, error } = await supabase
          .from("appointments")
          .insert({
            name: input.name,
            phone: input.phone_number,
            service: input.service,
            doctor: input.doctor,
            appointment_date: input.date,
            appointment_time: input.time_slot,
            notes: input.notes ?? null,
            google_event_id: input.google_event_id ?? null,
          })
          .select(
            "id, name, phone, phone_e164, service, doctor, appointment_date, appointment_time, notes, status, google_event_id, created_at",
          )
          .single();

        if (error) {
          // Final safety net: the partial unique index caught a true race.
          if (error.code === "23505" || error.message.includes("uq_appointments_active_slot")) {
            return Response.json({ ok: false, reason: "slot_taken" }, { status: 200 });
          }
          return jsonError("db_error", error.message, 500);
        }

        return jsonOk({ appointment: data }, 201);
      },
    },
  },
});
