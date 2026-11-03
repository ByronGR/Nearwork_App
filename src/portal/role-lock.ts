// ── Role lifecycle status, as the client sees it ─────────────────────────────
// One source of truth for two things the portal kept getting wrong:
//
//   1. What badge a role shows. The card used to ask `status === "active"` and
//      print "Sourcing" for everything else — so a role Nearwork had CANCELLED
//      still read "Sourcing · in progress" to the client.
//   2. Whether the client may still act on the role. A cancelled role is a
//      record, not a workspace: it stays readable, but every control that would
//      ask Nearwork to do something is locked.
//
// Admin writes these values onto `openings/{code}.status` (see Admin's
// pipeline-page `updatePipelineStatus`, which mirrors a pipeline pause/cancel
// onto the opening). Keep this list in step with that writer.

import { NW } from "./primitives";

/** Shown wherever a locked role blocks an action. Byron's wording — keep it. */
export const LOCKED_MESSAGE =
  "You currently don't have access to edit anything, please contact your Account Manager for more information.";

export type RoleStatus = "active" | "sourcing" | "paused" | "filled" | "cancelled";

/**
 * Collapse whatever Admin wrote into the five states the portal renders.
 * Unknown values fall back to "sourcing" — the old catch-all — so a new Admin
 * status degrades to a neutral badge rather than an empty one.
 */
export function normalizeRoleStatus(raw?: string | null): RoleStatus {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "open" || s === "active" || s === "") return "active";
  if (s === "draft" || s === "pending") return "sourcing";
  if (s === "paused" || s === "on-hold" || s === "on_hold") return "paused";
  if (s === "filled" || s === "closed") return "filled";
  if (s === "cancelled" || s === "canceled" || s === "archived") return "cancelled";
  return "sourcing";
}

/**
 * Can the client still act on this role?
 *
 * Cancelled only, for now. `paused` and `filled` are deliberately NOT locked —
 * a paused role resumes, and a filled one may still have candidates mid-flow.
 * If those should lock too it is one entry each in this list.
 */
const LOCKED: ReadonlySet<RoleStatus> = new Set<RoleStatus>(["cancelled"]);

export function isRoleLocked(raw?: string | null): boolean {
  return LOCKED.has(normalizeRoleStatus(raw));
}

export type RoleBadge = {
  label: string;
  bg: string;
  fg: string;
  dot: string;
  border: string;
};

/** Badge styling per state. Only `active` keeps the teal "live" treatment. */
export const ROLE_BADGE: Record<RoleStatus, RoleBadge> = {
  active: { label: "Active", bg: NW.teal50, fg: NW.teal700, dot: NW.teal500, border: "#16A08522" },
  sourcing: { label: "Sourcing", bg: NW.gray50, fg: NW.gray500, dot: NW.gray400, border: NW.gray100 },
  paused: { label: "Paused", bg: NW.yellow50, fg: NW.gray700, dot: NW.yellow500, border: "#EAB30833" },
  filled: { label: "Filled", bg: NW.green50, fg: NW.green600, dot: NW.green500, border: "#22C55E33" },
  cancelled: { label: "Cancelled", bg: NW.rose50, fg: NW.rose600, dot: NW.rose500, border: "#E74C7C33" },
};

export function roleBadgeFor(raw?: string | null): RoleBadge {
  return ROLE_BADGE[normalizeRoleStatus(raw)];
}
