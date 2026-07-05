"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  verifyPasswordResetCode,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
  type QueryConstraint,
} from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyApRNyW8PoP28E0x77dUB5jOgHuTqA2by4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nearwork-97e3c.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nearwork-97e3c",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nearwork-97e3c.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "145642656516",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:145642656516:web:0ac2da8931283121e87651",
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence).catch(() => null);

export async function setClientRememberMe(remember: boolean) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}

export type ClientUser = {
  id: string;
  uid?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoUrl?: string;
  role?: string;
  portalRole?: string;
  displayRole?: string;
  jobTitle?: string;
  orgId?: string;
  orgName?: string;
  organizationId?: string;
  orgIds?: string[];
  activeOrgId?: string;
  notificationPreferences?: Record<string, { app?: boolean; email?: boolean }>;
};

export type OrgMembership = {
  id: string;
  uid?: string;
  email?: string;
  orgId: string;
  orgName?: string;
  role?: string;
  portalRole?: string;
  status?: string;
};

export type Organization = {
  id: string;
  orgId: string;
  name: string;
  domain?: string;
  plan?: string;
  status?: string;
  seats?: number;
  accountManager?: string;      // Admin's primary field for the assigned AM's name
  accountManagerName?: string;  // legacy/mirror of the same name
  accountManagerEmail?: string; // pulled from the AM's staff profile when assigned in Admin
  accountManagerPhone?: string;
};

export type PortalOpening = {
  id: string;
  code: string;
  title: string;
  orgId?: string;
  orgName?: string;
  status?: string;
  published?: boolean;
  recruiter?: string;
  backupRecruiter?: string;
  recruitingManager?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  skills?: string[] | string;
  roleLibraryDepartment?: string;
  roleLibrarySeniority?: string;
};

export type PipelineCandidate = {
  code?: string;
  candidateCode?: string;
  name?: string;
  email?: string;
  role?: string;
  stage?: string;
  status?: string;
  score?: number;
  salary?: string;
  expectedSalary?: string;
  expectedSalaryAmount?: number;
  expectedSalaryCurrency?: string;
  english?: string;
  location?: string;
  skills?: string[];
};

export type PortalPipeline = {
  id: string;
  code: string;
  orgId?: string;
  orgName?: string;
  openingCode?: string;
  openingTitle?: string;
  recruiter?: string;
  accountManager?: string;
  status?: string;
  briefStatus?: string; // synced from kickoffBriefs by the admin API on every status change
  candidates?: PipelineCandidate[];
};

export type PortalHire = {
  id: string;
  candidateCode?: string;
  name?: string;
  candidateName?: string;
  email?: string;
  role?: string;
  orgId?: string;
  orgName?: string;
  clientCompany?: string;
  pipelineId?: string;
  pipelineCode?: string;
  openingCode?: string;
  engagementType?: string;
  serviceType?: string;
  contractType?: string;
  eorTier?: string;
  startDate?: string;
  effectiveDate?: string;
  status?: string;
  salary?: number;
  salaryCurrency?: string;
  copSalaryMonthly?: number;
  compensationCurrency?: string;
  salesPrice?: number;
  salesCurrency?: string;
  usdBilledMonthly?: number;
  fxRateAtHire?: number;
  ncrAtSigning?: number;
  uniqueUrl?: string;
};

export type TimeOffRequest = {
  id: string;
  orgId?: string;
  organizationId?: string;
  candidateCode?: string;
  personId?: string;
  personName?: string;
  name?: string;
  role?: string;
  type?: string;
  from?: string;
  to?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  comments?: string;
  decisionComment?: string;
  reviewedAt?: unknown;
  createdAt?: unknown;
};

export type PortalCandidate = {
  id: string;
  code: string;
  candidateCode?: string;
  name: string;
  email?: string;
  role?: string;
  headline?: string;
  status?: string;
  stage?: string;
  score?: number;
  lastAssessmentScore?: number;
  lastTechnicalScore?: number;
  english?: string;
  englishScore?: { level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'; feedback?: string; assessedAt?: string; assessedBy?: string };
  salary?: string;
  expectedSalary?: string;
  expectedSalaryAmount?: number;
  expectedSalaryCurrency?: string;
  city?: string;
  location?: string;
  skills?: string[];
  cvUrl?: string;
  photoUrl?: string;
  linkedin?: string;
  workHistory?: Array<{ company?: string; title?: string; from?: string; to?: string }>;
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
  languages?: Array<string | { language?: string; level?: string }>;
  discProfile?: { label?: string; high?: string; low?: string; summary?: string };
  aiReview?: PortalAssessmentInsight;
  applications?: unknown[];
  pipelineCodes?: string[];
};

export type PortalAssessmentInsight = {
  summaryTitle?: string;
  radar?: Array<{ label: string; candidate: number; average: number }>;
  bars?: Array<{ label: string; candidate: number; average: number }>;
  recommendation?: string;
  client?: {
    summary?: string;
    technicalBreakdown?: string;
    discSummary?: string;
    strengths?: string[];
    watchouts?: string[];
    followUps?: string[];
    interviewGuide?: string[];
  };
};

export type PortalAssessment = {
  id: string;
  orgId?: string;
  organizationId?: string;
  candidateCode?: string;
  candidateEmail?: string;
  candidateName?: string;
  pipelineCode?: string;
  openingCode?: string;
  role?: string;
  status?: string;
  score?: number;
  technical?: number;
  discProfile?: PortalCandidate["discProfile"];
  latestAiReviewClient?: PortalAssessmentInsight["client"];
  latestAiReviewVisuals?: Omit<PortalAssessmentInsight, "client">;
  aiReviewUpdatedAt?: unknown;
};

export type PortalNote = {
  id: string;
  candidateId?: string;
  candidateCode?: string;
  candidateName?: string;
  pipelineCode?: string;
  pipelineTitle?: string;
  orgId?: string;
  orgName?: string;
  scope?: string;
  visibility?: string;
  side?: string; // "client" | "nearwork"
  text?: string;
  body?: string; // mirror of text (Admin renders `body`)
  author?: string;
  authorName?: string;
  authorUid?: string;
  authorEmail?: string;
  createdAt?: unknown;
};

// A client-raised request on a candidate. Clients don't move stages themselves —
// they ASK Nearwork to advance / hire / reject / interview, and the Nearwork team
// acts on it. status: "pending" | "handled" | "dismissed".
export type PortalRequest = {
  id: string;
  orgId?: string;
  orgName?: string;
  candidateId?: string;
  candidateCode?: string;
  candidateName?: string;
  pipelineCode?: string;
  pipelineTitle?: string;
  type?: string; // advance | hire | reject | interview
  fromStage?: string;
  toStage?: string;
  reason?: string;
  status?: string;
  requestedBy?: string;
  requestedByEmail?: string;
  requestedByUid?: string;
  side?: string;
  createdAt?: unknown;
};

export type PortalNotification = {
  id: string;
  title?: string;
  message?: string;
  body?: string;        // Admin-written mirror of message
  read?: boolean;
  readAt?: unknown;
  createdAt?: unknown;
  type?: string;        // event type (for icon/colour)
  category?: string;    // "Pipeline" | "Kickoff" | "Note" | ...
  link?: string;
  candidateCode?: string;
  candidateName?: string;
  pipelineCode?: string;
  actorName?: string;
  orgId?: string;
  channel?: string;
};

export type OpeningChatMessage = {
  id: string;
  openingCode?: string;
  pipelineCode?: string;
  orgId?: string;
  orgName?: string;
  text?: string;
  author?: string;
  authorEmail?: string;
  authorUid?: string;
  authorType?: "client" | "nearwork";
  createdAt?: unknown;
};

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  // Update lastLoginAt so the Admin users page shows the correct timestamp
  setDoc(doc(db, "users", credential.user.uid), { lastLoginAt: serverTimestamp() }, { merge: true }).catch(() => null);
  return credential;
}

export type ClientInvite = {
  orgId?: string;
  orgName?: string;
  portalRole?: string;
  firstName?: string;
  lastName?: string;
  businessRole?: string;
  token?: string;
  email?: string;
};

// Writes the Firestore users/{uid} profile for an authenticated client. Forcing a
// fresh ID token first guarantees the auth token carries the `email` claim that the
// security rule checks (`request.resource.data.email == email()`); the very first
// token after createUserWithEmailAndPassword can briefly lack it, which silently
// rejects the create and leaves a profile-less ("zombie") account. Safe to call
// again at login time to repair such accounts.
export async function writeClientProfile(user: User, invite: ClientInvite) {
  if (!invite?.orgId) throw new Error("invite-missing-org");
  const normalizedEmail = (invite.email || user.email || "").trim().toLowerCase();
  // Force-refresh so the token used for the Firestore write definitely has the email claim.
  await user.getIdToken(true);
  const name = [invite.firstName, invite.lastName].filter(Boolean).join(" ") || user.displayName || normalizedEmail;
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: normalizedEmail,
    name,
    firstName: invite.firstName || "",
    lastName: invite.lastName || "",
    role: "client",
    portalRole: invite.portalRole || "viewer_client",
    orgId: invite.orgId,
    organizationId: invite.orgId,
    orgName: invite.orgName || "",
    businessRole: invite.businessRole || "",
    title: invite.businessRole || "",
    // jobTitle/displayRole drive the title shown in the portal sidebar — keep them
    // in sync with the business role chosen at invite time (e.g. "CEO", "Hiring Manager").
    jobTitle: invite.businessRole || "",
    displayRole: invite.businessRole || "",
    source: "app.nearwork.co",
    invitePending: false,
    onboarded: true,
    createdFromInvite: true,
    acceptedInviteId: invite.token || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  const inviteDocId = ("invite_" + invite.orgId + "_" + normalizedEmail).replace(/[^a-z0-9_-]+/g, "_").slice(0, 150);
  try {
    await setDoc(doc(db, "orgInvites", inviteDocId), {
      email: normalizedEmail,
      uid: user.uid,
      orgId: invite.orgId,
      organizationId: invite.orgId,
      orgName: invite.orgName || "",
      businessRole: invite.businessRole || "",
      title: invite.businessRole || "",
      status: "active",
      invitePending: false,
      acceptedAt: serverTimestamp(),
      acceptedInviteId: invite.token || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn("[ClientInvite] Could not mirror accepted invite status.", error);
  }
}

export async function createClientAccount(email: string, password: string, invite?: ClientInvite) {
  const normalizedEmail = email.trim().toLowerCase();
  // Guard: never create a login we can't attach to a company. Without orgId the
  // Firestore users doc can't be written (and security rules would reject it),
  // which previously left "zombie" accounts that exist in Auth but can never log
  // in. Fail before creating the Auth account so the user can retry with a valid
  // (most-recent) invite link instead of getting permanently stuck.
  if (!invite?.orgId) {
    throw new Error("invite-missing-org");
  }
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  await writeClientProfile(credential.user, { ...invite, email: normalizedEmail });
  // HubSpot sync (fire-and-forget)
  if (invite?.orgId) {
    fetch("https://admin.nearwork.co/api/hs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "client",
        client: {
          email: normalizedEmail,
          name: [invite.firstName, invite.lastName].filter(Boolean).join(" ") || normalizedEmail,
          orgId: invite.orgId,
          orgName: invite.orgName || "",
          businessRole: invite.businessRole || "",
        },
        event: "signup",
      }),
    }).catch(() => null);
  }
  return credential;
}

export async function sendOrgInvite(
  email: string,
  orgId: string,
  orgName: string,
  details: { name?: string; role?: string }
): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { ok: false, error: "Email is required" };
  const token = crypto.randomUUID();
  const nameParts = (details.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");
  const setupLink =
    `https://app.nearwork.co/join?token=${token}&email=${encodeURIComponent(normalizedEmail)}&orgId=${encodeURIComponent(orgId)}&orgName=${encodeURIComponent(orgName)}` +
    (firstName ? `&firstName=${encodeURIComponent(firstName)}` : "") +
    (lastName ? `&lastName=${encodeURIComponent(lastName)}` : "") +
    (details.role ? `&title=${encodeURIComponent(details.role)}` : "");
  try {
    const res = await fetch("/api/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        firstName: firstName || normalizedEmail.split("@")[0],
        orgName,
        setupLink,
        orgId,
        token,
        inviteeName: details.name || "",
        businessRole: details.role || "",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as { error?: string }).error || "Failed to send invite email" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Network error" };
  }
}

// Revoke a teammate's access to a workspace (client admins). Goes through the
// server (Admin SDK) since clients can't edit org membership directly. Reversible
// — the person's account stays; re-inviting restores access.
export async function removeOrgMember(
  orgId: string,
  member: { email?: string; uid?: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/remove-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, email: (member.email || "").trim().toLowerCase(), uid: member.uid || "" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return { ok: false, error: data?.error || `Remove failed (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Network error" };
  }
}

export async function sendClientPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  // Send the branded Nearwork reset email via the Admin API, which generates the
  // reset link with the Firebase Admin SDK (Vercel OIDC → GCP Workload Identity).
  // We retry briefly to ride out a serverless cold start, and only fall back to
  // Firebase's plain email as a true last resort so users are never locked out —
  // the branded email is what should normally always go out.
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("https://admin.nearwork.co/api/send-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          continueUrl: "https://app.nearwork.co/reset-password",
        }),
      });
      if (response.ok) return; // branded email sent successfully
      lastError = new Error(`send-reset responded ${response.status}`);
    } catch (err) {
      lastError = err; // network error — retry, then fall back
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 800));
  }
  // Last-resort fallback: Firebase's built-in (plain) reset email. Should be rare;
  // log it so a failing branded path is visible in the console.
  console.warn("[sendClientPasswordReset] Branded email failed, using Firebase fallback:", lastError);
  await sendPasswordResetEmail(auth, normalizedEmail, {
    url: "https://app.nearwork.co/reset-password",
    handleCodeInApp: false,
  });
}

export async function verifyClientPasswordResetCode(code: string) {
  return verifyPasswordResetCode(auth, code);
}

export async function confirmClientPasswordReset(code: string, password: string) {
  return confirmPasswordReset(auth, code, password);
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  setDoc(doc(db, "users", credential.user.uid), { lastLoginAt: serverTimestamp() }, { merge: true }).catch(() => null);
  return credential;
}

export async function logoutClient() {
  return signOut(auth);
}

export async function linkExistingAccountToOrg(email: string, password: string, invite?: ClientInvite) {
  const normalizedEmail = email.trim().toLowerCase();
  // Sign in with their existing password to verify they own this account
  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  // Write (or overwrite) the org association — uses create rule if doc was deleted,
  // or update rule if doc still exists with a client role
  if (invite?.orgId) {
    await writeClientProfile(credential.user, { ...invite, email: normalizedEmail });
  }
  await signOut(auth);
}

// Temporary diagnostic: returns a one-line summary of exactly what the app sees
// when it looks up the logged-in user's profile, so a single screenshot reveals
// whether the runtime UID matches the Firestore doc and whether the read is denied.
export async function debugProfileLookup(user: User): Promise<string> {
  const errCode = (e: unknown) => (e as { code?: string })?.code || (e instanceof Error ? e.message : String(e));
  const parts: string[] = [`uid=${user.uid}`];
  // Cache-aware read (what the original diagnostic used).
  try {
    const s = await getDoc(doc(db, "users", user.uid));
    parts.push(`cache=${s.exists() ? `FOUND(role=${(s.data() as { role?: string })?.role})` : "MISSING"}`);
  } catch (e) { parts.push(`cache=ERR(${errCode(e)})`); }
  // Authoritative server read (what the login gate now uses).
  try {
    const s = await getDocFromServer(doc(db, "users", user.uid));
    parts.push(`server=${s.exists() ? `FOUND(role=${(s.data() as { role?: string })?.role})` : "MISSING"}`);
  } catch (e) { parts.push(`server=ERR(${errCode(e)})`); }
  // What the gate function actually returns for this user.
  try {
    const p = await getClientUser(user);
    parts.push(`getClientUser=${p ? `role=${p.role},orgId=${p.orgId}` : "null"}`);
  } catch (e) { parts.push(`getClientUser=THREW(${errCode(e)})`); }
  return parts.join(" | ");
}

export async function getClientUser(user: User): Promise<ClientUser | null> {
  const email = user.email?.toLowerCase();
  // Read the profile authoritatively from the server. The plain getDoc() right after
  // onAuthStateChanged can resolve against the still-empty local cache while the
  // connection is coming up and report the doc as "not found" — which previously
  // gated valid clients out as "not invited". getDocFromServer forces a real server
  // round-trip; if the connection/token isn't ready yet it throws, so we retry a few
  // times before falling back to the cache-aware read.
  try { await user.getIdToken(); } catch { /* token already cached */ }
  const userRef = doc(db, "users", user.uid);
  async function readUserSnap() {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await getDocFromServer(userRef);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
    return getDoc(userRef);
  }
  const snap = await readUserSnap();
  const directProfile = snap.exists() ? ({ id: snap.id, ...snap.data() } as ClientUser) : null;

  const memberships = await getClientMemberships(user);
  if (directProfile) {
    const orgIds = [
      directProfile.orgId,
      directProfile.organizationId,
      ...(directProfile.orgIds || []),
      ...memberships.map((membership) => membership.orgId),
    ].filter(Boolean) as string[];
    const uniqueOrgIds = [...new Set(orgIds)];
    const primaryMembership = memberships.find((membership) => membership.orgId === directProfile.activeOrgId)
      || memberships.find((membership) => membership.orgId === directProfile.orgId || membership.orgId === directProfile.organizationId)
      || memberships[0];
    return {
      ...directProfile,
      email: directProfile.email || email,
      orgId: directProfile.activeOrgId || directProfile.orgId || directProfile.organizationId || primaryMembership?.orgId,
      orgName: directProfile.orgName || primaryMembership?.orgName,
      orgIds: uniqueOrgIds,
      portalRole: directProfile.portalRole || primaryMembership?.portalRole || primaryMembership?.role,
    };
  }

  if (!email) return null;
  // Wrap in try/catch: a user with no Firestore doc querying across all users
  // by email will get permission denied (rules only allow reading your own doc).
  // Treat that as "no profile found" rather than crashing the entire auth flow.
  let emailProfile: ClientUser | null = null;
  try {
    const byEmail = await getDocs(query(collection(db, "users"), where("email", "==", email), limit(1)));
    emailProfile = byEmail.empty ? null : ({ id: byEmail.docs[0].id, ...byEmail.docs[0].data() } as ClientUser);
  } catch {
    emailProfile = null;
  }
  if (!emailProfile && !memberships.length) return null;
  const primaryMembership = memberships[0];
  return {
    ...(emailProfile || {}),
    id: emailProfile?.id || user.uid,
    uid: user.uid,
    email,
    name: emailProfile?.name || user.displayName || "",
    role: emailProfile?.role || primaryMembership?.role || "client_user",
    portalRole: emailProfile?.portalRole || primaryMembership?.portalRole || primaryMembership?.role || "client_user",
    orgId: emailProfile?.activeOrgId || emailProfile?.orgId || emailProfile?.organizationId || primaryMembership?.orgId,
    orgName: emailProfile?.orgName || primaryMembership?.orgName,
    orgIds: [...new Set([...(emailProfile?.orgIds || []), ...memberships.map((membership) => membership.orgId)].filter(Boolean))],
  } as ClientUser;
}

export async function getClientMemberships(user: User): Promise<OrgMembership[]> {
  const email = user.email?.trim().toLowerCase();
  const requests = [
    getDocs(query(collection(db, "orgMembers"), where("uid", "==", user.uid), limit(10))),
  ];
  if (email) {
    requests.push(getDocs(query(collection(db, "orgMembers"), where("email", "==", email), limit(10))));
  }
  const results = await Promise.allSettled(requests);
  const byId = new Map<string, OrgMembership>();
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.docs.forEach((item) => {
      const data = { id: item.id, ...item.data() } as OrgMembership;
      if (String(data.status || "active").toLowerCase() !== "active") return;
      if (data.orgId) byId.set(item.id, data);
    });
  });
  return [...byId.values()];
}

export async function getOrganization(profile: ClientUser): Promise<Organization | null> {
  const orgId = profile.activeOrgId || profile.orgId || profile.organizationId || profile.orgIds?.[0];
  if (!orgId) return null;
  try {
    const snap = await getDoc(doc(db, "organizations", orgId));
    if (snap.exists()) {
      const data = snap.data();
      return { id: snap.id, orgId: data.orgId || snap.id, name: data.name || profile.orgName || "Client organization", ...data };
    }
    // Doc was read successfully but doesn't exist — org was deleted. Don't fall back.
    return null;
  } catch (err) {
    // Permission or network error — fall back to profile fields so rules propagation delays
    // don't lock out a valid user.
    console.warn("[getOrganization] Could not read organizations collection — using profile data as fallback.", err);
    if (profile.orgName) {
      return { id: orgId, orgId, name: profile.orgName };
    }
    return null;
  }
}

function withId<T>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// Nearwork staff (any @nearwork.co account) get portal access without needing
// a client/org role — they pick which organization's workspace to view.
export function isNearworkEmail(email?: string | null): boolean {
  return String(email || "").trim().toLowerCase().endsWith("@nearwork.co");
}

export async function listAllOrganizations(): Promise<Organization[]> {
  const snap = await getDocs(collection(db, "organizations"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return { id: d.id, orgId: data.orgId || d.id, name: data.name || "Untitled organization", ...data } as Organization;
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export async function setStaffActiveOrg(uid: string, orgId: string | null) {
  await setDoc(doc(db, "users", uid), { activeOrgId: orgId, updatedAt: serverTimestamp() }, { merge: true });
}

// For staff opening a deep link to a specific pipeline (e.g. via a notification),
// resolve the owning organization directly from the pipeline rather than the
// staff member's own profile (which has no fixed org).
export async function getOrgForPipelineCode(code: string): Promise<Organization | null> {
  try {
    const snap = await getDocs(query(collection(db, "pipelines"), where("code", "==", code), limit(1)));
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    const orgId = data.orgId || data.organizationId;
    if (!orgId) return null;
    const orgSnap = await getDoc(doc(db, "organizations", orgId));
    if (!orgSnap.exists()) return null;
    const orgData = orgSnap.data();
    return { id: orgSnap.id, orgId: orgData.orgId || orgSnap.id, name: orgData.name || "Client organization", ...orgData };
  } catch {
    return null;
  }
}

export function subscribeOrgCollection<T>(
  collectionName: string,
  org: Organization,
  callback: (items: T[]) => void,
  extra: QueryConstraint[] = [],
) {
  const ids = [org.orgId, org.id].filter(Boolean);
  const orgIds = [...new Set(ids)].slice(0, 10);
  const fields = ["orgId", "organizationId"];
  const latest = new Map<string, T[]>();

  function emit() {
    const merged = new Map<string, T>();
    latest.forEach((items) => {
      items.forEach((item) => {
        const id = (item as { id?: string }).id;
        if (id) merged.set(id, item);
      });
    });
    callback([...merged.values()]);
  }

  if (!orgIds.length) return () => null;

  const unsubscribers: Unsubscribe[] = fields.map((field) =>
    onSnapshot(query(collection(db, collectionName), where(field, "in", orgIds), ...extra), (snapshot) => {
      latest.set(field, snapshot.docs.map((item) => withId<T>(item.id, item.data())));
      emit();
    }),
  );

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

// Real-time watch on the organization doc so an admin suspending or deleting the org
// takes effect immediately for clients who are already signed in (not just at next login).
export function subscribeOrganization(orgId: string, callback: (org: Organization | null) => void) {
  if (!orgId) return () => null;
  return onSnapshot(
    doc(db, "organizations", orgId),
    (snap) => {
      if (!snap.exists()) { callback(null); return; }
      const data = snap.data();
      callback({ id: snap.id, orgId: data.orgId || snap.id, name: data.name || "Client organization", ...data } as Organization);
    },
    () => callback(null),
  );
}

// Real-time watch on the signed-in user's own profile doc, so suspending/removing the
// user (or deleting their profile) logs them out immediately.
export function subscribeClientProfile(user: User, callback: (profile: ClientUser | null) => void) {
  return onSnapshot(
    doc(db, "users", user.uid),
    (snap) => callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as ClientUser) : null),
    () => callback(null),
  );
}

export function subscribeNotifications(user: User, callback: (items: PortalNotification[]) => void) {
  return onSnapshot(
    query(collection(db, "notifications"), where("recipientUid", "==", user.uid), limit(50)),
    (snapshot) => callback(snapshot.docs.map((item) => withId<PortalNotification>(item.id, item.data()))),
  );
}

export async function markNotificationRead(id: string) {
  await setDoc(doc(db, "notifications", id), { read: true, readAt: serverTimestamp() }, { merge: true });
}

export async function markNotificationUnread(id: string) {
  await setDoc(doc(db, "notifications", id), { read: false, readAt: null }, { merge: true });
}

export async function addClientNote(input: {
  org: Organization;
  profile: ClientUser;
  // A light candidate shape — we write every join key we have so the note is
  // findable from either side (Admin keys by candidateId, the portal by code).
  candidate: { id?: string; code?: string; name?: string; role?: string };
  pipeline?: { code?: string; openingTitle?: string };
  text: string;
  // client_visible = shared with Nearwork · client_internal = this team only
  scope: "client_visible" | "client_internal";
}) {
  const author = input.profile.name || input.profile.email || "Client user";
  const note = {
    candidateId: input.candidate.id || "",
    candidateCode: input.candidate.code || "",
    candidateName: input.candidate.name || "",
    pipelineCode: input.pipeline?.code || "",
    pipelineTitle: input.pipeline?.openingTitle || input.candidate.role || "",
    orgId: input.org.orgId || input.org.id,
    orgName: input.org.name,
    scope: input.scope,
    visibility: input.scope,
    side: "client",
    text: input.text,
    body: input.text, // mirror so Admin's `body` renderer shows it too
    author,
    authorName: author,
    authorEmail: input.profile.email || "",
    authorUid: input.profile.id,
    app: "app.nearwork.co",
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, "candidateNotes"), note);
}

export async function createPipelineRequest(input: {
  org: Organization;
  profile: ClientUser;
  candidate: { id?: string; code?: string; name?: string; role?: string };
  pipeline?: { code?: string; openingTitle?: string };
  type: "advance" | "hire" | "reject" | "interview";
  fromStage?: string;
  toStage?: string;
  reason?: string;
}) {
  const by = input.profile.name || input.profile.email || "Client user";
  const req = {
    orgId: input.org.orgId || input.org.id,
    orgName: input.org.name,
    candidateId: input.candidate.id || "",
    candidateCode: input.candidate.code || "",
    candidateName: input.candidate.name || "",
    pipelineCode: input.pipeline?.code || "",
    pipelineTitle: input.pipeline?.openingTitle || input.candidate.role || "",
    type: input.type,
    fromStage: input.fromStage || "",
    toStage: input.toStage || "",
    reason: input.reason || "",
    status: "pending",
    requestedBy: by,
    requestedByEmail: input.profile.email || "",
    requestedByUid: input.profile.id,
    side: "client",
    app: "app.nearwork.co",
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, "pipelineRequests"), req);
}

export function subscribeOpeningChat(org: Organization, openingCode: string, callback: (items: OpeningChatMessage[]) => void) {
  if (!openingCode) return () => null;
  return onSnapshot(
    query(collection(db, "openingChats"), where("orgId", "in", [org.orgId, org.id].filter(Boolean).slice(0, 10)), where("openingCode", "==", openingCode), limit(100)),
    (snapshot) => callback(snapshot.docs.map((item) => withId<OpeningChatMessage>(item.id, item.data()))),
  );
}

export async function sendOpeningChatMessage(input: {
  org: Organization;
  profile: ClientUser;
  openingCode: string;
  pipelineCode?: string;
  text: string;
}) {
  await addDoc(collection(db, "openingChats"), {
    orgId: input.org.orgId || input.org.id,
    orgName: input.org.name,
    openingCode: input.openingCode,
    pipelineCode: input.pipelineCode || "",
    text: input.text.trim(),
    author: input.profile.name || input.profile.email || "Company user",
    authorEmail: input.profile.email || "",
    authorUid: input.profile.id || input.profile.uid || "",
    authorType: "client",
    createdAt: serverTimestamp(),
    channel: "app.nearwork.co"
  });
}

// ─── Shared pipeline chat (pipeline_messages) ──────────────────────────────
// This is the SAME collection Admin (admin.nearwork.co) reads/writes, keyed by
// the pipeline code, so Nearwork staff and the client see one shared thread.
// Internal Nearwork-only notes (internal === true) are filtered out for clients.

export type PipelineMessageReaction = { emoji: string; userIds: string[] };

export type PipelineMessage = {
  id: string;
  pipelineCode?: string;
  kind?: "msg" | "system" | "interview";
  authorId?: string;
  authorName?: string;
  authorInitials?: string;
  authorOrg?: "nearwork" | "client";
  body?: string;
  text?: string;
  internal?: boolean;
  pinned?: boolean;
  reactions?: PipelineMessageReaction[];
  candidateId?: string;
  candidateName?: string;
  when?: string;
  withWho?: string[];
  createdAt?: unknown;
};

function chatInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "NW"
  );
}

export function subscribePipelineChat(pipelineCode: string, callback: (items: PipelineMessage[]) => void) {
  if (!pipelineCode) {
    console.warn("[pipeline-chat] no pipelineCode — cannot subscribe to chat thread");
    callback([]);
    return () => null;
  }
  // Clients only ever query non-internal messages. This lets Firestore rules
  // safely deny client reads on internal Nearwork-only notes (internal === true)
  // without those notes ever leaving the server. Two equality filters do not
  // require a composite index; we sort client-side.
  return onSnapshot(
    query(
      collection(db, "pipeline_messages"),
      where("pipelineCode", "==", pipelineCode),
      where("internal", "==", false),
      limit(300),
    ),
    (snapshot) => callback(snapshot.docs.map((item) => withId<PipelineMessage>(item.id, item.data()))),
    (err) => {
      console.error("[pipeline-chat] failed to read pipeline_messages", err);
      callback([]);
    },
  );
}

export async function sendPipelineChatMessage(input: {
  pipelineCode: string;
  orgId: string;
  profile: ClientUser;
  orgName?: string;
  text: string;
}) {
  const name = input.profile.name || input.profile.email || "Company user";
  await addDoc(collection(db, "pipeline_messages"), {
    pipelineCode: input.pipelineCode,
    orgId: input.orgId || "",
    kind: "msg",
    authorId: input.profile.id || input.profile.uid || "",
    authorName: name,
    authorInitials: chatInitials(name),
    authorOrg: "client",
    body: input.text.trim(),
    internal: false,
    pinned: false,
    reactions: [],
    orgName: input.orgName || "",
    channel: "app.nearwork.co",
    createdAt: serverTimestamp(),
  });
}

export async function togglePipelineMessageReaction(
  messageId: string,
  emoji: string,
  userId: string,
  current: PipelineMessageReaction[],
) {
  const reactions = (current || []).map((r) => ({ ...r, userIds: [...r.userIds] }));
  const idx = reactions.findIndex((r) => r.emoji === emoji);
  if (idx === -1) {
    reactions.push({ emoji, userIds: [userId] });
  } else {
    const has = reactions[idx].userIds.includes(userId);
    reactions[idx].userIds = has
      ? reactions[idx].userIds.filter((u) => u !== userId)
      : [...reactions[idx].userIds, userId];
    if (reactions[idx].userIds.length === 0) reactions.splice(idx, 1);
  }
  await updateDoc(doc(db, "pipeline_messages", messageId), { reactions });
}

export async function saveNotificationPreferences(uid: string, preferences: ClientUser["notificationPreferences"]) {
  await setDoc(doc(db, "notificationPreferences", uid), {
    uid,
    app: "app.nearwork.co",
    preferences,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateClientProfile(
  uid: string,
  updates: { displayRole?: string; jobTitle?: string; name?: string; firstName?: string; lastName?: string; photoUrl?: string },
) {
  const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.displayRole !== undefined) clean.displayRole = updates.displayRole;
  if (updates.jobTitle !== undefined) clean.jobTitle = updates.jobTitle;
  if (updates.name !== undefined) clean.name = updates.name;
  if (updates.firstName !== undefined) clean.firstName = updates.firstName;
  if (updates.lastName !== undefined) clean.lastName = updates.lastName;
  if (updates.photoUrl !== undefined) clean.photoUrl = updates.photoUrl;
  await setDoc(doc(db, "users", uid), clean, { merge: true });
}

export async function uploadClientAvatar(uid: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `userAvatars/${uid}/avatar.${ext}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}

export function readableRole(raw?: string): string {
  const r = String(raw || "").toLowerCase().replace(/[-_ ]+/g, "_");
  if (r.includes("owner")) return "Owner";
  if (r.includes("ceo") || r.includes("founder")) return "CEO";
  if (r.includes("cto")) return "CTO";
  if (r.includes("hiring_manager") || r.includes("hiring")) return "Hiring Manager";
  if (r.includes("admin")) return "Admin";
  if (r.includes("finance")) return "Finance";
  if (r.includes("recruiter")) return "Recruiter";
  if (r.includes("viewer")) return "Viewer";
  if (r.includes("hr")) return "HR";
  if (raw && raw.length > 0) return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return "Company user";
}
