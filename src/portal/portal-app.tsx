"use client";

// ── New client portal — top-level app (Sprint 2) ──────────────────────────────
// One entry point that replaces the static iframe: real login → the new design
// shell with real Firebase data. Screens that are built render live; screens not
// yet built show a polished "Coming soon" in the same shell, so the whole portal
// already looks and navigates like the finished product while we fill it in.

import React, { useEffect, useState } from "react";
import { NW } from "./primitives";
import { PortalComingSoon } from "./shell";
import { OverviewScreen } from "./screens/overview";
import { usePortalData } from "./use-portal-data";
import { toPortalClient, toOverviewData } from "./map-overview";
import {
  loginWithEmail,
  logoutClient,
  listAllOrganizations,
  setStaffActiveOrg,
  isNearworkEmail,
  type Organization,
} from "@/lib/firebase-client";

// Screens not yet rebuilt — shown as "Coming soon" inside the real shell.
const COMING_SOON: Record<string, { title: string; desc: string; icon: string }> = {
  pipeline: { title: "Pipeline", desc: "Your full candidate pipeline — every role, every stage — is the next screen we're building.", icon: "kanban-square" },
  team: { title: "Team", desc: "Your hired team and managed staff will live here.", icon: "handshake" },
  spp: { title: "SPP", desc: "Your Strategic Partner Program view is on the way.", icon: "git-merge" },
  billing: { title: "Billing", desc: "Invoices and billing details will appear here.", icon: "wallet" },
  users: { title: "Users", desc: "Manage who from your company can access the portal.", icon: "users" },
  settings: { title: "Settings", desc: "Your workspace preferences will live here.", icon: "settings" },
};

// ── Small full-screen shells for the gated states ─────────────────────────────
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: NW.offWhite, fontFamily: "Poppins, sans-serif", padding: 24 }}>
      {children}
    </div>
  );
}

function SignOutButton() {
  return (
    <button
      onClick={async () => { await logoutClient().catch(() => null); if (typeof window !== "undefined") window.location.reload(); }}
      style={{ position: "fixed", top: 16, right: 18, zIndex: 50, border: `1px solid ${NW.gray200}`, background: NW.white, color: NW.gray600, fontSize: 12, fontWeight: 600, fontFamily: "inherit", padding: "6px 12px", borderRadius: 999, cursor: "pointer" }}
    >
      Sign out
    </button>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginWithEmail(email.trim(), password);
      // onAuthStateChanged in usePortalData takes over from here.
    } catch (err) {
      const code = (err as { code?: string })?.code || "";
      setError(code.includes("wrong-password") || code.includes("invalid-credential") || code.includes("user-not-found")
        ? "That email or password doesn't match. Please try again."
        : "Couldn't sign you in. Please try again.");
      setBusy(false);
    }
  }

  const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, border: `1px solid ${NW.gray200}`, fontSize: 14, fontFamily: "inherit", outline: "none", marginTop: 6 };

  return (
    <Centered>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 380, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: 36, fontFamily: "Poppins, sans-serif" }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: NW.black, marginBottom: 4 }}>Welcome back</div>
        <div style={{ fontSize: 13.5, color: NW.gray500, marginBottom: 26 }}>Sign in to your Nearwork portal.</div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: NW.gray600 }}>
          Work email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required style={field} />
        </label>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: NW.gray600, marginTop: 16 }}>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required style={field} />
        </label>
        {error && <div style={{ fontSize: 12.5, color: NW.rose600, marginTop: 14 }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 24, padding: "12px", borderRadius: 10, border: "none", background: NW.black, color: NW.white, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Centered>
  );
}

// Staff (@nearwork.co) have no fixed company, so they pick which workspace to view.
function OrgPicker() {
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    listAllOrganizations().then(setOrgs).catch(() => setOrgs([]));
  }, []);

  async function pick(org: Organization) {
    setBusyId(org.id);
    try {
      const { auth } = await import("@/lib/firebase-client");
      const uid = auth.currentUser?.uid;
      if (uid) await setStaffActiveOrg(uid, org.orgId || org.id);
      if (typeof window !== "undefined") window.location.reload();
    } catch {
      setBusyId(null);
    }
  }

  return (
    <Centered>
      <SignOutButton />
      <div style={{ width: "100%", maxWidth: 460, fontFamily: "Poppins, sans-serif" }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: NW.black, marginBottom: 4 }}>Pick a company</div>
        <div style={{ fontSize: 13.5, color: NW.gray500, marginBottom: 22 }}>Choose which client workspace to open.</div>
        {orgs === null ? (
          <div style={{ fontSize: 13, color: NW.gray500 }}>Loading companies…</div>
        ) : orgs.length === 0 ? (
          <div style={{ fontSize: 13, color: NW.gray500 }}>No companies found.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "60vh", overflow: "auto" }}>
            {orgs.map((org) => (
              <button key={org.id} onClick={() => pick(org)} disabled={busyId !== null}
                style={{ textAlign: "left", padding: "14px 16px", borderRadius: 12, border: `1px solid ${NW.gray100}`, background: NW.white, cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: NW.black, opacity: busyId && busyId !== org.id ? 0.5 : 1 }}>
                {org.name}
                {busyId === org.id && <span style={{ fontSize: 12, fontWeight: 500, color: NW.gray500 }}> — opening…</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </Centered>
  );
}

export function PortalApp() {
  const { status, profile, org, pipelines, openings } = usePortalData();
  const [active, setActive] = useState("overview");

  if (status === "loading") {
    return <Centered><div style={{ fontFamily: "Poppins, sans-serif", color: NW.gray500, fontSize: 14 }}>Loading your portal…</div></Centered>;
  }
  if (status === "signed-out") {
    return <LoginScreen />;
  }
  if (status === "no-org") {
    // Staff pick a company; a real client without a workspace gets a clear message.
    if (isNearworkEmail(profile?.email)) return <OrgPicker />;
    return (
      <Centered>
        <SignOutButton />
        <div style={{ maxWidth: 420, textAlign: "center", fontFamily: "Poppins, sans-serif" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: NW.black, marginBottom: 10 }}>No company workspace yet</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: NW.gray500 }}>Your account isn&apos;t connected to a company workspace. Please contact Nearwork.</div>
        </div>
      </Centered>
    );
  }

  const client = toPortalClient(profile, org);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <SignOutButton />
      {active === "overview" ? (
        <OverviewScreen client={client} data={toOverviewData(pipelines, openings, profile)} onNav={setActive} />
      ) : (
        <PortalComingSoon
          active={active}
          title={COMING_SOON[active]?.title || "Coming soon"}
          desc={COMING_SOON[active]?.desc || "This screen is being built."}
          icon={COMING_SOON[active]?.icon || "hammer"}
          onNav={setActive}
          client={client}
        />
      )}
    </div>
  );
}
