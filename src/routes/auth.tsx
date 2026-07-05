import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Login · City Dental Clinic" },
      { name: "description", content: "Secure admin login for City Dental Clinic staff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <Section className="!py-24">
        <div className="mx-auto max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-xl text-white shadow" style={{ background: "var(--gradient-hero)" }}>
              <Sparkles className="h-5 w-5" />
            </span>
            <span>City Dental Clinic</span>
          </Link>
          <Card className="mt-6 border-border/60 shadow-lg">
            <CardContent className="p-8">
              <h1 className="text-center text-xl font-bold">Admin portal</h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">Sign in to manage submissions</p>
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>
                <TabsContent value={tab} className="mt-6">
                  <form onSubmit={handle} className="space-y-4">
                    <div>
                      <Label>Email</Label>
                      <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                      {busy ? "Please wait…" : tab === "signup" ? "Create account" : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                New admin? Create an account, then ask an existing admin to grant your user the admin role.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>
    </SiteLayout>
  );
}