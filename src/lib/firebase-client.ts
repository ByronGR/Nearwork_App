"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
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
  notificationPreferences?: Record<string, { app?: boolean; email?: boolean }>;
};

export type Organization = {
  id: string;
  orgId: string;
  name: string;
  domain?: string;
  plan?: string;
  status?: string;
  seats?: number;
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
  applications?: unknown[];
  pipelineCodes?: string[];
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

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function logoutClient() {
  return signOut(auth);
}

export async function getClientUser(user: User): Promise<ClientUser | null> {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() } as ClientUser;

  const email = user.email?.toLowerCase();
  if (!email) return null;
  const byEmail = await getDocs(query(collection(db, "users"), where("email", "==", email), limit(1)));
  return byEmail.empty ? null : ({ id: byEmail.docs[0].id, ...byEmail.docs[0].data() } as ClientUser);
}

export async function getOrganization(profile: ClientUser): Promise<Organization | null> {
  const orgId = profile.orgId || profile.organizationId;
  if (orgId) {
    const snap = await getDoc(doc(db, "organizations", orgId));
    if (snap.exists()) {
      const data = snap.data();
      return { id: snap.id, orgId: data.orgId || snap.id, name: data.name || profile.orgName || "Client organization", ...data };
    }
  }
  const domain = profile.email?.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  const byDomain = await getDocs(query(collection(db, "organizations"), where("domain", "==", domain), limit(1)));
  if (byDomain.empty) return null;
  const data = byDomain.docs[0].data();
  return { id: byDomain.docs[0].id, orgId: data.orgId || byDomain.docs[0].id, name: data.name || "Client organization", ...data };
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

export async function saveNotificationPreferences(uid: string, preferences: ClientUser["notificationPreferences"]) {
  await setDoc(doc(db, "notificationPreferences", uid), {
    uid,
    app: "app.nearwork.co",
    preferences,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
