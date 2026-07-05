// V3 — Full pipeline kanban board.

function KanbanCard({ c, dense, compareMode, selected, onToggleSelect, onOpen }) {
  const [hover, setHover] = useState_p(false);
  const urgent = c.awaitingDays >= 2;
  return (
    <div
      onClick={() => compareMode ? (onToggleSelect && onToggleSelect(c)) : (onOpen && onOpen(c))}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: NW.white,
        border: `1px solid ${selected ? NW.teal500 : (hover ? NW.gray200 : NW.gray100)}`,
        boxShadow: selected ? `0 0 0 3px ${NW.teal500}22` : (hover ? '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.03)'),
        borderRadius: 12,
        padding: dense ? 12 : 14,
        cursor: 'pointer', position: 'relative',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'border-color 150ms, box-shadow 150ms',
      }}>
      {compareMode && (
        <span style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? NW.teal500 : NW.gray300}`, background: selected ? NW.teal500 : NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <Icon name="check" size={13} color={NW.white} strokeWidth={3} />}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CandidateAvatar c={c} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          <div style={{ fontSize: 10.5, color: NW.gray500, marginTop: 1 }}>{c.location}</div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: NW.gray700, lineHeight: 1.35 }}>{c.role}</div>
      {/* Score bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Match</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: NW.black, fontWeight: 500 }}>{c.score}</span>
        </div>
        <div style={{ height: 3, background: NW.gray100, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${c.score}%`, height: '100%', background: c.score >= 90 ? NW.teal600 : c.score >= 80 ? NW.teal500 : NW.yellow500 }} />
        </div>
      </div>
      {/* Footer: tags + waiting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {c.match.slice(0, 2).map(t => (
          <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: NW.gray50, color: NW.gray600, border: `1px solid ${NW.gray100}` }}>{t}</span>
        ))}
        {c.match.length > 2 && <span style={{ fontSize: 10, color: NW.gray400 }}>+{c.match.length - 2}</span>}
        <span style={{ flex: 1 }} />
        {urgent && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 999,
            background: NW.rose50, color: NW.rose600,
          }}>
            <span style={{ width: 4, height: 4, background: NW.rose500, borderRadius: '50%' }} />
            {c.awaitingDays}d
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ stage, candidates, dense, compareMode, selectedIds, onToggleSelect, onOpen }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: NW.offWhite,
      border: `1px solid ${NW.gray100}`,
      borderRadius: 14,
      display: 'flex', flexDirection: 'column',
      maxHeight: '100%',
    }}>
      {/* Column header */}
      <div style={{
        padding: dense ? '12px 14px' : '14px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: `1px solid ${NW.gray100}`,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: stage.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em' }}>{stage.key}</span>
        <span style={{
          background: NW.white, border: `1px solid ${NW.gray100}`,
          color: NW.gray600, fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5, fontWeight: 500, padding: '1px 7px', borderRadius: 999,
        }}>{candidates.length}</span>
        <span style={{ flex: 1 }} />
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: NW.gray400, padding: 4, display: 'flex' }}>
          <Icon name="more-horizontal" size={14} color={NW.gray400} />
        </button>
      </div>
      {/* Cards */}
      <div style={{
        flex: 1, overflow: 'auto',
        padding: dense ? 10 : 12,
        display: 'flex', flexDirection: 'column', gap: dense ? 8 : 10,
      }}>
        {candidates.length === 0 ? (
          <div style={{
            border: `1px dashed ${NW.gray200}`, borderRadius: 10,
            padding: '24px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: NW.gray400 }}>No candidates</div>
          </div>
        ) : candidates.map(c => <KanbanCard key={c.id} c={c} dense={dense} compareMode={compareMode} selected={selectedIds && selectedIds.includes(c.id)} onToggleSelect={onToggleSelect} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

// ── List view row ───────────────────────────────────────────────────────────
function PipelineListRow({ c, stage, dense, last, compareMode, selected, onToggleSelect, onOpen }) {
  const [hover, setHover] = useState_p(false);
  return (
    <div
      onClick={() => compareMode ? (onToggleSelect && onToggleSelect(c)) : (onOpen && onOpen(c))}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', gridTemplateColumns: `${compareMode ? '28px ' : ''}2fr 1.4fr 1.2fr 1fr 0.7fr`,
        alignItems: 'center', gap: 16,
        padding: dense ? '12px 18px' : '15px 20px',
        borderRadius: 12,
        background: selected ? NW.teal50 : (hover ? NW.gray50 : 'transparent'),
        boxShadow: selected ? `inset 0 0 0 1px ${NW.teal500}55` : 'none',
        cursor: 'pointer', transition: 'background 120ms',
      }}>
      {compareMode && (
        <span style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? NW.teal500 : NW.gray300}`, background: selected ? NW.teal500 : NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <Icon name="check" size={13} color={NW.white} strokeWidth={3} />}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
        <CandidateAvatar c={c} size={dense ? 36 : 40} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{c.location}</div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: NW.gray700 }}>{c.role}</div>
      <div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: NW.gray700, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '4px 11px', borderRadius: 999 }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: stage ? stage.color : NW.gray300 }} />
          {c.stage}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 5, background: NW.gray100, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${c.score}%`, height: '100%', background: c.score >= 90 ? NW.teal600 : c.score >= 80 ? NW.teal500 : NW.yellow500 }} />
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: NW.black, minWidth: 22, textAlign: 'right' }}>{c.score}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        {c.awaitingDays === 0
          ? <span style={{ fontSize: 11, color: NW.gray400 }}>—</span>
          : <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: c.awaitingDays >= 2 ? NW.rose50 : NW.yellow50, color: c.awaitingDays >= 2 ? NW.rose600 : '#A16207' }}>{c.awaitingDays}d</span>}
      </div>
    </div>
  );
}

// ── Kickoff brief drawer (read-only, the approved brief stored with the role) ──
function KickoffBriefDrawer({ opening, brief, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(15,15,15,0.32)',
      display: 'flex', justifyContent: 'flex-end',
      animation: 'nwFade 160ms ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(520px, 92%)', height: '100%', background: NW.white,
        boxShadow: '-12px 0 40px rgba(0,0,0,0.16)',
        display: 'flex', flexDirection: 'column',
        animation: 'nwSlideIn 240ms cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '22px 26px', borderBottom: `1px solid ${NW.gray100}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: NW.teal50, color: NW.teal700, marginBottom: 11 }}>
              <Icon name="check-circle" size={12} color={NW.teal700} /> Approved kickoff
            </span>
            <div style={{ fontSize: 21, fontWeight: 700, color: NW.black, letterSpacing: '-0.025em', lineHeight: 1.15 }}>{opening.title}</div>
            <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 5 }}>{opening.team} · {opening.location}</div>
          </div>
          <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="x" size={16} color={NW.gray600} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 12, marginBottom: 24 }}>
            <Avatar initials={brief.sentBy.initials} bg={brief.sentBy.avatarBg} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: NW.black }}>{brief.sentBy.name}</div>
              <div style={{ fontSize: 11, color: NW.gray500 }}>Approved {brief.approvedDate}</div>
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 26 }}>
            {[
              { icon: 'signal', l: 'Seniority', v: brief.seniority },
              { icon: 'briefcase', l: 'Engagement', v: brief.engagement },
              { icon: 'wallet', l: 'Comp range', v: brief.comp },
              { icon: 'clock', l: 'Timezone', v: brief.timezone },
              { icon: 'calendar', l: 'Start target', v: brief.startTarget },
              { icon: 'users', l: 'Headcount', v: brief.headcount },
            ].map(m => (
              <div key={m.l}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}><Icon name={m.icon} size={12} color={NW.gray400} /> {m.l}</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: NW.black }}>{m.v}</div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Role overview</h3>
          <p style={{ fontSize: 14, color: NW.gray800, lineHeight: 1.6, margin: '0 0 26px' }}>{brief.summary}</p>

          <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Key responsibilities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
            {brief.responsibilities.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: NW.teal500, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, color: NW.gray800, lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Must-have</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {brief.mustHave.map(s => <span key={s} style={{ fontSize: 12.5, fontWeight: 500, color: NW.teal700, background: NW.teal50, border: '1px solid #16A08522', padding: '5px 12px', borderRadius: 8 }}>{s}</span>)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Nice to have</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {brief.niceToHave.map(s => <span key={s} style={{ fontSize: 12.5, fontWeight: 500, color: NW.gray600, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '5px 12px', borderRadius: 8 }}>{s}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineScreen({ populated = true, density = 'regular', onNav, openingId }) {
  const dense = density === 'compact';
  const pad = dense ? 28 : 36;
  const allCandidates = populated ? window.NW_CANDIDATES : [];
  const activeRole = openingId || 'all';
  const [view, setView] = useState_p('kanban');
  const candidates = activeRole === 'all' ? allCandidates : allCandidates.filter(c => c.openingId === activeRole);
  const stages = [
    { key: 'Applied',     idx: 1, color: NW.gray300 },
    { key: 'Screening',   idx: 2, color: NW.violet500 },
    { key: 'Technical',   idx: 3, color: NW.teal500 },
    { key: 'Final round', idx: 4, color: NW.teal600 },
    { key: 'Offer',       idx: 5, color: NW.rose500 },
    { key: 'Not selected',idx: 6, color: '#94A3B8' },
  ];
  const roleLabels = {
    'all': 'All roles', 'be-1': 'Senior Backend Engineer', 'pd-1': 'Product Designer',
    'do-1': 'DevOps Engineer', 'be-2': 'Backend Engineer',
  };
  const activeRoleLabel = roleLabels[activeRole];
  const stageOf = (c) => stages.find(s => s.idx === c.stageIdx);
  const activeCount = candidates.filter(c => c.stageIdx < 6).length;
  const notSelected = candidates.filter(c => c.stageIdx === 6).length;
  const opening = (window.NW_OPENINGS || []).find(o => o.id === activeRole);
  const brief = opening && opening.brief;
  const [showBrief, setShowBrief] = useState_p(false);
  const [compareMode, setCompareMode] = useState_p(false);
  const [selectedIds, setSelectedIds] = useState_p([]);
  const [showCompare, setShowCompare] = useState_p(false);
  const toggleSelect = (c) => setSelectedIds(ids => ids.includes(c.id) ? ids.filter(i => i !== c.id) : (ids.length >= 3 ? ids : [...ids, c.id]));
  const openCandidate = (c) => onNav && onNav('candidate', c.id);
  const selectedCandidates = selectedIds.map(id => candidates.find(c => c.id === id)).filter(Boolean);
  const exitCompare = () => { setCompareMode(false); setSelectedIds([]); };
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.white, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="pipeline" density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: `${dense ? 24 : 32}px ${pad}px ${pad}px` }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: dense ? 16 : 20, gap: 24 }}>
            <div>
              <button onClick={() => onNav && onNav('pipeline')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
                background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit',
                fontSize: 12, fontWeight: 600, color: NW.gray500, letterSpacing: '0.04em', padding: 0,
              }}>
                <Icon name="arrow-left" size={14} color={NW.gray500} /> Open roles
              </button>
              <h1 style={{ fontSize: dense ? 30 : 36, fontWeight: 700, color: NW.black, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0, fontFamily: 'Poppins, sans-serif' }}>
                {!populated ? <>No one in pipeline yet.</>
                  : activeRole === 'all'
                    ? <><span style={{ color: NW.teal500 }}>{activeCount}</span> candidates across <span style={{ color: NW.gray400 }}>4 open roles.</span></>
                    : <>{activeRoleLabel} · <span style={{ color: NW.teal500 }}>{activeCount}</span> <span style={{ color: NW.gray400 }}>in pipeline.</span></>}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* View toggle */}
              <div style={{ display: 'flex', gap: 2, padding: 3, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 8 }}>
                {[
                  { id: 'kanban', icon: 'kanban-square' },
                  { id: 'list',   icon: 'list' },
                ].map((v) => {
                  const on = view === v.id;
                  return (
                    <button key={v.id} onClick={() => setView(v.id)} style={{
                      border: 'none', padding: '5px 10px', borderRadius: 6,
                      background: on ? NW.white : 'transparent',
                      color: on ? NW.black : NW.gray500,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      boxShadow: on ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}>
                      <Icon name={v.icon} size={14} color={on ? NW.black : NW.gray500} />
                    </button>
                  );
                })}
              </div>
              <Button variant={compareMode ? 'dark' : 'secondary'} size="sm" icon={compareMode ? 'x' : 'columns-3'} onClick={() => compareMode ? exitCompare() : setCompareMode(true)}>{compareMode ? 'Cancel compare' : 'Compare'}</Button>
              {brief && <Button variant="secondary" size="sm" icon="file-text" onClick={() => setShowBrief(true)}>Kickoff brief</Button>}
            </div>
          </div>

          {compareMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: NW.teal50, border: '1px solid #16A08526', borderRadius: 12, marginBottom: dense ? 12 : 16 }}>
              <Icon name="columns-3" size={15} color={NW.teal600} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.teal700 }}>Select 2–3 candidates to compare side by side</span>
            </div>
          )}

          {/* Board / list */}
          {populated ? (
            view === 'kanban' ? (
              <div style={{ flex: 1, display: 'flex', gap: dense ? 12 : 14, minHeight: 0 }}>
                {stages.map(s => (
                  <KanbanColumn
                    key={s.key} stage={s}
                    candidates={candidates.filter(c => c.stageIdx === s.idx)}
                    dense={dense}
                    compareMode={compareMode} selectedIds={selectedIds} onToggleSelect={toggleSelect} onOpen={openCandidate}
                  />
                ))}
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 18, padding: dense ? '14px 12px' : '18px 16px' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: `${compareMode ? '28px ' : ''}2fr 1.4fr 1.2fr 1fr 0.7fr`,
                  gap: 16, padding: '0 20px 12px',
                  fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.12em', textTransform: 'uppercase',
                  borderBottom: `1px solid ${NW.gray100}`,
                }}>
                  {compareMode && <span></span>}
                  <span>Candidate</span><span>Role</span><span>Stage</span><span>Match</span>
                  <span style={{ textAlign: 'right' }}>Waiting</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  {[...candidates].sort((a, b) => b.stageIdx - a.stageIdx).map((c, i) => (
                    <PipelineListRow key={c.id} c={c} stage={stageOf(c)} dense={dense} last={i === candidates.length - 1}
                      compareMode={compareMode} selected={selectedIds.includes(c.id)} onToggleSelect={toggleSelect} onOpen={openCandidate} />
                  ))}
                </div>
              </div>
            )
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyBlock
                icon="kanban-square"
                title="Pipeline is empty"
                desc="Once Nearwork sources candidates for your open roles, they'll move through these stages."
                action={<Button variant="primary" size="sm" onClick={() => onNav && onNav('pipeline')}>View open roles</Button>}
              />
            </div>
          )}
        </div>
        {/* Compare floating bar */}
        {compareMode && selectedCandidates.length > 0 && (
          <div style={{ position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 45, display: 'flex', alignItems: 'center', gap: 16, background: NW.black, color: NW.white, padding: '12px 14px 12px 20px', borderRadius: 999, boxShadow: '0 16px 40px rgba(0,0,0,0.28)', animation: 'nwPop 200ms cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {selectedCandidates.map((c, i) => (
                <div key={c.id} title={c.name} style={{ marginLeft: i === 0 ? 0 : -8, border: `2px solid ${NW.black}`, borderRadius: '50%' }}><CandidateAvatar c={c} size={30} /></div>
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedCandidates.length} selected</span>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>{selectedCandidates.length < 2 ? 'Pick at least 2' : `up to 3`}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={exitCompare} style={{ border: 'none', background: 'rgba(255,255,255,0.14)', color: NW.white, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 999, cursor: 'pointer' }}>Clear</button>
              <button disabled={selectedCandidates.length < 2} onClick={() => setShowCompare(true)} style={{ border: 'none', background: selectedCandidates.length < 2 ? 'rgba(255,255,255,0.2)' : NW.teal500, color: NW.white, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, padding: '8px 18px', borderRadius: 999, cursor: selectedCandidates.length < 2 ? 'not-allowed' : 'pointer' }}>Compare</button>
            </div>
          </div>
        )}
        {showBrief && brief && <KickoffBriefDrawer opening={opening} brief={brief} onClose={() => setShowBrief(false)} />}
        {showCompare && <CompareModal candidates={selectedCandidates} onClose={() => setShowCompare(false)} />}
      </main>
    </div>
  );
}

window.PipelineScreen = PipelineScreen;
