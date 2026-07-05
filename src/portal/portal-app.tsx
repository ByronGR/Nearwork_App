"use client";

// ── New client portal — app shell + router ────────────────────────────────────
// Stage 0 of the App↔Admin wiring: reuse the EXISTING branded login + staff
// company-picker from the old portal, load REAL org-scoped Firebase data via
// usePortalData, and render the new design screens with it. Built screens show
// real data; screens not yet ported show a brief note inside the real shell.

import React from "react";
import { NW } from "./primitives";
import { PortalComingSoon, allowedNav } from "./shell";
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
import { toCandidateData, findPipelineCandidate } from "./map-candidate";
import { toTeamData } from "./map-team";
import { toHireData } from "./map-hire";
import { toBillingData } from "./map-billing";
import { toUsersData } from "./map-users";
import { toSettingsData } from "./map-settings";
import { toSppData } from "./map-spp";
import { LoginScreen, StaffOrgPicker } from "@/components/client-portal";
import { KickoffBriefPage } from "@/components/kickoff-brief";
import { isNearworkEmail, logoutClient, addClientNote, createPipelineRequest, sendOrgInvite } from "@/lib/firebase-client";
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
  const { status, user, profile, org, pipelines, openings, assessments, notes, requests, hires, timeOff, reviews, billing } = usePortalData();
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

  // Post a note from the client side. Resolves the same raw candidate + pipeline
  // the detail screen is showing, then writes to the shared candidateNotes.
  const addNote = async (text: string, scope: "client_visible" | "client_internal") => {
    if (!org || !profile) return;
    const found = findPipelineCandidate(pipelines, navArg != null ? String(navArg) : null, pipelineCtx);
    if (!found) return;
    const { c, pipe } = found;
    await addClientNote({
      org,
      profile,
      candidate: {
        id: String(c.candidateId || c.candidateCode || c.code || ""),
        code: String(c.candidateCode || c.code || ""),
        name: String(c.name || ""),
        role: String(c.role || ""),
      },
      pipeline: { code: pipe.code, openingTitle: pipe.openingTitle },
      text,
      scope,
    });
  };

  // Raise a request on the current candidate (advance / hire / reject / interview).
  // The client never moves a candidate itself — Nearwork acts on the request.
  const requestOnCandidate = async (
    type: "advance" | "hire" | "reject" | "interview",
    opts?: { toStage?: string; reason?: string; fromStage?: string },
  ) => {
    if (!org || !profile) return;
    const found = findPipelineCandidate(pipelines, navArg != null ? String(navArg) : null, pipelineCtx);
    if (!found) return;
    const { c, pipe } = found;
    await createPipelineRequest({
      org,
      profile,
      candidate: {
        id: String(c.candidateId || c.candidateCode || c.code || ""),
        code: String(c.candidateCode || c.code || ""),
        name: String(c.name || ""),
        role: String(c.role || ""),
      },
      pipeline: { code: pipe.code, openingTitle: pipe.openingTitle },
      type,
      fromStage: opts?.fromStage,
      toStage: opts?.toStage,
      reason: opts?.reason,
    });
  };

  // Invite a teammate to this workspace (client admins only — the Users screen is
  // already admin-gated). Goes through the existing server invite (email + record).
  const inviteTeammate = async (email: string, role: string): Promise<{ ok: boolean; error?: string }> => {
    if (!org) return { ok: false, error: "No workspace is loaded yet." };
    const portalRole = role === "admin" ? "client_admin" : role === "viewer" ? "viewer_client" : "client_user";
    try {
      return await sendOrgInvite(email, org.orgId || org.id, org.name, { role: portalRole });
    } catch {
      return { ok: false, error: "Couldn't reach the invite service. Please try again." };
    }
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

  // Enforce role access on the route (belt-and-suspenders with the nav filter).
  // Deep routes map to their parent menu item; anything not allowed for this
  // access level falls back to Overview.
  const ROUTE_PARENT: Record<string, string> = {
    kanban: "pipeline", candidate: "pipeline", kickoff: "pipeline",
    hire: "team", "team-detail": "team", "spp-client": "spp",
  };
  const topRoute = ROUTE_PARENT[route] || route;
  if (route !== "overview" && !allowedNav(client.access, topRoute)) {
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
        <UsersScreen client={client} data={toUsersData(org, user?.email ?? undefined)} onNav={go} onInvite={inviteTeammate} />
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

  // Kickoff brief review — reached from "Review brief" in Open roles. Reuses the
  // full standalone brief page (loads via /api/kickoff, approve / request changes).
  if (route === "kickoff" && client.access !== "viewer") {
    const code = navArg != null ? String(navArg) : "";
    if (code) {
      return (
        <div style={{ position: "fixed", inset: 0, overflow: "auto" }}>
          <KickoffBriefPage code={code} onBack={() => go("pipeline")} />
        </div>
      );
    }
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
    const cdata = toCandidateData(pipelines, openings, assessments, navArg != null ? String(navArg) : null, pipelineCtx, notes, requests);
    if (cdata) {
      return (
        <div style={{ position: "fixed", inset: 0 }}>
          <CandidateDetailScreen client={client} data={cdata} onNav={go} onAddNote={addNote} onRequest={requestOnCandidate} />
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
