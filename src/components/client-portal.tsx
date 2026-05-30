"use client";

import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ExternalLink,
  Eye,
  FileText,
  Handshake,
  Kanban,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  addClientNote,
  auth,
  createClientAccount,
  getClientUser,
  getOrganization,
  linkExistingAccountToOrg,
  loginWithEmail,
  loginWithGoogle,
  logoutClient,
  markNotificationRead,
  saveNotificationPreferences,
  sendClientPasswordReset,
  setClientRememberMe,
  sendOpeningChatMessage,
  subscribeOpeningChat,
  subscribeNotifications,
  subscribeOrgCollection,
  updateClientProfile,
  readableRole,
  type ClientUser,
  type Organization,
  type PipelineCandidate,
  type PortalCandidate,
  type PortalAssessment,
  type PortalAssessmentInsight,
  type PortalNotification,
  type PortalNote,
  type OpeningChatMessage,
  type PortalHire,
  type PortalOpening,
  type PortalPipeline,
  type TimeOffRequest,
} from "@/lib/firebase-client";

const tabs = [
  { id: "overview",  label: "Overview",   icon: LayoutDashboard,   section: "Hiring" },
  { id: "pipeline",  label: "Pipeline",   icon: Kanban,            section: "Hiring" },
  { id: "openings",  label: "Open roles", icon: BriefcaseBusiness, section: "Hiring" },
  { id: "hires",     label: "Hires",      icon: Handshake,         section: "Team" },
  { id: "services",  label: "Services",   icon: ShieldCheck,       section: "Team" },
  { id: "timeoff",   label: "PTO",        icon: CalendarCheck,     section: "Team" },
  { id: "finance",   label: "Finance",    icon: ReceiptText,       section: "Account" },
  { id: "notes",     label: "Notes",      icon: NotebookPen,       section: "Collaboration" },
  { id: "users",     label: "Users",      icon: UsersRound,        section: "Settings" },
  { id: "settings",  label: "Settings",   icon: Settings,          section: "Settings" },
] as const;

type TabId = (typeof tabs)[number]["id"] | "candidate" | "hire";

const CLIENT_FX_RATE = 3900;

function normalizedPipelineStage(stageKey?: string) {
  const stage = String(stageKey || "").trim().toLowerCase();
  if (stage === "applied" || stage === "screening" || stage === "shortlisted") return "profile-review";
  if (stage === "background-checks" || stage === "background") return "background-check";
  if (stage === "client-interview") return "interview";
  if (stage === "company-review" || stage === "final-review" || stage === "offer") return "client-review";
  return pipelineStages.some((stageItem) => stageItem.key === stage) ? stage : "profile-review";
}

const stageTone: Record<string, string> = {
  "profile-review": "border-violet-200 bg-violet-50 text-violet-700",
  "background-check": "border-amber-200 bg-amber-50 text-amber-800",
  assessment: "border-purple-200 bg-purple-50 text-purple-700",
  interview: "border-pink-200 bg-pink-50 text-pink-700",
  presented: "border-teal-200 bg-teal-50 text-teal-700",
  "client-review": "border-indigo-200 bg-indigo-50 text-indigo-700",
  hired: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const pipelineStages = [
  { key: "profile-review", label: "Profile Review" },
  { key: "background-check", label: "Background Check" },
  { key: "assessment", label: "Assessment" },
  { key: "interview", label: "Interview" },
  { key: "presented", label: "Presented" },
  { key: "client-review", label: "Client Review" },
  { key: "hired", label: "Hired" },
];

const emptyClientUsers: ClientUser[] = [];

// Client-facing pipeline stages (admin stage → client stage mapping)
// Screening = Background Check stage, Technical = Assessment stage,
// Final Round = Presented stage, Offer = Hired stage
const clientStages = [
  { key: "screening",     label: "Screening"     },
  { key: "technical",     label: "Technical"     },
  { key: "final-round",   label: "Final Round"   },
  { key: "offer",         label: "Offer"         },
  { key: "not-selected",  label: "Not Selected"  },
];

function clientStageKey(stage?: string): string {
  const s = String(stage || "").toLowerCase().replace(/[-_ ]/g, "");
  // Map admin-side stage names to client-visible labels
  if (s.includes("background") || s.includes("bgcheck") || s.includes("screening") || s.includes("profile")) return "screening";
  if (s.includes("assess") || s.includes("tech") || s.includes("test")) return "technical";
  if (s.includes("present") || s.includes("clientview") || s.includes("clientreview") || s.includes("final") || s.includes("interview")) return "final-round";
  if (s.includes("hired") || s.includes("offer")) return "offer";
  if (s.includes("pass") || s.includes("reject") || s.includes("notselect") || s.includes("declined") || s.includes("disqualif")) return "not-selected";
  // "applied" and early stages are filtered out — clients only see vetted candidates
  return "screening";
}

const clientStageTone: Record<string, string> = {
  "screening":    "border-violet-200 bg-violet-50 text-violet-700",
  "technical":    "border-amber-200 bg-amber-50 text-amber-800",
  "final-round":  "border-teal-200 bg-teal-50 text-teal-700",
  "offer":        "border-emerald-200 bg-emerald-50 text-emerald-700",
  "not-selected": "border-red-200 bg-red-50 text-red-700",
};

const defaultAccountManager = {
  name: "",
  email: "",
  phone: "",
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function dateTime(value: unknown) {
  const maybeTimestamp = value as { toDate?: () => Date } | null;
  const date = maybeTimestamp?.toDate ? maybeTimestamp.toDate() : new Date(String(value || Date.now()));
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name = "NW") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NW";
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", tone || "border-[#E5E4E0] bg-[#F5F4F0] text-[#555]")}>
      {children}
    </span>
  );
}

function Score({ value = 0 }: { value?: number }) {
  const score = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="grid size-12 place-items-center rounded-full" style={{ background: `conic-gradient(#12866E ${score * 3.6}deg, #E5E4E0 0deg)` }}>
      <div className="grid size-8 place-items-center rounded-full bg-white text-sm font-semibold text-[#111]">{score || "—"}</div>
    </div>
  );
}

function salaryTextUsd(candidate: PortalCandidate | PipelineCandidate) {
  const rawAmount = Number(candidate.expectedSalaryAmount || 0);
  const rawCurrency = String(candidate.expectedSalaryCurrency || "USD").toUpperCase();
  if (candidate.expectedSalary && rawCurrency === "USD") return candidate.expectedSalary;
  if (candidate.salary && String(candidate.salary).toUpperCase().includes("USD")) return candidate.salary;
  if (!rawAmount && !candidate.expectedSalary && !candidate.salary) return "Not shared";
  const amount = rawCurrency === "COP" ? rawAmount / CLIENT_FX_RATE : rawAmount;
  if (!amount) return "USD pending";
  return `USD ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(amount))}/mo`;
}

function moneyText(amount?: number, currency = "USD") {
  const value = Number(amount || 0);
  if (!value) return "Not shared";
  return currency === "COP"
    ? `COP ${new Intl.NumberFormat("es-CO").format(Math.round(value))}`
    : `USD ${new Intl.NumberFormat("en-US").format(Math.round(value))}`;
}

function clientPriceText(hire: PortalHire) {
  const amount = Number(hire.usdBilledMonthly || hire.salesPrice || 0);
  return amount ? moneyText(amount, "USD") : "Pending";
}

function assessmentBreakdown(candidate: PortalCandidate) {
  const technical = Number(candidate.lastTechnicalScore || 0);
  const overall = Number(candidate.lastAssessmentScore || candidate.score || 0);
  const signal = technical >= 80 ? "Strong" : technical >= 65 ? "Solid with follow-up areas" : technical ? "Needs deeper review" : "Pending";
  const focus = technical >= 80
    ? "The candidate showed consistent technical accuracy across the role skills and should be ready for a live interview."
    : technical >= 65
      ? "The candidate cleared the core bar, with the best next step being a focused conversation on the lower-scoring skill areas."
      : technical
        ? "The candidate may still be viable, but Nearwork recommends reviewing the answer detail before moving forward."
        : "Assessment scoring has not been shared yet.";
  return { overall, technical, signal, focus };
}

function discInsight(candidate: PortalCandidate) {
  const label = candidate.discProfile?.label || "Pending";
  if (label.toLowerCase().includes("c")) {
    return {
      title: label,
      benefit: "High C profiles tend to be precise, careful, process-oriented, and strong in quality control.",
      watchout: "They may need clear requirements and can move slower when expectations are ambiguous.",
      fit: "This is helpful for support, operations, finance, QA, and roles where accuracy matters more than improvisation.",
    };
  }
  if (label.toLowerCase().includes("i")) {
    return {
      title: label,
      benefit: "High I profiles tend to build trust quickly, communicate well, and keep customer conversations warm.",
      watchout: "They may need structure around follow-through, documentation, and prioritization.",
      fit: "This can be very useful in customer success, sales, onboarding, and relationship-heavy roles.",
    };
  }
  return {
    title: label,
    benefit: candidate.discProfile?.summary || "DISC detail is available after the assessment review is complete.",
    watchout: "Nearwork will add role-specific interpretation once the assessment is fully reviewed.",
    fit: "Use this as one signal alongside technical score, interview notes, and the role kickoff priorities.",
  };
}

function englishBenchmarkScore(candidate: PortalCandidate) {
  const english = String(candidate.english || "").toUpperCase();
  if (english.includes("C2") || english.includes("NATIVE")) return 94;
  if (english.includes("C1")) return 88;
  if (english.includes("B2")) return 76;
  if (english.includes("B1")) return 64;
  return 72;
}

function fallbackClientInsight(candidate: PortalCandidate): PortalAssessmentInsight {
  const breakdown = assessmentBreakdown(candidate);
  const disc = discInsight(candidate);
  const overall = Math.max(0, Math.min(100, Number(breakdown.overall || candidate.score || 76)));
  const technical = Math.max(0, Math.min(100, Number(breakdown.technical || candidate.lastTechnicalScore || Math.max(55, overall - 5))));
  const communication = englishBenchmarkScore(candidate);
  const workStyle = candidate.discProfile?.label ? 79 : 72;
  const experience = Math.max(55, Math.min(92, overall + (technical >= 75 ? 2 : -4)));
  const role = candidate.role || "this role";
  const topSkills = (candidate.skills || []).slice(0, 2).join(" and ");

  return {
    summaryTitle: "Candidate vs role benchmark",
    recommendation: "Review the lower-scoring areas live before making a final decision.",
    radar: [
      { label: "Technical", candidate: technical, average: 71 },
      { label: "Role fit", candidate: overall, average: 74 },
      { label: "Communication", candidate: communication, average: 78 },
      { label: "Work style", candidate: workStyle, average: 74 },
      { label: "Experience", candidate: experience, average: 72 },
    ],
    bars: [
      { label: "Nearwork score", candidate: overall, average: 74 },
      { label: "Technical", candidate: technical, average: 71 },
      { label: "Communication", candidate: communication, average: 78 },
      { label: "Work style", candidate: workStyle, average: 74 },
      { label: "Experience", candidate: experience, average: 72 },
    ],
    client: {
      summary: `${candidate.name} is being compared against the current ${role} benchmark. The visual markers show where the candidate is above or below the typical profile Nearwork sees for similar openings.`,
      technicalBreakdown: `Technical score is ${technical}% against a ${71}% role average${topSkills ? `, with the strongest signal around ${topSkills}` : ""}.`,
      discSummary: disc.benefit,
      strengths: [
        breakdown.signal,
        communication >= 85 ? "Strong English communication signal for client-facing conversations." : "Communication level is usable, with a live conversation recommended.",
        disc.fit,
      ],
      watchouts: [
        technical < 75 ? "Validate the lower technical areas with a live role scenario." : "Confirm technical consistency in a live interview.",
        disc.watchout,
      ],
      followUps: [
        "Ask the candidate to walk through a recent role-specific problem from start to finish.",
        "Compare their salary expectation against the opening budget before moving to final interviews.",
      ],
      interviewGuide: [
        "Start with one practical scenario tied to the opening responsibilities.",
        "Ask for examples that prove the top two skills listed on the profile.",
        "Use the DISC notes to adapt the interview style and reduce false negatives.",
      ],
    },
  };
}

function candidateInsight(candidate: PortalCandidate) {
  return candidate.aiReview;
}

function insightTextList(items?: string[]) {
  return (items || []).filter(Boolean).slice(0, 6);
}

function candidateKey(candidate: PortalCandidate | PipelineCandidate) {
  return (candidate as PortalCandidate).code || candidate.candidateCode || candidate.email || candidate.name || "";
}

function normalizeCandidate(item: PipelineCandidate, candidate?: PortalCandidate, pipeline?: PortalPipeline): PortalCandidate {
  const code = candidate?.code || item.code || item.candidateCode || candidate?.candidateCode || "";
  return {
    ...(candidate || {}),
    id: candidate?.id || code || item.email || item.name || "candidate",
    code,
    candidateCode: code,
    name: candidate?.name || item.name || item.email || "Candidate",
    email: candidate?.email || item.email || "",
    role: item.role || candidate?.role || candidate?.headline || pipeline?.openingTitle || "Candidate",
    stage: item.stage || candidate?.stage || item.status || "client-review",
    status: item.status || candidate?.status || "active",
    score: Number(item.score || candidate?.score || candidate?.lastAssessmentScore || 0),
    english: item.english || candidate?.english || "—",
    salary: item.salary || candidate?.salary || "",
    expectedSalary: item.expectedSalary || candidate?.expectedSalary || "",
    expectedSalaryAmount: item.expectedSalaryAmount || candidate?.expectedSalaryAmount,
    expectedSalaryCurrency: item.expectedSalaryCurrency || candidate?.expectedSalaryCurrency,
    location: item.location || candidate?.location || candidate?.city || "Colombia",
    skills: item.skills || candidate?.skills || [],
    cvUrl: candidate?.cvUrl || "",
    linkedin: candidate?.linkedin || "",
    discProfile: candidate?.discProfile,
    aiReview: candidate?.aiReview,
  };
}

function timestampMs(value: unknown) {
  const maybeTimestamp = value as { toDate?: () => Date } | null;
  if (maybeTimestamp?.toDate) {
    return maybeTimestamp.toDate().getTime();
  }
  const parsed = new Date(String(value || Date.now())).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function friendlyAuthError(raw: string): string {
  if (raw.includes("invite-missing-org")) return "This invitation link is missing its company details. Please open the most recent invite email from Nearwork and use that link, or ask Nearwork to resend your invitation.";
  if (raw.includes("auth/invalid-credential") || raw.includes("auth/wrong-password") || raw.includes("auth/user-not-found")) return "Incorrect email or password.";
  if (raw.includes("auth/too-many-requests")) return "Too many failed attempts. Please wait a few minutes and try again.";
  if (raw.includes("auth/network-request-failed")) return "Network error. Check your connection and try again.";
  if (raw.includes("auth/user-disabled")) return "This account has been disabled. Contact Nearwork support.";
  if (raw.includes("auth/email-already-in-use")) return "An account with this email already exists.";
  return raw.replace(/^Firebase:\s*/i, "").replace(/\s*\(auth\/[^)]+\)\.?\s*$/i, "").trim() || "Something went wrong. Please try again.";
}

function LoginScreen({ message }: { message?: string }) {
  const inviteEmail = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("email") || "" : "";
  const inviteToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : "";
  const inviteOrgId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("orgId") || "" : "";
  const inviteOrgName = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("orgName") || "" : "";
  const inviteRole = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("role") || "viewer_client" : "viewer_client";
  const inviteFirstName = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("firstName") || "" : "";
  const inviteLastName = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("lastName") || "" : "";
  const inviteBusinessRole = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("title") || "" : "";
  const [inviteComplete, setInviteComplete] = useState(false);
  const isInvite = !inviteComplete && Boolean(inviteToken || inviteEmail);
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [localMessage, setLocalMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    const flag = sessionStorage.getItem("nw_invite_done");
    if (flag) { sessionStorage.removeItem("nw_invite_done"); return "Your password is ready. Please log in to enter your company portal."; }
    return "";
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await setClientRememberMe(rememberMe);
      if (isInvite) {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        // Signal to onAuthStateChanged to skip profile loading while we're mid-creation.
        // Firebase auto-signs in the user after createUserWithEmailAndPassword, which
        // triggers onAuthStateChanged before our Firestore doc write completes —
        // without this flag the handler signs them back out and the doc write fails.
        if (typeof window !== "undefined") sessionStorage.setItem("nw_creating_account", "1");
        await createClientAccount(email, password, {
          token: inviteToken,
          orgId: inviteOrgId,
          orgName: inviteOrgName,
          portalRole: inviteRole,
          firstName: inviteFirstName,
          lastName: inviteLastName,
          businessRole: inviteBusinessRole,
        });
        if (typeof window !== "undefined") sessionStorage.removeItem("nw_creating_account");
        await logoutClient();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("nw_invite_done", "1");
          window.location.replace("/");
        }
        return;
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      if (typeof window !== "undefined") sessionStorage.removeItem("nw_creating_account");
      const raw = err instanceof Error ? err.message : "Could not continue.";
      if (isInvite && raw.includes("auth/email-already-in-use")) {
        // An account already exists for this email (e.g. from a previous org that was deleted).
        // Try to sign them in with the password they just typed — if it matches, we can
        // automatically re-link their existing account to the new org without them needing
        // to do anything extra.
        if (typeof window !== "undefined") sessionStorage.setItem("nw_creating_account", "1");
        try {
          await linkExistingAccountToOrg(email, password, {
            token: inviteToken,
            orgId: inviteOrgId,
            orgName: inviteOrgName,
            portalRole: inviteRole,
            firstName: inviteFirstName,
            lastName: inviteLastName,
            businessRole: inviteBusinessRole,
          });
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("nw_creating_account");
            sessionStorage.setItem("nw_invite_done", "1");
            window.location.replace("/");
          }
          return;
        } catch {
          // Password didn't match their existing account — show login form
          if (typeof window !== "undefined") sessionStorage.removeItem("nw_creating_account");
          setInviteComplete(true);
          setPassword("");
          setConfirmPassword("");
          setLocalMessage("This email already has an account from a previous workspace. Enter your previous password to continue, or click \"Send password reset\" below to set a new one.");
          if (typeof window !== "undefined") window.history.replaceState({}, "", "/");
          return;
        }
      }
      setError(friendlyAuthError(raw));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError("Enter your email first so we can send the password reset.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendClientPasswordReset(email);
      setLocalMessage("Password reset sent. Use the link in your email to set your app.nearwork.co password.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send the password reset.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#F8F7F3] px-5 py-8 text-[#111] lg:grid-cols-[1fr_440px]">
      <section className="flex min-h-[520px] flex-col justify-between rounded-lg border border-[#E5E4E0] bg-white p-8 shadow-sm lg:p-12">
        <div>
          <div className="text-2xl font-semibold">Near<span className="text-[#12866E]">work</span></div>
          <p className="mt-16 max-w-2xl text-5xl font-semibold leading-[1.02] lg:text-7xl">
            Company hiring command center.
          </p>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#555]">
            Review candidates, add private notes, track openings, and receive updates from Nearwork in one shared portal.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-[#555] sm:grid-cols-3">
          <div className="rounded-md border border-[#E5E4E0] bg-[#F5F4F0] p-4">Pipeline visibility</div>
          <div className="rounded-md border border-[#E5E4E0] bg-[#F5F4F0] p-4">Private notes</div>
          <div className="rounded-md border border-[#E5E4E0] bg-[#F5F4F0] p-4">Realtime updates</div>
        </div>
      </section>
      <section className="flex items-center justify-center px-0 py-8 lg:px-10">
        <form onSubmit={submit} className="w-full rounded-lg border border-[#E5E4E0] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#12866E]">app.nearwork.co</p>
          <h1 className="mt-2 text-3xl font-semibold">{isInvite ? "Create your password" : "Company login"}</h1>
          <p className="mt-2 text-sm leading-6 text-[#555]">{isInvite ? "Use the invited email and choose a password to enter your company workspace." : "Use the email invited by Nearwork for your company portal."}</p>
          {localMessage ? <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{localMessage}</div> : null}
          {!localMessage && message ? <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</div> : null}
          <label className="mt-5 block text-sm font-medium">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 h-11 w-full rounded-md border border-[#E5E4E0] px-3 outline-none focus:border-[#12866E]" required />
          </label>
          <label className="mt-4 block text-sm font-medium">
            {isInvite ? "Create password" : "Password"}
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-2 h-11 w-full rounded-md border border-[#E5E4E0] px-3 outline-none focus:border-[#12866E]" required />
          </label>
          {isInvite ? (
            <label className="mt-4 block text-sm font-medium">
              Confirm password
              <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" className="mt-2 h-11 w-full rounded-md border border-[#E5E4E0] px-3 outline-none focus:border-[#12866E]" required />
            </label>
          ) : null}
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-[#555]">
            <input checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} type="checkbox" className="h-4 w-4 accent-[#12866E]" />
            Keep me signed in on this device
          </label>
          {error ? <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          <button disabled={busy} className="mt-5 h-11 w-full rounded-md bg-[#12866E] text-sm font-semibold text-white disabled:opacity-60">
            {busy ? "Working..." : isInvite ? "Create account" : "Log in"}
          </button>
          <button type="button" onClick={resetPassword} disabled={busy} className="mt-3 h-11 w-full rounded-md border border-[#E5E4E0] bg-white text-sm font-semibold text-[#555] disabled:opacity-60">
            Send password reset
          </button>
        </form>
      </section>
    </main>
  );
}

function CandidateCard({
  candidate,
  pipeline,
  selected,
  onSelect,
}: {
  candidate: PortalCandidate;
  pipeline?: PortalPipeline;
  selected: boolean;
  onSelect: () => void;
}) {
  const stageKey = clientStageKey(candidate.stage);
  const stageLabel = clientStages.find((s) => s.key === stageKey)?.label || candidate.stage || "Screening";
  return (
    <button onClick={onSelect} className={cx("w-full rounded-xl border bg-white p-4 text-left transition hover:border-[#12866E] hover:shadow-sm", selected ? "border-[#12866E]" : "border-[#E5E4E0]")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[#111]">{candidate.name}</h3>
            <Badge tone={clientStageTone[stageKey] || "border-stone-200 bg-stone-50 text-stone-600"}>{stageLabel}</Badge>
          </div>
          <p className="mt-1 text-sm text-[#555]">{candidate.role} · {candidate.location || "Colombia"}</p>
          <p className="mt-1 text-xs text-[#888]">{pipeline?.openingTitle || pipeline?.code || "General pipeline"}</p>
        </div>
        <Score value={candidate.score} />
      </div>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div><p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Expected pay</p><p className="mt-0.5 font-medium text-[#111]">{salaryTextUsd(candidate)}</p></div>
        <div><p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">English</p><p className="mt-0.5 font-medium text-[#111]">{candidate.english || "—"}</p></div>
        <div><p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">DISC</p><p className="mt-0.5 font-medium text-[#111]">{candidate.discProfile?.label || "Pending"}</p></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(candidate.skills || []).slice(0, 5).map((skill) => <Badge key={skill}>{skill}</Badge>)}
      </div>
    </button>
  );
}

function NotificationPanel({
  notifications,
  onRead,
}: {
  notifications: PortalNotification[];
  onRead: (id: string) => void;
}) {
  return (
    <div className="absolute right-0 top-12 z-30 w-[min(360px,calc(100vw-32px))] rounded-xl border border-[#E5E4E0] bg-white shadow-xl">
      <div className="border-b border-[#E5E4E0] p-4">
        <p className="font-medium text-[#111]">Notifications</p>
        <p className="text-xs text-[#888]">Email summaries are buffered for 2 hours.</p>
      </div>
      <div className="max-h-96 overflow-auto">
        {notifications.length ? notifications.map((item) => (
          <button key={item.id} onClick={() => onRead(item.id)} className={cx("block w-full border-b border-[#E5E4E0] p-4 text-left last:border-b-0", item.read ? "bg-white" : "bg-[#EEF6F3]")}>
            <p className="text-sm font-medium text-[#111]">{item.title || "Nearwork update"}</p>
            <p className="mt-1 text-sm leading-5 text-[#555]">{item.message || ""}</p>
            <p className="mt-2 text-xs text-[#888]">{dateTime(item.createdAt)}</p>
          </button>
        )) : <div className="p-6 text-center text-sm text-[#888]">No notifications yet.</div>}
      </div>
    </div>
  );
}

export function ClientPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientUser | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [openings, setOpenings] = useState<PortalOpening[]>([]);
  const [pipelines, setPipelines] = useState<PortalPipeline[]>([]);
  const [candidates, setCandidates] = useState<PortalCandidate[]>([]);
  const [assessments, setAssessments] = useState<PortalAssessment[]>([]);
  const [hires, setHires] = useState<PortalHire[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [notes, setNotes] = useState<PortalNote[]>([]);
  const [openingChat, setOpeningChat] = useState<OpeningChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [active, setActive] = useState<TabId>("overview");
  const [selectedCode, setSelectedCode] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteScope, setNoteScope] = useState<"client_visible" | "client_internal">("client_visible");
  const [search, setSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const testMode = false;
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [selectedPipelineCode, setSelectedPipelineCode] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState("");
  const [selectedHireId, setSelectedHireId] = useState("");
  const [compareCodes, setCompareCodes] = useState<string[]>([]);
  const [favoriteCodes, setFavoriteCodes] = useState<string[]>([]);
  const [interviewCodes, setInterviewCodes] = useState<string[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const sidebarOpen = sidebarPinned || sidebarHover;

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    if (testMode) return;
    if (!nextUser) {
      setUser(null);
      setProfile(null);
      setOrg(null);
      return;
    }
    // If account creation is in progress, skip profile loading — the Firestore doc
    // hasn't been written yet. The submit() flow handles sign-out + page reload itself.
    if (typeof window !== "undefined" && sessionStorage.getItem("nw_creating_account")) return;
    setUser(nextUser);
    setAuthMessage("");
    try {
      const nextProfile = await getClientUser(nextUser);
      const role = String(nextProfile?.role || nextProfile?.portalRole || "").toLowerCase();
      const allowed = role.includes("client") || role.includes("org") || role === "viewer" || role === "user" || role === "admin";
      if (!nextProfile || !allowed) {
        setAuthMessage("This email is not invited to the client portal yet. Ask Nearwork to add it under the company users page.");
        await logoutClient();
        return;
      }
      if ((nextProfile as any).suspended === true) {
        setAuthMessage("Your access has been paused. Please contact support@nearwork.co for more information.");
        await logoutClient();
        return;
      }
      const nextOrg = await getOrganization(nextProfile);
      if (!nextOrg) {
        setAuthMessage("This email is invited, but it is not connected to a company workspace yet. Ask Nearwork to add the user to an organization.");
        await logoutClient();
        return;
      }
      if ((nextOrg as any).status === "suspended") {
        setAuthMessage("Your company's access has been suspended. Please contact support@nearwork.co for more information.");
        await logoutClient();
        return;
      }
      setProfile(nextProfile);
      setOrg(nextOrg);
    } catch (err) {
      console.error("[ClientPortal] Error loading portal:", err);
      setAuthMessage("Something went wrong loading your portal. Please refresh the page and try again.");
      await logoutClient().catch(() => null);
    }
  }), [testMode]);

  async function leavePortal() {
    setLoggingOut(true);
    await logoutClient().catch(() => null);
    setLoggingOut(false);
  }

  useEffect(() => {
    if (!org || testMode) return;
    const unsubscribers = [
      subscribeOrgCollection<PortalOpening>("openings", org, setOpenings),
      subscribeOrgCollection<PortalPipeline>("pipelines", org, setPipelines),
      subscribeOrgCollection<PortalHire>("clientAccountPeople", org, setHires),
      subscribeOrgCollection<TimeOffRequest>("timeOffRequests", org, setTimeOff),
      subscribeOrgCollection<PortalNote>("candidateNotes", org, setNotes),
      subscribeOrgCollection<PortalAssessment>("assessments", org, setAssessments),
    ];
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [org, testMode]);

  useEffect(() => {
    function closeSearch(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) setGlobalSearchOpen(false);
    }
    document.addEventListener("mousedown", closeSearch);
    return () => document.removeEventListener("mousedown", closeSearch);
  }, []);

  useEffect(() => {
    if (!user || testMode) return;
    return subscribeNotifications(user, (items) => {
      setNotifications(items.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt)));
    });
  }, [user, testMode]);

  useEffect(() => {
    if (!org || testMode) return;
    return subscribeOrgCollection<PortalCandidate>("candidates", org, (rows) => {
      setCandidates(rows.map((item) => ({ ...item, code: item.code || item.candidateCode || item.id })));
    });
  }, [org, testMode]);

  const pipelineCandidates = useMemo(() => {
    const byCode = new Map<string, PortalCandidate>();
    candidates.forEach((candidate) => {
      const code = String(candidate.code || candidate.candidateCode || "").toLowerCase();
      const email = String(candidate.email || "").toLowerCase();
      if (code) byCode.set(code, candidate);
      if (email) byCode.set(email, candidate);
    });
    const rows: Array<{ candidate: PortalCandidate; pipeline: PortalPipeline }> = [];
    const insightsByCandidate = new Map<string, PortalAssessmentInsight>();
    assessments
      .filter((assessment) => assessment.latestAiReviewClient || assessment.latestAiReviewVisuals)
      .sort((a, b) => timestampMs(b.aiReviewUpdatedAt) - timestampMs(a.aiReviewUpdatedAt))
      .forEach((assessment) => {
        const insight = {
          ...(assessment.latestAiReviewVisuals || {}),
          client: assessment.latestAiReviewClient,
        } as PortalAssessmentInsight;
        const code = String(assessment.candidateCode || "").toLowerCase();
        const email = String(assessment.candidateEmail || "").toLowerCase();
        if (code && !insightsByCandidate.has(code)) insightsByCandidate.set(code, insight);
        if (email && !insightsByCandidate.has(email)) insightsByCandidate.set(email, insight);
      });
    pipelines.forEach((pipeline) => {
      (pipeline.candidates || []).forEach((item) => {
        const code = String(item.code || item.candidateCode || "").toLowerCase();
        const email = String(item.email || "").toLowerCase();
        const normalized = normalizeCandidate(item, byCode.get(code) || byCode.get(email), pipeline);
        normalized.aiReview = normalized.aiReview || insightsByCandidate.get(code) || insightsByCandidate.get(email);
        rows.push({ candidate: normalized, pipeline });
      });
    });
    return rows;
  }, [candidates, pipelines, assessments]);

  const filteredCandidates = pipelineCandidates.filter(({ candidate, pipeline }) =>
    [candidate.name, candidate.email, candidate.role, pipeline.openingTitle, pipeline.code]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const selectedPipeline = selectedPipelineCode ? pipelines.find((pipeline) => pipeline.code === selectedPipelineCode) || null : null;
  const pipelineRows = selectedPipeline ? filteredCandidates.filter(({ pipeline }) => pipeline.code === selectedPipeline.code) : filteredCandidates;
  const selected = selectedCode ? pipelineRows.find(({ candidate }) => candidate.code === selectedCode) : undefined;
  const selectedNotes = notes
    .filter((note) => note.candidateCode === selected?.candidate.code)
    .filter((note) => note.scope === "client_visible" || note.scope === "client_internal" || note.visibility === "public")
    .sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
  const unread = notifications.filter((item) => !item.read).length;
  const activeOpenings = openings.filter((opening) => !["closed", "cancelled", "archived"].includes(String(opening.status || "").toLowerCase()));
  const hiredCount = pipelineCandidates.filter(({ candidate }) => normalizedPipelineStage(candidate.stage) === "hired").length;
  const visibleHires = hires.length ? hires : pipelineCandidates
    .filter(({ candidate }) => normalizedPipelineStage(candidate.stage) === "hired")
    .map(({ candidate, pipeline }) => ({
      id: `${pipeline.code}-${candidate.code}`,
      candidateCode: candidate.code,
      candidateName: candidate.name,
      name: candidate.name,
      role: candidate.role,
      orgId: org?.orgId,
      orgName: org?.name,
      pipelineCode: pipeline.code,
      openingCode: pipeline.openingCode,
      engagementType: "Direct Recruiting",
      serviceType: "Direct Recruiting",
      status: candidate.status || "Active",
      salary: candidate.expectedSalaryAmount,
      salaryCurrency: candidate.expectedSalaryCurrency || "USD",
    }));
  const selectedHire = selectedHireId ? visibleHires.find((hire) => hire.id === selectedHireId) : undefined;
  const ptoPending = timeOff.filter((request) => String(request.status || "").toLowerCase() === "pending").length;
  const upcomingPto = timeOff.filter((request) => ["pending", "approved"].includes(String(request.status || "").toLowerCase())).length;
  const reviewCount = pipelineCandidates.filter(({ candidate }) => ["presented", "client-review"].includes(normalizedPipelineStage(candidate.stage))).length;
  const estimatedMonthlySavings = Math.max(0, visibleHires.length || hiredCount) * 1800;
  const accountManager = {
    name: org?.accountManagerName || defaultAccountManager.name,
    email: org?.accountManagerEmail || defaultAccountManager.email,
    phone: org?.accountManagerPhone || defaultAccountManager.phone,
  };

  useEffect(() => {
    const openingCode = selectedPipeline?.openingCode || selectedPipeline?.code;
    if (!org || !openingCode || testMode) {
      setOpeningChat([]);
      return;
    }
    return subscribeOpeningChat(org, openingCode, (items) => {
      setOpeningChat(items.sort((a, b) => timestampMs(a.createdAt) - timestampMs(b.createdAt)));
    });
  }, [org, selectedPipeline?.openingCode, selectedPipeline?.code, testMode]);

  async function sendChatMessage() {
    if (!org || !profile || !selectedPipeline || !chatText.trim()) return;
    const text = chatText.trim();
    if (testMode) {
      setOpeningChat((items) => [...items, {
        id: `local-chat-${Date.now()}`,
        orgId: org.orgId,
        orgName: org.name,
        openingCode: selectedPipeline.openingCode || selectedPipeline.code,
        pipelineCode: selectedPipeline.code,
        text,
        author: profile.name || profile.email || "Company user",
        authorEmail: profile.email,
        authorType: "client",
        createdAt: new Date().toISOString(),
      }]);
      setChatText("");
      return;
    }
    await sendOpeningChatMessage({ org, profile, openingCode: selectedPipeline.openingCode || selectedPipeline.code, pipelineCode: selectedPipeline.code, text });
    setChatText("");
  }

  async function saveNote() {
    if (!org || !profile || !selected || !noteText.trim()) return;
    if (testMode) {
      setNotes((items) => [
        {
          id: `local-note-${Date.now()}`,
          candidateCode: selected.candidate.code,
          pipelineCode: selected.pipeline.code,
          pipelineTitle: selected.pipeline.openingTitle,
          orgId: org.orgId,
          orgName: org.name,
          scope: noteScope,
          visibility: noteScope,
          text: noteText.trim(),
          author: profile.name || profile.email || "Company user",
          authorEmail: profile.email,
          createdAt: new Date().toISOString(),
        },
        ...items,
      ]);
      setNoteText("");
      return;
    }
    await addClientNote({
      org,
      profile,
      candidate: selected.candidate,
      pipeline: selected.pipeline,
      text: noteText.trim(),
      scope: noteScope,
    });
    setNoteText("");
  }

  async function updatePreference(key: string, channel: "app" | "email", checked: boolean) {
    if (!profile) return;
    const preferences = {
      ...(profile.notificationPreferences || {}),
      [key]: { ...(profile.notificationPreferences?.[key] || {}), [channel]: checked },
    };
    setProfile({ ...profile, notificationPreferences: preferences });
    if (testMode || !user) return;
    await saveNotificationPreferences(user.uid, preferences);
  }

  function markRead(id: string) {
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
    if (!testMode) markNotificationRead(id);
  }

  function toggleCompare(code: string) {
    setCompareCodes((items) => {
      if (items.includes(code)) return items.filter((item) => item !== code);
      return items.length >= 3 ? items : [...items, code];
    });
  }

  function toggleFavorite(code: string) {
    setFavoriteCodes((items) => items.includes(code) ? items.filter((item) => item !== code) : [...items, code]);
  }

  function toggleInterview(code: string) {
    setInterviewCodes((items) => items.includes(code) ? items.filter((item) => item !== code) : [...items, code]);
  }

  const globalResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    const openingRows = openings
      .filter((opening) => [opening.title, opening.code, opening.status].join(" ").toLowerCase().includes(term))
      .slice(0, 4)
      .map((opening) => ({
        key: `opening-${opening.code}`,
        type: "Opening",
        title: opening.title,
        sub: opening.code,
        action: () => {
          const pipeline = pipelines.find((item) => item.openingCode === opening.code || item.openingTitle === opening.title);
          if (pipeline) {
            setPipelineFilter(pipeline.code);
            setActive("pipeline");
          } else {
            setActive("openings");
          }
          setSelectedCode("");
        },
      }));
    const candidateRows = pipelineCandidates
      .filter(({ candidate, pipeline }) => [candidate.name, candidate.email, candidate.role, pipeline.openingTitle, pipeline.code].join(" ").toLowerCase().includes(term))
      .slice(0, 5)
      .map(({ candidate, pipeline }) => ({
        key: `candidate-${pipeline.code}-${candidate.code}`,
        type: "Candidate",
        title: candidate.name,
        sub: `${pipeline.openingTitle || pipeline.code} · ${candidate.role || "Candidate"}`,
        action: () => {
          setSelectedPipelineCode(pipeline.code);
          setSelectedCode(candidate.code);
          setActive("candidate");
        },
      }));
    const hireRows = visibleHires
      .filter((hire) => [hire.candidateName, hire.name, hire.role, hire.serviceType].join(" ").toLowerCase().includes(term))
      .slice(0, 3)
      .map((hire) => ({
        key: `hire-${hire.id}`,
        type: "Employee",
        title: hire.candidateName || hire.name || "Employee",
        sub: `${hire.role || "Role"} · ${hire.serviceType || hire.engagementType || "Service"}`,
        action: () => {
          setSelectedHireId(hire.id);
          setActive("hire");
        },
      }));
    return [...candidateRows, ...openingRows, ...hireRows];
  }, [search, openings, pipelines, pipelineCandidates, visibleHires]);

  if (loggingOut) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8F7F3] text-[#111]">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#E5E4E0] bg-white px-10 py-8 text-sm text-[#555] shadow-sm">
          <div className="size-6 animate-spin rounded-full border-2 border-[#E5E4E0] border-t-[#12866E]" />
          <span>Signing out…</span>
        </div>
      </main>
    );
  }

  if (!user || authMessage) return <LoginScreen message={authMessage} />;

  if (!profile || !org) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8F7F3] text-[#111]">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#E5E4E0] bg-white px-10 py-8 text-sm text-[#555] shadow-sm">
          <div className="size-6 animate-spin rounded-full border-2 border-[#E5E4E0] border-t-[#12866E]" />
          <span>Loading your portal…</span>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#111]">
      <aside
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
        className={cx(
          "fixed inset-y-0 left-0 z-20 flex flex-col border-r border-[#E5E4E0] bg-white text-[#111] shadow-sm transition-all duration-200",
          sidebarOpen ? "w-56" : "w-14",
        )}
      >
        <div className="border-b border-[#E5E4E0] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="grid size-8 shrink-0 place-items-center rounded-md bg-[#12866E] text-sm font-semibold text-white">N</div>
            {sidebarOpen ? (
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold">Near<span className="text-[#12866E]">work</span></p>
                <p className="truncate text-xs text-[#888]">{org.name}</p>
              </div>
            ) : null}
            <button onClick={() => setSidebarPinned(!sidebarPinned)} className={cx("grid size-7 place-items-center rounded border border-[#E5E4E0] bg-white text-[#888]", sidebarPinned && "border-[#12866E] text-[#12866E]")}>
              {sidebarPinned ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />}
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {[...new Set(tabs.map((tab) => tab.section))].map((section) => (
            <div key={section} className="mb-2">
              {sidebarOpen ? <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#888]">{section}</p> : null}
              <div className="space-y-0.5">
                {tabs.filter((tab) => tab.section === section).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActive(tab.id)} className={cx("flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm", sidebarOpen ? "justify-start" : "justify-center", active === tab.id ? "bg-[#EEF6F3] font-medium text-[#12866E]" : "font-normal text-[#555] hover:bg-[#F5F4F0] hover:text-[#111]")}>
                      <Icon className="size-4 shrink-0" />
                      {sidebarOpen ? <span>{tab.label}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-[#E5E4E0] p-3">
          {sidebarOpen ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] p-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#888]">Account manager</p>
              <p className="mt-1 text-sm font-medium text-[#111]">{accountManager.name || "Nearwork team"}</p>
              <p className="truncate text-xs text-[#888]">{accountManager.email || "support@nearwork.co"}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#EEF6F3] text-xs font-medium text-[#12866E]">{initials(profile.name || profile.email)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#111]">{profile.name || profile.email}</p>
                <p className="text-xs text-[#888]">{profile.displayRole || profile.jobTitle || readableRole(profile.portalRole || profile.role)}</p>
              </div>
              <button onClick={leavePortal} title="Log out" className="grid size-7 place-items-center rounded border border-[#E5E4E0] bg-white text-[#888] hover:text-[#111]">
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>) : (
            <button onClick={leavePortal} className="grid size-9 place-items-center rounded-md bg-[#F5F4F0] text-xs font-medium text-[#555]">{initials(profile.name || profile.email)}</button>
          )}
        </div>
      </aside>

      <main className={cx("min-h-screen transition-[margin] duration-200", sidebarOpen ? "ml-56" : "ml-14")}>
        <header className="sticky top-0 z-10 border-b border-[#E5E4E0] bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <div ref={searchRef} className="relative flex min-w-[240px] flex-1 items-center gap-3">
              <div className="flex h-9 min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] px-3 text-sm text-[#888]">
                <Search className="size-3.5" />
                <input
                  value={search}
                  onFocus={() => setGlobalSearchOpen(true)}
                  onChange={(event) => { setSearch(event.target.value); setGlobalSearchOpen(true); }}
                  placeholder="Search candidates, openings, hires..."
                  className="h-full flex-1 bg-transparent text-sm text-[#111] outline-none placeholder:text-[#888]"
                />
              </div>
              {globalSearchOpen && search.trim() ? (
                <GlobalSearchResults results={globalResults} onClose={() => setGlobalSearchOpen(false)} />
              ) : null}
            </div>
            <div className="relative ml-auto flex shrink-0 items-center gap-2">
              <button onClick={() => setShowBell(!showBell)} className="relative grid size-9 place-items-center rounded-md border border-[#E5E4E0] bg-white text-[#555]">
                <Bell className="size-4" />
                {unread ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#C73565] px-1 text-xs font-medium text-white">{unread}</span> : null}
              </button>
              {showBell ? <NotificationPanel notifications={notifications} onRead={markRead} /> : null}
              <button onClick={() => setShowInvite(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#111] px-3 text-sm font-medium text-white">
                <UserPlus className="size-4" /> Invite user
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-7 lg:px-10">
          {showInvite ? <InviteUserModal orgName={org.name} onClose={() => setShowInvite(false)} /> : null}
          {active === "overview" ? (
            <OverviewDashboard
              profile={profile}
              org={org}
              activeOpenings={activeOpenings}
              reviewCount={reviewCount}
              ptoPending={ptoPending}
              upcomingPto={upcomingPto}
              estimatedMonthlySavings={estimatedMonthlySavings}
              pipelineCandidates={filteredCandidates}
              notifications={notifications}
              accountManager={accountManager}
              onGoToPipeline={() => setActive("pipeline")}
              onGoToOpenings={() => setActive("openings")}
              onSelectCandidate={(candidate, pipeline) => { setSelectedPipelineCode(pipeline.code); setSelectedCode(candidate.code); setActive("candidate"); }}
              onMarkRead={markRead}
            />
          ) : null}

          {active === "finance" ? (
            <FinanceView org={org} hires={visibleHires} accountManager={accountManager} profile={profile} />
          ) : null}

          {active === "pipeline" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold text-[#111]">Pipeline</h1>
                  <p className="text-sm text-[#555]">{filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? "s" : ""} across all openings</p>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-[#E5E4E0] bg-white px-3">
                  <Search className="size-3.5 text-[#888]" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidates..." className="h-9 w-44 bg-transparent text-sm text-[#111] outline-none placeholder:text-[#888]" />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setPipelineFilter("")} className={cx("whitespace-nowrap rounded-full border px-3 py-1 text-sm transition", !pipelineFilter ? "border-[#111] bg-[#111] font-medium text-white" : "border-[#E5E4E0] bg-white font-normal text-[#555] hover:border-[#111]")}>
                  All roles
                </button>
                {pipelines.map((pl) => (
                  <button key={pl.code} onClick={() => {
                    const next = pipelineFilter === pl.code ? "" : pl.code;
                    setPipelineFilter(next);
                    setSelectedPipelineCode(next); // also drive the chat subscription
                  }} className={cx("whitespace-nowrap rounded-full border px-3 py-1 text-sm transition", pipelineFilter === pl.code ? "border-[#111] bg-[#111] font-medium text-white" : "border-[#E5E4E0] bg-white font-normal text-[#555] hover:border-[#111]")}>
                    {pl.openingTitle || pl.code}
                  </button>
                ))}
              </div>
              <KanbanBoard
                rows={pipelineFilter ? filteredCandidates.filter((r) => r.pipeline.code === pipelineFilter) : filteredCandidates}
                onSelect={(candidate, pipeline) => {
                  setSelectedPipelineCode(pipeline.code);
                  setSelectedCode(candidate.code);
                  setActive("candidate");
                }}
              />
              {selectedPipeline ? (
                <OpeningChatPanel
                  companyName={org.name}
                  recruiter={selectedPipeline.recruiter || "Nearwork"}
                  messages={openingChat}
                  value={chatText}
                  setValue={setChatText}
                  onSend={sendChatMessage}
                />
              ) : null}
            </div>
          ) : null}

          {active === "openings" ? (
            <OpeningsView openings={openings} pipelines={pipelines} rows={pipelineCandidates} onOpenPipeline={(code) => { setPipelineFilter(code); setActive("pipeline"); }} />
          ) : null}

          {active === "candidate" && selected ? (
            <CandidateFullPage
              candidate={selected.candidate}
              pipeline={selected.pipeline}
              companyName={org.name}
              notes={selectedNotes}
              noteText={noteText}
              noteScope={noteScope}
              setNoteText={setNoteText}
              setNoteScope={setNoteScope}
              saveNote={saveNote}
              onBack={() => setActive("pipeline")}
              onFavorite={() => toggleFavorite(selected.candidate.code)}
              onInterview={() => toggleInterview(selected.candidate.code)}
              favorite={favoriteCodes.includes(selected.candidate.code)}
              interview={interviewCodes.includes(selected.candidate.code)}
            />
          ) : null}

          {active === "hires" ? (
            <Panel title="Hired candidates" eyebrow="Client team">
              <HiresTable hires={visibleHires} onOpen={(hire) => { setSelectedHireId(hire.id); setActive("hire"); }} />
            </Panel>
          ) : null}

          {active === "hire" && selectedHire ? (
            <HireFullPage hire={selectedHire} timeOff={timeOff} accountManager={accountManager} onBack={() => setActive("hires")} />
          ) : null}

          {active === "services" ? (
            <ServicesView hires={visibleHires} />
          ) : null}

          {active === "timeoff" ? (
            <Panel title="PTO and employee requests" eyebrow="Talent portal requests">
              <TimeOffCalendar requests={timeOff} />
              <div className="mt-6">
                <TimeOffTable requests={timeOff} />
              </div>
            </Panel>
          ) : null}

          {active === "notes" ? (
            <Panel title={`${org.name} notes`} eyebrow="Scoped by pipeline">
              <div className="grid gap-3">
                {notes.filter((note) => note.scope === "client_visible" || note.scope === "client_internal").map((note) => (
                  <article key={note.id} className="rounded-lg border border-[#E5E4E0] bg-white p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div><p className="font-medium text-[#111]">{note.pipelineTitle || note.candidateCode}</p><p className="text-sm text-[#555]">{note.scope === "client_internal" ? `${org.name} internal only` : `Visible to Nearwork and ${org.name}`} · {note.author}</p></div>
                      <p className="text-xs text-[#888]">{dateTime(note.createdAt)}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#555]">{note.text}</p>
                  </article>
                ))}
                {!notes.length ? <Empty title="No notes yet" text="Notes added in candidate profiles will appear here." /> : null}
              </div>
            </Panel>
          ) : null}

          {active === "users" ? (
            <Panel title="Company users" eyebrow="Access">
              <CompanyUsers org={org} testMode={testMode} />
            </Panel>
          ) : null}

          {active === "settings" ? (
            <div className="space-y-6">
              <ProfileSettingsPanel profile={profile} userId={user.uid} onSave={(updated) => setProfile({ ...profile, ...updated })} />
              <Panel title="Notification settings" eyebrow="Preferences">
                <div className="grid gap-3">
                  {[
                    ["candidateMovement", "Candidate movement"],
                    ["openingUpdates", "Opening updates"],
                    ["mentions", "Mentions"],
                    ["interviews", "Interview reminders"],
                  ].map(([key, label]) => {
                    const pref = profile.notificationPreferences?.[key] || {};
                    return (
                      <div key={key} className="grid gap-3 rounded-md border border-[#E5E4E0] bg-white p-4 md:grid-cols-[1fr_120px_120px]">
                        <p className="font-semibold">{label}</p>
                        <label className="text-sm"><input type="checkbox" defaultChecked={pref.app !== false} onChange={(event) => updatePreference(key, "app", event.target.checked)} /> In-app</label>
                        <label className="text-sm"><input type="checkbox" defaultChecked={pref.email !== false} onChange={(event) => updatePreference(key, "email", event.target.checked)} /> Email</label>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm leading-6 text-[#555]">Email notifications should be sent by the backend digest job with a 2-hour buffer. The bell shows the full notification history immediately.</p>
              </Panel>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, sub, money, onClick }: { label: string; value: number; sub: string; money?: boolean; onClick?: () => void }) {
  return <div onClick={onClick} className={cx("rounded-xl border border-[#E5E4E0] bg-white p-5", onClick && "cursor-pointer transition-shadow hover:border-[#12866E] hover:shadow-sm")}><p className="text-sm text-[#888]">{label}</p><p className="mt-3 text-3xl font-semibold text-[#111]">{money ? moneyText(value, "USD") : value}</p>{sub ? <p className="mt-2 text-xs text-[#12866E]">{sub}</p> : null}</div>;
}

function OverviewDashboard({
  profile, org, activeOpenings, reviewCount, ptoPending, upcomingPto,
  estimatedMonthlySavings, pipelineCandidates, notifications, accountManager,
  onGoToPipeline, onGoToOpenings, onSelectCandidate, onMarkRead,
}: {
  profile: ClientUser;
  org: Organization;
  activeOpenings: PortalOpening[];
  reviewCount: number;
  ptoPending: number;
  upcomingPto: number;
  estimatedMonthlySavings: number;
  pipelineCandidates: Array<{ candidate: PortalCandidate; pipeline: PortalPipeline }>;
  notifications: PortalNotification[];
  accountManager: { name: string; email: string; phone: string };
  onGoToPipeline: () => void;
  onGoToOpenings: () => void;
  onSelectCandidate: (candidate: PortalCandidate, pipeline: PortalPipeline) => void;
  onMarkRead: (id: string) => void;
}) {
  const firstName = profile.firstName || (profile.name || "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const reviewCandidates = pipelineCandidates.filter(({ candidate }) => ["final-round", "offer"].includes(clientStageKey(candidate.stage)));
  const totalCandidates = pipelineCandidates.length;
  const recentUpdates = notifications.filter((n) => !n.read).slice(0, 3);
  const hasActionItems = reviewCount + ptoPending > 0;

  return (
    <div className="space-y-6">
      {/* Greeting hero */}
      <div className="rounded-2xl border border-[#E5E4E0] bg-gradient-to-br from-white via-[#F8F7F3] to-[#EEF6F3] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#12866E]">{greeting}, {firstName} 👋</p>
            <h1 className="mt-1 text-2xl font-bold text-[#111]">{org.name}</h1>
            <p className="mt-1 text-sm text-[#555]">Here&rsquo;s what&rsquo;s happening with your hiring pipeline today.</p>
          </div>
          {hasActionItems ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <span className="size-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-amber-800">{reviewCount + ptoPending} item{reviewCount + ptoPending !== 1 ? "s" : ""} need your attention</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-800">All caught up</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active openings" value={activeOpenings.length} sub="Click to manage" onClick={onGoToOpenings} />
        <Metric label="Candidates in pipeline" value={totalCandidates} sub="Click to view pipeline" onClick={onGoToPipeline} />
        <Metric label="Needs your review" value={reviewCount + ptoPending} sub="Final round + PTO" />
        <Metric label="Est. monthly savings" value={estimatedMonthlySavings} sub="vs. traditional hiring" money />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Candidates needing review */}
        <section className="rounded-xl border border-[#E5E4E0] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#888]">Pipeline</p>
              <h2 className="mt-1 text-lg font-semibold text-[#111]">Ready for your review</h2>
            </div>
            <button onClick={onGoToPipeline} className="text-sm font-medium text-[#12866E] hover:underline">View all →</button>
          </div>
          <div className="space-y-3">
            {reviewCandidates.slice(0, 5).map(({ candidate, pipeline }) => (
              <button
                key={`${pipeline.code}-${candidateKey(candidate)}`}
                onClick={() => onSelectCandidate(candidate, pipeline)}
                className="flex w-full items-center gap-3 rounded-lg border border-[#E5E4E0] bg-[#F8F7F3] p-3 text-left transition hover:border-[#12866E] hover:bg-white"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EEF6F3] text-xs font-semibold text-[#12866E]">
                  {candidate.score || <Eye className="size-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#111]">{candidate.name}</p>
                  <p className="truncate text-xs text-[#555]">{candidate.role} · {pipeline.openingTitle || pipeline.code}</p>
                </div>
                <Badge tone={clientStageTone[clientStageKey(candidate.stage)]}>{clientStageKey(candidate.stage).replace("-", " ")}</Badge>
              </button>
            ))}
            {!reviewCandidates.length ? (
              <Empty title="No candidates ready for review" text="When Nearwork presents candidates for your consideration they will appear here." />
            ) : null}
          </div>
        </section>

        {/* Right column: notifications + account manager */}
        <div className="space-y-4">
          {/* Recent updates */}
          <section className="rounded-xl border border-[#E5E4E0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#888]">Notifications</p>
                <h2 className="mt-1 text-base font-semibold text-[#111]">Recent updates</h2>
              </div>
              {notifications.filter((n) => !n.read).length > 0 ? (
                <span className="rounded-full bg-[#C73565] px-2 py-0.5 text-xs font-medium text-white">
                  {notifications.filter((n) => !n.read).length} new
                </span>
              ) : null}
            </div>
            <div className="space-y-2.5">
              {recentUpdates.length ? recentUpdates.map((item) => (
                <div key={item.id} onClick={() => onMarkRead(item.id)} className="cursor-pointer rounded-lg border border-[#E5E4E0] bg-[#F8F7F3] p-3 transition hover:bg-white">
                  <p className="text-sm font-medium text-[#111]">{item.title || "Nearwork update"}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#555]">{item.message}</p>
                  <p className="mt-1 text-[10px] text-[#888]">{dateTime(item.createdAt)}</p>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-[#E5E4E0] p-4 text-center text-sm text-[#888]">
                  You&rsquo;re all caught up.
                </div>
              )}
            </div>
          </section>

          {/* Account manager card */}
          {accountManager.name ? (
            <section className="rounded-xl border border-[#E5E4E0] bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#888]">Your Nearwork contact</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EEF6F3] text-sm font-semibold text-[#12866E]">
                  {initials(accountManager.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111]">{accountManager.name}</p>
                  <p className="truncate text-xs text-[#888]">{accountManager.email || "support@nearwork.co"}</p>
                </div>
              </div>
              {accountManager.email ? (
                <a href={`mailto:${accountManager.email}`} className="mt-3 block w-full rounded-md border border-[#E5E4E0] py-2 text-center text-sm font-medium text-[#555] transition hover:border-[#12866E] hover:text-[#12866E]">
                  Send a message
                </a>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileSettingsPanel({ profile, userId, onSave }: { profile: ClientUser; userId: string; onSave: (updated: Partial<ClientUser>) => void }) {
  const [displayRole, setDisplayRole] = React.useState(profile.displayRole || profile.jobTitle || "");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateClientProfile(userId, { displayRole: displayRole.trim() });
      onSave({ displayRole: displayRole.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Panel title="Your profile" eyebrow="Account">
      <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-[#555]">Display name</p>
          <input disabled value={profile.name || profile.email || ""} className="h-9 w-full rounded-md border border-[#E5E4E0] bg-[#F5F4F0] px-3 text-sm text-[#888]" />
          <p className="mt-1 text-xs text-[#888]">Name is set by your organization admin</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-[#555]">Email</p>
          <input disabled value={profile.email || ""} className="h-9 w-full rounded-md border border-[#E5E4E0] bg-[#F5F4F0] px-3 text-sm text-[#888]" />
        </div>
        <div className="md:col-span-2">
          <p className="mb-1 text-xs font-medium text-[#555]">Your role / title <span className="text-[#888] font-normal">(shown in sidebar)</span></p>
          <input
            value={displayRole}
            onChange={(e) => setDisplayRole(e.target.value)}
            placeholder="e.g. Hiring Manager, CEO, HR Lead..."
            className="h-9 w-full rounded-md border border-[#E5E4E0] bg-white px-3 text-sm text-[#111] outline-none focus:border-[#12866E]"
          />
          <p className="mt-1 text-xs text-[#888]">This is how your role appears to team members and Nearwork</p>
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#111] px-4 text-sm font-medium text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved ? <span className="text-sm text-[#12866E]">Saved!</span> : null}
        </div>
      </form>
    </Panel>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-[#E5E4E0] bg-white p-5"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-[#888]">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold text-[#111]">{title}</h2></div></div>{children}</section>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium uppercase tracking-wider text-[#888]">{label}</p><p className="mt-1 text-sm font-medium text-[#111]">{value}</p></div>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="rounded-lg border border-dashed border-[#E5E4E0] bg-[#F5F4F0] p-8 text-center"><p className="font-medium text-[#111]">{title}</p><p className="mt-2 text-sm text-[#555]">{text}</p></div>;
}

function PipelineBoard({
  rows,
  selectedCode,
  compareCodes,
  favoriteCodes,
  interviewCodes,
  onSelect,
  onCompare,
  onFavorite,
  onInterview,
}: {
  rows: Array<{ candidate: PortalCandidate; pipeline: PortalPipeline }>;
  selectedCode: string;
  compareCodes: string[];
  favoriteCodes: string[];
  interviewCodes: string[];
  onSelect: (code: string) => void;
  onCompare: (code: string) => void;
  onFavorite: (code: string) => void;
  onInterview: (code: string) => void;
}) {
  if (!rows.length) return <Empty title="No matching candidates" text="Try another search or wait for Nearwork to present candidates." />;
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1680px] grid-cols-7 gap-4">
        {pipelineStages.map((stage) => {
          const stageRows = rows.filter(({ candidate }) => normalizedPipelineStage(candidate.stage) === stage.key);
          return (
            <section key={stage.key} className="rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#555]">{stage.label}</p>
                <span className="rounded-full border border-[#E5E4E0] bg-white px-2 py-0.5 text-xs font-semibold text-[#555]">{stageRows.length}</span>
              </div>
              <div className="space-y-2">
                {stageRows.map(({ candidate, pipeline }) => (
                  <article
                    key={`${pipeline.code}-${candidateKey(candidate)}`}
                    className={cx(
                      "w-full rounded-md border bg-white p-4 text-left shadow-sm transition hover:border-[#12866E]",
                      selectedCode === candidate.code ? "border-[#12866E] ring-2 ring-[#12866E]/10" : "border-[#E5E4E0]",
                    )}
                  >
                    <button onClick={() => onSelect(candidate.code)} className="w-full text-left">
                      <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">{candidate.name}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-[#555]">{candidate.role}</p>
                        <p className="mt-1 truncate text-[11px] text-[#888]">{pipeline.openingTitle || pipeline.code}</p>
                      </div>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#EEF6F3] text-xs font-semibold text-[#12866E]">{candidate.score || "-"}</span>
                      </div>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(candidate.skills || []).slice(0, 2).map((skill) => <span key={skill} className="rounded-full bg-[#F5F4F0] px-2 py-0.5 text-[10px] font-medium text-[#555]">{skill}</span>)}
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-[#555]">
                      <div><span className="font-semibold text-[#111]">Expected pay:</span> {salaryTextUsd(candidate)}</div>
                      <div><span className="font-semibold text-[#111]">Recruiter:</span> {pipeline.recruiter || "Nearwork team"}</div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      <button onClick={() => onCompare(candidate.code)} className={cx("rounded-md border px-2 py-1.5 text-[11px] font-semibold", compareCodes.includes(candidate.code) ? "border-[#12866E] bg-[#EEF6F3] text-[#12866E]" : "border-[#E5E4E0] bg-white text-[#555]")}>Compare</button>
                      <button onClick={() => onFavorite(candidate.code)} className={cx("rounded-md border px-2 py-1.5 text-[11px] font-semibold", favoriteCodes.includes(candidate.code) ? "border-amber-200 bg-amber-50 text-amber-800" : "border-[#E5E4E0] bg-white text-[#555]")}>Favorite</button>
                      <button onClick={() => onInterview(candidate.code)} className={cx("rounded-md border px-2 py-1.5 text-[11px] font-semibold", interviewCodes.includes(candidate.code) ? "border-violet-200 bg-violet-50 text-violet-700" : "border-[#E5E4E0] bg-white text-[#555]")}>Interview</button>
                    </div>
                  </article>
                ))}
                {!stageRows.length ? <div className="rounded-md border border-dashed border-[#E5E4E0] bg-white p-3 text-center text-xs text-[#888]">No candidates</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function KanbanBoard({
  rows,
  onSelect,
}: {
  rows: Array<{ candidate: PortalCandidate; pipeline: PortalPipeline }>;
  onSelect: (candidate: PortalCandidate, pipeline: PortalPipeline) => void;
}) {
  if (!rows.length) return <Empty title="No candidates yet" text="When Nearwork adds candidates to your pipeline they will appear here." />;
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1100px] grid-cols-5 gap-3">
        {clientStages.map((stage) => {
          const stageRows = rows.filter(({ candidate }) => clientStageKey(candidate.stage) === stage.key);
          return (
            <section key={stage.key} className="min-h-[200px] rounded-xl border border-[#E5E4E0] bg-[#F8F7F3] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#555]">{stage.label}</p>
                <span className="rounded-full bg-white border border-[#E5E4E0] px-2 py-0.5 text-xs text-[#888]">{stageRows.length}</span>
              </div>
              <div className="space-y-2">
                {stageRows.map(({ candidate, pipeline }) => (
                  <button
                    key={`${pipeline.code}-${candidateKey(candidate)}`}
                    onClick={() => onSelect(candidate, pipeline)}
                    className="w-full rounded-lg border border-[#E5E4E0] bg-white p-3 text-left transition hover:border-[#12866E] hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#111]">{candidate.name}</p>
                        <p className="mt-0.5 truncate text-xs text-[#555]">{candidate.role}</p>
                      </div>
                      {candidate.score ? (
                        <span className="shrink-0 rounded-full bg-[#EEF6F3] px-1.5 py-0.5 text-[10px] font-medium text-[#12866E]">{candidate.score}</span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 truncate text-[10px] text-[#888]">{pipeline.openingTitle || pipeline.code}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(candidate.skills || []).slice(0, 2).map((skill) => (
                        <span key={skill} className="rounded-full bg-[#F5F4F0] px-2 py-0.5 text-[10px] text-[#555]">{skill}</span>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-[#888]">{salaryTextUsd(candidate)}</p>
                  </button>
                ))}
                {!stageRows.length ? <div className="rounded-lg border border-dashed border-[#E5E4E0] p-3 text-center text-xs text-[#888]">Empty</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OpeningsView({
  openings,
  pipelines,
  rows,
  onOpenPipeline,
}: {
  openings: PortalOpening[];
  pipelines: PortalPipeline[];
  rows: Array<{ candidate: PortalCandidate; pipeline: PortalPipeline }>;
  onOpenPipeline: (code: string) => void;
}) {
  if (!pipelines.length && !openings.length) {
    return (
      <Panel title="Open roles" eyebrow="Active openings">
        <Empty title="No openings yet" text="When Nearwork creates openings for your company they will appear here." />
      </Panel>
    );
  }
  return (
    <Panel title="Open roles" eyebrow="Active openings">
      <div className="grid gap-3 lg:grid-cols-2">
        {pipelines.map((pipeline) => {
          const opening = openings.find((item) => item.code === pipeline.openingCode || item.title === pipeline.openingTitle);
          const candidates = rows.filter((row) => row.pipeline.code === pipeline.code);
          const isActive = !["closed", "cancelled", "archived", "lost"].includes(String(pipeline.status || "").toLowerCase());
          return (
            <div key={pipeline.code} className="rounded-xl border border-[#E5E4E0] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#12866E] hover:shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#12866E]">{isActive ? "Active" : "Closed"}</p>
                  <h3 className="mt-1.5 text-base font-semibold text-[#111]">{pipeline.openingTitle || pipeline.code}</h3>
                  <p className="mt-1 text-sm text-[#555]">{opening?.code || pipeline.openingCode || pipeline.code} · {pipeline.recruiter || "Nearwork team"}</p>
                </div>
                <Badge tone={isActive ? "border-teal-200 bg-teal-50 text-teal-700" : "border-stone-200 bg-stone-50 text-stone-600"}>{pipeline.status || "Active"}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat label="Candidates" value={candidates.length} />
                <MiniStat label="In review" value={candidates.filter(({ candidate }) => ["final-round", "offer"].includes(clientStageKey(candidate.stage))).length} />
                <MiniStat label="Hired" value={candidates.filter(({ candidate }) => clientStageKey(candidate.stage) === "offer").length} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => onOpenPipeline(pipeline.code)} className="text-xs font-medium text-[#12866E] hover:underline">
                  View in pipeline →
                </button>
                <a href={`/pipeline/${pipeline.code}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-[#555] hover:text-[#12866E]">
                  <ExternalLink className="size-3" /> Dedicated page
                </a>
              </div>
            </div>
          );
        })}
        {openings.filter((opening) => !pipelines.some((pipeline) => pipeline.openingCode === opening.code || pipeline.openingTitle === opening.title)).map((opening) => (
          <article key={opening.id || opening.code} className="rounded-xl border border-dashed border-[#E5E4E0] bg-white p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#C73565]">Awaiting pipeline</p>
            <h3 className="mt-1.5 text-base font-semibold text-[#111]">{opening.title}</h3>
            <p className="mt-1 text-sm text-[#555]">{opening.code} · {opening.roleLibraryDepartment || "Department pending"}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label="Candidates" value={0} />
              <MiniStat label="In review" value={0} />
              <MiniStat label="Hired" value={0} />
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function OpeningChatPanel({
  companyName,
  recruiter,
  messages,
  value,
  setValue,
  onSend,
}: {
  companyName: string;
  recruiter: string;
  messages: OpeningChatMessage[];
  value: string;
  setValue: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <Panel title="Opening chat" eyebrow={`${companyName} + Nearwork`}>
      <div className="rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Shared conversation for this opening</p>
            <p className="text-sm text-[#555]">Nearwork recruiter: {recruiter}. Messages stay attached to this opening.</p>
          </div>
          <Badge tone="border-teal-200 bg-teal-50 text-teal-700">Group chat</Badge>
        </div>
        <div className="max-h-72 space-y-3 overflow-auto rounded-md border border-[#E5E4E0] bg-white p-3">
          {messages.map((message) => {
            const client = message.authorType !== "nearwork";
            return (
              <article key={message.id} className={cx("max-w-[82%] rounded-lg p-3", client ? "ml-auto bg-[#EEF6F3]" : "bg-[#F5F4F0]")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{message.author || (client ? companyName : "Nearwork")}</p>
                  <p className="text-[11px] font-medium text-[#888]">{dateTime(message.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#555]">{message.text}</p>
              </article>
            );
          })}
          {!messages.length ? <Empty title="No messages yet" text="Start the opening conversation here. Nearwork will see the message on this opening thread." /> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ask Nearwork about this opening, timeline, candidate feedback, or next steps..."
            className="min-h-24 resize-none rounded-md border border-[#E5E4E0] bg-white p-3 text-sm outline-none focus:border-[#12866E]"
          />
          <button onClick={onSend} disabled={!value.trim()} className="h-11 self-end rounded-md bg-[#12866E] px-5 text-sm font-semibold text-white disabled:opacity-50">
            Send message
          </button>
        </div>
      </div>
    </Panel>
  );
}

function HiresTable({ hires, onOpen }: { hires: PortalHire[]; onOpen: (hire: PortalHire) => void }) {
  if (!hires.length) return <Empty title="No hired candidates yet" text="When Nearwork marks a candidate as hired, their employment/service details will appear here." />;
  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E4E0] bg-white">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-[#F5F4F0] text-xs font-medium uppercase tracking-wider text-[#888]">
          <tr><th className="px-4 py-3">Hire</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">Monthly price</th><th className="px-4 py-3">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-[#d8dee4]">
          {hires.map((hire) => {
            const name = hire.candidateName || hire.name || hire.email || "Hired candidate";
            return (
              <tr key={hire.id} className="hover:bg-[#F5F4F0]">
                <td className="px-4 py-3"><button onClick={() => onOpen(hire)} className="text-left"><p className="font-semibold">{name}</p><p className="text-xs text-[#888]">{hire.candidateCode || hire.pipelineCode || hire.uniqueUrl}</p></button></td>
                <td className="px-4 py-3 text-[#555]">{hire.role || "Role pending"}</td>
                <td className="px-4 py-3"><Badge>{hire.serviceType || hire.engagementType || hire.contractType || "Direct Recruiting"}</Badge></td>
                <td className="px-4 py-3 text-[#555]">{hire.startDate || hire.effectiveDate || "Pending"}</td>
                <td className="px-4 py-3 font-medium">{clientPriceText(hire)}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Badge tone="border-teal-200 bg-teal-50 text-teal-700">{hire.status || "Active"}</Badge><button onClick={() => onOpen(hire)} className="grid size-8 place-items-center rounded-md border border-[#E5E4E0] bg-white"><Eye className="size-4" /></button></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TimeOffTable({ requests }: { requests: TimeOffRequest[] }) {
  if (!requests.length) return <Empty title="No PTO requests yet" text="Requests submitted from talent.nearwork.co will appear here for review and history." />;
  return (
    <div className="grid gap-3">
      {requests.map((request) => {
        const status = String(request.status || "Pending");
        const tone = status.toLowerCase() === "approved" ? "border-teal-200 bg-teal-50 text-teal-700" : status.toLowerCase() === "denied" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-violet-200 bg-violet-50 text-violet-700";
        return (
          <article key={request.id} className="rounded-lg border border-[#E5E4E0] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{request.personName || request.name || request.candidateCode || "Employee"}</p>
                <p className="mt-1 text-sm text-[#555]">{request.role || request.type || "Time off"} · {request.from || request.startDate || "Start pending"} to {request.to || request.endDate || "End pending"}</p>
                {request.comments ? <p className="mt-2 text-sm leading-6 text-[#555]">{request.comments}</p> : null}
              </div>
              <Badge tone={tone}>{status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="h-9 rounded-md bg-[#12866E] px-3 text-sm font-semibold text-white">Approve</button>
              <button className="h-9 rounded-md border border-[#E5E4E0] bg-white px-3 text-sm font-semibold text-[#111]">Deny</button>
              <button className="h-9 rounded-md border border-[#E5E4E0] bg-white px-3 text-sm font-semibold text-[#111]">Add comment</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function InsightRadar({ radar }: { radar?: PortalAssessmentInsight["radar"] }) {
  const points = (radar || []).slice(0, 5);
  if (!points.length) return null;
  const cx = 110;
  const cy = 104;
  const maxR = 70;
  const toPoint = (value: number, index: number) => {
    const angle = (-90 + index * (360 / points.length)) * Math.PI / 180;
    const radius = maxR * Math.max(0, Math.min(100, Number(value || 0))) / 100;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  };
  const poly = points.map((item, index) => {
    const point = toPoint(item.candidate, index);
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(" ");
  const averagePoly = points.map((item, index) => {
    const point = toPoint(item.average, index);
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 220 210" className="mx-auto h-60 w-full max-w-72" role="img" aria-label="Assessment radar">
      <polygon points="110,34 176,82 151,160 69,160 44,82" fill="none" stroke="#d8dee4" />
      <polygon points="110,58 153,90 137,141 83,141 67,90" fill="none" stroke="#eef2f7" />
      <polygon points={averagePoly} fill="rgba(109,40,217,.10)" stroke="#AF7AC5" strokeWidth="1.5" strokeDasharray="5 4" />
      <polygon points={poly} fill="rgba(22,160,133,.18)" stroke="#12866E" strokeWidth="2.5" />
      {points.map((item, index) => {
        const angle = (-90 + index * (360 / points.length)) * Math.PI / 180;
        const x = cx + Math.cos(angle) * 91;
        const y = cy + Math.sin(angle) * 91;
        return <text key={item.label} x={x} y={y} textAnchor="middle" fontSize="9" fontWeight="700" fill="#555">{item.label.slice(0, 18)}</text>;
      })}
    </svg>
  );
}

function insightBarColor(label: string) {
  const key = label.toLowerCase();
  if (key.includes("technical")) return "linear-gradient(90deg, #2F80ED, #79B8FF)";
  if (key.includes("communication")) return "linear-gradient(90deg, #F2C94C, #FFE08A)";
  if (key.includes("work") || key.includes("disc")) return "linear-gradient(90deg, #6D28D9, #AF7AC5)";
  if (key.includes("experience")) return "linear-gradient(90deg, #16A085, #8EDFD1)";
  return "linear-gradient(90deg, #12866E, #8EDFD1)";
}

function InsightBars({ bars }: { bars?: PortalAssessmentInsight["bars"] }) {
  const rows = (bars || []).slice(0, 6);
  if (!rows.length) return null;
  return (
    <div className="space-y-4">
      {rows.map((item) => {
        const candidate = Math.max(0, Math.min(100, Number(item.candidate || 0)));
        const average = Math.max(0, Math.min(100, Number(item.average || 0)));
        return (
          <div key={item.label}>
            <div className="mb-2 flex justify-between gap-3 text-xs font-medium text-[#555]">
              <span className="font-semibold text-[#111]">{item.label}</span>
              <span>{candidate}% · role avg {average}%</span>
            </div>
            <div className="relative h-3 rounded-full bg-[#edf1f5]">
              <span className="absolute -top-1 h-5 w-0.5 rounded-full bg-[#6D28D9]" style={{ left: `${average}%` }} />
              <span className="block h-3 rounded-full" style={{ width: `${candidate}%`, background: insightBarColor(item.label) }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClientAiInsight({ candidate, compact = false }: { candidate: PortalCandidate; compact?: boolean }) {
  const generated = Boolean(candidate.aiReview?.client);
  const insight = candidateInsight(candidate) || fallbackClientInsight(candidate);
  const fallbackInsight = fallbackClientInsight(candidate);
  const client = insight.client || fallbackInsight.client || {
    summary: "Nearwork will show the candidate evidence and interview guidance here.",
    technicalBreakdown: "",
    discSummary: "",
    strengths: [],
    watchouts: [],
    followUps: [],
    interviewGuide: [],
  };
  return (
    <div className="mt-4 grid gap-4">
      <div className="rounded-lg border border-teal-100 bg-gradient-to-br from-[#eef8f5] via-white to-[#f7f0fb] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#12866E]">Assessment insights</p>
          <span className={cx("rounded-full px-3 py-1 text-xs font-semibold", generated ? "bg-teal-100 text-[#12866E]" : "bg-violet-100 text-[#6D28D9]")}>
            {generated ? "Generated review" : "Benchmark preview"}
          </span>
        </div>
        <p className="mt-2 font-semibold">{insight?.summaryTitle || "Candidate vs role benchmark"}</p>
        <p className="mt-2 text-sm leading-6 text-[#555]">{client.summary}</p>
      </div>
      {!compact ? (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#E5E4E0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D28D9]">Match radar</p>
            <InsightRadar radar={insight?.radar} />
            <p className="text-xs text-[#888]">Solid line: candidate · dashed line: role average</p>
          </div>
          <div className="rounded-lg border border-[#E5E4E0] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D28D9]">Candidate vs role average</p>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-[#555]"><span className="h-4 w-0.5 rounded-full bg-[#6D28D9]" /> Role avg marker</span>
            </div>
            <div className="mt-4"><InsightBars bars={insight?.bars} /></div>
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#E5E4E0] bg-white p-4">
          <p className="font-semibold">Strengths</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#555]">{insightTextList(client.strengths).map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p className="font-semibold">Watchouts & follow-ups</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#555]">{insightTextList([...(client.watchouts || []), ...(client.followUps || [])]).map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
      </div>
      {!compact ? (
        <div className="rounded-lg border border-[#E5E4E0] bg-white p-4">
          <p className="font-semibold">Interview guide</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#555]">{insightTextList(client.interviewGuide).map((item) => <li key={item}>{item}</li>)}</ol>
        </div>
      ) : null}
    </div>
  );
}

function CandidateDetail({
  candidate,
  pipeline,
  companyName,
  notes,
  noteText,
  noteScope,
  setNoteText,
  setNoteScope,
  saveNote,
  openFullProfile,
  closeDetail,
}: {
  candidate: PortalCandidate;
  pipeline: PortalPipeline;
  companyName: string;
  notes: PortalNote[];
  noteText: string;
  noteScope: "client_visible" | "client_internal";
  setNoteText: (value: string) => void;
  setNoteScope: (value: "client_visible" | "client_internal") => void;
  saveNote: () => void;
  openFullProfile: () => void;
  closeDetail: () => void;
}) {
  const breakdown = assessmentBreakdown(candidate);
  const disc = discInsight(candidate);
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-[#EEF6F3] text-sm font-medium text-[#12866E]">{initials(candidate.name)}</div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#111]">{candidate.name}</p>
          <p className="text-sm text-[#555]">{candidate.role} · {pipeline.openingTitle}</p>
        </div>
        <button onClick={closeDetail} className="grid size-7 place-items-center rounded border border-[#E5E4E0] bg-white text-[#888]" aria-label="Close candidate profile">
          <X className="size-3.5" />
        </button>
        <Score value={candidate.score} />
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <Detail label="Email" value={candidate.email || "Not shared"} />
        <Detail label="Expected pay" value={salaryTextUsd(candidate)} />
        <Detail label="Assessment" value={`Overall ${breakdown.overall || "pending"} · Technical ${breakdown.technical || "pending"}`} />
        <Detail label="DISC" value={candidate.discProfile?.label || "Pending"} />
      </div>
      <div className="mt-4 rounded-lg border border-teal-100 bg-[#EEF6F3] p-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#12866E]">Recruiter contact</p>
        <p className="mt-1 text-sm font-medium text-[#111]">{pipeline.recruiter || "Nearwork recruiting team"}</p>
        <p className="mt-1 text-xs text-[#555]">Use notes for candidate-specific questions.</p>
      </div>
      <div className="mt-3 rounded-lg border border-[#E5E4E0] bg-white p-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#12866E]">Assessment</p>
        <p className="mt-1.5 text-sm font-medium text-[#111]">{breakdown.signal}</p>
        <p className="mt-1 text-sm leading-5 text-[#555]">{breakdown.focus}</p>
      </div>
      <ClientAiInsight candidate={candidate} compact />
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={openFullProfile} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#12866E] px-3 text-sm font-medium text-white"><ExternalLink className="size-4" /> Full profile</button>
        {candidate.cvUrl ? <a href={candidate.cvUrl} target="_blank" className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E5E4E0] px-3 text-sm font-medium text-[#555]"><FileText className="size-4" /> CV</a> : null}
      </div>
      <div className="mt-5 space-y-2">
        <p className="text-sm font-medium text-[#111]">Add note</p>
        <select value={noteScope} onChange={(event) => setNoteScope(event.target.value as "client_visible" | "client_internal")} className="h-9 w-full rounded-lg border border-[#E5E4E0] bg-white px-3 text-sm text-[#111]">
          <option value="client_visible">Visible to Nearwork</option>
          <option value="client_internal">{companyName} internal only</option>
        </select>
        <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Add a note..." className="min-h-24 w-full resize-none rounded-lg border border-[#E5E4E0] bg-white p-3 text-sm text-[#111] outline-none placeholder:text-[#888] focus:border-[#12866E]" />
        <button onClick={saveNote} disabled={!noteText.trim()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#12866E] px-3 text-sm font-medium text-white disabled:opacity-50"><MessageCircle className="size-4" /> Save</button>
      </div>
      <div className="mt-5 space-y-2">
        {notes.map((note) => (
          <article key={note.id} className="rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] p-3">
            <div className="flex justify-between gap-3">
              <p className="text-xs font-medium text-[#555]">{note.scope === "client_internal" ? `${companyName} internal` : "Shared with Nearwork"}</p>
              <p className="text-xs text-[#888]">{dateTime(note.createdAt)}</p>
            </div>
            <p className="mt-1.5 text-sm leading-5 text-[#555]">{note.text}</p>
          </article>
        ))}
        {!notes.length ? <p className="text-xs text-[#888]">No notes for this candidate yet.</p> : null}
      </div>
    </div>
  );
}

// PipelineList is kept for backward compat but navigation now uses OpeningsView
function PipelineList({
  openings,
  pipelines,
  rows,
  onOpen,
}: {
  openings: PortalOpening[];
  pipelines: PortalPipeline[];
  rows: Array<{ candidate: PortalCandidate; pipeline: PortalPipeline }>;
  onOpen: (code: string) => void;
}) {
  if (!pipelines.length && !openings.length) return <Panel title="Open roles" eyebrow="Active openings"><Empty title="No openings yet" text="When Nearwork creates openings and pipelines for your company, they will appear here." /></Panel>;
  return (
    <Panel title="Open roles" eyebrow="Active openings">
      <div className="grid gap-3 lg:grid-cols-2">
        {pipelines.map((pipeline) => {
          const opening = openings.find((item) => item.code === pipeline.openingCode || item.title === pipeline.openingTitle);
          const candidates = rows.filter((row) => row.pipeline.code === pipeline.code);
          const isActive = !["closed", "cancelled", "archived", "lost"].includes(String(pipeline.status || "").toLowerCase());
          return (
            <button key={pipeline.code} onClick={() => onOpen(pipeline.code)} className="rounded-xl border border-[#E5E4E0] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#12866E] hover:shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#12866E]">{isActive ? "Active" : "Closed"}</p>
                  <h3 className="mt-1.5 text-base font-semibold text-[#111]">{pipeline.openingTitle || pipeline.code}</h3>
                  <p className="mt-1 text-sm text-[#555]">{opening?.code || pipeline.openingCode || pipeline.code} · {pipeline.recruiter || opening?.recruiter || "Nearwork team"}</p>
                </div>
                <Badge tone={isActive ? "border-teal-200 bg-teal-50 text-teal-700" : "border-stone-200 bg-stone-50 text-stone-600"}>{pipeline.status || "Active"}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat label="Candidates" value={candidates.length} />
                <MiniStat label="In review" value={candidates.filter(({ candidate }) => ["final-round", "offer"].includes(clientStageKey(candidate.stage))).length} />
                <MiniStat label="Hired" value={candidates.filter(({ candidate }) => clientStageKey(candidate.stage) === "offer").length} />
              </div>
            </button>
          );
        })}
        {openings.filter((opening) => !pipelines.some((pipeline) => pipeline.openingCode === opening.code || pipeline.openingTitle === opening.title)).map((opening) => (
          <article key={opening.id || opening.code} className="rounded-xl border border-dashed border-[#E5E4E0] bg-white p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#C73565]">Awaiting pipeline</p>
            <h3 className="mt-1.5 text-base font-semibold text-[#111]">{opening.title}</h3>
            <p className="mt-1 text-sm text-[#555]">{opening.code} · {opening.roleLibraryDepartment || "Department pending"}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label="Candidates" value={0} />
              <MiniStat label="In review" value={0} />
              <MiniStat label="Hired" value={0} />
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] p-3"><p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">{label}</p><p className="mt-1 text-xl font-semibold text-[#111]">{value}</p></div>;
}

function CandidateCompare({
  rows,
  compareCodes,
  favoriteCodes,
  interviewCodes,
  onCompare,
  onFavorite,
  onInterview,
}: {
  rows: Array<{ candidate: PortalCandidate; pipeline: PortalPipeline }>;
  compareCodes: string[];
  favoriteCodes: string[];
  interviewCodes: string[];
  onCompare: (code: string) => void;
  onFavorite: (code: string) => void;
  onInterview: (code: string) => void;
}) {
  const selected = compareCodes.map((code) => rows.find(({ candidate }) => candidate.code === code)).filter(Boolean) as Array<{ candidate: PortalCandidate; pipeline: PortalPipeline }>;
  return (
    <Panel title="Compare candidates" eyebrow="Up to 3 profiles">
      {!selected.length ? (
        <Empty title="Select candidates to compare" text="Use the Compare button on candidate cards to place up to three profiles side by side." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {selected.map(({ candidate, pipeline }) => {
            const breakdown = assessmentBreakdown(candidate);
            const disc = discInsight(candidate);
            return (
              <article key={`${pipeline.code}-${candidate.code}`} className="rounded-xl border border-[#E5E4E0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold">{candidate.name}</p>
                    <p className="mt-1 text-sm text-[#555]">{candidate.role || pipeline.openingTitle}</p>
                  </div>
                  <Score value={candidate.score} />
                </div>
                <div className="mt-5 grid gap-3 text-sm">
                  <Detail label="Experience signal" value={candidate.status || "Active profile"} />
                  <Detail label="English" value={candidate.english || "Pending"} />
                  <Detail label="Expected pay" value={salaryTextUsd(candidate)} />
                  <Detail label="Location" value={candidate.location || "Colombia"} />
                  <Detail label="Technical" value={`${breakdown.technical || "Pending"} · ${breakdown.signal}`} />
                  <Detail label="DISC" value={`${disc.title}: ${disc.fit}`} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => onFavorite(candidate.code)} className={cx("inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold", favoriteCodes.includes(candidate.code) ? "border-amber-200 bg-amber-50 text-amber-800" : "border-[#E5E4E0] bg-white text-[#111]")}><Star className="size-4" /> Favorite</button>
                  <button onClick={() => onInterview(candidate.code)} className={cx("inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold", interviewCodes.includes(candidate.code) ? "border-violet-200 bg-violet-50 text-violet-700" : "border-[#E5E4E0] bg-white text-[#111]")}><UserCheck className="size-4" /> Interview</button>
                  <button onClick={() => onCompare(candidate.code)} className="h-9 rounded-md border border-[#E5E4E0] bg-white px-3 text-sm font-semibold text-[#555]">Remove</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function CandidateFullPage({
  candidate,
  pipeline,
  companyName,
  notes,
  noteText,
  noteScope,
  setNoteText,
  setNoteScope,
  saveNote,
  onBack,
  onFavorite,
  onInterview,
  favorite,
  interview,
}: {
  candidate: PortalCandidate;
  pipeline: PortalPipeline;
  companyName: string;
  notes: PortalNote[];
  noteText: string;
  noteScope: "client_visible" | "client_internal";
  setNoteText: (value: string) => void;
  setNoteScope: (value: "client_visible" | "client_internal") => void;
  saveNote: () => void;
  onBack: () => void;
  onFavorite: () => void;
  onInterview: () => void;
  favorite: boolean;
  interview: boolean;
}) {
  const breakdown = assessmentBreakdown(candidate);
  const disc = discInsight(candidate);
  const stageKey = clientStageKey(candidate.stage);
  const stageLabel = clientStages.find((s) => s.key === stageKey)?.label || "Screening";
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#888]">
        <button onClick={onBack} className="hover:text-[#12866E]">Pipeline</button>
        <span>/</span>
        <span className="text-[#555]">{pipeline.openingTitle || pipeline.code}</span>
        <span>/</span>
        <span className="font-medium text-[#111]">{candidate.name}</span>
      </nav>
      {/* Hero section */}
      <section className="rounded-xl border border-[#E5E4E0] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="grid size-14 place-items-center rounded-xl bg-[#EEF6F3] text-lg font-semibold text-[#12866E]">{initials(candidate.name)}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-2xl font-semibold text-[#111]">{candidate.name}</p>
                <Badge tone={clientStageTone[stageKey] || "border-stone-200 bg-stone-50 text-stone-600"}>{stageLabel}</Badge>
              </div>
              <p className="mt-1 text-[#555]">{candidate.role || pipeline.openingTitle} · {pipeline.openingTitle}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{(candidate.skills || []).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
            </div>
          </div>
          <Score value={candidate.score} />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="Nearwork score" value={candidate.score || 0} sub="Overall match" />
          <Metric label="Technical" value={breakdown.technical || 0} sub={breakdown.signal} />
          <div className="rounded-xl border border-[#E5E4E0] bg-[#F5F4F0] p-4"><Detail label="Expected pay" value={salaryTextUsd(candidate)} /></div>
          <div className="rounded-xl border border-[#E5E4E0] bg-[#F5F4F0] p-4"><Detail label="English" value={candidate.english || "Pending"} /></div>
        </div>
        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={onFavorite} className={cx("inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium", favorite ? "border-amber-200 bg-amber-50 text-amber-800" : "border-[#E5E4E0] bg-white text-[#555] hover:border-[#111]")}><Star className="size-4" /> {favorite ? "Favorited" : "Favorite"}</button>
          <button onClick={onInterview} className={cx("inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium", interview ? "border-violet-200 bg-violet-50 text-violet-700" : "border-[#E5E4E0] bg-white text-[#555] hover:border-[#111]")}><UserCheck className="size-4" /> {interview ? "Interview requested" : "Request interview"}</button>
          <button onClick={() => alert("Schedule interview — contact your Nearwork recruiter to confirm the time.")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#12866E] px-4 text-sm font-medium text-white hover:bg-[#0e7060]">
            Schedule interview
          </button>
          <button onClick={() => alert("To decline a candidate, please message your Nearwork recruiter in the opening chat.")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E4E0] bg-white px-4 text-sm font-medium text-[#888] hover:border-[#C73565] hover:text-[#C73565]">
            Not a fit
          </button>
          {candidate.cvUrl ? <a href={candidate.cvUrl} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E4E0] bg-white px-4 text-sm font-medium text-[#555] hover:border-[#111]"><FileText className="size-4" /> CV</a> : null}
          {candidate.linkedin ? <a href={candidate.linkedin} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E4E0] bg-white px-4 text-sm font-medium text-[#555] hover:border-[#111]"><ExternalLink className="size-4" /> LinkedIn</a> : null}
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Assessment detail" eyebrow="Score explanation">
          <ClientAiInsight candidate={candidate} />
        </Panel>
        <DiscProfileCard candidate={candidate} />
      </section>
      <DiscCommunicationCard candidate={candidate} />
      <Panel title="Notes" eyebrow="Pipeline history">
        <div className="mb-4 space-y-3">
          {notes.map((note) => (
            <article key={note.id} className="rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] p-4">
              <div className="flex justify-between gap-3">
                <p className="text-sm font-medium text-[#111]">{note.scope === "client_internal" ? `${companyName} internal` : "Shared with Nearwork"}</p>
                <p className="text-xs text-[#888]">{dateTime(note.createdAt)}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#555]">{note.text}</p>
            </article>
          ))}
          {!notes.length ? <Empty title="No notes yet" text="Notes for this candidate will show here." /> : null}
        </div>
        <select value={noteScope} onChange={(event) => setNoteScope(event.target.value as "client_visible" | "client_internal")} className="h-10 w-full rounded-lg border border-[#E5E4E0] bg-white px-3 text-sm text-[#111]">
          <option value="client_visible">Visible to Nearwork</option>
          <option value="client_internal">{companyName} internal only</option>
        </select>
        <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Add a note about this candidate..." className="mt-3 min-h-24 w-full resize-none rounded-lg border border-[#E5E4E0] bg-white p-3 text-sm text-[#111] outline-none placeholder:text-[#888] focus:border-[#12866E]" />
        <button onClick={saveNote} disabled={!noteText.trim()} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-[#12866E] px-4 text-sm font-medium text-white disabled:opacity-50">
          <MessageCircle className="size-4" /> Save note
        </button>
      </Panel>
    </div>
  );
}

function DiscProfileCard({ candidate }: { candidate: PortalCandidate }) {
  const label = candidate.discProfile?.label || "High C";
  const isC = label.toLowerCase().includes("c");
  const scores = isC
    ? { dominance: 57, influence: 49, steadiness: 55, conscientiousness: 79 }
    : { dominance: 42, influence: 76, steadiness: 72, conscientiousness: 54 };
  return (
    <Panel title="DISC profile" eyebrow={label}>
      <div className="grid gap-5 md:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          {[
            ["Dominance (D)", scores.dominance, "bg-rose-500"],
            ["Influence (I)", scores.influence, "bg-amber-400"],
            ["Steadiness (S)", scores.steadiness, "bg-emerald-500"],
            ["Conscientiousness (C)", scores.conscientiousness, "bg-blue-500"],
          ].map(([name, value, color]) => (
            <div key={String(name)}>
              <div className="flex justify-between text-sm font-semibold"><span>{name}</span><span>{value}%</span></div>
              <div className="mt-2 h-3 rounded-full bg-[#edf1f5]"><div className={cx("h-3 rounded-full", color as string)} style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="grid place-items-center rounded-xl border border-[#E5E4E0] bg-[#F5F4F0] p-4">
          <div className="relative grid size-40 place-items-center rounded-full border border-blue-100 bg-white">
            <div className="grid size-28 place-items-center rounded-full border border-blue-100 bg-blue-50 text-center">
              <p className="text-3xl font-semibold text-blue-600">{scores.conscientiousness}</p>
              <p className="text-xs font-medium text-[#555]">Current profile</p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function DiscCommunicationCard({ candidate }: { candidate: PortalCandidate }) {
  const disc = discInsight(candidate);
  return (
    <Panel title={`How to work with ${candidate.name.split(" ")[0] || "this person"}`} eyebrow="DISC communication">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-3 text-lg font-semibold text-[#12866E]">Best practices</p>
          {["Use data-backed arguments", "Be direct and professional", "Provide written details"].map((item) => (
            <div key={item} className="mb-3 rounded-lg border border-teal-200 bg-[#EEF6F3] p-3 text-sm font-medium">{item}</div>
          ))}
        </div>
        <div>
          <p className="mb-3 text-lg font-semibold text-amber-800">What to avoid</p>
          {["Vague or abstract instructions", "Overly emotional appeals", "Dismissing their need for precision"].map((item) => (
            <div key={item} className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium">{item}</div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-[#E5E4E0] bg-white p-4 text-sm leading-6 text-[#555]">
        <span className="font-semibold text-[#111]">Role fit:</span> {disc.fit}
      </div>
    </Panel>
  );
}

function HireFullPage({
  hire,
  timeOff,
  accountManager,
  onBack,
}: {
  hire: PortalHire;
  timeOff: TimeOffRequest[];
  accountManager: { name: string; email: string; phone: string };
  onBack: () => void;
}) {
  const name = hire.candidateName || hire.name || "Employee";
  const employeePto = timeOff.filter((request) => request.candidateCode === hire.candidateCode || request.personName === name);
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[#12866E]"><ArrowLeft className="size-4" /> Back to hires</button>
      <section className="overflow-hidden rounded-xl border border-[#E5E4E0] bg-white shadow-sm">
        <div className="bg-blue-500 px-6 py-8 text-white">
          <div className="flex flex-wrap items-center gap-5">
            <div className="grid size-20 place-items-center rounded-full border-4 border-white bg-[#EEF6F3] text-2xl font-semibold text-[#12866E]">{initials(name)}</div>
            <div>
              <h1 className="text-3xl font-semibold">{name}</h1>
              <p className="mt-1 text-lg">{hire.role || "Role pending"} · {hire.engagementType || hire.serviceType || "Service"}</p>
            </div>
          </div>
        </div>
        <div className="grid divide-y divide-[#d8dee4] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <Detail label="Start date" value={hire.startDate || "Pending"} />
            <Detail label="Effective date" value={hire.effectiveDate || "Pending"} />
            <Detail label="Monthly price" value={clientPriceText(hire)} />
            <Detail label="Status" value={hire.status || "Active"} />
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <Detail label="Account manager" value={accountManager.name} />
            <Detail label="Nearwork contact" value={accountManager.email} />
            <Detail label="Pipeline" value={hire.pipelineCode || "Not linked"} />
            <Detail label="Opening" value={hire.openingCode || "Not linked"} />
          </div>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Performance" eyebrow="Quarterly and yearly">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="English" value={4} sub="Q score" />
            <Metric label="Engagement" value={4} sub="Q score" />
            <Metric label="Tech skills" value={4} sub="Q score" />
            <Metric label="Soft skills" value={4} sub="Q score" />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#555]">Quarterly and yearly review history can sync here from the staff portal once reviews are created.</p>
        </Panel>
        <Panel title="PTO history" eyebrow="Requests">
          <div className="space-y-3">
            {employeePto.map((request) => <div key={request.id} className="rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] p-3 text-sm"><p className="font-semibold">{request.type || "PTO"} · {request.status || "Pending"}</p><p className="text-[#555]">{request.from || request.startDate} to {request.to || request.endDate}</p></div>)}
            {!employeePto.length ? <Empty title="No PTO yet" text="Approved and pending PTO requests will appear here." /> : null}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function ServicesView({ hires }: { hires: PortalHire[] }) {
  const services = [
    { title: "EOR", text: "Payroll, compliance, local employment support, and benefits administration.", count: hires.filter((hire) => String(hire.serviceType || hire.engagementType || "").toLowerCase().includes("eor")).length },
    { title: "Managed Team", text: "Dedicated teams with Nearwork support, team leadership, and operating cadence.", count: hires.filter((hire) => String(hire.serviceType || hire.engagementType || "").toLowerCase().includes("managed")).length },
    { title: "MSP / NSPP", text: "Payroll partner and workforce operations support for non-standard employment models.", count: hires.filter((hire) => String(hire.serviceType || hire.engagementType || "").toLowerCase().includes("msp")).length },
    { title: "Direct Recruiting", text: "Role intake, sourcing, screening, assessment, and candidate presentation.", count: hires.filter((hire) => String(hire.serviceType || hire.engagementType || "").toLowerCase().includes("direct")).length },
  ];
  return (
    <Panel title="Services" eyebrow="Nearwork support">
      <div className="grid gap-4 lg:grid-cols-2">
        {services.map((service) => (
          <article key={service.title} className="rounded-xl border border-[#E5E4E0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#555]">{service.text}</p>
              </div>
              <span className="grid size-12 place-items-center rounded-full bg-[#EEF6F3] text-lg font-semibold text-[#12866E]">{service.count}</span>
            </div>
            <button className="mt-5 h-10 rounded-md border border-[#E5E4E0] bg-white px-4 text-sm font-semibold text-[#111]">Talk to Nearwork</button>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function TimeOffCalendar({ requests }: { requests: TimeOffRequest[] }) {
  const holidays = [
    { date: "May 25", label: "US Memorial Day" },
    { date: "Jul 20", label: "Colombia Independence Day" },
    { date: "Jul 4", label: "US Independence Day" },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="rounded-xl border border-[#E5E4E0] bg-[#F5F4F0] p-4">
        <div className="mb-4 flex items-center gap-2"><CalendarDays className="size-5 text-[#12866E]" /><p className="font-semibold">Calendar view</p></div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[#888]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day}>{day}</div>)}
          {Array.from({ length: 35 }).map((_, index) => {
            const day = index + 1;
            const hasPto = requests.some((request) => String(request.from || request.startDate || "").endsWith(String(day).padStart(2, "0")));
            return <div key={day} className={cx("min-h-16 rounded-lg border bg-white p-2 text-left", hasPto ? "border-[#12866E] bg-[#EEF6F3]" : "border-[#E5E4E0]")}><span>{day}</span>{hasPto ? <p className="mt-2 rounded bg-[#12866E] px-1 py-0.5 text-[10px] text-white">PTO</p> : null}</div>;
          })}
        </div>
      </div>
      <div className="rounded-xl border border-[#E5E4E0] bg-white p-4">
        <p className="font-semibold">Holidays and reminders</p>
        <div className="mt-3 space-y-2">
          {holidays.map((holiday) => <div key={holiday.label} className="rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] p-3 text-sm"><p className="font-semibold">{holiday.date}</p><p className="text-[#555]">{holiday.label}</p></div>)}
        </div>
      </div>
    </div>
  );
}

function FinanceView({ org, hires, accountManager, profile }: { org: Organization; hires: PortalHire[]; accountManager: { name: string; email: string; phone: string }; profile: ClientUser }) {
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("All Months");
  const [quarter, setQuarter] = useState("All Quarters");
  const [invoice, setInvoice] = useState("All invoices");
  const canView = ["client_admin", "admin", "owner", "finance"].includes(String(profile.role || profile.portalRole || "").toLowerCase().replace(/\s+/g, "_"));
  const totalMonthly = hires.reduce((sum, hire) => sum + Number(hire.usdBilledMonthly || hire.salesPrice || 0), 0);
  const monthlyRows = ["January", "February", "March", "April", "May"].map((label, index) => ({
    month: label,
    teamSize: Math.max(hires.length, 1),
    teamCost: totalMonthly || 0,
    otherTeamCharges: index === 4 ? Math.round((totalMonthly || 0) * 0.08) : 0,
    otherCharges: index === 0 ? 250 : 0,
    discounts: 0,
  }));
  if (!canView) return <Panel title="Finance" eyebrow="Restricted"><Empty title="Finance access required" text="Ask your company admin or Nearwork account manager to enable finance access." /></Panel>;
  return (
    <Panel title="Finance" eyebrow={`${org.name} billing`}>
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <select value={year} onChange={(event) => setYear(event.target.value)} className="h-11 rounded-md border border-[#E5E4E0] bg-white px-3 text-sm font-medium"><option>2026</option><option>2025</option><option>2024</option></select>
        <select value={quarter} onChange={(event) => setQuarter(event.target.value)} className="h-11 rounded-md border border-[#E5E4E0] bg-white px-3 text-sm font-medium"><option>All Quarters</option><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select>
        <select value={month} onChange={(event) => setMonth(event.target.value)} className="h-11 rounded-md border border-[#E5E4E0] bg-white px-3 text-sm font-medium"><option>All Months</option><option>January</option><option>February</option><option>March</option><option>April</option><option>May</option></select>
        <select value={invoice} onChange={(event) => setInvoice(event.target.value)} className="h-11 rounded-md border border-[#E5E4E0] bg-white px-3 text-sm font-medium"><option>All invoices</option><option>Paid</option><option>Upcoming</option><option>Overdue</option></select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Monthly services" value={totalMonthly} sub="Current contracted value" money />
        <Metric label="Active services" value={hires.length} sub="Team members and services" />
        <Metric label="Next invoice" value={totalMonthly} sub="Upcoming estimate" money />
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-[#E5E4E0] bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#F5F4F0] text-xs font-medium uppercase tracking-wider text-[#888]">
            <tr><th className="px-4 py-3">Month</th><th className="px-4 py-3">Team size</th><th className="px-4 py-3">Team cost</th><th className="px-4 py-3">Other team charges</th><th className="px-4 py-3">Other charges</th><th className="px-4 py-3">Discounts</th><th className="px-4 py-3">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-[#d8dee4]">
            {monthlyRows.filter((row) => month === "All Months" || row.month === month).map((row) => {
              const total = row.teamCost + row.otherTeamCharges + row.otherCharges - row.discounts;
              return <tr key={row.month}><td className="px-4 py-3 font-semibold">{row.month}</td><td className="px-4 py-3">{row.teamSize}</td><td className="px-4 py-3">{moneyText(row.teamCost, "USD")}</td><td className="px-4 py-3">{moneyText(row.otherTeamCharges, "USD")}</td><td className="px-4 py-3">{moneyText(row.otherCharges, "USD")}</td><td className="px-4 py-3">{moneyText(row.discounts, "USD")}</td><td className="px-4 py-3 font-semibold">{moneyText(total, "USD")}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-[#E5E4E0] bg-[#F5F4F0] p-5">
          <p className="font-semibold">Invoice status</p>
          <p className="mt-2 text-sm leading-6 text-[#555]">Stripe payment status can connect here once the Stripe customer ID is saved on the organization.</p>
          <div className="mt-4"><Badge tone="border-amber-200 bg-amber-50 text-amber-800">Stripe pending</Badge></div>
        </article>
        <article className="rounded-xl border border-[#E5E4E0] bg-[#F5F4F0] p-5">
          <p className="font-semibold">Finance contact</p>
          <p className="mt-2 text-sm text-[#555]">finance@nearwork.co</p>
          <p className="mt-1 text-sm text-[#555]">Account manager: {accountManager.name} · {accountManager.email}</p>
        </article>
      </div>
    </Panel>
  );
}

function InviteUserModal({ orgName, onClose }: { orgName: string; onClose: () => void }) {
  const [role, setRole] = useState("Hiring manager");
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/20 p-4">
      <section className="w-full max-w-lg rounded-xl border border-[#E5E4E0] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#12866E]">Invite user</p><h2 className="mt-1 text-2xl font-semibold">{orgName}</h2></div>
          <button onClick={onClose} className="rounded-md border border-[#E5E4E0] px-3 py-1 text-sm font-semibold">Close</button>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="text-sm font-semibold">Name<input className="mt-2 h-11 w-full rounded-md border border-[#E5E4E0] px-3 font-normal outline-none focus:border-[#12866E]" placeholder="Full name" /></label>
          <label className="text-sm font-semibold">Email<input type="email" className="mt-2 h-11 w-full rounded-md border border-[#E5E4E0] px-3 font-normal outline-none focus:border-[#12866E]" placeholder="jane@company.com" /></label>
          <label className="text-sm font-semibold">Role
            <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#E5E4E0] px-3 font-normal outline-none focus:border-[#12866E]">
              <option>Hiring manager</option>
              <option>Operations manager</option>
              <option>Finance</option>
              <option>Executive sponsor</option>
              <option>Reviewer</option>
            </select>
          </label>
        </div>
        <button onClick={onClose} className="mt-5 h-11 w-full rounded-md bg-[#12866E] text-sm font-semibold text-white">Create invite</button>
        <p className="mt-3 text-xs leading-5 text-[#888]">Invites are managed by Nearwork from the staff portal so every user is tied to the correct organization.</p>
      </section>
    </div>
  );
}

function GlobalSearchResults({ results, onClose }: { results: Array<{ key: string; type: string; title?: string; sub?: string; action: () => void }>; onClose: () => void }) {
  return (
    <div className="absolute left-0 right-0 top-14 z-30 rounded-xl border border-[#E5E4E0] bg-white p-2 shadow-xl">
      {results.length ? results.map((result) => (
        <button key={result.key} onClick={() => { result.action(); onClose(); }} className="flex w-full items-center justify-between gap-4 rounded-lg p-3 text-left hover:bg-[#EEF6F3]">
          <div><p className="font-semibold">{result.title}</p><p className="text-sm text-[#555]">{result.sub}</p></div>
          <Badge tone={searchTone(result.type)}>{result.type}</Badge>
        </button>
      )) : <div className="p-4 text-sm text-[#888]">No matches found.</div>}
    </div>
  );
}

function searchTone(type: string) {
  if (type === "Candidate") return "border-teal-200 bg-teal-50 text-teal-700";
  if (type === "Employee") return "border-violet-200 bg-violet-50 text-violet-700";
  if (type === "Opening") return "border-sky-200 bg-sky-50 text-sky-700";
  if (type === "Partner") return "border-pink-200 bg-pink-50 text-pink-700";
  return "border-[#E5E4E0] bg-[#F5F4F0] text-[#111]";
}

function CompanyUsers({ org, testMode }: { org: Organization; testMode: boolean }) {
  const [users, setUsers] = useState<ClientUser[]>(testMode ? emptyClientUsers : []);

  useEffect(() => {
    if (testMode) {
      setUsers(emptyClientUsers);
      return;
    }
    return subscribeOrgCollection<ClientUser>("users", org, setUsers);
  }, [org.id, org.orgId, testMode]);

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E4E0] bg-white">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-[#F5F4F0] text-xs font-medium uppercase tracking-wider text-[#888]">
          <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-[#d8dee4]">
          {users.map((item) => <tr key={item.id}><td className="px-4 py-3 font-medium">{item.name || [item.firstName, item.lastName].filter(Boolean).join(" ") || item.email}</td><td className="px-4 py-3 text-[#555]">{item.email}</td><td className="px-4 py-3"><Badge>{item.portalRole || item.role || "user"}</Badge></td><td className="px-4 py-3 text-[#12866E]">Active</td></tr>)}
          {!users.length ? <tr><td colSpan={4} className="px-4 py-8 text-center text-[#888]">No company users found yet.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
