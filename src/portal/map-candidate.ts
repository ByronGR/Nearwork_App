// ── Real data → Candidate detail props (Stage 3 wiring) ───────────────────────
// Builds the header from the real pipeline-candidate entry (+ assessment score
// where one exists). The rich report (English / Assessment / DISC / radar) isn't
// stored in the DB yet — it comes from the Nearwork Score / assessment PDFs — so
// it's left off and the screen shows its clean "pending" report state.

import type { PortalOpening, PortalPipeline, PortalAssessment } from "@/lib/firebase-client";
import type { CandidateData, CandidateHeader, CandidateDiscDim } from "./screens/candidate";
import { clientStageKey, stageIdxOf, STAGE_LABELS, avatarColor, initialsOf } from "./stage-map";

const DISC_COLORS: Record<string, string> = { D: "#E74C7C", I: "#EAB308", S: "#16A085", C: "#3B82F6" };
const DISC_DIMS: Record<string, CandidateDiscDim> = {
  D: { key: "D", name: "Dominance", color: "#E74C7C" },
  I: { key: "I", name: "Influence", color: "#EAB308" },
  S: { key: "S", name: "Steadiness", color: "#16A085" },
  C: { key: "C", name: "Conscientiousness", color: "#3B82F6" },
};
const STAGE_ORDER = ["Applied", "Screening", "Technical", "Final round", "Offer", "Not selected"];

export function toCandidateData(
  pipelines: PortalPipeline[],
  openings: PortalOpening[],
  assessments: PortalAssessment[],
  candidateId?: string | null,
): CandidateData | null {
  if (!candidateId) return null;

  let found: Record<string, unknown> | undefined;
  let pipe: PortalPipeline | undefined;
  for (const p of pipelines || []) {
    const c = (p.candidates || []).find((x) => {
      const rec = x as Record<string, unknown>;
      return (rec.candidateCode || rec.code || "") === candidateId || rec.candidateId === candidateId;
    });
    if (c) { found = c as Record<string, unknown>; pipe = p; break; }
  }
  if (!found || !pipe) return null;
  const c = found;

  const key = clientStageKey(c.stage as string | undefined);
  const realId = (c.candidateId as string) || (c.candidateCode as string) || (c.code as string);
  const assess = (assessments || []).find((a) => {
    const rec = a as Record<string, unknown>;
    return rec.candidateId === realId
      || (rec.candidateCode && rec.candidateCode === (c.candidateCode || c.code))
      || (rec.candidateEmail && c.email && rec.candidateEmail === c.email);
  });
  const assessScore = (assess as Record<string, unknown> | undefined)?.nearworkScore;
  const score = typeof assessScore === "number" ? assessScore : (typeof c.score === "number" ? (c.score as number) : 0);
  const opening = (openings || []).find((o) => o.code === pipe!.code);

  const name = (c.name as string) || "Candidate";
  const header: CandidateHeader = {
    id: candidateId,
    name,
    initials: initialsOf(name),
    avatarBg: avatarColor((c.candidateCode as string) || (c.code as string) || name),
    role: (c.role as string) || pipe.openingTitle || opening?.title || "",
    location: (c.location as string) || "",
    stage: STAGE_LABELS[key] || "Screening",
    stageIdx: stageIdxOf(key),
    score,
    openingId: pipe.code,
    match: Array.isArray(c.skills) ? (c.skills as string[]) : [],
    submittedDays: 0,
  };

  const salaryExp = (c.expectedSalary as string)
    || (typeof c.expectedSalaryAmount === "number" ? `$${(c.expectedSalaryAmount as number).toLocaleString()}` : undefined);

  const openingSkills = opening?.skills;
  const fitForRole = Array.isArray(openingSkills) && openingSkills.length
    ? { mustHave: openingSkills }
    : (typeof openingSkills === "string" && openingSkills ? { mustHave: [openingSkills] } : undefined);

  return {
    candidate: header,
    openingId: pipe.code,
    discColors: DISC_COLORS,
    discDims: DISC_DIMS,
    stageOrder: STAGE_ORDER,
    snapshot: salaryExp ? { salaryExp } : undefined,
    fitForRole,
    // Rich report not stored yet → clean pending state until the Nearwork Score /
    // assessment data is built.
    completed: false,
  };
}
