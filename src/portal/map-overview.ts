// ── Real data → Overview screen props (Sprint 2 wiring) ───────────────────────
// Pure functions that translate org-scoped Firebase data (openings, pipelines)
// into the PortalClient + OverviewData shapes the native Overview screen renders.
// Stage mapping mirrors clientStageKey() in components/client-portal.tsx so the
// new portal shows candidates in the same client-facing stages as the old one.

import {
  readableRole,
  isNearworkEmail,
  type ClientUser,
  type Organization,
  type PortalOpening,
  type PortalPipeline,
} from "@/lib/firebase-client";
import type { PortalAccess } from "./shell";
import type { PortalClient } from "./shell";
import type { OverviewData, OverviewCandidate } from "./screens/overview";
import { clientStageKey, stageIdxOf, STAGE_LABELS, avatarColor, initialsOf } from "./stage-map";

function fullName(profile: ClientUser | null): string {
  if (!profile) return "there";
  return (
    profile.name ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.email ||
    "there"
  );
}

function isOpeningActive(o: PortalOpening): boolean {
  const s = String(o.status || "").toLowerCase();
  if (o.published === false) return false;
  return !["closed", "filled", "cancelled", "canceled", "archived", "paused"].includes(s);
}

// Access level for role-based nav + read-only enforcement. Staff and client
// admins get full access; a "viewer" is read-only; everyone else is a member.
export function accessOf(profile: ClientUser | null): PortalAccess {
  const r = `${profile?.role || ""} ${profile?.portalRole || ""}`.toLowerCase();
  if (isNearworkEmail(profile?.email) || r.includes("admin")) return "admin";
  if (r.includes("viewer")) return "viewer";
  return "member";
}

export function toPortalClient(profile: ClientUser | null, org: Organization | null): PortalClient {
  const name = fullName(profile);
  const amName = org?.accountManagerName || "";
  const client: PortalClient = {
    company: org?.name || profile?.orgName || "Your company",
    access: accessOf(profile),
    user: {
      name,
      initials: initialsOf(name),
      role: profile?.jobTitle || profile?.displayRole || readableRole(profile?.role || profile?.portalRole),
    },
  };
  // Only attach an account manager if the org actually has one; otherwise the
  // shell falls back to its own default so the card is never blank.
  if (amName) {
    client.accountManager = {
      name: amName,
      email: org?.accountManagerEmail || "",
      initials: initialsOf(amName),
    };
  }
  return client;
}

export function toOverviewData(
  pipelines: PortalPipeline[],
  openings: PortalOpening[],
  profile: ClientUser | null,
  now: Date = new Date(),
): OverviewData {
  const candidates: OverviewCandidate[] = [];
  let seq = 0;

  for (const p of pipelines || []) {
    for (const c of p.candidates || []) {
      const key = clientStageKey(c.stage);
      if (key === "not-selected") continue; // hidden from the client's active view
      const stageIdx = stageIdxOf(key);
      const name = c.name || "Candidate";
      const seed = c.candidateCode || c.code || `${name}-${seq}`;
      // "Awaiting review" candidates (final round / presented) are the ones the
      // client needs to act on, so surface them in the priority queue. Exact
      // days-waiting isn't tracked yet, so this is a floor, not a precise count.
      const awaitingDays = key === "final-round" ? 1 : 0;
      candidates.push({
        id: c.candidateCode || c.code || `c${seq++}`,
        name,
        initials: initialsOf(name),
        avatarBg: avatarColor(seed),
        location: c.location,
        role: c.role || p.openingTitle,
        stage: STAGE_LABELS[key] || "Screening",
        stageIdx,
        score: typeof c.score === "number" ? c.score : 0,
        awaitingDays,
      });
    }
  }

  const reviewCount = candidates.filter((c) => c.stage === "Final round").length;
  const interviewCount = candidates.filter((c) => c.stage === "Technical" || c.stage === "Final round").length;
  const activeOpenings = (openings || []).filter(isOpeningActive);

  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const greetingName = profile?.firstName || fullName(profile).split(/\s+/)[0] || "there";

  return {
    dateLabel,
    greetingName,
    stats: {
      review: {
        value: reviewCount,
        label: "Awaiting review",
        trend: reviewCount > 0 ? "Needs your attention" : "All caught up",
      },
      interviews: { value: interviewCount, label: "In interviews", trend: "" },
      openings: { value: activeOpenings.length, label: "Active openings", trend: "" },
    },
    candidates,
    // No scheduled-interview or activity-event source is wired yet — the screen
    // shows friendly empty states for these until those feeds are connected.
    interviews: [],
    activity: [],
  };
}
