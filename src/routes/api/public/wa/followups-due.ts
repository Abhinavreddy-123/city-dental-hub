import { createFileRoute } from "@tanstack/react-router";
import { admin, jsonError, jsonOk, rateLimit, requireSharedSecret } from "@/lib/wa.server";

export const Route = createFileRoute("/api/public/wa/followups-due")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("followups-due:post", 60, 60_000)) {
          return jsonError("rate_limited", "Too many requests.", 429);
        }
        const { data, error } = await admin().rpc("claim_due_followups", { max_rows: 20 });
        if (error) {
          console.error("Failed to claim follow-ups:", error);
          return jsonError("db_error", "Could not retrieve follow-ups. Please try again.", 500);
        }
        const followups = data ?? [];
        return jsonOk({ count: followups.length, followups });
      },
    },
  },
});
