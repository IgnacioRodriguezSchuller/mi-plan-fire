// Capa de persistencia/estado (datos puros, sin JSX) — extraída byte-a-byte de
// mi_plan_v1_5_0a_3.html (L1528-1811). Etapa 1 · Paso 3 · Tanda 7.
// CONTRATO localStorage (baseline §3) — NO se toca:
//   STORAGE_KEY  = 'miplan.state.v1'   (legacy, solo lectura para migrar)
//   ACCOUNTS_KEY = 'miplan.accounts.v1' (contenedor multi-cuenta)
//   schemaVersion 2 · migrateToV2 idempotente · campo zombie isPro preservado.
// Separada de index.jsx (React) SOLO para poder testear la persistencia en Node;
// los CUERPOS son idénticos al original (solo +export/import).
import { todayKey, uid, addMonthsKey } from '../lib/index.js'

export function migrateToV2(state) {
  if (!state) return state;
  // v5.8 · Pre-onboarding flag upsert at root level (idempotent).
  // Existing users who finished onboarding skip the new landing; users with
  // partial state see it. New empty states default to false from emptyState().
  if (state.hasSeenLandingPreOnboarding == null) {
    state.hasSeenLandingPreOnboarding = !!state.onboardingComplete;
  }
  // B8 · v1.1.0 one-off migration. The landing pre-onboarding is now accessible
  // permanently, but we also want to show it once to every user who already
  // migrated to v1.0. This block flips hasSeenLandingPreOnboarding back to
  // false a single time, then records the migration so it doesn't repeat.
  if (!state.migrationsApplied) state.migrationsApplied = {};
  if (!state.migrationsApplied.v1_1_0_landing_reset) {
    state.hasSeenLandingPreOnboarding = false;
    state.migrationsApplied.v1_1_0_landing_reset = true;
  }
  // Flag legacy `isPro` mantenido en estado por compatibilidad de migraciones.
  // No tiene efecto en la UI actual (v1.5.0a colapsó branching free/pro).
  if (state.isPro == null) state.isPro = false;
  // Backfill new fields for any state shape (cheap upserts, idempotent)
  if (state.plan) {
    if (state.plan.inflationRate == null) state.plan.inflationRate = 2.5;
    if (state.plan.withdrawalRate == null) state.plan.withdrawalRate = 4.0;
    if (state.plan.lifeExpectancy == null) state.plan.lifeExpectancy = 90;
    // B3 · Salary IPC update factor. 1.0 means salary fully tracks inflation
    // (the implicit assumption pre-v1.1.0, so plans don't shift visibly).
    if (state.plan.salaryInflationFactor == null) state.plan.salaryInflationFactor = 1.0;
    // v1.1.1 · Phase manual checks for the 5-phase route in Mi Plan.
    if (state.plan.phaseManualChecks == null) state.plan.phaseManualChecks = {};
    if (state.plan.publicPension == null) {
      state.plan.publicPension = {
        enabled: false, startAge: 67, monthlyAmount: 0, yearsContributed: 0, autoEstimate: true,
      };
    }
    // v5 · "Antes de Mi Plan" — declared expenses, mortgage, capital allocation.
    // Idempotent: only initialise when missing, never overwrite user data.
    if (state.plan.actualLife == null) {
      state.plan.actualLife = {
        completed: false,
        expenses: { housing: 0, food: 0, transport: 0, subscriptions: 0, other: 0 },
        mortgage: {
          enabled: false, originalAmount: 0, termYears: 30, startYear: new Date().getFullYear(),
          type: 'fixed', fixedRate: 3.0, spread: 1.0, euriborRef: 3.0,
        },
        allocation: {
          cash: 0, deposits: 0, fundsEtfs: 0, pensionPlan: 0, other: 0,
          customReturns: { deposits: 2.0, fundsEtfs: null, pensionPlan: null, other: 0 },
        },
      };
    }
  }
  if (state.displayMode == null) state.displayMode = 'nominal';
  // v1.1.1 · Goal category. Defaults to 'otro' for legacy goals without category.
  if (Array.isArray(state.goals)) {
    state.goals = state.goals.map(g => (g && g.category) ? g : { ...g, category: 'otro' });
  }
  if (state.schemaVersion === 2) return state;
  const plan = state.plan || {};
  const tk = todayKey();
  const updated = {
    ...state,
    schemaVersion: 2,
    landingSeen: state.landingSeen != null ? state.landingSeen : true,
    // v5.8 · Pre-onboarding landing flag. Existing users who already completed
    // onboarding don't see the new pre-landing; new users (or users who
    // reset state) do.
    hasSeenLandingPreOnboarding: state.hasSeenLandingPreOnboarding != null
      ? state.hasSeenLandingPreOnboarding
      : !!state.onboardingComplete,
    plan: {
      capital: plan.capital || 0,
      annualReturn: plan.annualReturn || 8,
      incomeSegments: plan.incomeSegments || [],
      bonusSegments: plan.bonusSegments || [],
      savingSegments: plan.savingSegments || [],
      events: plan.events || [],
      // keep monthlyPlanned around for older mes-a-mes screen if needed
      monthlyPlanned: plan.monthlyPlanned != null ? plan.monthlyPlanned : 0,
    },
    sandbox: state.sandbox || null,
  };
  // If we have monthlyPlanned but no saving segments yet, materialise one open tramo
  if ((!plan.savingSegments || plan.savingSegments.length === 0) && (plan.monthlyPlanned || 0) > 0) {
    updated.plan.savingSegments = [{
      id: uid(),
      from: tk,
      to: null,
      type: 'fixed',
      value: plan.monthlyPlanned,
      label: 'Aporte mensual',
    }];
  }
  return updated;
}


export const STORAGE_KEY = 'miplan.state.v1';          // legacy single-state key (read for migration)
export const ACCOUNTS_KEY = 'miplan.accounts.v1';      // new multi-account container

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateToV2(JSON.parse(raw));
  } catch (e) {}
  return null;
}


export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}


export function loadAccountsData() {
  // Try new storage first
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Re-run migrateToV2 on each account state (safety against old payloads)
      Object.keys(parsed.accounts || {}).forEach((id) => {
        if (parsed.accounts[id] && parsed.accounts[id].state) {
          parsed.accounts[id].state = migrateToV2(parsed.accounts[id].state);
        }
      });
      return parsed;
    }
  } catch (e) {}
  // Fall back: migrate from legacy single state
  const legacy = loadState();
  if (legacy) {
    return {
      version: 1,
      activeId: 'default',
      accounts: {
        'default': {
          id: 'default',
          label: (legacy.profile && legacy.profile.name) || 'Mi cuenta',
          state: legacy,
        },
      },
    };
  }
  return null;
}


export function saveAccountsData(data) {
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(data)); } catch (e) {}
}


export function initialAccountsData() {
  return {
    version: 1,
    activeId: 'default',
    accounts: {
      'default': {
        id: 'default',
        label: 'Mi cuenta',
        state: emptyState(),
      },
    },
  };
}


export function seedState() {
  const now = new Date();
  const months = [];
  // Generate last 8 months of history with realistic variance
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const planned = 400;
    const variance = [380, 420, 500, 380, 410, 600, 400, 430][7 - i] || 400;
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      planned,
      actual: i === 0 ? null : variance,
      note: i === 5 ? 'Bonus de empresa 💪' : i === 2 ? 'Mes ajustado, mudanza' : '',
    });
  }
  // Next 6 months as empty placeholders
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      planned: 400,
      actual: null,
      note: '',
    });
  }
  return {
    onboardingComplete: true,
    landingSeen: true,
    hasSeenLandingPreOnboarding: true,
    migrationsApplied: { v1_1_0_landing_reset: true },
    profile: { name: 'Alex', age: 30, retireAge: 60 },
    plan: {
      capital: 4500,
      annualReturn: 8,
      salaryInflationFactor: 1.0,
      monthlyPlanned: 400,
      incomeSegments: [
        { id: uid(), from: todayKey(), to: addMonthsKey(todayKey(), 35), amount: 2400, label: 'Salario base' },
        { id: uid(), from: addMonthsKey(todayKey(), 36), to: null, amount: 3200, label: 'Salario tras ascenso' },
      ],
      bonusSegments: [
        { id: uid(), from: addMonthsKey(todayKey(), 36), to: null, amount: 500, label: 'Plus de comandancia' },
      ],
      savingSegments: [
        { id: uid(), from: todayKey(), to: null, type: 'percent', value: 18, label: 'Aporte 18% del ingreso' },
      ],
      events: [
        { id: uid(), date: addMonthsKey(todayKey(), 8), amount: 2500, label: 'Bonus de empresa', status: 'confirmado' },
        { id: uid(), date: addMonthsKey(todayKey(), 30), amount: 20000, label: 'Posible herencia (escenario)', status: 'hipotetico' },
      ],
    },
    sandbox: null,
    schemaVersion: 2,
    months,
    goals: [
      { id: 'g1', name: 'Entrada del piso', target: 30000, targetAge: 35 },
      { id: 'g2', name: 'Año sabático', target: 60000, targetAge: 42 },
      { id: 'g3', name: 'Independencia financiera', target: 500000, targetAge: 60 },
    ],
    activeTab: 'hoy',
  };
}


export function emptyState() {
  const tk = todayKey();
  return {
    schemaVersion: 2,
    landingSeen: false,
    hasSeenLandingPreOnboarding: false,
    migrationsApplied: { v1_1_0_landing_reset: true },
    isPro: false,
    onboardingComplete: false,
    displayMode: 'nominal',
    profile: { name: '', age: 28, retireAge: 60 },
    plan: {
      capital: 0,
      annualReturn: 8,
      inflationRate: 2.5,
      withdrawalRate: 4.0,
      lifeExpectancy: 90,
      salaryInflationFactor: 1.0,
      publicPension: {
        enabled: false,
        startAge: 67,
        monthlyAmount: 0,
        yearsContributed: 0,
        autoEstimate: true,
      },
      actualLife: {
        completed: false,
        expenses: { housing: 0, food: 0, transport: 0, subscriptions: 0, other: 0 },
        mortgage: {
          enabled: false, originalAmount: 0, termYears: 30, startYear: new Date().getFullYear(),
          type: 'fixed', fixedRate: 3.0, spread: 1.0, euriborRef: 3.0,
        },
        allocation: {
          cash: 0, deposits: 0, fundsEtfs: 0, pensionPlan: 0, other: 0,
          customReturns: { deposits: 2.0, fundsEtfs: null, pensionPlan: null, other: 0 },
        },
      },
      monthlyPlanned: 200, // legacy field for back-compat
      incomeSegments: [],
      bonusSegments: [],
      savingSegments: [],
      events: [],
    },
    sandbox: null,
    months: [],
    goals: [],
    activeTab: 'hoy',
  };
}

