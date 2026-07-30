// ── Real data → Pipeline board props (Stage 2 wiring) ─────────────────────────
// Translates a role's pipeline candidates into the PipelineData the board renders.
// Uses the shared stage map so the 6 columns match every other screen.

import type { PortalOpening, PortalPipeline } from "@/lib/firebase-client";
import type { PipelineData, PipelineCand, PipelineOpening } from "./screens/pipeline";
import { clientStageKey, stageIdxOf, STAGE_LABELS, sourcingStageKey, sourcingStageIdx, SOURCING_STAGE_LABELS, avatarColor, initialsOf } from "./stage-map";
import { yearsFromWorkHistory, tzFromLocation, engLevelScore } from "./candidate-derive";

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
    const sourcing = p.pipelineType === "sourcing";
    for (const c of p.candidates || []) {
      const name = c.name || "Candidate";
      const seed = c.candidateCode || c.code || `${name}-${seq}`;
      const sKey = sourcing ? sourcingStageKey(c.stage) : null;
      const key = clientStageKey(c.stage);
      candidates.push({
        id: c.candidateCode || c.code || `pc${seq++}`,
        name,
        initials: initialsOf(name),
        avatarBg: avatarColor(seed),
        role: c.role || p.openingTitle || opening?.title || "",
        location: c.location || "",
        stage: sourcing ? (SOURCING_STAGE_LABELS[sKey!] || "Sourced") : (STAGE_LABELS[key] || "Screening"),
        stageIdx: sourcing ? sourcingStageIdx(sKey!) : stageIdxOf(key),
        score: typeof c.score === "number" ? c.score : 0,
        openingId: p.code,
        awaitingDays: !sourcing && key === "final-round" ? 1 : 0,
        match: Array.isArray(c.skills) ? c.skills : [],
        sourcing,
        compare: {
          experience: (typeof c.experience === "number" && c.experience > 0) ? c.experience : (yearsFromWorkHistory(c.workHistory) ?? null),
          english: c.english ? { level: c.english, score: engLevelScore(c.english) } : null,
          disc: null, // sourcing pipeline candidates have no DISC assessment
          salaryExp: (c.expectedSalary as string) || (typeof c.expectedSalaryAmount === "number" ? `$${c.expectedSalaryAmount.toLocaleString()}` : "—"),
          availability: c.availability || "—",
          timezone: c.timezone || tzFromLocation(c.location),
        },
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
    pipelineType: relevant.length && relevant.every((p) => p.pipelineType === "sourcing") ? "sourcing" : "full",
    candidates,
  };
}
