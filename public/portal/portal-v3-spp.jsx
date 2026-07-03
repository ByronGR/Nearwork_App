// SPP — Strategic Partner Program. The partner's portfolio of end-clients.
// Read-only progress view. Money lives in Billing, not here.
// Each client opens into the same shape as a client workspace: Team (hires +
// managed teams) and Openings (recruitment → pick a role → see the stages).

// ── Shared generators (deterministic placeholder data per client) ────────────
const SPP_POOL = [
  { n: 'Andrés Gil', bg: '#16A085' }, { n: 'María Soto', bg: '#E74C7C' }, { n: 'Cris Mora', bg: '#3B82F6' },
  { n: 'Laura Vega', bg: '#AF7AC5' }, { n: 'Diego Páez', bg: '#12866E' }, { n: 'Sara Ruiz', bg: '#EAB308' },
  { n: 'Juan Toro', bg: '#3B82F6' }, { n: 'Eva Lara', bg: '#16A085' }, { n: 'Pablo Niño', bg: '#E74C7C' },
  { n: 'Nora Díaz', bg: '#AF7AC5' }, { n: 'Tomás Rey', bg: '#16A085' }, { n: 'Iván Cano', bg: '#12866E' },
  { n: 'Lucía Peña', bg: '#3B82F6' }, { n: 'Mateo Gil', bg: '#EAB308' }, { n: 'Ana Mejía', bg: '#E74C7C' },
  { n: 'Felipe Cruz', bg: '#AF7AC5' }, { n: 'Sofía Rey', bg: '#16A085' }, { n: 'Carla Vives', bg: '#12866E' },
];
const SPP_ROLES = ['Backend Engineer', 'Frontend Engineer', 'Product Designer', 'DevOps Engineer', 'Data Engineer', 'QA Engineer', 'Customer Success'];
const SPP_TEAMNAMES = ['Platform', 'Product', 'Infrastructure', 'Data', 'Growth', 'Mobile'];
const SPP_SENIORITY = ['Senior', 'Mid', 'Junior'];
const SPP_LOCATIONS = ['Bogotá · Remote', 'Medellín · Remote', 'Cali · Remote', 'Barranquilla · Remote', 'Remote · LATAM', 'Bucaramanga · Remote'];
const SPP_SINCE = ['Feb 2026', 'Apr 2026', 'Mar 2025', 'Jun 2025', 'Dec 2025', 'Sep 2025'];
const SPP_TENURE = ['4 mo', '2 mo', '15 mo', '12 mo', '6 mo', '9 mo'];
const SPP_AMS = ['Lina Pardo', 'Andrés Gómez', 'Camila Ortiz'];
const sppInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
function sppPick(i) { return SPP_POOL[i % SPP_POOL.length]; }

function sppPeople(c) {
  const base = [];
  (c.people || []).forEach(p => base.push({ name: p.name, initials: p.initials, avatarBg: p.avatarBg, role: p.role, seniority: 'Senior' }));
  for (let i = base.length; i < c.hires; i++) {
    const p = sppPick(i + c.name.length);
    base.push({ name: p.n, initials: sppInitials(p.n), avatarBg: p.bg, role: SPP_ROLES[i % SPP_ROLES.length], seniority: SPP_SENIORITY[i % 3] });
  }
  return base.map((p, i) => ({
    ...p, id: c.id + '-h' + i, idx: i, status: 'active',
    location: SPP_LOCATIONS[i % SPP_LOCATIONS.length],
    since: SPP_SINCE[i % SPP_SINCE.length],
    tenure: SPP_TENURE[i % SPP_TENURE.length],
    utilization: i % 5 === 3 ? 80 : 100,
    accountManager: SPP_AMS[i % SPP_AMS.length],
    teamName: c.teams ? SPP_TEAMNAMES[i % c.teams] : null,
  }));
}

// Deterministic, read-only performance reviews for an SPP hire (conducted by Nearwork).
function sppHireReviews(c, p) {
  const cats = window.NW_REVIEW_CATEGORIES || ['Quality of work', 'Communication', 'Ownership', 'Collaboration', 'Growth'];
  const i = p.idx || 0;
  const first = p.name.split(' ')[0];
  const mk = (period, date, base) => ({
    id: p.id + '-' + period.replace(/\s/g, ''), type: period.indexOf('Annual') >= 0 ? 'annual' : 'quarterly', period, date,
    rating: base, reviewer: p.accountManager, reviewerRole: 'Account manager · Nearwork', conductedBy: 'Nearwork',
    summary: `${first} continues to deliver reliably on the ${p.teamName || p.role} work — strong ownership, dependable communication, and a steady presence across the engagement.`,
    categories: cats.map((label, k) => ({ label, score: Math.max(3, Math.min(5, Math.round(base) + ((k + i) % 2 === 0 ? 0 : -1))) })),
    strengths: ['Reliable delivery', 'Clear communication', 'Ownership'],
    growth: ['Driving cross-team initiatives', 'Earlier documentation'],
    goals: [{ text: 'Take on broader scope next quarter', status: 'in-progress' }],
  });
  const months = parseInt(p.tenure, 10) || 9;
  const out = [mk('Q1 2026', 'Apr 8, 2026', 4 + ((i % 3) * 0.2))];
  if (months >= 12) out.push(mk('2025 Annual', 'Jan 14, 2026', 4.2 + ((i % 2) * 0.3)));
  return out;
}

// Full HR profile for an SPP hire — same shape as the Team area (comp, PTO, updates).
function sppHireFull(c, p) {
  const i = p.idx || 0;
  const first = p.name.split(' ')[0];
  const band = { Senior: 6000, Mid: 4600, Junior: 3500 }[p.seniority] || 4600;
  const monthly = band + (i % 4) * 130;
  const fmt = (n) => '$' + n.toLocaleString('en-US');
  const vacUsed = [2, 4, 5, 6, 3, 4][i % 6];
  const reviews = sppHireReviews(c, p);
  const ptoSets = [
    [{ label: 'Vacation', dates: 'Jul 14 – Jul 18', days: 5, status: 'approved' }],
    [{ label: 'Personal day', dates: 'Aug 1', days: 1, status: 'pending' }, { label: 'Long weekend', dates: 'Jul 21 – Jul 22', days: 2, status: 'approved' }],
    [{ label: 'Medical appointment', dates: 'Jul 9', days: 1, status: 'approved' }],
  ];
  const upcomingPTO = ptoSets[i % 3];
  const updates = [
    { id: p.id + '-u1', type: 'review', text: `Q2 2026 review is scheduled — Nearwork will conduct it`, when: '3 days ago', unread: true },
    { id: p.id + '-u2', type: 'pto', text: `${first}'s time off ${upcomingPTO[0].dates} was logged`, when: '1 week ago', unread: false },
    { id: p.id + '-u3', type: 'doc', text: `signed the latest EOR contract addendum`, when: p.since, unread: false },
  ];
  return {
    sourceRole: p.role, manager: p.accountManager,
    salaryMonthly: fmt(monthly), salaryAnnual: fmt(monthly * 12), currency: 'USD',
    contractType: 'EOR · Full-time',
    lastReview: reviews.length > 1 ? 'Jan 2026' : 'Apr 2026', nextReview: 'Jul 2026',
    vacationTotal: 15, vacationUsed: vacUsed, vacationRemaining: 15 - vacUsed,
    upcomingPTO, updates, reviews,
  };
}
function sppTeams(c) {
  const people = sppPeople(c);
  const out = [];
  const per = Math.max(2, Math.floor(c.hires / Math.max(1, c.teams)));
  const AMS = [{ name: 'Lina Pardo', initials: 'LP' }, { name: 'Andrés Gómez', initials: 'AG' }, { name: 'Camila Ortiz', initials: 'CO' }];
  const REGIONS = ['Antioquia', null, 'Bogotá', 'Valle del Cauca'];
  for (let i = 0; i < c.teams; i++) {
    const members = people.slice(i * per, i * per + per);
    const mm = members.length ? members : people.slice(0, 2);
    out.push({
      id: 't' + i, name: SPP_TEAMNAMES[i % SPP_TEAMNAMES.length], lead: mm[0],
      members: mm, accent: ['#16A085', '#3B82F6', '#E74C7C', '#AF7AC5'][i % 4],
      focus: ['Core services & delivery', 'Product & design', 'Cloud & reliability', 'Data & analytics'][i % 4],
      accountManager: AMS[i % AMS.length], pod: REGIONS[i % REGIONS.length],
      established: ['Jan 2025', 'Mar 2025', 'Jun 2025'][i % 3], hoursPartner: '8:00 – 17:00', hoursColombia: '9:00 – 18:00',
      health: i % 4 === 2 ? 'attention' : 'on-track',
    });
  }
  return out;
}
function sppOpenings(c) {
  const out = [];
  const stageKeys = [1, 2, 3, 4, 5];
  for (let i = 0; i < c.openRoles; i++) {
    const total = Math.max(4, Math.round(c.pipeline / Math.max(1, c.openRoles)));
    const cands = [];
    for (let k = 0; k < total; k++) {
      const p = sppPick(i * 5 + k + 3);
      const stageIdx = stageKeys[k % stageKeys.length];
      cands.push({ id: c.id + '-' + i + '-' + k, name: p.n, initials: sppInitials(p.n), avatarBg: p.bg, score: 72 + ((i * 7 + k * 11) % 24), stageIdx });
    }
    // a couple not selected
    for (let k = 0; k < 2; k++) {
      const p = sppPick(i * 5 + k + 40);
      cands.push({ id: c.id + '-' + i + '-ns' + k, name: p.n, initials: sppInitials(p.n), avatarBg: '#94A3B8', score: 55 + k * 4, stageIdx: 6 });
    }
    out.push({ id: c.id + '-op' + i, title: SPP_ROLES[i % SPP_ROLES.length], team: SPP_TEAMNAMES[i % SPP_TEAMNAMES.length], location: 'Remote · LATAM', candidates: cands });
  }
  return out;
}

const SPP_STAGES = [
  { key: 'Applied', idx: 1, color: '#BDBDBD' }, { key: 'Screening', idx: 2, color: '#AF7AC5' },
  { key: 'Technical', idx: 3, color: '#16A085' }, { key: 'Final round', idx: 4, color: '#12866E' },
  { key: 'Offer', idx: 5, color: '#E74C7C' }, { key: 'Not selected', idx: 6, color: '#94A3B8' },
];

// ── Home card (no money) ─────────────────────────────────────────────────────
function SppClientCard({ c, dense, onOpen }) {
  const [hover, setHover] = useState_p(false);
  const st = window.NW_SPP_STATUS[c.status];
  return (
    <div onClick={() => onOpen && onOpen(c)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: NW.white, border: `1px solid ${hover ? NW.gray200 : NW.gray100}`, borderRadius: 18, padding: dense ? 20 : 24, cursor: 'pointer', boxShadow: hover ? '0 16px 40px rgba(0,0,0,0.08), 0 3px 8px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.03)', transition: 'box-shadow 220ms, border-color 220ms, transform 220ms', transform: hover ? 'translateY(-3px)' : 'none', display: 'flex', flexDirection: 'column', gap: dense ? 16 : 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: c.logoBg, color: NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins', fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em', flexShrink: 0 }}>{c.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
            <div style={{ fontSize: 12, color: NW.gray500, marginTop: 1 }}>{c.industry} · since {c.since}</div>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, color: st.color, background: st.bg }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} /> {st.label}
        </span>
      </div>
      <div style={{ display: 'flex', gap: dense ? 10 : 14 }}>
        {[{ l: 'Hires', v: c.hires }, { l: 'Teams', v: c.teams }, { l: 'Open roles', v: c.openRoles }].map(m => (
          <div key={m.l} style={{ flex: 1, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 11, padding: '11px 12px' }}>
            <div style={{ fontFamily: 'Poppins', fontSize: dense ? 20 : 24, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', lineHeight: 1 }}>{m.v}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: NW.gray500, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 5 }}>{m.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: `1px solid ${NW.gray100}`, paddingTop: dense ? 12 : 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: NW.teal600 }}>
          Review progress <Icon name="arrow-right" size={14} color={NW.teal600} style={{ transform: hover ? 'translateX(3px)' : 'none', transition: 'transform 200ms' }} />
        </span>
      </div>
    </div>
  );
}

function SppScreen({ density = 'regular', onNav }) {
  const dense = density === 'compact';
  const pad = dense ? 32 : 44;
  const clients = window.NW_SPP_CLIENTS || [];
  const [q, setQ] = useState_p('');
  const filtered = clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.industry.toLowerCase().includes(q.toLowerCase()));
  const summary = [
    { label: 'End-clients', value: clients.length, accent: NW.teal500 },
    { label: 'Active hires', value: clients.reduce((n, c) => n + c.hires, 0), accent: NW.violet500 },
    { label: 'Managed teams', value: clients.reduce((n, c) => n + c.teams, 0), accent: '#3B82F6' },
    { label: 'Open roles', value: clients.reduce((n, c) => n + c.openRoles, 0), accent: NW.rose500 },
  ];
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.offWhite, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="spp" density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'auto', padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: dense ? 22 : 30, gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Strategic Partner Program</div>
                <h1 style={{ fontSize: dense ? 34 : 44, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1.02, margin: 0 }}>Your clients</h1>
                <p style={{ fontSize: 14, color: NW.gray500, marginTop: 10, maxWidth: 540, lineHeight: 1.5 }}>Review progress for each client you serve through Nearwork. They each have their own portal — this is your overview.</p>
              </div>
              <div style={{ position: 'relative', width: 240 }}>
                <Icon name="search" size={15} color={NW.gray400} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search clients…" style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 13, color: NW.black, background: NW.white, border: `1px solid ${NW.gray200}`, borderRadius: 10, padding: '9px 12px 9px 34px', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: dense ? 14 : 18, marginBottom: dense ? 22 : 28, flexWrap: 'wrap' }}>
              {summary.map(s => (
                <div key={s.label} style={{ flex: 1, minWidth: 150, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 16, padding: dense ? '16px 20px' : '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ width: 4, height: 38, borderRadius: 2, background: s.accent }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontFamily: 'Poppins', fontSize: dense ? 28 : 34, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1.1, marginTop: 2 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: dense ? 14 : 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: NW.teal500 }} />
              <h2 style={{ fontSize: 13, fontWeight: 700, color: NW.black, letterSpacing: '0.02em', margin: 0 }}>Clients</h2>
              <span style={{ fontSize: 12, color: NW.gray500 }}>· {filtered.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : 'repeat(2, 1fr)', gap: dense ? 16 : 20 }}>
              {filtered.map(c => <SppClientCard key={c.id} c={c} dense={dense} onOpen={(cl) => onNav && onNav('spp-client', cl.id)} />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.SppScreen = SppScreen;

// ── Client detail: Team (hires + managed teams) and Openings (→ kanban) ──────
// People list row — mirrors the Team page columns (Person · Role · Team · Status · Since).
function SppPersonRow({ p, dense, onOpen }) {
  const [hover, setHover] = useState_p(false);
  const sen = (window.SENIORITY_META && window.SENIORITY_META[p.seniority]) || { color: NW.teal600, bg: '#16A08514' };
  return (
    <div onClick={() => onOpen && onOpen(p)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.4fr 1.3fr 1fr 0.6fr', alignItems: 'center', gap: 16, padding: dense ? '12px 16px' : '15px 18px', borderRadius: 14, background: hover ? NW.gray50 : 'transparent', cursor: 'pointer', transition: 'background 120ms' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
        <Avatar initials={p.initials} bg={p.avatarBg} size={dense ? 38 : 42} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{p.location}</div>
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: NW.gray800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.role}</div>
        <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10.5, fontWeight: 600, color: sen.color, background: sen.bg, padding: '2px 8px', borderRadius: 999 }}>{p.seniority}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        {p.teamName ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: NW.gray700 }}><Icon name="users" size={13} color={NW.gray400} /> {p.teamName}</span> : <span style={{ fontSize: 12, color: NW.gray400 }}>Individual</span>}
      </div>
      <div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: NW.teal600, background: NW.teal50, padding: '5px 11px', borderRadius: 999 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: NW.teal500 }} /> Active
        </span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 12.5, color: NW.gray700, fontWeight: 500 }}>{p.since}</div>
        <div style={{ fontSize: 10.5, color: NW.gray400, marginTop: 1 }}>{p.tenure}</div>
      </div>
    </div>
  );
}

function SppMemberRow({ p, dense, last, onOpen }) {
  const sen = { Senior: '#AF7AC5', Mid: '#12866E', Junior: '#757575' }[p.seniority] || '#12866E';
  const [hover, setHover] = useState_p(false);
  const clickable = !!onOpen;
  return (
    <div onClick={() => clickable && onOpen(p)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: dense ? '11px 12px' : '13px 14px', borderTop: last ? undefined : '1px solid ' + NW.gray100, cursor: clickable ? 'pointer' : 'default', background: clickable && hover ? NW.gray50 : 'transparent', borderRadius: 10, transition: 'background 120ms' }}>
      <Avatar initials={p.initials} bg={p.avatarBg} size={dense ? 36 : 40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{p.role}</div>
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: sen, background: sen + '18', padding: '3px 9px', borderRadius: 999 }}>{p.seniority}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: NW.teal700, background: NW.teal50, padding: '4px 10px', borderRadius: 999 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: NW.teal500 }} /> Active
      </span>
      {clickable && <Icon name="chevron-right" size={16} color={hover ? NW.gray500 : NW.gray300} style={{ flexShrink: 0 }} />}
    </div>
  );
}

function SppTeamCard({ t, dense, onOpen }) {
  const [hover, setHover] = useState_p(false);
  const healthOk = t.health === 'on-track';
  return (
    <div onClick={() => onOpen && onOpen(t)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: NW.white, border: '1px solid ' + (hover ? NW.gray200 : NW.gray100), borderRadius: 18, padding: dense ? 20 : 24, cursor: 'pointer', boxShadow: hover ? '0 14px 34px rgba(0,0,0,0.07)' : '0 1px 2px rgba(0,0,0,0.03)', transition: 'box-shadow 200ms, border-color 200ms, transform 200ms', transform: hover ? 'translateY(-2px)' : 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: t.accent + '16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="users-round" size={20} color={t.accent} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em' }}>{t.name}</div>
            <div style={{ fontSize: 12, color: NW.gray500, marginTop: 1 }}>{t.focus}</div>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, color: healthOk ? NW.teal700 : '#A16207', background: healthOk ? NW.teal50 : '#FEF9C3' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: healthOk ? NW.teal500 : '#EAB308' }} /> {healthOk ? 'On track' : 'Attention'}
        </span>
      </div>
      <div style={{ background: NW.gray50, border: '1px solid ' + NW.gray100, borderRadius: 12, padding: '11px 14px' }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Team lead</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar initials={t.lead.initials} bg={t.lead.avatarBg} size={22} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.black }}>{t.lead.name}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {t.members.slice(0, 6).map((m, i) => (
            <div key={i} title={m.name} style={{ marginLeft: i === 0 ? 0 : -9, border: '2px solid ' + NW.white, borderRadius: '50%' }}><Avatar initials={m.initials} bg={m.avatarBg} size={28} /></div>
          ))}
          {t.members.length > 6 && <div style={{ marginLeft: -9, width: 28, height: 28, borderRadius: '50%', background: NW.gray100, border: '2px solid ' + NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 600, color: NW.gray600 }}>+{t.members.length - 6}</div>}
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: t.accent }}>View team <Icon name="arrow-right" size={14} color={t.accent} style={{ transform: hover ? 'translateX(3px)' : 'none', transition: 'transform 200ms' }} /></span>
      </div>
    </div>
  );
}

function SppTeamMeta({ icon, label, children }) {
  return (
    <div style={{ background: NW.white, border: '1px solid ' + NW.gray100, borderRadius: 16, padding: '16px 18px' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        <Icon name={icon} size={12} color={NW.gray400} /> {label}
      </span>
      {children}
    </div>
  );
}

function SppTeamDetail({ t, dense, partnerShort, onBack, onOpenPerson }) {
  const [tz, setTz] = useState_p('partner');
  const healthOk = t.health === 'on-track';
  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 600, color: NW.gray500, padding: 0 }}>
        <Icon name="arrow-left" size={14} color={NW.gray500} /> Managed teams
      </button>
      {/* Header */}
      <div style={{ background: NW.white, border: '1px solid ' + NW.gray100, borderRadius: 20, padding: dense ? 22 : 26, marginBottom: dense ? 16 : 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <div style={{ width: 54, height: 54, borderRadius: 15, background: t.accent + '16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="users-round" size={26} color={t.accent} strokeWidth={1.9} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: dense ? 22 : 26, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', margin: 0 }}>{t.name}</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 999, color: healthOk ? NW.teal700 : '#A16207', background: healthOk ? NW.teal50 : '#FEF9C3' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: healthOk ? NW.teal500 : '#EAB308' }} /> {healthOk ? 'On track' : 'Attention'}</span>
            </div>
            <div style={{ fontSize: 13.5, color: NW.gray500, marginTop: 6 }}>{t.focus}</div>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'Poppins', fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1, textAlign: 'right' }}>{t.members.length}</div>
          <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 3, textAlign: 'right' }}>members</div>
        </div>
      </div>
      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr 1fr' : 'repeat(4, 1fr)', gap: dense ? 14 : 18, marginBottom: dense ? 16 : 20 }}>
        <SppTeamMeta icon="headphones" label="Account manager">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar initials={t.accountManager.initials} bg={NW.black} size={32} /><div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>{t.accountManager.name}</div></div>
        </SppTeamMeta>
        <SppTeamMeta icon={t.pod ? 'map-pin' : 'shield-check'} label={t.pod ? 'Regional pod' : 'Managed by'}>
          {t.pod ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 9, background: t.accent + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="map-pin" size={16} color={t.accent} /></div><div><div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>{t.pod}</div><div style={{ fontSize: 11, color: NW.gray500 }}>Region</div></div></div>
            : <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar initials="NW" bg={NW.black} size={32} /><div><div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>Nearwork</div><div style={{ fontSize: 11, color: NW.gray500 }}>No regional pod</div></div></div>}
        </SppTeamMeta>
        <SppTeamMeta icon="star" label="Team lead">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar initials={t.lead.initials} bg={t.lead.avatarBg} size={32} /><div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.lead.name}</div></div>
        </SppTeamMeta>
        <SppTeamMeta icon="clock" label="Working hours">
          <div style={{ fontSize: 16, fontWeight: 700, color: NW.black }}>{tz === 'partner' ? t.hoursPartner : t.hoursColombia}</div>
          <div style={{ fontSize: 11.5, color: NW.gray500, margin: '3px 0 9px' }}>{tz === 'partner' ? 'Your time · ' + partnerShort : 'Nearwork · COT'}</div>
          <div style={{ display: 'flex', gap: 2, padding: 3, background: NW.gray50, border: '1px solid ' + NW.gray100, borderRadius: 8 }}>
            {[{ id: 'partner', label: 'Your time' }, { id: 'colombia', label: 'Colombia' }].map(o => { const on = tz === o.id; return <button key={o.id} onClick={() => setTz(o.id)} style={{ flex: 1, border: 'none', padding: '5px 6px', borderRadius: 6, fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: on ? NW.white : 'transparent', color: on ? NW.black : NW.gray500, boxShadow: on ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>{o.label}</button>; })}
          </div>
        </SppTeamMeta>
      </div>
      {/* Members */}
      <section style={{ background: NW.white, border: '1px solid ' + NW.gray100, borderRadius: 20, padding: dense ? '20px 14px' : '24px 18px' }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px', padding: '0 6px' }}>Team members</h3>
        <div>{t.members.map((p, i) => <SppMemberRow key={i} p={p} dense={dense} last={i === t.members.length - 1} onOpen={onOpenPerson} />)}</div>
      </section>
    </div>
  );
}

// ── Read-only hire detail (mirrors the Team area, scoped to an SPP client) ───
function SppHireReviewRow({ r, onOpen }) {
  const [hover, setHover] = useState_p(false);
  const SR = window.StarRating;
  return (
    <div onClick={() => onOpen(r)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', gap: 14, padding: '15px 16px', border: '1px solid ' + (hover ? NW.gray200 : NW.gray100), borderRadius: 14, cursor: 'pointer', background: hover ? NW.gray50 : NW.white, transition: 'background 120ms, border-color 120ms' }}>
      <div style={{ minWidth: 76 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: NW.black }}>{r.period}</div>
        <div style={{ fontSize: 10.5, color: NW.gray400, marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="shield-check" size={11} color={NW.gray400} /> {r.conductedBy}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 6 }}>{SR ? <SR value={r.rating} size={14} /> : null}</div>
        <p style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.summary}</p>
      </div>
      <Icon name="chevron-right" size={16} color={hover ? NW.gray500 : NW.gray300} style={{ alignSelf: 'center', flexShrink: 0 }} />
    </div>
  );
}

function SppHireDetail({ c, p, dense, onBack }) {
  const sen = (window.SENIORITY_META && window.SENIORITY_META[p.seniority]) || { color: sen0(p), bg: sen0(p) + '18' };
  function sen0(pp) { return { Senior: '#AF7AC5', Mid: '#12866E', Junior: '#757575' }[pp.seniority] || '#12866E'; }
  const d = sppHireFull(c, p);
  const [openReview, setOpenReview] = useState_p(null);
  const first = p.name.split(' ')[0];
  const amInitials = p.accountManager.split(' ').map(w => w[0]).join('').slice(0, 2);
  const RM = window.ReviewViewModal;
  const RP = window.ReplacementPanel;
  const EP = window.EORPanel;
  const benefits = window.NW_EOR_BENEFITS || [];
  const vacPct = d.vacationTotal ? Math.round((d.vacationUsed / d.vacationTotal) * 100) : 0;
  const unread = (d.updates || []).filter(u => u.unread).length;
  return (
    <div>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 600, color: NW.gray500, padding: 0 }}>
        <Icon name="arrow-left" size={14} color={NW.gray500} /> People
      </button>
      {/* Header */}
      <div style={{ background: NW.white, border: '1px solid ' + NW.gray100, borderRadius: 22, overflow: 'hidden', marginBottom: dense ? 18 : 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, padding: dense ? 24 : 30, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
            <Avatar initials={p.initials} bg={p.avatarBg} size={dense ? 60 : 72} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', margin: 0 }}>{p.name}</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: NW.teal700, background: NW.teal50, padding: '5px 11px', borderRadius: 999 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: NW.teal500 }} /> Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14.5, color: NW.gray700, fontWeight: 500 }}>{p.role}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: sen.color, background: sen.bg, padding: '2px 9px', borderRadius: 999 }}>{p.seniority}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: NW.gray300 }} />
                <span style={{ fontSize: 13, color: NW.gray500 }}>{p.location}</span>
              </div>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: NW.teal700, background: NW.teal50, border: '1px solid #16A08522', padding: '7px 12px', borderRadius: 999 }}>
            <Icon name="shield-check" size={13} color={NW.teal600} /> Managed by Nearwork
          </span>
        </div>
        {/* Facts strip */}
        <div style={{ display: 'flex', borderTop: '1px solid ' + NW.gray100, background: NW.offWhite, flexWrap: 'wrap' }}>
          <FactCell icon="calendar-check" label="Placed" value={p.since} sub={p.tenure} />
          <FactCell icon="users-round" label="Team" value={p.teamName || 'Individual'} />
          <FactCell icon="activity" label="Utilization" value={p.utilization + '%'} sub="this month" />
          <FactCell icon="wallet" label="Salary" value={d.salaryMonthly} sub="per month" />
          <FactCell icon="palmtree" label="Vacation" value={d.vacationRemaining + ' days left'} sub={'of ' + d.vacationTotal} />
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : '1.6fr 1fr', gap: dense ? 18 : 24, alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: dense ? 18 : 24 }}>
          {RP && <RP key={p.id} person={p} dense={dense} guaranteeMonths={6} accountManager={p.accountManager} />}
          <Panel title="Performance reviews">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 11, background: NW.teal50, border: '1px solid #16A08522', marginBottom: 16 }}>
              <Icon name="shield-check" size={14} color={NW.teal600} />
              <span style={{ fontSize: 12.5, color: NW.teal700, fontWeight: 500 }}>Nearwork conducts reviews for {first} — read-only on your side.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {d.reviews.map(r => <SppHireReviewRow key={r.id} r={r} onOpen={setOpenReview} />)}
            </div>
          </Panel>

          {EP && <EP person={p} dense={dense} />}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: dense ? 18 : 24 }}>
          <Panel title="Updates" pad={24}
            action={unread > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: NW.rose600, background: NW.rose50, padding: '4px 10px', borderRadius: 999 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: NW.rose500 }} />{unread} new</span>}>
            {d.updates && d.updates.length ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {d.updates.map((u, i) => <UpdateRow key={u.id} u={u} last={i === d.updates.length - 1} resolution={undefined} onResolve={() => {}} onAddReview={() => {}} />)}
              </div>
            ) : <div style={{ fontSize: 13, color: NW.gray400 }}>No recent updates.</div>}
          </Panel>

          <Panel title="Compensation" pad={24}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Poppins', fontSize: 34, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em' }}>{d.salaryMonthly}</span>
              <span style={{ fontSize: 13, color: NW.gray500 }}>/ month</span>
            </div>
            <div style={{ fontSize: 13, color: NW.gray500, marginBottom: 16 }}>{d.salaryAnnual} annual · {d.currency}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                { l: 'Engagement', v: d.contractType, icon: 'file-signature' },
                { l: 'Last review', v: d.lastReview, icon: 'clock' },
                { l: 'Next review', v: d.nextReview, icon: 'calendar' },
                { l: 'Account manager', v: d.manager, icon: 'headphones' },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 11, borderTop: '1px solid ' + NW.gray100 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: NW.gray500 }}><Icon name={row.icon} size={13} color={NW.gray400} /> {row.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{row.v}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Time off" pad={24}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 12 }}>
              <span style={{ fontFamily: 'Poppins', fontSize: 34, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1 }}>{d.vacationRemaining}</span>
              <span style={{ fontSize: 13, color: NW.gray500, marginBottom: 3 }}>of {d.vacationTotal} days left</span>
            </div>
            <div style={{ height: 8, background: NW.gray100, borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ width: (100 - vacPct) + '%', height: '100%', background: NW.teal500 }} />
            </div>
            <div style={{ fontSize: 11.5, color: NW.gray400, marginBottom: 4 }}>{d.vacationUsed} days used this year</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: NW.gray500, background: NW.gray50, border: '1px solid ' + NW.gray100, padding: '3px 9px', borderRadius: 999, marginBottom: 18 }}><Icon name="info" size={11} color={NW.gray400} /> Accrues 1.25 days / month · Colombia</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Upcoming PTO</div>
            {d.upcomingPTO.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {d.upcomingPTO.map((pto, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', border: '1px solid ' + NW.gray100, borderRadius: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: NW.teal50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="plane" size={16} color={NW.teal600} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{pto.label}</div>
                      <div style={{ fontSize: 11.5, color: NW.gray500 }}>{pto.dates} · {pto.days}d</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: pto.status === 'approved' ? NW.teal50 : NW.yellow50, color: pto.status === 'approved' ? NW.teal700 : '#A16207' }}>{pto.status === 'approved' ? 'Approved' : 'Pending'}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 13, color: NW.gray400 }}>No upcoming time off scheduled.</div>}
          </Panel>
        </div>
      </div>
      {openReview && RM && <RM review={openReview} person={p} onClose={() => setOpenReview(null)} />}
    </div>
  );
}

function SppOpeningCard({ op, dense, onOpen }) {
  const [hover, setHover] = useState_p(false);
  const counts = SPP_STAGES.map(s => op.candidates.filter(c => c.stageIdx === s.idx).length);
  const total = counts.slice(0, 5).reduce((a, b) => a + b, 0);
  const ns = counts[5];
  return (
    <div onClick={() => onOpen(op)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: NW.white, border: '1px solid ' + (hover ? NW.gray200 : NW.gray100), borderRadius: 18, padding: dense ? 20 : 24, cursor: 'pointer', boxShadow: hover ? '0 14px 34px rgba(0,0,0,0.07)' : '0 1px 2px rgba(0,0,0,0.03)', transition: 'box-shadow 200ms, border-color 200ms, transform 200ms', transform: hover ? 'translateY(-2px)' : 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em' }}>{op.title}</div>
        <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 4 }}>{op.team} · {op.location}</div>
      </div>
      <div style={{ display: 'flex', gap: 3, height: 8 }}>
        {SPP_STAGES.slice(0, 5).map((s, i) => <div key={s.key} title={s.key + ': ' + counts[i]} style={{ flex: Math.max(counts[i], 0.001), minWidth: counts[i] > 0 ? 6 : 0, background: counts[i] > 0 ? s.color : NW.gray100, borderRadius: 4 }} />)}
        {total === 0 && <div style={{ flex: 1, background: NW.gray100, borderRadius: 4 }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid ' + NW.gray100, paddingTop: 14 }}>
        <span style={{ fontSize: 13, color: NW.gray600 }}><b style={{ color: NW.black }}>{total}</b> in pipeline · {ns} not selected</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: NW.teal600 }}>View stages <Icon name="arrow-right" size={14} color={NW.teal600} style={{ transform: hover ? 'translateX(3px)' : 'none', transition: 'transform 200ms' }} /></span>
      </div>
    </div>
  );
}

function SppKanban({ op, dense }) {
  return (
    <div style={{ display: 'flex', gap: dense ? 12 : 14, overflowX: 'auto', paddingBottom: 6 }}>
      {SPP_STAGES.map(s => {
        const cards = op.candidates.filter(c => c.stageIdx === s.idx);
        return (
          <div key={s.key} style={{ flex: 1, minWidth: 180, background: NW.offWhite, border: '1px solid ' + NW.gray100, borderRadius: 14, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid ' + NW.gray100 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: NW.black }}>{s.key}</span>
              <span style={{ marginLeft: 'auto', background: NW.white, border: '1px solid ' + NW.gray100, color: NW.gray600, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 500, padding: '1px 7px', borderRadius: 999 }}>{cards.length}</span>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cards.length === 0 ? <div style={{ border: '1px dashed ' + NW.gray200, borderRadius: 10, padding: '20px 12px', textAlign: 'center', fontSize: 11, color: NW.gray400 }}>None</div>
                : cards.map(c => (
                  <div key={c.id} style={{ background: NW.white, border: '1px solid ' + NW.gray100, borderRadius: 11, padding: 11, display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar initials={c.initials} bg={c.avatarBg} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: 10.5, color: NW.gray500 }}>Match {c.score}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SppClientEditModal({ c, onClose, onSave }) {
  const MS = window.ModalShell;
  const [name, setName] = useState_p(c.name || '');
  const [industry, setIndustry] = useState_p(c.industry || '');
  const [contactName, setContactName] = useState_p(c.contactName || '');
  const [contactEmail, setContactEmail] = useState_p(c.contactEmail || '');
  const [note, setNote] = useState_p(c.note || '');
  const field = { width: '100%', boxSizing: 'border-box', border: '1px solid ' + NW.gray200, borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, color: NW.black, outline: 'none', background: NW.white };
  const lbl = { fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7, display: 'block' };
  const inner = (
    <div>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid ' + NW.gray100, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em', margin: 0 }}>Edit client details</h2>
          <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 5 }}>Information you manage about this client.</div>
        </div>
        <button onClick={onClose} style={{ background: NW.gray50, border: '1px solid ' + NW.gray100, borderRadius: 999, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="x" size={16} color={NW.gray600} />
        </button>
      </div>
      <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={lbl}>Display name</label>
          <input type="text" value={name} placeholder="Client name" onChange={e => setName(e.target.value)} style={field} />
        </div>
        <div>
          <label style={lbl}>Industry</label>
          <input type="text" value={industry} placeholder="e.g. Fintech" onChange={e => setIndustry(e.target.value)} style={field} />
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={lbl}>Your contact</label>
            <input type="text" value={contactName} placeholder="Contact name" onChange={e => setContactName(e.target.value)} style={field} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={lbl}>Contact email</label>
            <input type="email" value={contactEmail} placeholder="name@company.com" onChange={e => setContactEmail(e.target.value)} style={field} />
          </div>
        </div>
        <div>
          <label style={lbl}>Internal note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="A short label or reference only your team sees…"
            style={{ ...field, minHeight: 64, resize: 'vertical', lineHeight: 1.5 }} />
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '11px 13px', borderRadius: 11, background: NW.gray50, border: '1px solid ' + NW.gray100 }}>
          <Icon name="lock" size={14} color={NW.gray400} style={{ marginTop: 1 }} />
          <span style={{ fontSize: 12, color: NW.gray500, lineHeight: 1.5 }}>Hires, teams, pipeline, billing and status are maintained by Nearwork in the admin workspace and update automatically.</span>
        </div>
      </div>
      <div style={{ padding: '16px 28px', borderTop: '1px solid ' + NW.gray100, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" icon="check" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), industry: industry.trim(), contactName: contactName.trim(), contactEmail: contactEmail.trim(), note: note.trim() })}>Save changes</Button>
      </div>
    </div>
  );
  return MS ? <MS onClose={onClose} width={560}>{inner}</MS> : null;
}

function SppClientDetailScreen({ clientId, density = 'regular', onNav }) {
  const dense = density === 'compact';
  const pad = dense ? 32 : 44;
  const clients = window.NW_SPP_CLIENTS || [];
  const base = clients.find(x => x.id === clientId) || clients[0];
  const [tab, setTab] = useState_p('team');
  const [openId, setOpenId] = useState_p(null);
  const [teamId, setTeamId] = useState_p(null);
  const [personId, setPersonId] = useState_p(null);
  const [ovVer, setOvVer] = useState_p(0);
  const [editing, setEditing] = useState_p(false);
  if (!base) return null;
  const OV_KEY = 'nw_spp_client_overrides';
  const allOv = (() => { try { return JSON.parse(localStorage.getItem(OV_KEY)) || {}; } catch (e) { return {}; } })();
  const ov = allOv[base.id] || {};
  const c = { ...base, ...ov };
  const saveOverride = (vals) => { const all = { ...allOv, [base.id]: { ...ov, ...vals } }; try { localStorage.setItem(OV_KEY, JSON.stringify(all)); } catch (e) {} setOvVer(v => v + 1); setEditing(false); };
  const st = window.NW_SPP_STATUS[c.status];
  const people = sppPeople(c);
  const teams = sppTeams(c);
  const openings = sppOpenings(c);
  const op = openings.find(o => o.id === openId);
  const team = teams.find(t => t.id === teamId);
  const person = personId ? people.find(x => x.id === personId) : null;
  const partnerShort = (window.NW_CLIENT.timezone && window.NW_CLIENT.timezone.short) || 'Partner';

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.offWhite, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="spp" density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'auto', padding: (dense ? 28 : 40) + 'px ' + pad + 'px ' + pad + 'px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <button onClick={() => onNav && onNav('spp')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18, background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 600, color: NW.gray500, letterSpacing: '0.04em', padding: 0 }}>
              <Icon name="arrow-left" size={14} color={NW.gray500} /> Your clients
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: dense ? 20 : 26, flexWrap: 'wrap' }}>
              <div style={{ width: dense ? 52 : 60, height: dense ? 52 : 60, borderRadius: 15, background: c.logoBg, color: NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em', flexShrink: 0 }}>{c.initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', margin: 0 }}>{c.name}</h1>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 999, color: st.color, background: st.bg }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} /> {st.label}</span>
                </div>
                <div style={{ fontSize: 13.5, color: NW.gray500, marginTop: 6 }}>{c.industry} · client since {c.since}</div>
                {(c.contactName || c.note) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    {c.contactName && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: NW.gray600 }}><Icon name="user" size={13} color={NW.gray400} /> {c.contactName}{c.contactEmail ? ' · ' + c.contactEmail : ''}</span>}
                    {c.note && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: NW.gray600, background: NW.gray50, border: '1px solid ' + NW.gray100, padding: '3px 10px', borderRadius: 999 }}><Icon name="sticky-note" size={12} color={NW.gray400} /> {c.note}</span>}
                  </div>
                )}
              </div>
              <button onClick={() => setEditing(true)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, background: NW.white, border: '1px solid ' + NW.gray200, borderRadius: 999, padding: '8px 14px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: NW.gray700, cursor: 'pointer' }}>
                <Icon name="pencil" size={14} color={NW.gray600} /> Edit details
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 3, padding: 4, background: NW.white, border: '1px solid ' + NW.gray100, borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', width: 'fit-content', marginBottom: dense ? 20 : 26 }}>
              {[{ id: 'team', label: 'People', icon: 'user' }, { id: 'managed', label: 'Teams', icon: 'users-round' }, { id: 'openings', label: 'Pipeline', icon: 'kanban-square' }].map(tb => {
                const on = tab === tb.id;
                return <button key={tb.id} onClick={() => { setTab(tb.id); setOpenId(null); setTeamId(null); setPersonId(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', background: on ? NW.black : 'transparent', color: on ? NW.white : NW.gray600 }}><Icon name={tb.icon} size={15} color={on ? NW.white : NW.gray500} /> {tb.label}</button>;
              })}
            </div>

            {person ? (
              <SppHireDetail key={person.id} c={c} p={person} dense={dense} onBack={() => setPersonId(null)} />
            ) : tab === 'team' ? (
              <section style={{ background: NW.white, border: '1px solid ' + NW.gray100, borderRadius: 20, padding: dense ? '16px 14px' : '20px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.4fr 1.3fr 1fr 0.6fr', gap: 16, padding: '0 18px 12px', fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid ' + NW.gray100 }}>
                  <span>Person</span><span>Role</span><span>Team</span><span>Status</span><span style={{ textAlign: 'right' }}>Since</span>
                </div>
                <div style={{ marginTop: 6 }}>{people.map((p, i) => <SppPersonRow key={i} p={p} dense={dense} onOpen={(x) => setPersonId(x.id)} />)}</div>
              </section>
            ) : tab === 'managed' ? (
              team ? (
                <SppTeamDetail t={team} dense={dense} partnerShort={partnerShort} onBack={() => setTeamId(null)} onOpenPerson={(x) => setPersonId(x.id)} />
              ) : teams.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : 'repeat(2, 1fr)', gap: dense ? 16 : 20 }}>
                  {teams.map(t => <SppTeamCard key={t.id} t={t} dense={dense} onOpen={(x) => setTeamId(x.id)} />)}
                </div>
              ) : (
                <div style={{ background: NW.white, border: '1px solid ' + NW.gray100, borderRadius: 20, padding: '50px 20px', textAlign: 'center' }}>
                  <Icon name="users-round" size={22} color={NW.gray300} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: NW.gray600, marginTop: 8 }}>No managed teams</div>
                  <div style={{ fontSize: 12.5, color: NW.gray400, marginTop: 3 }}>This client uses recruitment only.</div>
                </div>
              )
            ) : (
              op ? (
                <div>
                  <button onClick={() => setOpenId(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 600, color: NW.gray500, padding: 0 }}>
                    <Icon name="arrow-left" size={14} color={NW.gray500} /> Pipeline
                  </button>
                  <h2 style={{ fontSize: dense ? 22 : 26, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', margin: '0 0 4px' }}>{op.title}</h2>
                  <div style={{ fontSize: 13, color: NW.gray500, marginBottom: 18 }}>{op.team} · {op.location}</div>
                  <SppKanban op={op} dense={dense} />
                </div>
              ) : (
                openings.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : 'repeat(2, 1fr)', gap: dense ? 16 : 20 }}>
                    {openings.map(o => <SppOpeningCard key={o.id} op={o} dense={dense} onOpen={(x) => setOpenId(x.id)} />)}
                  </div>
                ) : (
                  <div style={{ background: NW.white, border: '1px solid ' + NW.gray100, borderRadius: 20, padding: '50px 20px', textAlign: 'center' }}>
                    <Icon name="briefcase" size={22} color={NW.gray300} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: NW.gray600, marginTop: 8 }}>No open roles right now</div>
                  </div>
                )
              )
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '0 4px', fontSize: 12, color: NW.gray400 }}>
              <Icon name="info" size={13} color={NW.gray400} /> Hires, teams, pipeline and billing are managed by Nearwork. You can edit your own client details above.
            </div>
          </div>
        </div>
        {editing && <SppClientEditModal c={c} onClose={() => setEditing(false)} onSave={saveOverride} />}
      </main>
    </div>
  );
}

window.SppClientDetailScreen = SppClientDetailScreen;
