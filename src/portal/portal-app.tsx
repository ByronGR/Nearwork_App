"use client";

// ── New client portal — app shell + router (ports Nearwork Portal.html's App) ──
// Renders a screen by nav route inside the shared shell, exactly like the design
// prototype. Phase A: faithful screens on the prototype's sample data (no login).
// Phase B: swap sample data for real Firebase, screen by screen.

import React, { useState } from "react";
import { PortalComingSoon } from "./shell";
import { OverviewScreen } from "./screens/overview";
import { MOCK_CLIENT, MOCK_OVERVIEW } from "./mock-data";

// Screens not yet ported from the design source. These render inside the real
// shell (your sidebar/top bar) with a short "being built" note — temporary only,
// replaced by the actual ported screen as each one lands.
const PENDING: Record<string, { title: string; desc: string; icon: string }> = {
  pipeline: { title: "Pipeline", desc: "Porting this screen from your design now.", icon: "kanban-square" },
  team: { title: "Team", desc: "Porting this screen from your design now.", icon: "handshake" },
  spp: { title: "SPP", desc: "Porting this screen from your design now.", icon: "git-merge" },
  billing: { title: "Billing", desc: "Porting this screen from your design now.", icon: "wallet" },
  users: { title: "Users", desc: "Porting this screen from your design now.", icon: "users" },
  settings: { title: "Settings", desc: "Porting this screen from your design now.", icon: "settings" },
};

export function PortalApp() {
  const [route, setRoute] = useState("overview");
  const go = (id: string) => setRoute(id);

  if (route === "overview") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <OverviewScreen client={MOCK_CLIENT} data={MOCK_OVERVIEW} onNav={go} />
      </div>
    );
  }

  const pending = PENDING[route] || { title: "Coming soon", desc: "Porting this screen now.", icon: "hammer" };
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <PortalComingSoon active={route} title={pending.title} desc={pending.desc} icon={pending.icon} onNav={go} client={MOCK_CLIENT} />
    </div>
  );
}
