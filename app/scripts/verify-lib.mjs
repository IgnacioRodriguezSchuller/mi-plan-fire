// Verificador ESTRICTO de la Tanda 2 (lib/ — funciones puras de cálculo).
//
// Para CADA función migrada a src/lib/ compara su salida, valor-a-valor
// (Object.is en hojas: distingue NaN y ±0), contra la versión ORIGINAL
// extraída del monolito mi_plan_v1_5_0a_3.html (solo lectura) y evaluada en
// aislamiento. Inputs representativos + casos límite (cero, negativos, arrays
// vacíos, segmentos solapados, fechas de borde).
//
// Determinismo:
//  - RELOJ: se mockea `Date` (new Date() sin args -> instante fijo; Date.now()
//    fijo) idéntico en ambos lados.
//  - RNG:   se mockea `Math.random` con un PRNG sembrado (mulberry32); misma
//    semilla y mismo reset antes de la llamada original y la migrada, así
//    randomNormal/runMonteCarlo son deterministas y comparables SIN tocar la
//    función.
//
// Filas extra DIRECTAS (pedidas explícitamente):
//  - fmtEur: set propio de números (decimales, cero, negativos, miles, grandes).
//  - STANDARD_PLAN_REFERENCE: deep-equal byte-a-byte de la constante.
import { readFileSync } from 'node:fs'
import * as mig from '../src/lib/index.js'

const RealDate = Date
const realRandom = Math.random
const HTML = new URL('../../mi_plan_v1_5_0a_3.html', import.meta.url)
const html = readFileSync(HTML, 'utf8')

// ----------------------------------------------------------------------------
// 1) Extraer las versiones ORIGINALES del HTML por anclas de texto (regiones
//    plain-JS) y evaluarlas en aislamiento.
// ----------------------------------------------------------------------------
function slice(startAnchor, endAnchor, label) {
  const s = html.indexOf(startAnchor)
  if (s < 0) throw new Error(`[${label}] ancla START no encontrada: ${startAnchor}`)
  const e = html.indexOf(endAnchor, s + startAnchor.length)
  if (e < 0) throw new Error(`[${label}] ancla END no encontrada: ${endAnchor}`)
  return html.slice(s, e)
}

// T original (tokens) — para getSavingsTier. Mismo bloque que verify-tokens.
const tSlice = slice('const WEB_URL', '// ---------- Formatters ----------', 'tokens')
const htmlT = new Function(`${tSlice}\n;return T;`)()

const partMain = slice(
  'function project({ age, retireAge, capital, monthly, ret }) {',
  '// ---------- v2 migration ----------', 'main')
const partFmt = slice('const fmtEur = (n) => {', 'const fmtEurFull', 'fmtEur')
const partParse = slice('function parseKeyMonths(key) {', '// In-app confirm dialog', 'parseKeyMonths')
const partSeed = slice('function seedMonths(monthlyPlanned) {', 'Object.assign(window, { Onboarding });', 'seedMonths/defaultGoals')
const partStd = slice('const STANDARD_PLAN_REFERENCE = {', '// v1.1.1 · Gráfica dual', 'STANDARD_PLAN_REFERENCE')
const partCluster = slice('function computeUserProfile(state) {', '// v1.1.1 · Componente visual de las 5 fases', 'cluster')
// computeNextStep se BORRÓ de src/lib (muerto: cero consumidores desde el
// rediseño de Plan; pendiente 6 de ESTADO). Sin contraparte viva no hay
// regresión que vigilar, así que su slice/EXPORT/casos salen del examen.
// computeSinPlanKPIs (que vivía dentro del antiguo rango de esa slice) sigue
// vivo y conserva su slice propia:
const partSinPlan = slice('function computeSinPlanKPIs(plan, profile) {', '// v1.2.0 · Modal con vista completa de Sin Mi Plan', 'sinPlanKPIs')
const partTier = slice('function getSavingsTier(pct) {', 'function Onboarding() {', 'getSavingsTier')

const EXPORTS = [
  'project', 'timeToGoal', 'monthlyForGoal', 'todayKey', 'monthKeyFromDate',
  'addMonthsKey', 'compareKeys', 'uid', 'isKeyInSegment', 'findActiveSegment',
  'sumActiveSegments', 'detectSegmentOverlaps', 'segmentHasOverlap',
  'normalizeSegments', 'readableMonth', 'projectV2', 'sumExpenses',
  'sumAllocation', 'computeEffectiveCapitalReturn', 'buildMortgageSchedule',
  'currentMonthlyAporte', 'computePlannedFor', 'computeIncomeFor',
  'currentMonthlyIncome', 'toRealEur', 'projectDecumulation',
  'estimateSpanishPension', 'computeCurrentPortfolio', 'randomNormal',
  'inferVolatility', 'percentile', 'runMonteCarlo', 'parseKeyMonths',
  'getSavingsTier', 'seedMonths', 'defaultGoals', 'computeUserProfile',
  'projectStandardPlan', 'computeActivePhase', '_withinYear',
  'computeSinPlanKPIs', 'fmtEur', 'STANDARD_PLAN_REFERENCE',
]
const body = [partFmt, partStd, partMain, partParse, partSeed, partCluster, partSinPlan, partTier].join('\n\n')
  + `\n\nreturn { ${EXPORTS.join(', ')} };`
const orig = new Function('T', body)(htmlT)

// ----------------------------------------------------------------------------
// 2) Mock de reloj + RNG.
// ----------------------------------------------------------------------------
const NOW = new RealDate(2026, 4, 15, 12, 0, 0).getTime() // 2026-05-15 12:00 local
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function install(seed) {
  class MockDate extends RealDate {
    constructor(...args) { if (args.length === 0) super(NOW); else super(...args) }
    static now() { return NOW }
  }
  globalThis.Date = MockDate
  Math.random = mulberry32(seed)
}
function uninstall() { globalThis.Date = RealDate; Math.random = realRandom }

// ----------------------------------------------------------------------------
// 3) Deep-equal (Object.is en hojas) con recogida de la primera diferencia.
// ----------------------------------------------------------------------------
function show(x) {
  if (x === undefined) return 'undefined'
  if (typeof x === 'number' && Number.isNaN(x)) return 'NaN'
  if (typeof x === 'function') return '[function]'
  try { return JSON.stringify(x) } catch { return String(x) }
}
function eq(a, b, path, diffs) {
  if (a === b) return
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    if (!Object.is(a, b)) diffs.push(`${path}: ${show(a)} (orig) ≠ ${show(b)} (mig)`)
    return
  }
  if (Array.isArray(a) !== Array.isArray(b)) { diffs.push(`${path}: array vs objeto`); return }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    if (!(k in a)) { diffs.push(`${path}.${k}: ausente en original`); continue }
    if (!(k in b)) { diffs.push(`${path}.${k}: ausente en migrado`); continue }
    eq(a[k], b[k], `${path}.${k}`, diffs)
  }
}

// ----------------------------------------------------------------------------
// 4) Fixtures (creados con Date real, fuera de los mocks).
// ----------------------------------------------------------------------------
const basePlan = {
  capital: 12000, annualReturn: 8, inflationRate: 2.5, salaryInflationFactor: 1.0,
  withdrawalRate: 4.0, lifeExpectancy: 90,
  incomeSegments: [{ id: 'i1', from: '2020-01', to: null, amount: 2000 }],
  bonusSegments: [{ id: 'b1', from: '2020-01', to: null, amount: 200 }],
  savingSegments: [{ id: 's1', from: '2020-01', to: null, type: 'fixed', value: 400 }],
  events: [{ id: 'e1', date: '2027-06', amount: 5000, status: 'confirmado' }],
  publicPension: { enabled: true, monthlyAmount: 1000, startAge: 67 },
  actualLife: {
    completed: true,
    expenses: { housing: 700, food: 300, transport: 100, subscriptions: 50, other: 80 },
    allocation: { cash: 10, deposits: 10, fundsEtfs: 60, pensionPlan: 15, other: 5, customReturns: {} },
  },
  phaseManualChecks: {},
}
const profile = { age: 30, retireAge: 60 }
const baseState = { plan: basePlan, profile, goals: [] }

const segsOverlap = [
  { id: 'a', from: '2020-01', to: '2020-12', amount: 100 },
  { id: 'b', from: '2020-06', to: '2021-06', amount: 200 },
  { id: 'c', from: '2022-01', to: null, amount: 300 },
]
const segsPercent = [{ id: 'p1', from: '2020-01', to: null, type: 'percent', value: 20 }]

const mortgageFixed = { enabled: true, originalAmount: 200000, termYears: 30, startYear: 2024, type: 'fixed', fixedRate: 3.0 }
const mortgageVar = { enabled: true, originalAmount: 150000, termYears: 25, startYear: 2023, type: 'variable', euriborRef: 2.0, spread: 1.0 }

const monthsReg = [
  { key: '2026-01', actual: 300 }, { key: '2026-02', actual: 300 },
  { key: '2026-03', actual: null }, { key: '2026-04', actual: 350 },
]

function stateProfile(savingSegs) {
  return { plan: { ...basePlan, savingSegments: savingSegs }, profile, goals: [] }
}
function stateGoals(savingSegs, goals, allocation) {
  const plan = { ...basePlan, savingSegments: savingSegs }
  if (allocation) plan.actualLife = { ...basePlan.actualLife, allocation }
  return { plan, profile, goals }
}

// ----------------------------------------------------------------------------
// 5) Especificación de casos por función.
//    Cada `cases` es una lista de listas de argumentos. `invoke` opcional.
// ----------------------------------------------------------------------------
const SPEC = [
  { name: 'project', cases: [
    [{ age: 30, retireAge: 60, capital: 12000, monthly: 400, ret: 8 }],
    [{ age: 60, retireAge: 60, capital: 12000, monthly: 400, ret: 8 }],   // months 0
    [{ age: 65, retireAge: 60, capital: 1000, monthly: 100, ret: 5 }],    // retireAge<age
    [{ age: 40, retireAge: 50, capital: 0, monthly: 0, ret: 0 }],         // ceros
    [{ age: 30, retireAge: 35, capital: -5000, monthly: -100, ret: 7 }],  // negativos
  ]},
  { name: 'timeToGoal', cases: [
    [{ age: 30, capital: 12000, monthly: 400, ret: 8, target: 100000 }],
    [{ age: 30, capital: 50000, monthly: 0, ret: 8, target: 1000 }],      // ya cumplido
    [{ age: 30, capital: 0, monthly: 1, ret: 0, target: 1e9 }],           // null (nunca)
    [{ age: 30, capital: 0, monthly: 100, ret: 6, target: 0 }],           // target 0
  ]},
  { name: 'monthlyForGoal', cases: [
    [{ age: 30, targetAge: 60, capital: 12000, ret: 8, target: 1000000 }],
    [{ age: 30, targetAge: 60, capital: 999999, ret: 8, target: 1000 }],  // remaining<=0 -> 0
    [{ age: 30, targetAge: 30, capital: 0, ret: 8, target: 10000 }],      // n=1
    [{ age: 30, targetAge: 60, capital: 0, ret: 0, target: 10000 }],      // ret 0 -> NaN
  ]},
  { name: 'todayKey', kind: 'clock', cases: [[]] },
  { name: 'monthKeyFromDate', cases: [
    [new RealDate(2024, 0, 5)], [new RealDate(2023, 11, 31)], [new RealDate(2024, 8, 1)],
  ]},
  { name: 'addMonthsKey', cases: [
    ['2024-01', 0], ['2024-01', 1], ['2024-01', 12], ['2024-01', 13],
    ['2024-01', -1], ['2024-12', 1], ['2024-01', -13],
  ]},
  { name: 'compareKeys', cases: [['2024-01', '2024-02'], ['2024-05', '2024-05'], ['2025-01', '2024-12']] },
  { name: 'isKeyInSegment', cases: [
    ['2020-06', { from: '2020-01', to: '2020-12' }],
    ['2019-12', { from: '2020-01', to: '2020-12' }],
    ['2021-01', { from: '2020-01', to: '2020-12' }],
    ['2030-01', { from: '2020-01', to: null }],
    ['2020-01', {}],                                  // sin from
  ]},
  { name: 'findActiveSegment', cases: [
    [segsOverlap, '2020-08'], [segsOverlap, '2025-01'], [segsOverlap, '2019-01'],
    [[], '2020-01'], [null, '2020-01'],
  ]},
  { name: 'sumActiveSegments', cases: [
    [segsOverlap, '2020-08'], [segsOverlap, '2025-01'], [[], '2020-01'],
    [[{ id: 'x', from: '2020-01', to: null }], '2021-01'],   // amount ausente -> 0
  ]},
  { name: 'detectSegmentOverlaps', cases: [
    [segsOverlap], [[{ id: 'a', from: '2020-01', to: '2020-06' }, { id: 'b', from: '2021-01', to: '2021-06' }]],
    [[]], [[{ id: 'solo', from: '2020-01', to: null }]],
  ]},
  { name: 'segmentHasOverlap', cases: [[segsOverlap, 'a'], [segsOverlap, 'c'], [segsOverlap, 'zzz']] },
  { name: 'normalizeSegments', cases: [
    [segsOverlap], [[]], [null],
    [[{ id: 'a', from: '2021-01', to: null }, { id: 'b', from: '2020-01', to: null }]], // desordenado + cap
    [[{ id: 'a', from: '2020-01', to: '2025-12' }, { id: 'b', from: '2020-03', to: null }]], // a cubierto -> drop
  ]},
  { name: 'readableMonth', cases: [[null], [''], ['2024-01'], ['2024-12'], ['2026-05']] },
  { name: 'projectV2', cases: [
    [basePlan, profile, { startKey: '2026-05' }],
    [basePlan, profile, { startKey: '2026-05', flatMonthly: 250 }],
    [{ ...basePlan, savingSegments: segsPercent }, profile, { startKey: '2026-05' }],
    [basePlan, profile, { startKey: '2026-05', months: 6, effectiveReturn: 2.0 }],
    [{ ...basePlan, events: [{ id: 'h', date: '2027-01', amount: 9000, status: 'hipotetico' }] }, profile, { startKey: '2026-05', months: 12, includeHypothetical: false }],
    [basePlan, profile, { startKey: '2024-01', endAge: 61 }],       // usa todayKey (clock)
    [basePlan, profile, { startKey: '2026-05', months: 12, extraMonthly: 100 }],
  ], kind: 'clock' },
  { name: 'sumExpenses', cases: [
    [basePlan.actualLife], [null], [{ completed: true }],
    [{ expenses: { housing: 500 } }], [{ expenses: { housing: 500, food: 200, transport: 0, subscriptions: 0, other: 0 } }],
  ]},
  { name: 'sumAllocation', cases: [
    [basePlan.actualLife], [null], [{ allocation: { cash: 50, fundsEtfs: 50 } }], [{ allocation: {} }],
  ]},
  { name: 'computeEffectiveCapitalReturn', cases: [
    [basePlan],
    [{ ...basePlan, actualLife: { completed: false } }],                 // null
    [{ ...basePlan, actualLife: { completed: true, allocation: {} } }],  // totalW 0 -> null
    [{ ...basePlan, actualLife: { completed: true, allocation: { cash: 100 } } }],
    [{ ...basePlan, actualLife: { completed: true, allocation: { fundsEtfs: 50, deposits: 50, customReturns: { deposits: 1.5, fundsEtfs: 9 } } } }],
  ]},
  { name: 'buildMortgageSchedule', kind: 'clock', cases: [
    [mortgageFixed], [mortgageVar],
    [{ enabled: false }], [null],
    [{ enabled: true, originalAmount: 0, termYears: 20, type: 'fixed', fixedRate: 2 }], // principal 0
    [{ enabled: true, originalAmount: 100000, termYears: 10, type: 'fixed', fixedRate: 0 }], // rM 0
    [{ enabled: true, originalAmount: 100000, type: 'fixed', fixedRate: 3 }],          // startYear default (clock)
  ]},
  { name: 'currentMonthlyAporte', kind: 'clock', cases: [[basePlan], [{ ...basePlan, savingSegments: segsPercent }], [{ ...basePlan, savingSegments: [] }]] },
  { name: 'computePlannedFor', cases: [
    [basePlan, '2026-05'], [{ ...basePlan, savingSegments: segsPercent }, '2026-05'],
    [{ ...basePlan, savingSegments: [] }, '2026-05'],
  ]},
  { name: 'computeIncomeFor', cases: [[basePlan, '2026-05'], [{ ...basePlan, incomeSegments: [], bonusSegments: [] }, '2026-05']] },
  { name: 'currentMonthlyIncome', kind: 'clock', cases: [[basePlan], [{ ...basePlan, incomeSegments: [] }]] },
  { name: 'toRealEur', cases: [
    [100000, 120, 2.5], [100000, 0, 2.5], [100000, 120, null], [100000, 240, -1], [50000, 60, 10],
  ]},
  { name: 'projectDecumulation', cases: [
    [500000, basePlan, 60, 90, {}],
    [500000, basePlan, 60, 90, { withdrawalRate: 3.0 }],
    [500000, basePlan, 60, 60, {}],                       // months 0
    [50000, { ...basePlan, withdrawalRate: 10 }, 60, 95, {}], // agotamiento
    [500000, { ...basePlan, publicPension: { enabled: false } }, 60, 90, {}],
  ]},
  { name: 'estimateSpanishPension', cases: [
    [{ avgMonthlyBase: 2000, yearsContributed: 10, retireYear: 2055 }],  // pct 0
    [{ avgMonthlyBase: 2000, yearsContributed: 20, retireYear: 2055 }],
    [{ avgMonthlyBase: 2000, yearsContributed: 25, retireYear: 2055 }],
    [{ avgMonthlyBase: 5000, yearsContributed: 40, retireYear: 2055 }],  // cap max
    [{ avgMonthlyBase: 1000, yearsContributed: 37, retireYear: 2055 }],  // pct 1
    [{ avgMonthlyBase: 100, yearsContributed: 16, retireYear: 2055 }],   // cap min
    [{ avgMonthlyBase: 0, yearsContributed: 0, retireYear: 2055 }],
  ]},
  { name: 'computeCurrentPortfolio', kind: 'clock', cases: [
    [basePlan, monthsReg, {}], [basePlan, [], {}], [basePlan, monthsReg, { effectiveReturn: 2.0 }],
    [{ ...basePlan, capital: 0 }, monthsReg, {}],
  ]},
  { name: 'randomNormal', kind: 'random', invoke: (fn) => Array.from({ length: 16 }, () => fn()), cases: [[], []] },
  { name: 'uid', kind: 'random', invoke: (fn) => Array.from({ length: 8 }, () => fn()), cases: [[], []] },
  { name: 'inferVolatility', cases: [[2], [4], [6], [8], [10], [12], [15], [-3], [null], [0]] },
  { name: 'percentile', cases: [
    [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50], [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90],
    [[], 50], [[42], 10], [[1, 2, 3, 4], 100],
  ]},
  { name: 'runMonteCarlo', kind: 'random', cases: [
    [basePlan, profile, { trials: 40 }],
    [basePlan, profile, { trials: 40, sequenceMode: 'early-crash' }],
    [basePlan, profile, { trials: 40, sequenceMode: 'late-crash' }],
    [basePlan, profile, { trials: 40, volatility: 12 }],
    [basePlan, { age: 95, retireAge: 100 }, { trials: 10 }],   // yearsTotal<=0 -> early return
  ]},
  { name: 'parseKeyMonths', cases: [['2024-01'], ['2000-12'], ['2026-05']] },
  { name: 'getSavingsTier', cases: [[5], [10], [15], [20], [30], [35], [45], [50], [60], [70], [80], [0]] },
  { name: 'seedMonths', kind: 'clock', cases: [[400], [0], [250]] },
  { name: 'defaultGoals', cases: [[], [{}]] },
  { name: 'computeUserProfile', kind: 'clock', cases: [
    [stateProfile([])],                                                              // A
    [stateProfile([{ id: 's', from: '2020-01', to: null, type: 'fixed', value: 200 }])], // B
    [stateProfile([{ id: 's', from: '2020-01', to: null, type: 'fixed', value: 400 }])], // C
  ]},
  { name: 'projectStandardPlan', kind: 'clock', cases: [[baseState], [stateProfile([])]] },
  { name: 'computeActivePhase', kind: 'clock', cases: [
    [baseState, { currentPortfolio: 8000 }],
    [stateGoals(basePlan.savingSegments, [{ name: 'colchón liquidez', category: 'liquidez', target: 5000 }], null), { currentPortfolio: 20000 }],
    [stateGoals(basePlan.savingSegments, [{ name: 'tarjeta deuda', category: 'otro' }], null), { currentPortfolio: 0 }], // bad debt
    [{ plan: { ...basePlan, phaseManualChecks: { '4.3': '2026-03-01', '2.1': '2026-01-01' } }, profile, goals: [{ name: 'préstamo', category: 'otro' }] }, { currentPortfolio: 100000 }],
  ]},
  { name: '_withinYear', kind: 'clock', cases: [['2025-08-01'], ['2024-01-01'], [null], ['no-fecha'], ['2026-05-01']] },
  { name: 'computeSinPlanKPIs', kind: 'clock', cases: [
    [basePlan, profile],
    [{ ...basePlan, incomeSegments: [], bonusSegments: [] }, profile],   // hasData false
    [{ ...basePlan, incomeSegments: [{ id: 'i1', from: '2020-01', to: '2028-12', amount: 2000 }, { id: 'i2', from: '2029-01', to: null, amount: 2500 }] }, profile], // multi-seg
  ]},
]

// Filas DIRECTAS extra.
const NUMBERS = [0, -0, 1, -1, 0.4, 0.6, 999, 1000, 1500, 9999, 10000, 15000,
  999999, 1000000, 1500000, 9999999, 10000000, 12345678, -2500, -1234567, NaN, null]

// ----------------------------------------------------------------------------
// 6) Runner.
// ----------------------------------------------------------------------------
const rows = []
let totalCases = 0
let anyFail = false
const failures = []

function runCase(name, invoke, args, seed) {
  install(seed)
  let o, oErr = null
  try { o = invoke(orig[name], args) } catch (e) { oErr = e }
  uninstall()
  install(seed)
  let m, mErr = null
  try { m = invoke(mig[name], args) } catch (e) { mErr = e }
  uninstall()
  if (oErr || mErr) {
    if (String(oErr && oErr.message) !== String(mErr && mErr.message)) {
      return { ok: false, diff: `throw orig=${oErr && oErr.message} ≠ mig=${mErr && mErr.message}` }
    }
    return { ok: true } // ambos lanzan el mismo error
  }
  const diffs = []
  eq(o, m, name, diffs)
  return { ok: diffs.length === 0, diff: diffs[0] }
}

for (const spec of SPEC) {
  const { name } = spec
  const invoke = spec.invoke || ((fn, args) => fn(...args))
  if (typeof mig[name] !== 'function') {
    rows.push([name, spec.cases.length, 'FAIL', 'no exportada en src/lib']); anyFail = true
    failures.push(`${name}: no está exportada en src/lib/index.js`); continue
  }
  let pass = 0
  for (let i = 0; i < spec.cases.length; i++) {
    const r = runCase(name, invoke, spec.cases[i], 12345 + i)
    totalCases++
    if (r.ok) pass++
    else { anyFail = true; failures.push(`${name}[caso ${i}]: ${r.diff}`) }
  }
  rows.push([name, spec.cases.length, pass === spec.cases.length ? 'PASS' : 'FAIL',
    pass === spec.cases.length ? '' : `${pass}/${spec.cases.length}`])
}

// fmtEur — fila DIRECTA con set propio de números.
{
  let pass = 0
  const diffsAll = []
  for (const n of NUMBERS) {
    totalCases++
    const o = orig.fmtEur(n), m = mig.fmtEur(n)
    if (Object.is(o, m)) pass++
    else { diffsAll.push(`fmtEur(${show(n)}): ${show(o)} ≠ ${show(m)}`) }
  }
  const ok = pass === NUMBERS.length
  if (!ok) { anyFail = true; failures.push(...diffsAll) }
  rows.push(['fmtEur (set propio)', NUMBERS.length, ok ? 'PASS' : 'FAIL', ok ? '' : `${pass}/${NUMBERS.length}`])
}

// STANDARD_PLAN_REFERENCE — fila DIRECTA deep-equal byte-a-byte.
{
  totalCases++
  const diffs = []
  eq(orig.STANDARD_PLAN_REFERENCE, mig.STANDARD_PLAN_REFERENCE, 'STANDARD_PLAN_REFERENCE', diffs)
  const ok = diffs.length === 0
  if (!ok) { anyFail = true; failures.push(...diffs) }
  rows.push(['STANDARD_PLAN_REFERENCE', 1, ok ? 'PASS' : 'FAIL', ok ? '' : diffs[0]])
}

// ----------------------------------------------------------------------------
// 7) Salida.
// ----------------------------------------------------------------------------
const w = Math.max(...rows.map((r) => r[0].length))
console.log('\n' + 'FUNCIÓN'.padEnd(w) + '  CASOS  RESULTADO  NOTA')
console.log('-'.repeat(w + 28))
for (const [name, n, res, note] of rows) {
  console.log(name.padEnd(w) + '  ' + String(n).padStart(5) + '  ' + res.padEnd(9) + '  ' + note)
}
console.log('-'.repeat(w + 28))
console.log(`Total: ${rows.length} filas · ${totalCases} casos ejecutados.`)

if (anyFail) {
  console.error('\n✗ FAIL — diferencias encontradas:')
  failures.slice(0, 50).forEach((f) => console.error('   • ' + f))
  process.exit(1)
} else {
  console.log('\n✓ PASS — TODAS las funciones idénticas valor-a-valor con el baseline.')
  process.exit(0)
}
