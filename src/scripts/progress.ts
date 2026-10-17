// Reading progress on this device: which stops are marked read, and the last stop opened.
const KEY = 'atlas:progress';
interface Progress { done: string[]; last?: string }

function load(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Progress>;
    return {
      done: Array.isArray(raw.done) ? raw.done.filter((x): x is string => typeof x === 'string') : [],
      last: typeof raw.last === 'string' ? raw.last : undefined,
    };
  } catch {
    return { done: [] };
  }
}

let state = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* keep in memory for this visit */ }
  document.dispatchEvent(new CustomEvent('atlas:progress'));
}

export const isDone = (slug: string) => state.done.includes(slug);
export const getLast = () => state.last;

export function setDone(slug: string, done: boolean) {
  const set = new Set(state.done);
  if (done) set.add(slug); else set.delete(slug);
  state = { ...state, done: [...set] };
  save();
}

export function setLast(slug: string) {
  state = { ...state, last: slug };
  save();
}

/** Paint read stops and per-line counts anywhere on the page. */
export function paintProgress(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-slug]').forEach((el) => {
    const done = isDone(el.dataset.slug!);
    el.classList.toggle('is-done', done);
    el.querySelector('.dot')?.classList.toggle('is-done', done);
  });
  root.querySelectorAll<HTMLElement>('[data-line-progress]').forEach((el) => {
    const slugs = (el.dataset.slugs || '').split(',').filter(Boolean);
    const read = slugs.filter(isDone).length;
    if (el.dataset.lineProgress === 'read') el.textContent = read > 0 ? `, ${read} read by you` : '';
    else el.textContent = read > 0 ? `${read} of ${slugs.length} read` : `${slugs.length} stops`;
  });
}
