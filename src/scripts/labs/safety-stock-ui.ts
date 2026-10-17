// DOM layer for the safety stock lab: controls, result tiles, SVG chart with hover and keyboard readout, table view.
import { plan, steady, bumpy, type Inputs, type Sim, type Plan } from './safety-stock-math';

const NS = 'http://www.w3.org/2000/svg';
const DEFAULTS: Inputs = { d: 4, sd: 1.5, L: 5, sL: 0, csl: 95, Q: 77.5 };
const PRESETS: Record<string, Partial<Inputs>> = {
  reliable: { L: 5, sL: 0 },
  fast: { L: 3, sL: 2 },
  high: { csl: 99 },
  reset: { ...DEFAULTS },
};
const HORIZON = 60;

const kg = (v: number) => `${v.toFixed(1)} kg`;
const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

function niceStep(max: number) {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= raw) return m * pow;
  return 10 * pow;
}

function formatInput(id: keyof Inputs, v: number) {
  switch (id) {
    case 'd': return `${v.toFixed(1)} kg a day`;
    case 'sd': return `${v.toFixed(1)} kg`;
    case 'L': return `${v} ${v === 1 ? 'day' : 'days'}`;
    case 'sL': return `${v} ${v === 1 ? 'day' : 'days'}`;
    case 'csl': return `${v.toFixed(1)}%`;
    case 'Q': return `${v.toFixed(1)} kg`;
  }
}

export function mountSafetyStockLab(root: HTMLElement) {
  const inputs = { ...DEFAULTS };
  let mode: 'steady' | 'bumpy' = 'steady';
  let seed = 7;
  let sim: Sim;
  let p: Plan;
  let hover = -1;

  const chart = root.querySelector<HTMLElement>('[data-chart]')!;
  const tip = root.querySelector<HTMLElement>('[data-tip]')!;
  const table = root.querySelector<HTMLElement>('[data-table]')!;
  const replay = root.querySelector<HTMLButtonElement>('[data-replay]')!;
  const r = (key: string) => root.querySelector<HTMLElement>(`[data-r="${key}"]`)!;
  const ranges = [...root.querySelectorAll<HTMLInputElement>('input.range')];

  function paintRange(el: HTMLInputElement) {
    const min = Number(el.min), max = Number(el.max), v = Number(el.value);
    el.style.setProperty('--pct', `${((v - min) / (max - min)) * 100}%`);
    const out = root.querySelector<HTMLOutputElement>(`[data-out="${el.name}"]`);
    if (out) out.textContent = formatInput(el.name as keyof Inputs, v);
  }

  function setFormula() {
    const f = r('formula');
    const sub = (t: string) => { const s = document.createElement('sub'); s.textContent = t; return s; };
    f.replaceChildren(
      'SS = z × √(L × σ', sub('d'), '² + d² × σ', sub('L'), '²) = ',
      `${p.z.toFixed(3)} × √(${inputs.L} × ${inputs.sd.toFixed(1)}² + ${inputs.d.toFixed(1)}² × ${inputs.sL}²) = `,
      Object.assign(document.createElement('strong'), { textContent: kg(p.ss) }),
    );
  }

  function setResults() {
    r('ss').textContent = kg(p.ss);
    r('ssDays').textContent = `${(p.ss / inputs.d).toFixed(1)} days of supply`;
    r('rop').textContent = kg(p.rop);
    r('avg').textContent = kg(p.avg);
    r('avgDays').textContent = `${(p.avg / inputs.d).toFixed(1)} days of supply`;
    setFormula();
    const note = r('note');
    if (mode === 'steady') {
      note.textContent = `Textbook case: demand is exactly ${inputs.d.toFixed(1)} kg every day and deliveries are never late, so stock touches the safety stock line just as each delivery lands. Switch to real life to see what the buffer is for.`;
    } else {
      const outs = sim.stockouts.length;
      const odds = Math.max(1, Math.round(100 / Math.max(0.1, 100 - inputs.csl)));
      note.textContent = outs
        ? `This replay: ${sim.orders.length} orders, ${outs} ${outs === 1 ? 'day' : 'days'} with a stockout and ${sim.lost.toFixed(1)} kg of lost sales. At ${inputs.csl.toFixed(1)}% cycle service, expect to run out in about 1 delivery cycle in ${odds}.`
        : `This replay: ${sim.orders.length} orders and no stockouts. At ${inputs.csl.toFixed(1)}% cycle service, expect to run out in about 1 delivery cycle in ${odds}. Lower the service level or add lead-time variation, then replay.`;
    }
  }

  function setTable() {
    const rows = sim.days.map((d) => {
      const tr = document.createElement('tr');
      const events: string[] = [];
      if (d.arrived) events.push(`Delivery +${d.arrived.toFixed(1)} kg`);
      if (d.ordered) events.push('Order placed');
      if (d.unmet > 1e-6) events.push(`Ran out: ${d.unmet.toFixed(1)} kg lost`);
      for (const v of [String(d.day), kg(d.demand), kg(d.end), kg(d.position), events.join('; ') || '—']) {
        const td = document.createElement('td');
        td.textContent = v;
        tr.append(td);
      }
      return tr;
    });
    table.replaceChildren(...rows);
  }

  // ---------- chart ----------
  let geom = { w: 0, h: 0, l: 44, rgt: 14, t: 18, b: 30, yMax: 1 };
  const x = (v: number) => geom.l + (v / HORIZON) * (geom.w - geom.l - geom.rgt);
  const y = (v: number) => geom.t + (1 - v / geom.yMax) * (geom.h - geom.t - geom.b);

  function drawKey() {
    const key = root.querySelector<HTMLElement>('[data-key]');
    if (!key) return;
    const items: [string, string][] = [
      ['k-line', 'Stock on the shelf'],
      ['k-dash', `Reorder point ${kg(p.rop)}`],
      ['k-band', `Safety stock ${kg(p.ss)}`],
      ['k-dot', 'Order placed'],
    ];
    if (sim.stockouts.length) items.push(['k-diamond', 'Stockout']);
    key.replaceChildren(
      ...items.map(([cls, text]) => {
        const li = document.createElement('li');
        const swatch = document.createElement('span');
        swatch.className = cls;
        swatch.setAttribute('aria-hidden', 'true');
        li.append(swatch, text);
        return li;
      }),
    );
  }

  function drawChart() {
    const w = Math.max(280, chart.clientWidth);
    const narrow = w < 520;
    const h = narrow ? 240 : 290;
    const peak = Math.max(p.rop, ...sim.path.map(([, v]) => v));
    const step = niceStep(peak * 1.08);
    const yMax = Math.ceil((peak * 1.08) / step) * step;
    geom = { w, h, l: 44, rgt: 14, t: 18, b: 30, yMax };

    const root = svg('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: 'lab-svg', 'aria-hidden': 'true' });

    for (let v = 0; v <= yMax + 1e-9; v += step) {
      root.append(svg('line', { x1: geom.l, x2: w - geom.rgt, y1: y(v), y2: y(v), class: 'grid' }));
      const t = svg('text', { x: geom.l - 8, y: y(v) + 4, class: 'tick', 'text-anchor': 'end' });
      t.textContent = String(Math.round(v * 10) / 10);
      root.append(t);
    }
    const xStep = narrow ? 20 : 10;
    for (let dday = 0; dday <= HORIZON; dday += xStep) {
      const t = svg('text', { x: x(dday), y: h - 8, class: 'tick', 'text-anchor': dday === 0 ? 'start' : dday === HORIZON ? 'end' : 'middle' });
      t.textContent = dday === 0 ? 'Day 0' : String(dday);
      root.append(t);
    }
    const unit = svg('text', { x: geom.l - 8, y: 10, class: 'tick', 'text-anchor': 'end' });
    unit.textContent = 'kg';
    root.append(unit);

    // Safety stock band and reorder point line.
    if (p.ss > 0) {
      root.append(svg('rect', { x: geom.l, y: y(p.ss), width: w - geom.l - geom.rgt, height: y(0) - y(p.ss), class: 'ss-band' }));
    }
    root.append(svg('line', { x1: geom.l, x2: w - geom.rgt, y1: y(p.rop), y2: y(p.rop), class: 'rop-line' }));

    // Stock path.
    const pts = sim.path.map(([a, b]) => `${x(a).toFixed(1)},${y(Math.max(0, b)).toFixed(1)}`);
    root.append(svg('path', { d: `M${x(0)},${y(0)} L${pts.join(' L')} L${x(sim.path[sim.path.length - 1][0])},${y(0)} Z`, class: 'inv-area' }));
    root.append(svg('polyline', { points: pts.join(' '), class: 'inv-line' }));

    // Orders and stockouts.
    sim.orders.forEach((o) => root.append(svg('circle', { cx: x(o.t), cy: y(o.level), r: 4.5, class: 'order-dot' })));
    sim.stockouts.forEach((dday) => {
      const cx = x(dday + 0.5), cy = y(0);
      root.append(svg('path', { d: `M${cx},${cy - 7} L${cx + 6},${cy} L${cx},${cy + 7} L${cx - 6},${cy} Z`, class: 'stockout' }));
    });

    // Direct labels on wider charts only (the key below the chart always carries them).
    // Each label tries the right end, then the left end, then sits higher, so it never lands on a marker.
    if (!narrow) {
      const textWidth = (t: string) => t.length * 6.6 + 8;
      const markerNear = (x0: number, x1: number, yLine: number) =>
        sim.orders.some((o) => x(o.t) > x0 - 10 && x(o.t) < x1 + 10 && Math.abs(y(o.level) - yLine) < 22);
      if (p.ss > 0) {
        const tall = y(0) - y(p.ss) >= 18;
        const label = svg('text', { x: geom.l + 8, y: tall ? y(0) - 7 : y(p.ss) - 6, class: 'ref-label' });
        label.textContent = `Safety stock ${kg(p.ss)}`;
        root.append(label);
      }
      const ropText = `Reorder point ${kg(p.rop)}`;
      const ropW = textWidth(ropText);
      const right = { x0: w - geom.rgt - 4 - ropW, x1: w - geom.rgt - 4 };
      const left = { x0: geom.l + 8, x1: geom.l + 8 + ropW };
      const ropAt = !markerNear(right.x0, right.x1, y(p.rop)) ? 'right'
        : !markerNear(left.x0, left.x1, y(p.rop)) && !(p.ss > 0 && y(0) - y(p.rop) < 30) ? 'left'
        : 'right-high';
      const ropY = y(p.rop) - (ropAt === 'right-high' ? 24 : 7);
      const ropLabel = svg('text', { x: ropAt === 'left' ? left.x0 : right.x1, y: ropY, class: 'ref-label', 'text-anchor': ropAt === 'left' ? 'start' : 'end' });
      ropLabel.textContent = ropText;
      root.append(ropLabel);
      const ropBox = { x0: ropAt === 'left' ? left.x0 : right.x0, x1: ropAt === 'left' ? left.x1 : right.x1, y: ropY };

      const first = sim.orders[0];
      if (first) {
        const lw = textWidth('Order placed');
        const ly = y(first.level) + 17;
        const overlapsRop = (x0: number, x1: number) => x1 > ropBox.x0 && x0 < ropBox.x1 && Math.abs(ly - ropBox.y) < 16;
        const toRight = x(first.t) + 9 + lw < w - geom.rgt && !overlapsRop(x(first.t) + 9, x(first.t) + 9 + lw);
        const lbl = svg('text', { x: toRight ? x(first.t) + 9 : x(first.t) - 9, y: ly, class: 'ev-label', 'text-anchor': toRight ? 'start' : 'end' });
        lbl.textContent = 'Order placed';
        root.append(lbl);
      }
      if (sim.stockouts.length) {
        const lbl = svg('text', { x: x(sim.stockouts[0] + 0.5), y: y(0) - 12, class: 'ev-label ev-critical', 'text-anchor': 'middle' });
        lbl.textContent = '⚠ Stockout';
        root.append(lbl);
      }
    }

    // Crosshair (shown on hover or keyboard focus).
    const cross = svg('g', { class: 'cross', visibility: 'hidden' });
    cross.append(svg('line', { y1: geom.t, y2: h - geom.b, class: 'cross-line' }), svg('circle', { r: 4.5, class: 'cross-dot' }));
    root.append(cross);
    const hit = svg('rect', { x: geom.l, y: geom.t, width: w - geom.l - geom.rgt, height: h - geom.t - geom.b, class: 'hit' });
    root.append(hit);

    chart.querySelector('svg')?.remove();
    chart.prepend(root);

    hit.addEventListener('pointermove', (e) => {
      const rect = root.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * w;
      const dday = Math.round(((px - geom.l) / (w - geom.l - geom.rgt)) * HORIZON - 0.5);
      showDay(Math.min(HORIZON - 1, Math.max(0, dday)));
    });
    hit.addEventListener('pointerleave', hideTip);

    const outs = sim.stockouts.length;
    chart.setAttribute(
      'aria-label',
      `Chart of stock on the shelf over ${HORIZON} days. Safety stock ${kg(p.ss)}, reorder point ${kg(p.rop)}, ${sim.orders.length} orders placed, ${outs} ${outs === 1 ? 'day' : 'days'} with a stockout. Use the left and right arrow keys to read each day.`,
    );
    if (hover >= 0) showDay(hover);
  }

  function showDay(i: number) {
    hover = i;
    const d = sim.days[i];
    const cross = chart.querySelector<SVGGElement>('.cross');
    if (!d || !cross) return;
    const cx = x(i + 0.5);
    const mid = (d.start + d.end) / 2;
    cross.setAttribute('visibility', 'visible');
    cross.querySelector('line')!.setAttribute('x1', String(cx));
    cross.querySelector('line')!.setAttribute('x2', String(cx));
    const dot = cross.querySelector('circle')!;
    dot.setAttribute('cx', String(cx));
    dot.setAttribute('cy', String(y(Math.max(0, mid))));

    const lines: [string, string][] = [
      [kg(d.end), 'on the shelf at close'],
      [kg(d.position), 'inventory position'],
      [kg(d.demand), 'demand that day'],
    ];
    const events: string[] = [];
    if (d.arrived) events.push(`Delivery arrived: +${kg(d.arrived)}`);
    if (d.ordered) events.push(`Order placed for ${kg(inputs.Q)}`);
    if (d.unmet > 1e-6) events.push(`⚠ Ran out: ${kg(d.unmet)} of sales lost`);
    const head = document.createElement('p');
    head.className = 'tip-day';
    head.textContent = `Day ${i}`;
    const rows = lines.map(([v, label]) => {
      const row = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = v;
      row.append(strong, ` ${label}`);
      return row;
    });
    const ev = events.map((t) => {
      const e = document.createElement('p');
      e.className = t.startsWith('⚠') ? 'tip-ev tip-critical' : 'tip-ev';
      e.textContent = t;
      return e;
    });
    tip.replaceChildren(head, ...rows, ...ev);
    tip.hidden = false;
    const left = (cx / geom.w) * chart.clientWidth;
    const tw = tip.offsetWidth;
    const room = chart.clientWidth - tw - 8;
    tip.style.left = `${Math.max(8, Math.min(room, left > chart.clientWidth / 2 ? left - tw - 14 : left + 14))}px`;
    tip.style.top = `${geom.t + 4}px`;
  }

  function hideTip() {
    tip.hidden = true;
    chart.querySelector('.cross')?.setAttribute('visibility', 'hidden');
  }

  chart.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? HORIZON - 1 : (hover < 0 ? 0 : hover + (e.key === 'ArrowRight' ? 1 : -1));
      showDay(Math.min(HORIZON - 1, Math.max(0, next)));
    } else if (e.key === 'Escape') {
      hover = -1;
      hideTip();
    }
  });
  chart.addEventListener('focus', () => { if (hover < 0) showDay(0); });
  chart.addEventListener('blur', () => { hover = -1; hideTip(); });

  function update() {
    p = plan(inputs);
    sim = mode === 'steady' ? steady(inputs, p, HORIZON) : bumpy(inputs, p, seed, HORIZON);
    setResults();
    setTable();
    drawChart();
    drawKey();
  }

  ranges.forEach((el) => {
    paintRange(el);
    el.addEventListener('input', () => {
      (inputs as unknown as Record<string, number>)[el.name] = Number(el.value);
      paintRange(el);
      update();
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) =>
    btn.addEventListener('click', () => {
      Object.assign(inputs, PRESETS[btn.dataset.preset!]);
      ranges.forEach((el) => { el.value = String((inputs as unknown as Record<string, number>)[el.name]); paintRange(el); });
      update();
    }),
  );

  root.querySelectorAll<HTMLInputElement>('input[name="ss-mode"]').forEach((el) =>
    el.addEventListener('change', () => {
      mode = el.value === 'bumpy' ? 'bumpy' : 'steady';
      replay.hidden = mode !== 'bumpy';
      update();
    }),
  );
  replay.addEventListener('click', () => { seed += 1; update(); });

  let lastWidth = 0;
  new ResizeObserver(() => {
    const w = chart.clientWidth;
    if (sim && Math.abs(w - lastWidth) > 1) { lastWidth = w; drawChart(); }
  }).observe(chart);
  update();
  lastWidth = chart.clientWidth;
}
