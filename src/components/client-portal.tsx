"use client";

import {
  ArrowDownToLine,
  Award,
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  Crown,
  ExternalLink,
  FileText,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Shield,
  Sparkles,
  Star,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  AccessRole,
  Candidate,
  candidates,
  company,
  executiveMetrics,
  interviews,
  navItems,
  users,
  valueTimeline,
} from "@/lib/portal-data";

const stageStyles: Record<string, string> = {
  Shortlisted: "border-sky-200 bg-sky-50 text-sky-700",
  "Client interview": "border-violet-200 bg-violet-50 text-violet-700",
  "Final review": "border-amber-200 bg-amber-50 text-amber-800",
  Offer: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Hired: "border-teal-200 bg-teal-50 text-teal-700",
  "Not selected": "border-rose-200 bg-rose-50 text-rose-700",
};

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone ?? "border-stone-200 bg-white text-stone-700"}`}
    >
      {children}
    </span>
  );
}

function ScoreRing({ value }: { value: number }) {
  const style = {
    background: `conic-gradient(#0f766e ${value * 3.6}deg, #e7e5e4 0deg)`,
  };

  return (
    <div className="grid size-16 place-items-center rounded-full" style={style}>
      <div className="grid size-12 place-items-center rounded-full bg-white text-sm font-bold text-stone-950">
        {value}
      </div>
    </div>
  );
}

function Rating({ value = 0 }: { value?: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-4 ${index < value ? "fill-current" : "text-stone-300"}`}
        />
      ))}
    </div>
  );
}

function CandidateCard({
  candidate,
  selected,
  onToggleCompare,
}: {
  candidate: Candidate;
  selected: boolean;
  onToggleCompare: (candidate: Candidate) => void;
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-stone-950">{candidate.name}</h3>
            <Badge tone={stageStyles[candidate.stage]}>{candidate.stage}</Badge>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {candidate.role} · {candidate.location} · {candidate.experience}
          </p>
        </div>
        <ScoreRing value={candidate.nearworkScore} />
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Salary</p>
          <p className="font-semibold text-stone-900">{candidate.salary}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">English</p>
          <p className="font-semibold text-stone-900">{candidate.englishScore}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Available</p>
          <p className="font-semibold text-stone-900">{candidate.availability}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-stone-700">{candidate.progression}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {candidate.strengths.map((strength) => (
          <Badge key={strength}>{strength}</Badge>
        ))}
      </div>

      <div className="mt-5 grid gap-3 border-t border-stone-100 pt-4 md:grid-cols-[1fr_auto]">
        <div className="text-sm text-stone-600">
          <p>
            Recruiter: <span className="font-medium text-stone-900">{candidate.recruiter}</span>
          </p>
          <p>
            CSM: <span className="font-medium text-stone-900">{candidate.csm}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 hover:bg-stone-50">
            <FileText className="size-4" />
            CV
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 hover:bg-stone-50">
            <MessageCircle className="size-4" />
            Notes
          </button>
          <button
            onClick={() => onToggleCompare(candidate)}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium ${
              selected
                ? "bg-stone-950 text-white"
                : "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50"
            }`}
          >
            <Check className="size-4" />
            Compare
          </button>
        </div>
      </div>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-stone-950">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function ClientPortal() {
  const [active, setActive] = useState<(typeof navItems)[number]["id"]>("overview");
  const [role, setRole] = useState<AccessRole>("Admin");
  const [compareIds, setCompareIds] = useState<string[]>(["NW-4821", "NW-4860"]);
  const [note, setNote] = useState(
    "Camila looked strongest for product ownership. Ask final panel to probe mentorship and timeline."
  );

  const activeCandidates = candidates.filter((candidate) => candidate.stage !== "Not selected");
  const notSelected = candidates.filter((candidate) => candidate.stage === "Not selected");
  const hired = candidates.filter((candidate) => candidate.stage === "Hired");
  const compared = useMemo(
    () => candidates.filter((candidate) => compareIds.includes(candidate.id)),
    [compareIds]
  );

  function toggleCompare(candidate: Candidate) {
    setCompareIds((current) =>
      current.includes(candidate.id)
        ? current.filter((id) => id !== candidate.id)
        : [...current.slice(-2), candidate.id]
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-stone-950">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-20 flex-col border-r border-stone-200 bg-[#101820] text-white md:w-72">
        <div className="border-b border-white/10 px-3 py-6 md:px-6">
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <div className="grid size-10 place-items-center rounded-md bg-teal-400 text-lg font-black text-[#101820]">
              N
            </div>
            <div className="hidden md:block">
              <p className="text-lg font-semibold">Nearwork</p>
              <p className="text-xs text-white/55">{company.name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                title={item.label}
                aria-label={item.label}
                className={`flex h-10 w-full items-center justify-center gap-3 rounded-md px-3 text-sm font-medium transition md:justify-start ${
                  selected
                    ? "bg-white text-[#101820]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="size-4" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 md:p-4">
          <div className="mb-3 hidden rounded-md bg-white/8 p-1 md:flex">
            {(["Admin", "User"] as AccessRole[]).map((option) => (
              <button
                key={option}
                onClick={() => setRole(option)}
                className={`h-8 flex-1 rounded px-3 text-xs font-semibold ${
                  role === option ? "bg-teal-300 text-[#101820]" : "text-white/65"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="hidden rounded-lg border border-white/10 bg-white/6 p-3 md:block">
            <p className="text-sm font-semibold">Valentina Arias</p>
            <p className="text-xs text-white/55">valentina@{company.domain}</p>
            <div className="mt-3 flex gap-2">
              <button className="h-8 flex-1 rounded-md bg-white/10 text-xs font-medium hover:bg-white/15">
                Account
              </button>
              <button className="h-8 flex-1 rounded-md bg-white text-xs font-semibold text-[#101820]">
                Logout
              </button>
            </div>
          </div>
          <button
            title="Account"
            className="grid size-11 place-items-center rounded-md border border-white/10 bg-white/10 text-sm font-semibold md:hidden"
          >
            VA
          </button>
        </div>
      </aside>

      <main className="ml-20 min-h-screen md:ml-72">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-[#f7f5f1]/92 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-500">Client portal</p>
              <h1 className="text-2xl font-semibold text-stone-950 md:text-3xl">Hiring command center</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="grid size-10 place-items-center rounded-md border border-stone-200 bg-white text-stone-700 shadow-sm">
                <Bell className="size-4" />
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white shadow-sm">
                <Plus className="size-4" />
                Invite user
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-8 px-4 py-6 md:px-8 md:py-8">
          {active === "overview" && (
            <>
              <section className="grid gap-4 lg:grid-cols-4">
                {executiveMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-stone-500">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-stone-950">{metric.value}</p>
                    <p className="mt-2 text-sm text-teal-700">{metric.change}</p>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <SectionHeader eyebrow="Pipeline" title="Decision-ready candidates">
                    <button
                      onClick={() => setActive("pipeline")}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-medium"
                    >
                      View all
                      <ChevronRight className="size-4" />
                    </button>
                  </SectionHeader>
                  <div className="space-y-4">
                    {activeCandidates.slice(0, 3).map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        selected={compareIds.includes(candidate.id)}
                        onToggleCompare={toggleCompare}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                    <SectionHeader eyebrow="Value" title="Nearwork impact" />
                    <div className="space-y-4">
                      {valueTimeline.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-md bg-teal-50 text-teal-700">
                              <Icon className="size-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-stone-600">{item.label}</p>
                              <p className="text-xl font-semibold text-stone-950">{item.value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-stone-200 bg-[#101820] p-5 text-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <Sparkles className="size-5 text-teal-300" />
                      <h2 className="text-xl font-semibold">Recruiter intelligence</h2>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-white/70">
                      {company.recruiterLead} has flagged Camila and Luis as the strongest
                      near-term hires. Diego is strong, pending reference validation.
                    </p>
                    <div className="mt-5 grid gap-3 text-sm">
                      <p>
                        CSM: <span className="font-semibold text-white">{company.csm}</span>
                      </p>
                      <p>
                        Account owner:{" "}
                        <span className="font-semibold text-white">{company.accountOwner}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {active === "pipeline" && (
            <section>
              <SectionHeader eyebrow="Client pipeline" title="Candidates selected for review">
                <div className="flex gap-2">
                  <Badge>{activeCandidates.length} active</Badge>
                  <Badge>{notSelected.length} closed</Badge>
                </div>
              </SectionHeader>
              <div className="grid gap-4 xl:grid-cols-2">
                {activeCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    selected={compareIds.includes(candidate.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            </section>
          )}

          {active === "compare" && (
            <section>
              <SectionHeader eyebrow="Compare" title="Side-by-side hiring decision" />
              <div className="grid gap-4 lg:grid-cols-3">
                {compared.map((candidate) => (
                  <article key={candidate.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">{candidate.name}</h3>
                        <p className="text-sm text-stone-600">{candidate.role}</p>
                      </div>
                      <ScoreRing value={candidate.nearworkScore} />
                    </div>
                    <dl className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-stone-500">Salary</dt>
                        <dd className="font-semibold">{candidate.salary}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-stone-500">English</dt>
                        <dd className="font-semibold">{candidate.englishScore}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-stone-500">Availability</dt>
                        <dd className="font-semibold">{candidate.availability}</dd>
                      </div>
                    </dl>
                    <div className="mt-5">
                      <p className="text-sm font-semibold">Strengths</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {candidate.strengths.map((strength) => (
                          <Badge key={strength}>{strength}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5">
                      <p className="text-sm font-semibold">Assessment</p>
                      <p className="mt-2 text-sm leading-6 text-stone-700">
                        {candidate.assessment.summary}
                      </p>
                    </div>
                  </article>
                ))}
                <article className="rounded-lg border border-dashed border-stone-300 bg-white/60 p-5">
                  <p className="text-sm font-semibold text-stone-800">Internal decision note</p>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="mt-3 min-h-48 w-full resize-none rounded-md border border-stone-200 bg-white p-3 text-sm outline-none ring-teal-600 focus:ring-2"
                  />
                  <button className="mt-3 inline-flex h-9 items-center rounded-md bg-teal-700 px-3 text-sm font-semibold text-white">
                    Save note
                  </button>
                </article>
              </div>
            </section>
          )}

          {active === "interviews" && (
            <section>
              <SectionHeader eyebrow="Calendar" title="Upcoming interviews" />
              <div className="grid gap-4 lg:grid-cols-3">
                {interviews.map((interview) => (
                  <article key={interview.title} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                    <Badge>{interview.type}</Badge>
                    <h3 className="mt-4 text-lg font-semibold">{interview.candidate}</h3>
                    <p className="text-sm text-stone-600">{interview.title}</p>
                    <p className="mt-4 text-sm font-semibold text-stone-950">{interview.when}</p>
                    <p className="mt-1 text-sm text-stone-500">Owner: {interview.owner}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {active === "hired" && (
            <section>
              <SectionHeader eyebrow="EOR" title="Hired candidates and follow-up" />
              <div className="grid gap-4 lg:grid-cols-2">
                {hired.map((candidate) => (
                  <article key={candidate.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">{candidate.name}</h3>
                        <p className="text-sm text-stone-600">{candidate.role}</p>
                      </div>
                      <Badge tone={stageStyles.Hired}>EOR active</Badge>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone-500">Payroll</p>
                        <p className="font-semibold">Current</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone-500">Check-in</p>
                        <p className="font-semibold">30 days done</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone-500">Rating</p>
                        <Rating value={candidate.clientRating} />
                      </div>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-stone-700">{candidate.processNotes}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {active === "not-selected" && (
            <section>
              <SectionHeader eyebrow="Closed candidates" title="Why candidates did not advance" />
              <div className="grid gap-4">
                {notSelected.map((candidate) => (
                  <article key={candidate.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">{candidate.name}</h3>
                        <p className="text-sm text-stone-600">{candidate.role}</p>
                      </div>
                      <Badge tone={stageStyles["Not selected"]}>Not selected</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-stone-700">
                      {candidate.rejectionReason}
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <p className="rounded-md bg-stone-50 p-3 text-sm">{candidate.assessment.english}</p>
                      <p className="rounded-md bg-stone-50 p-3 text-sm">{candidate.assessment.technical}</p>
                      <p className="rounded-md bg-stone-50 p-3 text-sm">{candidate.assessment.summary}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {active === "billing" && (
            <section>
              <SectionHeader eyebrow="Payment" title="Subscription and savings" />
              <div className="grid gap-4 lg:grid-cols-3">
                <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <CircleDollarSign className="size-7 text-teal-700" />
                  <h3 className="mt-4 text-xl font-semibold">{company.plan}</h3>
                  <p className="mt-2 text-sm text-stone-600">{company.subscription}</p>
                  <p className="mt-4 text-sm font-medium">Next invoice: {company.nextInvoice}</p>
                </article>
                <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <Award className="size-7 text-amber-600" />
                  <h3 className="mt-4 text-xl font-semibold">$42.8k saved</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Savings combine recruiting time, reduced agency fees, and faster time-to-hire.
                  </p>
                </article>
                <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <Shield className="size-7 text-indigo-600" />
                  <h3 className="mt-4 text-xl font-semibold">
                    {company.seatsUsed}/{company.seatsTotal} seats
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">Annual billing · company domain locked</p>
                </article>
              </div>
            </section>
          )}

          {active === "users" && (
            <section>
              <SectionHeader eyebrow="Access" title="Company users and permissions">
                <Badge tone={role === "Admin" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-amber-200 bg-amber-50 text-amber-800"}>
                  {role} mode
                </Badge>
              </SectionHeader>
              <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.map((user) => (
                      <tr key={user.email}>
                        <td className="px-5 py-4 font-medium">{user.name}</td>
                        <td className="px-5 py-4 text-stone-600">{user.email}</td>
                        <td className="px-5 py-4">
                          <Badge>{user.role}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          {role === "Admin" ? (
                            <div className="flex gap-2">
                              <button className="grid size-8 place-items-center rounded-md border border-stone-200 text-stone-700">
                                <Crown className="size-4" />
                              </button>
                              <button className="grid size-8 place-items-center rounded-md border border-stone-200 text-rose-600">
                                <UserMinus className="size-4" />
                              </button>
                            </div>
                          ) : (
                            <LockKeyhole className="size-4 text-stone-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300" disabled={role !== "Admin"}>
                  <UserPlus className="size-4" />
                  Invite by domain
                </button>
              </div>
            </section>
          )}

          {active === "settings" && (
            <section>
              <SectionHeader eyebrow="Company" title="Portal settings" />
              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold">Invite-only access</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    New clients join from an admin invitation and create credentials with the
                    approved company domain.
                  </p>
                  <div className="mt-5 grid gap-3 text-sm">
                    <p>Allowed domain: <span className="font-semibold">{company.domain}</span></p>
                    <p>Authentication: <span className="font-semibold">Email and password</span></p>
                    <p>SSO: <span className="font-semibold">Off</span></p>
                  </div>
                </article>
                <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold">Nearwork contacts</h3>
                  <div className="mt-5 space-y-3 text-sm">
                    <p className="flex items-center gap-2"><Mail className="size-4 text-teal-700" /> sofia@nearwork.co</p>
                    <p className="flex items-center gap-2"><Phone className="size-4 text-teal-700" /> +57 300 555 0199</p>
                    <p className="flex items-center gap-2"><ExternalLink className="size-4 text-teal-700" /> app.nearwork.co</p>
                  </div>
                  <button className="mt-5 inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-medium">
                    <ArrowDownToLine className="size-4" />
                    Export portal data
                  </button>
                </article>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
