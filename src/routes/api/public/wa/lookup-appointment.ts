import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  findUpcomingAppointments,
  jsonError,
  jsonOk,
  normalizePhone,
  rateLimit,
  requireSharedSecret,
} from "@/lib/wa.server";

const lookupAppointmentSchema = z.object({
  phone: z.string().trim().min(7).max(20),
});

export const Route = createFileRoute("/api/public/wa/lookup-appointment")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("lookup-appointment", 240, 60_000)) {
          return jsonError("rate_limited", "Too many requests.", 429);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("invalid_input", "Body must be valid JSON.", 400);
        }

        const parsed = lookupAppointmentSchema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }

        const phoneE164 = normalizePhone(parsed.data.phone);
        if (!phoneE164) return jsonError("invalid_input", "Could not parse `phone`.", 400);

        const { appointments, error } = await findUpcomingAppointments(phoneE164);
        if (error) return jsonError("db_error", error.message, 500);

        return jsonOk({
          appointments: appointments.map((appointment) => ({
            id: appointment.id,
            doctor: appointment.doctor,
            service: appointment.service,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
          })),
        });
      },
    },
  },
});