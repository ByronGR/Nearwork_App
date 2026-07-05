// ── Real data → Users screen props (Stage 8 wiring) ───────────────────────────
// The client's own team members live on the organization doc (`orgUsers`), which
// the client can read. Empty until the org has members.

import type { Organization } from "@/lib/firebase-client";
import type { UsersData, PortalUserRow, PortalUserRole } from "./screens/users";
import { avatarColor } from "./stage-map";

type Rec = Record<string, unknown>;
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// A member's display name: explicit name, else first+last, else a prettified
// email local part (e.g. "john.doe@x.com" → "John Doe"). Never the raw email —
// otherwise the row would show the email twice (as the name and as the email).
function displayName(u: Rec): string {
  const explicit = str(u.name) || str(u.displayName);
  if (explicit) return explicit;
  const combined = [str(u.firstName), str(u.lastName)].filter(Boolean).join(" ");
  if (combined) return combined;
  const local = str(u.email).split("@")[0];
  if (local) return local.split(/[._+-]+/).filter(Boolean).map(cap).join(" ");
  return "Team member";
}

// Initials = first letter of first name + first letter of last name.
function initialsFor(u: Rec, name: string): string {
  const fn = str(u.firstName), ln = str(u.lastName);
  if (fn || ln) return ((fn[0] || "") + (ln[0] || "")).toUpperCase();
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (words[0]?.slice(0, 2) || "?").toUpperCase();
}

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
    const name = displayName(u);
    const email = str(u.email);
    return {
      id: str(u.uid) || str(u.id) || email || String(i),
      name,
      email,
      initials: initialsFor(u, name),
      avatarBg: avatarColor(email || name),
      role: mapRole(str(u.role) || str(u.portalRole)),
      status: (str(u.status) === "invited" ? "invited" : "active"),
      lastActive: str(u.lastActive),
      you: currentEmail ? email.toLowerCase() === currentEmail.toLowerCase() : false,
    };
  });
  return { users, roles: ROLES };
}
