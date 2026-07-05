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
      <a
        href={`https://wa.me/${SITE.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp us"
        className="fixed bottom-24 right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:-translate-y-0.5 sm:bottom-28 sm:right-6"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.01 0C5.39 0 .04 5.35.04 11.96c0 2.11.55 4.17 1.6 5.98L0 24l6.24-1.63a11.94 11.94 0 0 0 5.77 1.47h.01c6.62 0 11.97-5.35 11.97-11.96 0-3.2-1.25-6.2-3.47-8.4ZM12.02 21.3h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-3.7.97.99-3.6-.24-.37a9.94 9.94 0 1 1 18.42-5.29c0 5.49-4.47 9.9-9.05 9.9Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5a9.03 9.03 0 0 1-1.67-2.08c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.09 4.49.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z"/>
        </svg>
      </a>
    </>
  );
}