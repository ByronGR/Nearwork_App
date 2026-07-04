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

  // Kickoff-brief content (summary, sent date, sender) lives in the kickoffBriefs
  // collection, which isn't wired yet — so the "Awaiting your approval" list is
  // empty for now. Openings + candidates are real. (Stage-1 follow-up.)
  const kickoffs: RoleKickoff[] = [];

  return { openings: roleOpenings, candidates, kickoffs };
}
