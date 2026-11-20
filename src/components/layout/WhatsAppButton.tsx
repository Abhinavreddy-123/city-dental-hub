import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function WhatsAppButton() {
  const [hidden, setHidden] = useState(false);

  // Keep the floating button from covering a page's primary action
  // (e.g. the booking form's submit button) when that action is on screen.
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-floating-hide]"),
    );
    if (targets.length === 0) return;

    const visible = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target as HTMLElement);
          else visible.delete(entry.target as HTMLElement);
        }
        setHidden(visible.size > 0);
      },
      { rootMargin: "0px 0px -88px 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <a
      href={SITE.whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with City Dental Clinic on WhatsApp"
      className={`group fixed right-4 bottom-[5.25rem] z-50 flex items-center justify-center rounded-full transition-all duration-300 sm:right-6 sm:bottom-[5.5rem] sm:h-[60px] sm:w-[60px] ${
        hidden ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100"
      }`}
      style={{
        background: "#25D366",
        boxShadow: "var(--shadow-md)",
        height: "56px",
        width: "56px",
      }}
    >
      <WhatsAppIcon className="h-7 w-7 text-white sm:h-[28px] sm:w-[28px]" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
        Chat with us on WhatsApp
      </span>
    </a>
  );
}
