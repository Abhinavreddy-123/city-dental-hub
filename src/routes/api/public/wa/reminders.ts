import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { admin, jsonError, jsonOk, rateLimit, requireSharedSecret } from "@/lib/wa.server";

const logSchema = z.object({
  appointment_id: z.string().uuid(),
  kind: z.string().trim().min(2).max(50),
  channel: z.string().trim().min(2).max(30).optional(),
  provider_message_id: z.string().trim().max(200).optional().nullable(),
});

function istToday(offsetDays: number): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000 + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export const Route = createFileRoute("/api/public/wa/reminders")({
  server: {
    handlers: {
      // Due reminders: appointments in the window with no notification_log row of that kind.
      GET: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("reminders:get", 120, 60_000)) {
          return jsonError("rate_limited", "Too many requests.", 429);
        }

        const url = new URL(request.url);
        const window = url.searchParams.get("window") ?? "24h";
        const kind = url.searchParams.get("kind") ?? `reminder_${window}`;
        const offsets: Record<string, number> = { "24h": 1, "48h": 2, today: 0, "2h": 0 };
        if (!(window in offsets)) {
          return jsonError("invalid_input", "`window` must be one of 24h, 48h, 2h, today.", 400);
        }
        const targetDate = istToday(offsets[window]!);

        const supabase = admin();
        const { data: appts, error } = await supabase
          .from("appointments")
          .select(
            "id, name, phone, phone_e164, service, doctor, appointment_date, appointment_time, status, google_event_id",
          )
          .eq("appointment_date", targetDate)
          .neq("status", "cancelled")
          .order("appointment_time", { ascending: true })
          .limit(200);
        if (error) return jsonError("db_error", error.message, 500);

        const ids = (appts ?? []).map((a) => a.id);
        let alreadySent = new Set<string>();
        if (ids.length) {
          const { data: logs, error: logError } = await supabase
            .from("notification_log")
            .select("appointment_id")
            .eq("kind", kind)
            .in("appointment_id", ids);
          if (logError) return jsonError("db_error", logError.message, 500);
          alreadySent = new Set((logs ?? []).map((l) => l.appointment_id));
        }

        const due = (appts ?? []).filter((a) => !alreadySent.has(a.id));
        return jsonOk({ window, kind, date: targetDate, count: due.length, appointments: due });
      },

      // Mark a reminder as sent (idempotent via UNIQUE(appointment_id, kind)).
      POST: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("reminders:post", 300, 60_000)) {
          return jsonError("rate_limited", "Too many requests.", 429);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("invalid_input", "Body must be valid JSON.", 400);
        }
        const parsed = logSchema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }
        const input = parsed.data;

        const supabase = admin();
        const { data, error } = await supabase
          .from("notification_log")
          .insert({
            appointment_id: input.appointment_id,
            kind: input.kind,
            channel: input.channel ?? "whatsapp",
            provider_message_id: input.provider_message_id ?? null,
          })
          .select("id, appointment_id, kind, channel, sent_at, provider_message_id")
          .single();

        if (error) {
          if (error.code === "23505") {
            return jsonOk({ duplicate: true, message: "Already logged for this appointment and kind." });
          }
          if (error.code === "23503") {
            return jsonError("not_found", "No appointment with that id.", 404);
          }
          return jsonError("db_error", error.message, 500);
        }

        return jsonOk({ duplicate: false, notification: data }, 201);
      },
    },
  },
});