import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/lib/site";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Dental Services in Hanamkonda — Root Canal, Implants, Cosmetic" },
      { name: "description", content: "Complete dental services in Hanamkonda: general dentistry, cosmetic, root canal, implants, orthodontics, pediatric, whitening and preventive care." },
      { property: "og:title", content: "Our Dental Services · City Dental Clinic" },
      { property: "og:description", content: "Everything from a simple check-up to full-mouth rehabilitation, in one clinic." },
    ],
  }),
  component: Services,
});

function Services() {
  return (
    <SiteLayout>
      <Section className="bg-soft-gradient !py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">Services</span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            <span className="text-gradient">Complete dental care</span> in Hanamkonda
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">Preventive, restorative, cosmetic and specialist — every service you need, delivered by our team of specialists.</p>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICES.map((s) => (
            <Card key={s.slug} className="border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.summary}</p>
                <ul className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-strong" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-surface-tint">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { k: "26+ yrs", v: "Combined experience" },
            { k: "5000+", v: "Patients treated" },
            { k: "100%", v: "Sterile & safe" },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl border border-border/60 bg-white/70 p-8 text-center shadow-sm">
              <p className="text-4xl font-extrabold text-gradient">{s.k}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="hero" size="xl">
            <Link to="/book">Book your visit <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </Section>
    </SiteLayout>
  );
}