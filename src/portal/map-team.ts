// ── Real data → Team screen props (Stage 4 wiring) ────────────────────────────
// Maps the org's real placements (hires) into the Team screen's people list.
// Placements carry no client/pod grouping yet, so `teams` is empty (the People
// view is the real one); a person with no team shows as "Individual".

import type { PortalHire } from "@/lib/firebase-client";
import type { TeamData, TeamPerson } from "./screens/team";
import { initialsOf, avatarColor } from "./stage-map";

type Rec = Record<string, unknown>;
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

function seniorityOf(role: string): string {
  const r = role.toLowerCase();
  if (/senior|\bsr\b|lead|principal|staff/.test(r)) return "Senior";
  if (/junior|\bjr\b|intern|entry/.test(r)) return "Junior";
  return "Mid";
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

export function toTeamData(hires: PortalHire[]): TeamData {
  const people: TeamPerson[] = (hires || []).map((h) => {
    const r = h as Rec;
    const name = str(r.candidateName) || str(r.name) || "Team member";
    const start = str(r.startDate) || str(r.effectiveDate);
    const role = str(r.role) || str(r.openingTitle);
    const seed = str(r.candidateCode) || str(r.candidateId) || str(r.id) || name;
    return {
      id: str(r.candidateId) || str(r.id) || str(r.candidateCode) || name,
      name,
      initials: initialsOf(name),
      avatarBg: avatarColor(seed),
      role,
      seniority: seniorityOf(role),
      location: str(r.location),
      teamId: null,
      status: statusOf(str(r.status)),
      since: fmtSince(start),
      tenure: fmtTenure(start),
      managed: str(r.engagementType) === "managed",
    };
  });
  return { people, teams: [] };
}
