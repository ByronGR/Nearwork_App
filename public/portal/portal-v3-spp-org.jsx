// SPP reorganization prototypes — toggled by the `sppOrg` tweak.
//
//   'section'  → Option B: SPP leaves the "Team" group and becomes its own
//                "Clients" nav section. Inside a client, the tabs are renamed
//                People / Teams / Pipeline (handled in portal-v3-spp.jsx).
//   'switcher' → Option A: the SPP nav item disappears entirely. A workspace
//                switcher sits at the top of the sidebar; partners switch
//                *into* an end-client (or the portfolio) the way you switch orgs.
//
// PortalSidebar (portal-shared.jsx) reads window.NW_SPP_ORG and renders this.

// ── Workspace switcher (Option A) ────────────────────────────────────────────
function WorkspaceSwitcher({ density = 'regular', onNav }) {
  const [open, setOpen] = useState_p(false);
  const tight = density === 'compact';
  const ws = window.NW_WS || { route: 'overview', clientId: null };
  const partner = window.NW_CLIENT;
  const clients = window.NW_SPP_CLIENTS || [];

  // Resolve the current workspace from the active route.
  let cur;
  if (ws.route === 'spp') {
    cur = { kind: 'portfolio', name: 'All clients', sub: 'Portfolio overview', initials: '◳', bg: NW.gray700 };
  } else if (ws.route === 'spp-client') {
    const c = clients.find(x => x.id === ws.clientId) || clients[0];
    cur = { kind: 'client', name: c.name, sub: 'Client workspace', initials: c.initials, bg: c.logoBg };
  } else {
    cur = { kind: 'partner', name: partner.company, sub: 'Your workspace', initials: partner.initials, bg: NW.black };
  }

  const pick = (fn) => { setOpen(false); fn && fn(); };
  const Tile = ({ bg, initials, size = 32 }) => (
    <div style={{ width: size, height: size, borderRadius: 9, background: bg, color: NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins', fontWeight: 700, fontSize: size * 0.42, letterSpacing: '-0.03em', flexShrink: 0 }}>{initials}</div>
  );

  const Row = ({ bg, initials, name, sub, on, onClick }) => {
    const [h, setH] = useState_p(false);
    return (
      <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 9px', borderRadius: 9, cursor: 'pointer', background: on ? NW.teal50 : (h ? NW.gray50 : 'transparent') }}>
        <Tile bg={bg} initials={initials} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          {sub && <div style={{ fontSize: 10.5, color: NW.gray500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
        </div>
        {on && <Icon name="check" size={15} color={NW.teal600} />}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', marginBottom: tight ? 14 : 18 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10, font: 'inherit',
        padding: tight ? '8px 9px' : '9px 10px', borderRadius: 11, cursor: 'pointer',
        background: open ? NW.gray50 : NW.white, border: `1px solid ${open ? NW.gray200 : NW.gray100}`,
        textAlign: 'left', transition: 'background 120ms, border-color 120ms',
      }}>
        <Tile bg={cur.bg} initials={cur.initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.2 }}>{cur.sub}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', lineHeight: 1.25, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.name}</div>
        </div>
        <Icon name="chevrons-up-down" size={15} color={NW.gray400} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
            background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 14,
            boxShadow: '0 18px 50px rgba(0,0,0,0.16)', padding: 6, maxHeight: 420, overflow: 'auto',
            animation: 'nwPop 160ms cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 9px 5px' }}>Your organization</div>
            <Row bg={NW.black} initials={partner.initials} name={partner.company} sub="Your workspace" on={cur.kind === 'partner'} onClick={() => pick(() => onNav && onNav('overview'))} />
            <div style={{ height: 1, background: NW.gray100, margin: '6px 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px 5px' }}>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Client workspaces</span>
              <span style={{ fontSize: 10, color: NW.gray400 }}>{clients.length}</span>
            </div>
            <Row bg={NW.gray700} initials="◳" name="All clients" sub="Portfolio overview" on={cur.kind === 'portfolio'} onClick={() => pick(() => onNav && onNav('spp'))} />
            {clients.map(c => (
              <Row key={c.id} bg={c.logoBg} initials={c.initials} name={c.name} sub={c.industry}
                on={cur.kind === 'client' && c.id === ws.clientId}
                onClick={() => pick(() => onNav && onNav('spp-client', c.id))} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

window.WorkspaceSwitcher = WorkspaceSwitcher;

// Nav-section builder shared by PortalSidebar. Keeps the SPP reorg logic in one place.
function nwNavSections(org) {
  if (org === 'switcher') {
    // Option A: SPP is reached through the workspace switcher, not the nav.
    return [
      { label: 'Hiring', items: [
        { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
        { id: 'pipeline', label: 'Pipeline', icon: 'kanban-square' },
      ]},
      { label: 'Team', items: [
        { id: 'team', label: 'Team', icon: 'handshake' },
      ]},
      { label: 'Workspace', items: [
        { id: 'billing', label: 'Billing', icon: 'wallet' },
      ]},
      { label: 'Settings', items: [
        { id: 'users', label: 'Users', icon: 'users' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
      ]},
    ];
  }
  // Option B: SPP becomes its own "Clients" section.
  return [
    { label: 'Hiring', items: [
      { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
      { id: 'pipeline', label: 'Pipeline', icon: 'kanban-square' },
    ]},
    { label: 'Team', items: [
      { id: 'team', label: 'Team', icon: 'handshake' },
    ]},
    { label: 'Clients', items: [
      { id: 'spp', label: 'Clients', icon: 'building-2' },
    ]},
    { label: 'Workspace', items: [
      { id: 'billing', label: 'Billing', icon: 'wallet' },
    ]},
    { label: 'Settings', items: [
      { id: 'users', label: 'Users', icon: 'users' },
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ]},
  ];
}

window.nwNavSections = nwNavSections;
