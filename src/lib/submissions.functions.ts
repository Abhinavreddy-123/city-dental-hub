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
    const supabase = anonClient();
    const { error } = await supabase.from("appointments").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true as const };
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