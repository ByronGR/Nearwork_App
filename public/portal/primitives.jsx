// Shared chrome + primitives for Nearwork jobs site
const { useState, useEffect, useRef, useMemo } = React;

const NW = {
  white: '#FFFFFF',
  black: '#111111',
  offWhite: '#F8F7F3',
  gray50: '#F5F4F0',
  gray100: '#EBEBEB',
  gray200: '#D9D9D9',
  gray300: '#BDBDBD',
  gray400: '#9E9E9E',
  gray500: '#757575',
  gray600: '#555555',
  gray700: '#383838',
  gray800: '#232323',
  gray900: '#161616',
  teal50: '#E8F8F5',
  teal100: '#C8EDE6',
  teal500: '#16A085',
  teal600: '#12866E',
  teal700: '#0E6B58',
  rose50: '#FEF0F5',
  rose500: '#E74C7C',
  rose600: '#CC3666',
  violet50: '#F7F2FC',
  violet500: '#AF7AC5',
  green50: '#F0FDF4',
  green500: '#22C55E',
  green600: '#16A34A',
  yellow50: '#FEFCE8',
  yellow500: '#EAB308',
  blue50: '#EFF6FF',
  blue500: '#3B82F6',
};

// ── Lucide icon helper ────────────────────────────────────────────────────────
function Icon({ name, size = 16, color, strokeWidth = 1.75, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.innerHTML = '';
      const el = document.createElement('i');
      el.setAttribute('data-lucide', name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: { 'stroke-width': strokeWidth, width: size, height: size },
        nameAttr: 'data-lucide',
      });
    }
  }, [name, size, strokeWidth]);
  return <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center', color, ...style }} />;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo({ onClick }) {
  return (
    <div onClick={onClick} style={{ position: 'relative', display: 'inline-block', fontWeight: 700, fontSize: 22, color: NW.black, letterSpacing: '-0.03em', lineHeight: 1, cursor: 'pointer' }}>
      Nearwork
      <div style={{ position: 'absolute', bottom: -4, left: 0, width: '56%', height: 3, background: NW.teal500, borderRadius: 2 }} />
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ initials, size = 32, bg = NW.teal500, fg = NW.white }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600, letterSpacing: '-0.01em', flexShrink: 0,
    }}>{initials}</div>
  );
}

// ── Company tile (square logo placeholder) ────────────────────────────────────
function CompanyTile({ logo, color, size = 48, radius = 10 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: color, color: NW.white,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.46, letterSpacing: '-0.02em',
      flexShrink: 0,
      boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.04)',
    }}>{logo}</div>
  );
}

// ── Top Nav (logged-in candidate state) ───────────────────────────────────────
function TopNav({ activeView, onNav, user, savedCount, appliedCount, isLoggedIn, onSignUp }) {
  const links = isLoggedIn
    ? [
        { id: 'browse', label: 'Browse' },
        { id: 'saved', label: 'Saved', count: savedCount },
        { id: 'applied', label: 'Applied', count: appliedCount },
        { id: 'profile', label: 'Profile' },
      ]
    : [
        { id: 'browse', label: 'Browse roles' },
        { id: 'how', label: 'How it works' },
        { id: 'for-companies', label: 'For companies' },
      ];
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${NW.gray100}`,
      height: 64, display: 'flex', alignItems: 'center',
      padding: '0 32px', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <Logo onClick={() => onNav('list')} />
        <div style={{ display: 'flex', gap: 4 }}>
          {links.map(l => {
            const active = activeView === l.id;
            return (
              <button key={l.id} onClick={() => onNav(l.id)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                font: 'inherit', fontSize: 14, fontWeight: 500,
                color: active ? NW.black : NW.gray600,
                padding: '8px 12px', borderRadius: 8,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'background 150ms, color 150ms',
                position: 'relative',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = NW.gray50; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                {l.label}
                {l.count != null && (
                  <span style={{
                    background: active ? NW.teal500 : NW.gray100, color: active ? NW.white : NW.gray600,
                    fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center',
                  }}>{l.count}</span>
                )}
                {active && <div style={{ position: 'absolute', bottom: -19, left: 12, right: 12, height: 2, background: NW.teal500, borderRadius: 1 }} />}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isLoggedIn ? (
          <>
            <button style={{
              background: 'transparent', border: `1px solid ${NW.gray100}`, cursor: 'pointer',
              width: 36, height: 36, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: NW.gray600, position: 'relative',
            }}>
              <Icon name="bell" size={16} />
              <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, background: NW.rose500, borderRadius: '50%', border: `1.5px solid ${NW.white}` }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 4px', border: `1px solid ${NW.gray100}`, borderRadius: 999, cursor: 'pointer' }}>
              <Avatar initials={user.initials} size={28} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</span>
              <Icon name="chevron-down" size={14} color={NW.gray500} />
            </div>
          </>
        ) : (
          <>
            <button onClick={() => onSignUp && onSignUp('signin')} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, color: NW.gray700, padding: '8px 14px',
              borderRadius: 999, font: 'inherit',
            }}>Sign in</button>
            <Button variant="primary" size="sm" iconRight="arrow-right" onClick={() => onSignUp && onSignUp('create')}>
              Create account
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
function Button({ variant = 'primary', size = 'md', children, icon, iconRight, onClick, disabled, style, fullWidth }) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 13, height: 32, gap: 6 },
    md: { padding: '10px 18px', fontSize: 14, height: 40, gap: 8 },
    lg: { padding: '14px 24px', fontSize: 15, height: 48, gap: 10 },
  };
  const variants = {
    primary: { background: NW.teal500, color: NW.white, border: '1px solid transparent', hoverBg: NW.teal600 },
    secondary: { background: NW.white, color: NW.black, border: `1px solid ${NW.gray200}`, hoverBg: NW.gray50 },
    ghost: { background: 'transparent', color: NW.black, border: '1px solid transparent', hoverBg: NW.gray50 },
    dark: { background: NW.black, color: NW.white, border: '1px solid transparent', hoverBg: NW.gray800 },
    success: { background: NW.green50, color: NW.green600, border: `1px solid ${NW.green500}40`, hoverBg: NW.green50 },
  };
  const s = sizes[size], v = variants[variant];
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: s.gap,
        padding: s.padding, height: s.height, fontSize: s.fontSize, fontWeight: 600,
        background: hover && !disabled ? v.hoverBg : v.background,
        color: v.color, border: v.border, borderRadius: 999,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        font: 'inherit', fontWeight: 600,
        letterSpacing: '-0.01em',
        transition: 'background 150ms, transform 100ms',
        transform: hover && !disabled ? 'translateY(-1px)' : 'none',
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}>
      {icon && <Icon name={icon} size={s.fontSize + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={s.fontSize + 2} />}
    </button>
  );
}

// ── Chip / Tag ────────────────────────────────────────────────────────────────
function Chip({ children, variant = 'default', icon, size = 'md' }) {
  const variants = {
    default: { bg: NW.gray50, fg: NW.gray700, border: NW.gray100 },
    accent: { bg: NW.teal50, fg: NW.teal700, border: '#16A08530' },
    rose: { bg: NW.rose50, fg: NW.rose600, border: '#E74C7C30' },
    violet: { bg: NW.violet50, fg: '#784899', border: '#AF7AC530' },
    blue: { bg: NW.blue50, fg: '#1D4ED8', border: '#3B82F630' },
    success: { bg: NW.green50, fg: NW.green600, border: '#22C55E40' },
    warning: { bg: NW.yellow50, fg: '#A16207', border: '#EAB30840' },
    outline: { bg: 'transparent', fg: NW.gray700, border: NW.gray200 },
  };
  const v = variants[variant];
  const sizes = { sm: { fz: 11, py: 3, px: 8 }, md: { fz: 12, py: 4, px: 10 }, lg: { fz: 13, py: 5, px: 12 } };
  const s = sizes[size];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: v.bg, color: v.fg,
      border: `1px solid ${v.border}`,
      fontSize: s.fz, fontWeight: 500, padding: `${s.py}px ${s.px}px`,
      borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      {icon && <Icon name={icon} size={s.fz} />}
      {children}
    </span>
  );
}

// ── Match score donut ─────────────────────────────────────────────────────────
function MatchScore({ value, size = 44, strokeWidth = 3.5, showLabel = true }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 85 ? NW.teal500 : value >= 70 ? NW.teal500 : value >= 55 ? NW.yellow500 : NW.gray400;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={NW.gray100} strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      {showLabel && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.30, fontWeight: 700, color: NW.black, letterSpacing: '-0.02em',
        }}>{value}</div>
      )}
    </div>
  );
}

// Expose to global so other Babel scripts can use them
Object.assign(window, { NW, Icon, Logo, Avatar, CompanyTile, TopNav, Button, Chip, MatchScore });
