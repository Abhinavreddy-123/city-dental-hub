import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section } from "@/components/ui/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQS } from "@/lib/site";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ · City Dental Clinic Hanamkonda" },
      { name: "description", content: "Answers to common questions about services, pricing, insurance, appointments and Sunday closure at City Dental Clinic Hanamkonda." },
      { property: "og:title", content: "FAQ · City Dental Clinic" },
      { property: "og:description", content: "Everything you need to know before your visit." },
    ],
  }),
  component: Faq,
});

function Faq() {
  return (
    <SiteLayout>
      <Section className="bg-soft-gradient !py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">Help</span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Frequently asked <span className="text-gradient">questions</span></h1>
          <p className="mt-3 text-sm text-muted-foreground">Please note: the clinic is <span className="font-semibold text-destructive">closed on Sundays</span>. Emergency care is available 24/7.</p>
        </div>
      </Section>
      <Section className="!pt-6">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="rounded-2xl border border-border/60 bg-white p-2 shadow-sm">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={"q" + i}>
                <AccordionTrigger className="px-4 text-left text-base font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>
    </SiteLayout>
  );
}