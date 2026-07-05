import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CallNowButton } from "./CallNowButton";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CallNowButton />
    </div>
  );
}