// ── Real data → Settings screen props (Stage 9 wiring) ────────────────────────
import type { ClientUser } from "@/lib/firebase-client";
import type { SettingsData, NotifState, SettingsNotificationPrefs } from "./screens/settings";

// The 7 notification types the portal exposes. Keep in sync with settings.tsx.
const NOTIF_KEYS: (keyof SettingsNotificationPrefs)[] = [
  "candidates",
  "notes",
  "requests",
  "kickoff",
  "team",
  "billing",
  "weekly",
];

// Stored { app, email } → 3-state. Default "app" (In-app) when a key has no
// saved value.
function toState(pref: { app?: boolean; email?: boolean } | undefined): NotifState {
  if (!pref) return "app";
  if (!pref.app && !pref.email) return "off";
  if (pref.app && pref.email) return "both";
  return "app"; // { app:true, email:false } — also the fallback for any partial
}

export function toSettingsData(profile: ClientUser | null): SettingsData {
  const prefs = (profile?.notificationPreferences ?? {}) as Record<string, { app?: boolean; email?: boolean }>;
  const notifications = {} as SettingsNotificationPrefs;
  for (const k of NOTIF_KEYS) notifications[k] = toState(prefs[k]);
  return {
    profile: { email: profile?.email ?? "" },
    notifications,
  };
}
