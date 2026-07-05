// Billing — monthly spend across Nearwork's service models. Not a SaaS:
// no credits/usage, just what the client spends per month + breakdown + invoices.

const NW_INV_STATUS = {
  paid:     { label: 'Paid',     color: NW.teal700,  bg: NW.teal50,  dot: NW.teal500 },
  open:     { label: 'Open',     color: NW.gray600,  bg: NW.gray50,  dot: NW.gray400 },
  upcoming: { label: 'Upcoming', color: '#A16207',   bg: NW.yellow50,dot: NW.yellow500 },
};

function SpendChart({ trend, dense }) {
  const max = Math.max(...trend.map(t => t.v));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: dense ? 10 : 16, height: dense ? 120 : 150 }}>
      {trend.map((t, i) => {
        const last = i === trend.length - 1;
        return (
          <div key={t.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: last ? NW.teal700 : NW.gray400, fontFamily: "'JetBrains Mono', monospace" }}>{(t.v / 1000).toFixed(1)}k</div>
            <div style={{ width: '100%', maxWidth: 46, height: `${(t.v / max) * 100}%`, borderRadius: 8, background: last ? NW.teal500 : NW.gray200, transition: 'height 400ms cubic-bezier(0.16,1,0.3,1)' }} />
            <div style={{ fontSize: 11, color: last ? NW.black : NW.gray500, fontWeight: last ? 600 : 500 }}>{t.m}</div>
          </div>
        );
      })}
    </div>
  );
}

function BillingScreen({ density = 'regular', onNav }) {
  const dense = density === 'compact';
  const pad = dense ? 32 : 44;
  const b = window.NW_BILLING;
  const st = NW_INV_STATUS[b.status];
  const [view, setView] = useState_p('total'); // total | normal | spp

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: NW.offWhite, color: NW.black, fontFamily: 'Poppins, sans-serif' }}>
      <PortalSidebar active="billing" density={density} onNav={onNav} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PortalTopBar dense={dense} onNav={onNav} />
        <div style={{ flex: 1, overflow: 'auto', padding: `${dense ? 28 : 40}px ${pad}px ${pad}px` }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: dense ? 22 : 30, gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Billing</div>
                <h1 style={{ fontSize: dense ? 34 : 44, fontWeight: 700, color: NW.black, letterSpacing: '-0.04em', lineHeight: 1.02, margin: 0 }}>Spend & invoices</h1>
                <p style={{ fontSize: 14, color: NW.gray500, marginTop: 10, maxWidth: 520, lineHeight: 1.5 }}>What you spend with Nearwork each month, broken down by service.</p>
              </div>
              <Button variant="secondary" size="sm" icon="download">Download statement</Button>
            </div>

            {/* View filter */}
            <div style={{ display: 'flex', gap: 3, padding: 4, background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 10, width: 'fit-content', marginBottom: dense ? 16 : 20, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              {[{ id: 'total', label: 'Total' }, { id: 'normal', label: 'Normal' }, { id: 'spp', label: 'SPP only' }].map(o => {
                const on = view === o.id;
                return <button key={o.id} onClick={() => setView(o.id)} style={{ border: 'none', padding: '7px 16px', borderRadius: 7, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: on ? NW.black : 'transparent', color: on ? NW.white : NW.gray600, transition: 'background 150ms, color 150ms' }}>{o.label}</button>;
              })}
            </div>

            {view !== 'spp' && (<React.Fragment>
            {/* Top: this month + trend */}
            <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : '1fr 1.4fr', gap: dense ? 16 : 22, marginBottom: dense ? 16 : 22 }}>
              {/* This month */}
              <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? 24 : 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{b.month}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: st.color, background: st.bg, padding: '4px 11px', borderRadius: 999 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} /> {st.label}
                  </span>
                </div>
                <div style={{ fontFamily: 'Poppins', fontSize: dense ? 46 : 56, fontWeight: 700, color: NW.black, letterSpacing: '-0.045em', lineHeight: 0.95 }}>{b.total}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Icon name="trending-up" size={14} color={NW.teal600} />
                  <span style={{ fontSize: 12.5, color: NW.teal600, fontWeight: 500 }}>{b.changePct} vs {b.prevTotal} last month</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 18, borderTop: `1px solid ${NW.gray100}` }}>
                  <span style={{ fontSize: 12.5, color: NW.gray500 }}>Due {b.due}</span>
                  <Button variant="dark" size="sm" icon="download">View invoice</Button>
                </div>
              </div>
              {/* Trend */}
              <div style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? 24 : 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: NW.gray500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Spend · last 6 months</span>
                  <span style={{ fontSize: 12.5, color: NW.gray500 }}>YTD <span style={{ fontWeight: 700, color: NW.black }}>{b.ytd}</span></span>
                </div>
                <SpendChart trend={b.trend} dense={dense} />
              </div>
            </div>

            {/* US comparison */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', background: `linear-gradient(120deg, ${NW.black}, #1a2e2a)`, borderRadius: 20, padding: dense ? '20px 24px' : '24px 30px', marginBottom: dense ? 16 : 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(26,188,140,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="trending-down" size={22} color="#3DD9A8" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.01em' }}>The same hiring & employment in the US would cost about</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Poppins', fontSize: dense ? 28 : 34, fontWeight: 700, color: NW.white, letterSpacing: '-0.03em' }}>{b.us.equivalent}<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}> /mo</span></span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>vs your {b.total}/mo with Nearwork</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1ABC8C', color: NW.white, padding: '8px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700 }}>
                  <Icon name="sparkles" size={15} color={NW.white} /> Save {b.us.savings}/mo
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 7 }}>~{b.us.savingsPct} lower · estimated</div>
              </div>
            </div>

            {/* Spend by service */}
            <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? 24 : 30, marginBottom: dense ? 16 : 22 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 18px' }}>Spend by service</h3>
              {/* Stacked bar */}
              <div style={{ display: 'flex', gap: 3, height: 14, marginBottom: 20 }}>
                {b.services.map(s => <div key={s.id} title={`${s.label}: ${s.amount}`} style={{ flex: s.pct, background: s.color, borderRadius: 5 }} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr 1fr' : 'repeat(4, 1fr)', gap: dense ? 14 : 18 }}>
                {b.services.map(s => (
                  <div key={s.id} style={{ padding: dense ? '14px 16px' : '16px 18px', background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: NW.black }}>{s.label}</span>
                    </div>
                    <div style={{ fontFamily: 'Poppins', fontSize: dense ? 22 : 26, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em' }}>{s.amount}</div>
                    <div style={{ fontSize: 11, color: NW.gray500, marginTop: 4 }}>{s.model}</div>
                    <div style={{ fontSize: 11, color: NW.gray400, marginTop: 1 }}>{s.meta}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Per-hire + invoices */}
            <div style={{ display: 'grid', gridTemplateColumns: dense ? '1fr' : '1.3fr 1fr', gap: dense ? 16 : 22 }}>
              {/* Per-hire breakdown */}
              <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? '24px 18px' : '28px 22px' }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px', padding: '0 4px' }}>Per-hire breakdown · {b.month}</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {b.perHire.slice(0, b.perHireVisible).map((h, i) => (
                    <div key={h.id} onClick={() => onNav && onNav('hire', h.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 12px', borderRadius: 12, cursor: 'pointer', borderTop: i === 0 ? 'none' : `1px solid ${NW.gray100}` }}
                      onMouseEnter={e => e.currentTarget.style.background = NW.gray50} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Avatar initials={h.initials} bg={h.avatarBg} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: NW.black }}>{h.name}</span>
                          <Icon name="arrow-up-right" size={12} color={NW.gray300} />
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          {h.services.map(sv => <span key={sv} style={{ fontSize: 10, fontWeight: 600, color: NW.gray600, background: NW.gray50, border: `1px solid ${NW.gray100}`, padding: '2px 7px', borderRadius: 6 }}>{sv}</span>)}
                        </div>
                      </div>
                      <span style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em' }}>{h.amount}</span>
                    </div>
                  ))}
                </div>
                {b.perHire.length > b.perHireVisible && (
                  <button onClick={() => onNav && onNav('team')} style={{ width: '100%', marginTop: 10, border: `1px solid ${NW.gray200}`, background: NW.white, borderRadius: 10, padding: '10px', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: NW.gray700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    View all {b.perHire.length} on Team <Icon name="arrow-right" size={14} color={NW.gray600} />
                  </button>
                )}
              </section>

              {/* Invoice history */}
              <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? '24px 18px' : '28px 22px' }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px', padding: '0 4px' }}>Invoices · last 12 months</h3>
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 470, overflow: 'auto' }}>
                  {b.invoices.map((inv, i) => {
                    const ist = NW_INV_STATUS[inv.status];
                    return (
                      <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 12px', borderTop: i === 0 ? 'none' : `1px solid ${NW.gray100}` }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: NW.gray50, border: `1px solid ${NW.gray100}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name="file-text" size={15} color={NW.gray500} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: NW.black }}>{inv.period}</div>
                          <div style={{ fontSize: 11, color: NW.gray400 }}>{inv.id} · due {inv.due}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: NW.black }}>{inv.amount}</div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600, color: ist.color, marginTop: 2 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: ist.dot }} /> {ist.label}
                          </span>
                        </div>
                        <button title="Download" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${NW.gray200}`, background: NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <Icon name="download" size={14} color={NW.gray600} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
            </React.Fragment>)}

            {/* SPP partner billing */}
            {view !== 'normal' && window.NW_SPP_BILLING && (() => {
              const s = window.NW_SPP_BILLING;
              const clients = window.NW_SPP_CLIENTS || [];
              return (
                <section style={{ background: NW.white, border: `1px solid ${NW.gray100}`, borderRadius: 20, padding: dense ? 24 : 30, marginTop: dense ? 16 : 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Icon name="git-merge" size={16} color="#AF7AC5" />
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Strategic Partner Program · what you pay Nearwork</h3>
                  </div>
                  <p style={{ fontSize: 12.5, color: NW.gray500, margin: '0 0 18px', maxWidth: 640, lineHeight: 1.5 }}>{s.discountNote}</p>

                  {/* Subscription + discount */}
                  <div style={{ display: 'flex', gap: dense ? 14 : 18, marginBottom: dense ? 18 : 22, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, background: 'linear-gradient(160deg, #FFF, #AF7AC50d)', border: '1px solid #AF7AC533', borderRadius: 14, padding: '16px 18px' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>SPP subscription</div>
                      <div style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em' }}>{s.subscription}<span style={{ fontSize: 13, color: NW.gray500, fontWeight: 500 }}> /mo</span></div>
                      <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 3 }}>{s.tier}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200, background: NW.gray50, border: `1px solid ${NW.gray100}`, borderRadius: 14, padding: '16px 18px' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: NW.gray500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Placement rate</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontFamily: 'Poppins', fontSize: 28, fontWeight: 700, color: NW.teal600, letterSpacing: '-0.03em' }}>{s.placementSpp}</span>
                        <span style={{ fontSize: 14, color: NW.gray400, textDecoration: 'line-through' }}>{s.placementList}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: NW.gray500, marginTop: 3 }}>Discounted SPP rate · managed & EOR at full</div>
                    </div>
                  </div>

                  {/* Per-client */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.9fr', gap: 12, padding: '0 14px 10px', fontSize: 10, fontWeight: 600, color: NW.gray400, letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: `1px solid ${NW.gray100}` }}>
                    <span>Client</span><span>Managed</span><span>EOR</span><span>Direct</span><span style={{ textAlign: 'right' }}>Monthly</span>
                  </div>
                  <div>
                    {clients.map((c, i) => (
                      <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.9fr', gap: 12, alignItems: 'center', padding: '12px 14px', borderTop: i === 0 ? 'none' : `1px solid ${NW.gray100}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: c.logoBg, color: NW.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{c.initials}</div>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: NW.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: 13, color: NW.gray600 }}>{c.services.managed}</span>
                        <span style={{ fontSize: 13, color: NW.gray600 }}>{c.services.eor}</span>
                        <span style={{ fontSize: 13, color: NW.gray600 }}>{c.services.direct}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: NW.black, textAlign: 'right' }}>{c.monthly}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${NW.gray100}` }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: NW.gray600 }}>Total to Nearwork · subscription + {clients.length} clients</span>
                    <span style={{ fontFamily: 'Poppins', fontSize: 24, fontWeight: 700, color: NW.black, letterSpacing: '-0.03em' }}>{s.total}<span style={{ fontSize: 13, color: NW.gray500, fontWeight: 500 }}> /mo</span></span>
                  </div>
                </section>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}

window.BillingScreen = BillingScreen;
