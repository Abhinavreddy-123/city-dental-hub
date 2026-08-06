import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { admin, jsonError, jsonOk, rateLimit } from "@/lib/wa.server";

const schema = z.object({
  doctor: z.string().trim().min(2).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slot: z.string().trim().min(4).max(10),
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/wa/check-availability")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const expected = process.env["N8N_API_KEY"];
        if (!expected) return jsonError("server_misconfigured", "N8N_API_KEY is not configured.", 500);
        const provided = request.headers.get("x-api-key") ?? "";
        if (!provided || !timingSafeEqual(provided, expected)) {
          return jsonError("unauthorized", "Missing or invalid x-api-key header.", 401);
        }
        if (!rateLimit("check-availability", 240, 60_000)) {
          return jsonError("rate_limited", "Too many requests. Try again shortly.", 429);
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
        const { doctor, date, time_slot } = parsed.data;

        const supabase = admin();
        const { data, error } = await supabase
          .from("appointments")
          .select("id")
          .eq("doctor", doctor)
          .eq("appointment_date", date)
          .eq("appointment_time", time_slot)
          .neq("status", "cancelled")
          .maybeSingle();
        if (error) return jsonError("db_error", error.message, 500);

        return jsonOk({ available: !data, doctor, date, time_slot });
      },
    },
  },
});
