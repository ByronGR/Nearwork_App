"use client";

// ── New client-portal design — Hire (employee) detail screen ──────────────────
// Ported from portal-v3-hire.jsx (HireDetailScreen) + the review modals/star
// components from portal-v3-review.jsx. The prototype read globals
// (window.NW_TEAM_PEOPLE, window.NW_TEAM_TEAMS, window.NW_EOR_BENEFITS,
// window.NW_MONTHS, window.NW_CLIENT) and helpers (getHireDetail, getHireEOR,
// hireUnreadCount); here everything the screen renders is resolved OUTSIDE this
// component and passed in as a single typed `data` prop (+ `client`), so real
// Firebase data drops in later without touching the look. Inline styles are kept
// verbatim for fidelity.
//
// CRITICAL — the person header + facts strip are ALWAYS PRESENT. The rich
// sub-sections (reviews, EOR plan, PTO, comp, updates, notes) are OPTIONAL and
// null-safe: a missing slice renders a graceful empty/placeholder rather than
// crashing. This screen runs on partial real placement data + prototype defaults.

import React, { useState, useEffect } from "react";
import { NW, Icon, Avatar, Button } from "../primitives";
import { PortalSidebar, PortalTopBar, type PortalClient } from "../shell";

// window.NW_MONTHS → local const.
const NW_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Typed data prop shapes ────────────────────────────────────────────────────

export type HirePersonStatus = "active" | "onleave" | "offboarded";
export type HireSeniority = "Senior" | "Mid" | "Junior";

// The person's team (was resolved from window.NW_TEAM_TEAMS by p.teamId). Optional
// — an individual hire has no team, and the Team fact/badge fall back gracefully.
export type HireTeamRef = {
  id: string;
  name: string;
  accent: string;
};

// One "included" line + one benefit tile in the EOR plan.
export type HireEORBenefit = {
  label: string;
  detail: string;
  icon: string;
  tier: string; // "A" | "B"
};

// EOR plan + selected benefits (was window.getHireEOR output). Optional — when
// absent the whole EOR panel is omitted.
export type HireEOR = {
  name: string; // plan name, e.g. "Plus"
  price: string; // e.g. "$500"
  tier: string; // "Essentials" | "Most picked" | "Full coverage"
  tagline: string;
  base: string[]; // included lines
  scope: string;
  benefits: HireEORBenefit[];
};

// One upcoming PTO entry.
export type HirePTO = {
  label: string;
  dates: string;
  days: number;
  status: string; // "approved" | "pending"
};

// One notification/update row for the hire.
export type HireUpdate = {
  id: string;
  type: string; // "pto" | "review" | "doc" | "comp" | "anniversary"
  text: string;
  when: string;
  unread?: boolean;
  action?: string; // "pto" | "review" — drives inline action buttons
};

// One category score inside a performance review.
export type HireReviewCategory = { label: string; score: number };
// One goal inside a performance review.
export type HireReviewGoal = { text: string; status: string }; // "done" | "in-progress"

// A performance review (richest object).
export type HireReview = {
  id: string;
  type: string; // "annual" | "quarterly"
  period: string;
  date: string;
  rating: number; // 0–5
  reviewer: string;
  reviewerRole?: string;
  conductedBy: string; // "Nearwork" | "Client"
  summary: string;
  categories?: HireReviewCategory[];
  strengths?: string[];
  growth?: string[];
  goals?: HireReviewGoal[];
};

// A client note on the hire.
export type HireNote = {
  author: string;
  date: string;
  text: string;
  visibility: string; // "internal" | "shared"
};

export type HireData = {
  // ── ALWAYS PRESENT (person header + facts) ───────────────────────────────
  id: string | number;
  name: string;
  initials: string;
  avatarBg: string;
  role: string;
  seniority: HireSeniority | string;
  location: string;
  status: HirePersonStatus | string;
  since: string; // placed date, e.g. "Mar 2025"
  tenure: string; // e.g. "1 yr 4 mo"
  managed?: boolean; // in a Nearwork-managed team → Nearwork conducts reviews
  statusNote?: string;
  team?: HireTeamRef | null; // the managed team (null/absent = individual hire)
  guaranteeMonths?: number; // replacement-guarantee window (default 3, or 6 if managed)
  accountManager?: string; // AM name shown on the guarantee panel

  // ── OPTIONAL / RICH (HR detail) — each panel is null-safe ────────────────
  reviewOwner?: string; // "Nearwork" | "Client" (falls back from `managed`)
  sourceRole?: string; // source pipeline role label
  sourceOpeningId?: string; // opening id for the source-pipeline fact link
  salaryMonthly?: string;
  salaryAnnual?: string;
  currency?: string;
  contractType?: string;
  lastReview?: string;
  nextReview?: string;
  manager?: string;
  vacationTotal?: number;
  vacationUsed?: number;
  vacationRemaining?: number;
  upcomingPTO?: HirePTO[];
  updates?: HireUpdate[];
  reviews?: HireReview[];
  clientNotes?: HireNote[];
  eor?: HireEOR | null;
  reviewCategories?: string[]; // was window.NW_REVIEW_CATEGORIES (for the Add-review modal)
};

type NavHandler = (id: string, arg?: string | number) => void;

// ── Status + seniority styling maps (were shared globals) ─────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: NW.teal600, bg: NW.teal50, dot: NW.teal500 },
  onleave: { label: "On leave", color: "#A16207", bg: NW.yellow50, dot: NW.yellow500 },
  offboarded: { label: "Offboarded", color: NW.gray500, bg: NW.gray50, dot: NW.gray400 },
};
const SENIORITY_META: Record<string, { color: string; bg: string }> = {
  Senior: { color: NW.violet500, bg: "#AF7AC514" },
  Mid: { color: NW.teal600, bg: "#16A08514" },
  Junior: { color: NW.gray500, bg: NW.gray50 },
};

// ── Star rating (robust custom SVG, supports fractional fill) — from review src ─
const NW_STAR_PATH = "M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01z";

function StarGlyph({ size = 16, fill = 1, color = "#EAB308", empty = "#E6E3DC" }: {
  size?: number;
  fill?: number;
  color?: string;
  empty?: string;
}) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: size, height: size, lineHeight: 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", inset: 0, display: "block" }}>
        <path d={NW_STAR_PATH} fill={empty} />
      </svg>
      <span style={{ position: "absolute", inset: 0, width: `${Math.max(0, Math.min(1, fill)) * 100}%`, overflow: "hidden", lineHeight: 0 }}>
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
          <path d={NW_STAR_PATH} fill={color} />
        </svg>
      </span>
    </span>
  );
}

function StarRating({ value, size = 16, gap = 3, showNum = true, numColor }: {
  value: number;
  size?: number;
  gap?: number;
  showNum?: boolean;
  numColor?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap }}>
      <span style={{ display: "inline-flex", gap: gap - 1 }}>
        {[0, 1, 2, 3, 4].map((i) => <StarGlyph key={i} size={size} fill={value - i} />)}
      </span>
      {showNum && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: size - 2, fontWeight: 600, color: numColor || NW.gray700, marginLeft: 3 }}>{value.toFixed(1)}</span>}
    </span>
  );
}

// Interactive 1–5 star input
function StarInput({ value, onChange, size = 22 }: { value: number; onChange: (n: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span style={{ display: "inline-flex", gap: 4 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}
          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}>
          <StarGlyph size={size} fill={shown >= n ? 1 : 0} />
        </button>
      ))}
    </span>
  );
}

function ModalShell({ children, onClose, width = 620 }: { children?: React.ReactNode; onClose?: () => void; width?: number }) {
  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, zIndex: 60,
      background: "rgba(15,15,15,0.36)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, animation: "nwFade 160ms ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: `min(${width}px, 100%)`, maxHeight: "88vh", overflow: "auto",
        background: NW.white, borderRadius: 22, boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
        animation: "nwPop 220ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Review detail (view mode) ────────────────────────────────────────────────
function ReviewViewModal({ review, onClose }: { review: HireReview; person: HireData; onClose: () => void }) {
  const annual = review.type === "annual";
  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: "26px 30px", borderBottom: `1px solid ${NW.gray100}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999, background: annual ? "#AF7AC518" : NW.teal50, color: annual ? NW.violet500 : NW.teal700 }}>{annual ? "Annual review" : "Quarterly review"}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: NW.gray500 }}>
              <Icon name={review.conductedBy === "Nearwork" ? "shield-check" : "user"} size={12} color={NW.gray400} /> By {review.conductedBy}
            </span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: NW.black, letterSpacing: "-0.03em", margin: 0 }}>{review.period}</h2>
          <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 5 }}>{review.date} · {review.reviewer}{review.reviewerRole ? ` · ${review.reviewerRole}` : ""}</div>
        </div>
        <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name="x" size={16} color={NW.gray600} />
        </button>
      </div>

      <div style={{ padding: "24px 30px" }}>
        {/* Overall */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", background: NW.offWhite, border: `1px solid ${NW.gray100}`, borderRadius: 16, marginBottom: 24 }}>
          <div style={{ fontFamily: "Poppins", fontSize: 44, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1 }}>{review.rating.toFixed(1)}</div>
          <div>
            <StarRating value={review.rating} size={20} showNum={false} />
            <div style={{ fontSize: 12, color: NW.gray500, marginTop: 5 }}>Overall rating · out of 5.0</div>
          </div>
        </div>

        {/* Categories */}
        {review.categories && review.categories.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>By category</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {review.categories.map((c) => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 13, color: NW.gray700, width: 130, flexShrink: 0 }}>{c.label}</span>
                  <div style={{ flex: 1, height: 7, background: NW.gray100, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${(c.score / 5) * 100}%`, height: "100%", background: c.score >= 4.5 ? NW.teal600 : c.score >= 3.5 ? NW.teal500 : NW.yellow500 }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: NW.black, width: 26, textAlign: "right" }}>{c.score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Summary</h3>
        <p style={{ fontSize: 14.5, color: NW.gray800, lineHeight: 1.6, margin: "0 0 24px" }}>{review.summary}</p>

        {/* Strengths + growth */}
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: review.goals && review.goals.length ? 24 : 0 }}>
          {review.strengths && review.strengths.length > 0 && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.teal700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>Strengths</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {review.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <Icon name="check" size={15} color={NW.teal600} strokeWidth={2.5} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: NW.gray800, lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {review.growth && review.growth.length > 0 && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: "#A16207", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>Growth areas</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {review.growth.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <Icon name="trending-up" size={15} color="#A16207" strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: NW.gray800, lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Goals */}
        {review.goals && review.goals.length > 0 && (
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>Goals</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {review.goals.map((g, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", border: `1px solid ${NW.gray100}`, borderRadius: 12 }}>
                  <Icon name="target" size={15} color={NW.gray400} />
                  <span style={{ flex: 1, fontSize: 13.5, color: NW.gray800 }}>{g.text}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: g.status === "done" ? NW.teal50 : NW.gray50, color: g.status === "done" ? NW.teal700 : NW.gray500 }}>{g.status === "done" ? "Done" : "In progress"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ── Nearwork-managed lock notice ─────────────────────────────────────────────
function ReviewLockedModal({ person, onClose }: { person: HireData; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} width={460}>
      <div style={{ padding: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: NW.teal50, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <Icon name="shield-check" size={26} color={NW.teal600} strokeWidth={1.9} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: NW.black, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Nearwork handles this review</h2>
        <p style={{ fontSize: 14, color: NW.gray600, lineHeight: 1.6, margin: "0 0 22px" }}>
          {person.name.split(" ")[0]} is part of a Nearwork-managed team, so performance reviews are conducted by us. You&rsquo;ll see each review here as soon as it&rsquo;s completed — and you can always add context with a shared note.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Button variant="secondary" size="md" onClick={onClose}>Got it</Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Add review (client conducts) ─────────────────────────────────────────────
function ReviewAddModal({ person, client, categories, onClose, onSave }: {
  person: HireData;
  client: PortalClient;
  categories: string[];
  onClose: () => void;
  onSave: (r: HireReview) => void;
}) {
  const cats = categories;
  const [period, setPeriod] = useState("");
  const [type, setType] = useState("quarterly");
  const [scores, setScores] = useState<Record<string, number>>(() => cats.reduce((a, c) => ((a[c] = 0), a), {} as Record<string, number>));
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [growth, setGrowth] = useState("");

  const rated = cats.filter((c) => scores[c] > 0);
  const overall = rated.length ? rated.reduce((s, c) => s + scores[c], 0) / rated.length : 0;
  const valid = period.trim() && summary.trim() && rated.length === cats.length;

  const save = () => {
    if (!valid) return;
    onSave({
      id: "rnew-" + Date.now(), type, period: period.trim(), date: "Just now",
      rating: Math.round(overall * 10) / 10, reviewer: client.user.name, reviewerRole: client.user.role, conductedBy: "Client",
      summary: summary.trim(),
      categories: cats.map((c) => ({ label: c, score: scores[c] })),
      strengths: strengths.split(",").map((s) => s.trim()).filter(Boolean),
      growth: growth.split(",").map((s) => s.trim()).filter(Boolean),
      goals: [],
    });
  };

  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `1px solid ${NW.gray200}`, borderRadius: 10, padding: "10px 12px", fontFamily: "inherit", fontSize: 13.5, color: NW.black, outline: "none", background: NW.white };

  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: "24px 30px", borderBottom: `1px solid ${NW.gray100}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NW.black, letterSpacing: "-0.025em", margin: 0 }}>New performance review</h2>
          <div style={{ fontSize: 13, color: NW.gray500, marginTop: 5 }}>For {person.name} · you&rsquo;re conducting this review</div>
        </div>
        <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon name="x" size={16} color={NW.gray600} />
        </button>
      </div>

      <div style={{ padding: "24px 30px" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Period</label>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. Q2 2026" style={field} />
          </div>
          <div style={{ width: 200 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Type</label>
            <div style={{ display: "flex", gap: 3, padding: 3, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 10 }}>
              {["quarterly", "annual"].map((t) => (
                <button key={t} onClick={() => setType(t)} style={{ flex: 1, border: "none", padding: "7px 8px", borderRadius: 7, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, textTransform: "capitalize", cursor: "pointer", background: type === t ? NW.white : "transparent", color: type === t ? NW.black : NW.gray500, boxShadow: type === t ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Category ratings */}
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Ratings</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
          {cats.map((c) => (
            <div key={c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: `1px solid ${NW.gray100}`, borderRadius: 12 }}>
              <span style={{ fontSize: 13.5, color: NW.gray800 }}>{c}</span>
              <StarInput value={scores[c]} onChange={(v) => setScores({ ...scores, [c]: v })} size={20} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px", marginBottom: 22 }}>
          <span style={{ fontSize: 12.5, color: NW.gray500 }}>Overall (auto)</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><StarRating value={overall} size={16} /></span>
        </div>

        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Summary</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Overall assessment of the period…" style={{ ...field, minHeight: 84, resize: "vertical", lineHeight: 1.5, marginBottom: 18 }} />

        <div style={{ display: "flex", gap: 16, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Strengths <span style={{ textTransform: "none", letterSpacing: 0, color: NW.gray400 }}>· comma-separated</span></label>
            <input value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="Account relationships, Churn reduction" style={field} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Growth areas <span style={{ textTransform: "none", letterSpacing: 0, color: NW.gray400 }}>· comma-separated</span></label>
            <input value={growth} onChange={(e) => setGrowth(e.target.value)} placeholder="Upsell motions, CRM hygiene" style={field} />
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 30px", borderTop: `1px solid ${NW.gray100}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", bottom: 0, background: NW.white }}>
        <span style={{ fontSize: 12, color: NW.gray400 }}>{valid ? "Ready to save" : "Rate all categories, add a period and summary"}</span>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" icon="check" disabled={!valid} onClick={save}>Save review</Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Small building blocks ─────────────────────────────────────────────────────
function FactCell({ icon, label, value, sub, onClick, accent }: {
  icon: string;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  onClick?: () => void;
  accent?: string;
}) {
  const clickable = !!onClick;
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, minWidth: 0, padding: "16px 18px",
        borderRight: `1px solid ${NW.gray100}`,
        cursor: clickable ? "pointer" : "default",
        background: clickable && hover ? NW.gray50 : "transparent",
        transition: "background 120ms",
      }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>
        <Icon name={icon} size={12} color={NW.gray400} /> {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: clickable ? (accent || NW.teal600) : NW.black, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
        {clickable && <Icon name="arrow-up-right" size={13} color={accent || NW.teal600} style={{ transform: hover ? "translate(2px,-2px)" : "none", transition: "transform 160ms" }} />}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, action, children, pad = 26 }: {
  title: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  pad?: number;
}) {
  return (
    <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: pad }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

// Update (notification) row for a hire
const UPDATE_META: Record<string, { icon: string; c: string }> = {
  pto: { icon: "plane", c: NW.teal600 },
  review: { icon: "star", c: NW.violet500 },
  doc: { icon: "file-text", c: NW.gray600 },
  comp: { icon: "wallet", c: "#A16207" },
  anniversary: { icon: "party-popper", c: NW.rose500 },
};
function UpdateRow({ u, last, resolution, onResolve, onAddReview }: {
  u: HireUpdate;
  last?: boolean;
  resolution?: string;
  onResolve: (id: string, decision: string) => void;
  onAddReview: () => void;
}) {
  const m = UPDATE_META[u.type] || UPDATE_META.doc;
  const showPto = u.action === "pto" && !resolution;
  const showReview = u.action === "review";
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: last ? "none" : `1px solid ${NW.gray100}` }}>
      <div style={{ width: 32, height: 32, borderRadius: 999, background: `${m.c}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={m.icon} size={14} color={m.c} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.4 }}>{u.text}</div>
        <div style={{ fontSize: 11, color: NW.gray400, marginTop: 2 }}>{u.when}</div>
        {/* Actions */}
        {showPto && (
          <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
            <button onClick={() => onResolve(u.id, "approved")} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: NW.teal500, color: NW.white, fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "6px 13px", borderRadius: 8, cursor: "pointer" }}>
              <Icon name="check" size={13} color={NW.white} strokeWidth={2.5} /> Approve
            </button>
            <button onClick={() => onResolve(u.id, "declined")} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${NW.gray200}`, background: NW.white, color: NW.gray700, fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "6px 13px", borderRadius: 8, cursor: "pointer" }}>
              Decline
            </button>
          </div>
        )}
        {u.action === "pto" && resolution && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: resolution === "approved" ? NW.teal50 : NW.gray50, color: resolution === "approved" ? NW.teal700 : NW.gray500 }}>
            <Icon name={resolution === "approved" ? "check" : "x"} size={12} color={resolution === "approved" ? NW.teal600 : NW.gray500} /> {resolution === "approved" ? "You approved this" : "You declined this"}
          </div>
        )}
        {showReview && (
          <div style={{ marginTop: 9 }}>
            <button onClick={onAddReview} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${NW.gray200}`, background: NW.white, color: NW.gray800, fontFamily: "inherit", fontSize: 12, fontWeight: 600, padding: "6px 13px", borderRadius: 8, cursor: "pointer" }}>
              <Icon name="plus" size={13} color={NW.gray700} /> Add review
            </button>
          </div>
        )}
      </div>
      {u.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: NW.rose500, flexShrink: 0, marginTop: 4 }} />}
    </div>
  );
}

function ReviewRow({ r, onOpen }: { r: HireReview; onOpen: (r: HireReview) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={() => onOpen(r)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", gap: 14, padding: "15px 16px", border: `1px solid ${hover ? NW.gray200 : NW.gray100}`, borderRadius: 14, cursor: "pointer", background: hover ? NW.gray50 : NW.white, transition: "background 120ms, border-color 120ms" }}>
      <div style={{ minWidth: 76 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: NW.black }}>{r.period}</div>
        <div style={{ fontSize: 10.5, color: NW.gray400, marginTop: 3, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name={r.conductedBy === "Nearwork" ? "shield-check" : "user"} size={11} color={NW.gray400} /> {r.conductedBy}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 6 }}><StarRating value={r.rating} size={14} /></div>
        <p style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.summary}</p>
      </div>
      <Icon name="chevron-right" size={16} color={hover ? NW.gray500 : NW.gray300} style={{ alignSelf: "center", flexShrink: 0 }} />
    </div>
  );
}

// ── Replacement guarantee + progress-update log ──────────────────────────────
// A hire carries a free 3–6 month replacement guarantee (6 with a monthly
// subscription). Before Nearwork replaces a hire, the MSA requires documented
// proof + feedback — so the client logs progress updates here, and that log is
// the record a replacement request is built on.
function nwMonthIndex(s?: string): number | null {
  if (!s) return null;
  const parts = String(s).split(" ");
  const mi = NW_MONTHS.indexOf(parts[0]);
  const yr = parseInt(parts[1], 10);
  if (mi < 0 || isNaN(yr)) return null;
  return yr * 12 + mi;
}
function nwGuarantee(since: string | undefined, months: number) {
  const start = nwMonthIndex(since);
  const now = 2026 * 12 + 5; // Jun 2026 — the portal's "today"
  if (start == null) return { months, elapsed: 0, remaining: months, active: true, expLabel: "—" };
  const elapsed = Math.max(0, now - start);
  const endIdx = start + months;
  const expLabel = NW_MONTHS[((endIdx % 12) + 12) % 12] + " " + Math.floor(endIdx / 12);
  return { months, elapsed, remaining: months - elapsed, active: months - elapsed > 0, expLabel };
}
const FB_STATUS: Record<string, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  "on-track": { label: "On track", color: NW.teal700, bg: NW.teal50, dot: NW.teal500, icon: "circle-check" },
  "concern": { label: "Some concerns", color: "#A16207", bg: NW.yellow50, dot: "#EAB308", icon: "triangle-alert" },
  "at-risk": { label: "At risk", color: NW.rose600, bg: NW.rose50, dot: NW.rose500, icon: "octagon-alert" },
};

type FeedbackEntry = { id: string; date: string; status: string; text: string; author: string };

function ReplacementPanel({ person, client, guaranteeMonths = 6 }: {
  person: HireData;
  client: PortalClient;
  dense?: boolean;
  guaranteeMonths?: number;
  accountManager?: string;
}) {
  const first = person.name.split(" ")[0];
  const key = "nw_hire_feedback_" + person.id;
  const clientName = (client && client.user && client.user.name) || "You";
  const g = nwGuarantee(person.since, guaranteeMonths);
  const seed: FeedbackEntry[] = [{ id: "seed", date: person.since, status: "on-track", text: `${first} ramped up smoothly and is contributing well to the team.`, author: clientName }];
  const [entries, setEntries] = useState<FeedbackEntry[]>(() => {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      const s = raw ? JSON.parse(raw) : null;
      if (Array.isArray(s) && s.length) return s;
    } catch { /* ignore */ }
    return seed;
  });
  const [status, setStatus] = useState("on-track");
  const [text, setText] = useState("");
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(entries)); } catch { /* ignore */ } }, [entries, key]);

  // Once the guarantee window has lapsed, the panel is gone entirely.
  if (!g.active) return null;

  const add = () => {
    if (!text.trim()) return;
    setEntries([{ id: "f" + Date.now(), date: "Just now", status, text: text.trim(), author: clientName }, ...entries]);
    setText("");
  };
  const pct = Math.min(100, Math.round((g.elapsed / g.months) * 100));

  return (
    <Panel title="Replacement guarantee"
      action={<span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: g.active ? NW.teal50 : NW.gray50, color: g.active ? NW.teal700 : NW.gray500 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: g.active ? NW.teal500 : NW.gray400 }} />{g.active ? "Active" : "Ended"}</span>}>

      {/* Guarantee window */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "Poppins", fontSize: 32, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1 }}>{g.active ? g.remaining : 0}</span>
          <span style={{ fontSize: 13, color: NW.gray500 }}>{g.active ? `month${g.remaining === 1 ? "" : "s"} left` : "months left"}</span>
        </div>
        <div style={{ textAlign: "right", fontSize: 11.5, color: NW.gray500, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600, color: NW.gray700 }}>{g.months}-month window · monthly subscription</div>
          <div>{g.active ? "Expires" : "Ended"} {g.expLabel}</div>
        </div>
      </div>
      <div style={{ height: 8, background: NW.gray100, borderRadius: 5, overflow: "hidden", marginBottom: 18 }}>
        <div style={{ width: pct + "%", height: "100%", background: g.active ? NW.teal500 : NW.gray300 }} />
      </div>

      {/* Updates log */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon name="clipboard-list" size={14} color={NW.gray500} />
        <h4 style={{ fontSize: 12.5, fontWeight: 700, color: NW.black, margin: 0 }}>Progress updates</h4>
      </div>
      <p style={{ fontSize: 12, color: NW.gray500, margin: "0 0 14px", lineHeight: 1.5 }}>Share updates with Nearwork. These form the documented record used for replacement requests under your MSA.</p>

      {/* Composer */}
      <div style={{ border: "1px solid " + NW.gray200, borderRadius: 14, padding: 12, marginBottom: 16, background: NW.offWhite }}>
        <div style={{ display: "flex", gap: 3, padding: 3, background: NW.gray50, border: "1px solid " + NW.gray100, borderRadius: 9, marginBottom: 10 }}>
          {Object.keys(FB_STATUS).map((k) => {
            const on = status === k; const m = FB_STATUS[k];
            return <button key={k} onClick={() => setStatus(k)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", padding: "6px 8px", borderRadius: 7, fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, cursor: "pointer", background: on ? NW.white : "transparent", color: on ? m.color : NW.gray500, boxShadow: on ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: m.dot }} />{m.label}</button>;
          })}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={`How is ${first} doing? Add specifics — wins, concerns, examples…`}
          style={{ width: "100%", minHeight: 60, resize: "vertical", boxSizing: "border-box", border: "1px solid " + NW.gray200, borderRadius: 10, padding: "10px 12px", fontFamily: "inherit", fontSize: 13, color: NW.black, lineHeight: 1.5, outline: "none", background: NW.white }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <Button variant="primary" size="sm" icon="send" disabled={!text.trim()} onClick={add}>Share update</Button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map((e) => {
          const m = FB_STATUS[e.status] || FB_STATUS["on-track"];
          return (
            <div key={e.id} style={{ display: "flex", gap: 11 }}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={m.icon} size={14} color={m.color} strokeWidth={2} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: m.color, background: m.bg, padding: "2px 8px", borderRadius: 999 }}>{m.label}</span>
                  <span style={{ fontSize: 11, color: NW.gray400 }}>{e.author} · {e.date}</span>
                </div>
                <p style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.5, margin: 0 }}>{e.text}</p>
              </div>
            </div>
          );
        })}
      </div>

    </Panel>
  );
}

function EORPanel({ eor }: { eor?: HireEOR | null }) {
  if (!eor) return null;
  const tierColor = ({ Essentials: NW.gray500, "Most picked": NW.teal600, "Full coverage": NW.violet500 } as Record<string, string>)[eor.tier] || NW.teal600;
  return (
    <Panel title="EOR plan & benefits">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px 16px", borderRadius: 14, background: NW.teal50, border: "1px solid #16A08522", marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: NW.black }}>{eor.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: tierColor, background: NW.white, border: `1px solid ${NW.gray100}`, padding: "3px 9px", borderRadius: 999 }}>{eor.tier}</span>
          </div>
          <div style={{ fontSize: 12, color: NW.gray600, marginTop: 4, lineHeight: 1.45 }}>{eor.tagline}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "Poppins", fontSize: 24, fontWeight: 700, color: NW.black, letterSpacing: "-0.03em", lineHeight: 1 }}>{eor.price}</div>
          <div style={{ fontSize: 10, color: NW.gray500, marginTop: 3 }}>/ contractor / month</div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Included</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 18 }}>
        {eor.base.map((b) => (
          <div key={b} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon name="check" size={14} color={NW.teal600} strokeWidth={2.5} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: NW.gray700, lineHeight: 1.35 }}>{b}</span>
          </div>
        ))}
      </div>
      {eor.benefits.length ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: "0.1em", textTransform: "uppercase" }}>Selected benefits</span>
            <span style={{ fontSize: 11, color: NW.gray400 }}>{eor.scope}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {eor.benefits.map((b) => (
              <div key={b.label} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: NW.white, border: `1px solid ${NW.gray100}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={b.icon} size={16} color={NW.teal600} strokeWidth={1.9} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NW.black, lineHeight: 1.25 }}>{b.label}<span style={{ fontSize: 10, fontWeight: 600, color: NW.gray400, marginLeft: 6 }}>Tier {b.tier}</span></div>
                  <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 2, lineHeight: 1.35 }}>{b.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 11, background: NW.gray50, border: `1px solid ${NW.gray100}` }}>
          <Icon name="info" size={14} color={NW.gray400} />
          <span style={{ fontSize: 12.5, color: NW.gray500 }}>{eor.scope} on the Core plan.</span>
        </div>
      )}
    </Panel>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export function HireDetailScreen({ client, data, density = "regular", onNav }: {
  client: PortalClient;
  data: HireData;
  density?: "regular" | "compact";
  onNav?: NavHandler;
}) {
  const dense = density === "compact";
  const pad = dense ? 32 : 44;
  const p = data;
  const team = data.team || null;
  const st = STATUS_META[p.status] || STATUS_META.active;
  const sen = SENIORITY_META[p.seniority] || SENIORITY_META.Mid;

  // Rich HR detail — all optional, null-safe defaults so partial data won't crash.
  const vacationTotal = data.vacationTotal ?? 0;
  const vacationUsed = data.vacationUsed ?? 0;
  const vacationRemaining = data.vacationRemaining ?? (vacationTotal - vacationUsed);
  const vacPct = vacationTotal ? Math.round((vacationUsed / vacationTotal) * 100) : 0;
  const upcomingPTO = data.upcomingPTO ?? [];
  const updates = data.updates ?? [];
  const reviewOwner = data.reviewOwner ?? (p.managed ? "Nearwork" : "Client");
  const clientConducts = reviewOwner === "Client";
  const reviewCategories = data.reviewCategories ?? [];
  const guaranteeMonths = data.guaranteeMonths ?? (p.managed ? 6 : 3);

  const [reviews, setReviews] = useState<HireReview[]>(() => data.reviews ?? []);
  const [notes, setNotes] = useState<HireNote[]>(() => data.clientNotes ?? []);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteShare, setNoteShare] = useState("internal"); // 'internal' | 'shared'
  const [openReview, setOpenReview] = useState<HireReview | null>(null);
  const [addingReview, setAddingReview] = useState(false);
  const [lockedNotice, setLockedNotice] = useState(false);
  const [ptoResolutions, setPtoResolutions] = useState<Record<string, string>>({}); // updateId -> 'approved'|'declined'

  const unread = updates.filter((u) => u.unread).length;

  const addNote = () => {
    if (!noteDraft.trim()) return;
    setNotes([{ author: client.user.name, date: "Just now", text: noteDraft.trim(), visibility: noteShare }, ...notes]);
    setNoteDraft("");
  };
  const onAddReviewClick = () => (clientConducts ? setAddingReview(true) : setLockedNotice(true));
  const saveReview = (r: HireReview) => { setReviews([r, ...reviews]); setAddingReview(false); setOpenReview(r); };
  const resolvePto = (id: string, decision: string) => setPtoResolutions({ ...ptoResolutions, [id]: decision });
  const pendingActions = updates.filter((u) => (u.action === "pto" && !ptoResolutions[u.id]) || (u.action === "review" && clientConducts && reviews.length === 0)).length;

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: NW.offWhite, color: NW.black, fontFamily: "Poppins, sans-serif" }}>
      <PortalSidebar active="team" density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <PortalTopBar dense={dense} onNav={onNav} activity={[]} />
        <div style={{ flex: 1, overflow: "auto", padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>

            <button onClick={() => onNav && onNav("team")} style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
              background: "transparent", border: "none", cursor: "pointer", font: "inherit",
              fontSize: 12, fontWeight: 600, color: NW.gray500, letterSpacing: "0.04em", padding: 0,
            }}>
              <Icon name="arrow-left" size={14} color={NW.gray500} /> Team
            </button>

            {/* Header */}
            <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 22, overflow: "hidden", marginBottom: dense ? 18 : 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, padding: dense ? 24 : 30, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
                  <Avatar initials={p.initials} bg={p.avatarBg} size={dense ? 60 : 72} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <h1 style={{ fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.black, letterSpacing: "-0.03em", margin: 0 }}>{p.name}</h1>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: "5px 11px", borderRadius: 999 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} /> {st.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14.5, color: NW.gray700, fontWeight: 500 }}>{p.role}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: sen.color, background: sen.bg, padding: "2px 9px", borderRadius: 999 }}>{p.seniority}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: NW.gray300 }} />
                      <span style={{ fontSize: 13, color: NW.gray500 }}>{p.location}</span>
                    </div>
                    {p.statusNote && <div style={{ fontSize: 12.5, color: "#A16207", marginTop: 8 }}>{p.statusNote}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {team && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 600, color: NW.teal700, background: NW.teal50, border: "1px solid #16A08522", padding: "7px 12px", borderRadius: 999 }}>
                      <Icon name="shield-check" size={13} color={NW.teal600} /> Managed by Nearwork
                    </span>
                  )}
                  <Button variant="dark" size="sm" icon="message-square-text" onClick={() => document.getElementById("nw-notes")?.scrollIntoView?.({ behavior: "smooth" })}>Leave a note</Button>
                </div>
              </div>
              {/* Facts strip */}
              <div style={{ display: "flex", borderTop: `1px solid ${NW.gray100}`, background: NW.offWhite, flexWrap: "wrap" }}>
                <FactCell icon="calendar-check" label="Placed" value={p.since} sub={p.tenure} />
                <FactCell icon="git-branch" label="Source pipeline" value={data.sourceRole || "—"} accent={NW.teal600}
                  onClick={data.sourceOpeningId ? () => onNav && onNav("kanban", data.sourceOpeningId) : undefined} />
                <FactCell icon="users-round" label="Team" value={team ? team.name : "Individual"} accent={team ? team.accent : undefined}
                  onClick={team ? () => onNav && onNav("team") : undefined} />
                <FactCell icon="wallet" label="Salary" value={`${data.salaryMonthly || "—"}`} sub="per month" />
                <FactCell icon="palmtree" label="Vacation" value={`${vacationRemaining} days left`} sub={`of ${vacationTotal}`} />
              </div>
            </div>

            {/* Body */}
            <div style={{ display: "grid", gridTemplateColumns: dense ? "1fr" : "1.6fr 1fr", gap: dense ? 18 : 24, alignItems: "start" }}>

              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: dense ? 18 : 24 }}>

                {/* Replacement guarantee + progress updates */}
                <ReplacementPanel key={String(p.id)} person={p} client={client} dense={dense} guaranteeMonths={guaranteeMonths} accountManager={data.accountManager || "Lina Pardo"} />

                {/* Performance */}
                <Panel title="Performance reviews"
                  action={<Button variant="secondary" size="sm" icon="plus" onClick={onAddReviewClick}>Add review</Button>}>
                  {/* Who conducts reviews */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 13px", borderRadius: 11, background: clientConducts ? NW.gray50 : NW.teal50, border: `1px solid ${clientConducts ? NW.gray100 : "#16A08522"}`, marginBottom: 16 }}>
                    <Icon name={clientConducts ? "user" : "shield-check"} size={14} color={clientConducts ? NW.gray500 : NW.teal600} />
                    <span style={{ fontSize: 12.5, color: clientConducts ? NW.gray600 : NW.teal700, fontWeight: 500 }}>
                      {clientConducts ? "You conduct reviews for this individual hire." : `Nearwork conducts reviews for ${p.name.split(" ")[0]} as part of a managed team.`}
                    </span>
                  </div>
                  {reviews.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                      {reviews.map((r) => <ReviewRow key={r.id} r={r} onOpen={setOpenReview} />)}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "26px 16px" }}>
                      <Icon name="star" size={22} color={NW.gray300} />
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: NW.gray600, marginTop: 8 }}>No reviews yet</div>
                      <div style={{ fontSize: 12.5, color: NW.gray400, marginTop: 3 }}>{clientConducts ? "Add the first performance review for this hire." : "Nearwork will post the first review here."}</div>
                    </div>
                  )}
                </Panel>

                {/* EOR plan & benefits */}
                <EORPanel eor={data.eor} />

                {/* Notes — internal or shared with Nearwork */}
                <div id="nw-notes">
                  <Panel title="Notes">
                    <div style={{ display: "flex", gap: 11, marginBottom: notes.length ? 18 : 0 }}>
                      <Avatar initials={client.user.initials} bg={NW.teal500} size={34} />
                      <div style={{ flex: 1 }}>
                        <textarea
                          value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder={`Add a note about ${p.name.split(" ")[0]}…`}
                          style={{ width: "100%", minHeight: 64, resize: "vertical", boxSizing: "border-box", border: `1px solid ${NW.gray200}`, borderRadius: 12, padding: "11px 13px", fontFamily: "inherit", fontSize: 13.5, color: NW.black, lineHeight: 1.5, outline: "none", background: NW.offWhite }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 12, flexWrap: "wrap" }}>
                          {/* visibility toggle */}
                          <div style={{ display: "flex", gap: 3, padding: 3, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 9 }}>
                            {[
                              { id: "internal", label: "Internal", icon: "lock" },
                              { id: "shared", label: "Share with Nearwork", icon: "send" },
                            ].map((o) => {
                              const on = noteShare === o.id;
                              return (
                                <button key={o.id} onClick={() => setNoteShare(o.id)} style={{
                                  display: "inline-flex", alignItems: "center", gap: 6, border: "none",
                                  padding: "6px 11px", borderRadius: 7, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                  background: on ? NW.white : "transparent", color: on ? NW.black : NW.gray500,
                                  boxShadow: on ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                                }}>
                                  <Icon name={o.icon} size={12} color={on ? (o.id === "shared" ? NW.teal600 : NW.gray600) : NW.gray400} /> {o.label}
                                </button>
                              );
                            })}
                          </div>
                          <Button variant="primary" size="sm" icon="send" disabled={!noteDraft.trim()} onClick={addNote}>Post note</Button>
                        </div>
                        <div style={{ fontSize: 11.5, color: NW.gray400, marginTop: 8 }}>
                          {noteShare === "shared" ? "Shared notes appear on Nearwork’s side for this hire." : "Internal notes stay private to your team."}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {notes.map((n, i) => {
                        const shared = n.visibility === "shared";
                        return (
                          <div key={i} style={{ display: "flex", gap: 11 }}>
                            <Avatar initials={n.author.split(" ").map((w) => w[0]).join("").slice(0, 2)} bg={shared ? NW.teal500 : NW.violet500} size={34} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{n.author}</span>
                                <span style={{ fontSize: 11, color: NW.gray400 }}>{n.date}</span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: shared ? NW.teal50 : NW.gray50, color: shared ? NW.teal700 : NW.gray500 }}>
                                  <Icon name={shared ? "send" : "lock"} size={10} color={shared ? NW.teal600 : NW.gray400} /> {shared ? "Shared with Nearwork" : "Internal"}
                                </span>
                              </div>
                              <p style={{ fontSize: 13.5, color: NW.gray700, lineHeight: 1.55, margin: 0 }}>{n.text}</p>
                            </div>
                          </div>
                        );
                      })}
                      {notes.length === 0 && <div style={{ fontSize: 13, color: NW.gray400 }}>No notes yet.</div>}
                    </div>
                  </Panel>
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: dense ? 18 : 24 }}>

                {/* Updates */}
                <Panel title="Updates" pad={24}
                  action={unread > 0 ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: NW.rose600, background: NW.rose50, padding: "4px 10px", borderRadius: 999 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: NW.rose500 }} />{unread} new</span> : undefined}>
                  {pendingActions > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 13px", borderRadius: 11, background: NW.rose50, border: "1px solid #E74C7C26", marginBottom: 14 }}>
                      <Icon name="bell-ring" size={15} color={NW.rose600} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.rose600 }}>{pendingActions} {pendingActions === 1 ? "item needs" : "items need"} your action</span>
                    </div>
                  )}
                  {updates.length ? (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {updates.map((u, i) => <UpdateRow key={u.id} u={u} last={i === updates.length - 1} resolution={ptoResolutions[u.id]} onResolve={resolvePto} onAddReview={onAddReviewClick} />)}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: NW.gray400 }}>No recent updates.</div>
                  )}
                </Panel>

                {/* Compensation */}
                <Panel title="Compensation" pad={24}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "Poppins", fontSize: 34, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em" }}>{data.salaryMonthly || "—"}</span>
                    <span style={{ fontSize: 13, color: NW.gray500 }}>/ month</span>
                  </div>
                  <div style={{ fontSize: 13, color: NW.gray500, marginBottom: 16 }}>{data.salaryAnnual ? `${data.salaryAnnual} annual` : ""} · {data.currency || "USD"}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    {[
                      { l: "Engagement", v: data.contractType || "—", icon: "file-signature" },
                      { l: "Last review", v: data.lastReview || "—", icon: "clock" },
                      { l: "Next review", v: data.nextReview || "—", icon: "calendar" },
                      { l: "Manager", v: data.manager || "—", icon: "user" },
                    ].map((row) => (
                      <div key={row.l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 11, borderTop: `1px solid ${NW.gray100}` }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: NW.gray500 }}><Icon name={row.icon} size={13} color={NW.gray400} /> {row.l}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* Time off */}
                <Panel title="Time off" pad={24}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 12 }}>
                    <span style={{ fontFamily: "Poppins", fontSize: 34, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1 }}>{vacationRemaining}</span>
                    <span style={{ fontSize: 13, color: NW.gray500, marginBottom: 3 }}>of {vacationTotal} days left</span>
                  </div>
                  <div style={{ height: 8, background: NW.gray100, borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ width: `${100 - vacPct}%`, height: "100%", background: NW.teal500 }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: NW.gray400, marginBottom: 4 }}>{vacationUsed} days used this year</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: NW.gray500, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: "3px 9px", borderRadius: 999, marginBottom: 18 }}><Icon name="info" size={11} color={NW.gray400} /> Accrues 1.25 days / month · Colombia</div>

                  <div style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Upcoming PTO</div>
                  {upcomingPTO.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {upcomingPTO.map((pto, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", border: `1px solid ${NW.gray100}`, borderRadius: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: NW.teal50, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon name="plane" size={16} color={NW.teal600} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{pto.label}</div>
                            <div style={{ fontSize: 11.5, color: NW.gray500 }}>{pto.dates} · {pto.days}d</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: pto.status === "approved" ? NW.teal50 : NW.yellow50, color: pto.status === "approved" ? NW.teal700 : "#A16207" }}>{pto.status === "approved" ? "Approved" : "Pending"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: NW.gray400 }}>No upcoming time off scheduled.</div>
                  )}
                </Panel>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {openReview && <ReviewViewModal review={openReview} person={p} onClose={() => setOpenReview(null)} />}
        {addingReview && <ReviewAddModal person={p} client={client} categories={reviewCategories} onClose={() => setAddingReview(false)} onSave={saveReview} />}
        {lockedNotice && <ReviewLockedModal person={p} onClose={() => setLockedNotice(false)} />}
      </main>
    </div>
  );
}
