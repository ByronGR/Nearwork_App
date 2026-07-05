// ── Real data → Settings screen props (Stage 9 wiring) ────────────────────────
import type { ClientUser } from "@/lib/firebase-client";
import type { SettingsData } from "./screens/settings";

export function toSettingsData(profile: ClientUser | null): SettingsData {
  const prefs = (profile?.notificationPreferences ?? {}) as Record<string, { app?: boolean; email?: boolean }>;
  const on = (k: string, d: boolean) => (prefs[k]?.app ?? prefs[k]?.email ?? d);
  return {
    profile: { email: profile?.email ?? "" },
    notifications: {
      newCandidate: on("newCandidate", true),
      interview: on("interview", true),
      pto: on("pto", true),
      kickoff: on("kickoff", true),
      billing: on("billing", true),
      weekly: on("weekly", false),
    },
  };
}
