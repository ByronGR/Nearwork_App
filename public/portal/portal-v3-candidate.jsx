// Candidate detail — the full profile a client opens from the pipeline.
// Surfaces the three assessments every candidate sits: English (CEFR),
// the role Assessment (70% pass line), and DISC — plus a competency radar
// benchmarked against the role cohort, skills-fit, highlights and notes.

// ── Small building blocks ────────────────────────────────────────────────────
function CardPanel({ title, icon, right, children, pad = 24, id, style }) {
  return (
    <section id={id} style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: pad, ...style }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {icon && <Icon name={icon} size={15} color={NW.gray500} />}
            <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{title}</h3>
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function ResultPill({ status, size = 'md' }) {
  const pass = status === 'passed';
  const s = size === 'lg' ? { fz: 12.5, py: 5, px: 12 } : { fz: 11, py: 4, px: 10 };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: s.fz, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: `${s.py}px ${s.px}px`, borderRadius: 999, background: pass ? NW.teal50 : NW.rose50, color: pass ? NW.teal700 : NW.rose600 }}>
      <Icon name={pass ? 'circle-check' : 'circle-x'} size={s.fz + 2} color={pass ? NW.teal600 : NW.rose500} strokeWidth={2.2} /> {pass ? 'Passed' : 'Did not pass'}
    </span>
  );
}

// The three score tiles
function ScoreTiles({ a }) {
  const eng = a.english, as = a.assessment, disc = a.disc;
  const pass = as.status === 'passed';
  const discColor = (window.NW_DISC_COLORS || {})[disc.type] || NW.gray500;
  const tile = { flex: 1, minWidth: 220, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 18, padding: 22, display: 'flex', flexDirection: 'column' };
  const overline = { fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14 };
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
      <div style={tile}>
        <span style={overline}><Icon name="languages" size={13} color={NW.gray400} /> English · CEFR</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 38, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1 }}>{eng.level}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: NW.gray500 }}>{eng.score}%</span>
        </div>
        <div style={{ height: 6, background: NW.gray100, borderRadius: 4, overflow: 'hidden', marginTop: 14 }}>
          <div style={{ width: `${eng.score}%`, height: '100%', background: NW.teal500 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 9.5, color: NW.gray400, fontWeight: 600, letterSpacing: '0.06em' }}>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <span key={l} style={{ color: l === eng.level ? NW.teal600 : NW.gray400 }}>{l}</span>)}
        </div>
      </div>
      <div style={{ ...tile, background: pass ? NW.white : '#FFFBFC', borderColor: pass ? NW.gray100 : '#F3D9E2' }}>
        <span style={overline}><Icon name="clipboard-check" size={13} color={NW.gray400} /> Assessment</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 38, fontWeight: 700, color: pass ? NW.teal700 : NW.rose600, letterSpacing: '-0.04em', lineHeight: 1 }}>{as.overall}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: pass ? NW.teal600 : NW.rose500 }}>%</span>
          </div>
          <ResultPill status={as.status} />
        </div>
        <div style={{ position: 'relative', height: 6, background: NW.gray100, borderRadius: 4, marginTop: 16 }}>
          <div style={{ position: 'absolute', inset: 0, width: `${as.overall}%`, height: '100%', background: pass ? NW.teal500 : NW.rose500, borderRadius: 4 }} />
          <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${as.passing}%`, width: 2, background: NW.gray500, borderRadius: 2 }} />
        </div>
        <div style={{ marginTop: 7, fontSize: 10.5, color: NW.gray400, display: 'flex', justifyContent: 'space-between' }}>
          <span>0</span><span style={{ color: NW.gray500, fontWeight: 600 }}>Pass · {as.passing}%</span><span>100</span>
        </div>
      </div>
      <div style={tile}>
        <span style={overline}><Icon name="orbit" size={13} color={NW.gray400} /> DISC profile</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 46, height: 46, borderRadius: 12, background: `${discColor}18`, color: discColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>{disc.type}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em' }}>{disc.label}</div>
            <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 2 }}>{disc.classification}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 16 }}>
          {['D', 'I', 'S', 'C'].map(k => {
            const on = k === disc.type;
            const col = (window.NW_DISC_COLORS || {})[k];
            return <span key={k} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, color: on ? NW.white : NW.gray400, background: on ? col : NW.gray50, border: `1px solid ${on ? col : NW.gray100}`, padding: '5px 0', borderRadius: 7 }}>{k}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

// ── Competency radar (candidate vs cohort average) ───────────────────────────
function RadarChart({ axes, candidate, average, size = 260 }) {
  const n = axes.length;
  const cx = size / 2, cy = size / 2, r = size * 0.35;
  const pt = (val, i, rad = r) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const rr = rad * (val / 100);
    return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
  };
  const poly = (vals) => vals.map((v, i) => pt(v, i).join(',')).join(' ');
  const rings = [25, 50, 75, 100];
  const SHORT = { 'Incident response': 'Incidents', 'Reliability & CI/CD': 'Reliability', 'Velocity & on-call': 'Velocity', 'Stakeholder comms': 'Stakeholders', 'Research & discovery': 'Research', 'Conflict resolution': 'Conflict', 'Design systems': 'Design sys.' };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', display: 'block' }} data-om-raster>
      {/* rings */}
      {rings.map(rg => (
        <polygon key={rg} points={axes.map((_, i) => pt(rg, i).join(',')).join(' ')} fill="none" stroke={NW.gray100} strokeWidth="1" />
      ))}
      {/* spokes */}
      {axes.map((_, i) => {
        const [x, y] = pt(100, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={NW.gray100} strokeWidth="1" />;
      })}
      {/* average */}
      <polygon points={poly(average)} fill={NW.gray300} fillOpacity="0.18" stroke={NW.gray400} strokeWidth="1.5" strokeDasharray="4 3" />
      {/* candidate */}
      <polygon points={poly(candidate)} fill={NW.teal500} fillOpacity="0.16" stroke={NW.teal500} strokeWidth="2" strokeLinejoin="round" />
      {candidate.map((v, i) => { const [x, y] = pt(v, i); return <circle key={i} cx={x} cy={y} r="3" fill={NW.teal600} />; })}
      {/* labels */}
      {axes.map((lbl, i) => {
        const [x, y] = pt(116, i);
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const cos = Math.cos(ang);
        const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
        return <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" style={{ fontSize: 10, fontWeight: 600, fill: NW.gray600, fontFamily: 'Poppins, sans-serif' }}>{SHORT[lbl] || lbl}</text>;
      })}
    </svg>
  );
}

function CompetencyPanel({ radar }) {
  const delta = radar.candidate.map((v, i) => v - radar.average[i]);
  return (
    <CardPanel title="Competency profile" icon="radar">
      <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '0 0 auto', width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>
          <RadarChart axes={radar.axes} candidate={radar.candidate} average={radar.average} size={252} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: NW.gray600 }}><span style={{ width: 16, height: 3, borderRadius: 2, background: NW.teal500, display: 'inline-block' }} /> This candidate</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: NW.gray600 }}><span style={{ width: 16, height: 0, borderTop: `2px dashed ${NW.gray400}`, display: 'inline-block' }} /> Role average</span>
          </div>
        </div>
        <div style={{ flex: '1 1 340px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {radar.axes.map((lbl, i) => {
            const d = delta[i];
            const up = d >= 0;
            return (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 128, flexShrink: 0, fontSize: 12.5, color: NW.gray700, fontWeight: 500 }}>{lbl}</span>
                <div style={{ flex: 1, position: 'relative', height: 8, background: NW.gray100, borderRadius: 5 }}>
                  <div style={{ position: 'absolute', inset: 0, width: `${radar.candidate[i]}%`, height: '100%', background: NW.teal500, borderRadius: 5 }} />
                  <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${radar.average[i]}%`, width: 2, background: NW.gray500, borderRadius: 2 }} title={`Avg ${radar.average[i]}`} />
                </div>
                <span style={{ width: 34, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: NW.black }}>{radar.candidate[i]}</span>
                <span style={{ width: 44, textAlign: 'right', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, fontSize: 11, fontWeight: 600, color: d === 0 ? NW.gray400 : up ? NW.teal600 : '#A16207' }}>
                  {d !== 0 && <Icon name={up ? 'arrow-up' : 'arrow-down'} size={11} color={up ? NW.teal600 : '#A16207'} />}{d > 0 ? '+' : ''}{d}
                </span>
              </div>
            );
          })}
          <div style={{ fontSize: 11, color: NW.gray400, marginTop: 2 }}>Benchmarked against {radar.cohortSize} candidate{radar.cohortSize === 1 ? '' : 's'} assessed for similar roles.</div>
        </div>
      </div>
    </CardPanel>
  );
}

// ── Integrity + question breakdown ───────────────────────────────────────────
function IntegrityStat({ label, value, warn }) {
  return (
    <div style={{ flex: 1, minWidth: 92, padding: '12px 14px', background: NW.offWhite, border: `1px solid ${NW.gray100}`, borderRadius: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: warn ? '#A16207' : NW.black, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: NW.gray500, marginTop: 2, letterSpacing: '0.02em' }}>{label}</div>
    </div>
  );
}

function QuestionRow({ q, repeat }) {
  const [open, setOpen] = useState_p(false);
  const pct = (q.score / q.max);
  const col = pct >= 0.8 ? NW.teal600 : pct >= 0.6 ? NW.teal500 : pct >= 0.5 ? NW.yellow500 : NW.rose500;
  return (
    <div style={{ border: `1px solid ${NW.gray100}`, borderRadius: 14, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '15px 16px', cursor: 'pointer' }}>
        <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, background: NW.gray50, border: `1px solid ${NW.gray100}`, color: NW.gray600, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>Q{q.n}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {q.competency && <div style={{ fontSize: 10, fontWeight: 700, color: NW.teal600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{q.competency}</div>}
          <p style={{ fontSize: 13.5, color: NW.gray800, lineHeight: 1.5, margin: 0, fontWeight: 500 }}>{q.prompt}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: col }}>{q.score.toFixed(1)}<span style={{ color: NW.gray400, fontWeight: 400 }}>/{q.max}</span></span>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={NW.gray400} />
        </div>
      </div>
      <div style={{ height: 3, background: NW.gray100, margin: '0 16px' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: col }} />
      </div>
      {open && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'nwFade 160ms ease' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Candidate answer</div>
            <p style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.6, margin: 0, padding: '12px 14px', background: NW.offWhite, borderRadius: 10, borderLeft: `3px solid ${NW.gray200}` }}>{q.answer}</p>
          </div>
          {q.followUp && (
            <div style={{ paddingLeft: 14, borderLeft: `2px solid ${NW.gray100}` }}>
              <div style={{ fontSize: 12, color: NW.gray600, fontStyle: 'italic', marginBottom: 6 }}><span style={{ fontWeight: 600, fontStyle: 'normal', color: NW.gray500 }}>Follow-up · </span>{q.followUp.q}</div>
              <p style={{ fontSize: 12.5, color: NW.gray700, lineHeight: 1.55, margin: 0 }}>{q.followUp.a}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: repeat ? NW.rose50 : NW.teal50, border: `1px solid ${repeat ? '#E74C7C22' : '#16A08522'}`, borderRadius: 10 }}>
            <Icon name={repeat ? 'triangle-alert' : 'message-square-quote'} size={15} color={repeat ? NW.rose600 : NW.teal600} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: repeat ? NW.rose600 : NW.teal700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Assessor feedback</div>
              <p style={{ fontSize: 12.5, color: NW.gray700, lineHeight: 1.55, margin: 0 }}>{q.feedback}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscProfileCard({ title, note, values, primary }) {
  return (
    <div style={{ flex: 1, minWidth: 200, padding: 18, background: NW.offWhite, border: `1px solid ${NW.gray100}`, borderRadius: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: NW.black }}>{title}</div>
      <div style={{ fontSize: 11, color: NW.gray500, marginTop: 2, marginBottom: 16 }}>{note}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {['D', 'I', 'S', 'C'].map(k => {
          const dim = window.NW_DISC_DIM[k];
          const v = values[k];
          const on = k === primary;
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 16, fontSize: 11.5, fontWeight: 700, color: dim.color }}>{k}</span>
              <div style={{ flex: 1, height: 8, background: NW.gray100, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${v}%`, height: '100%', background: dim.color, opacity: on ? 1 : 0.5, borderRadius: 5 }} />
              </div>
              <span style={{ width: 30, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: NW.gray600 }}>p{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Right-column panels ──────────────────────────────────────────────────────
function SnapshotPanel({ c, x }) {
  const rows = [
    { icon: 'briefcase', l: 'Experience', v: x.experience != null ? `${x.experience} yrs` : '—' },
    { icon: 'wallet', l: 'Salary expectation', v: x.salaryExp ? `${x.salaryExp} / mo` : '—' },
    { icon: 'calendar-clock', l: 'Availability', v: x.availability || '—' },
    { icon: 'clock', l: 'Timezone', v: x.timezone || '—' },
    { icon: 'inbox', l: 'Applied', v: c.submittedDays === 0 ? 'Today' : `${c.submittedDays}d ago` },
  ];
  return (
    <CardPanel title="Snapshot" icon="id-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map((r, i) => (
          <div key={r.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${NW.gray100}` }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: NW.gray500 }}><Icon name={r.icon} size={13} color={NW.gray400} /> {r.l}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{r.v}</span>
          </div>
        ))}
      </div>
    </CardPanel>
  );
}

function SkillsMatchPanel({ c }) {
  const opening = (window.NW_OPENINGS || []).find(o => o.id === c.openingId);
  const brief = opening && opening.brief;
  if (!brief) return null;
  const has = (skill) => (c.match || []).some(m => m.toLowerCase() === skill.toLowerCase());
  const matched = brief.mustHave.filter(has).length;
  const niceMatched = (brief.niceToHave || []).filter(has);
  return (
    <CardPanel title="Fit for role" icon="target"
      right={<span style={{ fontSize: 11, fontWeight: 600, color: matched === brief.mustHave.length ? NW.teal700 : NW.gray600, background: matched === brief.mustHave.length ? NW.teal50 : NW.gray50, padding: '3px 10px', borderRadius: 999 }}>{matched}/{brief.mustHave.length} must-haves</span>}>
      <div style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Must-have skills</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {brief.mustHave.map(s => {
          const ok = has(s);
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: ok ? NW.teal50 : NW.gray50, border: `1px solid ${ok ? '#16A08533' : NW.gray100}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={ok ? 'check' : 'minus'} size={12} color={ok ? NW.teal600 : NW.gray400} strokeWidth={2.5} />
              </span>
              <span style={{ fontSize: 13, color: ok ? NW.gray800 : NW.gray400, fontWeight: ok ? 500 : 400 }}>{s}</span>
              {!ok && <span style={{ marginLeft: 'auto', fontSize: 10.5, color: NW.gray400 }}>not shown</span>}
            </div>
          );
        })}
      </div>
      {niceMatched.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '16px 0 10px' }}>Bonus · nice to have</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {niceMatched.map(s => <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500, color: NW.teal700, background: NW.teal50, border: '1px solid #16A08522', padding: '4px 10px', borderRadius: 999 }}><Icon name="plus" size={11} color={NW.teal600} />{s}</span>)}
          </div>
        </>
      )}
    </CardPanel>
  );
}

function HighlightsPanel({ h }) {
  return (
    <CardPanel title="Strengths & watch-outs" icon="scale">
      <div style={{ fontSize: 10, fontWeight: 700, color: NW.teal700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Strengths</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {h.strengths.length ? h.strengths.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <Icon name="check" size={15} color={NW.teal600} strokeWidth={2.5} style={{ marginTop: 1, flexShrink: 0 }} />
            <div><div style={{ fontSize: 13, fontWeight: 600, color: NW.gray800 }}>{s.label}</div><div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{s.detail}</div></div>
          </div>
        )) : <div style={{ fontSize: 12.5, color: NW.gray400 }}>No standout strengths flagged.</div>}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#A16207', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '18px 0 10px' }}>Watch-outs</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {h.watchOuts.length ? h.watchOuts.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <Icon name="triangle-alert" size={15} color="#A16207" strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
            <div><div style={{ fontSize: 13, fontWeight: 600, color: NW.gray800 }}>{s.label}</div><div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 1 }}>{s.detail}</div></div>
          </div>
        )) : <div style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 12.5, color: NW.gray500 }}><Icon name="check-circle" size={15} color={NW.teal600} /> No significant gaps flagged.</div>}
      </div>
    </CardPanel>
  );
}

function EnglishPanel({ eng }) {
  return (
    <CardPanel title="English · CEFR" icon="languages">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <span style={{ width: 52, height: 52, borderRadius: 14, background: NW.teal50, color: NW.teal700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', flexShrink: 0 }}>{eng.level}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.gray700 }}>Overall level</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: NW.black }}>{eng.score}%</span>
          </div>
          <div style={{ height: 7, background: NW.gray100, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${eng.score}%`, height: '100%', background: NW.teal500 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9.5, color: NW.gray400, fontWeight: 600 }}>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <span key={l} style={{ color: l === eng.level ? NW.teal600 : NW.gray400 }}>{l}</span>)}
          </div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.6, margin: 0 }}>{eng.summary}</p>
    </CardPanel>
  );
}

function DiscSummaryPanel({ disc, discColor }) {
  return (
    <CardPanel title="DISC behavioral profile" icon="orbit">
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13 }}>
        <span style={{ width: 48, height: 48, borderRadius: 12, background: `${discColor}18`, color: discColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>{disc.type}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em' }}>{disc.classification}</div>
          <div style={{ fontSize: 12, color: NW.gray500, marginTop: 2 }}>{disc.label} ({disc.type})</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.6, margin: '0 0 6px', fontWeight: 500 }}>{disc.headline}</p>
      <p style={{ fontSize: 12.5, color: NW.gray600, lineHeight: 1.6, margin: 0 }}>{disc.narrative}</p>
    </CardPanel>
  );
}

// Client notes on a candidate (functional, persisted per candidate)
function NotesPanel({ c }) {
  const key = 'nw_cand_notes_' + c.id;
  const seed = c.note ? [{ author: 'Lina Pardo · Nearwork', date: 'Recruiter note', text: c.note, recruiter: true }] : [];
  const [notes, setNotes] = useState_p(() => { try { const s = JSON.parse(localStorage.getItem(key)); if (Array.isArray(s)) return s.concat(seed); } catch (e) {} return seed; });
  const [draft, setDraft] = useState_p('');
  const user = (window.NW_CLIENT && window.NW_CLIENT.user) || { name: 'You', initials: 'YO' };
  const add = () => {
    if (!draft.trim()) return;
    const mine = notes.filter(n => !n.recruiter);
    const next = [{ author: user.name, date: 'Just now', text: draft.trim() }, ...mine];
    setNotes(next.concat(seed));
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) {}
    setDraft('');
  };
  return (
    <CardPanel title="Notes" icon="message-square-text" id="nw-cand-notes">
      <div style={{ display: 'flex', gap: 10, marginBottom: notes.length ? 16 : 0 }}>
        <Avatar initials={user.initials} size={32} bg={NW.teal500} />
        <div style={{ flex: 1 }}>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder={`Add a note about ${c.name.split(' ')[0]}…`}
            style={{ width: '100%', minHeight: 58, resize: 'vertical', boxSizing: 'border-box', border: `1px solid ${NW.gray200}`, borderRadius: 11, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13, color: NW.black, lineHeight: 1.5, outline: 'none', background: NW.offWhite }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 9 }}>
            <Button variant="primary" size="sm" icon="send" disabled={!draft.trim()} onClick={add}>Post note</Button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {notes.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 10 }}>
            <Avatar initials={n.recruiter ? 'LP' : n.author.split(' ').map(w => w[0]).join('').slice(0, 2)} size={32} bg={n.recruiter ? NW.black : NW.violet500} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.black }}>{n.author}</span>
                <span style={{ fontSize: 10.5, color: NW.gray400 }}>{n.date}</span>
                {n.recruiter && <span style={{ fontSize: 9.5, fontWeight: 700, color: NW.teal700, background: NW.teal50, padding: '2px 7px', borderRadius: 999, letterSpacing: '0.04em', textTransform: 'uppercase' }}>From Nearwork</span>}
              </div>
              <p style={{ fontSize: 13, color: NW.gray700, lineHeight: 1.55, margin: 0 }}>{n.text}</p>
            </div>
          </div>
        ))}
      </div>
    </CardPanel>
  );
}

// ── Pending state ────────────────────────────────────────────────────────────
function AssessmentPending({ c }) {
  return (
    <CardPanel title="Assessments" icon="clipboard-list">
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: 52, height: 52, borderRadius: 15, background: NW.gray50, border: `1px solid ${NW.gray100}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="hourglass" size={22} color={NW.gray400} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: NW.gray700 }}>Assessment not completed yet</div>
        <p style={{ fontSize: 13, color: NW.gray500, marginTop: 6, maxWidth: 380, marginInline: 'auto', lineHeight: 1.55 }}>
          {c.name.split(' ')[0]} has been invited to the English, role, and DISC assessments. Results appear here automatically the moment they’re submitted.
        </p>
        <div style={{ display: 'inline-flex', gap: 8, marginTop: 18 }}>
          {['English · CEFR', 'Assessment', 'DISC'].map(t => (
            <span key={t} style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '5px 11px', borderRadius: 999 }}>{t}</span>
          ))}
        </div>
      </div>
    </CardPanel>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
const NW_STAGE_ORDER = ['Applied', 'Screening', 'Technical', 'Final round', 'Offer'];

function CandidateDetailScreen({ candidateId, density = 'regular', onNav }) {
  const dense = density === 'compact';
  const pad = dense ? 28 : 40;
  const cands = window.NW_CANDIDATES || [];
  const c = cands.find(x => x.id === candidateId) || cands[0];
  const [advanced, setAdvanced] = useState_p(false);
  if (!c) return null;
  const a = window.getCandidateAssessment(c);
  const x = window.getCandidateCompare ? window.getCandidateCompare(c) : {};
  const radar = a.completed && window.getCandidateRadar ? window.getCandidateRadar(c) : null;
  const highlights = a.completed && window.getCandidateHighlights ? window.getCandidateHighlights(c) : null;

  const stageColors = { 1: NW.gray400, 2: NW.violet500, 3: NW.teal500, 4: NW.teal600, 5: NW.rose500, 6: '#94A3B8' };
  const stageCol = stageColors[c.stageIdx] || NW.gray400;
  const discColor = a.completed ? ((window.NW_DISC_COLORS || {})[a.disc.type] || NW.gray500) : NW.gray500;
  const nextStage = NW_STAGE_ORDER[c.stageIdx]; // stageIdx is 1-based; this is the next label
  const canAdvance = c.stageIdx >= 1 && c.stageIdx < 5;
  const goBack = () => onNav && onNav('kanban', c.openingId);
  const scrollNotes = () => document.getElementById('nw-cand-notes')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.offWhite, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="pipeline" density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'auto', padding: `${dense ? 28 : 36}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>

            <button onClick={goBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 600, color: NW.gray500, letterSpacing: '0.04em', padding: 0 }}>
              <Icon name="arrow-left" size={14} color={NW.gray500} /> Pipeline
            </button>

            {/* Header */}
            <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 22, padding: dense ? 24 : 30, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
                  <CandidateAvatar c={c} size={dense ? 60 : 70} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <h1 style={{ fontSize: dense ? 26 : 31, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', margin: 0 }}>{c.name}</h1>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: NW.gray700, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '5px 11px', borderRadius: 999 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 2, background: stageCol }} /> {c.stage}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, color: NW.gray700, fontWeight: 500 }}>{c.role}</span>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: NW.gray300 }} />
                      <span style={{ fontSize: 13, color: NW.gray500, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="map-pin" size={13} color={NW.gray400} /> {c.location}</span>
                      {x.experience != null && <><span style={{ width: 3, height: 3, borderRadius: '50%', background: NW.gray300 }} /><span style={{ fontSize: 13, color: NW.gray500 }}>{x.experience} yrs exp</span></>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                      {(c.match || []).map(s => <span key={s} style={{ fontSize: 11, fontWeight: 500, color: NW.gray700, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '3px 9px', borderRadius: 7 }}>{s}</span>)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nearwork match</div>
                    <div style={{ fontSize: 12, color: NW.gray500, marginTop: 2 }}>Overall fit score</div>
                  </div>
                  <MatchScore value={c.score} size={58} strokeWidth={4.5} />
                </div>
              </div>
              {/* Action bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, paddingTop: 18, borderTop: `1px solid ${NW.gray100}`, flexWrap: 'wrap' }}>
                {canAdvance && !advanced && <Button variant="primary" size="sm" icon="arrow-right" onClick={() => setAdvanced(true)}>Advance to {nextStage}</Button>}
                {advanced && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: NW.teal700, background: NW.teal50, padding: '8px 14px', borderRadius: 999 }}><Icon name="check" size={14} color={NW.teal600} strokeWidth={2.5} /> Moved to {nextStage} — Nearwork notified</span>}
                <Button variant="secondary" size="sm" icon="message-square-text" onClick={scrollNotes}>Add note</Button>
                <Button variant="secondary" size="sm" icon="calendar-plus" onClick={scrollNotes}>Request interview</Button>
                <span style={{ flex: 1 }} />
                <Button variant="ghost" size="sm" icon="columns-3" onClick={() => onNav && onNav('kanban', c.openingId)}>Compare</Button>
              </div>
            </div>

            {!a.completed ? (
              <AssessmentPending c={c} />
            ) : (
              <>
                {/* Submitted meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: NW.gray500, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="calendar-check" size={13} color={NW.gray400} /> Submitted {a.submitted}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: NW.gray300 }} />
                  <span style={{ fontSize: 12, color: NW.gray500, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="user-check" size={13} color={NW.gray400} /> Reviewed by {a.gradedBy}</span>
                </div>

                {/* Score tiles */}
                <ScoreTiles a={a} />

                {/* Competency radar */}
                {radar && <div style={{ marginBottom: 20 }}><CompetencyPanel radar={radar} /></div>}

                {/* Two-column body */}
                <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : '1.55fr 1fr', gap: 20, alignItems: 'start', marginBottom: 20 }}>
                  {/* Left — assessment report + language / behaviour */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <CardPanel title="Assessment report" icon="clipboard-check"
                    right={<ResultPill status={a.assessment.status} size="lg" />}>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
                      <div style={{ flex: '1 1 210px', display: 'flex', alignItems: 'center', gap: 18, padding: '18px 20px', background: a.assessment.status === 'passed' ? NW.teal50 : NW.rose50, border: `1px solid ${a.assessment.status === 'passed' ? '#16A08522' : '#E74C7C22'}`, borderRadius: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                          <span style={{ fontSize: 46, fontWeight: 700, color: a.assessment.status === 'passed' ? NW.teal700 : NW.rose600, letterSpacing: '-0.04em', lineHeight: 1 }}>{a.assessment.overall}</span>
                          <span style={{ fontSize: 20, fontWeight: 600, color: a.assessment.status === 'passed' ? NW.teal600 : NW.rose500 }}>%</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: NW.gray700 }}>Overall score</div>
                          <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 2 }}>Passing score · {a.assessment.passing}%</div>
                        </div>
                      </div>
                      <div style={{ flex: '2 1 320px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Integrity check</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: a.assessment.integrity.risk >= 30 ? '#A16207' : NW.teal700, background: a.assessment.integrity.risk >= 30 ? NW.yellow50 : NW.teal50, padding: '3px 10px', borderRadius: 999 }}>Risk {a.assessment.integrity.risk}%</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <IntegrityStat label="Tab switches" value={a.assessment.integrity.tabSwitches} warn={a.assessment.integrity.tabSwitches >= 3} />
                          <IntegrityStat label="Copy-paste events" value={a.assessment.integrity.copyPaste} warn={a.assessment.integrity.copyPaste >= 1} />
                          <IntegrityStat label="Focus losses" value={a.assessment.integrity.focusLosses} warn={a.assessment.integrity.focusLosses >= 3} />
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 9 }}>Summary</div>
                    <p style={{ fontSize: 14, color: NW.gray800, lineHeight: 1.65, margin: '0 0 22px' }}>{a.assessment.summary}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: NW.gray400, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Question breakdown</span>
                      <span style={{ fontSize: 11, color: NW.gray400 }}>{a.assessment.questions.length} questions · tap to expand</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {a.assessment.questions.map((q, i) => <QuestionRow key={q.n} q={q} repeat={i === a.assessment.questions.length - 1 && /word-for-word|verbatim/i.test(q.feedback)} />)}
                    </div>
                  </CardPanel>
                    <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : '1fr 1fr', gap: 20 }}>
                      <EnglishPanel eng={a.english} />
                      <DiscSummaryPanel disc={a.disc} discColor={discColor} />
                    </div>
                  </div>

                  {/* Right — context rail */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <SnapshotPanel c={c} x={x} />
                    <SkillsMatchPanel c={c} />
                    {highlights && <HighlightsPanel h={highlights} />}
                    <NotesPanel c={c} />
                  </div>
                </div>

                {/* DISC profiles — full width */}
                <CardPanel title="DISC profiles · Natural · Adapted · Under pressure" icon="activity">
                  <p style={{ fontSize: 12.5, color: NW.gray500, margin: '0 0 18px', lineHeight: 1.55 }}>
                    Percentiles across the four dimensions in three contexts. <strong style={{ color: NW.gray700, fontWeight: 600 }}>Natural</strong> is the instinctive style, <strong style={{ color: NW.gray700, fontWeight: 600 }}>Adapted</strong> is how they flex at work, and <strong style={{ color: NW.gray700, fontWeight: 600 }}>Under pressure</strong> is their default when stressed.
                  </p>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <DiscProfileCard title="Natural" note="Instinctive behaviour" values={a.disc.profiles.natural} primary={a.disc.type} />
                    <DiscProfileCard title="Adapted" note="Style flexed at work" values={a.disc.profiles.adapted} primary={a.disc.type} />
                    <DiscProfileCard title="Under pressure" note="Default when stressed" values={a.disc.profiles.pressure} primary={a.disc.type} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 13px', background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 11 }}>
                    <Icon name="info" size={13} color={NW.gray400} />
                    <span style={{ fontSize: 11.5, color: NW.gray500, lineHeight: 1.45 }}>Psychometric results are interpretive aids. Hiring decisions should not rely solely on a single instrument.</span>
                  </div>
                </CardPanel>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

window.CandidateDetailScreen = CandidateDetailScreen;
