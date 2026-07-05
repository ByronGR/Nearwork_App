// ── Real data → Hire detail props (Stage 5 wiring) ────────────────────────────
// Builds the Hire detail from the person's real placement, their time-off
// requests, and their performance reviews. Panels with no data render their own
// empty state (the candidate/hire can't be populated until real hires exist).

import type { PortalHire, TimeOffRequest } from "@/lib/firebase-client";
import type { HireData, HirePTO, HireReview } from "./screens/hire";
import { initialsOf, avatarColor } from "./stage-map";

type Rec = Record<string, unknown>;
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0) => (typeof v === "number" ? v : d);

function seniorityOf(role: string): string {
  const r = role.toLowerCase();
  if (/senior|\bsr\b|lead|principal|staff/.test(r)) return "Senior";
  if (/junior|\bjr\b|intern|entry/.test(r)) return "Junior";
  return "Mid";
}
function fmtDate(d: string): string {
  const dt = new Date(d);
  return d && !isNaN(dt.getTime()) ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}
function fmtSince(d: string): string {
  const dt = new Date(d);
  return d && !isNaN(dt.getTime()) ? dt.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
}
function fmtTenure(d: string, now = new Date()): string {
  const dt = new Date(d);
  if (!d || isNaN(dt.getTime())) return "";
  const months = Math.max(0, Math.round((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${years} yr ${rem} mo` : `${years} yr`;
}
function statusOf(s: string): string {
  const v = s.toLowerCase();
  if (v === "ended" || v === "offboarded") return "offboarded";
  if (v === "on_hold" || v === "onleave" || v === "paused") return "onleave";
  return "active";
}
const ENGAGEMENT: Record<string, string> = { managed: "Managed team", eor: "EOR", spp: "Strategic partner", direct: "Direct placement" };

function matchesPerson(rec: Rec, personId: string, name: string): boolean {
  return rec.personId === personId || rec.candidateId === personId || rec.candidateUid === personId
    || rec.candidateCode === personId || rec.uid === personId
    || (typeof rec.personName === "string" && rec.personName === name)
    || (typeof rec.name === "string" && rec.name === name);
}

export function toHireData(
  hires: PortalHire[],
  timeOff: TimeOffRequest[],
  reviews: Rec[],
  personId?: string | null,
): HireData | null {
  if (!personId) return null;
  const hire = (hires || []).find((h) => {
    const r = h as Rec;
    return r.candidateId === personId || r.id === personId || r.candidateCode === personId;
  }) as Rec | undefined;
  if (!hire) return null;

  const name = str(hire.candidateName) || str(hire.name) || "Team member";
  const start = str(hire.startDate) || str(hire.effectiveDate);
  const role = str(hire.role) || str(hire.openingTitle);
  const engagement = str(hire.engagementType, "direct");
  const currency = str(hire.salaryCurrency, "USD");
  const monthly = num(hire.salaryAmount);

  // PTO for this person.
  const pto: HirePTO[] = (timeOff || [])
    .filter((t) => matchesPerson(t as Rec, personId, name))
    .map((t) => {
      const r = t as Rec;
      const from = str(r.from) || str(r.startDate);
      const to = str(r.to) || str(r.endDate);
      return {
        label: str(r.type, "Time off"),
        dates: from && to ? `${fmtDate(from)} – ${fmtDate(to)}` : fmtDate(from || to),
        days: num(r.days),
        status: str(r.status, "pending"),
      };
    });
  const usedDays = pto.filter((p) => p.status.toLowerCase() === "approved").reduce((s, p) => s + p.days, 0);

  // Performance reviews for this person.
  const hireReviews: HireReview[] = (reviews || [])
    .filter((rv) => matchesPerson(rv, personId, name))
    .map((rv, i) => ({
      id: str(rv.id) || `rev${i}`,
      type: str(rv.type, "Performance review"),
      period: str(rv.period),
      date: fmtDate(str(rv.date) || str(rv.createdAt)),
      rating: num(rv.rating ?? rv.overall),
      reviewer: str(rv.reviewer) || str(rv.reviewedBy) || "Nearwork talent team",
      conductedBy: str(rv.conductedBy, "Nearwork talent team"),
      summary: str(rv.summary) || str(rv.comments),
    }));

  return {
    id: personId,
    name,
    initials: initialsOf(name),
    avatarBg: avatarColor(str(hire.candidateCode) || str(hire.candidateId) || name),
    role,
    seniority: seniorityOf(role),
    location: str(hire.location),
    status: statusOf(str(hire.status)),
    since: fmtSince(start),
    tenure: fmtTenure(start),
    managed: engagement === "managed",
    team: null,
    // Comp (real).
    salaryMonthly: monthly ? `${currency} ${monthly.toLocaleString()}` : undefined,
    salaryAnnual: monthly ? `${currency} ${(monthly * 12).toLocaleString()}` : undefined,
    currency,
    contractType: ENGAGEMENT[engagement] || engagement,
    // PTO (real).
    vacationTotal: 15,
    vacationUsed: usedDays,
    vacationRemaining: Math.max(0, 15 - usedDays),
    upcomingPTO: pto,
    // Reviews (real).
    reviews: hireReviews,
    updates: [],
  };
}
