// Kickoff review screen — client reads the brief Nearwork sent, then approves
// or requests changes with feedback. Clients never author roles themselves.

function KfMeta({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        <Icon name={icon} size={13} color={NW.gray400} /> {label}
      </span>
      <span style={{ fontSize: 14.5, fontWeight: 600, color: NW.black, letterSpacing: '-0.01em' }}>{value}</span>
    </div>
  );
}

function KickoffReviewScreen({ kickoffId, density = 'regular', onNav }) {
  const dense = density === 'compact';
  const pad = dense ? 32 : 44;
  const kf = (window.NW_KICKOFFS || []).find(k => k.id === kickoffId) || (window.NW_KICKOFFS || [])[0];
  const [decision, setDecision] = useState_p(null); // null | 'approved' | 'changes'
  const [showFeedback, setShowFeedback] = useState_p(false);
  const [feedback, setFeedback] = useState_p('');

  if (!kf) return null;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.offWhite, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="pipeline" density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'auto', padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>

            {/* Back */}
            <button onClick={() => onNav && onNav('pipeline')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18,
              background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit',
              fontSize: 12, fontWeight: 600, color: NW.gray500, letterSpacing: '0.04em', padding: 0,
            }}>
              <Icon name="arrow-left" size={14} color={NW.gray500} /> Open roles
            </button>

            {/* Decision banner */}
            {decision && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22,
                padding: '14px 18px', borderRadius: 14,
                background: decision === 'approved' ? NW.teal50 : NW.yellow50,
                border: `1px solid ${decision === 'approved' ? '#16A08533' : '#EAB30844'}`,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: decision === 'approved' ? NW.teal500 : NW.yellow500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={decision === 'approved' ? 'check' : 'message-square-text'} size={17} color={NW.white} strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: decision === 'approved' ? NW.teal700 : '#A16207' }}>
                    {decision === 'approved' ? 'Kickoff approved — sourcing begins' : 'Changes requested'}
                  </div>
                  <div style={{ fontSize: 12.5, color: NW.gray600, marginTop: 2 }}>
                    {decision === 'approved'
                      ? 'Nearwork has been notified and will start sourcing candidates for this role.'
                      : 'Your feedback was sent to Nearwork. They’ll revise the brief and resend.'}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onNav && onNav('pipeline')}>Back to roles</Button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : '1.55fr 1fr', gap: dense ? 22 : 30, alignItems: 'start' }}>

              {/* Left: the brief */}
              <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 22, padding: dense ? 26 : 36 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '5px 11px', borderRadius: 999, background: NW.yellow50, color: '#A16207', marginBottom: 16 }}>
                  <Icon name="file-text" size={12} color="#A16207" /> Kickoff brief
                </span>
                <h1 style={{ fontSize: dense ? 30 : 38, fontWeight: 700, color: NW.black, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0 }}>{kf.title}</h1>
                <div style={{ fontSize: 14, color: NW.gray500, marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{kf.team}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: NW.gray300 }} />
                  <span>{kf.location}</span>
                </div>

                <div style={{ height: 1, background: NW.gray100, margin: `${dense ? 22 : 28}px 0` }} />

                {/* Overview */}
                <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Role overview</h3>
                <p style={{ fontSize: 15, color: NW.gray800, lineHeight: 1.6, margin: 0 }}>{kf.summary}</p>

                {/* Responsibilities */}
                <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: `${dense ? 22 : 28}px 0 12px` }}>Key responsibilities</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {kf.responsibilities.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                      <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: NW.teal500, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: NW.gray800, lineHeight: 1.5 }}>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', gap: dense ? 22 : 34, marginTop: dense ? 22 : 28, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Must-have skills</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {kf.mustHave.map(s => (
                        <span key={s} style={{ fontSize: 12.5, fontWeight: 500, color: NW.teal700, background: NW.teal50, border: '1px solid #16A08522', padding: '5px 12px', borderRadius: 8 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Nice to have</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {kf.niceToHave.map(s => (
                        <span key={s} style={{ fontSize: 12.5, fontWeight: 500, color: NW.gray600, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '5px 12px', borderRadius: 8 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: meta + decision */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: dense ? 18 : 22, position: dense ? 'static' : 'sticky', top: 0 }}>
                {/* Sent by */}
                <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 18, padding: dense ? 20 : 24 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Sent by</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Avatar initials={kf.sentBy.initials} bg={kf.sentBy.avatarBg} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: NW.black }}>{kf.sentBy.name}</div>
                      <div style={{ fontSize: 12, color: NW.gray500 }}>{kf.sentBy.role}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: NW.gray400, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${NW.gray100}` }}>Sent {kf.sentDate}</div>
                </div>

                {/* Details */}
                <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 18, padding: dense ? 20 : 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: dense ? 18 : 22 }}>
                  <KfMeta icon="signal" label="Seniority" value={kf.seniority} />
                  <KfMeta icon="briefcase" label="Engagement" value={kf.engagement} />
                  <KfMeta icon="wallet" label="Comp range" value={kf.comp} />
                  <KfMeta icon="users" label="Headcount" value={kf.headcount} />
                  <KfMeta icon="clock" label="Timezone" value={kf.timezone} />
                  <KfMeta icon="calendar" label="Start target" value={kf.startTarget} />
                </div>

                {/* Decision panel */}
                {!decision && (
                  <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 18, padding: dense ? 20 : 24 }}>
                    {!showFeedback ? (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 700, color: NW.black, marginBottom: 4 }}>Ready to move forward?</div>
                        <p style={{ fontSize: 12.5, color: NW.gray500, lineHeight: 1.5, margin: '0 0 16px' }}>Approve to kick off sourcing, or request changes and we’ll revise the brief.</p>
                        <Button variant="primary" size="md" icon="check" fullWidth onClick={() => setDecision('approved')}>Approve &amp; start sourcing</Button>
                        <div style={{ height: 10 }} />
                        <Button variant="secondary" size="md" icon="message-square-text" fullWidth onClick={() => setShowFeedback(true)}>Request changes</Button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 700, color: NW.black, marginBottom: 4 }}>What should we change?</div>
                        <p style={{ fontSize: 12.5, color: NW.gray500, lineHeight: 1.5, margin: '0 0 12px' }}>Your notes go straight to {kf.sentBy.name.split(' ')[0]}.</p>
                        <textarea
                          value={feedback} onChange={e => setFeedback(e.target.value)}
                          placeholder="e.g. Comp range is a little high for this level, and we’d prefer GMT-5 only…"
                          style={{
                            width: '100%', minHeight: 110, resize: 'vertical', boxSizing: 'border-box',
                            border: `1px solid ${NW.gray200}`, borderRadius: 12, padding: '12px 14px',
                            fontFamily: 'inherit', fontSize: 13.5, color: NW.black, lineHeight: 1.5,
                            outline: 'none', background: NW.offWhite,
                          }} />
                        <div style={{ height: 12 }} />
                        <Button variant="primary" size="md" icon="send" fullWidth disabled={!feedback.trim()} onClick={() => setDecision('changes')}>Send feedback</Button>
                        <div style={{ height: 8 }} />
                        <Button variant="ghost" size="sm" fullWidth onClick={() => setShowFeedback(false)}>Cancel</Button>
                      </>
                    )}
                  </div>
                )}

                {decision === 'changes' && feedback.trim() && (
                  <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 18, padding: dense ? 20 : 24 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Your feedback</div>
                    <p style={{ fontSize: 13.5, color: NW.gray700, lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>“{feedback}”</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.KickoffReviewScreen = KickoffReviewScreen;
