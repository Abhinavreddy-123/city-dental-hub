import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function anonClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const appointmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  service: z.string().trim().min(2).max(100),
  doctor: z.string().trim().min(2).max(100),
  appointment_date: z.string().min(8),
  appointment_time: z.string().min(4),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const submitAppointment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => appointmentSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const SLOT_TAKEN =
      "Sorry, this slot was just booked by another patient — please choose a different time or doctor";

    if (data.doctor !== "Any Available") {
      const { data: clash, error: clashError } = await supabaseAdmin
        .from("appointments")
        .select("id")
        .eq("doctor", data.doctor)
        .eq("appointment_date", data.appointment_date)
        .eq("appointment_time", data.appointment_time)
        .neq("status", "cancelled")
        .maybeSingle();
      if (clashError) throw new Error(clashError.message);
      if (clash) throw new Error(SLOT_TAKEN);
    }

    const supabase = anonClient();
    const { error } = await supabase.from("appointments").insert(data);
    if (error) {
      if (error.code === "23505" || error.message.includes("uq_appointments_active_slot")) {
        throw new Error(SLOT_TAKEN);
      }
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

const bookedSlotsSchema = z.object({
  doctor: z.string().trim().min(2).max(100),
  appointment_date: z.string().min(8).max(20),
});

export const getBookedSlots = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookedSlotsSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.doctor === "Any Available") return { times: [] as string[] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("appointments")
      .select("appointment_time")
      .eq("doctor", data.doctor)
      .eq("appointment_date", data.appointment_date)
      .neq("status", "cancelled");
    if (error) throw new Error(error.message);
    return { times: (rows ?? []).map((r) => r.appointment_time) };
  });

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(2).max(2000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = anonClient();
    const { error } = await supabase.from("contact_submissions").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const reviewSchema = z.object({
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().max(100).optional().nullable(),
  rating: z.number().int().min(1).max(5),
  treatment: z.string().trim().max(100).optional().nullable(),
  message: z.string().trim().min(5).max(1500),
});

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = anonClient();
    const { error } = await supabase.from("reviews").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getApprovedReviews = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, name, location, rating, treatment, message, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return data ?? [];
});