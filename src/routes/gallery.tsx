import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section, SectionHeader } from "@/components/ui/section";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Clinic Gallery · City Dental Clinic Hanamkonda" },
      { name: "description", content: "Take a look inside City Dental Clinic in Hanamkonda — modern equipment, sterile treatment rooms and smile transformations." },
      { property: "og:title", content: "Gallery · City Dental Clinic" },
      { property: "og:description", content: "Inside our clinic and patient smile transformations." },
    ],
  }),
  component: Gallery,
});

const items = [
  { title: "Reception", tag: "Clinic", grad: "from-sky-200 to-emerald-200" },
  { title: "Treatment room 1", tag: "Clinic", grad: "from-emerald-200 to-sky-200" },
  { title: "Sterilisation area", tag: "Safety", grad: "from-sky-100 to-emerald-100" },
  { title: "Digital X-ray", tag: "Equipment", grad: "from-emerald-100 to-sky-200" },
  { title: "Pediatric corner", tag: "Kids", grad: "from-sky-200 to-emerald-100" },
  { title: "Smile makeover · Priya", tag: "Before / After", grad: "from-emerald-200 to-sky-100" },
  { title: "Whitening · Rajesh", tag: "Before / After", grad: "from-sky-100 to-emerald-200" },
  { title: "Team", tag: "People", grad: "from-emerald-100 to-sky-100" },
];

function Gallery() {
  return (
    <SiteLayout>
      <Section className="bg-soft-gradient !py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">Gallery</span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Inside our <span className="text-gradient">clinic</span></h1>
          <p className="mt-3 text-muted-foreground">A glimpse of our team, treatment rooms and patient smile transformations.</p>
        </div>
      </Section>
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.title} className={`group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br ${it.grad} shadow-md`}>
              <div className="absolute inset-0 grid place-items-center text-center">
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">{it.tag}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-4 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-sm font-semibold">{it.title}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">Visit us in person to see the clinic — Hanamkonda Chowrastha, Warangal.</p>
      </Section>
    </SiteLayout>
  );
}