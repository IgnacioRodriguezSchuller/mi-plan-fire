// Verificador CRÍTICO de la Tanda 7 (state/ — persistencia).
// Prueba que un plan REAL guardado sobrevive idéntico tras la migración:
// serializa con la lógica ORIGINAL del HTML y carga con la MIGRADA (src/state),
// comparando deep-equal. Incluye caso legacy (miplan.state.v1 → migrateToV2),
// idempotencia, preservación de isPro, intangibilidad de claves, y un control
// negativo. Reloj y RNG mockeados (deterministas) idénticos en ambos lados.
import { readFileSync } from 'node:fs'
import * as mig from '../src/state/persistence.js'
import { todayKey, uid, addMonthsKey } from '../src/lib/index.js'

const RealDate = Date
const realRandom = Math.random

// ---- localStorage polyfill (en memoria) ----
const _store = new Map()
globalThis.localStorage = {
  getItem: (k) => (_store.has(k) ? _store.get(k) : null),
  setItem: (k, v) => { _store.set(k, String(v)) },
  removeItem: (k) => { _store.delete(k) },
  clear: () => { _store.clear() },
}

// ---- mock reloj + RNG ----
const NOW = new RealDate(2026, 4, 15, 12, 0, 0).getTime()
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

// ---- ORIGINAL extraído del HTML (bloque de persistencia L1528-1811) ----
const html = readFileSync(new URL('../../mi_plan_v1_5_0a_3.html', import.meta.url), 'utf8')
const s = html.indexOf('function migrateToV2(state) {')
const e = html.indexOf('// ---------- Context ----------')
if (s < 0 || e < 0) throw new Error('No se localiza el bloque de persistencia original')
const slice = html.slice(s, e)
const RET = 'return { migrateToV2, STORAGE_KEY, ACCOUNTS_KEY, loadState, saveState, loadAccountsData, saveAccountsData, initialAccountsData, seedState, emptyState };'
const orig = new Function('todayKey', 'uid', 'addMonthsKey', `${slice}\n${RET}`)(todayKey, uid, addMonthsKey)

// ---- deep-equal ----
function eq(a, b, path, diffs) {
  if (a === b) return
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    if (!Object.is(a, b)) diffs.push(`${path}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`)
    return
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    if (!(k in a)) { diffs.push(`${path}.${k}: falta en A`); continue }
    if (!(k in b)) { diffs.push(`${path}.${k}: falta en B`); continue }
    eq(a[k], b[k], `${path}.${k}`, diffs)
  }
}
const clone = (x) => JSON.parse(JSON.stringify(x))
const diffOf = (a, b) => { const d = []; eq(a, b, '', d); return d }

// ---- fixtures: plan REAL multi-cuenta (v2 completo) ----
function realAccountState(name, age, retireAge) {
  return {
    schemaVersion: 2, landingSeen: true, hasSeenLandingPreOnboarding: true,
    migrationsApplied: { v1_1_0_landing_reset: true }, isPro: false,
    onboardingComplete: true, displayMode: 'nominal',
    profile: { name, age, retireAge },
    plan: {
      capital: 4500, annualReturn: 8, inflationRate: 2.5, withdrawalRate: 4.0,
      lifeExpectancy: 90, salaryInflationFactor: 1.0, phaseManualChecks: {},
      publicPension: { enabled: true, startAge: 67, monthlyAmount: 1100, yearsContributed: 35, autoEstimate: true },
      actualLife: {
        completed: true,
        expenses: { housing: 700, food: 300, transport: 100, subscriptions: 50, other: 80 },
        mortgage: { enabled: false, originalAmount: 0, termYears: 30, startYear: 2026, type: 'fixed', fixedRate: 3.0, spread: 1.0, euriborRef: 3.0 },
        allocation: { cash: 10, deposits: 10, fundsEtfs: 60, pensionPlan: 15, other: 5, customReturns: { deposits: 2.0, fundsEtfs: null, pensionPlan: null, other: 0 } },
      },
      monthlyPlanned: 400,
      incomeSegments: [
        { id: 'i1', from: '2024-01', to: '2027-12', amount: 2400, label: 'Salario base' },
        { id: 'i2', from: '2028-01', to: null, amount: 3200, label: 'Tras ascenso' },
      ],
      bonusSegments: [{ id: 'b1', from: '2028-01', to: null, amount: 500, label: 'Plus' }],
      savingSegments: [{ id: 's1', from: '2024-01', to: null, type: 'percent', value: 18, label: 'Aporte 18%' }],
      events: [{ id: 'e1', date: '2026-09', amount: 2500, label: 'Bonus', status: 'confirmado' }],
    },
    sandbox: null,
    months: [
      { key: '2026-01', label: 'ene. 2026', year: 2026, monthIndex: 0, planned: 432, actual: 450, note: '' },
      { key: '2026-02', label: 'feb. 2026', year: 2026, monthIndex: 1, planned: 432, actual: null, note: '' },
    ],
    goals: [
      { id: 'g1', name: 'Entrada piso', target: 30000, targetAge: 35, category: 'vivienda' },
      { id: 'g2', name: 'Independencia financiera', target: 500000, targetAge: 60, category: 'jubilacion' },
    ],
    activeTab: 'hoy',
  }
}
function realContainer() {
  return {
    version: 1, activeId: 'default',
    accounts: {
      default: { id: 'default', label: 'Alex', state: realAccountState('Alex', 30, 60) },
      a2: { id: 'a2', label: 'Pareja', state: realAccountState('Sam', 33, 58) },
    },
  }
}
function legacyState() {
  return {
    onboardingComplete: true,
    profile: { name: 'Legacy User', age: 40, retireAge: 65 },
    plan: {
      capital: 10000, annualReturn: 7,
      monthlyPlanned: 350, // dispara materialización de savingSegment (sin savingSegments)
      incomeSegments: [], bonusSegments: [], savingSegments: [], events: [],
    },
    goals: [{ id: 'g1', name: 'Viejo hito', target: 20000, targetAge: 50 }], // sin category
    months: [],
    // sin schemaVersion / isPro / displayMode / actualLife / publicPension
  }
}

// ---- tests ----
const rows = []
function test(name, fn) {
  try { const r = fn(); rows.push({ name, ok: r.ok, detail: r.detail || '' }) }
  catch (err) { rows.push({ name, ok: false, detail: 'throw: ' + err.message }) }
}

// 1) Roundtrip multi-cuenta v2: guarda con ORIGINAL, carga con MIGRADA.
test('roundtrip multi-cuenta v2 (orig save → mig load)', () => {
  _store.clear(); install(1)
  const built = realContainer()
  orig.saveAccountsData(built)            // serializa con lógica ORIGINAL
  const migLoaded = mig.loadAccountsData() // carga con lógica MIGRADA
  uninstall()
  install(1); const origLoaded = orig.loadAccountsData(); uninstall()
  const dA = diffOf(built, migLoaded)
  const dB = diffOf(origLoaded, migLoaded)
  return { ok: dA.length === 0 && dB.length === 0, detail: dA[0] || dB[0] || `2 cuentas, capital=${migLoaded.accounts.default.state.plan.capital}, segs=${migLoaded.accounts.default.state.plan.incomeSegments.length}` }
})

// 2) Caso LEGACY: blob antiguo en miplan.state.v1 → migrateToV2 (mig vs orig).
test('legacy miplan.state.v1 → migrateToV2 (mig == orig)', () => {
  _store.clear()
  _store.set(mig.STORAGE_KEY, JSON.stringify(legacyState())) // formato antiguo
  install(7); const migLoaded = mig.loadAccountsData(); uninstall()
  _store.clear(); _store.set(mig.STORAGE_KEY, JSON.stringify(legacyState()))
  install(7); const origLoaded = orig.loadAccountsData(); uninstall()
  const d = diffOf(origLoaded, migLoaded)
  const st = migLoaded.accounts.default.state
  const okShape = st.schemaVersion === 2 && st.plan.savingSegments.length === 1 && /^[a-z0-9]{1,7}$/.test(st.plan.savingSegments[0].id)
  return { ok: d.length === 0 && okShape, detail: d[0] || `schemaVersion=${st.schemaVersion}, savingSeg.id=${st.plan.savingSegments[0].id} (materializado), savingSeg.value=${st.plan.savingSegments[0].value}` }
})

// 3a) migrateToV2 idempotente sobre un estado v2 ya migrado (no-op).
test('migrateToV2 no-op sobre v2', () => {
  const v2 = realAccountState('Alex', 30, 60)
  install(7); const out = mig.migrateToV2(clone(v2)); uninstall()
  const d = diffOf(v2, out)
  return { ok: d.length === 0, detail: d[0] || 'migrate(v2) == v2 (sin cambios)' }
})

// 3b) GARANTÍA CLAVE: migrateToV2 migrado == original sobre legacy (byte-a-byte).
test('migrateToV2 mig == orig (legacy)', () => {
  install(7); const mM = mig.migrateToV2(clone(legacyState())); uninstall()
  install(7); const oM = orig.migrateToV2(clone(legacyState())); uninstall()
  const d = diffOf(oM, mM)
  return { ok: d.length === 0, detail: d[0] || 'salida idéntica a la original' }
})

// 3c) Punto fijo: tras la 2ª pasada el estado se estabiliza (conducta del original).
// (El original NO es estrictamente idempotente sobre legacy: la 1ª pasada reduce
//  plan a 7 campos y la 2ª re-rellena los defaults. Se preserva esa conducta.)
test('migrateToV2 punto fijo (m2 == m3)', () => {
  install(7)
  const m2 = mig.migrateToV2(clone(mig.migrateToV2(clone(legacyState()))))
  const m3 = mig.migrateToV2(clone(m2))
  uninstall()
  const d = diffOf(m2, m3)
  return { ok: d.length === 0, detail: d[0] || 'estable tras 2ª pasada' }
})

// 4) Campo zombie isPro preservado.
test('isPro zombie preservado', () => {
  install(7)
  const fromLegacy = mig.migrateToV2(clone(legacyState()))         // sin isPro → debe quedar false
  const withPro = mig.migrateToV2({ schemaVersion: 2, isPro: true, plan: { capital: 1 } }) // true se mantiene
  uninstall()
  return { ok: fromLegacy.isPro === false && withPro.isPro === true, detail: `legacy.isPro=${fromLegacy.isPro}, conPro.isPro=${withPro.isPro}` }
})

// 5) Claves localStorage intactas (mig === orig === contrato).
test('claves localStorage intactas', () => {
  const ok = mig.STORAGE_KEY === 'miplan.state.v1' && mig.ACCOUNTS_KEY === 'miplan.accounts.v1'
    && mig.STORAGE_KEY === orig.STORAGE_KEY && mig.ACCOUNTS_KEY === orig.ACCOUNTS_KEY
  return { ok, detail: `STORAGE_KEY='${mig.STORAGE_KEY}', ACCOUNTS_KEY='${mig.ACCOUNTS_KEY}'` }
})

// 6) CONTROL NEGATIVO: una diferencia inyectada DEBE detectarse.
test('control negativo (detecta diferencia)', () => {
  const a = realContainer()
  const b = clone(a); b.accounts.default.state.plan.capital += 1
  const d = diffOf(a, b)
  return { ok: d.length > 0, detail: d.length > 0 ? 'detectó: ' + d[0] : 'NO detectó (mal)' }
})

// ---- salida ----
const w = Math.max(...rows.map((r) => r.name.length))
console.log('\n=== VERIFICACIÓN DE STATE (persistencia) ===')
for (const r of rows) console.log(`  ${r.name.padEnd(w)}  ${r.ok ? 'PASS' : 'FAIL'}  ${r.detail}`)
const anyFail = rows.some((r) => !r.ok)
if (anyFail) { console.error('\n✗ FAIL — la persistencia migrada NO es idéntica.'); process.exit(1) }
console.log('\n✓ PASS — un plan real sobrevive idéntico tras la migración (roundtrip + legacy + idempotencia + isPro + claves + control negativo).')
process.exit(0)
