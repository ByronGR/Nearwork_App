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
  subscribeOrgCollection,
  type ClientUser,
  type Organization,
  type PortalOpening,
  type PortalPipeline,
  type PortalHire,
  type PortalAssessment,
} from "@/lib/firebase-client";

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
};

export function usePortalData(): PortalData {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientUser | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [openings, setOpenings] = useState<PortalOpening[]>([]);
  const [pipelines, setPipelines] = useState<PortalPipeline[]>([]);
  const [hires, setHires] = useState<PortalHire[]>([]);
  const [assessments, setAssessments] = useState<PortalAssessment[]>([]);
  const [status, setStatus] = useState<PortalDataStatus>("loading");

  // Auth → profile → org.
  useEffect(
    () =>
      onAuthStateChanged(auth, async (nextUser) => {
        if (!nextUser) {
          setUser(null);
          setProfile(null);
          setOrg(null);
          setOpenings([]);
          setPipelines([]);
          setHires([]);
          setAssessments([]);
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
          const nextOrg = await getOrganization(nextProfile);
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
    ];
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [org]);

  return { status, user, profile, org, openings, pipelines, hires, assessments };
}
