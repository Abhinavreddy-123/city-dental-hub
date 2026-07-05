import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section } from "@/components/ui/section";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · City Dental Clinic" },
      { name: "description", content: "The terms that apply when you use City Dental Clinic's website and services." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <Section>
        <article className="prose prose-slate mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
          <p>By using this website or booking an appointment, you agree to the terms below.</p>
          <h2 className="mt-6 text-xl font-semibold">Appointments</h2>
          <p>Online bookings are requests and are confirmed by our team over the phone. We reserve the right to reschedule when required. The clinic is closed on Sundays; emergency care is available 24/7 on +91 98491 87844.</p>
          <h2 className="mt-6 text-xl font-semibold">Medical advice</h2>
          <p>Website content is for information only and is not a substitute for professional medical advice, diagnosis or treatment. Always seek a qualified dentist for personal medical decisions.</p>
          <h2 className="mt-6 text-xl font-semibold">Payments & insurance</h2>
          <p>Estimates given online are indicative. Final treatment costs are confirmed after clinical examination.</p>
          <h2 className="mt-6 text-xl font-semibold">Contact</h2>
          <p>Questions? Call us on +91 98491 87844 or write to us via the Contact page.</p>
        </article>
      </Section>
    </SiteLayout>
  );
}