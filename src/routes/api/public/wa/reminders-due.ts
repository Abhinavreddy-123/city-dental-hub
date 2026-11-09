import { createFileRoute } from "@tanstack/react-router";
import { admin, jsonError, jsonOk, rateLimit, requireSharedSecret } from "@/lib/wa.server";

export const Route = createFileRoute("/api/public/wa/reminders-due")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("reminders-due:post", 120, 60_000)) {
          return jsonError("rate_limited", "Too many requests.", 429);
        }

        const { data, error } = await admin().rpc("claim_due_1h_reminders");
        if (error) {
          console.error("Failed to claim appointment reminders:", error);
          return jsonError("db_error", "Could not retrieve reminders. Please try again.", 500);
        }
        return jsonOk({ appointments: data ?? [] });
      },
    },
  },
});