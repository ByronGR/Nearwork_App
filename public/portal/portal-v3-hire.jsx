// Hire detail — the full HR profile for someone the client hired through Nearwork.
// Placement, source pipeline, updates, performance reviews, EOR benefits, comp, PTO, notes.

function FactCell({ icon, label, value, sub, onClick, accent }) {
  const clickable = !!onClick;
  const [hover, setHover] = useState_p(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        flex: 1, minWidth: 0, padding: '16px 18px',
        borderRight: `1px solid ${NW.gray100}`,
        cursor: clickable ? 'pointer' : 'default',
        background: clickable && hover ? NW.gray50 : 'transparent',
        transition: 'background 120ms',
      }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 9 }}>
        <Icon name={icon} size={12} color={NW.gray400} /> {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: clickable ? (accent || NW.teal600) : NW.black, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
        {clickable && <Icon name="arrow-up-right" size={13} color={accent || NW.teal600} style={{ transform: hover ? 'translate(2px,-2px)' : 'none', transition: 'transform 160ms' }} />}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, action, children, pad = 26 }) {
  return (
    <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: pad }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

// Update (notification) row for a hire
const UPDATE_META = {
  pto:    { icon: 'plane',         c: NW.teal600 },
  review: { icon: 'star',          c: NW.violet500 },
  doc:    { icon: 'file-text',     c: NW.gray600 },
  comp:   { icon: 'wallet',        c: '#A16207' },
  anniversary: { icon: 'party-popper', c: NW.rose500 },
};
function UpdateRow({ u, last, resolution, onResolve, onAddReview }) {
  const m = UPDATE_META[u.type] || UPDATE_META.doc;
  const showPto = u.action === 'pto' && !resolution;
  const showReview = u.action === 'review';
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: last ? 'none' : `1px solid ${NW.gray100}` }}>
      <div style={{ width: 32, height: 32, borderRadius: 999, background: `${m.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={m.icon} size={14} color={m.c} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.4 }}>{u.text}</div>
        <div style={{ fontSize: 11, color: NW.gray400, marginTop: 2 }}>{u.when}</div>
        {/* Actions */}
        {showPto && (
          <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
            <button onClick={() => onResolve(u.id, 'approved')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: NW.teal500, color: NW.white, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '6px 13px', borderRadius: 8, cursor: 'pointer' }}>
              <Icon name="check" size={13} color={NW.white} strokeWidth={2.5} /> Approve
            </button>
            <button onClick={() => onResolve(u.id, 'declined')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${NW.gray200}`, background: NW.white, color: NW.gray700, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '6px 13px', borderRadius: 8, cursor: 'pointer' }}>
              Decline
            </button>
          </div>
        )}
        {u.action === 'pto' && resolution && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: resolution === 'approved' ? NW.teal50 : NW.gray50, color: resolution === 'approved' ? NW.teal700 : NW.gray500 }}>
            <Icon name={resolution === 'approved' ? 'check' : 'x'} size={12} color={resolution === 'approved' ? NW.teal600 : NW.gray500} /> {resolution === 'approved' ? 'You approved this' : 'You declined this'}
          </div>
        )}
        {showReview && (
          <div style={{ marginTop: 9 }}>
            <button onClick={onAddReview} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${NW.gray200}`, background: NW.white, color: NW.gray800, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '6px 13px', borderRadius: 8, cursor: 'pointer' }}>
              <Icon name="plus" size={13} color={NW.gray700} /> Add review
            </button>
          </div>
        )}
      </div>
      {u.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: NW.rose500, flexShrink: 0, marginTop: 4 }} />}
    </div>
  );
}

function ReviewRow({ r, onOpen }) {
  const [hover, setHover] = useState_p(false);
  const annual = r.type === 'annual';
  return (
    <div onClick={() => onOpen(r)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', gap: 14, padding: '15px 16px', border: `1px solid ${hover ? NW.gray200 : NW.gray100}`, borderRadius: 14, cursor: 'pointer', background: hover ? NW.gray50 : NW.white, transition: 'background 120ms, border-color 120ms' }}>
      <div style={{ minWidth: 76 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: NW.black }}>{r.period}</div>
        <div style={{ fontSize: 10.5, color: NW.gray400, marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name={r.conductedBy === 'Nearwork' ? 'shield-check' : 'user'} size={11} color={NW.gray400} /> {r.conductedBy}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 6 }}><StarRating value={r.rating} size={14} /></div>
        <p style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.summary}</p>
      </div>
      <Icon name="chevron-right" size={16} color={hover ? NW.gray500 : NW.gray300} style={{ alignSelf: 'center', flexShrink: 0 }} />
    </div>
  );
}

function HireDetailScreen({ hireId, density = 'regular', onNav }) {
  const dense = density === 'compact';
  const pad = dense ? 32 : 44;
  const people = window.NW_TEAM_PEOPLE || [];
  const p = people.find(x => x.id === hireId) || people[0];
  const teams = window.NW_TEAM_TEAMS || [];
  const d = p ? window.getHireDetail(p) : null;

  const [reviews, setReviews] = useState_p(() => (d ? d.reviews : []));
  const [notes, setNotes] = useState_p(() => (d ? d.clientNotes : []));
  const [noteDraft, setNoteDraft] = useState_p('');
  const [noteShare, setNoteShare] = useState_p('internal'); // 'internal' | 'shared'
  const [openReview, setOpenReview] = useState_p(null);
  const [addingReview, setAddingReview] = useState_p(false);
  const [lockedNotice, setLockedNotice] = useState_p(false);
  const [ptoResolutions, setPtoResolutions] = useState_p({}); // updateId -> 'approved'|'declined'

  if (!p) return null;
  const team = teams.find(t => t.id === p.teamId);
  const st = STATUS_META[p.status];
  const sen = SENIORITY_META[p.seniority] || SENIORITY_META.Mid;
  const benefits = window.NW_EOR_BENEFITS || [];
  const vacPct = d.vacationTotal ? Math.round((d.vacationUsed / d.vacationTotal) * 100) : 0;
  const clientConducts = d.reviewOwner === 'Client';
  const unread = (d.updates || []).filter(u => u.unread).length;

  const addNote = () => {
    if (!noteDraft.trim()) return;
    setNotes([{ author: window.NW_CLIENT.user.name, date: 'Just now', text: noteDraft.trim(), visibility: noteShare }, ...notes]);
    setNoteDraft('');
  };
  const onAddReviewClick = () => clientConducts ? setAddingReview(true) : setLockedNotice(true);
  const saveReview = (r) => { setReviews([r, ...reviews]); setAddingReview(false); setOpenReview(r); };
  const resolvePto = (id, decision) => setPtoResolutions({ ...ptoResolutions, [id]: decision });
  const pendingActions = (d.updates || []).filter(u => (u.action === 'pto' && !ptoResolutions[u.id]) || (u.action === 'review' && clientConducts && reviews.length === 0)).length;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.offWhite, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="team" density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'auto', padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>

            <button onClick={() => onNav && onNav('team')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18,
              background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit',
              fontSize: 12, fontWeight: 600, color: NW.gray500, letterSpacing: '0.04em', padding: 0,
            }}>
              <Icon name="arrow-left" size={14} color={NW.gray500} /> Team
            </button>

            {/* Header */}
            <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 22, overflow: 'hidden', marginBottom: dense ? 18 : 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, padding: dense ? 24 : 30, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
                  <Avatar initials={p.initials} bg={p.avatarBg} size={dense ? 60 : 72} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <h1 style={{ fontSize: dense ? 26 : 32, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', margin: 0 }}>{p.name}</h1>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: '5px 11px', borderRadius: 999 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} /> {st.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, color: NW.gray700, fontWeight: 500 }}>{p.role}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: sen.color, background: sen.bg, padding: '2px 9px', borderRadius: 999 }}>{p.seniority}</span>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: NW.gray300 }} />
                      <span style={{ fontSize: 13, color: NW.gray500 }}>{p.location}</span>
                    </div>
                    {p.statusNote && <div style={{ fontSize: 12.5, color: '#A16207', marginTop: 8 }}>{p.statusNote}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {team && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: NW.teal700, background: NW.teal50, border: '1px solid #16A08522', padding: '7px 12px', borderRadius: 999 }}>
                      <Icon name="shield-check" size={13} color={NW.teal600} /> Managed by Nearwork
                    </span>
                  )}
                  <Button variant="dark" size="sm" icon="message-square-text" onClick={() => document.getElementById('nw-notes')?.scrollIntoView?.({ behavior: 'smooth' })}>Leave a note</Button>
                </div>
              </div>
              {/* Facts strip */}
              <div style={{ display: 'flex', borderTop: `1px solid ${NW.gray100}`, background: NW.offWhite, flexWrap: 'wrap' }}>
                <FactCell icon="calendar-check" label="Placed" value={p.since} sub={p.tenure} />
                <FactCell icon="git-branch" label="Source pipeline" value={d.sourceRole || '—'} accent={NW.teal600}
                  onClick={d.sourceOpeningId ? () => onNav && onNav('kanban', d.sourceOpeningId) : undefined} />
                <FactCell icon="users-round" label="Team" value={team ? team.name : 'Individual'} accent={team ? team.accent : undefined}
                  onClick={team ? () => onNav && onNav('team', null, { view: 'teams' }) : undefined} />
                <FactCell icon="wallet" label="Salary" value={`${d.salaryMonthly || '—'}`} sub="per month" />
                <FactCell icon="palmtree" label="Vacation" value={`${d.vacationRemaining} days left`} sub={`of ${d.vacationTotal}`} />
              </div>
            </div>

            {/* Body */}
            <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : '1.6fr 1fr', gap: dense ? 18 : 24, alignItems: 'start' }}>

              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: dense ? 18 : 24 }}>

                {/* Replacement guarantee + progress updates */}
                <ReplacementPanel key={p.id} person={p} dense={dense} guaranteeMonths={p.managed ? 6 : 3} accountManager="Lina Pardo" />

                {/* Performance */}
                <Panel title="Performance reviews"
                  action={<Button variant="secondary" size="sm" icon="plus" onClick={onAddReviewClick}>Add review</Button>}>
                  {/* Who conducts reviews */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 11, background: clientConducts ? NW.gray50 : NW.teal50, border: `1px solid ${clientConducts ? NW.gray100 : '#16A08522'}`, marginBottom: 16 }}>
                    <Icon name={clientConducts ? 'user' : 'shield-check'} size={14} color={clientConducts ? NW.gray500 : NW.teal600} />
                    <span style={{ fontSize: 12.5, color: clientConducts ? NW.gray600 : NW.teal700, fontWeight: 500 }}>
                      {clientConducts ? 'You conduct reviews for this individual hire.' : `Nearwork conducts reviews for ${p.name.split(' ')[0]} as part of a managed team.`}
                    </span>
                  </div>
                  {reviews.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {reviews.map(r => <ReviewRow key={r.id} r={r} onOpen={setOpenReview} />)}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '26px 16px' }}>
                      <Icon name="star" size={22} color={NW.gray300} />
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: NW.gray600, marginTop: 8 }}>No reviews yet</div>
                      <div style={{ fontSize: 12.5, color: NW.gray400, marginTop: 3 }}>{clientConducts ? 'Add the first performance review for this hire.' : 'Nearwork will post the first review here.'}</div>
                    </div>
                  )}
                </Panel>

                {/* EOR plan & benefits */}
                <EORPanel person={p} dense={dense} />

                {/* Notes — internal or shared with Nearwork */}
                <div id="nw-notes">
                  <Panel title="Notes">
                    <div style={{ display: 'flex', gap: 11, marginBottom: notes.length ? 18 : 0 }}>
                      <Avatar initials={window.NW_CLIENT.user.initials} bg={NW.teal500} size={34} />
                      <div style={{ flex: 1 }}>
                        <textarea
                          value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                          placeholder={`Add a note about ${p.name.split(' ')[0]}…`}
                          style={{ width: '100%', minHeight: 64, resize: 'vertical', boxSizing: 'border-box', border: `1px solid ${NW.gray200}`, borderRadius: 12, padding: '11px 13px', fontFamily: 'inherit', fontSize: 13.5, color: NW.black, lineHeight: 1.5, outline: 'none', background: NW.offWhite }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 12, flexWrap: 'wrap' }}>
                          {/* visibility toggle */}
                          <div style={{ display: 'flex', gap: 3, padding: 3, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 9 }}>
                            {[
                              { id: 'internal', label: 'Internal', icon: 'lock' },
                              { id: 'shared', label: 'Share with Nearwork', icon: 'send' },
                            ].map(o => {
                              const on = noteShare === o.id;
                              return (
                                <button key={o.id} onClick={() => setNoteShare(o.id)} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none',
                                  padding: '6px 11px', borderRadius: 7, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                  background: on ? NW.white : 'transparent', color: on ? NW.black : NW.gray500,
                                  boxShadow: on ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                }}>
                                  <Icon name={o.icon} size={12} color={on ? (o.id === 'shared' ? NW.teal600 : NW.gray600) : NW.gray400} /> {o.label}
                                </button>
                              );
                            })}
                          </div>
                          <Button variant="primary" size="sm" icon="send" disabled={!noteDraft.trim()} onClick={addNote}>Post note</Button>
                        </div>
                        <div style={{ fontSize: 11.5, color: NW.gray400, marginTop: 8 }}>
                          {noteShare === 'shared' ? 'Shared notes appear on Nearwork’s side for this hire.' : 'Internal notes stay private to your team.'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {notes.map((n, i) => {
                        const shared = n.visibility === 'shared';
                        return (
                          <div key={i} style={{ display: 'flex', gap: 11 }}>
                            <Avatar initials={n.author.split(' ').map(w => w[0]).join('').slice(0, 2)} bg={shared ? NW.teal500 : NW.violet500} size={34} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{n.author}</span>
                                <span style={{ fontSize: 11, color: NW.gray400 }}>{n.date}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: shared ? NW.teal50 : NW.gray50, color: shared ? NW.teal700 : NW.gray500 }}>
                                  <Icon name={shared ? 'send' : 'lock'} size={10} color={shared ? NW.teal600 : NW.gray400} /> {shared ? 'Shared with Nearwork' : 'Internal'}
                                </span>
                              </div>
                              <p style={{ fontSize: 13.5, color: NW.gray700, lineHeight: 1.55, margin: 0 }}>{n.text}</p>
                            </div>
                          </div>
                        );
                      })}
                      {notes.length === 0 && <div style={{ fontSize: 13, color: NW.gray400 }}>No notes yet.</div>}
                    </div>
                  </Panel>
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: dense ? 18 : 24 }}>

                {/* Updates */}
                <Panel title="Updates" pad={24}
                  action={unread > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: NW.rose600, background: NW.rose50, padding: '4px 10px', borderRadius: 999 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: NW.rose500 }} />{unread} new</span>}>
                  {pendingActions > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 11, background: NW.rose50, border: '1px solid #E74C7C26', marginBottom: 14 }}>
                      <Icon name="bell-ring" size={15} color={NW.rose600} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.rose600 }}>{pendingActions} {pendingActions === 1 ? 'item needs' : 'items need'} your action</span>
                    </div>
                  )}
                  {d.updates && d.updates.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {d.updates.map((u, i) => <UpdateRow key={u.id} u={u} last={i === d.updates.length - 1} resolution={ptoResolutions[u.id]} onResolve={resolvePto} onAddReview={onAddReviewClick} />)}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: NW.gray400 }}>No recent updates.</div>
                  )}
                </Panel>

                {/* Compensation */}
                <Panel title="Compensation" pad={24}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Poppins', fontSize: 34, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em' }}>{d.salaryMonthly}</span>
                    <span style={{ fontSize: 13, color: NW.gray500 }}>/ month</span>
                  </div>
                  <div style={{ fontSize: 13, color: NW.gray500, marginBottom: 16 }}>{d.salaryAnnual ? `${d.salaryAnnual} annual` : ''} · {d.currency}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {[
                      { l: 'Engagement', v: d.contractType, icon: 'file-signature' },
                      { l: 'Last review', v: d.lastReview, icon: 'clock' },
                      { l: 'Next review', v: d.nextReview, icon: 'calendar' },
                      { l: 'Manager', v: d.manager, icon: 'user' },
                    ].map(row => (
                      <div key={row.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 11, borderTop: `1px solid ${NW.gray100}` }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: NW.gray500 }}><Icon name={row.icon} size={13} color={NW.gray400} /> {row.l}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* Time off */}
                <Panel title="Time off" pad={24}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontFamily: 'Poppins', fontSize: 34, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1 }}>{d.vacationRemaining}</span>
                    <span style={{ fontSize: 13, color: NW.gray500, marginBottom: 3 }}>of {d.vacationTotal} days left</span>
                  </div>
                  <div style={{ height: 8, background: NW.gray100, borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${100 - vacPct}%`, height: '100%', background: NW.teal500 }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: NW.gray400, marginBottom: 4 }}>{d.vacationUsed} days used this year</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: NW.gray500, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '3px 9px', borderRadius: 999, marginBottom: 18 }}><Icon name="info" size={11} color={NW.gray400} /> Accrues 1.25 days / month · Colombia</div>

                  <div style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Upcoming PTO</div>
                  {d.upcomingPTO.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {d.upcomingPTO.map((pto, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', border: `1px solid ${NW.gray100}`, borderRadius: 12 }}>
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
                  ) : (
                    <div style={{ fontSize: 13, color: NW.gray400 }}>No upcoming time off scheduled.</div>
                  )}
                </Panel>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {openReview && <ReviewViewModal review={openReview} person={p} onClose={() => setOpenReview(null)} />}
        {addingReview && <ReviewAddModal person={p} onClose={() => setAddingReview(false)} onSave={saveReview} />}
        {lockedNotice && <ReviewLockedModal person={p} onClose={() => setLockedNotice(false)} />}
      </main>
    </div>
  );
}

window.HireDetailScreen = HireDetailScreen;

// ── Replacement guarantee + progress-update log ──────────────────────────────
// A hire carries a free 3–6 month replacement guarantee (6 with a monthly
// subscription). Before Nearwork replaces a hire, the MSA requires documented
// proof + feedback — so the client logs progress updates here, and that log is
// the record a replacement request is built on.
const NW_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function nwMonthIndex(s) {
  if (!s) return null;
  const parts = String(s).split(' ');
  const mi = NW_MONTHS.indexOf(parts[0]);
  const yr = parseInt(parts[1], 10);
  if (mi < 0 || isNaN(yr)) return null;
  return yr * 12 + mi;
}
function nwGuarantee(since, months) {
  const start = nwMonthIndex(since);
  const now = 2026 * 12 + 5; // Jun 2026 — the portal's "today"
  if (start == null) return { months, elapsed: 0, remaining: months, active: true, expLabel: '—' };
  const elapsed = Math.max(0, now - start);
  const endIdx = start + months;
  const expLabel = NW_MONTHS[((endIdx % 12) + 12) % 12] + ' ' + Math.floor(endIdx / 12);
  return { months, elapsed, remaining: months - elapsed, active: months - elapsed > 0, expLabel };
}
const FB_STATUS = {
  'on-track': { label: 'On track', color: NW.teal700, bg: NW.teal50, dot: NW.teal500, icon: 'circle-check' },
  'concern':  { label: 'Some concerns', color: '#A16207', bg: NW.yellow50, dot: '#EAB308', icon: 'triangle-alert' },
  'at-risk':  { label: 'At risk', color: NW.rose600, bg: NW.rose50, dot: NW.rose500, icon: 'octagon-alert' },
};

function ReplacementPanel({ person, dense, guaranteeMonths = 6, accountManager }) {
  const first = person.name.split(' ')[0];
  const key = 'nw_hire_feedback_' + person.id;
  const clientName = (window.NW_CLIENT && window.NW_CLIENT.user && window.NW_CLIENT.user.name) || 'You';
  const g = nwGuarantee(person.since, guaranteeMonths);
  const seed = [{ id: 'seed', date: person.since, status: 'on-track', text: `${first} ramped up smoothly and is contributing well to the team.`, author: clientName }];
  const [entries, setEntries] = useState_p(() => { try { const s = JSON.parse(localStorage.getItem(key)); if (Array.isArray(s) && s.length) return s; } catch (e) {} return seed; });
  const [status, setStatus] = useState_p('on-track');
  const [text, setText] = useState_p('');
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(entries)); } catch (e) {} }, [entries]);

  // Once the guarantee window has lapsed, the panel is gone entirely.
  if (!g.active) return null;

  const add = () => {
    if (!text.trim()) return;
    setEntries([{ id: 'f' + Date.now(), date: 'Just now', status, text: text.trim(), author: clientName }, ...entries]);
    setText('');
  };
  const pct = Math.min(100, Math.round((g.elapsed / g.months) * 100));

  return (
    <Panel title="Replacement guarantee"
      action={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: g.active ? NW.teal50 : NW.gray50, color: g.active ? NW.teal700 : NW.gray500 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: g.active ? NW.teal500 : NW.gray400 }} />{g.active ? 'Active' : 'Ended'}</span>}>

      {/* Guarantee window */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'Poppins', fontSize: 32, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1 }}>{g.active ? g.remaining : 0}</span>
          <span style={{ fontSize: 13, color: NW.gray500 }}>{g.active ? `month${g.remaining === 1 ? '' : 's'} left` : 'months left'}</span>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11.5, color: NW.gray500, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600, color: NW.gray700 }}>{g.months}-month window · monthly subscription</div>
          <div>{g.active ? 'Expires' : 'Ended'} {g.expLabel}</div>
        </div>
      </div>
      <div style={{ height: 8, background: NW.gray100, borderRadius: 5, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ width: pct + '%', height: '100%', background: g.active ? NW.teal500 : NW.gray300 }} />
      </div>

      {/* Updates log */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name="clipboard-list" size={14} color={NW.gray500} />
        <h4 style={{ fontSize: 12.5, fontWeight: 700, color: NW.black, margin: 0 }}>Progress updates</h4>
      </div>
      <p style={{ fontSize: 12, color: NW.gray500, margin: '0 0 14px', lineHeight: 1.5 }}>Share updates with Nearwork. These form the documented record used for replacement requests under your MSA.</p>

      {/* Composer */}
      <div style={{ border: '1px solid ' + NW.gray200, borderRadius: 14, padding: 12, marginBottom: 16, background: NW.offWhite }}>
        <div style={{ display: 'flex', gap: 3, padding: 3, background: NW.gray50, border: '1px solid ' + NW.gray100, borderRadius: 9, marginBottom: 10 }}>
          {Object.keys(FB_STATUS).map(k => {
            const on = status === k; const m = FB_STATUS[k];
            return <button key={k} onClick={() => setStatus(k)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', padding: '6px 8px', borderRadius: 7, fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: on ? NW.white : 'transparent', color: on ? m.color : NW.gray500, boxShadow: on ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot }} />{m.label}</button>;
          })}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`How is ${first} doing? Add specifics — wins, concerns, examples…`}
          style={{ width: '100%', minHeight: 60, resize: 'vertical', boxSizing: 'border-box', border: '1px solid ' + NW.gray200, borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13, color: NW.black, lineHeight: 1.5, outline: 'none', background: NW.white }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button variant="primary" size="sm" icon="send" disabled={!text.trim()} onClick={add}>Share update</Button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.map((e, i) => {
          const m = FB_STATUS[e.status] || FB_STATUS['on-track'];
          return (
            <div key={e.id} style={{ display: 'flex', gap: 11 }}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={m.icon} size={14} color={m.color} strokeWidth={2} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: m.color, background: m.bg, padding: '2px 8px', borderRadius: 999 }}>{m.label}</span>
                  <span style={{ fontSize: 11, color: NW.gray400 }}>{e.author} · {e.date}</span>
                </div>
                <p style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.5, margin: 0 }}>{e.text}</p>
              </div>
            </div>
          );
        })}
      </div>

    </Panel>
  );
}

function EORPanel({ person, dense }) {
  const eor = window.getHireEOR ? window.getHireEOR(person) : null;
  if (!eor) return null;
  const tierColor = { Essentials: NW.gray500, 'Most picked': NW.teal600, 'Full coverage': NW.violet500 }[eor.tier] || NW.teal600;
  return (
    <Panel title="EOR plan & benefits">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '14px 16px', borderRadius: 14, background: NW.teal50, border: '1px solid #16A08522', marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: NW.black }}>{eor.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: tierColor, background: NW.white, border: `1px solid ${NW.gray100}`, padding: '3px 9px', borderRadius: 999 }}>{eor.tier}</span>
          </div>
          <div style={{ fontSize: 12, color: NW.gray600, marginTop: 4, lineHeight: 1.45 }}>{eor.tagline}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', lineHeight: 1 }}>{eor.price}</div>
          <div style={{ fontSize: 10, color: NW.gray500, marginTop: 3 }}>/ contractor / month</div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Included</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 18 }}>
        {eor.base.map(b => (
          <div key={b} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="check" size={14} color={NW.teal600} strokeWidth={2.5} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: NW.gray700, lineHeight: 1.35 }}>{b}</span>
          </div>
        ))}
      </div>
      {eor.benefits.length ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Selected benefits</span>
            <span style={{ fontSize: 11, color: NW.gray400 }}>{eor.scope}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {eor.benefits.map(b => (
              <div key={b.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: NW.white, border: `1px solid ${NW.gray100}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={b.icon} size={16} color={NW.teal600} strokeWidth={1.9} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NW.black, lineHeight: 1.25 }}>{b.label}<span style={{ fontSize: 10, fontWeight: 600, color: NW.gray400, marginLeft: 6 }}>Tier {b.tier}</span></div>
                  <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 2, lineHeight: 1.35 }}>{b.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderRadius: 11, background: NW.gray50, border: `1px solid ${NW.gray100}` }}>
          <Icon name="info" size={14} color={NW.gray400} />
          <span style={{ fontSize: 12.5, color: NW.gray500 }}>{eor.scope} on the Core plan.</span>
        </div>
      )}
    </Panel>
  );
}

Object.assign(window, { ReplacementPanel, nwGuarantee, EORPanel });
