// Station page behaviour: depth levels, go-deeper buttons, copy, reading progress, mark as read.
import { setPrefs } from './prefs';
import { isDone, setDone, setLast, paintProgress } from './progress';

const reduced = () =>
  document.documentElement.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountStation(slug: string) {
  const levels = [...document.querySelectorAll<HTMLElement>('.level')];
  const depth = () => Number(document.documentElement.dataset.depth || '2');
  const isOpen = (el: HTMLElement) =>
    el.classList.contains('is-open') || (!el.classList.contains('is-closed') && Number(el.dataset.n) <= depth());
  const open = (el: HTMLElement) => { el.classList.add('is-open'); el.classList.remove('is-closed'); };

  function refresh() {
    levels.forEach((el, i) => {
      const expanded = isOpen(el);
      el.querySelector('[data-level-toggle]')?.setAttribute('aria-expanded', String(expanded));
      const next = levels[i + 1];
      const btn = el.querySelector<HTMLButtonElement>('.level-next');
      if (btn) btn.hidden = !expanded || !next || isOpen(next);
    });
  }

  levels.forEach((el) =>
    el.querySelector('[data-level-toggle]')?.addEventListener('click', () => {
      const expanded = isOpen(el);
      el.classList.toggle('is-open', !expanded);
      el.classList.toggle('is-closed', expanded);
      refresh();
    }),
  );

  document.querySelectorAll<HTMLButtonElement>('[data-open-level]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const target = document.getElementById(`level-${btn.dataset.openLevel}`);
      if (!target) return;
      open(target);
      refresh();
      target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      target.querySelector<HTMLElement>('[data-level-toggle]')?.focus({ preventScroll: true });
    }),
  );

  // Page-level depth control mirrors the saved preference.
  const radios = [...document.querySelectorAll<HTMLInputElement>('input[name="page-depth"]')];
  const syncRadios = () => radios.forEach((r) => (r.checked = r.value === String(depth())));
  radios.forEach((r) =>
    r.addEventListener('change', () => {
      if (r.checked) setPrefs({ depth: r.value as '1' | '2' | '3' });
    }),
  );
  let lastDepth = depth();
  document.addEventListener('atlas:prefs', () => {
    if (depth() !== lastDepth) {
      lastDepth = depth();
      levels.forEach((el) => el.classList.remove('is-open', 'is-closed'));
    }
    syncRadios();
    refresh();
  });
  syncRadios();
  refresh();

  // A link to anything inside a collapsed level opens that level first.
  const openForHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    const lvl = el?.closest<HTMLElement>('.level');
    if (el && lvl && !isOpen(lvl)) {
      open(lvl);
      refresh();
      el.scrollIntoView({ block: 'start' });
    }
  };
  openForHash();
  window.addEventListener('hashchange', openForHash);

  // Copy the 30-second answer.
  document.querySelectorAll<HTMLButtonElement>('[data-copy-quote]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const text = btn.closest('figure')?.querySelector('blockquote')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const label = btn.querySelector('span');
      try {
        await navigator.clipboard.writeText(text);
        if (label) label.textContent = 'Copied';
      } catch {
        if (label) label.textContent = 'Select and copy';
      }
      window.setTimeout(() => { if (label) label.textContent = 'Copy'; }, 1800);
    }),
  );

  // Reading progress bar in the top bar.
  const bar = document.querySelector<HTMLElement>('.read-progress span');
  const main = document.querySelector<HTMLElement>('.station-main');
  if (bar && main) {
    let ticking = false;
    const update = () => {
      const rect = main.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const done = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      bar.style.width = `${(done * 100).toFixed(2)}%`;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // Mark as read, and remember this stop for "continue where you left off".
  setLast(slug);
  const doneBtn = document.querySelector<HTMLButtonElement>('[data-mark-done]');
  const paintDone = () => {
    if (!doneBtn) return;
    const done = isDone(slug);
    doneBtn.setAttribute('aria-pressed', String(done));
    const label = doneBtn.querySelector('span');
    if (label) label.textContent = done ? 'Marked as read' : 'Mark as read';
  };
  doneBtn?.addEventListener('click', () => { setDone(slug, !isDone(slug)); });
  document.addEventListener('atlas:progress', () => { paintDone(); paintProgress(); });
  paintDone();
  paintProgress();
}
