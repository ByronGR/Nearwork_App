"use client";

import React, { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKE, type ReactNode } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Calendar,
  Lock,
  MessageCircle,
  Pin,
  Search,
  Send,
  SmilePlus,
  Users,
} from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  auth,
  getClientUser,
  getOrganization,
  logoutClient,
  sendPipelineChatMessage,
  subscribePipelineChat,
  togglePipelineMessageReaction,
  subscribeOrgCollection,
  type ClientUser,
  type PipelineMessage,
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

function timestampMs(value: unknown) {
  const maybeTimestamp = value as { toDate?: () => Date } | null;
  if (maybeTimestamp?.toDate) return maybeTimestamp.toDate().getTime();
  const parsed = new Date(String(value || Date.now())).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function candidateKey(c: PortalCandidate | PipelineCandidate) {
  return (c as PortalCandidate).code || (c as PipelineCandidate).candidateCode || c.email || c.name || "";
}

// ─── chat helpers ───────────────────────────────────────────────────────────

const QUICK_EMOJIS = ["👍", "❤️", "🎉", "🙌", "👀", "🚀"];

function slugify(name = "") {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function fmtMsgTime(value: unknown): string {
  const maybeTs = value as { toDate?: () => Date; seconds?: number } | null;
  if (!maybeTs) return "";
  const d = maybeTs.toDate ? maybeTs.toDate() : maybeTs.seconds ? new Date(maybeTs.seconds * 1000) : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `Today · ${time}`;
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} · ${time}`;
}

// Renders @mentions (highlight) and /candidate chips inside a message body.
function renderBody(text: string, candidates: PipelineCandidate[], onOpenCandidate: (c: PipelineCandidate) => void): ReactNode[] {
  const parts = text.split(/(@[\w.]+|\/[\w-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="rounded px-0.5 font-semibold" style={{ background: "rgba(22,160,133,0.12)", color: "#16A085" }}>
          {part}
        </span>
      );
    }
    if (part.startsWith("/")) {
      const slug = part.slice(1);
      const cand = candidates.find((c) => slugify(c.name) === slug);
      if (cand) {
        return (
          <button
            key={i}
            onClick={() => onOpenCandidate(cand)}
            className="inline-flex items-center gap-1 rounded border border-[#E5E4E0] bg-[#F5F4F0] px-1.5 py-0.5 align-baseline text-[12px] font-medium text-[#111] hover:border-[#16A085] hover:bg-white"
          >
            <span className="flex size-4 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ background: "#16A085" }}>
              {initials(cand.name)}
            </span>
            {cand.name}
          </button>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

type MentionUser = { id: string; name: string; handle: string; role: string };

// Client-side stage mapping (same logic as client-portal.tsx)
const clientStages = [
  { key: "screening",    label: "Screening"    },
  { key: "technical",    label: "Technical"    },
  { key: "final-round",  label: "Final Round"  },
  { key: "offer",        label: "Offer"        },
  { key: "not-selected", label: "Not Selected" },
];

function clientStageKey(stage?: string): string {
  const s = String(stage || "").toLowerCase().replace(/[-_ ]/g, "");
  if (s.includes("background") || s.includes("screening") || s.includes("profile")) return "screening";
  if (s.includes("assess") || s.includes("tech") || s.includes("test")) return "technical";
  if (s.includes("present") || s.includes("clientview") || s.includes("final") || s.includes("interview")) return "final-round";
  if (s.includes("hired") || s.includes("offer")) return "offer";
  if (s.includes("pass") || s.includes("reject") || s.includes("notselect") || s.includes("declined")) return "not-selected";
  return "screening";
}

const stageTone: Record<string, string> = {
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
  return `USD ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(usdAmount))}/mo`;
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#111]">{name}</p>
          {role ? <p className="mt-0.5 truncate text-xs text-[#555]">{role}</p> : null}
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
          <div>
            <h2 className="text-lg font-bold text-[#111]">{name}</h2>
            <p className="text-sm text-[#555]">{full?.role || item.role || ""} · {full?.location || full?.city || "Colombia"}</p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-[#111]">✕</button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Score + stage */}
          <div className="flex items-center gap-4">
            <Score value={score} />
            <div>
              <p className="text-xs text-[#888]">Stage</p>
              <Badge tone={stageTone[stageKey]}>{stageLabel}</Badge>
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

function ChatPanel({ pipeline, org, candidates, profile, onOpenCandidate }: {
  pipeline: PortalPipeline;
  org: Organization;
  candidates: PipelineCandidate[];
  profile: ClientUser;
  onOpenCandidate: (c: PipelineCandidate) => void;
}) {
  const myId = profile.id || profile.uid || "";

  // Messages (shared pipeline_messages thread with Admin)
  const [messages, setMessages] = useState<PipelineMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filters / search
  const [filter, setFilter] = useState<"all" | "mentions" | "pinned">("all");
  const [search, setSearch] = useState("");
  const [reactPickerFor, setReactPickerFor] = useState<string | null>(null);

  // Autocomplete (/ candidate · @ team)
  type SlashKind = "mention" | "candidate" | null;
  const [slashKind, setSlashKind] = useState<SlashKind>(null);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  // Team mention list — the Nearwork people on this pipeline.
  const mentionUsers: MentionUser[] = useMemo(() => {
    const team = [
      { name: pipeline.recruiter, role: "Recruiter" },
      { name: pipeline.accountManager, role: "Account manager" },
    ];
    return team
      .filter((t) => t.name)
      .map((t, i) => ({ id: `team-${i}`, name: t.name!, handle: t.name!.split(/\s+/)[0].toLowerCase(), role: t.role }));
  }, [pipeline.recruiter, pipeline.accountManager]);

  // Subscribe to the shared thread; hide Nearwork-internal notes from clients.
  useEffect(() => {
    const code = pipeline.code;
    if (!code) return;
    setLoading(true);
    const unsub = subscribePipelineChat(code, (items) => {
      const visible = items
        .filter((m) => m.internal !== true)
        .sort((a, b) => timestampMs(a.createdAt) - timestampMs(b.createdAt));
      setMessages(visible);
      setLoading(false);
    });
    return unsub;
  }, [pipeline.code]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  // ── Autocomplete ──
  const slashMatches = useMemo(() => {
    if (slashKind === null) return [] as Array<MentionUser | { cand: PipelineCandidate; slug: string }>;
    const q = slashQuery.toLowerCase();
    if (slashKind === "mention") {
      return mentionUsers.filter((u) => u.handle.startsWith(q) || u.name.toLowerCase().includes(q)).slice(0, 5);
    }
    return candidates
      .filter((c) => slugify(c.name).startsWith(q) || (c.name || "").toLowerCase().includes(q))
      .slice(0, 5)
      .map((c) => ({ cand: c, slug: slugify(c.name) }));
  }, [slashKind, slashQuery, mentionUsers, candidates]);

  function detectTrigger(value: string, caret: number) {
    const upto = value.slice(0, caret);
    const at = /@(\w*)$/.exec(upto);
    const slash = /(^|\s)\/([a-zA-Z0-9-]*)$/.exec(upto);
    if (at) { setSlashKind("mention"); setSlashQuery(at[1].toLowerCase()); setSlashIndex(0); }
    else if (slash) { setSlashKind("candidate"); setSlashQuery(slash[2].toLowerCase()); setSlashIndex(0); }
    else setSlashKind(null);
  }

  function handleChange(value: string) {
    setDraft(value);
    detectTrigger(value, inputRef.current?.selectionStart ?? value.length);
  }

  function insertSelection(item: MentionUser | { cand: PipelineCandidate; slug: string }) {
    const el = inputRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? draft.length;
    const before = draft.slice(0, caret);
    const after = draft.slice(caret);
    const isMention = "handle" in item;
    const token = isMention ? `@${item.handle} ` : `/${item.slug} `;
    const replaced = isMention
      ? before.replace(/@(\w*)$/, token)
      : before.replace(/(^|\s)\/([a-zA-Z0-9-]*)$/, (_m, p1) => `${p1}${token}`);
    setDraft(replaced + after);
    setSlashKind(null);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(replaced.length, replaced.length); });
  }

  function onKey(e: ReactKE<HTMLTextAreaElement>) {
    if (slashKind !== null && slashMatches.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIndex((i) => (i + 1) % slashMatches.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlashIndex((i) => (i - 1 + slashMatches.length) % slashMatches.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertSelection(slashMatches[slashIndex]); return; }
      if (e.key === "Escape") { setSlashKind(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError("");
    try {
      await sendPipelineChatMessage({ pipelineCode: pipeline.code, profile, orgName: org.name, text: body });
      setDraft("");
      setSlashKind(null);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Failed to send";
      setSendError(`Couldn't send: ${detail}`);
    } finally {
      setSending(false);
    }
  }

  async function react(messageId: string, emoji: string, current: PipelineMessage["reactions"]) {
    if (!myId) return;
    try {
      await togglePipelineMessageReaction(messageId, emoji, myId, current || []);
    } catch { /* reaction is best-effort */ }
    setReactPickerFor(null);
  }

  const myHandle = (profile.name || profile.email || "").split(/\s+/)[0].toLowerCase();
  const pinnedCount = messages.filter((m) => m.kind === "msg" && m.pinned).length;

  const visibleMessages = messages.filter((m) => {
    if (filter === "pinned") return m.kind === "msg" && m.pinned;
    if (filter === "mentions") return m.kind === "msg" && m.body?.toLowerCase().includes(`@${myHandle}`);
    if (search.trim()) {
      const q = search.toLowerCase();
      if (m.kind === "interview") return m.candidateName?.toLowerCase().includes(q) || m.when?.toLowerCase().includes(q);
      return (m.body || m.text || "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[#E5E4E0] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#111]">Pipeline chat</span>
            <span className="rounded-full border border-[#E5E4E0] bg-[#F5F4F0] px-2 py-0.5 text-[10px] font-medium text-[#555]">{org.name}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-[#888]">{pipeline.code} · visible to Nearwork &amp; your team</p>
        </div>
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-[#888]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages"
            className="h-8 w-40 rounded-lg border border-[#E5E4E0] bg-[#F5F4F0] pl-7 pr-3 text-xs outline-none focus:border-[#16A085]"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between border-b border-[#E5E4E0] px-3 py-1.5">
        <div className="flex gap-0.5">
          {(["all", "mentions", "pinned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cx(
                "rounded-md px-2.5 py-1 text-xs capitalize transition-colors",
                filter === f ? "bg-[#F5F4F0] font-semibold text-[#111]" : "text-[#888] hover:bg-[#F5F4F0] hover:text-[#555]",
              )}
            >
              {f}
              {f === "pinned" && pinnedCount > 0 ? <span className="ml-1 text-[#888]">{pinnedCount}</span> : null}
            </button>
          ))}
        </div>
        <p className="hidden text-[10px] text-[#888] sm:block">
          Type <kbd className="rounded border border-[#E5E4E0] bg-[#F5F4F0] px-1">/</kbd> for candidates ·{" "}
          <kbd className="rounded border border-[#E5E4E0] bg-[#F5F4F0] px-1">@</kbd> for team
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-[#E5E4E0] border-t-[#16A085]" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="mb-3 size-8 text-[#E5E4E0]" />
            <p className="text-sm font-medium text-[#555]">
              {search ? "No results." : filter !== "all" ? "Nothing here." : "No messages yet — say hello! 👋"}
            </p>
          </div>
        ) : (
          visibleMessages.map((m) => {
            if (m.kind === "interview") {
              const cand = candidates.find((c) => candidateKey(c) === m.candidateId || c.name === m.candidateName);
              return (
                <div key={m.id} className="mx-1 my-2 rounded-xl border border-[#E5E4E0] bg-[#F8F7F3] p-3.5">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[#888]">
                    <Calendar className="size-3.5 text-[#16A085]" />
                    <span>Interview scheduled by {m.authorName}</span>
                    {m.createdAt ? <span>· {fmtMsgTime(m.createdAt)}</span> : null}
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111]">{cand?.name || m.candidateName}</p>
                      <p className="mt-2 text-sm font-medium text-[#111]">{m.when}</p>
                      {m.withWho?.length ? <p className="text-[11px] text-[#888]">With {m.withWho.join(", ")}</p> : null}
                    </div>
                    <a
                      href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Interview: ${m.candidateName}`)}&details=${encodeURIComponent(m.when || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-[#E5E4E0] px-3 py-1.5 text-center text-[11px] font-medium text-[#555] hover:border-[#16A085] hover:text-[#16A085]"
                    >
                      Add to calendar
                    </a>
                  </div>
                </div>
              );
            }

            // kind: 'msg' (or legacy text)
            const isMe = m.authorId === myId;
            const isNearwork = m.authorOrg === "nearwork";
            return (
              <div key={m.id} className="group relative flex gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-[#F5F4F0]">
                <div
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: isNearwork ? "linear-gradient(135deg, #16A085, #12866E)" : "linear-gradient(135deg, #6366f1, #818cf8)" }}
                >
                  {m.authorInitials || initials(m.authorName || "NW")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="text-xs font-bold text-[#111]">{m.authorName}{isMe ? " (you)" : ""}</span>
                    <span className={cx("rounded px-1.5 py-0.5 text-[9px] font-semibold", isNearwork ? "bg-[#E8F8F5] text-[#16A085]" : "bg-indigo-100 text-indigo-700")}>
                      {isNearwork ? "Nearwork" : "Your team"}
                    </span>
                    <span className="text-[10px] text-[#888]">{fmtMsgTime(m.createdAt)}</span>
                    {m.pinned ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#888]"><Pin className="size-2.5" /> Pinned</span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-sm leading-relaxed text-[#111]">
                    {renderBody(m.body || m.text || "", candidates, onOpenCandidate)}
                  </div>
                  {m.reactions?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.reactions.map((r) => {
                        const mine = r.userIds.includes(myId);
                        return (
                          <button
                            key={r.emoji}
                            onClick={() => react(m.id, r.emoji, m.reactions)}
                            className={cx(
                              "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors",
                              mine ? "border-[#16A085] bg-[#E8F8F5]" : "border-[#E5E4E0] bg-white hover:bg-[#F5F4F0]",
                            )}
                          >
                            <span>{r.emoji}</span>
                            <span className={mine ? "text-[#16A085]" : "text-[#555]"}>{r.userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                {/* Hover react bar */}
                <div className="absolute -top-3 right-3 hidden items-center gap-0.5 rounded-lg border border-[#E5E4E0] bg-white p-0.5 shadow-sm group-hover:flex">
                  {QUICK_EMOJIS.slice(0, 3).map((e) => (
                    <button key={e} onClick={() => react(m.id, e, m.reactions)} className="rounded p-1 text-sm hover:bg-[#F5F4F0]">{e}</button>
                  ))}
                  <button
                    onClick={() => setReactPickerFor(reactPickerFor === m.id ? null : m.id)}
                    className="rounded p-1 text-[#888] hover:bg-[#F5F4F0] hover:text-[#555]"
                  >
                    <SmilePlus className="size-3.5" />
                  </button>
                </div>
                {reactPickerFor === m.id ? (
                  <div className="absolute right-3 top-7 z-20 flex gap-1 rounded-xl border border-[#E5E4E0] bg-white p-1.5 shadow-lg">
                    {QUICK_EMOJIS.map((e) => (
                      <button key={e} onClick={() => react(m.id, e, m.reactions)} className="rounded-lg p-1.5 text-base hover:bg-[#F5F4F0]">{e}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="relative border-t border-[#E5E4E0] bg-white p-3">
        {slashKind !== null && slashMatches.length > 0 ? (
          <div className="absolute bottom-full left-3 mb-2 w-72 overflow-hidden rounded-xl border border-[#E5E4E0] bg-white shadow-lg">
            <div className="border-b border-[#E5E4E0] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#888]">
              {slashKind === "mention" ? "Team members" : "Pipeline candidates"}
            </div>
            {slashMatches.map((item, i) => {
              const isMention = "handle" in item;
              const label = isMention ? item.name : item.cand.name || "Candidate";
              const sub = isMention ? `@${item.handle} · ${item.role}` : item.cand.stage || "";
              return (
                <button
                  key={isMention ? item.id : item.slug}
                  onMouseDown={(e) => { e.preventDefault(); insertSelection(item); }}
                  className={cx("flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors", i === slashIndex ? "bg-[#F5F4F0]" : "hover:bg-[#F5F4F0]")}
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: isMention ? "linear-gradient(135deg, #16A085, #12866E)" : "linear-gradient(135deg, #6366f1, #818cf8)" }}
                  >
                    {initials(label || "NW")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#111]">{label}</p>
                    <p className="truncate text-[10px] capitalize text-[#888]">{sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-end gap-2 rounded-xl border border-[#E5E4E0] bg-white px-3 py-2 transition-colors focus-within:border-[#16A085]">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Message the team — / for candidates, @ for mentions"
            className="max-h-32 flex-1 resize-none bg-transparent text-sm text-[#111] outline-none placeholder:text-[#888]"
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40"
            style={{ background: "#16A085" }}
          >
            {sending ? <div className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send className="size-4" />}
          </button>
        </div>
        {sendError ? (
          <p className="mt-1 flex items-center gap-1 px-1 text-[10px] text-red-600"><Lock className="size-2.5" /> {sendError}</p>
        ) : (
          <p className="mt-1 px-1 text-[10px] text-[#888]">Enter to send · Shift+Enter new line</p>
        )}
      </div>
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
  const [tab, setTab] = useState<"pipeline" | "chat">("pipeline");

  // Auth
  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    if (!nextUser) { setUser(null); setProfile(null); setOrg(null); return; }
    setUser(nextUser);
    try {
      const nextProfile = await getClientUser(nextUser);
      const role = String(nextProfile?.role || nextProfile?.portalRole || "").toLowerCase();
      const allowed = role.includes("client") || role.includes("org") || role === "viewer" || role === "user" || role === "admin";
      if (!nextProfile || !allowed) {
        setAuthMessage("This email is not invited to the client portal.");
        await logoutClient();
        return;
      }
      const nextOrg = await getOrganization(nextProfile);
      if (!nextOrg) { setAuthMessage("No organization found for this account."); await logoutClient(); return; }
      setProfile(nextProfile);
      setOrg(nextOrg);
    } catch {
      setAuthMessage("Could not load your profile. Please refresh.");
    }
  }), []);

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

  const pipelineItems = pipeline?.candidates || [];

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

              {/* Tab bar */}
              <div className="flex gap-1">
                <button
                  onClick={() => setTab("pipeline")}
                  className={cx("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition", tab === "pipeline" ? "bg-[#111] text-white" : "border border-[#E5E4E0] bg-white text-[#555] hover:border-[#111]")}
                >
                  <Users className="size-3.5" /> Candidates
                </button>
                <button
                  onClick={() => setTab("chat")}
                  className={cx("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition", tab === "chat" ? "bg-[#111] text-white" : "border border-[#E5E4E0] bg-white text-[#555] hover:border-[#111]")}
                >
                  <MessageCircle className="size-3.5" /> Chat
                </button>
              </div>

              {tab === "pipeline" ? (
                <div className="overflow-x-auto pb-2">
                  <div className="grid min-w-[900px] grid-cols-5 gap-3">
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
              ) : (
                <div className="h-[560px] rounded-xl border border-[#E5E4E0] bg-white overflow-hidden">
                  <ChatPanel
                    pipeline={pipeline}
                    org={org}
                    candidates={pipelineItems}
                    profile={profile}
                    onOpenCandidate={(c) => { setSelected(c); setTab("pipeline"); }}
                  />
                </div>
              )}
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
