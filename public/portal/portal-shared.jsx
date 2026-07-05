// Portal shared chrome: Sidebar + helpers used by all 3 dashboard variations
const { useState: useState_p } = React;

// ── Sidebar ─────────────────────────────────────────────────────────────────
// Client-facing nav. "Switch organization" is Nearwork-internal and intentionally
// not present here — clients never see it.
const NAV_SECTIONS = [
  { label: 'Hiring', items: [
    { id: 'overview',  label: 'Overview',  icon: 'layout-dashboard' },
    { id: 'pipeline',  label: 'Pipeline',  icon: 'kanban-square' },
  ]},
  { label: 'Team', items: [
    { id: 'team',      label: 'Team',      icon: 'handshake' },
    { id: 'spp',       label: 'SPP',       icon: 'git-merge' },
  ]},
  { label: 'Workspace', items: [
    { id: 'billing',   label: 'Billing',   icon: 'wallet' },
  ]},
  { label: 'Settings', items: [
    { id: 'users',     label: 'Users',     icon: 'users' },
    { id: 'settings',  label: 'Settings',  icon: 'settings' },
  ]},
];

// ── Sidebar nav item (hover-aware) ──────────────────────────────────────────
function NavItem({ it, active, tight, onClick, clickable }) {
  const [hover, setHover] = useState_p(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: tight ? '7px 10px' : '9px 10px',
        borderRadius: 8,
        fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? NW.black : NW.gray600,
        background: active ? NW.gray50 : (hover ? NW.offWhite : 'transparent'),
        cursor: clickable ? 'pointer' : 'default',
        position: 'relative',
        transition: 'background 120ms, color 120ms',
      }}>
      {active && <span style={{ position: 'absolute', left: -18, top: 8, bottom: 8, width: 3, background: NW.teal500, borderRadius: 2 }} />}
      <Icon name={it.icon} size={16} color={active ? NW.teal600 : (hover ? NW.gray700 : NW.gray500)} strokeWidth={1.75} />
      <span>{it.label}</span>
    </div>
  );
}

function PortalSidebar({ active = 'overview', density = 'regular', onNav }) {
  const tight = density === 'compact';
  const c = window.NW_CLIENT;
  const go = (id) => onNav && onNav(id);
  const org = window.NW_SPP_ORG;
  const sections = window.nwNavSections ? window.nwNavSections(org) : NAV_SECTIONS;
  return (
    <aside style={{
      width: 240, minWidth: 240,
      background: NW.white,
      borderRight: `1px solid ${NW.gray100}`,
      display: 'flex', flexDirection: 'column',
      height: '100%', padding: tight ? '20px 14px' : '24px 18px',
    }}>
      {/* Logo / workspace switcher */}
      {org === 'switcher' && window.WorkspaceSwitcher ? <WorkspaceSwitcher density={density} onNav={onNav} /> : null}
      {org !== 'switcher' && (
      <div onClick={() => go('overview')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 20px', cursor: onNav ? 'pointer' : 'default' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: NW.black, color: NW.white,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Poppins', fontWeight: 700, fontSize: 16, letterSpacing: '-0.04em',
          position: 'relative', flexShrink: 0,
        }}>
          N
          <div style={{ position: 'absolute', bottom: 6, left: 7, right: 14, height: 2, background: NW.teal500, borderRadius: 1 }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{c.company}</div>
          <div style={{ fontSize: 11, color: NW.gray500, lineHeight: 1.2, marginTop: 1 }}>Client portal</div>
        </div>
      </div>
      )}

      {/* Nav */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: tight ? 10 : 14, marginTop: 4 }}>
        {sections.map(sec => (
          <div key={sec.label}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '0 10px', marginBottom: 6,
            }}>{sec.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sec.items.map(it => (
                <NavItem key={it.id} it={it} active={it.id === active} tight={tight} onClick={() => go(it.id)} clickable={!!onNav} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Account manager */}
      <div style={{
        background: NW.gray50, border: `1px solid ${NW.gray100}`,
        borderRadius: 12, padding: '11px 12px', marginTop: 10,
      }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>Account manager</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar initials="JB" size={28} bg={NW.black} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: NW.black, lineHeight: 1.2 }}>Jesus Buitrago</div>
            <div style={{ fontSize: 10, color: NW.gray500, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>jesus.buitrago@nearwork.co</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 10px', marginTop: 8,
        borderTop: `1px solid ${NW.gray100}`,
      }}>
        <Avatar initials={c.user.initials} size={32} bg={NW.teal500} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.user.name}</div>
          <div style={{ fontSize: 10, color: NW.gray500 }}>{c.user.role}</div>
        </div>
        <Icon name="log-out" size={14} color={NW.gray400} />
      </div>
    </aside>
  );
}

// ── Top bar inside each dashboard ───────────────────────────────────────────
function PortalTopBar({ greeting, subtitle, dense = false, onNav }) {
  const [bellOpen, setBellOpen] = useState_p(false);
  const [query, setQuery] = useState_p('');
  const notifs = (window.NW_ACTIVITY || []).slice(0, 5);
  const unread = 3;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: dense ? '18px 32px' : '24px 40px',
      borderBottom: `1px solid ${NW.gray100}`,
      background: NW.white,
      gap: 24, position: 'relative', zIndex: 30,
    }}>
      <div style={{ flex: 1, position: 'relative', maxWidth: 460 }}>
        <Icon name="search" size={15} color={NW.gray400} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search candidates, roles, notes…"
          style={{
            width: '100%', fontFamily: 'Poppins, sans-serif', fontSize: 13,
            color: NW.black, background: NW.gray50,
            border: `1px solid transparent`,
            borderRadius: 999, padding: '9px 14px 9px 36px',
            outline: 'none',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
            <Icon name="x" size={14} color={NW.gray400} />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <button onClick={() => setBellOpen(o => !o)} style={{
          background: bellOpen ? NW.gray50 : 'transparent', border: `1px solid ${NW.gray100}`, cursor: 'pointer',
          width: 36, height: 36, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <Icon name="bell" size={15} color={NW.gray600} />
          {unread > 0 && <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, background: NW.rose500, borderRadius: '50%', border: `1.5px solid ${NW.white}` }} />}
        </button>
        {bellOpen && (
          <>
            <div onClick={() => setBellOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{
              position: 'absolute', top: 46, right: 0, width: 340, zIndex: 50,
              background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 16,
              boxShadow: '0 18px 50px rgba(0,0,0,0.16)', overflow: 'hidden',
              animation: 'nwPop 180ms cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${NW.gray100}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: NW.black }}>Notifications</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: NW.rose600, background: NW.rose50, padding: '3px 9px', borderRadius: 999 }}>{unread} new</span>
              </div>
              <div style={{ maxHeight: 320, overflow: 'auto' }}>
                {notifs.map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', gap: 11, padding: '12px 16px', borderBottom: i === notifs.length - 1 ? 'none' : `1px solid ${NW.gray100}`, cursor: 'pointer' }}>
                    <Avatar initials={a.initials} size={30} bg={a.avatarBg} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: NW.gray700, lineHeight: 1.4 }}><span style={{ fontWeight: 600, color: NW.black }}>{a.who}</span> {a.what}</div>
                      <div style={{ fontSize: 10.5, color: NW.gray400, marginTop: 2 }}>{a.when}</div>
                    </div>
                    {i < unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: NW.rose500, flexShrink: 0, marginTop: 5 }} />}
                  </div>
                ))}
              </div>
              <button onClick={() => { setBellOpen(false); onNav && onNav('overview'); }} style={{ width: '100%', border: 'none', borderTop: `1px solid ${NW.gray100}`, background: NW.white, padding: '11px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: NW.teal600, cursor: 'pointer' }}>
                View all activity
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Activity feed row ───────────────────────────────────────────────────────
function ActivityRow({ a, dense, last }) {
  const iconMap = { advance: 'arrow-right-circle', new: 'user-plus', hired: 'party-popper', note: 'message-square-text', interview: 'calendar-clock', view: 'eye' };
  const colorMap = { advance: NW.teal500, new: NW.gray700, hired: NW.green600, note: NW.violet500, interview: NW.blue500, view: NW.gray500 };
  return (
    <div style={{ display: 'flex', gap: 12, padding: dense ? '10px 0' : '12px 0', borderBottom: last ? 'none' : `1px solid ${NW.gray100}` }}>
      <div style={{
        width: 28, height: 28, borderRadius: 999,
        background: `${colorMap[a.type]}18`, color: colorMap[a.type],
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={iconMap[a.type]} size={13} color={colorMap[a.type]} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.4 }}>
          <span style={{ color: NW.black, fontWeight: 600 }}>{a.who}</span> {a.what}
        </div>
        <div style={{ fontSize: 11, color: NW.gray400, marginTop: 2 }}>{a.when}</div>
      </div>
    </div>
  );
}

// ── Generic "coming soon" screen (for nav items not yet designed) ────────────
function PortalComingSoon({ active, title, desc, icon, density = 'regular', onNav }) {
  const dense = density === 'compact';
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.offWhite, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active={active} density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ maxWidth: 420, width: '100%' }}>
            <EmptyBlock icon={icon} title={title} desc={desc} action={<Button variant="secondary" size="sm" icon="arrow-left" onClick={() => onNav && onNav('overview')}>Back to overview</Button>} />
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Common helpers ──────────────────────────────────────────────────────────
function relTime(days) {
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function urgencyDot(days) {
  if (days >= 2) return NW.rose500;
  if (days === 1) return NW.yellow500;
  return NW.teal500;
}

function CandidateAvatar({ c, size = 36 }) {
  return <Avatar initials={c.initials} size={size} bg={c.avatarBg} />;
}

// Score chip — small, mono
function ScoreChip({ value, size = 'md' }) {
  const color = value >= 90 ? NW.teal600 : value >= 80 ? NW.teal500 : value >= 70 ? NW.yellow500 : NW.gray500;
  const bg    = value >= 90 ? NW.teal50  : value >= 80 ? NW.teal50  : value >= 70 ? NW.yellow50  : NW.gray50;
  const sizes = { sm: { fz: 11, py: 2, px: 7 }, md: { fz: 12, py: 3, px: 9 }, lg: { fz: 14, py: 5, px: 11 } };
  const s = sizes[size];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: "'JetBrains Mono', monospace",
      background: bg, color,
      border: `1px solid ${color}22`,
      fontSize: s.fz, fontWeight: 500,
      padding: `${s.py}px ${s.px}px`, borderRadius: 6,
      letterSpacing: '-0.02em',
    }}>
      {value}<span style={{ opacity: 0.5, marginLeft: 1 }}>/100</span>
    </span>
  );
}

// Section heading (small overline + display heading)
function SectionHead({ overline, title, action, dense }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: dense ? 16 : 24, gap: 16 }}>
      <div>
        {overline && <div style={{ fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>{overline}</div>}
        <h2 style={{ fontSize: dense ? 22 : 26, fontWeight: 700, color: NW.black, letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0, fontFamily: 'Poppins, sans-serif' }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ── Empty-state illustration block ──────────────────────────────────────────
function EmptyBlock({ icon, title, desc, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '48px 32px', gap: 12,
      border: `1px dashed ${NW.gray200}`, borderRadius: 16,
      background: NW.offWhite,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: NW.white, border: `1px solid ${NW.gray100}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={20} color={NW.gray400} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: NW.gray700, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 13, color: NW.gray500, marginTop: 4, maxWidth: 320 }}>{desc}</div>
      </div>
      {action}
    </div>
  );
}

Object.assign(window, {
  PortalSidebar, PortalTopBar, NAV_SECTIONS, NavItem, ActivityRow, PortalComingSoon,
  relTime, urgencyDot, CandidateAvatar, ScoreChip, SectionHead, EmptyBlock,
});
