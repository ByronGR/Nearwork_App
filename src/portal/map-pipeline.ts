// ── Real data → Pipeline board props (Stage 2 wiring) ─────────────────────────
// Translates a role's pipeline candidates into the PipelineData the board renders.
// Uses the shared stage map so the 6 columns match every other screen.

import type { PortalOpening, PortalPipeline } from "@/lib/firebase-client";
import type { PipelineData, PipelineCand, PipelineOpening } from "./screens/pipeline";
import { clientStageKey, stageIdxOf, STAGE_LABELS, avatarColor, initialsOf } from "./stage-map";

function isActive(o: PortalOpening): boolean {
  const s = String(o.status || "").toLowerCase();
  if (o.published === false) return false;
  return !["closed", "filled", "cancelled", "canceled", "archived", "paused"].includes(s);
}

export function toPipelineData(
  pipelines: PortalPipeline[],
  openings: PortalOpening[],
  openingId?: string | null,
): PipelineData {
  const activeId = openingId && openingId !== "all" ? openingId : null;
  const opening = activeId ? (openings || []).find((o) => o.code === activeId) : undefined;
  const relevant = (pipelines || []).filter((p) => !activeId || p.code === activeId);

  const candidates: PipelineCand[] = [];
  let seq = 0;
  for (const p of relevant) {
    for (const c of p.candidates || []) {
      const key = clientStageKey(c.stage);
      const name = c.name || "Candidate";
      const seed = c.candidateCode || c.code || `${name}-${seq}`;
      candidates.push({
        id: c.candidateCode || c.code || `pc${seq++}`,
        name,
        initials: initialsOf(name),
        avatarBg: avatarColor(seed),
        role: c.role || p.openingTitle || opening?.title || "",
        location: c.location || "",
        stage: STAGE_LABELS[key] || "Screening",
        stageIdx: stageIdxOf(key),
        score: typeof c.score === "number" ? c.score : 0,
        openingId: p.code,
        awaitingDays: key === "final-round" ? 1 : 0,
        match: Array.isArray(c.skills) ? c.skills : [],
      });
    }
  }

  const pipelineOpening: PipelineOpening | undefined = opening
    ? {
        id: opening.code,
        title: opening.title || "Role",
        team: opening.roleLibraryDepartment || "",
        location: "",
        // brief (kickoffBriefs content) not wired yet → the brief drawer stays hidden.
      }
    : undefined;

  return {
    openingId: activeId || "all",
    openingTitle: opening?.title || "All roles",
    opening: pipelineOpening,
    totalOpenRoles: (openings || []).filter(isActive).length,
    candidates,
  };
}
