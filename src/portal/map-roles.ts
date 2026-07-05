// ── Real data → Open roles screen props (Stage 1 wiring) ──────────────────────
// Translates org-scoped openings + pipelines into the RolesData the Open roles
// screen renders. Uses the shared stage map so stages match every other screen.

import type { PortalOpening, PortalPipeline } from "@/lib/firebase-client";
import type { RolesData, RoleOpening, RoleCandidate, RoleKickoff } from "./screens/roles";
import { clientStageKey, stageIdxOf, avatarColor, initialsOf } from "./stage-map";

function roleStatus(o: PortalOpening): string {
  const s = String(o.status || "").toLowerCase();
  if (s === "open" || s === "") return "active";
  if (s === "draft" || s === "pending") return "sourcing";
  return s; // paused | filled | cancelled …
}

export function toRolesData(openings: PortalOpening[], pipelines: PortalPipeline[]): RolesData {
  const roleOpenings: RoleOpening[] = (openings || []).map((o) => ({
    id: o.code,
    title: o.title || "Untitled role",
    team: o.roleLibraryDepartment || "",
    location: "",
    daysOpen: 0,
    status: roleStatus(o),
  }));

  const candidates: RoleCandidate[] = [];
  let seq = 0;
  for (const p of pipelines || []) {
    const openingId = p.code; // pipeline.code === opening.code (shared)
    for (const c of p.candidates || []) {
      const key = clientStageKey(c.stage);
      const name = c.name || "Candidate";
      const seed = c.candidateCode || c.code || `${name}-${seq}`;
      candidates.push({
        id: c.candidateCode || c.code || `rc${seq++}`,
        openingId,
        initials: initialsOf(name),
        avatarBg: avatarColor(seed),
        stageIdx: stageIdxOf(key),
        awaitingDays: key === "final-round" ? 1 : 0,
      });
    }
  }

  // Kickoff briefs awaiting the client's approval. Pipelines carry `briefStatus`
  // (synced from kickoffBriefs by the Admin API). We surface the ones the client
  // needs to act on — status "submitted". The full brief (summary + all sections)
  // loads in the brief view via /api/kickoff; the card is just the teaser.
  const openingByCode = new Map(roleOpenings.map((o) => [o.id, o]));
  const kickoffs: RoleKickoff[] = [];
  for (const p of pipelines || []) {
    const bs = String(p.briefStatus || "").toLowerCase();
    if (bs !== "submitted") continue;
    const o = openingByCode.get(p.code);
    const sender = p.accountManager || p.recruiter || "Nearwork";
    kickoffs.push({
      id: p.code,
      title: o?.title || p.openingTitle || "New role",
      team: o?.team || "",
      location: o?.location || "",
      summary: "Nearwork has scoped this role with you. Open the brief to review the details, then approve or request changes.",
      status: "pending",
      sentDate: "",
      sentBy: { initials: initialsOf(sender), avatarBg: avatarColor(p.code) },
    });
  }

  return { openings: roleOpenings, candidates, kickoffs };
}
