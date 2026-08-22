"use client";

// ── "What should we call you?" ───────────────────────────────────────────────
// A profile can reach the portal with no name on it. Everywhere a name is shown
// we fall back to the email's local part, which is usually right — but a guess
// is a poor thing to stamp onto a note or a request, because the author is
// written at the moment it is posted and nobody can correct it afterwards.
//
// So the first time someone arrives without a name, we ask once. It is skippable:
// the guess is good enough that blocking entry over it would be worse than the
// problem. Skipping is remembered per account, so nobody is asked twice.

import { useState } from "react";
import { NW } from "./primitives";
import { updateClientProfile, displayNameOf } from "@/lib/firebase-client";

const SKIP_KEY = "nw_name_prompt_skipped";

export function shouldAskForName(profile: { id?: string; uid?: string; name?: string; firstName?: string; email?: string } | null): boolean {
  if (!profile) return false;
  const has = (profile.name || profile.firstName || "").trim();
  // A "name" that is actually an email is not a name — some records store the
  // address in the name field, which is how the greeting showed it in the first place.
  if (has && !has.includes("@")) return false;
  if (typeof window === "undefined") return false;
  const uid = profile.id || profile.uid || "";
  try {
    return localStorage.getItem(`${SKIP_KEY}:${uid}`) !== "1";
  } catch {
    return true;
  }
}

export function NamePrompt({
  profile,
  onDone,
}: {
  profile: { id?: string; uid?: string; name?: string; firstName?: string; lastName?: string; email?: string };
  onDone: (saved?: { name: string; firstName: string; lastName: string }) => void;
}) {
  const uid = profile.id || profile.uid || "";
  // Pre-filled with the guess, so for most people this is one glance and Save
  // rather than a form to complete.
  const [value, setValue] = useState(displayNameOf(profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function remember() {
    try { localStorage.setItem(`${SKIP_KEY}:${uid}`, "1"); } catch { /* private mode */ }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const full = value.trim().replace(/\s+/g, " ");
    if (!full) { setError("Please enter a name, or skip for now."); return; }
    if (full.includes("@")) { setError("That looks like an email address — what should we call you?"); return; }
    setSaving(true);
    setError("");
    try {
      const parts = full.split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ");
      await updateClientProfile(uid, { name: full, firstName, lastName });
      remember();
      onDone({ name: full, firstName, lastName });
    } catch {
      setError("Could not save that. You can set it later in Settings.");
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nw-name-prompt-title"
      style={{
        position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center",
        // A solid ground, not a scrim. This renders before the portal does, so a
        // translucent overlay would be floating over an empty page.
        background: "#F5F4F0", padding: 20,
      }}
    >
      <form
        onSubmit={save}
        style={{
          width: "100%", maxWidth: 420, background: "#fff", borderRadius: 18,
          padding: "28px 28px 24px", boxShadow: "0 24px 60px -34px rgba(11,21,18,.28)",
          border: "1px solid #E6E4DE",
        }}
      >
        <div id="nw-name-prompt-title" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.02em", color: NW.black }}>
          What should we call you?
        </div>
        <p style={{ fontSize: 13.5, color: NW.gray600, lineHeight: 1.55, marginTop: 8 }}>
          This is the name your team and Nearwork see on your notes and requests.
        </p>

        <label style={{ display: "block", marginTop: 18 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#383838", marginBottom: 8 }}>Full name</span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Jane Doe"
            style={{
              width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 15,
              padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${NW.gray200}`,
              outline: "none", color: "#111",
            }}
          />
        </label>

        {error && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "#B91C1C" }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1, fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: "#fff",
              background: NW.teal600, border: "none", borderRadius: 12, padding: "12px 16px",
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { remember(); onDone(); }}
            style={{
              fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, color: NW.gray600,
              background: "transparent", border: "none", cursor: "pointer", padding: "12px 6px",
            }}
          >
            Not now
          </button>
        </div>
      </form>
    </div>
  );
}
