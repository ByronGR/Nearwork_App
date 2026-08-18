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
import { NotificationsScreen } from "./screens/notifications";
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
import { isNearworkEmail, logoutClient, addClientNote, createPipelineRequest, clientMoveSourcing, sendOrgInvite, removeOrgMember } from "@/lib/firebase-client";
import { useState, useEffect } from "react";

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

// ── Deep-linking: mirror the current view (+ ids) into the URL query so a refresh
// or a shared link lands on the same page instead of the home screen. ───────────
// Opening boards and candidate profiles get clean, shareable paths that mirror
// the Admin codes (/opening/NW-7823, /opening/NW-7823/candidate/<id>). The other
// portal views (team, billing, settings…) have no id and no clean path of their
// own, so they ride a ?v= query on the root to avoid colliding with legacy routes.
function parsePortalUrl(): { v: string; id?: string; ctx?: string } | null {
  if (typeof window === "undefined") return null;
  const seg = window.location.pathname.split("/").filter(Boolean).map((s) => {
    try { return decodeURIComponent(s); } catch { return s; }
  });
  if (seg[0] === "opening" && seg[2] === "candidate" && seg[3]) {
    return { v: "candidate", id: seg[3], ctx: seg[1] };
  }
  if (seg[0] === "opening" && seg[1]) {
    return { v: "kanban", id: seg[1], ctx: seg[1] };
  }
  if (seg[0] === "candidate" && seg[1]) {
    return { v: "candidate", id: seg[1], ctx: undefined };
  }
  const p = new URLSearchParams(window.location.search);
  return { v: p.get("v") || "overview", id: p.get("id") || undefined, ctx: p.get("ctx") || undefined };
}
function buildPortalUrl(route: string, arg?: string | number, ctx?: string): string {
  const a = arg != null && arg !== "" ? encodeURIComponent(String(arg)) : "";
  if (route === "overview") return "/";
  if (route === "kanban" && a) return `/opening/${a}`;
  if (route === "candidate" && a) {
    return ctx ? `/opening/${encodeURIComponent(ctx)}/candidate/${a}` : `/candidate/${a}`;
  }
  const p = new URLSearchParams();
  p.set("v", route);
  if (arg != null && arg !== "") p.set("id", String(arg));
  return `/?${p.toString()}`;
}

export function PortalApp() {
  const { status, user, profile, org, pipelines, openings, assessments, notes, requests, hires, timeOff, reviews, billing, orgs, switchOrg } = usePortalData();
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
    // Which board this candidate came from — kept in the URL so a refreshed /
    // shared candidate link still resolves the right pipeline.
    const nextCtx = id === "kanban"
      ? (arg != null ? String(arg) : undefined)
      : (id === "candidate" ? pipelineCtx : undefined);
    setRoute(id);
    setNavArg(arg);
    if (id === "kanban") setPipelineCtx(arg != null ? String(arg) : undefined);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", buildPortalUrl(id, arg, nextCtx));
    }
  };

  // Deep linking: restore the view from the URL on first load, and follow the
  // browser Back/Forward buttons. Runs client-side only (no SSR hydration risk).
  useEffect(() => {
    const restore = () => {
      const u = parsePortalUrl();
      if (!u) return;
      setRoute(u.v);
      setNavArg(u.id);
      setPipelineCtx(u.ctx);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

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

  // Sourcing pipelines: the client moves the candidate directly (In Progress /
  // Hired / Not Selected). Goes through the Admin server route, which verifies
  // ownership + the transition and notifies Nearwork.
  const moveSourcingCandidate = async (
    toStage: "in-progress" | "hired" | "not-selected",
    comment?: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    const found = findPipelineCandidate(pipelines, navArg != null ? String(navArg) : null, pipelineCtx);
    if (!found) return { ok: false, error: "Candidate not found." };
    const { c, pipe } = found;
    return clientMoveSourcing({
      pipelineCode: pipe.code,
      candidateId: String(c.candidateId || c.candidateCode || c.code || ""),
      toStage,
      comment,
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

  // Revoke a teammate's access (client admins only). Reversible — re-invite restores.
  const removeTeammate = async (member: { email?: string; uid?: string }): Promise<{ ok: boolean; error?: string }> => {
    if (!org) return { ok: false, error: "No workspace is loaded yet." };
    return await removeOrgMember(org.orgId || org.id, member);
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

  const client = {
    ...toPortalClient(profile, org),
    // Staff can hop between client workspaces without logging out; clients can't.
    orgSwitcher: isStaff
      ? { orgs: orgs.map((o) => ({ id: o.id, name: o.name })), activeOrgId: org?.id, onSwitch: switchOrg }
      : undefined,
  };

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
        <OpenRolesScreen client={client} data={toRolesData(openings, pipelines)} orgId={org?.orgId || org?.id || ""} onNav={go} />
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
        <UsersScreen client={client} data={toUsersData(org, user?.email ?? undefined)} onNav={go} onInvite={inviteTeammate} onRemove={removeTeammate} />
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

  if (route === "notifications") {
    return (
      <div style={{ position: "fixed", inset: 0 }}>
        <NotificationsScreen client={client} onNav={go} />
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
    const activeMemberEmails = new Set(
      ((org as unknown as { orgUsers?: { email?: string }[] } | null)?.orgUsers || [])
        .map((u) => (u.email || "").trim().toLowerCase())
        .filter(Boolean),
    );
    const cdata = toCandidateData(pipelines, openings, assessments, navArg != null ? String(navArg) : null, pipelineCtx, notes, requests, activeMemberEmails);
    if (cdata) {
      return (
        <div style={{ position: "fixed", inset: 0 }}>
          <CandidateDetailScreen client={client} data={cdata} onNav={go} onAddNote={addNote} onRequest={requestOnCandidate} onSourcingMove={moveSourcingCandidate} />
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
