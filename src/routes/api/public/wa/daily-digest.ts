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

        return jsonOk({ updates });
      },
    },
  },
});