import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PRICING_PLANS, ADDITIONAL_SERVICES } from "@/lib/site";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Transparent Dental Pricing · City Dental Clinic Hanamkonda" },
      { name: "description", content: "Simple, transparent dental pricing in Hanamkonda. From ₹299 basic check-ups to comprehensive family plans. Insurance and EMI supported." },
      { property: "og:title", content: "Pricing · City Dental Clinic" },
      { property: "og:description", content: "Simple, transparent pricing for every family." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <SiteLayout>
      <Section className="bg-soft-gradient !py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">Pricing</span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Honest prices, <span className="text-gradient">no surprises</span></h1>
          <p className="mt-3 text-muted-foreground">Choose the plan that fits your family. Every visit includes a clear treatment estimate before we start.</p>
        </div>
      </Section>

      <Section className="!pt-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <Card key={plan.name} className={"relative border-border/60 " + (plan.popular ? "ring-2 ring-primary shadow-[var(--shadow-lg)]" : "")}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow" style={{ background: "var(--gradient-cta)" }}>
                  <Sparkles className="mr-1 inline h-3 w-3" /> Most popular
                </span>
              )}
              <CardContent className="p-8">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                <p className="mt-4"><span className="text-4xl font-extrabold text-gradient">₹{plan.price.toLocaleString("en-IN")}</span></p>
                <ul className="mt-5 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-strong" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={plan.popular ? "hero" : "outline"} className="mt-6 w-full">
                  <Link to="/book">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-surface-tint">
        <SectionHeader eyebrow="Individual treatments" title="Additional services" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADDITIONAL_SERVICES.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
              <div>
                <p className="font-medium">{s.name}</p>
                {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
              </div>
              <p className="font-bold text-primary">{s.price}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/60"><CardContent className="p-8">
            <h3 className="font-semibold">Payment methods</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Cash</li><li>Credit / Debit cards</li><li>UPI & digital payments</li><li>Net banking</li><li>EMI options available</li>
            </ul>
          </CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-8">
            <h3 className="font-semibold">Insurance</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Major health insurance providers</li><li>Corporate dental plans</li><li>Government schemes</li><li>Cashless facility available</li><li>Direct billing support</li>
            </ul>
          </CardContent></Card>
        </div>
      </Section>
    </SiteLayout>
  );
}