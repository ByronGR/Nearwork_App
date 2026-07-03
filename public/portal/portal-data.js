// Portal mock data — Nearwork client portal makeover

window.NW_CLIENT = {
  company: 'Lumen Health',
  initials: 'LH',
  timezone: { label: 'CST · Austin', short: 'CST' },
  user: { name: 'Sarah Mitchell', initials: 'SM', role: 'Head of Engineering' },
};

// Candidates with everything needed for cards, rows, queue
window.NW_CANDIDATES = [
  { id: 1,  name: 'Maria Castro',    initials: 'MC', role: 'Sr. Backend Engineer',  location: 'Bogotá',       score: 94, stage: 'Technical',   stageIdx: 3, openingId: 'be-1', awaitingDays: 1, submittedDays: 5,  avatarBg: '#16A085', match: ['React','Node','AWS','TypeScript'], note: 'Strong system-design depth. Built async pipelines at MercadoLibre.' },
  { id: 2,  name: 'Carlos Mejía',    initials: 'CM', role: 'Product Designer',      location: 'Medellín',     score: 88, stage: 'Final round', stageIdx: 4, openingId: 'pd-1', awaitingDays: 2, submittedDays: 8,  avatarBg: '#E74C7C', match: ['Figma','UX research','Prototyping'], note: 'Portfolio shows fintech + healthcare. Comfortable owning end-to-end.' },
  { id: 3,  name: 'Valeria López',   initials: 'VL', role: 'Sr. Backend Engineer',  location: 'Cali',         score: 91, stage: 'Technical',   stageIdx: 3, openingId: 'be-1', awaitingDays: 0, submittedDays: 2,  avatarBg: '#AF7AC5', match: ['TypeScript','PostgreSQL','Redis'], note: 'Ex-Rappi infra. Mentioned interest in your data-platform work.' },
  { id: 4,  name: 'Diego Restrepo',  initials: 'DI', role: 'Backend Engineer',      location: 'Bogotá',       score: 79, stage: 'Screening',   stageIdx: 2, openingId: 'be-2', awaitingDays: 3, submittedDays: 9,  avatarBg: '#12866E', match: ['Python','Django','Docker'], note: 'Pragmatic. Looking for senior mentorship environment.' },
  { id: 5,  name: 'Ana Gómez',       initials: 'AG', role: 'Sr. Backend Engineer',  location: 'Barranquilla', score: 85, stage: 'Screening',   stageIdx: 2, openingId: 'be-1', awaitingDays: 1, submittedDays: 4,  avatarBg: '#EAB308', match: ['React','GraphQL','Next.js'], note: 'Open-source contributor on tRPC.' },
  { id: 6,  name: 'Luis Herrera',    initials: 'LH', role: 'DevOps Engineer',       location: 'Medellín',     score: 89, stage: 'Final round', stageIdx: 4, openingId: 'do-1', awaitingDays: 0, submittedDays: 12, avatarBg: '#3B82F6', match: ['Kubernetes','Terraform','AWS'], note: 'Migrated a 200-service stack to k8s. Strong comms.' },
  { id: 7,  name: 'Sofía Torres',    initials: 'ST', role: 'Product Designer',      location: 'Bogotá',       score: 92, stage: 'Offer',       stageIdx: 5, openingId: 'pd-1', awaitingDays: 0, submittedDays: 18, avatarBg: '#E74C7C', match: ['Figma','Motion','Design systems'], note: 'Offer extended Wed. Awaiting acceptance.' },
  { id: 8,  name: 'Andrés Ruiz',     initials: 'AR', role: 'Sr. Backend Engineer',  location: 'Cali',         score: 81, stage: 'Applied',     stageIdx: 1, openingId: 'be-1', awaitingDays: 1, submittedDays: 1,  avatarBg: '#AF7AC5', match: ['Go','Kafka','gRPC'], note: 'Just applied. Nearwork pre-screening pending.' },
  { id: 9,  name: 'Camila Vargas',   initials: 'CV', role: 'DevOps Engineer',       location: 'Bogotá',       score: 83, stage: 'Screening',   stageIdx: 2, openingId: 'do-1', awaitingDays: 0, submittedDays: 3,  avatarBg: '#16A085', match: ['AWS','Pulumi','GitOps'], note: 'Strong infrastructure-as-code background.' },
  { id: 10, name: 'Mateo Pinzón',    initials: 'MP', role: 'Sr. Backend Engineer',  location: 'Remote',       score: 87, stage: 'Applied',     stageIdx: 1, openingId: 'be-1', awaitingDays: 0, submittedDays: 0,  avatarBg: '#12866E', match: ['Rust','PostgreSQL','Kafka'], note: 'Just sourced. Pre-screen scheduled.' },
  { id: 11, name: 'Isabella Rojas',  initials: 'IR', role: 'Product Designer',      location: 'Cartagena',    score: 90, stage: 'Technical',   stageIdx: 3, openingId: 'pd-1', awaitingDays: 1, submittedDays: 6,  avatarBg: '#3B82F6', match: ['Figma','Webflow','Brand'], note: 'Mid-tier portfolio with strong systems thinking.' },
  { id: 12, name: 'Tomás Acosta',    initials: 'TA', role: 'Backend Engineer',      location: 'Bucaramanga',  score: 74, stage: 'Applied',     stageIdx: 1, openingId: 'be-2', awaitingDays: 2, submittedDays: 7,  avatarBg: '#EAB308', match: ['Node','MongoDB'], note: 'Self-taught, eager. Could be a junior bet.' },
  // Not selected — candidates Nearwork screened out, kept visible so the client sees how many were filtered
  { id: 13, name: 'Jorge Salazar',   initials: 'JS', role: 'Sr. Backend Engineer',  location: 'Bogotá',       score: 62, stage: 'Not selected', stageIdx: 6, openingId: 'be-1', awaitingDays: 0, submittedDays: 9,  avatarBg: '#94A3B8', match: ['Java','Spring'], note: 'Screened out — seniority and system-design depth below the bar.' },
  { id: 14, name: 'Paula Méndez',    initials: 'PM', role: 'Sr. Backend Engineer',  location: 'Pereira',      score: 58, stage: 'Not selected', stageIdx: 6, openingId: 'be-1', awaitingDays: 0, submittedDays: 11, avatarBg: '#94A3B8', match: ['PHP','MySQL'], note: 'Screened out — stack mismatch with your platform.' },
  { id: 15, name: 'Óscar Patiño',    initials: 'OP', role: 'Product Designer',      location: 'Medellín',     score: 64, stage: 'Not selected', stageIdx: 6, openingId: 'pd-1', awaitingDays: 0, submittedDays: 10, avatarBg: '#94A3B8', match: ['Figma','UI'], note: 'Screened out — strong UI but limited research experience.' },
  { id: 16, name: 'Natalia Ríos',    initials: 'NR', role: 'DevOps Engineer',       location: 'Cali',         score: 60, stage: 'Not selected', stageIdx: 6, openingId: 'do-1', awaitingDays: 0, submittedDays: 8,  avatarBg: '#94A3B8', match: ['Azure','Bash'], note: 'Screened out — limited Kubernetes depth for this role.' },
  { id: 17, name: 'Iván Castaño',    initials: 'IC', role: 'Backend Engineer',      location: 'Remote',       score: 66, stage: 'Not selected', stageIdx: 6, openingId: 'be-2', awaitingDays: 0, submittedDays: 6,  avatarBg: '#94A3B8', match: ['Python'], note: 'Screened out — declined the salary band.' },
];

// Comparison profile per candidate (experience, English, DISC, etc.).
// getCandidateCompare() fills deterministic defaults for anyone without a bespoke record.
window.NW_CANDIDATE_EXTRA = {
  1:  { experience: 8, english: { level: 'C1', score: 92 }, disc: { type: 'D', label: 'Driver' },      salaryExp: '$6,200', availability: '3 weeks', timezone: 'GMT-5' },
  2:  { experience: 6, english: { level: 'C1', score: 88 }, disc: { type: 'I', label: 'Influencer' },  salaryExp: '$5,400', availability: '2 weeks', timezone: 'GMT-5' },
  3:  { experience: 7, english: { level: 'C2', score: 96 }, disc: { type: 'C', label: 'Conscientious' },salaryExp: '$5,900', availability: 'Immediate', timezone: 'GMT-5' },
  4:  { experience: 4, english: { level: 'B2', score: 78 }, disc: { type: 'S', label: 'Steady' },       salaryExp: '$4,400', availability: '1 month', timezone: 'GMT-5' },
  5:  { experience: 5, english: { level: 'B2', score: 82 }, disc: { type: 'C', label: 'Conscientious' },salaryExp: '$4,800', availability: '2 weeks', timezone: 'GMT-5' },
  6:  { experience: 9, english: { level: 'C1', score: 90 }, disc: { type: 'D', label: 'Driver' },       salaryExp: '$6,400', availability: '3 weeks', timezone: 'GMT-5' },
  7:  { experience: 6, english: { level: 'C2', score: 95 }, disc: { type: 'I', label: 'Influencer' },   salaryExp: '$5,600', availability: 'Immediate', timezone: 'GMT-5' },
  8:  { experience: 5, english: { level: 'B2', score: 80 }, disc: { type: 'S', label: 'Steady' },       salaryExp: '$5,000', availability: '2 weeks', timezone: 'GMT-5' },
  9:  { experience: 5, english: { level: 'C1', score: 86 }, disc: { type: 'C', label: 'Conscientious' },salaryExp: '$4,900', availability: '1 month', timezone: 'GMT-5' },
  10: { experience: 7, english: { level: 'C1', score: 89 }, disc: { type: 'D', label: 'Driver' },       salaryExp: '$6,000', availability: '3 weeks', timezone: 'GMT-5' },
  11: { experience: 6, english: { level: 'C1', score: 91 }, disc: { type: 'I', label: 'Influencer' },   salaryExp: '$5,300', availability: '2 weeks', timezone: 'GMT-5' },
  12: { experience: 3, english: { level: 'B1', score: 70 }, disc: { type: 'S', label: 'Steady' },       salaryExp: '$3,800', availability: 'Immediate', timezone: 'GMT-5' },
};
window.NW_DISC_COLORS = { D: '#E74C7C', I: '#EAB308', S: '#16A085', C: '#3B82F6' };
window.getCandidateCompare = function (c) {
  const e = window.NW_CANDIDATE_EXTRA[c.id] || { experience: 5, english: { level: 'B2', score: 80 }, disc: { type: 'C', label: 'Conscientious' }, salaryExp: '$5,000', availability: '2 weeks', timezone: 'GMT-5' };
  return Object.assign({ nearwork: c.score, skills: c.match || [] }, e);
};

// 3 open roles — each carries the approved kickoff brief it originated from
window.NW_OPENINGS = [
  { id: 'be-1', title: 'Senior Backend Engineer',  team: 'Platform',       location: 'Bogotá / Remote',   inPipeline: 6, needsReview: 3, daysOpen: 14, status: 'active',
    brief: { approvedDate: 'May 9, 2026', sentBy: { name: 'Lina Pardo', initials: 'LP', avatarBg: '#0F0F0F', role: 'Account manager · Nearwork' }, seniority: 'Senior', engagement: 'Full-time', comp: '$5,800 – $7,200 / mo', headcount: 1, timezone: 'GMT-5 ± 3h overlap', startTarget: 'Jun 2026',
      summary: 'A senior backend engineer to own core services on the Platform pod — designing reliable, well-tested APIs and mentoring mid-level engineers as the team scales.',
      responsibilities: ['Design and ship core backend services (Node/TypeScript).', 'Own reliability, observability and on-call for owned services.', 'Drive system-design reviews and raise the engineering bar.', 'Mentor two mid-level engineers.'],
      mustHave: ['TypeScript', 'Node', 'PostgreSQL', 'System design', 'AWS'], niceToHave: ['Kafka', 'gRPC', 'Healthcare data'] } },
  { id: 'pd-1', title: 'Product Designer',         team: 'Care experience',location: 'Remote',            inPipeline: 3, needsReview: 1, daysOpen: 21, status: 'active',
    brief: { approvedDate: 'May 2, 2026', sentBy: { name: 'Lina Pardo', initials: 'LP', avatarBg: '#0F0F0F', role: 'Account manager · Nearwork' }, seniority: 'Senior', engagement: 'Full-time', comp: '$4,800 – $6,000 / mo', headcount: 1, timezone: 'GMT-5 ± 3h overlap', startTarget: 'Jun 2026',
      summary: 'A product designer to own end-to-end design for the patient-facing care experience — from research through polished, accessible UI.',
      responsibilities: ['Own design for core patient flows end-to-end.', 'Run lightweight research and usability testing.', 'Maintain and extend the design system.', 'Partner closely with engineering on delivery.'],
      mustHave: ['Figma', 'UX research', 'Design systems', 'Prototyping'], niceToHave: ['Motion', 'Healthcare', 'Accessibility'] } },
  { id: 'do-1', title: 'DevOps Engineer',          team: 'Infrastructure', location: 'Medellín / Remote', inPipeline: 2, needsReview: 0, daysOpen: 9,  status: 'active',
    brief: { approvedDate: 'May 14, 2026', sentBy: { name: 'Lina Pardo', initials: 'LP', avatarBg: '#0F0F0F', role: 'Account manager · Nearwork' }, seniority: 'Senior', engagement: 'Full-time', comp: '$5,600 – $7,000 / mo', headcount: 1, timezone: 'GMT-5 ± 3h overlap', startTarget: 'Jul 2026',
      summary: 'A DevOps engineer to harden cloud infrastructure and CI/CD, improving reliability and developer velocity across the org.',
      responsibilities: ['Own cloud infra (AWS) and IaC (Terraform).', 'Build and maintain CI/CD pipelines.', 'Lead reliability, monitoring and incident response.', 'Improve developer tooling and deploy velocity.'],
      mustHave: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD'], niceToHave: ['GitOps', 'Pulumi', 'Security'] } },
  { id: 'be-2', title: 'Backend Engineer',         team: 'Data platform',  location: 'Remote',            inPipeline: 2, needsReview: 1, daysOpen: 6,  status: 'active',
    brief: { approvedDate: 'May 18, 2026', sentBy: { name: 'Lina Pardo', initials: 'LP', avatarBg: '#0F0F0F', role: 'Account manager · Nearwork' }, seniority: 'Mid', engagement: 'Full-time', comp: '$4,200 – $5,400 / mo', headcount: 1, timezone: 'GMT-5 ± 3h overlap', startTarget: 'Jul 2026',
      summary: 'A backend engineer for the data platform pod — building services and pipelines that power analytics and reporting.',
      responsibilities: ['Build backend services for the data platform.', 'Support ingestion and transformation pipelines.', 'Write well-tested, maintainable code.', 'Collaborate with analytics on data needs.'],
      mustHave: ['Python', 'SQL', 'Docker', 'REST APIs'], niceToHave: ['dbt', 'Airflow', 'AWS'] } },
];

// Activity / updates feed
window.NW_ACTIVITY = [
  { id: 'a1', who: 'Maria Castro',   what: 'advanced to Technical assessment',         when: '2h ago',  type: 'advance', avatarBg: '#16A085', initials: 'MC' },
  { id: 'a2', who: 'Lina Pardo (NW)',what: 'shared 2 new candidates for Senior Backend',when: '4h ago',  type: 'new',     avatarBg: '#0F0F0F', initials: 'LP' },
  { id: 'a3', who: 'Sofía Torres',   what: 'accepted the offer — start date Jun 10',   when: 'Yesterday',type: 'hired',  avatarBg: '#E74C7C', initials: 'ST' },
  { id: 'a4', who: 'You',            what: 'added a note on Carlos Mejía',             when: 'Yesterday',type: 'note',    avatarBg: '#AF7AC5', initials: 'DR' },
  { id: 'a5', who: 'Diego Restrepo', what: 'scheduled final interview · Mon 9:30 am',  when: '2 days ago',type:'interview',avatarBg: '#12866E', initials: 'DI' },
];

// Interviews this week
window.NW_INTERVIEWS = [
  { id: 'i1', who: 'Valeria López',  initials: 'VL', avatarBg: '#AF7AC5', role: 'Sr. Backend Engineer', day: 'Tue', date: 'May 26',  time: '10:00', kind: 'Technical' },
  { id: 'i2', who: 'Luis Herrera',   initials: 'LH', avatarBg: '#3B82F6', role: 'DevOps Engineer',      day: 'Wed', date: 'May 27',  time: '2:30',  kind: 'Final round' },
  { id: 'i3', who: 'Maria Castro',   initials: 'MC', avatarBg: '#16A085', role: 'Sr. Backend Engineer', day: 'Thu', date: 'May 28',  time: '9:00',  kind: 'Technical' },
  { id: 'i4', who: 'Carlos Mejía',   initials: 'CM', avatarBg: '#E74C7C', role: 'Product Designer',     day: 'Fri', date: 'May 29',  time: '11:30', kind: 'Portfolio review' },
];

// Stats for the top cards
window.NW_STATS = {
  populated: {
    interviews: { value: 4, sub: 'this week',           trend: '+2 vs last week' },
    review:     { value: 5, sub: 'awaiting your call',  trend: '2 over 48h' },
    openings:   { value: 4, sub: 'active openings',     trend: '12 days avg open' },
  },
  empty: {
    interviews: { value: 0, sub: 'this week',           trend: 'None scheduled' },
    review:     { value: 0, sub: 'awaiting your call',  trend: 'Inbox zero' },
    openings:   { value: 0, sub: 'active openings',     trend: 'Add your first role' },
  },
};

// Range-specific stats for the Overview Today / This week / Quarter toggle
window.NW_STATS_RANGE = {
  'Today': {
    interviews: { value: 1, label: 'Interviews today',       trend: 'Next at 2:30 pm' },
    review:     { value: 2, label: 'Awaiting review',        trend: '1 over 48h' },
    openings:   { value: 4, label: 'Active openings',        trend: '12 days avg open' },
  },
  'This week': {
    interviews: { value: 4, label: 'Interviews this week',   trend: '+2 vs last week' },
    review:     { value: 5, label: 'Awaiting review',        trend: '2 over 48h' },
    openings:   { value: 4, label: 'Active openings',        trend: '12 days avg open' },
  },
  'Quarter': {
    interviews: { value: 23, label: 'Interviews this quarter',trend: '+34% vs last Q' },
    review:     { value: 9, label: 'Awaiting review',        trend: '3 over 48h' },
    openings:   { value: 4, label: 'Active openings',        trend: '7 filled this quarter' },
  },
};

// ──────────────────────────────────────────────────────────────────────────
// TEAM — people the client has hired through Nearwork + teams Nearwork manages
// ──────────────────────────────────────────────────────────────────────────

// Individual agents hired through Nearwork
window.NW_TEAM_PEOPLE = [
  { id: 'p1', name: 'Sofía Torres',    initials: 'ST', avatarBg: '#E74C7C', role: 'Product Designer',       seniority: 'Senior',     location: 'Bogotá · Remote',      teamId: 'tm-care',     status: 'active',     since: 'Jun 2025',  tenure: '12 mo', utilization: 100, managed: true },
  { id: 'p2', name: 'Luis Herrera',    initials: 'LH', avatarBg: '#3B82F6', role: 'DevOps Engineer',        seniority: 'Senior',     location: 'Medellín · Remote',    teamId: 'tm-infra',    status: 'active',     since: 'Mar 2025',  tenure: '15 mo', utilization: 100, managed: true },
  { id: 'p3', name: 'Maria Castro',    initials: 'MC', avatarBg: '#16A085', role: 'Backend Engineer',       seniority: 'Senior',     location: 'Bogotá · Remote',      teamId: 'tm-platform',status: 'active',     since: 'Jan 2025',  tenure: '17 mo', utilization: 100, managed: true },
  { id: 'p4', name: 'Valeria López',   initials: 'VL', avatarBg: '#AF7AC5', role: 'Backend Engineer',       seniority: 'Mid',        location: 'Cali · Remote',        teamId: 'tm-platform',status: 'active',     since: 'Feb 2025',  tenure: '16 mo', utilization: 80,  managed: true },
  { id: 'p5', name: 'Camila Vargas',   initials: 'CV', avatarBg: '#16A085', role: 'DevOps Engineer',        seniority: 'Mid',        location: 'Bogotá · Remote',      teamId: 'tm-infra',    status: 'active',     since: 'Apr 2025',  tenure: '14 mo', utilization: 100, managed: true },
  { id: 'p6', name: 'Andrés Ruiz',     initials: 'AR', avatarBg: '#12866E', role: 'Data Analyst',           seniority: 'Mid',        location: 'Cali · Remote',        teamId: null,         status: 'active',     since: 'May 2026',  tenure: '1 mo',  utilization: 100, managed: false },
  { id: 'p7', name: 'Daniel Ospina',   initials: 'DO', avatarBg: '#EAB308', role: 'QA Engineer',            seniority: 'Mid',        location: 'Medellín · Remote',    teamId: 'tm-platform',status: 'onleave',    since: 'Nov 2024',  tenure: '19 mo', utilization: 0,   managed: true,  statusNote: 'On PTO · back Jun 30' },
  { id: 'p8', name: 'Laura Jiménez',   initials: 'LJ', avatarBg: '#3B82F6', role: 'Customer Success Mgr',   seniority: 'Senior',     location: 'Bogotá · Remote',      teamId: null,         status: 'active',     since: 'Jul 2025',  tenure: '11 mo', utilization: 100, managed: false },
  { id: 'p9', name: 'Felipe Moreno',   initials: 'FM', avatarBg: '#AF7AC5', role: 'Frontend Engineer',      seniority: 'Junior',     location: 'Remote',               teamId: 'tm-care',     status: 'active',     since: 'Feb 2026',  tenure: '4 mo',  utilization: 100, managed: true },
  { id: 'p10',name: 'Gabriela Núñez',  initials: 'GN', avatarBg: '#E74C7C', role: 'Backend Engineer',       seniority: 'Mid',        location: 'Barranquilla · Remote',teamId: null,         status: 'offboarded', since: 'Aug 2024',  tenure: 'Ended Apr 2026', utilization: 0, managed: false, statusNote: 'Contract ended' },
];

// Kickoff briefs Nearwork scopes and sends to the client for approval.
// Clients do NOT create roles — they review these, then approve or request changes.
window.NW_KICKOFFS = [
  {
    id: 'kf-1', title: 'Senior Data Engineer', team: 'Data platform', location: 'Remote · LATAM',
    sentBy: { name: 'Lina Pardo', initials: 'LP', avatarBg: '#0F0F0F', role: 'Account manager · Nearwork' },
    sentDate: 'Jun 23, 2026', status: 'pending',
    seniority: 'Senior', engagement: 'Full-time', startTarget: 'Aug 2026',
    comp: '$5,400 – $6,800 / mo', headcount: 1, timezone: 'GMT-5 ± 3h overlap',
    summary: 'A senior data engineer to own the ingestion and transformation layer feeding Lumen Health’s analytics and ML workloads. Partners directly with your platform team to harden the data warehouse and build reliable pipelines.',
    responsibilities: [
      'Design and maintain batch + streaming pipelines (Airflow, dbt, Kafka).',
      'Own data quality, lineage, and observability across the warehouse.',
      'Partner with analytics and ML teams on modeling and schema design.',
      'Mentor two mid-level engineers on the data platform pod.',
    ],
    mustHave: ['Python', 'dbt', 'Airflow', 'Snowflake / BigQuery', 'SQL'],
    niceToHave: ['Kafka', 'Spark', 'Terraform', 'Healthcare data'],
  },
  {
    id: 'kf-2', title: 'Engineering Manager · Platform', team: 'Platform', location: 'Bogotá / Remote',
    sentBy: { name: 'Lina Pardo', initials: 'LP', avatarBg: '#0F0F0F', role: 'Account manager · Nearwork' },
    sentDate: 'Jun 24, 2026', status: 'pending',
    seniority: 'Lead', engagement: 'Full-time', startTarget: 'Sep 2026',
    comp: '$7,200 – $8,500 / mo', headcount: 1, timezone: 'GMT-5 ± 2h overlap',
    summary: 'A hands-on engineering manager to lead the Platform pod of 5 engineers, balancing delivery with people growth as the team scales through the next two quarters.',
    responsibilities: [
      'Lead and grow a pod of 5 backend + infra engineers.',
      'Own delivery cadence, planning, and stakeholder communication.',
      'Coach engineers through 1:1s, reviews, and career development.',
      'Stay close to the code — reviews, architecture, unblock the team.',
    ],
    mustHave: ['People management', 'Backend (Node/Go)', 'System design', 'Agile delivery'],
    niceToHave: ['Healthtech', 'Hiring experience', 'AWS'],
  },
];

// Performance-review category template
window.NW_REVIEW_CATEGORIES = ['Quality of work', 'Communication', 'Ownership', 'Collaboration', 'Growth'];

// Per-hire HR detail (keyed by person id). getHireDetail() merges with base + sensible defaults.
// reviews: richest object — overall + per-category scores, strengths, growth areas, goals.
// updates: per-hire notifications (PTO requests, review due, docs). unread drives the red dot.
window.NW_HIRE_DETAILS = {
  p1: { sourceOpeningId: 'pd-1', sourceRole: 'Product Designer', manager: 'Sarah Mitchell',
    salaryMonthly: '$5,400', salaryAnnual: '$64,800', currency: 'USD', lastReview: 'Apr 2026', nextReview: 'Jul 2026', contractType: 'EOR · Full-time',
    vacationTotal: 15, vacationUsed: 6,
    upcomingPTO: [{ label: 'Family trip', dates: 'Jul 14 – Jul 18', days: 5, status: 'approved' }, { label: 'Personal day', dates: 'Aug 1', days: 1, status: 'pending' }],
    updates: [
      { id: 'u1', type: 'pto', text: 'requested a personal day on Aug 1 — awaiting your approval', when: '3h ago', unread: true, action: 'pto' },
      { id: 'u2', type: 'review', text: 'Q2 2026 review is due Jul 5 — Nearwork will conduct it', when: '2 days ago', unread: true },
      { id: 'u3', type: 'doc', text: 'signed the updated contract addendum', when: 'May 30', unread: false },
    ],
    reviews: [
      { id: 'r1', type: 'annual', period: '2025 Annual', date: 'Jan 12, 2026', rating: 4.5, reviewer: 'Sarah Mitchell', reviewerRole: 'Head of Engineering', conductedBy: 'Nearwork',
        summary: 'Consistently exceeds expectations. A design anchor for the Care pod with growing leadership. Sofía pairs strong craft with reliable delivery and is ready for more scope.',
        categories: [{ label: 'Quality of work', score: 5 }, { label: 'Communication', score: 4 }, { label: 'Ownership', score: 5 }, { label: 'Collaboration', score: 4 }, { label: 'Growth', score: 5 }],
        strengths: ['Design-system stewardship', 'End-to-end ownership', 'Cross-functional partnership'],
        growth: ['Delegating more to junior designers', 'Presenting to wider stakeholders'],
        goals: [{ text: 'Lead the care-experience design track', status: 'in-progress' }, { text: 'Mentor one junior designer', status: 'in-progress' }] },
      { id: 'r2', type: 'quarterly', period: 'Q1 2026', date: 'Apr 8, 2026', rating: 4.6, reviewer: 'Sarah Mitchell', reviewerRole: 'Head of Engineering', conductedBy: 'Nearwork',
        summary: 'Shipped the new patient onboarding flow ahead of schedule. Strong design-system stewardship throughout the quarter.',
        categories: [{ label: 'Quality of work', score: 5 }, { label: 'Communication', score: 4 }, { label: 'Ownership', score: 5 }, { label: 'Collaboration', score: 5 }, { label: 'Growth', score: 4 }],
        strengths: ['Ahead-of-schedule delivery', 'Polished, accessible UI'], growth: ['Earlier stakeholder reviews'], goals: [] },
    ],
    clientNotes: [{ author: 'Sarah Mitchell', date: 'May 12, 2026', text: 'Sofía has become indispensable. Would love to discuss a lead track next cycle.', visibility: 'internal' }] },
  p2: { sourceOpeningId: 'do-1', sourceRole: 'DevOps Engineer', manager: 'Sarah Mitchell',
    salaryMonthly: '$6,200', salaryAnnual: '$74,400', currency: 'USD', lastReview: 'Mar 2026', nextReview: 'Jun 2026', contractType: 'EOR · Full-time',
    vacationTotal: 15, vacationUsed: 9,
    upcomingPTO: [{ label: 'Vacation', dates: 'Jun 30 – Jul 4', days: 5, status: 'approved' }],
    updates: [
      { id: 'u1', type: 'pto', text: 'starts approved vacation Jun 30 — back Jul 7', when: '1 day ago', unread: true },
      { id: 'u2', type: 'comp', text: 'is up for a comp review next cycle', when: 'Apr 1', unread: false },
    ],
    reviews: [
      { id: 'r1', type: 'annual', period: '2025 Annual', date: 'Jan 10, 2026', rating: 4.7, reviewer: 'Sarah Mitchell', reviewerRole: 'Head of Engineering', conductedBy: 'Nearwork',
        summary: 'Top performer. The backbone of infra reliability — trusted with the most critical systems. Exceptional incident leadership all year.',
        categories: [{ label: 'Quality of work', score: 5 }, { label: 'Communication', score: 4 }, { label: 'Ownership', score: 5 }, { label: 'Collaboration', score: 5 }, { label: 'Growth', score: 4 }],
        strengths: ['Zero-downtime migrations', 'Incident command', 'Reliability mindset'], growth: ['Documenting runbooks earlier'], goals: [{ text: 'Own the multi-region rollout', status: 'in-progress' }] },
      { id: 'r2', type: 'quarterly', period: 'Q1 2026', date: 'Mar 20, 2026', rating: 4.8, reviewer: 'Sarah Mitchell', reviewerRole: 'Head of Engineering', conductedBy: 'Nearwork',
        summary: 'Led the Kubernetes migration with zero downtime. Exceptional reliability record this quarter.',
        categories: [{ label: 'Quality of work', score: 5 }, { label: 'Communication', score: 5 }, { label: 'Ownership', score: 5 }, { label: 'Collaboration', score: 4 }, { label: 'Growth', score: 5 }],
        strengths: ['Kubernetes migration', '40% faster deploys'], growth: ['Sharing on-call load'], goals: [] },
    ],
    clientNotes: [{ author: 'Sarah Mitchell', date: 'Apr 28, 2026', text: 'Luis is our go-to in any incident. Rock solid.', visibility: 'shared' }] },
  p3: { sourceOpeningId: 'be-1', sourceRole: 'Senior Backend Engineer', manager: 'Sarah Mitchell',
    salaryMonthly: '$6,000', salaryAnnual: '$72,000', currency: 'USD', lastReview: 'Apr 2026', nextReview: 'Jul 2026', contractType: 'EOR · Full-time',
    vacationTotal: 15, vacationUsed: 4,
    upcomingPTO: [{ label: 'Long weekend', dates: 'Jul 21 – Jul 22', days: 2, status: 'approved' }],
    updates: [
      { id: 'u1', type: 'review', text: 'Q2 2026 review is due Jul 10 — Nearwork will conduct it', when: '4h ago', unread: true },
    ],
    reviews: [
      { id: 'r1', type: 'annual', period: '2025 Annual', date: 'Jan 14, 2026', rating: 4.4, reviewer: 'Sarah Mitchell', reviewerRole: 'Head of Engineering', conductedBy: 'Nearwork',
        summary: 'Exceeds expectations. A dependable senior IC raising the bar on the Platform pod, with growing mentorship impact.',
        categories: [{ label: 'Quality of work', score: 5 }, { label: 'Communication', score: 4 }, { label: 'Ownership', score: 4 }, { label: 'Collaboration', score: 5 }, { label: 'Growth', score: 4 }],
        strengths: ['System design', 'Mentorship', 'Reliable delivery'], growth: ['Driving cross-team initiatives'], goals: [{ text: 'Lead the data-platform workstream', status: 'in-progress' }] },
      { id: 'r2', type: 'quarterly', period: 'Q1 2026', date: 'Apr 5, 2026', rating: 4.5, reviewer: 'Sarah Mitchell', reviewerRole: 'Head of Engineering', conductedBy: 'Nearwork',
        summary: 'Delivered the async job platform. Mentors two engineers effectively.',
        categories: [{ label: 'Quality of work', score: 5 }, { label: 'Communication', score: 4 }, { label: 'Ownership', score: 5 }, { label: 'Collaboration', score: 4 }, { label: 'Growth', score: 4 }],
        strengths: ['Async job platform', 'Mentorship'], growth: ['More proactive comms'], goals: [] },
    ],
    clientNotes: [{ author: 'Sarah Mitchell', date: 'May 3, 2026', text: 'Maria’s mentorship has lifted the whole backend team.', visibility: 'shared' }] },
  // p6 — an INDIVIDUAL hire (not in a managed team): client conducts reviews themselves
  p6: { sourceRole: 'Data Analyst', manager: 'Sarah Mitchell',
    salaryMonthly: '$3,800', salaryAnnual: '$45,600', currency: 'USD', lastReview: '—', nextReview: 'Jul 2026', contractType: 'EOR · Full-time',
    vacationTotal: 15, vacationUsed: 2,
    upcomingPTO: [{ label: 'Vacation', dates: 'Jul 28 – Aug 1', days: 5, status: 'approved' }],
    updates: [
      { id: 'u1', type: 'review', text: 'has no review yet — add their first performance review', when: '1 week ago', unread: true, action: 'review' },
    ],
    reviews: [],
    clientNotes: [] },
  p8: { sourceRole: 'Customer Success Mgr', manager: 'Sarah Mitchell',
    salaryMonthly: '$4,600', salaryAnnual: '$55,200', currency: 'USD', lastReview: 'Feb 2026', nextReview: 'Aug 2026', contractType: 'EOR · Full-time',
    vacationTotal: 15, vacationUsed: 5,
    upcomingPTO: [{ label: 'Vacation', dates: 'Aug 11 – Aug 15', days: 5, status: 'pending' }],
    updates: [
      { id: 'u1', type: 'pto', text: 'requested vacation Aug 11–15 — awaiting your approval', when: '6h ago', unread: true, action: 'pto' },
    ],
    reviews: [
      { id: 'r1', type: 'quarterly', period: 'Q4 2025', date: 'Feb 3, 2026', rating: 4.1, reviewer: 'Sarah Mitchell', reviewerRole: 'Head of Engineering', conductedBy: 'Client',
        summary: 'Strong rapport with key accounts. Reduced churn in the SMB segment. Could be more proactive on upsell motions.',
        categories: [{ label: 'Quality of work', score: 4 }, { label: 'Communication', score: 5 }, { label: 'Ownership', score: 4 }, { label: 'Collaboration', score: 4 }, { label: 'Growth', score: 4 }],
        strengths: ['Account relationships', 'Churn reduction'], growth: ['Upsell motions', 'CRM hygiene'], goals: [{ text: 'Hit 95% gross retention', status: 'in-progress' }] },
    ],
    clientNotes: [{ author: 'Sarah Mitchell', date: 'Mar 2, 2026', text: 'Laura runs our SMB book independently — manage reviews directly here.', visibility: 'internal' }] },
};

// Default detail for hires without a bespoke record
window.NW_HIRE_DETAIL_DEFAULT = {
  manager: 'Sarah Mitchell', currency: 'USD', contractType: 'EOR · Full-time',
  salaryMonthly: '$4,800', salaryAnnual: '$57,600',
  vacationTotal: 15, vacationUsed: 3, lastReview: '—', nextReview: 'Next cycle',
  upcomingPTO: [{ label: 'Vacation', dates: 'Aug 4 – Aug 8', days: 5, status: 'approved' }],
  updates: [{ id: 'u1', type: 'review', text: 'Q2 2026 review is scheduled — Nearwork will conduct it', when: 'this week', unread: true }],
  reviews: [], clientNotes: [],
};

// EOR benefits package (same across hires — Nearwork-provided)
window.NW_EOR_BENEFITS = [
  { icon: 'heart-pulse',   label: 'Private health insurance', detail: 'Full medical · employee + dependents' },
  { icon: 'smile',         label: 'Dental & vision',          detail: 'Included in the health plan' },
  { icon: 'landmark',      label: 'Local payroll & taxes',    detail: 'Compliant in-country via Nearwork EOR' },
  { icon: 'gift',          label: '13th-month salary',        detail: 'Statutory bonus, paid in December' },
  { icon: 'laptop',        label: 'Equipment stipend',        detail: '$1,500 / yr for hardware & setup' },
  { icon: 'graduation-cap',label: 'Learning budget',          detail: '$1,000 / yr for courses & conferences' },
  { icon: 'calendar-check',label: 'Paid local holidays',      detail: 'All in-country public holidays' },
  { icon: 'shield-check',  label: 'Severance & compliance',   detail: 'Managed per local labor law' },
];

// ── EOR plans (Core / Plus / Max) + the benefit catalog ─────────────────────
// Source of truth for the pricing + benefits shown on each hire profile.
window.NW_EOR_PLANS = {
  Core: { price: '$350', tier: 'Essentials',   tagline: 'Compliant employment in Colombia, fully managed.',
    base: ['Full EOR services in Colombia', 'Compliance oversight', 'Invoicing & contractor payments', 'Dedicated account manager'],
    benefitCount: 0, scope: 'Team benefits not included' },
  Plus: { price: '$500', tier: 'Most picked',  tagline: 'Everything in Core, plus a curated benefit pool for your team.',
    base: ['Everything in Core', 'HR support', 'Standard onboarding'],
    benefitCount: 3, scope: 'Up to 3 benefits from Tier A' },
  Max:  { price: '$750', tier: 'Full coverage', tagline: 'The complete package — every Tier A and Tier B benefit on the table.',
    base: ['Everything in Plus', 'Legal support', 'White-glove onboarding', 'Priority employee support line'],
    benefitCount: 6, scope: 'Up to 6 benefits across Tier A & B' },
};
window.NW_EOR_BENEFIT_CATALOG = {
  A: [ // Plus & Max
    { label: 'Internet allowance', icon: 'wifi',           detail: 'Monthly home internet' },
    { label: 'Life insurance',     icon: 'heart-pulse',    detail: 'Coverage for the employee' },
    { label: 'Funeral coverage',   icon: 'flower',         detail: 'Family funeral assistance' },
    { label: 'Mental wellness',    icon: 'brain',          detail: 'Therapy & support sessions' },
    { label: 'Gym & wellness',     icon: 'dumbbell',       detail: 'Gym membership stipend' },
    { label: 'Learning budget',    icon: 'graduation-cap', detail: 'Courses & conferences' },
    { label: 'Pet bonus',          icon: 'paw-print',      detail: 'Pet care allowance' },
  ],
  B: [ // Max only
    { label: 'Food allowance',     icon: 'utensils',       detail: 'Monthly meal stipend' },
    { label: 'Medical coverage',   icon: 'stethoscope',    detail: 'Private health plan' },
    { label: 'Home office stipend',icon: 'laptop',         detail: 'Desk & equipment setup' },
    { label: 'Child bonus',        icon: 'baby',           detail: 'Allowance per child' },
  ],
};
// Resolve a hire's EOR plan + their selected benefits (deterministic per person).
window.getHireEOR = function (person) {
  const plans = window.NW_EOR_PLANS, cat = window.NW_EOR_BENEFIT_CATALOG;
  // Plan from billing where we have it, else deterministic by index.
  let planName = null;
  const ph = ((window.NW_BILLING && window.NW_BILLING.perHire) || []).find(x => x.id === person.id);
  if (ph) { const s = (ph.services || []).find(x => x.indexOf('EOR') === 0); if (s) planName = s.split('·')[1].trim(); }
  if (!planName) { const i = person.idx != null ? person.idx : (person.id || person.name || '').length; planName = ['Plus', 'Max', 'Core'][i % 3]; }
  if (!plans[planName]) planName = 'Plus';
  const plan = plans[planName];
  const pool = planName === 'Max' ? cat.A.concat(cat.B) : planName === 'Plus' ? cat.A.slice() : [];
  const seed = String(person.id || person.name || '').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const picked = [];
  const work = pool.slice();
  for (let i = 0; i < plan.benefitCount && work.length; i++) {
    const idx = (seed + i * 7) % work.length;
    const b = work.splice(idx, 1)[0];
    picked.push({ ...b, tier: cat.B.indexOf(b) >= 0 || (cat.B.find && cat.B.some(x => x.label === b.label)) ? 'B' : 'A' });
  }
  return { name: planName, price: plan.price, tier: plan.tier, tagline: plan.tagline, base: plan.base, scope: plan.scope, benefits: picked };
};

window.getHireDetail = function (person) {
  const base = window.NW_HIRE_DETAILS[person.id] || {};
  const d = Object.assign({}, window.NW_HIRE_DETAIL_DEFAULT, base);
  d.vacationRemaining = (d.vacationTotal || 0) - (d.vacationUsed || 0);
  d.updates = d.updates || [];
  d.reviews = d.reviews || [];
  d.clientNotes = d.clientNotes || [];
  // Reviews are conducted by Nearwork for managed-team hires; by the client for individuals.
  d.reviewOwner = person.managed ? 'Nearwork' : 'Client';
  return d;
};

// Unread-notification count for a person (drives the red dot on the Team list).
window.hireUnreadCount = function (person) {
  const base = window.NW_HIRE_DETAILS[person.id];
  if (!base || !base.updates) return 0;
  return base.updates.filter(u => u.unread).length;
};

// Teams Nearwork manages on the client's behalf.
// pod = an optional regional pod (a region where this discipline is sourced); not every team has one.
// Working hours are stored in both the partner's timezone and Colombia (Nearwork) time.
window.NW_TEAM_TEAMS = [
  { id: 'tm-platform', name: 'Platform Engineering', focus: 'Core services & data platform', lead: { name: 'Maria Castro',  initials: 'MC', avatarBg: '#16A085' }, pod: 'Antioquia', health: 'on-track', accent: '#16A085',
    accountManager: { name: 'Lina Pardo',   initials: 'LP', avatarBg: '#0F0F0F', role: 'Account manager · Nearwork' }, established: 'Jan 2025', hoursPartner: '8:00 – 17:00', hoursColombia: '9:00 – 18:00' },
  { id: 'tm-infra',    name: 'Infrastructure',       focus: 'Cloud, CI/CD & reliability',    lead: { name: 'Luis Herrera',  initials: 'LH', avatarBg: '#3B82F6' }, pod: null,        health: 'on-track', accent: '#3B82F6',
    accountManager: { name: 'Lina Pardo',   initials: 'LP', avatarBg: '#0F0F0F', role: 'Account manager · Nearwork' }, established: 'Mar 2025', hoursPartner: '8:00 – 17:00', hoursColombia: '9:00 – 18:00' },
  { id: 'tm-care',     name: 'Care Experience',      focus: 'Patient-facing product & design',lead:{ name: 'Sofía Torres',   initials: 'ST', avatarBg: '#E74C7C' }, pod: 'Bogotá',   health: 'attention', accent: '#E74C7C',
    accountManager: { name: 'Andrés Gómez', initials: 'AG', avatarBg: '#0F0F0F', role: 'Account manager · Nearwork' }, established: 'Jun 2025', hoursPartner: '7:00 – 16:00', hoursColombia: '8:00 – 17:00' },
];

// ──────────────────────────────────────────────────────────────────────────
// BILLING — monthly spend across the 4 Nearwork service models.
// Not a SaaS: no credits/usage. Just what the client spends per month + breakdown.
// ──────────────────────────────────────────────────────────────────────────
window.NW_BILLING = {
  currency: 'USD',
  month: 'June 2026',
  total: '$18,270',
  prevTotal: '$18,050',
  changePct: '+1.2%',
  due: 'Jul 5, 2026',
  status: 'upcoming', // open | paid | overdue
  // What the same service layer would cost in the US (directional estimate)
  us: { equivalent: '$57,800', savings: '$39,530', savingsPct: '68%' },
  // Spend by service model
  services: [
    { id: 'managed', label: 'Managed team',      model: '30% of team salary',     meta: '7 people',     amount: '$10,590', pct: 58, color: '#16A085' },
    { id: 'eor',     label: 'EOR & benefits',     model: 'Core $350 · Plus $500 · Max $750',      meta: '9 people',     amount: '$4,700',  pct: 26, color: '#3B82F6' },
    { id: 'direct',  label: 'Direct recruitment', model: 'Growth · placement + sub',meta: '1 placement', amount: '$2,980',  pct: 16, color: '#E74C7C' },
  ],
  // 6-month spend trend (for the chart)
  trend: [
    { m: 'Jan', v: 16900 }, { m: 'Feb', v: 17200 }, { m: 'Mar', v: 17500 },
    { m: 'Apr', v: 17800 }, { m: 'May', v: 18050 }, { m: 'Jun', v: 18270 },
  ],
  // Per-hire monthly cost breakdown (recurring: managed fee + EOR tier)
  perHire: [
    { id: 'p2', name: 'Luis Herrera',  initials: 'LH', avatarBg: '#3B82F6', role: 'DevOps Engineer',  services: ['Managed team', 'EOR · Max'],  amount: '$2,610' },
    { id: 'p3', name: 'Maria Castro',  initials: 'MC', avatarBg: '#16A085', role: 'Backend Engineer', services: ['Managed team', 'EOR · Max'],  amount: '$2,550' },
    { id: 'p1', name: 'Sofía Torres',  initials: 'ST', avatarBg: '#E74C7C', role: 'Product Designer', services: ['Managed team', 'EOR · Plus'], amount: '$2,120' },
    { id: 'p4', name: 'Valeria López', initials: 'VL', avatarBg: '#AF7AC5', role: 'Backend Engineer', services: ['Managed team', 'EOR · Plus'], amount: '$2,030' },
    { id: 'p5', name: 'Camila Vargas', initials: 'CV', avatarBg: '#16A085', role: 'DevOps Engineer',  services: ['Managed team', 'EOR · Plus'], amount: '$1,940' },
    { id: 'p7', name: 'Daniel Ospina', initials: 'DO', avatarBg: '#EAB308', role: 'QA Engineer',      services: ['Managed team', 'EOR · Plus'], amount: '$1,760' },
    { id: 'p9', name: 'Felipe Moreno', initials: 'FM', avatarBg: '#AF7AC5', role: 'Frontend Engineer',services: ['Managed team', 'EOR · Core'], amount: '$1,430' },
    { id: 'p8', name: 'Laura Jiménez', initials: 'LJ', avatarBg: '#3B82F6', role: 'Customer Success',  services: ['EOR · Plus'],                 amount: '$500'   },
    { id: 'p6', name: 'Andrés Ruiz',   initials: 'AR', avatarBg: '#12866E', role: 'Data Analyst',      services: ['EOR · Core'],                 amount: '$350'   },
  ],
  perHireVisible: 5,
  // 12 months of invoices
  invoices: [
    { id: 'INV-2026-06', period: 'June 2026',     issued: 'Jun 1, 2026', due: 'Jul 5, 2026', amount: '$18,270', status: 'upcoming' },
    { id: 'INV-2026-05', period: 'May 2026',      issued: 'May 1, 2026', due: 'May 5, 2026', amount: '$18,050', status: 'paid' },
    { id: 'INV-2026-04', period: 'April 2026',    issued: 'Apr 1, 2026', due: 'Apr 5, 2026', amount: '$17,800', status: 'paid' },
    { id: 'INV-2026-03', period: 'March 2026',    issued: 'Mar 1, 2026', due: 'Mar 5, 2026', amount: '$17,500', status: 'paid' },
    { id: 'INV-2026-02', period: 'February 2026', issued: 'Feb 1, 2026', due: 'Feb 5, 2026', amount: '$17,200', status: 'paid' },
    { id: 'INV-2026-01', period: 'January 2026',  issued: 'Jan 1, 2026', due: 'Jan 5, 2026', amount: '$16,900', status: 'paid' },
    { id: 'INV-2025-12', period: 'December 2025', issued: 'Dec 1, 2025', due: 'Dec 5, 2025', amount: '$16,400', status: 'paid' },
    { id: 'INV-2025-11', period: 'November 2025', issued: 'Nov 1, 2025', due: 'Nov 5, 2025', amount: '$16,050', status: 'paid' },
    { id: 'INV-2025-10', period: 'October 2025',  issued: 'Oct 1, 2025', due: 'Oct 5, 2025', amount: '$15,600', status: 'paid' },
    { id: 'INV-2025-09', period: 'September 2025',issued: 'Sep 1, 2025', due: 'Sep 5, 2025', amount: '$15,100', status: 'paid' },
    { id: 'INV-2025-08', period: 'August 2025',   issued: 'Aug 1, 2025', due: 'Aug 5, 2025', amount: '$14,800', status: 'paid' },
    { id: 'INV-2025-07', period: 'July 2025',     issued: 'Jul 1, 2025', due: 'Jul 5, 2025', amount: '$14,200', status: 'paid' },
  ],
  ytd: '$105,720',
};

// ──────────────────────────────────────────────────────────────────────────
// DOCUMENTS — view & download only. Admin-access only (not all client users).
// Kept lean & operational; master agreements live under Nearwork, surfaced minimally.
// ──────────────────────────────────────────────────────────────────────────
window.NW_DOCUMENTS = {
  groups: [
    { id: 'invoices', label: 'Invoices', icon: 'receipt', desc: 'Monthly billing statements', items: [
      { name: 'Invoice — June 2026',     type: 'PDF', size: '84 KB', date: 'Jun 1, 2026' },
      { name: 'Invoice — May 2026',      type: 'PDF', size: '82 KB', date: 'May 1, 2026' },
      { name: 'Invoice — April 2026',    type: 'PDF', size: '81 KB', date: 'Apr 1, 2026' },
    ]},
    { id: 'agreements', label: 'Hire agreements', icon: 'file-signature', desc: 'EOR agreements per hire', items: [
      { name: 'EOR Agreement — Luis Herrera',  type: 'PDF', size: '210 KB', date: 'Mar 3, 2025' },
      { name: 'EOR Agreement — Maria Castro',  type: 'PDF', size: '208 KB', date: 'Jan 9, 2025' },
      { name: 'EOR Agreement — Sofía Torres',  type: 'PDF', size: '205 KB', date: 'Jun 6, 2025' },
    ]},
    { id: 'compliance', label: 'Compliance', icon: 'shield-check', desc: 'Tax & local labor', items: [
      { name: 'Tax residency certificate — 2026',     type: 'PDF', size: '120 KB', date: 'Jan 15, 2026' },
      { name: 'Local labor compliance summary 2026',  type: 'PDF', size: '156 KB', date: 'Jan 15, 2026' },
    ]},
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// USERS — who from the partner's side has access to the portal.
// ──────────────────────────────────────────────────────────────────────────
window.NW_USER_ROLES = [
  { id: 'admin',  label: 'Admin',  desc: 'Full access, including billing & users', can: ['View pipeline & hires', 'Approve kickoffs & PTO', 'Manage billing', 'Invite & manage users'], color: '#16A085' },
  { id: 'member', label: 'Member', desc: 'Manage pipeline, hires & notes',          can: ['View pipeline & hires', 'Approve kickoffs & PTO', 'Leave notes'],                color: '#3B82F6' },
  { id: 'viewer', label: 'Viewer', desc: 'Read-only access',                         can: ['View pipeline & hires', 'View team & billing summary'],                       color: '#AF7AC5' },
];
window.NW_USERS = [
  { id: 'u1', name: 'Sarah Mitchell', email: 'sarah.mitchell@lumenhealth.com', initials: 'SM', avatarBg: '#16A085', role: 'admin',  status: 'active',  lastActive: 'Just now',    you: true },
  { id: 'u2', name: 'David Chen',     email: 'david.chen@lumenhealth.com',     initials: 'DC', avatarBg: '#3B82F6', role: 'member', status: 'active',  lastActive: '2h ago' },
  { id: 'u3', name: 'Emily Roberts',  email: 'emily.roberts@lumenhealth.com',  initials: 'ER', avatarBg: '#E74C7C', role: 'member', status: 'active',  lastActive: 'Yesterday' },
  { id: 'u4', name: 'Marcus Lee',     email: 'marcus.lee@lumenhealth.com',     initials: 'ML', avatarBg: '#AF7AC5', role: 'viewer', status: 'active',  lastActive: '3 days ago' },
  { id: 'u5', name: 'Priya Nair',     email: 'priya.nair@lumenhealth.com',     initials: 'PN', avatarBg: '#EAB308', role: 'viewer', status: 'invited', lastActive: 'Invite sent · Jun 22' },
];

// ──────────────────────────────────────────────────────────────────────────
// SPP — Strategic Partner Program. The partner (a consulting firm) resells
// Nearwork to their own end-clients. This is the partner's read-only view to
// review each client's progress + what that client costs them (price to us).
// End-clients never see this — they have their own domain & login.
// ──────────────────────────────────────────────────────────────────────────
window.NW_SPP_STATUS = {
  active:     { label: 'Active',     color: '#0E6B58', bg: '#E8F8F5',  dot: '#16A085' },
  onboarding: { label: 'Onboarding', color: '#3B82F6', bg: '#3B82F614', dot: '#3B82F6' },
  paused:     { label: 'Paused',     color: '#757575', bg: '#F5F4F0',  dot: '#9E9E9E' },
};
// What the partner pays Nearwork: high-tier subscription + per-client costs.
// Placements billed at the discounted SPP rate; managed team & EOR at full.
window.NW_SPP_BILLING = {
  subscription: '$2,500',
  tier: 'Scale · highest tier',
  placementList: '$3,490',
  placementSpp: '$1,300',
  discountNote: 'As an SPP partner you pay the high-tier subscription monthly. Placements are billed at the discounted SPP rate; managed team and EOR are billed at full. You charge your own clients whatever you like.',
  total: '$68,600',
};
window.NW_SPP_CLIENTS = [
  { id: 'c1', name: 'Vantage Robotics', initials: 'VR', logoBg: '#6366F1', industry: 'Robotics',  status: 'active',     since: 'Feb 2025',
    hires: 8, teams: 2, openRoles: 1, pipeline: 14, monthly: '$14,200',
    services: { managed: '$8,400', eor: '$3,800', direct: '$2,000' },
    people: [ { name: 'Andrés Gil', initials: 'AG', avatarBg: '#16A085', role: 'Sr. Robotics Engineer' }, { name: 'María Soto', initials: 'MS', avatarBg: '#E74C7C', role: 'Embedded Engineer' }, { name: 'Cris Mora', initials: 'CM', avatarBg: '#3B82F6', role: 'QA Engineer' } ] },
  { id: 'c2', name: 'Northwind Logistics', initials: 'NL', logoBg: '#0EA5E9', industry: 'Logistics', status: 'active',     since: 'May 2025',
    hires: 5, teams: 1, openRoles: 2, pipeline: 9, monthly: '$9,800',
    services: { managed: '$5,200', eor: '$2,600', direct: '$2,000' },
    people: [ { name: 'Laura Vega', initials: 'LV', avatarBg: '#AF7AC5', role: 'Backend Engineer' }, { name: 'Diego Páez', initials: 'DP', avatarBg: '#12866E', role: 'Data Engineer' } ] },
  { id: 'c3', name: 'Coral Health', initials: 'CH', logoBg: '#14B8A6', industry: 'Healthtech', status: 'active',     since: 'Nov 2024',
    hires: 12, teams: 3, openRoles: 0, pipeline: 0, monthly: '$21,400',
    services: { managed: '$14,800', eor: '$6,600', direct: '$0' },
    people: [ { name: 'Sara Ruiz', initials: 'SR', avatarBg: '#16A085', role: 'Product Designer' }, { name: 'Juan Toro', initials: 'JT', avatarBg: '#3B82F6', role: 'Platform Engineer' }, { name: 'Eva Lara', initials: 'EL', avatarBg: '#EAB308', role: 'Data Analyst' } ] },
  { id: 'c4', name: 'Lumio Energy', initials: 'LE', logoBg: '#F59E0B', industry: 'Cleantech', status: 'active',     since: 'Aug 2025',
    hires: 3, teams: 0, openRoles: 1, pipeline: 6, monthly: '$5,600',
    services: { managed: '$0', eor: '$1,800', direct: '$3,800' },
    people: [ { name: 'Pablo Niño', initials: 'PN', avatarBg: '#E74C7C', role: 'Frontend Engineer' } ] },
  { id: 'c5', name: 'Mesa Finance', initials: 'MF', logoBg: '#EF4444', industry: 'Fintech',   status: 'onboarding', since: 'Jun 2026',
    hires: 6, teams: 1, openRoles: 3, pipeline: 18, monthly: '$11,900',
    services: { managed: '$6,300', eor: '$3,100', direct: '$2,500' },
    people: [ { name: 'Nora Díaz', initials: 'ND', avatarBg: '#AF7AC5', role: 'Backend Engineer' }, { name: 'Tom Reyes', initials: 'TR', avatarBg: '#16A085', role: 'DevOps Engineer' } ] },
  { id: 'c6', name: 'Atlas Retail', initials: 'AR', logoBg: '#8B5CF6', industry: 'Retail',     status: 'paused',     since: 'Mar 2025',
    hires: 2, teams: 0, openRoles: 0, pipeline: 0, monthly: '$3,200',
    services: { managed: '$0', eor: '$1,000', direct: '$2,200' },
    people: [ { name: 'Iván Cano', initials: 'IC', avatarBg: '#12866E', role: 'QA Engineer' } ] },
];

// ──────────────────────────────────────────────────────────────────────────
// TALENT (candidate) side data — mirror of the client portal
// ──────────────────────────────────────────────────────────────────────────
window.NW_TALENT = {
  name: 'John Giraldo',
  initials: 'JG',
  role: 'Customer Success Manager',
  location: 'Medellín · Remote',
  profileReadiness: 88,
  recruiter: { name: 'Camila Restrepo', initials: 'CR', avatarBg: '#16A085', role: 'Talent partner · Nearwork' },
};

// Active applications — John's pipeline across companies
window.NW_TALENT_APPLICATIONS = [
  { id: 'app1', company: 'Stripe',     companyInitials: 'S',  companyBg: '#635BFF', role: 'Senior Customer Success Manager', stage: 'Interview',    stageIdx: 3, status: 'Interview Wed 28 · 10:00', statusKind: 'action', appliedDays: 12, salary: '$95k–$120k' },
  { id: 'app2', company: 'Linear',     companyInitials: 'L',  companyBg: '#5E6AD2', role: 'Customer Success Lead',           stage: 'Assessment',   stageIdx: 2, status: 'Skills assessment due Tue',   statusKind: 'action', appliedDays: 6,  salary: '$110k–$140k' },
  { id: 'app3', company: 'Notion',     companyInitials: 'N',  companyBg: '#0F0F0F', role: 'CS Manager · LATAM',             stage: 'Final round',  stageIdx: 4, status: 'Awaiting their decision',     statusKind: 'wait',   appliedDays: 18, salary: '$100k–$130k' },
  { id: 'app4', company: 'Vercel',     companyInitials: 'V',  companyBg: '#000000', role: 'Customer Success Manager',       stage: 'Applied',      stageIdx: 1, status: 'Nearwork is reviewing',       statusKind: 'wait',   appliedDays: 2,  salary: '$90k–$115k' },
];

// Top matches — recommended openings for John
window.NW_TALENT_MATCHES = [
  { id: 'm1', company: 'Loom',       companyInitials: 'L', companyBg: '#625DF5', role: 'Sr. Customer Success Manager',   location: 'Remote · LATAM',  salary: '$95k–$120k', match: 96, why: 'Strong fit on SaaS CS experience and PLG playbooks.' },
  { id: 'm2', company: 'Pitch',      companyInitials: 'P', companyBg: '#FF5C35', role: 'CS Manager · Enterprise',         location: 'Remote · global', salary: '$100k–$130k', match: 91, why: 'Matches your enterprise account-management background.' },
  { id: 'm3', company: 'PostHog',    companyInitials: 'P', companyBg: '#1D4AFF', role: 'Customer Success Manager',        location: 'Remote · LATAM',  salary: '$90k–$115k',  match: 87, why: 'Comparable industry (devtools) and team size.' },
];

// Profile checklist for the readiness card
window.NW_TALENT_CHECKLIST = [
  { id: 'role',     label: 'Role & seniority',  done: true },
  { id: 'salary',   label: 'Salary expectations', done: true },
  { id: 'location', label: 'Location preferences', done: true },
  { id: 'skills',   label: 'Skills & experience', done: true },
  { id: 'cv',       label: 'Upload primary CV',   done: true },
  { id: 'video',    label: 'Record intro video', done: false },
  { id: 'refs',     label: 'Add 2 references',   done: false },
];

// Talent activity feed
window.NW_TALENT_ACTIVITY = [
  { id: 'ta1', who: 'Stripe',  what: 'scheduled your interview · Wed 28, 10:00', when: '2h ago',     type: 'interview', avatarBg: '#635BFF', initials: 'S' },
  { id: 'ta2', who: 'Camila Restrepo', what: 'sent you a new role at Loom', when: '5h ago', type: 'new', avatarBg: '#16A085', initials: 'CR' },
  { id: 'ta3', who: 'Linear',  what: 'opened your application',          when: 'Yesterday',  type: 'view',     avatarBg: '#5E6AD2', initials: 'L' },
  { id: 'ta4', who: 'You',     what: 'completed the skills profile',     when: '2 days ago', type: 'note',     avatarBg: '#0F0F0F', initials: 'JG' },
];
