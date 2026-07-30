import { Phone } from "lucide-react";
import { SITE } from "@/lib/site";

export function CallNowButton() {
  return (
    <>
      <a
        href={`tel:${SITE.callNow}`}
        aria-label={`Call ${SITE.callNowDisplay}`}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:brightness-110 sm:bottom-6 sm:right-6"
        style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-lg)" }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
        </span>
        <Phone className="h-4 w-4" />
        <span className="hidden sm:inline">Call Now</span>
        <span className="font-mono">{SITE.callNowDisplay}</span>
      </a>
    </>
  );
}
