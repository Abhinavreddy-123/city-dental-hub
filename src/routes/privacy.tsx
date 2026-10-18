import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section } from "@/components/ui/section";

const EMAIL = "appointments@citydentalclinichnk.com";
const PHONE = "+919030493936";
const PHONE_DISPLAY = "+91 9030493936";

const SECTIONS = [
  {
    title: "What we collect",
    body: "When you book an appointment through our website or WhatsApp, we collect your name, phone number, optional email address, the reason for your visit, your preferred doctor, and your appointment date and time. If you chat with us on WhatsApp, we also keep the messages of that conversation for a short time to answer you.",
  },
  {
    title: "How we use it",
    body: "Only to book, change, confirm or cancel your appointment, to send you appointment confirmations and reminders, to notify our clinic staff, and to run and improve our booking service. We do not sell your information and we do not use it for advertising.",
  },
  {
    title: "Who processes it for us",
    body: "Our website and database hosting, WhatsApp (provided by Meta), Google (calendar invitations and email), and an AI service used to understand your messages. They only process data to provide these services.",
  },
  {
    title: "How long we keep it",
    body: "Appointment records are kept as long as needed for your care and clinic records. WhatsApp conversation history is kept only briefly to continue your booking.",
  },
  {
    title: "Your choices",
    body: "You can ask us to see, correct or delete your information by emailing or calling us. You can stop WhatsApp messages at any time by telling us. For deleting your data, email appointments@citydentalclinichnk.com and we will respond within 30 days.",
  },
  {
    title: "Medical information",
    body: "The chat is for booking only. Please do not share detailed medical information in messages. For emergencies, call the clinic or go to the nearest hospital.",
  },
  {
    title: "Changes",
    body: "We may update this page; the date of the last update is shown at the bottom.",
  },
] as const;

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · City Dental Clinic Hanamkonda" },
      {
        name: "description",
        content:
          "How City Dental Clinic, Hanamkonda collects, uses and safeguards the information you share when you book an appointment by website or WhatsApp.",
      },
      { property: "og:title", content: "Privacy Policy · City Dental Clinic" },
      {
        property: "og:description",
        content:
          "A plain-language privacy policy: what we collect, how we use it, who processes it for us, and your choices.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://citydentalclinichnk.com/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://citydentalclinichnk.com/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <Section className="bg-soft-gradient !py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
            Your privacy
          </span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            Privacy <span className="text-gradient">Policy</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A plain-language summary of what we collect and what we do with it.
          </p>
        </div>
      </Section>

      <Section className="!pt-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
              Who we are
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              City Dental Clinic, KR &amp; MS Reddy Complex, Vijaya Talkies Road, Hanamkonda,
              Warangal, Telangana 506001.
            </p>
            <ul className="mt-4 space-y-2 text-[15px]">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${PHONE}`} className="font-medium text-foreground hover:text-primary">
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`mailto:${EMAIL}`}
                  className="break-all font-medium text-foreground hover:text-primary"
                >
                  {EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span>Open Mon–Sat, 11:00 AM – 2:00 PM and 5:30 PM – 9:00 PM. Closed Sundays.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm sm:p-8">
            {SECTIONS.map((s, i) => (
              <div key={s.title} className={i === 0 ? "" : "mt-7 border-t border-border/60 pt-7"}>
                <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
                <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{s.body}</p>
              </div>
            ))}
            <p className="mt-7 border-t border-border/60 pt-6 text-sm font-medium text-foreground">
              Last updated: 18 October 2026
            </p>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
