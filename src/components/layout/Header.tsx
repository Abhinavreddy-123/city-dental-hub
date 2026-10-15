import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5c-1.9 0-2.6 1-4.4 1-1.5 0-3.1.9-3.1 3.2 0 2.9 1.3 4 1.6 6.3.3 2.3.8 8.5 2.9 8.5 2.1 0 1.2-6.5 3-6.5s.9 6.5 3 6.5c2.1 0 2.6-6.2 2.9-8.5.3-2.3 1.6-3.4 1.6-6.3 0-2.3-1.6-3.2-3.1-3.2-1.8 0-2.5-1-4.4-1z" />
    </svg>
  );
}

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/reviews", label: "Reviews" },
  { to: "/gallery", label: "Gallery" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold" aria-label={SITE.name}>
          <span
            className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-md"
            style={{ background: "var(--gradient-hero)" }}
          >
            <ToothIcon className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">{SITE.name}</span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {SITE.city} · Since {SITE.established}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "text-primary bg-accent" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={`tel:${SITE.callNow}`}
            className="inline-flex items-center gap-2 rounded-full border border-emerald/40 px-3 py-1.5 text-sm font-semibold text-emerald-strong hover:bg-emerald/10"
          >
            <Phone className="h-3.5 w-3.5" /> {SITE.callNowDisplay}
          </a>
          <Button asChild variant="gradient" size="sm">
            <Link to="/book">Book Appointment</Link>
          </Button>
        </div>

        <button
          className="rounded-md p-2 lg:hidden"
          onClick={() => setOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <div className={cn("lg:hidden", open ? "block" : "hidden")}>
        <div className="space-y-1 border-t border-border/60 bg-background px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild variant="gradient" className="mt-2 w-full">
            <Link to="/book" onClick={() => setOpen(false)}>Book Appointment</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}