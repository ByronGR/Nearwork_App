"use client";

import React, { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, ClipboardList, CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { auth, getClientUser, logoutClient, type ClientUser } from "@/lib/firebase-client";

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtSalaryRange(min?: number, max?: number, currency = "USD", payFrequency = "mo"): string | undefined {
  if (!min) return undefined;
  const code = (currency || "USD").toUpperCase();
  const locale = code === "COP" ? "es-CO" : "en-US";
  const fmt = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const amount = max && max !== min ? `$${fmt(min)} – $${fmt(max)}` : `$${fmt(min)}`;
  return `${amount} ${code} / ${payFrequency}`;
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface HistoryEntry {
  action: string;
  by: string;
  byRole: "nearwork" | "client";
  timestamp: string;
  note?: string;
}

interface KickoffBrief {
  id?: string;
  openingCode?: string;
  orgId?: string;
  status?: "draft" | "submitted" | "changes_requested" | "approved";

  // Section 1
  jobTitle?: string; department?: string; locationPolicy?: string;
  employmentType?: string; numberOfPositions?: number; targetStartDate?: string;
  urgency?: string; colombiaViable?: string; locationNotes?: string;

  // Section 2
  salaryMin?: number; salaryMax?: number; currency?: string; payFrequency?: string;
  signOnBonus?: string; variablePay?: string; equity?: string;
  benefitsPackage?: string; additionalPerks?: string;

  // Section 3
  roleSummary?: string; dayToDay?: string; success30?: string; success60?: string; success90?: string;
  keyResponsibilities?: string[];

  // Section 4
  mustHaveSkills?: string[]; niceToHaveSkills?: string[]; yearsOfExperience?: string;
  educationLevel?: string; fieldOfStudy?: string; englishLevel?: string;
  otherLanguages?: string; backgroundCheck?: string;
  requiredCertifications?: string[]; industryExperience?: string;

  // Section 5
  teamSize?: number; reportsToTitle?: string; reportsToName?: string;
  directReports?: number; workingStyle?: string; worksCloselyWith?: string;
  workingHours?: string; timezoneRequirements?: string;
  remotePolicyDetails?: string; teamCultureNotes?: string;

  // Section 6
  totalInterviewStages?: number; interviewLanguage?: string; timeToOffer?: string;
  interviewStages?: Array<{ name: string; format: string; interviewer: string; duration: string }>;
  assessmentRequired?: string; assessmentDetails?: string; rejectionCriteria?: string;

  // Section 7
  requiredTools?: string[]; techStack?: string[]; internalSystems?: string;
  trainingProvided?: string; trainingDetails?: string;

  // Section 8 (shown to client)
  assignedRecruiter?: string; accountManager?: string;
  sourcingStartDate?: string; candidateDeadline?: string;
  targetCandidateVolume?: number; reportingCadence?: string;
  reportingFormat?: string; sourcingChannels?: string[];
  searchStrategyNotes?: string;
  // internalNotes intentionally omitted — stripped server-side

  // Section 9
  contractType?: string; probationPeriod?: string; noticePeriod?: string;
  workAuthRequired?: string; nonCompeteNda?: string; equipmentProvidedBy?: string;

  // Section 10
  additionalNotes?: string; otherDiscussed?: string;

  // Meta
  history?: HistoryEntry[];
  nearworkApprovedBy?: string; clientApprovedBy?: string;
  submittedAt?: unknown; approvedAt?: unknown; createdAt?: unknown; updatedAt?: unknown;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function cx(...args: Array<string | false | undefined | null>) {
  return args.filter(Boolean).join(" ");
}

function fmt(val: unknown): string {
  if (val === undefined || val === null || val === "") return "—";
  if (Array.isArray(val)) return val.filter(Boolean).join(", ") || "—";
  return String(val);
}

function formatDate(ts: unknown): string {
  if (!ts) return "—";
  try {
    const d = new Date(String(ts));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(ts);
  }
}

function formatTs(ts: unknown): string {
  if (!ts) return "—";
  try {
    const d = new Date(String(ts));
    return (
      d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return String(ts);
  }
}

const ADMIN_API = "https://admin.nearwork.co/api/kickoff";

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:             { label: "Draft",            cls: "bg-[#F5F4F0] text-[#9E9E9E] border-[#E5E4E0]" },
    submitted:         { label: "Pending Your Review", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    changes_requested: { label: "Changes Requested", cls: "bg-amber-50 text-amber-800 border-amber-200" },
    approved:          { label: "Approved",          cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };
  const s = map[status || "draft"] || map.draft;
  return (
    <span className={cx("inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border", s.cls)}>
      {s.label}
    </span>
  );
}

function Section({
  icon, title, desc, children,
}: { icon: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E4E0] overflow-hidden mb-5">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E5E4E0] bg-[#FAFAF9]">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="text-sm font-bold text-[#111]">{title}</div>
          {desc && <div className="text-xs text-[#9E9E9E] mt-0.5">{desc}</div>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Row({ label, value, wide }: { label: string; value?: string | number | string[] | null; wide?: boolean }) {
  const display = fmt(value);
  if (display === "—") return null; // hide empty rows in client view
  return (
    <div className={cx("mb-4", wide ? "col-span-2" : "")}>
      <div className="text-[10px] font-semibold text-[#9E9E9E] uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm text-[#111] leading-relaxed">{display}</div>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items?: string[] }) {
  if (!items?.filter(Boolean).length) return null;
  return (
    <div className="mb-4">
      <div className="text-[10px] font-semibold text-[#9E9E9E] uppercase tracking-wide mb-2">{label}</div>
      <ul className="space-y-1.5">
        {items.filter(Boolean).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#111]">
            <span className="text-[#16A085] mt-1 text-xs">●</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8">{children}</div>;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function KickoffBriefPage({ code }: { code: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientUser | null>(null);
  const [brief, setBrief] = useState<KickoffBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Approve modal
  const [showApprove, setShowApprove] = useState(false);
  const [approveText, setApproveText] = useState("");

  // Request changes modal
  const [showChanges, setShowChanges] = useState(false);
  const [changesNote, setChangesNote] = useState("");

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { setLoading(false); }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const p = await getClientUser(user);
        setProfile(p);
        await fetchBrief(user);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchBrief = useCallback(async (u: User) => {
    const token = await u.getIdToken();
    const res = await fetch(ADMIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "get", code }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Failed to load brief");
    setBrief(data.brief);
  }, [code]);

  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function doApprove() {
    if (approveText.trim().toUpperCase() !== "APPROVE") return;
    setSubmitting(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch(ADMIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "approve", code }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setShowApprove(false);
      setApproveText("");
      showToast("Brief approved. Thank you!");
      await fetchBrief(user!);
    } catch (e) {
      showToast(String(e), "err");
    } finally {
      setSubmitting(false);
    }
  }

  async function doRequestChanges() {
    if (!changesNote.trim()) return;
    setSubmitting(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch(ADMIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "request_changes", code, note: changesNote }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setShowChanges(false);
      setChangesNote("");
      showToast("Change request sent to Nearwork.");
      await fetchBrief(user!);
    } catch (e) {
      showToast(String(e), "err");
    } finally {
      setSubmitting(false);
    }
  }

  // ── States ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#E5E4E0] border-t-[#16A085] animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-[#E5E4E0] p-10 text-center max-w-sm w-full">
        <div className="text-5xl mb-4">🔒</div>
        <div className="text-lg font-bold mb-2">Sign in required</div>
        <p className="text-sm text-[#555] mb-6">You need to be signed in to view this kick-off brief.</p>
        <a href="/login" className="inline-flex items-center justify-center w-full bg-[#16A085] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#12866E] transition-colors">
          Sign in to continue
        </a>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-[#E5E4E0] p-10 text-center max-w-sm w-full">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-base font-bold mb-2">Could not load brief</div>
        <p className="text-sm text-[#9E9E9E]">{error}</p>
      </div>
    </div>
  );

  if (!brief) return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-[#E5E4E0] p-10 text-center max-w-sm w-full">
        <ClipboardList className="mx-auto mb-4 text-[#9E9E9E]" size={40} />
        <div className="text-base font-bold mb-2">Brief not available yet</div>
        <p className="text-sm text-[#9E9E9E]">
          The Nearwork team hasn&apos;t created the kick-off brief for this role yet. Check back after your kick-off call.
        </p>
        <a href={`/pipeline/${code}`} className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-[#16A085] hover:underline">
          <ArrowLeft size={14} /> Back to pipeline
        </a>
      </div>
    </div>
  );

  const status = brief.status || "draft";
  const canAct = status === "submitted";
  const isApproved = status === "approved";
  const lastChangeRequest = [...(brief.history || [])].reverse().find(h => h.action === "changes_requested");
  const salary = fmtSalaryRange(brief.salaryMin, brief.salaryMax, brief.currency, brief.payFrequency || "mo");

  return (
    <div className="min-h-screen bg-[#F5F4F0]">

      {/* Toast */}
      {toast && (
        <div className={cx(
          "fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2",
          toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === "ok" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#111] h-14 flex items-center px-5 gap-4">
        <a href="/" className="text-lg font-black text-white tracking-tight">
          Near<span className="text-[#16A085]">work</span>
        </a>
        <div className="w-px h-4 bg-white/20" />
        <a href={`/pipeline/${code}`} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white">
          <ArrowLeft size={13} /> Back to pipeline
        </a>
        <div className="flex-1" />
        <StatusBadge status={status} />
        {profile && (
          <span className="text-xs text-white/50 hidden sm:block">{profile.name || profile.email}</span>
        )}
      </header>

      {/* ── Hero / action bar ───────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E4E0]">
        <div className="max-w-3xl mx-auto px-5 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList size={16} className="text-[#16A085]" />
                <span className="text-xs font-bold text-[#16A085] tracking-widest uppercase">Kick-off Brief</span>
              </div>
              <h1 className="text-xl font-bold text-[#111]">{brief.jobTitle || code}</h1>
              <p className="text-sm text-[#9E9E9E] mt-0.5">
                {code}{brief.employmentType ? ` · ${brief.employmentType}` : ""}
                {brief.locationPolicy ? ` · ${brief.locationPolicy}` : ""}
              </p>
            </div>
            {canAct && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowChanges(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors"
                >
                  <AlertTriangle size={14} /> Request changes
                </button>
                <button
                  onClick={() => setShowApprove(true)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#16A085] text-white text-sm font-semibold hover:bg-[#12866E] transition-colors"
                >
                  <CheckCircle2 size={14} /> Approve brief
                </button>
              </div>
            )}
          </div>

          {/* Status banners */}
          {isApproved && (
            <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
              <div>
                <div className="text-sm font-bold text-emerald-800">This brief has been approved by both parties</div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Nearwork: {brief.nearworkApprovedBy || "—"} · You: {brief.clientApprovedBy || "—"}
                </div>
              </div>
            </div>
          )}
          {status === "submitted" && (
            <div className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Clock className="text-blue-600 flex-shrink-0" size={18} />
              <div>
                <div className="text-sm font-bold text-blue-800">This brief is waiting for your approval</div>
                <div className="text-xs text-blue-700 mt-0.5">Review the sections below and approve or request changes.</div>
              </div>
            </div>
          )}
          {status === "changes_requested" && (
            <div className="mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <RefreshCw className="text-amber-600 flex-shrink-0" size={18} />
              <div>
                <div className="text-sm font-bold text-amber-800">You requested changes — Nearwork is updating the brief</div>
                {lastChangeRequest && (
                  <div className="text-xs text-amber-700 mt-0.5">&ldquo;{lastChangeRequest.note}&rdquo;</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Brief content ───────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-0">

        <Section icon="🎯" title="Role Overview" desc="Core position details">
          <Grid3>
            <Row label="Job Title" value={brief.jobTitle} />
            <Row label="Department" value={brief.department} />
            <Row label="Employment Type" value={brief.employmentType} />
            <Row label="Location Policy" value={brief.locationPolicy} />
            <Row label="Number of Positions" value={brief.numberOfPositions} />
            <Row label="Urgency" value={brief.urgency} />
            <Row label="Target Start Date" value={brief.targetStartDate ? formatDate(brief.targetStartDate) : undefined} />
            <Row label="Viable in Colombia" value={brief.colombiaViable} />
          </Grid3>
          {brief.locationNotes && <Row label="Location Notes" value={brief.locationNotes} wide />}
        </Section>

        <Section icon="💰" title="Compensation & Benefits">
          <Grid3>
            <Row label="Salary Range" value={salary} />
            <Row label="Pay Frequency" value={brief.payFrequency} />
            <Row label="Sign-on Bonus" value={brief.signOnBonus} />
          </Grid3>
          <Grid2>
            <Row label="Variable Pay / Commission" value={brief.variablePay} />
            <Row label="Equity / Options" value={brief.equity} />
            <Row label="Benefits Package" value={brief.benefitsPackage} />
            <Row label="Additional Perks" value={brief.additionalPerks} />
          </Grid2>
        </Section>

        <Section icon="📋" title="Role Description" desc="What this person will do and what success looks like">
          <Row label="Role Summary" value={brief.roleSummary} wide />
          <BulletList label="Key Responsibilities" items={brief.keyResponsibilities} />
          <Row label="Day-to-day Activities" value={brief.dayToDay} wide />
          {(brief.success30 || brief.success60 || brief.success90) && (
            <div className="mt-2 border border-[#E5E4E0] rounded-xl overflow-hidden">
              <div className="bg-[#FAFAF9] px-4 py-2.5 border-b border-[#E5E4E0] text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wide">
                Success Milestones
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E4E0]">
                {[["✅ 30 Days", brief.success30], ["🚀 60 Days", brief.success60], ["🏆 90 Days", brief.success90]].map(([label, val]) =>
                  val ? (
                    <div key={String(label)} className="px-4 py-4">
                      <div className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wide mb-2">{label}</div>
                      <div className="text-sm text-[#111] leading-relaxed">{String(val)}</div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </Section>

        <Section icon="🎓" title="Candidate Requirements">
          <Grid2>
            <BulletList label="Must-Have Skills" items={brief.mustHaveSkills} />
            <BulletList label="Nice-to-Have Skills" items={brief.niceToHaveSkills} />
          </Grid2>
          <Grid3>
            <Row label="Years of Experience" value={brief.yearsOfExperience} />
            <Row label="Education Level" value={brief.educationLevel} />
            <Row label="Field of Study" value={brief.fieldOfStudy} />
            <Row label="English Level" value={brief.englishLevel} />
            <Row label="Other Languages" value={brief.otherLanguages} />
            <Row label="Background Check" value={brief.backgroundCheck} />
          </Grid3>
          <BulletList label="Required Certifications" items={brief.requiredCertifications} />
          <Row label="Industry Experience" value={brief.industryExperience} wide />
        </Section>

        <Section icon="🤝" title="Team & Reporting Structure">
          <Grid3>
            <Row label="Team Size" value={brief.teamSize} />
            <Row label="Reports To (Title)" value={brief.reportsToTitle} />
            <Row label="Reports To (Person)" value={brief.reportsToName} />
            <Row label="Direct Reports" value={brief.directReports} />
            <Row label="Working Style" value={brief.workingStyle} />
            <Row label="Works Closely With" value={brief.worksCloselyWith} />
            <Row label="Working Hours" value={brief.workingHours} />
            <Row label="Timezone Overlap" value={brief.timezoneRequirements} />
          </Grid3>
          <Grid2>
            <Row label="Remote Policy Details" value={brief.remotePolicyDetails} />
            <Row label="Team Culture Notes" value={brief.teamCultureNotes} />
          </Grid2>
        </Section>

        <Section icon="💬" title="Interview Process">
          <Grid3>
            <Row label="Total Stages" value={brief.totalInterviewStages} />
            <Row label="Interview Language" value={brief.interviewLanguage} />
            <Row label="Time to Offer" value={brief.timeToOffer} />
          </Grid3>
          {brief.interviewStages?.filter(s => s.name).length ? (
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-[#9E9E9E] uppercase tracking-wide mb-2">Interview Stages</div>
              <div className="space-y-2">
                {brief.interviewStages.filter(s => s.name).map((stage, i) => (
                  <div key={i} className="bg-[#F5F4F0] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#16A085]">Stage {i + 1}</span>
                      <span className="text-sm font-semibold text-[#111]">{stage.name}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 text-xs text-[#555]">
                      {stage.format && <span>📅 {stage.format}</span>}
                      {stage.interviewer && <span>👤 {stage.interviewer}</span>}
                      {stage.duration && <span>💬 {stage.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <Grid2>
            <Row label="Assessment Required" value={brief.assessmentRequired} />
            <Row label="Assessment Details" value={brief.assessmentDetails} />
          </Grid2>
          <Row label="Rejection / Disqualifying Criteria" value={brief.rejectionCriteria} wide />
        </Section>

        <Section icon="🛠️" title="Tools & Technology">
          <Grid2>
            <BulletList label="Required Tools / Software" items={brief.requiredTools} />
            <BulletList label="Tech Stack" items={brief.techStack} />
          </Grid2>
          <Grid3>
            <Row label="Internal Systems" value={brief.internalSystems} />
            <Row label="Training Provided" value={brief.trainingProvided} />
            <Row label="Training Details" value={brief.trainingDetails} />
          </Grid3>
        </Section>

        <Section icon="🏢" title="Nearwork Team Assignment">
          <Grid3>
            <Row label="Assigned Recruiter" value={brief.assignedRecruiter} />
            <Row label="Account Manager" value={brief.accountManager} />
            <Row label="Reporting Cadence" value={brief.reportingCadence} />
            <Row label="Sourcing Start Date" value={brief.sourcingStartDate ? formatDate(brief.sourcingStartDate) : undefined} />
            <Row label="Candidate Deadline" value={brief.candidateDeadline ? formatDate(brief.candidateDeadline) : undefined} />
            <Row label="Target Candidate Volume" value={brief.targetCandidateVolume} />
          </Grid3>
          <BulletList label="Sourcing Channels" items={brief.sourcingChannels} />
          <Row label="Search Strategy Notes" value={brief.searchStrategyNotes} wide />
        </Section>

        <Section icon="📄" title="Administrative Details">
          <Grid3>
            <Row label="Contract Type" value={brief.contractType} />
            <Row label="Probation Period" value={brief.probationPeriod} />
            <Row label="Notice Period" value={brief.noticePeriod} />
            <Row label="Work Authorization" value={brief.workAuthRequired} />
            <Row label="Non-Compete / NDA" value={brief.nonCompeteNda} />
            <Row label="Equipment Provided By" value={brief.equipmentProvidedBy} />
          </Grid3>
        </Section>

        {(brief.additionalNotes || brief.otherDiscussed) && (
          <Section icon="📝" title="Additional Notes">
            <Row label="Additional Notes" value={brief.additionalNotes} wide />
            <Row label="Other Items Discussed" value={brief.otherDiscussed} wide />
          </Section>
        )}

        {/* Audit trail */}
        {brief.history?.length ? (
          <Section icon="📋" title="Activity Log" desc="Full history of this brief">
            <div className="space-y-0">
              {[...brief.history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((h, i) => {
                const icons: Record<string, string> = { saved: "💾", submitted: "📤", approved: "✅", changes_requested: "⚠️", reopened: "↩️" };
                const labels: Record<string, string> = {
                  saved: "Draft saved", submitted: "Submitted for review",
                  approved: "Approved", changes_requested: "Changes requested", reopened: "Reopened"
                };
                return (
                  <div key={i} className="flex gap-3 py-3 border-b border-[#F5F4F0] last:border-0">
                    <div className={cx(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5",
                      h.byRole === "nearwork" ? "bg-[#E8F8F5]" : "bg-blue-50"
                    )}>
                      {icons[h.action] || "●"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#111]">{labels[h.action] || h.action}</div>
                      <div className="text-xs text-[#9E9E9E] mt-0.5">
                        {h.by} · {h.byRole === "nearwork" ? "Nearwork" : "Client"} · {formatTs(h.timestamp)}
                      </div>
                      {h.note && h.action !== "saved" && h.action !== "submitted" && (
                        <div className="mt-1.5 text-xs text-[#555] bg-[#F5F4F0] rounded-lg px-3 py-2 border-l-2 border-[#D0CFC9]">
                          &ldquo;{h.note}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        ) : null}

        {/* Bottom action bar */}
        {canAct && (
          <div className="sticky bottom-4 bg-white border border-[#E5E4E0] rounded-2xl shadow-xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-bold text-[#111]">Ready to confirm?</div>
              <div className="text-xs text-[#9E9E9E]">Approve to confirm everything above is correct, or request changes if something needs to be updated.</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowChanges(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors">
                <AlertTriangle size={14} /> Request changes
              </button>
              <button onClick={() => setShowApprove(true)} className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#16A085] text-white text-sm font-semibold hover:bg-[#12866E] transition-colors">
                <CheckCircle2 size={14} /> Approve brief
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Approve modal ──────────────────────────────────────────── */}
      {showApprove && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-lg font-bold text-[#111] mb-2">Approve this kick-off brief?</div>
            <p className="text-sm text-[#555] leading-relaxed mb-5">
              By approving, you confirm that everything in this brief accurately reflects what was discussed during the kick-off call. Nearwork will use this as the source of truth for this search.
            </p>
            <div className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest mb-2">Type APPROVE to confirm</div>
            <input
              type="text"
              value={approveText}
              onChange={e => setApproveText(e.target.value)}
              placeholder="APPROVE"
              className="w-full border-2 border-[#E5E4E0] focus:border-[#16A085] rounded-xl px-4 py-3 text-center text-base font-bold tracking-widest outline-none transition-colors"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowApprove(false); setApproveText(""); }} className="flex-1 py-2.5 rounded-xl border border-[#E5E4E0] text-sm font-semibold text-[#555] hover:bg-[#F5F4F0] transition-colors">
                Cancel
              </button>
              <button
                onClick={doApprove}
                disabled={approveText.trim().toUpperCase() !== "APPROVE" || submitting}
                className="flex-1 py-2.5 rounded-xl bg-[#16A085] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#12866E] transition-colors"
              >
                {submitting ? "Approving…" : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request changes modal ──────────────────────────────────── */}
      {showChanges && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="text-4xl mb-3">✏️</div>
            <div className="text-lg font-bold text-[#111] mb-2">Request changes</div>
            <p className="text-sm text-[#555] leading-relaxed mb-4">
              Describe what needs to be updated. The Nearwork team will revise the brief and resubmit for your approval.
            </p>
            <div className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest mb-2">What needs to change?</div>
            <textarea
              value={changesNote}
              onChange={e => setChangesNote(e.target.value)}
              placeholder="e.g. The salary range is incorrect — we discussed USD 4,000–6,000. Also, the interview process should include a final stage with the CEO."
              className="w-full border-2 border-[#E5E4E0] focus:border-amber-400 rounded-xl px-4 py-3 text-sm outline-none resize-none transition-colors"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowChanges(false); setChangesNote(""); }} className="flex-1 py-2.5 rounded-xl border border-[#E5E4E0] text-sm font-semibold text-[#555] hover:bg-[#F5F4F0] transition-colors">
                Cancel
              </button>
              <button
                onClick={doRequestChanges}
                disabled={!changesNote.trim() || submitting}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
              >
                {submitting ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
