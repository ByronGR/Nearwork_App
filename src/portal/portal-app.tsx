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
import { OpenRolesScreen } from "./screens/roles";
import { PipelineScreen } from "./screens/pipeline";
import { CandidateDetailScreen } from "./screens/candidate";
import { TeamScreen } from "./screens/team";
import { HireDetailScreen } from "./screens/hire";
import { BillingScreen } from "./screens/billing";
import { UsersScreen } from "./screens/users";
import { SettingsScreen } from "./screens/settings";
import { SppScreen } from "./screens/spp";
import { usePortalData } from "./use-portal-data";
import { toPortalClient, toOverviewData } from "./map-overview";
import { toRolesData } from "./map-roles";
import { toPipelineData } from "./map-pipeline";
import { toCandidateData } from "./map-candidate";
import { toTeamData } from "./map-team";
import { toHireData } from "./map-hire";
import { toBillingData } from "./map-billing";
import { toUsersData } from "./map-users";
import { toSettingsData } from "./map-settings";
import { toSppData } from "./map-spp";
import { LoginScreen, StaffOrgPicker } from "@/components/client-portal";
import { isNearworkEmail, logoutClient } from "@/lib/firebase-client";
import { useState } from "react";

// Screens not yet ported from the design source. They render inside the real
// shell with a short "porting now" note — temporary, replaced as each lands.
// Every left-menu screen is a real ported screen now. This only catches deep
// drill-downs (team detail, sub-client) that aren't reachable without data yet.
const PENDING: Record<string, { title: string; desc: string; icon: string }> = {};

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: NW.offWhite, fontFamily: "Poppins, sans-serif", color: NW.gray500, fontSize: 14 }}>
      {children}
    </div>
  );
}

export function PortalApp() {
  const { status, user, profile, org, pipelines, openings, assessments, hires, timeOff, reviews, billing } = usePortalData();
  const [route, setRoute] = useState("overview");
  const [navArg, setNavArg] = useState<string | number | undefined>(undefined);
  // Remember which role's board we came from, so the candidate detail shows that
  // role's assessment (a candidate can carry a different score per role).
  const [pipelineCtx, setPipelineCtx] = useState<string | undefined>(undefined);
  const go = (id: string, arg?: string | number) => {
    if (id === "logout") {
      logoutClient().finally(() => { if (typeof window !== "undefined") window.location.reload(); });
      return;
    }
    setRoute(id);
    setNavArg(arg);
    if (id === "kanban") setPipelineCtx(arg != null ? String(arg) : undefined);
  };

  // Staff = any @nearwork.co account. Use the login email (always present) so a
  // staff user-doc that happens not to store an email still resolves as staff.
  const isStaff = isNearworkEmail(user?.email || profile?.email);

  if (status === "loading") return <Centered>Loading your portal…</Centered>;

  // Reuse the real, branded login (invitation-only, remember-me, Google, invites).
  if (status === "signed-out") return <LoginScreen />;

  // Staff have no fixed company — reuse the existing picker (it saves the choice).
  if (status === "no-org") {
    if (profile && isStaff) {
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

  // Viewers are read-only and limited to Overview / Pipeline / Team. Any other
  // route (including deep links) falls back to Overview.
  const VIEWER_ROUTES = ["overview", "pipeline", "kanban", "candidate", "team", "hire"];
  if (client.access === "viewer" && !VIEWER_ROUTES.includes(route)) {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <OverviewScreen client={client} data={toOverviewData(pipelines, openings, profile)} onNav={go} />
      </div>
    );
  }

  if (route === "overview") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <OverviewScreen client={client} data={toOverviewData(pipelines, openings, profile)} onNav={go} />
      </div>
    );
  }

  if (route === "pipeline") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <OpenRolesScreen client={client} data={toRolesData(openings, pipelines)} onNav={go} />
      </div>
    );
  }

  if (route === "team") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <TeamScreen client={client} data={toTeamData(hires)} onNav={go} />
      </div>
    );
  }

  if (route === "billing") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <BillingScreen client={client} data={toBillingData(billing)} onNav={go} />
      </div>
    );
  }

  if (route === "users") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <UsersScreen client={client} data={toUsersData(org, user?.email ?? undefined)} onNav={go} />
      </div>
    );
  }

  if (route === "settings") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <SettingsScreen client={client} data={toSettingsData(profile)} onNav={go} />
      </div>
    );
  }

  if (route === "spp") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <SppScreen client={client} data={toSppData()} onNav={go} />
      </div>
    );
  }

  if (route === "hire") {
    const hdata = toHireData(hires, timeOff, reviews, navArg != null ? String(navArg) : null);
    if (hdata) {
      return (
        <div style={{ position: "fixed", inset: 0 }}>
          <HireDetailScreen client={client} data={hdata} onNav={go} />
        </div>
      );
    }
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <PortalComingSoon active="team" title="Team member not found" desc="This person is no longer on your team. Head back to Team." icon="user-x" onNav={go} client={client} />
      </div>
    );
  }

  // The kanban board for one role — reached by clicking a role in Open roles.
  if (route === "kanban") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <PipelineScreen client={client} data={toPipelineData(pipelines, openings, navArg != null ? String(navArg) : null)} onNav={go} />
      </div>
    );
  }

  // Candidate detail — reached by clicking a candidate on the board.
  if (route === "candidate") {
    const cdata = toCandidateData(pipelines, openings, assessments, navArg != null ? String(navArg) : null, pipelineCtx);
    if (cdata) {
      return (
        <div style={{ position: "fixed", inset: 0 }}>
          <CandidateDetailScreen client={client} data={cdata} onNav={go} />
        </div>
      );
    }
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <PortalComingSoon active="pipeline" title="Candidate not found" desc="This candidate is no longer in the pipeline. Head back to your roles." icon="user-x" onNav={go} client={client} />
      </div>
    );
  }

  const pending = PENDING[route] || { title: "Not available", desc: "This view opens from a record that doesn't exist yet. Head back to the menu.", icon: "compass" };
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <PortalComingSoon active={route} title={pending.title} desc={pending.desc} icon={pending.icon} onNav={go} client={client} />
    </div>
  );
}
