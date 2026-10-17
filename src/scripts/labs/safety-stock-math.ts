// Pure maths for the safety stock lab. No DOM here, so it can be checked from Node.

export interface Inputs {
  d: number;      // average demand per day
  sd: number;     // standard deviation of daily demand
  L: number;      // lead time in days
  sL: number;     // standard deviation of lead time in days
  csl: number;    // cycle service level, 0-100
  Q: number;      // order quantity
}

export interface Plan {
  z: number;
  sigmaDL: number; // standard deviation of demand over the lead time
  ss: number;
  rop: number;
  avg: number;     // average inventory ≈ Q/2 + SS
}

/** Inverse of the standard normal CDF (Acklam's algorithm, relative error below 1.2e-9). */
export function invNorm(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - lo) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function plan(i: Inputs): Plan {
  const z = Math.max(0, invNorm(i.csl / 100));
  const sigmaDL = Math.sqrt(i.L * i.sd * i.sd + i.d * i.d * i.sL * i.sL);
  const ss = z * sigmaDL;
  return { z, sigmaDL, ss, rop: i.d * i.L + ss, avg: i.Q / 2 + ss };
}

export interface Day {
  day: number;
  demand: number;
  start: number;     // on hand at the start of the day
  end: number;       // on hand at the end of the day
  position: number;  // inventory position at the end of the day, after any new order
  ordered: boolean;
  arrived: number;   // quantity delivered during the day
  unmet: number;     // demand lost because the shelf was empty
}

export interface Sim {
  days: Day[];
  path: [number, number][]; // (day, on hand) points for the chart, with vertical jumps at deliveries
  orders: { t: number; level: number }[];
  stockouts: number[];      // days with unmet demand
  lost: number;
}

/** Small seeded generator (mulberry32) so a replay is repeatable. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(next: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = next();
  while (v === 0) v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Textbook case: demand exactly d every day and deliveries exactly L days after ordering.
 * Stock falls from SS + Q to SS, and each delivery lands just as stock touches SS.
 */
export function steady(i: Inputs, p: Plan, horizon = 60): Sim {
  const top = p.ss + i.Q;
  const cycle = i.Q / i.d; // days between deliveries
  const level = (t: number) => top - i.d * (t - Math.floor(t / cycle + 1e-9) * cycle);
  const path: [number, number][] = [[0, top]];
  for (let k = 1; k * cycle < horizon; k++) path.push([k * cycle, p.ss], [k * cycle, top]);
  path.push([horizon, level(horizon - 1e-6)]);

  const orders: { t: number; level: number }[] = [];
  for (let k = 1; k * cycle - i.L < horizon; k++) {
    const t = k * cycle - i.L; // this order lands at k * cycle
    if (t >= 0) orders.push({ t, level: level(t) });
  }
  const onOrderAt = (t: number) => {
    let n = 0;
    for (let k = 1; k * cycle - i.L <= t; k++) if (t < k * cycle) n++;
    return n * i.Q;
  };

  const days: Day[] = [];
  for (let day = 0; day < horizon; day++) {
    let arrived = 0;
    for (let k = 1; k * cycle < day + 1; k++) if (k * cycle >= day) arrived += i.Q;
    const tEnd = day + 1 - 1e-6;
    const end = level(tEnd);
    days.push({
      day,
      demand: i.d,
      start: level(day),
      end,
      position: end + onOrderAt(tEnd),
      ordered: orders.some((o) => o.t >= day && o.t < day + 1),
      arrived,
      unmet: 0,
    });
  }
  return { days, path, orders, stockouts: [], lost: 0 };
}

/**
 * Real life: daily demand and delivery times vary. Stock is reviewed 12 times a day
 * (close to continuous review, which the formulas assume), each order is placed when
 * inventory position reaches the reorder point, and demand is lost when the shelf is empty.
 */
export function bumpy(i: Inputs, p: Plan, seed: number, horizon = 60): Sim {
  const S = 12; // reviews per day
  const next = rng(seed);
  let onHand = p.ss + i.Q;
  const pipeline: { at: number; qty: number }[] = []; // arrival step index
  const days: Day[] = [];
  const path: [number, number][] = [[0, onHand]];
  const orders: { t: number; level: number }[] = [];
  const stockouts: number[] = [];
  let lost = 0;
  for (let day = 0; day < horizon; day++) {
    const demand = Math.max(0, Math.round((i.d + i.sd * gauss(next)) * 10) / 10);
    const start = onHand;
    let arrived = 0;
    let unmet = 0;
    let ordered = false;
    for (let s = 0; s < S; s++) {
      const step = day * S + s;
      let landed = 0;
      for (let k = pipeline.length - 1; k >= 0; k--) {
        if (pipeline[k].at <= step) { landed += pipeline[k].qty; pipeline.splice(k, 1); }
      }
      if (landed) { onHand += landed; arrived += landed; path.push([step / S, onHand]); }
      const want = demand / S;
      const served = Math.min(onHand, want);
      unmet += want - served;
      onHand -= served;
      path.push([(step + 1) / S, onHand]);
      const position = onHand + pipeline.reduce((sum, x) => sum + x.qty, 0);
      if (position <= p.rop + 1e-9) {
        const lead = Math.max(1, Math.round(i.L + i.sL * gauss(next)));
        pipeline.push({ at: step + 1 + lead * S, qty: i.Q });
        orders.push({ t: (step + 1) / S, level: onHand });
        ordered = true;
      }
    }
    if (unmet > 1e-6) { stockouts.push(day); lost += unmet; }
    const position = onHand + pipeline.reduce((sum, x) => sum + x.qty, 0);
    days.push({ day, demand, start, end: onHand, position, ordered, arrived, unmet });
  }
  return { days, path, orders, stockouts, lost };
}
