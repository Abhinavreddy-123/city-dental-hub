import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { submitAppointment, getBookedSlots } from "@/lib/submissions.functions";
import { SERVICES, DOCTORS, TIME_SLOTS, SITE } from "@/lib/site";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Dental Appointment · City Dental Clinic Hanamkonda" },
      { name: "description", content: "Book your dental appointment online at City Dental Clinic Hanamkonda. Choose your service, doctor and time slot in under a minute." },
      { property: "og:title", content: "Book Appointment · City Dental Clinic" },
      { property: "og:description", content: "Online booking · Mon–Sat · 11AM–2PM, 5:30PM–9PM · Closed Sunday." },
    ],
  }),
  component: Book,
});

function todayStr() {
  const d = new Date();
  return format(d, "yyyy-MM-dd");
}

function Book() {
  const submit = useServerFn(submitAppointment);
  const fetchBooked = useServerFn(getBookedSlots);
  const [done, setDone] = useState<null | { name: string; date: string; time: string; service: string; doctor: string }>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    service: "",
    doctor: "Any Available",
    appointment_date: "",
    appointment_time: "",
    notes: "",
  });

  const bookedQuery = useQuery({
    queryKey: ["booked-slots", form.doctor, form.appointment_date],
    enabled: Boolean(form.appointment_date) && form.doctor !== "Any Available",
    queryFn: () => fetchBooked({ data: { doctor: form.doctor, appointment_date: form.appointment_date } }),
  });
  const bookedTimes: string[] = bookedQuery.data?.times ?? [];

  const mut = useMutation({
    mutationFn: async () => {
      if (form.appointment_date) {
        const d = new Date(form.appointment_date);
        if (d.getDay() === 0) throw new Error("We are closed on Sundays. Please pick another day.");
      }
      return submit({ data: { ...form, notes: form.notes || null } });
    },
    onSuccess: () => {
      setDone({
        name: form.name,
        date: form.appointment_date,
        time: form.appointment_time,
        service: form.service,
        doctor: form.doctor,
      });
      toast.success("Appointment request received!");
    },
    onError: (e: any) => toast.error(e?.message ?? "Something went wrong"),
  });

  const onSlotError = () => {
    void bookedQuery.refetch();
    setForm((f) => ({ ...f, appointment_time: "" }));
  };

  if (done) {
    return (
      <SiteLayout>
        <Section className="!py-24">
          <Card className="mx-auto max-w-lg border-border/60 text-center">
            <CardContent className="p-10">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald/15 text-emerald-strong">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-2xl font-bold">You're booked, {done.name.split(" ")[0]}!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Our team will call you shortly to confirm your appointment.
              </p>
              <dl className="mt-6 space-y-2 rounded-2xl border border-border/60 bg-surface-tint p-4 text-left text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Service</dt><dd className="font-medium">{done.service}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Doctor</dt><dd className="font-medium">{done.doctor}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Date</dt><dd className="font-medium">{done.date}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Time</dt><dd className="font-medium">{done.time}</dd></div>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">Need to change something? Call us at</p>
              <a href={`tel:${SITE.callNow}`} className="mt-1 inline-flex items-center gap-2 font-semibold text-primary">
                <Phone className="h-4 w-4" /> {SITE.callNowDisplay}
              </a>
            </CardContent>
          </Card>
        </Section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <Section className="bg-soft-gradient !py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm">Appointments</span>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Book your <span className="text-gradient">visit</span></h1>
          <p className="mt-3 text-muted-foreground">Takes less than a minute. Our team will call to confirm your slot.</p>
        </div>
      </Section>

      <Section className="!pt-8">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          <Card className="border-border/60 lg:col-span-2">
            <CardContent className="p-8">
              <form
                className="grid gap-5 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  mut.mutate();
                }}
              >
                <div className="sm:col-span-1">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" required type="tel" inputMode="tel" pattern="[0-9+\s-]{7,}" placeholder="+91 " value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Service</Label>
                  <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => <SelectItem key={s.slug} value={s.title}>{s.title}</SelectItem>)}
                      <SelectItem value="Consultation">General Consultation</SelectItem>
                      <SelectItem value="Emergency">Emergency Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preferred doctor</Label>
                  <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any Available">Any Available</SelectItem>
                      {DOCTORS.map((d) => <SelectItem key={d.slug} value={d.name}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" required min={todayStr()} value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
                  <p className="mt-1 text-xs text-muted-foreground">Closed Sundays</p>
                </div>
                <div>
                  <Label>Time slot</Label>
                  <Select value={form.appointment_time} onValueChange={(v) => setForm({ ...form, appointment_time: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={bookedQuery.isFetching ? "Checking availability…" : "Choose a time"} />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => {
                        const taken = bookedTimes.includes(t);
                        return (
                          <SelectItem key={t} value={t} disabled={taken}>
                            {t}{taken ? " · Booked" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {form.doctor !== "Any Available" && form.appointment_date && bookedTimes.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Greyed-out times are already booked for {form.doctor} on this date.
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">Anything we should know? (optional)</Label>
                  <Textarea id="notes" rows={4} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    variant="hero"
                    size="xl"
                    className="w-full"
                    disabled={mut.isPending || !form.service || !form.appointment_date || !form.appointment_time}
                  >
                    <CalendarCheck className="h-4 w-4" />
                    {mut.isPending ? "Booking…" : "Request appointment"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card className="border-border/60 bg-surface-tint">
              <CardContent className="p-6">
                <h3 className="font-semibold">Need help right now?</h3>
                <p className="mt-2 text-sm text-muted-foreground">Call our emergency line — we're available 24/7.</p>
                <a href={`tel:${SITE.callNow}`} className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md" style={{ background: "var(--gradient-cta)" }}>
                  <Phone className="h-4 w-4" /> {SITE.callNowDisplay}
                </a>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-6 text-sm">
                <h3 className="font-semibold">Clinic hours</h3>
                <ul className="mt-3 space-y-1 text-muted-foreground">
                  <li>Mon – Sat · 11 AM – 2 PM, 5:30 PM – 9 PM</li>
                  <li>Sunday · Closed</li>
                  <li className="text-emerald-strong">Emergency · 24/7</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}