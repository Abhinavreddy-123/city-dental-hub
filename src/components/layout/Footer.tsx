import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, MapPin, Phone, Clock, Sparkles } from "lucide-react";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface-tint">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-md"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-base font-bold">{SITE.name}</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {SITE.tagline}. Trusted family & specialist dental care in Hanamkonda since {SITE.established}.
          </p>
         
        </div>

        <div>
          <h3 className="text-sm font-semibold">Quick links</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/services" className="hover:text-primary">Services</Link></li>
            <li><Link to="/reviews" className="hover:text-primary">Patient Reviews</Link></li>
            <li><Link to="/book" className="hover:text-primary">Book Appointment</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Reach us</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{SITE.address}</span></li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><a href={`tel:${SITE.callNow}`} className="hover:text-primary">{SITE.callNowDisplay}</a></li>
            <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Mon–Sat · 11 AM – 2 PM, 5:30 PM – 9 PM<br/>Sunday · Closed</span></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Help</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
            <li><Link to="/auth" className="hover:text-primary">Admin Login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
      </div>
    </footer>
  );
}