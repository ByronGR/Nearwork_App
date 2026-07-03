// Placeholder data for the new portal screens (Sprint 2, visual phase).
// Real Firebase data replaces this in the wiring phase — the screens already
// take this shape as props, so it's a drop-in swap.

import type { PortalClient } from "./shell";
import type { OverviewData } from "./screens/overview";

export const MOCK_CLIENT: PortalClient = {
  company: "Lumen Health",
  user: { name: "Sarah Mitchell", initials: "SM", role: "Head of Engineering" },
  accountManager: { name: "Jesus Buitrago", email: "jesus.buitrago@nearwork.co", initials: "JB" },
};

export const MOCK_OVERVIEW: OverviewData = {
  dateLabel: "Friday, May 23",
  greetingName: "Sarah",
  stats: {
    review: { value: 5, label: "Awaiting review", trend: "2 over 48h" },
    interviews: { value: 4, label: "Interviews", trend: "+2 vs last week" },
    openings: { value: 4, label: "Active openings", trend: "12 days avg open" },
  },
  candidates: [
    { id: 1, name: "Maria Castro", initials: "MC", avatarBg: "#16A085", location: "Bogotá", role: "Sr. Backend Engineer", stage: "Technical", stageIdx: 3, score: 94, awaitingDays: 1 },
    { id: 2, name: "Carlos Mejía", initials: "CM", avatarBg: "#E74C7C", location: "Medellín", role: "Product Designer", stage: "Final round", stageIdx: 4, score: 88, awaitingDays: 2 },
    { id: 3, name: "Valeria López", initials: "VL", avatarBg: "#AF7AC5", location: "Cali", role: "Sr. Backend Engineer", stage: "Technical", stageIdx: 3, score: 91, awaitingDays: 0 },
    { id: 4, name: "Diego Restrepo", initials: "DI", avatarBg: "#12866E", location: "Bogotá", role: "Backend Engineer", stage: "Screening", stageIdx: 2, score: 79, awaitingDays: 3 },
    { id: 5, name: "Ana Gómez", initials: "AG", avatarBg: "#EAB308", location: "Barranquilla", role: "Sr. Backend Engineer", stage: "Screening", stageIdx: 2, score: 85, awaitingDays: 1 },
    { id: 6, name: "Luis Herrera", initials: "LH", avatarBg: "#3B82F6", location: "Medellín", role: "DevOps Engineer", stage: "Final round", stageIdx: 4, score: 89, awaitingDays: 0 },
    { id: 7, name: "Sofía Torres", initials: "ST", avatarBg: "#E74C7C", location: "Bogotá", role: "Product Designer", stage: "Offer", stageIdx: 5, score: 92, awaitingDays: 0 },
    { id: 8, name: "Andrés Ruiz", initials: "AR", avatarBg: "#AF7AC5", location: "Cali", role: "Sr. Backend Engineer", stage: "Applied", stageIdx: 1, score: 81, awaitingDays: 1 },
  ],
  interviews: [
    { id: 1, day: "MON", date: "May 26", who: "Maria Castro", initials: "MC", avatarBg: "#16A085", time: "10:00 AM", kind: "Technical screen" },
    { id: 2, day: "TUE", date: "May 27", who: "Carlos Mejía", initials: "CM", avatarBg: "#E74C7C", time: "2:30 PM", kind: "Portfolio review" },
    { id: 3, day: "WED", date: "May 28", who: "Luis Herrera", initials: "LH", avatarBg: "#3B82F6", time: "11:00 AM", kind: "Final round" },
  ],
  activity: [
    { id: 1, type: "advance", who: "Valeria López", what: "advanced to Technical.", when: "2h ago", initials: "VL", avatarBg: "#AF7AC5" },
    { id: 2, type: "new", who: "Andrés Ruiz", what: "was added to your pipeline.", when: "5h ago", initials: "AR", avatarBg: "#AF7AC5" },
    { id: 3, type: "note", who: "Nearwork", what: "left a note on Maria Castro.", when: "Yesterday", initials: "NW", avatarBg: "#111111" },
    { id: 4, type: "interview", who: "Carlos Mejía", what: "interview was scheduled.", when: "Yesterday", initials: "CM", avatarBg: "#E74C7C" },
  ],
};
