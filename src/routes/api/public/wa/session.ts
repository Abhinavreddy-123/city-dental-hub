import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { admin, jsonError, jsonOk, normalizePhone, rateLimit } from "@/lib/wa.server";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function requireApiKey(request: Request): Response | null {
  const expected = process.env["N8N_API_KEY"];
  if (!expected) return jsonError("server_misconfigured", "N8N_API_KEY is not configured.", 500);
  const provided = request.headers.get("x-api-key") ?? "";
  if (!provided || !timingSafeEqual(provided, expected)) {
    return jsonError("unauthorized", "Missing or invalid x-api-key header.", 401);
  }
  return null;
}

const putSchema = z.object({
  phone_number: z.string().trim().min(7).max(20),
  conversation_history: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
});

export const Route = createFileRoute("/api/public/wa/session")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const unauthorized = requireApiKey(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("wa-session-get", 240, 60_000)) {
          return jsonError("rate_limited", "Too many requests. Try again shortly.", 429);
        }

        const raw = new URL(request.url).searchParams.get("phone") ?? "";
        if (!raw || raw.length > 20) return jsonError("invalid_input", "Missing `phone` query param.", 400);
        const phone = normalizePhone(raw);
        if (!phone) return jsonError("invalid_input", "Could not parse `phone`.", 400);

        const supabase = admin();
        const { data, error } = await supabase
          .from("whatsapp_sessions")
          .select("phone_number, conversation_history, last_message_at")
          .eq("phone_number", phone)
          .maybeSingle();
        if (error) return jsonError("db_error", error.message, 500);

        return jsonOk({
          phone_number: phone,
          conversation_history: data?.conversation_history ?? [],
          last_message_at: data?.last_message_at ?? null,
          found: Boolean(data),
        });
      },
      PUT: async ({ request }: { request: Request }) => {
        const unauthorized = requireApiKey(request);
        if (unauthorized) return unauthorized;
        if (!rateLimit("wa-session-put", 240, 60_000)) {
          return jsonError("rate_limited", "Too many requests. Try again shortly.", 429);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("invalid_input", "Body must be valid JSON.", 400);
        }
        const parsed = putSchema.safeParse(body);
        if (!parsed.success) {
          return jsonError("invalid_input", "Validation failed.", 400, parsed.error.flatten());
        }

        const phone = normalizePhone(parsed.data.phone_number);
        if (!phone) return jsonError("invalid_input", "Could not parse `phone_number`.", 400);

        const history = parsed.data.conversation_history;
        if (JSON.stringify(history).length > 200_000) {
          return jsonError("invalid_input", "`conversation_history` is too large.", 413);
        }

        const supabase = admin();
        const { data, error } = await supabase
          .from("whatsapp_sessions")
          .upsert(
            {
              phone_number: phone,
              conversation_history: history as never,
              last_message_at: new Date().toISOString(),
            },
            { onConflict: "phone_number" },
          )
          .select("phone_number, conversation_history, last_message_at")
          .single();
        if (error) return jsonError("db_error", error.message, 500);

        return jsonOk({ session: data });
      },
    },
  },
});