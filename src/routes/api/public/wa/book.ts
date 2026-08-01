import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  admin,
  isClosed,
  jsonError,
  jsonOk,
  normalizePhone,
  rateLimit,
  requireSharedSecret,
  WA_DOCTORS,
  WA_TIME_SLOTS,
} from "@/lib/wa.server";

const bookSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  service: z.string().trim().min(2).max(100),
  doctor: z.string().trim().min(2).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().trim().min(4).max(10),
  notes: z.string().trim().max(1000).optional().nullable(),
  google_event_id: z.string().trim().max(200).optional().nullable(),
});

const patchSchema = z.object({
  appointment_id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  google_event_id: z.string().trim().max(200).optional().nullable(),
});

export const Route = createFileRoute("/api/public/wa/book")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("invalid_input", "Body must be valid JSON.", 400);
        }

        const parsed = bookSchema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }
        const input = parsed.data;

        const phone_e164 = normalizePhone(input.phone);
        if (!phone_e164) return jsonError("invalid_input", "Could not parse `phone`.", 400);

        // Abuse protection: per-instance burst limit + per-phone daily cap.
        if (!rateLimit("book:global", 60, 60_000) || !rateLimit(`book:${phone_e164}`, 5, 60 * 60_000)) {
          return jsonError("rate_limited", "Too many booking attempts. Try again later.", 429);
        }

        if (!WA_DOCTORS.includes(input.doctor)) {
          return jsonError("invalid_input", "Unknown `doctor`.", 400, { doctors: WA_DOCTORS });
        }
        if (!WA_TIME_SLOTS.includes(input.time)) {
          return jsonError("invalid_input", "Unknown `time` slot.", 400, { time_slots: WA_TIME_SLOTS });
        }
        if (isClosed(input.date)) {
          return jsonError("clinic_closed", "The clinic is closed on Sundays.", 409);
        }

        const supabase = admin();

        const dayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: recent } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("phone_e164", phone_e164)
          .gte("created_at", dayStart);
        if ((recent ?? 0) >= 5) {
          return jsonError("rate_limited", "This number already has 5 bookings in the last 24 hours.", 429);
        }

        const { data: clash, error: clashError } = await supabase
          .from("appointments")
          .select("id")
          .eq("appointment_date", input.date)
          .eq("appointment_time", input.time)
          .eq("doctor", input.doctor)
          .neq("status", "cancelled")
          .maybeSingle();
        if (clashError) return jsonError("db_error", clashError.message, 500);
        if (clash) {
          return jsonError("slot_taken", "That doctor already has a booking at this date and time.", 409);
        }

        const { data, error } = await supabase
          .from("appointments")
          .insert({
            name: input.name,
            phone: input.phone,
            service: input.service,
            doctor: input.doctor,
            appointment_date: input.date,
            appointment_time: input.time,
            notes: input.notes ?? null,
            google_event_id: input.google_event_id ?? null,
          })
          .select("id, name, phone, phone_e164, service, doctor, appointment_date, appointment_time, notes, status, google_event_id, created_at")
          .single();

        if (error) {
          if (error.code === "23505" || error.message.includes("uq_appointments_active_slot")) {
            return jsonError("slot_taken", "That slot was just taken.", 409);
          }
          return jsonError("db_error", error.message, 500);
        }

        return jsonOk({ appointment: data }, 201);
      },

      PATCH: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("book:patch", 120, 60_000)) {
          return jsonError("rate_limited", "Too many requests.", 429);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("invalid_input", "Body must be valid JSON.", 400);
        }
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }
        const { appointment_id, ...updates } = parsed.data;
        if (Object.keys(updates).length === 0) {
          return jsonError("invalid_input", "Provide `status` and/or `google_event_id`.", 400);
        }

        const supabase = admin();
        const { data, error } = await supabase
          .from("appointments")
          .update(updates)
          .eq("id", appointment_id)
          .select("id, status, google_event_id")
          .maybeSingle();
        if (error) return jsonError("db_error", error.message, 500);
        if (!data) return jsonError("not_found", "No appointment with that id.", 404);
        return jsonOk({ appointment: data });
      },
    },
  },
});