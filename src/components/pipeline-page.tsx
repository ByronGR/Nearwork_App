"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Users,
} from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  auth,
  getClientUser,
  getOrganization,
  getOrgForPipelineCode,
  isNearworkEmail,
  logoutClient,
  subscribeOrgCollection,
  type ClientUser,
  type Organization,
  type PortalAssessment,
  type PortalCandidate,
  type PortalPipeline,
  type PipelineCandidate,
  readableRole,
} from "@/lib/firebase-client";

// ─── helpers ───────────────────────────────────────────────────────────────

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function initials(name = "NW") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "NW"
  );
}

function candidateKey(c: PortalCandidate | PipelineCandidate) {
  return (c as PortalCandidate).code || (c as PipelineCandidate).candidateCode || c.email || c.name || "";
}

// Client-side stage mapping (same logic as client-portal.tsx)
const clientStages = [
  { key: "applied",      label: "Applied"      },
  { key: "screening",    label: "Screening"    },
  { key: "technical",    label: "Technical"    },
  { key: "final-round",  label: "Final Round"  },
  { key: "offer",        label: "Offer"        },
  { key: "not-selected", label: "Not Selected" },
];

function clientStageKey(stage?: string): string {
  const s = String(stage || "").toLowerCase().replace(/[-_ ]/g, "");
  // Admin stages: applied, background-check, interview, assessment,
  //               partner-review, partner-interview, hired, not-selected
  // "partner" must be checked before "interview" so partner-interview
  // lands in final-round, not technical.
  if (s.includes("pass") || s.includes("reject") || s.includes("notselect") || s.includes("declined") || s.includes("disqualif")) return "not-selected";
  if (s.includes("hired") || s.includes("offer")) return "offer";
  if (s.includes("partner") || s.includes("present") || s.includes("clientview") || s.includes("clientreview") || s.includes("final")) return "final-round";
  if (s.includes("interview") || s.includes("assess") || s.includes("tech") || s.includes("test")) return "technical";
  if (s.includes("background") || s.includes("screening") || s.includes("profile")) return "screening";
  return "applied";
}

const stageTone: Record<string, string> = {
  "applied":      "border-sky-200 bg-sky-50 text-sky-700",
  "screening":    "border-violet-200 bg-violet-50 text-violet-700",
  "technical":    "border-amber-200 bg-amber-50 text-amber-800",
  "final-round":  "border-teal-200 bg-teal-50 text-teal-700",
  "offer":        "border-emerald-200 bg-emerald-50 text-emerald-700",
  "not-selected": "border-red-200 bg-red-50 text-red-700",
};

function salaryText(candidate: PipelineCandidate | PortalCandidate) {
  const amount = Number((candidate as PortalCandidate).expectedSalaryAmount || 0);
  const currency = String((candidate as PortalCandidate).expectedSalaryCurrency || "USD").toUpperCase();
  if (!amount && !(candidate as PortalCandidate).expectedSalary) return "Not shared";
  const usdAmount = currency === "COP" ? amount / 3900 : amount;
  if (!usdAmount) return (candidate as PortalCandidate).expectedSalary || "USD pending";
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(usdAmount))} USD/mo`;
}

// ─── sub-components ────────────────────────────────────────────────────────

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", tone || "border-[#E5E4E0] bg-[#F5F4F0] text-[#555]")}>
      {children}
    </span>
  );
}

function Score({ value = 0 }: { value?: number }) {
  const score = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="grid size-9 place-items-center rounded-full" style={{ background: `conic-gradient(#12866E ${score * 3.6}deg, #E5E4E0 0deg)` }}>
      <div className="grid size-6 place-items-center rounded-full bg-white text-xs font-semibold text-[#111]">{score || "—"}</div>
    </div>
  );
}

function KanbanCard({ item, candidates, onClick }: {
  item: PipelineCandidate;
  candidates: PortalCandidate[];
  onClick: () => void;
}) {
  const key = candidateKey(item);
  const full = candidates.find(c => c.code === key || c.email === key) || null;
  const name = full?.name || item.name || item.email || "Candidate";
  const role = full?.role || item.role || "";
  const score = Number(full?.score || full?.lastAssessmentScore || item.score || 0);
  const skills = (full?.skills || item.skills || []).slice(0, 3);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-[#E5E4E0] bg-white p-3 text-left transition hover:border-[#12866E] hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {full?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={full.photoUrl} alt={name} className="size-7 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#EEF6F3] text-[10px] font-semibold text-[#12866E]">{initials(name)}</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#111]">{name}</p>
            {role ? <p className="mt-0.5 truncate text-xs text-[#555]">{role}</p> : null}
          </div>
        </div>
        {score ? <Score value={score} /> : null}
      </div>
      {skills.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {skills.map((s) => <span key={s} className="rounded-full bg-[#F5F4F0] px-2 py-0.5 text-[10px] text-[#555]">{s}</span>)}
        </div>
      ) : null}
      <p className="mt-2 text-[10px] text-[#888]">{salaryText(full || item)}</p>
    </button>
  );
}

function CandidateDrawer({ item, candidates, pipeline, onClose }: {
  item: PipelineCandidate;
  candidates: PortalCandidate[];
  pipeline: PortalPipeline;
  onClose: () => void;
}) {
  const key = candidateKey(item);
  const full = candidates.find(c => c.code === key || c.email === key) || null;
  const name = full?.name || item.name || item.email || "Candidate";
  const score = Number(full?.score || full?.lastAssessmentScore || item.score || 0);
  const stageKey = clientStageKey(item.stage);
  const stageLabel = clientStages.find(s => s.key === stageKey)?.label || item.stage || "Screening";

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="relative flex h-full w-[min(440px,100vw)] flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#E5E4E0] px-5 py-4">
          <div className="flex items-center gap-3">
            {full?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={full.photoUrl} alt={name} className="size-10 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EEF6F3] text-sm font-semibold text-[#12866E]">{initials(name)}</div>
            )}
            <div>
              <h2 className="text-lg font-bold text-[#111]">{name}</h2>
              <p className="text-sm text-[#555]">{full?.role || item.role || ""} · {full?.location || full?.city || "Colombia"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-[#111]">✕</button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Score + stage */}
          <div className="flex items-center gap-4">
            <Score value={score} />
            <div>
              <p className="text-xs text-[#888]">Stage</p>
              <Badge tone={stageTone[stageKey ?? "screening"]}>{stageLabel}</Badge>
            </div>
            {full?.discProfile?.label ? (
              <div>
                <p className="text-xs text-[#888]">DISC</p>
                <p className="text-sm font-medium text-[#111]">{full.discProfile.label}</p>
              </div>
            ) : null}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs font-medium uppercase tracking-wider text-[#888]">Expected pay</p><p className="mt-1 text-sm font-semibold">{salaryText(full || item)}</p></div>
            <div><p className="text-xs font-medium uppercase tracking-wider text-[#888]">English</p><p className="mt-1 text-sm font-semibold">{full?.english || item.english || "—"}</p></div>
            <div><p className="text-xs font-medium uppercase tracking-wider text-[#888]">Location</p><p className="mt-1 text-sm font-semibold">{full?.location || full?.city || "Colombia"}</p></div>
            <div><p className="text-xs font-medium uppercase tracking-wider text-[#888]">Nearwork score</p><p className="mt-1 text-sm font-semibold text-[#12866E]">{score || "Pending"}</p></div>
          </div>

          {/* Skills */}
          {(full?.skills || item.skills || []).length ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#888]">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(full?.skills || item.skills || []).map(s => <Badge key={s}>{s}</Badge>)}
              </div>
            </div>
          ) : null}

          {/* AI Insights */}
          {full?.aiReview?.client ? (
            <div className="rounded-xl border border-[#E5E4E0] bg-[#F8F7F3] p-4 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-[#888]">AI Assessment review</p>
              {full.aiReview.summaryTitle ? <p className="text-sm font-semibold text-[#111]">{full.aiReview.summaryTitle}</p> : null}
              {full.aiReview.client.summary ? <p className="text-sm leading-6 text-[#555]">{full.aiReview.client.summary}</p> : null}
              {(full.aiReview.client.strengths || []).length ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-[#12866E]">Strengths</p>
                  <ul className="space-y-1">
                    {(full.aiReview.client.strengths || []).map((s, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[#555]"><span className="mt-0.5 shrink-0 text-[#12866E]">✓</span>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(full.aiReview.client.watchouts || []).length ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-amber-600">Watch-outs</p>
                  <ul className="space-y-1">
                    {(full.aiReview.client.watchouts || []).map((w, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[#555]"><span className="mt-0.5 shrink-0 text-amber-500">⚠</span>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Links */}
          <div className="flex gap-2">
            {full?.cvUrl ? (
              <a href={full.cvUrl} target="_blank" rel="noreferrer" className="flex h-8 items-center gap-1.5 rounded-md border border-[#E5E4E0] bg-white px-3 text-xs font-medium text-[#555] hover:border-[#12866E] hover:text-[#12866E]">
                CV / Resume
              </a>
            ) : null}
            {full?.linkedin ? (
              <a href={full.linkedin} target="_blank" rel="noreferrer" className="flex h-8 items-center gap-1.5 rounded-md border border-[#E5E4E0] bg-white px-3 text-xs font-medium text-[#555] hover:border-[#12866E] hover:text-[#12866E]">
                LinkedIn
              </a>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}


// ─── main component ─────────────────────────────────────────────────────────

export function PipelinePage({ code }: { code: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientUser | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [pipeline, setPipeline] = useState<PortalPipeline | null>(null);
  const [candidates, setCandidates] = useState<PortalCandidate[]>([]);
  const [assessments, setAssessments] = useState<PortalAssessment[]>([]);
  const [selected, setSelected] = useState<PipelineCandidate | null>(null);

  // Auth
  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    if (!nextUser) { setUser(null); setProfile(null); setOrg(null); return; }
    setUser(nextUser);
    try {
      const nextProfile = await getClientUser(nextUser);
      const staff = isNearworkEmail(nextProfile?.email);
      const role = String(nextProfile?.role || nextProfile?.portalRole || "").toLowerCase();
      const allowed = staff || (role.includes("client") || role.includes("org") || role === "viewer" || role === "user" || role === "admin");
      if (!nextProfile || !allowed) {
        setAuthMessage("This email is not invited to the client portal.");
        await logoutClient();
        return;
      }
      // Staff have no fixed org — resolve it from the pipeline they're opening.
      const nextOrg = staff ? await getOrgForPipelineCode(code) : await getOrganization(nextProfile);
      if (!nextOrg) { setAuthMessage("No organization found for this account."); await logoutClient(); return; }
      setProfile(nextProfile);
      setOrg(nextOrg);
    } catch {
      setAuthMessage("Could not load your profile. Please refresh.");
    }
  }), [code]);

  // Org data
  useEffect(() => {
    if (!org) return;
    const unsubscribers = [
      subscribeOrgCollection<PortalPipeline>("pipelines", org, (items) => {
        const found = items.find(p => p.code === code || p.id === code);
        if (found) setPipeline(found);
      }),
      subscribeOrgCollection<PortalCandidate>("candidates", org, (rows) => {
        setCandidates(rows.map(r => ({ ...r, code: r.code || r.candidateCode || r.id })));
      }),
      subscribeOrgCollection<PortalAssessment>("assessments", org, setAssessments),
    ];
    return () => unsubscribers.forEach(u => u());
  }, [org, code]);

  // Enrich candidates with AI review
  const enrichedCandidates = useMemo(() => {
    const insightMap = new Map<string, PortalAssessment>();
    assessments.filter(a => a.latestAiReviewClient || a.latestAiReviewVisuals).forEach(a => {
      if (a.candidateCode) insightMap.set(a.candidateCode.toLowerCase(), a);
      if (a.candidateEmail) insightMap.set(a.candidateEmail.toLowerCase(), a);
    });
    return candidates.map(c => {
      const k = (c.code || c.candidateCode || "").toLowerCase();
      const e = (c.email || "").toLowerCase();
      const assessment = insightMap.get(k) || insightMap.get(e);
      if (!assessment) return c;
      return {
        ...c,
        aiReview: {
          ...(assessment.latestAiReviewVisuals || {}),
          client: assessment.latestAiReviewClient,
        } as PortalCandidate["aiReview"],
      };
    });
  }, [candidates, assessments]);

  // Loading / auth states
  if (!user || authMessage) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8F7F3] text-[#111]">
        <div className="rounded-xl border border-[#E5E4E0] bg-white p-8 text-center shadow-sm">
          {authMessage ? (
            <>
              <p className="font-semibold text-[#111]">{authMessage}</p>
              <a href="/" className="mt-4 block text-sm text-[#12866E] hover:underline">← Back to portal</a>
            </>
          ) : (
            <>
              <div className="mx-auto size-8 animate-spin rounded-full border-2 border-[#E5E4E0] border-t-[#12866E]" />
              <p className="mt-3 text-sm text-[#555]">Loading…</p>
            </>
          )}
        </div>
      </main>
    );
  }

  if (!profile || !org) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8F7F3] text-[#111]">
        <div className="size-8 animate-spin rounded-full border-2 border-[#E5E4E0] border-t-[#12866E]" />
      </main>
    );
  }

  // Only show candidates that have been reviewed and approved into the pipeline.
  // (pendingReview: true means they're still in the Applicants inbox in Admin.)
  const pipelineItems = (pipeline?.candidates || []).filter(
    (c) => !(c as { pendingReview?: boolean }).pendingReview
  );

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#111]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-[#E5E4E0] bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-sm font-medium text-[#555] hover:text-[#111]">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:block">Back to portal</span>
          </a>
          <div className="mx-4 h-5 w-px bg-[#E5E4E0]" />
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-md bg-[#12866E] text-sm font-bold text-white">N</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111]">{pipeline?.openingTitle || code}</p>
              <p className="text-xs text-[#888]">{org.name} · {pipelineItems.length} candidate{pipelineItems.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#888]">
            <span>{readableRole(profile.displayRole || profile.jobTitle || profile.portalRole || profile.role)}</span>
            <div className="grid size-7 place-items-center rounded-full bg-[#EEF6F3] text-[10px] font-semibold text-[#12866E]">
              {initials(profile.name || profile.email || "NW")}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {!pipeline ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BriefcaseBusiness className="mb-4 size-10 text-[#E5E4E0]" />
            <p className="font-semibold text-[#111]">Pipeline not found</p>
            <p className="mt-1 text-sm text-[#555]">The pipeline "{code}" was not found in your organization.</p>
            <a href="/" className="mt-4 text-sm font-medium text-[#12866E] hover:underline">← Back to portal</a>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            {/* Left: pipeline info + kanban */}
            <div className="space-y-5">
              {/* Opening summary */}
              <div className="rounded-xl border border-[#E5E4E0] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#888]">Opening</p>
                    <h1 className="mt-1 text-xl font-bold text-[#111]">{pipeline.openingTitle || pipeline.code}</h1>
                    <p className="mt-1 text-sm text-[#555]">{org.name} · Code: {pipeline.openingCode || pipeline.code}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {String(pipeline.status || "active")}
                    </span>
                    <a
                      href={`/pipeline/${code}/kickoff`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E4E0] bg-white px-3 py-1.5 text-xs font-semibold text-[#555] hover:border-[#16A085] hover:text-[#16A085] transition-colors"
                    >
                      📋 Kick-off Brief
                    </a>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E5E4E0] pt-4 sm:grid-cols-4">
                  <div><p className="text-xs font-medium uppercase tracking-wider text-[#888]">Candidates</p><p className="mt-1 text-lg font-bold text-[#111]">{pipelineItems.length}</p></div>
                  <div><p className="text-xs font-medium uppercase tracking-wider text-[#888]">Final round</p><p className="mt-1 text-lg font-bold text-[#111]">{pipelineItems.filter(c => clientStageKey(c.stage) === "final-round").length}</p></div>
                  <div><p className="text-xs font-medium uppercase tracking-wider text-[#888]">Offers</p><p className="mt-1 text-lg font-bold text-[#111]">{pipelineItems.filter(c => clientStageKey(c.stage) === "offer").length}</p></div>
                  <div><p className="text-xs font-medium uppercase tracking-wider text-[#888]">Recruiter</p><p className="mt-1 text-sm font-medium text-[#111]">{pipeline.recruiter || "Nearwork"}</p></div>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                  <div className="grid min-w-[1080px] grid-cols-6 gap-3">
                    {clientStages.map((stage) => {
                      const stageItems = pipelineItems.filter(c => clientStageKey(c.stage) === stage.key);
                      return (
                        <section key={stage.key} className="min-h-[200px] rounded-xl border border-[#E5E4E0] bg-[#F8F7F3] p-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-[#555]">{stage.label}</p>
                            <span className="rounded-full border border-[#E5E4E0] bg-white px-2 py-0.5 text-xs text-[#888]">{stageItems.length}</span>
                          </div>
                          <div className="space-y-2">
                            {stageItems.map((item) => (
                              <KanbanCard
                                key={candidateKey(item)}
                                item={item}
                                candidates={enrichedCandidates}
                                onClick={() => setSelected(item)}
                              />
                            ))}
                            {!stageItems.length ? (
                              <div className="rounded-lg border border-dashed border-[#E5E4E0] p-3 text-center text-xs text-[#888]">Empty</div>
                            ) : null}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
            </div>

            {/* Right: quick stats */}
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E5E4E0] bg-white p-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-[#888]">Pipeline breakdown</p>
                <div className="space-y-2">
                  {clientStages.map((stage) => {
                    const count = pipelineItems.filter(c => clientStageKey(c.stage) === stage.key).length;
                    const pct = pipelineItems.length ? Math.round((count / pipelineItems.length) * 100) : 0;
                    return (
                      <div key={stage.key}>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#555]">{stage.label}</span>
                          <span className="font-medium text-[#111]">{count}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-[#F5F4F0]">
                          <div className="h-1.5 rounded-full bg-[#12866E] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Share URL hint */}
              <div className="rounded-xl border border-[#E5E4E0] bg-[#F8F7F3] p-4">
                <p className="text-xs font-medium text-[#555]">Shareable link</p>
                <p className="mt-1 break-all font-mono text-[11px] text-[#888]">
                  {typeof window !== "undefined" ? window.location.href : `https://app.nearwork.co/pipeline/${code}`}
                </p>
                <button
                  onClick={() => navigator.clipboard?.writeText(typeof window !== "undefined" ? window.location.href : "")}
                  className="mt-2 rounded-md border border-[#E5E4E0] bg-white px-3 py-1.5 text-xs font-medium text-[#555] hover:border-[#12866E] hover:text-[#12866E]"
                >
                  Copy link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Candidate detail drawer */}
      {selected && pipeline ? (
        <CandidateDrawer
          item={selected}
          candidates={enrichedCandidates}
          pipeline={pipeline}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
