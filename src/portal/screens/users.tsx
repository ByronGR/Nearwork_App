"use client";

// ── New client-portal design — Users screen (access & permissions) ────────────
// Ported from portal-v3-users.jsx (UsersScreen). The prototype read window globals
// NW_USERS / NW_USER_ROLES (and a local NW_USTATUS status map); here the screen
// takes a typed `data` object + `client` as PROPS so real org members drop in
// later. Invites, role changes and resend are kept as local state (no backend).
// Inline styles preserved verbatim for fidelity; window.lucide → Icon.

import React, { useState } from "react";
import { NW, Icon, Avatar, Button } from "../primitives";
import { PortalSidebar, PortalTopBar, EmptyBlock, type PortalClient } from "../shell";

// ── Typed data prop shapes ────────────────────────────────────────────────────
export type PortalUserStatus = "active" | "invited";

export type PortalUserRow = {
  id: string | number;
  name: string;
  email: string;
  initials: string;
  avatarBg: string;
  role: string; // matches a PortalUserRole.id
  status: PortalUserStatus | string;
  lastActive: string;
  you?: boolean;
};

export type PortalUserRole = {
  id: string;
  label: string;
  desc: string;
  can: string[];
  color: string;
};

export type UsersData = {
  users: PortalUserRow[];
  roles?: PortalUserRole[];
};

type NavHandler = (id: string, arg?: string | number) => void;

// ── Status styling map (was NW_USTATUS) ───────────────────────────────────────
const USTATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: NW.teal700, bg: NW.teal50, dot: NW.teal500 },
  invited: { label: "Invited", color: "#A16207", bg: NW.yellow50, dot: NW.yellow500 },
};

// ── Modal shell (matches hire.tsx) ────────────────────────────────────────────
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

// ── Role pill (inline dropdown) ───────────────────────────────────────────────
function RolePill({ roleId, roles, onChange, editable }: {
  roleId: string;
  roles: PortalUserRole[];
  onChange: (id: string) => void;
  editable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const r = roles.find((x) => x.id === roleId) || roles[0];
  if (!r) return null;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => editable && setOpen((o) => !o)} style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 999,
        border: `1px solid ${r.color}33`, background: `${r.color}12`, color: r.color,
        fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: editable ? "pointer" : "default",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.color }} /> {r.label}
        {editable && <Icon name="chevron-down" size={13} color={r.color} />}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", top: 36, left: 0, width: 230, zIndex: 50, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.16)", padding: 6, animation: "nwPop 160ms ease" }}>
            {roles.map((opt) => (
              <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: opt.id === roleId ? NW.gray50 : "transparent", borderRadius: 8, padding: "9px 11px", cursor: "pointer", fontFamily: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: NW.black }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: opt.color }} /> {opt.label}
                </div>
                <div style={{ fontSize: 11, color: NW.gray500, marginTop: 2 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Invite modal ──────────────────────────────────────────────────────────────
function InviteModal({ roles, onClose, onInvite }: {
  roles: PortalUserRole[];
  onClose: () => void;
  onInvite: (email: string, role: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const valid = /.+@.+\..+/.test(email);
  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `1px solid ${NW.gray200}`, borderRadius: 10, padding: "11px 13px", fontFamily: "inherit", fontSize: 13.5, color: NW.black, outline: "none", background: NW.white };
  return (
    <ModalShell onClose={onClose} width={460}>
      <div style={{ padding: "24px 28px", borderBottom: `1px solid ${NW.gray100}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: NW.black, letterSpacing: "-0.02em", margin: 0 }}>Invite people</h2>
        <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="x" size={15} color={NW.gray600} /></button>
      </div>
      <div style={{ padding: "22px 28px" }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Email address</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@lumenhealth.com" style={field} />
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", margin: "18px 0 10px" }}>Role</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {roles.map((r) => {
            const on = role === r.id;
            return (
              <button key={r.id} onClick={() => setRole(r.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: 12, border: `1px solid ${on ? r.color : NW.gray200}`, background: on ? `${r.color}0c` : NW.white, cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 16, height: 16, borderRadius: 999, border: `2px solid ${on ? r.color : NW.gray300}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ width: 8, height: 8, borderRadius: 999, background: r.color }} />}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>{r.label}</div>
                  <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{r.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: "16px 28px", borderTop: `1px solid ${NW.gray100}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" icon="send" disabled={!valid} onClick={() => onInvite(email.trim(), role)}>Send invite</Button>
      </div>
    </ModalShell>
  );
}

// ── Users screen ──────────────────────────────────────────────────────────────
export function UsersScreen({ client, data, density = "regular", onNav }: {
  client: PortalClient;
  data: UsersData;
  density?: "regular" | "compact";
  onNav?: NavHandler;
}) {
  const dense = density === "compact";
  const pad = dense ? 32 : 44;
  const roles = data.roles || [];
  const [members, setMembers] = useState<PortalUserRow[]>(() => (data.users || []).map((u) => ({ ...u })));
  const [inviting, setInviting] = useState(false);
  const [resent, setResent] = useState<Record<string, boolean>>({});

  const populated = members.length > 0;

  const setRole = (id: string | number, role: string) => setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, role } : m)));
  const resend = (id: string | number) => {
    setResent((r) => ({ ...r, [id]: true }));
    setTimeout(() => setResent((r) => ({ ...r, [id]: false })), 2600);
  };
  const invite = (email: string, role: string) => {
    const name = email.split("@")[0].split(".").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    setMembers((ms) => [...ms, { id: "u" + Date.now(), name, email, initials, avatarBg: "#12866E", role, status: "invited", lastActive: "Invite sent · just now" }]);
    setInviting(false);
  };

  const total = members.length;
  const admins = members.filter((m) => m.role === "admin").length;
  const pending = members.filter((m) => m.status === "invited").length;
  const summary = [
    { label: "People with access", value: total, accent: NW.teal500 },
    { label: "Admins", value: admins, accent: NW.violet500 },
    { label: "Pending invites", value: pending, accent: NW.yellow500 },
  ];

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: NW.offWhite, color: NW.black, fontFamily: "Poppins, sans-serif" }}>
      <PortalSidebar active="users" density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <PortalTopBar dense={dense} onNav={onNav} activity={[]} />
        <div style={{ flex: 1, overflow: "auto", padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: dense ? 22 : 30, gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Users</div>
                <h1 style={{ fontSize: dense ? 34 : 44, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1.02, margin: 0 }}>Access &amp; permissions</h1>
                <p style={{ fontSize: 14, color: NW.gray500, marginTop: 10, maxWidth: 520, lineHeight: 1.5 }}>Who from your team can see this workspace and what they can do.</p>
              </div>
              <Button variant="dark" size="sm" icon="user-plus" onClick={() => setInviting(true)}>Invite people</Button>
            </div>

            {populated ? (
              <>
                {/* Summary */}
                <div style={{ display: "flex", gap: dense ? 14 : 18, marginBottom: dense ? 18 : 24 }}>
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

                {/* Roles legend */}
                <div style={{ display: "grid", gridTemplateColumns: dense ? "1fr" : "repeat(3, 1fr)", gap: dense ? 14 : 18, marginBottom: dense ? 18 : 24 }}>
                  {roles.map((r) => (
                    <div key={r.id} style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 16, padding: dense ? 18 : 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: r.color }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: NW.black }}>{r.label}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {r.can.map((c, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <Icon name="check" size={14} color={r.color} strokeWidth={2.5} style={{ marginTop: 1, flexShrink: 0 }} />
                            <span style={{ fontSize: 12.5, color: NW.gray700, lineHeight: 1.4 }}>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Members table */}
                <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? "16px 14px" : "20px 18px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1.2fr 1fr 0.8fr", gap: 16, padding: "0 14px 12px", fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: "0.12em", textTransform: "uppercase", borderBottom: `1px solid ${NW.gray100}` }}>
                    <span>Person</span><span>Role</span><span>Status</span><span style={{ textAlign: "right" }}>Last active</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {members.map((m, i) => {
                      const ust = USTATUS[m.status] || USTATUS.active;
                      return (
                        <div key={m.id} style={{ display: "grid", gridTemplateColumns: "2.4fr 1.2fr 1fr 0.8fr", alignItems: "center", gap: 16, padding: dense ? "12px 14px" : "14px 14px", borderTop: i === 0 ? "none" : `1px solid ${NW.gray100}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
                            <Avatar initials={m.initials} bg={m.avatarBg} size={dense ? 36 : 40} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: NW.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
                                {m.you && <span style={{ fontSize: 10, fontWeight: 700, color: NW.teal700, background: NW.teal50, padding: "2px 7px", borderRadius: 999 }}>You</span>}
                              </div>
                              <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</div>
                            </div>
                          </div>
                          <div><RolePill roleId={m.role} roles={roles} editable={!m.you} onChange={(r) => setRole(m.id, r)} /></div>
                          <div>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: ust.color, background: ust.bg, padding: "4px 10px", borderRadius: 999 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ust.dot }} /> {ust.label}
                            </span>
                          </div>
                          <div style={{ textAlign: "right", fontSize: 12, color: NW.gray500 }}>
                            {m.status === "invited" ? (resent[m.id]
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: NW.teal700 }}><Icon name="check" size={13} color={NW.teal600} strokeWidth={2.5} /> Sent</span>
                              : <button onClick={() => resend(m.id)} style={{ border: "none", background: "transparent", color: NW.teal600, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Resend</button>
                            ) : m.lastActive}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : (
              <EmptyBlock icon="users" title="No one has access yet"
                desc="Invite people from your team to see this workspace — you control what each of them can do." />
            )}
          </div>
        </div>
        {inviting && <InviteModal roles={roles} onClose={() => setInviting(false)} onInvite={invite} />}
      </main>
    </div>
  );
}
