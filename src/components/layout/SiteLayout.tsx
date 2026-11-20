import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CallNowButton } from "./CallNowButton";
import { WhatsAppButton } from "./WhatsAppButton";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CallNowButton />
      <WhatsAppButton />
    </div>
  );
}