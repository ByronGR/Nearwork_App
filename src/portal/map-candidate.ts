// ── Real data → Candidate detail props (Stage 3 wiring) ───────────────────────
// Header from the pipeline entry; the rich report (English / Assessment / DISC /
// radar) from the parsed assessments doc once Admin has uploaded the PDFs. If the
// rich data isn't there yet, the screen shows its clean "pending" state.

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
const DISC_LABEL: Record<string, string> = { D: "Dominance", I: "Influence", S: "Steadiness", C: "Conscientiousness" };
const STAGE_ORDER = ["Applied", "Screening", "Technical", "Final round", "Offer", "Not selected"];

type Rec = Record<string, unknown>;
const asRec = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});
const numOr = (v: unknown, d = 0) => (typeof v === "number" ? v : d);
const strOr = (v: unknown, d = "") => (typeof v === "string" ? v : d);

export function toCandidateData(
  pipelines: PortalPipeline[],
  openings: PortalOpening[],
  assessments: PortalAssessment[],
  candidateId?: string | null,
  pipelineCode?: string | null,
): CandidateData | null {
  if (!candidateId) return null;

  const matchCand = (p: PortalPipeline): Rec | undefined =>
    (p.candidates || []).find((x) => {
      const rec = x as Rec;
      return (rec.candidateCode || rec.code || "") === candidateId || rec.candidateId === candidateId;
    }) as Rec | undefined;

  let found: Rec | undefined;
  let pipe: PortalPipeline | undefined;
  // Prefer the pipeline the candidate was opened from (so we show that role's assessment).
  if (pipelineCode) {
    const pp = (pipelines || []).find((p) => p.code === pipelineCode);
    const c = pp ? matchCand(pp) : undefined;
    if (pp && c) { found = c; pipe = pp; }
  }
  if (!found) {
    for (const p of pipelines || []) {
      const c = matchCand(p);
      if (c) { found = c; pipe = p; break; }
    }
  }
  if (!found || !pipe) return null;
  const c = found;

  const key = clientStageKey(c.stage as string | undefined);
  const realId = (c.candidateId as string) || (c.candidateCode as string) || (c.code as string);
  // Assessments are per (candidate, role/pipeline) — match this role's result only.
  const A = asRec(
    (assessments || []).find((a) => {
      const rec = a as Rec;
      if (rec.pipelineCode !== pipe!.code) return false;
      return rec.candidateId === realId
        || (rec.candidateCode && rec.candidateCode === (c.candidateCode || c.code))
        || (rec.candidateEmail && c.email && rec.candidateEmail === c.email);
    }),
  );

  const score = typeof A.nearworkScore === "number"
    ? A.nearworkScore
    : (typeof A.overallScore === "number" ? A.overallScore : numOr(c.score, 0));
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

  const base: CandidateData = {
    candidate: header,
    openingId: pipe.code,
    discColors: DISC_COLORS,
    discDims: DISC_DIMS,
    stageOrder: STAGE_ORDER,
    snapshot: salaryExp ? { salaryExp } : undefined,
    fitForRole,
    completed: false,
  };

  // ── Rich report (once the assessment PDF has been parsed) ──────────────────
  const rawQuestions = Array.isArray(A.questions) ? (A.questions as Rec[]) : [];
  const hasAssessment = rawQuestions.length > 0 || typeof A.overallScore === "number";
  if (!hasAssessment) return base;

  const questions = rawQuestions.map((q) => ({
    n: numOr(q.n),
    prompt: strOr(q.prompt),
    competency: `Question ${numOr(q.n)}`,
    score: numOr(q.score),
    max: 5,
    answer: strOr(q.answer),
    feedback: strOr(q.feedback),
    followUp: q.followUp && typeof q.followUp === "object"
      ? { q: strOr((q.followUp as Rec).q), a: strOr((q.followUp as Rec).a) }
      : undefined,
  }));

  const integ = asRec(A.integrity);
  base.completed = A.status === "completed" || typeof A.overallScore === "number";
  base.submittedMeta = { submitted: strOr(A.submitted), gradedBy: strOr(A.gradedBy, "Nearwork talent team") };
  base.assessment = {
    overall: numOr(A.overallScore),
    passing: numOr(A.passingScore, 70),
    status: A.result === "PASSED" ? "passed" : "failed",
    integrity: {
      risk: numOr(integ.risk),
      tabSwitches: numOr(integ.tabSwitches),
      copyPaste: numOr(integ.copyPaste),
      focusLosses: numOr(integ.focusLosses),
    },
    summary: strOr(A.summary),
    questions,
  };

  const eng = asRec(A.english);
  if (eng.level || typeof eng.score === "number") {
    base.english = {
      level: strOr(eng.level, "B2") as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
      score: numOr(eng.score),
      summary: strOr(eng.summary),
    };
  }

  const disc = asRec(A.disc);
  if (disc.type || disc.profiles) {
    const prof = asRec(disc.profiles);
    const dp = (v: unknown) => {
      const r = asRec(v);
      return { D: numOr(r.D), I: numOr(r.I), S: numOr(r.S), C: numOr(r.C) };
    };
    const t = strOr(disc.type, "D");
    base.disc = {
      type: (t as "D" | "I" | "S" | "C"),
      label: DISC_LABEL[t] || t,
      classification: strOr(disc.classification),
      headline: strOr(disc.headline),
      narrative: strOr(disc.narrative),
      profiles: { natural: dp(prof.natural), adapted: dp(prof.adapted), pressure: dp(prof.pressure) },
    };
  }

  if (questions.length) {
    base.radar = {
      axes: questions.map((q) => `Q${q.n}`),
      candidate: questions.map((q) => Math.round((q.score / 5) * 100)),
      average: questions.map(() => 70),
      cohortSize: 0,
    };
    const strong = questions.filter((q) => q.score >= 3.5);
    const weak = questions.filter((q) => q.score > 0 && q.score <= 2.5);
    base.highlights = {
      strengths: strong.map((q) => ({ label: q.competency, detail: q.feedback.slice(0, 160) })),
      watchOuts: weak.map((q) => ({ label: q.competency, detail: q.feedback.slice(0, 160) })),
    };
  }

  return base;
}
