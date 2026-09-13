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
  WA_TIME_SLOTS,
} from "@/lib/wa.server";

const rescheduleSchema = z.object({
  phone: z.string().trim().min(7).max(20),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newTime: z.string().trim().min(4).max(10),
  appointmentId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/api/public/wa/reschedule")({
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

        const parsed = rescheduleSchema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }
        const input = parsed.data;

        const phone_e164 = normalizePhone(input.phone);
        if (!phone_e164) return jsonError("invalid_input", "Could not parse `phone`.", 400);

        if (!rateLimit("reschedule:global", 60, 60_000) || !rateLimit(`reschedule:${phone_e164}`, 5, 60 * 60_000)) {
          return jsonError("rate_limited", "Too many reschedule attempts. Try again later.", 429);
        }

        if (!WA_TIME_SLOTS.includes(input.newTime)) {
          return jsonError("invalid_input", "Unknown `newTime` slot.", 400, { time_slots: WA_TIME_SLOTS });
        }
        if (isClosed(input.newDate)) {
          return jsonError("clinic_closed", "The clinic is closed on Sundays.", 409);
        }

        const supabase = admin();

        // Look up the patient's upcoming active appointment(s).
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
        let query = supabase
          .from("appointments")
          .select(
            "id, name, phone, phone_e164, service, doctor, appointment_date, appointment_time, notes, status, google_event_id, created_at",
          )
          .eq("phone_e164", phone_e164)
          .gte("appointment_date", today)
          .in("status", ["pending", "confirmed"]);

        if (input.appointmentId) {
          query = query.eq("id", input.appointmentId);
        }

        const { data: appointments, error: findError } = await query
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true })
          .limit(50);

        if (findError) return jsonError("db_error", findError.message, 500);

        if (!appointments || appointments.length === 0) {
          return jsonError("not_found", "No upcoming appointment found for that phone number.", 404);
        }

        if (!input.appointmentId && appointments.length > 1) {
          return jsonError(
            "ambiguous_appointment",
            "Multiple upcoming appointments found. Please provide `appointmentId`.",
            409,
            { appointments },
          );
        }

        const appointment = appointments[0];

        // Prevent rescheduling into the exact same slot.
        if (appointment.appointment_date === input.newDate && appointment.appointment_time === input.newTime) {
          return jsonError("same_slot", "The new date and time are the same as the current appointment.", 409);
        }

        // Check the new slot is free for this doctor.
        const { data: clash, error: clashError } = await supabase
          .from("appointments")
          .select("id")
          .eq("appointment_date", input.newDate)
          .eq("appointment_time", input.newTime)
          .eq("doctor", appointment.doctor)
          .neq("status", "cancelled")
          .neq("id", appointment.id)
          .maybeSingle();
        if (clashError) return jsonError("db_error", clashError.message, 500);
        if (clash) {
          return jsonError("slot_taken", "That doctor already has a booking at the new date and time.", 409);
        }

        const oldDate = appointment.appointment_date;
        const oldTime = appointment.appointment_time;

        const { data, error } = await supabase
          .from("appointments")
          .update({
            appointment_date: input.newDate,
            appointment_time: input.newTime,
          })
          .eq("id", appointment.id)
          .select(
            "id, name, phone, phone_e164, service, doctor, appointment_date, appointment_time, notes, status, google_event_id, created_at",
          )
          .single();

        if (error) {
          if (error.code === "23505" || error.message.includes("uq_appointments_active_slot")) {
            return jsonError("slot_taken", "That slot was just taken.", 409);
          }
          return jsonError("db_error", error.message, 500);
        }

        return jsonOk({
          appointment: {
            ...data,
            oldDate,
            oldTime,
            newDate: input.newDate,
            newTime: input.newTime,
          },
        });
      },
    },
  },
});
