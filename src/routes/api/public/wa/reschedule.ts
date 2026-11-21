import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  admin,
  readAppointmentId,
  selectTargetAppointment,
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

        const target = await selectTargetAppointment(phone_e164, readAppointmentId(body));
        if (target.response) return target.response;
        const appointment = target.appointment;

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
            change_source: "patient",
            reminder_1h_claimed_at: null,
            reminder_1h_sent_at: null,
          })
          .eq("id", appointment.id)
          .select(
            "id, name, phone, phone_e164, email, service, doctor, appointment_date, appointment_time, notes, status, google_event_id, created_at",
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
