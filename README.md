# Nearwork App Portal

Client portal for `app.nearwork.co`.

Clients can log in, review openings and pipeline candidates, add client-visible or client-internal notes, see notifications, and manage notification preferences.

## Environment Variables

Add these to Vercel for Production and Preview:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nearwork-97e3c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nearwork-97e3c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nearwork-97e3c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=145642656516
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Also add `app.nearwork.co` to Firebase Auth authorized domains.

## Firebase Data Used

- `users`: client portal users with `role` or `portalRole`, plus `orgId` or `organizationId`.
- `organizations`: company profile.
- `openings`: roles created by Admin.
- `pipelines`: client-visible pipeline and embedded candidate rows.
- `candidates`: optional candidate profile enrichment when the candidate has the same `orgId`.
- `candidateNotes`: client-visible and client-internal notes.
- `notifications`: in-app notification bell.
- `notificationPreferences`: app/email notification settings.

Copy `firestore.rules` into Firebase Rules when deploying the portal.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
