// Shared candidate-derivation helpers used by the profile + compare mappers.

export type WorkItem = { company?: string; title?: string; from?: string; to?: string };

const yr = (s?: string): number | null => {
  const m = String(s || '').match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
};

// Total professional span from work history: earliest start → latest end (or now).
// Returns undefined when nothing parseable (so the UI can show "—" instead of "0 yrs").
export function yearsFromWorkHistory(wh?: WorkItem[] | null): number | undefined {
  if (!Array.isArray(wh) || !wh.length) return undefined;
  const now = new Date().getFullYear();
  let minStart: number | null = null, maxEnd: number | null = null;
  for (const w of wh) {
    const s = yr(w.from);
    const ongoing = !w.to || /present|current|actual|now|hoy|presente/i.test(String(w.to));
    const e = ongoing ? now : yr(w.to);
    if (s != null) minStart = minStart == null ? s : Math.min(minStart, s);
    if (e != null) maxEnd = maxEnd == null ? e : Math.max(maxEnd, e);
  }
  if (minStart == null) return undefined;
  const span = (maxEnd ?? now) - minStart;
  return span > 0 ? span : span === 0 ? 1 : undefined;
}

// Approximate timezone from the country named in a "City, Country" location string.
const LATAM_TZ: Record<string, string> = {
  colombia: 'GMT-5', peru: 'GMT-5', 'perú': 'GMT-5', ecuador: 'GMT-5', panama: 'GMT-5', 'panamá': 'GMT-5',
  venezuela: 'GMT-4', bolivia: 'GMT-4', 'dominican republic': 'GMT-4',
  argentina: 'GMT-3', chile: 'GMT-3', uruguay: 'GMT-3', paraguay: 'GMT-3', brazil: 'GMT-3', 'brasil': 'GMT-3',
  mexico: 'GMT-6', 'méxico': 'GMT-6', 'costa rica': 'GMT-6', guatemala: 'GMT-6', honduras: 'GMT-6',
  nicaragua: 'GMT-6', 'el salvador': 'GMT-6',
};
export function tzFromLocation(loc?: string): string | undefined {
  const l = (loc || '').toLowerCase();
  for (const [k, v] of Object.entries(LATAM_TZ)) if (l.includes(k)) return v;
  return undefined;
}

// Map a CEFR level to an approximate 0–100 score (for the compare bar).
const ENG_LEVEL_SCORE: Record<string, number> = { a1: 20, a2: 35, b1: 55, b2: 75, c1: 90, c2: 100 };
export function engLevelScore(level?: string): number {
  return ENG_LEVEL_SCORE[String(level || '').trim().toLowerCase()] ?? 0;
}
