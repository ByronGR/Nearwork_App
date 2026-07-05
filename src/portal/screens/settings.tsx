"use client";

// ── New client-portal design — Settings screen ────────────────────────────────
// Ported from portal-v3-settings.jsx (SettingsScreen + Reset/Edit modals). The
// prototype read window.NW_CLIENT.user and a hardcoded email; here the profile
// seed + notification prefs arrive as a typed `data` object and `client` as
// PROPS so real profile data drops in later. Toggle/input state stays local
// (no backend writes). Inline styles preserved verbatim for fidelity.

import React, { useState } from "react";
import { NW, Icon, Button, Avatar } from "../primitives";
import { PortalSidebar, PortalTopBar, type PortalClient } from "../shell";

// ── Typed data prop shapes ────────────────────────────────────────────────────
export type SettingsProfile = {
  email: string; // partner user's email (not carried on PortalClient.user)
};

export type SettingsNotificationPrefs = {
  newCandidate: boolean; // when Nearwork shares a candidate for your roles
  interview: boolean; // scheduling and reminders for upcoming interviews
  pto: boolean; // when a hire requests PTO that needs your approval
  kickoff: boolean; // when a new kickoff brief is ready for your approval
  billing: boolean; // upcoming invoices and payment confirmations
  weekly: boolean; // a Monday digest of pipeline and team activity
};

export type SettingsData = {
  profile: SettingsProfile;
  notifications: SettingsNotificationPrefs;
};

type NavHandler = (id: string, arg?: string | number) => void;

// ── Modal shell (mirrors the other portal screens) ────────────────────────────
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

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onClick }: { on?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 42, height: 24, borderRadius: 999, border: "none", background: on ? NW.teal500 : NW.gray200, position: "relative", cursor: "pointer", transition: "background 160ms", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: 999, background: NW.white, boxShadow: "0 1px 2px rgba(0,0,0,0.2)", transition: "left 160ms" }} />
    </button>
  );
}

function SettingsRow({ title, desc, children, last }: { title: string; desc?: string; children?: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "16px 0", borderBottom: last ? "none" : `1px solid ${NW.gray100}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: NW.black }}>{title}</div>
        {desc && <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 3, lineHeight: 1.45 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SettingsCard({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: "24px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: NW.gray50, border: `1px solid ${NW.gray100}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} color={NW.gray600} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NW.black, letterSpacing: "-0.01em", margin: 0 }}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ResetPasswordModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <ModalShell onClose={onClose} width={440}>
      <div style={{ padding: 30, textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: sent ? NW.teal50 : NW.gray50, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon name={sent ? "mail-check" : "key-round"} size={24} color={sent ? NW.teal600 : NW.gray600} />
        </div>
        {sent ? (
          <>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: NW.black, margin: "0 0 8px" }}>Check your inbox</h2>
            <p style={{ fontSize: 13.5, color: NW.gray600, lineHeight: 1.6, margin: "0 0 20px" }}>We sent a password reset link to <span style={{ fontWeight: 600, color: NW.black }}>{email}</span>. It expires in 30 minutes.</p>
            <Button variant="secondary" size="md" onClick={onClose}>Done</Button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: NW.black, margin: "0 0 8px" }}>Reset your password</h2>
            <p style={{ fontSize: 13.5, color: NW.gray600, lineHeight: 1.6, margin: "0 0 20px" }}>We&apos;ll email a secure reset link to <span style={{ fontWeight: 600, color: NW.black }}>{email}</span>.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" icon="send" onClick={() => setSent(true)}>Send reset link</Button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

type EditProfileUser = { name: string; role: string };
type EditProfileValues = { name: string; email: string; role: string };

function EditProfileModal({ user, email, onClose, onSave }: { user: EditProfileUser; email: string; onClose: () => void; onSave: (v: EditProfileValues) => void }) {
  const [name, setName] = useState(user.name);
  const [mail, setMail] = useState(email);
  const [role, setRole] = useState(user.role);
  const valid = name.trim() && /.+@.+\..+/.test(mail);
  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `1px solid ${NW.gray200}`, borderRadius: 10, padding: "11px 13px", fontFamily: "inherit", fontSize: 13.5, color: NW.black, outline: "none", background: NW.white };
  return (
    <ModalShell onClose={onClose} width={440}>
      <div style={{ padding: "24px 28px", borderBottom: `1px solid ${NW.gray100}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: NW.black, letterSpacing: "-0.02em", margin: 0 }}>Edit profile</h2>
        <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="x" size={15} color={NW.gray600} /></button>
      </div>
      <div style={{ padding: "22px 28px" }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={field} />
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", margin: "18px 0 8px" }}>Email</label>
        <input value={mail} onChange={(e) => setMail(e.target.value)} style={field} />
        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.06em", textTransform: "uppercase", margin: "18px 0 8px" }}>Title</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} style={field} />
      </div>
      <div style={{ padding: "16px 28px", borderTop: `1px solid ${NW.gray100}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" icon="check" disabled={!valid} onClick={() => onSave({ name: name.trim(), email: mail.trim(), role: role.trim() })}>Save changes</Button>
      </div>
    </ModalShell>
  );
}

// ── Settings screen ───────────────────────────────────────────────────────────
export function SettingsScreen({ client, data, density = "regular", onNav }: {
  client: PortalClient;
  data: SettingsData;
  density?: "regular" | "compact";
  onNav?: NavHandler;
}) {
  const dense = density === "compact";
  const pad = dense ? 32 : 44;
  const [profile, setProfile] = useState(() => ({ name: client.user.name, initials: client.user.initials, role: client.user.role || "", email: data.profile.email }));
  const [resetOpen, setResetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notif, setNotif] = useState<SettingsNotificationPrefs>(data.notifications);
  const flip = (k: keyof SettingsNotificationPrefs) => setNotif((n) => ({ ...n, [k]: !n[k] }));
  const saveProfile = (p: EditProfileValues) => {
    const initials = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    setProfile({ ...p, initials });
    setEditOpen(false); setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  };

  const notifRows: { k: keyof SettingsNotificationPrefs; t: string; d: string }[] = [
    { k: "newCandidate", t: "New candidates", d: "When Nearwork shares a candidate for your roles" },
    { k: "interview",    t: "Interview updates", d: "Scheduling and reminders for upcoming interviews" },
    { k: "pto",          t: "Time-off requests", d: "When a hire requests PTO that needs your approval" },
    { k: "kickoff",      t: "Kickoff briefs", d: "When a new kickoff brief is ready for your approval" },
    { k: "billing",      t: "Billing reminders", d: "Upcoming invoices and payment confirmations" },
    { k: "weekly",       t: "Weekly summary", d: "A Monday digest of pipeline and team activity" },
  ];

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: NW.offWhite, color: NW.black, fontFamily: "Poppins, sans-serif" }}>
      <PortalSidebar active="settings" density={density} onNav={onNav} client={client} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <PortalTopBar dense={dense} onNav={onNav} activity={[]} />
        <div style={{ flex: 1, overflow: "auto", padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ marginBottom: dense ? 22 : 30 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Settings</div>
              <h1 style={{ fontSize: dense ? 34 : 44, fontWeight: 700, color: NW.black, letterSpacing: "-0.04em", lineHeight: 1.02, margin: 0 }}>Settings</h1>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: dense ? 16 : 22 }}>

              {/* Profile */}
              <SettingsCard icon="user" title="Profile">
                <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 10 }}>
                  <Avatar initials={profile.initials} bg={NW.teal500} size={52} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: NW.black }}>{profile.name}</div>
                    <div style={{ fontSize: 13, color: NW.gray500 }}>{profile.email} · {profile.role}</div>
                  </div>
                  {saved && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: NW.teal700, background: NW.teal50, padding: "5px 11px", borderRadius: 999 }}><Icon name="check" size={13} color={NW.teal600} strokeWidth={2.5} /> Saved</span>}
                  <Button variant="secondary" size="sm" icon="pencil" onClick={() => setEditOpen(true)}>Edit</Button>
                </div>
              </SettingsCard>

              {/* Notifications */}
              <SettingsCard icon="bell" title="Notifications">
                <p style={{ fontSize: 12.5, color: NW.gray500, margin: "2px 0 6px" }}>Choose what we email you about.</p>
                <div>
                  {notifRows.map((r, i) => (
                    <SettingsRow key={r.k} title={r.t} desc={r.d} last={i === notifRows.length - 1}>
                      <Toggle on={notif[r.k]} onClick={() => flip(r.k)} />
                    </SettingsRow>
                  ))}
                </div>
              </SettingsCard>

              {/* Security */}
              <SettingsCard icon="shield" title="Security">
                <SettingsRow title="Password" desc="Reset your password via a secure email link." last>
                  <Button variant="secondary" size="sm" icon="key-round" onClick={() => setResetOpen(true)}>Reset password</Button>
                </SettingsRow>
              </SettingsCard>

              {/* Demo controls */}
              <SettingsCard icon="rotate-ccw" title="Demo controls">
                <SettingsRow title="Reset demo data" desc="Restore the demo to how it started — undoes any stage moves, notes, or layout tweaks made during this session." last>
                  <Button variant="secondary" size="sm" icon="rotate-ccw" onClick={() => {
                    if (window.confirm("Reset the demo to its original state? This clears any changes made during this session.")) {
                      try { localStorage.clear(); } catch { /* ignore */ }
                      window.location.reload();
                    }
                  }}>Reset demo</Button>
                </SettingsRow>
              </SettingsCard>

              {/* Sign out — clears the demo login for this session */}
              <button onClick={() => { try { sessionStorage.removeItem("nw_demo_auth"); } catch { /* ignore */ } window.location.reload(); }} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${NW.gray200}`, background: NW.white, borderRadius: 12, padding: "11px 18px", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, color: NW.rose600, cursor: "pointer" }}>
                <Icon name="log-out" size={15} color={NW.rose600} /> Sign out
              </button>
            </div>
          </div>
        </div>
        {resetOpen && <ResetPasswordModal email={profile.email} onClose={() => setResetOpen(false)} />}
        {editOpen && <EditProfileModal user={profile} email={profile.email} onClose={() => setEditOpen(false)} onSave={saveProfile} />}
      </main>
    </div>
  );
}
