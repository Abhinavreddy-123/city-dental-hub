import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Phone, Clock, Bus, Car, Bike } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContact } from "@/lib/submissions.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact City Dental Clinic · Hanamkonda, Warangal" },
      { name: "description", content: "Get in touch with City Dental Clinic in Hanamkonda. Address, phone numbers, working hours and directions." },
      { property: "og:title", content: "Contact City Dental Clinic" },
      { property: "og:description", content: "Reach us in Hanamkonda Chowrastha or call +91 98491 87844." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const submit = useServerFn(submitContact);
  const [form, setForm] = useState({ name: "", phone: "", subject: "", message: "" });
  const mut = useMutation({
    mutationFn: async () => submit({ data: form }),
    onSuccess: () => {
      toast.success("Message sent. We'll call you back soon.");
      setForm({ name: "", phone: "", subject: "", message: "" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Something went wrong"),
  });

  return (
    <SiteLayout>
      <Section className="bg-soft-gradient !py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">Contact</span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">We're here to <span className="text-gradient">help</span></h1>
        </div>
      </Section>

      <Section className="!pt-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/60"><CardContent className="p-6">
            <MapPin className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">Address</h3>
            <p className="mt-1 text-sm text-muted-foreground">{SITE.address}</p>
          </CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-6">
            <Phone className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">Phone</h3>
            <ul className="mt-1 space-y-1 text-sm">
              {SITE.phones.map((p) => (
                <li key={p.value}><span className="text-muted-foreground">{p.label}:</span> <a className="font-medium text-primary" href={`tel:${p.value}`}>{p.display}</a></li>
              ))}
            </ul>
          </CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-6">
            <Clock className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">Hours</h3>
            <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
              <li>Mon – Sat · 9 AM – 8 PM</li>
              <li>Sunday · <span className="font-semibold text-destructive">Closed</span></li>
              <li className="text-emerald-strong">Emergency · 24/7</li>
            </ul>
          </CardContent></Card>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="overflow-hidden rounded-2xl border border-border/60 shadow-md">
          <iframe
            src={SITE.mapEmbed}
            title="City Dental Clinic Location"
            className="h-[380px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Section>

      <Section className="bg-surface-tint">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border-border/60"><CardContent className="p-8">
            <SectionHeader eyebrow="Message us" title="Send a message" align="left" />
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
              <div><Label>Name</Label><Input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input required type="tel" pattern="[0-9+\s-]{7,}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Subject</Label><Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Message</Label><Textarea required minLength={5} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
              <div className="sm:col-span-2">
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={mut.isPending}>
                  {mut.isPending ? "Sending…" : "Send message"}
                </Button>
              </div>
            </form>
          </CardContent></Card>
          <div>
            <SectionHeader eyebrow="Getting here" title="Directions" align="left" />
            <div className="space-y-4">
              {[
                { icon: Bus, title: "By bus", desc: "Get down at Hanamkonda Chowrastha bus stop. The clinic is a 2-minute walk near Vijay Talkies Road." },
                { icon: Car, title: "By auto or cab", desc: "Ask for 'KR & MS Reddy Complex, Hanamkonda Chowrastha'. Every local driver knows the landmark." },
                { icon: Bike, title: "By car or bike", desc: "Two-wheeler parking is available in front of the clinic. Car parking on adjacent streets." },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="border-border/60"><CardContent className="flex gap-4 p-5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-hero-gradient text-white"><Icon className="h-5 w-5" /></div>
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}