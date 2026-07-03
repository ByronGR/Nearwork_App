// ──────────────────────────────────────────────────────────────────────────
// CANDIDATE ASSESSMENTS — the three tests every candidate takes once they sit
// the assessment: English (CEFR), the role Assessment (pass line 70%), and DISC.
//
// Mirrors the real reports candidates receive (skills assessment + CEFR language
// evaluation + Cleaver-equivalent DISC). Only the useful, partner-facing content
// is surfaced here — never the raw PDF. Candidates who have not sat the
// assessment yet resolve to { completed: false }.
// ──────────────────────────────────────────────────────────────────────────

window.NW_ASSESS_PASS = 70;

// CEFR level → short partner-facing read
window.NW_CEFR_SUMMARY = {
  C2: 'Near-native command. Precise, nuanced professional English with excellent range and accuracy across spontaneous speech and written tasks.',
  C1: 'Advanced, confident command of professional English. Well-structured, convincing responses with only occasional minor slips under pressure.',
  B2: 'Strong upper-intermediate command, with standout professional vocabulary and logical coherence. Held back by recurring grammatical inaccuracies — chiefly verb-complement patterns and subject–verb agreement.',
  B1: 'Solid intermediate English. Communicates clearly on familiar topics but reaches for structure and accuracy on complex, spontaneous business scenarios.',
  A2: 'Basic command. Handles routine, predictable exchanges but struggles to sustain professional discussion without support.',
};

// DISC type metadata
window.NW_DISC_TYPES = {
  D: { label: 'Driver',        classification: 'The Decisive Driver',      headline: 'Goal-oriented, direct, and comfortable making fast calls under pressure.',
       narrative: 'Anchored by Dominance, this profile leads with results and decisiveness. They set direction quickly, take ownership of outcomes, and thrive on challenge — most effective when paired with process-minded teammates who catch the detail.' },
  I: { label: 'Influencer',    classification: 'The Engaging Influencer',  headline: 'Persuasive, optimistic, and energised by people and collaboration.',
       narrative: 'Led by Influence, this profile builds rapport fast and communicates with warmth and conviction. They rally teams and win buy-in — strongest when supported by structure that turns their ideas into follow-through.' },
  S: { label: 'Steady',        classification: 'The Steady Anchor',        headline: 'Patient, dependable, and a stabilising presence on any team.',
       narrative: 'Grounded in Steadiness, this profile values consistency, loyalty, and calm. They keep delivery predictable and relationships healthy — most effective when given clear priorities and space to adapt to change at a measured pace.' },
  C: { label: 'Conscientious', classification: 'The Precise Analyst',      headline: 'Analytical, quality-driven, and rigorous with detail and standards.',
       narrative: 'Defined by Compliance, this profile leads with accuracy and structured thinking. They raise the quality bar and de-risk decisions with evidence — strongest when trusted with complex, standards-heavy work and clear expectations.' },
};
window.NW_DISC_COLORS = window.NW_DISC_COLORS || { D: '#E74C7C', I: '#EAB308', S: '#16A085', C: '#3B82F6' };
window.NW_DISC_DIM = {
  D: { key: 'D', name: 'Dominance',  color: '#E74C7C' },
  I: { key: 'I', name: 'Influence',  color: '#EAB308' },
  S: { key: 'S', name: 'Steadiness', color: '#16A085' },
  C: { key: 'C', name: 'Compliance', color: '#3B82F6' },
};

// Baseline natural percentiles by primary type
const NW_DISC_BASE = {
  D: { D: 74, I: 46, S: 38, C: 52 },
  I: { D: 48, I: 76, S: 50, C: 40 },
  S: { D: 38, I: 48, S: 75, C: 55 },
  C: { D: 44, I: 40, S: 52, C: 78 },
};
function nwSeeded(seed, n) { const x = Math.sin(seed * 97.13 + n * 12.9898) * 43758.5453; return x - Math.floor(x); }
function nwClamp(v) { return Math.max(6, Math.min(96, Math.round(v))); }
// Build Natural / Adapted / Under-pressure triplet from a primary type
function nwDiscProfiles(type, seed, balanced) {
  const dims = ['D', 'I', 'S', 'C'];
  if (balanced) {
    const mk = (spread) => dims.reduce((a, k, i) => (a[k] = nwClamp(50 + (nwSeeded(seed, i + spread) - 0.5) * spread * 8), a), {});
    return { natural: mk(1), adapted: mk(0.6), pressure: mk(1.4) };
  }
  const base = NW_DISC_BASE[type] || NW_DISC_BASE.C;
  const natural = {}, adapted = {}, pressure = {};
  dims.forEach((k, i) => {
    const j = (nwSeeded(seed, i) - 0.5) * 12;
    const n = base[k] + j;
    natural[k] = nwClamp(n);
    adapted[k] = nwClamp(n + (50 - n) * 0.28);           // moderated toward the mean
    pressure[k] = nwClamp(n + (n - 50) * 0.30);           // amplified at the extremes
  });
  return { natural, adapted, pressure };
}

// ── Role-based question banks ────────────────────────────────────────────────
// Each question carries a strong + weak variant (answer, feedback, score) and a
// follow-up. getCandidateAssessment picks per-question based on the overall score.
const NW_Q_BANKS = {
  engineering: [
    { prompt: 'Describe a time you had to deliver difficult technical news to stakeholders — a slipped deadline or a major refactor. How did you structure the communication and what was the outcome?',
      strong: { score: 4.5, answer: 'On the payments migration I flagged a two-week slip the moment our load tests failed. I sent a short written update: the root cause, the three options with trade-offs, my recommendation, and a revised date with buffer. I followed up with a 15-minute call for the exec sponsor. Because it was early and specific, they backed the plan and we shipped on the revised date with zero incidents.',
        feedback: 'Excellent use of a concrete, structured example — cause, options, recommendation, and outcome. Communicated early and quantified the impact. This is exactly the STAR-style specificity we look for.' },
      weak: { score: 3, answer: 'When there is a delay I make sure to tell the client the reason and what we are doing to fix it, and to commit to a new deadline. I try to be as transparent as possible so they take it well.',
        feedback: 'Describes a sound general approach but never grounds it in a specific past event as the prompt asked. Add a concrete example using Situation–Task–Action–Result to demonstrate actual execution.' },
      followUp: { q: 'Can you give the specific numbers — how much did it slip, and how did you rebuild trust afterwards?',
        strong: 'Two weeks against a six-week project. I set up a daily written burn-down for the sponsor for the final sprint, which rebuilt confidence and became our standard for at-risk work.',
        weak: 'It depends on the situation, but usually I just keep communicating updates until it is resolved.' } },
    { prompt: 'How do you approach designing a reliable, well-tested API for a new core service in your first weeks on a team?',
      strong: { score: 4.5, answer: 'I start from the consumers and the contract — define the interface, error semantics, and SLOs first, then write the tests before the implementation. I lean on the team’s existing patterns for observability and add integration tests around the critical paths. I ship behind a flag, watch the dashboards, and iterate.',
        feedback: 'Strong, contract-first methodology with clear attention to testing, observability, and safe rollout. Demonstrates senior judgement and respect for existing team conventions.' },
      weak: { score: 2.5, answer: 'I would look at the requirements and build the endpoints, then add tests after to make sure they work. I try to follow best practices and keep the code clean.',
        feedback: 'Generic and implementation-first. Missing the contract, error semantics, SLOs, and rollout strategy that separate a reliable core service from a working prototype. Needs more structure and specificity.' },
      followUp: { q: 'How would you decide what to test first when time is tight?',
        strong: 'I prioritise the highest-risk, highest-blast-radius paths — auth, money movement, data writes — and cover the happy path plus the two most likely failure modes before breadth.',
        weak: 'I would test the main features first and add more tests if there is time.' } },
    { prompt: 'A production incident is causing intermittent failures for enterprise customers. Walk through how you triage, communicate, and resolve it.',
      strong: { score: 4, answer: 'First I confirm scope and impact and open an incident channel with a clear owner. I stop the bleeding — roll back or feature-flag — before root-causing. I post status updates on a fixed cadence for support and the customer, then run a blameless post-mortem with action items and owners.',
        feedback: 'Clear incident-command instincts: contain first, communicate on a cadence, then learn. Mentions rollback, ownership, and post-mortem discipline. Well structured.' },
      weak: { score: 2.5, answer: 'I would check the logs to find the error and fix it as fast as possible, and let the team know once it is resolved.',
        feedback: 'Jumps straight to debugging and only communicates after the fact. Missing containment, a communication cadence during the incident, and any post-incident learning. Too thin for enterprise-grade reliability.' },
      followUp: { q: 'Who do you communicate with during the incident, and how often?',
        strong: 'Support and the account owner get updates every 20–30 minutes; internally, the incident channel is the single source of truth until resolution.',
        weak: 'I would tell my manager and the team when there is an update.' } },
    { prompt: 'Describe your approach to mentoring mid-level engineers while still shipping your own work.',
      strong: { score: 4.5, answer: 'I treat mentoring as leverage, not overhead. I pair on tricky reviews, hand off stretch work with guardrails, and protect a weekly 1:1 focused on their goals. I measure success by how much they can own without me — which frees me to take on the harder architecture work.',
        feedback: 'A mature, leverage-oriented view of mentorship with concrete mechanisms and a clear success signal. Balances growth of others with personal delivery.' },
      weak: { score: 3, answer: 'I help them when they get stuck and review their pull requests. I try to be available if they have questions.',
        feedback: 'Reactive and unstructured. Add intentional mechanisms — pairing, stretch assignments, regular 1:1s — and a way to measure whether they are growing more independent.' },
      followUp: { q: 'How do you know your mentoring is actually working?',
        strong: 'When they start unblocking themselves and other juniors, and when review cycles on their work get shorter over a quarter.',
        weak: 'When they seem more confident and ask fewer questions.' } },
  ],
  design: [
    { prompt: 'Describe a time you had to present a design decision that stakeholders disagreed with. How did you structure the conversation and what was the outcome?',
      strong: { score: 4.5, answer: 'On the onboarding redesign, leadership wanted more steps for compliance; research showed drop-off. I framed it around the shared goal — activation — and brought the usability data and two prototypes. We agreed to a phased test; the leaner flow won on completion and we kept compliance with progressive disclosure.',
        feedback: 'Grounded, evidence-led example that reframes conflict around a shared goal and lands a measurable outcome. Exactly the structured, collaborative posture we look for.' },
      weak: { score: 3, answer: 'I explain my reasoning and show them why the design is better for users. Usually if I present it well they come around.',
        feedback: 'States a general approach but no concrete example, data, or collaborative mechanism. Show how you turned disagreement into a shared decision with evidence.' },
      followUp: { q: 'What did the data actually show, and how did you get buy-in?',
        strong: 'The leaner flow lifted completion 18%. I got buy-in by co-designing the test criteria with the compliance lead up front.',
        weak: 'The users preferred the simpler version so eventually everyone agreed.' } },
    { prompt: 'How do you approach research and discovery when starting a new patient-facing flow?',
      strong: { score: 4.5, answer: 'I start with the job to be done and the riskiest assumptions, then choose the lightest method that de-risks them — 5 interviews, a heuristic audit, and analytics on the current funnel. I synthesise into a small set of insights and testable hypotheses before touching UI, and I keep engineering in the room early.',
        feedback: 'Assumption-driven, method-appropriate discovery with clear synthesis and cross-functional involvement. Demonstrates senior research judgement.' },
      weak: { score: 2.5, answer: 'I look at what competitors do and talk to a few users, then start designing based on what I learn.',
        feedback: 'Leans on competitor copying and unstructured input. Missing explicit assumptions, method selection, synthesis, and how insights convert into design decisions.' },
      followUp: { q: 'How do you decide when you have done enough research to start designing?',
        strong: 'When the top assumptions are de-risked and I stop hearing new themes — saturation — not when I have hit a fixed number of interviews.',
        weak: 'When I feel I understand the users well enough to begin.' } },
    { prompt: 'A key stakeholder feels the new design doesn’t reflect their brand. Draft how you’d respond and realign the work with their goals.',
      strong: { score: 4, answer: 'I’d acknowledge the concern specifically, then separate brand expression from usability so we don’t trade one for the other. I’d bring the brand guidelines and show where the design honours them, propose two directions for the areas in question, and set a short working session to decide together.',
        feedback: 'Empathetic, specific, and solution-oriented — separates concerns, offers concrete options, and proposes a collaborative next step. Strong stakeholder handling.' },
      weak: { score: 2.5, answer: 'I’d tell them the design follows best practices and ask what specifically they don’t like, then try to adjust it.',
        feedback: 'Defensive framing and vague next steps. Lead with the shared goal, reference the brand system explicitly, and propose concrete options rather than open-ended adjustment.' },
      followUp: { q: 'What if they still push for something that hurts usability?',
        strong: 'I’d propose an A/B test so the decision is settled by data, not opinion, and agree the metric up front.',
        weak: 'I would make the change they want since it is their product.' } },
    { prompt: 'How do you maintain and evolve a design system while still shipping features?',
      strong: { score: 4.5, answer: 'I treat the system as a product with its own backlog. New patterns start local, and I promote them to shared components only once they’ve proven out twice. I version changes, document usage, and pair with engineers on the tokens so design and code stay in sync.',
        feedback: 'Product-minded stewardship with a clear promotion path, versioning, and design-engineering alignment. Balances consistency with delivery speed well.' },
      weak: { score: 3, answer: 'I keep the component library updated and try to reuse existing patterns when I build new screens.',
        feedback: 'Describes upkeep but no governance — how patterns get promoted, versioned, documented, or kept in sync with code. Add the system-as-product mechanisms.' },
      followUp: { q: 'How do you stop the system from blocking teams that need to move fast?',
        strong: 'I allow sanctioned local overrides with a clear path to contribute them back, so speed never requires going around the system.',
        weak: 'I try to make components flexible so people can use them how they need.' } },
  ],
  devops: [
    { prompt: 'Describe a time a deployment caused an outage. How did you communicate during it and what did you change afterwards?',
      strong: { score: 4.5, answer: 'A config change took down a region. I rolled back within minutes, opened an incident channel, and posted updates every 15 minutes to support and the affected customer. The post-mortem produced automated config validation and a canary stage — we haven’t had a repeat since.',
        feedback: 'Textbook response: fast containment, disciplined communication cadence, and durable systemic fixes. Clear ownership and measurable follow-through.' },
      weak: { score: 3, answer: 'I rolled back the change and fixed the issue, then told the team what happened. We were more careful with deployments after that.',
        feedback: 'Contains the incident but the communication and the fix are vague. Specify the update cadence during the outage and the concrete systemic change — validation, canaries — that prevents recurrence.' },
      followUp: { q: 'What specifically prevents this class of failure now?',
        strong: 'Config changes run through schema validation in CI and deploy via a 5% canary with automated rollback on error-rate breach.',
        weak: 'We review deployments more carefully and test more before shipping.' } },
    { prompt: 'How do you approach hardening CI/CD and reliability in your first 90 days on a new infrastructure team?',
      strong: { score: 4.5, answer: 'First 30 days I map the current pipelines, SLOs, and top incident sources. Next I fix the highest-leverage gaps — flaky tests, missing rollback, no canaries. By day 90 I’ve set error budgets and made deploys boring: fast, observable, and reversible. I sequence by risk, not by what’s easy.',
        feedback: 'Structured, risk-sequenced 90-day plan with concrete milestones and a clear definition of success. Demonstrates senior operational judgement.' },
      weak: { score: 2.5, answer: 'I would review the existing setup and improve the pipelines and monitoring where needed to make things more reliable.',
        feedback: 'Generic and unsequenced. Break it into milestones (30/60/90), name the specific reliability gaps you’d target, and define what “reliable” means with SLOs or error budgets.' },
      followUp: { q: 'How do you prioritise what to fix first?',
        strong: 'By blast radius and incident frequency — I fix the failures that hit the most customers most often before polishing anything cosmetic.',
        weak: 'I would start with whatever looks like the biggest problem.' } },
    { prompt: 'Enterprise customers report latency spikes tied to a recent infra change. Walk through triage and resolution.',
      strong: { score: 4, answer: 'I correlate the spikes with the change timeline and metrics, confirm blast radius, and roll back or route around the change to stop impact. I keep support updated on a cadence, then root-cause with traces and add an alert so we catch it earlier next time.',
        feedback: 'Methodical correlation, containment before deep debugging, steady communication, and a preventive alert. Strong reliability instincts.' },
      weak: { score: 2.5, answer: 'I would look at the metrics to find the cause of the latency and then work on fixing it, and update the customer when it is done.',
        feedback: 'Skips containment and an in-incident communication cadence, and adds no preventive follow-up. Contain first, communicate throughout, and close the loop with detection.' },
      followUp: { q: 'How do you contain impact before you’ve found the root cause?',
        strong: 'Roll back the suspect change or shift traffic off the affected path — stop customer pain first, diagnose second.',
        weak: 'I would try to fix the root cause quickly so customers are not affected for long.' } },
    { prompt: 'How do you balance developer velocity with reliability and on-call load?',
      strong: { score: 4.5, answer: 'I use error budgets as the arbiter: when we’re within budget we optimise for speed, when we breach it we shift to reliability work. I invest in self-service tooling and good defaults so the safe path is also the fast path, and I keep on-call sustainable by fixing the top pager sources each quarter.',
        feedback: 'Excellent framing — error budgets to arbitrate the trade-off, paved roads to align speed with safety, and deliberate on-call health. Mature and systemic.' },
      weak: { score: 3, answer: 'I try to make sure we ship fast but don’t break things, and I help reduce on-call when it gets too heavy.',
        feedback: 'States the goal without a mechanism. Introduce error budgets or a similar objective arbiter, and describe how tooling makes the safe path the fast one.' },
      followUp: { q: 'What do you do when velocity and reliability genuinely conflict?',
        strong: 'The error budget decides — it turns a subjective argument into an agreed, data-driven call.',
        weak: 'I would talk to the team and try to find a compromise.' } },
  ],
};

// Competency label per question index, per bank — used for the radar + strengths.
window.NW_COMP_LABELS = {
  engineering: ['Communication', 'System design', 'Incident response', 'Mentorship'],
  design: ['Stakeholder comms', 'Research & discovery', 'Conflict resolution', 'Design systems'],
  devops: ['Communication', 'Reliability & CI/CD', 'Incident response', 'Velocity & on-call'],
};

// Map a candidate role → question bank
function nwBankFor(role) {
  const r = (role || '').toLowerCase();
  if (r.includes('design')) return 'design';
  if (r.includes('devops') || r.includes('infra') || r.includes('sre')) return 'devops';
  return 'engineering';
}

// Assessment-level summary (generated) for candidates without bespoke copy
function nwAssessSummary(first, pass, overall, role) {
  if (pass) return `${first} cleared the ${overall}% bar with well-structured, specific answers and sound judgement for a ${role.toLowerCase()} role. Strongest on concrete, example-led responses; a few areas would benefit from deeper detail, but overall a confident, recommendable performance.`;
  return `${first} shows a solid foundation but fell short of the 70% passing threshold at ${overall}%. Answers often stayed general or skipped the specific example the prompt asked for. With practice on structured, example-led responses (Situation–Task–Action–Result), the gap looks closable.`;
}

// ── Bespoke assessments (mirror the real reports) ────────────────────────────
window.NW_ASSESSMENTS = {
  // Maria Castro — top of the pipeline, a clear pass
  1: {
    completed: true, submitted: 'Jun 28, 2026', gradedBy: 'Nearwork talent team',
    english: { level: 'C1', score: 92 },
    disc: { type: 'D' },
    assessment: {
      overall: 88, status: 'passed',
      integrity: { risk: 4, tabSwitches: 0, copyPaste: 0, focusLosses: 0 },
      summary: 'Maria delivered a standout performance, clearing the 70% bar comfortably at 88%. Her answers are consistently specific, structured, and grounded in real examples — contract-first API design, disciplined incident response, and a leverage-oriented view of mentorship. She communicates trade-offs clearly and quantifies outcomes. A strong, confident senior signal with no integrity concerns.',
    },
  },
  // Paula Méndez — screened out; mirrors the real failing report (58%, B2 66%, integrity 15%)
  14: {
    completed: true, submitted: 'Jul 1, 2026', gradedBy: 'Nearwork talent team',
    english: { level: 'B2', score: 66 },
    disc: { type: 'S' },
    assessment: {
      overall: 58, status: 'failed',
      integrity: { risk: 15, tabSwitches: 0, copyPaste: 0, focusLosses: 3 },
      summary: 'Paula shows foundational engineering communication and a pragmatic mindset, but her overall performance fell short of the 70% threshold at 58%. Answers often relied on generalisations, lacked structure, or repeated earlier content instead of detailed strategies. Critically, she pasted an earlier answer almost verbatim on the final follow-up, pointing to a lapse in attention to detail. Not recommended for the senior bar at this stage; would benefit from structured-communication practice (STAR) and specificity.',
      // A flaw injected on the last question: repeated answer verbatim (mirrors the real report)
      repeatFlaw: true,
    },
  },
  // Isabella Rojas — the balanced "Pragmatic Achiever" DISC showcase
  11: {
    completed: true, submitted: 'Jun 27, 2026', gradedBy: 'Nearwork talent team',
    english: { level: 'C1', score: 91 },
    disc: { type: 'D', balanced: true, classification: 'The Pragmatic Achiever',
      headline: 'A highly integrated, situationally adaptive profile that balances drive with stability, structure, and versatility.',
      narrative: 'Rather than a single dominant mode, Isabella operates from an integrated “mid-zone” across all four dimensions — dialling assertiveness, sociability, patience, and rigour up or down to fit the moment. Motivated equally by results and quality, and equally comfortable in analytical and collaborative work, with high self-regulation under pressure.' },
    assessment: {
      overall: 84, status: 'passed',
      integrity: { risk: 6, tabSwitches: 0, copyPaste: 0, focusLosses: 1 },
      summary: 'Isabella passed comfortably at 84% with balanced, well-reasoned answers. She reframes disagreement around shared goals, chooses research methods deliberately, and treats the design system as a product. Composed and adaptable throughout — a reliable senior signal.',
    },
  },
};

// Resolve a candidate's full assessment (bespoke where present, deterministic default otherwise).
window.getCandidateAssessment = function (c) {
  if (!c) return { completed: false };
  // Candidates who have only just applied haven't sat the assessment yet.
  const notYet = c.stageIdx === 1;
  const bespoke = window.NW_ASSESSMENTS[c.id];
  if (!bespoke && notYet) return { completed: false, role: c.role };

  const extra = (window.NW_CANDIDATE_EXTRA && window.NW_CANDIDATE_EXTRA[c.id]) || {};
  const first = c.name.split(' ')[0];
  const seed = c.id;
  const bankKey = nwBankFor(c.role);
  const bank = NW_Q_BANKS[bankKey];

  // English
  const eLevel = (bespoke && bespoke.english.level) || (extra.english && extra.english.level) || 'B2';
  const eScore = (bespoke && bespoke.english.score) || (extra.english && extra.english.score) || 78;

  // DISC
  const dType = (bespoke && bespoke.disc && bespoke.disc.type) || (extra.disc && extra.disc.type) || 'C';
  const dMeta = window.NW_DISC_TYPES[dType] || window.NW_DISC_TYPES.C;
  const balanced = !!(bespoke && bespoke.disc && bespoke.disc.balanced);
  const disc = {
    type: dType,
    label: (extra.disc && extra.disc.label) || dMeta.label,
    classification: (bespoke && bespoke.disc && bespoke.disc.classification) || dMeta.classification,
    headline: (bespoke && bespoke.disc && bespoke.disc.headline) || dMeta.headline,
    narrative: (bespoke && bespoke.disc && bespoke.disc.narrative) || dMeta.narrative,
    profiles: nwDiscProfiles(dType, seed, balanced),
  };

  // Assessment overall
  let overall, status, integrity, aSummary, repeatFlaw = false;
  if (bespoke) {
    overall = bespoke.assessment.overall;
    status = bespoke.assessment.status;
    integrity = bespoke.assessment.integrity;
    aSummary = bespoke.assessment.summary;
    repeatFlaw = !!bespoke.assessment.repeatFlaw;
  } else {
    // Derive a plausible assessment score near the Nearwork match score.
    const base = c.score != null ? c.score : 75;
    overall = nwClamp(base - 4 + Math.round((nwSeeded(seed, 3) - 0.5) * 10));
    status = overall >= window.NW_ASSESS_PASS ? 'passed' : 'failed';
    const risk = nwClamp((100 - overall) * 0.25 + nwSeeded(seed, 5) * 10);
    integrity = {
      risk: Math.min(48, risk),
      tabSwitches: Math.round(nwSeeded(seed, 6) * (overall < 70 ? 3 : 1)),
      copyPaste: overall < 65 && nwSeeded(seed, 7) > 0.6 ? 1 : 0,
      focusLosses: Math.round(nwSeeded(seed, 8) * (overall < 70 ? 4 : 2)),
    };
    aSummary = nwAssessSummary(first, status === 'passed', overall, c.role);
  }

  // Build the per-question breakdown
  const targetAvg = overall / 20; // convert % → /5
  const compLabels = window.NW_COMP_LABELS[bankKey] || window.NW_COMP_LABELS.engineering;
  const questions = bank.map((q, i) => {
    // Pick strong/weak so per-question scores roughly track the overall.
    const useStrong = targetAvg >= 3.6 ? nwSeeded(seed, 20 + i) > 0.18
      : targetAvg <= 2.9 ? nwSeeded(seed, 20 + i) > 0.72
      : nwSeeded(seed, 20 + i) > 0.5;
    const v = useStrong ? q.strong : q.weak;
    const last = i === bank.length - 1;
    let followAns = useStrong ? q.followUp.strong : q.followUp.weak;
    let feedback = v.feedback;
    let answer = v.answer;
    // Mirror the real report's "repeated verbatim" flaw on the final question.
    if (repeatFlaw && last) {
      followAns = bank[i].weak.answer; // the follow-up repeats the main answer
      feedback = 'The candidate failed to address the follow-up: she pasted the previous answer almost word-for-word instead of responding to the new question. This points to a lapse in attention to detail. She must read every follow-up carefully and answer it directly.';
    }
    return {
      n: i + 1, prompt: q.prompt, score: v.score, max: 5, answer,
      competency: compLabels[i],
      feedback,
      followUp: { q: q.followUp.q, a: followAns },
    };
  });

  return {
    completed: true,
    role: c.role,
    submitted: (bespoke && bespoke.submitted) || 'Jun 2026',
    gradedBy: (bespoke && bespoke.gradedBy) || 'Nearwork talent team',
    english: { level: eLevel, score: eScore, summary: window.NW_CEFR_SUMMARY[eLevel] || window.NW_CEFR_SUMMARY.B2 },
    assessment: { overall, passing: window.NW_ASSESS_PASS, status, integrity, summary: aSummary, questions },
    disc,
  };
};

// ── Competency radar ─────────────────────────────────────────────────────────
// Universal axes so every candidate is measured on the same scale regardless of
// role: Communication, Problem solving, Adaptability, Leadership (mapped from the
// four assessment answers) + English + Assessment. Each on a 0–100 scale.
window.NW_RADAR_AXES = ['Communication', 'Problem solving', 'Adaptability', 'Leadership'];
window.nwRadarAxes = function (a) {
  if (!a || !a.completed) return [];
  const comp = a.assessment.questions.map((q, i) => ({ label: window.NW_RADAR_AXES[i] || q.competency, value: Math.round((q.score / q.max) * 100) }));
  return comp.concat([
    { label: 'English', value: a.english.score },
    { label: 'Assessment', value: a.assessment.overall },
  ]);
};

// The cohort a candidate is benchmarked against: everyone who shares their
// question bank (role family) and has completed the assessment.
window.getCandidateRadar = function (c) {
  const a = window.getCandidateAssessment(c);
  const cand = window.nwRadarAxes(a);
  if (!cand.length) return null;
  const bankKey = nwBankFor(c.role);
  const cohort = (window.NW_CANDIDATES || []).filter(x => nwBankFor(x.role) === bankKey);
  const sums = cand.map(() => 0);
  let n = 0;
  cohort.forEach(x => {
    const ax = window.nwRadarAxes(window.getCandidateAssessment(x));
    if (ax.length === cand.length) { ax.forEach((v, i) => sums[i] += v.value); n++; }
  });
  const avg = cand.map((ax, i) => ({ label: ax.label, value: n ? Math.round(sums[i] / n) : ax.value }));
  return {
    axes: cand.map(ax => ax.label),
    candidate: cand.map(ax => ax.value),
    average: avg.map(ax => ax.value),
    cohortSize: n,
    bank: bankKey,
  };
};

// Strengths (top competencies) and watch-outs (weak competencies) for the summary panels.
window.getCandidateHighlights = function (c) {
  const a = window.getCandidateAssessment(c);
  if (!a.completed) return { strengths: [], watchOuts: [] };
  const qs = a.assessment.questions.slice().sort((x, y) => y.score - x.score);
  const strengths = [];
  qs.filter(q => q.score >= 3.9).slice(0, 3).forEach(q => strengths.push({ label: q.competency, detail: `Scored ${q.score.toFixed(1)}/5 on this dimension.` }));
  if (a.english.score >= 88) strengths.push({ label: 'Advanced English', detail: `${a.english.level} · ${a.english.score}% — confident professional communication.` });
  const watchOuts = [];
  qs.filter(q => q.score < 3.2).slice(0, 3).forEach(q => watchOuts.push({ label: q.competency, detail: `Scored ${q.score.toFixed(1)}/5 — worth probing in interview.` }));
  if (a.assessment.integrity.risk >= 20) watchOuts.push({ label: 'Integrity flag', detail: `${a.assessment.integrity.risk}% risk — review the anti-fraud signals.` });
  return { strengths, watchOuts };
};
