"use client";

// ── New client-portal design — shell (sidebar + top bar + shared chrome) ──────
// Ported from portal-shared.jsx. The prototype read globals (window.NW_CLIENT,
// window.NW_ACTIVITY); here every screen passes its data in as PROPS, so we can
// wire real Firebase data in later without touching the look. Inline styles kept
// verbatim for fidelity.

import React, { useState, useEffect } from "react";
import { NW, Icon, Avatar, Button } from "./primitives";
import { auth, subscribeNotifications, markNotificationRead, type PortalNotification } from "@/lib/firebase-client";

// Category → icon + colour for a notification marker.
const NOTIF_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  Pipeline: { icon: "git-branch", color: NW.teal600, bg: NW.teal50 },
  Kickoff: { icon: "clipboard-check", color: NW.violet500, bg: NW.violet50 },
  Note: { icon: "message-square-text", color: NW.violet500, bg: NW.violet50 },
  Team: { icon: "users", color: NW.teal600, bg: NW.teal50 },
  Access: { icon: "user-plus", color: NW.teal600, bg: NW.teal50 },
  Billing: { icon: "wallet", color: "#A16207", bg: NW.yellow50 },
};
function notifIcon(n: PortalNotification) {
  return NOTIF_ICON[n.category || ""] || { icon: "bell", color: NW.gray600, bg: NW.gray50 };
}
export function notifRelTime(v: unknown): string {
  const secs = v && typeof v === "object" && "seconds" in (v as Record<string, unknown>) ? Number((v as { seconds?: number }).seconds) : 0;
  if (!secs) return "";
  const diff = Date.now() - secs * 1000;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(secs * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
// Where a notification takes you when clicked.
export function notifTarget(n: PortalNotification, onNav?: NavHandler) {
  if (!onNav) return;
  if (n.candidateCode) onNav("candidate", n.candidateCode);
  else if (n.pipelineCode) onNav("kanban", n.pipelineCode);
  else onNav("notifications");
}
const notifSecs = (v: unknown) => (v && typeof v === "object" && "seconds" in (v as Record<string, unknown>) ? Number((v as { seconds?: number }).seconds) : 0);

// Live notifications for the signed-in user (self-contained so the top bar and
// the notifications page both work without threading props through every screen).
export function usePortalNotifications(): PortalNotification[] {
  const [items, setItems] = useState<PortalNotification[]>([]);
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    return subscribeNotifications(user, (list) => {
      setItems([...list].sort((a, b) => notifSecs(b.createdAt) - notifSecs(a.createdAt)));
    });
  }, []);
  return items;
}

export type PortalUser = { name: string; initials: string; role?: string };
export type AccountManager = { name: string; email: string; initials: string };
export type PortalAccess = "admin" | "member" | "viewer";
export type PortalClient = { company: string; user: PortalUser; accountManager?: AccountManager; access?: PortalAccess };

// Which nav items each access level may see.
//  • viewer  — read-only: Overview, Pipeline, Team
//  • member  — the above + their own Settings
//  • admin   — everything (billing, user management, SPP)
const VIEWER_NAV = ["overview", "pipeline", "team"];
const MEMBER_NAV = ["overview", "pipeline", "team", "settings"];
export function allowedNav(access: PortalAccess | undefined, id: string): boolean {
  if (id === "notifications") return true; // everyone sees their own inbox
  if (access === "viewer") return VIEWER_NAV.includes(id);
  if (access === "member") return MEMBER_NAV.includes(id);
  return true; // admin (and staff)
}
export type PortalActivity = {
  id: string | number;
  type?: string;
  initials?: string;
  avatarBg?: string;
  who?: string;
  what?: string;
  when?: string;
};

type Density = "regular" | "compact";
export type NavHandler = (id: string, arg?: string | number) => void;

const NAV_SECTIONS: { label: string; items: { id: string; label: string; icon: string }[] }[] = [
  { label: "Hiring", items: [
    { id: "overview", label: "Overview", icon: "layout-dashboard" },
    { id: "pipeline", label: "Pipeline", icon: "kanban-square" },
  ]},
  { label: "Team", items: [
    { id: "team", label: "Team", icon: "handshake" },
    { id: "spp", label: "SPP", icon: "git-merge" },
  ]},
  { label: "Workspace", items: [
    { id: "billing", label: "Billing", icon: "wallet" },
  ]},
  { label: "Settings", items: [
    { id: "users", label: "Users", icon: "users" },
    { id: "settings", label: "Settings", icon: "settings" },
  ]},
];

// Neutral fallback when an org has no account manager assigned yet — never a
// specific real person (that would be misleading). The real AM comes from the
// org's assignment in Admin.
const DEFAULT_AM: AccountManager = { name: "Your Nearwork team", email: "", initials: "NW" };

function NavItem({ it, active, tight, onClick, clickable, collapsed }: {
  it: { id: string; label: string; icon: string };
  active: boolean;
  tight: boolean;
  onClick: () => void;
  clickable: boolean;
  collapsed?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={collapsed ? it.label : undefined}
      style={{
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10,
        padding: collapsed ? "9px 0" : tight ? "7px 10px" : "9px 10px",
        borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? NW.black : NW.gray600,
        background: active ? NW.gray50 : hover ? NW.offWhite : "transparent",
        cursor: clickable ? "pointer" : "default", position: "relative",
        transition: "background 120ms, color 120ms",
      }}
    >
      {active && !collapsed && <span style={{ position: "absolute", left: -18, top: 8, bottom: 8, width: 3, background: NW.teal500, borderRadius: 2 }} />}
      <Icon name={it.icon} size={16} color={active ? NW.teal600 : hover ? NW.gray700 : NW.gray500} strokeWidth={1.75} />
      {!collapsed && <span>{it.label}</span>}
    </div>
  );
}

const NAV_COLLAPSE_KEY = "nw_portal_nav_collapsed";

export function PortalSidebar({ active = "overview", density = "regular", onNav, client }: {
  active?: string;
  density?: Density;
  onNav?: NavHandler;
  client: PortalClient;
}) {
  const tight = density === "compact";
  const go = (id: string) => onNav && onNav(id);
  const am = client.accountManager ?? DEFAULT_AM;

  // Collapse is a per-user preference (persisted). When collapsed, the sidebar
  // shrinks to an icon rail so the main content (e.g. the pipeline) gets more
  // room; hovering the rail temporarily expands it as an overlay so it can be
  // read/clicked without giving up the space.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(NAV_COLLAPSE_KEY) === "1"; } catch { return false; }
  });
  const [hover, setHover] = useState(false);
  const expanded = !collapsed || hover;

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(NAV_COLLAPSE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
    setHover(false);
  }

  const RAIL = 68;
  const FULL = 240;

  return (
    <div style={{ width: collapsed ? RAIL : FULL, minWidth: collapsed ? RAIL : FULL, height: "100%", position: "relative", flexShrink: 0, transition: "width 160ms ease" }}>
      <aside
        onMouseEnter={() => { if (collapsed) setHover(true); }}
        onMouseLeave={() => setHover(false)}
        style={{
          position: collapsed ? "absolute" : "relative",
          top: 0, left: 0, bottom: 0,
          width: expanded ? FULL : RAIL,
          zIndex: collapsed ? 40 : undefined,
          background: NW.white, borderRight: `1px solid ${NW.gray100}`,
          display: "flex", flexDirection: "column", height: "100%",
          padding: expanded ? (tight ? "20px 14px" : "24px 18px") : "24px 12px",
          boxShadow: collapsed && hover ? "10px 0 30px rgba(0,0,0,0.10)" : "none",
          transition: "width 160ms ease, box-shadow 160ms ease, padding 160ms ease",
          overflow: "hidden",
        }}
      >
        {/* Logo / workspace + collapse toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: expanded ? "4px 8px 20px" : "4px 0 20px", justifyContent: expanded ? "flex-start" : "center" }}>
          <div onClick={() => go("overview")} style={{ width: 36, height: 36, borderRadius: 10, background: NW.black, color: NW.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, letterSpacing: "-0.04em", position: "relative", flexShrink: 0, cursor: onNav ? "pointer" : "default" }}>
            N
            <div style={{ position: "absolute", bottom: 6, left: 7, right: 14, height: 2, background: NW.teal500, borderRadius: 1 }} />
          </div>
          {expanded && (
            <div onClick={() => go("overview")} style={{ minWidth: 0, flex: 1, cursor: onNav ? "pointer" : "default" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: NW.black, letterSpacing: "-0.01em", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.company}</div>
              <div style={{ fontSize: 11, color: NW.gray500, lineHeight: 1.2, marginTop: 1 }}>Client portal</div>
            </div>
          )}
          {expanded && (
            <button onClick={toggle} title={collapsed ? "Keep menu open" : "Collapse menu"} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0, borderRadius: 6 }}>
              <Icon name={collapsed ? "chevrons-right" : "chevrons-left"} size={16} color={NW.gray400} />
            </button>
          )}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: tight ? 10 : 14, marginTop: 4 }}>
          {NAV_SECTIONS.map((sec) => {
            const items = sec.items.filter((it) => allowedNav(client.access, it.id));
            if (!items.length) return null;
            return (
              <div key={sec.label}>
                {expanded && <div style={{ fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 10px", marginBottom: 6 }}>{sec.label}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: expanded ? 1 : 4 }}>
                  {items.map((it) => (
                    <NavItem key={it.id} it={it} active={it.id === active} tight={tight} onClick={() => go(it.id)} clickable={!!onNav} collapsed={!expanded} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Account manager (hidden in the icon rail) */}
        {expanded && (
          <div style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 12, padding: "11px 12px", marginTop: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray400, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7 }}>Account manager</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Avatar initials={am.initials} size={28} bg={NW.black} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: NW.black, lineHeight: 1.2 }}>{am.name}</div>
                {am.email && <div style={{ fontSize: 10, color: NW.gray500, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{am.email}</div>}
              </div>
            </div>
          </div>
        )}

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: expanded ? "flex-start" : "center", gap: 10, padding: expanded ? "12px 10px" : "12px 0", marginTop: 8, borderTop: `1px solid ${NW.gray100}` }}>
          <Avatar initials={client.user.initials} size={32} bg={NW.teal500} />
          {expanded && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: NW.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{client.user.name}</div>
                <div style={{ fontSize: 10, color: NW.gray500 }}>{client.user.role}</div>
              </div>
              <button onClick={() => go("logout")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex" }} title="Sign out">
                <Icon name="log-out" size={14} color={NW.gray400} />
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export function PortalTopBar({ dense = false, onNav }: {
  dense?: boolean;
  onNav?: NavHandler;
  activity?: PortalActivity[];
}) {
  const [bellOpen, setBellOpen] = useState(false);
  const [query, setQuery] = useState("");
  const all = usePortalNotifications();
  const notifs = all.slice(0, 6);
  const unread = all.filter((n) => !n.read).length;
  const openNotif = (n: PortalNotification) => {
    if (!n.read) markNotificationRead(n.id).catch(() => {});
    setBellOpen(false);
    notifTarget(n, onNav);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: dense ? "18px 32px" : "24px 40px", borderBottom: `1px solid ${NW.gray100}`, background: NW.white, gap: 24, position: "relative", zIndex: 30 }}>
      <div style={{ flex: 1, position: "relative", maxWidth: 460 }}>
        <Icon name="search" size={15} color={NW.gray400} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search candidates, roles, notes…"
          style={{ width: "100%", fontFamily: "Poppins, sans-serif", fontSize: 13, color: NW.black, background: NW.gray50, border: "1px solid transparent", borderRadius: 999, padding: "9px 14px 9px 36px", outline: "none" }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
            <Icon name="x" size={14} color={NW.gray400} />
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
        <button onClick={() => setBellOpen((o) => !o)} style={{ background: bellOpen ? NW.gray50 : "transparent", border: `1px solid ${NW.gray100}`, cursor: "pointer", width: 36, height: 36, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <Icon name="bell" size={15} color={NW.gray600} />
          {unread > 0 && <span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, background: NW.rose500, borderRadius: "50%", border: `1.5px solid ${NW.white}` }} />}
        </button>
        {bellOpen && (
          <>
            <div onClick={() => setBellOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
            <div style={{ position: "absolute", top: 46, right: 0, width: 340, zIndex: 50, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 16, boxShadow: "0 18px 50px rgba(0,0,0,0.16)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${NW.gray100}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: NW.black }}>Notifications</span>
                {unread > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: NW.rose600, background: NW.rose50, padding: "3px 9px", borderRadius: 999 }}>{unread} new</span>}
              </div>
              <div style={{ maxHeight: 340, overflow: "auto" }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: "22px 16px", textAlign: "center", fontSize: 12.5, color: NW.gray400 }}>Nothing new right now.</div>
                ) : notifs.map((n, i) => {
                  const ic = notifIcon(n);
                  return (
                    <div key={n.id} onClick={() => openNotif(n)} style={{ display: "flex", gap: 11, padding: "12px 16px", borderBottom: i === notifs.length - 1 ? "none" : `1px solid ${NW.gray100}`, cursor: "pointer", background: n.read ? NW.white : NW.teal50 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 9, background: ic.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={ic.icon} size={15} color={ic.color} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: NW.black, lineHeight: 1.35 }}>{n.title || "Update"}</div>
                        {(n.message || n.body) && <div style={{ fontSize: 12, color: NW.gray600, marginTop: 1, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message || n.body}</div>}
                        <div style={{ fontSize: 10.5, color: NW.gray400, marginTop: 2 }}>{notifRelTime(n.createdAt)}</div>
                      </div>
                      {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: NW.rose500, flexShrink: 0, marginTop: 5 }} />}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { setBellOpen(false); onNav && onNav("notifications"); }} style={{ width: "100%", border: "none", borderTop: `1px solid ${NW.gray100}`, background: NW.white, padding: "11px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: NW.teal600, cursor: "pointer" }}>
                View all notifications
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Activity feed row ─────────────────────────────────────────────────────────
export function ActivityRow({ a, dense, last }: { a: PortalActivity; dense?: boolean; last?: boolean }) {
  const iconMap: Record<string, string> = { advance: "arrow-right-circle", new: "user-plus", hired: "party-popper", note: "message-square-text", interview: "calendar-clock", view: "eye" };
  const colorMap: Record<string, string> = { advance: NW.teal500, new: NW.gray700, hired: NW.green600, note: NW.violet500, interview: NW.blue500, view: NW.gray500 };
  const type = a.type || "view";
  return (
    <div style={{ display: "flex", gap: 12, padding: dense ? "10px 0" : "12px 0", borderBottom: last ? "none" : `1px solid ${NW.gray100}` }}>
      <div style={{ width: 28, height: 28, borderRadius: 999, background: `${colorMap[type]}18`, color: colorMap[type], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={iconMap[type]} size={13} color={colorMap[type]} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.4 }}><span style={{ color: NW.black, fontWeight: 600 }}>{a.who}</span> {a.what}</div>
        <div style={{ fontSize: 11, color: NW.gray400, marginTop: 2 }}>{a.when}</div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function relTime(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}
export function urgencyDot(days: number) {
  if (days >= 2) return NW.rose500;
  if (days === 1) return NW.yellow500;
  return NW.teal500;
}

export function ScoreChip({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const color = value >= 90 ? NW.teal600 : value >= 80 ? NW.teal500 : value >= 70 ? NW.yellow500 : NW.gray500;
  const bg = value >= 80 ? NW.teal50 : value >= 70 ? NW.yellow50 : NW.gray50;
  const sizes = { sm: { fz: 11, py: 2, px: 7 }, md: { fz: 12, py: 3, px: 9 }, lg: { fz: 14, py: 5, px: 11 } };
  const s = sizes[size];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace", background: bg, color, border: `1px solid ${color}22`, fontSize: s.fz, fontWeight: 500, padding: `${s.py}px ${s.px}px`, borderRadius: 6, letterSpacing: "-0.02em" }}>
      {value}<span style={{ opacity: 0.5, marginLeft: 1 }}>/100</span>
    </span>
  );
}

export function SectionHead({ overline, title, action, dense }: { overline?: string; title: React.ReactNode; action?: React.ReactNode; dense?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: dense ? 16 : 24, gap: 16 }}>
      <div>
        {overline && <div style={{ fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>{overline}</div>}
        <h2 style={{ fontSize: dense ? 22 : 26, fontWeight: 700, color: NW.black, letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0, fontFamily: "Poppins, sans-serif" }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyBlock({ icon, title, desc, action }: { icon: string; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 32px", gap: 12, border: `1px dashed ${NW.gray200}`, borderRadius: 16, background: NW.offWhite }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: NW.white, border: `1px solid ${NW.gray100}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={20} color={NW.gray400} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: NW.gray700, letterSpacing: "-0.01em" }}>{title}</div>
        <div style={{ fontSize: 13, color: NW.gray500, marginTop: 4, maxWidth: 320 }}>{desc}</div>
      </div>
      {action}
    </div>
  );
}

// ── Generic "coming soon" screen (used for rooms not built yet) ────────────────
export function PortalComingSoon({ active, title, desc, icon, density = "regular", onNav, client }: {
  active: string;
  title: string;
  desc: string;
  icon: string;
  density?: Density;
  onNav?: NavHandler;
  client: PortalClient;
}) {
  const dense = density === "compact";
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: NW.offWhite, color: NW.black, fontFamily: "Poppins, sans-serif" }}>
      <PortalSidebar active={active} density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ maxWidth: 420, width: "100%" }}>
            <EmptyBlock icon={icon} title={title} desc={desc} action={<Button variant="secondary" size="sm" icon="arrow-left" onClick={() => onNav && onNav("overview")}>Back to overview</Button>} />
          </div>
        </div>
      </main>
    </div>
  );
}
