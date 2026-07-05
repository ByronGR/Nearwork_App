// ── Real data → Billing screen props (Stage 6 wiring) ─────────────────────────
// Maps the org's partnerBilling docs into the Billing screen. partnerBilling's
// exact shape varies, so this maps the fields that are present and renders the
// screen's own empty states for the rest — real numbers appear once billing data
// exists for the org.

import type { BillingData, BillingInvoice, BillingPerHire } from "./screens/billing";
import { initialsOf, avatarColor } from "./stage-map";

type Rec = Record<string, unknown>;
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const money = (v: unknown, d = "$0") => (typeof v === "number" ? `$${v.toLocaleString()}` : str(v, d));

export function toBillingData(billing: Rec[], now = new Date()): BillingData {
  const month = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const rows = billing || [];

  // Invoices: any billing rows that look like invoices (have a period/amount).
  const invoices: BillingInvoice[] = rows
    .filter((r) => r.period || r.amount || r.invoiceNumber)
    .map((r, i) => ({
      id: str(r.id) || str(r.invoiceNumber) || `INV-${i}`,
      period: str(r.period) || month,
      due: str(r.dueDate) || str(r.due) || "—",
      amount: money(r.amount ?? r.total),
      status: str(r.status, "upcoming"),
    }));

  // Per-hire lines, if the billing doc carries them.
  const perHireRaw = rows.flatMap((r) => (Array.isArray(r.perHire) ? (r.perHire as Rec[]) : []));
  const perHire: BillingPerHire[] = perHireRaw.map((h, i) => {
    const name = str(h.name) || str(h.candidateName) || "Hire";
    return {
      id: str(h.id) || str(h.candidateId) || String(i),
      name,
      initials: initialsOf(name),
      avatarBg: avatarColor(name),
      services: Array.isArray(h.services) ? (h.services as string[]) : [],
      amount: money(h.amount),
    };
  });

  const latest = rows[0] as Rec | undefined;
  return {
    month,
    total: money(latest?.total, "$0"),
    prevTotal: money(latest?.prevTotal, "$0"),
    changePct: str(latest?.changePct, "0%"),
    due: str(latest?.due) || str(latest?.dueDate) || "—",
    status: str(latest?.status, "upcoming"),
    us: { equivalent: "—", savings: "—", savingsPct: "—" },
    services: [],
    trend: [],
    perHire,
    invoices,
    ytd: money(latest?.ytd, "$0"),
    spp: null,
  };
}
