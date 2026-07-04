// ── Stage 0 foundation: the ONE stage map + shared candidate helpers ───────────
// Admin's 8 internal pipeline stages → the 6 client-facing stages. Every screen
// that shows a candidate (Overview, Open roles, Pipeline, Candidate, Compare)
// imports from here, so the translation is defined once and never drifts.
// Mirrors clientStageKey() in components/client-portal.tsx.

export const CLIENT_STAGES = ["applied", "screening", "technical", "final-round", "offer"] as const;
export type ClientStageKey = (typeof CLIENT_STAGES)[number] | "not-selected";

export const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  technical: "Technical",
  "final-round": "Final round",
  offer: "Offer",
  "not-selected": "Not selected",
};

// Admin stage name → client-facing stage key.
export function clientStageKey(stage?: string): ClientStageKey {
  const s = String(stage || "").toLowerCase().replace(/[-_ ]/g, "");
  if (s.includes("pass") || s.includes("reject") || s.includes("notselect") || s.includes("declined") || s.includes("disqualif")) return "not-selected";
  if (s.includes("hired") || s.includes("offer")) return "offer";
  if (s.includes("partner") || s.includes("present") || s.includes("clientview") || s.includes("clientreview") || s.includes("final")) return "final-round";
  if (s.includes("interview") || s.includes("assess") || s.includes("tech") || s.includes("test")) return "technical";
  if (s.includes("background") || s.includes("bgcheck") || s.includes("screening") || s.includes("profile")) return "screening";
  return "applied";
}

// 1-based index over CLIENT_STAGES; "not-selected" → 6.
export function stageIdxOf(key: ClientStageKey): number {
  if (key === "not-selected") return 6;
  const i = CLIENT_STAGES.indexOf(key);
  return i >= 0 ? i + 1 : 1;
}

const AVATAR_BGS = ["#16A085", "#E74C7C", "#AF7AC5", "#12866E", "#EAB308", "#3B82F6", "#F97316", "#8B5CF6"];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_BGS[Math.abs(h) % AVATAR_BGS.length];
}

export function initialsOf(name?: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
