// App completa (screens + fragmentos + editores + cards-con-state + onboardings
// + Shell + App) — extraída byte-a-byte de mi_plan_v1_5_0a_3.html. Etapa 1 ·
// Paso 3 · Tanda final. Consolidada en un módulo por su acoplamiento (fragmentos
// compartidos), para evitar imports circulares. Solo se añade imports/export.
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { T, WEB_URL } from '../tokens/index.js'
import {
  project, monthlyForGoal, uid, todayKey, addMonthsKey,
  compareKeys, isKeyInSegment, findActiveSegment, sumActiveSegments,
  readableMonth, projectV2, sumExpenses, sumAllocation,
  buildMortgageSchedule, currentMonthlyAporte, computePlannedFor,
  computeIncomeFor, toRealEur, estimateSpanishPension, computeEffectiveCapitalReturn,
  computeRebalance,
  runMonteCarlo,
  getSavingsTier, seedMonths, defaultGoals, computeUserProfile, projectStandardPlan, computeActivePhase,
  computeSinPlanKPIs, fmtEur, parseMonthsCSV,
} from '../lib/index.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import {
  EditableNumber, Pill, Card, Label, Btn, NextStep, Stat, SmallStat, Row,
  LegendChip, LearnIcon,
} from '../ui/index.jsx'
import {
  PosterFrame, Spread, SectionTag, EditableValue, CartelMonthValue, ComputedNumber, Reveal, LineIcon as CartelIcon,
  LifeChart, MonteCarloChart, Stats3, TramoRow as CartelTramoRow, fmtMoneyBig, fmtNum,
  CartelBtn, CartelCard, CartelLabel,
} from '../ui/cartel.jsx'
import {
  LineChart, MultiLineChart, FlowTimelineCard,
} from '../charts/index.jsx'
import {
  TABLON, LEARN_CORPUS, CATEGORY_LABELS, GOAL_CATEGORIES, GOAL_CATEGORY_LABEL, LEARN_DISCLAIMER,
  LEARN_LEVELS, LEARN_LEVEL_LABELS, LEARN_LEVEL_SUB, LEARN_LEVEL_BY_ID, GLOSSARY_ALIASES,
} from '../content/index.js'
import {
  ConfirmModal, WhyDifferentModal, MonthlyCalendarModal, PublicPensionDisclaimerModal,
  Concept, ConceptModal, AboutModal,
} from '../modals/index.jsx'
import { StateProvider, useStore, useDerived, usePlanMutators } from '../state/index.jsx'
import { LandingPreOnboarding, Landing } from '../flows/index.jsx'

// ── Plan BASE = solo eventos CONFIRMADOS ─────────────────────────────────────
// Fuente ÚNICA de verdad de si el TITULAR (curva hero de Proyección + Monte Carlo)
// cuenta los eventos POSIBLES (hipotéticos). Doctrina del producto: el plan base no
// se infla con lo que "podría pasar" (p.ej. una herencia escenario). Lo posible se
// muestra aparte —la línea "Con eventos posibles" del chart y el recordatorio bajo el
// hero—, nunca dentro de la cifra base. Un solo flag para que curva y MC NO se
// separen (vive a nivel de módulo porque MonteCarloCard y ScreenProyeccion son
// componentes distintos). Futuro: estado/toggle de usuario.
const INCLUDE_POSSIBLE = false;

// Mapeo del veredicto único (d.verdict de useDerived) a color de token y a tono de NextStep.
// Vive en la vista para mantener "color solo por tokens T.*" (state no importa tokens).
// Verde=adelantado, accent=en línea, ámbar=atrasado/no-llega, muted=sin-datos.
const VERDICT_COLOR = { adelantado: T.green, 'en-linea': T.accent, atrasado: T.amber, 'no-llega': T.amber, 'sin-datos': T.muted };
const VERDICT_NEXTSTEP_TONE = { adelantado: 'forward', 'en-linea': 'forward', atrasado: 'behind', 'no-llega': 'behind', 'sin-datos': 'forward' };

// Redondeo de PORCENTAJES para presentación · evita que un float crudo (p.ej.
// 22.166666666666668 de una tasa recalculada) se filtre a la UI. Máx 1 decimal, sin
// coma decimal colgando, separador es-ES (coma). Para CIFRAS € usar fmtEur/fmtNum.
const fmtPctView = (n) => {
  const r = Math.round((Number(n) || 0) * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
};

// Control de vista global de Proyección: cómo mostrar las cifras. Segmented Cartel
// (Nominal / € de hoy). Vive arriba (Hero), afecta a toda la pantalla. Antes era un switch
// "Ajustar por inflación" al final de Asunciones (doctrina §6 1.12+: control de vista global arriba).
export function DisplayModeToggle() {
  const { state, update, activePlan } = useStore();
  const mode = state.displayMode || 'nominal';
  const infl = activePlan.inflationRate != null ? activePlan.inflationRate : 2.5;
  const opts = [
    { id: 'nominal', label: 'Nominal', title: 'Cifras en valor nominal (los euros que tendrás, sin descontar inflación)' },
    { id: 'real', label: '€ de hoy', title: 'Cifras en poder adquisitivo actual (descuenta ' + infl + '% anual)' },
  ];
  return (
    <div role="group" aria-label="Cómo mostrar las cifras"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3, padding: 3,
        background: T.panel, borderRadius: 999, border: '1px solid ' + T.line, flexShrink: 0,
      }}>
      {opts.map((o) => {
        const active = mode === o.id;
        return (
          <button key={o.id} onClick={() => update({ displayMode: o.id })} title={o.title} aria-pressed={active}
            style={{
              fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase',
              padding: '5px 13px', borderRadius: 999, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: active ? T.accent : 'transparent', color: active ? T.bg : T.muted,
              transition: 'background 0.15s ease, color 0.15s ease', appearance: 'none', WebkitAppearance: 'none',
            }}>{o.label}</button>
        );
      })}
    </div>
  );
}

export function HouseholdSummaryCard() {
  const { accounts, activeAccountId, switchAccount } = useStore();
  const list = useMemo(() => Object.values(accounts || {}), [accounts]);
  if (list.length < 2) return null;

  const today = todayKey();
  const aggregates = useMemo(() => list.map((a) => {
    const state = a.state || {};
    const plan = state.plan || {};
    const profile = state.profile || {};

    // Patrimony estimation: capital + recorded actuals (does not include compound growth on past — approximation)
    const months = state.months || [];
    const totalActual = months.reduce((s, m) => s + (m.actual || 0), 0);
    const capital = plan.capital || 0;
    const portfolio = capital + totalActual;

    const income = computeIncomeFor(plan, today);
    const investment = computePlannedFor(plan, today);

    return { id: a.id, label: a.label, name: profile.name, portfolio, income, investment };
  }), [list]);

  const totalPortfolio = aggregates.reduce((s, a) => s + a.portfolio, 0);
  const totalIncome = aggregates.reduce((s, a) => s + a.income, 0);
  const totalInvestment = aggregates.reduce((s, a) => s + a.investment, 0);
  const householdRate = totalIncome > 0 ? totalInvestment / totalIncome : 0;

  return (
    <Card style={{ background: T.ink, color: T.bg, border: '1px solid ' + T.ink }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: 'rgba(255,255,255,0.5)' }}>
            Hogar · {list.length} personas
          </div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, letterSpacing: T.tracking.tight, marginTop: 4, lineHeight: T.lh.tight }}>
            {fmtEur(totalPortfolio)}
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: 'rgba(255,255,255,0.65)', fontSize: T.size.caption, marginTop: 4 }}>
            patrimonio conjunto hoy
          </div>
        </div>
      </div>

      {/* Combined flow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '14px 0', borderTop: '1px dashed rgba(255,255,255,0.18)', borderBottom: '1px dashed rgba(255,255,255,0.18)' }}>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Ingreso conjunto</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight }}>
            {fmtEur(totalIncome)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Inversión conjunta</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, color: '#86efac' }}>
            {fmtEur(totalInvestment)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Tasa hogar</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, color: householdRate >= 0.20 ? '#86efac' : householdRate >= 0.10 ? '#fcd34d' : '#fca5a5' }}>
            {Math.round(householdRate * 100)}%
          </div>
        </div>
      </div>

      {/* Per-person breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
        {aggregates.map((a) => {
          const isActive = a.id === activeAccountId;
          return (
            <button key={a.id} onClick={() => switchAccount(a.id)} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
              padding: '8px 10px', borderRadius: 8,
              background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: '1px solid ' + (isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'),
              cursor: 'pointer', textAlign: 'left',
              fontFamily: T.serif, color: T.bg,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 999,
                background: isActive ? T.accent : 'rgba(255,255,255,0.25)',
              }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: T.size.body }}>
                {a.label}
                {isActive && <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.accent, marginLeft: 8, letterSpacing: 0 }}>activa</span>}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: 'rgba(255,255,255,0.65)', letterSpacing: T.tracking.wide, textAlign: 'right' }}>
                {fmtEur(a.portfolio)} · {fmtEur(a.investment)}/mes
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function MonthlyFlowCard({ plan, profile }) {
  const { state } = useStore();
  const tk = todayKey();
  const income = sumActiveSegments(plan.incomeSegments, tk);
  const bonus = sumActiveSegments(plan.bonusSegments, tk);
  const totalIncome = income + bonus;
  const planAporte = computePlannedFor(plan, tk);
  const planRate = totalIncome > 0 ? planAporte / totalIncome : 0;
  const planLife = Math.max(0, totalIncome - planAporte);

  // Real value from current month if registered
  const currentMonth = (state.months || []).find(m => m.key === tk);
  const realAporte = currentMonth && currentMonth.actual != null ? currentMonth.actual : null;
  const realRate = realAporte != null && totalIncome > 0 ? realAporte / totalIncome : null;
  const realLife = realAporte != null ? Math.max(0, totalIncome - realAporte) : null;
  const delta = realAporte != null ? realAporte - planAporte : null;

  if (totalIncome === 0) {
    return (
      <Card>
        <Label>Tu mes</Label>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 12, lineHeight: T.lh.normal }}>
          Define tu ingreso en <strong style={{ color: T.ink, fontStyle: 'normal' }}>Proyección → Tramos de ingreso</strong> para ver el flujo.
        </div>
      </Card>
    );
  }

  const monthLabel = readableMonth(tk);

  // Color the rate by category (green = vamos bien, amber = baja)
  const rateColor = (r) => r >= 0.20 ? T.green : r >= 0.10 ? T.ink : T.amber;

  const FlowBar = ({ aporte, life, rate, label, accent }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>{label}</div>
        <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: rateColor(rate), letterSpacing: T.tracking.wide, fontWeight: 600 }}>
          {(rate * 100).toFixed(0)}% inversión
        </div>
      </div>
      <div style={{ display: 'flex', height: 34, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + T.line }}>
        <div style={{
          width: (rate * 100).toFixed(1) + '%',
          background: T.green, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase',
          minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          {rate > 0.12 ? fmtEur(aporte) : ''}
        </div>
        <div style={{
          width: (100 - rate * 100).toFixed(1) + '%',
          background: T.panel, color: T.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase',
          minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          {rate < 0.85 ? fmtEur(life) : ''}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <Label>Tu mes · {monthLabel}</Label>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, letterSpacing: T.tracking.tight, marginTop: 4, lineHeight: T.lh.tight }}>
            {fmtEur(totalIncome)}<span style={{ fontSize: T.size.lead, color: T.muted, fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto' }}> /mes ingreso</span>
          </div>
          {bonus > 0 && (
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 4, letterSpacing: T.tracking.wide }}>
              {fmtEur(income)} base + {fmtEur(bonus)} complementos
            </div>
          )}
        </div>
      </div>

      <FlowBar aporte={planAporte} life={planLife} rate={planRate} label="Plan" />

      {realAporte != null ? (
        <>
          <FlowBar aporte={realAporte} life={realLife} rate={realRate} label="Real" />
          <div style={{
            marginTop: 6, padding: '8px 12px',
            background: delta >= 0 ? 'rgba(21,128,61,0.06)' : 'rgba(180,83,9,0.06)',
            border: '1px solid ' + (delta >= 0 ? T.green : T.amber),
            borderRadius: 8,
            fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, lineHeight: T.lh.snug,
            color: delta >= 0 ? T.green : T.amber,
          }}>
            {delta >= 0
              ? <>Vas <strong style={{ fontStyle: 'normal' }}>{fmtEur(delta)} por delante</strong> este mes. ✓</>
              : <>Vas <strong style={{ fontStyle: 'normal' }}>{fmtEur(-delta)} por debajo</strong> este mes.</>}
          </div>
        </>
      ) : (
        <div style={{
          marginTop: 4, padding: '8px 12px',
          background: 'transparent', border: '1px dashed ' + T.line, borderRadius: 8,
          fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.muted, lineHeight: T.lh.snug,
        }}>
          Registra este mes en <strong style={{ color: T.ink, fontStyle: 'normal' }}>Mes a mes</strong> para ver tu real frente al plan.
        </div>
      )}
    </Card>
  );
}

export function Onboarding() {
  const { update, seedDemoConfirm } = useStore();
  const mobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '',
    age: 28,
    retireAge: 60,
    capital: 1000,
    monthly: 300,
    income: 2000,
    savingType: 'percent',     // 'fixed' | 'percent' — default proportional so it grows with salary
    savingPercent: 15,         // when type=percent
    evolution: null,
    evoStep: 200,
    evoEvery: 12,
    evoCap: 5000,
    // F1.5 · Inline variable progression. null until the user picks "variable".
    variableSegments: null,
    // B3 · 1.0 = salary fully tracks IPC; 0.0 = does not; in between = partial.
    salaryInflationFactor: 1.0,
    annualReturn: 8,
    firstGoal: 'libertad',
    // v5 · "Antes de Mi Plan"
    actualLife: null,           // null when not completed, full payload when completed
  });
  // v5.11 (F1.6) · El modal ActualLifeOnboarding ya no se lanza desde el
  // onboarding inicial. Su antiguo state local se ha eliminado.

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  // `livePlan` retirado: solo lo usaba el paso "Antes de soltarte" del
  // onboarding (ya eliminado). Ese contenido vive ahora, mejor, en la pantalla
  // Plan (la bifurcación). `live`/`final` (panel de preview) ya se habían quitado.

  const steps = [
    {
      title: 'Empecemos. ¿Cómo te llamas?',
      sub: 'Solo lo usaremos aquí dentro. Nada sale de tu dispositivo.',
      input: (
        <input autoFocus value={data.name} onChange={(e) => set('name', e.target.value)} placeholder="Tu nombre"
          style={{
            fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: 64, /* excepción · hero del input "nombre" en Onboarding paso 1 */ color: T.accent, background: 'transparent',
            border: 'none', borderBottom: '2px solid ' + T.line, outline: 'none',
            width: '100%', padding: '8px 0', letterSpacing: T.tracking.display,
          }}
        />
      ),
      canNext: !!data.name.trim(),
    },
    {
      title: `Encantado, ${data.name || 'amigo'}. ¿Cuántos años tienes?`,
      sub: 'El tiempo es tu mayor activo.',
      input: (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <EditableNumber value={data.age} onChange={(v) => set('age', v)} min={16} max={80} width={140} />
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, color: T.muted }}>años</span>
          </div>
          <input type="range" min="18" max="70" value={data.age} onChange={(e) => set('age', +e.target.value)}
            style={{ width: '100%', accentColor: T.accent, marginTop: 20 }} />
          <OnboardingHelp>
            Porque el tiempo es la variable más poderosa de tu plan financiero. Más que el sueldo, más que la rentabilidad, más que la disciplina. El interés compuesto crece de forma exponencial sobre los años: 10 años de adelanto pesan más que doblar la aportación durante los últimos 10. Con tu edad, Mi Plan FIRE calcula tu horizonte temporal y proyecta cómo se comporta tu dinero a lo largo de las próximas décadas.
          </OnboardingHelp>
        </div>
      ),
      canNext: data.age >= 16,
    },
    {
      title: '¿Tienes ya algo invertido o ahorrado?',
      sub: 'Aunque sean cero, está bien.',
      input: (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
            <EditableNumber value={data.capital} onChange={(v) => set('capital', v)} min={0} max={10_000_000} width={220} />
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, color: T.muted }}>€</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[0, 500, 2000, 5000, 15000, 50000].map((v) => (
              <button key={v} onClick={() => set('capital', v)}
                style={{
                  fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '8px 14px',
                  background: data.capital === v ? T.ink : 'transparent',
                  color: data.capital === v ? T.bg : T.muted,
                  border: '1px solid ' + (data.capital === v ? T.ink : T.line),
                  borderRadius: 999, cursor: 'pointer',
                }}>{fmtEur(v)}</button>
            ))}
          </div>
          <OnboardingHelp title="¿Por qué importa el capital inicial?">
            Porque el dinero que ya tienes empieza a trabajar desde el día uno. Cualquier euro que aportes en el futuro pierde ese tiempo de adelanto. 1.000€ invertidos hoy al 7% se convierten en ~7.612€ a los 30 años. Los próximos 1.000€ que aportes dentro de un año solo tendrán 29 años de margen: llegarán a ~7.114€. Si no tienes nada todavía, no pasa nada — pon 0. La magia está en lo que empieces a aportar a partir de ahora.
          </OnboardingHelp>
        </div>
      ),
      canNext: true,
    },
    {
      title: `${data.name || ''}, ¿cuánto ganas al mes?`,
      sub: 'Aproximado, neto.',
      input: (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <EditableNumber value={data.income} onChange={(v) => set('income', v)} min={0} max={50000} color={T.accent} />
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, color: T.muted }}>€ / mes</span>
            <span style={{
              fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '5px 10px',
              background: T.accent, color: '#fff',
              borderRadius: 4, letterSpacing: T.tracking.widest, textTransform: 'uppercase', fontWeight: 600,
              alignSelf: 'center',
            }}>Neto</span>
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal, marginBottom: 14 }}>
            Introduce tu salario <strong style={{ color: T.ink, fontStyle: 'normal' }}>neto</strong>, no el bruto.
          </div>
          <input type="range" min="0" max="10000" step="100" value={data.income} onChange={(e) => set('income', +e.target.value)}
            style={{ width: '100%', accentColor: T.accent }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {[1200, 2000, 3000, 4500, 6000, 8000].map((v) => (
              <button key={v} onClick={() => set('income', v)}
                style={{
                  fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '8px 14px',
                  background: data.income === v ? T.ink : 'transparent',
                  color: data.income === v ? T.bg : T.muted,
                  border: '1px solid ' + (data.income === v ? T.ink : T.line),
                  borderRadius: 999, cursor: 'pointer',
                }}>{fmtEur(v)}</button>
            ))}
          </div>
          {/* B3 · IPC update question */}
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px dashed ' + T.lineSoft }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.muted, marginBottom: 10 }}>
              ¿Tu salario se actualiza con la inflación (IPC)?
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {[
                { id: 'full', label: 'Sí, completamente', factor: 1.0 },
                { id: 'partial', label: 'Parcialmente', factor: 'partial' },
                { id: 'none', label: 'No', factor: 0.0 },
              ].map((opt) => {
                const cur = data.salaryInflationFactor != null ? data.salaryInflationFactor : 1.0;
                const isActive = opt.factor === 'partial'
                  ? (cur > 0 && cur < 1)
                  : Math.abs(cur - opt.factor) < 0.001;
                return (
                  <button key={opt.id} onClick={() => {
                    if (opt.factor === 'partial') {
                      // Initialize partial to 50% if not already partial.
                      const c = data.salaryInflationFactor;
                      if (c == null || c >= 1 || c <= 0) set('salaryInflationFactor', 0.5);
                    } else {
                      set('salaryInflationFactor', opt.factor);
                    }
                  }} style={{
                    fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '10px 14px',
                    background: isActive ? T.ink : 'transparent',
                    color: isActive ? T.bg : T.muted,
                    border: '1px solid ' + (isActive ? T.ink : T.line),
                    borderRadius: 999, cursor: 'pointer',
                    letterSpacing: T.tracking.wider, textTransform: 'uppercase',
                  }}>{opt.label}</button>
                );
              })}
            </div>
            {(() => {
              const cur = data.salaryInflationFactor != null ? data.salaryInflationFactor : 1.0;
              if (cur > 0 && cur < 1) {
                return (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>% del IPC</span>
                    <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink }}>
                      <EditableNumber value={Math.round(cur * 100)} onChange={(v) => set('salaryInflationFactor', Math.max(0, Math.min(100, v)) / 100)} min={0} max={100} step={1} color={T.ink} /> %
                    </span>
                  </div>
                );
              }
              return null;
            })()}
            {/* 2ª pasada · aclaración IPC movida al "+¿por qué?" (limpieza). */}
          </div>
          <OnboardingHelp title="¿Por qué necesito tu salario?">
            Porque es la base sobre la que se construye tu capacidad de ahorro y, por tanto, de inversión. No te lo pedimos para juzgar nada. Lo usamos para estimar cuánto puedes aportar de forma realista, y para proyectar tu pensión pública futura (la fórmula española se basa en las bases de cotización de tu carrera laboral). Si tu sueldo cambia con frecuencia, puedes definir distintos tramos más adelante. Una cifra aproximada al mes es suficiente al principio.
            <br /><br />
            Introduce tu salario neto (lo que efectivamente recibes en cuenta cada mes después de IRPF y Seguridad Social), no el bruto. Si pones bruto, el plan estará distorsionado. Ejemplo: si tu bruto es 35.000 €/año y el neto que ingresas son 24.000 €/año, divide 24.000/12 = 2.000 € mensuales netos.
            <br /><br />
            En España la mayoría de convenios actualizan parcialmente con IPC. Si tu empresa no lo hace, marca "No"; el plan será más realista.
          </OnboardingHelp>
        </div>
      ),
      canNext: data.income > 0,
    },
    {
      title: '¿Cuánto de eso puedes guardar?',
      sub: 'Elige primero el tipo: que crezca con tu sueldo, o que se mantenga fijo.',
      input: (
        <div>
          {/* Type toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: 4, background: T.panel, borderRadius: 999, border: '1px solid ' + T.line }}>
            {[
              { id: 'percent', l: 'Proporcional', icon: '📈' },
              { id: 'fixed', l: 'Fijo en €', icon: '📌' },
            ].map((opt) => (
              <button key={opt.id} onClick={() => set('savingType', opt.id)}
                style={{
                  flex: 1, fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '10px 12px',
                  background: data.savingType === opt.id ? T.ink : 'transparent',
                  color: data.savingType === opt.id ? T.bg : T.muted,
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                  letterSpacing: T.tracking.wider, textTransform: 'uppercase',
                }}>{opt.icon} {opt.l}</button>
            ))}
          </div>
          {/* B4 · Explicación Porcentual/Fijo movida al "+¿por qué?" (limpieza). */}
          {/* 2ª pasada · preview en vivo redundante eliminada: el aporte en € ya se
              muestra junto al campo, justo debajo (eco de valor por modo). */}

          {data.savingType === 'percent' ? (() => {
            const tier = getSavingsTier(data.savingPercent);
            return (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                <EditableNumber value={data.savingPercent} onChange={(v) => set('savingPercent', Math.max(0, Math.min(100, v)))} min={0} max={100} color={T.accent} />
                <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, color: T.muted }}>%</span>
                <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: tier.color, letterSpacing: 0 }}>{tier.label}</span>
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginBottom: 8 }}>
                {data.income > 0 ? (
                  <>= <strong style={{ color: T.accent, fontStyle: 'normal' }}>{fmtEur(Math.round(data.income * data.savingPercent / 100))}/mes</strong> hoy · sube con tu sueldo.</>
                ) : (
                  <>Sube con tu sueldo, así si ganas más también ahorras más.</>
                )}
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: tier.color, fontSize: T.size.body, lineHeight: T.lh.normal, marginBottom: 14 }}>
                {tier.message}
              </div>
              <input type="range" min="0" max="100" step="1" value={data.savingPercent} onChange={(e) => set('savingPercent', +e.target.value)}
                style={{ width: '100%', accentColor: T.accent }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {[10, 15, 20, 25, 30].map((p) => (
                  <button key={p} onClick={() => set('savingPercent', p)}
                    style={{
                      fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '8px 14px',
                      background: data.savingPercent === p ? T.ink : 'transparent',
                      color: data.savingPercent === p ? T.bg : T.muted,
                      border: '1px solid ' + (data.savingPercent === p ? T.ink : T.line),
                      borderRadius: 999, cursor: 'pointer',
                    }}>{p}%</button>
                ))}
              </div>
            </>
            );
          })() : (() => {
            const ratio = data.income > 0 ? (data.monthly / data.income) * 100 : 0;
            const tier = data.income > 0 ? getSavingsTier(ratio) : null;
            return (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                <EditableNumber value={data.monthly} onChange={(v) => set('monthly', Math.max(0, Math.min(v, 20000)))} min={0} max={20000} color={T.accent} />
                <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, color: T.muted }}>€ / mes</span>
                {tier && (
                  <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: tier.color, letterSpacing: 0 }}>{tier.label}</span>
                )}
              </div>
              {data.income > 0 && (
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginBottom: 8 }}>
                  Hoy es un <strong style={{ color: T.accent, fontStyle: 'normal' }}>{Math.round(ratio)}%</strong>. No crecerá aunque suba tu sueldo.
                </div>
              )}
              {tier && (
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: tier.color, fontSize: T.size.body, lineHeight: T.lh.normal, marginBottom: 14 }}>
                  {tier.message}
                </div>
              )}
              <input type="range" min="0" max={Math.max(500, data.income || 5000)} step="50" value={data.monthly} onChange={(e) => set('monthly', +e.target.value)}
                style={{ width: '100%', accentColor: T.accent }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {data.income > 0 ? [
                  { l: '10%', v: Math.round(data.income * 0.10) },
                  { l: '15%', v: Math.round(data.income * 0.15) },
                  { l: '20%', v: Math.round(data.income * 0.20) },
                  { l: '30%', v: Math.round(data.income * 0.30) },
                ].map((c) => (
                  <button key={c.l} onClick={() => set('monthly', c.v)}
                    style={{
                      fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '8px 14px',
                      background: Math.abs(data.monthly - c.v) < 5 ? T.ink : 'transparent',
                      color: Math.abs(data.monthly - c.v) < 5 ? T.bg : T.muted,
                      border: '1px solid ' + (Math.abs(data.monthly - c.v) < 5 ? T.ink : T.line),
                      borderRadius: 999, cursor: 'pointer',
                    }}>{c.l} · {fmtEur(c.v)}</button>
                )) : null}
              </div>
            </>
            );
          })()}
          <OnboardingHelp title="¿Por qué importa cuánto puedes ahorrar?">
            Porque es la única variable que controlas con certeza completa. La rentabilidad la decide el mercado. La inflación la decide la economía. Las comisiones dependen del producto. Pero cuánto ahorras es decisión tuya, mes a mes. No te pedimos un compromiso: te pedimos una estimación realista. Si dudas, piensa qué te queda al final del mes habitualmente. Empezar con 50€/mes y subir progresivamente es mucho mejor que empezar con 300€ inalcanzables y abandonar a los tres meses.
            <br /><br />
            <strong style={{ color: T.ink, fontStyle: 'normal' }}>Porcentual</strong>: aportas un % de tu salario neto cada mes (ej. 20% del neto). Si subes de sueldo, el aporte sube; si baja, baja. <strong style={{ color: T.ink, fontStyle: 'normal' }}>Fijo</strong>: aportas siempre la misma cantidad cada mes (ej. 700 €/mes) independientemente de tu salario.
          </OnboardingHelp>
        </div>
      ),
      canNext: true,
    },
    {
      title: '¿Tu salario evoluciona con el tiempo?',
      sub: 'Elige lo que más se parezca a tu realidad.',
      input: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { id: 'estable', t: 'Estable', d: 'Mi sueldo se mantiene similar año tras año.' },
            { id: 'escalonado', t: 'Escalonado', d: 'Sube por tramos (oposiciones, antigüedad, ascensos predecibles).' },
            { id: 'variable', t: 'Variable', d: 'No tengo un patrón claro — lo configuraré yo en Ajustes.' },
          ].map((opt) => (
            <button key={opt.id} onClick={() => set('evolution', opt.id)}
              style={{
                textAlign: 'left', cursor: 'pointer',
                background: data.evolution === opt.id ? T.ink : T.paper,
                color: data.evolution === opt.id ? T.bg : T.ink,
                border: '1px solid ' + (data.evolution === opt.id ? T.ink : T.line),
                borderRadius: 12, padding: '16px 18px',
                fontFamily: T.serif,
              }}>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight }}>{opt.t}</div>
              <div style={{ fontSize: T.size.body, fontStyle: 'italic', marginTop: 4, opacity: 0.85 }}>{opt.d}</div>
            </button>
          ))}
          {data.evolution === 'escalonado' && (
            <div style={{ background: T.panel, border: '1px solid ' + T.line, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              <Label>Define tu progresión</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <div>
                  <Label style={{ marginBottom: 4 }}>Sube cada</Label>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <EditableNumber value={data.evoEvery} onChange={(v) => set('evoEvery', v)} min={1} max={120} color={T.ink} />
                    <span style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.lead }}>meses</span>
                  </div>
                </div>
                <div>
                  <Label style={{ marginBottom: 4 }}>+</Label>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <EditableNumber value={data.evoStep} onChange={(v) => set('evoStep', v)} min={0} max={5000} color={T.ink} />
                    <span style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.lead }}>€/mes</span>
                  </div>
                </div>
                <div>
                  <Label style={{ marginBottom: 4 }}>Hasta tope</Label>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <EditableNumber value={data.evoCap} onChange={(v) => set('evoCap', v)} min={data.income} max={50000} color={T.ink} />
                    <span style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.lead }}>€/mes</span>
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wide }}>Importes en neto (lo que recibes en cuenta), igual que tu salario — no el bruto.</div>
              {/* F1.4 · Inline explanation of "tope" */}
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal, paddingTop: 6, borderTop: '1px dashed ' + T.lineSoft }}>
                <strong style={{ color: T.ink, fontStyle: 'normal' }}>Tope</strong>: el salario máximo al que esperas llegar en tu carrera. Si dejas el mismo valor que tu salario actual, no habrá progresión.
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal }}>
                Empezando en {fmtEur(data.income)}/mes, +{fmtEur(data.evoStep)} cada {data.evoEvery} meses, hasta {fmtEur(data.evoCap)}. Genera ~{Math.min(50, Math.ceil(Math.max(0, data.evoCap - data.income) / Math.max(1, data.evoStep)) + 1)} tramos.
              </div>
            </div>
          )}
          {/* F1.5 · Variable: configurar inline en lugar de redirigir a Ajustes */}
          {data.evolution === 'variable' && (
            <div style={{ background: T.panel, border: '1px solid ' + T.line, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Label>Define tu progresión (hasta 4 tramos)</Label>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal }}>
                Sin patrón claro: define los tramos que conozcas. Si necesitas más adelante, los amplias en <strong style={{ color: T.ink, fontStyle: 'normal' }}>Proyección → Tramos de ingreso</strong>.
              </div>
              {(data.variableSegments || [{ amount: data.income, fromMonth: 0 }]).slice(0, 4).map((seg, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, padding: '10px 12px', background: T.bg, border: '1px solid ' + T.lineSoft, borderRadius: 8 }}>
                  <div>
                    <Label style={{ marginBottom: 4 }}>{idx === 0 ? 'Salario inicial' : `Tramo ${idx + 1}`}</Label>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <EditableNumber
                        value={seg.amount}
                        onChange={(v) => {
                          const segs = (data.variableSegments || [{ amount: data.income, fromMonth: 0 }]).slice(0, 4);
                          while (segs.length <= idx) segs.push({ amount: data.income, fromMonth: 0 });
                          segs[idx] = { ...segs[idx], amount: v };
                          set('variableSegments', segs);
                        }}
                        min={0} max={50000} color={T.ink} />
                      <span style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.body }}>€/mes</span>
                    </div>
                  </div>
                  {idx > 0 && (
                    <div>
                      <Label style={{ marginBottom: 4 }}>Empieza a los</Label>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <EditableNumber
                          value={seg.fromMonth}
                          onChange={(v) => {
                            const segs = (data.variableSegments || [{ amount: data.income, fromMonth: 0 }]).slice(0, 4);
                            while (segs.length <= idx) segs.push({ amount: data.income, fromMonth: 0 });
                            segs[idx] = { ...segs[idx], fromMonth: v };
                            set('variableSegments', segs);
                          }}
                          min={1} max={480} color={T.ink} />
                        <span style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.body }}>meses</span>
                      </div>
                    </div>
                  )}
                  {idx > 0 && (
                    <button onClick={() => {
                      const segs = (data.variableSegments || []).filter((_, i) => i !== idx);
                      set('variableSegments', segs);
                    }} style={{
                      alignSelf: 'flex-end', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint,
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, letterSpacing: T.tracking.wider, textTransform: 'uppercase',
                    }}>× quitar</button>
                  )}
                </div>
              ))}
              {(!data.variableSegments || data.variableSegments.length < 4) && (
                <button onClick={() => {
                  const segs = data.variableSegments || [{ amount: data.income, fromMonth: 0 }];
                  const last = segs[segs.length - 1] || { amount: data.income, fromMonth: 0 };
                  set('variableSegments', [...segs, { amount: last.amount, fromMonth: (last.fromMonth || 0) + 12 }]);
                }} style={{
                  alignSelf: 'flex-start', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.accent,
                  background: 'transparent', border: '1px dashed ' + T.accent, cursor: 'pointer',
                  padding: '8px 14px', borderRadius: 999, letterSpacing: T.tracking.wider, textTransform: 'uppercase',
                }}>+ Añadir tramo</button>
              )}
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.faint, fontSize: T.size.caption, lineHeight: T.lh.normal }}>
                Continuar configurando más tarde en <strong style={{ color: T.ink, fontStyle: 'normal' }}>Proyección → Tramos de ingreso</strong>.
              </div>
            </div>
          )}
          <OnboardingHelp title="¿Por qué pregunto cómo crees que evolucionará tu sueldo?">
            Porque casi nadie gana lo mismo a los 30 que a los 50. La gente cambia de trabajo, sube de puesto, cambia de sector, se hace autónoma. Si Mi Plan FIRE asumiera tu sueldo actual durante 30 años, te subestimaría: probablemente puedas aportar más en el futuro que ahora. Pero también puede sobreestimarte: hay carreras que se estancan o ingresos que bajan en cierta etapa. Tu estimación honesta sobre cómo crees que será tu trayectoria nos permite proyectar de forma realista, no idealista.
          </OnboardingHelp>
        </div>
      ),
      canNext: data.evolution != null,
    },
    {
      title: '¿Para cuándo te ves descansando del trabajo?',
      sub: 'No tiene que ser jubilación clásica.',
      input: (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, color: T.muted }}>a los</span>
            <EditableNumber value={data.retireAge} onChange={(v) => set('retireAge', v)} min={data.age + 1} max={90} width={140} />
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, color: T.muted }}>años</span>
          </div>
          <input type="range" min={data.age + 1} max="85" value={data.retireAge} onChange={(e) => set('retireAge', +e.target.value)}
            style={{ width: '100%', accentColor: T.accent }} />
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 14 }}>
            Eso te da <strong style={{ color: T.accent, fontStyle: 'normal' }}>{data.retireAge - data.age} años</strong> para que el interés compuesto trabaje a tu favor.
          </div>
          <OnboardingHelp title="¿Por qué te pregunto cuándo quieres retirarte?">
            Porque define la meta. No es solo cuándo dejas de trabajar formalmente: es cuándo quieres ser financieramente independiente, es decir, cuándo tu patrimonio invertido debería poder sostenerte sin necesidad de un sueldo. No tienes que clavarlo: pon una primera referencia. Mucha gente apunta a los 65 (jubilación tradicional), otros a los 55-60 (libertad temprana), algunos al objetivo FIRE clásico de los 45-50. Mi Plan FIRE calcula cuánto patrimonio necesitarías acumular para llegar a esa meta. Puedes cambiarla cuando quieras.
          </OnboardingHelp>
        </div>
      ),
      canNext: data.retireAge > data.age,
    },
  ];

  const isLast = step === steps.length - 1;
  const s = steps[step];

  const finish = () => {
    const tk = todayKey();
    // Build income segments based on evolution choice
    let incomeSegments;
    if (data.evolution === 'escalonado' && data.evoStep > 0 && data.evoCap > data.income) {
      // Stepwise progression: build one segment per cap-step, and on the last
      // partial step before reaching evoCap, shorten the duration proportionally
      // and add a final open-ended segment at evoCap so the cap is actually reached.
      const segs = [];
      let amount = data.income;
      let cursor = tk;
      let safety = 0;
      while (amount < data.evoCap && safety < 50) {
        const nextAmount = amount + data.evoStep;
        const next = addMonthsKey(cursor, data.evoEvery);
        if (nextAmount >= data.evoCap) {
          const fractionMonths = Math.max(1, Math.round((data.evoCap - amount) / data.evoStep * data.evoEvery));
          const shortEnd = addMonthsKey(cursor, fractionMonths);
          segs.push({ id: uid(), from: cursor, to: addMonthsKey(shortEnd, -1), amount, label: 'Salario' });
          segs.push({ id: uid(), from: shortEnd, to: null, amount: data.evoCap, label: 'Salario' });
          break;
        }
        segs.push({ id: uid(), from: cursor, to: addMonthsKey(next, -1), amount, label: 'Salario' });
        cursor = next;
        amount = nextAmount;
        safety++;
      }
      if (segs.length === 0) segs.push({ id: uid(), from: tk, to: null, amount: data.income, label: 'Salario' });
      incomeSegments = segs;
    } else if (data.evolution === 'variable' && data.variableSegments && data.variableSegments.length > 0) {
      // F1.5 · Persist the inline-defined variable tramos.
      const segs = data.variableSegments.slice(0, 4).map((s, i, arr) => {
        const from = addMonthsKey(tk, s.fromMonth || 0);
        const next = arr[i + 1];
        const to = next ? addMonthsKey(tk, (next.fromMonth || 0) - 1) : null;
        return { id: uid(), from, to, amount: s.amount, label: 'Salario' };
      });
      incomeSegments = segs.length ? segs : [{ id: uid(), from: tk, to: null, amount: data.income, label: 'Salario' }];
    } else {
      // estable / default → single open tramo
      incomeSegments = [{ id: uid(), from: tk, to: null, amount: data.income, label: 'Salario' }];
    }

    // Preserve actualLife if the user filled in the secondary mini-onboarding.
    const actualLifePayload = data.actualLife && data.actualLife.completed ? data.actualLife : {
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
    update({
      schemaVersion: 2,
      landingSeen: true,
      onboardingComplete: true,
      profile: { name: data.name, age: data.age, retireAge: data.retireAge },
      plan: {
        capital: data.capital,
        annualReturn: data.annualReturn,
        inflationRate: 2.5,
        withdrawalRate: 4.0,
        lifeExpectancy: 90,
        salaryInflationFactor: data.salaryInflationFactor != null ? data.salaryInflationFactor : 1.0,
        publicPension: {
          enabled: false, startAge: 67, monthlyAmount: 0, yearsContributed: 0, autoEstimate: true,
        },
        actualLife: actualLifePayload,
        monthlyPlanned: data.savingType === 'percent' ? Math.round((data.income || 0) * data.savingPercent / 100) : data.monthly,
        incomeSegments,
        bonusSegments: [],
        savingSegments: [
          data.savingType === 'percent'
            ? { id: uid(), from: tk, to: null, type: 'percent', value: data.savingPercent, label: 'Aporte ' + data.savingPercent + '% del ingreso' }
            : { id: uid(), from: tk, to: null, type: 'fixed', value: data.monthly, label: 'Aporte mensual' }
        ],
        events: [],
      },
      sandbox: null,
      months: seedMonths(data.savingType === 'percent' ? Math.round((data.income || 0) * data.savingPercent / 100) : data.monthly),
      goals: defaultGoals(data),
      activeTab: 'hoy',
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: T.bg, fontFamily: T.serif, color: T.ink, display: 'grid', gridTemplateColumns: '1fr', overflow: 'hidden' }}>
      {/* Conversación · una sola columna (panel de preview en vivo eliminado) */}
      <div style={{ padding: mobile ? '32px 24px' : '64px 80px', display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto', width: '100%', maxWidth: mobile ? '100%' : 720, margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <LogoMenu fontSize={22} />
          <button onClick={() => seedDemoConfirm()}
            style={{
              fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, background: 'transparent',
              border: 'none', cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
            }}>Saltar · usar demo</button>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: i <= step ? T.accent : T.line, borderRadius: 2, transition: 'background 0.3s' }} />
          ))}
        </div>

        <Label>Paso {step + 1} de {steps.length}</Label>

        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 36 : 56, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, textWrap: 'pretty' }}>
          {s.title}
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.lead, lineHeight: T.lh.normal, maxWidth: 480 }}>
          {s.sub}
        </div>

        <div style={{ marginTop: 12 }}>{s.input}</div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24 }}>
          <button onClick={() => setStep((p) => Math.max(0, p - 1))} disabled={step === 0}
            style={{
              fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '12px 0', background: 'transparent',
              border: 'none', color: step === 0 ? T.line : T.muted,
              cursor: step === 0 ? 'default' : 'pointer', letterSpacing: T.tracking.widest, textTransform: 'uppercase',
            }}>← Atrás</button>
          {isLast ? (
            <Btn variant="accent" size="lg" onClick={() => {
              // Force any focused EditableNumber to commit its draft before saving.
              if (typeof document !== 'undefined' && document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
              }
              finish();
            }}>Ver mi plan →</Btn>
          ) : (
            <Btn variant="primary" size="lg" onClick={() => {
              if (typeof document !== 'undefined' && document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
              }
              if (s.canNext) setStep((p) => p + 1);
            }} style={{ opacity: s.canNext ? 1 : 0.4 }}>Siguiente →</Btn>
          )}
        </div>
      </div>

      {/* F1.6 · ActualLifeOnboarding modal no longer launches from the initial
          onboarding. */}
    </div>
  );
}

export function RutaCincoFases({ state, d, mobile }) {
  const { plan } = state;
  const { updatePlan, update } = useStore();
  const route = useMemo(() => computeActivePhase(state, d), [state, d]);
  // Selección de fase para el panel de detalle integrado (por defecto = activa).
  const [selected, setSelected] = useState(null);
  // Ref al panel de detalle: al tocar una pestaña en móvil, lo traemos a la vista
  // (el panel siempre está montado; solo cambia su contenido) → el cambio se percibe.
  const panelRef = useRef(null);
  const selectPhase = (num) => {
    setSelected(num);
    if (mobile && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const toggleManual = (stepId, currentlyChecked) => {
    const prev = plan.phaseManualChecks || {};
    const next = { ...prev };
    if (currentlyChecked) delete next[stepId];
    else next[stepId] = new Date().toISOString();
    updatePlan({ phaseManualChecks: next });
  };

  // v1.2.1 · Estimaciones basadas en el plan real del usuario (Item 4).
  // Antes de v1.2.1, phaseEstimate devolvía offsets mágicos hardcodeados; ahora
  // cada fase tiene su propia lógica derivada del estado del usuario.
  const phaseEstimate = (phaseNum) => {
    const phase = route.phases[phaseNum - 1];
    if (phase.skipped) return 'No aplica';
    if (phase.done) return 'Completada';
    const yr = new Date().getFullYear();

    if (phaseNum === 1) {
      // Cimientos: no se proyecta — es configuración inicial.
      return 'Pendiente';
    }
    if (phaseNum === 2) {
      // Saneamiento: dependiente de checks manuales del usuario.
      return 'Manual';
    }
    if (phaseNum === 3) {
      // Colchón: tiempo a alcanzar 6 meses de gastos con aporte mensual,
      // asumiendo que el aporte va a liquidez hasta completar el fondo.
      const target = route.monthlyLife * 6;
      const gap = target - route.liquidEff;
      if (gap <= 0) return 'Completada';
      if (route.aporte <= 0) return 'Necesita aporte mensual';
      const meses = Math.ceil(gap / route.aporte);
      if (meses < 12) return meses <= 1 ? 'Estimada este mes' : `Estimada en ${meses} meses`;
      const yearsAhead = Math.floor(meses / 12);
      return `Estimada en ${yr + yearsAhead}`;
    }
    if (phaseNum === 4) {
      // Inversión sistemática: tiempo a alcanzar el número FIRE con aporte +
      // retorno compuesto. Fórmula cerrada del futuro valor:
      //   p0 * (1+r)^n + a * ((1+r)^n - 1) / r = target
      //   n = log((target*r + a) / (p0*r + a)) / log(1+r)
      const target = route.fireNumber;
      if (target <= 0) return 'Define tu gasto en Ajustes';
      if (route.currentPortfolio >= target) return 'Completada';
      const r = route.annualReturn / 100 / 12;
      const a = route.aporte;
      const p0 = route.currentPortfolio;
      if (r <= 0 || a <= 0) return 'Cálculo no disponible';
      const num = target * r + a;
      const den = p0 * r + a;
      if (num <= den) return 'Completada';
      const n = Math.log(num / den) / Math.log(1 + r);
      if (!isFinite(n) || n <= 0) return 'Cálculo no disponible';
      const yearsAhead = Math.ceil(n / 12);
      // Si supera la esperanza de vida del usuario, el plan actual no llega.
      const yearsToLifeEnd = (route.lifeExpectancy - route.profileAge);
      if (yearsAhead > yearsToLifeEnd) return 'Inalcanzable con plan actual';
      return `Estimada en ${yr + yearsAhead}`;
    }
    if (phaseNum === 5) return 'Continua';
    return '';
  };

  // Estado de cada fase → color de barra/pestañas/nodos.
  const stateOf = (p) => p.done ? 'done' : p.skipped ? 'skipped' : (p.num === route.activePhase ? 'active' : 'future');
  const phases = route.phases;
  const selectedNum = selected != null ? selected : route.activePhase;
  const selPhase = phases[selectedNum - 1] || phases[route.activePhase - 1];

  // Hitos · libertad = edad FIRE real (excepción cromática verde · clímax);
  // jubilación = edad legal del producto. Si el plan NO llega (ageAtFiReal null),
  // el hito muestra fallback honesto "—" (mismo patrón que momentumAge), nunca
  // retireAge disfrazado de edad de libertad.
  const libertadAge = d.ageAtFiReal != null ? Math.ceil(d.ageAtFiReal) : null;
  const pensionAge = (plan.publicPension && plan.publicPension.startAge) || 67;
  // Hito "tu dinero te adelanta" · primera edad en la que el rendimiento anual de la
  // cartera (capital_inicio_año × retorno del plan) supera al aporte de ese año.
  // Mismo modelo de aporte que el resto del M2 (la serie del plan, creciente).
  // Comparación like-with-like en € nominales del año. Si no aporta o no cruza en el
  // horizonte → null (el hito muestra fallback honesto, no una cifra inventada).
  const momentumAge = (() => {
    const sp = d.seriesPlan || [];
    const annual = (plan.annualReturn || 8) / 100;
    for (let y = 0; y * 12 < sp.length; y++) {
      const start = sp[y * 12];
      if (!start) break;
      let aporteYear = 0;
      for (let k = 1; k <= 12; k++) { const r = sp[y * 12 + k]; if (r) aporteYear += r.monthlyAporte || 0; }
      if (aporteYear <= 0) continue;
      if ((start.portfolio || 0) * annual > aporteYear) return Math.round(start.age);
    }
    return null;
  })();

  const card = { background: 'linear-gradient(180deg, ' + T.accentSoft + ', transparent)', border: '1px solid ' + T.accent, borderRadius: 14, padding: mobile ? 20 : 28 };

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Card superior · ruta (fondo naranja difuminado, borde acento) */}
      <div style={card}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 21 : 24, color: T.muted, letterSpacing: T.tracking.tight, lineHeight: 1.15 }}>Tu ruta hacia la libertad:</div>
        {/* Título grande = fase SELECCIONADA (selPhase), para que case con el panel de
            detalle de abajo. La fase ACTIVA actual se marca aparte, en su pestaña. */}
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 26 : 32, color: T.accent, letterSpacing: T.tracking.display, lineHeight: 1.1, marginTop: 4 }}>Fase {selPhase.num} de 5 · {selPhase.title}.</div>

        {/* Barra de progreso · 5 tramos por estado de fase */}
        <div style={{ display: 'flex', gap: 6, marginTop: mobile ? 20 : 26 }}>
          {phases.map(p => {
            const st = stateOf(p);
            const bg = st === 'done' ? T.green : st === 'skipped' ? T.lineSoft : st === 'active' ? T.accent : T.line;
            return <div key={p.num} style={{ flex: 1, height: 16, borderRadius: 5, background: bg, opacity: st === 'future' ? 0.5 : 1 }} aria-hidden="true" />;
          })}
        </div>

        {/* 5 pestañas · marcador circular + nombre corto. Clic selecciona la fase.
            minmax(0,1fr): los tracks pueden encoger bajo el min-content del nombre más
            largo ("Optimización"/"Saneamiento") → las 5 caben SIEMPRE en 375 sin desbordar
            (el nombre largo parte de línea si hace falta). */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: mobile ? 5 : 10, marginTop: mobile ? 18 : 22, alignItems: 'start' }}>
          {phases.map(p => {
            const st = stateOf(p);
            const isSel = p.num === selectedNum;
            const isActive = st === 'active';
            const circleBg = st === 'done' ? T.green : st === 'skipped' ? T.lineSoft : st === 'active' ? T.accent : 'transparent';
            const circleColor = (st === 'done' || st === 'active') ? '#fff' : T.faint;
            const circleBorder = st === 'future' ? '1.5px solid ' + T.line : 'none';
            const glyph = st === 'done' ? '✓' : st === 'skipped' ? '—' : String(p.num);
            const nameColor = st === 'done' ? T.green : st === 'active' ? T.accent : T.faint;
            // FIX 3 · la pestaña seleccionada se refuerza (fondo paper + borde accent
            // más grueso + sombra suave). Sin verde (reservado a libertad).
            return (
              <button key={p.num} onClick={() => selectPhase(p.num)} aria-pressed={isSel} title={p.title} style={{
                background: isSel ? T.paper : 'transparent',
                border: '1.5px solid ' + (isSel ? T.accent : 'transparent'),
                boxShadow: isSel ? '0 2px 8px rgba(26,22,18,0.10)' : 'none',
                borderRadius: 12, padding: mobile ? '8px 3px' : '10px 6px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                minWidth: 0,
              }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: circleBg, border: circleBorder, color: circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: T.size.caption, fontWeight: 700, flexShrink: 0 }}>{glyph}</div>
                <div style={{ fontFamily: T.serif, fontSize: mobile ? 13 : 16, color: nameColor, textAlign: 'center', lineHeight: 1.15, maxWidth: '100%', overflowWrap: 'break-word', hyphens: 'auto' }}>{p.title.split(' ')[0]}</div>
                {/* FIX 2 · marca discreta de la fase ACTIVA (la noción que el título ya no carga) */}
                {isActive && <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 9, letterSpacing: 0, color: T.accent, lineHeight: 1 }}>ahora</div>}
              </button>
            );
          })}
        </div>

        {/* Panel de detalle · INTEGRADO en la card (borderTop, hereda el difuminado).
            El encabezado de fase lo lleva el título grande de arriba (= selPhase), por
            eso aquí va directo el subtítulo, sin repetir "Fase N · Título". */}
        <div ref={panelRef} style={{ borderTop: '1px solid ' + T.lineSoft, marginTop: mobile ? 18 : 24, paddingTop: mobile ? 18 : 24, scrollMarginTop: 12 }}>
          <div style={{ fontFamily: T.serif, fontSize: 16, color: T.muted, lineHeight: T.lh.normal }}>{selPhase.subtitle}</div>
          {!selPhase.skipped && selPhase.steps.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selPhase.steps.map(step => {
                const isAutoCompleted = step.completed && step.source === 'auto';
                const isManualCompleted = step.completed && step.source === 'manual';
                const isManualStep = selPhase.num >= 4 && step.id === '4.3' || selPhase.num === 5 || selPhase.num === 2;
                return (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: '1px dashed ' + T.lineSoft }}>
                    {isManualStep ? (
                      // FIX 1/4 · CASILLA manual (cuadrada): el usuario la marca. Hit area
                      // ≥44px vía padding 11 + margin −11 (invisible, no empuja el layout);
                      // el cuadro visible sigue a 22px.
                      <button
                        onClick={() => toggleManual(step.id, isManualCompleted)}
                        aria-pressed={step.completed}
                        title="Tócalo para marcar o desmarcar"
                        style={{ flexShrink: 0, padding: 11, margin: -11, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', lineHeight: 0 }}>
                        {/* CASILLA manual (cuadrada, tappable): cuando está vacía se ve como un
                            control pulsable — fondo papel + borde marcado + relieve sutil — para
                            que NO se confunda con el indicador de estado (redondo) de al lado. */}
                        <span style={{ width: 22, height: 22, borderRadius: 5, background: step.completed ? T.green : T.paper, border: '1.5px solid ' + (step.completed ? T.green : T.muted), boxShadow: step.completed ? 'none' : '0 1px 2px rgba(26,22,18,0.12)', color: '#fff', fontFamily: T.mono, fontSize: T.size.caption, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{step.completed ? '✓' : ''}</span>
                      </button>
                    ) : (
                      // INDICADOR de estado (redondo): lo detecta la app, NO es una casilla. Sin
                      // botón, sin cursor pointer. Pendiente = punto pequeño muted (no un círculo
                      // hueco con borde, que se leía como checkbox vacío y la gente intentaba
                      // pulsarlo); hecho = ✓ en círculo verde. La forma/relleno lo distingue del cuadrado.
                      <span aria-hidden="true" title={isAutoCompleted ? 'Detectado automáticamente' : 'Pendiente'}
                        style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: step.completed ? T.green : 'transparent', color: '#fff', fontFamily: T.mono, fontSize: T.size.caption, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, cursor: 'default' }}>
                        {step.completed ? '✓' : <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.faint, display: 'inline-block' }} />}
                      </span>
                    )}
                    <div style={{ flex: 1, fontFamily: T.serif, fontSize: 17, color: T.ink, lineHeight: T.lh.normal }}>
                      {step.label}
                      {isAutoCompleted && <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wide, marginTop: 2 }}>detectado automáticamente</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {selPhase.editorialInline && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'transparent', border: '1px solid ' + T.lineSoft, borderRadius: 8, fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, color: T.muted, lineHeight: T.lh.normal }}>{selPhase.editorialInline}</div>
          )}
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.accent, marginTop: 14, letterSpacing: 0 }}>{phaseEstimate(selPhase.num)}</div>
          {/* Rebalanceo · su sitio natural es la fase de INVERSIÓN (allocation/rebalanceo). Solo al clicar la fase 4. */}
          {selPhase.num === 4 && <div style={{ marginTop: 16 }}><RebalanceCard /></div>}
        </div>

        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, color: T.faint, marginTop: 14 }}>Toca cualquier fase para ver sus pasos.</div>
      </div>

      {/* Retrato del destino + dirección · DOS cards al pie de la ruta, mismo patrón que
          Proyección ("En limpio" + "Siguiente paso") para que las dos pantallas rimen. El
          retrato es gemelo de "En limpio": Label + kicker de estado + cifra display (verde solo
          en 'libre', ámbar 'tarde', sin cifra 'no-llega') + frase de lectura que hila los hitos. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 16, marginTop: mobile ? 16 : 20 }}>
        <Card>
          <Label style={{ color: T.faint }}>Tu destino</Label>
          {(() => {
            const v = d.verdict;
            const kicker = { fontFamily: T.mono, fontSize: T.size.caption, color: T.muted, letterSpacing: T.tracking.wide, marginTop: 18 };
            const cifra = { fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, marginTop: 2 };
            const frase = { fontFamily: T.serif, fontSize: T.size.body, color: T.muted, marginTop: 12, lineHeight: T.lh.normal, maxWidth: 600 };
            const reading = momentumAge != null
              ? <>A los <strong style={{ color: T.ink, fontWeight: 600 }}>{momentumAge}</strong> tu dinero ya te adelanta —el rendimiento anual supera a tu aporte— y la pensión pública entra a los <strong style={{ color: T.ink, fontWeight: 600 }}>{pensionAge}</strong>.</>
              : <>Cuando empieces a aportar, el rendimiento acabará superando a tu aporte; la pensión pública entra a los <strong style={{ color: T.ink, fontWeight: 600 }}>{pensionAge}</strong>.</>;
            // Fuente única: veredicto vs plan (d.verdict/verdictAge/verdictCopy). El ★ edad de
            // libertad SIEMPRE en T.green (invariante de doctrina); el veredicto tiñe la frase.
            if (d.verdictAge != null) {
              return (<><div style={kicker}>libre a los</div><div style={{ ...cifra, color: T.green }}>★ {Math.ceil(d.verdictAge)}</div><div style={{ ...frase, color: VERDICT_COLOR[v] }}>{d.verdictCopy}</div><div style={{ ...frase, marginTop: 8, color: T.faint }}>{reading}</div></>);
            }
            return (<><div style={kicker}>{v === 'no-llega' ? 'todavía sin edad de libertad' : 'aún sin veredicto'}</div><div style={{ ...frase, marginTop: 14, color: VERDICT_COLOR[v] }}>{d.verdictCopy}</div><div style={{ ...frase, marginTop: 8, color: T.faint }}>{reading}</div></>);
          })()}
        </Card>
        {(() => {
          // Cierre estilo CARTEL (rima con el de Proyección: eyebrow + serif grande + sub itálica
          // + CartelBtn, sin caja). Mantiene la lógica de veredicto/destino del NextStep anterior.
          const v = d.verdict;
          const noMeses = !(d.filledMonths && d.filledMonths.length);
          let frase, label, dest, head;
          if (v === 'sin-datos' && noMeses) { frase = 'Registra tu primer mes para que el plan empiece a seguir tu avance real.'; label = 'Ir a Mes a mes →'; dest = 'seguimiento'; head = 'Ahora, mes a mes.'; }
          else if (v === 'atrasado' || v === 'no-llega') { frase = `${d.verdictCopy} Sube tu aporte o baja tu objetivo para acercar la fecha.`; label = 'Ir a Proyección →'; dest = 'proy'; head = 'Ajústalo en Proyección.'; }
          else if (v === 'sin-datos') { frase = d.verdictCopy; label = 'Ir a Proyección →'; dest = 'proy'; head = 'Afínalo en Proyección.'; }
          else { frase = `${d.verdictCopy} El siguiente paso es seguirlo mes a mes.`; label = 'Ir a Mes a mes →'; dest = 'seguimiento'; head = 'Ahora, mes a mes.'; }
          return (
            <div style={{ textAlign: 'center', padding: mobile ? '36px 8px 12px' : '52px 8px 20px' }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.accent }}>El siguiente paso</div>
              <h2 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 'clamp(34px, 6.5vw, 72px)', lineHeight: 0.98, letterSpacing: '-.03em', margin: '8px 0 0', color: T.ink }}>{head}</h2>
              <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 'clamp(16px, 2vw, 21px)', color: T.muted, maxWidth: '40ch', margin: '18px auto 0', lineHeight: 1.45 }}>{frase}</p>
              <div style={{ marginTop: 22 }}><CartelBtn onClick={() => update({ activeTab: dest })}>{label}</CartelBtn></div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export function SinMiPlanModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  const mobile = useIsMobile();
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.62)',
      zIndex: 1200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '32px 16px', overflowY: 'auto',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bg, maxWidth: 920, width: '100%',
        borderRadius: 14, padding: mobile ? 22 : 36,
        fontFamily: T.serif, color: T.ink,
        boxShadow: '0 24px 60px rgba(26,22,18,0.3)',
        position: 'relative',
      }}>
        <button onClick={onClose} aria-label="Cerrar"
          style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, padding: 8, letterSpacing: T.tracking.wider }}>
          ✕ CERRAR
        </button>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint, marginBottom: 6 }}>
          Antes de Mi Plan · cálculo completo
        </div>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 28 : 34, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight, color: T.ink, marginBottom: 20 }}>
          Tu situación si no <em style={{ color: T.accent }}>haces nada</em>.
        </div>
        <ScreenSinMiPlan embedded />
      </div>
    </div>
  );
}

export function ScreenHoy({ goTo }) {
  const { state, updatePlan } = useStore();
  const d = useDerived();
  const mobile = useIsMobile();
  const { profile, plan, goals } = state;
  const tk = todayKey();
  const realMode = state.displayMode === 'real';
  const inflRate = plan.inflationRate != null ? plan.inflationRate : 2.5;
  const planReturn = plan.annualReturn || 8;
  const yearsToRetire = Math.max(1, profile.retireAge - profile.age);

  // Movimiento 1 · Where you are
  const income = computeIncomeFor(plan, tk);
  const planAporte = computePlannedFor(plan, tk);
  const al = plan.actualLife || { completed: false };
  const declared = al.completed ? sumExpenses(al) : null;
  const monthlyLife = declared != null ? declared : Math.max(0, income - planAporte);
  const savingRate = income > 0 ? planAporte / income : 0;

  // Movimiento 2 · Where you're going
  const monthsToRetire = yearsToRetire * 12;
  const finalNominal = d.finalPlan ? d.finalPlan.portfolio : 0;
  // Real SOLO para el recordatorio de aterrizaje del M2 (la app muestra nominal por
  // defecto; el patrimonio futuro va en € corrientes salvo ese recordatorio explícito).
  const finalReal = toRealEur(finalNominal, monthsToRetire, inflRate);
  // App en NOMINAL · ratio de las monedas en euros CORRIENTES (numerador y denominador
  // en nominal, misma unidad — no se mezcla). "Lo que pones" en nominal = patrimonio
  // inicial (currentPortfolio) + suma de los aportes SIN deflactar (lo que el usuario
  // realmente irá metiendo). Mismo modelo de aporte (projectV2) que el final.
  const aportadoNominal = (d.seriesPlan || []).reduce((acc, row) => row.monthIndex > 0 ? acc + (row.monthlyAporte || 0) : acc, 0);
  const aportadoBaseNominal = aportadoNominal + (d.currentPortfolio || 0);
  const crecimientoRatio = aportadoBaseNominal > 0 ? finalNominal / aportadoBaseNominal : 0;
  const withdrawalRate = plan.withdrawalRate != null ? plan.withdrawalRate : 4.0;
  const retirementMonthly = d.retirementMonthlyIncome || 0;
  const retirementMonthlyReal = toRealEur(retirementMonthly, monthsToRetire, inflRate);
  const sufficiencyRatio = monthlyLife > 0 ? retirementMonthlyReal / monthlyLife : null;
  const sufficiency = sufficiencyRatio == null
    ? { label: 'Define tu gasto', color: T.muted, kind: 'unknown' }
    : sufficiencyRatio >= 1.2 ? { label: 'Viable con margen', color: T.green, kind: 'comfortable' }
    : sufficiencyRatio >= 1.0 ? { label: 'Viable, justo', color: T.amber, kind: 'tight' }
    : { label: 'No llega', color: T.red, kind: 'short' };

  // v1.1.1 · Perfil del usuario y proyección del plan estándar
  const userProfile = useMemo(() => computeUserProfile(state), [state.plan, state.profile]);
  const standard = useMemo(() => projectStandardPlan(state), [state.plan, state.profile]);

  // v1.2.0 · KPIs destilados de Sin Mi Plan para el Movimiento 1.B.
  const sinPlanKPIs = useMemo(() => computeSinPlanKPIs(plan, profile), [plan, profile]);
  const [showSinPlanModal, setShowSinPlanModal] = useState(false);
  const [verMasFuturo, setVerMasFuturo] = useState(false);  // S8 · colapsa el detalle del futuro (densidad GX2)
  const inlineLink = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: T.serif, fontWeight: 600, color: T.accent, fontSize: 'inherit', appearance: 'none', WebkitAppearance: 'none' };

  // ── Layout · el ancho/centrado de la columna lo da ahora el Shell (CONTENT_MAX),
  //    compartido por todas las pantallas. Aquí solo el aire vertical. ──
  const SECTION_GAP = mobile ? 40 : 56;  // aire ENTRE secciones grandes (01/02/03)
  const BLOCK_GAP = mobile ? 16 : 20;    // aire DENTRO de cada sección (título → contenido)
  // Tamaños display LOCALES y estables (los tokens displayMd/displayLg son clamp()
  // dependiente de vw y encogen en anchos intermedios; aquí la columna es fija a
  // 720, así que fijamos el tamaño: móvil = mínimos actuales, escritorio = constante).
  const DISPLAY_LG = mobile ? 28 : 44;   // "Hola, {nombre}"
  const DISPLAY_MD = mobile ? 24 : 32;   // títulos de sección, "Sin un plan", cifras clave

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SECTION_GAP, paddingBottom: 40, width: '100%' }}>
      {/* Header · saludo a la izquierda; fecha (metadato) a la derecha, asentada en
          la BASELINE del saludo para que se relacione con él (no flote suelta). */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: DISPLAY_LG, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, color: T.ink }}>
          Hola, <em style={{ color: T.accent }}>{profile.name || 'amigo'}</em>.
        </div>
        <Label style={{ marginBottom: 0 }}>Mi Plan · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Label>
      </div>

      {/* Intro editorial de la sección · qué es Plan y qué se ve (los tres movimientos). */}
      <div style={{ fontFamily: T.serif, fontSize: T.size.lead, color: T.muted, lineHeight: T.lh.normal, maxWidth: 640, marginTop: 10 }}>
        Esta es tu vista de conjunto: <strong style={{ color: T.ink, fontWeight: 600, fontStyle: 'normal' }}>dónde estás</strong> hoy, <strong style={{ color: T.ink, fontWeight: 600, fontStyle: 'normal' }}>hacia dónde puedes ir</strong> y <strong style={{ color: T.ink, fontWeight: 600, fontStyle: 'normal' }}>la ruta</strong> que une las dos. Los números los afinas en Proyección y los haces realidad mes a mes en Seguimiento.
      </div>

      {/* Household multi-account summary (only renders if list.length > 1) */}
      <HouseholdSummaryCard />

      {/* Empieza aquí · guía de 3 pasos para usuario nuevo (GX5); desaparece al completar datos clave. */}
      {(income <= 0 || !al.completed) && (
        <CartelCard tone={T.accent}>
          <CartelLabel style={{ color: T.accent }}>Empieza aquí</CartelLabel>
          <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.muted, margin: '8px 0 14px', lineHeight: T.lh.normal }}>Tres pasos para que el plan sea tuyo:</div>
          <ol style={{ margin: 0, paddingLeft: 22, fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: 1.8 }}>
            <li>Define tu ingreso y tu aporte en <button onClick={() => goTo('proy')} style={inlineLink}>Proyección</button>.</li>
            <li>Declara tu gasto y tu asignación en <button onClick={() => goTo('ajustes')} style={inlineLink}>Datos</button>.</li>
            <li>Registra tu primer mes en <button onClick={() => goTo('seguimiento')} style={inlineLink}>Seguimiento</button>.</li>
          </ol>
        </CartelCard>
      )}

      {/* ─────────────── Movimiento 1 · Dónde estás ─────────────── */}
      <Reveal><section>
        <SectionTag style={{ marginBottom: BLOCK_GAP }}>Dónde estás</SectionTag>

        {/* Rediseño Plan v2 · M1 en dos cards NEUTRAS (presente sobrio, sin tinte;
            el futuro de M2/M3 sí lleva color). Card A = patrimonio (tinta, KPI hero
            descriptivo). Card B = el eje: ahorro mensual protagonista + fork
            parado/invertido. Cifras 100% derivadas y en NOMINAL (currentPortfolio,
            planAporte, savingRate, monthlyLife, parkedFinalNominal, finalNominal). */}
        {(() => {
          const cardStyle = { background: T.bg, border: '1px solid ' + T.line, borderRadius: 16, padding: mobile ? 20 : 28 };  // voz Cartel (= CartelCard)
          const ahorroPct = Math.round(savingRate * 100);
          const aporta = planAporte > 0 ? planAporte : Math.round(income * 0.15);
          const aportaLabel = planAporte > 0 ? 'Cada mes apartas' : 'Si apartaras el 15%';
          const subPct = planAporte > 0 ? ahorroPct : 15;
          return (
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: mobile ? 16 : 20 }}>
            {/* Card A · patrimonio (TINTA, no verde: cifra descriptiva) */}
            <div style={cardStyle}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint }}>Tu patrimonio</div>
              <ComputedNumber value={d.currentPortfolio || 0} format={fmtEur} ariaLabel="Tu patrimonio" style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 40 : 56, color: T.ink, letterSpacing: T.tracking.display, lineHeight: 1, marginTop: 6 }} />
            </div>
            {/* Card B · el eje (protagonista del bloque) */}
            {income > 0 && sinPlanKPIs.hasData ? (() => {
              // App en NOMINAL · ambas cajas del fork en euros corrientes (comparación
              // justa, misma unidad): parado = capital+aportes sin invertir (nominal);
              // invertido = finalNominal del plan (mismo nº que el pill y las monedas M2).
              const parked = sinPlanKPIs.parkedFinalNominal;
              const invested = finalNominal;
              return (
              <div style={cardStyle}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint }}>{aportaLabel}</div>
                  <ComputedNumber value={aporta} format={fmtEur} ariaLabel={aportaLabel} style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 48 : 68, color: T.ink, letterSpacing: T.tracking.display, lineHeight: 1, marginTop: 4 }} />
                  <div style={{ fontFamily: T.serif, fontSize: 16, color: T.muted, lineHeight: T.lh.normal, marginTop: 10 }}>el {subPct}% de tu sueldo · {fmtEur(monthlyLife)} se van en vivir</div>
                </div>
                {/* Fork: dos trazos 2.5px desde el centro superior a las dos cajas */}
                <svg viewBox="0 0 100 30" width="100%" height={mobile ? 30 : 40} preserveAspectRatio="none" style={{ display: 'block', marginTop: mobile ? 18 : 24 }} aria-hidden="true">
                  <path d="M50 0 V10" stroke={T.line} strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                  <path d="M50 10 L22 30" stroke={T.red} strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                  <path d="M50 10 L78 30" stroke={T.green} strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                </svg>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: mobile ? 12 : 18 }}>
                  <div style={{ border: '1px solid ' + T.line, borderRadius: 12, padding: mobile ? '14px' : '16px 18px', textAlign: 'center' }}>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint }}>Parado · {yearsToRetire} años</div>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 28 : 36, color: T.red, letterSpacing: T.tracking.display, lineHeight: 1, marginTop: 6 }}>{fmtEur(parked)}</div>
                  </div>
                  <div style={{ border: '1px solid ' + T.line, borderRadius: 12, padding: mobile ? '14px' : '16px 18px', textAlign: 'center' }}>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint }}>Invertido · {yearsToRetire} años</div>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 28 : 36, color: T.green, letterSpacing: T.tracking.display, lineHeight: 1, marginTop: 6 }}>{fmtEur(invested)}</div>
                  </div>
                </div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: 16, lineHeight: T.lh.snug, textAlign: 'center', marginTop: 18 }}>El mismo tiempo. La diferencia la pone el interés compuesto · {planReturn} % anual asumido.</div>
              </div>
              );
            })() : (
              <div style={{ ...cardStyle, fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal }}>
                {income > 0 ? 'Define un ingreso en Ajustes para ver el cálculo completo.' : <>Sin ingreso definido — añade un tramo en <strong style={{ color: T.ink, fontStyle: 'normal' }}>Proyección</strong>.</>}
              </div>
            )}
            {/* Inflación + acceso al cálculo completo (copy preservado) */}
            {sinPlanKPIs.hasData && (
              <div>
                <div style={{ fontFamily: T.serif, color: T.ink, fontSize: T.size.body, lineHeight: T.lh.normal }}>
                  Este año, la inflación resta <strong style={{ color: T.ink, fontStyle: 'normal' }}>~{fmtEur(sinPlanKPIs.lostFirstYear)}</strong> a tu salario — y más cada año que pasa.
                </div>
                <OnboardingHelp title="Supuestos">
                  Pérdida de poder de compra del primer año: un año de inflación ({inflRate}%) sobre tu salario anual.
                </OnboardingHelp>
              </div>
            )}
            <div><CartelBtn variant="text" onClick={() => setShowSinPlanModal(true)}>Ver el cálculo completo →</CartelBtn></div>
          </div>
          );
        })()}

      </section></Reveal>

      {/* ─────────────── Movimiento 2 · Lo que podría ser ─────────────── */}
      <Reveal><section>
        <SectionTag style={{ marginBottom: BLOCK_GAP }}>Hacia dónde puedes ir</SectionTag>

        {/* Rediseño Plan v2 · M2 "Hacia dónde puedes ir": gancho (todos los perfiles)
            + cuerpo con monedas (perfiles B/C que aportan). La ramificación por
            userProfile (A/B/C) y el veredicto de suficiencia se CONSERVAN; solo
            cambia la forma. Cifras derivadas: aportado (d.finalPlan.aportado),
            capital final (finalReal), renta (retirementMonthlyReal), userProfile. */}
        {income > 0 ? (() => {
          const aportas = userProfile !== 'A';            // B y C aportan; A no
          // UN SOLO NÚMERO · ratio = finalNominal/aportadoBaseNominal (header): mismo
          // modelo (creciente) y MISMA unidad (€ corrientes/nominal) en numerador y
          // denominador. Las monedas Y la frase derivan SIEMPRE de este ratio → jamás se
          // contradicen. Nominal por defecto; el real solo en el recordatorio. Sin tope.
          const ratio = crecimientoRatio;
          // Guarda de dato DEGENERADO (NaN/Infinity, o aportadoNominal≈0 → ratio gigante):
          // no se pintan decenas de monedas; se trata como perfil sin aporte (fallback),
          // preservando la renta. NO es un tope al mensaje real, es robustez de datos.
          const RATIO_DEGEN = 30;
          const ratioValido = aportas && aportadoNominal > 0 && Number.isFinite(ratio) && ratio > 0 && ratio < RATIO_DEGEN;
          // Frase adaptada al MISMO ratio (línea 1 muted / línea 2 con color). Nunca
          // afirma un múltiplo que las monedas no dibujen: >4.5 usa el número real
          // redondeado; <1.3 mira al futuro en vez de presumir un múltiplo pobre.
          let headL1 = 'Esta decisión no solo trabaja para ti:';
          let headL2 = '';
          if (ratio >= 4.5) headL2 = `multiplica por ${Math.round(ratio)} lo que pones.`;
          else if (ratio >= 3.5) headL2 = 'casi cuadruplica lo que pones.';
          else if (ratio >= 2.5) headL2 = 'casi triplica lo que pones.';
          else if (ratio >= 1.8) headL2 = 'más que duplica lo que pones.';
          else if (ratio >= 1.3) headL2 = `multiplica lo que pones por ${ratio.toFixed(1).replace('.', ',')}.`;
          else { headL1 = 'Esto no ha hecho más que empezar:'; headL2 = 'cada año que pase, multiplica más.'; }
          // Cola de la frase de renta · adapta el veredicto de suficiencia existente.
          const rentaTail = sufficiency.kind === 'comfortable' ? 'más de lo que gastas hoy'
            : sufficiency.kind === 'short' ? 'aún no cubre lo que gastas hoy'
            : sufficiency.kind === 'tight' ? 'lo mismo que gastas hoy'
            : 'según tu gasto de hoy';
          const greenCard = { background: 'linear-gradient(180deg, ' + T.greenSoft + ', transparent)', border: '1px solid ' + T.green, borderRadius: 14, padding: mobile ? 20 : 28 };
          // Monedas ABSTRACTAS del ratio (NOMINAL): izq 1 moneda = lo que pones
          // (aportadoBaseNominal = inicial + aportes, € corrientes) → der el ratio
          // dibujado: floor(ratio) llenas + 1 fracción (opacity = decimal, mín 0.15);
          // etiqueta der = patrimonio NOMINAL (finalNominal). Ambas en la misma unidad
          // que el ratio. Sin tope: bucle + flex-wrap + reescala → no desborda en 375.
          const monedas = () => {
            const full = Math.floor(ratio);
            const frac = ratio - full;
            const totalRight = full + (frac > 0 ? 1 : 0);
            const disc = totalRight > 8 ? (mobile ? 20 : 24) : (mobile ? 28 : 34);
            const cgap = totalRight > 8 ? 4 : 6;
            const ops = [];
            for (let i = 0; i < full; i++) ops.push(1);
            if (frac > 0) ops.push(Math.max(frac, 0.15));
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mobile ? 14 : 22, marginTop: mobile ? 22 : 28, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ width: disc, height: disc, borderRadius: '50%', background: T.ink, margin: '0 auto' }} aria-hidden="true" />
                  <div style={{ fontFamily: T.serif, fontSize: 17, color: T.ink, marginTop: 8 }}>{fmtEur(aportadoBaseNominal)}</div>
                </div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 24 : 28, color: T.amber, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">→</div>
                <div style={{ textAlign: 'center', flex: '1 1 auto', minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: cgap, justifyContent: 'center', flexWrap: 'wrap' }} aria-hidden="true">
                    {ops.map((op, i) => <div key={i} style={{ width: disc, height: disc, borderRadius: '50%', background: T.green, opacity: op, flexShrink: 0 }} />)}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 17, color: T.ink, marginTop: 8 }}>{fmtEur(finalNominal)}</div>
                </div>
              </div>
            );
          };
          return (
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: mobile ? 16 : 20 }}>
            {/* GANCHO · común a TODOS los perfiles (incl. A, que aún no aporta) */}
            <div style={greenCard}>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 21 : 24, color: T.muted, letterSpacing: T.tracking.tight, lineHeight: 1.15 }}>Si pones el tiempo y el interés compuesto de tu lado…</div>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 28 : 33, color: T.green, letterSpacing: T.tracking.display, lineHeight: 1.1, marginTop: 4 }}>hoy cambias tu futuro.</div>
            </div>
            {/* CUERPO · perfiles que aportan (B y C). Monedas abstractas del ratio
                NOMINAL + frase derivada del MISMO ratio (jamás se contradicen). Orden:
                frase → monedas (nominal) → recordatorio (real, aterrizaje) → renta. Dato
                degenerado (ratio no-finito o ≥30) → sin monedas, preservando la renta.
                Perfil A (no aporta): sin cuerpo. */}
            {aportas && (
              <div style={greenCard}>
                {ratioValido && (
                  <>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 21 : 24, color: T.muted, letterSpacing: T.tracking.tight, lineHeight: 1.15 }}>{headL1}</div>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 27 : 33, color: T.green, letterSpacing: T.tracking.display, lineHeight: 1.1, marginTop: 4 }}>{headL2}</div>
                    {/* Las monedas se ven DESDE EL PRIMER MOMENTO (decisión de producto): son el
                        detalle visual del bloque, no algo que haya que desplegar. Solo el recordatorio
                        en € de hoy (real) queda tras «Ver el equivalente…» (densidad S8 · GX2). */}
                    {monedas()}
                    {verMasFuturo ? (
                      <div style={{ fontFamily: T.serif, color: T.muted, fontSize: 16, lineHeight: T.lh.normal, marginTop: mobile ? 14 : 16 }}>
                        Recuerda: ajustado por la inflación, ese patrimonio equivale a <strong style={{ color: T.ink, fontStyle: 'normal' }}>{fmtEur(finalReal)}</strong> de 2026.
                      </div>
                    ) : (
                      <div style={{ marginTop: 12 }}><CartelBtn variant="text" onClick={() => setVerMasFuturo(true)}>Ver el equivalente en € de hoy →</CartelBtn></div>
                    )}
                  </>
                )}
                {/* Cierre · renta NOMINAL del primer año de jubilación + su aclaración en
                    € de hoy (real) + veredicto de suficiencia. Ambas cifras EN VIVO.
                    borderTop solo si hay monedas+recordatorio arriba. */}
                <div style={{ ...(ratioValido ? { borderTop: '1px solid ' + T.lineSoft, marginTop: mobile ? 20 : 26, paddingTop: mobile ? 18 : 22 } : {}), fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 21 : 24, color: T.ink, letterSpacing: T.tracking.tight, lineHeight: 1.3 }}>
                  Y te dan <span style={{ color: T.amber }}>{fmtEur(retirementMonthly)}</span>/mes cuando te jubiles — es decir, {fmtEur(retirementMonthlyReal)} de 2026: {rentaTail}.
                </div>
              </div>
            )}
            <OnboardingHelp title="Supuestos">
              Cifras en euros nominales (los que tendrás en el futuro); el recordatorio las ajusta a € de 2026 por la inflación. Asumiendo {planReturn}% de rentabilidad media anual y una tasa de retiro del {withdrawalRate}%. La edad de libertad sale de tu ritmo de ahorro real — todo configurable en Proyección.
            </OnboardingHelp>
          </div>
          );
        })() : (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal }}>
            Define un ingreso en Ajustes para ver cuándo serías libre.
          </div>
        )}

        {/* CTA Proyección (Monte Carlo destilado vive en Proyección) */}
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px dashed ' + T.lineSoft, display: 'flex', justifyContent: 'flex-end' }}>
          <CartelBtn variant="text" onClick={() => goTo('proy')}>Profundizar en Proyección →</CartelBtn>
        </div>
      </section></Reveal>

      {/* ─────────────── Movimiento 3 · Tu ruta ─────────────── */}
      <Reveal><section>
        <SectionTag style={{ marginBottom: BLOCK_GAP }}>Tu ruta</SectionTag>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal, maxWidth: 720, marginBottom: 18 }}>
          Cinco fases que estructuran el camino FIRE.
        </div>
        <RutaCincoFases state={state} d={d} mobile={mobile} />
      </section></Reveal>

      {showSinPlanModal && <SinMiPlanModal onClose={() => setShowSinPlanModal(false)} />}
    </div>
  );
}

// Sandbox «¿y si subo el aporte?» (cascada S7) · PREVISUALIZACIÓN: proyecta con +bump €/mes y halla la
// nueva edad de libertad (mismo cruce real con fiTarget que useDerived). NO persiste hasta «Aplicar»
// (doctrina guided-confirmation). Estilo Cartel.
export function WhatIfCard({ d, plan }) {
  const [bump, setBump] = useState(50);
  const { state, mutatePlan } = useStore();
  const { profile } = state;
  const fiTarget = d.fiTarget;
  // "Aplicar" sube el aporte ACTIVO a (efectivo actual + extra) modificándolo EN SU SITIO — NO se
  // añade un segmento solapado, porque el motor lee los ahorros con findActiveSegment ("el último
  // que matchea gana", NO suma): un segmento nuevo sustituía al base (era el bug). Si el aporte es %,
  // se sube el % para que hoy = actual+extra (sigue ligado al salario); si es fijo, se suma. La
  // preview proyecta EXACTAMENTE ese plan → coincide con lo que pasa al confirmar.
  const applyBump = (p) => {
    const tk = todayKey();
    const segs = p.savingSegments && p.savingSegments.length ? [...p.savingSegments] : [];
    let idx = -1;
    for (let i = 0; i < segs.length; i++) if (isKeyInSegment(tk, segs[i])) idx = i;
    if (idx < 0) return { ...p, savingSegments: [...segs, { id: uid(), from: tk, to: null, type: 'fixed', value: bump, label: 'Aporte' }] };
    const s = segs[idx];
    if (s.type === 'percent') {
      const income = computeIncomeFor(p, tk);
      const rawPct = income > 0 ? ((computePlannedFor(p, tk) + bump) / income) * 100 : (Number(s.value) || 0);
      const newPct = Math.round(rawPct * 10) / 10;  // 1 decimal · no persistir floats de 17 dígitos
      return { ...p, savingSegments: segs.map((seg, i) => i === idx ? { ...seg, value: newPct } : seg) };
    }
    return { ...p, savingSegments: segs.map((seg, i) => i === idx ? { ...seg, value: (Number(seg.value) || 0) + bump } : seg) };
  };
  const sim = useMemo(() => projectV2(applyBump(plan), profile, {
    capital: d.currentPortfolio, includeHypothetical: false, endAge: 90,
  }), [profile, d.currentPortfolio, plan, bump]);
  const newAge = useMemo(() => {
    if (!(fiTarget > 0)) return null;
    for (const row of sim) {
      const real = toRealEur(row.portfolio || 0, (row.age - profile.age) * 12, plan.inflationRate);
      if (real >= fiTarget) return row.age;
    }
    return null;
  }, [sim, fiTarget, profile.age, plan.inflationRate]);
  const baseAge = d.cruceEdad != null ? Math.ceil(d.cruceEdad) : null;
  const newAgeCeil = newAge != null ? Math.ceil(newAge) : null;
  const adelanta = (baseAge != null && newAgeCeil != null) ? baseAge - newAgeCeil : null;
  return (
    <CartelCard tone={T.accent} style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center' }}>
      <CartelLabel style={{ color: T.accent }}>¿Y si subes el aporte?</CartelLabel>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center', marginTop: 10 }}>
        <span style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.lead }}>+</span>
        <EditableValue value={bump} onChange={setBump} min={0} max={2000} suffix="€/mes" ariaLabel="Aporte extra mensual" />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        {[25, 50, 100, 200].map((v) => (
          <button key={v} onClick={() => setBump(v)} style={{
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, padding: '4px 12px',
            background: bump === v ? T.accent : 'transparent', color: bump === v ? T.bg : T.accent,
            border: '1px solid ' + T.accent, borderRadius: 999, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
          }}>+{v}€</button>
        ))}
      </div>
      <div style={{ fontFamily: T.serif, fontSize: T.size.lead, color: T.ink, marginTop: 16, lineHeight: T.lh.normal }}>
        {newAgeCeil != null
          ? <>Serías libre a los <b style={{ color: T.green, fontWeight: 600 }}>{newAgeCeil}</b>{adelanta != null && adelanta > 0 ? <> — adelantas <b style={{ color: T.green, fontWeight: 600 }}>{adelanta}</b> {adelanta === 1 ? 'año' : 'años'}.</> : '.'}</>
          : <>Con este aporte tu número aún no llega.</>}
      </div>
      <CartelBtn variant="text" style={{ marginTop: 14 }} onClick={() => mutatePlan(applyBump)}>Aplicar al plan →</CartelBtn>
    </CartelCard>
  );
}

// Sandbox «¿De golpe o poco a poco?» (DCA) · compara invertir una cantidad de UNA VEZ vs repartirla
// en N meses. Honesto y a dos caras: de golpe rinde más DE MEDIA (más tiempo invertido); repartir
// suaviza el riesgo de entrar justo antes de una caída (menos expuesto al principio). Interés
// compuesto mensual simple; no toca el motor ni persiste nada. Cero red.
export function DcaCard({ annualReturn }) {
  const [amount, setAmount] = useState(12000);
  const [months, setMonths] = useState(12);
  const a = (annualReturn != null ? annualReturn : 8);
  const r = Math.pow(1 + a / 100, 1 / 12) - 1;
  const lumpEnd = amount * Math.pow(1 + r, months);
  let dcaEnd = 0;
  for (let m = 0; m < months; m++) dcaEnd += (amount / months) * Math.pow(1 + r, months - m);
  const diff = Math.max(0, lumpEnd - dcaEnd);
  const diffPct = lumpEnd > 0 ? Math.round((diff / lumpEnd) * 100) : 0;
  const lumpLoss = Math.round(amount * 0.20);
  const dcaLoss = Math.round((amount / months) * 0.20);
  const col = { flex: '1 1 130px', minWidth: 120 };
  const valBig = { fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: 'clamp(22px, 3.2vw, 30px)', letterSpacing: T.tracking.tight, color: T.ink, lineHeight: 1 };
  const lbl = { fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.faint, letterSpacing: 0, marginBottom: 4 };
  return (
    <CartelCard tone={T.accent} style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <EditableValue value={amount} onChange={setAmount} min={0} max={1000000} step={1000} suffix="€" ariaLabel="Cantidad a invertir" />
        <span style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body }}>repartido en</span>
        <div role="group" aria-label="Meses para repartir" style={{ display: 'inline-flex', gap: 3, padding: 3, background: T.panel, borderRadius: 999, border: '1px solid ' + T.line }}>
          {[6, 12, 24].map((v) => {
            const active = months === v;
            return <button key={v} onClick={() => setMonths(v)} aria-pressed={active} style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', background: active ? T.accent : 'transparent', color: active ? T.bg : T.muted, transition: 'background .15s ease, color .15s ease', appearance: 'none', WebkitAppearance: 'none' }}>{v} m</button>;
          })}
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={col}><div style={lbl}>De golpe</div><div style={valBig}>{fmtEur(lumpEnd)}</div></div>
        <div style={col}><div style={lbl}>Repartido en {months} m</div><div style={valBig}>{fmtEur(dcaEnd)}</div></div>
      </div>
      <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.muted, marginTop: 12, lineHeight: T.lh.normal }}>
        Si el mercado sube de forma constante ({a} % anual), <b style={{ color: T.ink, fontWeight: 600 }}>de golpe</b> termina con <b style={{ color: T.ink, fontWeight: 600 }}>{fmtEur(diff)}</b> más ({diffPct} %): tu dinero pasa más tiempo invertido.
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid ' + T.lineSoft, fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.normal }}>
        Pero si justo al entrar el mercado cae un 20 %, de golpe pierde <b style={{ color: T.amber }}>{fmtEur(lumpLoss)}</b> de una vez; repartido solo <b style={{ color: T.green }}>{fmtEur(dcaLoss)}</b> — el resto aún no está expuesto.
      </div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.muted, marginTop: 14, lineHeight: T.lh.normal }}>
        Repartir cambia algo de rendimiento esperado por no apostarlo todo a un único día de entrada. No hay respuesta única: depende de cuánto te quite el sueño una mala racha al principio.
      </div>
    </CartelCard>
  );
}

export function ScreenMesAMes() {
  const { state, setMonth, update } = useStore();
  const d = useDerived();
  const { months } = state;
  // Bento · el gráfico "plan vs realidad" vive tras disclosure (P3). Función intacta.
  const [showVsPlan, setShowVsPlan] = useState(false);

  // Group by year — chronological ascending (oldest first, future last)
  const grouped = useMemo(() => {
    const map = {};
    months.forEach((m) => { (map[m.year] ||= []).push(m); });
    return Object.entries(map)
      .sort(([a], [b]) => +a - +b)
      .map(([year, ms]) => [year, [...ms].sort((a, b) => a.monthIndex - b.monthIndex)]);
  }, [months]);

  // Ventana de meses: anterior + actual + siguiente.
  const recentMonths = useMemo(() => {
    const sorted = [...months].sort((a, b) => compareKeys(a.key, b.key));
    const todayK = todayKey();
    let currentIdx = sorted.findIndex(m => m.key === todayK);
    if (currentIdx < 0) currentIdx = sorted.length - 1;
    const from = Math.max(0, currentIdx - 1);
    const to = Math.min(sorted.length, currentIdx + 2);
    return sorted.slice(from, to);
  }, [months]);

  const filled = months.filter((m) => m.actual != null);
  const totalActual = filled.reduce((s, m) => s + m.actual, 0);
  // Use the planned that was active per the CURRENT tramos at the month's date.
  // This way changes in Ajustes reflect everywhere consistently.
  const totalPlanned = filled.reduce((s, m) => s + computePlannedFor(state.plan, m.key), 0);
  const diff = totalActual - totalPlanned;

  const addMonths = (n) => {
    update((s) => {
      const existing = new Set(s.months.map(m => m.key));
      const sorted = [...s.months].sort((a,b) => a.key > b.key ? 1 : -1);
      const last = sorted.length ? sorted[sorted.length - 1] : null;
      const base = last ? new Date(last.year, last.monthIndex + 1, 1) : new Date();
      const toAdd = [];
      for (let i = 0; i < n; i++) {
        const dt = new Date(base.getFullYear(), base.getMonth() + i, 1);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        if (!existing.has(key)) {
          toAdd.push({
            key,
            label: dt.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
            year: dt.getFullYear(), monthIndex: dt.getMonth(),
            planned: computePlannedFor(s.plan, key),
            actual: null,
            note: '',
          });
          existing.add(key);
        }
      }
      return { ...s, months: [...s.months, ...toAdd] };
    });
  };

  // ensureMonth: garantiza que existe el registro para year/monthIndex y
  // devuelve su key. Usado por el modal para crear meses al clicar celdas vacías.
  const ensureMonth = (year, monthIndex) => {
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    update((s) => {
      if (s.months.some(m => m.key === key)) return s;
      const dt = new Date(year, monthIndex, 1);
      return { ...s, months: [...s.months, {
        key,
        label: dt.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        year, monthIndex,
        planned: computePlannedFor(s.plan, key),
        actual: null, note: '',
      }] };
    });
    return key;
  };

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <div>
        <SectionTag>Mes a mes</SectionTag>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, letterSpacing: T.tracking.display, marginTop: 4, textWrap: 'pretty' }}>
          Llevas <em style={{ color: T.accent }}>{filled.length} {filled.length === 1 ? 'mes registrado' : 'meses registrados'}</em>.
          <span style={{ color: T.muted }}> Lo que apuntes aquí mueve la curva del futuro.</span>
        </div>
        {filled.length === 0 && (
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 10, lineHeight: T.lh.normal, maxWidth: 620 }}>
            El registro mes a mes no es contabilidad. Es un recordatorio: ¿cómo fue este mes respecto a lo previsto? La precisión absoluta no importa. La <Concept id="aporte-mensual">constancia</Concept> sí. Es lo que te dice si tu plan está vivo o se ha quedado en una hoja olvidada.
          </div>
        )}
      </div>

      {/* Live comparison: aggregate stats */}
      <Card style={{ background: T.panel }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 18, alignItems: 'baseline' }}>
          <Stat label="Total real aportado" value={fmtEur(totalActual)} />
          <Stat label="Plan acumulado" value={fmtEur(totalPlanned)} muted />
          <Stat label="Diferencia" value={(diff >= 0 ? '+' : '') + fmtEur(diff)} good={diff >= 0} bad={diff < 0} />
        </div>
      </Card>

      {/* Plan vs realidad · gráfico tras disclosure (P3 · divulgación progresiva). Función intacta. */}
      <div>
        <CartelBtn variant="text" onClick={() => setShowVsPlan((s) => !s)}>
          {showVsPlan ? '↑ Ocultar plan vs realidad' : 'Ver tu plan vs tu realidad →'}
        </CartelBtn>
      </div>
      {showVsPlan && (filled.length >= 3 ? (() => {
        const realAtLast = d.realPortfolioAtLastReg;
        const planAtLast = d.planPortfolioAtLastReg;
        // Color y mensaje desde la fuente única (d.verdict). El delta €/mes deja de decidir
        // el veredicto (antes contradecía a Hoy); el gráfico hereda el mismo color.
        const realColor = VERDICT_COLOR[d.verdict] || T.accent;
        const scenarios = [
          { label: 'Plan original', color: T.faint, series: d.seriesPlanFromStart, dashed: true },
          { label: 'Curva real', color: realColor, series: d.seriesRealFromStart, bold: true },
        ];
        return (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CartelLabel>Tu plan vs tu realidad</CartelLabel>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, marginTop: 4, lineHeight: T.lh.snug }}>
                {realAtLast != null && (
                  <>
                    Hoy: <span style={{ color: realColor }}>{fmtEur(realAtLast)}</span>
                    <span style={{ color: T.muted, fontSize: T.size.body }}> vs plan </span>
                    <span style={{ color: T.faint }}>{fmtEur(planAtLast)}</span>
                  </>
                )}
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 6, lineHeight: T.lh.normal }}>
                {d.verdictCopy}
                {d.verdictAge != null && d.ageAtFiPlan != null && (
                  <> A este ritmo, tu independencia financiera cae a los <strong style={{ color: T.ink, fontStyle: 'normal' }}>{d.ageAtFiReal.toFixed(1)}</strong> (plan: <strong style={{ color: T.ink, fontStyle: 'normal' }}>{d.ageAtFiPlan.toFixed(1)}</strong>).</>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0, flexWrap: 'wrap' }}>
              <LegendChip color={realColor} label="Real" />
              <LegendChip color={T.faint} label="Plan" dashed />
            </div>
          </div>
          <MultiLineChart scenarios={scenarios} height={240} />
        </Card>
        );
      })() : (
        <Card style={{ borderStyle: 'dashed' }}>
          <CartelLabel>Tu plan vs tu realidad</CartelLabel>
          <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.muted, fontStyle: 'italic', marginTop: 8, lineHeight: T.lh.normal }}>
            Aún no hay suficientes datos. Registra al menos <strong style={{ color: T.ink, fontStyle: 'normal' }}>3 meses</strong> y verás aquí la curva de tu plan original comparada con la curva real reconstruida.
            <br />
            Llevas <strong style={{ color: T.accent, fontStyle: 'normal' }}>{filled.length} {filled.length === 1 ? 'mes' : 'meses'}</strong>.
          </div>
        </Card>
      ))}

      {/* B5 · Mensual reducido a los últimos 3 meses. La vista anual completa
          vive en un modal expandible. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recentMonths.length === 0 ? (
          <div style={{ padding: 18, border: '1px dashed ' + T.line, borderRadius: 10, textAlign: 'center', fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption }}>
            Sin meses todavía. Cargarán al crear el plan.
          </div>
        ) : recentMonths.map((m) => (
          <MonthRow key={m.key} month={m} isCurrent={m.key === currentKey} onChange={(patch) => setMonth(m.key, patch)} />
        ))}
      </div>
      {/* Calendario completo · INLINE desde el inicio (antes tras «Ver calendario completo →» en modal).
          Mismo componente en modo `inline`: sin overlay, sin lock de scroll, en el flujo de la página. */}
      <div style={{ paddingTop: 4 }}>
        <MonthlyCalendarModal
          inline
          grouped={grouped}
          plan={state.plan}
          setMonth={setMonth}
          addMonths={addMonths}
          ensureMonth={ensureMonth}
          update={update}
        />
      </div>
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic', lineHeight: T.lh.normal }}>
          Lo que ves en <strong style={{ color: T.ink, fontStyle: 'normal' }}>"Plan"</strong> sale en vivo de los tramos en Ajustes. No hay que regenerar nada: cualquier cambio en Ajustes se refleja aquí al instante.
        </div>
      </div>

    </div>
  );
}

export function MonthRow({ month, isCurrent, onChange }) {
  const { state } = useStore();
  const mobile = useIsMobile();
  // Live compute the planned for this month from current tramos
  const plannedComputed = useMemo(() => computePlannedFor(state.plan, month.key), [state.plan, month.key]);
  const incomeAtMonth = useMemo(() => computeIncomeFor(state.plan, month.key), [state.plan, month.key]);
  const seg = useMemo(() => findActiveSegment(state.plan.savingSegments, month.key), [state.plan.savingSegments, month.key]);
  const ratio = month.actual != null && plannedComputed ? month.actual / plannedComputed : null;
  const empty = month.actual == null;
  const past = (() => {
    const now = new Date();
    return month.year < now.getFullYear() || (month.year === now.getFullYear() && month.monthIndex < now.getMonth());
  })();

  if (mobile) {
    // Mobile: stacked layout that fits any portrait phone
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        padding: '14px 14px', overflow: 'hidden',
        background: isCurrent ? T.accentSoft : empty ? 'transparent' : T.paper,
        border: '1px solid ' + (isCurrent ? T.accent : empty ? T.lineSoft : T.line),
        borderRadius: 10,
        borderStyle: empty ? 'dashed' : 'solid',
      }}>
        {/* Row 1: month label + status tag + clean btn */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, color: isCurrent ? T.accent : empty ? T.faint : T.ink, textTransform: 'capitalize' }}>{month.label.replace('.', '')}</span>
            {isCurrent && <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.accent, letterSpacing: 0 }}>Mes actual</span>}
            {past && empty && <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.amber, letterSpacing: 0 }}>Atrasado</span>}
            {empty && !past && <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.faint, letterSpacing: 0 }}>Futuro</span>}
          </div>
          {!empty && (
            <button onClick={() => onChange({ actual: null })}
              title="Borrar registro"
              style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: T.tracking.wider, flexShrink: 0, padding: '4px 0' }}>
              limpiar
            </button>
          )}
        </div>

        {/* Row 2: Plan + Real side by side, full-width responsive */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <Label style={{ marginBottom: 2 }}>Plan</Label>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.faint, letterSpacing: T.tracking.tight, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fmtEur(plannedComputed)}
            </div>
            {seg && seg.type === 'percent' && incomeAtMonth > 0 && (
              <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 1, letterSpacing: T.tracking.wide, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fmtPctView(seg.value)}% · {fmtEur(incomeAtMonth)}
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <Label style={{ marginBottom: 2 }}>Real</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
              <input
                type="number"
                inputMode="numeric"
                value={month.actual ?? ''}
                placeholder="—"
                onChange={(e) => onChange({ actual: e.target.value === '' ? null : +e.target.value })}
                style={{
                  fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.accent,
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid ' + (empty ? T.lineSoft : T.line),
                  width: '100%', minWidth: 0, maxWidth: '100%', outline: 'none', padding: '2px 0',
                }}
              />
              {ratio != null && (
                <span style={{
                  fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '2px 6px', borderRadius: 999,
                  color: ratio >= 1 ? T.green : T.amber,
                  background: ratio >= 1 ? T.greenSoft : 'rgba(180,83,9,0.10)',
                  letterSpacing: T.tracking.wide, flexShrink: 0, whiteSpace: 'nowrap',
                }}>{ratio >= 1 ? '+' : ''}{Math.round((ratio - 1) * 100)}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: note (only show if has content OR if month is being interacted with) */}
        {(month.note || !empty) && (
          <div>
            <Label style={{ marginBottom: 2 }}>Nota</Label>
            <input type="text" value={month.note || ''} placeholder="Una nota..." onChange={(e) => onChange({ note: e.target.value })}
              style={{
                width: '100%', fontFamily: T.serif, fontStyle: month.note ? 'italic' : 'normal',
                fontSize: T.size.caption, color: T.muted, background: 'transparent',
                border: 'none', borderBottom: '1px dashed ' + T.lineSoft, outline: 'none', padding: '4px 0',
                boxSizing: 'border-box',
              }} />
          </div>
        )}
      </div>
    );
  }

  // Desktop: original grid
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '140px 110px 160px minmax(0,1fr) 60px',
      gap: 14, padding: '14px 18px', alignItems: 'center',
      background: isCurrent ? T.accentSoft : empty ? 'transparent' : T.paper,
      border: '1px solid ' + (isCurrent ? T.accent : empty ? T.lineSoft : T.line),
      borderRadius: 10,
      borderStyle: empty ? 'dashed' : 'solid',
    }}>
      <div>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, color: isCurrent ? T.accent : empty ? T.faint : T.ink, textTransform: 'capitalize' }}>{month.label.replace('.', '')}</div>
        {isCurrent && <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.accent, letterSpacing: 0, marginTop: 2 }}>Mes actual</div>}
        {past && empty && <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.amber, letterSpacing: 0, marginTop: 2 }}>Atrasado</div>}
      </div>

      <div style={{ minWidth: 0 }}>
        <Label style={{ marginBottom: 2 }}>Plan</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.faint, letterSpacing: T.tracking.tight }}>{fmtEur(plannedComputed)}</span>
        </div>
        {seg && seg.type === 'percent' && incomeAtMonth > 0 && (
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 1, letterSpacing: T.tracking.wide }}>
            {fmtPctView(seg.value)}% · {fmtEur(incomeAtMonth)}
          </div>
        )}
      </div>

      <div>
        <Label style={{ marginBottom: 2 }}>Real</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <input
            type="number"
            value={month.actual ?? ''}
            placeholder="—"
            onChange={(e) => onChange({ actual: e.target.value === '' ? null : +e.target.value })}
            style={{
              fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.accent,
              background: 'transparent', border: 'none',
              borderBottom: '1px solid ' + (empty ? T.lineSoft : T.line),
              width: 110, outline: 'none', padding: '2px 0',
            }}
          />
          {ratio != null && (
            <span style={{
              fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '3px 8px', borderRadius: 999,
              color: ratio >= 1 ? T.green : T.amber,
              background: ratio >= 1 ? T.greenSoft : 'rgba(180,83,9,0.10)',
              letterSpacing: T.tracking.wide,
            }}>{ratio >= 1 ? '+' : ''}{Math.round((ratio - 1) * 100)}%</span>
          )}
        </div>
      </div>

      <div>
        <Label style={{ marginBottom: 2 }}>Nota</Label>
        <input type="text" value={month.note || ''} placeholder="Una nota..." onChange={(e) => onChange({ note: e.target.value })}
          style={{
            width: '100%', fontFamily: T.serif, fontStyle: month.note ? 'italic' : 'normal',
            fontSize: T.size.body, color: T.muted, background: 'transparent',
            border: 'none', outline: 'none', padding: '2px 0',
          }} />
      </div>

      <div style={{ textAlign: 'right' }}>
        {empty && !past && <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.faint, letterSpacing: 0 }}>Futuro</span>}
        {!empty && (
          <button onClick={() => onChange({ actual: null })}
            title="Borrar registro"
            style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: T.tracking.wider }}>
            limpiar
          </button>
        )}
      </div>
    </div>
  );
}

// ── "El motor" de Proyección · línea de vida (curva de patrimonio año a año) + dial de
// aporte. Reemplaza "Curva de patrimonio" (3 líneas) y "Tu yo del futuro" (tarjetas): UNA
// sola curva legible. El dial solo aparece con gasto declarado — sin él, el aporte está
// acoplado al número FIRE (subirlo baja la meta Y sube la curva: doble efecto que sobrevende),
// así que en su lugar va una invitación calmada a declarar el gasto. La línea de vida siempre
// se muestra (solo lectura, no engaña). Todo deriva de `d` → el hero reacciona en vivo.

// ── GastoSheet · overlay estilo Cartel para declarar el gasto en detalle ─────────
// Reusa el payload de actualLife (mismo shape que ActualLifeOnboarding) pero con presentación
// Cartel; NO toca el modal compartido. Lee plan.actualLife.expenses como borrador inicial (no
// machaca un desglose previo) y conserva mortgage/allocation. El scrim usa T.ink + opacity (sin
// rgba literal). Al guardar, el número FIRE pasa a usar sumExpenses (useDerived ya conmuta).
const GASTO_CATS = [
  { k: 'housing', label: 'Vivienda' },
  { k: 'food', label: 'Comida' },
  { k: 'transport', label: 'Transporte' },
  { k: 'subscriptions', label: 'Suscripciones' },
  { k: 'other', label: 'Otros' },
];
// Formulario de gasto reutilizable (5 categorías + total en vivo, primitivas Cartel). Lo usa
// GastoSheet (overlay) y queda disponible para deduplicar con el paso de gastos de
// ActualLifeOnboarding (FN2). Se monta fresco en cada apertura → init del borrador en mount.
function ExpensesForm({ initial, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => ({ ...(initial || {}) }));
  const total = GASTO_CATS.reduce((s, c) => s + (Number(draft[c.k]) || 0), 0);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: Math.max(0, Math.round(v)) }));
  return (
    <>
      {GASTO_CATS.map((c) => (
        <div key={c.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, borderTop: '1px solid ' + T.lineSoft, padding: '14px 0', textAlign: 'left' }}>
          <span style={{ fontFamily: T.serif, fontSize: 18 }}>{c.label}</span>
          <span style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 19, whiteSpace: 'nowrap' }}><EditableValue value={draft[c.k] || 0} onChange={(v) => set(c.k, v)} min={0} max={100000} suffix="€/mes" ariaLabel={c.label} /></span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '2px solid ' + T.line, paddingTop: 14, marginTop: 2, fontFamily: T.serif, fontWeight: 600, fontSize: 20 }}>
        <span>Total</span><span style={{ color: T.accent }}>{fmtNum(total)} €/mes</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 26, justifyContent: 'center', alignItems: 'center' }}>
        <CartelBtn variant="text" onClick={onCancel}>Cancelar</CartelBtn>
        <CartelBtn onClick={() => onSave(draft)} style={{ borderRadius: 10, padding: '12px 28px', fontSize: 17 }}>Guardar</CartelBtn>
      </div>
    </>
  );
}

function GastoSheet({ open, onClose, initial, onSave }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  // Portal a document.body: el overlay debe quedar FUERA del contenedor de la pestaña (.tab-enter
  // tiene transform → position:fixed se ancla a él, no al viewport, y el panel caería fuera de pantalla).
  const sheet = (
    <div role="dialog" aria-modal="true" aria-label="Declarar el gasto" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: T.ink, opacity: 0.45 }} />
      <div style={{ position: 'relative', background: T.bg, border: '1px solid ' + T.line, borderRadius: 16, padding: 'clamp(28px, 5vw, 44px)', maxWidth: 460, width: '100%', maxHeight: '88vh', overflowY: 'auto', textAlign: 'center' }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 'clamp(20px, 3vw, 26px)', color: T.accent, marginBottom: 6 }}>Tu gasto, en detalle</div>
        <p style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: 16, margin: '0 auto 18px', maxWidth: '32ch', lineHeight: 1.4 }}>Reparte lo que gastas cada mes. Tu número saldrá de aquí.</p>
        <ExpensesForm initial={initial} onSave={(d) => { onSave(d); onClose(); }} onCancel={onClose} />
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(sheet, document.body) : sheet;
}

// ── Dirección «Cartel» (póster editorial) · Fase 1 ──────────────────────────────
// Reescritura de Proyección con el sistema Cartel (ui/cartel.jsx). Inputs editables
// cableados al motor EXISTENTE (recalculan en vivo); resultados calculados con count-up al
// revelarse. Paleta intacta · Fraunces display · sin etiquetas mono · prefers-reduced-motion.
// La versión anterior queda como ScreenProyeccionLegacy (referencia para la Fase 2).
export function ScreenProyeccion() {
  const { state, updatePlan, updateProfile, update } = useStore();
  const { profile, plan } = state;
  const m = usePlanMutators();
  const d = useDerived();
  const mobile = useIsMobile();
  const [gastoSheetOpen, setGastoSheetOpen] = useState(false);
  const [openSalario, setOpenSalario] = useState(false);
  const [openComplementos, setOpenComplementos] = useState(false);
  // MC Pro · modo de secuencia de retornos (riesgo de orden): 'random' (default),
  // 'early-crash' (crisis nada más jubilarte, el peor caso), 'late-crash' (crisis tardía).
  const [seqMode, setSeqMode] = useState('random');
  // MC avanzado · colas gruesas (Student-t): crisis extremas más probables que la normal.
  const [fatTails, setFatTails] = useState(false);

  // ── Editables ──
  const retireAge = profile.retireAge;
  const currentAge = profile.age;
  const annualReturn = plan.annualReturn != null ? plan.annualReturn : 8;
  const inflationRate = plan.inflationRate != null ? plan.inflationRate : 2.5;
  const withdrawalRate = plan.withdrawalRate != null ? plan.withdrawalRate : 4;
  const lifeExpectancy = plan.lifeExpectancy != null ? plan.lifeExpectancy : 90;
  const pensionAge = (plan.publicPension && plan.publicPension.startAge) || 67;
  const incomeNow = computeIncomeFor(plan, todayKey());
  const aporte = Math.round(currentMonthlyAporte(plan) || 0);
  const savingSeg = findActiveSegment(plan.savingSegments, todayKey());
  const savingsPct = savingSeg && savingSeg.type === 'percent' ? Math.round(savingSeg.value * 10) / 10 : (incomeNow > 0 ? Math.round((aporte / incomeNow) * 100) : 0);
  const salarioNow = Math.round(sumActiveSegments(plan.incomeSegments, todayKey()));
  const complementosNow = Math.round(sumActiveSegments(plan.bonusSegments, todayKey()));
  const nSalario = (plan.incomeSegments || []).length;
  const nComplementos = (plan.bonusSegments || []).length;

  // ── Calculados (motor) ──
  const estado = d.destinoEstado;
  const libreAge = d.cruceEdad != null ? Math.ceil(d.cruceEdad) : null;
  const heroColor = estado === 'libre' ? T.green : estado === 'tarde' ? T.amber : T.muted;
  const fireTargetReal = Math.round(d.fiTarget || 0);
  const fireTargetNom = Math.round(fireTargetReal * Math.pow(1 + inflationRate / 100, Math.max(0, retireAge - currentAge)));
  const gasto = Math.round(fireTargetReal * (withdrawalRate / 100) / 12);
  const fiMult = Math.round(100 / withdrawalRate);
  const seriesBase = useMemo(() => projectV2(plan, profile, { capital: d.currentPortfolio, includeHypothetical: false }), [plan, profile, d.currentPortfolio]);
  const seriesPos = useMemo(() => projectV2(plan, profile, { capital: d.currentPortfolio, includeHypothetical: true }), [plan, profile, d.currentPortfolio]);
  const finalNominal = seriesBase.length ? Math.round(seriesBase[seriesBase.length - 1].portfolio || 0) : 0;
  // Modo real (toggle en Asunciones): deflacta las cifras nominales a € del año base. Default nominal.
  const realMode = state.displayMode === 'real';
  const deflator = Math.pow(1 + inflationRate / 100, Math.max(0, retireAge - currentAge));
  const finalReal = Math.round(finalNominal / deflator);
  const finalConPosible = seriesPos.length ? Math.round(seriesPos[seriesPos.length - 1].portfolio || 0) : 0;
  const hayPosibles = Math.abs(finalConPosible - finalNominal) > 1000;
  // La curva de vida se proyecta hasta el cruce (no solo hasta retireAge): si llegas «tarde»
  // (cruce > retireAge) el ★ caería fuera del gráfico. Mismo motor que la detección de cruce
  // (proyección de acumulación con endAge); seriesBase/finalNominal NO cambian (siguen a retireAge).
  const lifeEndAge = libreAge != null ? Math.max(retireAge, libreAge + 1) : retireAge;
  const lifeSeries = useMemo(() => projectV2(plan, profile, { capital: d.currentPortfolio, includeHypothetical: false, endAge: lifeEndAge }), [plan, profile, d.currentPortfolio, lifeEndAge]);
  const lifePoints = useMemo(() => (lifeSeries || []).filter((r) => r && r.monthIndex % 12 === 0).map((r) => {
    const yrs = r.age - currentAge;
    return { age: Math.round(r.age), portfolio: Math.round(r.portfolio || 0), meta: Math.round(fireTargetReal * Math.pow(1 + inflationRate / 100, yrs)) };
  }), [lifeSeries, fireTargetReal, inflationRate, currentAge]);
  // Tipos de FIRE (vías deterministas del motor). Coast/Lean caen normalmente dentro del dominio
  // de la curva; Fat suele quedar fuera (gasto ×1,5 → más tarde/null) → sin punto, pero nombrado
  // en la leyenda. El ★ del cruce lo dibuja LifeChart vía cruceAge (no se duplica aquí).
  const coastAge = d.coastEdad != null ? Math.ceil(d.coastEdad) : null;
  const leanAge = d.leanEdad != null ? Math.ceil(d.leanEdad) : null;
  const fatAge = d.fatEdad != null ? Math.ceil(d.fatEdad) : null;
  const milestones = [
    d.leanEdad != null && { age: d.leanEdad, color: T.accent, fill: false },
    d.coastEdad != null && { age: d.coastEdad, color: T.accent, fill: true },
    d.fatEdad != null && { age: d.fatEdad, color: T.muted, fill: false },
  ].filter(Boolean);

  const mc = useMemo(() => { try { return runMonteCarlo(plan, profile, { trials: 400, startCapital: d.currentPortfolio, includeHypothetical: false, sequenceMode: seqMode, fatTails }); } catch (e) { return null; } }, [plan, profile, d.currentPortfolio, seqMode, fatTails]);
  const depStats = mc ? mc.depletionAgeStats : null;
  const successPct = mc ? Math.round(mc.successRate * 100) : 0;
  const bands = mc && mc.bandsByAge ? mc.bandsByAge : [];
  const pAt = bands.length ? (bands.find((r) => r.age === retireAge) || bands[bands.length - 1]) : null;
  const p10 = pAt ? pAt.p10 : 0, p50 = pAt ? pAt.p50 : 0, p90 = pAt ? pAt.p90 : 0;
  const zona = successPct >= 90 ? 'Excelente' : successPct >= 75 ? 'Aceptable' : successPct >= 50 ? 'Frágil' : 'Crítico';
  // Coherencia real/nominal (auditoría): en modo real, las bandas del MC se deflactan POR EDAD (cada
  // punto a € de hoy con su propio factor), igual que los P10/P50/P90 de abajo. Antes el gráfico se
  // quedaba nominal mientras los números bajo él iban en real → inconsistencia visual.
  const bandsShown = realMode ? bands.map((b) => {
    const f = Math.pow(1 + inflationRate / 100, Math.max(0, b.age - currentAge));
    return { age: b.age, p10: b.p10 / f, p25: b.p25 / f, p50: b.p50 / f, p75: b.p75 / f, p90: b.p90 / f };
  }) : bands;

  // ── Cableado al motor ──
  // Editar el gasto = declarar tu gasto mensual (global, como en el resto de la app): fija el
  // patrón de gasto y recalcula el número FIRE. Mantiene el desglose plano en "otros".
  const setGasto = (euros) => updatePlan({ actualLife: { ...(plan.actualLife || {}), completed: true, expenses: { housing: 0, food: 0, transport: 0, subscriptions: 0, other: Math.round(euros) } } });
  const setSavingsPct = (pct) => { if (savingSeg) m.updateSaving(savingSeg.id, { type: 'percent', value: Math.max(0, Math.min(60, pct)) }); };
  // IPC del salario (salaryInflationFactor): 100 % = el salario sube como la inflación; 0 % = fijo.
  // Default 1.0 (ya en migrateToV2). Lo lee projectV2 → recálculo en vivo. Distinto de inflationRate.
  const ipcPct = Math.round((plan.salaryInflationFactor != null ? plan.salaryInflationFactor : 1.0) * 100);
  const setIpcPct = (v) => updatePlan({ salaryInflationFactor: Math.max(0, Math.min(100, v)) / 100 });
  // Guarda el desglose del overlay con el MISMO shape que ActualLifeOnboarding (completed + expenses),
  // conservando mortgage/allocation. useDerived conmuta a gasto declarado (sumExpenses) → número real.
  const saveExpenses = (exp) => updatePlan({ actualLife: { ...(plan.actualLife || {}), completed: true, expenses: { housing: Math.max(0, Math.round(exp.housing || 0)), food: Math.max(0, Math.round(exp.food || 0)), transport: Math.max(0, Math.round(exp.transport || 0)), subscriptions: Math.max(0, Math.round(exp.subscriptions || 0)), other: Math.max(0, Math.round(exp.other || 0)) } } });
  const tramoDates = (s) => `${readableMonth(s.from)} → ${s.to ? readableMonth(s.to) : 'sin fin'}`;
  const dec = (x) => (Number.isInteger(x) ? 0 : 1);

  // ── Estilos compartidos ──
  const mega = (color, big) => ({ fontFamily: T.serif, fontWeight: 600, fontSize: big ? 'clamp(54px, 10.5vw, 136px)' : 'clamp(46px, 9vw, 112px)', lineHeight: 0.86, letterSpacing: '-.04em', color, margin: 0 });
  const cap = { fontFamily: T.serif, fontStyle: 'italic', fontSize: 'clamp(17px, 2vw, 24px)', color: T.muted, maxWidth: '34ch', margin: '22px auto 0', lineHeight: 1.4 };
  const note = { fontFamily: T.serif, fontStyle: 'italic', fontSize: 'clamp(15px, 1.8vw, 20px)', color: T.faint, maxWidth: '48ch', margin: '18px auto 0', lineHeight: 1.5 };
  const subhead = { fontFamily: T.serif, fontStyle: 'italic', fontSize: 17, color: T.accent, margin: '28px 0 0', textAlign: 'left', width: '100%', maxWidth: 600 };
  // CTA y «+ añadir» usan ahora la primitiva CartelBtn (cartel.jsx) — voz serif unificada (S6).
  const paramVal = { fontFamily: T.serif, fontWeight: 600, fontSize: 'clamp(30px, 4vw, 48px)', letterSpacing: '-.02em', lineHeight: 0.9, color: T.ink };

  return (
    <div style={{ position: 'relative', paddingBottom: '6vh' }}>
      <PosterFrame top={mobile ? 66 : 86} />
      {/* La columna de contenido se mete DENTRO del encuadre: padding ≥ inset del marco
          (16px) + holgura, y max-width por debajo del marco. Sin esto, a vistas estrechas
          el contenido (tramos, gráficas) se salía del PosterFrame. */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 712, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>

        {/* 1 · HERO */}
        <Spread>
          <Reveal><SectionTag>Proyección</SectionTag></Reveal>
          <Reveal delay={30}><div style={{ marginTop: 14 }}><DisplayModeToggle /></div></Reveal>
          <Reveal delay={50}>
            <h1 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 'clamp(44px, 8.5vw, 112px)', lineHeight: 0.95, letterSpacing: '-.03em', margin: '12px 0 0', color: T.ink }}>
              {estado === 'no-llega'
                ? <>Con tu plan, aún no llegas.</>
                : <>{estado === 'libre' ? 'Eres libre a los ' : 'Libre, pero tarde: a los '}<span style={{ whiteSpace: 'nowrap' }}><ComputedNumber as="span" value={libreAge || 0} format={(v) => Math.round(v)} style={{ color: heroColor, display: 'inline-block' }} />.</span></>}
            </h1>
          </Reveal>
          <Reveal delay={110}><p style={{ ...cap, fontSize: 'clamp(18px, 2.1vw, 26px)', maxWidth: '32ch' }}>A esa edad las rentas de tu cartera cubren tu gasto: dejas de depender de un sueldo.</p></Reveal>
          {d.verdictCopy && <Reveal delay={130}><p style={{ ...cap, fontStyle: 'italic', color: VERDICT_COLOR[d.verdict] || T.muted, marginTop: 6 }}>{d.verdictCopy}</p></Reveal>}
          <Reveal delay={150}><Stats3 items={[
            { computed: realMode ? finalReal : finalNominal, em: `a los ${retireAge}` },
            { computed: realMode ? fireTargetReal : fireTargetNom, color: T.accent, em: realMode ? 'tu número' : `tu número · ≈ ${fmtMoneyBig(fireTargetReal)} de 2026` },
            { value: pensionAge, em: 'pensión pública, desde los' },
          ]} /></Reveal>
          {hayPosibles && <Reveal delay={200}><p style={note}>Con los eventos posibles incluidos, a los {retireAge} llegarías a {fmtMoneyBig(finalConPosible)}.</p></Reveal>}
          <Reveal delay={240}><p style={{ ...note, marginTop: 30 }}>Los números <span style={{ color: T.accent, borderBottom: '1.5px dashed ' + T.accent, paddingBottom: 1 }}>subrayados</span> los pones tú. El resto los calcula tu plan.</p></Reveal>
        </Spread>

        {/* 2 · LÍNEA DE VIDA */}
        <Spread>
          <Reveal><CartelIcon id="interes-compuesto" size={72} color={T.accent} style={{ margin: '0 auto 6px' }} /></Reveal>
          <Reveal delay={40}><SectionTag>Tu línea de vida</SectionTag></Reveal>
          <Reveal delay={80} style={{ width: '100%' }}><LifeChart points={lifePoints} cruceAge={d.cruceEdad} markers={milestones} style={{ marginTop: 24 }} /></Reveal>
          <Reveal delay={120}><p style={cap}>Tu número — <EditableValue value={gasto} onChange={setGasto} min={0} max={100000} suffix="€/mes" ariaLabel="Gasto mensual" /> → {fmtNum(gasto * 12)} €/año × {fiMult} = {fmtNum(fireTargetReal)} € de 2026 (regla del {withdrawalRate} %).</p></Reveal>
          <Reveal delay={140}><CartelBtn variant="text" onClick={() => setGastoSheetOpen(true)} style={{ marginTop: 14 }}>Desglosar mi gasto →</CartelBtn></Reveal>
          <Reveal delay={160}><p style={note}>Tu meta sube con los años porque tus gastos también subirán. El ★ es el cruce: a los {libreAge != null ? libreAge : '—'}, el {withdrawalRate} % anual de tu cartera iguala tu gasto.</p></Reveal>
          <Reveal delay={200}><p style={note}>Tipos de FIRE: <b style={{ color: T.accent }}>Lean</b> a los {leanAge != null ? leanAge : '—'} (gasto ajustado), <b style={{ color: T.accent }}>Coast</b> a los {coastAge != null ? coastAge : '—'} (dejas de aportar), <b style={{ color: T.green }}>FIRE pleno</b> a los {libreAge != null ? libreAge : '—'} (tu número) y <b style={{ color: T.muted }}>Fat</b> {fatAge != null ? `a los ${fatAge}` : 'fuera de alcance'} (vida holgada, ×1,5).</p></Reveal>
        </Spread>

        {/* 3 · LA PALANCA */}
        <Spread>
          <Reveal><CartelIcon id="retorno-anual" size={76} color={T.accent} style={{ margin: '0 auto 6px' }} /></Reveal>
          <Reveal delay={40}><SectionTag>La palanca · tu tasa de ahorro</SectionTag></Reveal>
          <Reveal delay={80}><p style={mega(T.ink)}><EditableValue value={savingsPct} onChange={setSavingsPct} min={0} max={60} suffix="%" ariaLabel="Tasa de ahorro" /> · {fmtNum(aporte)} €/mes</p></Reveal>
          <Reveal delay={130}><p style={cap}>No es cuánto ganas — es qué % guardas. Es lo que más adelanta tu fecha.</p></Reveal>
          <Reveal delay={170}><p style={note}>Tu número no cambia: mover esto solo cambia cuándo llegas (rango 0 % a 60 %).</p></Reveal>
          <Reveal delay={210} style={{ width: '100%', marginTop: '3vh' }}><WhatIfCard d={d} plan={plan} /></Reveal>
        </Spread>

        {/* 4 · INGRESOS */}
        <Spread>
          <Reveal><CartelIcon id="patrimonio" size={72} color={T.ink} style={{ margin: '0 auto 6px' }} /></Reveal>
          <Reveal delay={40}><SectionTag>Ingresos</SectionTag></Reveal>
          <Reveal delay={70}><p style={cap}>Lo que entra cada mes. El salario base sube con el IPC; los complementos van aparte.</p></Reveal>
          <Reveal delay={90}><p style={note}>El salario sigue al IPC al <EditableValue value={ipcPct} onChange={setIpcPct} min={0} max={100} suffix="%" ariaLabel="Seguimiento del salario al IPC" /> (100 % = sube como la inflación; 0 % = se queda fijo). Distinto de la inflación general, que ajustas en Asunciones.</p></Reveal>
          <Reveal delay={100} style={{ width: '100%', maxWidth: 600 }}>
            {/* Salario base · colapsable (resumen → editar tramos) */}
            <button onClick={() => setOpenSalario((o) => !o)} aria-expanded={openSalario}
              style={{ ...subhead, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, background: 'transparent', border: 'none', borderBottom: '1px solid ' + T.lineSoft, padding: '6px 0 8px', cursor: 'pointer' }}>
              <span>Salario base <span style={{ fontStyle: 'normal', fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, color: T.muted }}>· {fmtNum(salarioNow)} €/mes · {nSalario} {nSalario === 1 ? 'tramo' : 'tramos'}</span></span>
              <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, color: T.faint, whiteSpace: 'nowrap' }}>{openSalario ? '▾ ocultar' : '▸ editar'}</span>
            </button>
            {openSalario && (<>
              {(plan.incomeSegments || []).map((s) => (
                <CartelTramoRow key={s.id} name={s.label || 'Salario'}
                  fromNode={<CartelMonthValue value={s.from} onChange={(v) => m.updateIncome(s.id, { from: v })} ariaLabel="Desde" />}
                  toNode={<CartelMonthValue value={s.to} allowEmpty onChange={(v) => m.updateIncome(s.id, { to: v })} ariaLabel="Hasta" />}
                  onDelete={() => m.deleteIncome(s.id)}>
                  <EditableValue value={Math.round(s.amount || 0)} onChange={(v) => m.updateIncome(s.id, { amount: Math.round(v) })} min={0} max={100000} ariaLabel={`Importe ${s.label || 'salario'}`} />
                </CartelTramoRow>
              ))}
              <div style={{ textAlign: 'left', marginTop: 12 }}><CartelBtn variant="text" onClick={() => m.addIncome()}>+ añadir tramo de salario</CartelBtn></div>
            </>)}
            {/* Complementos · colapsable */}
            <button onClick={() => setOpenComplementos((o) => !o)} aria-expanded={openComplementos}
              style={{ ...subhead, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, background: 'transparent', border: 'none', borderBottom: '1px solid ' + T.lineSoft, padding: '6px 0 8px', cursor: 'pointer' }}>
              <span>Complementos <span style={{ fontStyle: 'normal', fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, color: T.muted }}>· {complementosNow > 0 ? fmtNum(complementosNow) + ' €/mes' : 'ninguno'}{nComplementos > 0 ? ` · ${nComplementos}` : ''}</span></span>
              <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, color: T.faint, whiteSpace: 'nowrap' }}>{openComplementos ? '▾ ocultar' : '▸ editar'}</span>
            </button>
            {openComplementos && (<>
              {(plan.bonusSegments || []).map((s) => (
                <CartelTramoRow key={s.id} name={s.label || 'Complemento'}
                  fromNode={<CartelMonthValue value={s.from} onChange={(v) => m.updateBonus(s.id, { from: v })} ariaLabel="Desde" />}
                  toNode={<CartelMonthValue value={s.to} allowEmpty onChange={(v) => m.updateBonus(s.id, { to: v })} ariaLabel="Hasta" />}
                  onDelete={() => m.deleteBonus(s.id)}>
                  <EditableValue value={Math.round(s.amount || 0)} onChange={(v) => m.updateBonus(s.id, { amount: Math.round(v) })} min={0} max={100000} ariaLabel={`Importe ${s.label || 'complemento'}`} />
                </CartelTramoRow>
              ))}
              <div style={{ textAlign: 'left', marginTop: 12 }}><CartelBtn variant="text" onClick={() => m.addBonus()}>+ añadir complemento</CartelBtn></div>
            </>)}
            <div style={subhead}>Aporte</div>
            <CartelTramoRow name={`Aporte ${fmtPctView(savingsPct)} % del ingreso`} dates={savingSeg ? tramoDates(savingSeg) : ''} staticAmt={`≈ ${fmtNum(aporte)} €/mes`} />
          </Reveal>
          {hayPosibles && <Reveal delay={140}><p style={note}>Eventos y boosts incluidos: a los {retireAge} llegarías a {fmtMoneyBig(finalConPosible)}.</p></Reveal>}
        </Spread>

        {/* 5 · ASUNCIONES */}
        <Spread short>
          <Reveal><SectionTag>Lo que pones tú · asunciones del modelo</SectionTag></Reveal>
          <Reveal delay={60} style={{ marginTop: '3vh', width: '100%' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4vh 52px', justifyContent: 'center' }}>
              {[
                { id: 'retorno-anual', label: 'retorno anual', node: <EditableValue value={annualReturn} onChange={(v) => updatePlan({ annualReturn: v })} min={0} max={20} decimals={dec(annualReturn)} suffix="%" ariaLabel="Retorno anual" /> },
                { id: 'inflacion', label: 'inflación esperada', node: <EditableValue value={inflationRate} onChange={(v) => updatePlan({ inflationRate: v })} min={0} max={15} decimals={1} suffix="%" ariaLabel="Inflación" /> },
                { id: 'tasa-retiro', label: 'tasa de retiro', node: <EditableValue value={withdrawalRate} onChange={(v) => updatePlan({ withdrawalRate: v })} min={2} max={8} decimals={dec(withdrawalRate)} suffix="%" ariaLabel="Tasa de retiro" /> },
                { id: 'esperanza-vida', label: 'esperanza de vida', node: <EditableValue value={lifeExpectancy} onChange={(v) => updatePlan({ lifeExpectancy: Math.round(v) })} min={70} max={110} ariaLabel="Esperanza de vida" /> },
              ].map((it) => (
                <div key={it.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <CartelIcon id={it.id} size={42} color={T.accent} />
                  <div style={paramVal}>{it.node}</div>
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, color: T.muted }}>{it.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}><p style={note}>Medias razonables a largo plazo. El 4 % asume ~30 años de jubilación (estudio Trinity); para 40+ años, baja a 3–3,5 %. Cambiarlos actualiza toda la proyección. El selector <b>Nominal / € de hoy</b> de arriba cambia cómo se muestran todas las cifras.</p></Reveal>
        </Spread>

        {/* 6 · ¿Y TE DURA? */}
        <Spread>
          <Reveal><CartelIcon id="montecarlo-fan" size={76} color={T.accent} style={{ margin: '0 auto 6px' }} /></Reveal>
          <Reveal delay={40}><SectionTag>¿Y te dura?</SectionTag></Reveal>
          <Reveal delay={70}><p style={cap}>{mc ? mc.trials : 500} simulaciones con volatilidad real. ¿En cuántas tu dinero aguanta hasta los {lifeExpectancy}?</p></Reveal>
          <ComputedNumber value={successPct} format={(v) => Math.round(v) + ' %'} style={{ ...mega(T.green, true), marginTop: 4 }} ariaLabel="Tasa de éxito Monte Carlo" />
          <Reveal delay={120}><p style={cap}>{zona} — {successPct} de cada 100 futuros aguantan hasta los {lifeExpectancy}; {100 - successPct} se agotan antes.</p></Reveal>
          <Reveal delay={150} style={{ width: '100%' }}><MonteCarloChart bands={bandsShown} retireAge={retireAge} style={{ marginTop: 24 }} /></Reveal>
          <Reveal delay={180}><p style={note}>Hasta los {retireAge} la nube es estrecha: todos los futuros acumulan parecido. Al jubilarte se abre — arriba los que crecen, abajo la cola que se agota antes de los {lifeExpectancy}.</p></Reveal>
          <Reveal delay={210}><Stats3 items={[
            { value: fmtMoneyBig(realMode ? p10 / deflator : p10), em: `P10 · ${retireAge} (el peor 10 %)` },
            { value: fmtMoneyBig(realMode ? p50 / deflator : p50), em: `mediana · ${retireAge}` },
            { value: fmtMoneyBig(realMode ? p90 / deflator : p90), color: T.accent, em: `P90 · ${retireAge} (el mejor 10 %)` },
          ]} /></Reveal>
          {/* MC Pro · SECUENCIA DE RETORNOS (riesgo de orden): mismas medias, distinto orden →
              el % de éxito y la nube cambian. early-crash (crisis al jubilarte) = el peor caso. */}
          <Reveal delay={240}>
            <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 16, color: T.muted }}>¿Y si la crisis llega en el peor momento?</div>
              <div role="group" aria-label="Orden de los retornos" style={{ display: 'inline-flex', gap: 3, padding: 3, background: T.panel, borderRadius: 999, border: '1px solid ' + T.line, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { id: 'random', label: 'Aleatorio' },
                  { id: 'early-crash', label: 'Crisis al jubilarte' },
                  { id: 'late-crash', label: 'Crisis tardía' },
                ].map((o) => {
                  const active = seqMode === o.id;
                  return (
                    <button key={o.id} onClick={() => setSeqMode(o.id)} aria-pressed={active}
                      style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', padding: '5px 13px', borderRadius: 999, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: active ? T.accent : 'transparent', color: active ? T.bg : T.muted, transition: 'background .15s ease, color .15s ease', appearance: 'none', WebkitAppearance: 'none' }}>{o.label}</button>
                  );
                })}
              </div>
              {/* MC avanzado · COLAS GRUESAS (Student-t): crisis extremas más probables que la normal (aditivo, motor). */}
              <div role="group" aria-label="Modelo de retornos" style={{ display: 'inline-flex', gap: 3, padding: 3, background: T.panel, borderRadius: 999, border: '1px solid ' + T.line, marginTop: 4 }}>
                {[{ id: false, label: 'Normal' }, { id: true, label: 'Colas gruesas' }].map((o) => {
                  const active = fatTails === o.id;
                  return (
                    <button key={String(o.id)} onClick={() => setFatTails(o.id)} aria-pressed={active}
                      style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', padding: '5px 13px', borderRadius: 999, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: active ? T.accent : 'transparent', color: active ? T.bg : T.muted, transition: 'background .15s ease, color .15s ease', appearance: 'none', WebkitAppearance: 'none' }}>{o.label}</button>
                  );
                })}
              </div>
              {fatTails && <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.faint, maxWidth: 380, textAlign: 'center', lineHeight: 1.4 }}>Las crisis profundas pesan más que en una campana normal (t-Student): la tasa de éxito baja y se vuelve más honesta.</div>}
            </div>
          </Reveal>
          {/* Si el plan falla · qué pasa EXACTAMENTE en la cola que se agota (depletionAgeStats). */}
          <Reveal delay={270}>
            {depStats ? (
              <div style={{ marginTop: 22, padding: '16px 20px', border: '1px solid ' + T.line, borderRadius: 12, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', textAlign: 'left' }}>
                <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.amber, marginBottom: 8 }}>Si el plan falla</div>
                <div style={{ fontFamily: T.serif, fontSize: 17, color: T.ink, lineHeight: 1.5 }}>
                  En el <b>{100 - successPct} %</b> de futuros que no llegan, la cartera se suele agotar hacia los <b style={{ color: T.amber }}>{depStats.median}</b> — entre los {depStats.p25} y los {depStats.p75}. {seqMode === 'early-crash' ? 'Una crisis nada más jubilarte adelanta el agotamiento: ese es el riesgo de secuencia.' : seqMode === 'late-crash' ? 'Si la crisis llega tarde, ya has acumulado colchón y aguanta más.' : 'Una caída en los primeros años de retiro es lo que más adelanta el agotamiento.'}
                </div>
              </div>
            ) : (
              <p style={note}>{successPct >= 100 ? `Ningún futuro simulado se queda sin dinero antes de los ${lifeExpectancy}: margen sólido incluso en las peores secuencias.` : `En el ${100 - successPct} % de simulaciones la cartera se agota antes de los ${lifeExpectancy} — el riesgo de secuencia de retornos que la línea recta ignora.`}</p>
            )}
          </Reveal>
        </Spread>

        {/* 7 · DCA · ¿de golpe o poco a poco? Junto al Monte Carlo: ambos van de riesgo de entrada/timing. */}
        <Spread>
          <Reveal><SectionTag>¿De golpe o poco a poco?</SectionTag></Reveal>
          <Reveal delay={40}><p style={cap}>Si te cae una cantidad de una vez —una herencia, un bonus, unos ahorros parados—, ¿la inviertes toda hoy o la repartes en el tiempo?</p></Reveal>
          <Reveal delay={80} style={{ width: '100%' }}><div style={{ marginTop: 24 }}><DcaCard annualReturn={annualReturn} /></div></Reveal>
        </Spread>

        {/* 8 · DIAGNÓSTICO · síntesis de salud del plan en cinco señales (Pro · Diagnóstico FIRE).
            Sin score ni nota (sin gamificación): plain rows + color semántico (verde sólido / ámbar
            atención). Lee derivaciones ya existentes (d.verdict, successPct, savingsPct, allocation). */}
        <Spread>
          <Reveal><SectionTag>Diagnóstico</SectionTag></Reveal>
          <Reveal delay={40}><p style={cap}>Tu plan, leído en cinco señales. Verde, sólido; ámbar, para mirar con calma.</p></Reveal>
          <Reveal delay={70} style={{ width: '100%' }}>
            <div style={{ maxWidth: 560, margin: '28px auto 0', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              {[
                (() => {
                  const col = VERDICT_COLOR[d.verdict] || T.muted;
                  const val = d.verdict === 'adelantado' ? 'Vas por delante de tu plan'
                    : d.verdict === 'en-linea' ? 'Vas en línea con tu plan'
                    : d.verdict === 'atrasado' ? 'Vas algo por detrás del plan'
                    : d.verdict === 'no-llega' ? 'Con este ritmo, tu número no llega'
                    : 'Faltan datos para juzgarlo';
                  return { k: 'Suficiencia', col, val };
                })(),
                (() => {
                  const ok = savingsPct >= 20, mid = savingsPct >= 10;
                  return { k: 'Ritmo de ahorro', col: ok ? T.green : T.amber, val: `${fmtPctView(savingsPct)} % de tu ingreso${ok ? ' · sólido' : mid ? ' · mejorable' : ' · bajo'}` };
                })(),
                { k: 'Robustez', col: successPct >= 90 ? T.green : T.amber, val: `${successPct} % de los futuros aguantan · ${zona}` },
                (() => {
                  const age = d.verdictAge != null ? Math.ceil(d.verdictAge) : null;
                  const yrs = age != null ? age - currentAge : null;
                  return { k: 'Horizonte', col: T.muted, val: age != null ? `Libre a los ${age} · en ${yrs} ${yrs === 1 ? 'año' : 'años'}` : 'Aún no se alcanza en el horizonte' };
                })(),
                (() => {
                  const a = plan.actualLife && plan.actualLife.allocation;
                  if (!a) return { k: 'Diversificación', col: T.muted, val: 'Sin declarar — hazlo en Datos' };
                  const rv = Math.round((a.fundsEtfs || 0) + (a.pensionPlan || 0));
                  return { k: 'Diversificación', col: rv >= 50 ? T.green : T.amber, val: `${rv} % en fondos/planes${rv >= 50 ? '' : ' · rebalancéalo en Datos'}` };
                })(),
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '14px 0', borderBottom: i < 4 ? '1px solid ' + T.lineSoft : 'none' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: row.col, flexShrink: 0, transform: 'translateY(-1px)' }} aria-hidden="true" />
                  <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.faint, width: 124, flexShrink: 0 }}>{row.k}</span>
                  <span style={{ fontFamily: T.serif, fontSize: 17, color: T.ink, lineHeight: 1.4 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}><p style={note}>{d.verdictCopy}</p></Reveal>
        </Spread>

        {/* Rebalanceo · SIEMPRE visible al final de Proyección (la versión completa + aplicar vive en Plan, bajo la fase de Inversión). Se autocculta si no hay allocation declarada. */}
        <div style={{ padding: '8px 0 8px' }}><RebalanceCard compact /></div>

        {/* 9 · CIERRE · ir a Mes a mes */}
        <Spread short style={{ minHeight: '60vh' }}>
          <Reveal><SectionTag>Hasta aquí, el plan</SectionTag></Reveal>
          <Reveal delay={50}><h2 style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 'clamp(34px, 6.5vw, 80px)', lineHeight: 0.98, letterSpacing: '-.03em', margin: '8px 0 0', color: T.ink }}>Ahora, mes a mes.</h2></Reveal>
          <Reveal delay={110}><p style={cap}>La proyección dibuja el destino. El seguimiento lo vuelve avance real: registra cada mes y compáralo con el plan.</p></Reveal>
          <Reveal delay={170}><CartelBtn onClick={() => update({ activeTab: 'seguimiento' })} style={{ marginTop: 20 }}>Ir a Mes a mes →</CartelBtn></Reveal>
        </Spread>

      </div>
      <GastoSheet open={gastoSheetOpen} onClose={() => setGastoSheetOpen(false)} initial={plan.actualLife && plan.actualLife.expenses} onSave={saveExpenses} />
    </div>
  );
}

export function HitosEditor() {
  const { state, addGoal, updateGoal, removeGoal } = useStore();
  const d = useDerived();
  const { profile, plan, goals } = state;
  const [newGoal, setNewGoal] = useState({ name: '', target: 10000, targetAge: profile.age + 5, category: 'otro' });
  // Bento · el formulario de alta vive tras disclosure (P3). Formulario intacto.
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <SectionTag>Hitos</SectionTag>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 4, lineHeight: T.lh.normal }}>
          Metas intermedias en tu camino. Define el importe en euros de 2026 (poder adquisitivo actual); Mi Plan FIRE ajusta por <Concept id="inflacion">inflación</Concept> hasta la fecha objetivo.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {goals.length === 0 ? (
          <Card style={{ borderStyle: 'dashed', padding: 24 }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal }}>
              Aún no has añadido ningún hito a tu plan. Los hitos son metas intermedias (un colchón de liquidez, comprar una vivienda, pagar la entrada, etc.) que te ayudan a estructurar tu camino. Añade el primero cuando quieras.
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'start' }}>
            {goals.map((g) => (
              <GoalRow key={g.id} goal={g} d={d} profile={profile} plan={plan}
                onChange={(p) => updateGoal(g.id, p)} onRemove={() => removeGoal(g.id)} />
            ))}
          </div>
        )}
        {/* Añadir una meta · tras disclosure (P3). Formulario intacto. */}
        {!showAdd ? (
          <div>
            <CartelBtn variant="text" onClick={() => setShowAdd(true)}>+ Añadir una meta</CartelBtn>
          </div>
        ) : (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 8 }}>
              <CartelLabel>Añadir una meta</CartelLabel>
              <button onClick={() => setShowAdd(false)} title="Cerrar"
                style={{ fontFamily: T.mono, fontSize: T.size.body, color: T.faint, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="Ej. coche eléctrico"
                style={{ fontFamily: T.serif, fontSize: T.size.lead, padding: '10px 12px', background: T.bg, border: '1px solid ' + T.line, borderRadius: 8, outline: 'none', color: T.ink }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <Label>Importe</Label>
                <EditableNumber value={newGoal.target} onChange={(v) => setNewGoal({ ...newGoal, target: v })} min={100} max={10_000_000} width={120} />
                <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', color: T.muted }}>€</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <Label>A los</Label>
                <EditableNumber value={newGoal.targetAge} onChange={(v) => setNewGoal({ ...newGoal, targetAge: v })} min={profile.age + 1} max={90} width={70} />
                <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', color: T.muted }}>años</span>
              </div>
              <div>
                <Label style={{ marginBottom: 6 }}>Categoría</Label>
                <select value={newGoal.category} onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  style={{ width: '100%', fontFamily: T.serif, fontSize: T.size.body, padding: '8px 10px', background: T.bg, border: '1px solid ' + T.line, borderRadius: 8, outline: 'none', color: T.ink, appearance: 'none', WebkitAppearance: 'none' }}>
                  {GOAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <Btn variant="accent" size="sm" onClick={() => {
                if (!newGoal.name.trim()) return;
                addGoal(newGoal);
                setNewGoal({ name: '', target: 10000, targetAge: profile.age + 5, category: 'otro' });
                setShowAdd(false);
              }}>Añadir meta</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export function ScreenSeguimiento() {
  const d = useDerived();
  const { state, update } = useStore();
  const mobile = useIsMobile();

  // Media real · promedio de los meses con aporte real registrado (stat de cabecera).
  const filledMonths = (state.months || []).filter(m => m.actual != null);
  const avgActual = filledMonths.length
    ? Math.round(filledMonths.reduce((s, m) => s + m.actual, 0) / filledMonths.length)
    : null;

  // Siguiente paso · fuente ÚNICA: d.verdict (ageAtFiReal vs ageAtFiPlan). Lógica intacta;
  // solo se reubica arriba, junto a "Tu mes" (patrón bento · estado arriba, doctrina §6 1.12).
  const verdictNode = (() => {
    const v = d.verdict;
    const noMeses = !(d.filledMonths && d.filledMonths.length);
    let frase, label, onClick;
    if (noMeses || v === 'sin-datos') {
      frase = 'Aún no registras meses. Anota el primero para comparar realidad y plan.';
      label = 'Registrar un mes →';
      onClick = () => document.getElementById('seg-mensual')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (v === 'atrasado' || v === 'no-llega') {
      frase = `${d.verdictCopy} Sube tu aporte o baja tu objetivo en Proyección.`;
      label = 'Ir a Proyección →';
      onClick = () => update({ activeTab: 'proy' });
    } else {
      frase = `${d.verdictCopy} Mira cuánto adelanta tu fecha de libertad.`;
      label = 'Ir a Proyección →';
      onClick = () => update({ activeTab: 'proy' });
    }
    return <NextStep tone={VERDICT_NEXTSTEP_TONE[v]} body={frase} action={{ label, onClick }} />;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 30 : 36, paddingBottom: 40 }}>
      {/* Cabecera · título + stat de media real a la derecha (bento) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <SectionTag>Seguimiento</SectionTag>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, letterSpacing: T.tracking.display, marginTop: 4 }}>
            Cómo va tu plan, mes a mes.
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 8, maxWidth: 640, lineHeight: T.lh.normal }}>
            Registra cada mes lo que has aportado de verdad, sigue el avance de tus hitos y revisa cómo se reparte tu ingreso a lo largo del tiempo.
          </div>
        </div>
        {avgActual != null && (
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.faint }}>
              Media real · {readableMonth(todayKey())}
            </div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, marginTop: 2, lineHeight: T.lh.tight }}>
              {fmtEur(avgActual)}<span style={{ fontSize: T.size.body, color: T.muted, fontFamily: T.display, fontWeight: 600 }}>/mes</span>
            </div>
          </div>
        )}
      </div>

      {/* Bento · fila 1: Tu mes  |  Siguiente paso (veredicto reubicado arriba) */}
      <Reveal><div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        <MonthlyFlowBlock />
        <div>{verdictNode}</div>
      </div></Reveal>

      {/* Bloque · Mensual (registro mes a mes + stats + gráfico tras disclosure + calendario) */}
      <Reveal><section id="seg-mensual" style={{ scrollMarginTop: 16 }}>
        <ScreenMesAMes />
      </section></Reveal>

      {/* Bloque · Hitos (metas editables + "añadir" tras disclosure) */}
      <Reveal><section>
        <Card>
          <HitosEditor />
        </Card>
      </section></Reveal>

      {/* Bloque · Reparto del ingreso en el tiempo */}
      <Reveal><section>
        <RepartoIngresoBlock />
      </section></Reveal>
    </div>
  );
}

export function RepartoIngresoBlock() {
  const { state } = useStore();
  return <FlowTimelineCard plan={state.plan} profile={state.profile} />;
}

export function MonthlyFlowBlock() {
  const { state } = useStore();
  return <MonthlyFlowCard plan={state.plan} profile={state.profile} />;
}

export function GoalRow({ goal, d, profile, plan, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const tg = useMemo(() => {
    const series = d.seriesPlan || [];
    for (let i = 0; i < series.length; i++) {
      if (series[i].portfolio >= goal.target) return { age: series[i].age, months: i };
    }
    return null;
  }, [d.seriesPlan, goal.target]);
  const onTrack = tg && tg.age <= goal.targetAge;
  const progress = Math.min(100, d.currentPortfolio / goal.target * 100);
  const faltan = Math.max(0, goal.target - d.currentPortfolio);
  const category = goal.category || 'otro';

  // ── Vista · anillo de progreso (clic en la tarjeta para editar) ───────────
  if (!editing) {
    const RAD = 34, CIRC = 2 * Math.PI * RAD, dash = CIRC * progress / 100;
    const col = onTrack ? T.green : T.amber;
    return (
      <Card>
        <div onClick={() => setEditing(true)} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditing(true); }}
          style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <svg viewBox="0 0 86 86" width="86" height="86" style={{ marginBottom: 8 }} aria-hidden="true">
            <circle cx="43" cy="43" r={RAD} fill="none" stroke={T.lineSoft} strokeWidth="7" />
            <circle cx="43" cy="43" r={RAD} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${dash.toFixed(1)} ${CIRC.toFixed(1)}`} transform="rotate(-90 43 43)" />
            <text x="43" y="48" textAnchor="middle" fontFamily={T.display} fontWeight="600" fontSize="22" fill={T.ink}>
              {Math.round(progress)}<tspan fontSize="12" fill={T.muted}>%</tspan>
            </text>
          </svg>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.lead, letterSpacing: T.tracking.tight, lineHeight: 1.15, color: T.ink }}>{goal.name}</div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, color: T.muted, marginTop: 2 }}>{fmtEur(goal.target)} · {goal.targetAge} años</div>
          <Pill color={onTrack ? T.green : T.amber} bg={onTrack ? T.greenSoft : 'rgba(180,83,9,0.10)'} border="transparent" style={{ fontSize: T.size.eyebrow, padding: '4px 10px', marginTop: 10 }}>
            {onTrack ? 'En camino' : 'Falta'} · faltan {fmtEur(faltan)}
          </Pill>
        </div>
      </Card>
    );
  }

  // ── Edición · campos editables (la función no se pierde, solo se pliega) ───
  return (
    <Card>
      <button onClick={onRemove} title="Eliminar meta"
        style={{ position: 'absolute', top: 10, right: 12, fontFamily: T.mono, fontSize: T.size.body, color: T.faint, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', lineHeight: 1, borderRadius: 4 }}>×</button>
      <input value={goal.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Nombre de la meta"
        style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, background: 'transparent', border: 'none', outline: 'none', color: T.ink, padding: 0, width: '100%', minWidth: 0, marginBottom: 10, paddingRight: 24 }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.accent }}>
          <EditableNumber value={goal.target} onChange={(v) => onChange({ target: v })} min={100} max={10_000_000} width={100} color={T.accent} />€
        </span>
        <span style={{ fontFamily: T.serif, color: T.muted }}>a los <EditableNumber value={goal.targetAge} onChange={(v) => onChange({ targetAge: v })} min={profile.age + 1} max={90} width={36} color={T.ink} /> años</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.faint, letterSpacing: 0 }}>Categoría</span>
        <select value={category} onChange={(e) => onChange({ category: e.target.value })}
          style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '4px 8px', background: T.bg, border: '1px solid ' + T.line, borderRadius: 999, color: T.ink, letterSpacing: T.tracking.wide, appearance: 'none', WebkitAppearance: 'none' }}>
          {GOAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <GoalContextualBlock goal={goal} category={category} portfolio={d.currentPortfolio} />
      <div style={{ marginTop: 16 }}>
        <Btn variant="ghost" size="sm" onClick={() => setEditing(false)}>Hecho</Btn>
      </div>
    </Card>
  );
}

export function GoalContextualBlock({ goal, category, portfolio }) {
  const [open, setOpen] = useState(false);
  const target = goal.target || 0;
  const ratio = portfolio > 0 ? target / portfolio : 0;
  const goLearn = (id) => { window.__openLearnConcept && window.__openLearnConcept(id); };

  // Decide which block applies.
  let blockKind = null;
  if (category === 'liquidez') blockKind = 'liquidez';
  else if ((category === 'vivienda') && ratio > 0.30) blockKind = 'pignoracion';
  else if ((category === 'coche' || category === 'objetoGrande') && ratio > 0.20) blockKind = 'pignoracion';
  else if (category === 'ayudaFamiliar' && ratio > 0.10) blockKind = 'fiscal-familiar';
  else if (category === 'herencia') blockKind = 'lump-sum';
  else if (category === 'jubilacion') blockKind = 'jubilacion-nota';

  if (!blockKind) return null;

  const titles = {
    'liquidez': 'Dónde mantener este dinero',
    'pignoracion': 'Considera pignoración antes de descapitalizar',
    'fiscal-familiar': 'Planificación fiscal de ayudas familiares',
    'lump-sum': 'Lump sum vs DCA al integrar una herencia',
    'jubilacion-nota': 'Nota sobre la jubilación pública',
  };
  const bodies = {
    'liquidez': 'Para no perder valor por inflación, considera mantener este dinero en cuenta remunerada o en renta fija de corto plazo (letras del Tesoro, bonos a 1-2 años). No en cuenta corriente sin remunerar.',
    'pignoracion': null, // se renderiza con texto + link
    'fiscal-familiar': 'Las ayudas económicas a familiares directos (padres, hijos, cónyuge) pueden estar afectadas por el régimen de donaciones intervivos y, llegado el momento, por el impuesto de sucesiones. La fiscalidad depende de la comunidad autónoma y de la relación con el receptor. Antes de mover cantidades grandes, vale la pena consultar con un asesor.',
    'lump-sum': 'Recibir una cantidad grande de golpe no implica invertirla de golpe. Considera DCA durante 6-18 meses para suavizar el efecto del momento de mercado. Mientras esa parte espera para entrar, mantenla en cuenta remunerada o renta fija a corto plazo.',
    'jubilacion-nota': 'La jubilación pública no es un hito en el sentido habitual; está incorporada en tu plan automáticamente según la edad legal de jubilación. Para ajustar la pensión esperada usa Datos → Pensión pública.',
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed ' + T.lineSoft }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0,
        color: T.accent, display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        {open ? '↑ Recoger' : '▾ Ver nota contextual'}
      </button>
      {open && (
        <div style={{ marginTop: 12, padding: '14px 16px', background: T.panel, border: '1px solid ' + T.line, borderRadius: 10 }}>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.lead, color: T.ink, letterSpacing: T.tracking.tight, marginBottom: 8 }}>
            {titles[blockKind]}
          </div>
          {blockKind === 'pignoracion' ? (
            <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.relaxed }}>
              <p style={{ margin: 0 }}>Si vendes una parte grande de tu cartera para pagar este hito, rompes el efecto del interés compuesto sobre lo vendido y tributas IRPF por las plusvalías realizadas.</p>
              <p style={{ marginTop: 10 }}>Una alternativa: pignorar parte de tu cartera como garantía de un préstamo. Mantienes los activos (siguen creciendo) y devuelves el préstamo poco a poco con tipos típicamente bajos.</p>
              <p style={{ marginTop: 10 }}>No es gratis ni inocua: tiene tipo de interés (Euríbor + 1-2 puntos habitualmente), riesgo de margin call en caídas grandes, y solo funciona si el rendimiento esperado de tu cartera supera con margen el coste del préstamo.</p>
              <div style={{ marginTop: 12 }}>
                <button onClick={() => goLearn('pignoracion')} style={{
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, color: T.accent,
                }}>
                  → Lee "Pignoración de activos: cuándo tiene sentido y cuándo no"
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.relaxed }}>
              {bodies[blockKind]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PublicPensionCard({ plan, updatePlan, profile }) {
  const pen = plan.publicPension || { enabled: false, startAge: 67, monthlyAmount: 0, yearsContributed: 0, autoEstimate: true };
  const enabled = !!pen.enabled;
  const autoEstimate = !!pen.autoEstimate;
  const yearsContributed = pen.yearsContributed != null ? pen.yearsContributed : 0;
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Auto-estimate uses current monthly income as proxy for average cotization base.
  const currentMonthlyBase = useMemo(() => computeIncomeFor(plan, todayKey()), [plan]);
  const autoResult = useMemo(() => estimateSpanishPension({
    avgMonthlyBase: currentMonthlyBase,
    yearsContributed,
  }), [currentMonthlyBase, yearsContributed]);

  // Effective monthly amount to use
  const effectiveMonthly = autoEstimate ? autoResult.monthly14 : (pen.monthlyAmount || 0);

  // Whenever auto changes, sync the stored amount so other parts of the app stay coherent
  useEffect(() => {
    if (enabled && autoEstimate && pen.monthlyAmount !== autoResult.monthly14) {
      updatePlan({
        publicPension: { ...pen, monthlyAmount: autoResult.monthly14 },
      });
    }
  }, [enabled, autoEstimate, autoResult.monthly14]);

  const updatePen = (patch) => updatePlan({ publicPension: { ...pen, ...patch } });

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SectionTag>Pensión pública española</SectionTag>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 4, lineHeight: T.lh.normal }}>
            La Seguridad Social complementa lo que retiras de tu cartera desde la edad de jubilación. No baja tu número —ese es el capital que necesitas por tu cuenta—, pero hace que tu dinero dure más. Lo verás en ¿Y te dura?
          </div>
        </div>
        <button onClick={() => {
            if (enabled) {
              updatePen({ enabled: false });
            } else {
              setShowDisclaimer(true);
            }
          }}
          style={{
            fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '8px 14px', borderRadius: 999,
            background: enabled ? T.green : 'transparent',
            color: enabled ? '#fff' : T.muted,
            border: '1px solid ' + (enabled ? T.green : T.line),
            cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase', fontWeight: 600,
          }}>{enabled ? '✓ Activa' : 'Activar'}</button>
      </div>

      {enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          <Row label="Edad de inicio">
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
              <EditableNumber value={pen.startAge || 67} onChange={(v) => updatePen({ startAge: v })} min={60} max={75} step={1} color={T.ink} /> años
            </span>
          </Row>
          <Row label="Años cotizados al jubilarte">
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
              <EditableNumber value={yearsContributed} onChange={(v) => updatePen({ yearsContributed: v })} min={0} max={50} step={1} color={T.ink} /> años
            </span>
          </Row>

          {/* Auto vs manual toggle */}
          <div style={{ display: 'flex', gap: 0, padding: 2, background: T.panel, borderRadius: 999, border: '1px solid ' + T.line, alignSelf: 'flex-start' }}>
            {[
              { id: 'auto', l: 'Auto-estimar' },
              { id: 'manual', l: 'Cifra manual' },
            ].map((opt) => {
              const isActive = (opt.id === 'auto') === autoEstimate;
              return (
                <button key={opt.id} onClick={() => updatePen({ autoEstimate: opt.id === 'auto' })}
                  style={{
                    fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '7px 14px',
                    background: isActive ? T.ink : 'transparent',
                    color: isActive ? T.bg : T.muted,
                    border: 'none', borderRadius: 999, cursor: 'pointer',
                    letterSpacing: T.tracking.wider, textTransform: 'uppercase', fontWeight: 600,
                  }}>{opt.l}</button>
              );
            })}
          </div>

          {autoEstimate ? (
            <div style={{ padding: 14, background: T.panel, border: '1px solid ' + T.line, borderRadius: 10 }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.muted, marginBottom: 6 }}>
                Estimación según reglas 2026
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, color: T.ink, letterSpacing: T.tracking.tight }}>
                  {fmtEur(autoResult.monthly14)}
                </span>
                <span style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.body }}>/mes · 14 pagas</span>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 6, letterSpacing: T.tracking.wide }}>
                {fmtEur(autoResult.annual)} / año · {(autoResult.percentage * 100).toFixed(1)}% de tu base reguladora
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.muted, marginTop: 10, lineHeight: T.lh.normal }}>
                Base estimada con tu ingreso actual ({fmtEur(currentMonthlyBase)}/mes). Reglas: 50% con 15 años → 100% con 36,5 años. Tope máximo {fmtEur(3359.6)}/mes (2026).
                {autoResult.cappedMax && <strong style={{ color: T.amber, fontStyle: 'normal' }}> Tope máximo aplicado.</strong>}
                {autoResult.cappedMin && <strong style={{ color: T.amber, fontStyle: 'normal' }}> Mínimo legal aplicado.</strong>}
                {autoResult.percentage === 0 && yearsContributed > 0 && <strong style={{ color: T.red, fontStyle: 'normal' }}> Sin derecho · necesitas mínimo 15 años cotizados.</strong>}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 10, letterSpacing: T.tracking.wide, paddingTop: 10, borderTop: '1px dashed ' + T.lineSoft }}>
                ⚠ Aproximación. Para la cifra real consulta el simulador oficial de la Seguridad Social.
              </div>
            </div>
          ) : (
            <Row label="Pensión mensual (14 pagas)">
              <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
                <EditableNumber value={pen.monthlyAmount || 0} onChange={(v) => updatePen({ monthlyAmount: v })} min={0} max={5000} step={50} color={T.ink} /> €
              </span>
            </Row>
          )}
        </div>
      )}
      <PublicPensionDisclaimerModal
        open={showDisclaimer}
        onCancel={() => setShowDisclaimer(false)}
        onConfirm={() => { setShowDisclaimer(false); updatePen({ enabled: true }); }}
      />
    </Card>
  );
}

// Comparador de escenarios · resumen por cuenta/persona con la MISMA fórmula que useDerived
// (fiTarget = gasto·12/wdr; cruce FIRE deflactando cada punto a € de hoy; patrimonio a la
// jubilación en nominal) → no contradice al resto de la app. Pura: recibe el state de una
// cuenta. Cero red. Tolerante a cuentas sin datos (resumen vacío → "—").
function scenarioSummary(st) {
  const profile = (st && st.profile) || {};
  const plan = (st && st.plan) || {};
  let edadLibertad = null, patrimonioFinal = 0, aporte = 0, ahorroPct = 0;
  try {
    const tk = todayKey();
    const income = computeIncomeFor(plan, tk);
    const investment = computePlannedFor(plan, tk);
    const al = plan.actualLife;
    const monthlyLife = (al && al.completed) ? sumExpenses(al) : Math.max(0, income - investment);
    const wdr = (plan.withdrawalRate != null ? plan.withdrawalRate : 4.0) / 100;
    const fiTarget = wdr > 0 ? monthlyLife * 12 / wdr : 0;
    const effectiveReturn = computeEffectiveCapitalReturn(plan);
    const series = projectV2(plan, profile, { capital: plan.capital || 0, endAge: 90, includeHypothetical: false, effectiveReturn }) || [];
    if (fiTarget > 0) {
      for (let i = 0; i < series.length; i++) {
        const real = toRealEur(series[i].portfolio || 0, (series[i].age - (profile.age || 0)) * 12, plan.inflationRate);
        if (real >= fiTarget) { edadLibertad = Math.ceil(series[i].age); break; }
      }
    }
    const retire = profile.retireAge != null ? profile.retireAge : 65;
    const atRetire = series.find((r) => r.age >= retire) || series[series.length - 1];
    patrimonioFinal = atRetire ? (atRetire.portfolio || 0) : 0;
    aporte = Math.round(currentMonthlyAporte(plan) || 0);
    ahorroPct = income > 0 ? Math.round((investment / income) * 100) : 0;
  } catch (e) { /* cuenta sin datos suficientes → resumen vacío */ }
  return { edadLibertad, patrimonioFinal, aporte, ahorroPct };
}

export function AccountsCard() {
  const { accounts, activeAccountId, switchAccount, createAccount, renameAccount, deleteAccount } = useStore();
  const [renaming, setRenaming] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const list = Object.values(accounts || {});
  const hasMultiple = list.length > 1;
  // Resumen comparativo por persona (memoizado; recalcula al cambiar las cuentas).
  const compareRows = useMemo(() => hasMultiple ? list.map((a) => ({ id: a.id, label: a.label, s: scenarioSummary(a.state) })) : [], [accounts, hasMultiple]);

  const beginRename = (a) => { setRenaming(a.id); setDraftLabel(a.label); };
  const commitRename = () => {
    if (renaming && draftLabel.trim()) renameAccount(renaming, draftLabel.trim());
    setRenaming(null);
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SectionTag>Personas en este dispositivo</SectionTag>
          <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic', marginTop: 4, lineHeight: T.lh.normal }}>
            Cada persona tiene su propio plan aislado. Para tu pareja, hijo, o un escenario alternativo.
          </div>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => createAccount('Nueva persona')}>+ Persona</Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((a) => {
          const isActive = a.id === activeAccountId;
          const isRenamingThis = renaming === a.id;
          return (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              background: isActive ? T.accentSoft : T.paper,
              border: '1px solid ' + (isActive ? T.accent : T.line),
              borderRadius: 10,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: 999, flexShrink: 0,
                background: isActive ? T.accent : 'transparent',
                border: '1.5px solid ' + (isActive ? T.accent : T.line),
              }} />
              {isRenamingThis ? (
                <input
                  autoFocus
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setDraftLabel(a.label); setRenaming(null); } }}
                  style={{
                    flex: 1, fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, padding: '4px 6px',
                    border: '1px solid ' + T.accent, borderRadius: 6, background: T.bg, color: T.ink, outline: 'none', minWidth: 0,
                  }}
                />
              ) : (
                <button onClick={() => switchAccount(a.id)} style={{
                  flex: 1, textAlign: 'left', fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle,
                  background: 'transparent', border: 'none', color: T.ink, cursor: 'pointer',
                  padding: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  letterSpacing: T.tracking.tight,
                }}>
                  {a.label}
                  {isActive && <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.accent, marginLeft: 8, letterSpacing: 0 }}>activa</span>}
                </button>
              )}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => isRenamingThis ? commitRename() : beginRename(a)} style={{
                  fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '6px 10px', borderRadius: 999,
                  background: 'transparent', color: T.muted, border: '1px solid ' + T.line,
                  cursor: 'pointer', letterSpacing: T.tracking.wide, textTransform: 'uppercase',
                }}>{isRenamingThis ? 'OK' : 'Renombrar'}</button>
                {hasMultiple && (
                  <button onClick={() => deleteAccount(a.id)} style={{
                    fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '6px 10px', borderRadius: 999,
                    background: 'transparent', color: T.red, border: '1px solid ' + T.red,
                    cursor: 'pointer', letterSpacing: T.tracking.wide, textTransform: 'uppercase',
                  }}>Borrar</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparador de escenarios · solo con 2+ personas. Edad de libertad (★) + patrimonio a la
          jubilación de cada una, con su propio plan. Cifras con la misma fórmula que el resto. */}
      {hasMultiple && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed ' + T.line }}>
          <Label style={{ marginBottom: 10 }}>Comparar escenarios</Label>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {compareRows.map((r) => {
              const active = r.id === activeAccountId;
              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 12, alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid ' + T.lineSoft }}>
                  <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.body, color: active ? T.accent : T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: T.tracking.tight }}>{r.label}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11, color: T.faint }}>libre a los</div>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: r.s.edadLibertad != null ? T.green : T.faint, letterSpacing: T.tracking.tight }}>{r.s.edadLibertad != null ? '★ ' + r.s.edadLibertad : '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 11, color: T.faint }}>patrimonio</div>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight }}>{fmtEur(r.s.patrimonioFinal)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.muted, marginTop: 10, lineHeight: T.lh.normal }}>
            Edad de libertad y patrimonio a la jubilación de cada persona, con su propio plan. Cambia cualquiera en su pestaña y la diferencia se ve aquí.
          </div>
        </div>
      )}
    </Card>
  );
}

// Rebalanceo · compara la cartera declarada (allocation) con la recomendable por horizonte
// (computeRebalance, lib) y sugiere el movimiento en €. Solo se muestra si hay allocation
// declarada (actualLife.completed). Color por tokens (verde=alineado, ámbar=desviado).
export function RebalanceCard({ compact = false }) {
  const { state, updatePlan } = useStore();
  const d = useDerived();
  const [confirming, setConfirming] = useState(false);
  const { plan, profile } = state;
  const reb = computeRebalance(plan, profile, d.currentPortfolio || 0);
  if (!reb) return null;
  const { currentRV, targetRV, gap, aligned, moveEur, cashPct, horizonYears, byClass, target } = reb;
  const col = aligned ? T.green : T.amber;

  // Aplicar lo recomendado: fija la allocation al objetivo (reversible editando a mano). Confirmación
  // en DOS pasos (sin native confirm, bloqueado en iframes). No toca el aporte mensual.
  const applyTarget = () => {
    const cur = (plan.actualLife && plan.actualLife.allocation) || {};
    updatePlan({ actualLife: { ...(plan.actualLife || {}), allocation: { ...cur, ...target } } });
    setConfirming(false);
  };

  const msg = aligned
    ? <>Tu cartera está <strong style={{ fontStyle: 'normal', color: T.green }}>alineada</strong> con tu horizonte. Revísala una vez al año.</>
    : gap > 0
      ? <>Vas <strong style={{ fontStyle: 'normal', color: T.amber }}>demasiado conservador</strong>: {cashPct} % en efectivo y depósitos. Mueve unos <strong style={{ fontStyle: 'normal' }}>{fmtEur(moveEur)}</strong> a fondos para acercarte al {targetRV} %.</>
      : <>Vas <strong style={{ fontStyle: 'normal', color: T.amber }}>algo cargado de riesgo</strong> para tu horizonte. Mueve unos <strong style={{ fontStyle: 'normal' }}>{fmtEur(moveEur)}</strong> de fondos a algo más estable.</>;

  // ── COMPACT (Proyección, junto al Diagnóstico): bloque centrado sin Card. ──
  if (compact) {
    return (
      <Reveal delay={150}>
        <div style={{ maxWidth: 480, margin: '26px auto 0', textAlign: 'center' }}>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: col, marginBottom: 8 }}>Rebalanceo · {currentRV} % → {targetRV} % en renta variable</div>
          <div style={{ fontFamily: T.serif, fontSize: 17, color: T.ink, lineHeight: 1.5 }}>{msg}</div>
          {!aligned && <div style={{ marginTop: 10, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.faint }}>Ajústalo (o aplícalo de un toque) en Datos → Rebalanceo.</div>}
        </div>
      </Reveal>
    );
  }

  // ── FULL (Datos): titular + barra + mensaje + detalle por clase + aplicar. ──
  return (
    <Reveal><Card>
      <SectionTag style={{ marginBottom: 6 }}>Rebalanceo</SectionTag>
      <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic', lineHeight: T.lh.normal, marginBottom: 16 }}>
        Tu cartera frente a lo recomendable para tu horizonte ({horizonYears} años hasta la jubilación).
      </div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <Label>En renta variable</Label>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, color: col, letterSpacing: T.tracking.tight, lineHeight: 1 }}>{currentRV} %</div>
        </div>
        <div>
          <Label>Recomendable</Label>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, color: T.ink, letterSpacing: T.tracking.tight, lineHeight: 1 }}>~{targetRV} %</div>
        </div>
      </div>
      <div style={{ height: 10, marginTop: 16, background: T.panel, borderRadius: 999, border: '1px solid ' + T.lineSoft, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: Math.min(100, Math.max(0, currentRV)) + '%', background: col, borderRadius: 999 }} />
        <div style={{ position: 'absolute', top: -3, bottom: -3, left: Math.min(100, Math.max(0, targetRV)) + '%', width: 2, background: T.ink }} aria-hidden="true" />
      </div>
      <div style={{ marginTop: 18, fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.normal }}>{msg}</div>

      {/* Detalle por clase · actual → objetivo + € a mover (+ comprar / − vender). */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid ' + T.lineSoft }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr auto', gap: 10, paddingBottom: 6, borderBottom: '1px solid ' + T.line }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.faint }}>Clase</span>
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.faint, textAlign: 'right' }}>Actual → objetivo</span>
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.faint, textAlign: 'right', minWidth: 78 }}>Mover</span>
        </div>
        {byClass.map((c) => (
          <div key={c.key} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr auto', gap: 10, alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid ' + T.lineSoft }}>
            <span style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink }}>{c.label}</span>
            <span style={{ fontFamily: T.mono, fontSize: T.size.caption, color: T.muted, textAlign: 'right' }}>{c.currentPct}% → {c.targetPct}%</span>
            <span style={{ fontFamily: T.mono, fontSize: T.size.caption, color: c.moveEur > 0 ? T.green : c.moveEur < 0 ? T.amber : T.faint, textAlign: 'right', minWidth: 78 }}>{c.moveEur === 0 ? '—' : (c.moveEur > 0 ? '+' : '−') + fmtEur(Math.abs(c.moveEur))}</span>
          </div>
        ))}
      </div>

      {/* Aplicar lo recomendado · confirmación en dos pasos. */}
      {!aligned && (
        <div style={{ marginTop: 16 }}>
          {confirming ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic' }}>¿Fijar tu asignación al objetivo recomendado?</span>
              <CartelBtn variant="text" onClick={applyTarget}>Sí, aplicar</CartelBtn>
              <CartelBtn variant="text" onClick={() => setConfirming(false)}>Cancelar</CartelBtn>
            </div>
          ) : (
            <CartelBtn onClick={() => setConfirming(true)}>Aplicar lo recomendado →</CartelBtn>
          )}
        </div>
      )}
      <div style={{ marginTop: 12, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.faint, lineHeight: T.lh.normal }}>
        Aplicar solo cambia el reparto de tu cartera, no tu aporte mensual. El rebalanceo se hace una vez al año, o cuando te desvías mucho.
      </div>
    </Card></Reveal>
  );
}

export function ScreenAjustes() {
  const { state, activePlan,
    resetAll, reonboard, seedDemoConfirm, updatePlan, update, updateProfile } = useStore();
  const mobile = useIsMobile();
  const [showEditLife, setShowEditLife] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <div>
        <SectionTag>Datos</SectionTag>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, letterSpacing: T.tracking.display, marginTop: 4 }}>
          Quién eres y dónde están tus cuentas.
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 8, maxWidth: 640, lineHeight: T.lh.normal }}>
          Datos personales y administrativos. Para ajustar tu plan (tramos, ahorro, eventos, asunciones), ve a Proyección. Para tus hitos, ve a Seguimiento.
        </div>
      </div>

      {/* PERFIL — v1.4.0c · BIG-A · podado: solo campos personales. Las 4 asunciones del modelo (retorno, inflación, tasa retiro, esperanza vida) se mueven a ScreenProyeccion → "Asunciones del modelo". */}
      <Reveal><Card pad={mobile ? 16 : 24}>
        <SectionTag style={{ marginBottom: 14 }}>Tu perfil</SectionTag>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, 1fr)', gap: 14 }}>
          <Row label="Nombre">
            <input value={state.profile.name || ''} onChange={(e) => updateProfile({ name: e.target.value })}
              style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, background: 'transparent', border: 'none', borderBottom: '1px dashed ' + T.line, outline: 'none', color: T.ink, width: 140, textAlign: 'right' }} />
          </Row>
          <Row label="Edad actual">
            <EditableNumber
              value={state.profile.age}
              onChange={(v) => {
                if (v >= state.profile.retireAge) {
                  updateProfile({ age: v, retireAge: v + 1 });
                } else {
                  updateProfile({ age: v });
                }
              }}
              min={16} max={80} color={T.ink} />
          </Row>
          <Row label="Edad de jubilación">
            <EditableNumber value={state.profile.retireAge} onChange={(v) => updateProfile({ retireAge: v })} min={state.profile.age + 1} max={90} color={T.ink} />
          </Row>
          <Row label="Capital inicial">
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
              <EditableNumber value={activePlan.capital || 0} onChange={(v) => updatePlan({ capital: v })} min={0} max={10_000_000} color={T.ink} /> €
            </span>
          </Row>
        </div>
      </Card></Reveal>

      {/* PENSIÓN PÚBLICA */}
      <Reveal><PublicPensionCard plan={activePlan} updatePlan={updatePlan} profile={state.profile} /></Reveal>

      {/* CUENTAS */}
      <Reveal><AccountsCard /></Reveal>

      {/* SITUACIÓN ECONÓMICA · re-editar gastos/hipoteca/asignación (antes solo en onboarding · FN1/CN1) */}
      <Reveal><Card>
        <SectionTag style={{ marginBottom: 14 }}>Tu situación económica</SectionTag>
        <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.muted, lineHeight: T.lh.normal, maxWidth: 640 }}>
          Tu gasto mensual, la hipoteca y cómo repartes tu capital entre cuentas. Alimenta «tu número» y el rendimiento de tu cartera.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <Btn variant="ghost" size="sm" onClick={() => setShowEditLife(true)}>Editar gastos y asignación →</Btn>
        </div>
      </Card></Reveal>

      {/* DATOS */}
      <Reveal><Card>
        <SectionTag style={{ marginBottom: 14 }}>Tus datos</SectionTag>
        <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.muted, lineHeight: T.lh.normal }}>
          Todo se guarda en tu dispositivo. Nada sale de aquí.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <Btn variant="ghost" size="sm" onClick={() => {
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'mi-plan.json'; a.click();
            URL.revokeObjectURL(url);
          }}>Exportar JSON</Btn>
          <Btn variant="ghost" size="sm" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = (e) => {
              const file = e.target.files[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  // FN7 · confirmación + preview antes de sobrescribir (importar no tenía red de seguridad).
                  const parsed = migrateToV2(JSON.parse(ev.target.result));
                  const st = parsed.profile ? parsed : (parsed.accounts && parsed.accounts[parsed.activeId || 'default'] && parsed.accounts[parsed.activeId || 'default'].state) || parsed;
                  const prof = (st && st.profile) || {};
                  const cap = st && st.plan && st.plan.capital != null ? st.plan.capital : null;
                  const ok = window.confirm('Vas a SUSTITUIR tus datos por el archivo importado:\n\n· Nombre: ' + (prof.name || '—') + '\n· Edad: ' + (prof.age != null ? prof.age : '—') + (cap != null ? '\n· Capital inicial: ' + cap + ' €' : '') + '\n\nEsto sobrescribe el plan actual. ¿Continuar?');
                  if (ok) update(parsed);
                }
                catch(err) { alert('JSON inválido'); }
              };
              reader.readAsText(file);
            };
            input.click();
          }}>Importar JSON</Btn>
          <Btn variant="ghost" size="sm" onClick={() => {
            // Importar meses (CSV) · fija el real aportado por mes (Pro). Confirmación antes de aplicar (FN7).
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.csv,text/csv,text/plain';
            input.onchange = (e) => {
              const file = e.target.files[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const rows = parseMonthsCSV(ev.target.result);
                if (!rows.length) { alert('No se reconoció ningún mes en el CSV.\n\nFormato por línea: fecha,importe\nEj.:  2026-01,500'); return; }
                const ok = window.confirm('Se han reconocido ' + rows.length + ' meses en el CSV.\n\nSe fijará el importe REAL aportado de cada uno (creando el mes si no existe). No borra los meses que no aparezcan. ¿Continuar?');
                if (!ok) return;
                update((s) => {
                  const byKey = {}; s.months.forEach((m) => { byKey[m.key] = m; });
                  rows.forEach(({ key, amount }) => {
                    if (byKey[key]) byKey[key] = { ...byKey[key], actual: amount };
                    else {
                      const [y, mo] = key.split('-').map(Number);
                      const dt = new Date(y, mo - 1, 1);
                      byKey[key] = { key, label: dt.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }), year: y, monthIndex: mo - 1, planned: computePlannedFor(s.plan, key), actual: amount, note: 'importado' };
                    }
                  });
                  const months = Object.values(byKey).sort((a, b) => (a.key > b.key ? 1 : -1));
                  return { ...s, months };
                });
              };
              reader.readAsText(file);
            };
            input.click();
          }}>Importar meses (CSV)</Btn>
          <Btn variant="ghost" size="sm" onClick={seedDemoConfirm}>Cargar datos demo</Btn>
          <Btn variant="ghost" size="sm" onClick={resetAll} style={{ color: T.red, borderColor: T.red }}>Borrar todo</Btn>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="ghost" size="sm" onClick={reonboard}>↻ Volver al onboarding</Btn>
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed ' + T.lineSoft, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          {/* B8 · Permanent access to LandingPreOnboarding in revisit mode. */}
          <button onClick={() => window.__openLanding && window.__openLanding()} style={{
            fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, background: 'transparent',
            border: 'none', cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase', padding: 0,
          }}>Ver presentación de Mi Plan FIRE →</button>
        </div>
      </Card></Reveal>

      {/* Editar situación económica · reusa ActualLifeOnboarding (prefilla de plan.actualLife);
          mismo patrón que ScreenSinMiPlan. No cambia el shape persistido. */}
      {showEditLife && (
        <ActualLifeOnboarding
          onClose={() => setShowEditLife(false)}
          onComplete={(payload) => { updatePlan({ actualLife: payload }); setShowEditLife(false); }}
        />
      )}
    </div>
  );
}

export function ExpenseRow({ k, label, chips, expenses, onSetExpense }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed ' + T.lineSoft, paddingBottom: 10, marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 110 }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>{label}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {chips.map((v) => (
            <button key={v} onClick={() => onSetExpense(k, v)} style={{
              fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '4px 9px',
              background: expenses[k] === v ? T.ink : 'transparent',
              color: expenses[k] === v ? T.bg : T.muted,
              border: '1px solid ' + (expenses[k] === v ? T.ink : T.line),
              borderRadius: 999, cursor: 'pointer',
            }}>{v}€</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
        <EditableNumber value={expenses[k]} onChange={(v) => onSetExpense(k, v)} min={0} max={20000} color={T.ink} />
        <span style={{ fontSize: T.size.body, color: T.muted }}>€/mes</span>
      </div>
    </div>
  );
}

export function AllocRow({ k, label, fixedReturn, customKey, returnLabel, allocation, onSetAlloc, onSetReturn, planReturn }) {
  // Resolve the displayed return: customReturns override → defaults.
  const customReturn = customKey
    ? (allocation.customReturns[customKey] != null
        ? allocation.customReturns[customKey]
        : (returnLabel === 'plan' ? planReturn : (customKey === 'deposits' ? 2.0 : 0)))
    : fixedReturn;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, borderBottom: '1px dashed ' + T.lineSoft, paddingBottom: 12, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
          <EditableNumber value={allocation[k]} onChange={(v) => onSetAlloc(k, v)} min={0} max={100} step={1} color={T.ink} />
          <span style={{ fontSize: T.size.body, color: T.muted }}>%</span>
        </div>
      </div>
      <input type="range" min="0" max="100" step="1" value={allocation[k]}
        onChange={(e) => onSetAlloc(k, +e.target.value)}
        style={{ width: '100%', accentColor: T.accent }} />
      {/* Rentabilidad nominal por clase · editable salvo en liquidez (fija 0%). El usuario
          ajusta p. ej. depósito 1,5–2,5% u otros 5–10%; computeEffectiveCapitalReturn ya las
          combina por media ponderada (motor sin tocar). */}
      <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wide, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        rinde {customKey
          ? <EditableNumber value={customReturn} onChange={(v) => onSetReturn(customKey, v)} min={0} max={20} step={0.5} color={T.muted} />
          : customReturn}% nominal
      </div>
    </div>
  );
}

export function ActualLifeOnboarding({ onClose, onComplete, overridePlan = null }) {
  const { state, mutatePlan } = useStore();
  const plan = overridePlan || state.plan;
  const tk = todayKey();
  const income = computeIncomeFor(plan, tk);
  const investment = computePlannedFor(plan, tk);
  const planReturn = plan.annualReturn || 8;
  const initial = plan.actualLife || {};

  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => ({
    expenses: {
      housing: initial.expenses ? initial.expenses.housing || 0 : 0,
      food: initial.expenses ? initial.expenses.food || 0 : 0,
      transport: initial.expenses ? initial.expenses.transport || 0 : 0,
      subscriptions: initial.expenses ? initial.expenses.subscriptions || 0 : 0,
      other: initial.expenses ? initial.expenses.other || 0 : 0,
    },
    mortgage: {
      enabled: initial.mortgage ? !!initial.mortgage.enabled : false,
      originalAmount: initial.mortgage ? initial.mortgage.originalAmount || 0 : 0,
      termYears: initial.mortgage ? initial.mortgage.termYears || 30 : 30,
      startYear: initial.mortgage ? initial.mortgage.startYear || new Date().getFullYear() : new Date().getFullYear(),
      type: initial.mortgage ? initial.mortgage.type || 'fixed' : 'fixed',
      fixedRate: initial.mortgage ? (initial.mortgage.fixedRate != null ? initial.mortgage.fixedRate : 3.0) : 3.0,
      spread: initial.mortgage ? (initial.mortgage.spread != null ? initial.mortgage.spread : 1.0) : 1.0,
      euriborRef: initial.mortgage ? (initial.mortgage.euriborRef != null ? initial.mortgage.euriborRef : 3.0) : 3.0,
    },
    allocation: {
      cash: initial.allocation ? initial.allocation.cash || 0 : 0,
      deposits: initial.allocation ? initial.allocation.deposits || 0 : 0,
      fundsEtfs: initial.allocation ? initial.allocation.fundsEtfs || 0 : 0,
      pensionPlan: initial.allocation ? initial.allocation.pensionPlan || 0 : 0,
      other: initial.allocation ? initial.allocation.other || 0 : 0,
      customReturns: {
        deposits: initial.allocation && initial.allocation.customReturns && initial.allocation.customReturns.deposits != null
          ? initial.allocation.customReturns.deposits : 2.0,
        fundsEtfs: initial.allocation && initial.allocation.customReturns ? initial.allocation.customReturns.fundsEtfs : null,
        pensionPlan: initial.allocation && initial.allocation.customReturns ? initial.allocation.customReturns.pensionPlan : null,
        other: initial.allocation && initial.allocation.customReturns && initial.allocation.customReturns.other != null
          ? initial.allocation.customReturns.other : 0,
      },
    },
  }));

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const setExpense = (k, v) => setData(d => ({ ...d, expenses: { ...d.expenses, [k]: Math.max(0, v) } }));
  const setMortgage = (patch) => setData(d => ({ ...d, mortgage: { ...d.mortgage, ...patch } }));
  const setAlloc = (k, v) => setData(d => ({ ...d, allocation: { ...d.allocation, [k]: Math.max(0, Math.min(100, v)) } }));
  // setCustomReturn REEXPUESTO (v1.5.0a3): el usuario ajusta la rentabilidad nominal esperada
  // por clase de activo. computeEffectiveCapitalReturn ya las combina por media ponderada — el
  // motor NO se toca; aquí solo se escribe a allocation.customReturns[key].
  const setCustomReturn = (key, v) => setData(d => ({ ...d, allocation: { ...d.allocation, customReturns: { ...d.allocation.customReturns, [key]: Math.max(0, Math.min(20, v)) } } }));

  const totalExpenses = data.expenses.housing + data.expenses.food + data.expenses.transport
                       + data.expenses.subscriptions + data.expenses.other;
  const totalAllocation = data.allocation.cash + data.allocation.deposits + data.allocation.fundsEtfs
                        + data.allocation.pensionPlan + data.allocation.other;

  const allocOk = Math.abs(totalAllocation - 100) < 0.01;
  // Effective return preview (using same logic as the live helper)
  const effRetPreview = (() => {
    const a = data.allocation;
    const cr = a.customReturns;
    const w = a.cash + a.deposits + a.fundsEtfs + a.pensionPlan + a.other;
    if (w <= 0) return null;
    const rDep = cr.deposits != null ? cr.deposits : 2.0;
    const rFunds = cr.fundsEtfs != null ? cr.fundsEtfs : planReturn;
    const rPP = cr.pensionPlan != null ? cr.pensionPlan : planReturn;
    const rOther = cr.other != null ? cr.other : 0;
    return (0 * a.cash + rDep * a.deposits + rFunds * a.fundsEtfs + rPP * a.pensionPlan + rOther * a.other) / w;
  })();

  const totalSpendInvest = totalExpenses + investment;
  const overspending = income > 0 && totalSpendInvest > income;
  const sobrante = Math.max(0, income - totalSpendInvest);

  const finish = () => {
    // Guard against saving a corrupted allocation (e.g. residue from a previous
    // session). If the sum isn't 100, send the user back to the allocation step;
    // the in-step indicator already explains what's wrong, so no toast needed.
    const totalAlloc = data.allocation.cash + data.allocation.deposits
      + data.allocation.fundsEtfs + data.allocation.pensionPlan + data.allocation.other;
    const allocValid = Math.abs(totalAlloc - 100) < 0.01;
    if (!allocValid) {
      setStep(2);
      return;
    }
    const payload = {
      completed: true,
      expenses: data.expenses,
      mortgage: data.mortgage,
      allocation: data.allocation,
    };
    if (onComplete) {
      onComplete(payload);
    } else {
      mutatePlan(p => ({ ...p, actualLife: payload }));
    }
  };

  const canNext = (() => {
    if (step === 0) return true; // expenses always allowed (even 0)
    if (step === 1) return true; // mortgage step always allowed
    if (step === 2) return allocOk;
    return true;
  })();

  const totalSteps = 4;

  // Reusable styled bits
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.55)',
      zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 12px', overflowY: 'auto',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bg, maxWidth: 640, width: '100%',
        borderRadius: 14, padding: 'clamp(22px, 4vw, 36px)',
        fontFamily: T.serif, color: T.ink,
        boxShadow: '0 24px 60px rgba(26,22,18,0.3)',
        position: 'relative',
      }}>
        <button onClick={onClose} aria-label="Cerrar"
          style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, padding: 8, letterSpacing: T.tracking.wider }}>
          ✕ CERRAR
        </button>

        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint, marginBottom: 8 }}>
          Paso {step + 1} de {totalSteps} · Descubre más sobre tu situación
        </div>

        {/* Step 1 · Expenses */}
        {step === 0 && (
          <>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, letterSpacing: T.tracking.tight, lineHeight: T.lh.snug, marginBottom: 8 }}>
              ¿Cuánto te cuesta vivir cada mes?
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal, marginBottom: 18 }}>
              Estimación, no contabilidad. Si tienes hipoteca, mete la cuota en Vivienda.
            </div>
            <ExpenseRow k="housing" label="Vivienda" chips={[500, 800, 1200]} expenses={data.expenses} onSetExpense={setExpense} />
            <ExpenseRow k="food" label="Comida" chips={[250, 400, 600]} expenses={data.expenses} onSetExpense={setExpense} />
            <ExpenseRow k="transport" label="Transporte" chips={[0, 80, 150, 250]} expenses={data.expenses} onSetExpense={setExpense} />
            <ExpenseRow k="subscriptions" label="Suscripciones" chips={[20, 50, 100]} expenses={data.expenses} onSetExpense={setExpense} />
            <ExpenseRow k="other" label="Otros" chips={[100, 200, 400]} expenses={data.expenses} onSetExpense={setExpense} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 14, borderTop: '1px solid ' + T.line, marginTop: 4 }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>Total</div>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, color: T.ink, letterSpacing: T.tracking.tight }}>
                {fmtEur(totalExpenses)}<span style={{ fontSize: T.size.body, color: T.muted, marginLeft: 4 }}>/mes</span>
                {income > 0 && (
                  <span style={{ fontSize: T.size.caption, color: T.muted, marginLeft: 10, fontFamily: T.serif, fontStyle: 'italic' }}>
                    {Math.round(totalExpenses / income * 100)}% de tu sueldo
                  </span>
                )}
              </div>
            </div>

            {overspending && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(180,83,9,0.08)', border: '1px solid ' + T.amber, borderRadius: 10, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.amber, lineHeight: T.lh.normal }}>
                Estás declarando más gasto+inversión que ingresos. Revisa los importes o tu ingreso en Ajustes.
              </div>
            )}

            <OnboardingHelp title="¿Por qué estas categorías?">
              No necesitas precisión contable. Una estimación razonable es suficiente. Mi Plan FIRE compara tu gasto declarado con tu salario neto y te muestra dónde va tu dinero, no audita tu vida. Si no llegas a fin de mes con lo que pones, sabremos que falta algo.
            </OnboardingHelp>
          </>
        )}

        {/* Step 2 · Mortgage */}
        {step === 1 && (
          <>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, letterSpacing: T.tracking.tight, lineHeight: T.lh.snug, marginBottom: 8 }}>
              ¿Tienes hipoteca?
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal, marginBottom: 18 }}>
              La cuota mensual ya está en "Vivienda" del paso anterior. Aquí solo es para mostrarte cuánto pagas en intereses a lo largo del plazo.
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button onClick={() => setMortgage({ enabled: false })} style={{
                flex: 1, fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '14px 16px',
                background: !data.mortgage.enabled ? T.ink : 'transparent',
                color: !data.mortgage.enabled ? T.bg : T.muted,
                border: '1px solid ' + (!data.mortgage.enabled ? T.ink : T.line),
                borderRadius: 12, cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
              }}>No, no tengo</button>
              <button onClick={() => setMortgage({ enabled: true })} style={{
                flex: 1, fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '14px 16px',
                background: data.mortgage.enabled ? T.ink : 'transparent',
                color: data.mortgage.enabled ? T.bg : T.muted,
                border: '1px solid ' + (data.mortgage.enabled ? T.ink : T.line),
                borderRadius: 12, cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
              }}>Sí, tengo una</button>
            </div>

            {data.mortgage.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Row label="Importe financiado">
                  <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
                    <EditableNumber value={data.mortgage.originalAmount} onChange={(v) => setMortgage({ originalAmount: v })} min={0} max={2_000_000} step={1000} color={T.ink} /> €
                  </span>
                </Row>
                <Row label="Plazo total">
                  <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
                    <EditableNumber value={data.mortgage.termYears} onChange={(v) => setMortgage({ termYears: v })} min={1} max={50} step={1} color={T.ink} /> años
                  </span>
                </Row>
                <Row label="Año de inicio">
                  <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
                    <EditableNumber value={data.mortgage.startYear} onChange={(v) => setMortgage({ startYear: v })} min={1990} max={new Date().getFullYear() + 5} step={1} color={T.ink} />
                  </span>
                </Row>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setMortgage({ type: 'fixed' })} style={{
                    flex: 1, fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '8px 12px',
                    background: data.mortgage.type === 'fixed' ? T.ink : 'transparent',
                    color: data.mortgage.type === 'fixed' ? T.bg : T.muted,
                    border: '1px solid ' + (data.mortgage.type === 'fixed' ? T.ink : T.line),
                    borderRadius: 999, cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
                  }}>Tipo fijo</button>
                  <button onClick={() => setMortgage({ type: 'variable' })} style={{
                    flex: 1, fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '8px 12px',
                    background: data.mortgage.type === 'variable' ? T.ink : 'transparent',
                    color: data.mortgage.type === 'variable' ? T.bg : T.muted,
                    border: '1px solid ' + (data.mortgage.type === 'variable' ? T.ink : T.line),
                    borderRadius: 999, cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
                  }}>Tipo variable</button>
                </div>
                {data.mortgage.type === 'fixed' ? (
                  <Row label="Tipo de interés">
                    <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
                      <EditableNumber value={data.mortgage.fixedRate} onChange={(v) => setMortgage({ fixedRate: v })} min={0} max={15} step={0.1} color={T.ink} /> %
                    </span>
                  </Row>
                ) : (
                  <>
                    <Row label="Euribor referencia">
                      <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
                        <EditableNumber value={data.mortgage.euriborRef} onChange={(v) => setMortgage({ euriborRef: v })} min={0} max={10} step={0.1} color={T.ink} /> %
                      </span>
                    </Row>
                    <Row label="Spread sobre Euribor">
                      <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle }}>
                        <EditableNumber value={data.mortgage.spread} onChange={(v) => setMortgage({ spread: v })} min={0} max={5} step={0.05} color={T.ink} /> %
                      </span>
                    </Row>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal }}>
                      Tipo efectivo asumido: <strong style={{ color: T.ink, fontStyle: 'normal' }}>{(data.mortgage.euriborRef + data.mortgage.spread).toFixed(2)}%</strong>. Sujeto a revisión cada 6 o 12 meses según tu contrato.
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 3 · Allocation */}
        {step === 2 && (
          <>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, letterSpacing: T.tracking.tight, lineHeight: T.lh.snug, marginBottom: 8 }}>
              ¿Dónde está tu dinero hoy?
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal, marginBottom: 18 }}>
              Reparte tu capital actual ({fmtEur(plan.capital || 0)}) entre estas categorías. Debe sumar 100%.
            </div>

            <AllocRow k="cash" label="Cuenta corriente / liquidez" fixedReturn={0} allocation={data.allocation} onSetAlloc={setAlloc} planReturn={planReturn} />
            <AllocRow k="deposits" label="Depósitos a plazo" customKey="deposits" allocation={data.allocation} onSetAlloc={setAlloc} onSetReturn={setCustomReturn} planReturn={planReturn} />
            <AllocRow k="fundsEtfs" label="Fondos / ETFs" customKey="fundsEtfs" returnLabel="plan" allocation={data.allocation} onSetAlloc={setAlloc} onSetReturn={setCustomReturn} planReturn={planReturn} />
            <AllocRow k="pensionPlan" label="Plan de pensiones" customKey="pensionPlan" returnLabel="plan" allocation={data.allocation} onSetAlloc={setAlloc} onSetReturn={setCustomReturn} planReturn={planReturn} />
            <AllocRow k="other" label="Otros" customKey="other" allocation={data.allocation} onSetAlloc={setAlloc} onSetReturn={setCustomReturn} planReturn={planReturn} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 14, borderTop: '1px solid ' + T.line, marginTop: 4 }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>Total</div>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, color: allocOk ? T.green : (totalAllocation > 100 ? T.red : T.amber), letterSpacing: T.tracking.tight }}>
                {Math.round(totalAllocation)}%
              </div>
            </div>

            {!allocOk && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(180,83,9,0.08)', border: '1px solid ' + T.amber, borderRadius: 10, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.amber, lineHeight: T.lh.normal }}>
                Las proporciones deben sumar 100%. {totalAllocation < 100 ? `Te falta ${(100 - totalAllocation).toFixed(0)}%.` : `Te sobra ${(totalAllocation - 100).toFixed(0)}%.`}
              </div>
            )}

            {effRetPreview != null && allocOk && (
              <div style={{ marginTop: 10, fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal }}>
                Retorno medio ponderado de tu capital actual: <strong style={{ color: T.ink, fontStyle: 'normal' }}>{effRetPreview.toFixed(1)}% nominal</strong>. Con esta cifra Mi Plan FIRE reproyectará tu plan.
              </div>
            )}

            <OnboardingHelp title="¿Por qué importa dónde está mi dinero?">
              Mi Plan FIRE asumía que tu capital inicial rinde el retorno del slider ({planReturn}%). Eso no es realista si la mayoría está en cuenta corriente al 0%. Con esta distribución calculamos el retorno medio ponderado de tu situación actual y reescribimos la proyección para reflejar la realidad de tu dinero hoy.
            </OnboardingHelp>
          </>
        )}

        {/* Step 4 · Confirmation */}
        {step === 3 && (
          <>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, letterSpacing: T.tracking.tight, lineHeight: T.lh.snug, marginBottom: 8 }}>
              Esto es lo que vas a ver
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal, marginBottom: 22 }}>
              Resumen rápido antes de aplicarlo.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 14, background: T.panel, borderRadius: 10, border: '1px solid ' + T.line }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.muted, marginBottom: 6 }}>Gastos declarados</div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight }}>{fmtEur(totalExpenses)}<span style={{ fontSize: T.size.caption, color: T.muted, marginLeft: 4 }}>/mes</span></div>
              </div>
              <div style={{ padding: 14, background: T.panel, borderRadius: 10, border: '1px solid ' + T.line }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.muted, marginBottom: 6 }}>Hipoteca</div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight }}>
                  {data.mortgage.enabled
                    ? `Sí · ${fmtEur(data.mortgage.originalAmount)} · ${data.mortgage.type === 'fixed' ? data.mortgage.fixedRate + '% fijo' : `${data.mortgage.type} ${(data.mortgage.euriborRef + data.mortgage.spread).toFixed(1)}%`} · ${data.mortgage.termYears}a`
                    : 'No declarada'}
                </div>
              </div>
              <div style={{ padding: 14, background: T.panel, borderRadius: 10, border: '1px solid ' + T.line }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.muted, marginBottom: 6 }}>Distribución del capital</div>
                <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.ink, lineHeight: T.lh.normal }}>
                  liquidez {data.allocation.cash}% · depósitos {data.allocation.deposits}% · fondos {data.allocation.fundsEtfs}% · pensiones {data.allocation.pensionPlan}% · otros {data.allocation.other}%
                </div>
                {effRetPreview != null && (
                  <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 6 }}>
                    Retorno ponderado: <strong style={{ color: T.ink, fontStyle: 'normal' }}>{effRetPreview.toFixed(1)}%</strong> (antes: {planReturn}% asumido)
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 18, padding: '12px 14px', background: T.bg, border: '1px solid ' + T.line, borderRadius: 10, fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, lineHeight: T.lh.normal }}>
              <strong style={{ color: T.ink, fontStyle: 'normal' }}>Lo que cambia en tu plan:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 18 }}>
                <li>El gasto anual para la regla del {((state.plan.withdrawalRate || 4).toFixed(1))}% pasa a ser <strong style={{ color: T.ink, fontStyle: 'normal' }}>{fmtEur(totalExpenses * 12)}</strong>{income > 0 && <> (antes derivado de {fmtEur((income - investment) * 12)})</>}.</li>
                {effRetPreview != null && Math.abs(effRetPreview - planReturn) > 0.1 && (
                  <li>El retorno efectivo de tu capital inicial pasa del {planReturn}% al <strong style={{ color: T.ink, fontStyle: 'normal' }}>{effRetPreview.toFixed(1)}%</strong>.</li>
                )}
                <li>Se desbloquea la vista completa de "Antes de Mi Plan" con tres bloques adicionales.</li>
              </ul>
            </div>

            {overspending && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(180,83,9,0.08)', border: '1px solid ' + T.amber, borderRadius: 10, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.amber, lineHeight: T.lh.normal }}>
                Estás declarando más gasto+inversión que ingreso. Revisa los importes en el paso 1.
              </div>
            )}
          </>
        )}

        {/* Footer nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid ' + T.line, flexWrap: 'wrap' }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : onClose()} style={{
            fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '10px 16px', background: 'transparent', color: T.muted,
            border: '1px solid ' + T.line, borderRadius: 999, cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
          }}>{step > 0 ? '← Atrás' : 'Cancelar'}</button>
          {step < totalSteps - 1 ? (
            <Btn variant="primary" size="md" onClick={() => canNext && setStep(step + 1)}>
              {canNext ? 'Siguiente →' : 'Completa para continuar'}
            </Btn>
          ) : (
            <Btn variant="accent" size="md" onClick={finish}>Ver mi situación completa →</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScreenSinMiPlan({ embedded = false }) {
  const { state, updatePlan } = useStore();
  const d = useDerived();
  const { profile, plan } = state;
  const mobile = useIsMobile();
  const realMode = state.displayMode === 'real';
  const tk = todayKey();
  const income = computeIncomeFor(plan, tk);
  const investment = computePlannedFor(plan, tk);
  const al = plan.actualLife || { completed: false };
  const completed = !!al.completed;
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Exploratory salary-growth assumption for Truth 1. Local state on purpose:
  // not persisted, the user can play with it without writing to plan state.
  // Only used when the plan has a single income tramo (a steady salary). When
  // the plan defines multiple tramos (escalonado, variable, etc.) we project
  // straight from the tramos and this control is hidden.
  const [salaryGrowthAnnual, setSalaryGrowthAnnual] = useState(1.0);
  const hasMultipleIncomeSegments = (plan.incomeSegments || []).length > 1;

  const yearsToRetire = Math.max(1, profile.retireAge - profile.age);
  const monthsToRetire = yearsToRetire * 12;
  const inflRate = plan.inflationRate != null ? plan.inflationRate : 2.5;
  const planReturn = plan.annualReturn || 8;

  // ---- Truth 1 · Salary erosion ----
  // Nominal salary path: from the plan's tramos when there are several,
  // from a steady salary × salary-growth factor when there is just one.
  const erosion = useMemo(() => {
    if (income <= 0) return null;
    const gMo = Math.pow(1 + salaryGrowthAnnual / 100, 1 / 12) - 1;
    const piMo = Math.pow(1 + inflRate / 100, 1 / 12) - 1;
    const rows = [];
    let sumNominal = 0;
    let sumReal = 0;
    for (let m = 0; m <= monthsToRetire; m++) {
      const nominal = hasMultipleIncomeSegments
        ? computeIncomeFor(plan, addMonthsKey(tk, m))
        : income * Math.pow(1 + gMo, m);
      const real = nominal / Math.pow(1 + piMo, m);
      if (m > 0) { sumNominal += nominal; sumReal += real; }
      rows.push({ age: profile.age + m / 12, nominal, real, monthIndex: m });
    }
    return {
      rows,
      finalNominal: rows[rows.length - 1].nominal,
      finalReal: rows[rows.length - 1].real,
      sumNominal, sumReal,
      lost: sumNominal - sumReal,
    };
  }, [income, inflRate, profile.age, profile.retireAge, monthsToRetire, salaryGrowthAnnual, plan, tk, hasMultipleIncomeSegments]);

  // ---- Truth 2 · Opportunity cost ----
  // A: capital + future monthly contributions parked at 0% nominal (= negative real)
  // B: capital + future monthly contributions invested at the plan return
  // Iterates month by month with computePlannedFor so plan-driven growth in
  // contributions (escalonado, etc.) is reflected in both curves.
  const oppCost = useMemo(() => {
    const piMo = Math.pow(1 + inflRate / 100, 1 / 12) - 1;
    const planMo = Math.pow(1 + planReturn / 100, 1 / 12) - 1;
    const capital = plan.capital || 0;
    const rows = [];
    let parkedNominal = capital;
    let investedNominal = capital;
    for (let m = 0; m <= monthsToRetire; m++) {
      if (m > 0) {
        const futureKey = addMonthsKey(tk, m);
        const monthly = computePlannedFor(plan, futureKey);
        parkedNominal += monthly; // 0% nominal
        investedNominal = investedNominal * (1 + planMo) + monthly;
      }
      const deflator = Math.pow(1 + piMo, m);
      rows.push({
        age: profile.age + m / 12,
        parkedReal: parkedNominal / deflator,
        investedReal: investedNominal / deflator,
        monthIndex: m,
      });
    }
    return {
      rows,
      parkedFinalReal: rows[rows.length - 1].parkedReal,
      investedFinalReal: rows[rows.length - 1].investedReal,
      difference: rows[rows.length - 1].investedReal - rows[rows.length - 1].parkedReal,
    };
  }, [plan, inflRate, planReturn, profile.age, monthsToRetire, tk]);

  // ---- Truth 3 · Day-to-day cost (vista completa) ----
  const declaredExpenses = sumExpenses(al);
  const totalSpendInvest = declaredExpenses + investment;
  const sobrante = Math.max(0, income - totalSpendInvest);
  const overspending = completed && income > 0 && totalSpendInvest > income;

  // ---- Truth 4 · Mortgage schedule ----
  const mortgageSchedule = useMemo(() => buildMortgageSchedule(al.mortgage || {}), [al.mortgage]);
  const mortgageTotalInterest = mortgageSchedule.reduce((s, r) => s + r.interest, 0);
  const mortgageTotalPrincipal = mortgageSchedule.reduce((s, r) => s + r.principal, 0);

  // ---- Truth 5 · Where the money is ----
  const allocCategories = useMemo(() => {
    const a = al.allocation || {};
    const cr = a.customReturns || {};
    const totalCapital = plan.capital || 0;
    const cats = [
      { id: 'cash', label: 'Cuenta corriente / liquidez', pct: a.cash || 0, ret: 0 },
      { id: 'deposits', label: 'Depósitos a plazo', pct: a.deposits || 0, ret: cr.deposits != null ? cr.deposits : 2.0 },
      { id: 'fundsEtfs', label: 'Fondos / ETFs', pct: a.fundsEtfs || 0, ret: cr.fundsEtfs != null ? cr.fundsEtfs : planReturn },
      { id: 'pensionPlan', label: 'Plan de pensiones', pct: a.pensionPlan || 0, ret: cr.pensionPlan != null ? cr.pensionPlan : planReturn },
      { id: 'other', label: 'Otros', pct: a.other || 0, ret: cr.other != null ? cr.other : 0 },
    ];
    return cats.map((c) => ({
      ...c,
      amount: totalCapital * c.pct / 100,
      realRet: c.ret - inflRate,
      color: c.ret < 1 ? T.red : c.ret < 3 ? T.amber : T.green,
    }));
  }, [al.allocation, plan.capital, planReturn, inflRate]);

  const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 };

  // Small chart wrapper for the two minimum-view charts.
  const ErosionChart = () => {
    const R = window.Recharts || {};
    const { ResponsiveContainer, LineChart: RLC, Line, XAxis, YAxis, CartesianGrid, Tooltip } = R;
    if (!ResponsiveContainer || !erosion) return null;
    const data = erosion.rows.filter((_, i) => i % 12 === 0); // year-resolution
    return (
      <div style={{ width: '100%', height: mobile ? 200 : 240 }}>
        <ResponsiveContainer>
          <RLC data={data} margin={{ top: 8, right: 12, left: 4, bottom: 6 }}>
            <CartesianGrid stroke={T.lineSoft} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']}
              tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
              tickFormatter={(v) => Math.round(v) + ''} axisLine={{ stroke: T.line }} tickLine={false} />
            <YAxis tickFormatter={fmtEur} tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              formatter={(v, name) => [fmtEur(v) + '/mes', name === 'nominal' ? 'Salario sobre el papel' : 'Poder adquisitivo (ajustado por inflación)']}
              labelFormatter={(age) => `${Math.round(age)} años`}
              contentStyle={{ background: T.ink, border: 'none', borderRadius: 6, fontFamily: T.mono, fontSize: T.size.eyebrow, color: '#fff', padding: '6px 10px' }} />
            <Line type="monotone" dataKey="nominal" stroke={T.faint} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="real" stroke={T.accent} strokeWidth={2} dot={false} isAnimationActive={false} />
          </RLC>
        </ResponsiveContainer>
      </div>
    );
  };

  const OppCostChart = () => {
    const R = window.Recharts || {};
    const { ResponsiveContainer, LineChart: RLC, Line, XAxis, YAxis, CartesianGrid, Tooltip } = R;
    if (!ResponsiveContainer || !oppCost) return null;
    const data = oppCost.rows.filter((_, i) => i % 12 === 0);
    return (
      <div style={{ width: '100%', height: mobile ? 200 : 240 }}>
        <ResponsiveContainer>
          <RLC data={data} margin={{ top: 8, right: 12, left: 4, bottom: 6 }}>
            <CartesianGrid stroke={T.lineSoft} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']}
              tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
              tickFormatter={(v) => Math.round(v) + ''} axisLine={{ stroke: T.line }} tickLine={false} />
            <YAxis tickFormatter={fmtEur} tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }} axisLine={false} tickLine={false} width={64} />
            <Tooltip
              formatter={(v, name) => [fmtEur(v), name === 'parkedReal' ? 'En cuenta corriente' : 'Con Plan']}
              labelFormatter={(age) => `${Math.round(age)} años`}
              contentStyle={{ background: T.ink, border: 'none', borderRadius: 6, fontFamily: T.mono, fontSize: T.size.eyebrow, color: '#fff', padding: '6px 10px' }} />
            <Line type="monotone" dataKey="parkedReal" stroke={T.faint} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="investedReal" stroke={T.accent} strokeWidth={2} dot={false} isAnimationActive={false} />
          </RLC>
        </ResponsiveContainer>
      </div>
    );
  };

  // Truth 4 stacked bar chart (mortgage).
  const MortgageChart = () => {
    const R = window.Recharts || {};
    const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } = R;
    if (!ResponsiveContainer || mortgageSchedule.length === 0) return null;
    return (
      <div style={{ width: '100%', height: mobile ? 220 : 260 }}>
        <ResponsiveContainer>
          <BarChart data={mortgageSchedule} margin={{ top: 8, right: 12, left: 4, bottom: 6 }}>
            <CartesianGrid stroke={T.lineSoft} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }} axisLine={{ stroke: T.line }} tickLine={false} />
            <YAxis tickFormatter={fmtEur} tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              formatter={(v, name) => [fmtEur(v), name === 'principal' ? 'Capital amortizado' : 'Intereses pagados']}
              labelFormatter={(year) => `Año ${year}`}
              contentStyle={{ background: T.ink, border: 'none', borderRadius: 6, fontFamily: T.mono, fontSize: T.size.eyebrow, color: '#fff', padding: '6px 10px' }} />
            <Bar dataKey="principal" stackId="m" fill={T.accent} isAnimationActive={false} />
            <Bar dataKey="interest" stackId="m" fill={T.amber} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div style={sectionStyle}>
      {/* Header — hidden when embedded (the host screen already provides one). */}
      {!embedded && (
        <div>
          <Label>Antes de Mi Plan</Label>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, letterSpacing: T.tracking.display, marginTop: 4, lineHeight: T.lh.tight }}>
            Tu situación si no <em style={{ color: T.accent }}>haces nada</em>.
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 8, maxWidth: 640, lineHeight: T.lh.normal }}>
            La otra cara de la moneda: lo que el sistema económico hace con tu dinero sin que te enteres, calculado con tus propias cifras.
          </div>
        </div>
      )}

      {/* Verdad 1 · Salary erosion */}
      <Card pad={mobile ? 18 : 26}>
        <Label>Verdad 1 · La erosión del salario</Label>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 6, lineHeight: T.lh.normal }}>
          Si tu salario sube exactamente al ritmo de la <Concept id="inflacion">inflación</Concept> (lo que rara vez ocurre, ya que la mayoría de salarios suben menos), tu poder adquisitivo se mantiene. Si sube menos, pierdes. Esta es la realidad estadística española de las últimas dos décadas.
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, paddingBottom: 6, borderTop: '1px dashed ' + T.lineSoft }}>
          {hasMultipleIncomeSegments ? (
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal }}>
              Proyección según los tramos de tu plan de Ajustes.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.muted }}>Crecimiento salarial asumido</span>
                <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink }}>
                  <EditableNumber value={salaryGrowthAnnual} onChange={setSalaryGrowthAnnual} min={0} max={10} step={0.1} color={T.ink} /> % / año
                </span>
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 4, lineHeight: T.lh.normal }}>
                La media española en los últimos 20 años ha sido cercana al 1% nominal anual. Cámbialo si conoces tu caso concreto.
              </div>
            </>
          )}
        </div>
        <div style={{ marginTop: 14 }}>
          {erosion ? <ErosionChart /> : (
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body }}>
              Define tu ingreso en <strong style={{ color: T.ink, fontStyle: 'normal' }}>Proyección → Tramos de ingreso</strong> para ver esta cifra.
            </div>
          )}
        </div>
        {erosion && (
          <>
            <div style={{ display: 'flex', gap: 14, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0, marginTop: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 0, borderTop: '2px dashed ' + T.faint }} /> {hasMultipleIncomeSegments ? 'Salario sobre el papel (según tu plan)' : `Salario sobre el papel (sube ${salaryGrowthAnnual.toFixed(1)}%/año)`}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 2, background: T.accent }} /> Poder adquisitivo (ajustado por inflación)
              </span>
            </div>
            <div style={{ marginTop: 16, padding: '14px 16px', background: T.panel, border: '1px solid ' + T.line, borderRadius: 10 }}>
              <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.normal }}>
                {erosion.finalNominal > 0
                  ? <>En <strong>{yearsToRetire} años</strong>, tu salario habrá crecido hasta <strong style={{ color: T.accent }}>{fmtEur(erosion.finalNominal)}/mes</strong> sobre el papel, pero comprará lo que <strong style={{ color: T.accent }}>{fmtEur(erosion.finalReal)}</strong> compran hoy.</>
                  : <>Tu plan no tiene un tramo de salario vigente hasta la jubilación. Añade o extiende un tramo de ingreso en <strong style={{ color: T.ink }}>Proyección</strong> para ver la erosión por inflación.</>}
              </div>
            </div>
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed ' + T.line }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>Poder adquisitivo perdido (acumulado)</div>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayXl, color: T.red, letterSpacing: T.tracking.display, lineHeight: T.lh.tight, marginTop: 4 }}>
                −{fmtEur(erosion.lost)}
              </div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 6, lineHeight: T.lh.normal }}>
                Es la diferencia entre lo que el sistema te paga nominalmente y lo que ese dinero puede comprar. Se queda por el camino sin aparecer en ningún sitio.
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Verdad 2 · Opportunity cost */}
      <Card pad={mobile ? 18 : 26}>
        <Label>Verdad 2 · El coste de oportunidad de no invertir</Label>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 6, lineHeight: T.lh.normal }}>
          Cada mes que dejas el ahorro en cuenta corriente, el dinero no compone. Esto es lo que dejarías de tener.
        </div>
        <div style={{ marginTop: 14 }}>
          <OppCostChart />
        </div>
        <div style={{ display: 'flex', gap: 14, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0, marginTop: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 0, borderTop: '2px dashed ' + T.faint }} /> En cuenta corriente (real)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 2, background: T.accent }} /> Con Mi Plan (real)
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 16 }}>
          <div style={{ padding: '12px 14px', background: T.panel, border: '1px solid ' + T.line, borderRadius: 10 }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.muted, marginBottom: 6 }}>Sin Plan</div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.faint, letterSpacing: T.tracking.tight }}>{fmtEur(oppCost.parkedFinalReal)}</div>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 4, letterSpacing: T.tracking.wide }}>ajustado por inflación</div>
          </div>
          <div style={{ padding: '12px 14px', background: T.ink, color: T.bg, borderRadius: 10 }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Con Plan</div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight }}>{fmtEur(oppCost.investedFinalReal)}</div>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: 'rgba(255,255,255,0.45)', marginTop: 4, letterSpacing: T.tracking.wide }}>ajustado por inflación</div>
          </div>
        </div>
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed ' + T.line }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>Diferencia</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayXl, color: T.red, letterSpacing: T.tracking.display, lineHeight: T.lh.tight, marginTop: 4 }}>
            {fmtEur(oppCost.difference)}
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 6, lineHeight: T.lh.normal }}>
            Es lo que te separa de la realidad que tendrías si no hicieras nada. No es magia: es matemática del <Concept id="interes-compuesto">interés compuesto</Concept> aplicado durante {yearsToRetire} años.
          </div>
        </div>
      </Card>

      {/* CTA / open mini-onboarding (vista mínima) */}
      {!completed && (
        <Card pad={mobile ? 18 : 26} style={{ background: T.panel, borderColor: T.line }}>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, letterSpacing: T.tracking.tight, lineHeight: T.lh.snug }}>
            ¿Quieres ver tu situación actual con más profundidad?
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 8, lineHeight: T.lh.normal, maxWidth: 580 }}>
            Si añades tus gastos reales, tu hipoteca (si la tienes) y dónde está tu dinero hoy, Mi Plan FIRE puede mostrarte qué te está costando realmente el día a día y cuánto de tu sueldo se te va sin que lo veas.
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn variant="accent" size="md" onClick={() => setShowOnboarding(true)}>Descubre más sobre tu situación actual →</Btn>
          </div>
        </Card>
      )}

      {/* ========================== Vista completa ========================== */}
      {completed && (
        <>
          {/* Verdad 3 · day to day */}
          <Card pad={mobile ? 18 : 26}>
            <Label>Verdad 3 · El coste real de tu día a día</Label>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 6, lineHeight: T.lh.normal }}>
              De {fmtEur(income)}/mes netos, así se reparten en realidad.
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Vivienda', value: al.expenses.housing, color: T.muted },
                { label: 'Comida', value: al.expenses.food, color: T.muted },
                { label: 'Transporte', value: al.expenses.transport, color: T.muted },
                { label: 'Suscripciones', value: al.expenses.subscriptions, color: T.muted },
                { label: 'Otros', value: al.expenses.other, color: T.muted },
                { label: 'Ahorro / inversión', value: investment, color: T.accent },
                { label: 'Sobrante sin destino', value: sobrante, color: T.amber, dashed: true },
              ].map((row) => {
                const pct = income > 0 ? Math.max(0, row.value) / income * 100 : 0;
                return (
                  <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>{row.label}</div>
                      <div style={{ height: 10, marginTop: 4, background: T.panel, borderRadius: 999, border: '1px solid ' + T.lineSoft, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          height: '100%',
                          width: Math.min(100, pct) + '%',
                          background: row.color,
                          borderRadius: 999,
                          backgroundImage: row.dashed ? 'repeating-linear-gradient(45deg, transparent 0, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px)' : 'none',
                        }} />
                      </div>
                    </div>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: row.color, letterSpacing: T.tracking.tight, textAlign: 'right' }}>{fmtEur(row.value)}</div>
                    <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, minWidth: 44, textAlign: 'right' }}>{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed ' + T.line, fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.normal }}>
              De <strong>{fmtEur(income)}</strong>/mes netos, vives con <strong>{fmtEur(declaredExpenses)}</strong> (gastos), aportas <strong style={{ color: T.accent }}>{fmtEur(investment)}</strong> (inversión)
              {sobrante > 0 && <> y <strong style={{ color: T.amber }}>{fmtEur(sobrante)}</strong> desaparecen sin destino claro.</>}
              {sobrante === 0 && !overspending && <> y nada queda sin destino.</>}
              {overspending && <> pero declaras <strong style={{ color: T.red }}>{fmtEur(totalSpendInvest - income)} más</strong> de los que ingresas. Revisa tus cifras.</>}
            </div>

            {sobrante > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(194,65,12,0.06)', border: '1px solid ' + T.accent, borderRadius: 10, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.ink, lineHeight: T.lh.normal }}>
                Esos {fmtEur(sobrante)} sin destino pueden convertirse en <strong style={{ color: T.accent, fontStyle: 'normal' }}>{fmtEur(sobrante * (Math.pow(1 + planReturn / 100, yearsToRetire) - 1) / (planReturn / 100) * 12)}</strong> en {yearsToRetire} años si los inviertes al {planReturn}%. Ajusta los parámetros en <strong style={{ color: T.ink, fontStyle: 'normal' }}>Proyección</strong> para ver otros escenarios.
              </div>
            )}
            {overspending && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(180,83,9,0.08)', border: '1px solid ' + T.amber, borderRadius: 10, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.amber, lineHeight: T.lh.normal }}>
                Estás declarando más gasto e inversión que ingreso. Revisa tus números en Ajustes o reabre este mini-onboarding desde el botón "Editar mis datos" abajo.
              </div>
            )}
          </Card>

          {/* Verdad 4 · Mortgage */}
          {al.mortgage && al.mortgage.enabled && (
            <Card pad={mobile ? 18 : 26}>
              <Label>Verdad 4 · El coste oculto de tu hipoteca</Label>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 6, lineHeight: T.lh.normal }}>
                Capital amortizado y intereses pagados año a año.
                {al.mortgage.type === 'variable' && (
                  <> Asumiendo tipo actual del <strong style={{ color: T.ink, fontStyle: 'normal' }}>{((al.mortgage.euriborRef || 0) + (al.mortgage.spread || 0)).toFixed(2)}%</strong>, sujeto a revisión.</>
                )}
              </div>
              <div style={{ marginTop: 14 }}>
                <MortgageChart />
              </div>
              <div style={{ display: 'flex', gap: 14, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0, marginTop: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 10, background: T.accent }} /> Capital amortizado
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 10, background: T.amber }} /> Intereses
                </span>
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed ' + T.line }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>Intereses totales a lo largo del plazo</div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, color: T.amber, letterSpacing: T.tracking.display, lineHeight: T.lh.tight, marginTop: 4 }}>
                  {fmtEur(mortgageTotalInterest)}
                </div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 6, lineHeight: T.lh.normal }}>
                  Tu hipoteca cuesta <strong style={{ color: T.ink, fontStyle: 'normal' }}>{fmtEur(mortgageTotalInterest)}</strong> en intereses a lo largo de <strong style={{ color: T.ink, fontStyle: 'normal' }}>{al.mortgage.termYears}</strong> años. Eso es <strong style={{ color: T.ink, fontStyle: 'normal' }}>{mortgageTotalPrincipal > 0 ? (mortgageTotalInterest / mortgageTotalPrincipal * 100).toFixed(1) : '—'}%</strong> del valor financiado.
                </div>
              </div>
            </Card>
          )}

          {/* Verdad 5 · Allocation */}
          <Card pad={mobile ? 18 : 26}>
            <Label>Verdad 5 · Dónde está tu dinero hoy</Label>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 6, lineHeight: T.lh.normal }}>
              Tu capital actual de {fmtEur(plan.capital || 0)} repartido entre categorías. Color por rentabilidad nominal: rojo &lt;1%, amber 1-3%, verde &gt;3%.
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allocCategories.filter(c => c.pct > 0).map((c) => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>{c.label}</div>
                    <div style={{ height: 12, marginTop: 4, background: T.panel, borderRadius: 999, border: '1px solid ' + T.lineSoft, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: c.pct + '%', background: c.color, borderRadius: 999 }} />
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 4, letterSpacing: T.tracking.wide }}>
                      rinde {c.ret.toFixed(1)}% nominal · {c.realRet >= 0 ? '+' : ''}{c.realRet.toFixed(1)}% real
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight }}>{fmtEur(c.amount)}</div>
                    <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint }}>{c.pct.toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>

            {d.effectiveReturn != null && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed ' + T.line, fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.normal }}>
                Tu patrimonio actual de <strong>{fmtEur(plan.capital || 0)}</strong> rinde de media <strong style={{ color: T.accent }}>{d.effectiveReturn.toFixed(1)}%</strong> nominal, que en términos reales son <strong style={{ color: (d.effectiveReturn - inflRate) >= 0 ? T.green : T.red }}>{(d.effectiveReturn - inflRate).toFixed(1)}%</strong> (descontada inflación). Si movieras todo el efectivo a inversión al {planReturn}%, el rendimiento real subiría hacia el {(planReturn - inflRate).toFixed(1)}%.
              </div>
            )}
          </Card>

          {/* Editar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
            <Btn variant="ghost" size="sm" onClick={() => setShowOnboarding(true)}>Editar mis datos →</Btn>
          </div>
        </>
      )}

      {showOnboarding && (
        <ActualLifeOnboarding
          onClose={() => setShowOnboarding(false)}
          onComplete={(payload) => {
            updatePlan({ actualLife: payload });
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
}

export function OnboardingHelp({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0,
          color: T.accent, display: 'flex', alignItems: 'center', gap: 6,
        }}>
        <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.body, lineHeight: 1 }}>{open ? '–' : '+'}</span>
        {title || '¿Por qué pregunto esto?'}
      </button>
      {open && (
        <div style={{ marginTop: 10, padding: '14px 16px', background: T.bg, border: '1px solid ' + T.lineSoft, borderRadius: 8, fontFamily: T.serif, fontSize: T.size.body, lineHeight: T.lh.normal, color: T.muted }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Enlace de compra del libro en Amazon (KDP). Placeholder configurable: vacío → la UI
// muestra «Próximamente en Amazon». Al publicar, pega aquí la URL del producto. Cero red.
const AMAZON_BOOK_URL = '';

// "El libro" · DESPLEGABLE DE COMPRA (no se regala el PDF imprimible; gratis = leer en la web,
// lección por lección). Portada decorativa (CSS, cero red) + qué contiene + CTA Amazon.
function BookPromo() {
  const [open, setOpen] = useState(false);
  const Cover = () => (
    <div style={{ width: 132, height: 184, flexShrink: 0, position: 'relative', borderRadius: '2px 7px 7px 2px', background: T.paper, border: '1px solid ' + T.line, boxShadow: '0 10px 24px rgba(26,22,18,0.16)', overflow: 'hidden' }} aria-hidden="true">
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 9, background: T.accent }} />
      <div style={{ position: 'absolute', left: 22, right: 14, top: 24, fontFamily: T.serif, fontStyle: 'italic', fontSize: 11, color: T.faint }}>El libro</div>
      <div style={{ position: 'absolute', left: 22, right: 14, top: 42, fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: 20, lineHeight: 1.05, letterSpacing: T.tracking.tight, color: T.ink }}>Los conceptos que sostienen tu plan</div>
      <div style={{ position: 'absolute', left: 22, right: 14, bottom: 16, fontFamily: T.display, fontStyle: 'italic', fontWeight: 600, fontOpticalSizing: 'auto', fontSize: 13, color: T.accent }}>Mi Plan FIRE</div>
    </div>
  );
  return (
    <div style={{ marginTop: 20, border: '1px solid ' + T.line, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '15px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', appearance: 'none', WebkitAppearance: 'none' }}>
        <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight }}>El libro <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.body, color: T.muted }}>· la edición impresa</span></span>
        <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, color: T.faint, whiteSpace: 'nowrap' }}>{open ? '▾ ocultar' : '▸ ver'}</span>
      </button>
      {open && (
        <div style={{ padding: '4px 18px 22px', borderTop: '1px solid ' + T.lineSoft, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ paddingTop: 18 }}><Cover /></div>
          <div style={{ flex: '1 1 280px', minWidth: 240, paddingTop: 18 }}>
            <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.relaxed }}>
              Todo el corpus de <strong style={{ fontStyle: 'normal' }}>Aprende</strong> reunido y ordenado, de lo esencial a lo avanzado, más páginas de <strong style={{ fontStyle: 'normal' }}>diario de finanzas personales</strong> para llevar tus cuentas a mano. Pensado para leerlo del tirón y tenerlo en la estantería.
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.muted, marginTop: 12, lineHeight: T.lh.normal }}>
              ¿Lo quieres gratis? Está todo aquí, lección por lección, en esta misma sección.
            </div>
            <div style={{ marginTop: 16 }}>
              {AMAZON_BOOK_URL
                ? <a href={AMAZON_BOOK_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', padding: '10px 18px', borderRadius: 999, background: T.ink, color: T.bg, textDecoration: 'none' }}>Comprar en Amazon →</a>
                : <span style={{ display: 'inline-block', fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', padding: '10px 18px', borderRadius: 999, border: '1px solid ' + T.line, color: T.faint }}>Próximamente en Amazon</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ScreenAprende() {
  const [section, setSection] = useState('conceptos'); // 'tablon' | 'glosario' | 'conceptos'
  const [activeId, setActiveId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // v5.11 (F2.3) · Filter for the "Conceptos" tab by level.
  const [level, setLevel] = useState('esencial');
  // Las tres "puertas" de nivel tienen mismo tamaño y color; el ÚNICO
  // diferenciador es la opacidad (activa = 1, inactivas = INACTIVE_OPACITY).
  // Súbelo (p.ej. a 0.40) si quedan poco legibles como clicables en device real.
  const INACTIVE_OPACITY = 0.35;

  // "Leído" persistente (para retomar): el usuario lo marca/desmarca EXPLÍCITAMENTE con un
  // control dentro del concepto (antes se auto-marcaba solo con abrir, poco fiable). Vive en
  // plan.readLessons ({id:true}); aditivo, sin tocar migrateToV2 ni LEARN_CORPUS (cerrado).
  const { state, mutatePlan } = useStore();
  const readLessons = (state.plan && state.plan.readLessons) || {};
  const toggleRead = (id) => { if (!id) return; mutatePlan(p => { const cur = p.readLessons || {}; return { ...p, readLessons: { ...cur, [id]: !cur[id] } }; }); };
  const openConcept = (id) => setActiveId(id);

  const allConcepts = Object.entries(LEARN_CORPUS).map(([id, c]) => ({ id, ...c }));
  // For the Conceptos tab, surface every entry of LEARN_CORPUS as a card —
  // not just those with full articles — so the levels stay coherent.
  const filteredConcepts = allConcepts.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    if (c.title.toLowerCase().includes(q) || (c.short && c.short.toLowerCase().includes(q))) return true;
    // Alias de términos (p.ej. "tu número" → regla-4) sin tocar LEARN_CORPUS (CO4).
    return Object.keys(GLOSSARY_ALIASES).some(a => GLOSSARY_ALIASES[a] === c.id && a.includes(q));
  });

  // Conceptos por nivel.
  const conceptsByLevel = {
    esencial: allConcepts.filter(c => LEARN_LEVEL_BY_ID[c.id] === 'esencial'),
    profundizando: allConcepts.filter(c => LEARN_LEVEL_BY_ID[c.id] === 'profundizando'),
    avanzado: allConcepts.filter(c => LEARN_LEVEL_BY_ID[c.id] === 'avanzado'),
  };

  // Agrupar por categoría (para el glosario)
  const byCategory = {};
  filteredConcepts.forEach(c => {
    const cat = c.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(c);
  });

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint }}>
          Aprende
        </div>
        <h1 style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayXxl, lineHeight: 1, letterSpacing: T.tracking.display, margin: '8px 0 0', color: T.ink }}>
          Los conceptos<br />que sostienen tu plan
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: T.size.lead, lineHeight: T.lh.normal, color: T.muted, marginTop: 18, maxWidth: 580 }}>
          No tienes que leerlos todos, ni en orden. Vuelve cuando algo te confunda. Cada artículo es independiente.
        </p>
        {/* "El libro" · desplegable de COMPRA (no se regala el PDF): portada decorativa + qué
            contiene + CTA Amazon. Gratis = leer lección por lección en la web. */}
        <BookPromo />
      </header>

      <nav style={{ display: 'flex', gap: 4, borderBottom: '1px solid ' + T.line, marginBottom: 28 }}>
        {[
          { id: 'conceptos', label: 'Conceptos' },
          { id: 'tablon', label: 'El Tablón' },
          { id: 'glosario', label: 'Glosario' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              background: 'transparent', border: 'none', padding: '12px 18px 14px',
              cursor: 'pointer', fontFamily: T.serif, fontSize: T.size.lead,
              color: section === s.id ? T.ink : T.faint,
              borderBottom: '2px solid ' + (section === s.id ? T.accent : 'transparent'),
              marginBottom: -1,
            }}>
            {s.label}
          </button>
        ))}
      </nav>

      {section === 'tablon' && (
        <div>
          <p style={{ fontFamily: T.serif, fontSize: T.size.lead, lineHeight: T.lh.relaxed, color: T.muted, fontStyle: 'italic', marginBottom: 28 }}>
            Las reglas no son dogmas. Son destilados de las verdades centrales del corpus. Cada una nace dentro de un artículo y conserva ahí su matiz. Si una regla te resuena, vuelve al artículo de origen.
          </p>
          {TABLON.map((group, i) => (
            <section key={i} style={{ marginBottom: 36 }}>
              <h2 style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint, marginBottom: 16 }}>
                {group.theme}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {group.lessons.map((lesson, j) => (
                  <blockquote
                    key={j}
                    onClick={() => openConcept(lesson.source)}
                    style={{
                      margin: 0, padding: '20px 24px',
                      background: T.paper, border: '1px solid ' + T.line, borderRadius: 10,
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = T.accent}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = T.line}>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, lineHeight: T.lh.snug, color: T.ink, fontStyle: 'italic' }}>
                      "{lesson.text}"
                    </div>
                    <div style={{ marginTop: 12, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint }}>
                      — {LEARN_CORPUS[lesson.source]?.title || lesson.source}
                    </div>
                  </blockquote>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {section === 'conceptos' && (
        <div>
          {/* F2.3 · Selector de nivel · tres "puertas" apiladas en vertical.
              Mismo tamaño y color en las tres; el único diferenciador es la opacidad
              (activa = 1, inactivas = INACTIVE_OPACITY). Sin "Todos" — esa vista la
              cubre ya la pestaña Glosario. "Empieza aquí" marca el punto de entrada. */}
          <div style={{ marginBottom: 22 }}>
            {[
              { id: 'esencial', label: 'Esencial' },
              { id: 'profundizando', label: 'Profundizando' },
              { id: 'avanzado', label: 'Avanzado' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setLevel(lvl.id)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 3,
                  border: '1px solid ' + T.line, borderRadius: 12, background: 'transparent',
                  padding: '14px 16px', marginBottom: 8, cursor: 'pointer', transition: 'opacity 0.16s',
                  opacity: level === lvl.id ? 1 : INACTIVE_OPACITY,
                }}>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: 22, lineHeight: 1.05, color: T.ink, letterSpacing: T.tracking.display }}>
                  {LEARN_LEVEL_LABELS[lvl.id]}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 14, color: T.muted }}>
                  {LEARN_LEVEL_SUB[lvl.id]}
                </div>
                {lvl.id === 'esencial' && (
                  <Pill color={T.accent} bg={T.accentSoft} border="rgba(194,65,12,0.28)"
                    style={{ alignSelf: 'flex-start', marginTop: 5, padding: '3px 9px', fontSize: 11, letterSpacing: T.tracking.wider }}>
                    Empieza aquí
                  </Pill>
                )}
              </button>
            ))}
          </div>
          {/* F2.2 · Card grid (3 cols desktop, 2 tablet, 1 mobile) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {(conceptsByLevel[level] || []).map(c => {
              const lvlId = LEARN_LEVEL_BY_ID[c.id] || 'avanzado';
              return (
                <button
                  key={c.id}
                  onClick={() => openConcept(c.id)}
                  style={{
                    background: T.paper, border: '1px solid ' + T.line, borderRadius: 12,
                    padding: 18, cursor: 'pointer', textAlign: 'left', fontFamily: T.serif,
                    color: T.ink, transition: 'border-color 0.15s, transform 0.15s',
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <LearnIcon id={c.id} size={32} color={T.ink} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint }}>
                        {LEARN_LEVEL_LABELS[lvlId] || 'Avanzado'}
                      </span>
                      {readLessons[c.id] && <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.bg, background: T.green, padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>✓ Leído</span>}
                    </div>
                  </div>
                  <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, lineHeight: T.lh.snug, color: T.ink, letterSpacing: T.tracking.tight }}>
                    {c.title}
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: T.size.caption, lineHeight: T.lh.normal, color: T.muted }}>
                    {c.short}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {section === 'glosario' && (
        <div>
          <input
            type="text"
            placeholder="Buscar concepto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px',
              background: T.paper, border: '1px solid ' + T.line, borderRadius: 8,
              fontFamily: T.serif, fontSize: T.size.body, color: T.ink, marginBottom: 24,
              outline: 'none',
            }}
          />
          {Object.entries(byCategory).map(([cat, list]) => (
            <section key={cat} style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, color: T.faint, marginBottom: 14 }}>
                {CATEGORY_LABELS[cat] || cat}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {list.map(c => (
                  <button
                    key={c.id}
                    onClick={() => openConcept(c.id)}
                    style={{
                      background: 'transparent', border: 'none', borderBottom: '1px solid ' + T.lineSoft,
                      padding: '14px 4px', cursor: 'pointer', textAlign: 'left', fontFamily: T.serif,
                      color: T.ink, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16,
                    }}>
                    <span>
                      <span style={{ fontSize: T.size.lead, color: T.ink }}>{c.title}</span>
                      <span style={{ fontSize: T.size.body, color: T.muted, marginLeft: 12 }}>— {c.short}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
                      {readLessons[c.id] && <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.bg, background: T.green, padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>✓ Leído</span>}
                      <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint }}>→</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid ' + T.lineSoft, fontFamily: T.mono, fontSize: T.size.eyebrow, lineHeight: T.lh.relaxed, color: T.faint }}>
        {LEARN_DISCLAIMER}
      </footer>

      {activeId && <ConceptModal id={activeId} read={!!readLessons[activeId]} onToggleRead={() => toggleRead(activeId)} onClose={() => setActiveId(null)} />}
    </div>
  );
}

export function KpiPill({ onClick }) {
  const d = useDerived();
  const { state } = useStore();
  const mobile = useIsMobile();
  const [hover, setHover] = useState(false);
  // Más presencia en escritorio (tamaño/padding/sparkline mayores); en móvil se
  // mantiene compacto. Usa el breakpoint del proyecto (useIsMobile).
  const sw = mobile ? 24 : 34, sh = mobile ? 9 : 12;
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} aria-label={`Edad de libertad ${d.verdictAge != null ? Math.ceil(d.verdictAge) : '—'}. Patrimonio proyectado ${fmtEur(d.finalPlan.portfolio)}. ${d.verdictCopy}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: mobile ? 8 : 10,
      padding: mobile ? '5px 11px' : '8px 16px',
      background: T.ink, color: T.bg, borderRadius: 999,
      border: 'none', cursor: 'pointer',
      opacity: hover ? 0.88 : 1, transition: 'opacity .15s ease',
      fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto',
    }}>
      {/* Prefijo = edad de libertad (verdictAge), coherente con el hero (antes mostraba retireAge). */}
      <span style={{ fontFamily: T.mono, fontSize: mobile ? 9 : 11, letterSpacing: '0.12em', color: 'rgba(245,240,230,0.6)' }}>
        {d.verdictAge != null ? `★ ${Math.ceil(d.verdictAge)}` : `${state.profile.retireAge}→`}
      </span>
      <span style={{ fontStyle: 'italic', fontSize: mobile ? T.size.body : 20 }}>
        {/* Coherencia de cifras · patrimonio final en NOMINAL (sin deflactar): la app
            muestra cifras futuras en euros corrientes por defecto. Mismo valor que el
            "invertido" del M1, las monedas del M2 y el hero de Proyección. */}
        {fmtEur(d.finalPlan.portfolio)}
      </span>
      <svg width={sw} height={sh} style={{ marginLeft: 2 }}>
        <path d={(() => {
          const pts = d.seriesActualPace.filter((_, i) => i % 12 === 0);
          if (pts.length < 2) return '';
          const max = Math.max(...pts.map(p => p.portfolio));
          const min = Math.min(...pts.map(p => p.portfolio));
          const range = max - min || 1;
          return pts.map((p, i) => {
            const x = (i / (pts.length - 1)) * sw;
            const y = (sh - 1) - ((p.portfolio - min) / range) * (sh - 2);
            return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
          }).join(' ');
        })()} stroke={T.bg} strokeWidth="1.4" fill="none" />
      </svg>
    </button>
  );
}

// Logo «Mi Plan» con DESPLEGABLE asociado · funciona en cualquier pantalla (dashboard,
// onboarding). Autocontenido: gestiona su propio popover + AboutModal. «Ver presentación» usa
// el global window.__openLanding (el Shell renderiza la Landing en modo view). Cero red.
export function LogoMenu({ fontSize = 28 }) {
  const [open, setOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const anchorRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e) => { if (anchorRef.current && anchorRef.current.contains(e.target)) return; setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);
  const Item = ({ children, onClick: handle }) => (
    <button onClick={() => { setOpen(false); handle && handle(); }} style={{
      display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px',
      background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: T.serif, fontSize: T.size.body, color: T.ink, whiteSpace: 'nowrap',
    }}>{children}</button>
  );
  return (
    <div ref={anchorRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Menú de Mi Plan" aria-expanded={open}
        style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontStyle: 'italic', fontSize, color: T.accent, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1 }}>
        Mi Plan
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 300, minWidth: 184, background: T.paper, border: '1px solid ' + T.line, borderRadius: 8, padding: '6px 0', boxShadow: '0 6px 16px rgba(26,22,18,0.18)' }}>
          <Item onClick={() => window.__openLanding && window.__openLanding()}>Ver presentación</Item>
          <Item onClick={() => setShowAbout(true)}>Acerca de</Item>
          <Item onClick={() => setShowAbout(true)}>Apóyanos</Item>
        </div>
      )}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export function AccountMenu({ open, anchor, onClose, onGoToAjustes, onShowAbout }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e) => {
      if (anchor && anchor.contains(e.target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, anchor, onClose]);
  if (!open) return null;
  const Item = ({ children, onClick: handle }) => (
    <button onClick={() => { handle && handle(); onClose(); }} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '8px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: T.serif, fontSize: T.size.body, color: T.ink,
    }}>{children}</button>
  );
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
      minWidth: 160, background: T.paper, border: '1px solid ' + T.line,
      borderRadius: 8, padding: '6px 0',
      boxShadow: '0 6px 16px rgba(26,22,18,0.18)',
    }}>
      <Item onClick={onGoToAjustes}>Exportar datos</Item>
      <Item onClick={onGoToAjustes}>Borrar todo</Item>
      <Item onClick={onShowAbout}>Acerca de</Item>
    </div>
  );
}

// Encuadre lateral compartido por TODAS las pantallas (columna centrada en
// escritorio). Fuente única del ancho de contenido; antes cada pantalla repetía el
// suyo (Plan 720 centrado, Aprende/Ajustes 880, resto full-width → desnivel).
const CONTENT_MAX = 720;

// Vista HOGAR · habla en plural y agrega TODAS las cuentas. Diagrama compartido e interactivo:
// toggle uno/otra/todos → MultiLineChart con la curva de patrimonio de cada persona + la combinada
// (suma alineada por «años desde hoy», no por edad: las personas tienen edades distintas). Solo se
// monta como tab cuando hay 2+ cuentas. Reusa projectV2/scenarioSummary/sumAllocation. Cero red.
export function ScreenHogar() {
  const { accounts, switchAccount } = useStore();
  const list = useMemo(() => Object.values(accounts || {}), [accounts]);
  const [view, setView] = useState('todos');
  const PALETTE = [T.accent, T.green, T.amber, T.muted, T.faint];

  const people = useMemo(() => list.map((a, i) => {
    const st = a.state || {};
    const plan = st.plan || {};
    const profile = st.profile || {};
    let series = [];
    try {
      const eff = computeEffectiveCapitalReturn(plan);
      series = projectV2(plan, profile, { capital: plan.capital || 0, endAge: 90, includeHypothetical: false, effectiveReturn: eff }) || [];
    } catch (e) {}
    // X = años desde hoy (monthIndex/12), no la edad → alineable entre personas de distinta edad.
    const yfn = series.map((r) => ({ m: r.monthIndex || 0, age: (r.monthIndex || 0) / 12, portfolio: r.portfolio || 0 }));
    const months = st.months || [];
    const portfolioNow = (plan.capital || 0) + months.reduce((s, m) => s + (m.actual || 0), 0);
    let aporte = 0, edad = null, rvPct = null;
    try { aporte = Math.round(currentMonthlyAporte(plan) || 0); edad = scenarioSummary(st).edadLibertad; } catch (e) {}
    const al = plan.actualLife;
    const totA = al ? sumAllocation(al) : 0;
    if (al && al.completed && totA > 0) rvPct = (((al.allocation.fundsEtfs || 0) + (al.allocation.pensionPlan || 0)) / totA);
    return { id: a.id, label: a.label, color: PALETTE[i % PALETTE.length], yfn, portfolioNow, aporte, edad, rvPct };
  }), [list]);

  // Curva combinada del hogar: suma de carteras por mes-desde-hoy (mismo grid en todas).
  const combined = useMemo(() => {
    const map = {};
    people.forEach((p) => p.yfn.forEach((r) => { map[r.m] = (map[r.m] || 0) + r.portfolio; }));
    return Object.keys(map).map((k) => ({ age: (+k) / 12, portfolio: map[k] })).sort((a, b) => a.age - b.age);
  }, [people]);

  const totalNow = people.reduce((s, p) => s + p.portfolioNow, 0);
  const totalAporte = people.reduce((s, p) => s + p.aporte, 0);
  // Rebalanceo del hogar · RV conjunta ponderada por patrimonio.
  const hhRV = (() => {
    let port = 0, rv = 0;
    people.forEach((p) => { if (p.rvPct != null) { port += p.portfolioNow; rv += p.portfolioNow * p.rvPct; } });
    return port > 0 ? Math.round((rv / port) * 100) : null;
  })();

  const allScenarios = [
    ...people.map((p) => ({ id: p.id, label: p.label, color: p.color, series: p.yfn, bold: false })),
    { id: 'todos', label: 'Juntos', color: T.ink, series: combined, bold: true },
  ];
  const shown = view === 'todos' ? allScenarios : allScenarios.filter((s) => s.id === view);

  if (list.length < 2) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <div>
        <SectionTag>Vuestro hogar</SectionTag>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, letterSpacing: T.tracking.display, marginTop: 4, lineHeight: T.lh.tight, textWrap: 'pretty' }}>
          Entre {list.length === 2 ? 'los dos' : 'todos'} tenéis <em style={{ color: T.accent }}>{fmtEur(totalNow)}</em> hoy.
          <span style={{ color: T.muted }}> Y cada mes sumáis {fmtEur(totalAporte)} a vuestro futuro.</span>
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 10, lineHeight: T.lh.normal, maxWidth: 620 }}>
          Aquí cuenta lo de cada uno y lo de todos juntos. El plan de cada persona se afina en su pestaña; aquí veis cómo suma.
        </div>
      </div>

      {/* Toggle interactivo · uno / otra / todos */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div role="group" aria-label="Ver el hogar" style={{ display: 'inline-flex', gap: 3, padding: 3, background: T.panel, borderRadius: 999, border: '1px solid ' + T.line, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[...people.map((p) => ({ id: p.id, label: p.label })), { id: 'todos', label: 'Todos' }].map((o) => {
            const active = view === o.id;
            return (
              <button key={o.id} onClick={() => setView(o.id)} aria-pressed={active}
                style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', padding: '5px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: active ? T.accent : 'transparent', color: active ? T.bg : T.muted, transition: 'background .15s ease, color .15s ease', appearance: 'none', WebkitAppearance: 'none' }}>{o.label}</button>
            );
          })}
        </div>
      </div>

      {/* Diagrama compartido */}
      <Card>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>
          {shown.map((s) => (
            <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 3, background: s.color, borderRadius: 2, display: 'inline-block' }} />{s.label}
            </span>
          ))}
        </div>
        <MultiLineChart scenarios={shown} height={300} />
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.faint, marginTop: 8 }}>
          Patrimonio proyectado · eje horizontal en años desde hoy.
        </div>
      </Card>

      {/* Cada persona · clic para ir a su plan */}
      <Card>
        <Label style={{ marginBottom: 10 }}>Cada uno</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {people.map((p) => (
            <button key={p.id} onClick={() => switchAccount(p.id)} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: T.paper, border: '1px solid ' + T.line, cursor: 'pointer', textAlign: 'left', fontFamily: T.serif, color: T.ink }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: p.color, flexShrink: 0 }} />
              <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.body, letterSpacing: T.tracking.tight }}>{p.label}{p.edad != null && <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.green, marginLeft: 8, letterSpacing: 0 }}>★ libre a los {p.edad}</span>}</span>
              <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wide, textAlign: 'right' }}>{fmtEur(p.portfolioNow)} · {fmtEur(p.aporte)}/mes</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Rebalanceo del hogar · RV conjunta ponderada por patrimonio. */}
      {hhRV != null && (
        <Card>
          <SectionTag style={{ marginBottom: 8 }}>Rebalanceo del hogar</SectionTag>
          <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.normal }}>
            Entre {list.length === 2 ? 'los dos' : 'todos'} tenéis <strong style={{ fontStyle: 'normal', color: hhRV >= 65 ? T.green : T.amber }}>{hhRV} %</strong> de vuestro patrimonio en renta variable (fondos y planes). {hhRV >= 65 ? 'Es un reparto razonable para vuestro horizonte.' : 'En conjunto vais algo conservadores: hay margen para mover parte a fondos.'} Cada uno ajusta el suyo en su pestaña de Datos.
          </div>
        </Card>
      )}
    </div>
  );
}

export function Shell() {
  const { state, update, seedDemo, accounts } = useStore();
  const mobile = useIsMobile();
  // Tab «Hogar» solo con 2+ cuentas (un hogar son varias personas).
  const isHousehold = Object.keys(accounts || {}).length > 1;
  const [showLanding, setShowLanding] = useState(false);
  // v5.8 · Manifesto modal triggered by the secondary CTA of LandingPreOnboarding.
  const [showManifesto, setShowManifesto] = useState(false);
  // B8 · Revisit-mode landing, triggered by header logo or Ajustes button.
  // Does NOT toggle the persisted hasSeenLandingPreOnboarding flag.
  const [showRevisitLanding, setShowRevisitLanding] = useState(false);
  // v1.1.1 · Global concept opener — used by GoalContextualBlock to jump
  // straight to a lesson modal without changing tabs.
  const [globalConceptId, setGlobalConceptId] = useState(null);
  // v1.4.0b SP-06 · Account popover anchored to the desktop top-nav circle.
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountAnchorRef = useRef(null);
  // v1.5.0a · About modal triggered from AccountMenu.
  const [showAbout, setShowAbout] = useState(false);
  useEffect(() => {
    window.__openLanding = () => setShowLanding(true);
    window.__openRevisitLanding = () => setShowRevisitLanding(true);
    window.__openLearnConcept = (id) => setGlobalConceptId(id);
    return () => { delete window.__openLanding; delete window.__openRevisitLanding; delete window.__openLearnConcept; };
  }, []);
  const tab = state.activeTab || 'hoy';
  // v1.2.1 Item 5 · Resetea scroll al cambiar de tab. Guard evita resetear
  // si el usuario re-clica el tab activo (mantenemos posición).
  const setTab = (t) => {
    if (t === state.activeTab) return;
    update({ activeTab: t });
    requestAnimationFrame(() => {
      try { window.scrollTo({ top: 0, behavior: 'instant' }); }
      catch (e) { window.scrollTo(0, 0); }
    });
  };

  // v5.7 · Normalise legacy persisted activeTab values to the new nav.
  // Old: 'plan' (now in Ajustes), 'mes' (now in Seguimiento).
  // We do this once on mount; subsequent navigations use the new ids directly.
  useEffect(() => {
    if (!state.onboardingComplete) return;
    if (state.activeTab === 'plan') update({ activeTab: 'ajustes' });
    else if (state.activeTab === 'mes') update({ activeTab: 'seguimiento' });
  }, []);

  // v5.8 · Pre-onboarding landing for fresh users.
  // B8 · Also shown one-off to v1.0 migrated users via the v1_1_0_landing_reset
  // migration. When the user clicks "Empezar →", the flag flips and we
  // either land them on the existing Landing (if they haven't completed
  // onboarding) or directly on the dashboard (if they have).
  // Primer arranque · UNA sola bienvenida (LandingPreOnboarding) → onboarding. La Landing
  // grande («Tu dinero a treinta años vista») deja de ser pantalla obligatoria y pasa a ser
  // «la presentación» (botón en Datos → window.__openLanding). landingSeen se conserva como
  // campo (se marca aquí) pero ya NO gatea el arranque.
  // La presentación (Landing en modo view) se comprueba ANTES de los guards de bienvenida/
  // onboarding → el logo-menú «Ver presentación» funciona en CUALQUIER estado, incl. onboarding.
  if (showLanding) return <Landing mode="view" onClose={() => setShowLanding(false)} />;
  if (!state.hasSeenLandingPreOnboarding) {
    return (
      <>
        <LandingPreOnboarding
          mode="intro"
          onStart={() => update({ hasSeenLandingPreOnboarding: true, landingSeen: true })}
          onOpenManifesto={() => setShowManifesto(true)}
          onLoadDemo={() => seedDemo()}
        />
        {showManifesto && <WhyDifferentModal onClose={() => setShowManifesto(false)} />}
      </>
    );
  }
  if (!state.onboardingComplete) return <Onboarding />;
  // B8 · Revisit mode: header logo or Ajustes button → landing without flag side-effects.
  if (showRevisitLanding) {
    return (
      <>
        <LandingPreOnboarding
          mode="revisit"
          onBack={() => setShowRevisitLanding(false)}
          onOpenManifesto={() => setShowManifesto(true)}
        />
        {showManifesto && <WhyDifferentModal onClose={() => setShowManifesto(false)} />}
      </>
    );
  }

  // v5.7 · Nav final: 5 secciones. "Sin Mi Plan" deja de ser ruta de nav (sub-prompt D la integra como desplegable en Mi Plan), "Plan" desaparece (config → Ajustes), "Mes a mes" se absorbe en Seguimiento.
  const tabs = [
    { id: 'hoy', label: 'Plan', symbol: '◐' },
    { id: 'proy', label: 'Proyección', symbol: '◢' },
    ...(isHousehold ? [{ id: 'hogar', label: 'Hogar', symbol: '◈' }] : []),
    { id: 'seguimiento', label: 'Seguimiento', symbol: '◧' },
    { id: 'aprender', label: 'Aprende', symbol: '◇' },
    { id: 'ajustes', label: 'Datos', symbol: '◌' },
  ];

  if (mobile) return (
    <>
    <div style={{ width: '100vw', minHeight: '100vh', background: T.bg, color: T.ink, fontFamily: T.serif, display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '10px 14px', background: T.panel, borderBottom: '1px solid ' + T.line, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <LogoMenu fontSize={22} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <KpiPill onClick={() => setTab('proy')} />
          <div style={{ position: 'relative' }} ref={accountAnchorRef}>
            <button onClick={() => setShowAccountMenu(v => !v)} aria-label="Menú de cuenta" style={{
              width: 24, height: 24, borderRadius: '50%', background: T.line,
              border: 'none', cursor: 'pointer', padding: 0,
            }} />
            <AccountMenu open={showAccountMenu} anchor={accountAnchorRef.current} onClose={() => setShowAccountMenu(false)} onGoToAjustes={() => setTab('ajustes')} onShowAbout={() => setShowAbout(true)} />
          </div>
        </div>
      </header>
      <main style={{ flex: 1, padding: '20px 12px 100px', overflowX: 'hidden', minWidth: 0, maxWidth: '100vw' }}>
        <div key={tab} className="tab-enter" style={{ minWidth: 0 }}>
          {tab === 'hoy' && <ScreenHoy goTo={setTab} />}
          {tab === 'sinplan' && <ScreenHoy goTo={setTab} />}
          {tab === 'proy' && <ScreenProyeccion />}
          {tab === 'hogar' && <ScreenHogar />}
          {tab === 'seguimiento' && <ScreenSeguimiento />}
          {tab === 'aprender' && <ScreenAprende />}
          {tab === 'ajustes' && <ScreenAjustes />}
        </div>
      </main>
      <footer style={{ padding: '14px 16px 80px', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.widest, textTransform: 'uppercase', textAlign: 'center' }}>
        Datos guardados en local · Mi Plan v1.5.0a3
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, textTransform: 'none', color: T.faint, marginTop: 8, lineHeight: T.lh.normal }}>
          Herramienta de proyección, no de asesoramiento financiero. No garantiza rentabilidades.
        </div>
      </footer>
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.panel, borderTop: '1px solid ' + T.line, display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 0 10px', background: 'transparent', border: 'none',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: tab === t.id ? T.accent : T.faint,
            borderTop: '2px solid ' + (tab === t.id ? T.accent : 'transparent'),
            marginTop: tab === t.id ? -1 : 0,
          }}>
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, lineHeight: 1 }}>{t.symbol}</span>
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontStyle: 'italic', fontSize: 10, lineHeight: 1.1 }}>{
              t.label === 'Proyección' ? 'Proy.' :
              t.label === 'Seguimiento' ? 'Seguim.' :
              t.label
            }</span>
          </button>
        ))}
      </nav>
    </div>
    {globalConceptId && <ConceptModal id={globalConceptId} onClose={() => setGlobalConceptId(null)} />}
    {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );

  return (
    <>
    <div style={{ width: '100vw', minHeight: '100vh', background: T.bg, color: T.ink, fontFamily: T.serif, display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: T.panel, borderBottom: '1px solid ' + T.line, padding: '14px clamp(24px, 3vw, 48px)', display: 'flex', alignItems: 'center', gap: 28 }}>
        <LogoMenu fontSize={28} />
        <nav style={{ display: 'flex', gap: 24, flex: 1 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontStyle: 'italic', fontSize: T.size.lead,
              background: 'transparent', border: 'none',
              borderBottom: '2px solid ' + (tab === t.id ? T.accent : 'transparent'),
              paddingBottom: 4, cursor: 'pointer',
              color: tab === t.id ? T.ink : T.muted,
            }}>{t.label}</button>
          ))}
        </nav>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <KpiPill onClick={() => setTab('proy')} />
          <div style={{ position: 'relative' }} ref={accountAnchorRef}>
            <button onClick={() => setShowAccountMenu(v => !v)} aria-label="Menú de cuenta" style={{
              width: 28, height: 28, borderRadius: '50%', background: T.line,
              border: 'none', cursor: 'pointer', padding: 0,
            }} />
            <AccountMenu open={showAccountMenu} anchor={accountAnchorRef.current} onClose={() => setShowAccountMenu(false)} onGoToAjustes={() => setTab('ajustes')} onShowAbout={() => setShowAbout(true)} />
          </div>
        </div>
      </header>
      <main style={{ flex: 1, padding: '40px clamp(24px, 3vw, 48px)', overflowX: 'hidden', minWidth: 0 }}>
        <div key={tab} className="tab-enter" style={{ minWidth: 0, maxWidth: CONTENT_MAX, margin: '0 auto' }}>
          {tab === 'hoy' && <ScreenHoy goTo={setTab} />}
          {tab === 'sinplan' && <ScreenHoy goTo={setTab} />}
          {tab === 'proy' && <ScreenProyeccion />}
          {tab === 'hogar' && <ScreenHogar />}
          {tab === 'seguimiento' && <ScreenSeguimiento />}
          {tab === 'aprender' && <ScreenAprende />}
          {tab === 'ajustes' && <ScreenAjustes />}
        </div>
      </main>
      <footer style={{ padding: '20px clamp(24px, 3vw, 48px)', borderTop: '1px solid ' + T.lineSoft, fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.widest, textTransform: 'uppercase' }}>
        Datos guardados en local · Mi Plan v1.5.0a3
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0, textTransform: 'none', color: T.faint, marginTop: 8, lineHeight: T.lh.normal }}>
          Herramienta de proyección, no de asesoramiento financiero. No garantiza rentabilidades.
        </div>
      </footer>
    </div>
    {globalConceptId && <ConceptModal id={globalConceptId} onClose={() => setGlobalConceptId(null)} />}
    {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}

export function App() {
  return (
    <StateProvider>
      <Shell />
    </StateProvider>
  );
}
