"use client";

// ── New client-portal design — Pipeline (per-opening kanban board) screen ──────
// Ported from portal-v3-pipeline.jsx (PipelineScreen). Prototype read window.NW_*
// globals (window.NW_CANDIDATES, window.NW_OPENINGS) and received an `openingId`.
// This takes a typed `data` object + `client` as PROPS so real Firebase data
// drops in later. Inline styles preserved verbatim for fidelity.
//
// The compare drawer (CompareModal) and read-only kickoff-brief drawer are ported
// inline so their pure-UI interactions keep working; "move candidate" was never a
// backend call in the prototype (cards navigate to the candidate screen via onNav),
// so nothing here mutates a global.

import React, { useState } from "react";
import { NW, Icon, Avatar, Button } from "../primitives";
import { PortalSidebar, PortalTopBar, EmptyBlock, type PortalClient } from "../shell";

// ── Typed data prop shapes ────────────────────────────────────────────────────

// Per-candidate comparison profile (experience, English, DISC, salary, …).
// Optional — the compare drawer falls back to sensible defaults when absent.
export type PipelineCompare = {
  experience: number;
  english: { level: string; score: number };
  disc: { type: string; label: string };
  salaryExp: string;
  availability: string;
  timezone?: string;
};

// A single candidate card on the board.
export type PipelineCand = {
  id: string | number;
  name: string;
  initials: string;
  avatarBg: string;
  role: string;
  location: string;
  stage: string; // stage label, e.g. "Technical"
  stageIdx: number; // 1..6, see PIPELINE_STAGES below
  score: number;
  openingId: string;
  awaitingDays: number;
  match: string[]; // skill / match tags shown on the card footer
  note?: string; // recruiter note, shown in the compare drawer
  compare?: PipelineCompare; // extended profile for the compare drawer
};

// The (optional) approved kickoff brief attached to this opening.
export type PipelineBrief = {
  approvedDate: string;
  sentBy: { name: string; initials: string; avatarBg: string; role?: string };
  seniority: string;
  engagement: string;
  comp: string;
  headcount: number;
  timezone: string;
  startTarget: string;
  summary: string;
  responsibilities: string[];
  mustHave: string[];
  niceToHave: string[];
};

export type PipelineOpening = {
  id: string;
  title: string;
  team: string;
  location: string;
  brief?: PipelineBrief;
};

export type PipelineData = {
  openingId: string; // the active role id ("all" shows every candidate)
  openingTitle: string; // display label for the active role
  opening?: PipelineOpening; // the active opening (carries the brief)
  totalOpenRoles: number; // how many open roles exist (for the "all" heading)
  candidates: PipelineCand[]; // candidates in this opening's pipeline
};

type NavHandler = (id: string, arg?: string | number) => void;

// The 6 client stages, in order. stageIdx maps 1→Applied … 6→Not selected.
const PIPELINE_STAGES: { key: string; idx: number; color: string }[] = [
  { key: "Applied", idx: 1, color: NW.gray300 },
  { key: "Screening", idx: 2, color: NW.violet500 },
  { key: "Technical", idx: 3, color: NW.teal500 },
  { key: "Final round", idx: 4, color: NW.teal600 },
  { key: "Offer", idx: 5, color: NW.rose500 },
  { key: "Not selected", idx: 6, color: "#94A3B8" },
];

const DISC_COLORS: Record<string, string> = { D: "#E74C7C", I: "#EAB308", S: "#16A085", C: "#3B82F6" };

// ── Inline candidate avatar (shell has no CandidateAvatar) ────────────────────
function CandidateAvatar({ c, size = 36 }: { c: PipelineCand; size?: number }) {
  return <Avatar initials={c.initials} size={size} bg={c.avatarBg} />;
}

// Resolve the compare profile for a candidate, filling deterministic defaults.
function getCandidateCompare(c: PipelineCand): PipelineCompare & { nearwork: number; skills: string[] } {
  const e: PipelineCompare = c.compare || {
    experience: 5,
    english: { level: "B2", score: 80 },
    disc: { type: "C", label: "Conscientious" },
    salaryExp: "$5,000",
    availability: "2 weeks",
    timezone: "GMT-5",
  };
  return { ...e, nearwork: c.score, skills: c.match || [] };
}

// ── Kanban card ────────────────────────────────────────────────────────────
function KanbanCard({ c, dense, compareMode, selected, onToggleSelect, onOpen }: {
  c: PipelineCand;
  dense?: boolean;
  compareMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (c: PipelineCand) => void;
  onOpen?: (c: PipelineCand) => void;
}) {
  const [hover, setHover] = useState(false);
  const urgent = c.awaitingDays >= 2;
  return (
    <div
      onClick={() => compareMode ? (onToggleSelect && onToggleSelect(c)) : (onOpen && onOpen(c))}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: NW.white,
        border: `1px solid ${selected ? NW.teal500 : (hover ? NW.gray200 : NW.gray100)}`,
        boxShadow: selected ? `0 0 0 3px ${NW.teal500}22` : (hover ? '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.03)'),
        borderRadius: 12,
        padding: dense ? 12 : 14,
        cursor: 'pointer', position: 'relative',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'border-color 150ms, box-shadow 150ms',
      }}>
      {compareMode && (
        <span style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? NW.teal500 : NW.gray300}`, background: selected ? NW.teal500 : NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <Icon name="check" size={13} color={NW.white} strokeWidth={3} />}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CandidateAvatar c={c} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {urgent && <span title="Awaiting your review" style={{ width: 6, height: 6, borderRadius: '50%', background: NW.rose500 }} />}
          <span style={{ fontFamily: 'Poppins, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: 15, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em' }}>{c.score}</span>
        </div>
      </div>
    </div>
  );
}

// ── Kanban column ────────────────────────────────────────────────────────────
function KanbanColumn({ stage, candidates, dense, compareMode, selectedIds, onToggleSelect, onOpen }: {
  stage: { key: string; idx: number; color: string };
  candidates: PipelineCand[];
  dense?: boolean;
  compareMode?: boolean;
  selectedIds?: (string | number)[];
  onToggleSelect?: (c: PipelineCand) => void;
  onOpen?: (c: PipelineCand) => void;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: NW.offWhite,
      border: `1px solid ${NW.gray100}`,
      borderRadius: 14,
      display: 'flex', flexDirection: 'column',
      maxHeight: '100%',
    }}>
      {/* Column header */}
      <div style={{
        padding: dense ? '12px 14px' : '14px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${NW.gray100}`,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: stage.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{stage.key}</span>
        <span style={{
          background: NW.white, border: `1px solid ${NW.gray100}`,
          color: NW.gray600, fontFamily: 'Poppins, sans-serif', fontVariantNumeric: 'tabular-nums',
          fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
        }}>{candidates.length}</span>
      </div>
      {/* Cards */}
      <div style={{
        flex: 1, overflow: 'auto',
        padding: dense ? 10 : 12,
        display: 'flex', flexDirection: 'column', gap: dense ? 8 : 10,
      }}>
        {candidates.length === 0 ? (
          <div style={{
            border: `1px dashed ${NW.gray200}`, borderRadius: 10,
            padding: '24px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: NW.gray400 }}>No candidates</div>
          </div>
        ) : candidates.map(c => <KanbanCard key={c.id} c={c} dense={dense} compareMode={compareMode} selected={!!selectedIds && selectedIds.includes(c.id)} onToggleSelect={onToggleSelect} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

// ── List view row ───────────────────────────────────────────────────────────
function PipelineListRow({ c, stage, dense, last, compareMode, selected, onToggleSelect, onOpen }: {
  c: PipelineCand;
  stage?: { key: string; idx: number; color: string };
  dense?: boolean;
  last?: boolean;
  compareMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (c: PipelineCand) => void;
  onOpen?: (c: PipelineCand) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={() => compareMode ? (onToggleSelect && onToggleSelect(c)) : (onOpen && onOpen(c))}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', gridTemplateColumns: `${compareMode ? '28px ' : ''}2fr 1.4fr 1.2fr 1fr 0.7fr`,
        alignItems: 'center', gap: 16,
        padding: dense ? '12px 18px' : '15px 20px',
        borderRadius: 12,
        background: selected ? NW.teal50 : (hover ? NW.gray50 : 'transparent'),
        boxShadow: selected ? `inset 0 0 0 1px ${NW.teal500}55` : 'none',
        cursor: 'pointer', transition: 'background 120ms',
      }}>
      {compareMode && (
        <span style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? NW.teal500 : NW.gray300}`, background: selected ? NW.teal500 : NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <Icon name="check" size={13} color={NW.white} strokeWidth={3} />}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
        <CandidateAvatar c={c} size={dense ? 36 : 40} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{c.location}</div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: NW.gray700 }}>{c.role}</div>
      <div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: NW.gray700, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '4px 11px', borderRadius: 999 }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: stage ? stage.color : NW.gray300 }} />
          {c.stage}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 5, background: NW.gray100, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${c.score}%`, height: '100%', background: c.score >= 90 ? NW.teal600 : c.score >= 80 ? NW.teal500 : NW.yellow500 }} />
        </div>
        <span style={{ fontFamily: 'Poppins, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: 12, color: NW.black, minWidth: 22, textAlign: 'right' }}>{c.score}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        {c.awaitingDays === 0
          ? <span style={{ fontSize: 11, color: NW.gray400 }}>—</span>
          : <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: c.awaitingDays >= 2 ? NW.rose50 : NW.yellow50, color: c.awaitingDays >= 2 ? NW.rose600 : '#A16207' }}>{c.awaitingDays}d</span>}
      </div>
    </div>
  );
}

// ── Kickoff brief drawer (read-only, the approved brief stored with the role) ──
function KickoffBriefDrawer({ opening, brief, onClose }: {
  opening: PipelineOpening;
  brief: PipelineBrief;
  onClose: () => void;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(15,15,15,0.32)',
      display: 'flex', justifyContent: 'flex-end',
      animation: 'nwFade 160ms ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(520px, 92%)', height: '100%', background: NW.white,
        boxShadow: '-12px 0 40px rgba(0,0,0,0.16)',
        display: 'flex', flexDirection: 'column',
        animation: 'nwSlideIn 240ms cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '22px 26px', borderBottom: `1px solid ${NW.gray100}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: NW.teal50, color: NW.teal700, marginBottom: 11 }}>
              <Icon name="check-circle" size={12} color={NW.teal700} /> Approved kickoff
            </span>
            <div style={{ fontSize: 21, fontWeight: 700, color: NW.black, letterSpacing: '-0.025em', lineHeight: 1.15 }}>{opening.title}</div>
            <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 5 }}>{opening.team} · {opening.location}</div>
          </div>
          <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="x" size={16} color={NW.gray600} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 12, marginBottom: 24 }}>
            <Avatar initials={brief.sentBy.initials} bg={brief.sentBy.avatarBg} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: NW.black }}>{brief.sentBy.name}</div>
              <div style={{ fontSize: 11, color: NW.gray500 }}>Approved {brief.approvedDate}</div>
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 26 }}>
            {[
              { icon: 'signal', l: 'Seniority', v: brief.seniority },
              { icon: 'briefcase', l: 'Engagement', v: brief.engagement },
              { icon: 'wallet', l: 'Comp range', v: brief.comp },
              { icon: 'clock', l: 'Timezone', v: brief.timezone },
              { icon: 'calendar', l: 'Start target', v: brief.startTarget },
              { icon: 'users', l: 'Headcount', v: String(brief.headcount) },
            ].map(m => (
              <div key={m.l}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}><Icon name={m.icon} size={12} color={NW.gray400} /> {m.l}</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: NW.black }}>{m.v}</div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Role overview</h3>
          <p style={{ fontSize: 14, color: NW.gray800, lineHeight: 1.6, margin: '0 0 26px' }}>{brief.summary}</p>

          <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Key responsibilities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
            {brief.responsibilities.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: NW.teal500, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, color: NW.gray800, lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Must-have</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {brief.mustHave.map(s => <span key={s} style={{ fontSize: 12.5, fontWeight: 500, color: NW.teal700, background: NW.teal50, border: '1px solid #16A08522', padding: '5px 12px', borderRadius: 8 }}>{s}</span>)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Nice to have</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {brief.niceToHave.map(s => <span key={s} style={{ fontSize: 12.5, fontWeight: 500, color: NW.gray600, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '5px 12px', borderRadius: 8 }}>{s}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Candidate comparison — side-by-side of up to 3 candidates ─────────────────
// Ported from portal-v3-compare.jsx (CompareModal). The assessment row was an
// optional data source in the prototype (window.getCandidateAssessment); with no
// assessment data wired yet it renders "Pending" for every column, matching the
// prototype's own null-safe fallback.
function CompareModal({ candidates, onClose }: { candidates: PipelineCand[]; onClose: () => void }) {
  const cols = candidates.map(c => ({ c, x: getCandidateCompare(c), a: null as null }));
  const maxNW = Math.max(...cols.map(o => o.x.nearwork));
  const maxExp = Math.max(...cols.map(o => o.x.experience));
  const maxEng = Math.max(...cols.map(o => o.x.english.score));
  const availRank: Record<string, number> = { 'Immediate': 0, '2 weeks': 1, '3 weeks': 2, '1 month': 3 };
  const bestAvail = Math.min(...cols.map(o => availRank[o.x.availability] ?? 9));

  const stages: Record<number, string> = { 1: NW.gray400, 2: NW.violet500, 3: '#1ABC9C', 4: NW.teal600, 5: NW.rose500 };
  const gridCols = `170px repeat(${cols.length}, 1fr)`;

  const Row = ({ label, render }: { label: string; render: (o: typeof cols[number], i: number) => React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: gridCols, alignItems: 'stretch', borderTop: `1px solid ${NW.gray100}` }}>
      <div style={{ padding: '16px 18px', fontSize: 11.5, fontWeight: 600, color: NW.gray500, letterSpacing: '0.04em', display: 'flex', alignItems: 'center' }}>{label}</div>
      {cols.map((o, i) => <div key={i}>{render(o, i)}</div>)}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(15,15,15,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'nwFade 160ms ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(940px, 100%)', maxHeight: '90vh', overflow: 'auto', background: NW.white, borderRadius: 22, boxShadow: '0 24px 70px rgba(0,0,0,0.28)', animation: 'nwPop 220ms cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 2, background: NW.white, borderBottom: `1px solid ${NW.gray100}`, padding: '20px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 700, color: NW.black, letterSpacing: '-0.025em', margin: 0 }}>Compare candidates</h2>
            <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 3 }}>{cols.length} side by side · best value highlighted</div>
          </div>
          <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="x" size={16} color={NW.gray600} />
          </button>
        </div>

        {/* Candidate header row */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '8px 8px 0' }}>
          <div />
          {cols.map((o, i) => (
            <div key={i} style={{ padding: '16px 14px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><CandidateAvatar c={o.c} size={52} /></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: NW.black, letterSpacing: '-0.01em' }}>{o.c.name}</div>
              <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 2 }}>{o.c.role}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: NW.gray700, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '3px 9px', borderRadius: 999 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: stages[o.c.stageIdx] }} /> {o.c.stage}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '4px 8px 8px' }}>
          {/* Nearwork score */}
          <Row label="Nearwork score" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', borderRadius: 12, background: o.x.nearwork === maxNW ? NW.teal50 : 'transparent', textAlign: 'center' }}>
              <span style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 700, color: o.x.nearwork === maxNW ? NW.teal700 : NW.black, letterSpacing: '-0.03em' }}>{o.x.nearwork}</span>
              <span style={{ fontSize: 12, color: NW.gray400 }}>/100</span>
              {o.x.nearwork === maxNW && <div style={{ fontSize: 10.5, fontWeight: 700, color: NW.teal600, marginTop: 2 }}>BEST</div>}
            </div>
          )} />
          {/* Experience */}
          <Row label="Experience" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', borderRadius: 12, background: o.x.experience === maxExp ? NW.teal50 : 'transparent', textAlign: 'center' }}>
              <span style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em' }}>{o.x.experience}</span>
              <span style={{ fontSize: 12.5, color: NW.gray500 }}> yrs</span>
            </div>
          )} />
          {/* English */}
          <Row label="English" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', borderRadius: 12, background: o.x.english.score === maxEng ? NW.teal50 : 'transparent', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: NW.black }}>{o.x.english.level}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
                <div style={{ flex: 1, height: 5, background: NW.gray100, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${o.x.english.score}%`, height: '100%', background: NW.teal500 }} />
                </div>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: 11, color: NW.gray600 }}>{o.x.english.score}</span>
              </div>
            </div>
          )} />
          {/* Assessment */}
          <Row label="Assessment" render={() => (
            <div style={{ margin: 8, padding: '14px 16px', textAlign: 'center', fontSize: 12, color: NW.gray400 }}>Pending</div>
          )} />
          {/* DISC */}
          <Row label="DISC assessment" render={(o) => {
            const col = DISC_COLORS[o.x.disc.type] || NW.gray500;
            return (
              <div style={{ margin: 8, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: `${col}1a`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{o.x.disc.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{o.x.disc.label}</span>
                </div>
              </div>
            );
          }} />
          {/* Salary expectation */}
          <Row label="Salary expectation" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: NW.black }}>{o.x.salaryExp}</span>
              <span style={{ fontSize: 12, color: NW.gray400 }}> /mo</span>
            </div>
          )} />
          {/* Availability */}
          <Row label="Availability" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', borderRadius: 12, background: (availRank[o.x.availability] ?? 9) === bestAvail ? NW.teal50 : 'transparent', textAlign: 'center' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>{o.x.availability}</span>
            </div>
          )} />
          {/* Skills */}
          <Row label="Top skills" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {o.x.skills.slice(0, 4).map(s => <span key={s} style={{ fontSize: 11, fontWeight: 500, color: NW.gray700, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '3px 9px', borderRadius: 7 }}>{s}</span>)}
            </div>
          )} />
          {/* Note */}
          <Row label="Recruiter note" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, color: NW.gray600, lineHeight: 1.5, margin: 0 }}>{o.c.note}</p>
            </div>
          )} />
        </div>
      </div>
    </div>
  );
}

// ── Pipeline screen ───────────────────────────────────────────────────────────
export function PipelineScreen({ client, data, density = "regular", onNav }: {
  client: PortalClient;
  data: PipelineData;
  density?: "regular" | "compact";
  onNav?: NavHandler;
}) {
  const dense = density === 'compact';
  const pad = dense ? 28 : 36;
  const candidates = data.candidates;
  const populated = candidates.length > 0;
  const activeRole = data.openingId || 'all';
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const stages = PIPELINE_STAGES;
  const activeRoleLabel = data.openingTitle;
  const stageOf = (c: PipelineCand) => stages.find(s => s.idx === c.stageIdx);
  const activeCount = candidates.filter(c => c.stageIdx < 6).length;
  const opening = data.opening;
  const brief = opening && opening.brief;
  const [showBrief, setShowBrief] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const toggleSelect = (c: PipelineCand) => setSelectedIds(ids => ids.includes(c.id) ? ids.filter(i => i !== c.id) : (ids.length >= 3 ? ids : [...ids, c.id]));
  const openCandidate = (c: PipelineCand) => onNav && onNav('candidate', c.id);
  const selectedCandidates = selectedIds.map(id => candidates.find(c => c.id === id)).filter((c): c is PipelineCand => Boolean(c));
  const exitCompare = () => { setCompareMode(false); setSelectedIds([]); };
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.white, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="pipeline" density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} activity={[]} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: `${dense ? 24 : 32}px ${pad}px ${pad}px` }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: dense ? 16 : 20, gap: 24 }}>
            <div>
              <button onClick={() => onNav && onNav('pipeline')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
                background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit',
                fontSize: 12, fontWeight: 600, color: NW.gray500, letterSpacing: '0.04em', padding: 0,
              }}>
                <Icon name="arrow-left" size={14} color={NW.gray500} /> Open roles
              </button>
              <h1 style={{ fontSize: dense ? 30 : 36, fontWeight: 700, color: NW.black, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                {!populated ? <>No one in pipeline yet.</>
                  : activeRole === 'all'
                    ? <><span style={{ color: NW.teal500 }}>{activeCount}</span> candidates across <span style={{ color: NW.gray400 }}>{data.totalOpenRoles} open roles.</span></>
                    : <>{activeRoleLabel} · <span style={{ color: NW.teal500 }}>{activeCount}</span> <span style={{ color: NW.gray400 }}>in pipeline.</span></>}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* View toggle */}
              <div style={{ display: 'flex', gap: 2, padding: 3, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 8 }}>
                {([
                  { id: 'kanban' as const, icon: 'kanban-square' },
                  { id: 'list' as const, icon: 'list' },
                ]).map((v) => {
                  const on = view === v.id;
                  return (
                    <button key={v.id} onClick={() => setView(v.id)} style={{
                      border: 'none', padding: '5px 10px', borderRadius: 6,
                      background: on ? NW.white : 'transparent',
                      color: on ? NW.black : NW.gray500,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      boxShadow: on ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}>
                      <Icon name={v.icon} size={14} color={on ? NW.black : NW.gray500} />
                    </button>
                  );
                })}
              </div>
              <Button variant={compareMode ? 'dark' : 'secondary'} size="sm" icon={compareMode ? 'x' : 'columns-3'} onClick={() => compareMode ? exitCompare() : setCompareMode(true)}>{compareMode ? 'Cancel compare' : 'Compare'}</Button>
              {brief && <Button variant="secondary" size="sm" icon="file-text" onClick={() => setShowBrief(true)}>Kickoff brief</Button>}
            </div>
          </div>

          {compareMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: NW.teal50, border: '1px solid #16A08526', borderRadius: 12, marginBottom: dense ? 12 : 16 }}>
              <Icon name="columns-3" size={15} color={NW.teal600} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.teal700 }}>Select 2–3 candidates to compare side by side</span>
            </div>
          )}

          {/* Board / list */}
          {populated ? (
            view === 'kanban' ? (
              <div style={{ flex: 1, display: 'flex', gap: dense ? 12 : 14, minHeight: 0 }}>
                {stages.map(s => (
                  <KanbanColumn
                    key={s.key} stage={s}
                    candidates={candidates.filter(c => c.stageIdx === s.idx)}
                    dense={dense}
                    compareMode={compareMode} selectedIds={selectedIds} onToggleSelect={toggleSelect} onOpen={openCandidate}
                  />
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 18, padding: dense ? '14px 12px' : '18px 16px' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: `${compareMode ? '28px ' : ''}2fr 1.4fr 1.2fr 1fr 0.7fr`,
                  gap: 16, padding: '0 20px 12px',
                  fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.12em', textTransform: 'uppercase',
                  borderBottom: `1px solid ${NW.gray100}`,
                }}>
                  {compareMode && <span></span>}
                  <span>Candidate</span><span>Role</span><span>Stage</span><span>Match</span>
                  <span style={{ textAlign: 'right' }}>Waiting</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  {[...candidates].sort((a, b) => b.stageIdx - a.stageIdx).map((c, i) => (
                    <PipelineListRow key={c.id} c={c} stage={stageOf(c)} dense={dense} last={i === candidates.length - 1}
                      compareMode={compareMode} selected={selectedIds.includes(c.id)} onToggleSelect={toggleSelect} onOpen={openCandidate} />
                  ))}
                </div>
              </div>
            )
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyBlock
                icon="kanban-square"
                title="Pipeline is empty"
                desc="Once Nearwork sources candidates for your open roles, they'll move through these stages."
                action={<Button variant="primary" size="sm" onClick={() => onNav && onNav('pipeline')}>View open roles</Button>}
              />
            </div>
          )}
        </div>
        {/* Compare floating bar */}
        {compareMode && selectedCandidates.length > 0 && (
          <div style={{ position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 45, display: 'flex', alignItems: 'center', gap: 16, background: NW.black, color: NW.white, padding: '12px 14px 12px 20px', borderRadius: 999, boxShadow: '0 16px 40px rgba(0,0,0,0.28)', animation: 'nwPop 200ms cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {selectedCandidates.map((c, i) => (
                <div key={c.id} title={c.name} style={{ marginLeft: i === 0 ? 0 : -8, border: `2px solid ${NW.black}`, borderRadius: '50%' }}><CandidateAvatar c={c} size={30} /></div>
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedCandidates.length} selected</span>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>{selectedCandidates.length < 2 ? 'Pick at least 2' : `up to 3`}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={exitCompare} style={{ border: 'none', background: 'rgba(255,255,255,0.14)', color: NW.white, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 999, cursor: 'pointer' }}>Clear</button>
              <button disabled={selectedCandidates.length < 2} onClick={() => setShowCompare(true)} style={{ border: 'none', background: selectedCandidates.length < 2 ? 'rgba(255,255,255,0.2)' : NW.teal500, color: NW.white, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, padding: '8px 18px', borderRadius: 999, cursor: selectedCandidates.length < 2 ? 'not-allowed' : 'pointer' }}>Compare</button>
            </div>
          </div>
        )}
        {showBrief && brief && opening && <KickoffBriefDrawer opening={opening} brief={brief} onClose={() => setShowBrief(false)} />}
        {showCompare && <CompareModal candidates={selectedCandidates} onClose={() => setShowCompare(false)} />}
      </main>
    </div>
  );
}
