import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { admin, jsonError, jsonOk, rateLimit, requireSharedSecret } from "@/lib/wa.server";

const resultSchema = z.object({ id: z.string().uuid(), sent: z.boolean() }).strict();

export const Route = createFileRoute("/api/public/wa/reminder-result")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("reminder-result:post", 300, 60_000)) {
          return jsonError("rate_limited", "Too many requests.", 429);
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("invalid_input", "Body must be valid JSON.", 400);
        }
        const parsed = resultSchema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }

        const { id, sent } = parsed.data;
        const { data, error } = await admin()
          .rpc("record_1h_reminder_result", { p_id: id, p_sent: sent })
          .maybeSingle();
        if (error) {
          console.error("Failed to record appointment reminder result:", error);
          return jsonError("db_error", "Could not record reminder result. Please try again.", 500);
        }
        if (!data) return jsonError("not_found", "No appointment with that id.", 404);
        return jsonOk({ appointment: data, sent });
      },
    },
  },
});