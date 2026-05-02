import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CreditCard,
  FileCheck2,
  Home,
  MessageSquareText,
  Scale,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  XCircle,
} from "lucide-react";

export type AccessRole = "Admin" | "User";
export type CandidateStage =
  | "Shortlisted"
  | "Client interview"
  | "Final review"
  | "Offer"
  | "Hired"
  | "Not selected";

export type Candidate = {
  id: string;
  name: string;
  role: string;
  location: string;
  salary: string;
  availability: string;
  stage: CandidateStage;
  nearworkScore: number;
  englishScore: string;
  experience: string;
  strengths: string[];
  risks: string[];
  progression: string;
  recruiter: string;
  csm: string;
  lastTouch: string;
  cvStatus: "Ready" | "Needs refresh";
  clientRating?: number;
  rejectionReason?: string;
  processNotes: string;
  assessment: {
    english: string;
    technical: string;
    culture: string;
    summary: string;
  };
};

export const navItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "pipeline", label: "Pipeline", icon: BriefcaseBusiness },
  { id: "compare", label: "Compare", icon: Scale },
  { id: "interviews", label: "Interviews", icon: CalendarClock },
  { id: "hired", label: "Hired team", icon: UserRoundCheck },
  { id: "not-selected", label: "Not selected", icon: XCircle },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "users", label: "Company users", icon: UsersRound },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export const executiveMetrics = [
  { label: "Active candidates", value: "12", change: "+4 this week" },
  { label: "Avg. Nearwork score", value: "91", change: "top 8% of pipeline" },
  { label: "Time saved", value: "164h", change: "screening + coordination" },
  { label: "Money saved", value: "$42.8k", change: "vs. local hiring cost" },
];

export const company = {
  name: "Andes Cloud Labs",
  domain: "andescloud.io",
  plan: "Nearwork Scale",
  billingCycle: "Annual",
  nextInvoice: "Jun 01, 2026",
  subscription: "$4,900 / month",
  seatsUsed: 8,
  seatsTotal: 12,
  accountOwner: "Valentina Arias",
  csm: "Mateo Ramirez",
  recruiterLead: "Sofia Torres",
};

export const candidates: Candidate[] = [
  {
    id: "NW-4821",
    name: "Camila Restrepo",
    role: "Senior Full-Stack Engineer",
    location: "Medellin, CO",
    salary: "$6,200/mo",
    availability: "2 weeks",
    stage: "Client interview",
    nearworkScore: 94,
    englishScore: "C1",
    experience: "8 years",
    strengths: ["React systems", "Node APIs", "Mentoring"],
    risks: ["Prefers product teams over agency work"],
    progression:
      "Moved from frontend ownership into full-stack architecture and team leadership over three roles.",
    recruiter: "Sofia Torres",
    csm: "Mateo Ramirez",
    lastTouch: "Client panel scheduled",
    cvStatus: "Ready",
    clientRating: 5,
    processNotes:
      "Passed recruiter screen, English calibration, technical review, and compensation validation.",
    assessment: {
      english: "C1 fluency, concise technical explanations, strong async writing.",
      technical: "Designed a resilient event-driven hiring workflow with clear tradeoffs.",
      culture: "High ownership, calm communicator, strong mentorship examples.",
      summary: "Recommended for final engineering panel.",
    },
  },
  {
    id: "NW-4860",
    name: "Diego Alvarez",
    role: "Backend Engineer",
    location: "Bogota, CO",
    salary: "$5,700/mo",
    availability: "Immediate",
    stage: "Final review",
    nearworkScore: 91,
    englishScore: "B2+",
    experience: "6 years",
    strengths: ["Distributed systems", "Python", "Postgres"],
    risks: ["Needs clarity on incident ownership expectations"],
    progression:
      "Started in data engineering, then specialized in backend services and reliability.",
    recruiter: "Sofia Torres",
    csm: "Mateo Ramirez",
    lastTouch: "References in progress",
    cvStatus: "Ready",
    clientRating: 4,
    processNotes:
      "Nearwork verified salary, notice period, references, and production ownership examples.",
    assessment: {
      english: "B2+ spoken English, strongest in structured technical contexts.",
      technical: "Strong API design, observability, and database indexing decisions.",
      culture: "Direct, pragmatic, asks thoughtful questions before committing.",
      summary: "Recommended with onboarding plan around incident response.",
    },
  },
  {
    id: "NW-4914",
    name: "Mariana Silva",
    role: "Product Designer",
    location: "Sao Paulo, BR",
    salary: "$5,100/mo",
    availability: "3 weeks",
    stage: "Shortlisted",
    nearworkScore: 89,
    englishScore: "C1",
    experience: "7 years",
    strengths: ["Design systems", "Research synthesis", "B2B SaaS"],
    risks: ["Portfolio is stronger in web than mobile"],
    progression:
      "Grew from visual design into end-to-end product discovery for complex workflows.",
    recruiter: "Laura Mejia",
    csm: "Mateo Ramirez",
    lastTouch: "Portfolio review completed",
    cvStatus: "Ready",
    processNotes:
      "Passed English assessment and design critique; awaiting client review.",
    assessment: {
      english: "C1, confident stakeholder presentation and written rationale.",
      technical: "Excellent systems thinking and practical handoff discipline.",
      culture: "Customer-centered, collaborative, receptive to critique.",
      summary: "Strong fit for operational product surfaces.",
    },
  },
  {
    id: "NW-4773",
    name: "Luis Herrera",
    role: "DevOps Engineer",
    location: "Quito, EC",
    salary: "$5,900/mo",
    availability: "4 weeks",
    stage: "Offer",
    nearworkScore: 93,
    englishScore: "B2",
    experience: "9 years",
    strengths: ["AWS", "Terraform", "Cost controls"],
    risks: ["Needs visa-free travel calendar confirmed"],
    progression:
      "Built infrastructure foundations for fintech teams and later led cloud cost programs.",
    recruiter: "Sofia Torres",
    csm: "Mateo Ramirez",
    lastTouch: "Offer package drafted",
    cvStatus: "Ready",
    clientRating: 5,
    processNotes:
      "Compensation, references, English, and hands-on technical exercise completed.",
    assessment: {
      english: "B2, clear operational communication and incident summaries.",
      technical: "Excellent IaC review, security posture, and cost optimization.",
      culture: "Methodical, low ego, comfortable owning production systems.",
      summary: "Offer recommended.",
    },
  },
  {
    id: "NW-4620",
    name: "Ana Pereira",
    role: "QA Automation Lead",
    location: "Lima, PE",
    salary: "$4,800/mo",
    availability: "Immediate",
    stage: "Hired",
    nearworkScore: 90,
    englishScore: "B2+",
    experience: "10 years",
    strengths: ["Playwright", "Release quality", "Team process"],
    risks: ["Prefers stable release cadence"],
    progression:
      "Progressed from manual QA to automation leadership across marketplace products.",
    recruiter: "Laura Mejia",
    csm: "Mateo Ramirez",
    lastTouch: "30-day check-in complete",
    cvStatus: "Ready",
    clientRating: 5,
    processNotes:
      "Hired through Nearwork; EOR onboarding and first payroll completed.",
    assessment: {
      english: "B2+ with strong written defect reporting.",
      technical: "Built maintainable test architecture and release gates.",
      culture: "Structured, patient, strong cross-functional habits.",
      summary: "Thriving after first month.",
    },
  },
  {
    id: "NW-4407",
    name: "Nicolas Gomez",
    role: "Frontend Engineer",
    location: "Cali, CO",
    salary: "$4,900/mo",
    availability: "2 weeks",
    stage: "Not selected",
    nearworkScore: 72,
    englishScore: "B1",
    experience: "5 years",
    strengths: ["UI delivery", "CSS", "React basics"],
    risks: ["English depth", "architecture examples"],
    progression:
      "Strong implementation experience, but limited ownership beyond feature delivery.",
    recruiter: "Sofia Torres",
    csm: "Mateo Ramirez",
    lastTouch: "Closed with feedback",
    cvStatus: "Needs refresh",
    rejectionReason:
      "Did not pass English calibration for stakeholder-heavy client interviews.",
    processNotes:
      "Nearwork declined before client stage and documented the gap for future roles.",
    assessment: {
      english: "B1; comfortable in simple updates, not yet ready for nuanced product debate.",
      technical: "Solid UI execution, weaker on state architecture and tradeoff framing.",
      culture: "Positive and coachable.",
      summary: "Keep warm for lower-English roles after coaching.",
    },
  },
];

export const interviews = [
  {
    candidate: "Camila Restrepo",
    title: "Client technical panel",
    when: "May 6, 2026 - 10:30 AM",
    owner: "Sofia Torres",
    type: "Client",
  },
  {
    candidate: "Diego Alvarez",
    title: "Reference debrief",
    when: "May 7, 2026 - 2:00 PM",
    owner: "Mateo Ramirez",
    type: "Nearwork",
  },
  {
    candidate: "Mariana Silva",
    title: "Portfolio walkthrough",
    when: "May 8, 2026 - 11:00 AM",
    owner: "Laura Mejia",
    type: "Client",
  },
];

export const users = [
  { name: "Valentina Arias", email: "valentina@andescloud.io", role: "Admin" },
  { name: "James Miller", email: "james@andescloud.io", role: "Admin" },
  { name: "Priya Shah", email: "priya@andescloud.io", role: "User" },
  { name: "Daniel Kim", email: "daniel@andescloud.io", role: "User" },
];

export const valueTimeline = [
  { label: "Candidates screened", value: "148", icon: FileCheck2 },
  { label: "Client interviews booked", value: "31", icon: CalendarClock },
  { label: "Offers accepted", value: "7", icon: ShieldCheck },
  { label: "Recruiter notes logged", value: "386", icon: MessageSquareText },
  { label: "Hiring cost avoided", value: "$42.8k", icon: BarChart3 },
];
