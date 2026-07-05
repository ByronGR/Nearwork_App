// ── Real data → SPP screen props (Stage 7 wiring) ─────────────────────────────
// The SPP screen is only populated for strategic-partner orgs with sub-clients.
// Sub-clients live as separate org docs (parentOrgId) which a client can't read
// directly, so the portfolio is empty until that feed is wired server-side — the
// screen shows its "not a strategic partner" empty state until then.

import type { SppData, SppStatusMap, SppBilling } from "./screens/spp";

const STATUS: SppStatusMap = {
  active: { label: "Active", color: "#0F6E56", bg: "#E1F5EE", dot: "#16A085" },
  onboarding: { label: "Onboarding", color: "#A16207", bg: "#FAEEDA", dot: "#EAB308" },
  paused: { label: "Paused", color: "#5F5E5A", bg: "#F1EFE8", dot: "#888780" },
};
const BILLING: SppBilling = {
  subscription: "—", tier: "—", placementList: "—", placementSpp: "—", discountNote: "", total: "—",
};

export function toSppData(): SppData {
  return { status: STATUS, billing: BILLING, clients: [], reviewCategories: [], partnerTzShort: "Partner" };
}
