import { createFileRoute } from "@tanstack/react-router";
import { Heart, Award, Users, Clock, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { DOCTORS, SITE } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About City Dental Clinic — Since 2010 · Hanamkonda" },
      { name: "description", content: "Our story, our values, and the specialist team behind 15+ years of trusted dental care in Hanamkonda, Warangal." },
      { property: "og:title", content: "About City Dental Clinic" },
      { property: "og:description", content: "Since 2010 · 5000+ happy patients · Family-friendly dentistry in Hanamkonda." },
    ],
  }),
  component: About,
});

const VALUES = [
  { icon: Heart, title: "Patient-Centered Care", desc: "Every treatment starts with listening." },
  { icon: Award, title: "Excellence in Dentistry", desc: "Continuously trained, always up to date." },
  { icon: Users, title: "Family-Friendly", desc: "Comfortable care for kids, parents & grandparents." },
  { icon: Clock, title: "Timely & Efficient", desc: "We respect your time — and stick to it." },
];

function About() {
  return (
    <SiteLayout>
      <Section className="bg-soft-gradient !py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">Our story</span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            15+ years of <span className="text-gradient">gentle, honest dentistry</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            City Dental Clinic opened in {SITE.established} with a simple promise — treat every patient like family. Today, more than 5,000 patients from Hanamkonda, Warangal and beyond trust us with their smiles.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="What we believe" title="Values that guide every visit" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border/60">
              <CardContent className="p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-hero-gradient text-white shadow-md">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-surface-tint">
        <SectionHeader eyebrow="The team" title="Meet your doctors" description="Two specialists, working together for your whole family." />
        <div className="grid gap-8 md:grid-cols-2">
          {DOCTORS.map((d) => (
            <Card key={d.slug} className="border-border/60">
              <CardContent className="p-8">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-hero-gradient text-2xl font-bold text-white shadow-md">
                    {d.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{d.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground">{d.qualifications}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{d.bio}</p>
                <div className="mt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Specialisations</h4>
                  <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {d.specializations.map((s) => (
                      <li key={s} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-strong" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {d.memberships.map((m) => (
                    <span key={m} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{m}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-soft-gradient p-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Our mission</h2>
          <p className="mt-4 text-muted-foreground">
            To make world-class, painless dentistry accessible to every family in Warangal — with honest advice, transparent pricing and a smile at every visit.
          </p>
        </div>
      </Section>
    </SiteLayout>
  );
}