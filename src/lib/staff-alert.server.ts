export type StaffAlertPayload = {
  event: "new_booking";
  source: "website";
  appointment_id: string;
  name: string;
  phone: string;
  email: string | null;
  doctor: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
};

type Deps = {
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  url?: string | undefined;
  secret?: string | undefined;
  timeoutMs?: number;
  retryDelayMs?: number;
};

/** Sends the staff alert; never throws. Returns true when delivered. */
export async function sendStaffAlert(payload: StaffAlertPayload, deps: Deps = {}): Promise<boolean> {
  const url = deps.url ?? process.env["STAFF_ALERT_WEBHOOK_URL"];
  const secret = deps.secret ?? process.env["STAFF_ALERT_WEBHOOK_SECRET"];
  const fetchFn = deps.fetchFn ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const timeoutMs = deps.timeoutMs ?? 5000;
  if (!url || !secret) {
    console.error("Staff alert skipped: webhook secrets are not configured.");
    return false;
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchFn(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-webhook-secret": secret },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return true;
      console.error(`Staff alert attempt ${attempt} failed with status ${res.status}`);
    } catch (err) {
      console.error(`Staff alert attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
    }
    if (attempt === 1) await sleep(deps.retryDelayMs ?? 2000);
  }
  return false;
}

/** Fire-and-forget: keeps the Worker alive via waitUntil when available, never blocks the caller. */
export function queueStaffAlert(payload: StaffAlertPayload): void {
  const task = sendStaffAlert(payload).catch(() => false);
  import(/* @vite-ignore */ "cloudflare:" + "workers")
    .then((m: { waitUntil?: (p: Promise<unknown>) => void }) => m.waitUntil?.(task))
    .catch(() => {});
}
