// Funciones puras de cálculo — extraídas byte-a-byte de
// mi_plan_v1_5_0a_3.html. Etapa 1 · Paso 3 · Tanda 2.
// NO se refactoriza ni se cambia lógica: solo se añade `export`.
// El verificador (scripts/verify-lib.mjs) compara CADA función contra la
// versión original del HTML, valor-a-valor, con reloj y RNG mockeados.
//
// Dependencias arrastradas (decisión del usuario):
//  - fmtEur (formateador puro, L147)        -> usado por computeActivePhase / computeNextStep
//  - STANDARD_PLAN_REFERENCE (constante, L5001) -> usado por projectStandardPlan
//  - getSavingsTier depende de T (tokens, ya migrados en Tanda 1) -> import abajo
import { T } from '../tokens/index.js'

// ---------- Formatters (arrastrado: fmtEur) ----------
export const fmtEur = (n) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2) + 'M€';
  if (abs >= 10_000) return Math.round(n / 1_000) + 'k€';
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'k€';
  return Math.round(n) + '€';
};

// ---------- Projection engine ----------
// Returns monthly series with: month, age, portfolio, invested, growth
export function project({ age, retireAge, capital, monthly, ret }) {
  const months = Math.max(0, Math.round((retireAge - age) * 12));
  const r = Math.pow(1 + ret / 100, 1 / 12) - 1;
  const series = [];
  let p = capital;
  let invested = capital;
  for (let i = 0; i <= months; i++) {
    series.push({
      month: i,
      age: age + i / 12,
      portfolio: p,
      invested,
      growth: p - invested,
    });
    p = p * (1 + r) + monthly;
    invested += monthly;
  }
  return series;
}

// Compute when capital reaches a target amount; returns {age, months} or null
export function timeToGoal({ age, capital, monthly, ret, target }) {
  if (capital >= target) return { age, months: 0 };
  const r = Math.pow(1 + ret / 100, 1 / 12) - 1;
  let p = capital;
  for (let i = 1; i <= 12 * 80; i++) {
    p = p * (1 + r) + monthly;
    if (p >= target) return { age: age + i / 12, months: i };
  }
  return null;
}

// "How much do I need monthly to reach target by age X with capital and return?"
export function monthlyForGoal({ age, targetAge, capital, ret, target }) {
  const n = Math.max(1, Math.round((targetAge - age) * 12));
  const r = Math.pow(1 + ret / 100, 1 / 12) - 1;
  // FV = capital*(1+r)^n + monthly * ((1+r)^n - 1)/r ⇒ solve for monthly
  const growth = Math.pow(1 + r, n);
  const futureCapital = capital * growth;
  const remaining = target - futureCapital;
  if (remaining <= 0) return 0;
  return remaining * r / (growth - 1);
}

// ---------- v2 utilities: dates, ids, segments ----------
export const uid = () => Math.random().toString(36).slice(2, 9);

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKeyFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonthsKey(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, (m - 1) + n, 1);
  return monthKeyFromDate(d);
}

export function compareKeys(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isKeyInSegment(key, seg) {
  if (!seg.from) return false;
  if (compareKeys(key, seg.from) < 0) return false;
  if (seg.to && compareKeys(key, seg.to) > 0) return false;
  return true;
}

export function findActiveSegment(segs, key) {
  if (!segs || !segs.length) return null;
  // last matching wins, so user can layer overrides
  let match = null;
  for (const s of segs) if (isKeyInSegment(key, s)) match = s;
  return match;
}

export function sumActiveSegments(segs, key) {
  if (!segs || !segs.length) return 0;
  return segs.reduce((sum, s) => isKeyInSegment(key, s) ? sum + (Number(s.amount) || 0) : sum, 0);
}

// ---------- tramo overlap detection / normalization ----------
// Two segments overlap if their [from, to] ranges intersect.
// Returns array of overlap ids: [id1, id2] pairs.
export function detectSegmentOverlaps(segs) {
  if (!segs || segs.length < 2) return [];
  const list = [];
  const norm = segs.filter(s => s && s.from).map(s => ({ id: s.id, from: s.from, to: s.to || '9999-12' }));
  for (let i = 0; i < norm.length; i++) {
    for (let j = i + 1; j < norm.length; j++) {
      const a = norm[i], b = norm[j];
      if (a.from <= b.to && b.from <= a.to) {
        list.push([a.id, b.id]);
      }
    }
  }
  return list;
}

export function segmentHasOverlap(segs, id) {
  return detectSegmentOverlaps(segs).some(([a, b]) => a === id || b === id);
}

// Sort segments by `from` ascending and auto-close trailing `to` dates to avoid
// overlap with the next segment's `from`. Returns a new array.
export function normalizeSegments(segs) {
  if (!segs || !segs.length) return segs || [];
  const sorted = [...segs].filter(s => s && s.from).sort((a, b) => compareKeys(a.from, b.from));
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    const s = { ...sorted[i] };
    const next = sorted[i + 1];
    // If there's a next segment AND this one extends into or past it → cap to.
    if (next && (!s.to || compareKeys(s.to, next.from) >= 0)) {
      s.to = addMonthsKey(next.from, -1);
      // If the cap puts `to` before `from`, drop this segment (covered fully by next)
      if (compareKeys(s.to, s.from) < 0) continue;
    }
    out.push(s);
  }
  return out;
}

export function readableMonth(key) {
  if (!key) return '—';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).replace('.', '');
}

// ---------- v2 projection engine ----------
// Walks month-by-month, using income/bonus/saving segments + events.
// Returns series with: monthIndex, key, age, year, portfolio, aportado, growth, monthlyIncome, monthlyAporte
export function projectV2(plan, profile, opts = {}) {
  const r = Math.pow(1 + (plan.annualReturn || 0) / 100, 1 / 12) - 1;
  const includeHypothetical = opts.includeHypothetical !== false;
  const flatMonthly = opts.flatMonthly; // if number, override saving segments
  const startKey = opts.startKey || todayKey();
  const startCapital = opts.capital != null ? opts.capital : (plan.capital || 0);
  // Optional: weighted return for the legacy (starting) capital. When set, the
  // engine tracks two sub-portfolios: the starting capital compounds at this
  // rate (reflects "what your money is doing right now") while future
  // contributions compound at the plan's annualReturn (the target return for
  // money you intentionally invest from now on). When undefined or equal to
  // the plan rate, behaviour is identical to v4.
  const useSplit = opts.effectiveReturn != null && opts.effectiveReturn !== plan.annualReturn;
  const rLegacy = useSplit
    ? Math.pow(1 + opts.effectiveReturn / 100, 1 / 12) - 1
    : r;
  // Optional: explicit number of months to project (overrides the default age→retireAge span).
  // Useful when projecting from a past date so the curve reaches retireAge.
  let months;
  if (opts.months != null) {
    months = Math.max(0, Math.round(opts.months));
  } else if (opts.endAge != null) {
    const [sy, sm] = startKey.split('-').map(Number);
    const [ty, tm] = todayKey().split('-').map(Number);
    const monthsFromStartToToday = (ty - sy) * 12 + (tm - sm);
    const startAge = profile.age - monthsFromStartToToday / 12;
    months = Math.max(0, Math.round((opts.endAge - startAge) * 12));
  } else {
    months = Math.max(0, Math.round((profile.retireAge - profile.age) * 12));
  }
  // Optional: when projecting historical reality, real contributions override
  // segment-based aporte for each matching month key.
  const actualByKey = opts.actualByKey || null;
  // Reference age for the start of the series — used to compute `age` per row
  // when projecting from a past date. Defaults to profile.age (today).
  let startAge;
  if (opts.startAge != null) {
    startAge = opts.startAge;
  } else {
    const [sy, sm] = startKey.split('-').map(Number);
    const [ty, tm] = todayKey().split('-').map(Number);
    const monthsFromStartToToday = (ty - sy) * 12 + (tm - sm);
    startAge = profile.age - monthsFromStartToToday / 12;
  }

  let p = startCapital;
  let aportado = startCapital;
  // Split-portfolio bookkeeping. Only used when useSplit is true.
  let legacyP = startCapital;
  let newP = 0;
  const series = [];

  // Precompute event lookup by key
  const eventsByKey = {};
  (plan.events || []).forEach(e => {
    if (!includeHypothetical && e.status === 'hipotetico') return;
    if (!eventsByKey[e.date]) eventsByKey[e.date] = 0;
    eventsByKey[e.date] += Number(e.amount) || 0;
  });

  // B3 · Salary IPC growth. Compound multiplicative growth applied to income +
  // bonus at month m, sized by salaryInflationFactor (1.0 = full IPC tracking,
  // 0.0 = none, 0..1 = partial). Plan's inflationRate is the IPC reference.
  // This only applies during accumulation (projectV2). Decumulation is handled
  // separately by projectDecumulation and is not touched.
  const annualIPC = (plan.inflationRate != null ? plan.inflationRate : 2.5) / 100;
  const salaryFactor = plan.salaryInflationFactor != null ? plan.salaryInflationFactor : 1.0;
  const monthlySalaryGrowth = annualIPC * salaryFactor > 0
    ? Math.pow(1 + annualIPC * salaryFactor, 1 / 12) - 1
    : 0;

  for (let m = 0; m <= months; m++) {
    const key = addMonthsKey(startKey, m);
    const [yy, mm] = key.split('-').map(Number);

    const salaryMultiplier = monthlySalaryGrowth > 0
      ? Math.pow(1 + monthlySalaryGrowth, m)
      : 1;
    const income = sumActiveSegments(plan.incomeSegments, key) * salaryMultiplier;
    const bonus = sumActiveSegments(plan.bonusSegments, key) * salaryMultiplier;
    const totalIncome = income + bonus;

    let aporte = 0;
    // Real contribution override takes precedence — used for historical reconstruction.
    const hasActual = actualByKey && Object.prototype.hasOwnProperty.call(actualByKey, key)
      && actualByKey[key] != null;
    if (hasActual) {
      aporte = Number(actualByKey[key]) || 0;
    } else if (flatMonthly != null) {
      aporte = flatMonthly;
    } else {
      const seg = findActiveSegment(plan.savingSegments, key);
      if (seg) {
        if (seg.type === 'percent') aporte = totalIncome * ((Number(seg.value) || 0) / 100);
        else aporte = Number(seg.value) || 0;
      }
    }
    // extraMonthly is added on top, regardless of segment logic
    if (opts.extraMonthly && m > 0) aporte += opts.extraMonthly;

    const eventTotal = eventsByKey[key] || 0;

    // For m=0 we record initial state without adding new contributions
    if (m > 0) {
      if (useSplit) {
        legacyP = legacyP * (1 + rLegacy);
        newP = newP * (1 + r) + aporte + eventTotal;
        p = legacyP + newP;
      } else {
        p = p * (1 + r) + aporte + eventTotal;
      }
      aportado += aporte + eventTotal;
    }

    series.push({
      monthIndex: m,
      key,
      year: yy,
      monthOfYear: mm,
      age: startAge + m / 12,
      portfolio: p,
      aportado,
      growth: p - aportado,
      monthlyIncome: totalIncome,
      monthlyAporte: aporte + eventTotal,
      monthlyEvents: eventTotal,
      isHypotheticalRelevant: eventTotal > 0 && (plan.events || []).some(e => e.date === key && e.status === 'hipotetico'),
    });
  }
  return series;
}

// Currently active monthly aporte for a plan (used in many UI places)
// ----------------------------------------------------------------------------
// "Antes de Mi Plan" helpers — used in the mirror screen and to feed projectV2
// with a weighted return that reflects the user's actual capital allocation.
// All read-only: never mutate state.
// ----------------------------------------------------------------------------

// Sum of declared monthly expenses. 0 if not completed.
export function sumExpenses(actualLife) {
  if (!actualLife || !actualLife.expenses) return 0;
  const e = actualLife.expenses;
  return (e.housing || 0) + (e.food || 0) + (e.transport || 0)
       + (e.subscriptions || 0) + (e.other || 0);
}

// Total weight of the allocation buckets (in %). Used to validate sums to 100.
export function sumAllocation(actualLife) {
  if (!actualLife || !actualLife.allocation) return 0;
  const a = actualLife.allocation;
  return (a.cash || 0) + (a.deposits || 0) + (a.fundsEtfs || 0)
       + (a.pensionPlan || 0) + (a.other || 0);
}

// Weighted average nominal return for the starting capital, based on where the
// user has declared their money lives today. Returns null when the mini-onboarding
// is not complete or when no allocation has been declared — callers should fall
// back to plan.annualReturn in that case.
export function computeEffectiveCapitalReturn(plan) {
  const al = plan && plan.actualLife;
  if (!al || !al.completed) return null;
  const a = al.allocation || {};
  const cr = a.customReturns || {};
  const planReturn = plan.annualReturn || 0;
  const returns = {
    cash: 0,
    deposits: cr.deposits != null ? cr.deposits : 2.0,
    fundsEtfs: cr.fundsEtfs != null ? cr.fundsEtfs : planReturn,
    pensionPlan: cr.pensionPlan != null ? cr.pensionPlan : planReturn,
    other: cr.other != null ? cr.other : 0,
  };
  const weights = {
    cash: a.cash || 0, deposits: a.deposits || 0, fundsEtfs: a.fundsEtfs || 0,
    pensionPlan: a.pensionPlan || 0, other: a.other || 0,
  };
  const totalW = weights.cash + weights.deposits + weights.fundsEtfs
               + weights.pensionPlan + weights.other;
  if (totalW <= 0) return null;
  const numerator = returns.cash * weights.cash
                  + returns.deposits * weights.deposits
                  + returns.fundsEtfs * weights.fundsEtfs
                  + returns.pensionPlan * weights.pensionPlan
                  + returns.other * weights.other;
  return numerator / totalW;
}

// French-amortisation schedule for a fixed-rate mortgage. Returns one row per
// year with principal paid, interest paid, and remaining balance. Used by the
// "coste oculto" chart. For variable mortgages the caller passes the resolved
// rate (euribor + spread).
export function buildMortgageSchedule(mortgage) {
  if (!mortgage || !mortgage.enabled) return [];
  const principal = Number(mortgage.originalAmount) || 0;
  const years = Math.max(1, Math.round(Number(mortgage.termYears) || 30));
  const startYear = Number(mortgage.startYear) || new Date().getFullYear();
  const rate = mortgage.type === 'variable'
    ? ((Number(mortgage.euriborRef) || 0) + (Number(mortgage.spread) || 0)) / 100
    : (Number(mortgage.fixedRate) || 0) / 100;
  if (principal <= 0 || rate < 0) return [];
  const n = years * 12;
  const rM = rate / 12;
  // French formula: cuota = P · r / (1 - (1+r)^-n)
  const monthlyPayment = rM === 0 ? principal / n
    : principal * rM / (1 - Math.pow(1 + rM, -n));
  let balance = principal;
  const rows = [];
  for (let y = 0; y < years; y++) {
    let principalThisYear = 0;
    let interestThisYear = 0;
    for (let mo = 0; mo < 12; mo++) {
      const interest = balance * rM;
      const principalPart = Math.max(0, monthlyPayment - interest);
      interestThisYear += interest;
      principalThisYear += principalPart;
      balance = Math.max(0, balance - principalPart);
    }
    rows.push({
      year: startYear + y,
      principal: principalThisYear,
      interest: interestThisYear,
      balance,
    });
  }
  return rows;
}

export function currentMonthlyAporte(plan) {
  return computePlannedFor(plan, todayKey());
}

// Compute the planned aporte for ANY specific month (based on tramos at that date)
export function computePlannedFor(plan, key) {
  const seg = findActiveSegment(plan.savingSegments, key);
  if (!seg) return 0;
  if (seg.type === 'percent') {
    const income = sumActiveSegments(plan.incomeSegments, key);
    const bonus = sumActiveSegments(plan.bonusSegments, key);
    return Math.round((income + bonus) * (Number(seg.value) || 0) / 100);
  }
  return Number(seg.value) || 0;
}

// Compute the income (salary + complements) for a given month
export function computeIncomeFor(plan, key) {
  return sumActiveSegments(plan.incomeSegments, key) + sumActiveSegments(plan.bonusSegments, key);
}

export function currentMonthlyIncome(plan) {
  const key = todayKey();
  return sumActiveSegments(plan.incomeSegments, key) + sumActiveSegments(plan.bonusSegments, key);
}

// Convert a future nominal value to today's purchasing power.
// monthsFromNow: months between today and the value's date.
export function toRealEur(nominalValue, monthsFromNow, inflationRate) {
  const rate = (inflationRate != null ? inflationRate : 2.5) / 100;
  const years = (monthsFromNow || 0) / 12;
  return nominalValue / Math.pow(1 + rate, years);
}

// ============================================================
// Decumulation engine — post-retirement portfolio drawdown.
// Bengen-style fixed-real: first-year withdrawal = `withdrawalRate%` of
// starting capital, then adjusted for inflation each subsequent year.
// Portfolio grows at `annualReturn` between draws.
//
// Research context (May 2026):
//  - Bengen (Aug 2025): historical SAFEMAX revised to 4.7% (1926-2024)
//  - Morningstar (2026): forward-looking 3.9% for 30-yr / 90% success
//  - Spanish FIRE community: 3.0-3.5% for 50+ year horizons
// ============================================================
export function projectDecumulation(startCapital, plan, fromAge, toAge, opts = {}) {
  const annualReturn = plan.annualReturn || 0;
  const monthlyReturn = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
  const annualInflation = plan.inflationRate != null ? plan.inflationRate : 2.5;
  const monthlyInflation = Math.pow(1 + annualInflation / 100, 1 / 12) - 1;
  const withdrawalRatePct = opts.withdrawalRate != null
    ? opts.withdrawalRate
    : (plan.withdrawalRate != null ? plan.withdrawalRate : 4.0);

  const months = Math.max(0, Math.round((toAge - fromAge) * 12));
  const initialAnnualWithdrawal = startCapital * (withdrawalRatePct / 100);
  let capital = startCapital;
  let monthlyWithdrawal = initialAnnualWithdrawal / 12;
  const series = [];
  let depletedAtMonth = null;

  // Public pension (Spain by default): starts at pension.startAge, monthly amount
  // grows with inflation each month, and is added on top of portfolio withdrawal.
  const pen = plan.publicPension || null;
  const penEnabled = pen && pen.enabled && pen.monthlyAmount > 0;
  const penStartAge = penEnabled ? (pen.startAge || 67) : null;

  for (let m = 0; m <= months; m++) {
    const ageNow = fromAge + m / 12;
    // Pension contribution at this month (inflation-adjusted from start age)
    let pensionThisMonth = 0;
    if (penEnabled && ageNow >= penStartAge) {
      const monthsSincePension = (ageNow - penStartAge) * 12;
      pensionThisMonth = pen.monthlyAmount * Math.pow(1 + monthlyInflation, monthsSincePension);
    }
    series.push({
      monthIndex: m,
      portfolio: Math.max(0, capital),
      withdrawal: monthlyWithdrawal,
      pension: pensionThisMonth,
      totalIncome: monthlyWithdrawal + pensionThisMonth,
      annualWithdrawal: monthlyWithdrawal * 12,
      phase: 'decumulation',
    });
    if (capital <= 0) {
      if (depletedAtMonth === null) depletedAtMonth = m;
      capital = 0;
      monthlyWithdrawal = 0;
    } else if (m < months) {
      capital = capital * (1 + monthlyReturn) - monthlyWithdrawal;
      if (capital < 0) capital = 0;
      monthlyWithdrawal *= (1 + monthlyInflation);
    }
  }
  return { series, depletedAtMonth };
}

// ============================================================
// Spanish public pension estimator (May 2026 rules)
// Inputs:
//   - avgMonthlyContributionBase: estimate from user income (we use net as proxy)
//   - yearsContributed: years contributed at retirement
// Output: estimated monthly pension (in 14 pagas equivalence) + components
// References: BBVA Mi Jubilación, Caixabank, BOE
// ============================================================
export function estimateSpanishPension({ avgMonthlyBase, yearsContributed, retireYear }) {
  // 2026 caps (€/month in 14 pagas equivalent)
  const PENSION_MAX_MONTHLY = 3359.60;        // 47.034,40 €/año / 14
  const PENSION_MIN_MONTHLY = 888.70;          // 12.441,80 €/año / 14, sin cónyuge

  // Base reguladora ≈ avgMonthlyBase (approximation; user's net monthly used as proxy
  // for the average cotization base. Real BR sums 25 years of bases / 350, but for a
  // forward-looking estimate this is reasonable enough.)
  const br = Math.max(0, avgMonthlyBase || 0);

  // Percentage based on years contributed (2026 scale)
  let pct = 0;
  if (yearsContributed >= 15) {
    if (yearsContributed >= 36.5) {
      pct = 1.0;
    } else {
      const monthsExtra = (yearsContributed - 15) * 12;
      if (monthsExtra <= 49) {
        pct = 0.50 + monthsExtra * 0.0021;
      } else {
        pct = 0.50 + 49 * 0.0021 + (monthsExtra - 49) * 0.0019;
      }
      pct = Math.min(pct, 1.0);
    }
  }

  // Raw pension
  let pension = br * pct;
  // Apply caps
  if (pension > PENSION_MAX_MONTHLY) pension = PENSION_MAX_MONTHLY;
  if (pct >= 0.50 && pension < PENSION_MIN_MONTHLY) pension = PENSION_MIN_MONTHLY;
  if (pct === 0) pension = 0; // No contributory pension below 15 years

  return {
    monthly14: pension,                   // 14 pagas (the official figure)
    monthly12Equivalent: pension * 14 / 12, // equivalent if you'd average over 12 pagas
    annual: pension * 14,
    percentage: pct,
    cappedMax: pension === PENSION_MAX_MONTHLY,
    cappedMin: pct >= 0.50 && br * pct < PENSION_MIN_MONTHLY,
  };
}

// ============================================================
// Historical compound: compute current portfolio properly,
// applying monthly returns to past aportes instead of just summing them.
// ============================================================
export function computeCurrentPortfolio(plan, months, opts = {}) {
  const today = todayKey();
  const r = Math.pow(1 + (plan.annualReturn || 0) / 100, 1 / 12) - 1;
  // Optional split-portfolio bookkeeping. Mirrors projectV2's behaviour: the
  // starting capital compounds at effectiveReturn (where money lives today),
  // while past contributions compound at the plan return (deliberate inv.).
  const useSplit = opts.effectiveReturn != null && opts.effectiveReturn !== plan.annualReturn;
  const rLegacy = useSplit
    ? Math.pow(1 + opts.effectiveReturn / 100, 1 / 12) - 1
    : r;
  // Sort months chronologically
  const sorted = [...(months || [])].sort((a, b) => compareKeys(a.key, b.key));
  // Filter to those with a registered actual (otherwise no contribution to compounding)
  const registered = sorted.filter(m => m.actual != null);
  if (registered.length === 0) return plan.capital || 0;
  // Apply monthly growth + aporte from the EARLIEST registered month up to today.
  // For the initial capital, we compound from the first registered month onwards.
  const firstKey = registered[0].key;
  // Months between firstKey and today (inclusive on first, exclusive on today)
  const [fy, fm] = firstKey.split('-').map(Number);
  const [ty, tm] = today.split('-').map(Number);
  const totalMonths = (ty - fy) * 12 + (tm - fm);
  // Map registered actuals by key
  const actualByKey = new Map(registered.map(m => [m.key, m.actual]));
  let legacy = plan.capital || 0;
  let newP = 0;
  let p = plan.capital || 0;
  for (let i = 0; i <= totalMonths; i++) {
    const dt = new Date(fy, (fm - 1) + i, 1);
    const key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
    if (i > 0) {
      if (useSplit) {
        legacy = legacy * (1 + rLegacy);
        newP = newP * (1 + r);
        p = legacy + newP;
      } else {
        p = p * (1 + r);
      }
    }
    if (actualByKey.has(key)) {
      const aporte = actualByKey.get(key) || 0;
      if (useSplit) { newP += aporte; p = legacy + newP; }
      else { p += aporte; }
    }
  }
  return p;
}

// ============================================================
// Monte Carlo simulation — sequence of returns risk
//
// Methodology (researched May 2026):
//  - S&P 500 historical: μ ≈ 9.35% nominal, σ ≈ 15% (sometimes 18% conservative)
//  - Bonds: μ ≈ 4.5%, σ ≈ 5%
//  - We infer σ from the user's annualReturn: aggressive returns imply higher σ
//  - Apply box-muller transform for normal-distributed annual returns
//  - Run 500 simulations at annual resolution (compromise of speed vs precision)
//  - Report p10/p50/p90 portfolio paths + success rate
// ============================================================

// Box-Muller transform: turn two uniform U(0,1) into a standard normal N(0,1)
export function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Infer annual standard deviation from expected return.
// Mapping based on typical asset-class observations:
//   2-3%  return → 1-2% σ (cash / short-term bonds)
//   4-5%  return → 5-7% σ (bonds)
//   6-7%  return → 10-12% σ (balanced)
//   8-10% return → 14-17% σ (equity-heavy)
//   11-15% return → 18-22% σ (aggressive)
export function inferVolatility(annualReturnPct) {
  const r = annualReturnPct || 0;
  if (r <= 2) return 1.5;
  if (r <= 4) return 5;
  if (r <= 6) return 10;
  if (r <= 8) return 13;
  if (r <= 10) return 16;
  if (r <= 12) return 18;
  return 20;
}

// Quick percentile of a sorted array
export function percentile(sortedArr, p) {
  if (!sortedArr.length) return 0;
  const idx = Math.min(sortedArr.length - 1, Math.floor(p / 100 * sortedArr.length));
  return sortedArr[idx];
}

// Run Monte Carlo on the accumulation + decumulation cycle.
// Returns: { paths (sample), percentiles { p10, p25, p50, p75, p90 } per year,
//           successRate, depletionYears, depletionAgeStats, ... }
// `opts.sequenceMode`: 'random' (default), 'early-crash', or 'late-crash'.
// In early/late modes, each trial generates its returns randomly first, then
// the 5 worst years are *placed* at the start of decumulation (early-crash) or
// at the very end of the plan (late-crash). The rest of the years carry the
// remaining returns in random order. This isolates the sequence-of-returns risk.
export function runMonteCarlo(plan, profile, opts = {}) {
  const trials = opts.trials || 500;
  const startCapital = opts.startCapital != null ? opts.startCapital : (plan.capital || 0);
  const fromAge = profile.age;
  const retireAge = profile.retireAge;
  const lifeExp = plan.lifeExpectancy || 90;
  const yearsTotal = lifeExp - fromAge;
  if (yearsTotal <= 0) return { paths: [], percentiles: [], successRate: 1, yearsTotal: 0, depletionYears: [], depletionAgeStats: null, bandsByAge: [] };

  const annualReturn = plan.annualReturn || 0;
  const sigma = (opts.volatility != null ? opts.volatility : inferVolatility(annualReturn)) / 100;
  const mu = annualReturn / 100;
  // Use log-normal returns: each year return = exp(N(μ - σ²/2, σ))
  // This keeps the mean simple-return correct
  const muLog = Math.log(1 + mu) - 0.5 * sigma * sigma;

  // Calendario ANUAL de aporte derivado de projectV2 — el MISMO flujo que la curva
  // determinista de Proyección: salario creciente con IPC, progresión de tramos y
  // eventos. Antes el MC usaba un aporte PLANO (currentMonthlyAporte, solo el mes
  // actual) en todos los años → mediana ~2,4–2,8× por debajo de la curva en la misma
  // pantalla. El flag de eventos POSIBLES lo decide quien llama (opts.includeHypothetical),
  // igual que la curva hero — así MC y curva nunca se separan. Base = false (solo
  // confirmado, doctrina): no se da por seguro lo que solo "podría pasar".
  const includeHyp = (opts.includeHypothetical != null) ? opts.includeHypothetical : false;
  const accumYears = retireAge - fromAge;
  const detSeries = projectV2(plan, profile, { includeHypothetical: includeHyp }) || [];
  const annualAporteByYear = new Array(Math.max(0, accumYears)).fill(0);
  for (const pt of detSeries) {
    if (!pt || pt.monthIndex < 1) continue;            // m=0 es estado inicial, sin aporte
    const yIdx = Math.floor((pt.monthIndex - 1) / 12);
    if (yIdx >= 0 && yIdx < accumYears) annualAporteByYear[yIdx] += (pt.monthlyAporte || 0);
  }
  // Guarda: si la serie es más corta que los años de acumulación, replica el último año conocido.
  for (let i = 1; i < accumYears; i++) {
    if (annualAporteByYear[i] === 0 && annualAporteByYear[i - 1] > 0) annualAporteByYear[i] = annualAporteByYear[i - 1];
  }

  // Withdrawal during decumulation
  const withdrawalRate = (plan.withdrawalRate != null ? plan.withdrawalRate : 4.0) / 100;
  const inflationRate = (plan.inflationRate != null ? plan.inflationRate : 2.5) / 100;

  // Pension (annual)
  const pen = plan.publicPension || { enabled: false };
  const penEnabled = pen.enabled && (pen.monthlyAmount || 0) > 0;
  const penAnnual = penEnabled ? pen.monthlyAmount * 14 : 0; // 14 pagas
  const penStartAge = penEnabled ? (pen.startAge || 67) : null;

  // Pre-allocate arrays for performance: paths[trial][year] = portfolio
  // For memory efficiency, only keep p10/p50/p90 per year
  const valuesPerYear = Array.from({ length: yearsTotal + 1 }, () => []);
  let successful = 0;
  // Store a small sample (5 paths) for visualization
  const sampleSize = Math.min(5, trials);
  const samples = [];

  const yearsAccum = retireAge - fromAge;
  const yearsDecum = lifeExp - retireAge;
  const initialAnnualWithdrawal = startCapital; // placeholder, computed per trial

  // Sequence-of-returns config
  const sequenceMode = opts.sequenceMode || 'random';
  const crashWindow = Math.min(5, yearsTotal);
  const depletionYears = [];

  // Build the ordered list of returns for one trial, applying the sequence mode.
  const buildYearReturns = () => {
    const all = new Array(yearsTotal);
    for (let i = 0; i < yearsTotal; i++) {
      all[i] = Math.exp(muLog + sigma * randomNormal()) - 1;
    }
    if (sequenceMode === 'random' || yearsTotal <= crashWindow) return all;

    const sortedAsc = [...all].sort((a, b) => a - b);
    const worst = sortedAsc.slice(0, crashWindow);
    const rest = sortedAsc.slice(crashWindow);
    // Fisher–Yates shuffle on the "rest" so non-crash positions stay random
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    const out = new Array(yearsTotal);
    let placeStart;
    if (sequenceMode === 'early-crash') {
      // Anchor the worst window to the first year of decumulation
      placeStart = Math.max(0, Math.min(yearsAccum, yearsTotal - crashWindow));
    } else {
      // late-crash: anchor at the very end
      placeStart = yearsTotal - crashWindow;
    }
    for (let i = 0; i < crashWindow; i++) out[placeStart + i] = worst[i];
    let ri = 0;
    for (let y = 0; y < yearsTotal; y++) {
      if (y >= placeStart && y < placeStart + crashWindow) continue;
      out[y] = rest[ri++];
    }
    return out;
  };

  for (let t = 0; t < trials; t++) {
    let portfolio = startCapital;
    let firstYearWithdrawal = null;
    let currentWithdrawal = 0;
    const path = [portfolio];
    let depleted = false;
    let depletionYear = null;

    const yearReturns = buildYearReturns();

    for (let y = 0; y < yearsTotal; y++) {
      const yearReturn = yearReturns[y];

      const isAccum = y < yearsAccum;
      if (isAccum) {
        // Accumulation: grow + contribute (aporte creciente del calendario projectV2)
        portfolio = portfolio * (1 + yearReturn) + (annualAporteByYear[y] || 0);
      } else {
        // Decumulation: lock in first-year withdrawal at retirement value
        if (firstYearWithdrawal === null) {
          firstYearWithdrawal = portfolio * withdrawalRate;
          currentWithdrawal = firstYearWithdrawal;
        }
        // Pension contribution this year (real, but we keep nominal-equivalent for simplicity)
        const ageNow = retireAge + (y - yearsAccum);
        let pensionThisYear = 0;
        if (penEnabled && ageNow >= penStartAge) {
          const yearsSincePen = ageNow - penStartAge;
          pensionThisYear = penAnnual * Math.pow(1 + inflationRate, yearsSincePen);
        }
        // Withdrawal needed FROM PORTFOLIO = total need - pension (if covered)
        // But Bengen rule prescribes fixed real withdrawal regardless of pension.
        // Honest approach: withdrawal from portfolio reduced by pension (net spending stays same).
        const portfolioWithdrawal = Math.max(0, currentWithdrawal - pensionThisYear);
        // Grow first, then withdraw
        portfolio = portfolio * (1 + yearReturn) - portfolioWithdrawal;
        if (portfolio < 0) {
          portfolio = 0;
          if (!depleted) {
            depleted = true;
            depletionYear = y;
          }
        }
        // Inflate next year's withdrawal target
        currentWithdrawal *= (1 + inflationRate);
      }
      path.push(portfolio);
    }
    // Success = ended decumulation with portfolio > 0 (or with pension covering everything)
    const finalPortfolio = path[path.length - 1];
    if (!depleted || finalPortfolio > 0) successful++;
    if (depleted) depletionYears.push(depletionYear);

    // Save path values to per-year arrays
    for (let y = 0; y < path.length; y++) {
      valuesPerYear[y].push(path[y]);
    }
    // Save first samples for visualization
    if (samples.length < sampleSize) samples.push(path);
  }

  // Compute percentiles per year
  const percentiles = valuesPerYear.map((vals) => {
    const sorted = [...vals].sort((a, b) => a - b);
    return {
      p10: percentile(sorted, 10),
      p25: percentile(sorted, 25),
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p90: percentile(sorted, 90),
    };
  });

  // Bandas por EDAD (la nube percentil a lo largo del recorrido). Los percentiles por año ya están
  // calculados arriba (valuesPerYear → percentiles); aquí SOLO los reetiquetamos por edad para que el
  // consumidor pueda dibujar la banda P10..P90 a cada edad, desde la edad actual hasta la esperanza
  // de vida. Mismo conjunto de trayectorias que el % de éxito y que P10/Mediana/P90 (los trials
  // agotados ya entran como patrimonio 0; respeta el flag de eventos posibles vía includeHyp). 100%
  // aditivo: no recalcula nada ni cambia ninguna salida previa. Índice de año y → edad fromAge + y
  // (y=0 → edad actual; último → lifeExp).
  const bandsByAge = percentiles.map((pc, y) => ({
    age: fromAge + y,
    p10: pc.p10,
    p25: pc.p25,
    p50: pc.p50,
    p75: pc.p75,
    p90: pc.p90,
  }));

  // Depletion-age stats: the age at which the failing scenarios run out.
  let depletionAgeStats = null;
  if (depletionYears.length > 0) {
    const sortedDep = [...depletionYears].sort((a, b) => a - b);
    depletionAgeStats = {
      median: Math.round(percentile(sortedDep, 50) + fromAge),
      p25:    Math.round(percentile(sortedDep, 25) + fromAge),
      p75:    Math.round(percentile(sortedDep, 75) + fromAge),
      count:  depletionYears.length,
    };
  }

  return {
    paths: samples,
    percentiles,
    successRate: successful / trials,
    yearsTotal,
    yearsAccum,
    trials,
    sigma: sigma * 100,
    sequenceMode,
    depletionYears,
    depletionAgeStats,
    bandsByAge,
  };
}

export function parseKeyMonths(key) {
  const [y, m] = key.split('-').map(Number);
  return y * 12 + (m - 1);
}

// Tiered, non-restrictive friction for savings rate (% of income).
// Educational signal, not a hard cap. Used in onboarding step "¿cuánto puedes guardar?".
export function getSavingsTier(pct) {
  if (pct < 10) return {
    label: 'Por debajo de la media',
    color: T.muted,
    message: 'La media española ronda el 10-12% del ingreso disponible. Por debajo, el interés compuesto se queda corto para metas a largo plazo.',
  };
  if (pct < 20) return {
    label: 'Saludable',
    color: T.green,
    message: 'En el rango sostenible para la mayoría de perfiles. Es donde están los planes FIRE en construcción.',
  };
  if (pct < 35) return {
    label: 'Alto',
    color: T.green,
    message: 'Por encima de la media española. Requiere estilo de vida ajustado y/o ingresos altos. Sostenible si la situación material lo permite.',
  };
  if (pct < 50) return {
    label: 'Muy alto',
    color: T.amber,
    message: 'Solo realista en circunstancias específicas: sin hijos, sin hipoteca, ingresos altos, o vida muy austera. Asegúrate de que es lo que aportas en tu peor mes, no en tu mejor mes.',
  };
  if (pct < 70) return {
    label: 'Excepcional',
    color: T.amber,
    message: 'Posible para perfiles muy concretos: convive sin gastos de vivienda, doble ingreso pleno, ingresos altos con vida muy contenida. Un plan basado en lo que aportas en tu mejor mes fracasa siempre. Un plan basado en lo que aportas en tu peor mes funciona.',
  };
  return {
    label: 'Improbable a largo plazo',
    color: T.red,
    message: 'Sostener 70%+ del sueldo durante años es muy raro fuera de situaciones temporales (acumulación pre-FIRE intensa, ahorro para entrada de vivienda en plazo concreto). Considera bajar a un nivel que puedas mantener cuando cambien tus circunstancias.',
  };
}

export function seedMonths(monthlyPlanned) {
  const now = new Date();
  const arr = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    arr.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      year: d.getFullYear(), monthIndex: d.getMonth(),
      planned: monthlyPlanned, actual: null, note: '',
    });
  }
  return arr;
}

export function defaultGoals(/* data */) {
  // v5.6 · No preloaded hitos. Users should not see goals they did not create.
  // Legacy: prior versions seeded "Fondo de emergencia / Algo grande / Libertad
  // financiera"; users with stored hitos keep them — only new users start empty.
  return [];
}

// v1.1.1 · Plan estándar de referencia. Lo usa la gráfica dual del Movimiento 2
// para mostrar la trayectoria que tendría el usuario si siguiera un plan FIRE
// canónico (20% de ahorro, allocation por horizonte, indexado mundial, DCA).
// No es una recomendación: es una referencia para visualizar el contraste.
export const STANDARD_PLAN_REFERENCE = {
  savingRate: 0.20,
  allocationRV_youngHorizon: 0.80,
  allocationRV_midHorizon: 0.60,
  allocationRV_nearHorizon: 0.40,
  annualReturn: 8.0,
  inflationRate: 2.5,
  rebalanceFrequency: 'annual',
  description: 'Plan estándar de referencia: ahorrar 20% del neto, allocation por horizonte, fondo indexado mundial, DCA mensual, rebalanceo anual.',
};

// v1.1.1 · Tres perfiles del usuario en función de su saving rate actual.
// A = no aporta nada. B = aporta pero poco (<15%). C = aporta razonable (>=15%).
export function computeUserProfile(state) {
  const tk = todayKey();
  const income = computeIncomeFor(state.plan, tk);
  const monthlyAporte = computePlannedFor(state.plan, tk);
  const savingRate = income > 0 ? monthlyAporte / income : 0;
  if (monthlyAporte === 0) return 'A';
  if (savingRate < 0.15) return 'B';
  return 'C';
}

// v1.1.1 · Proyecta la trayectoria del plan estándar para el perfil del usuario.
// Reutiliza projectV2 pero forzando: aporte = 20% del income actual, retorno 8%,
// inflación 2.5%, salaryFactor 1.0. No toca el state del usuario; sólo computa
// una curva de patrimonio mes a mes hasta la edad de retiro.
export function projectStandardPlan(state) {
  const { plan, profile } = state;
  const tk = todayKey();
  const income = computeIncomeFor(plan, tk);
  const targetMonthly = Math.max(0, Math.round(income * STANDARD_PLAN_REFERENCE.savingRate));
  const standardPlan = {
    ...plan,
    annualReturn: STANDARD_PLAN_REFERENCE.annualReturn,
    inflationRate: STANDARD_PLAN_REFERENCE.inflationRate,
    salaryInflationFactor: 1.0,
    savingSegments: [{
      id: 'std-' + tk,
      from: tk,
      to: null,
      type: 'fixed',
      value: targetMonthly,
      label: 'Plan estándar 20%',
    }],
    events: [],
  };
  // v1.2.1 fix · projectV2 devuelve el array `series` directamente, no un objeto.
  // En v1.1.1 esto era `res.series` (undefined → standardSeries vacío → nada
  // dibujado o, en casos donde userSeries también degeneraba, una "línea vertical"
  // de un solo punto en dataMax).
  const series = projectV2(standardPlan, profile);
  return { series, targetMonthly };
}

// v1.1.1 · Calcula el estado de las 5 fases de la ruta FIRE para el usuario.
// Devuelve un objeto con steps por fase, fase activa, completadas y skipped.
// Cada paso tiene { id, label, completed (bool), source ('auto'|'manual'|'pending') }.
export function computeActivePhase(state, d) {
  const { plan, profile, goals } = state;
  const tk = todayKey();
  const income = computeIncomeFor(plan, tk);
  const aporte = computePlannedFor(plan, tk);
  const al = plan.actualLife || { completed: false };
  const monthlyLife = al.completed ? sumExpenses(al) : Math.max(0, income - aporte);
  const savingRate = income > 0 ? aporte / income : 0;
  const manual = plan.phaseManualChecks || {};
  const portfolio = d.currentPortfolio || 0;

  // FASE 1 · Cimientos
  const f1 = [
    { id: '1.1', label: 'Tienes claro tu gasto mensual aproximado', completed: monthlyLife > 0, source: monthlyLife > 0 ? 'auto' : 'pending' },
    { id: '1.2', label: 'Has definido tu edad objetivo FIRE', completed: profile.retireAge != null && profile.retireAge > profile.age, source: profile.retireAge ? 'auto' : 'pending' },
    { id: '1.3', label: 'Tu tasa de ahorro está calculada', completed: income > 0, source: income > 0 ? 'auto' : 'pending' },
  ];
  const phase1Done = f1.every(s => s.completed);

  // FASE 2 · Saneamiento de deuda (CONDICIONAL)
  const hasBadDebt = (goals || []).some(g => /deuda|debt|tarjeta|préstamo|prestamo/i.test(g.name || ''));
  const f2 = hasBadDebt ? [
    { id: '2.1', label: 'Pagar mínimos de todas las deudas', completed: manual['2.1'] != null, source: manual['2.1'] ? 'manual' : 'pending' },
    { id: '2.2', label: 'Refinanciar lo refinanciable', completed: manual['2.2'] != null, source: manual['2.2'] ? 'manual' : 'pending' },
    { id: '2.3', label: 'Amortizar deudas de mayor interés primero', completed: manual['2.3'] != null, source: manual['2.3'] ? 'manual' : 'pending' },
  ] : [];
  const phase2Skipped = !hasBadDebt;
  const phase2Done = phase2Skipped || (f2.length > 0 && f2.every(s => s.completed));

  // FASE 3 · Colchón de liquidez
  const liquidityGoal = (goals || []).find(g => g.category === 'liquidez');
  const liquidAmount = liquidityGoal ? (liquidityGoal.target || 0) : 0;
  const portfolioForLiquidity = portfolio; // proxy: si tienen patrimonio, lo cuentan
  const liquidEff = Math.max(liquidAmount, portfolioForLiquidity);
  const f3 = [
    { id: '3.1', label: `Fondo mínimo · ${fmtEur(Math.round(monthlyLife * 1))} (1 mes de gastos)`, completed: liquidEff >= monthlyLife * 1, source: liquidEff >= monthlyLife * 1 ? 'auto' : 'pending' },
    { id: '3.2', label: `Fondo intermedio · ${fmtEur(Math.round(monthlyLife * 3))} (3 meses)`, completed: liquidEff >= monthlyLife * 3, source: liquidEff >= monthlyLife * 3 ? 'auto' : 'pending' },
    { id: '3.3', label: `Fondo completo · ${fmtEur(Math.round(monthlyLife * 6))} (6 meses)`, completed: liquidEff >= monthlyLife * 6, source: liquidEff >= monthlyLife * 6 ? 'auto' : 'pending' },
  ];
  const phase3Done = f3.every(s => s.completed);
  const phase3MinDone = f3[0].completed;

  // FASE 4 · Inversión sistemática (PARALELA A 3)
  const allocationCompleted = al.completed && al.allocation
    ? (al.allocation.fundsEtfs || 0) + (al.allocation.pensionPlan || 0) + (al.allocation.cash || 0) + (al.allocation.deposits || 0) + (al.allocation.other || 0) >= 99
    : false;
  const f4 = [
    { id: '4.1', label: 'Asset allocation definida según edad y horizonte', completed: allocationCompleted, source: allocationCompleted ? 'auto' : 'pending' },
    { id: '4.2', label: 'Aportación mensual automatizada', completed: aporte > 0, source: aporte > 0 ? 'auto' : 'pending' },
    { id: '4.3', label: 'Rebalanceo anual programado (check manual)', completed: manual['4.3'] != null && _withinYear(manual['4.3']), source: manual['4.3'] ? 'manual' : 'pending' },
  ];
  const phase4Done = f4.every(s => s.completed);

  // FASE 5 · Optimización fiscal
  const f5 = [
    { id: '5.1', label: 'Plan de pensiones de empresa (si aplica): aportar mínimo para máxima retribución', completed: manual['5.1'] != null, source: manual['5.1'] ? 'manual' : 'pending' },
    { id: '5.2', label: 'Evaluación tramo IRPF: ¿plan de pensiones privado compensa?', completed: manual['5.2'] != null, source: manual['5.2'] ? 'manual' : 'pending' },
    { id: '5.3', label: 'Compensación de pérdidas y ganancias anual', completed: manual['5.3'] != null, source: manual['5.3'] ? 'manual' : 'pending' },
  ];

  // Fase activa: la primera no completada (saltándose la 2 si skipped).
  let activePhase = 5;
  if (!phase1Done) activePhase = 1;
  else if (!phase2Done && hasBadDebt) activePhase = 2;
  else if (!phase3Done) activePhase = 3;
  else if (!phase4Done) activePhase = 4;
  // Fase 4 puede iniciarse paralela una vez completado 3.1
  const phase4CanStart = phase3MinDone;

  // v1.2.1 · Exponer derivadas usadas por phaseEstimate (Item 4).
  const withdrawalRate = plan.withdrawalRate != null ? plan.withdrawalRate : 4.0;
  const annualReturn = plan.annualReturn || 8;
  const lifeExpectancy = plan.lifeExpectancy || 90;
  const fireNumber = monthlyLife > 0 ? (monthlyLife * 12) / (withdrawalRate / 100) : 0;

  return {
    activePhase,
    phase4CanStart,
    // Derivadas expuestas para phaseEstimate y cualquier consumidor futuro.
    monthlyLife, aporte, income, savingRate,
    liquidEff, currentPortfolio: portfolio,
    fireNumber, withdrawalRate, annualReturn, lifeExpectancy,
    profileAge: profile.age,
    phases: [
      { num: 1, title: 'Cimientos', subtitle: 'Conoce tus gastos, número FIRE, capacidad de ahorro', steps: f1, done: phase1Done, skipped: false },
      { num: 2, title: 'Saneamiento de deuda', subtitle: hasBadDebt ? 'Pagar deuda mala antes de invertir agresivamente' : 'Solo aplica si tienes deuda mala >10% interés', steps: f2, done: phase2Done, skipped: phase2Skipped },
      { num: 3, title: 'Colchón de liquidez', subtitle: 'Reserva remunerada para imprevistos', steps: f3, done: phase3Done, skipped: false, editorialInline: 'El colchón vive en cuenta remunerada o renta fija a corto plazo, no en cuenta corriente.' },
      { num: 4, title: 'Inversión sistemática', subtitle: 'Asset allocation, indexado mundial, DCA mensual, rebalanceo', steps: f4, done: phase4Done, skipped: false, parallel: true },
      { num: 5, title: 'Optimización fiscal', subtitle: 'Plan pensiones empresa, IRPF, compensación de pérdidas', steps: f5, done: false, skipped: false, continuous: true },
    ],
  };
}

// Helper: returns true if isoDate is within the last 12 months.
export function _withinYear(isoDate) {
  if (!isoDate) return false;
  const t = new Date(isoDate).getTime();
  if (!t) return false;
  return (Date.now() - t) < 365 * 24 * 60 * 60 * 1000;
}

// Returns the first rule whose condition is met. Each rule provides title,
// editorial body, optional CTA label and the tab the CTA navigates to.
export function computeNextStep(state, d) {
  const { plan, goals, profile } = state;
  const tk = todayKey();
  const income = computeIncomeFor(plan, tk);
  const planAporte = computePlannedFor(plan, tk);
  const al = plan.actualLife || { completed: false };
  const monthlyLife = al.completed
    ? sumExpenses(al)
    : Math.max(0, income - planAporte);
  const yearsToRetire = Math.max(1, profile.retireAge - profile.age);

  // Rule 1 · No liquidity cushion (no hito named like "emergencia"/"liquidez"/"colchón")
  const hasLiquidityGoal = (goals || []).some(g => /(emergencia|liquidez|colchón|colchon)/i.test(g.name || ''));
  if (!hasLiquidityGoal) {
    const low = Math.round(monthlyLife * 3);
    const high = Math.round(monthlyLife * 6);
    return {
      ruleId: 'liquidity',
      title: 'Asegura tu colchón de liquidez',
      body: monthlyLife > 0
        ? `Antes de optimizar tu allocation o aportar más, asegura un colchón de liquidez de 3-6 meses de gastos (entre ${fmtEur(low)} y ${fmtEur(high)} en tu caso). Es lo que te permite afrontar imprevistos sin tener que vender inversiones en mal momento.`
        : 'Antes de optimizar tu allocation o aportar más, asegura un colchón de liquidez de 3-6 meses de gastos. Es lo que te permite afrontar imprevistos sin tener que vender inversiones en mal momento.',
      ctaLabel: 'Aprende sobre fondo de emergencia →',
      ctaTab: 'aprender',
    };
  }
  // Rule 2 · No consistent monthly contributions
  if (planAporte <= 0) {
    return {
      ruleId: 'dca',
      title: 'Establece un aporte mensual',
      body: 'Define un aporte mensual automático a tu inversión. El DCA (aportar lo mismo cada mes independientemente de cómo vaya el mercado) reduce el impacto del momento de entrar.',
      ctaLabel: 'Aprende sobre DCA →',
      ctaTab: 'aprender',
    };
  }
  // Rule 3 · Saving rate < 15%
  const savingRate = income > 0 ? planAporte / income : 0;
  if (savingRate < 0.15) {
    return {
      ruleId: 'saving-rate',
      title: 'Sube tu tasa de ahorro',
      body: `Tu tasa de ahorro actual es del ${Math.round(savingRate * 100)}% (ahorro sobre neto). Cada punto porcentual extra de ahorro acelera tu camino a FIRE en aproximadamente 1-2 años. Considera revisar tus gastos en Seguimiento.`,
      ctaLabel: 'Aprende sobre la regla de ahorro →',
      ctaTab: 'aprender',
    };
  }
  // Rule 4 · Conservative allocation (RV < 30%) with long horizon (>15 yrs)
  if (al.completed && yearsToRetire > 15) {
    const a = al.allocation || {};
    const rv = (a.fundsEtfs || 0) + (a.pensionPlan || 0);
    if (rv < 30) {
      return {
        ruleId: 'allocation',
        title: 'Tu allocation es muy conservadora para tu horizonte',
        body: `Tu horizonte es de ${yearsToRetire} años. Tu allocation actual tiene solo un ${rv}% en renta variable. Históricamente, en plazos largos, una mayor exposición a renta variable ha dado mejor resultado, aunque con más volatilidad.`,
        ctaLabel: 'Aprende sobre asset allocation →',
        ctaTab: 'aprender',
      };
    }
  }
  // Rule 5 · Everything basic looks healthy
  return {
    ruleId: 'fiscal',
    title: 'Tu plan es robusto en sus parámetros básicos',
    body: 'El siguiente paso sería profundizar en optimización fiscal: aprovechar deducciones, planes de pensiones del cónyuge, compensación de pérdidas y ganancias.',
    ctaLabel: null,
    ctaTab: null,
  };
}

// v1.2.0 · Cómputo destilado de los dos KPIs de "Sin un plan" en Movimiento 1.B.
// Devuelve { lost, lostFirstYear, oppDifference, parkedFinalReal, investedFinalReal, yearsToRetire, planReturn, hasData }.
// Pure function: sin estado local. Usa salaryGrowthAnnual = 1.0 como referencia
// conservadora (en ScreenSinMiPlan el usuario puede modificar ese parámetro vía
// slider; aquí lo fijamos para que los KPIs de Mi Plan sean estables).
export function computeSinPlanKPIs(plan, profile) {
  const tk = todayKey();
  const income = computeIncomeFor(plan, tk);
  const yearsToRetire = Math.max(1, profile.retireAge - profile.age);
  const monthsToRetire = yearsToRetire * 12;
  const inflRate = plan.inflationRate != null ? plan.inflationRate : 2.5;
  const planReturn = plan.annualReturn || 8;
  if (income <= 0) {
    return { lost: 0, lostFirstYear: 0, oppDifference: 0, parkedFinalReal: 0, investedFinalReal: 0, parkedFinalNominal: 0, investedFinalNominal: 0, yearsToRetire, planReturn, hasData: false };
  }
  const hasMultipleIncomeSegments = (plan.incomeSegments || []).length > 1;
  const salaryGrowthAnnual = 1.0;
  // Erosion (Verdad 1): salario acumulado (sobre el papel) vs poder adquisitivo acumulado.
  const gMo = Math.pow(1 + salaryGrowthAnnual / 100, 1 / 12) - 1;
  const piMo = Math.pow(1 + inflRate / 100, 1 / 12) - 1;
  let sumNominal = 0;
  let sumReal = 0;
  for (let m = 1; m <= monthsToRetire; m++) {
    const nominal = hasMultipleIncomeSegments
      ? computeIncomeFor(plan, addMonthsKey(tk, m))
      : income * Math.pow(1 + gMo, m);
    const real = nominal / Math.pow(1 + piMo, m);
    sumNominal += nominal;
    sumReal += real;
  }
  const lost = sumNominal - sumReal;
  // Erosión HONESTA del PRIMER AÑO (no el promedio del acumulado compuesto, que
  // mezcla magnitudes): poder de compra que pierde tu salario anual con un año de
  // inflación. = salario_anual − salario_anual / (1 + inflRate). Solo display.
  const lostFirstYear = income * 12 - (income * 12) / (1 + inflRate / 100);
  // Coste de oportunidad (Verdad 2): aporcado vs invertido al planReturn anual.
  const planMo = Math.pow(1 + planReturn / 100, 1 / 12) - 1;
  const capital = plan.capital || 0;
  let parkedNominal = capital;
  let investedNominal = capital;
  for (let m = 1; m <= monthsToRetire; m++) {
    const monthly = computePlannedFor(plan, addMonthsKey(tk, m));
    parkedNominal += monthly;
    investedNominal = investedNominal * (1 + planMo) + monthly;
  }
  const deflator = Math.pow(1 + piMo, monthsToRetire);
  const parkedFinalReal = parkedNominal / deflator;
  const investedFinalReal = investedNominal / deflator;
  const oppDifference = investedFinalReal - parkedFinalReal;
  // Versiones NOMINALES (sin deflactar) — la app muestra cifras futuras en nominal
  // por defecto; el real queda para recordatorios de aterrizaje. Aditivo.
  return { lost, lostFirstYear, oppDifference, parkedFinalReal, investedFinalReal, parkedFinalNominal: parkedNominal, investedFinalNominal: investedNominal, yearsToRetire, planReturn, hasData: true };
}

// ---------- Formatters (arrastrados Tanda final: fmtEurFull, fmtPct) ----------
export const fmtEurFull = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
export const fmtPct = (n, digits = 1) => `${(n >= 0 ? '+' : '')}${n.toFixed(digits)}%`;
