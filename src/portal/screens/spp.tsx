"use client";

// ── New client-portal design — SPP (Strategic Partner Program) ────────────────
// Ported from portal-v3-spp.jsx (SppScreen + SppClientDetailScreen). The prototype
// read window.NW_SPP_STATUS / NW_SPP_BILLING / NW_SPP_CLIENTS / NW_CLIENT globals
// and generated per-client people/teams/openings deterministically; here every
// screen takes a typed `data` object + `client` as PROPS so real Firebase data
// drops in later. Inline styles kept verbatim for fidelity.
//
// Scope note: the prototype's per-hire HR detail (SppHireDetail) depended on
// unported globals (ReplacementPanel / EORPanel / ReviewViewModal / StarRating /
// Panel / FactCell / UpdateRow) that live in other prototype files. Here a hire
// row click routes out via onNav("hire", personId) instead of embedding it.

import React, { useState } from "react";
import { NW, Icon, Button, Avatar } from "../primitives";
import { PortalSidebar, PortalTopBar, EmptyBlock, type PortalClient } from "../shell";

// ── Typed data prop shapes ────────────────────────────────────────────────────
export type SppStatusKey = "active" | "onboarding" | "paused";
export type SppStatusMeta = { label: string; color: string; bg: string; dot: string };

// Partner status pills — was window.NW_SPP_STATUS.
export type SppStatusMap = Record<string, SppStatusMeta>;

// What the partner pays Nearwork — was window.NW_SPP_BILLING.
export type SppBilling = {
  subscription: string;
  tier: string;
  placementList: string;
  placementSpp: string;
  discountNote: string;
  total: string;
};

// A person seeded on a client (partial — generators fill the rest).
export type SppClientPerson = {
  name: string;
  initials: string;
  avatarBg: string;
  role: string;
};

// A single sub-client (end-client) in the partner's portfolio — was an entry of
// window.NW_SPP_CLIENTS.
export type SppClient = {
  id: string;
  name: string;
  initials: string;
  logoBg: string;
  industry: string;
  status: SppStatusKey | string;
  since: string;
  hires: number;
  teams: number;
  openRoles: number;
  pipeline: number;
  monthly: string;
  services: { managed: string; eor: string; direct: string };
  people?: SppClientPerson[];
  // Optional partner-managed client detail (used on the detail header).
  contactName?: string;
  contactEmail?: string;
  note?: string;
};

export type SppData = {
  status: SppStatusMap; // partner status pill styling
  billing: SppBilling; // partner billing (subscription + per-client costs)
  clients: SppClient[]; // the sub-clients list (partner's portfolio)
  reviewCategories?: string[]; // was window.NW_REVIEW_CATEGORIES
  partnerTzShort?: string; // was window.NW_CLIENT.timezone.short; defaults "Partner"
};

type NavHandler = (id: string, arg?: string | number) => void;

// ── Deterministic per-client generators (ported verbatim from the prototype) ──
type SppPerson = {
  name: string;
  initials: string;
  avatarBg: string;
  role: string;
  seniority: string;
  id: string;
  idx: number;
  status: string;
  location: string;
  since: string;
  tenure: string;
  utilization: number;
  accountManager: string;
  teamName: string | null;
};

type SppTeam = {
  id: string;
  name: string;
  lead: SppPerson;
  members: SppPerson[];
  accent: string;
  focus: string;
  accountManager: { name: string; initials: string };
  pod: string | null;
  established: string;
  hoursPartner: string;
  hoursColombia: string;
  health: string;
};

type SppCandidate = { id: string; name: string; initials: string; avatarBg: string; score: number; stageIdx: number };
type SppOpening = { id: string; title: string; team: string; location: string; candidates: SppCandidate[] };

const SPP_POOL = [
  { n: "Andrés Gil", bg: "#16A085" }, { n: "María Soto", bg: "#E74C7C" }, { n: "Cris Mora", bg: "#3B82F6" },
  { n: "Laura Vega", bg: "#AF7AC5" }, { n: "Diego Páez", bg: "#12866E" }, { n: "Sara Ruiz", bg: "#EAB308" },
  { n: "Juan Toro", bg: "#3B82F6" }, { n: "Eva Lara", bg: "#16A085" }, { n: "Pablo Niño", bg: "#E74C7C" },
  { n: "Nora Díaz", bg: "#AF7AC5" }, { n: "Tomás Rey", bg: "#16A085" }, { n: "Iván Cano", bg: "#12866E" },
  { n: "Lucía Peña", bg: "#3B82F6" }, { n: "Mateo Gil", bg: "#EAB308" }, { n: "Ana Mejía", bg: "#E74C7C" },
  { n: "Felipe Cruz", bg: "#AF7AC5" }, { n: "Sofía Rey", bg: "#16A085" }, { n: "Carla Vives", bg: "#12866E" },
];
const SPP_ROLES = ["Backend Engineer", "Frontend Engineer", "Product Designer", "DevOps Engineer", "Data Engineer", "QA Engineer", "Customer Success"];
const SPP_TEAMNAMES = ["Platform", "Product", "Infrastructure", "Data", "Growth", "Mobile"];
const SPP_SENIORITY = ["Senior", "Mid", "Junior"];
const SPP_LOCATIONS = ["Bogotá · Remote", "Medellín · Remote", "Cali · Remote", "Barranquilla · Remote", "Remote · LATAM", "Bucaramanga · Remote"];
const SPP_SINCE = ["Feb 2026", "Apr 2026", "Mar 2025", "Jun 2025", "Dec 2025", "Sep 2025"];
const SPP_TENURE = ["4 mo", "2 mo", "15 mo", "12 mo", "6 mo", "9 mo"];
const SPP_AMS = ["Lina Pardo", "Andrés Gómez", "Camila Ortiz"];
const sppInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
function sppPick(i: number) { return SPP_POOL[i % SPP_POOL.length]; }

function sppPeople(c: SppClient): SppPerson[] {
  const seed: Array<SppClientPerson & { seniority: string }> = [];
  (c.people || []).forEach((p) => seed.push({ name: p.name, initials: p.initials, avatarBg: p.avatarBg, role: p.role, seniority: "Senior" }));
  for (let i = seed.length; i < c.hires; i++) {
    const p = sppPick(i + c.name.length);
    seed.push({ name: p.n, initials: sppInitials(p.n), avatarBg: p.bg, role: SPP_ROLES[i % SPP_ROLES.length], seniority: SPP_SENIORITY[i % 3] });
  }
  return seed.map((p, i) => ({
    ...p, id: c.id + "-h" + i, idx: i, status: "active",
    location: SPP_LOCATIONS[i % SPP_LOCATIONS.length],
    since: SPP_SINCE[i % SPP_SINCE.length],
    tenure: SPP_TENURE[i % SPP_TENURE.length],
    utilization: i % 5 === 3 ? 80 : 100,
    accountManager: SPP_AMS[i % SPP_AMS.length],
    teamName: c.teams ? SPP_TEAMNAMES[i % c.teams] : null,
  }));
}

function sppTeams(c: SppClient): SppTeam[] {
  const people = sppPeople(c);
  const out: SppTeam[] = [];
  const per = Math.max(2, Math.floor(c.hires / Math.max(1, c.teams)));
  const AMS = [{ name: "Lina Pardo", initials: "LP" }, { name: "Andrés Gómez", initials: "AG" }, { name: "Camila Ortiz", initials: "CO" }];
  const REGIONS: (string | null)[] = ["Antioquia", null, "Bogotá", "Valle del Cauca"];
  for (let i = 0; i < c.teams; i++) {
    const members = people.slice(i * per, i * per + per);
    const mm = members.length ? members : people.slice(0, 2);
    out.push({
      id: "t" + i, name: SPP_TEAMNAMES[i % SPP_TEAMNAMES.length], lead: mm[0],
      members: mm, accent: ["#16A085", "#3B82F6", "#E74C7C", "#AF7AC5"][i % 4],
      focus: ["Core services & delivery", "Product & design", "Cloud & reliability", "Data & analytics"][i % 4],
      accountManager: AMS[i % AMS.length], pod: REGIONS[i % REGIONS.length],
      established: ["Jan 2025", "Mar 2025", "Jun 2025"][i % 3], hoursPartner: "8:00 – 17:00", hoursColombia: "9:00 – 18:00",
      health: i % 4 === 2 ? "attention" : "on-track",
    });
  }
  return out;
}

function sppOpenings(c: SppClient): SppOpening[] {
  const out: SppOpening[] = [];
  const stageKeys = [1, 2, 3, 4, 5];
  for (let i = 0; i < c.openRoles; i++) {
    const total = Math.max(4, Math.round(c.pipeline / Math.max(1, c.openRoles)));
    const cands: SppCandidate[] = [];
    for (let k = 0; k < total; k++) {
      const p = sppPick(i * 5 + k + 3);
      const stageIdx = stageKeys[k % stageKeys.length];
      cands.push({ id: c.id + "-" + i + "-" + k, name: p.n, initials: sppInitials(p.n), avatarBg: p.bg, score: 72 + ((i * 7 + k * 11) % 24), stageIdx });
    }
    // a couple not selected
    for (let k = 0; k < 2; k++) {
      const p = sppPick(i * 5 + k + 40);
      cands.push({ id: c.id + "-" + i + "-ns" + k, name: p.n, initials: sppInitials(p.n), avatarBg: "#94A3B8", score: 55 + k * 4, stageIdx: 6 });
    }
    out.push({ id: c.id + "-op" + i, title: SPP_ROLES[i % SPP_ROLES.length], team: SPP_TEAMNAMES[i % SPP_TEAMNAMES.length], location: "Remote · LATAM", candidates: cands });
  }
  return out;
}

const SPP_STAGES = [
  { key: "Applied", idx: 1, color: "#BDBDBD" }, { key: "Screening", idx: 2, color: "#AF7AC5" },
  { key: "Technical", idx: 3, color: "#16A085" }, { key: "Final round", idx: 4, color: "#12866E" },
  { key: "Offer", idx: 5, color: "#E74C7C" }, { key: "Not selected", idx: 6, color: "#94A3B8" },
];

const SENIORITY_META: Record<string, { color: string; bg: string }> = {
  Senior: { color: NW.violet500, bg: "#AF7AC514" },
  Mid: { color: NW.teal600, bg: "#16A08514" },
  Junior: { color: NW.gray500, bg: NW.gray50 },
};

// ── Home card (no money) ─────────────────────────────────────────────────────
function SppClientCard({ c, status, dense, onOpen }: {
  c: SppClient;
  status: SppStatusMap;
  dense?: boolean;
  onOpen?: (c: SppClient) => void;
}) {
  const [hover, setHover] = useState(false);
  const st = status[c.status] || status.active;
  return (
    <div onClick={() => onOpen && onOpen(c)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: NW.white, border: `1px solid ${hover ? NW.gray200 : NW.gray100}`, borderRadius: 18, padding: dense ? 20 : 24, cursor: "pointer", boxShadow: hover ? "0 16px 40px rgba(0,0,0,0.08), 0 3px 8px rgba(0,0,0,0.04)" : "0 1px 2px rgba(0,0,0,0.03)", transition: "box-shadow 220ms, border-color 220ms, transform 220ms", transform: hover ? "translateY(-3px)" : "none", display: "flex", flexDirection: "column", gap: dense ? 16 : 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: c.logoBg, color: NW.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Poppins", fontWeight: 700, fontSize: 16, letterSpacing: "-0.03em", flexShrink: 0 }}>{c.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: NW.black, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
            <div style={{ fontSize: 12, color: NW.gray500, marginTop: 1 }}>{c.industry} · since {c.since}</div>
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, color: st.color, background: st.bg }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} /> {st.label}
        </span>
      </div>
      <div style={{ display: "flex", gap: dense ? 10 : 14 }}>
        {[{ l: "Hires", v: c.hires }, { l: "Teams", v: c.teams }, { l: "Open roles", v: c.openRoles }].map((m) => (
          <div key={m.l} style={{ flex: 1, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 11, padding: "11px 12px" }}>
            <div style={{ fontFamily: "Poppins", fontSize: dense ? 20 : 24, fontWeight: 700, color: NW.black, letterSpacing: "-0.03em", lineHeight: 1 }}>{m.v}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 5 }}>{m.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", borderTop: `1px solid ${NW.gray100}`, paddingTop: dense ? 12 : 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: NW.teal600 }}>
          Review progress <Icon name="arrow-right" size={14} color={NW.teal600} style={{ transform: hover ? "translateX(3px)" : "none", transition: "transform 200ms" }} />
        </span>
      </div>
    </div>
  );
}

// ── SPP screen (partner portfolio) ────────────────────────────────────────────
export function SppScreen({ client, data, density = "regular", onNav }: {
  client: PortalClient;
  data: SppData;
  density?: "regular" | "compact";
  onNav?: NavHandler;
}) {
  const dense = density === "compact";
  const pad = dense ? 32 : 44;
  const clients = data.clients || [];
  const isPartner = clients.length > 0;
  const [q, setQ] = useState("");
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.industry.toLowerCase().includes(q.toLowerCase()));
  const summary = [
    { label: "End-clients", value: clients.length, accent: NW.teal500 },
    { label: "Active hires", value: clients.reduce((n, c) => n + c.hires, 0), accent: NW.violet500 },
    { label: "Managed teams", value: clients.reduce((n, c) => n + c.teams, 0), accent: "#3B82F6" },
    { label: "Open roles", value: clients.reduce((n, c) => n + c.openRoles, 0), accent: NW.rose500 },
  ];
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: NW.offWhite, color: NW.black, fontFamily: "Poppins, sans-serif" }}>
      <PortalSidebar active="spp" density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <PortalTopBar dense={dense} onNav={onNav} activity={[]} />
        <div style={{ flex: 1, overflow: "auto", padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: dense ? 22 : 30, gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Strategic Partner Program</div>
                <h1 style={{ fontSize: dense ? 34 : 44, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1.02, margin: 0 }}>Your clients</h1>
                <p style={{ fontSize: 14, color: NW.gray500, marginTop: 10, maxWidth: 540, lineHeight: 1.5 }}>Review progress for each client you serve through Nearwork. They each have their own portal — this is your overview.</p>
              </div>
              {isPartner && (
                <div style={{ position: "relative", width: 240 }}>
                  <Icon name="search" size={15} color={NW.gray400} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" style={{ width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 13, color: NW.black, background: NW.white, border: `1px solid ${NW.gray200}`, borderRadius: 10, padding: "9px 12px 9px 34px", outline: "none" }} />
                </div>
              )}
            </div>

            {!isPartner ? (
              <EmptyBlock icon="git-merge" title="Not a strategic partner yet"
                desc="The Strategic Partner Program lets you manage a portfolio of end-clients through Nearwork. Once you're enrolled, your clients will appear here." />
            ) : (
              <>
                <div style={{ display: "flex", gap: dense ? 14 : 18, marginBottom: dense ? 22 : 28, flexWrap: "wrap" }}>
                  {summary.map((s) => (
                    <div key={s.label} style={{ flex: 1, minWidth: 150, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 16, padding: dense ? "16px 20px" : "18px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ width: 4, height: 38, borderRadius: 2, background: s.accent }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
                        <div style={{ fontFamily: "Poppins", fontSize: dense ? 28 : 34, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1.1, marginTop: 2 }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: dense ? 14 : 18 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: NW.teal500 }} />
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: NW.black, letterSpacing: "0.02em", margin: 0 }}>Clients</h2>
                  <span style={{ fontSize: 12, color: NW.gray500 }}>· {filtered.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: dense ? "1fr" : "repeat(2, 1fr)", gap: dense ? 16 : 20 }}>
                  {filtered.map((c) => <SppClientCard key={c.id} c={c} status={data.status} dense={dense} onOpen={(cl) => onNav && onNav("spp-client", cl.id)} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Client detail sub-components ──────────────────────────────────────────────
// People list row — mirrors the Team page columns (Person · Role · Team · Status · Since).
function SppPersonRow({ p, dense, onOpen }: { p: SppPerson; dense?: boolean; onOpen?: (p: SppPerson) => void }) {
  const [hover, setHover] = useState(false);
  const sen = SENIORITY_META[p.seniority] || { color: NW.teal600, bg: "#16A08514" };
  return (
    <div onClick={() => onOpen && onOpen(p)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "grid", gridTemplateColumns: "2.2fr 1.4fr 1.3fr 1fr 0.6fr", alignItems: "center", gap: 16, padding: dense ? "12px 16px" : "15px 18px", borderRadius: 14, background: hover ? NW.gray50 : "transparent", cursor: "pointer", transition: "background 120ms" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
        <Avatar initials={p.initials} bg={p.avatarBg} size={dense ? 38 : 42} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: NW.black, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{p.location}</div>
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: NW.gray800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.role}</div>
        <span style={{ display: "inline-block", marginTop: 4, fontSize: 10.5, fontWeight: 600, color: sen.color, background: sen.bg, padding: "2px 8px", borderRadius: 999 }}>{p.seniority}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        {p.teamName ? <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: NW.gray700 }}><Icon name="users" size={13} color={NW.gray400} /> {p.teamName}</span> : <span style={{ fontSize: 12, color: NW.gray400 }}>Individual</span>}
      </div>
      <div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: NW.teal600, background: NW.teal50, padding: "5px 11px", borderRadius: 999 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: NW.teal500 }} /> Active
        </span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12.5, color: NW.gray700, fontWeight: 500 }}>{p.since}</div>
        <div style={{ fontSize: 10.5, color: NW.gray400, marginTop: 1 }}>{p.tenure}</div>
      </div>
    </div>
  );
}

function SppMemberRow({ p, dense, last, onOpen }: { p: SppPerson; dense?: boolean; last?: boolean; onOpen?: (p: SppPerson) => void }) {
  const sen = ({ Senior: "#AF7AC5", Mid: "#12866E", Junior: "#757575" } as Record<string, string>)[p.seniority] || "#12866E";
  const [hover, setHover] = useState(false);
  const clickable = !!onOpen;
  return (
    <div onClick={() => clickable && onOpen && onOpen(p)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", alignItems: "center", gap: 13, padding: dense ? "11px 12px" : "13px 14px", borderTop: last ? undefined : "1px solid " + NW.gray100, cursor: clickable ? "pointer" : "default", background: clickable && hover ? NW.gray50 : "transparent", borderRadius: 10, transition: "background 120ms" }}>
      <Avatar initials={p.initials} bg={p.avatarBg} size={dense ? 36 : 40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: NW.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
        <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{p.role}</div>
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: sen, background: sen + "18", padding: "3px 9px", borderRadius: 999 }}>{p.seniority}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: NW.teal700, background: NW.teal50, padding: "4px 10px", borderRadius: 999 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: NW.teal500 }} /> Active
      </span>
      {clickable && <Icon name="chevron-right" size={16} color={hover ? NW.gray500 : NW.gray300} style={{ flexShrink: 0 }} />}
    </div>
  );
}

function SppTeamCard({ t, dense, onOpen }: { t: SppTeam; dense?: boolean; onOpen?: (t: SppTeam) => void }) {
  const [hover, setHover] = useState(false);
  const healthOk = t.health === "on-track";
  return (
    <div onClick={() => onOpen && onOpen(t)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: NW.white, border: "1px solid " + (hover ? NW.gray200 : NW.gray100), borderRadius: 18, padding: dense ? 20 : 24, cursor: "pointer", boxShadow: hover ? "0 14px 34px rgba(0,0,0,0.07)" : "0 1px 2px rgba(0,0,0,0.03)", transition: "box-shadow 200ms, border-color 200ms, transform 200ms", transform: hover ? "translateY(-2px)" : "none", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: t.accent + "16", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="users-round" size={20} color={t.accent} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: NW.black, letterSpacing: "-0.02em" }}>{t.name}</div>
            <div style={{ fontSize: 12, color: NW.gray500, marginTop: 1 }}>{t.focus}</div>
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, color: healthOk ? NW.teal700 : "#A16207", background: healthOk ? NW.teal50 : "#FEF9C3" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: healthOk ? NW.teal500 : "#EAB308" }} /> {healthOk ? "On track" : "Attention"}
        </span>
      </div>
      <div style={{ background: NW.gray50, border: "1px solid " + NW.gray100, borderRadius: 12, padding: "11px 14px" }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray400, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Team lead</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar initials={t.lead.initials} bg={t.lead.avatarBg} size={22} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.black }}>{t.lead.name}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {t.members.slice(0, 6).map((m, i) => (
            <div key={i} title={m.name} style={{ marginLeft: i === 0 ? 0 : -9, border: "2px solid " + NW.white, borderRadius: "50%" }}><Avatar initials={m.initials} bg={m.avatarBg} size={28} /></div>
          ))}
          {t.members.length > 6 && <div style={{ marginLeft: -9, width: 28, height: 28, borderRadius: "50%", background: NW.gray100, border: "2px solid " + NW.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 600, color: NW.gray600 }}>+{t.members.length - 6}</div>}
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: t.accent }}>View team <Icon name="arrow-right" size={14} color={t.accent} style={{ transform: hover ? "translateX(3px)" : "none", transition: "transform 200ms" }} /></span>
      </div>
    </div>
  );
}

function SppTeamMeta({ icon, label, children }: { icon: string; label: string; children?: React.ReactNode }) {
  return (
    <div style={{ background: NW.white, border: "1px solid " + NW.gray100, borderRadius: 16, padding: "16px 18px" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
        <Icon name={icon} size={12} color={NW.gray400} /> {label}
      </span>
      {children}
    </div>
  );
}

function SppTeamDetail({ t, dense, partnerShort, onBack, onOpenPerson }: {
  t: SppTeam;
  dense?: boolean;
  partnerShort: string;
  onBack?: () => void;
  onOpenPerson?: (p: SppPerson) => void;
}) {
  const [tz, setTz] = useState<"partner" | "colombia">("partner");
  const healthOk = t.health === "on-track";
  return (
    <div>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "transparent", border: "none", cursor: "pointer", font: "inherit", fontSize: 12, fontWeight: 600, color: NW.gray500, padding: 0 }}>
        <Icon name="arrow-left" size={14} color={NW.gray500} /> Managed teams
      </button>
      {/* Header */}
      <div style={{ background: NW.white, border: "1px solid " + NW.gray100, borderRadius: 20, padding: dense ? 22 : 26, marginBottom: dense ? 16 : 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <div style={{ width: 54, height: 54, borderRadius: 15, background: t.accent + "16", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="users-round" size={26} color={t.accent} strokeWidth={1.9} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: dense ? 22 : 26, fontWeight: 700, color: NW.black, letterSpacing: "-0.03em", margin: 0 }}>{t.name}</h2>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 999, color: healthOk ? NW.teal700 : "#A16207", background: healthOk ? NW.teal50 : "#FEF9C3" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: healthOk ? NW.teal500 : "#EAB308" }} /> {healthOk ? "On track" : "Attention"}</span>
            </div>
            <div style={{ fontSize: 13.5, color: NW.gray500, marginTop: 6 }}>{t.focus}</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "Poppins", fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1, textAlign: "right" }}>{t.members.length}</div>
          <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 3, textAlign: "right" }}>members</div>
        </div>
      </div>
      {/* Meta */}
      <div style={{ display: "grid", gridTemplateColumns: dense ? "1fr 1fr" : "repeat(4, 1fr)", gap: dense ? 14 : 18, marginBottom: dense ? 16 : 20 }}>
        <SppTeamMeta icon="headphones" label="Account manager">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar initials={t.accountManager.initials} bg={NW.black} size={32} /><div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>{t.accountManager.name}</div></div>
        </SppTeamMeta>
        <SppTeamMeta icon={t.pod ? "map-pin" : "shield-check"} label={t.pod ? "Regional pod" : "Managed by"}>
          {t.pod ? <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 9, background: t.accent + "1a", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="map-pin" size={16} color={t.accent} /></div><div><div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>{t.pod}</div><div style={{ fontSize: 11, color: NW.gray500 }}>Region</div></div></div>
            : <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar initials="NW" bg={NW.black} size={32} /><div><div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>Nearwork</div><div style={{ fontSize: 11, color: NW.gray500 }}>No regional pod</div></div></div>}
        </SppTeamMeta>
        <SppTeamMeta icon="star" label="Team lead">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar initials={t.lead.initials} bg={t.lead.avatarBg} size={32} /><div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.lead.name}</div></div>
        </SppTeamMeta>
        <SppTeamMeta icon="clock" label="Working hours">
          <div style={{ fontSize: 16, fontWeight: 700, color: NW.black }}>{tz === "partner" ? t.hoursPartner : t.hoursColombia}</div>
          <div style={{ fontSize: 11.5, color: NW.gray500, margin: "3px 0 9px" }}>{tz === "partner" ? "Your time · " + partnerShort : "Nearwork · COT"}</div>
          <div style={{ display: "flex", gap: 2, padding: 3, background: NW.gray50, border: "1px solid " + NW.gray100, borderRadius: 8 }}>
            {[{ id: "partner", label: "Your time" }, { id: "colombia", label: "Colombia" }].map((o) => { const on = tz === o.id; return <button key={o.id} onClick={() => setTz(o.id as "partner" | "colombia")} style={{ flex: 1, border: "none", padding: "5px 6px", borderRadius: 6, fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer", background: on ? NW.white : "transparent", color: on ? NW.black : NW.gray500, boxShadow: on ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}>{o.label}</button>; })}
          </div>
        </SppTeamMeta>
      </div>
      {/* Members */}
      <section style={{ background: NW.white, border: "1px solid " + NW.gray100, borderRadius: 20, padding: dense ? "20px 14px" : "24px 18px" }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px", padding: "0 6px" }}>Team members</h3>
        <div>{t.members.map((p, i) => <SppMemberRow key={i} p={p} dense={dense} last={i === t.members.length - 1} onOpen={onOpenPerson} />)}</div>
      </section>
    </div>
  );
}

function SppOpeningCard({ op, dense, onOpen }: { op: SppOpening; dense?: boolean; onOpen: (op: SppOpening) => void }) {
  const [hover, setHover] = useState(false);
  const counts = SPP_STAGES.map((s) => op.candidates.filter((c) => c.stageIdx === s.idx).length);
  const total = counts.slice(0, 5).reduce((a, b) => a + b, 0);
  const ns = counts[5];
  return (
    <div onClick={() => onOpen(op)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: NW.white, border: "1px solid " + (hover ? NW.gray200 : NW.gray100), borderRadius: 18, padding: dense ? 20 : 24, cursor: "pointer", boxShadow: hover ? "0 14px 34px rgba(0,0,0,0.07)" : "0 1px 2px rgba(0,0,0,0.03)", transition: "box-shadow 200ms, border-color 200ms, transform 200ms", transform: hover ? "translateY(-2px)" : "none", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: NW.black, letterSpacing: "-0.02em" }}>{op.title}</div>
        <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 4 }}>{op.team} · {op.location}</div>
      </div>
      <div style={{ display: "flex", gap: 3, height: 8 }}>
        {SPP_STAGES.slice(0, 5).map((s, i) => <div key={s.key} title={s.key + ": " + counts[i]} style={{ flex: Math.max(counts[i], 0.001), minWidth: counts[i] > 0 ? 6 : 0, background: counts[i] > 0 ? s.color : NW.gray100, borderRadius: 4 }} />)}
        {total === 0 && <div style={{ flex: 1, background: NW.gray100, borderRadius: 4 }} />}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid " + NW.gray100, paddingTop: 14 }}>
        <span style={{ fontSize: 13, color: NW.gray600 }}><b style={{ color: NW.black }}>{total}</b> in pipeline · {ns} not selected</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: NW.teal600 }}>View stages <Icon name="arrow-right" size={14} color={NW.teal600} style={{ transform: hover ? "translateX(3px)" : "none", transition: "transform 200ms" }} /></span>
      </div>
    </div>
  );
}

function SppKanban({ op, dense }: { op: SppOpening; dense?: boolean }) {
  return (
    <div style={{ display: "flex", gap: dense ? 12 : 14, overflowX: "auto", paddingBottom: 6 }}>
      {SPP_STAGES.map((s) => {
        const cards = op.candidates.filter((c) => c.stageIdx === s.idx);
        return (
          <div key={s.key} style={{ flex: 1, minWidth: 180, background: NW.offWhite, border: "1px solid " + NW.gray100, borderRadius: 14, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid " + NW.gray100 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: NW.black }}>{s.key}</span>
              <span style={{ marginLeft: "auto", background: NW.white, border: "1px solid " + NW.gray100, color: NW.gray600, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 500, padding: "1px 7px", borderRadius: 999 }}>{cards.length}</span>
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {cards.length === 0 ? <div style={{ border: "1px dashed " + NW.gray200, borderRadius: 10, padding: "20px 12px", textAlign: "center", fontSize: 11, color: NW.gray400 }}>None</div>
                : cards.map((c) => (
                  <div key={c.id} style={{ background: NW.white, border: "1px solid " + NW.gray100, borderRadius: 11, padding: 11, display: "flex", alignItems: "center", gap: 9 }}>
                    <Avatar initials={c.initials} bg={c.avatarBg} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: NW.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                      <div style={{ fontSize: 10.5, color: NW.gray500 }}>Match {c.score}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── SPP client detail (one sub-client: People / Teams / Pipeline) ─────────────
export function SppClientDetailScreen({ client, data, clientId, density = "regular", onNav }: {
  client: PortalClient;
  data: SppData;
  clientId?: string;
  density?: "regular" | "compact";
  onNav?: NavHandler;
}) {
  const dense = density === "compact";
  const pad = dense ? 32 : 44;
  const clients = data.clients || [];
  const c = clients.find((x) => x.id === clientId) || clients[0];
  const [tab, setTab] = useState<"team" | "managed" | "openings">("team");
  const [openId, setOpenId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  if (!c) return null;
  const st = data.status[c.status] || data.status.active;
  const people = sppPeople(c);
  const teams = sppTeams(c);
  const openings = sppOpenings(c);
  const op = openings.find((o) => o.id === openId);
  const team = teams.find((t) => t.id === teamId);
  const partnerShort = data.partnerTzShort || "Partner";

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: NW.offWhite, color: NW.black, fontFamily: "Poppins, sans-serif" }}>
      <PortalSidebar active="spp" density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <PortalTopBar dense={dense} onNav={onNav} activity={[]} />
        <div style={{ flex: 1, overflow: "auto", padding: (dense ? 28 : 40) + "px " + pad + "px " + pad + "px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <button onClick={() => onNav && onNav("spp")} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18, background: "transparent", border: "none", cursor: "pointer", font: "inherit", fontSize: 12, fontWeight: 600, color: NW.gray500, letterSpacing: "0.04em", padding: 0 }}>
              <Icon name="arrow-left" size={14} color={NW.gray500} /> Your clients
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: dense ? 20 : 26, flexWrap: "wrap" }}>
              <div style={{ width: dense ? 52 : 60, height: dense ? 52 : 60, borderRadius: 15, background: c.logoBg, color: NW.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Poppins", fontWeight: 700, fontSize: 22, letterSpacing: "-0.03em", flexShrink: 0 }}>{c.initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.black, letterSpacing: "-0.03em", margin: 0 }}>{c.name}</h1>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 999, color: st.color, background: st.bg }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} /> {st.label}</span>
                </div>
                <div style={{ fontSize: 13.5, color: NW.gray500, marginTop: 6 }}>{c.industry} · client since {c.since}</div>
                {(c.contactName || c.note) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    {c.contactName && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: NW.gray600 }}><Icon name="user" size={13} color={NW.gray400} /> {c.contactName}{c.contactEmail ? " · " + c.contactEmail : ""}</span>}
                    {c.note && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: NW.gray600, background: NW.gray50, border: "1px solid " + NW.gray100, padding: "3px 10px", borderRadius: 999 }}><Icon name="sticky-note" size={12} color={NW.gray400} /> {c.note}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 3, padding: 4, background: NW.white, border: "1px solid " + NW.gray100, borderRadius: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)", width: "fit-content", marginBottom: dense ? 20 : 26 }}>
              {[{ id: "team", label: "People", icon: "user" }, { id: "managed", label: "Teams", icon: "users-round" }, { id: "openings", label: "Pipeline", icon: "kanban-square" }].map((tb) => {
                const on = tab === tb.id;
                return <button key={tb.id} onClick={() => { setTab(tb.id as "team" | "managed" | "openings"); setOpenId(null); setTeamId(null); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "none", padding: "9px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", background: on ? NW.black : "transparent", color: on ? NW.white : NW.gray600 }}><Icon name={tb.icon} size={15} color={on ? NW.white : NW.gray500} /> {tb.label}</button>;
              })}
            </div>

            {tab === "team" ? (
              <section style={{ background: NW.white, border: "1px solid " + NW.gray100, borderRadius: 20, padding: dense ? "16px 14px" : "20px 18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.4fr 1.3fr 1fr 0.6fr", gap: 16, padding: "0 18px 12px", fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: "0.12em", textTransform: "uppercase", borderBottom: "1px solid " + NW.gray100 }}>
                  <span>Person</span><span>Role</span><span>Team</span><span>Status</span><span style={{ textAlign: "right" }}>Since</span>
                </div>
                <div style={{ marginTop: 6 }}>{people.map((p, i) => <SppPersonRow key={i} p={p} dense={dense} onOpen={(x) => onNav && onNav("hire", x.id)} />)}</div>
              </section>
            ) : tab === "managed" ? (
              team ? (
                <SppTeamDetail t={team} dense={dense} partnerShort={partnerShort} onBack={() => setTeamId(null)} onOpenPerson={(x) => onNav && onNav("hire", x.id)} />
              ) : teams.length ? (
                <div style={{ display: "grid", gridTemplateColumns: dense ? "1fr" : "repeat(2, 1fr)", gap: dense ? 16 : 20 }}>
                  {teams.map((t) => <SppTeamCard key={t.id} t={t} dense={dense} onOpen={(x) => setTeamId(x.id)} />)}
                </div>
              ) : (
                <div style={{ background: NW.white, border: "1px solid " + NW.gray100, borderRadius: 20, padding: "50px 20px", textAlign: "center" }}>
                  <Icon name="users-round" size={22} color={NW.gray300} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: NW.gray600, marginTop: 8 }}>No managed teams</div>
                  <div style={{ fontSize: 12.5, color: NW.gray400, marginTop: 3 }}>This client uses recruitment only.</div>
                </div>
              )
            ) : (
              op ? (
                <div>
                  <button onClick={() => setOpenId(null)} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "transparent", border: "none", cursor: "pointer", font: "inherit", fontSize: 12, fontWeight: 600, color: NW.gray500, padding: 0 }}>
                    <Icon name="arrow-left" size={14} color={NW.gray500} /> Pipeline
                  </button>
                  <h2 style={{ fontSize: dense ? 22 : 26, fontWeight: 700, color: NW.black, letterSpacing: "-0.03em", margin: "0 0 4px" }}>{op.title}</h2>
                  <div style={{ fontSize: 13, color: NW.gray500, marginBottom: 18 }}>{op.team} · {op.location}</div>
                  <SppKanban op={op} dense={dense} />
                </div>
              ) : (
                openings.length ? (
                  <div style={{ display: "grid", gridTemplateColumns: dense ? "1fr" : "repeat(2, 1fr)", gap: dense ? 16 : 20 }}>
                    {openings.map((o) => <SppOpeningCard key={o.id} op={o} dense={dense} onOpen={(x) => setOpenId(x.id)} />)}
                  </div>
                ) : (
                  <div style={{ background: NW.white, border: "1px solid " + NW.gray100, borderRadius: 20, padding: "50px 20px", textAlign: "center" }}>
                    <Icon name="briefcase" size={22} color={NW.gray300} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: NW.gray600, marginTop: 8 }}>No open roles right now</div>
                  </div>
                )
              )
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, padding: "0 4px", fontSize: 12, color: NW.gray400 }}>
              <Icon name="info" size={13} color={NW.gray400} /> Hires, teams, pipeline and billing are managed by Nearwork. You can edit your own client details above.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
