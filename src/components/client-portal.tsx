"use client";

import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  NotebookPen,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
  addClientNote,
  auth,
  getClientUser,
  getOrganization,
  loginWithEmail,
  loginWithGoogle,
  logoutClient,
  markNotificationRead,
  saveNotificationPreferences,
  subscribeNotifications,
  subscribeOrgCollection,
  type ClientUser,
  type Organization,
  type PipelineCandidate,
  type PortalCandidate,
  type PortalNotification,
  type PortalNote,
  type PortalOpening,
  type PortalPipeline,
} from "@/lib/firebase-client";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "openings", label: "Openings", icon: BriefcaseBusiness },
  { id: "pipeline", label: "Pipeline", icon: ClipboardList },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "users", label: "Users", icon: UsersRound },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

const stageTone: Record<string, string> = {
  applied: "border-sky-200 bg-sky-50 text-sky-700",
  "profile-review": "border-violet-200 bg-violet-50 text-violet-700",
  assessment: "border-purple-200 bg-purple-50 text-purple-700",
  "background-check": "border-amber-200 bg-amber-50 text-amber-800",
  presented: "border-teal-200 bg-teal-50 text-teal-700",
  "client-review": "border-indigo-200 bg-indigo-50 text-indigo-700",
  hired: "border-emerald-200 bg-emerald-50 text-emerald-700",
  denied: "border-rose-200 bg-rose-50 text-rose-700",
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function dateTime(value: unknown) {
  const maybeTimestamp = value as { toDate?: () => Date } | null;
  const date = maybeTimestamp?.toDate ? maybeTimestamp.toDate() : new Date(String(value || Date.now()));
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name = "NW") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NW";
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tone || "border-stone-200 bg-white text-stone-700")}>
      {children}
    </span>
  );
}

function Score({ value = 0 }: { value?: number }) {
  const score = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="grid size-14 place-items-center rounded-full" style={{ background: `conic-gradient(#16A085 ${score * 3.6}deg, #EBEBEB 0deg)` }}>
      <div className="grid size-10 place-items-center rounded-full bg-white text-sm font-black text-[#111111]">{score || "—"}</div>
    </div>
  );
}

function salaryText(candidate: PortalCandidate | PipelineCandidate) {
  if (candidate.expectedSalary) return candidate.expectedSalary;
  if (candidate.salary) return candidate.salary;
  const amount = Number(candidate.expectedSalaryAmount || 0);
  if (!amount) return "Not shared";
  const currency = candidate.expectedSalaryCurrency || "USD";
  return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}/mo`;
}

function candidateKey(candidate: PortalCandidate | PipelineCandidate) {
  return (candidate as PortalCandidate).code || candidate.candidateCode || candidate.email || candidate.name || "";
}

function normalizeCandidate(item: PipelineCandidate, candidate?: PortalCandidate, pipeline?: PortalPipeline): PortalCandidate {
  const code = candidate?.code || item.code || item.candidateCode || candidate?.candidateCode || "";
  return {
    ...(candidate || {}),
    id: candidate?.id || code || item.email || item.name || "candidate",
    code,
    candidateCode: code,
    name: candidate?.name || item.name || item.email || "Candidate",
    email: candidate?.email || item.email || "",
    role: item.role || candidate?.role || candidate?.headline || pipeline?.openingTitle || "Candidate",
    stage: item.stage || candidate?.stage || item.status || "client-review",
    status: item.status || candidate?.status || "active",
    score: Number(item.score || candidate?.score || candidate?.lastAssessmentScore || 0),
    english: item.english || candidate?.english || "—",
    salary: item.salary || candidate?.salary || "",
    expectedSalary: item.expectedSalary || candidate?.expectedSalary || "",
    expectedSalaryAmount: item.expectedSalaryAmount || candidate?.expectedSalaryAmount,
    expectedSalaryCurrency: item.expectedSalaryCurrency || candidate?.expectedSalaryCurrency,
    location: item.location || candidate?.location || candidate?.city || "Colombia",
    skills: item.skills || candidate?.skills || [],
    cvUrl: candidate?.cvUrl || "",
    linkedin: candidate?.linkedin || "",
    discProfile: candidate?.discProfile,
  };
}

function timestampMs(value: unknown) {
  const maybeTimestamp = value as { toDate?: () => Date } | null;
  if (maybeTimestamp?.toDate) {
    return maybeTimestamp.toDate().getTime();
  }
  const parsed = new Date(String(value || Date.now())).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function LoginScreen({ message }: { message?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setBusy(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in did not complete.";
      setError(message.includes("auth/unauthorized-domain") ? "Google sign-in is not enabled for app.nearwork.co yet. Add app.nearwork.co in Firebase Auth authorized domains." : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#F5F4F0] px-5 py-10 text-[#111111] lg:grid-cols-[1fr_480px]">
      <section className="flex min-h-[520px] flex-col justify-between rounded-lg bg-[#111111] p-8 text-white lg:p-12">
        <div>
          <div className="text-2xl font-black">Near<span className="text-[#16A085]">work</span></div>
          <p className="mt-16 max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.04em] lg:text-7xl">
            Client hiring command center.
          </p>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/65">
            Review candidates, add client-only notes, track openings, and receive updates from Nearwork in one shared portal.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/5 p-4">Pipeline visibility</div>
          <div className="rounded-md border border-white/10 bg-white/5 p-4">Private client notes</div>
          <div className="rounded-md border border-white/10 bg-white/5 p-4">Realtime updates</div>
        </div>
      </section>
      <section className="flex items-center justify-center px-0 py-8 lg:px-10">
        <form onSubmit={submit} className="w-full rounded-lg border border-[#EBEBEB] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#12866E]">app.nearwork.co</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">Client login</h1>
          <p className="mt-2 text-sm leading-6 text-[#555555]">Use the email invited by Nearwork for your company portal.</p>
          {message ? <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</div> : null}
          <label className="mt-5 block text-sm font-bold">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 h-11 w-full rounded-md border border-[#EBEBEB] px-3 outline-none focus:border-[#16A085]" required />
          </label>
          <label className="mt-4 block text-sm font-bold">
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-2 h-11 w-full rounded-md border border-[#EBEBEB] px-3 outline-none focus:border-[#16A085]" required />
          </label>
          {error ? <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          <button disabled={busy} className="mt-5 h-11 w-full rounded-md bg-[#16A085] text-sm font-black text-white disabled:opacity-60">
            {busy ? "Logging in..." : "Log in"}
          </button>
          <button type="button" onClick={continueWithGoogle} disabled={busy} className="mt-3 h-11 w-full rounded-md border border-[#EBEBEB] bg-white text-sm font-black text-[#111111] disabled:opacity-60">
            Continue with Google
          </button>
        </form>
      </section>
    </main>
  );
}

function CandidateCard({
  candidate,
  pipeline,
  selected,
  onSelect,
}: {
  candidate: PortalCandidate;
  pipeline?: PortalPipeline;
  selected: boolean;
  onSelect: () => void;
}) {
  const stage = String(candidate.stage || "client-review").toLowerCase();
  return (
    <button onClick={onSelect} className={cx("w-full rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-[#16A085]", selected ? "border-[#16A085] ring-2 ring-[#16A085]/15" : "border-[#EBEBEB]")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black tracking-[-0.02em]">{candidate.name}</h3>
            <Badge tone={stageTone[stage] || "border-stone-200 bg-stone-50 text-stone-700"}>{candidate.stage || "Client review"}</Badge>
          </div>
          <p className="mt-1 text-sm text-[#555555]">{candidate.role} · {candidate.location || "Colombia"}</p>
          <p className="mt-1 text-xs font-bold text-[#9E9E9E]">{pipeline?.openingTitle || pipeline?.code || "General pipeline"}</p>
        </div>
        <Score value={candidate.score} />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div><p className="text-xs font-black uppercase tracking-wider text-[#9E9E9E]">Salary</p><p className="font-bold">{salaryText(candidate)}</p></div>
        <div><p className="text-xs font-black uppercase tracking-wider text-[#9E9E9E]">English</p><p className="font-bold">{candidate.english || "—"}</p></div>
        <div><p className="text-xs font-black uppercase tracking-wider text-[#9E9E9E]">DISC</p><p className="font-bold">{candidate.discProfile?.label || "Pending"}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(candidate.skills || []).slice(0, 5).map((skill) => <Badge key={skill}>{skill}</Badge>)}
      </div>
    </button>
  );
}

function NotificationPanel({
  notifications,
  onRead,
}: {
  notifications: PortalNotification[];
  onRead: (id: string) => void;
}) {
  return (
    <div className="absolute right-0 top-12 z-30 w-[min(380px,calc(100vw-32px))] rounded-lg border border-[#EBEBEB] bg-white shadow-xl">
      <div className="border-b border-[#EBEBEB] p-4">
        <p className="font-black">Notifications</p>
        <p className="text-xs text-[#555555]">Every notification includes date and time. Email summaries are buffered for 2 hours.</p>
      </div>
      <div className="max-h-96 overflow-auto">
        {notifications.length ? notifications.map((item) => (
          <button key={item.id} onClick={() => onRead(item.id)} className={cx("block w-full border-b border-[#EBEBEB] p-4 text-left last:border-b-0", item.read ? "bg-white" : "bg-[#E8F8F5]")}>
            <p className="text-sm font-black">{item.title || "Nearwork update"}</p>
            <p className="mt-1 text-sm leading-5 text-[#555555]">{item.message || ""}</p>
            <p className="mt-2 text-xs font-bold text-[#9E9E9E]">{dateTime(item.createdAt)}</p>
          </button>
        )) : <div className="p-6 text-center text-sm text-[#9E9E9E]">No notifications yet.</div>}
      </div>
    </div>
  );
}

export function ClientPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientUser | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [openings, setOpenings] = useState<PortalOpening[]>([]);
  const [pipelines, setPipelines] = useState<PortalPipeline[]>([]);
  const [candidates, setCandidates] = useState<PortalCandidate[]>([]);
  const [notes, setNotes] = useState<PortalNote[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [active, setActive] = useState<TabId>("overview");
  const [selectedCode, setSelectedCode] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteScope, setNoteScope] = useState<"client_visible" | "client_internal">("client_visible");
  const [search, setSearch] = useState("");
  const [showBell, setShowBell] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser);
    setAuthMessage("");
    if (!nextUser) {
      setProfile(null);
      setOrg(null);
      return;
    }
    const nextProfile = await getClientUser(nextUser);
    const role = String(nextProfile?.role || nextProfile?.portalRole || "").toLowerCase();
    const allowed = role.includes("client") || role.includes("org") || role === "viewer" || role === "user" || role === "admin";
    if (!nextProfile || !allowed) {
      setAuthMessage("This email is not invited to the client portal yet. Ask Nearwork to add it under the company users page.");
      await logoutClient();
      return;
    }
    setProfile(nextProfile);
    setOrg(await getOrganization(nextProfile));
  }), []);

  useEffect(() => {
    if (!org) return;
    const unsubscribers = [
      subscribeOrgCollection<PortalOpening>("openings", org, setOpenings),
      subscribeOrgCollection<PortalPipeline>("pipelines", org, setPipelines),
      subscribeOrgCollection<PortalNote>("candidateNotes", org, setNotes),
    ];
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [org]);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user, (items) => {
      setNotifications(items.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt)));
    });
  }, [user]);

  useEffect(() => {
    if (!org) return;
    return subscribeOrgCollection<PortalCandidate>("candidates", org, (rows) => {
      setCandidates(rows.map((item) => ({ ...item, code: item.code || item.candidateCode || item.id })));
    });
  }, [org]);

  const pipelineCandidates = useMemo(() => {
    const byCode = new Map<string, PortalCandidate>();
    candidates.forEach((candidate) => {
      const code = String(candidate.code || candidate.candidateCode || "").toLowerCase();
      const email = String(candidate.email || "").toLowerCase();
      if (code) byCode.set(code, candidate);
      if (email) byCode.set(email, candidate);
    });
    const rows: Array<{ candidate: PortalCandidate; pipeline: PortalPipeline }> = [];
    pipelines.forEach((pipeline) => {
      (pipeline.candidates || []).forEach((item) => {
        const code = String(item.code || item.candidateCode || "").toLowerCase();
        const email = String(item.email || "").toLowerCase();
        rows.push({ candidate: normalizeCandidate(item, byCode.get(code) || byCode.get(email), pipeline), pipeline });
      });
    });
    return rows;
  }, [candidates, pipelines]);

  const filteredCandidates = pipelineCandidates.filter(({ candidate, pipeline }) =>
    [candidate.name, candidate.email, candidate.role, pipeline.openingTitle, pipeline.code]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const selected = filteredCandidates.find(({ candidate }) => candidate.code === selectedCode) || filteredCandidates[0];
  const selectedNotes = notes
    .filter((note) => note.candidateCode === selected?.candidate.code)
    .filter((note) => note.scope === "client_visible" || note.scope === "client_internal" || note.visibility === "public")
    .sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
  const unread = notifications.filter((item) => !item.read).length;
  const activeOpenings = openings.filter((opening) => !["closed", "cancelled", "archived"].includes(String(opening.status || "").toLowerCase()));
  const hiredCount = pipelineCandidates.filter(({ candidate }) => String(candidate.stage || "").toLowerCase() === "hired").length;

  async function saveNote() {
    if (!org || !profile || !selected || !noteText.trim()) return;
    await addClientNote({
      org,
      profile,
      candidate: selected.candidate,
      pipeline: selected.pipeline,
      text: noteText.trim(),
      scope: noteScope,
    });
    setNoteText("");
  }

  async function updatePreference(key: string, channel: "app" | "email", checked: boolean) {
    if (!profile || !user) return;
    const preferences = {
      ...(profile.notificationPreferences || {}),
      [key]: { ...(profile.notificationPreferences?.[key] || {}), [channel]: checked },
    };
    setProfile({ ...profile, notificationPreferences: preferences });
    await saveNotificationPreferences(user.uid, preferences);
  }

  if (!user || authMessage) return <LoginScreen message={authMessage} />;

  if (!profile || !org) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F5F4F0] text-[#111111]">
        <div className="rounded-lg border border-[#EBEBEB] bg-white p-6 text-sm text-[#555555] shadow-sm">Loading client portal...</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111111]">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-20 flex-col border-r border-white/10 bg-[#111111] text-white lg:w-72">
        <div className="border-b border-white/10 p-4 lg:p-6">
          <div className="grid size-10 place-items-center rounded-md bg-[#16A085] text-lg font-black text-white lg:hidden">N</div>
          <div className="hidden lg:block">
            <p className="text-xl font-black">Near<span className="text-[#16A085]">work</span></p>
            <p className="mt-1 text-xs text-white/50">{org.name}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActive(tab.id)} className={cx("flex h-10 w-full items-center justify-center gap-3 rounded-md px-3 text-sm font-bold lg:justify-start", active === tab.id ? "bg-white text-[#111111]" : "text-white/65 hover:bg-white/10 hover:text-white")}>
                <Icon className="size-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3 lg:p-4">
          <div className="hidden rounded-lg border border-white/10 bg-white/5 p-3 lg:block">
            <p className="font-bold">{profile.name || profile.email}</p>
            <p className="mt-1 text-xs text-white/50">{profile.portalRole || profile.role || "Client user"}</p>
            <button onClick={() => logoutClient()} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-[#111111]">
              <LogOut className="size-4" /> Log out
            </button>
          </div>
          <button onClick={() => logoutClient()} className="grid size-11 place-items-center rounded-md bg-white/10 lg:hidden">{initials(profile.name || profile.email)}</button>
        </div>
      </aside>

      <main className="ml-20 min-h-screen lg:ml-72">
        <header className="sticky top-0 z-10 border-b border-[#EBEBEB] bg-[#F5F4F0]/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#12866E]">Client portal</p>
              <h1 className="text-2xl font-black tracking-[-0.03em]">Hiring command center</h1>
            </div>
            <div className="relative flex items-center gap-2">
              <button onClick={() => setShowBell(!showBell)} className="relative grid size-10 place-items-center rounded-md border border-[#EBEBEB] bg-white">
                <Bell className="size-4" />
                {unread ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#C73565] px-1 text-xs font-black text-white">{unread}</span> : null}
              </button>
              {showBell ? <NotificationPanel notifications={notifications} onRead={(id) => markNotificationRead(id)} /> : null}
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-[#111111] px-4 text-sm font-black text-white">
                <UserPlus className="size-4" /> Invite user
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-4 py-6 lg:px-8">
          {active === "overview" ? (
            <>
              <section className="grid gap-4 md:grid-cols-4">
                <Metric label="Active openings" value={activeOpenings.length} sub="Synced from Admin" />
                <Metric label="Pipeline candidates" value={pipelineCandidates.length} sub="Visible to your org" />
                <Metric label="Completed hires" value={hiredCount} sub="Moved to hired stage" />
                <Metric label="Unread updates" value={unread} sub="In-app notification center" />
              </section>
              <section className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
                <Panel title="Candidates needing review" eyebrow="Pipeline">
                  <div className="space-y-3">
                    {filteredCandidates.slice(0, 4).map(({ candidate, pipeline }) => (
                      <CandidateCard key={`${pipeline.code}-${candidateKey(candidate)}`} candidate={candidate} pipeline={pipeline} selected={selected?.candidate.code === candidate.code} onSelect={() => { setSelectedCode(candidate.code); setActive("pipeline"); }} />
                    ))}
                    {!filteredCandidates.length ? <Empty title="No candidates in client review yet" text="When Nearwork adds candidates to your pipeline, they will appear here." /> : null}
                  </div>
                </Panel>
                <Panel title="Nearwork updates" eyebrow="Notifications">
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((item) => (
                      <div key={item.id} className="rounded-md border border-[#EBEBEB] bg-white p-3">
                        <p className="font-bold">{item.title || "Nearwork update"}</p>
                        <p className="mt-1 text-sm leading-6 text-[#555555]">{item.message}</p>
                        <p className="mt-2 text-xs font-bold text-[#9E9E9E]">{dateTime(item.createdAt)}</p>
                      </div>
                    ))}
                    {!notifications.length ? <Empty title="No updates yet" text="Your bell will show candidate movement, notes, mentions, and opening updates." /> : null}
                  </div>
                </Panel>
              </section>
            </>
          ) : null}

          {active === "openings" ? (
            <Panel title="Openings" eyebrow="Roles">
              <div className="grid gap-3">
                {openings.map((opening) => (
                  <article key={opening.id} className="rounded-lg border border-[#EBEBEB] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black">{opening.title}</h3>
                        <p className="mt-1 text-sm text-[#555555]">{opening.code} · {opening.roleLibraryDepartment || "Department pending"} · {opening.roleLibrarySeniority || "Seniority pending"}</p>
                      </div>
                      <Badge>{opening.status || "active"}</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                      <Detail label="Recruiter" value={opening.recruiter || "Assigned by Nearwork"} />
                      <Detail label="Backup" value={opening.backupRecruiter || "Internal"} />
                      <Detail label="Manager" value={opening.recruitingManager || "Internal"} />
                      <Detail label="Salary" value={opening.salaryMin && opening.salaryMax ? `${opening.currency || "USD"} ${opening.salaryMin.toLocaleString()} - ${opening.salaryMax.toLocaleString()}` : "Client-approved range"} />
                    </div>
                  </article>
                ))}
                {!openings.length ? <Empty title="No openings yet" text="Your active Nearwork openings will sync here from Admin." /> : null}
              </div>
            </Panel>
          ) : null}

          {active === "pipeline" ? (
            <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <Panel title="Pipeline candidates" eyebrow="Review">
                <div className="mb-4 flex items-center gap-2 rounded-md border border-[#EBEBEB] bg-white px-3">
                  <Search className="size-4 text-[#9E9E9E]" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidates, openings, pipeline..." className="h-11 flex-1 bg-transparent text-sm outline-none" />
                </div>
                <div className="space-y-3">
                  {filteredCandidates.map(({ candidate, pipeline }) => (
                    <CandidateCard key={`${pipeline.code}-${candidateKey(candidate)}`} candidate={candidate} pipeline={pipeline} selected={selected?.candidate.code === candidate.code} onSelect={() => setSelectedCode(candidate.code)} />
                  ))}
                  {!filteredCandidates.length ? <Empty title="No matching candidates" text="Try another search or wait for Nearwork to present candidates." /> : null}
                </div>
              </Panel>
              <Panel title={selected?.candidate.name || "Candidate"} eyebrow="Candidate profile">
                {selected ? (
                  <CandidateDetail
                    candidate={selected.candidate}
                    pipeline={selected.pipeline}
                    notes={selectedNotes}
                    noteText={noteText}
                    noteScope={noteScope}
                    setNoteText={setNoteText}
                    setNoteScope={setNoteScope}
                    saveNote={saveNote}
                  />
                ) : <Empty title="Select a candidate" text="Candidate details and notes will appear here." />}
              </Panel>
            </section>
          ) : null}

          {active === "notes" ? (
            <Panel title="Client notes" eyebrow="Scoped by pipeline">
              <div className="grid gap-3">
                {notes.filter((note) => note.scope === "client_visible" || note.scope === "client_internal").map((note) => (
                  <article key={note.id} className="rounded-lg border border-[#EBEBEB] bg-white p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div><p className="font-black">{note.pipelineTitle || note.candidateCode}</p><p className="text-sm text-[#555555]">{note.scope === "client_internal" ? "Client internal only" : "Visible to Nearwork and client"} · {note.author}</p></div>
                      <p className="text-xs font-bold text-[#9E9E9E]">{dateTime(note.createdAt)}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#555555]">{note.text}</p>
                  </article>
                ))}
                {!notes.length ? <Empty title="No notes yet" text="Notes added in candidate profiles will appear here." /> : null}
              </div>
            </Panel>
          ) : null}

          {active === "users" ? (
            <Panel title="Company users" eyebrow="Access">
              <CompanyUsers org={org} />
            </Panel>
          ) : null}

          {active === "settings" ? (
            <Panel title="Notification settings" eyebrow="Preferences">
              <div className="grid gap-3">
                {[
                  ["candidateMovement", "Candidate movement"],
                  ["openingUpdates", "Opening updates"],
                  ["mentions", "Mentions"],
                  ["interviews", "Interview reminders"],
                ].map(([key, label]) => {
                  const pref = profile.notificationPreferences?.[key] || {};
                  return (
                    <div key={key} className="grid gap-3 rounded-md border border-[#EBEBEB] bg-white p-4 md:grid-cols-[1fr_120px_120px]">
                      <p className="font-black">{label}</p>
                      <label className="text-sm"><input type="checkbox" defaultChecked={pref.app !== false} onChange={(event) => updatePreference(key, "app", event.target.checked)} /> In-app</label>
                      <label className="text-sm"><input type="checkbox" defaultChecked={pref.email !== false} onChange={(event) => updatePreference(key, "email", event.target.checked)} /> Email</label>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#555555]">Email notifications should be sent by the backend digest job with a 2-hour buffer. The bell shows the full notification history immediately.</p>
            </Panel>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: number; sub: string }) {
  return <div className="rounded-lg border border-[#EBEBEB] bg-white p-5 shadow-sm"><p className="text-sm font-bold text-[#555555]">{label}</p><p className="mt-3 text-3xl font-black">{value}</p><p className="mt-2 text-sm text-[#12866E]">{sub}</p></div>;
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-[#EBEBEB] bg-white/60 p-5 shadow-sm"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#12866E]">{eyebrow}</p><h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">{title}</h2></div></div>{children}</section>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-black uppercase tracking-wider text-[#9E9E9E]">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="rounded-lg border border-dashed border-[#EBEBEB] bg-white p-8 text-center"><p className="font-black">{title}</p><p className="mt-2 text-sm text-[#555555]">{text}</p></div>;
}

function CandidateDetail({
  candidate,
  pipeline,
  notes,
  noteText,
  noteScope,
  setNoteText,
  setNoteScope,
  saveNote,
}: {
  candidate: PortalCandidate;
  pipeline: PortalPipeline;
  notes: PortalNote[];
  noteText: string;
  noteScope: "client_visible" | "client_internal";
  setNoteText: (value: string) => void;
  setNoteScope: (value: "client_visible" | "client_internal") => void;
  saveNote: () => void;
}) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="grid size-12 place-items-center rounded-md bg-[#111111] font-black text-white">{initials(candidate.name)}</div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black">{candidate.name}</p>
          <p className="text-sm text-[#555555]">{candidate.role} · {pipeline.openingTitle}</p>
        </div>
        <Score value={candidate.score} />
      </div>
      <div className="mt-5 grid gap-3 text-sm">
        <Detail label="Email" value={candidate.email || "Not shared"} />
        <Detail label="Salary expectation" value={salaryText(candidate)} />
        <Detail label="Assessment" value={`Overall ${candidate.lastAssessmentScore || candidate.score || "pending"} · Technical ${candidate.lastTechnicalScore || "pending"}`} />
        <Detail label="DISC" value={candidate.discProfile?.label || "Pending"} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {candidate.cvUrl ? <a href={candidate.cvUrl} target="_blank" className="inline-flex h-9 items-center gap-2 rounded-md border border-[#EBEBEB] px-3 text-sm font-bold"><FileText className="size-4" /> CV</a> : null}
        {candidate.linkedin ? <a href={candidate.linkedin} target="_blank" className="inline-flex h-9 items-center gap-2 rounded-md border border-[#EBEBEB] px-3 text-sm font-bold"><ShieldCheck className="size-4" /> LinkedIn</a> : null}
      </div>
      <div className="mt-6 rounded-md border border-[#EBEBEB] bg-[#F5F4F0] p-4">
        <p className="font-black">Add note</p>
        <select value={noteScope} onChange={(event) => setNoteScope(event.target.value as "client_visible" | "client_internal")} className="mt-3 h-10 w-full rounded-md border border-[#EBEBEB] bg-white px-3 text-sm">
          <option value="client_visible">Visible to Nearwork for this pipeline</option>
          <option value="client_internal">Client internal only</option>
        </select>
        <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Type @ to mention a client or Nearwork teammate..." className="mt-3 min-h-28 w-full resize-none rounded-md border border-[#EBEBEB] bg-white p-3 text-sm outline-none focus:border-[#16A085]" />
        <button onClick={saveNote} disabled={!noteText.trim()} className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-[#16A085] px-4 text-sm font-black text-white disabled:opacity-50"><MessageCircle className="size-4" /> Save note</button>
      </div>
      <div className="mt-6 space-y-3">
        <p className="font-black">Notes for this candidate</p>
        {notes.map((note) => (
          <article key={note.id} className="rounded-md border border-[#EBEBEB] bg-white p-3">
            <div className="flex justify-between gap-3">
              <p className="text-sm font-black">{note.scope === "client_internal" ? "Client internal" : "Shared with Nearwork"}</p>
              <p className="text-xs font-bold text-[#9E9E9E]">{dateTime(note.createdAt)}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#555555]">{note.text}</p>
          </article>
        ))}
        {!notes.length ? <p className="text-sm text-[#9E9E9E]">No notes for this candidate yet.</p> : null}
      </div>
    </div>
  );
}

function CompanyUsers({ org }: { org: Organization }) {
  const [users, setUsers] = useState<ClientUser[]>([]);

  useEffect(() => {
    return subscribeOrgCollection<ClientUser>("users", org, setUsers);
  }, [org.id, org.orgId]);

  return (
    <div className="overflow-x-auto rounded-lg border border-[#EBEBEB] bg-white">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-[#F5F4F0] text-xs font-black uppercase tracking-wider text-[#555555]">
          <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-[#EBEBEB]">
          {users.map((item) => <tr key={item.id}><td className="px-4 py-3 font-bold">{item.name || [item.firstName, item.lastName].filter(Boolean).join(" ") || item.email}</td><td className="px-4 py-3 text-[#555555]">{item.email}</td><td className="px-4 py-3"><Badge>{item.portalRole || item.role || "user"}</Badge></td><td className="px-4 py-3 text-[#12866E]">Active</td></tr>)}
          {!users.length ? <tr><td colSpan={4} className="px-4 py-8 text-center text-[#9E9E9E]">No company users found yet.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
