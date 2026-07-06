// ── Real data → Settings screen props (Stage 9 wiring) ────────────────────────
import type { ClientUser } from "@/lib/firebase-client";
import type { SettingsData, NotifState, SettingsNotificationPrefs } from "./screens/settings";

// The 9 notification types the portal exposes. Keep in sync with settings.tsx.
const NOTIF_KEYS: (keyof SettingsNotificationPrefs)[] = [
  "newCandidate",
  "stageMove",
  "assessmentReady",
  "declined",
  "notes",
  "requests",
  "kickoff",
  "newHire",
  "weekly",
];

// Keys that default to In-app ("app") when unset. Everything else defaults Off.
const DEFAULT_ON = new Set<keyof SettingsNotificationPrefs>([
  "newCandidate",
  "stageMove",
  "notes",
  "requests",
  "kickoff",
]);

// Stored { app, email } → 3-state. When a key has no saved value, fall back to
// its per-key default: "app" if it's in DEFAULT_ON, else "off".
function toState(
  key: keyof SettingsNotificationPrefs,
  pref: { app?: boolean; email?: boolean } | undefined,
): NotifState {
  if (!pref) return DEFAULT_ON.has(key) ? "app" : "off";
  if (!pref.app && !pref.email) return "off";
  if (pref.app && pref.email) return "both";
  return "app"; // { app:true, email:false } — also the fallback for any partial
}

export function toSettingsData(profile: ClientUser | null): SettingsData {
  const prefs = (profile?.notificationPreferences ?? {}) as Record<string, { app?: boolean; email?: boolean }>;
  const notifications = {} as SettingsNotificationPrefs;
  for (const k of NOTIF_KEYS) notifications[k] = toState(k, prefs[k]);
  return {
    profile: { email: profile?.email ?? "" },
    notifications,
  };
}
