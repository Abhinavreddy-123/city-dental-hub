import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section, SectionHeader } from "@/components/ui/section";

import receptionImg from "@/assets/gallery/reception.jpeg";
import treatmentRoomImg from "@/assets/gallery/Treatment room.jpeg";
import sterilizationImg from "@/assets/gallery/Sterilization area.jpeg";
import xrayImg from "@/assets/gallery/Digital X-ray.jpeg";
import smileMakeoverImg from "@/assets/gallery/smile makeover.jpg";
import whiteningImg from "@/assets/gallery/teeth whitening.jpg";

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
  { title: "Reception", tag: "Clinic", image: receptionImg, alt: "Modern dental clinic reception area" },
  { title: "Treatment room", tag: "Clinic", image: treatmentRoomImg, alt: "Dental treatment room with modern equipment" },
  { title: "Sterilisation area", tag: "Safety", image: sterilizationImg, alt: "Sterile dental instrument processing area" },
  { title: "Digital X-ray", tag: "Equipment", image: xrayImg, alt: "Digital dental X-ray and imaging equipment" },
  { title: "Smile makeover", tag: "Before / After", image: smileMakeoverImg, alt: "Before and after smile makeover transformation" },
  { title: "Teeth whitening", tag: "Cosmetic", image: whiteningImg, alt: "Professional teeth whitening treatment" },
  { title: "Our team", tag: "People", alt: "City Dental Clinic dental team" },
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
            <div key={it.title} className={`group relative aspect-square overflow-hidden rounded-2xl shadow-md ${
              it.title === "Smile makeover" ? "bg-gray-200" : "bg-muted"
            }`}>
              {it.image && (
                <img
                  src={it.image}
                  alt={it.alt}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className={`absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105 ${
                    it.title === "Smile makeover" ? "object-contain" : "object-cover"
                  }`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm">{it.tag}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
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
