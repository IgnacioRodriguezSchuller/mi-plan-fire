// Deep-link · pre-rellenado del perfil desde las calculadoras (calculadoras.miplanfire.com).
// Las calculadoras enlazan a la app con los datos en la URL
//   ?utm_source=calculadora&utm_medium=funnel&calc=<slug>
//    &gastoMensual=1500&swr=4&patrimonio=20000&aporteMensual=500&rent=5
// Aquí los leemos UNA vez al arrancar (desde main.jsx, antes de montar React),
// validamos contra una allowlist, sembramos el estado SOLO si no hay estado previo,
// y limpiamos la URL (history.replaceState) para no dejar datos personales en la barra.
// Local-first: nada sale del dispositivo; solo se escribe el estado local habitual.
import { loadAccountsData, initialAccountsData, saveAccountsData } from '../state/persistence.js'
import { uid, todayKey } from './index.js'

// Params numéricos reconocidos → rango razonable (descarta basura, no afina la cifra del
// usuario). exclusiveMin: el valor debe ser > min (gasto 0 no tiene sentido; swr 0 → div/0).
const NUMERIC_PARAMS = {
  gastoMensual:  { min: 0, max: 200000, exclusiveMin: true },
  aporteMensual: { min: 0, max: 1000000 },
  patrimonio:    { min: 0, max: 100000000 },
  swr:           { min: 1, max: 10 },
  rent:          { min: 0, max: 25 },
};
// Metadatos del embudo (sin campo de estado): se reconocen para limpiarlos de la URL.
const META_PARAMS = ['utm_source', 'utm_medium', 'calc'];
const ALL_KEYS = [...Object.keys(NUMERIC_PARAMS), ...META_PARAMS];

// Señal de bienvenida · transitoria EN MEMORIA (nunca se persiste, no sobrevive a recargar).
let welcomeCalc = null;
let welcomeDismissed = false;
export function getDeeplinkWelcome() { return welcomeDismissed ? null : welcomeCalc; }
export function dismissDeeplinkWelcome() { welcomeDismissed = true; }

// Pura y testeable en Node: parsea + valida. Devuelve { values, calcSlug } o null si la
// URL no trae NINGUNA clave reconocida. Cada param inválido/fuera de rango se descarta solo.
export function parseDeeplinkParams(search) {
  let params;
  try { params = new URLSearchParams(search || ''); } catch (e) { return null; }
  if (!ALL_KEYS.some((k) => params.has(k))) return null;

  const values = {};
  for (const [key, range] of Object.entries(NUMERIC_PARAMS)) {
    if (!params.has(key)) continue;
    const n = Number(params.get(key));
    if (!Number.isFinite(n)) continue;                                  // NaN / ±Infinity
    if (range.exclusiveMin ? n <= range.min : n < range.min) continue;  // bajo mínimo
    if (n > range.max) continue;                                        // sobre máximo
    values[key] = n;
  }
  const rawCalc = params.get('calc');
  const calcSlug = rawCalc ? (rawCalc.slice(0, 64).replace(/[^a-z0-9-]/gi, '') || null) : null;
  return { values, calcSlug };
}

// Aplica los valores validados sobre el estado por defecto (muta in situ). Ver tabla de
// mapeado en el plan: cada campo va a su sitio real del estado.
function seedState(st, v) {
  const plan = st.plan;
  if (v.patrimonio != null) plan.capital = v.patrimonio;
  if (v.rent != null) plan.annualReturn = v.rent;
  // SWR: hay que desactivar el auto para que se respete (effectiveWithdrawalRate deriva del
  // horizonte salvo withdrawalRateAuto === false).
  if (v.swr != null) { plan.withdrawalRate = v.swr; plan.withdrawalRateAuto = false; }
  // Aporte: tramo fijo abierto + espejo en monthlyPlanned (legacy, mes-a-mes).
  if (v.aporteMensual != null) {
    plan.savingSegments = [{ id: uid(), from: todayKey(), to: null, type: 'fixed', value: v.aporteMensual, label: 'Aporte mensual' }];
    plan.monthlyPlanned = v.aporteMensual;
  }
  // Gasto: al bucket «otros» + marcar la sección completada para que «Tu número» lo refleje
  // ya (si no, monthlyLifeNow cae a max(0, ingreso−aporte)). Allocation a cero es seguro:
  // computeEffectiveCapitalReturn devuelve null → el capital crece al annualReturn normal.
  if (v.gastoMensual != null) {
    plan.actualLife.expenses.other = v.gastoMensual;
    plan.actualLife.completed = true;
  }
  // Ingresos = gasto + aporte → tasa de ahorro y «reparto del ingreso» coherentes.
  if (v.gastoMensual != null || v.aporteMensual != null) {
    const income = (v.gastoMensual || 0) + (v.aporteMensual || 0);
    if (income > 0) {
      plan.incomeSegments = [{ id: uid(), from: todayKey(), to: null, amount: income, label: 'Salario' }];
    }
  }
  // El deep-link ya trae las cifras → saltar onboarding (su handler reescribiría el plan
  // entero y borraría lo sembrado). Mismos flags que seedAlex.
  st.onboardingComplete = true;
  st.hasSeenLandingPreOnboarding = true;
  st.landingSeen = true;
}

// Quita SOLO las claves de la allowlist de la URL; preserva ruta, hash y params ajenos.
function cleanUrl() {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const k of ALL_KEYS) {
      if (url.searchParams.has(k)) { url.searchParams.delete(k); changed = true; }
    }
    if (!changed) return;
    const qs = url.searchParams.toString();
    const next = url.pathname + (qs ? '?' + qs : '') + url.hash;
    window.history.replaceState(window.history.state, '', next);
  } catch (e) {}
}

// Punto de enganche único · se llama UNA vez desde main.jsx antes de montar React.
export function applyDeeplinkAtStartup() {
  if (typeof window === 'undefined') return;
  const parsed = parseDeeplinkParams(window.location.search);
  if (!parsed) return;
  // Pre-rellena SOLO si no hay estado previo (ninguna de las dos claves de localStorage).
  // Nunca sobrescribe un perfil guardado. La nota de bienvenida solo se arma si sembramos.
  if (loadAccountsData() == null && Object.keys(parsed.values).length > 0) {
    const container = initialAccountsData();
    seedState(container.accounts[container.activeId].state, parsed.values);
    saveAccountsData(container);
    welcomeCalc = parsed.calcSlug;
  }
  cleanUrl();
}
