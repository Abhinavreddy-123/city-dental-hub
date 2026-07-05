import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LogOut, ShieldAlert, Users, MessageSquare, Star, Trash2, CheckCircle2, XCircle, Search, Download } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdminOverview,
  checkIsAdmin,
  updateAppointmentStatus,
  deleteAppointment,
  resolveContact,
  deleteContact,
  approveReview,
  deleteReview,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard · City Dental Clinic" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function toCsv(rows: any[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function download(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const check = useServerFn(checkIsAdmin);
  const overview = useServerFn(getAdminOverview);

  const adminCheck = useQuery({ queryKey: ["is-admin"], queryFn: () => check() });
  const data = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overview(),
    enabled: !!adminCheck.data?.isAdmin,
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const updStatus = useServerFn(updateAppointmentStatus);
  const delAppt = useServerFn(deleteAppointment);
  const resContact = useServerFn(resolveContact);
  const delContact = useServerFn(deleteContact);
  const apprReview = useServerFn(approveReview);
  const delReview = useServerFn(deleteReview);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-overview"] });

  const mUpdStatus = useMutation({ mutationFn: (v: any) => updStatus({ data: v }), onSuccess: () => { invalidate(); toast.success("Updated"); }, onError: (e: any) => toast.error(e.message) });
  const mDelAppt = useMutation({ mutationFn: (v: any) => delAppt({ data: v }), onSuccess: () => { invalidate(); toast.success("Deleted"); }, onError: (e: any) => toast.error(e.message) });
  const mResContact = useMutation({ mutationFn: (v: any) => resContact({ data: v }), onSuccess: () => { invalidate(); toast.success("Updated"); }, onError: (e: any) => toast.error(e.message) });
  const mDelContact = useMutation({ mutationFn: (v: any) => delContact({ data: v }), onSuccess: () => { invalidate(); toast.success("Deleted"); }, onError: (e: any) => toast.error(e.message) });
  const mApprReview = useMutation({ mutationFn: (v: any) => apprReview({ data: v }), onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ["approved-reviews"] }); toast.success("Updated"); }, onError: (e: any) => toast.error(e.message) });
  const mDelReview = useMutation({ mutationFn: (v: any) => delReview({ data: v }), onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ["approved-reviews"] }); toast.success("Deleted"); }, onError: (e: any) => toast.error(e.message) });

  const appts = data.data?.appointments ?? [];
  const contacts = data.data?.contacts ?? [];
  const reviews = data.data?.reviews ?? [];

  const filteredAppts = useMemo(() => appts.filter((a: any) => {
    if (status !== "all" && a.status !== status) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return [a.name, a.phone, a.service, a.doctor].some((x: any) => x?.toLowerCase().includes(s));
  }), [appts, q, status]);

  const filteredContacts = useMemo(() => contacts.filter((c: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [c.name, c.phone, c.subject, c.message].some((x: any) => x?.toLowerCase().includes(s));
  }), [contacts, q]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (adminCheck.isPending) {
    return <SiteLayout><Section><p className="text-center text-muted-foreground">Loading…</p></Section></SiteLayout>;
  }

  if (adminCheck.data && !adminCheck.data.isAdmin) {
    return (
      <SiteLayout>
        <Section>
          <Card className="mx-auto max-w-lg border-border/60 text-center">
            <CardContent className="p-10">
              <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-4 text-xl font-bold">Admin access required</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your account is signed in but doesn't have admin privileges yet. Ask an existing admin to grant your account the <code className="rounded bg-muted px-1 py-0.5 text-xs">admin</code> role.
              </p>
              <p className="mt-4 rounded-md border border-border/60 bg-muted p-3 text-left text-xs">
                Your user ID: <code className="break-all">{adminCheck.data.userId}</code>
              </p>
              <Button variant="outline" className="mt-6" onClick={handleSignOut}><LogOut className="h-4 w-4" /> Sign out</Button>
            </CardContent>
          </Card>
        </Section>
      </SiteLayout>
    );
  }

  const pending = appts.filter((a: any) => a.status === "pending").length;

  return (
    <SiteLayout>
      <Section className="!py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Admin dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage appointments, messages and reviews.</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}><LogOut className="h-4 w-4" /> Sign out</Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: "Total appointments", value: appts.length },
            { icon: Users, label: "Pending", value: pending },
            { icon: MessageSquare, label: "Contact messages", value: contacts.length },
            { icon: Star, label: "Reviews", value: reviews.length },
          ].map((s) => (
            <Card key={s.label} className="border-border/60"><CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-3xl font-extrabold text-gradient">{s.value}</p>
                </div>
                <s.icon className="h-6 w-6 text-primary" />
              </div>
            </CardContent></Card>
          ))}
        </div>

        <Tabs defaultValue="appointments">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="contacts">Messages</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="mt-6">
            <Card className="border-border/60"><CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search name, phone, service…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => download("appointments.csv", toCsv(filteredAppts))}>
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="p-2">Patient</th><th className="p-2">Service</th><th className="p-2">Doctor</th><th className="p-2">Date & time</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredAppts.map((a: any) => (
                      <tr key={a.id} className="border-t border-border/60 align-top">
                        <td className="p-2">
                          <p className="font-medium">{a.name}</p>
                          <a href={`tel:${a.phone}`} className="text-xs text-primary">{a.phone}</a>
                          {a.notes && <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>}
                        </td>
                        <td className="p-2">{a.service}</td>
                        <td className="p-2">{a.doctor}</td>
                        <td className="p-2">{a.appointment_date}<br/><span className="text-xs text-muted-foreground">{a.appointment_time}</span></td>
                        <td className="p-2">
                          <Select value={a.status} onValueChange={(v) => mUpdStatus.mutate({ id: a.id, status: v })}>
                            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this appointment?")) mDelAppt.mutate({ id: a.id }); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredAppts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No appointments.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            <Card className="border-border/60"><CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
                </div>
                <Button variant="outline" onClick={() => download("contacts.csv", toCsv(filteredContacts))}><Download className="h-4 w-4" /> Export</Button>
              </div>
              <div className="mt-4 space-y-3">
                {filteredContacts.map((c: any) => (
                  <div key={c.id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{c.name}</p>
                          {c.resolved ? <Badge>Resolved</Badge> : <Badge variant="secondary">Open</Badge>}
                        </div>
                        <a href={`tel:${c.phone}`} className="text-xs text-primary">{c.phone}</a>
                        <p className="mt-2 text-sm font-medium">{c.subject}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{c.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{format(new Date(c.created_at), "PPp")}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" onClick={() => mResContact.mutate({ id: c.id, resolved: !c.resolved })}>
                          {c.resolved ? <><XCircle className="h-4 w-4" /> Reopen</> : <><CheckCircle2 className="h-4 w-4" /> Resolve</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this message?")) mDelContact.mutate({ id: c.id }); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredContacts.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No messages.</p>}
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card className="border-border/60"><CardContent className="p-6">
              <div className="space-y-3">
                {reviews.map((r: any) => (
                  <div key={r.id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{r.name}</p>
                          {r.approved ? <Badge>Approved</Badge> : <Badge variant="secondary">Pending</Badge>}
                          <span className="text-amber-500">{"★".repeat(r.rating)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.treatment ?? "—"} · {r.location ?? "—"}</p>
                        <p className="mt-2 text-sm">{r.message}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" onClick={() => mApprReview.mutate({ id: r.id, approved: !r.approved })}>
                          {r.approved ? "Unpublish" : "Approve"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this review?")) mDelReview.mutate({ id: r.id }); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet.</p>}
              </div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </Section>
    </SiteLayout>
  );
}