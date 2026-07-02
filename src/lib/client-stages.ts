// ─── Client-facing pipeline stages — SINGLE SOURCE OF TRUTH ───────────────────
// Admin runs an 8-stage pipeline; partners see 6 stages. This module is the one
// place that mapping lives, shared by pipeline-page.tsx and client-portal.tsx so
// the two can never drift.
//
//   Client (6)     ←  Admin (8)
//   Applied        ←  applied
//   Screening      ←  background-check, interview
//   Technical      ←  assessment
//   Final Round    ←  partner-review, partner-interview
//   Offer          ←  hired
//   Not Selected   ←  not-selected
//
// Legacy stage names stored on old docs are normalized the same way Admin's
// normalizeStage() does, so both apps always agree on where a candidate sits.

export type ClientStageKey =
  | "applied"
  | "screening"
  | "technical"
  | "final-round"
  | "offer"
  | "not-selected";

export const clientStages: Array<{ key: ClientStageKey; label: string }> = [
  { key: "applied",      label: "Applied"      },
  { key: "screening",    label: "Screening"    },
  { key: "technical",    label: "Technical"    },
  { key: "final-round",  label: "Final Round"  },
  { key: "offer",        label: "Offer"        },
  { key: "not-selected", label: "Not Selected" },
];

// Admin's 8 canonical stages → the client's 6.
const ADMIN_TO_CLIENT: Record<string, ClientStageKey> = {
  "applied":           "applied",
  "background-check":  "screening",
  "interview":         "screening",
  "assessment":        "technical",
  "partner-review":    "final-round",
  "partner-interview": "final-round",
  "hired":             "offer",
  "not-selected":      "not-selected",
};

// Mirror of Admin's normalizeStage(): map legacy stage names onto the 8
// canonical Admin stages before translating to the client view.
function normalizeAdminStage(stage: string): string {
  const s = String(stage || "").trim().toLowerCase();
  if (["profile-review", "screening", "shortlisted", "new"].includes(s)) return "applied";
  if (["background-checks", "background"].includes(s)) return "background-check";
  if (["client-interview", "interview_1", "interview_2"].includes(s)) return "interview";
  if (["presented", "client-review", "company-review", "final-review", "offer"].includes(s)) return "partner-review";
  if (["rejected", "withdrawn"].includes(s)) return "not-selected";
  return s;
}

export function clientStageKey(stage?: string): ClientStageKey {
  const normalized = normalizeAdminStage(String(stage || ""));
  return ADMIN_TO_CLIENT[normalized] ?? "applied";
}

export const clientStageTone: Record<ClientStageKey, string> = {
  "applied":      "border-sky-200 bg-sky-50 text-sky-700",
  "screening":    "border-violet-200 bg-violet-50 text-violet-700",
  "technical":    "border-amber-200 bg-amber-50 text-amber-800",
  "final-round":  "border-teal-200 bg-teal-50 text-teal-700",
  "offer":        "border-emerald-200 bg-emerald-50 text-emerald-700",
  "not-selected": "border-red-200 bg-red-50 text-red-700",
};
