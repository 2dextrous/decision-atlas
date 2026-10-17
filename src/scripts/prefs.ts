// Reader preferences: stored on this device, applied as data-* attributes on <html>.
// The inline script in BaseLayout applies saved values before first paint; this module
// keeps them in sync afterwards.

export type Theme = 'auto' | 'light' | 'sepia' | 'dark';
export interface Prefs {
  theme: Theme;
  size: '1' | '2' | '3' | '4' | '5';
  font: 'sans' | 'serif' | 'easy';
  spacing: 'compact' | 'comfortable' | 'relaxed';
  width: 'narrow' | 'medium' | 'wide';
  depth: '1' | '2' | '3';
  focus: boolean;
  motion: 'auto' | 'reduce';
}

export const DEFAULTS: Prefs = {
  theme: 'auto', size: '3', font: 'sans', spacing: 'comfortable', width: 'medium', depth: '2', focus: false, motion: 'auto',
};

const KEY = 'atlas:prefs';
const ALLOWED: { [K in keyof Prefs]: readonly Prefs[K][] } = {
  theme: ['auto', 'light', 'sepia', 'dark'],
  size: ['1', '2', '3', '4', '5'],
  font: ['sans', 'serif', 'easy'],
  spacing: ['compact', 'comfortable', 'relaxed'],
  width: ['narrow', 'medium', 'wide'],
  depth: ['1', '2', '3'],
  focus: [true, false],
  motion: ['auto', 'reduce'],
};

function sanitize(raw: unknown): Prefs {
  const out: Prefs = { ...DEFAULTS };
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(DEFAULTS) as (keyof Prefs)[]) {
      const v = (raw as Record<string, unknown>)[key];
      const value = typeof v === 'number' ? String(v) : v;
      if ((ALLOWED[key] as readonly unknown[]).includes(value)) (out as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

let state: Prefs = (() => {
  try { return sanitize(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { return { ...DEFAULTS }; }
})();

export const getPrefs = (): Prefs => ({ ...state });

export function applyPrefs(p: Prefs) {
  const d = document.documentElement;
  if (p.theme === 'auto') d.removeAttribute('data-theme'); else d.dataset.theme = p.theme;
  d.dataset.size = p.size;
  d.dataset.font = p.font;
  d.dataset.spacing = p.spacing;
  d.dataset.width = p.width;
  d.dataset.depth = p.depth;
  if (p.focus) d.dataset.focus = 'on'; else d.removeAttribute('data-focus');
  if (p.motion === 'reduce') d.dataset.motion = 'reduce'; else d.removeAttribute('data-motion');
  document.dispatchEvent(new CustomEvent<Prefs>('atlas:prefs', { detail: { ...p } }));
}

export function setPrefs(next: Partial<Prefs>) {
  state = sanitize({ ...state, ...next });
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep for this visit only */ }
  applyPrefs(state);
}

export function resetPrefs() { setPrefs({ ...DEFAULTS }); }
