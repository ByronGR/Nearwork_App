// Candidate comparison — side-by-side of up to 3 candidates.
// Pulls Nearwork score, experience, English, DISC, salary, availability, skills.

function CompareCell({ children, best, head }) {
  return (
    <div style={{
      padding: head ? '0' : '16px 18px',
      background: best ? NW.teal50 : 'transparent',
      borderRadius: best ? 12 : 0,
      minWidth: 0,
    }}>{children}</div>
  );
}

function CompareModal({ candidates, onClose, onOpenCandidate }) {
  const cols = candidates.map(c => ({ c, x: window.getCandidateCompare(c), a: window.getCandidateAssessment ? window.getCandidateAssessment(c) : null }));
  const maxNW = Math.max(...cols.map(o => o.x.nearwork));
  const maxExp = Math.max(...cols.map(o => o.x.experience));
  const maxEng = Math.max(...cols.map(o => o.x.english.score));
  const maxAssess = Math.max(...cols.map(o => (o.a && o.a.completed) ? o.a.assessment.overall : -1));
  const availRank = { 'Immediate': 0, '2 weeks': 1, '3 weeks': 2, '1 month': 3 };
  const bestAvail = Math.min(...cols.map(o => availRank[o.x.availability] ?? 9));

  const stages = { 1: NW.gray400, 2: NW.violet500, 3: '#1ABC9C', 4: NW.teal600, 5: NW.rose500 };
  const gridCols = `170px repeat(${cols.length}, 1fr)`;

  const Row = ({ label, render, pad = true }) => (
    <div style={{ display: 'grid', gridTemplateColumns: gridCols, alignItems: 'stretch', borderTop: `1px solid ${NW.gray100}` }}>
      <div style={{ padding: '16px 18px', fontSize: 11.5, fontWeight: 600, color: NW.gray500, letterSpacing: '0.04em', display: 'flex', alignItems: 'center' }}>{label}</div>
      {cols.map((o, i) => <div key={i}>{render(o, i)}</div>)}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(15,15,15,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'nwFade 160ms ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(940px, 100%)', maxHeight: '90vh', overflow: 'auto', background: NW.white, borderRadius: 22, boxShadow: '0 24px 70px rgba(0,0,0,0.28)', animation: 'nwPop 220ms cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 2, background: NW.white, borderBottom: `1px solid ${NW.gray100}`, padding: '20px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 700, color: NW.black, letterSpacing: '-0.025em', margin: 0 }}>Compare candidates</h2>
            <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 3 }}>{cols.length} side by side · best value highlighted</div>
          </div>
          <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="x" size={16} color={NW.gray600} />
          </button>
        </div>

        {/* Candidate header row */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '8px 8px 0' }}>
          <div />
          {cols.map((o, i) => (
            <div key={i} style={{ padding: '16px 14px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><CandidateAvatar c={o.c} size={52} /></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: NW.black, letterSpacing: '-0.01em' }}>{o.c.name}</div>
              <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 2 }}>{o.c.role}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: NW.gray700, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '3px 9px', borderRadius: 999 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: stages[o.c.stageIdx] }} /> {o.c.stage}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '4px 8px 8px' }}>
          {/* Nearwork score */}
          <Row label="Nearwork score" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', borderRadius: 12, background: o.x.nearwork === maxNW ? NW.teal50 : 'transparent', textAlign: 'center' }}>
              <span style={{ fontFamily: 'Poppins', fontSize: 26, fontWeight: 700, color: o.x.nearwork === maxNW ? NW.teal700 : NW.black, letterSpacing: '-0.03em' }}>{o.x.nearwork}</span>
              <span style={{ fontSize: 12, color: NW.gray400 }}>/100</span>
              {o.x.nearwork === maxNW && <div style={{ fontSize: 10.5, fontWeight: 700, color: NW.teal600, marginTop: 2 }}>BEST</div>}
            </div>
          )} />
          {/* Experience */}
          <Row label="Experience" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', borderRadius: 12, background: o.x.experience === maxExp ? NW.teal50 : 'transparent', textAlign: 'center' }}>
              <span style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em' }}>{o.x.experience}</span>
              <span style={{ fontSize: 12.5, color: NW.gray500 }}> yrs</span>
            </div>
          )} />
          {/* English */}
          <Row label="English" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', borderRadius: 12, background: o.x.english.score === maxEng ? NW.teal50 : 'transparent', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: NW.black }}>{o.x.english.level}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
                <div style={{ flex: 1, height: 5, background: NW.gray100, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${o.x.english.score}%`, height: '100%', background: NW.teal500 }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: NW.gray600 }}>{o.x.english.score}</span>
              </div>
            </div>
          )} />
          {/* Assessment */}
          <Row label="Assessment" render={(o) => {
            if (!o.a || !o.a.completed) return <div style={{ margin: 8, padding: '14px 16px', textAlign: 'center', fontSize: 12, color: NW.gray400 }}>Pending</div>;
            const pass = o.a.assessment.status === 'passed';
            const best = o.a.assessment.overall === maxAssess;
            return (
              <div style={{ margin: 8, padding: '14px 16px', borderRadius: 12, background: best ? NW.teal50 : 'transparent', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                  <span style={{ fontFamily: 'Poppins', fontSize: 22, fontWeight: 700, color: pass ? NW.teal700 : NW.rose600, letterSpacing: '-0.03em' }}>{o.a.assessment.overall}</span>
                  <span style={{ fontSize: 12, color: NW.gray400 }}>%</span>
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: pass ? NW.teal600 : NW.rose500, marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{pass ? 'Passed' : 'Did not pass'}</div>
              </div>
            );
          }} />
          {/* DISC */}
          <Row label="DISC assessment" render={(o) => {
            const col = (window.NW_DISC_COLORS || {})[o.x.disc.type] || NW.gray500;
            return (
              <div style={{ margin: 8, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: `${col}1a`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{o.x.disc.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{o.x.disc.label}</span>
                </div>
              </div>
            );
          }} />
          {/* Salary expectation */}
          <Row label="Salary expectation" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: NW.black }}>{o.x.salaryExp}</span>
              <span style={{ fontSize: 12, color: NW.gray400 }}> /mo</span>
            </div>
          )} />
          {/* Availability */}
          <Row label="Availability" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', borderRadius: 12, background: (availRank[o.x.availability] ?? 9) === bestAvail ? NW.teal50 : 'transparent', textAlign: 'center' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>{o.x.availability}</span>
            </div>
          )} />
          {/* Skills */}
          <Row label="Top skills" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {o.x.skills.slice(0, 4).map(s => <span key={s} style={{ fontSize: 11, fontWeight: 500, color: NW.gray700, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '3px 9px', borderRadius: 7 }}>{s}</span>)}
            </div>
          )} />
          {/* Note */}
          <Row label="Recruiter note" render={(o) => (
            <div style={{ margin: 8, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, color: NW.gray600, lineHeight: 1.5, margin: 0 }}>{o.c.note}</p>
            </div>
          )} />
        </div>
      </div>
    </div>
  );
}

window.CompareModal = CompareModal;
