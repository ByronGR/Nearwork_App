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
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type Unsubscribe,
  type QueryConstraint,
} from "firebase/firestore";

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
  role?: string;
  portalRole?: string;
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
  accountManagerName?: string;
  accountManagerEmail?: string;
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
  status?: string;
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
  salary?: string;
  expectedSalary?: string;
  expectedSalaryAmount?: number;
  expectedSalaryCurrency?: string;
  city?: string;
  location?: string;
  skills?: string[];
  cvUrl?: string;
  linkedin?: string;
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
  candidateCode?: string;
  pipelineCode?: string;
  pipelineTitle?: string;
  orgId?: string;
  orgName?: string;
  scope?: string;
  visibility?: string;
  text?: string;
  author?: string;
  authorUid?: string;
  authorEmail?: string;
  createdAt?: unknown;
};

export type PortalNotification = {
  id: string;
  title?: string;
  message?: string;
  read?: boolean;
  createdAt?: unknown;
  candidateCode?: string;
  pipelineCode?: string;
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
  return signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function createClientAccount(email: string, password: string, invite?: {
  orgId?: string;
  orgName?: string;
  portalRole?: string;
  firstName?: string;
  lastName?: string;
  businessRole?: string;
  token?: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  if (invite?.orgId) {
    const inviteDocId = ("invite_" + invite.orgId + "_" + normalizedEmail).replace(/[^a-z0-9_-]+/g, "_").slice(0, 150);
    const name = [invite.firstName, invite.lastName].filter(Boolean).join(" ") || credential.user.displayName || normalizedEmail;
    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
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
      source: "app.nearwork.co",
      invitePending: false,
      onboarded: true,
      createdFromInvite: true,
      acceptedInviteId: invite.token || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    try {
      await setDoc(doc(db, "orgInvites", inviteDocId), {
        email: normalizedEmail,
        uid: credential.user.uid,
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
  return credential;
}

export async function sendClientPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  // Use Firebase's built-in password reset — no Admin SDK credentials required.
  // The user receives a Firebase password reset email; clicking the link brings
  // them back to app.nearwork.co/reset-password where they enter a new password.
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
  return signInWithPopup(auth, googleProvider);
}

export async function logoutClient() {
  return signOut(auth);
}

export async function linkExistingAccountToOrg(email: string, password: string, invite?: {
  orgId?: string;
  orgName?: string;
  portalRole?: string;
  firstName?: string;
  lastName?: string;
  businessRole?: string;
  token?: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  // Sign in with their existing password to verify they own this account
  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  const uid = credential.user.uid;
  // Write (or overwrite) the org association — uses create rule if doc was deleted,
  // or update rule if doc still exists with a client role
  if (invite?.orgId) {
    await setDoc(doc(db, "users", uid), {
      uid,
      email: normalizedEmail,
      role: "client",
      portalRole: invite.portalRole || "viewer_client",
      orgId: invite.orgId,
      organizationId: invite.orgId,
      orgName: invite.orgName || "",
      businessRole: invite.businessRole || "",
      title: invite.businessRole || "",
      invitePending: false,
      onboarded: true,
      acceptedInviteId: invite.token || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  await signOut(auth);
}

export async function getClientUser(user: User): Promise<ClientUser | null> {
  const email = user.email?.toLowerCase();
  const snap = await getDoc(doc(db, "users", user.uid));
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

export function subscribeNotifications(user: User, callback: (items: PortalNotification[]) => void) {
  return onSnapshot(
    query(collection(db, "notifications"), where("recipientUid", "==", user.uid), limit(50)),
    (snapshot) => callback(snapshot.docs.map((item) => withId<PortalNotification>(item.id, item.data()))),
  );
}

export async function markNotificationRead(id: string) {
  await setDoc(doc(db, "notifications", id), { read: true, readAt: serverTimestamp() }, { merge: true });
}

export async function addClientNote(input: {
  org: Organization;
  profile: ClientUser;
  candidate: PortalCandidate;
  pipeline?: PortalPipeline;
  text: string;
  scope: "client_visible" | "client_internal";
}) {
  const note = {
    candidateCode: input.candidate.code,
    candidateName: input.candidate.name,
    pipelineCode: input.pipeline?.code || "",
    pipelineTitle: input.pipeline?.openingTitle || input.candidate.role || "",
    orgId: input.org.orgId || input.org.id,
    orgName: input.org.name,
    scope: input.scope,
    visibility: input.scope,
    text: input.text,
    author: input.profile.name || input.profile.email || "Client user",
    authorEmail: input.profile.email || "",
    authorUid: input.profile.id,
    app: "app.nearwork.co",
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, "candidateNotes"), note);
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

export async function saveNotificationPreferences(uid: string, preferences: ClientUser["notificationPreferences"]) {
  await setDoc(doc(db, "notificationPreferences", uid), {
    uid,
    app: "app.nearwork.co",
    preferences,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
