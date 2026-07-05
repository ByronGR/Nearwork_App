"use client";

// ── New client-portal design — Open roles (pipeline landing) screen ────────────
// Ported from portal-v3-roles.jsx (OpenRolesScreen). Prototype read window.NW_*
// globals; this takes a `data` object + `client` as PROPS so real Firebase data
// drops in later. Inline styles preserved verbatim for fidelity.

import React, { useState } from "react";
import { NW, Icon, Avatar } from "../primitives";
import { PortalSidebar, PortalTopBar, EmptyBlock, type PortalClient } from "../shell";

// ── Typed data prop shapes ────────────────────────────────────────────────────
export type RoleOpening = {
  id: string;
  title: string;
  team: string;
  location: string;
  daysOpen: number;
  status: string; // "active" | "sourcing" | …
};

export type RoleCandidate = {
  id: string | number;
  openingId: string;
  initials: string;
  avatarBg: string;
  stageIdx: number;
  awaitingDays: number;
};

export type RoleKickoff = {
  id: string | number;
  title: string;
  team: string;
  location: string;
  summary: string;
  status: string; // "pending" | "approved" | "changes"
  sentDate: string;
  sentBy: { initials: string; avatarBg: string };
};

export type RolesData = {
  openings: RoleOpening[];
  candidates: RoleCandidate[];
  kickoffs: RoleKickoff[];
};

type NavHandler = (id: string, arg?: string | number) => void;

// ── Inline candidate avatar (shell has no CandidateAvatar) ────────────────────
function CandidateAvatar({ c, size = 26 }: { c: RoleCandidate; size?: number }) {
  return <Avatar initials={c.initials} bg={c.avatarBg} size={size} />;
}

// V3 Pipeline LANDING — "Open roles" page.
// This is the screen the Pipeline nav item opens: a grid of role cards.
// Clicking a role opens its kanban board.

const ROLE_STAGES = [
  { key: "Applied", color: NW.gray300, idx: 1 },
  { key: "Screening", color: NW.violet500, idx: 2 },
  { key: "Technical", color: "#1ABC9C", idx: 3 },
  { key: "Final round", color: NW.teal600, idx: 4 },
  { key: "Offer", color: NW.rose500, idx: 5 },
];

function RoleCard({ opening, candidates, dense, onOpen }: {
  opening: RoleOpening;
  candidates: RoleCandidate[];
  dense?: boolean;
  onOpen?: (opening: RoleOpening) => void;
}) {
  const [hover, setHover] = useState(false);
  const mine = candidates.filter((c) => c.openingId === opening.id);
  const active_c = mine.filter((c) => c.stageIdx < 6);
  const notSelected = mine.filter((c) => c.stageIdx === 6).length;
  const inReview = mine.filter((c) => c.awaitingDays >= 1).length;
  const offers = mine.filter((c) => c.stageIdx === 5).length;
  const counts = ROLE_STAGES.map((s) => mine.filter((c) => c.stageIdx === s.idx).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const active = opening.status === "active";

  const metrics = [
    { label: "Candidates", value: active_c.length, color: NW.black },
    { label: "In review", value: inReview, color: inReview > 0 ? NW.rose600 : NW.gray300 },
    { label: "Offers", value: offers, color: offers > 0 ? NW.teal600 : NW.gray300 },
  ];

  return (
    <div
      onClick={() => onOpen && onOpen(opening)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: NW.white,
        border: `1px solid ${hover ? NW.gray200 : NW.gray100}`,
        borderRadius: 20,
        padding: dense ? 22 : 28,
        cursor: "pointer",
        boxShadow: hover ? "0 16px 40px rgba(0,0,0,0.08), 0 3px 8px rgba(0,0,0,0.04)" : "0 1px 2px rgba(0,0,0,0.03)",
        transition: "box-shadow 220ms, border-color 220ms, transform 220ms",
        transform: hover ? "translateY(-3px)" : "none",
        display: "flex", flexDirection: "column", gap: dense ? 16 : 20,
      }}>
      {/* Top: status + days */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
          padding: "5px 11px", borderRadius: 999,
          background: active ? NW.teal50 : NW.gray50,
          color: active ? NW.teal700 : NW.gray500,
          border: `1px solid ${active ? "#16A08522" : NW.gray100}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? NW.teal500 : NW.gray400 }} />
          {active ? "Active" : "Sourcing"}
        </span>
        <span style={{ fontSize: 12, color: NW.gray400, fontWeight: 500 }}>{opening.daysOpen}d open</span>
      </div>

      {/* Title block */}
      <div>
        <div style={{ fontSize: dense ? 20 : 23, fontWeight: 700, color: NW.black, letterSpacing: "-0.03em", lineHeight: 1.15 }}>{opening.title}</div>
        <div style={{ fontSize: 13, color: NW.gray500, marginTop: 5, display: "flex", alignItems: "center", gap: 8 }}>
          <span>{opening.team}</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: NW.gray300 }} />
          <span>{opening.location}</span>
        </div>
      </div>

      {/* Mini pipeline bar */}
      <div>
        <div style={{ display: "flex", gap: 3, height: 8, marginBottom: 0 }}>
          {ROLE_STAGES.map((s, i) => (
            <div key={s.key} title={`${s.key}: ${counts[i]}`} style={{
              flex: Math.max(counts[i], total === 0 ? 1 : 0.001),
              minWidth: counts[i] > 0 ? 6 : 0,
              background: counts[i] > 0 ? s.color : NW.gray100,
              borderRadius: 4,
            }} />
          ))}
          {total === 0 && <div style={{ flex: 1, background: NW.gray100, borderRadius: 4 }} />}
        </div>
      </div>

      {/* Metric cells */}
      <div style={{ display: "flex", gap: dense ? 10 : 14 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ flex: 1, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 12, padding: dense ? "12px 14px" : "14px 16px" }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray500, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontFamily: "Poppins", fontSize: dense ? 24 : 28, fontWeight: 700, color: m.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${NW.gray100}`, paddingTop: dense ? 14 : 16 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: NW.teal600 }}>
          View in pipeline
          <Icon name="arrow-right" size={15} color={NW.teal600} style={{ transform: hover ? "translateX(3px)" : "none", transition: "transform 200ms" }} />
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {notSelected > 0 && <span style={{ fontSize: 11.5, color: NW.gray400 }}>{notSelected} not selected</span>}
          {/* Avatar stack (active candidates only) */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {active_c.slice(0, 4).map((c, i) => (
              <div key={c.id} style={{ marginLeft: i === 0 ? 0 : -8, border: `2px solid ${NW.white}`, borderRadius: "50%", position: "relative", zIndex: 4 - i }}>
                <CandidateAvatar c={c} size={26} />
              </div>
            ))}
            {active_c.length > 4 && (
              <div style={{ marginLeft: -8, width: 26, height: 26, borderRadius: "50%", background: NW.gray100, border: `2px solid ${NW.white}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: NW.gray600 }}>+{active_c.length - 4}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Kickoff brief card (awaiting client approval) ─────────────────────────
function KickoffCard({ kf, dense, onReview }: {
  kf: RoleKickoff;
  dense?: boolean;
  onReview?: (kf: RoleKickoff) => void;
}) {
  const [hover, setHover] = useState(false);
  const decided = kf.status === "approved" || kf.status === "changes";
  return (
    <div
      onClick={() => onReview && onReview(kf)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: NW.white,
        border: `1px solid ${hover ? "#D9A40699" : "#EAB30855"}`,
        borderRadius: 18, padding: dense ? 18 : 22,
        cursor: "pointer", position: "relative", overflow: "hidden",
        boxShadow: hover ? "0 14px 34px rgba(180,130,0,0.10), 0 2px 6px rgba(0,0,0,0.04)" : "0 1px 2px rgba(0,0,0,0.03)",
        transition: "box-shadow 200ms, border-color 200ms, transform 200ms",
        transform: hover ? "translateY(-2px)" : "none",
        display: "flex", flexDirection: "column", gap: dense ? 13 : 16,
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: NW.yellow500 }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", padding: "4px 10px", borderRadius: 999, background: NW.yellow50, color: "#A16207", marginBottom: 11 }}>
            <Icon name="file-text" size={12} color="#A16207" /> Kickoff brief
          </span>
          <div style={{ fontSize: dense ? 18 : 20, fontWeight: 700, color: NW.black, letterSpacing: "-0.025em", lineHeight: 1.15 }}>{kf.title}</div>
          <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 5, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{kf.team}</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: NW.gray300 }} />
            <span>{kf.location}</span>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: NW.gray600, lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{kf.summary}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${NW.gray100}`, paddingTop: dense ? 12 : 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Avatar initials={kf.sentBy.initials} bg={kf.sentBy.avatarBg} size={22} />
          <span style={{ fontSize: 11.5, color: NW.gray500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Sent {kf.sentDate}</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: decided ? NW.gray500 : "#A16207" }}>
          {decided ? (kf.status === "approved" ? "Approved" : "Changes requested") : "Review brief"}
          {!decided && <Icon name="arrow-right" size={15} color="#A16207" style={{ transform: hover ? "translateX(3px)" : "none", transition: "transform 200ms" }} />}
        </span>
      </div>
    </div>
  );
}

// ── Open roles screen ─────────────────────────────────────────────────────────
export function OpenRolesScreen({ client, data, density = "regular", onNav }: {
  client: PortalClient;
  data: RolesData;
  density?: "regular" | "compact";
  onNav?: NavHandler;
}) {
  const dense = density === "compact";
  const pad = dense ? 32 : 44;
  const openings = data.openings;
  const candidates = data.candidates;
  const populated = openings.length > 0;
  const kickoffs = (data.kickoffs || []).filter((k) => k.status === "pending");
  const totalCands = candidates.length;
  const totalReview = candidates.filter((c) => c.awaitingDays >= 1).length;
  const activeRoles = openings.filter((o) => o.status === "active").length;

  const [filterOpen, setFilterOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState("all");
  const [reviewOnly, setReviewOnly] = useState(false);
  const teamNames = Array.from(new Set(openings.map((o) => o.team)));
  const needsReview = (o: RoleOpening) => candidates.some((c) => c.openingId === o.id && c.awaitingDays >= 1);
  const filteredOpenings = openings.filter((o) => (teamFilter === "all" || o.team === teamFilter) && (!reviewOnly || needsReview(o)));
  const activeFilters = (teamFilter !== "all" ? 1 : 0) + (reviewOnly ? 1 : 0);

  const summary = [
    { label: "Open roles", value: populated ? activeRoles : 0, accent: NW.violet500 },
    { label: "Total candidates", value: totalCands, accent: NW.teal500 },
    { label: "Awaiting review", value: totalReview, accent: NW.rose500 },
  ];

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: NW.offWhite, color: NW.black, fontFamily: "Poppins, sans-serif" }}>
      <PortalSidebar active="pipeline" density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <PortalTopBar dense={dense} onNav={onNav} activity={[]} />
        <div style={{ flex: 1, overflow: "auto", padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: dense ? 24 : 32, gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Pipeline</div>
              <h1 style={{ fontSize: dense ? 34 : 44, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1.02, margin: 0, fontFamily: "Poppins, sans-serif" }}>
                Open roles
              </h1>
              <p style={{ fontSize: 14, color: NW.gray500, marginTop: 10, maxWidth: 520, lineHeight: 1.5 }}>
                Pick a role to open its pipeline and move candidates through your stages.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
              <button onClick={() => setFilterOpen((o) => !o)} style={{
                display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 14px",
                borderRadius: 9, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${activeFilters || filterOpen ? NW.black : NW.gray200}`,
                background: activeFilters ? NW.black : NW.white, color: activeFilters ? NW.white : NW.gray700,
              }}>
                <Icon name="filter" size={15} color={activeFilters ? NW.white : NW.gray600} /> Filter
                {activeFilters > 0 && <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.22)", padding: "1px 7px", borderRadius: 999 }}>{activeFilters}</span>}
              </button>
              {filterOpen && (
                <>
                  <div onClick={() => setFilterOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div style={{ position: "absolute", top: 44, right: 0, width: 250, zIndex: 50, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 14, boxShadow: "0 18px 50px rgba(0,0,0,0.16)", padding: 14, animation: "nwPop 180ms cubic-bezier(0.16,1,0.3,1)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Team</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 14 }}>
                      {["all", ...teamNames].map((t) => {
                        const on = teamFilter === t;
                        return (
                          <button key={t} onClick={() => setTeamFilter(t)} style={{ display: "flex", alignItems: "center", gap: 9, border: "none", background: on ? NW.gray50 : "transparent", borderRadius: 8, padding: "8px 10px", fontFamily: "inherit", fontSize: 13, fontWeight: on ? 600 : 500, color: NW.gray800, cursor: "pointer", textAlign: "left" }}>
                            <span style={{ width: 15, height: 15, borderRadius: 999, border: `2px solid ${on ? NW.teal500 : NW.gray300}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ width: 7, height: 7, borderRadius: 999, background: NW.teal500 }} />}</span>
                            {t === "all" ? "All teams" : t}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setReviewOnly((v) => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", border: "none", background: "transparent", padding: "8px 10px", fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: NW.gray800, cursor: "pointer" }}>
                      Needs review only
                      <span style={{ width: 34, height: 20, borderRadius: 999, background: reviewOnly ? NW.teal500 : NW.gray200, position: "relative", transition: "background 150ms", flexShrink: 0 }}>
                        <span style={{ position: "absolute", top: 2, left: reviewOnly ? 16 : 2, width: 16, height: 16, borderRadius: 999, background: NW.white, transition: "left 150ms" }} />
                      </span>
                    </button>
                    {activeFilters > 0 && (
                      <button onClick={() => { setTeamFilter("all"); setReviewOnly(false); }} style={{ width: "100%", marginTop: 8, border: `1px solid ${NW.gray200}`, background: NW.white, borderRadius: 9, padding: "8px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: NW.gray600, cursor: "pointer" }}>Clear filters</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Summary strip */}
          <div style={{ display: "flex", gap: dense ? 14 : 18, marginBottom: dense ? 22 : 30 }}>
            {summary.map((s) => (
              <div key={s.label} style={{ flex: 1, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 16, padding: dense ? "16px 20px" : "18px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ width: 4, height: 38, borderRadius: 2, background: s.accent }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ fontFamily: "Poppins", fontSize: dense ? 28 : 34, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1.1, marginTop: 2 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Awaiting approval (kickoff briefs) */}
          {populated && kickoffs.length > 0 && (
            <div style={{ marginBottom: dense ? 26 : 34 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: dense ? 14 : 18 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: NW.yellow500 }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: NW.black, letterSpacing: "0.02em", margin: 0 }}>Awaiting your approval</h2>
                <span style={{ fontSize: 12, color: NW.gray500 }}>· {kickoffs.length} kickoff {kickoffs.length === 1 ? "brief" : "briefs"} from Nearwork</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: dense ? 16 : 22 }}>
                {kickoffs.map((kf) => <KickoffCard key={kf.id} kf={kf} dense={dense} onReview={(k) => onNav && onNav("kickoff", k.id)} />)}
              </div>
            </div>
          )}

          {/* Role grid */}
          {populated ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: dense ? 14 : 18 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: NW.teal500 }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: NW.black, letterSpacing: "0.02em", margin: 0 }}>Active roles</h2>
                <span style={{ fontSize: 12, color: NW.gray500 }}>· {activeFilters ? `${filteredOpenings.length} of ${openings.length} shown` : "sourcing in progress"}</span>
              </div>
              {filteredOpenings.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: dense ? 16 : 22 }}>
                  {filteredOpenings.map((o) => <RoleCard key={o.id} opening={o} candidates={candidates} dense={dense} onOpen={(op) => onNav && onNav("kanban", op.id)} />)}
                </div>
              ) : (
                <div style={{ padding: "40px 20px", textAlign: "center", background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 18 }}>
                  <Icon name="search-x" size={22} color={NW.gray300} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: NW.gray600, marginTop: 8 }}>No roles match your filters</div>
                  <button onClick={() => { setTeamFilter("all"); setReviewOnly(false); }} style={{ marginTop: 12, border: `1px solid ${NW.gray200}`, background: NW.white, borderRadius: 9, padding: "8px 14px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: NW.gray700, cursor: "pointer" }}>Clear filters</button>
                </div>
              )}
            </>
          ) : (
            <EmptyBlock
              icon="briefcase"
              title="No open roles yet"
              desc="When Nearwork scopes a role with you, the kickoff brief lands here for your approval — then sourcing begins."
            />
          )}
        </div>
      </main>
    </div>
  );
}
