"use client";

// ── New client portal — app shell + router ────────────────────────────────────
// Stage 0 of the App↔Admin wiring: reuse the EXISTING branded login + staff
// company-picker from the old portal, load REAL org-scoped Firebase data via
// usePortalData, and render the new design screens with it. Built screens show
// real data; screens not yet ported show a brief note inside the real shell.

import React from "react";
import { NW } from "./primitives";
import { PortalComingSoon } from "./shell";
import { OverviewScreen } from "./screens/overview";
import { usePortalData } from "./use-portal-data";
import { toPortalClient, toOverviewData } from "./map-overview";
import { LoginScreen, StaffOrgPicker } from "@/components/client-portal";
import { isNearworkEmail } from "@/lib/firebase-client";
import { useState } from "react";

// Screens not yet ported from the design source. They render inside the real
// shell with a short "porting now" note — temporary, replaced as each lands.
const PENDING: Record<string, { title: string; desc: string; icon: string }> = {
  pipeline: { title: "Pipeline", desc: "Porting this screen from your design now.", icon: "kanban-square" },
  team: { title: "Team", desc: "Porting this screen from your design now.", icon: "handshake" },
  spp: { title: "SPP", desc: "Porting this screen from your design now.", icon: "git-merge" },
  billing: { title: "Billing", desc: "Porting this screen from your design now.", icon: "wallet" },
  users: { title: "Users", desc: "Porting this screen from your design now.", icon: "users" },
  settings: { title: "Settings", desc: "Porting this screen from your design now.", icon: "settings" },
};

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: NW.offWhite, fontFamily: "Poppins, sans-serif", color: NW.gray500, fontSize: 14 }}>
      {children}
    </div>
  );
}

export function PortalApp() {
  const { status, profile, org, pipelines, openings } = usePortalData();
  const [route, setRoute] = useState("overview");
  const go = (id: string) => setRoute(id);

  if (status === "loading") return <Centered>Loading your portal…</Centered>;

  // Reuse the real, branded login (invitation-only, remember-me, Google, invites).
  if (status === "signed-out") return <LoginScreen />;

  // Staff have no fixed company — reuse the existing picker (it saves the choice).
  if (status === "no-org") {
    if (profile && isNearworkEmail(profile.email)) {
      return <StaffOrgPicker profile={profile} onSelect={() => { if (typeof window !== "undefined") window.location.reload(); }} />;
    }
    return (
      <Centered>
        <div style={{ maxWidth: 400, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: NW.black, marginBottom: 8 }}>No company workspace yet</div>
          <div>Your account isn&apos;t connected to a company workspace yet. Please contact Nearwork.</div>
        </div>
      </Centered>
    );
  }

  const client = toPortalClient(profile, org);

  if (route === "overview") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <OverviewScreen client={client} data={toOverviewData(pipelines, openings, profile)} onNav={go} />
      </div>
    );
  }

  const pending = PENDING[route] || { title: "Coming soon", desc: "Porting this screen now.", icon: "hammer" };
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <PortalComingSoon active={route} title={pending.title} desc={pending.desc} icon={pending.icon} onNav={go} client={client} />
    </div>
  );
}
