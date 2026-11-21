import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  admin,
  readAppointmentId,
  selectTargetAppointment,
  jsonError,
  jsonOk,
  normalizePhone,
  rateLimit,
  requireSharedSecret,
} from "@/lib/wa.server";

const cancelAppointmentSchema = z.object({
  phone: z.string().trim().min(7).max(20),
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

        const target = await selectTargetAppointment(phoneE164, readAppointmentId(body));
        if (target.response) return target.response;
        const appointment = target.appointment;
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