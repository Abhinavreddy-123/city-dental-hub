import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  admin,
  findUpcomingAppointments,
  jsonError,
  jsonOk,
  normalizePhone,
  rateLimit,
  requireSharedSecret,
} from "@/lib/wa.server";

const cancelAppointmentSchema = z.object({
  phone: z.string().trim().min(7).max(20),
  appointmentId: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === "") return undefined;
      const parsed = z.string().uuid().safeParse(val);
      return parsed.success ? parsed.data : undefined;
    },
    z.string().uuid().optional(),
  ),
});

export const Route = createFileRoute("/api/public/wa/cancel-appointment")({
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

        const parsed = cancelAppointmentSchema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }
        const input = parsed.data;

        const phoneE164 = normalizePhone(input.phone);
        if (!phoneE164) return jsonError("invalid_input", "Could not parse `phone`.", 400);

        if (!rateLimit("cancel:global", 60, 60_000) || !rateLimit(`cancel:${phoneE164}`, 5, 60 * 60_000)) {
          return jsonError("rate_limited", "Too many cancellation attempts. Try again later.", 429);
        }

        const { appointments, error: findError } = await findUpcomingAppointments(
          phoneE164,
          input.appointmentId,
        );
        if (findError) return jsonError("db_error", findError.message, 500);

        if (appointments.length === 0) {
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
        const { data, error } = await admin()
          .from("appointments")
          .update({ status: "cancelled", change_source: "patient" })
          .eq("id", appointment.id)
          .select("id, doctor, service, appointment_date, appointment_time, google_event_id, email, name")
          .single();

        if (error) return jsonError("db_error", error.message, 500);

        return jsonOk({ appointment: data });
      },
    },
  },
});