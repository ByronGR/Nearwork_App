// ── Real data → Users screen props (Stage 8 wiring) ───────────────────────────
// The client's own team members live on the organization doc (`orgUsers`), which
// the client can read. Empty until the org has members.

import type { Organization } from "@/lib/firebase-client";
import type { UsersData, PortalUserRow, PortalUserRole } from "./screens/users";
import { initialsOf, avatarColor } from "./stage-map";

type Rec = Record<string, unknown>;
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

const ROLES: PortalUserRole[] = [
  { id: "admin", label: "Admin", desc: "Full access — manage the team, billing, and approvals.", can: ["Manage users & roles", "View billing", "Approve kickoffs & PTO"], color: "#16A085" },
  { id: "member", label: "Member", desc: "Works the pipeline and hires day to day.", can: ["View pipeline & candidates", "Add notes", "Request interviews"], color: "#3B82F6" },
  { id: "viewer", label: "Viewer", desc: "Read-only access to the workspace.", can: ["View pipeline & team", "No edits"], color: "#8A857C" },
];

function mapRole(r: string): string {
  const v = r.toLowerCase();
  if (v.includes("admin")) return "admin";
  if (v.includes("view")) return "viewer";
  return "member";
}

export function toUsersData(org: Organization | null, currentEmail?: string): UsersData {
  const raw = (org as unknown as { orgUsers?: unknown } | null)?.orgUsers;
  const list = Array.isArray(raw) ? (raw as Rec[]) : [];
  const users: PortalUserRow[] = list.map((u, i) => {
    const name = str(u.name) || str(u.displayName) || str(u.email) || "Team member";
    const email = str(u.email);
    return {
      id: str(u.uid) || str(u.id) || email || String(i),
      name,
      email,
      initials: initialsOf(name),
      avatarBg: avatarColor(email || name),
      role: mapRole(str(u.role) || str(u.portalRole)),
      status: (str(u.status) === "invited" ? "invited" : "active"),
      lastActive: str(u.lastActive),
      you: currentEmail ? email.toLowerCase() === currentEmail.toLowerCase() : false,
    };
  });
  return { users, roles: ROLES };
}
