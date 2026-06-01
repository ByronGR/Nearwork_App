"use client";

import React, { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKE, type ReactNode } from "react";
import { Calendar, Lock, MessageCircle, Pin, Search, Send, SmilePlus } from "lucide-react";
import {
  sendPipelineChatMessage,
  subscribePipelineChat,
  togglePipelineMessageReaction,
  type ClientUser,
  type Organization,
  type PipelineCandidate,
  type PipelineMessage,
  type PortalPipeline,
} from "@/lib/firebase-client";

// ─── helpers ─────────────────────────────────────────────────────────────────

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

function candidateKey(c: PipelineCandidate) {
  return (c as PipelineCandidate).candidateCode || c.email || c.name || "";
}

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

// ─── shared pipeline chat panel ───────────────────────────────────────────────
// Reads/writes the shared `pipeline_messages` thread so Nearwork staff (Admin)
// and the client (this portal) see one conversation. Nearwork-internal notes
// (internal === true) never reach the client query.

export function PipelineChatPanel({ pipeline, org, candidates, profile, onOpenCandidate }: {
  pipeline: PortalPipeline;
  org: Organization;
  candidates: PipelineCandidate[];
  profile: ClientUser;
  onOpenCandidate: (c: PipelineCandidate) => void;
}) {
  const myId = profile.id || profile.uid || "";

  const [messages, setMessages] = useState<PipelineMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [filter, setFilter] = useState<"all" | "mentions" | "pinned">("all");
  const [search, setSearch] = useState("");
  const [reactPickerFor, setReactPickerFor] = useState<string | null>(null);

  type SlashKind = "mention" | "candidate" | null;
  const [slashKind, setSlashKind] = useState<SlashKind>(null);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  const mentionUsers: MentionUser[] = useMemo(() => {
    const team = [
      { name: pipeline.recruiter, role: "Recruiter" },
      { name: pipeline.accountManager, role: "Account manager" },
    ];
    return team
      .filter((t) => t.name)
      .map((t, i) => ({ id: `team-${i}`, name: t.name!, handle: t.name!.split(/\s+/)[0].toLowerCase(), role: t.role }));
  }, [pipeline.recruiter, pipeline.accountManager]);

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
