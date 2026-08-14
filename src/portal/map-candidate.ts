// ── Real data → Candidate detail props (Stage 3 wiring) ───────────────────────
// Header from the pipeline entry; the rich report (English / Assessment / DISC /
// radar) from the parsed assessments doc once Admin has uploaded the PDFs. If the
// rich data isn't there yet, the screen shows its clean "pending" state.

import { isNearworkEmail, type PortalOpening, type PortalPipeline, type PortalAssessment, type PortalNote, type PortalRequest } from "@/lib/firebase-client";
import type { CandidateData, CandidateHeader, CandidateDiscDim, CandidateNote, CandidateRequest } from "./screens/candidate";
import { clientStageKey, stageIdxOf, STAGE_LABELS, sourcingStageKey, sourcingStageIdx, SOURCING_STAGE_LABELS, avatarColor, initialsOf } from "./stage-map";
import { yearsFromWorkHistory, tzFromLocation } from "./candidate-derive";

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

const matchCandIn = (p: PortalPipeline, candidateId: string): Rec | undefined =>
  (p.candidates || []).find((x) => {
    const rec = x as Rec;
    return (rec.candidateCode || rec.code || "") === candidateId || rec.candidateId === candidateId;
  }) as Rec | undefined;

// Locate the raw pipeline-candidate + its pipeline by the id the UI navigates with,
// preferring the pipeline the candidate was opened from. Shared by the detail
// mapper and the note writer so both resolve the same record.
export function findPipelineCandidate(
  pipelines: PortalPipeline[],
  candidateId?: string | null,
  pipelineCode?: string | null,
): { c: Rec; pipe: PortalPipeline } | null {
  if (!candidateId) return null;
  if (pipelineCode) {
    const pp = (pipelines || []).find((p) => p.code === pipelineCode);
    const c = pp ? matchCandIn(pp, candidateId) : undefined;
    if (pp && c) return { c, pipe: pp };
  }
  for (const p of pipelines || []) {
    const c = matchCandIn(p, candidateId);
    if (c) return { c, pipe: p };
  }
  return null;
}

const tsOf = (v: unknown): number => {
  const r = asRec(v);
  return typeof r.seconds === "number" ? r.seconds : 0;
};
// Two spellings reach us: `linkedIn` on records typed in through Admin, `linkedin`
// on ones the X-ray sourced, plus a bare `/in/slug` match key. All three are real
// profiles, and a client seeing no link because of a capital letter would look
// exactly like a candidate who has no LinkedIn at all.
function linkedinUrl(c: Rec): string | undefined {
  const raw = strOr(c.linkedIn) || strOr(c.linkedin) || strOr(c.li);
  if (!raw) return undefined;
  const v = raw.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(www\.)?linkedin\.com/i.test(v)) return "https://" + v;
  const slug = v.replace(/^\/?(in\/)?/i, "");
  return slug ? "https://www.linkedin.com/in/" + slug : undefined;
}

function fmtNoteDate(v: unknown): string {
  const secs = tsOf(v);
  if (!secs) return "Just now";
  const d = new Date(secs * 1000);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// candidateNotes for this candidate → the screen's note shape, newest first.
// The org-scoped subscription already excludes notes this client may not read
// (Nearwork-internal), so we only translate + tag them here.
function toCandidateNotes(notes: PortalNote[], c: Rec, realId: string): CandidateNote[] {
  const code = (c.candidateCode || c.code || "") as string;
  return (notes || [])
    .filter((n) => (n.candidateCode && n.candidateCode === code) || (n.candidateId && n.candidateId === realId))
    .sort((a, b) => tsOf(b.createdAt) - tsOf(a.createdAt))
    .map((n) => ({
      author: n.author || n.authorName || "Someone",
      date: fmtNoteDate(n.createdAt),
      text: n.text || n.body || "",
      recruiter: n.side === "nearwork" || isNearworkEmail(n.authorEmail),
      internal: n.scope === "client_internal" || n.visibility === "client_internal",
    }));
}

// The client's latest pending request on this candidate, if any.
function toCandidateRequest(requests: PortalRequest[], c: Rec, realId: string): CandidateRequest | undefined {
  const code = (c.candidateCode || c.code || "") as string;
  const mine = (requests || [])
    .filter((r) => (r.candidateCode && r.candidateCode === code) || (r.candidateId && r.candidateId === realId))
    .filter((r) => (r.status || "pending") === "pending")
    .sort((a, b) => tsOf(b.createdAt) - tsOf(a.createdAt));
  const r = mine[0];
  if (!r) return undefined;
  const t = (r.type as CandidateRequest["type"]) || "advance";
  return {
    type: ["advance", "hire", "reject", "interview"].includes(t) ? t : "advance",
    toStage: r.toStage || undefined,
    reason: r.reason || undefined,
    status: r.status || "pending",
    date: fmtNoteDate(r.createdAt),
    by: r.requestedBy || undefined,
  };
}

export function toCandidateData(
  pipelines: PortalPipeline[],
  openings: PortalOpening[],
  assessments: PortalAssessment[],
  candidateId?: string | null,
  pipelineCode?: string | null,
  notes: PortalNote[] = [],
  requests: PortalRequest[] = [],
): CandidateData | null {
  if (!candidateId) return null;

  const matchCand = (p: PortalPipeline): Rec | undefined => matchCandIn(p, candidateId);

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

  // Fall back to the opening's flag: the pipeline doc's pipelineType can be missing
  // if the opening was switched to Sourcing before the pipeline doc existed.
  const openingForPipe = (openings || []).find((o) => o.code === pipe!.code);
  const isSourcingPipe = pipe.pipelineType === "sourcing" || openingForPipe?.pipelineType === "sourcing";
  const key = clientStageKey(c.stage as string | undefined);
  const sKey = isSourcingPipe ? sourcingStageKey(c.stage as string | undefined) : null;
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
    stage: isSourcingPipe ? (SOURCING_STAGE_LABELS[sKey!] || "Sourced") : (STAGE_LABELS[key] || "Screening"),
    stageIdx: isSourcingPipe ? sourcingStageIdx(sKey!) : stageIdxOf(key),
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

  // Snapshot from the embedded profile — shown for sourcing without an assessment.
  const snap: Record<string, unknown> = {};
  if (salaryExp) snap.salaryExp = salaryExp;
  const availability = strOr(c.availability);
  if (availability) snap.availability = availability;
  const phone = strOr(c.phone);
  if (phone) snap.phone = phone;
  const linkedin = linkedinUrl(c);
  if (linkedin) snap.linkedin = linkedin;
  const timezone = strOr(c.timezone) || tzFromLocation(header.location);
  if (timezone) snap.timezone = timezone;

  // Work history + resume come straight from the embedded snapshot.
  const strList = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => strOr(x)).filter(Boolean) : [];
  const workHistory = Array.isArray(c.workHistory)
    ? (c.workHistory as Array<Record<string, unknown>>)
        .map((w) => ({
          company: strOr(w.company),
          title: strOr(w.title),
          from: strOr(w.from),
          to: strOr(w.to),
          location: strOr(w.location),
          // Accomplishments are the reason a client shortlists someone — carry
          // them through rather than showing job titles alone.
          accomplishments: strList(w.accomplishments),
          responsibilities: strList(w.responsibilities),
        }))
        .filter((w) => w.company || w.title)
    : undefined;
  const tools = strList(c.tools);
  const education = Array.isArray(c.education)
    ? (c.education as Array<Record<string, unknown>>)
        .map((e) => ({
          degree: strOr(e.degree),
          field: strOr(e.field),
          institution: strOr(e.institution),
          endYear: typeof e.endYear === "number" ? e.endYear : undefined,
        }))
        .filter((e) => e.degree || e.institution)
    : [];
  const resumeUrl = strOr(c.resumeUrl) || strOr(c.cvUrl) || undefined;

  // Experience: prefer the stored number, else compute the span from work history
  // (so "0 yrs" from a missing field becomes a real number, or "—" when unknown).
  const expYears = (typeof c.experience === "number" && c.experience > 0) ? c.experience : yearsFromWorkHistory(workHistory);
  if (expYears != null) snap.experience = expYears;

  const base: CandidateData = {
    candidate: header,
    openingId: pipe.code,
    pipelineType: pipe.pipelineType === "sourcing" ? "sourcing" : "full",
    pipelineCode: pipe.code,
    candidateRealId: realId,
    rawStage: strOr(c.stage),
    discColors: DISC_COLORS,
    discDims: DISC_DIMS,
    stageOrder: STAGE_ORDER,
    snapshot: Object.keys(snap).length ? snap : undefined,
    workHistory: workHistory && workHistory.length ? workHistory : undefined,
    tools: tools.length ? tools : undefined,
    education: education.length ? education : undefined,
    resumeUrl,
    fitForRole,
    completed: false,
    notes: toCandidateNotes(notes, c, realId),
    request: toCandidateRequest(requests, c, realId),
  };

  // English level embedded on the entry (sourcing has no assessment English). The
  // rich-report block below overrides this with the graded result when present.
  const embeddedEnglish = strOr(c.english).toUpperCase();
  if (embeddedEnglish) {
    const CEFR_PCT: Record<string, number> = { A1: 20, A2: 35, B1: 55, B2: 72, C1: 88, C2: 98 };
    const lvl = (["A1", "A2", "B1", "B2", "C1", "C2"].includes(embeddedEnglish) ? embeddedEnglish : "B2") as "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    base.english = { level: lvl, score: CEFR_PCT[lvl] ?? 0, summary: "" };
  }

  // ── Rich report (once the assessment PDF has been parsed) ──────────────────
  const rawQuestions = Array.isArray(A.questions) ? (A.questions as Rec[]) : [];
  const hasAssessment = rawQuestions.length > 0 || typeof A.overallScore === "number";
  if (!hasAssessment) return base;

  const questions = rawQuestions.map((q) => ({
    n: numOr(q.n),
    prompt: strOr(q.prompt),
    competency: strOr(q.competency) || `Question ${numOr(q.n)}`,
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
    // Six universal competency axes — the same on every role. English + Assessment
    // come straight from their scores; the four soft skills are derived from the
    // question scores (default fixed-order mapping until a per-question competency
    // mapping is provided).
    const engScore = base.english?.score ?? 0;
    const assessScore = base.assessment?.overall ?? 0;
    const qpct = questions.map((q) => Math.round((q.score / 5) * 100));
    const avgQ = qpct.length ? Math.round(qpct.reduce((a, b) => a + b, 0) / qpct.length) : assessScore;
    const at = (i: number) => (qpct[i] != null ? qpct[i] : avgQ);
    const communication = qpct.length > 4 ? Math.round((at(0) + at(4)) / 2) : at(0);
    base.radar = {
      axes: ["Communication", "Problem solving", "Adaptability", "Leadership", "English", "Assessment"],
      candidate: [communication, at(1), at(2), at(3), engScore, assessScore],
      average: [70, 70, 70, 70, 70, 70],
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
