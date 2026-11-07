import { createFileRoute } from "@tanstack/react-router";
import { admin, jsonError, jsonOk, rateLimit, requireSharedSecret } from "@/lib/wa.server";

export const Route = createFileRoute("/api/public/wa/daily-digest")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("daily-digest", 120, 60_000)) {
          return jsonError("rate_limited", "Too many requests.", 429);
        }

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const updates: Array<{
          type: "new_booking" | "rescheduled" | "cancelled";
          name: string;
          doctor: string;
          appointment_date: string;
          appointment_time: string;
        }> = [];
        const supabase = admin();
        const pageSize = 1000;

        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from("appointment_digest_events")
            .select("type, name, doctor, appointment_date, appointment_time")
            .eq("source", "patient")
            .gte("changed_at", since)
            .order("changed_at", { ascending: true })
            .order("id", { ascending: true })
            .range(offset, offset + pageSize - 1);

          if (error) {
            console.error("Daily digest query failed:", error);
            return jsonError("db_error", "Could not load appointment updates.", 500);
          }
          updates.push(...(data ?? []).map((event) => ({
            type: event.type as "new_booking" | "rescheduled" | "cancelled",
            name: event.name,
            doctor: event.doctor,
            appointment_date: event.appointment_date,
            appointment_time: event.appointment_time,
          })));
          if (!data || data.length < pageSize) break;
        }

        const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
        const today = nowIST.toISOString().slice(0, 10);
        const { data: todaysRows, error: todaysError } = await supabase
          .from("appointments")
          .select("appointment_time, name, service, doctor")
          .eq("appointment_date", today)
          .in("status", ["pending", "confirmed"])
          .order("appointment_time", { ascending: true });

        if (todaysError) {
          console.error("Daily digest today's appointments query failed:", todaysError);
          return jsonError("db_error", "Could not load today's appointments.", 500);
        }

        const todaysAppointments = (todaysRows ?? []).map((row) => ({
          time: row.appointment_time,
          name: row.name,
          service: row.service,
          doctor: row.doctor,
        }));

        return jsonOk({ updates, todaysAppointments });
      },
    },
  },
});