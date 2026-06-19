// Capa de estado (React) — extraída byte-a-byte de mi_plan_v1_5_0a_3.html.
// Etapa 1 · Paso 3 · Tanda 7. StateCtx, StateProvider, useStore, useDerived,
// usePlanMutators. La persistencia vive en ./persistence.js (re-exportada).
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import {
  computePlannedFor, computeEffectiveCapitalReturn, computeCurrentPortfolio,
  currentMonthlyAporte, currentMonthlyIncome, computeIncomeFor, sumExpenses,
  projectV2, projectDecumulation, compareKeys, todayKey, addMonthsKey, uid,
  normalizeSegments, parseKeyMonths, toRealEur,
} from '../lib/index.js'
import { ConfirmModal } from '../modals/index.jsx'
import {
  loadAccountsData, initialAccountsData, saveAccountsData, emptyState, seedState, seedAlex,
} from './persistence.js'

export * from './persistence.js'

export const StateCtx = createContext(null);

export function StateProvider({ children }) {
  const [accountsData, setAccountsData] = useState(() => loadAccountsData() || initialAccountsData());
  useEffect(() => { saveAccountsData(accountsData); }, [accountsData]);

  // The "current" state is the active account's state
  const state = accountsData.accounts[accountsData.activeId]?.state || emptyState();

  // setState writes into the active account
  const setState = useCallback((updater) => {
    setAccountsData((d) => {
      const cur = d.accounts[d.activeId];
      if (!cur) return d;
      const newState = typeof updater === 'function' ? updater(cur.state) : updater;
      return {
        ...d,
        accounts: { ...d.accounts, [d.activeId]: { ...cur, state: newState } },
      };
    });
  }, []);

  // Account management
  const switchAccount = useCallback((id) => setAccountsData((d) => d.accounts[id] ? { ...d, activeId: id } : d), []);
  const createAccount = useCallback((label) => {
    const id = 'a' + Date.now() + Math.floor(Math.random() * 1000);
    setAccountsData((d) => ({
      ...d,
      accounts: {
        ...d.accounts,
        [id]: {
          id,
          label: label || 'Nueva persona',
          // New accounts skip landing (the user already knows the app)
          state: { ...emptyState(), landingSeen: true },
        },
      },
      activeId: id,
    }));
    return id;
  }, []);
  const renameAccount = useCallback((id, label) => setAccountsData((d) => {
    if (!d.accounts[id]) return d;
    return { ...d, accounts: { ...d.accounts, [id]: { ...d.accounts[id], label } } };
  }), []);
  const deleteAccount = useCallback((id) => setAccountsData((d) => {
    if (!d.accounts[id] || Object.keys(d.accounts).length <= 1) return d;
    const rest = { ...d.accounts };
    delete rest[id];
    const newActive = d.activeId === id ? Object.keys(rest)[0] : d.activeId;
    return { ...d, accounts: rest, activeId: newActive };
  }), []);

  // Helpers
  const update = useCallback((patch) => {
    setState((s) => (typeof patch === 'function' ? patch(s) : { ...s, ...patch }));
  }, []);
  const updateProfile = useCallback((p) => setAccountsData((d) => {
    const cur = d.accounts[d.activeId];
    if (!cur) return d;
    const prevName = (cur.state.profile && cur.state.profile.name) || '';
    const newState = { ...cur.state, profile: { ...cur.state.profile, ...p } };
    let label = cur.label;
    // El nombre de la cuenta sigue al del usuario, salvo que se haya renombrado a mano.
    if (p.name != null && (cur.label === 'Mi cuenta' || cur.label === 'Nueva persona' || !cur.label || cur.label === prevName)) {
      label = (p.name && p.name.trim()) || cur.label;
    }
    return { ...d, accounts: { ...d.accounts, [d.activeId]: { ...cur, state: newState, label } } };
  }), []);

  // updatePlan now writes to sandbox if active, otherwise to real plan
  const updatePlan = useCallback((p) => setState((s) => {
    if (s.sandbox) return { ...s, sandbox: { ...s.sandbox, ...p } };
    return { ...s, plan: { ...s.plan, ...p } };
  }), []);

  // Direct mutators on the active plan (sandbox-aware)
  const mutatePlan = useCallback((fn) => setState((s) => {
    if (s.sandbox) return { ...s, sandbox: fn({ ...s.sandbox }) };
    return { ...s, plan: fn({ ...s.plan }) };
  }), []);

  // Sandbox controls
  const startSandbox = useCallback(() => setState((s) => {
    if (s.sandbox) return s;
    return { ...s, sandbox: JSON.parse(JSON.stringify(s.plan)) };
  }), []);
  const discardSandbox = useCallback(() => setState((s) => ({ ...s, sandbox: null })), []);
  const applySandbox = useCallback(() => setState((s) => {
    if (!s.sandbox) return s;
    return { ...s, plan: s.sandbox, sandbox: null };
  }), []);

  const setMonth = useCallback((key, patch) => setState((s) => ({
    ...s,
    months: s.months.map((m) => m.key === key ? { ...m, ...patch } : m),
  })), []);
  const addGoal = useCallback((goal) => setState((s) => ({
    ...s, goals: [...s.goals, { category: 'otro', ...goal, id: 'g' + Date.now() }],
  })), []);
  const updateGoal = useCallback((id, patch) => setState((s) => ({
    ...s, goals: s.goals.map((g) => g.id === id ? { ...g, ...patch } : g),
  })), []);
  const removeGoal = useCallback((id) => setState((s) => ({
    ...s, goals: s.goals.filter((g) => g.id !== id),
  })), []);
  // Modal-driven reset (no native confirm — blocked in iframes)
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const resetAll = useCallback(() => {
    setPendingConfirm({
      title: '¿Borrar esta cuenta?',
      body: 'Se borrarán los tramos, eventos, meses y metas de la cuenta activa. Las otras cuentas no se tocan. Esto no se puede deshacer.',
      confirmLabel: 'Sí, borrar',
      destructive: true,
      action: () => {
        setState(emptyState());
      },
    });
  }, []);
  const reonboard = useCallback(() => {
    setPendingConfirm({
      title: '¿Volver al onboarding?',
      body: 'Te llevaremos al onboarding manteniendo tus datos actuales por si quieres conservarlos. Si lo terminas, se sobrescriben.',
      confirmLabel: 'Sí, ir al onboarding',
      action: () => {
        setState((s) => ({ ...s, onboardingComplete: false }));
      },
    });
  }, []);
  // Demo = "Alex en dos etapas": carga DOS cuentas (25 y 34) sustituyendo el contenedor
  // entero (coherente con el aviso de seedDemoConfirm: "sustituye tus datos"). Así el
  // comparador de escenarios y el rebalanceo lucen con datos reales y relatables.
  const seedDemo = useCallback(() => setAccountsData((d) => {
    const id25 = 'demo-alex-25';
    const id34 = 'demo-alex-34';
    return {
      ...d,
      version: 1,
      activeId: id25,
      accounts: {
        [id25]: { id: id25, label: 'Alex · 25', state: seedAlex('joven') },
        [id34]: { id: id34, label: 'Alex · 34', state: seedAlex('maduro') },
      },
    };
  }), []);
  // Variante con confirmación (H11): cargar la demo SUSTITUYE el estado entero.
  // El botón "Cargar datos demo" de Datos y el "Saltar · usar demo" del onboarding
  // (alcanzable CON datos reales vía reonboard, que conserva el estado) pasan por
  // el MISMO modal que resetAll/reonboard. seedDemo (directo) se conserva para la
  // landing, que solo se renderiza con !landingSeen (usuario sin datos que perder).
  const seedDemoConfirm = useCallback(() => {
    setPendingConfirm({
      title: 'Cargar datos de demostración',
      body: 'Vas a sustituir tus datos por los de la demo. Lo que tienes ahora en este navegador se pierde. Si quieres conservarlos, expórtalos antes.',
      confirmLabel: 'Cargar demo',
      destructive: true,
      action: () => {
        seedDemo();
      },
    });
  }, []);

  const value = useMemo(() => ({
    state, update, updateProfile, updatePlan, mutatePlan,
    setMonth, addGoal, updateGoal, removeGoal, resetAll, reonboard, seedDemo, seedDemoConfirm,
    activePlan: state.plan,
    // Callbacks declarados arriba para compatibilidad de estado persistido.
    // No exportados actualmente.
    // Account API
    accounts: accountsData.accounts,
    activeAccountId: accountsData.activeId,
    switchAccount, createAccount, renameAccount, deleteAccount,
  }), [accountsData, state]);

  return (
    <StateCtx.Provider value={value}>
      {children}
      <ConfirmModal
        open={!!pendingConfirm}
        title={pendingConfirm?.title}
        body={pendingConfirm?.body}
        confirmLabel={pendingConfirm?.confirmLabel}
        destructive={pendingConfirm?.destructive}
        onConfirm={() => { pendingConfirm?.action?.(); setPendingConfirm(null); }}
        onCancel={() => setPendingConfirm(null)}
      />
    </StateCtx.Provider>
  );
}


export const useStore = () => useContext(StateCtx);

export function useDerived() {
  const { state, activePlan } = useStore();
  return useMemo(() => {
    const { profile, plan, months } = state;
    const filledMonths = (months || []).filter(m => m.actual != null);
    const totalActual = filledMonths.reduce((s, m) => s + (m.actual || 0), 0);
    // Recompute planned from current tramos so a plan update in Ajustes propagates here.
    // Using the stored `m.planned` snapshot would leave stale numbers and trigger
    // false "behind plan" messages when the user has raised contributions retroactively.
    const totalPlannedSoFar = filledMonths.reduce((s, m) => s + computePlannedFor(plan, m.key), 0);
    // Effective return on the starting capital: weighted average of the user's
    // declared capital allocation (null when actualLife is not completed).
    const effectiveReturn = computeEffectiveCapitalReturn(plan);
    // Historical compound: properly grow past aportes from their month to today
    const currentPortfolio = computeCurrentPortfolio(plan, months || [], { effectiveReturn });
    const baseMonthly = currentMonthlyAporte(plan) || plan.monthlyPlanned || 0;
    const avgActual = filledMonths.length ? totalActual / filledMonths.length : baseMonthly;

    // Plan curve (using v2 engine on the *real* plan, starting from currentPortfolio).
    // effectiveReturn is forwarded so that starting capital that sits in low-yield
    // accounts grows realistically while new contributions still target the plan's rate.
    const seriesPlan = projectV2(plan, profile, {
      capital: currentPortfolio,
      includeHypothetical: false,
      effectiveReturn,
    });
    // Real pace: flat aporte at avgActual instead of segments
    const seriesActualPace = projectV2(plan, profile, {
      capital: currentPortfolio,
      flatMonthly: avgActual,
      includeHypothetical: false,
      effectiveReturn,
    });

    // ------------------------------------------------------------
    // Dual curves from start (for plan-vs-reality visualisation).
    // Both span from the first registered month to retireAge,
    // start at plan.capital, and use the same plan tramos for any
    // future month. They diverge wherever a registered month's
    // `actual` differs from what the plan would have prescribed.
    // ------------------------------------------------------------
    const sortedMonths = [...filledMonths].sort((a, b) => compareKeys(a.key, b.key));
    const firstRegisteredKey = sortedMonths.length ? sortedMonths[0].key : null;
    const lastRegisteredKey = sortedMonths.length ? sortedMonths[sortedMonths.length - 1].key : null;
    const actualByKey = {};
    sortedMonths.forEach((m) => { actualByKey[m.key] = m.actual; });

    const startKeyForHistory = firstRegisteredKey || todayKey();
    const seriesPlanFromStart = projectV2(plan, profile, {
      capital: plan.capital || 0,
      startKey: startKeyForHistory,
      endAge: profile.retireAge,
      includeHypothetical: false,
      effectiveReturn,
    });
    const seriesRealFromStart = projectV2(plan, profile, {
      capital: plan.capital || 0,
      startKey: startKeyForHistory,
      endAge: profile.retireAge,
      includeHypothetical: false,
      actualByKey,
      effectiveReturn,
    });

    // Portfolio at last registered month on each curve — basis for "ahead vs behind"
    const findAtKey = (s, k) => s.find((row) => row.key === k) || null;
    const planAtLastReg = lastRegisteredKey ? findAtKey(seriesPlanFromStart, lastRegisteredKey) : null;
    const realAtLastReg = lastRegisteredKey ? findAtKey(seriesRealFromStart, lastRegisteredKey) : null;
    const planPortfolioAtLastReg = planAtLastReg ? planAtLastReg.portfolio : null;
    const realPortfolioAtLastReg = realAtLastReg ? realAtLastReg.portfolio : null;
    const realVsPlanDelta = (planPortfolioAtLastReg != null && realPortfolioAtLastReg != null)
      ? realPortfolioAtLastReg - planPortfolioAtLastReg : null;
    const realVsPlanRatio = (planPortfolioAtLastReg != null && planPortfolioAtLastReg > 0 && realPortfolioAtLastReg != null)
      ? realPortfolioAtLastReg / planPortfolioAtLastReg : null;

    // FI target (same logic as FinancialHealthCard) — for age-at-FI comparisons.
    // When the user has declared expenses, use them directly. Otherwise fall back
    // to the income−investment derivation (legacy behaviour).
    const tkNow = todayKey();
    const monthlyIncomeNow = computeIncomeFor(plan, tkNow);
    const monthlyInvestmentNow = computePlannedFor(plan, tkNow);
    const alNow = plan.actualLife;
    const useDeclaredExpensesNow = !!(alNow && alNow.completed);
    const monthlyLifeNow = useDeclaredExpensesNow
      ? sumExpenses(alNow)
      : Math.max(0, monthlyIncomeNow - monthlyInvestmentNow);
    // "Tu número" (fiTarget) = el capital que necesitas POR TU CUENTA: el gasto anual
    // completo dividido por la tasa de retiro. NO se resta la pensión pública (decisión
    // de modelo): la pensión no baja el objetivo, se modela como ingreso en la simulación
    // temporal (projectDecumulation / runMonteCarlo, desde startAge), que es donde hace
    // que el dinero dure más. Antes se restaba la pensión desde hoy y el objetivo se
    // anulaba a 0 cuando pensión ≥ gasto, borrando el ★.
    const wdr = (plan.withdrawalRate != null ? plan.withdrawalRate : 4.0) / 100;
    const fiTarget = monthlyLifeNow * 12 / wdr;

    // Edad de independencia financiera · comparación REAL vs REAL.
    // Vía (a): fiTarget está en euros de HOY (se deriva del gasto actual), pero
    // las series (seriesPlanFromStart / seriesRealFromStart) están en NOMINAL
    // —projectV2 no deflacta—. Comparar cartera_nominal ≥ fiTarget_real mezclaba
    // unidades y adelantaba la edad FIRE varios años (la curva nominal cruza el
    // umbral antes que la real). Deflactamos cada punto de la cartera a euros de
    // hoy ANTES de comparar; NO tocamos fiTarget ni las series (otras vistas las
    // usan en nominal), solo el punto de comparación. Los años-desde-hoy salen de
    // (row.age - profile.age), la misma base con la que la pantalla calcula
    // finalReal → así la edad FIRE y la caja "llegarías a" quedan en idéntica
    // base real y dejan de contradecirse.
    const ageHittingTarget = (s, target) => {
      if (target <= 0) return null;
      for (let i = 0; i < s.length; i++) {
        const realPortfolio = toRealEur(
          s[i].portfolio || 0,
          (s[i].age - profile.age) * 12,
          plan.inflationRate,
        );
        if (realPortfolio >= target) return s[i].age;
      }
      return null;
    };
    // Vía (b): las series dibujadas (seriesPlanFromStart / seriesRealFromStart) se
    // cortan en retireAge para el gráfico plan-vs-realidad. Si el cruce FIRE cae
    // DESPUÉS de la edad de retiro, esas series no llegan y ageHittingTarget devuelve
    // null → "vas tarde" quedaba indetectable. Proyectamos DOS series auxiliares
    // extendidas hasta los 90 SOLO para detección: no se dibujan ni alimentan
    // planAtLastReg/realAtLastReg (extender las dibujadas rompería el gráfico).
    // Mismos parámetros que seriesPlanFromStart/seriesRealFromStart salvo endAge.
    const DETECT_END_AGE = 90;
    const seriesPlanForDetect = projectV2(plan, profile, {
      capital: plan.capital || 0,
      startKey: startKeyForHistory,
      endAge: DETECT_END_AGE,
      includeHypothetical: false,
      effectiveReturn,
    });
    const seriesRealForDetect = projectV2(plan, profile, {
      capital: plan.capital || 0,
      startKey: startKeyForHistory,
      endAge: DETECT_END_AGE,
      includeHypothetical: false,
      actualByKey,
      effectiveReturn,
    });
    const ageAtFiPlan = fiTarget > 0 ? ageHittingTarget(seriesPlanForDetect, fiTarget) : null;
    const ageAtFiReal = fiTarget > 0 ? ageHittingTarget(seriesRealForDetect, fiTarget) : null;
    // Estado del destino. cruceEdad usa el ritmo REAL: cae automáticamente al plan
    // cuando no hay meses registrados, porque sin actualByKey la serie real == plan.
    const cruceEdad = ageAtFiReal;
    let destinoEstado;
    if (cruceEdad == null) destinoEstado = 'no-llega';
    else if (cruceEdad <= profile.retireAge) destinoEstado = 'libre';
    else destinoEstado = 'tarde';

    // ── Veredicto ÚNICO "¿voy bien?" · fuente de verdad para Hoy/Seguimiento/KpiPill ──
    // Antes TRES señales se contradecían en una misma sesión: destinoEstado (vs retireAge),
    // realVsPlanDelta (cartera real vs plan en el último mes) y avgActual≥currentAporte
    // (media de aportes vs lo prescrito hoy). Unificamos en ageAtFiReal vs ageAtFiPlan
    // (misma métrica, € de hoy, horizonte de detección 90). Defaults en lectura; no toca
    // projectV2/runMonteCarlo/migrateToV2. verdict ∈ {adelantado,en-linea,atrasado,no-llega,sin-datos}.
    const VERDICT_TOL_YEARS = 0.5; // ±medio año → "en línea"
    const gastoAnual = monthlyLifeNow * 12;
    // Salvaguarda anti-regresión (HOY inalcanzable: fiTarget = gastoAnual/wdr ⇒ solo saltaría
    // con withdrawalRate > 20 %). El fix 4f1561f quitó la resta de pensión de fiTarget; mantenemos
    // el guard por si una regresión del modelo de pensión vuelve a colapsar el número: con pensión
    // activa y fiTarget inverosímil, NO emitimos veredicto (el modelo de pensión se arregla en su
    // propia sesión, no aquí).
    const pensionEnabled = !!(plan.publicPension && plan.publicPension.enabled);
    const fiTargetImplausible = pensionEnabled && fiTarget > 0 && fiTarget < gastoAnual * 5;
    let verdict, verdictAge, verdictCopy;
    if (fiTargetImplausible) {
      verdict = 'sin-datos';
      verdictAge = null;
      verdictCopy = 'Pendiente de revisar el modelo de pensión.';
    } else if (ageAtFiReal == null) {
      verdictAge = null;
      if (filledMonths.length === 0) { verdict = 'sin-datos'; verdictCopy = 'Aún sin datos para un veredicto: registra tu primer mes.'; }
      else { verdict = 'no-llega'; verdictCopy = 'Con tu ritmo actual no llegas a tu número.'; }
    } else {
      verdictAge = ageAtFiReal;
      if (ageAtFiPlan == null || Math.abs(ageAtFiReal - ageAtFiPlan) < VERDICT_TOL_YEARS) verdict = 'en-linea';
      else if (ageAtFiReal < ageAtFiPlan) verdict = 'adelantado';
      else verdict = 'atrasado';
      const base = verdict === 'adelantado' ? 'Vas por delante de tu plan.'
        : verdict === 'atrasado' ? 'Vas por detrás de tu plan.'
        : 'Vas en línea con tu plan.';
      // Matiz honesto: si la libertad llega después de la jubilación deseada, se dice (no se
      // pierde el antiguo "libre, pero tarde"), pero en una ÚNICA fuente que todas las vistas leen.
      const tarde = verdictAge > profile.retireAge + VERDICT_TOL_YEARS;
      verdictCopy = tarde ? `${base} Tu libertad llega tras los ${profile.retireAge}.` : base;
    }

    // ── "Siguiente paso" · vías deterministas de retiro temprano (cero IA) ──
    // Todo en € de hoy (real), reutilizando seriesRealForDetect (ritmo real a 90) y
    // ageHittingTarget (que ya deflacta vía toRealEur). NO tocan projectV2 (solo lo
    // llaman con opciones existentes). Estos derivados alimentan la card "Siguiente paso".
    const retornoNom = plan.annualReturn != null ? plan.annualReturn : 8;
    const inflPct = plan.inflationRate != null ? plan.inflationRate : 2.5;
    // (1) Coast FIRE · primera edad desde la que, SIN aportar más, el capital real
    // capitaliza hasta fiTarget en retireAge. rReal = (retorno − inflación)/100.
    const rReal = (retornoNom - inflPct) / 100;
    let coastEdad = null;
    if (fiTarget > 0) {
      for (let i = 0; i < seriesRealForDetect.length; i++) {
        const row = seriesRealForDetect[i];
        const real = toRealEur(row.portfolio || 0, Math.round((row.age - profile.age) * 12), plan.inflationRate);
        const anios = profile.retireAge - row.age;
        if (anios > 0 && real * Math.pow(1 + rReal, anios) >= fiTarget) { coastEdad = row.age; break; }
      }
    }
    // (2) Lean FIRE · número con gasto recortado (leanPct del gasto vital). leanPct vive
    // en el plan (default 0.70, ajustable; persiste vía updatePlan). Default en el PUNTO
    // DE LECTURA — mismo patrón que withdrawalRate/inflationRate — para no tocar migrateToV2
    // (rarezas intencionales del baseline) ni romper el verificador de roundtrip.
    const leanPct = plan.leanPct != null ? plan.leanPct : 0.70;
    const leanGastoMes = leanPct * monthlyLifeNow;
    const fiTargetLean = leanGastoMes * 12 / wdr;
    const leanEdad = fiTargetLean > 0 ? ageHittingTarget(seriesRealForDetect, fiTargetLean) : null;
    // (2b) Fat FIRE · número con gasto holgado (fatPct del gasto vital, default 1,5×). Mismo
    // patrón que lean: fatPct vive en el plan con default EN LECTURA (no en migrateToV2) para no
    // tocar las rarezas del baseline ni romper el roundtrip. fatEdad suele caer fuera de alcance
    // (gasto mayor → objetivo mayor → más tarde o null); todos los consumidores guardan el null.
    const fatPct = plan.fatPct != null ? plan.fatPct : 1.5;
    const fatGastoMes = fatPct * monthlyLifeNow;
    const fiTargetFat = fatGastoMes * 12 / wdr;
    const fatEdad = fiTargetFat > 0 ? ageHittingTarget(seriesRealForDetect, fiTargetFat) : null;
    // (3) +5 puntos de ahorro · misma base real + extraMonthly = 5% del ingreso de hoy.
    const incomeNowForBoost = monthlyIncomeNow || 0;
    const seriesAhorroMas5 = incomeNowForBoost > 0 ? projectV2(plan, profile, {
      capital: plan.capital || 0,
      startKey: startKeyForHistory,
      endAge: DETECT_END_AGE,
      includeHypothetical: false,
      actualByKey,
      effectiveReturn,
      extraMonthly: 0.05 * incomeNowForBoost,
    }) : null;
    const ahorroMas5Edad = (seriesAhorroMas5 && fiTarget > 0) ? ageHittingTarget(seriesAhorroMas5, fiTarget) : null;

    // Plan curve including hypothetical events (for "if all goes well" view)
    const seriesPlanWithHypo = projectV2(plan, profile, {
      capital: currentPortfolio,
      includeHypothetical: true,
      effectiveReturn,
    });

    const finalPlan = seriesPlan[seriesPlan.length - 1];
    const finalPace = seriesActualPace[seriesActualPace.length - 1];
    const finalPlanHypo = seriesPlanWithHypo[seriesPlanWithHypo.length - 1];

    // Decumulation phase: continues from finalPlan portfolio at retire age
    const lifeExp = plan.lifeExpectancy || 90;
    const decumResult = projectDecumulation(
      finalPlan.portfolio,
      plan,
      profile.retireAge,
      lifeExp,
    );
    const seriesDecum = decumResult.series;
    const depletedAtMonth = decumResult.depletedAtMonth;
    // Age at which money runs out (null if it doesn't)
    const depletedAtAge = depletedAtMonth != null ? profile.retireAge + depletedAtMonth / 12 : null;
    // Initial monthly retirement income (year-1 withdrawal / 12)
    const retirementMonthlyIncome = seriesDecum.length > 0 ? seriesDecum[0].withdrawal : 0;
    // Final portfolio at life expectancy (legacy / bequest)
    const portfolioAtLifeEnd = seriesDecum.length > 0 ? seriesDecum[seriesDecum.length - 1].portfolio : 0;

    // Public pension info — what user gets monthly starting at pension start age (nominal, year-1)
    const pen = plan.publicPension || { enabled: false };
    const pensionMonthly = pen.enabled ? (pen.monthlyAmount || 0) : 0;
    // Monthly pension at retireAge (might start later, so adjust for inflation)
    // If pension starts AFTER retire age, it's 0 at retireAge and kicks in later
    const yearsUntilPension = pen.enabled ? Math.max(0, (pen.startAge || 67) - profile.retireAge) : 0;
    // Combined monthly income at retirement (year-1, before pension kicks in if later)
    const totalMonthlyAtRetire = retirementMonthlyIncome + (yearsUntilPension === 0 ? pensionMonthly : 0);

    return {
      currentPortfolio,
      filledMonths, totalActual, totalPlannedSoFar, avgActual,
      diffSoFar: totalActual - totalPlannedSoFar,
      currentAporte: baseMonthly,
      currentIncome: currentMonthlyIncome(plan),
      seriesPlan, seriesActualPace, seriesPlanWithHypo,
      finalPlan, finalPace, finalPlanHypo,
      ahead: finalPace.portfolio > finalPlan.portfolio,
      // Decumulation outputs
      seriesDecum, depletedAtMonth, depletedAtAge,
      retirementMonthlyIncome, portfolioAtLifeEnd,
      // Pension outputs
      pensionMonthly, yearsUntilPension, totalMonthlyAtRetire,
      // Dual curves: plan original vs real reconstructed (from first registered month)
      seriesPlanFromStart, seriesRealFromStart,
      firstRegisteredKey, lastRegisteredKey,
      planPortfolioAtLastReg, realPortfolioAtLastReg,
      realVsPlanDelta, realVsPlanRatio,
      fiTarget, ageAtFiPlan, ageAtFiReal,
      cruceEdad, destinoEstado,
      // Veredicto único "¿voy bien?" (fuente de verdad para Hoy/Seguimiento/KpiPill)
      verdict, verdictAge, verdictCopy,
      // "Siguiente paso" · vías deterministas (coast / lean / fat / +5pp)
      coastEdad, leanEdad, leanPct, leanGastoMes, ahorroMas5Edad,
      fatEdad, fatPct, fatGastoMes,
      // v5 · "Antes de Mi Plan"
      effectiveReturn,
      usingDeclaredExpenses: useDeclaredExpensesNow,
    };
  }, [state, activePlan]);
}


export function usePlanMutators() {
  const { mutatePlan } = useStore();
  return useMemo(() => ({
    addIncome: () => mutatePlan(p => {
      const existing = p.incomeSegments || [];
      // Place new tramo after the last existing one (or today if empty)
      const sorted = [...existing].sort((a, b) => compareKeys(a.from || '', b.from || ''));
      const last = sorted[sorted.length - 1];
      const fromKey = last ? (last.to ? addMonthsKey(last.to, 1) : addMonthsKey(last.from, 12)) : todayKey();
      // Close the last one if it was open
      const updated = sorted.map((s, i) => i === sorted.length - 1 && !s.to ? { ...s, to: addMonthsKey(fromKey, -1) } : s);
      return { ...p, incomeSegments: [...updated, { id: uid(), from: fromKey, to: null, amount: last ? last.amount : 2000, label: 'Nuevo tramo' }] };
    }),
    updateIncome: (id, patch) => mutatePlan(p => ({ ...p, incomeSegments: (p.incomeSegments || []).map(s => s.id === id ? { ...s, ...patch } : s) })),
    deleteIncome: (id) => mutatePlan(p => ({ ...p, incomeSegments: (p.incomeSegments || []).filter(s => s.id !== id) })),
    addBonus: () => mutatePlan(p => ({ ...p, bonusSegments: [...(p.bonusSegments || []), { id: uid(), from: todayKey(), to: null, amount: 300, label: 'Plus' }] })), // bonus tramos sumando son OK
    updateBonus: (id, patch) => mutatePlan(p => ({ ...p, bonusSegments: (p.bonusSegments || []).map(s => s.id === id ? { ...s, ...patch } : s) })),
    deleteBonus: (id) => mutatePlan(p => ({ ...p, bonusSegments: (p.bonusSegments || []).filter(s => s.id !== id) })),
    addSaving: () => mutatePlan(p => {
      const existing = p.savingSegments || [];
      const sorted = [...existing].sort((a, b) => compareKeys(a.from || '', b.from || ''));
      const last = sorted[sorted.length - 1];
      const fromKey = last ? (last.to ? addMonthsKey(last.to, 1) : addMonthsKey(last.from, 12)) : todayKey();
      const updated = sorted.map((s, i) => i === sorted.length - 1 && !s.to ? { ...s, to: addMonthsKey(fromKey, -1) } : s);
      const defaults = last ? { type: last.type, value: last.value } : { type: 'fixed', value: 300 };
      return { ...p, savingSegments: [...updated, { id: uid(), from: fromKey, to: null, ...defaults, label: 'Aporte' }] };
    }),
    updateSaving: (id, patch) => mutatePlan(p => ({ ...p, savingSegments: (p.savingSegments || []).map(s => s.id === id ? { ...s, ...patch } : s) })),
    deleteSaving: (id) => mutatePlan(p => ({ ...p, savingSegments: (p.savingSegments || []).filter(s => s.id !== id) })),
    addEvent: () => mutatePlan(p => ({ ...p, events: [...(p.events || []), { id: uid(), date: addMonthsKey(todayKey(), 3), amount: 1000, label: 'Bonus', status: 'confirmado' }] })),
    updateEvent: (id, patch) => mutatePlan(p => ({ ...p, events: (p.events || []).map(e => e.id === id ? { ...e, ...patch } : e) })),
    deleteEvent: (id) => mutatePlan(p => ({ ...p, events: (p.events || []).filter(e => e.id !== id) })),
    replaceIncomeWith: (newTramos, replace) => mutatePlan(p => ({ ...p, incomeSegments: replace ? newTramos : [...(p.incomeSegments || []), ...newTramos] })),
    normalizeIncome: () => mutatePlan(p => ({ ...p, incomeSegments: normalizeSegments(p.incomeSegments || []) })),
    normalizeBonus: () => mutatePlan(p => ({ ...p, bonusSegments: normalizeSegments(p.bonusSegments || []) })),
    normalizeSaving: () => mutatePlan(p => ({ ...p, savingSegments: normalizeSegments(p.savingSegments || []) })),
    splitTramo: (kind, id) => mutatePlan(p => {
      const listKey = kind === 'income' ? 'incomeSegments' : kind === 'bonus' ? 'bonusSegments' : 'savingSegments';
      const list = p[listKey] || [];
      const idx = list.findIndex(s => s.id === id);
      if (idx < 0) return p;
      const s = list[idx];
      // Split at midpoint or 12 months from start if no end
      const endKey = s.to || addMonthsKey(s.from, 24);
      const midKey = addMonthsKey(s.from, Math.max(1, Math.floor((parseKeyMonths(endKey) - parseKeyMonths(s.from)) / 2)));
      const before = { ...s, to: addMonthsKey(midKey, -1) };
      const after = { ...s, id: uid(), from: midKey };
      const newList = [...list.slice(0, idx), before, after, ...list.slice(idx + 1)];
      return { ...p, [listKey]: newList };
    }),
  }), [mutatePlan]);
}

