"use client";

// ── Portal data loader (Sprint 2 wiring) ──────────────────────────────────────
// Reuses the SAME building blocks the old client-portal.tsx uses
// (getClientUser → getOrganization → subscribeOrgCollection), packaged as a small
// hook so the new native screens can consume real org-scoped Firebase data.
// The screens themselves stay pure (data via props); this is the only place that
// talks to Firebase for them.

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  getClientUser,
  getOrganization,
  getOrganizationById,
  listAllOrganizations,
  setStaffActiveOrg,
  isNearworkEmail,
  subscribeOrgCollection,
  type ClientUser,
  type Organization,
  type PortalOpening,
  type PortalPipeline,
  type PortalHire,
  type PortalAssessment,
  type PortalNote,
  type PortalRequest,
  type TimeOffRequest,
} from "@/lib/firebase-client";

type Row = Record<string, unknown>;

export type PortalDataStatus = "loading" | "signed-out" | "no-org" | "ready";

export type PortalData = {
  status: PortalDataStatus;
  user: User | null;
  profile: ClientUser | null;
  org: Organization | null;
  openings: PortalOpening[];
  pipelines: PortalPipeline[];
  hires: PortalHire[];
  assessments: PortalAssessment[];
  notes: PortalNote[];
  requests: PortalRequest[];
  timeOff: TimeOffRequest[];
  reviews: Row[];
  billing: Row[];
  // Nearwork staff only: switch which org's workspace is being viewed.
  isStaff: boolean;
  orgs: Organization[];
  switchOrg: (orgId: string) => Promise<void>;
};

export function usePortalData(): PortalData {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientUser | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [openings, setOpenings] = useState<PortalOpening[]>([]);
  const [pipelines, setPipelines] = useState<PortalPipeline[]>([]);
  const [hires, setHires] = useState<PortalHire[]>([]);
  const [assessments, setAssessments] = useState<PortalAssessment[]>([]);
  const [notes, setNotes] = useState<PortalNote[]>([]);
  const [requests, setRequests] = useState<PortalRequest[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [reviews, setReviews] = useState<Row[]>([]);
  const [billing, setBilling] = useState<Row[]>([]);
  const [status, setStatus] = useState<PortalDataStatus>("loading");

  // Auth → profile → org.
  useEffect(
    () =>
      onAuthStateChanged(auth, async (nextUser) => {
        if (!nextUser) {
          setUser(null);
          setProfile(null);
          setOrg(null);
          setOrgs([]);
          setOpenings([]);
          setPipelines([]);
          setHires([]);
          setAssessments([]);
          setNotes([]);
          setRequests([]);
          setTimeOff([]);
          setReviews([]);
          setBilling([]);
          setStatus("signed-out");
          return;
        }
        setUser(nextUser);
        setStatus("loading");
        try {
          // Cold-start guard: the first getClientUser right after sign-in can race
          // a still-connecting Firestore and return null. Retry a few times.
          let nextProfile = await getClientUser(nextUser);
          for (let attempt = 0; attempt < 4 && !nextProfile; attempt++) {
            await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
            nextProfile = await getClientUser(nextUser);
          }
          if (!nextProfile) {
            setProfile(null);
            setOrg(null);
            setStatus("signed-out");
            return;
          }
          setProfile(nextProfile);
          const staff = isNearworkEmail(nextProfile.email || nextUser.email);
          let nextOrg = await getOrganization(nextProfile);
          // Nearwork staff have no fixed org — load every org for the switcher and
          // default to their last-viewed (activeOrgId) or the first one.
          if (staff) {
            const all = await listAllOrganizations().catch(() => [] as Organization[]);
            setOrgs(all);
            if (!nextOrg && all.length) nextOrg = all[0];
          }
          if (!nextOrg) {
            setOrg(null);
            setStatus("no-org");
            return;
          }
          setOrg(nextOrg);
          setStatus("ready");
        } catch (err) {
          console.error("[usePortalData] load failed:", err);
          setStatus("signed-out");
        }
      }),
    [],
  );

  // Live org-scoped collections (only while we have an org).
  useEffect(() => {
    if (!org) return;
    const unsubscribers = [
      subscribeOrgCollection<PortalOpening>("openings", org, setOpenings),
      subscribeOrgCollection<PortalPipeline>("pipelines", org, setPipelines),
      subscribeOrgCollection<PortalHire>("placements", org, setHires),
      subscribeOrgCollection<PortalAssessment>("assessments", org, setAssessments),
      subscribeOrgCollection<PortalNote>("candidateNotes", org, setNotes),
      subscribeOrgCollection<PortalRequest>("pipelineRequests", org, setRequests),
      subscribeOrgCollection<TimeOffRequest>("timeOffRequests", org, setTimeOff),
      subscribeOrgCollection<Row>("performanceReviews", org, setReviews),
      subscribeOrgCollection<Row>("partnerBilling", org, setBilling),
    ];
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [org]);

  const isStaff = isNearworkEmail(user?.email || profile?.email);

  // Staff switch which org's workspace they're viewing — swaps `org`, which
  // re-runs the subscriptions above, and remembers the choice on their profile.
  const switchOrg = async (orgId: string) => {
    if (!isStaff || !orgId || orgId === org?.id) return;
    const next = await getOrganizationById(orgId);
    if (!next) return;
    setOrg(next);
    setStatus("ready");
    const uid = auth.currentUser?.uid;
    if (uid) setStaffActiveOrg(uid, orgId).catch(() => {});
  };

  return { status, user, profile, org, openings, pipelines, hires, assessments, notes, requests, timeOff, reviews, billing, isStaff, orgs, switchOrg };
}
