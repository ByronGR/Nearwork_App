# Smoke Test — run after every deploy

A 60-second manual check that the core account flows still work. If all three
pass, the critical path (account creation, login, password reset) is intact.

> **First step every time:** hard-refresh the page (**Cmd + Shift + R**) so you
> are testing the freshly deployed code, not an old tab in memory.

---

## 1. Login
- [ ] Go to app.nearwork.co and log in with a known client account.
- [ ] You land in the portal (no "Something went wrong loading your portal" /
      no "permission-denied"). 
- [ ] If you see `permission-denied`: the **Firestore Rules** were clobbered.
      Fix = republish `firestore.rules` (see "Rules" note below).

## 2. Password reset (branded email)
- [ ] On the login screen click **Send password reset** for the test address.
- [ ] Open the **newest** email. It must be the **branded HTML** one
      (Nearwork header, "Reset my password →" button).
- [ ] The link looks like `…/reset-password?oobCode=…&email=…`
      (NOT `?mode=resetPassword&…&apiKey=…` — that format is the plain Firebase
      fallback and means `/api/send-reset` failed).
- [ ] Click it, set a password that satisfies all the on-screen checkmarks, save,
      and confirm it logs you in.

## 3. Invite / account creation
- [ ] In Admin, send an invite to a test address.
- [ ] Email sender shows **"Nearwork"** (not "noreply"); greeting is
      "Welcome to Nearwork! Your account is almost ready."
- [ ] Click the setup link → create password → land in the portal.

---

## Notes / known gotchas

- **Firestore vs Storage rules are two separate Firebase Console tabs.** The
  Firestore tab must start with `service cloud.firestore`; the Storage tab with
  `service firebase.storage`. Pasting one into the other breaks ALL reads →
  `permission-denied` on every login. Source of truth: `firestore.rules` in this
  repo (Firestore) and `storage.rules` in the Admin repo (Storage). Rules are
  published by hand in the console — there is no `firebase.json` auto-deploy.

- **Do-not-touch unless the task is specifically about auth:** the login/reset
  logic lives in `src/lib/firebase-client.ts` (`sendClientPasswordReset`,
  `getClientUser`, `getOrganization`) and `src/components/client-portal.tsx`
  (the `onAuthStateChanged` portal-load handler). Changing these risks the bugs
  already fixed — run this whole checklist if you do.

- **Branded reset email** is sent by Admin's `/api/send-reset` (Vercel OIDC → GCP
  Workload Identity, no key). Quick health check from a terminal:
  `curl -X POST https://admin.nearwork.co/api/send-reset -H "Content-Type: application/json" -d '{"email":"<test>","continueUrl":"https://app.nearwork.co/reset-password"}'`
  → expect `{"success":true,"id":"…"}`.
