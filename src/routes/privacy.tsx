import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section } from "@/components/ui/section";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · City Dental Clinic" },
      { name: "description", content: "How City Dental Clinic collects, uses and safeguards your personal and health information." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <Section>
        <article className="prose prose-slate mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
          <p>City Dental Clinic (also known as City Multispeciality Dental Hospital) respects your privacy. This policy explains how we collect, use and safeguard personal information you provide when using our website or visiting our clinic.</p>
          <h2 className="mt-8 text-xl font-semibold">Information we collect</h2>
          <p>We collect information you voluntarily submit via appointment and contact forms — such as your name, phone number, preferred service, doctor and any notes you choose to share. We do not collect email addresses through our website forms.</p>
          <h2 className="mt-6 text-xl font-semibold">How we use your information</h2>
          <p>We use the information solely to schedule and provide dental care, follow up on your visit, and comply with statutory record-keeping requirements. We never sell or rent your personal data.</p>
          <h2 className="mt-6 text-xl font-semibold">Data security</h2>
          <p>Submissions are stored on secure managed cloud infrastructure with encryption in transit and at rest. Access is restricted to authorised clinic staff.</p>
          <h2 className="mt-6 text-xl font-semibold">Your rights</h2>
          <p>You may request access, correction or deletion of your personal information by calling us at +91 98491 87844.</p>
        </article>
      </Section>
    </SiteLayout>
  );
}