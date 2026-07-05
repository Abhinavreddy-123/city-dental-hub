import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApprovedReviews, submitReview } from "@/lib/submissions.functions";
import { format } from "date-fns";

const reviewsQO = () =>
  queryOptions({ queryKey: ["approved-reviews"], queryFn: () => getApprovedReviews() });

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Patient Reviews · City Dental Clinic Hanamkonda" },
      { name: "description", content: "Read what our patients say about City Dental Clinic Hanamkonda. 4.9/5 rating from 5000+ happy families." },
      { property: "og:title", content: "Patient Reviews · City Dental Clinic" },
      { property: "og:description", content: "4.9/5 average rating from 5000+ patients." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(reviewsQO());
  },
  component: Reviews,
});

function Reviews() {
  const { data: reviews } = useSuspenseQuery(reviewsQO());
  const submit = useServerFn(submitReview);
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", location: "", rating: 5, treatment: "", message: "" });

  const mut = useMutation({
    mutationFn: async () => submit({ data: { ...form, location: form.location || null, treatment: form.treatment || null } }),
    onSuccess: () => {
      toast.success("Thanks! Your review will appear after moderation.");
      setForm({ name: "", location: "", rating: 5, treatment: "", message: "" });
      qc.invalidateQueries({ queryKey: ["approved-reviews"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Something went wrong"),
  });

  return (
    <SiteLayout>
      <Section className="bg-soft-gradient !py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">Reviews</span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Loved by <span className="text-gradient">5000+ families</span></h1>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { k: "5000+", v: "Happy patients" },
            { k: "4.9", v: "Avg rating" },
            { k: "15+", v: "Years" },
            { k: "98%", v: "Satisfaction" },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl border border-border/60 bg-white/80 p-4 text-center shadow-sm backdrop-blur">
              <p className="text-2xl font-extrabold text-gradient">{s.k}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <Card key={r.id} className="border-border/60"><CardContent className="p-6">
              <div className="flex gap-1 text-amber-500">
                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3 text-sm">“{r.message}”</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">{r.name}</p>
                  <p className="text-muted-foreground">{r.treatment ?? "Patient"} · {r.location ?? "Hanamkonda"}</p>
                </div>
                <span className="text-muted-foreground">{format(new Date(r.created_at as any), "MMM yyyy")}</span>
              </div>
            </CardContent></Card>
          ))}
        </div>
      </Section>

      <Section className="bg-surface-tint">
        <SectionHeader eyebrow="Share your visit" title="Write a review" description="We read every submission. Approved reviews appear here." />
        <Card className="mx-auto max-w-2xl border-border/60">
          <CardContent className="p-8">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
              <div><Label>Name</Label><Input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Location (optional)</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Rating</Label>
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })} aria-label={`Rate ${n}`}>
                      <Star className={"h-6 w-6 " + (n <= form.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                    </button>
                  ))}
                </div>
              </div>
              <div><Label>Treatment (optional)</Label><Input value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Your review</Label><Textarea required minLength={5} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
              <div className="sm:col-span-2">
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={mut.isPending}>
                  {mut.isPending ? "Submitting…" : "Submit review"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Section>
    </SiteLayout>
  );
}