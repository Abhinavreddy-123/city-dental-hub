import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { admin, jsonError, jsonOk, rateLimit, requireSharedSecret } from "@/lib/wa.server";

const schema = z.object({
  appointment_id: z.string().uuid(),
  success: z.boolean(),
  error: z.string().max(300).optional().nullable(),
});

export const Route = createFileRoute("/api/public/wa/followup-result")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const unauthorized = requireSharedSecret(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("followup-result:post", 300, 60_000)) {
          return jsonError("rate_limited", "Too many requests.", 429);
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("invalid_input", "Body must be valid JSON.", 400);
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }
        const { appointment_id, success, error: sendError } = parsed.data;
        if (!success && sendError) console.error(`Follow-up send failed for ${appointment_id}: ${sendError}`);
        const { data, error } = await admin().rpc("record_followup_result", {
          p_id: appointment_id,
          p_success: success,
        });
        if (error) {
          console.error("Failed to record follow-up result:", error);
          return jsonError("db_error", "Could not record the result. Please try again.", 500);
        }
        const row = data?.[0];
        if (!row) return Response.json({ ok: false, reason: "not_found" }, { status: 404 });
        return jsonOk({ appointment: row });
      },
    },
  },
});
