import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheck, Award, HeartHandshake, Users, Star, CheckCircle2, Phone, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SITE, SERVICES, DOCTORS } from "@/lib/site";
import { getApprovedReviews } from "@/lib/submissions.functions";

const reviewsQO = () =>
  queryOptions({ queryKey: ["approved-reviews"], queryFn: () => getApprovedReviews() });

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(reviewsQO());
  },
  component: Index,
});

const HIGHLIGHTS = [
  { icon: ShieldCheck, title: "Safe & Sterile", desc: "Hospital-grade sterilisation on every instrument." },
  { icon: Award, title: "Expert Doctors", desc: "26+ years of specialist experience." },
  { icon: HeartHandshake, title: "Family Friendly", desc: "Warm, gentle care for every age." },
  { icon: Users, title: "Patient First", desc: "Transparent plans, honest advice, always." },
];

function Index() {
  const { data: reviews } = useSuspenseQuery(reviewsQO());
  const featured = reviews.slice(0, 3);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-soft-gradient">
        <div className="absolute inset-0 -z-10 opacity-40" aria-hidden>
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky/30 blur-3xl" />
          <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-emerald/30 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-strong shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
              Now booking · Mon–Sat 9AM–8PM · Sunday Closed
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">
              <span className="text-gradient">Healthy Smiles,</span>
              <br /> Happy Lives.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              City Dental Clinic in Hanamkonda has cared for 5,000+ happy patients since 2000 — with painless root canals, gentle pediatric care and beautiful cosmetic dentistry, all under one roof.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/book">Book Appointment <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <a href={`tel:${SITE.callNow}`}><Phone className="h-4 w-4" /> {SITE.callNowDisplay}</a>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                { k: "5000+", v: "Happy patients" },
                { k: "26+ yrs", v: "Experience" },
                { k: "4.9/5", v: "Patient rating" },
              ].map((s) => (
                <div key={s.v} className="rounded-2xl border border-border/60 bg-white/70 p-4 text-center shadow-sm backdrop-blur">
                  <dt className="text-2xl font-extrabold text-gradient">{s.k}</dt>
                  <dd className="mt-1 text-xs font-medium text-muted-foreground">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-hero-gradient opacity-20 blur-2xl" />
            <img
              src={heroImg}
              alt="Friendly dentist with patient at City Dental Clinic Hanamkonda"
              width={1024}
              height={1024}
              className="relative rounded-[2rem] border border-white/40 shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border/60 bg-white/95 p-4 shadow-lg backdrop-blur sm:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald/15 text-emerald-strong">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">100% sterile</p>
                  <p className="text-xs text-muted-foreground">Autoclaved every visit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <Section className="!py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border/60 transition-shadow hover:shadow-[var(--shadow-md)]">
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

      {/* DOCTORS */}
      <Section className="bg-surface-tint">
        <SectionHeader eyebrow="Meet Our Doctors" title="Specialists you can trust" description="Both our doctors are members of the Indian Dental Association and are known for their gentle chair-side manner." />
        <div className="grid gap-6 md:grid-cols-2">
          {DOCTORS.map((doc) => (
            <Card key={doc.slug} className="overflow-hidden border-border/60">
              <CardContent className="p-8">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-hero-gradient text-xl font-bold text-white shadow-md">
                    {doc.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{doc.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground">{doc.qualifications}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{doc.bio}</p>
                <p className="mt-3 text-sm font-semibold text-primary">{doc.focus}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* SERVICES PREVIEW */}
      <Section>
        <SectionHeader eyebrow="Our Services" title="Complete dental care under one roof" description="From routine cleaning to full-mouth rehabilitation, we handle everything in-house." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.slice(0, 8).map((s) => (
            <Card key={s.slug} className="border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
              <CardContent className="p-6">
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.summary}</p>
                <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  {s.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-strong" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/services">View all services <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section className="bg-soft-gradient">
        <SectionHeader eyebrow="Loved by families" title="What our patients say" />
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((r) => (
            <Card key={r.id} className="border-border/60 bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-sm text-foreground">“{r.message}”</p>
                <div className="mt-4 text-sm">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.treatment ?? "Patient"} · {r.location ?? "Hanamkonda"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="relative overflow-hidden rounded-3xl p-10 text-center text-white shadow-xl sm:p-14" style={{ background: "var(--gradient-hero)" }}>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready for a healthier smile?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">Book your appointment online in under a minute — or call us for immediate assistance.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="xl" className="bg-white text-primary hover:bg-white/90">
              <Link to="/book">Book Appointment</Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="border-white/70 bg-transparent text-white hover:bg-white/10">
              <a href={`tel:${SITE.callNow}`}><Phone className="h-4 w-4" /> {SITE.callNowDisplay}</a>
            </Button>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
