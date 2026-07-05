// Star rating (robust custom SVG, supports fractional fill) + performance-review modal.
// Used by the hire detail screen. Loaded before portal-v3-hire.jsx.

const NW_STAR_PATH = 'M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01z';

function StarGlyph({ size = 16, fill = 1, color = '#EAB308', empty = '#E6E3DC' }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, lineHeight: 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <path d={NW_STAR_PATH} fill={empty} />
      </svg>
      <span style={{ position: 'absolute', inset: 0, width: `${Math.max(0, Math.min(1, fill)) * 100}%`, overflow: 'hidden', lineHeight: 0 }}>
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
          <path d={NW_STAR_PATH} fill={color} />
        </svg>
      </span>
    </span>
  );
}

function StarRating({ value, size = 16, gap = 3, showNum = true, numColor }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      <span style={{ display: 'inline-flex', gap: gap - 1 }}>
        {[0, 1, 2, 3, 4].map(i => <StarGlyph key={i} size={size} fill={value - i} />)}
      </span>
      {showNum && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: size - 2, fontWeight: 600, color: numColor || NW.gray700, marginLeft: 3 }}>{value.toFixed(1)}</span>}
    </span>
  );
}

// Interactive 1–5 star input
function StarInput({ value, onChange, size = 22 }) {
  const [hover, setHover] = useState_p(0);
  const shown = hover || value;
  return (
    <span style={{ display: 'inline-flex', gap: 4 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}>
          <StarGlyph size={size} fill={shown >= n ? 1 : 0} />
        </button>
      ))}
    </span>
  );
}

function ModalShell({ children, onClose, width = 620 }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(15,15,15,0.36)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'nwFade 160ms ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: `min(${width}px, 100%)`, maxHeight: '88vh', overflow: 'auto',
        background: NW.white, borderRadius: 22, boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
        animation: 'nwPop 220ms cubic-bezier(0.16,1,0.3,1)',
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Review detail (view mode) ────────────────────────────────────────────────
function ReviewViewModal({ review, person, onClose }) {
  const annual = review.type === 'annual';
  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: '26px 30px', borderBottom: `1px solid ${NW.gray100}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: annual ? '#AF7AC518' : NW.teal50, color: annual ? NW.violet500 : NW.teal700 }}>{annual ? 'Annual review' : 'Quarterly review'}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: NW.gray500 }}>
              <Icon name={review.conductedBy === 'Nearwork' ? 'shield-check' : 'user'} size={12} color={NW.gray400} /> By {review.conductedBy}
            </span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em', margin: 0 }}>{review.period}</h2>
          <div style={{ fontSize: 12.5, color: NW.gray500, marginTop: 5 }}>{review.date} · {review.reviewer}{review.reviewerRole ? ` · ${review.reviewerRole}` : ''}</div>
        </div>
        <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="x" size={16} color={NW.gray600} />
        </button>
      </div>

      <div style={{ padding: '24px 30px' }}>
        {/* Overall */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: NW.offWhite, border: `1px solid ${NW.gray100}`, borderRadius: 16, marginBottom: 24 }}>
          <div style={{ fontFamily: 'Poppins', fontSize: 44, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1 }}>{review.rating.toFixed(1)}</div>
          <div>
            <StarRating value={review.rating} size={20} showNum={false} />
            <div style={{ fontSize: 12, color: NW.gray500, marginTop: 5 }}>Overall rating · out of 5.0</div>
          </div>
        </div>

        {/* Categories */}
        {review.categories && review.categories.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>By category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {review.categories.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 13, color: NW.gray700, width: 130, flexShrink: 0 }}>{c.label}</span>
                  <div style={{ flex: 1, height: 7, background: NW.gray100, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(c.score / 5) * 100}%`, height: '100%', background: c.score >= 4.5 ? NW.teal600 : c.score >= 3.5 ? NW.teal500 : NW.yellow500 }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: NW.black, width: 26, textAlign: 'right' }}>{c.score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Summary</h3>
        <p style={{ fontSize: 14.5, color: NW.gray800, lineHeight: 1.6, margin: '0 0 24px' }}>{review.summary}</p>

        {/* Strengths + growth */}
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: review.goals && review.goals.length ? 24 : 0 }}>
          {review.strengths && review.strengths.length > 0 && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.teal700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Strengths</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {review.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <Icon name="check" size={15} color={NW.teal600} strokeWidth={2.5} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: NW.gray800, lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {review.growth && review.growth.length > 0 && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: '#A16207', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Growth areas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {review.growth.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <Icon name="trending-up" size={15} color="#A16207" strokeWidth={2.2} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, color: NW.gray800, lineHeight: 1.4 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Goals */}
        {review.goals && review.goals.length > 0 && (
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Goals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {review.goals.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', border: `1px solid ${NW.gray100}`, borderRadius: 12 }}>
                  <Icon name="target" size={15} color={NW.gray400} />
                  <span style={{ flex: 1, fontSize: 13.5, color: NW.gray800 }}>{g.text}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: g.status === 'done' ? NW.teal50 : NW.gray50, color: g.status === 'done' ? NW.teal700 : NW.gray500 }}>{g.status === 'done' ? 'Done' : 'In progress'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ── Nearwork-managed lock notice ─────────────────────────────────────────────
function ReviewLockedModal({ person, onClose }) {
  return (
    <ModalShell onClose={onClose} width={460}>
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: NW.teal50, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Icon name="shield-check" size={26} color={NW.teal600} strokeWidth={1.9} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em', margin: '0 0 10px' }}>Nearwork handles this review</h2>
        <p style={{ fontSize: 14, color: NW.gray600, lineHeight: 1.6, margin: '0 0 22px' }}>
          {person.name.split(' ')[0]} is part of a Nearwork-managed team, so performance reviews are conducted by us. You’ll see each review here as soon as it’s completed — and you can always add context with a shared note.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button variant="secondary" size="md" onClick={onClose}>Got it</Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Add review (client conducts) ─────────────────────────────────────────────
function ReviewAddModal({ person, onClose, onSave }) {
  const cats = window.NW_REVIEW_CATEGORIES || [];
  const [period, setPeriod] = useState_p('');
  const [type, setType] = useState_p('quarterly');
  const [scores, setScores] = useState_p(cats.reduce((a, c) => (a[c] = 0, a), {}));
  const [summary, setSummary] = useState_p('');
  const [strengths, setStrengths] = useState_p('');
  const [growth, setGrowth] = useState_p('');

  const rated = cats.filter(c => scores[c] > 0);
  const overall = rated.length ? rated.reduce((s, c) => s + scores[c], 0) / rated.length : 0;
  const valid = period.trim() && summary.trim() && rated.length === cats.length;

  const save = () => {
    if (!valid) return;
    onSave({
      id: 'rnew-' + Date.now(), type, period: period.trim(), date: 'Just now',
      rating: Math.round(overall * 10) / 10, reviewer: window.NW_CLIENT.user.name, reviewerRole: window.NW_CLIENT.user.role, conductedBy: 'Client',
      summary: summary.trim(),
      categories: cats.map(c => ({ label: c, score: scores[c] })),
      strengths: strengths.split(',').map(s => s.trim()).filter(Boolean),
      growth: growth.split(',').map(s => s.trim()).filter(Boolean),
      goals: [],
    });
  };

  const field = { width: '100%', boxSizing: 'border-box', border: `1px solid ${NW.gray200}`, borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, color: NW.black, outline: 'none', background: NW.white };

  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: '24px 30px', borderBottom: `1px solid ${NW.gray100}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NW.black, letterSpacing: '-0.025em', margin: 0 }}>New performance review</h2>
          <div style={{ fontSize: 13, color: NW.gray500, marginTop: 5 }}>For {person.name} · you’re conducting this review</div>
        </div>
        <button onClick={onClose} style={{ background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 999, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="x" size={16} color={NW.gray600} />
        </button>
      </div>

      <div style={{ padding: '24px 30px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Period</label>
            <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. Q2 2026" style={field} />
          </div>
          <div style={{ width: 200 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Type</label>
            <div style={{ display: 'flex', gap: 3, padding: 3, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 10 }}>
              {['quarterly', 'annual'].map(t => (
                <button key={t} onClick={() => setType(t)} style={{ flex: 1, border: 'none', padding: '7px 8px', borderRadius: 7, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer', background: type === t ? NW.white : 'transparent', color: type === t ? NW.black : NW.gray500, boxShadow: type === t ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Category ratings */}
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Ratings</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
          {cats.map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: `1px solid ${NW.gray100}`, borderRadius: 12 }}>
              <span style={{ fontSize: 13.5, color: NW.gray800 }}>{c}</span>
              <StarInput value={scores[c]} onChange={v => setScores({ ...scores, [c]: v })} size={20} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px', marginBottom: 22 }}>
          <span style={{ fontSize: 12.5, color: NW.gray500 }}>Overall (auto)</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><StarRating value={overall} size={16} /></span>
        </div>

        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Summary</label>
        <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Overall assessment of the period…" style={{ ...field, minHeight: 84, resize: 'vertical', lineHeight: 1.5, marginBottom: 18 }} />

        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Strengths <span style={{ textTransform: 'none', letterSpacing: 0, color: NW.gray400 }}>· comma-separated</span></label>
            <input value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="Account relationships, Churn reduction" style={field} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Growth areas <span style={{ textTransform: 'none', letterSpacing: 0, color: NW.gray400 }}>· comma-separated</span></label>
            <input value={growth} onChange={e => setGrowth(e.target.value)} placeholder="Upsell motions, CRM hygiene" style={field} />
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 30px', borderTop: `1px solid ${NW.gray100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', bottom: 0, background: NW.white }}>
        <span style={{ fontSize: 12, color: NW.gray400 }}>{valid ? 'Ready to save' : 'Rate all categories, add a period and summary'}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" icon="check" disabled={!valid} onClick={save}>Save review</Button>
        </div>
      </div>
    </ModalShell>
  );
}

Object.assign(window, { StarRating, StarGlyph, StarInput, ReviewViewModal, ReviewAddModal, ReviewLockedModal, ModalShell });
