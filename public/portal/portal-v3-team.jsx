// Team screen — two views: People (individual hires) and Teams (Nearwork-managed pods).
// Clients view who they've hired, whether they're active, and which teams Nearwork runs for them.

const STATUS_META = {
  active:     { label: 'Active',      color: NW.teal600,  bg: NW.teal50,  dot: NW.teal500 },
  onleave:    { label: 'On leave',    color: '#A16207',   bg: NW.yellow50,dot: NW.yellow500 },
  offboarded: { label: 'Offboarded',  color: NW.gray500,  bg: NW.gray50,  dot: NW.gray400 },
};

const SENIORITY_META = {
  Senior: { color: NW.violet500, bg: '#AF7AC514' },
  Mid:    { color: NW.teal600,   bg: '#16A08514' },
  Junior: { color: NW.gray500,   bg: NW.gray50 },
};

// ── People view: a single person row ────────────────────────────────────────
function PersonRow({ p, dense, last, teamName, onOpen }) {
  const [hover, setHover] = useState_p(false);
  const st = STATUS_META[p.status];
  const sen = SENIORITY_META[p.seniority] || SENIORITY_META.Mid;
  const muted = p.status === 'offboarded';
  const unread = window.hireUnreadCount ? window.hireUnreadCount(p) : 0;
  return (
    <div
      onClick={() => onOpen && onOpen(p)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 1.4fr 1.3fr 1fr 0.6fr',
        alignItems: 'center', gap: 16,
        padding: dense ? '12px 16px' : '15px 18px',
        borderRadius: 14,
        background: hover ? NW.gray50 : 'transparent',
        cursor: 'pointer', transition: 'background 120ms',
        opacity: muted ? 0.62 : 1,
      }}>
      {/* Name + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar initials={p.initials} bg={p.avatarBg} size={dense ? 38 : 42} />
          {unread > 0 && <span title={`${unread} new update${unread > 1 ? 's' : ''}`} style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, padding: '0 4px', boxSizing: 'border-box', borderRadius: 999, background: NW.rose500, border: `2px solid ${NW.white}`, color: NW.white, fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{unread}</span>}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{p.location}</div>
        </div>
      </div>
      {/* Role */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: NW.gray800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.role}</div>
        <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10.5, fontWeight: 600, color: sen.color, background: sen.bg, padding: '2px 8px', borderRadius: 999 }}>{p.seniority}</span>
      </div>
      {/* Team */}
      <div style={{ minWidth: 0 }}>
        {teamName ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: NW.gray700 }}>
            <Icon name="users" size={13} color={NW.gray400} /> {teamName}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: NW.gray400 }}>Individual</span>
        )}
      </div>
      {/* Status */}
      <div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: '5px 11px', borderRadius: 999 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} />
          {st.label}
        </span>
        {p.statusNote && <div style={{ fontSize: 10.5, color: NW.gray400, marginTop: 4, paddingLeft: 2 }}>{p.statusNote}</div>}
      </div>
      {/* Tenure */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 12.5, color: NW.gray700, fontWeight: 500 }}>{p.since}</div>
        <div style={{ fontSize: 10.5, color: NW.gray400, marginTop: 1 }}>{p.tenure}</div>
      </div>
    </div>
  );
}

// ── Teams view: a managed-team card ─────────────────────────────────────────
function TeamCard({ team, people, dense, onView }) {
  const [hover, setHover] = useState_p(false);
  const members = people.filter(p => p.teamId === team.id);
  const activeCount = members.filter(m => m.status === 'active').length;
  const healthOk = team.health === 'on-track';
  return (
    <div
      onClick={() => onView && onView(team)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: NW.white,
        border: `1px solid ${hover ? NW.gray200 : NW.gray100}`,
        borderRadius: 20, padding: dense ? 22 : 26,
        cursor: 'pointer',
        boxShadow: hover ? '0 16px 40px rgba(0,0,0,0.07), 0 3px 8px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.03)',
        transition: 'box-shadow 220ms, border-color 220ms, transform 220ms',
        transform: hover ? 'translateY(-3px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: dense ? 16 : 20,
      }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `${team.accent}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="users-round" size={21} color={team.accent} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: dense ? 17 : 19, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
            <div style={{ fontSize: 12, color: NW.gray500, marginTop: 2 }}>{team.focus}</div>
          </div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
          fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 999,
          color: healthOk ? NW.teal700 : '#A16207',
          background: healthOk ? NW.teal50 : NW.yellow50,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: healthOk ? NW.teal500 : NW.yellow500 }} />
          {healthOk ? 'On track' : 'Needs attention'}
        </span>
      </div>

      {/* Managed-by + lead */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 12, padding: '11px 14px' }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>{team.pod ? 'Regional pod' : 'Managed by Nearwork'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: team.pod ? `${team.accent}1a` : NW.black, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={team.pod ? 'map-pin' : 'shield-check'} size={12} color={team.pod ? team.accent : NW.white} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.pod || 'Nearwork'}</span>
          </div>
        </div>
        <div style={{ flex: 1, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 12, padding: '11px 14px' }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Team lead</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar initials={team.lead.initials} bg={team.lead.avatarBg} size={22} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.lead.name}</span>
          </div>
        </div>
      </div>

      {/* Members */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: NW.gray600 }}>{members.length} {members.length === 1 ? 'person' : 'people'} · {activeCount} active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {members.slice(0, 6).map((m, i) => (
            <div key={m.id} title={m.name} style={{ marginLeft: i === 0 ? 0 : -9, border: `2px solid ${NW.white}`, borderRadius: '50%', position: 'relative', zIndex: 6 - i, opacity: m.status === 'active' ? 1 : 0.55 }}>
              <Avatar initials={m.initials} bg={m.avatarBg} size={30} />
            </div>
          ))}
          {members.length > 6 && (
            <div style={{ marginLeft: -9, width: 30, height: 30, borderRadius: '50%', background: NW.gray100, border: `2px solid ${NW.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: NW.gray600 }}>+{members.length - 6}</div>
          )}
          <div style={{ flex: 1 }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: team.accent }}>
            View team
            <Icon name="arrow-right" size={15} color={team.accent} style={{ transform: hover ? 'translateX(3px)' : 'none', transition: 'transform 200ms' }} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Team screen ─────────────────────────────────────────────────────────────
function TeamScreen({ populated = true, density = 'regular', onNav, focus }) {
  const dense = density === 'compact';
  const pad = dense ? 32 : 44;
  const [view, setView] = useState_p(focus && focus.view ? focus.view : 'people');
  const people = populated ? window.NW_TEAM_PEOPLE : [];
  const teams = populated ? window.NW_TEAM_TEAMS : [];
  const teamName = (id) => teams.find(t => t.id === id)?.name;

  const activePeople = people.filter(p => p.status === 'active').length;
  const managedCount = people.filter(p => p.managed && p.status !== 'offboarded').length;

  const summary = view === 'people'
    ? [
        { label: 'People hired',   value: people.filter(p => p.status !== 'offboarded').length, accent: NW.teal500 },
        { label: 'Active now',     value: activePeople, accent: NW.violet500 },
        { label: 'In managed pods',value: managedCount, accent: NW.rose500 },
      ]
    : [
        { label: 'Teams we run',   value: teams.length, accent: NW.teal500 },
        { label: 'People managed', value: managedCount, accent: NW.violet500 },
        { label: 'Need attention', value: teams.filter(t => t.health !== 'on-track').length, accent: NW.rose500 },
      ];

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.offWhite, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="team" density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'auto', padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: dense ? 22 : 30, gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Team</div>
              <h1 style={{ fontSize: dense ? 34 : 44, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1.02, margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                Your people at Nearwork
              </h1>
              <p style={{ fontSize: 14, color: NW.gray500, marginTop: 10, maxWidth: 540, lineHeight: 1.5 }}>
                Everyone you've hired through us, and the teams we run on your behalf.
              </p>
            </div>
            <Button variant="secondary" size="sm" icon="download">Export</Button>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: dense ? 22 : 28 }}>
            <div style={{ display: 'flex', gap: 3, padding: 4, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              {[
                { id: 'people', label: 'People', icon: 'user' },
                { id: 'teams',  label: 'Teams',  icon: 'users-round' },
              ].map(v => {
                const on = view === v.id;
                return (
                  <button key={v.id} onClick={() => setView(v.id)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    border: 'none', padding: '9px 18px', borderRadius: 9,
                    fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                    background: on ? NW.black : 'transparent',
                    color: on ? NW.white : NW.gray600,
                    transition: 'background 160ms, color 160ms',
                  }}>
                    <Icon name={v.icon} size={15} color={on ? NW.white : NW.gray500} />
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary strip */}
          {populated && (
            <div style={{ display: 'flex', gap: dense ? 14 : 18, marginBottom: dense ? 22 : 28 }}>
              {summary.map(s => (
                <div key={s.label} style={{ flex: 1, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 16, padding: dense ? '16px 20px' : '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ width: 4, height: 38, borderRadius: 2, background: s.accent }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontFamily: 'Poppins', fontSize: dense ? 28 : 34, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1.1, marginTop: 2 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Body */}
          {!populated ? (
            <EmptyBlock icon="users" title="No one on your team yet"
              desc="Once you make your first hire through Nearwork, they'll appear here — along with any teams we manage for you." />
          ) : view === 'people' ? (
            <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? '16px 14px' : '20px 18px' }}>
              {/* column header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2.2fr 1.4fr 1.3fr 1fr 0.6fr',
                gap: 16, padding: '0 18px 12px',
                fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.12em', textTransform: 'uppercase',
                borderBottom: `1px solid ${NW.gray100}`,
              }}>
                <span>Person</span><span>Role</span><span>Team</span><span>Status</span>
                <span style={{ textAlign: 'right' }}>Since</span>
              </div>
              <div style={{ marginTop: 6 }}>
                {people.map((p, i) => (
                  <PersonRow key={p.id} p={p} dense={dense} teamName={teamName(p.teamId)} last={i === people.length - 1} onOpen={(person) => onNav && onNav('hire', person.id)} />
                ))}
              </div>
            </section>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: dense ? 16 : 22 }}>
              {teams.map(t => <TeamCard key={t.id} team={t} people={people} dense={dense} onView={(tm) => onNav && onNav('team-detail', tm.id)} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

window.TeamScreen = TeamScreen;

// ── Team detail ─────────────────────────────────────────────────────────────
// Non-confidential: who's on the team, who runs it, the POD. No project/work detail.
function TeamMemberRow({ p, dense, onOpen }) {
  const [hover, setHover] = useState_p(false);
  const st = STATUS_META[p.status];
  const sen = SENIORITY_META[p.seniority] || SENIORITY_META.Mid;
  const unread = window.hireUnreadCount ? window.hireUnreadCount(p) : 0;
  return (
    <div
      onClick={() => onOpen && onOpen(p)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: dense ? '12px 14px' : '14px 16px', borderRadius: 14, background: hover ? NW.gray50 : 'transparent', cursor: 'pointer', transition: 'background 120ms' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar initials={p.initials} bg={p.avatarBg} size={dense ? 38 : 42} />
        {unread > 0 && <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, padding: '0 4px', boxSizing: 'border-box', borderRadius: 999, background: NW.rose500, border: `2px solid ${NW.white}`, color: NW.white, fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{unread}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
        </div>
        <div style={{ fontSize: 12, color: NW.gray500, marginTop: 1 }}>{p.role} · {p.location}</div>
      </div>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: sen.color, background: sen.bg, padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>{p.seniority}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: st.color, background: st.bg, padding: '4px 10px', borderRadius: 999, flexShrink: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} /> {st.label}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: NW.teal600, flexShrink: 0 }}>
        View profile <Icon name="arrow-up-right" size={14} color={NW.teal600} style={{ transform: hover ? 'translate(2px,-2px)' : 'none', transition: 'transform 160ms' }} />
      </span>
    </div>
  );
}

function TeamMeta({ icon, label, children }) {
  return (
    <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 16, padding: '16px 18px' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        <Icon name={icon} size={12} color={NW.gray400} /> {label}
      </span>
      {children}
    </div>
  );
}

function TeamDetailScreen({ teamId, density = 'regular', onNav }) {
  const dense = density === 'compact';
  const pad = dense ? 32 : 44;
  const teams = window.NW_TEAM_TEAMS || [];
  const team = teams.find(t => t.id === teamId) || teams[0];
  if (!team) return null;
  const members = (window.NW_TEAM_PEOPLE || []).filter(p => p.teamId === team.id);
  const activeCount = members.filter(m => m.status === 'active').length;
  const healthOk = team.health === 'on-track';
  const [tz, setTz] = useState_p('partner'); // 'partner' | 'colombia'
  const partnerLabel = (window.NW_CLIENT.timezone && window.NW_CLIENT.timezone.short) || 'Partner';

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.offWhite, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="team" density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'auto', padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>

            <button onClick={() => onNav && onNav('team', null, { view: 'teams' })} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18,
              background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit',
              fontSize: 12, fontWeight: 600, color: NW.gray500, letterSpacing: '0.04em', padding: 0,
            }}>
              <Icon name="arrow-left" size={14} color={NW.gray500} /> Teams
            </button>

            {/* Header */}
            <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 22, padding: dense ? 24 : 30, marginBottom: dense ? 18 : 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
                <div style={{ width: dense ? 56 : 64, height: dense ? 56 : 64, borderRadius: 17, background: `${team.accent}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="users-round" size={dense ? 26 : 30} color={team.accent} strokeWidth={1.9} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', margin: 0 }}>{team.name}</h1>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 999, color: healthOk ? NW.teal700 : '#A16207', background: healthOk ? NW.teal50 : NW.yellow50 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: healthOk ? NW.teal500 : NW.yellow500 }} /> {healthOk ? 'On track' : 'Needs attention'}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: NW.gray500, margin: '8px 0 0' }}>{team.focus}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 22 }}>
                <div>
                  <div style={{ fontFamily: 'Poppins', fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1 }}>{members.length}</div>
                  <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 3 }}>members</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Poppins', fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.teal600, letterSpacing: '-0.04em', lineHeight: 1 }}>{activeCount}</div>
                  <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 3 }}>active</div>
                </div>
              </div>
            </div>

            {/* Meta cards */}
            <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr 1fr' : 'repeat(4, 1fr)', gap: dense ? 14 : 18, marginBottom: dense ? 18 : 24 }}>
              <TeamMeta icon="headphones" label="Account manager">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={team.accountManager.initials} bg={team.accountManager.avatarBg} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.accountManager.name}</div>
                  </div>
                </div>
              </TeamMeta>
              <TeamMeta icon={team.pod ? 'map-pin' : 'shield-check'} label={team.pod ? 'Regional pod' : 'Managed by'}>
                {team.pod ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${team.accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="map-pin" size={16} color={team.accent} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>{team.pod}</div>
                      <div style={{ fontSize: 11, color: NW.gray500 }}>Region</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials="NW" bg={NW.black} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>Nearwork</div>
                      <div style={{ fontSize: 11, color: NW.gray500 }}>No regional pod</div>
                    </div>
                  </div>
                )}
              </TeamMeta>
              <TeamMeta icon="star" label="Team lead">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={team.lead.initials} bg={team.lead.avatarBg} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.lead.name}</div>
                    <div style={{ fontSize: 11, color: NW.gray500 }}>Leads day-to-day</div>
                  </div>
                </div>
              </TeamMeta>
              <TeamMeta icon="clock" label="Working hours">
                <div style={{ fontSize: 16, fontWeight: 700, color: NW.black, letterSpacing: '-0.01em' }}>{tz === 'partner' ? team.hoursPartner : team.hoursColombia}</div>
                <div style={{ fontSize: 11.5, color: NW.gray500, margin: '3px 0 9px' }}>{tz === 'partner' ? `Your time · ${partnerLabel}` : 'Nearwork · COT'}</div>
                <div style={{ display: 'flex', gap: 2, padding: 3, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 8 }}>
                  {[
                    { id: 'partner', label: 'Your time' },
                    { id: 'colombia', label: 'Colombia' },
                  ].map(o => {
                    const on = tz === o.id;
                    return (
                      <button key={o.id} onClick={() => setTz(o.id)} style={{ flex: 1, border: 'none', padding: '5px 6px', borderRadius: 6, fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: on ? NW.white : 'transparent', color: on ? NW.black : NW.gray500, boxShadow: on ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>{o.label}</button>
                    );
                  })}
                </div>
              </TeamMeta>
            </div>

            {/* Members */}
            <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? '18px 14px' : '24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 4px' }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Team members</h3>
                <span style={{ fontSize: 12, color: NW.gray400 }}>Click anyone to open their profile</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {members.map(p => <TeamMemberRow key={p.id} p={p} dense={dense} onOpen={(person) => onNav && onNav('hire', person.id)} />)}
                {members.length === 0 && <div style={{ fontSize: 13, color: NW.gray400, padding: '20px 16px' }}>No members assigned yet.</div>}
              </div>
            </section>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '0 4px', fontSize: 12, color: NW.gray400 }}>
              <Icon name="info" size={13} color={NW.gray400} /> This view shows team makeup only — project details live with the Nearwork team.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.TeamDetailScreen = TeamDetailScreen;
