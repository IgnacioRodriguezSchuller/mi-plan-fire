// Verificador del deep-link (lib/deeplink.js): parseo+validación, siembra del estado
// SOLO sin estado previo, no-sobrescritura, y limpieza de la URL preservando lo ajeno.
// Reloj y RNG mockeados (deterministas) para uid()/todayKey(). localStorage, window y
// history polyfilleados en memoria. Mismo estilo que verify-state.mjs.
import * as dl from '../src/lib/deeplink.js'
import * as persist from '../src/state/persistence.js'

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

// ---- window + history polyfill (URL mutable) ----
const ORIGIN = 'https://app.miplanfire.com'
function setUrl(href) {
  const u = new URL(href, ORIGIN)
  globalThis.window = {
    location: { href: u.href, search: u.search, pathname: u.pathname, hash: u.hash },
    history: {
      state: { foo: 1 },
      replaceState(state, _title, url) {
        this.state = state
        const r = new URL(url, ORIGIN)
        const loc = globalThis.window.location
        loc.href = r.href; loc.search = r.search; loc.pathname = r.pathname; loc.hash = r.hash
      },
    },
  }
}

// ---- mock reloj + RNG (idéntico a verify-state) ----
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

// Estado previo (v2 mínimo válido) para el caso "no sobrescribir".
function priorContainer() {
  return {
    version: 1, activeId: 'default',
    accounts: {
      default: {
        id: 'default', label: 'Yo',
        state: {
          schemaVersion: 2, landingSeen: true, hasSeenLandingPreOnboarding: true,
          migrationsApplied: { v1_1_0_landing_reset: true }, isPro: false,
          onboardingComplete: true, displayMode: 'nominal',
          profile: { name: 'Yo', age: 40, retireAge: 65 },
          plan: {
            capital: 99999, annualReturn: 7, inflationRate: 2.5, withdrawalRate: 4.0,
            lifeExpectancy: 90, salaryInflationFactor: 1.0, phaseManualChecks: {},
            publicPension: { enabled: false, startAge: 67, monthlyAmount: 0, yearsContributed: 0, autoEstimate: true },
            actualLife: { completed: false, expenses: { housing: 0, food: 0, transport: 0, subscriptions: 0, other: 0 },
              mortgage: { enabled: false, originalAmount: 0, termYears: 30, startYear: 2026, type: 'fixed', fixedRate: 3.0, spread: 1.0, euriborRef: 3.0 },
              allocation: { cash: 0, deposits: 0, fundsEtfs: 0, pensionPlan: 0, other: 0, customReturns: { deposits: 2.0, fundsEtfs: null, pensionPlan: null, other: 0 } } },
            monthlyPlanned: 350, incomeSegments: [], bonusSegments: [], savingSegments: [], events: [],
          },
          sandbox: null, months: [], goals: [], activeTab: 'hoy',
        },
      },
    },
  }
}

const FULL = '/?utm_source=calculadora&utm_medium=funnel&calc=regla-del-4-por-ciento&gastoMensual=2000&swr=3.5&patrimonio=20000&aporteMensual=500&rent=5'

// ---- tests ----
const rows = []
function test(name, fn) {
  try { const r = fn(); rows.push({ name, ok: r.ok, detail: r.detail || '' }) }
  catch (err) { rows.push({ name, ok: false, detail: 'throw: ' + err.message }) }
}

// 1) parse: URL válida → valores mapeados + calcSlug.
test('parse · URL válida → valores + calc', () => {
  const p = dl.parseDeeplinkParams('?gastoMensual=2000&swr=3.5&patrimonio=20000&aporteMensual=500&rent=5&calc=regla-del-4-por-ciento')
  const v = p && p.values
  const ok = v && v.gastoMensual === 2000 && v.swr === 3.5 && v.patrimonio === 20000
    && v.aporteMensual === 500 && v.rent === 5 && p.calcSlug === 'regla-del-4-por-ciento'
  return { ok, detail: ok ? 'mapea los 5 numéricos + slug' : JSON.stringify(p) }
})

// 2) parse: sin claves reconocidas → null.
test('parse · sin claves reconocidas → null', () => {
  const ok = dl.parseDeeplinkParams('?ref=twitter&foo=bar') === null && dl.parseDeeplinkParams('') === null
  return { ok, detail: ok ? 'devuelve null' : 'no devolvió null' }
})

// 3) parse: descarta individualmente NaN / fuera de rango, conserva los válidos.
test('parse · descarta inválidos, conserva válidos', () => {
  const p = dl.parseDeeplinkParams('?gastoMensual=abc&swr=0&patrimonio=-5&rent=999&aporteMensual=500')
  const v = p.values
  const ok = !('gastoMensual' in v) && !('swr' in v) && !('patrimonio' in v) && !('rent' in v) && v.aporteMensual === 500
  return { ok, detail: ok ? 'solo sobrevive aporteMensual=500' : JSON.stringify(v) }
})

// 4) apply: SIN estado previo → siembra todos los campos + limpia URL + arma bienvenida.
test('apply · siembra correcta (store vacío)', () => {
  _store.clear(); setUrl(FULL); install(1)
  dl.applyDeeplinkAtStartup()
  const c = persist.loadAccountsData()
  uninstall()
  const st = c && c.accounts.default.state
  const pl = st && st.plan
  const seg = pl && pl.savingSegments[0]
  const inc = pl && pl.incomeSegments[0]
  const checks = {
    capital: pl.capital === 20000,
    annualReturn: pl.annualReturn === 5,
    swr: pl.withdrawalRate === 3.5 && pl.withdrawalRateAuto === false,
    saving: pl.savingSegments.length === 1 && seg.type === 'fixed' && seg.value === 500 && /^\d{4}-\d{2}$/.test(seg.from) && seg.to === null,
    monthlyPlanned: pl.monthlyPlanned === 500,
    gasto: pl.actualLife.completed === true && pl.actualLife.expenses.other === 2000,
    income: pl.incomeSegments.length === 1 && inc.amount === 2500,        // 2000 + 500
    skipOnboarding: st.onboardingComplete === true && st.hasSeenLandingPreOnboarding === true && st.landingSeen === true,
    urlClean: window.location.search === '' && window.location.href === ORIGIN + '/',
    welcome: dl.getDeeplinkWelcome() === 'regla-del-4-por-ciento',
  }
  const bad = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  return { ok: bad.length === 0, detail: bad.length ? 'falla: ' + bad.join(', ') : 'capital/rent/swr+auto/aporte/gasto/ingreso=2500/skip-onboarding/url/welcome OK' }
})

// 5) apply: CON estado previo → NO sobrescribe; la URL igualmente se limpia.
test('apply · no sobrescribe estado previo', () => {
  _store.clear()
  _store.set(persist.ACCOUNTS_KEY, JSON.stringify(priorContainer()))
  setUrl(FULL); install(1)
  dl.applyDeeplinkAtStartup()
  const c = persist.loadAccountsData()
  uninstall()
  const pl = c.accounts.default.state.plan
  const ok = pl.capital === 99999 && pl.annualReturn === 7 && pl.savingSegments.length === 0
    && window.location.search === ''
  return { ok, detail: ok ? 'capital=99999 intacto, URL limpia' : `capital=${pl.capital}, segs=${pl.savingSegments.length}, search='${window.location.search}'` }
})

// 6) limpieza de URL: preserva params ajenos y el hash; quita solo la allowlist.
test('apply · limpieza preserva ajenos + hash', () => {
  _store.clear()
  setUrl('/?foo=bar&gastoMensual=1500&utm_source=calculadora#seccion'); install(1)
  dl.applyDeeplinkAtStartup()
  uninstall()
  const ok = window.location.search === '?foo=bar' && window.location.hash === '#seccion'
  return { ok, detail: ok ? "queda '?foo=bar#seccion'" : `search='${window.location.search}' hash='${window.location.hash}'` }
})

// 7) bienvenida descartable: tras dismiss, getDeeplinkWelcome() → null.
test('welcome · dismiss la oculta', () => {
  dl.dismissDeeplinkWelcome()
  const ok = dl.getDeeplinkWelcome() === null
  return { ok, detail: ok ? 'null tras dismiss' : 'sigue visible' }
})

// 8) CONTROL NEGATIVO: un assert que debe fallar, falla.
test('control negativo', () => {
  const p = dl.parseDeeplinkParams('?gastoMensual=2000')
  return { ok: p.values.gastoMensual !== 1, detail: 'detecta valor distinto' }
})

// ---- salida ----
const w = Math.max(...rows.map((r) => r.name.length))
console.log('\n=== VERIFICACIÓN DE DEEP-LINK (calculadora → perfil) ===')
for (const r of rows) console.log(`  ${r.name.padEnd(w)}  ${r.ok ? 'PASS' : 'FAIL'}  ${r.detail}`)
const anyFail = rows.some((r) => !r.ok)
if (anyFail) { console.error('\n✗ FAIL — el deep-link no se comporta como el contrato.'); process.exit(1) }
console.log('\n✓ PASS — parseo/validación, siembra sin estado previo, no-sobrescritura y limpieza de URL.')
process.exit(0)
