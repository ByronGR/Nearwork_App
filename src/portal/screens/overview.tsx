"use client";

// ── New client-portal design — Overview (home) screen ─────────────────────────
// Ported from portal-v3-mixed.jsx (DashboardMixed). Prototype read window.NW_*
// globals; this takes a `data` object + `client` as PROPS so real Firebase data
// drops in later. Inline styles preserved verbatim for fidelity.

import React, { useState } from "react";
import { NW, Icon, Button, Chip, Avatar } from "../primitives";
import { PortalSidebar, PortalTopBar, SectionHead, ActivityRow, EmptyBlock, type PortalClient, type PortalActivity } from "../shell";

export type OverviewStat = { value: number | string; label?: string; trend?: string };
export type OverviewCandidate = {
  id: string | number;
  name: string;
  initials: string;
  avatarBg: string;
  location?: string;
  role?: string;
  stage?: string;
  stageIdx: number;
  score: number;
  awaitingDays: number;
};
export type OverviewInterview = {
  id: string | number;
  day: string;
  date: string;
  who: string;
  initials: string;
  avatarBg: string;
  time: string;
  kind: string;
};
export type OverviewData = {
  dateLabel: string;
  greetingName: string;
  stats: { review: OverviewStat; interviews: OverviewStat; openings: OverviewStat };
  candidates: OverviewCandidate[];
  interviews: OverviewInterview[];
  activity: PortalActivity[];
};

type NavHandler = (id: string) => void;

// ── Big-number stat tile ──────────────────────────────────────────────────────
function StatTile({ label, value, trend, trendDir = "up", accent, icon, primary, dense }: {
  label?: string; value: number | string; trend?: string; trendDir?: "up" | "alert" | "flat";
  accent: string; icon: string; primary?: boolean; dense?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const trendColor = trendDir === "up" ? NW.teal600 : trendDir === "alert" ? NW.rose600 : NW.gray500;
  const trendIcon = trendDir === "up" ? "trending-up" : trendDir === "alert" ? "alert-circle" : "minus";
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, minWidth: 0, position: "relative", overflow: "hidden",
        background: primary ? `linear-gradient(160deg, ${NW.white} 0%, ${accent}0A 100%)` : NW.white,
        border: `1px solid ${hover ? NW.gray200 : NW.gray100}`, borderRadius: 18,
        padding: dense ? "20px 22px" : "24px 26px",
        boxShadow: hover ? "0 12px 32px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04)" : "0 1px 2px rgba(0,0,0,0.03)",
        transition: "box-shadow 200ms, border-color 200ms, transform 200ms",
        transform: hover ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, opacity: primary ? 0.9 : 0 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: dense ? 14 : 18 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} color={accent} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <span style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: dense ? 44 : 54, color: NW.black, letterSpacing: "-0.045em", lineHeight: 0.95 }}>{value}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12 }}>
        <Icon name={trendIcon} size={13} color={trendColor} />
        <span style={{ fontSize: 12, color: trendColor, fontWeight: 500 }}>{trend}</span>
      </div>
    </div>
  );
}

// ── Segmented pipeline rail ───────────────────────────────────────────────────
const PIPE_STAGES = [
  { key: "Applied", color: NW.gray300, idx: 1 },
  { key: "Screening", color: NW.violet500, idx: 2 },
  { key: "Technical", color: "#1ABC9C", idx: 3 },
  { key: "Final round", color: NW.teal600, idx: 4 },
  { key: "Offer", color: NW.rose500, idx: 5 },
];

function PipelineRail({ candidates, dense, onNav }: { candidates: OverviewCandidate[]; dense?: boolean; onNav?: NavHandler }) {
  const counts = PIPE_STAGES.map((s) => candidates.filter((c) => c.stageIdx === s.idx).length);
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? 24 : 30 }}>
      <SectionHead overline="Pipeline" title="Where things stand" dense={dense} action={<Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => onNav && onNav("pipeline")}>Full pipeline</Button>} />
      <div style={{ display: "flex", gap: 3, height: 16, marginBottom: dense ? 22 : 28 }}>
        {PIPE_STAGES.map((s, i) => (
          <div key={s.key} title={`${s.key}: ${counts[i]}`} style={{ flex: Math.max(counts[i], total === 0 ? 1 : 0.001), minWidth: counts[i] > 0 ? 8 : 0, background: counts[i] > 0 ? s.color : NW.gray100, borderRadius: 6, transition: "flex 400ms cubic-bezier(0.16,1,0.3,1)" }} />
        ))}
        {total === 0 && <div style={{ flex: 1, background: NW.gray100, borderRadius: 6 }} />}
      </div>
      <div style={{ display: "flex", gap: dense ? 12 : 18 }}>
        {PIPE_STAGES.map((s, i) => (
          <div key={s.key} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.key}</span>
            </div>
            <div style={{ fontFamily: "Poppins", fontSize: dense ? 24 : 28, fontWeight: 700, color: counts[i] > 0 ? NW.black : NW.gray300, letterSpacing: "-0.03em" }}>{counts[i]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Priority queue row ────────────────────────────────────────────────────────
function CandidateTableRow({ c, dense }: { c: OverviewCandidate; dense?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 0.8fr 0.7fr 0.4fr", alignItems: "center", gap: 12, padding: dense ? "11px 14px" : "14px 16px", borderRadius: 12, background: hover ? NW.gray50 : "transparent", cursor: "pointer", transition: "background 120ms" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Avatar initials={c.initials} size={36} bg={c.avatarBg} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
          <div style={{ fontSize: 11, color: NW.gray500, marginTop: 1 }}>{c.location}</div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: NW.gray700 }}>{c.role}</div>
      <div>
        <Chip variant={c.stageIdx >= 4 ? "accent" : c.stageIdx >= 3 ? "violet" : "default"} size="sm">{c.stage}</Chip>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 5, background: NW.gray100, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${c.score}%`, height: "100%", background: c.score >= 90 ? NW.teal600 : c.score >= 80 ? NW.teal500 : NW.yellow500 }} />
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: NW.black, minWidth: 22, textAlign: "right" }}>{c.score}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        {c.awaitingDays === 0 ? (
          <span style={{ fontSize: 11, color: NW.gray400 }}>—</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: c.awaitingDays >= 2 ? NW.rose50 : NW.yellow50, color: c.awaitingDays >= 2 ? NW.rose600 : "#A16207" }}>{c.awaitingDays}d</span>
        )}
      </div>
    </div>
  );
}

// ── Interview item ────────────────────────────────────────────────────────────
function InterviewItem({ iv, dense, last }: { iv: OverviewInterview; dense?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", padding: dense ? "11px 0" : "13px 0", borderBottom: last ? "none" : `1px solid ${NW.gray100}` }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: NW.gray50, border: `1px solid ${NW.gray100}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: NW.gray500, letterSpacing: "0.08em", textTransform: "uppercase" }}>{iv.day}</div>
        <div style={{ fontFamily: "Poppins", fontSize: 18, fontWeight: 700, color: NW.black, letterSpacing: "-0.03em", lineHeight: 1 }}>{iv.date.split(" ")[1]}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <Avatar initials={iv.initials} size={20} bg={iv.avatarBg} />
          <span style={{ fontSize: 13, fontWeight: 600, color: NW.black, letterSpacing: "-0.01em" }}>{iv.who}</span>
        </div>
        <div style={{ fontSize: 11.5, color: NW.gray500 }}>{iv.time} · {iv.kind}</div>
      </div>
      <Icon name="chevron-right" size={15} color={NW.gray300} />
    </div>
  );
}

// ── Overview screen ───────────────────────────────────────────────────────────
export function OverviewScreen({ client, data, density = "regular", onNav }: {
  client: PortalClient;
  data: OverviewData;
  density?: "regular" | "compact";
  onNav?: NavHandler;
}) {
  const dense = density === "compact";
  const [range, setRange] = useState("This week");
  const pad = dense ? 32 : 44;
  const populated = data.candidates.length > 0;
  const queueItems = [...data.candidates].filter((c) => c.awaitingDays >= 1).sort((a, b) => b.awaitingDays - a.awaitingDays).slice(0, 6);
  const activity = data.activity.slice(0, 4);
  const reviewN = Number(data.stats.review.value) || 0;

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: NW.offWhite, color: NW.black, fontFamily: "Poppins, sans-serif" }}>
      <PortalSidebar active="overview" density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <PortalTopBar dense={dense} onNav={onNav} activity={data.activity} />
        <div style={{ flex: 1, overflow: "auto", padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          {/* Hero */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: dense ? 28 : 38, gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>{data.dateLabel}</div>
              <h1 style={{ fontSize: dense ? 36 : 46, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1.02, margin: 0, fontFamily: "Poppins, sans-serif" }}>
                {populated ? (
                  <>Good morning, {data.greetingName}.<br /><span style={{ color: NW.gray400 }}>You have </span><span style={{ color: NW.teal500 }}>{reviewN} candidates</span><span style={{ color: NW.gray400 }}> to review.</span></>
                ) : (
                  <>Welcome, {data.greetingName}.<br /><span style={{ color: NW.gray400 }}>Let&apos;s get your first role moving.</span></>
                )}
              </h1>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: reviewN > 0 ? NW.rose50 : NW.teal50, border: `1px solid ${reviewN > 0 ? "#E74C7C26" : "#16A08526"}` }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: reviewN > 0 ? NW.rose500 : NW.teal500 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: reviewN > 0 ? NW.rose600 : NW.teal700 }}>{reviewN > 0 ? `${reviewN} awaiting your review` : "All caught up"}</span>
              </div>
              <div style={{ display: "flex", gap: 4, padding: 4, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 999, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                {["Today", "This week", "Quarter"].map((p) => (
                  <button key={p} onClick={() => setRange(p)} style={{ border: "none", padding: "7px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", background: range === p ? NW.black : "transparent", color: range === p ? NW.white : NW.gray600, transition: "background 150ms, color 150ms" }}>{p}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Stat tiles */}
          <div style={{ display: "flex", gap: dense ? 16 : 20, marginBottom: dense ? 16 : 22 }}>
            <StatTile primary label={data.stats.review.label || "Awaiting review"} value={data.stats.review.value} trend={data.stats.review.trend} trendDir={reviewN > 0 ? "alert" : "flat"} accent={NW.rose500} icon="user-check" dense={dense} />
            <StatTile label={data.stats.interviews.label || "Interviews"} value={data.stats.interviews.value} trend={data.stats.interviews.trend} trendDir="up" accent={NW.teal500} icon="calendar-clock" dense={dense} />
            <StatTile label={data.stats.openings.label || "Active openings"} value={data.stats.openings.value} trend={data.stats.openings.trend} trendDir="flat" accent={NW.violet500} icon="briefcase" dense={dense} />
          </div>

          {/* Pipeline rail */}
          <div style={{ marginBottom: dense ? 16 : 22 }}>
            <PipelineRail candidates={data.candidates} dense={dense} onNav={onNav} />
          </div>

          {/* Bottom: queue + side rail */}
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: dense ? 16 : 22 }}>
            <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? "24px 20px 14px" : "30px 24px 18px" }}>
              <SectionHead overline="Priority queue" title="Needs your review" dense={dense} action={populated ? <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => onNav && onNav("pipeline")}>All candidates</Button> : undefined} />
              {queueItems.length > 0 ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 0.8fr 0.7fr 0.4fr", gap: 12, padding: "0 16px 10px", fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: "0.12em", textTransform: "uppercase", borderBottom: `1px solid ${NW.gray100}` }}>
                    <span>Candidate</span><span>Role</span><span>Stage</span><span>Match</span><span style={{ textAlign: "right" }}>Waiting</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {queueItems.map((c) => <CandidateTableRow key={c.id} c={c} dense={dense} />)}
                  </div>
                </>
              ) : (
                <div style={{ paddingBottom: 16 }}>
                  <EmptyBlock icon="users" title="No candidates yet" desc="Once Nearwork starts sourcing for your roles, they'll queue up here in priority order." />
                </div>
              )}
            </section>

            <div style={{ display: "flex", flexDirection: "column", gap: dense ? 16 : 22 }}>
              <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? 24 : 28 }}>
                <SectionHead overline="This week" title="Interviews" dense={dense} />
                {data.interviews.length > 0 ? (
                  <div>{data.interviews.map((iv, i) => <InterviewItem key={iv.id} iv={iv} dense={dense} last={i === data.interviews.length - 1} />)}</div>
                ) : (
                  <EmptyBlock icon="calendar-clock" title="No interviews booked" desc="When candidates advance, interviews land here." />
                )}
              </section>

              <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? 24 : 28 }}>
                <SectionHead overline="Recent" title="Updates" dense={dense} />
                {activity.length > 0 ? (
                  <div>{activity.map((a, i) => <ActivityRow key={a.id} a={a} dense={dense} last={i === activity.length - 1} />)}</div>
                ) : (
                  <EmptyBlock icon="bell" title="Quiet so far" desc="Pipeline events appear here as they happen." />
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
