// ═══════════════════════════════════════════
// Nearwork — Firebase Config & Auth Utilities
// ═══════════════════════════════════════════
// Import this file in every HTML page that needs Firebase

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ─── Config ───────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyApRNyW8PoP28E0x77dUB5jOgHuTqA2by4",
  authDomain: "nearwork-97e3c.firebaseapp.com",
  projectId: "nearwork-97e3c",
  storageBucket: "nearwork-97e3c.firebasestorage.app",
  messagingSenderId: "145642656516",
  appId: "1:145642656516:web:0ac2da8931283121e87651",
  measurementId: "G-3LC8N6FFSH"
};

// ─── Init ─────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const gProvider = new GoogleAuthProvider();

// ─── Role config ──────────────────────────
const PUBLIC_DOMAINS = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com',
  'icloud.com','live.com','protonmail.com','aol.com',
  'mail.com','googlemail.com'
];
const ADMIN_DOMAINS = ['nearwork.co','nearwork.staffing'];

export function getDomain(email) {
  return (email || '').split('@')[1]?.toLowerCase() || '';
}
export function isPublicDomain(email) {
  return PUBLIC_DOMAINS.includes(getDomain(email));
}
export function isAdminDomain(email) {
  return ADMIN_DOMAINS.includes(getDomain(email));
}
export function guessRole(email) {
  if (isAdminDomain(email)) return 'admin';
  if (isPublicDomain(email)) return 'candidate';
  return 'client';
}

// ─── Firestore helpers ────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// ─── Redirect by role ─────────────────────
export function redirectByRole(role) {
  const map = {
    candidate: 'candidate-dashboard.html',
    client:    'client-dashboard.html',
    admin:     'admin-dashboard.html'
  };
  window.location.href = map[role] || 'login.html';
}

// ─── Auth state guard ─────────────────────
// Call this on dashboard pages to redirect if not logged in
export function requireAuth(expectedRole = null) {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        window.location.href = 'login.html';
        return;
      }
      if (expectedRole && profile.role !== expectedRole && profile.role !== 'admin') {
        redirectByRole(profile.role);
        return;
      }
      resolve({ user, profile });
    });
  });
}

// ─── Google sign in ───────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, gProvider);
  return result.user;
}

// ─── Sign out ─────────────────────────────
export async function signOutUser() {
  await signOut(auth);
  window.location.href = 'login.html';
}

// Export everything needed
export { auth, db, gProvider, onAuthStateChanged, serverTimestamp,
         signInWithEmailAndPassword, createUserWithEmailAndPassword,
         sendPasswordResetEmail, doc, setDoc, getDoc, collection,
         query, where, getDocs };
