// App completa (screens + fragmentos + editores + cards-con-state + onboardings
// + Shell + App) — extraída byte-a-byte de mi_plan_v1_5_0a_3.html. Etapa 1 ·
// Paso 3 · Tanda final. Consolidada en un módulo por su acoplamiento (fragmentos
// compartidos), para evitar imports circulares. Solo se añade imports/export.
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { T, WEB_URL } from '../tokens/index.js'
import {
  project, monthlyForGoal, uid, todayKey, addMonthsKey,
  compareKeys, isKeyInSegment, findActiveSegment, sumActiveSegments, detectSegmentOverlaps,
  readableMonth, projectV2, sumExpenses,
  buildMortgageSchedule, currentMonthlyAporte, computePlannedFor,
  computeIncomeFor, toRealEur, estimateSpanishPension,
  runMonteCarlo,
  getSavingsTier, seedMonths, defaultGoals, computeUserProfile, projectStandardPlan, computeActivePhase,
  computeSinPlanKPIs, fmtEur, fmtEurFull,
} from '../lib/index.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import {
  EditableNumber, Slider, Pill, Card, Label, Btn, NextStep, MonthInput, Stat, SmallStat, Row, RowWithWarning,
  LegendChip, LearnIcon,
} from '../ui/index.jsx'
import {
  LineChart, Sparkline, LifecycleChart, LifecycleChartDual, MultiLineChart, FlowTimelineCard,
} from '../charts/index.jsx'
import {
  TABLON, LEARN_CORPUS, CATEGORY_LABELS, GOAL_CATEGORIES, GOAL_CATEGORY_LABEL, LEARN_DISCLAIMER,
  LEARN_LEVELS, LEARN_LEVEL_LABELS, LEARN_LEVEL_SUB, LEARN_LEVEL_BY_ID,
} from '../content/index.js'
import {
  ConfirmModal, WhyDifferentModal, MonthlyCalendarModal, PublicPensionDisclaimerModal,
  Concept, ConceptModal, AboutModal, ProgressionWizard,
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

export function TramoRow({ tramo, kind, hasOverlap, onChange, onDelete, onSplit }) {
  const [expanded, setExpanded] = useState(false);
  const isSaving = kind === 'saving';
  const isPercent = isSaving && tramo.type === 'percent';

  const subtitle = isSaving
    ? (isPercent
        ? `${tramo.value}% del ingreso`
        : `${fmtEur(tramo.value)}/mes`)
    : `${fmtEur(tramo.amount)}/mes`;
  // For percent savings, compute the resolved € amount as of "from" date for context
  const _ctx = useStore();
  const _activePlan = _ctx ? _ctx.activePlan : null;
  const percentResolved = (isSaving && isPercent && _activePlan && tramo.from)
    ? (sumActiveSegments(_activePlan.incomeSegments, tramo.from) + sumActiveSegments(_activePlan.bonusSegments, tramo.from)) * (Number(tramo.value) || 0) / 100
    : null;

  const dateRange = `${readableMonth(tramo.from)} → ${tramo.to ? readableMonth(tramo.to) : 'sin fin'}`;

  return (
    <div style={{
      border: '1px solid ' + (expanded ? T.accent : (hasOverlap ? T.amber : T.line)),
      borderRadius: 10, background: T.paper,
      overflow: 'hidden', transition: 'border-color 0.15s',
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: '12px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span>{tramo.label || (isSaving ? 'Aporte' : 'Tramo sin nombre')}</span>
            {hasOverlap && (
              <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.amber, background: 'rgba(180,83,9,0.10)', border: '1px solid ' + T.amber, padding: '2px 6px', borderRadius: 999, letterSpacing: T.tracking.wide, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>solape</span>
            )}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, marginTop: 4, letterSpacing: T.tracking.wide }}>
            {dateRange}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.accent, letterSpacing: T.tracking.tight }}>
            {subtitle}
          </div>
          {percentResolved != null && percentResolved > 0 && (
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, marginTop: 2, letterSpacing: T.tracking.wide }}>
              ≈ {fmtEur(percentResolved)}/mes
            </div>
          )}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: T.size.body, color: T.faint, marginLeft: 8 }}>
          {expanded ? '⌃' : '⌄'}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '4px 14px 14px', borderTop: '1px dashed ' + T.lineSoft, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div>
              <Label style={{ marginBottom: 4 }}>Desde</Label>
              <MonthInput value={tramo.from} onChange={(v) => onChange({ from: v })} />
            </div>
            <div>
              <Label style={{ marginBottom: 4 }}>Hasta · vacío = sin fin</Label>
              <MonthInput value={tramo.to} onChange={(v) => onChange({ to: v })} allowEmpty />
            </div>
          </div>
          {isSaving ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div>
                  <Label style={{ marginBottom: 4 }}>Tipo</Label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['fixed', 'percent'].map(t => (
                      <button key={t} onClick={() => onChange({ type: t })}
                        style={{
                          flex: 1, fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '8px 8px',
                          background: tramo.type === t ? T.ink : 'transparent',
                          color: tramo.type === t ? T.bg : T.muted,
                          border: '1px solid ' + (tramo.type === t ? T.ink : T.line),
                          borderRadius: 6, cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
                        }}>{t === 'fixed' ? 'Importe €' : '% Ingreso'}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label style={{ marginBottom: 4 }}>{isPercent ? 'Porcentaje (%)' : 'Importe (€)'}</Label>
                  <input type="number" value={tramo.value} onChange={(e) => onChange({ value: +e.target.value })}
                    style={{ fontFamily: T.mono, fontSize: T.size.caption, padding: '8px 10px', width: '100%', background: T.bg, border: '1px solid ' + T.line, borderRadius: 6, color: T.ink, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              {tramo.type === 'fixed' && _activePlan && (_activePlan.incomeSegments || []).length > 0 && (() => {
                const currentIncomeAtFrom = sumActiveSegments(_activePlan.incomeSegments, tramo.from || todayKey()) + sumActiveSegments(_activePlan.bonusSegments, tramo.from || todayKey());
                const suggestedPct = currentIncomeAtFrom > 0 ? Math.round((tramo.value || 0) / currentIncomeAtFrom * 100) : 15;
                return (
                  <div style={{ padding: '10px 12px', background: 'rgba(180,83,9,0.08)', border: '1px solid ' + T.amber, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.amber, lineHeight: T.lh.snug, fontStyle: 'italic' }}>
                      ⚠ Tu ahorro es fijo en €. Si cambian tus ingresos, no escala.
                    </div>
                    <button onClick={() => onChange({ type: 'percent', value: Math.max(1, suggestedPct) })}
                      style={{
                        fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '6px 12px', borderRadius: 999,
                        background: T.amber, color: '#fff', border: 'none', cursor: 'pointer',
                        letterSpacing: T.tracking.wide, textTransform: 'uppercase', alignSelf: 'flex-start', fontWeight: 600,
                      }}>Convertir a {Math.max(1, suggestedPct)}% del ingreso</button>
                  </div>
                );
              })()}
              {tramo.type === 'percent' && _activePlan && (_activePlan.incomeSegments || []).length > 0 && (() => {
                const currentIncomeAtFrom = sumActiveSegments(_activePlan.incomeSegments, tramo.from || todayKey()) + sumActiveSegments(_activePlan.bonusSegments, tramo.from || todayKey());
                const equivFixed = Math.round(currentIncomeAtFrom * (tramo.value || 0) / 100);
                return (
                  <div style={{ padding: '8px 10px', background: 'rgba(21,128,61,0.06)', border: '1px solid ' + T.green, borderRadius: 8, fontFamily: T.serif, fontSize: T.size.caption, color: T.green, lineHeight: T.lh.snug, fontStyle: 'italic' }}>
                    ✓ Ahorro proporcional · hoy son {fmtEur(equivFixed)}/mes y crecerá con tu sueldo.
                  </div>
                );
              })()}
            </>
          ) : (
            <div>
              <Label style={{ marginBottom: 4 }}>Importe mensual (€)</Label>
              <input type="number" value={tramo.amount} onChange={(e) => onChange({ amount: +e.target.value })}
                style={{ fontFamily: T.mono, fontSize: T.size.caption, padding: '7px 8px', width: '100%', background: T.bg, border: '1px solid ' + T.line, borderRadius: 6, color: T.ink, outline: 'none' }} />
            </div>
          )}
          <div>
            <Label style={{ marginBottom: 4 }}>Etiqueta</Label>
            <input value={tramo.label || ''} onChange={(e) => onChange({ label: e.target.value })}
              placeholder={isSaving ? 'Aporte mensual' : kind === 'bonus' ? 'Plus, dieta…' : 'Salario base'}
              style={{ fontFamily: T.serif, fontSize: T.size.body, padding: '7px 8px', width: '100%', background: T.bg, border: '1px solid ' + T.line, borderRadius: 6, color: T.ink, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px dashed ' + T.lineSoft }}>
            {onSplit && <Btn variant="ghost" size="sm" onClick={onSplit}>Partir</Btn>}
            <Btn variant="ghost" size="sm" onClick={onDelete} style={{ color: T.red, borderColor: T.red }}>Borrar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export function TramoListEditor({ tramos, onTramoChange, onAddTramo, onDeleteTramo, onSplitTramo, kind, title, helpText, onOpenWizard, onNormalize }) {
  const overlaps = useMemo(() => detectSegmentOverlaps(tramos), [tramos]);
  const overlapIds = useMemo(() => new Set(overlaps.flat()), [overlaps]);
  // A4 · When the list grows beyond 5 items, collapse the middle section.
  // Render the first 2 and last 2 plus a clickable "+N intermedios" placeholder.
  const [expanded, setExpanded] = useState(false);
  const total = tramos.length;
  const isCollapsible = total > 5 && !expanded;
  const renderItems = isCollapsible
    ? [
        { kind: 'tramo', tramo: tramos[0] },
        { kind: 'tramo', tramo: tramos[1] },
        { kind: 'collapsed', count: total - 4 },
        { kind: 'tramo', tramo: tramos[total - 2] },
        { kind: 'tramo', tramo: tramos[total - 1] },
      ]
    : tramos.map(t => ({ kind: 'tramo', tramo: t }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ flex: '1 1 100%' }}>
          <Label>{title}</Label>
          {helpText && <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic', marginTop: 4 }}>{helpText}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end' }}>
          {onOpenWizard && <Btn variant="ghost" size="sm" onClick={onOpenWizard}>✨ Asistente progresión</Btn>}
          <Btn variant="accent" size="sm" onClick={onAddTramo}>+ Tramo</Btn>
        </div>
      </div>
      {overlaps.length > 0 && (
        <div style={{
          padding: '12px 14px', background: 'rgba(180,83,9,0.10)', border: '1px solid ' + T.amber, borderRadius: 10,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.amber, lineHeight: T.lh.normal }}>
            ⚠ Hay <strong style={{ color: T.amber, fontStyle: 'normal' }}>{overlaps.length} solape{overlaps.length === 1 ? '' : 's'}</strong> entre tramos.
            {kind === 'saving' ? ' Cuando dos tramos de ahorro se pisan, el último creado manda — pero suele ser un error.' :
              ' Cuando varios tramos del mismo tipo se pisan, se SUMAN. Si no es lo que querías, ordénalos.'}
          </div>
          <Btn variant="ghost" size="sm" onClick={onNormalize} style={{ alignSelf: 'flex-start', color: T.amber, borderColor: T.amber }}>
            ↻ Auto-ordenar y resolver solapes
          </Btn>
        </div>
      )}
      {tramos.length === 0 && (
        <div style={{ padding: 18, border: '1px dashed ' + T.line, borderRadius: 10, textAlign: 'center', fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption }}>
          {kind === 'income' ? 'Sin tramos de ingreso definidos. Añade uno para empezar.' :
           kind === 'bonus' ? 'Sin complementos. Añade pluses, dietas o variables.' :
           'Sin tramos de aporte. Añade al menos uno para que el motor calcule.'}
        </div>
      )}
      {renderItems.map((item, idx) => {
        if (item.kind === 'collapsed') {
          return (
            <button key={'collapsed-' + idx} onClick={() => setExpanded(true)} style={{
              padding: '12px 14px',
              border: '1px dashed ' + T.line,
              borderRadius: 10,
              background: T.panel,
              cursor: 'pointer',
              fontFamily: T.mono,
              fontSize: T.size.eyebrow,
              color: T.muted,
              letterSpacing: T.tracking.wider,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>
              + {item.count} tramos intermedios (mostrar todos)
            </button>
          );
        }
        const t = item.tramo;
        return (
          <TramoRow key={t.id} tramo={t} kind={kind}
            hasOverlap={overlapIds.has(t.id)}
            onChange={(patch) => onTramoChange(t.id, patch)}
            onDelete={() => onDeleteTramo(t.id)}
            onSplit={onSplitTramo ? () => onSplitTramo(t.id) : null} />
        );
      })}
      {expanded && total > 5 && (
        <button onClick={() => setExpanded(false)} style={{
          padding: '8px 14px',
          background: 'transparent',
          border: 'none',
          color: T.muted,
          cursor: 'pointer',
          fontFamily: T.mono,
          fontSize: T.size.eyebrow,
          letterSpacing: T.tracking.wider,
          textTransform: 'uppercase',
          alignSelf: 'flex-start',
        }}>
          ↑ Colapsar intermedios
        </button>
      )}
    </div>
  );
}

export function EventListEditor({ events, onChange, onAdd, onDelete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Label>Eventos y boosts</Label>
          <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic', marginTop: 4 }}>
            Bonus, herencias, ventas puntuales. Toca el botón para marcar como posible.
          </div>
        </div>
        <Btn variant="ghost" size="sm" onClick={onAdd}>+ Evento</Btn>
      </div>
      {events.length === 0 && (
        <div style={{ padding: 18, border: '1px dashed ' + T.line, borderRadius: 10, textAlign: 'center', fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption }}>
          Sin eventos. Añade aportes puntuales o escenarios.
        </div>
      )}
      {[...events].sort((a,b) => compareKeys(a.date, b.date)).map(e => (
        <div key={e.id} style={{
          display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px',
          background: e.status === 'hipotetico' ? 'rgba(180,83,9,0.05)' : T.paper,
          border: '1px solid ' + (e.status === 'hipotetico' ? T.amber : T.line),
          borderStyle: e.status === 'hipotetico' ? 'dashed' : 'solid',
          borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <input value={e.label || ''} onChange={(ev) => onChange(e.id, { label: ev.target.value })}
              placeholder="Bonus, herencia…"
              style={{ fontFamily: T.serif, fontSize: T.size.lead, padding: '4px 0', background: 'transparent', border: 'none', borderBottom: '1px dashed ' + T.lineSoft, color: T.ink, outline: 'none', flex: 1, minWidth: 0 }} />
            <button onClick={() => onDelete(e.id)} style={{ background: 'transparent', border: 'none', color: T.faint, fontSize: T.size.subtitle, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            <div>
              <Label style={{ marginBottom: 4 }}>Fecha</Label>
              <MonthInput value={e.date} onChange={(v) => onChange(e.id, { date: v })} />
            </div>
            <div>
              <Label style={{ marginBottom: 4 }}>Importe (€)</Label>
              <input type="number" value={e.amount} onChange={(ev) => onChange(e.id, { amount: +ev.target.value })}
                style={{ fontFamily: T.mono, fontSize: T.size.caption, padding: '8px 10px', background: T.bg, border: '1px solid ' + T.line, borderRadius: 6, color: T.ink, outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'right' }} />
            </div>
          </div>
          <button onClick={() => onChange(e.id, { status: e.status === 'confirmado' ? 'hipotetico' : 'confirmado' })}
            style={{
              fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '7px 12px', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
              background: e.status === 'confirmado' ? T.green : 'transparent',
              color: e.status === 'confirmado' ? '#fff' : T.amber,
              border: '1px solid ' + (e.status === 'confirmado' ? T.green : T.amber),
              borderRadius: 999, cursor: 'pointer', alignSelf: 'flex-start',
            }}>{e.status === 'confirmado' ? '✓ Confirmado' : '? Posible — toca para confirmar'}</button>
        </div>
      ))}
    </div>
  );
}

export function DisplayModeToggle() {
  const { state, update, activePlan } = useStore();
  const mode = state.displayMode || 'nominal';
  const on = mode === 'real';
  const infl = activePlan.inflationRate != null ? activePlan.inflationRate : 2.5;
  const toggle = () => update({ displayMode: on ? 'nominal' : 'real' });
  return (
    <div
      title={on
        ? ('Cifras en poder adquisitivo actual (descuenta ' + infl + '% anual)')
        : 'Cifras en valor nominal (sin descontar inflación)'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '6px 12px',
        background: T.panel, borderRadius: 999, border: '1px solid ' + T.line,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
      <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.muted }}>
        Ajustar por inflación
      </span>
      <button onClick={toggle}
        aria-pressed={on}
        aria-label={on ? 'Desactivar ajuste por inflación' : 'Activar ajuste por inflación'}
        style={{
          position: 'relative', width: 40, height: 22, padding: 0,
          background: on ? T.accent : T.line,
          border: 'none', borderRadius: 999, cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 20 : 2,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        }} />
      </button>
      <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, color: on ? T.accent : T.faint, fontWeight: 600 }}>
        {on ? 'I' : 'O'}
      </span>
    </div>
  );
}

export function RetirementCard({ plan, profile, d, realMode, inflRate }) {
  const withdrawalRate = plan.withdrawalRate != null ? plan.withdrawalRate : 4.0;
  const lifeExp = plan.lifeExpectancy || 90;
  const yearsInRetirement = lifeExp - profile.retireAge;

  const pen = plan.publicPension || { enabled: false };
  const pensionEnabled = pen.enabled && (pen.monthlyAmount || 0) > 0;
  const pensionMonthlyNominal = pensionEnabled ? pen.monthlyAmount : 0;
  const pensionStartAge = pen.startAge || 67;

  // The year-1 monthly withdrawal in nominal euros
  const monthlyIncomeNominal = d.retirementMonthlyIncome || 0;
  // Convert to today's euros (months between today and retire date)
  const monthsToRetire = (profile.retireAge - profile.age) * 12;
  const monthlyIncomeReal = toRealEur(monthlyIncomeNominal, monthsToRetire, inflRate);
  // Show in the user's selected mode
  const showMonthlyIncome = realMode ? monthlyIncomeReal : monthlyIncomeNominal;

  // Pension at start age in real (today's) euros
  const monthsToPension = (pensionStartAge - profile.age) * 12;
  const pensionReal = toRealEur(pensionMonthlyNominal, monthsToPension, inflRate);
  const showPension = realMode ? pensionReal : pensionMonthlyNominal;

  // Combined monthly income (when pension is active)
  // If pension starts at retire age: combined from year 1
  // If pension starts later: portfolio first, then portfolio + pension
  const pensionAtRetire = pensionStartAge <= profile.retireAge ? pensionMonthlyNominal : 0;
  const totalAtRetireNominal = monthlyIncomeNominal + pensionAtRetire;
  const totalAtRetireReal = toRealEur(totalAtRetireNominal, monthsToRetire, inflRate);
  const showTotalAtRetire = realMode ? totalAtRetireReal : totalAtRetireNominal;

  // Final portfolio at life-end (legacy / herencia)
  const finalPortfolioNominal = d.portfolioAtLifeEnd || 0;
  const totalMonthsToEnd = (lifeExp - profile.age) * 12;
  const finalPortfolioReal = toRealEur(finalPortfolioNominal, totalMonthsToEnd, inflRate);
  const showFinalPortfolio = realMode ? finalPortfolioReal : finalPortfolioNominal;

  const depletedAge = d.depletedAtAge;
  const willDeplete = depletedAge != null && depletedAge < lifeExp;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <Label>Tu retiro · {profile.retireAge} a {lifeExp} años</Label>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 4, lineHeight: T.lh.normal }}>
            <Concept id="regla-4">Regla del <strong style={{ color: T.ink, fontStyle: 'normal' }}>{withdrawalRate}%</strong></Concept> de Bengen: retiras ese porcentaje el primer año, luego lo ajustas por <Concept id="inflacion">inflación</Concept> cada año.
            {pensionEnabled && <> + pensión pública desde los <strong style={{ color: T.ink, fontStyle: 'normal' }}>{pensionStartAge}</strong>.</>}
          </div>
        </div>
      </div>

      {/* Income breakdown: portfolio + pension */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div style={{ padding: '12px 14px', background: T.panel, borderRadius: 10, border: '1px solid ' + T.line }}>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>
            De tu cartera
          </div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.accent, letterSpacing: T.tracking.tight }}>
            {fmtEur(showMonthlyIncome)}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 4, letterSpacing: T.tracking.wide }}>
            {withdrawalRate}% × patrimonio jubilación
          </div>
        </div>

        {pensionEnabled && (
          <div style={{ padding: '12px 14px', background: T.panel, borderRadius: 10, border: '1px solid ' + T.line }}>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>
              Pensión pública
            </div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.green, letterSpacing: T.tracking.tight }}>
              {fmtEur(showPension)}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 4, letterSpacing: T.tracking.wide }}>
              desde {pensionStartAge} años
            </div>
          </div>
        )}

        <div style={{ padding: '12px 14px', background: T.ink, color: T.bg, borderRadius: 10 }}>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
            Total al jubilarte
          </div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, letterSpacing: T.tracking.tight }}>
            {fmtEur(showTotalAtRetire)}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: 'rgba(255,255,255,0.45)', marginTop: 4, letterSpacing: T.tracking.wide }}>
            {realMode ? `${fmtEur(totalAtRetireNominal)} con inflación` : `${fmtEur(totalAtRetireReal)} sin inflación`}
          </div>
        </div>
      </div>

      {/* Depletion / final patrimony */}
      <div style={{ padding: '10px 14px', background: willDeplete ? 'rgba(185,28,28,0.08)' : 'rgba(21,128,61,0.06)',
        border: '1px solid ' + (willDeplete ? T.red : T.green), borderRadius: 10, display: 'flex',
        flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {willDeplete ? (
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.red, lineHeight: T.lh.snug }}>
              ⚠ La cartera se agotaría a los <strong style={{ fontStyle: 'normal' }}>{Math.round(depletedAge)}</strong>. Faltarían {Math.round(lifeExp - depletedAge)} años hasta tu esperanza de vida.
              {pensionEnabled && <> La pensión seguiría pagando {fmtEur(pensionMonthlyNominal)}/mes pero sin colchón.</>}
            </div>
          ) : (
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.green, lineHeight: T.lh.snug }}>
              ✓ A los {lifeExp} aún tendrás <strong style={{ fontStyle: 'normal', color: T.green }}>{fmtEur(showFinalPortfolio)}</strong>. Herencia o colchón si vives más.
            </div>
          )}
        </div>
      </div>

      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.faint, marginTop: 12, lineHeight: T.lh.normal, paddingTop: 12, borderTop: '1px dashed ' + T.lineSoft }}>
        Nota: proyección determinista (retorno constante {plan.annualReturn}%, sin riesgo de secuencia de retornos). Bengen 2025 sube SAFEMAX histórico a 4.7%; Morningstar 2026 baja forward-looking a 3.9%. El simulador oficial de la Seguridad Social estará siempre más afinado para la pensión real.
      </div>
    </Card>
  );
}

export function MonteCarloCard({ plan, profile, d, realMode, inflRate }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Inputs that drive a re-run
  const inputsKey = useMemo(() => JSON.stringify({
    cap: d.currentPortfolio,
    ret: plan.annualReturn,
    inf: plan.inflationRate,
    wd: plan.withdrawalRate,
    le: plan.lifeExpectancy,
    age: profile.age,
    retAge: profile.retireAge,
    aporte: currentMonthlyAporte(plan),
    pen: plan.publicPension,
  }), [d.currentPortfolio, plan, profile]);

  // Run MC when inputs change (debounced, async via timeout)
  useEffect(() => {
    let cancelled = false;
    setRunning(true);
    setError(null);
    const timer = setTimeout(() => {
      try {
        const mc = runMonteCarlo(plan, profile, {
          trials: 500,
          startCapital: d.currentPortfolio,
          includeHypothetical: INCLUDE_POSSIBLE,   // base = solo confirmado, igual que la curva hero
        });
        if (!cancelled) {
          setResult(mc);
          setRunning(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e.message || e));
          setRunning(false);
        }
      }
    }, 100);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [inputsKey]);

  // Datos de la NUBE: bandsByAge (lo que runMonteCarlo ya devuelve, un punto por edad) → cada edad
  // con p10/p25/p50/p75/p90, deflactado al modo real igual que el resto (toRealEur; bandsByAge viene
  // en nominal). NO toca lib: solo consume y deflacta aquí. Añade la meta "tu número" por edad.
  const chartData = useMemo(() => {
    if (!result || !result.bandsByAge) return [];
    const fiTargetHoy = d.fiTarget || 0;                 // número FIRE en € de HOY (real)
    return result.bandsByAge.map((row) => {
      const monthsFromNow = (row.age - profile.age) * 12;
      const conv = (v) => realMode ? toRealEur(v, monthsFromNow, inflRate) : v;
      const p10 = conv(row.p10), p25 = conv(row.p25), p50 = conv(row.p50), p75 = conv(row.p75), p90 = conv(row.p90);
      // Meta "tu número": en real es plana (€ de hoy); en nominal se infla por edad — MISMO patrón
      // que el gráfico de vida, para que el cruce mediana × meta case con la otra curva.
      const meta = fiTargetHoy > 0
        ? (realMode ? fiTargetHoy : fiTargetHoy * Math.pow(1 + inflRate / 100, row.age - profile.age))
        : null;
      return {
        age: row.age,
        p10, p25, p50, p75, p90,
        // Cintas pre-calculadas (base invisible + span apilado) para que Recharts pinte las bandas.
        outerLow: p10, outerSpan: p90 - p10,             // banda exterior P10–P90 (80% central)
        innerLow: p25, innerSpan: p75 - p25,             // banda interior P25–P75 (50% central, densa)
        meta,
      };
    });
  }, [result, realMode, inflRate, profile.age, d.fiTarget]);

  if (running && !result) {
    return (
      <Card>
        <Label>Probabilidad de éxito</Label>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 12, lineHeight: T.lh.normal }}>
          Simulando 500 escenarios de mercado...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Label>Probabilidad de éxito</Label>
        <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.red, marginTop: 10 }}>
          Error: {error}
        </div>
      </Card>
    );
  }

  if (!result) return null;

  const successPct = Math.round(result.successRate * 100);
  const successColor = successPct >= 90 ? T.green : successPct >= 75 ? T.amber : T.red;
  const successZone = successPct >= 90 ? 'Excelente' : successPct >= 75 ? 'Aceptable' : successPct >= 50 ? 'Frágil' : 'Crítico';

  // Highlight values at retire age
  const retireRow = chartData.find(row => row.age === profile.retireAge) || chartData[result.yearsAccum];

  // Rejilla "¿Y te dura?" · la MISMA simulación en su forma legible: 100 futuros, los que
  // aguantan hasta la esperanza de vida (verde) vs los que se agotan antes (ámbar). Cuenta
  // derivada de successRate (round × 100) — no recalcula nada, coincide con el % mostrado.
  // Invariante al realMode (las cifras P10/50/90 sí lo siguen).
  const survivors = Math.round(result.successRate * 100);
  const depleted = 100 - survivors;
  const lifeExp = plan.lifeExpectancy || 90;

  // Nube de probabilidad (Recharts global UMD). Reemplaza la rejilla de 100 casillas.
  const R = window.Recharts || {};
  const { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } = R;
  // Cap del eje Y (anti-aplastamiento): los P90 tardíos son enormes (cola larga: P90 a 90 ~12M
  // cuando la mediana ~2,6M). Capamos a max(P90 a la edad de retiro, P50 final) × 1.3 y dejamos que
  // la cima de la banda P90 se salga RECORTADA (allowDataOverflow). Así mediana y cruce se leen sin
  // que la banda útil quede aplastada. Se calcula sobre chartData → respeta real/nominal.
  const finalRow = chartData[chartData.length - 1];
  const yCap = (retireRow && finalRow) ? Math.round(Math.max(retireRow.p90, finalRow.p50) * 1.3) : undefined;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Label>¿Y te dura?</Label>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 4, lineHeight: T.lh.normal }}>
            {result.trials} <Concept id="monte-carlo">simulaciones</Concept> de tu plan completo, con volatilidad de mercado real. Cada futuro es uno posible: la pregunta es en cuántos tu dinero aguanta hasta los {lifeExp}.
          </div>
        </div>
        <div style={{
          padding: '12px 18px', background: successColor, color: '#fff',
          borderRadius: 12, textAlign: 'center', flexShrink: 0,
        }}>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, lineHeight: 1, letterSpacing: T.tracking.display }}>{successPct}%</div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', opacity: 0.85, marginTop: 4 }}>{successZone}</div>
        </div>
      </div>

      {/* Encabezado de la rejilla · misma simulación, forma legible */}
      <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.normal, marginBottom: 14 }}>
        De cada 100 futuros, <strong style={{ color: T.green, fontStyle: 'normal' }}>{survivors}</strong> aguantan hasta los {lifeExp} · <strong style={{ color: T.amber, fontStyle: 'normal' }}>{depleted}</strong> se agotan antes.
      </div>

      {/* NUBE de probabilidad sobre toda la vida (acumulación + jubilación). Bandas P10–P90 (exterior,
          tenue) y P25–P75 (interior, densa) con gradiente vertical → bordes que mueren suaves, sin
          contorno duro. Mediana P50 sólida acento por encima. Línea de retiro separa las dos fases;
          meta "tu número" tenue para ver el cruce. Eje Y capado (yCap) con desbordamiento recortado. */}
      {ResponsiveContainer && chartData.length > 1 ? (
        <div style={{ height: 248, marginBottom: 10, position: 'relative' }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 16, right: 16, left: 18, bottom: 22 }}>
              <defs>
                <linearGradient id="mcCloudOuter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity="0.02" />
                  <stop offset="52%" stopColor={T.accent} stopOpacity="0.16" />
                  <stop offset="100%" stopColor={T.accent} stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id="mcCloudInner" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity="0.10" />
                  <stop offset="50%" stopColor={T.accent} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={T.accent} stopOpacity="0.10" />
                </linearGradient>
                <filter id="mcCloudBlur" x="-3%" y="-8%" width="106%" height="116%">
                  <feGaussianBlur stdDeviation="2" />
                </filter>
              </defs>
              <CartesianGrid stroke={T.lineSoft} vertical={false} />
              <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']}
                ticks={[profile.age, profile.retireAge, lifeExp]}
                tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
                axisLine={{ stroke: T.line }} tickLine={false}
                label={{ value: 'Edad', position: 'insideBottom', offset: -12, fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow }} />
              <YAxis tickFormatter={fmtEur} domain={[0, yCap]} allowDataOverflow
                tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
                axisLine={false} tickLine={false} width={56} />

              {/* Banda exterior P10–P90 (base invisible + span apilado, gradiente + leve blur) */}
              <Area dataKey="outerLow" stackId="outer" stroke="none" fill="none" isAnimationActive={false} />
              <Area dataKey="outerSpan" stackId="outer" stroke="none" fill="url(#mcCloudOuter)" filter="url(#mcCloudBlur)" isAnimationActive={false} />
              {/* Banda interior P25–P75 (la densidad de la nube) */}
              <Area dataKey="innerLow" stackId="inner" stroke="none" fill="none" isAnimationActive={false} />
              <Area dataKey="innerSpan" stackId="inner" stroke="none" fill="url(#mcCloudInner)" filter="url(#mcCloudBlur)" isAnimationActive={false} />

              {/* Tu número (meta): cruce con la mediana */}
              <Line dataKey="meta" stroke={T.faint} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} connectNulls />
              {/* Mediana P50 — por encima de las bandas */}
              <Line dataKey="p50" stroke={T.accent} strokeWidth={2.4} dot={false} isAnimationActive={false} />

              {/* Frontera de fase: edad de retiro, con las dos fases etiquetadas */}
              <ReferenceLine x={profile.retireAge} stroke={T.faint} strokeDasharray="3 3"
                label={(lp) => {
                  const vb = lp && lp.viewBox; if (!vb) return null;
                  const ly = vb.y + 12;
                  return (
                    <g>
                      <text x={vb.x - 8} y={ly} textAnchor="end" fill={T.faint} fontFamily={T.mono} fontSize={10} letterSpacing="0.08em">ACUMULACIÓN</text>
                      <text x={vb.x + 8} y={ly} textAnchor="start" fill={T.muted} fontFamily={T.mono} fontSize={10} letterSpacing="0.08em">JUBILACIÓN</text>
                    </g>
                  );
                }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Frase corta que enlaza con la de los 100 futuros: la nube se abre al jubilarse. */}
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.muted, lineHeight: T.lh.normal, marginBottom: 16 }}>
        Hasta los {profile.retireAge} la nube es estrecha: todos los futuros acumulan parecido. Al jubilarte se abre — arriba los que crecen, abajo la cola que se agota antes de los {lifeExp}.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingTop: 12, borderTop: '1px dashed ' + T.lineSoft }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.amber, letterSpacing: T.tracking.wider, textTransform: 'uppercase', marginBottom: 4 }}>p10 · {profile.retireAge}</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.lead, color: T.amber, letterSpacing: T.tracking.tight }}>{fmtEur(retireRow ? retireRow.p10 : 0)}</div>
        </div>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.accent, letterSpacing: T.tracking.wider, textTransform: 'uppercase', marginBottom: 4 }}>mediana · {profile.retireAge}</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.lead, color: T.accent, letterSpacing: T.tracking.tight }}>{fmtEur(retireRow ? retireRow.p50 : 0)}</div>
        </div>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.ink, letterSpacing: T.tracking.wider, textTransform: 'uppercase', marginBottom: 4 }}>p90 · {profile.retireAge}</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.lead, color: T.ink, letterSpacing: T.tracking.tight }}>{fmtEur(retireRow ? retireRow.p90 : 0)}</div>
        </div>
      </div>

      {/* Bloques "Si el plan falla" (depletionAgeStats) y CTA promocional
          eliminados con el colapso al HTML libre. */}

      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.faint, marginTop: 12, lineHeight: T.lh.normal, paddingTop: 12, borderTop: '1px dashed ' + T.lineSoft }}>
        En el {100 - successPct}% de simulaciones la cartera se agota antes de los {plan.lifeExpectancy || 90}. La proyección lineal en la otra gráfica ignora este riesgo de <Concept id="secuencia-retornos">secuencia de retornos</Concept>.
      </div>
    </Card>
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
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
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
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Ingreso conjunto</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight }}>
            {fmtEur(totalIncome)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Inversión conjunta</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, color: '#86efac' }}>
            {fmtEur(totalInvestment)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Tasa hogar</div>
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
                {isActive && <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.accent, marginLeft: 8, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>activa</span>}
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
        <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>{label}</div>
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
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>
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
                    <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>% del IPC</span>
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
                <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: tier.color, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>{tier.label}</span>
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
                  <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: tier.color, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>{tier.label}</span>
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
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight }}>
            Mi <em style={{ color: T.accent }}>Plan</em>
          </div>
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
                {isActive && <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.accent, lineHeight: 1 }}>ahora</div>}
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
          <div style={{ fontFamily: T.mono, fontSize: 14, color: T.accent, marginTop: 14, letterSpacing: T.tracking.wide, textTransform: 'uppercase' }}>{phaseEstimate(selPhase.num)}</div>
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
            const est = d.destinoEstado;
            const kicker = { fontFamily: T.mono, fontSize: T.size.caption, color: T.muted, letterSpacing: T.tracking.wide, marginTop: 18 };
            const cifra = { fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, marginTop: 2 };
            const frase = { fontFamily: T.serif, fontSize: T.size.body, color: T.muted, marginTop: 12, lineHeight: T.lh.normal, maxWidth: 600 };
            const reading = momentumAge != null
              ? <>A los <strong style={{ color: T.ink, fontWeight: 600 }}>{momentumAge}</strong> tu dinero ya te adelanta —el rendimiento anual supera a tu aporte— y la pensión pública entra a los <strong style={{ color: T.ink, fontWeight: 600 }}>{pensionAge}</strong>.</>
              : <>Cuando empieces a aportar, el rendimiento acabará superando a tu aporte; la pensión pública entra a los <strong style={{ color: T.ink, fontWeight: 600 }}>{pensionAge}</strong>.</>;
            if (est === 'libre') {
              return (<><div style={kicker}>libre a los</div><div style={{ ...cifra, color: T.green }}>★ {libertadAge}</div><div style={frase}>{reading}</div></>);
            }
            if (est === 'tarde') {
              return (<><div style={kicker}>libre, pero tarde, a los</div><div style={{ ...cifra, color: T.amber }}>{libertadAge}</div><div style={frase}>{reading}</div></>);
            }
            return (<><div style={kicker}>todavía sin edad de libertad</div><div style={{ ...frase, marginTop: 14 }}>{reading}</div></>);
          })()}
        </Card>
        {(() => {
          const noMeses = !(d.filledMonths && d.filledMonths.length);
          let frase, label, dest, tone;
          if (noMeses) { frase = 'Registra tu primer mes para seguir tu avance real.'; label = 'Ir a Mes a mes →'; dest = 'seguimiento'; tone = 'forward'; }
          else if (d.destinoEstado === 'tarde') { frase = 'Llegas tarde a tu meta. Ajusta tu plan.'; label = 'Ir a Proyección →'; dest = 'proy'; tone = 'behind'; }
          else if (d.destinoEstado === 'no-llega') { frase = 'Aún sin edad de libertad. Ajusta ahorro u objetivo.'; label = 'Ir a Proyección →'; dest = 'proy'; tone = 'behind'; }
          else { frase = 'Vas en camino. Sigue tu avance mes a mes.'; label = 'Ir a Mes a mes →'; dest = 'seguimiento'; tone = 'forward'; }
          return <NextStep tone={tone} body={frase} action={{ label, onClick: () => update({ activeTab: dest }) }} />;
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
        <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.faint, marginBottom: 6 }}>
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

      {/* Household multi-account summary (only renders if list.length > 1) */}
      <HouseholdSummaryCard />

      {/* ─────────────── Movimiento 1 · Dónde estás ─────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: BLOCK_GAP, paddingBottom: 12, borderBottom: '1px solid ' + T.line }}>
          <span style={{ fontFamily: T.mono, fontSize: T.size.caption, color: T.faint, letterSpacing: T.tracking.widest }}>01</span>
          <h2 style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: DISPLAY_MD, color: T.ink, margin: 0, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight }}>Dónde estás</h2>
        </div>

        {/* Rediseño Plan v2 · M1 en dos cards NEUTRAS (presente sobrio, sin tinte;
            el futuro de M2/M3 sí lleva color). Card A = patrimonio (tinta, KPI hero
            descriptivo). Card B = el eje: ahorro mensual protagonista + fork
            parado/invertido. Cifras 100% derivadas y en NOMINAL (currentPortfolio,
            planAporte, savingRate, monthlyLife, parkedFinalNominal, finalNominal). */}
        {(() => {
          const cardStyle = { background: T.paper, border: '1px solid ' + T.line, borderRadius: 14, boxShadow: '0 1px 3px rgba(26,22,18,.06)', padding: mobile ? 20 : 28 };
          const ahorroPct = Math.round(savingRate * 100);
          const aporta = planAporte > 0 ? planAporte : Math.round(income * 0.15);
          const aportaLabel = planAporte > 0 ? 'Cada mes apartas' : 'Si apartaras el 15%';
          const subPct = planAporte > 0 ? ahorroPct : 15;
          return (
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: mobile ? 16 : 20 }}>
            {/* Card A · patrimonio (TINTA, no verde: cifra descriptiva) */}
            <div style={cardStyle}>
              <div style={{ fontFamily: T.mono, fontSize: T.size.caption, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.faint }}>Tu patrimonio</div>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 34 : 44, color: T.ink, letterSpacing: T.tracking.display, lineHeight: 1.05, marginTop: 6 }}>{fmtEur(d.currentPortfolio || 0)}</div>
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
                  <div style={{ fontFamily: T.mono, fontSize: T.size.caption, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.faint }}>{aportaLabel}</div>
                  <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 44 : 60, color: T.ink, letterSpacing: T.tracking.display, lineHeight: 1, marginTop: 4 }}>{fmtEur(aporta)}</div>
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
                    <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.faint }}>Parado · {yearsToRetire} años</div>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 28 : 36, color: T.red, letterSpacing: T.tracking.display, lineHeight: 1, marginTop: 6 }}>{fmtEur(parked)}</div>
                  </div>
                  <div style={{ border: '1px solid ' + T.line, borderRadius: 12, padding: mobile ? '14px' : '16px 18px', textAlign: 'center' }}>
                    <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.faint }}>Invertido · {yearsToRetire} años</div>
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
            <div><Btn variant="ghost" size="sm" onClick={() => setShowSinPlanModal(true)}>Ver el cálculo completo →</Btn></div>
          </div>
          );
        })()}

      </section>

      {/* ─────────────── Movimiento 2 · Lo que podría ser ─────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: BLOCK_GAP, paddingBottom: 12, borderBottom: '1px solid ' + T.line }}>
          <span style={{ fontFamily: T.mono, fontSize: T.size.caption, color: T.faint, letterSpacing: T.tracking.widest }}>02</span>
          <h2 style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: DISPLAY_MD, color: T.ink, margin: 0, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight }}>Hacia dónde puedes ir</h2>
        </div>

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
                    {monedas()}
                    {/* Recordatorio (real) EN VIVO · aterriza el patrimonio nominal de las
                        monedas a € de hoy, justo debajo y antes de la renta. Si cambia la
                        inflación, finalReal se recalcula solo (las cifras nominales no). */}
                    <div style={{ fontFamily: T.serif, color: T.muted, fontSize: 16, lineHeight: T.lh.normal, marginTop: mobile ? 14 : 16 }}>
                      Recuerda: ajustado por la inflación, ese patrimonio equivale a <strong style={{ color: T.ink, fontStyle: 'normal' }}>{fmtEur(finalReal)}</strong> de hoy.
                    </div>
                  </>
                )}
                {/* Cierre · renta NOMINAL del primer año de jubilación + su aclaración en
                    € de hoy (real) + veredicto de suficiencia. Ambas cifras EN VIVO.
                    borderTop solo si hay monedas+recordatorio arriba. */}
                <div style={{ ...(ratioValido ? { borderTop: '1px solid ' + T.lineSoft, marginTop: mobile ? 20 : 26, paddingTop: mobile ? 18 : 22 } : {}), fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 21 : 24, color: T.ink, letterSpacing: T.tracking.tight, lineHeight: 1.3 }}>
                  Y te dan <span style={{ color: T.amber }}>{fmtEur(retirementMonthly)}</span>/mes cuando te jubiles — es decir, {fmtEur(retirementMonthlyReal)} de hoy: {rentaTail}.
                </div>
              </div>
            )}
            <OnboardingHelp title="Supuestos">
              Cifras en euros nominales (los que tendrás en el futuro); el recordatorio las ajusta a € de hoy por la inflación. Asumiendo {planReturn}% de rentabilidad media anual y una tasa de retiro del {withdrawalRate}%. La edad de libertad sale de tu ritmo de ahorro real — todo configurable en Proyección.
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
          <Btn variant="ghost" size="sm" onClick={() => goTo('proy')}>Profundizar en Proyección →</Btn>
        </div>
      </section>

      {/* ─────────────── Movimiento 3 · Tu ruta ─────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: BLOCK_GAP, paddingBottom: 12, borderBottom: '1px solid ' + T.line }}>
          <span style={{ fontFamily: T.mono, fontSize: T.size.caption, color: T.faint, letterSpacing: T.tracking.widest }}>03</span>
          <h2 style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: DISPLAY_MD, color: T.ink, margin: 0, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight }}>Tu ruta</h2>
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal, maxWidth: 720, marginBottom: 18 }}>
          Cinco fases que estructuran el camino FIRE.
        </div>
        <RutaCincoFases state={state} d={d} mobile={mobile} />
      </section>

      {showSinPlanModal && <SinMiPlanModal onClose={() => setShowSinPlanModal(false)} />}
    </div>
  );
}

export function WhatIfCard({ d, plan, updatePlan }) {
  const [bump, setBump] = useState(50);
  const { state, mutatePlan } = useStore();
  const { profile } = state;
  const baseline = d.currentAporte || plan.monthlyPlanned || 0;
  // Use extraMonthly so we ADD `bump` on top of whatever the plan already does
  // (instead of overriding all saving segments with a flat amount)
  const sim = useMemo(() => projectV2(plan, profile, {
    capital: d.currentPortfolio,
    extraMonthly: bump,
    includeHypothetical: false,
  }), [profile, d.currentPortfolio, plan, bump]);
  const diff = sim[sim.length - 1].portfolio - d.finalPlan.portfolio;
  return (
    <Card>
      <Label>¿Y si subo el aporte?</Label>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <span style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.lead }}>+</span>
        <EditableNumber value={bump} onChange={setBump} min={0} max={2000} width={90} color={T.accent} />
        <span style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.lead }}>€/mes →</span>
      </div>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, color: T.green, marginTop: 6, letterSpacing: T.tracking.display, lineHeight: 1 }}>
        +{fmtEur(diff)}
      </div>
      <div style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.caption, marginTop: 4 }}>
        a los {profile.retireAge}. Por solo {fmtEur(bump)} más cada mes.
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        {[25, 50, 100, 200].map((v) => (
          <button key={v} onClick={() => setBump(v)}
            style={{
              fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '6px 12px',
              background: bump === v ? T.ink : 'transparent',
              color: bump === v ? T.bg : T.muted,
              border: '1px solid ' + (bump === v ? T.ink : T.line),
              borderRadius: 999, cursor: 'pointer',
            }}>+{v}€</button>
        ))}
      </div>
      <button onClick={() => mutatePlan(p => {
          const tk = todayKey();
          const segs = p.savingSegments && p.savingSegments.length ? p.savingSegments : [{ id: uid(), from: tk, to: null, type: 'fixed', value: 0, label: 'Aporte' }];
          const idx = segs.findIndex(s => isKeyInSegment(tk, s));
          if (idx < 0) {
            // No active segment → add a new fixed extra one
            return { ...p, savingSegments: [...segs, { id: uid(), from: tk, to: null, type: 'fixed', value: bump, label: 'Extra' }] };
          }
          // For fixed segments, just bump the value (preserves intent)
          // For percent segments, add a NEW fixed segment on top instead of destroying %
          const s = segs[idx];
          if (s.type === 'fixed') {
            const updated = segs.map((seg, i) => i === idx ? { ...seg, value: (Number(seg.value) || 0) + bump } : seg);
            return { ...p, savingSegments: updated };
          } else {
            return { ...p, savingSegments: [...segs, { id: uid(), from: tk, to: null, type: 'fixed', value: bump, label: 'Extra sobre ' + (s.label || 'aporte') }] };
          }
        })}
        style={{
          marginTop: 14, fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.accent,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          letterSpacing: T.tracking.wider, textTransform: 'uppercase',
        }}>Aplicar al plan →</button>
    </Card>
  );
}

export function ScreenMesAMes() {
  const { state, setMonth, update } = useStore();
  const d = useDerived();
  const { months } = state;
  // B5 · Calendar modal toggle.
  const [showCalendar, setShowCalendar] = useState(false);

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
        <Label>Mes a mes</Label>
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

      {/* Real vs plan projection — only when enough data */}
      {filled.length >= 3 ? (() => {
        const realAtLast = d.realPortfolioAtLastReg;
        const planAtLast = d.planPortfolioAtLastReg;
        const delta = d.realVsPlanDelta;
        const ratio = d.realVsPlanRatio;
        const inLine = ratio != null && Math.abs(ratio - 1) < 0.01;
        const ahead = !inLine && delta != null && delta > 0;
        const realColor = inLine ? T.accent : ahead ? T.green : T.red;
        const scenarios = [
          { label: 'Plan original', color: T.faint, series: d.seriesPlanFromStart, dashed: true },
          { label: 'Curva real', color: realColor, series: d.seriesRealFromStart, bold: true },
        ];
        return (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>Tu plan vs tu realidad</Label>
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
                {inLine ? (
                  <>Vas en línea con tu plan.</>
                ) : ahead ? (
                  d.ageAtFiReal != null && d.ageAtFiPlan != null && d.ageAtFiReal < d.ageAtFiPlan ? (
                    <>Vas por delante. A este ritmo, alcanzas la independencia financiera a los <strong style={{ color: T.ink, fontStyle: 'normal' }}>{d.ageAtFiReal.toFixed(1)}</strong> en lugar de los <strong style={{ color: T.ink, fontStyle: 'normal' }}>{d.ageAtFiPlan.toFixed(1)}</strong> originalmente previstos.</>
                  ) : (
                    <>Vas por delante: <strong style={{ color: T.green, fontStyle: 'normal' }}>{fmtEur(delta)}</strong> por encima del plan original a esta fecha.</>
                  )
                ) : (
                  d.ageAtFiReal != null && d.ageAtFiPlan != null && d.ageAtFiReal > d.ageAtFiPlan ? (
                    <>Vas por detrás del plan original. Si esto se mantiene, tu independencia se retrasa hasta los <strong style={{ color: T.ink, fontStyle: 'normal' }}>{d.ageAtFiReal.toFixed(1)}</strong> años.</>
                  ) : (
                    <>Vas por detrás del plan original: <strong style={{ color: T.red, fontStyle: 'normal' }}>{fmtEur(Math.abs(delta))}</strong> por debajo a esta fecha.</>
                  )
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wide, textTransform: 'uppercase', flexWrap: 'wrap' }}>
              <LegendChip color={realColor} label="Real" />
              <LegendChip color={T.faint} label="Plan" dashed />
            </div>
          </div>
          <MultiLineChart scenarios={scenarios} height={240} />
        </Card>
        );
      })() : (
        <Card style={{ borderStyle: 'dashed' }}>
          <Label>Tu plan vs tu realidad</Label>
          <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.muted, fontStyle: 'italic', marginTop: 8, lineHeight: T.lh.normal }}>
            Aún no hay suficientes datos. Registra al menos <strong style={{ color: T.ink, fontStyle: 'normal' }}>3 meses</strong> y verás aquí la curva de tu plan original comparada con la curva real reconstruida.
            <br />
            Llevas <strong style={{ color: T.accent, fontStyle: 'normal' }}>{filled.length} {filled.length === 1 ? 'mes' : 'meses'}</strong>.
          </div>
        </Card>
      )}

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: '1px dashed ' + T.line, flexWrap: 'wrap' }}>
        <Btn variant="ghost" size="sm" onClick={() => setShowCalendar(true)}>Ver calendario completo →</Btn>
      </div>
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic', lineHeight: T.lh.normal }}>
          Lo que ves en <strong style={{ color: T.ink, fontStyle: 'normal' }}>"Plan"</strong> sale en vivo de los tramos en Ajustes. No hay que regenerar nada: cualquier cambio en Ajustes se refleja aquí al instante.
        </div>
      </div>

      {showCalendar && (
        <MonthlyCalendarModal
          grouped={grouped}
          plan={state.plan}
          setMonth={setMonth}
          addMonths={addMonths}
          ensureMonth={ensureMonth}
          update={update}
          onClose={() => setShowCalendar(false)}
        />
      )}
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
            {isCurrent && <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.accent, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Mes actual</span>}
            {past && empty && <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.amber, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Atrasado</span>}
            {empty && !past && <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Futuro</span>}
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
                {seg.value}% · {fmtEur(incomeAtMonth)}
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
        {isCurrent && <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.accent, letterSpacing: T.tracking.wider, textTransform: 'uppercase', marginTop: 2 }}>Mes actual</div>}
        {past && empty && <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.amber, letterSpacing: T.tracking.wider, textTransform: 'uppercase', marginTop: 2 }}>Atrasado</div>}
      </div>

      <div style={{ minWidth: 0 }}>
        <Label style={{ marginBottom: 2 }}>Plan</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.faint, letterSpacing: T.tracking.tight }}>{fmtEur(plannedComputed)}</span>
        </div>
        {seg && seg.type === 'percent' && incomeAtMonth > 0 && (
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 1, letterSpacing: T.tracking.wide }}>
            {seg.value}% · {fmtEur(incomeAtMonth)}
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
        {empty && !past && <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Futuro</span>}
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
function ProyeccionEngine({ d, plan, profile, mobile, realMode, inflRate, applyRealMode, fiTargetReal, updateSaving, updatePlan }) {
  const [scrub, setScrub] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const currentAge = profile.age;
  const retireAge = profile.retireAge;

  // Línea de vida: d.seriesPlan (nominal) deflactada por realMode igual que el resto de la
  // pantalla. Muestreo anual. Meta por edad: en real es plana (fiTarget en € de hoy); en
  // nominal sube con el IPC (el número que necesitas crece) → la curva cruza la meta en el
  // MISMO punto en ambas unidades, alineado con ageAtFiReal.
  const lifeData = useMemo(() => {
    const life = applyRealMode(d.seriesPlan || []);
    return life
      .filter((r) => r && r.monthIndex % 12 === 0)
      .map((r) => {
        const yearsFromNow = r.age - currentAge;
        const meta = realMode ? fiTargetReal : fiTargetReal * Math.pow(1 + inflRate / 100, yearsFromNow);
        return { age: Math.round(r.age), portfolio: Math.round(r.portfolio || 0), meta: Math.round(meta) };
      });
  }, [d.seriesPlan, applyRealMode, realMode, inflRate, fiTargetReal, currentAge]);

  const ageAtFi = d.ageAtFiReal;                                   // null = no llega (el ★)
  const declared = !!(plan.actualLife && plan.actualLife.completed);
  const activeSeg = findActiveSegment(plan.savingSegments, todayKey());

  // Derivación del número FIRE (espina conceptual) · solo COPY/VISTA, no recalcula.
  // El número = 25× el gasto ANUAL (regla del 4%): 1/tasa redondeado, aplicado al gasto del año.
  // numeroHoy = fiTarget real (€ de hoy) — el MISMO que ya existe, no se fuerza. La cadena va
  // de mensual a ANUAL porque la regla del 4% es 25× el gasto ANUAL; con mensual×25 saldría 12×
  // menos y la ecuación mentiría. fmtEurFull (cifra completa) para que la multiplicación cuadre
  // a la vista. Coherencia verificada en runtime: gastoAnual × mult === fiTarget real.
  const wRate = plan.withdrawalRate != null ? plan.withdrawalRate : 4.0;   // tasa de retiro %
  const fiMult = Math.round(100 / wRate);                                  // 1/tasa: ×25 al 4%, ×33 al 3%
  const monthlySpend = declared ? Math.round(sumExpenses(plan.actualLife)) : 0;
  const annualSpend = monthlySpend * 12;                                   // origen mensual → anual (la regla es sobre gasto anual)
  const numeroHoy = Math.round(fiTargetReal);                              // número FIRE en € de HOY (real)

  const R = window.Recharts || {};
  const { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } = R;

  const xticks = [];
  for (let a = Math.ceil(currentAge / 10) * 10; a <= retireAge; a += 10) xticks.push(a);
  const lastPoint = lifeData.length ? lifeData[lifeData.length - 1] : { age: retireAge, portfolio: 0 };
  const reading = scrub || lastPoint;

  // Punto del ★ SOBRE la curva en la edad de libertad (interpolado entre puntos anuales).
  // Así la etiqueta puede respirar lejos del cúmulo de la esquina (tick de meta superior +
  // final de la curva + eje Y) en vez de pisarse contra él. ageAtFi viene de d.ageAtFiReal
  // (no se recalcula); solo se posiciona la marca + etiqueta.
  // El ★ del cruce SOLO cuando 'libre' (cruce ≤ jubilación, dentro de la curva). En 'tarde' el
  // cruce cae tras la jubilación, fuera del dominio dibujado, y no debe pintarse verde "libre"
  // (contradecía al hero ámbar). 'no-llega' tampoco tiene ★. Coherente con destinoEstado.
  const cruceLibre = d.destinoEstado === 'libre';
  let fiDot = null;
  if (cruceLibre && lifeData.length > 1) {
    for (let i = 1; i < lifeData.length; i++) {
      if (lifeData[i].age >= ageAtFi) {
        const a0 = lifeData[i - 1], a1 = lifeData[i];
        const t = (ageAtFi - a0.age) / ((a1.age - a0.age) || 1);
        fiDot = { age: ageAtFi, portfolio: Math.round(a0.portfolio + t * (a1.portfolio - a0.portfolio)) };
        break;
      }
    }
    if (!fiDot) fiDot = { age: ageAtFi, portfolio: lifeData[lifeData.length - 1].portfolio };
  }
  // Si la edad de libertad cae pegada al borde derecho, anclamos la etiqueta a la izquierda
  // del punto (hacia el interior del plot) para que no se corte; si no, debajo del punto.
  const fiLabelPos = fiDot && (retireAge - ageAtFi) <= 3 ? 'left' : 'bottom';

  // Coast/Lean sobre la MISMA curva (misma interpolación que el ★). Solo dentro del
  // dominio dibujado [hoy, retireAge]; fuera de rango (edades > jubilación en 'tarde'/
  // 'no-llega') no se dibujan — esa dirección vive en la card "Siguiente paso", no en la
  // curva. Sin verde (reservado al ★ de libertad). Las edades se nombran en la leyenda,
  // no como etiqueta sobre la curva, para no solaparse con el ★ cuando caen juntas.
  const dotAt = (edad) => {
    if (edad == null || lifeData.length < 2) return null;
    if (edad < lifeData[0].age || edad > lifeData[lifeData.length - 1].age) return null;
    for (let i = 1; i < lifeData.length; i++) {
      if (lifeData[i].age >= edad) {
        const a0 = lifeData[i - 1], a1 = lifeData[i];
        const t = (edad - a0.age) / ((a1.age - a0.age) || 1);
        return { age: edad, portfolio: Math.round(a0.portfolio + t * (a1.portfolio - a0.portfolio)) };
      }
    }
    return null;
  };
  const coastDot = dotAt(d.coastEdad);
  const leanDot = dotAt(d.leanEdad);

  return (
    <Card pad={mobile ? 18 : 30} style={{ minWidth: 0, background: 'radial-gradient(135% 125% at 100% 0%, ' + T.accentSoft + ' 0%, transparent 58%), ' + T.paper }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <Label>Tu línea de vida</Label>
          {realMode && (
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.muted, marginTop: 2 }}>ajustado por inflación {inflRate}% anual</div>
          )}
        </div>
        <DisplayModeToggle />
      </div>

      {/* Tira de derivación del número FIRE · de dónde sale tu número (solo con gasto declarado).
          Gasto ANUAL × múltiplo (1/tasa) = número en € de HOY (= fiTarget real). */}
      {declared && (
        <>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wide, marginBottom: 4, lineHeight: T.lh.normal }}>
            <span style={{ color: T.faint, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Tu número · </span>
            {fmtEurFull(monthlySpend)}/mes → {fmtEurFull(annualSpend)}/año × {fiMult} = <strong style={{ color: T.ink }}>{fmtEurFull(numeroHoy)}</strong> de hoy · regla del {wRate}%
          </div>
          {/* Aclaración de la inflación de la meta · se ajusta al modo activo: en nominal
              (default) la línea de meta del gráfico sube con el IPC; en real (€ de hoy) es
              plana porque la subida ya está descontada. */}
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wide, marginBottom: 10, lineHeight: T.lh.normal }}>
            {realMode ? 'En euros de hoy: la subida de la vida ya está descontada.' : 'Tu meta sube con los años porque tus gastos también subirán.'}
          </div>
        </>
      )}

      {/* Lectura del año recorrido (scrub) · stat protagonista (kicker + cifra display) que
          se actualiza al pasar el ratón por la curva. Por defecto, el punto a la jubilación. */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>A los {reading.age}</span>
        <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, color: T.ink, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight }}>{fmtEur(reading.portfolio)}</span>
      </div>

      {/* Leyenda mínima (una curva, no tres) */}
      <div style={{ display: 'flex', gap: 16, fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wide, textTransform: 'uppercase', marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 2, background: T.accent, display: 'inline-block' }} />patrimonio</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, borderTop: '1.5px dashed ' + T.faint, display: 'inline-block' }} />tu número</span>
        {leanDot && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: T.accent }}><span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid ' + T.accent, display: 'inline-block' }} />lean {Math.ceil(d.leanEdad)}</span>}
        {coastDot && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: T.accent }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent, display: 'inline-block' }} />coast {Math.ceil(d.coastEdad)}</span>}
        {cruceLibre && <span style={{ color: T.green }}>★ libre a los {Math.ceil(ageAtFi)}</span>}
      </div>

      {ResponsiveContainer && lifeData.length > 1 ? (
        <div style={{ width: '100%', height: mobile ? 260 : 340 }}>
          <ResponsiveContainer>
            <ComposedChart data={lifeData} margin={{ top: 16, right: 34, left: 18, bottom: 22 }}
              onMouseMove={(s) => { if (s && s.activePayload && s.activePayload.length) { const p = s.activePayload.find((x) => x.dataKey === 'portfolio'); if (p) setScrub({ age: s.activeLabel, portfolio: p.value }); } }}
              onMouseLeave={() => setScrub(null)}>
              {/* Relleno tenue bajo la curva (accent → transparente) · da cuerpo y calidez a la
                  gráfica, mismo lenguaje de degradado que el sol del hero. Sin gamificar. */}
              <defs>
                <linearGradient id="proyPortfolioFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity={0.34} />
                  <stop offset="55%" stopColor={T.accent} stopOpacity={0.11} />
                  <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={T.lineSoft} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} ticks={xticks}
                tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
                axisLine={{ stroke: T.line }} tickLine={false}
                label={{ value: 'Edad', position: 'insideBottom', offset: -6, fill: T.muted, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider }} />
              <YAxis tickFormatter={fmtEur} tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
                axisLine={false} tickLine={false} width={64}
                label={{ value: realMode ? 'Patrimonio (€ de hoy)' : 'Patrimonio (€)', angle: -90, position: 'insideLeft', offset: 10, fill: T.muted, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, style: { textAnchor: 'middle' } }} />
              <Tooltip cursor={{ stroke: T.ink, strokeWidth: 1, opacity: 0.3 }} content={() => null} />
              <Line dataKey="meta" stroke={T.faint} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
              {Area && <Area dataKey="portfolio" stroke="none" fill="url(#proyPortfolioFill)" isAnimationActive={false} activeDot={false} />}
              <Line dataKey="portfolio" stroke={T.accent} strokeWidth={3} dot={false} isAnimationActive={false} activeDot={{ r: 5, fill: T.accent, stroke: T.paper, strokeWidth: 2 }} />
              {/* Marcadores con halo (glow tenue) detrás del punto sólido · les da presencia
                  sin gritar. Accent para vías; verde para el ★ de libertad. */}
              {leanDot && <ReferenceDot x={leanDot.age} y={leanDot.portfolio} r={12} fill={T.accent} fillOpacity={0.13} stroke="none" />}
              {leanDot && (
                <ReferenceDot x={leanDot.age} y={leanDot.portfolio} r={4} fill={T.paper} stroke={T.accent} strokeWidth={2} isFront />
              )}
              {coastDot && <ReferenceDot x={coastDot.age} y={coastDot.portfolio} r={12} fill={T.accent} fillOpacity={0.13} stroke="none" />}
              {coastDot && (
                <ReferenceDot x={coastDot.age} y={coastDot.portfolio} r={4} fill={T.accent} stroke={T.paper} strokeWidth={2} isFront />
              )}
              {fiDot && <ReferenceDot x={fiDot.age} y={fiDot.portfolio} r={13} fill={T.green} fillOpacity={0.15} stroke="none" />}
              {fiDot && (
                <ReferenceDot x={fiDot.age} y={fiDot.portfolio} r={5} fill={T.green} stroke={T.paper} strokeWidth={2} isFront
                  label={{ value: '★ ' + Math.ceil(ageAtFi) + ' · el cruce', position: fiLabelPos, offset: 12, fill: T.green, fontFamily: T.mono, fontSize: T.size.eyebrow, fontWeight: 700 }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: mobile ? 240 : 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontFamily: T.mono, fontSize: T.size.eyebrow }}>Cargando gráfico…</div>
      )}

      <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal, marginTop: 8 }}>
        {cruceLibre
          ? `El ★ es el cruce: a los ${Math.ceil(ageAtFi)}, el ${wRate}% anual de tu cartera iguala tu gasto — dejas de necesitar un sueldo.`
          : d.destinoEstado === 'tarde'
            ? `Tu cartera cruza tu número a los ${Math.ceil(ageAtFi)}, más allá de tu jubilación (${retireAge}); por eso la curva no llega a marcarlo. Ajusta el aporte abajo para adelantarlo.`
            : `Con este aporte, tu patrimonio no cruza tu número antes de los ${retireAge}. Ajusta el aporte abajo para acercar la línea a la meta.`}
      </div>

      {/* ── DIAL (gasto declarado) · INVITACIÓN (sin declarar) ── */}
      <div id="proy-dial" style={{ marginTop: mobile ? 18 : 22, paddingTop: mobile ? 18 : 22, borderTop: '1px solid ' + T.lineSoft, scrollMarginTop: 16 }}>
        {declared && activeSeg ? (() => {
          const isPercent = activeSeg.type === 'percent';
          const income = d.currentIncome || 0;
          const eurFromPct = (pct) => Math.round(income * pct / 100);
          return (
            <>
              {/* El dial es LA PALANCA · la tasa de ahorro es lo que más adelanta tu fecha. */}
              <Label>La palanca</Label>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight, marginTop: 2, lineHeight: T.lh.snug }}>Tu tasa de ahorro</div>
              <div style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.body, marginTop: 6, marginBottom: 16, lineHeight: T.lh.normal, maxWidth: 560 }}>
                No es cuánto ganas — es <span style={{ color: T.accent }}>qué % guardas</span>. Tu tasa de ahorro es lo que más adelanta tu fecha.
              </div>
              <Slider
                label="Cada mes apartas"
                value={Number(activeSeg.value) || 0}
                onChange={(v) => updateSaving(activeSeg.id, { value: v })}
                min={0}
                max={isPercent ? 50 : Math.max(500, Math.round(income))}
                step={isPercent ? 1 : 50}
                fmt={isPercent ? (v) => `${v}% · ${fmtEur(eurFromPct(v))}/mes` : (v) => `${fmtEur(v)}/mes`}
              />
              <div style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.caption, marginTop: 12, lineHeight: T.lh.normal }}>
                Tu número no cambia: arrastrar solo mueve <em>cuándo</em> llegas.
              </div>
            </>
          );
        })() : (
          <>
            {/* Copy condicional según d.ageAtFiReal: si LLEGA, el dial es para ver "cuándo
                llegas"; si NO LLEGA, el enfoque pasa a "qué puedes mejorar". Misma estructura,
                mismo botón; sin culpa, sin prometer resultados. */}
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight, lineHeight: T.lh.snug }}>
              {ageAtFi != null
                ? 'Para mover tu plan con seguridad, dinos cuánto gastas al mes.'
                : 'Dinos cuánto gastas al mes y verás qué puedes mejorar.'}
            </div>
            <div style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.body, marginTop: 6, lineHeight: T.lh.normal, maxWidth: 560 }}>
              {ageAtFi != null
                ? 'Así tu número FIRE es real y no un efecto de cuánto ahorras: con tu gasto fijo, el dial te deja ver cuándo llegas según lo que apartas.'
                : 'Con tu gasto real, el dial te enseña cuánto te acerca cada cambio: cuánto baja tu número si gastas menos, cuántos años ganas si aportas más.'}
            </div>
            <div style={{ marginTop: 14 }}>
              <Btn variant="ghost" onClick={() => setShowExpenseModal(true)}>Declarar mi gasto →</Btn>
            </div>
          </>
        )}
      </div>

      {showExpenseModal && (
        <ActualLifeOnboarding
          onClose={() => setShowExpenseModal(false)}
          onComplete={(payload) => { updatePlan({ actualLife: payload }); setShowExpenseModal(false); }}
        />
      )}
    </Card>
  );
}

export function ScreenProyeccion() {
  // Pantalla proyecta directamente con los parámetros del plan.
  // v1.4.0c · BIG-A · ScreenProyeccion ahora también edita tramos (income,
  // bonus, saving), eventos y asunciones del modelo (migrados desde Ajustes).
  const { state, update, updatePlan, updateProfile } = useStore();
  const d = useDerived();
  const { profile, plan } = state;
  const mobile = useIsMobile();
  const realMode = state.displayMode === 'real';
  const inflRate = plan.inflationRate != null ? plan.inflationRate : 2.5;
  // v1.4.0c BIG-A · plan-mutators + wizard local para los bloques migrados.
  const m = usePlanMutators();
  const [wizardOpen, setWizardOpen] = useState(false);
  const activePlan = plan;

  // Helper to convert a series to real mode (in-place style).
  // Uses the row's `key` to compute monthsFromNow so it works for
  // series that start in the past (dual curves) as well as today.
  const applyRealMode = useCallback((s) => {
    if (!realMode || !s) return s;
    const tk = todayKey();
    const [ty, tm] = tk.split('-').map(Number);
    return s.map((row, i) => {
      let monthsFromNow = i;
      if (row && row.key) {
        const [yy, mm] = row.key.split('-').map(Number);
        monthsFromNow = (yy - ty) * 12 + (mm - tm);
      }
      return {
        ...row,
        portfolio: toRealEur(row.portfolio, monthsFromNow, inflRate),
        aportado: toRealEur(row.aportado, monthsFromNow, inflRate),
        growth: toRealEur(row.growth, monthsFromNow, inflRate),
      };
    });
  }, [realMode, inflRate]);

  // Curva activa con eventos hipotéticos incluidos.
  const seriesActiveNominal = useMemo(() => projectV2(plan, profile, {
    capital: d.currentPortfolio,
    includeHypothetical: INCLUDE_POSSIBLE,   // base = solo confirmado (doctrina)
  }), [plan, profile, d.currentPortfolio]);
  const seriesActive = useMemo(() => applyRealMode(seriesActiveNominal), [seriesActiveNominal, applyRealMode]);

  // Línea "con eventos posibles".
  const seriesRealWithHypoNominal = useMemo(() => projectV2(plan, profile, {
    capital: d.currentPortfolio,
    includeHypothetical: true,
  }), [plan, profile, d.currentPortfolio]);
  const seriesRealWithHypo = useMemo(() => applyRealMode(seriesRealWithHypoNominal), [seriesRealWithHypoNominal, applyRealMode]);

  const finalActive = seriesActive[seriesActive.length - 1];
  // Recordatorio (sin toggle): patrimonio CON los eventos posibles incluidos. El hero
  // (finalActive) es el plan base (solo confirmado); esta línea enseña aparte lo que
  // sumaría lo posible. seriesRealWithHypo = misma curva con includeHypothetical: true.
  const finalConPosible = seriesRealWithHypo[seriesRealWithHypo.length - 1];
  const hayPosibles = finalConPosible && Math.abs(finalConPosible.portfolio - finalActive.portfolio) > 1;

  // ── Hero "amanecer": DOS estados sobre el MISMO dato base (serie includeHypothetical=false).
  // Estado y edad SON ageAtFiReal —el mismo que alimenta el ★ de Plan—, NO un recomputo
  // paralelo: si la serie base alcanza el número FIRE en horizonte hay edad (LLEGA), si no,
  // ageAtFiReal es null (NO LLEGA). El número FIRE es d.fiTarget (€ de hoy).
  // Estado del destino · ÚNICA fuente (d.destinoEstado + d.cruceEdad de useDerived), coherente con
  // "En limpio", "Siguiente paso" y el resumen de Plan. 'libre' = cruce ≤ jubilación (verde);
  // 'tarde' = cruce DESPUÉS de la jubilación (ámbar, NO verde); 'no-llega' = sin cruce. Edad con
  // Math.ceil (invariante 6), nunca Math.round → así no contradice al resto de la app.
  const heroEstado = d.destinoEstado;
  const libertadAge = d.cruceEdad != null ? Math.ceil(d.cruceEdad) : null;
  const fireTarget = d.fiTarget || 0;                                        // € de hoy
  const pensionAge = (plan.publicPension && plan.publicPension.startAge) || 67;
  // Brecha (estado NO LLEGA) en € de HOY (like-with-like vs fiTarget, que ya es real):
  // deflactamos el patrimonio NOMINAL del hero (no el de la serie real-mode → no doble-deflactar).
  const monthsToRetireHero = Math.max(0, profile.retireAge - profile.age) * 12;
  const finalActiveNom = seriesActiveNominal[seriesActiveNominal.length - 1].portfolio;
  const finalActiveHoy = toRealEur(finalActiveNom, monthsToRetireHero, inflRate);
  const fireGap = Math.max(0, fireTarget - finalActiveHoy);
  // Coherencia de unidad de la fila KPI · "Tu número" y el patrimonio van SIEMPRE en la MISMA
  // unidad (gobernada por realMode), nunca una nominal y otra real. fiTarget vive en € de hoy;
  // para el modo NOMINAL lo llevamos al año de jubilación con el MISMO inflRate y horizonte
  // (inverso de toRealEur). El recordatorio "≈ X de hoy" solo aparece en modo nominal. El gap
  // de NO LLEGA sigue la misma unidad que el número para no contradecirlo.
  const fireTargetNom = fireTarget * Math.pow(1 + inflRate / 100, profile.retireAge - profile.age);
  const numeroDisplay = realMode ? fireTarget : fireTargetNom;
  const gapDisplay = realMode ? fireGap : Math.max(0, fireTargetNom - finalActiveNom);

  // ── Sol del hero como ELEMENTO en un ARCO según la edad de libertad ─────────────────────
  // El sol ES el resultado: ALTO (mediodía) = liberarte pronto; BAJO (atardecer) = tarde; en el
  // HORIZONTE (puesta) = no llegas. Mapeo FIJO: edad 40 (o antes) → arriba (t=0); edad 70 → abajo
  // (t≈0.94); interpola lineal y clampa. NO LLEGA (ageAtFiReal == null) → puesta total (t=1). El
  // sol se COLOCA donde toca y se queda ahí (NO recorre el arco en bucle): si el plan mejora y la
  // edad baja, SUBE con transición CSS suave (600ms, en .hero-sun). Solo el halo "respira" (loop
  // sutil, index.css; prefers-reduced-motion lo desactiva). El cielo de fondo es un wash cálido
  // estático que se derrama (sin caja). Contenido en la columna izquierda; el sol no pisa texto.
  const SUN_AGE_HIGH = 40, SUN_AGE_LOW = 70;
  // El sol concuerda con heroEstado: 'libre' por edad (alto/dorado si joven); 'tarde' atardecer
  // bajo y ámbar (no del todo puesto, coherente con el hero ámbar); 'no-llega' puesta total.
  let sunT;
  if (heroEstado === 'no-llega') {
    sunT = 1;                                                                  // puesta (horizonte)
  } else if (heroEstado === 'tarde') {
    sunT = 0.85;                                                               // atardecer bajo (ámbar)
  } else {
    const a = Math.min(Math.max(d.cruceEdad, SUN_AGE_HIGH), SUN_AGE_LOW);
    sunT = ((a - SUN_AGE_HIGH) / (SUN_AGE_LOW - SUN_AGE_HIGH)) * 0.94;         // libre: por edad
  }
  // Geometría del arco: horizontal en cuarto de círculo (centrado → borde derecho); vertical = arco
  // sin (alto+mediodía cuando joven, media tarde hacia ~60) MÁS una caída extra que solo actúa en la
  // COLA (potencia alta de sunT: ~0 en joven/medio, crece al final). Así el extremo alto y ~60 quedan
  // intactos y solo el extremo bajo —edades muy tardías y, sobre todo, NO LLEGA— cae más hacia el
  // HORIZONTE en vez de quedarse a media altura (el sin solo se aplanaba cerca de t=1 → no separaba).
  const arcA = sunT * Math.PI / 2;
  // En MÓVIL el arco se comprime a la banda superior derecha (el titular ocupa el ancho): el sol se
  // mueve sobre todo en horizontal + color, SIEMPRE por encima del titular para no pisarlo; ahí la
  // cola es 0 → el arco móvil queda idéntico. En DESKTOP el arco es amplio (alto ↔ horizonte).
  const arcTop = mobile ? 2 : 6, arcBase = mobile ? 8 : 132;                   // arco sin: cima ↔ base
  const tailDrop = mobile ? 0 : 85, tailPow = 6;                              // caída extra solo en la cola
  const rightCtr = mobile ? 54 : 150, rightEdge = mobile ? 10 : 26;
  const sunSize = mobile ? 30 : 56;                                            // diámetro del disco
  const sunTopPx = Math.round(arcTop + (arcBase - arcTop) * Math.sin(arcA) + tailDrop * Math.pow(sunT, tailPow));
  const sunRightPx = Math.round(rightCtr - (rightCtr - rightEdge) * (1 - Math.cos(arcA)));
  // Color del sol según la altura: dorado claro arriba → ámbar/anaranjado abajo (sutil, sin saturar).
  const mix = (x, y) => Math.round(x + (y - x) * sunT);
  const sunCore = `rgb(255, ${mix(247, 226)}, ${mix(210, 146)})`;
  const sunEdge = `rgb(255, ${mix(206, 168)}, ${mix(122, 92)})`;
  const haloColor = `rgba(255, ${mix(206, 170)}, ${mix(130, 100)}, 0.5)`;
  const heroSunrise = {
    position: 'relative',
    background: 'radial-gradient(135% 130% at 100% -8%, rgba(255,224,180,0.5) 0%, rgba(251,236,214,0.24) 40%, rgba(245,240,230,0) 74%)',
    padding: mobile ? '26px 18px 30px' : '38px 32px 38px',
  };
  // El sol (elemento): contenedor en el arco (transición suave de posición) + halo (respira) + disco.
  const heroSunWrap = { position: 'absolute', top: sunTopPx, right: sunRightPx, width: sunSize, height: sunSize, pointerEvents: 'none', zIndex: 0 };
  const haloD = sunSize * (mobile ? 3.2 : 3.6);
  const heroSunHalo = { position: 'absolute', left: '50%', top: '50%', width: haloD, height: haloD, marginLeft: -haloD / 2, marginTop: -haloD / 2, borderRadius: '50%', background: `radial-gradient(circle, ${haloColor} 0%, rgba(255,205,135,0) 66%)` };
  const heroSunDisc = { position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 50% 42%, ${sunCore} 0%, ${sunEdge} 60%, rgba(255,205,135,0) 100%)` };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <div style={heroSunrise}>
      <div className="hero-sun" style={heroSunWrap} aria-hidden="true">
        <div className="hero-sun-halo" style={heroSunHalo} />
        <div style={heroSunDisc} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Label>Proyección</Label>
          {heroEstado === 'libre' ? (
            <>
              {/* LIBRE · la EDAD es la protagonista. Verde = excepción doctrinal documentada (la
                  edad de libertad, igual que el ★ de Plan), SOLO aquí. */}
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, marginTop: 4, color: T.ink }}>
                Eres libre a los <span style={{ color: T.green }}>{libertadAge}</span>.
              </div>
              <div style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.body, marginTop: 8, lineHeight: T.lh.normal, maxWidth: 560 }}>
                A esa edad las rentas de tu cartera cubren tu gasto: dejas de depender de un sueldo.
              </div>
            </>
          ) : heroEstado === 'tarde' ? (
            <>
              {/* TARDE · llegas, pero pasada la edad de jubilación → ÁMBAR (no verde: no es libertad
                  plena). Coherente con "En limpio" y el resumen de Plan. */}
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, marginTop: 4, color: T.ink }}>
                Llegas a tu meta, pero <span style={{ color: T.amber }}>tarde</span>: a los <span style={{ color: T.amber }}>{libertadAge}</span>.
              </div>
              <div style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.body, marginTop: 8, lineHeight: T.lh.normal, maxWidth: 560 }}>
                Cruzas después de la edad en que querías jubilarte ({profile.retireAge}). Ajusta tu aporte o tu horizonte ahí abajo para adelantarlo.
              </div>
            </>
          ) : (
            <>
              {/* NO LLEGA · la BRECHA, con la misma calma. La cifra a actuar va en T.accent; el gap
                  sigue la MISMA unidad que el número de la fila KPI (realMode). */}
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, marginTop: 4, color: T.ink }}>
                Con tu plan actual, todavía no llegas.
              </div>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, lineHeight: T.lh.snug, letterSpacing: T.tracking.tight, marginTop: 6, color: T.accent }}>
                Te faltan {fmtEur(gapDisplay)} para tu número.
              </div>
              <div style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.body, marginTop: 8, lineHeight: T.lh.normal, maxWidth: 560 }}>
                Ajusta tu aporte o tu horizonte ahí abajo y verás cómo esa distancia se acorta — el interés compuesto premia cada euro que adelantes.
              </div>
            </>
          )}
          {/* Banda de stats de contexto · compuesta (filete que la separa + divisores con oficio
              + cifras display) en vez de tres "etiqueta + número" sueltos. Cifras descriptivas →
              T.ink (sin color, doctrina). Misma info en ambos estados, sin competir con el héroe. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: mobile ? 16 : 0, marginTop: 24, paddingTop: 18, borderTop: '1px solid ' + T.line }}>
            {[
              { label: 'A los ' + profile.retireAge, value: fmtEur(finalActive.portfolio), sub: null },
              { label: 'Tu número' + (realMode ? ' (hoy)' : ''), value: fmtEur(numeroDisplay), sub: !realMode ? '≈ ' + fmtEur(fireTarget) + ' de hoy' : null },
              { label: 'Pensión pública', value: 'desde los ' + pensionAge, sub: null },
            ].map((s, i) => (
              <div key={i} style={{ flex: mobile ? '1 1 100%' : '0 0 auto', paddingLeft: (!mobile && i > 0) ? 26 : 0, marginLeft: (!mobile && i > 0) ? 26 : 0, borderLeft: (!mobile && i > 0) ? '1px solid ' + T.lineSoft : 'none' }}>
                <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.muted }}>{s.label}</div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, color: T.ink, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight, marginTop: 4 }}>{s.value}</div>
                {s.sub && <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.faint, marginTop: 3, lineHeight: T.lh.snug }}>{s.sub}</div>}
              </div>
            ))}
          </div>
          {hayPosibles && (
            <div style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.caption, marginTop: 14, lineHeight: T.lh.normal }}>
              Con los eventos posibles incluidos, a los {profile.retireAge} llegarías a {fmtEur(finalConPosible.portfolio)}.
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Supuestos visibles · resumen mono de las 4 asunciones (valores reales del estado)
          con salto a la card "Asunciones del modelo". DM Mono para metadatos; la card NO
          se mueve de sitio. Inflación con coma decimal española. */}
      {/* Píldora de supuestos · invitación a ajustar ANTES de leer las gráficas ("asunciones
          primero"). Geometría de la primitiva Pill (padding 4×10, radius 999, mono eyebrow,
          tracking.wide, borde T.line) sobre un <button> para el jump-link; "ajustar →" en accent.
          Botón (no <Pill> inline-flex) para que el texto largo de los supuestos envuelva en móvil. */}
      <button
        onClick={() => document.getElementById('proy-asunciones')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        style={{ alignSelf: 'flex-start', background: T.paper, border: '1px solid ' + T.line, borderRadius: 999, padding: '4px 10px', marginTop: 2, cursor: 'pointer', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wide, textTransform: 'uppercase', lineHeight: T.lh.normal, textAlign: 'left' }}>
        Supuestos · {plan.annualReturn != null ? plan.annualReturn : 8} % · {String(plan.inflationRate != null ? plan.inflationRate : 2.5).replace('.', ',')} % · {plan.withdrawalRate != null ? plan.withdrawalRate : 4} % · {plan.lifeExpectancy || 90} — <span style={{ color: T.accent, fontWeight: 700 }}>ajustar →</span>
      </button>

      {/* "El motor" · línea de vida + dial de aporte (reemplaza Curva de patrimonio + Tu yo del futuro) */}
      <ProyeccionEngine
        d={d}
        plan={plan}
        profile={profile}
        mobile={mobile}
        realMode={realMode}
        inflRate={inflRate}
        applyRealMode={applyRealMode}
        fiTargetReal={d.fiTarget || 0}
        updateSaving={m.updateSaving}
        updatePlan={updatePlan}
      />

      {/* v1.4.0d BIG-B · INGRESOS unificada (Salario base + Complementos en una sola Card) */}
      <Card>
        <Label>Ingresos</Label>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 6, lineHeight: T.lh.normal, maxWidth: 640 }}>
          Lo que entra cada mes. El salario base sube con el IPC según el factor que elijas; los complementos van aparte.
        </div>
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px dashed ' + T.lineSoft }}>
          <TramoListEditor
            tramos={activePlan.incomeSegments || []}
            onTramoChange={m.updateIncome}
            onAddTramo={m.addIncome}
            onDeleteTramo={m.deleteIncome}
            onSplitTramo={(id) => m.splitTramo('income', id)}
            onOpenWizard={() => setWizardOpen(true)}
            onNormalize={m.normalizeIncome}
            kind="income"
            title="Salario base"
            helpText={mobile ? null : "Por periodos. Cada tramo es un rango de fechas con un importe mensual."}
          />
          {/* Salary IPC update factor (v1.1.0) — vive dentro del sub-bloque Salario base */}
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px dashed ' + T.line }}>
            <Label style={{ marginBottom: 6 }}>Ajuste del salario por IPC</Label>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal, marginBottom: 12 }}>
              Cuánto se actualiza tu salario base con la inflación. 100% = sigue plenamente al IPC. 0% = no se ajusta.
            </div>
            {(() => {
              const cur = activePlan.salaryInflationFactor != null ? activePlan.salaryInflationFactor : 1.0;
              return (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {[
                    { id: 'full', label: 'Sí, completamente (100%)', factor: 1.0 },
                    { id: 'partial', label: 'Parcialmente', factor: 'partial' },
                    { id: 'none', label: 'No (0%)', factor: 0.0 },
                  ].map((opt) => {
                    const isActive = opt.factor === 'partial'
                      ? (cur > 0 && cur < 1)
                      : Math.abs(cur - opt.factor) < 0.001;
                    return (
                      <button key={opt.id} onClick={() => {
                        if (opt.factor === 'partial') {
                          if (cur >= 1 || cur <= 0) updatePlan({ salaryInflationFactor: 0.5 });
                        } else {
                          updatePlan({ salaryInflationFactor: opt.factor });
                        }
                      }} style={{
                        fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '8px 12px',
                        background: isActive ? T.ink : 'transparent',
                        color: isActive ? T.bg : T.muted,
                        border: '1px solid ' + (isActive ? T.ink : T.line),
                        borderRadius: 999, cursor: 'pointer',
                        letterSpacing: T.tracking.wider, textTransform: 'uppercase',
                      }}>{opt.label}</button>
                    );
                  })}
                </div>
              );
            })()}
            {(() => {
              const cur = activePlan.salaryInflationFactor != null ? activePlan.salaryInflationFactor : 1.0;
              if (cur > 0 && cur < 1) {
                return (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>% del IPC</span>
                    <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink }}>
                      <EditableNumber value={Math.round(cur * 100)} onChange={(v) => updatePlan({ salaryInflationFactor: Math.max(0, Math.min(100, v)) / 100 })} min={0} max={100} step={1} color={T.ink} /> %
                    </span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px dashed ' + T.lineSoft }}>
          <TramoListEditor
            tramos={activePlan.bonusSegments || []}
            onTramoChange={m.updateBonus}
            onAddTramo={m.addBonus}
            onDeleteTramo={m.deleteBonus}
            onNormalize={m.normalizeBonus}
            kind="bonus"
            title="Complementos"
            helpText={mobile ? null : "Pluses, dietas, comandancia… Se suman al salario base en sus fechas activas."}
          />
        </div>
      </Card>

      {/* v1.4.0c BIG-A · AHORRO · migrado desde Ajustes */}
      <Card>
        <TramoListEditor
          tramos={activePlan.savingSegments || []}
          onTramoChange={m.updateSaving}
          onAddTramo={m.addSaving}
          onDeleteTramo={m.deleteSaving}
          onSplitTramo={(id) => m.splitTramo('saving', id)}
          onNormalize={m.normalizeSaving}
          kind="saving"
          title="Tramos de aporte"
          helpText={mobile ? null : "Cuánto ahorras en cada periodo. Puedes elegir importe fijo (€) o porcentaje (%) del ingreso de ese tramo."}
        />
      </Card>

      {/* v1.4.0c BIG-A · EVENTOS · migrado desde Ajustes */}
      <Card>
        <EventListEditor
          events={activePlan.events || []}
          onChange={m.updateEvent}
          onAdd={m.addEvent}
          onDelete={m.deleteEvent}
        />
      </Card>

      {/* v1.4.0c BIG-A · ASUNCIONES DEL MODELO · 4 campos extraídos del Perfil de Ajustes.
          Ancla del salto desde la píldora "SUPUESTOS" del inicio de la pantalla. */}
      <div id="proy-asunciones" aria-hidden="true" style={{ scrollMarginTop: 16 }} />
      <Card pad={mobile ? 16 : 24}>
        <Label style={{ marginBottom: 4 }}>Asunciones del modelo</Label>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal, marginBottom: 16 }}>
          Toca cualquier cifra para ajustarla — recalcula toda la proyección.
        </div>
        {/* Banda de stats editable (mismo lenguaje que la fila de KPIs): eyebrow-concepto + cifra
            display grande + aviso inline. Sustituye la lista "etiqueta / valor" plana. */}
        {(() => {
          const ret = activePlan.annualReturn != null ? activePlan.annualReturn : 8;
          const infl = activePlan.inflationRate != null ? activePlan.inflationRate : 2.5;
          const wdr = activePlan.withdrawalRate != null ? activePlan.withdrawalRate : 4.0;
          const life = activePlan.lifeExpectancy != null ? activePlan.lifeExpectancy : 90;
          const stats = [
            { id: 'retorno-anual', label: 'Retorno anual', value: ret, on: (v) => updatePlan({ annualReturn: v }), min: 0, max: 20, step: 0.5, suffix: '%',
              warning: ret > 15 ? 'Por encima del 15% anual es expectativa muy optimista a largo plazo: ni los índices más agresivos lo han sostenido durante décadas. Considera bajarlo a un rango realista (6-9% para cartera global).' : null },
            { id: 'inflacion', label: 'Inflación esperada', value: infl, on: (v) => updatePlan({ inflationRate: v }), min: 0, max: 15, step: 0.1, suffix: '%',
              warning: infl > 8 ? 'Por encima del 8% es hipótesis de inflación muy alta. España solo ha estado en ese rango en periodos cortos (años 70-80, crisis energéticas). Si modelas un escenario adverso, mantenlo; si no, baja a 2-3%.' : null },
            { id: 'tasa-retiro', label: 'Tasa de retiro', value: wdr, on: (v) => updatePlan({ withdrawalRate: v }), min: 2, max: 8, step: 0.1, suffix: '%',
              warning: wdr < 3 ? 'Por debajo del 3% es muy conservador: requerirá un patrimonio considerablemente mayor para cubrir el mismo gasto. Tiene sentido si planificas un retiro muy largo (40+ años) o quieres dejar herencia.'
                : wdr > 6 ? 'Por encima del 6% es agresivo: la probabilidad de agotar la cartera antes de tiempo crece de forma significativa. Estudios recientes (Bengen 2025, Morningstar 2026) sitúan el rango seguro entre 3,5% y 4,7%.' : null },
            { id: 'esperanza-vida', label: 'Esperanza de vida', value: life, on: (v) => updatePlan({ lifeExpectancy: v }), min: 70, max: 110, step: 1, suffix: 'años', warning: null },
          ];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 0 }}>
              {stats.map((s, i) => (
                <div key={s.id} style={{ paddingLeft: (!mobile && i > 0) ? 20 : (mobile && i % 2 ? 16 : 0), marginLeft: (!mobile && i > 0) ? 20 : 0, borderLeft: (!mobile && i > 0) ? '1px solid ' + T.lineSoft : 'none', marginTop: (mobile && i >= 2) ? 16 : 0 }}>
                  <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.muted }}>
                    <Concept id={s.id}>{s.label}</Concept>
                  </div>
                  <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, color: T.ink, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight, marginTop: 4 }}>
                    <EditableNumber value={s.value} onChange={s.on} min={s.min} max={s.max} step={s.step} color={T.ink} /> <span style={{ fontSize: T.size.body, color: T.muted }}>{s.suffix}</span>
                  </div>
                  {s.warning && <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.amber, fontSize: T.size.caption, marginTop: 6, lineHeight: T.lh.normal }}>{s.warning}</div>}
                </div>
              ))}
            </div>
          );
        })()}
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, lineHeight: T.lh.normal, paddingTop: 14, borderTop: '1px dashed ' + T.line, marginTop: 18 }}>
          Los valores por defecto son medias razonables a largo plazo. La tasa de retiro del 4% asume jubilación de ~30 años (estudio Trinity); para retiros más largos (40+ años) conviene bajar a 3-3,5%. Cambiar estos valores actualiza toda la proyección.
        </div>
      </Card>

      {/* Monte Carlo · al final, tras las cards editables (BIG-B reorden v1.4.0d) */}
      <MonteCarloCard plan={plan} profile={profile} d={d} realMode={realMode} inflRate={inflRate} />

      {/* "En limpio" · retrato del destino FIRE · ÚLTIMO bloque de la pantalla.
          Consume lo expuesto en useDerived (commit 49446cb): destinoEstado, cruceEdad,
          fiTarget. Sin lógica de motor: solo lee y formatea. Forma C (un dato manda
          arriba, voz debajo). Verde SOLO en 'libre'; edad SIEMPRE Math.ceil hacia arriba. */}
      <Card>
        <Label style={{ color: T.faint }}>En limpio</Label>
        {(() => {
          const estado = d.destinoEstado;
          const edad = d.cruceEdad != null ? Math.ceil(d.cruceEdad) : null;
          const numero = fmtEur(d.fiTarget || 0);
          const kicker = { fontFamily: T.mono, fontSize: T.size.caption, color: T.muted, letterSpacing: T.tracking.wide, marginTop: 18 };
          const cifra = { fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, marginTop: 2 };
          const frase = { fontFamily: T.serif, fontWeight: 400, fontSize: T.size.lead, lineHeight: T.lh.normal, color: T.ink, marginTop: 12 };
          const notaHoy = { fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wide, marginTop: 12 };
          if (estado === 'libre') {
            return (
              <>
                <div style={kicker}>libre por tu cuenta a los</div>
                <div style={{ ...cifra, color: T.green }}>★ {edad}</div>
                <div style={frase}>Necesitas {numero} para vivir de tu cartera. La palanca es tu ahorro, no tu sueldo; la pensión es viento de cola.</div>
                <div style={notaHoy}>cifra en € de hoy</div>
              </>
            );
          }
          if (estado === 'tarde') {
            return (
              <>
                <div style={kicker}>a este ritmo, libre a los</div>
                <div style={{ ...cifra, color: T.amber }}>{edad}</div>
                <div style={frase}>Vas más allá de la edad que querías. Tu número son {numero}, y al ritmo actual llegas tarde.</div>
                <div style={notaHoy}>cifra en € de hoy</div>
              </>
            );
          }
          // 'no-llega' · sobrio: sin dígito de edad, nada de verde.
          return (
            <>
              <div style={kicker}>aún fuera de alcance</div>
              <div style={{ ...frase, marginTop: 14 }}>Con los supuestos actuales no llegas a vivir solo de tu cartera antes de los 90. Tu número son {numero} en € de hoy.</div>
            </>
          );
        })()}
      </Card>

      {/* "Siguiente paso" · dirección determinista (cero IA) según destinoEstado. Reusa
          coastEdad/leanEdad/ahorroMas5Edad de useDerived. Dos vías nombradas como hitos
          del camino (Coast/Lean FIRE), nunca clasifican ("eres un…"). Verde en NINGÚN
          sitio. Borde izquierdo amber salvo en 'libre' (accent). Va DEBAJO de "En limpio". */}
      {(() => {
        const estado = d.destinoEstado;
        const cruce = d.cruceEdad;
        const ceil = (x) => (x != null ? Math.ceil(x) : null);
        const eurMes = (v) => fmtEur(v);
        const bodyStyle = { fontFamily: T.serif, fontSize: T.size.lead, lineHeight: T.lh.normal, color: T.ink, marginTop: 12 };
        const subKicker = { fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' };
        const viaFrase = { fontFamily: T.serif, fontSize: T.size.body, lineHeight: T.lh.normal, color: T.muted, marginTop: 6 };
        const strong = { color: T.ink, fontWeight: 600 };
        const scrollDial = () => document.getElementById('proy-dial')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Control leanPct · 60/70/80% del gasto. Persiste vía updatePlan. Geometría Pill.
        const leanControl = (
          <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wide }}>gasto esencial</span>
            {[0.6, 0.7, 0.8].map((p) => {
              const on = Math.abs((d.leanPct != null ? d.leanPct : 0.70) - p) < 0.001;
              return (
                <button key={p} onClick={() => updatePlan({ leanPct: p })} aria-pressed={on} style={{
                  fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
                  border: '1px solid ' + (on ? T.ink : T.line), background: on ? T.ink : 'transparent', color: on ? T.bg : T.muted,
                  letterSpacing: T.tracking.wide,
                }}>{Math.round(p * 100)}%</button>
              );
            })}
          </div>
        );
        // Vía Lean como sub-bloque colgado (children de NextStep), separado por filete.
        const leanVia = (lead) => (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed ' + T.line }}>
            <div style={subKicker}>Lean FIRE</div>
            <div style={viaFrase}>{lead}</div>
            {leanControl}
          </div>
        );

        if (estado === 'libre') {
          if (d.coastEdad != null && cruce != null && d.coastEdad < cruce) {
            return (
              <NextStep tone="forward">
                <div style={{ ...subKicker, marginTop: 12 }}>Coast FIRE</div>
                <div style={{ ...bodyStyle, marginTop: 6 }}>Ya puedes bajar el ritmo: con lo acumulado, sin aportar un euro más, el interés te lleva a tu número. Cada aporte extra solo lo adelanta.</div>
              </NextStep>
            );
          }
          return (
            <NextStep
              tone="forward"
              body="Vas en camino. Registra tus meses para ver tu avance real frente al plan."
              action={{ label: 'Ir a Mes a mes →', onClick: () => update({ activeTab: 'seguimiento' }) }}
            />
          );
        }

        if (estado === 'tarde') {
          return (
            <NextStep
              tone="behind"
              body={d.ahorroMas5Edad != null
                ? <>Subir tu ahorro 5 puntos adelanta el cruce a los <strong style={strong}>{ceil(d.ahorroMas5Edad)}</strong>.</>
                : <>Subir tu ahorro acerca tu cruce. Ajusta el aporte abajo para verlo.</>}
              action={{ label: 'Ajustar el dial de aporte →', onClick: scrollDial }}
            >
              {d.leanEdad != null && cruce != null && d.leanEdad < cruce &&
                leanVia(<>Si te bastara con lo esencial (~{eurMes(d.leanGastoMes)}/mes), serías libre a los <strong style={strong}>{ceil(d.leanEdad)}</strong>.</>)}
            </NextStep>
          );
        }

        // 'no-llega'
        return (
          <NextStep tone="behind" body="Sube el ahorro o baja el objetivo hasta que aparezca una edad de libertad.">
            {d.leanEdad != null &&
              leanVia(<>A gasto esencial (~{eurMes(d.leanGastoMes)}/mes) sí llegarías: libre a los <strong style={strong}>{ceil(d.leanEdad)}</strong>.</>)}
          </NextStep>
        );
      })()}

      {wizardOpen && (
        <ProgressionWizard
          onClose={() => setWizardOpen(false)}
          onApply={(tramos, replace) => m.replaceIncomeWith(tramos, replace)}
        />
      )}
    </div>
  );
}

export function HitosEditor() {
  const { state, addGoal, updateGoal, removeGoal } = useStore();
  const d = useDerived();
  const { profile, plan, goals } = state;
  const [newGoal, setNewGoal] = useState({ name: '', target: 10000, targetAge: profile.age + 5, category: 'otro' });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <Label>Hitos</Label>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.caption, marginTop: 4, lineHeight: T.lh.normal }}>
          Metas intermedias en tu camino. Define el importe en euros de hoy (poder adquisitivo actual); Mi Plan FIRE ajusta por <Concept id="inflacion">inflación</Concept> hasta la fecha objetivo.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {goals.length === 0 && (
            <Card style={{ borderStyle: 'dashed', padding: 24 }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal }}>
                Aún no has añadido ningún hito a tu plan. Los hitos son metas intermedias (un colchón de liquidez, comprar una vivienda, pagar la entrada, etc.) que te ayudan a estructurar tu camino. Añade el primero cuando quieras.
              </div>
            </Card>
          )}
          {goals.map((g) => (
            <GoalRow key={g.id} goal={g} d={d} profile={profile} plan={plan}
              onChange={(p) => updateGoal(g.id, p)} onRemove={() => removeGoal(g.id)} />
          ))}
        </div>
        <Card>
          <Label style={{ marginBottom: 14 }}>Añadir una meta</Label>
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
                style={{ width: '100%', fontFamily: T.serif, fontSize: T.size.body, padding: '8px 10px', background: T.bg, border: '1px solid ' + T.line, borderRadius: 8, outline: 'none', color: T.ink }}>
                {GOAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <Btn variant="accent" size="sm" onClick={() => {
              if (!newGoal.name.trim()) return;
              addGoal(newGoal);
              setNewGoal({ name: '', target: 10000, targetAge: profile.age + 5, category: 'otro' });
            }}>Añadir meta</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ScreenSeguimiento() {
  const d = useDerived();
  const { update } = useStore();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40 }}>
      <div>
        <Label>Seguimiento</Label>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, letterSpacing: T.tracking.display, marginTop: 4 }}>
          Cómo va tu plan, mes a mes.
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 8, maxWidth: 640, lineHeight: T.lh.normal }}>
          Registra cada mes lo que has aportado de verdad, sigue el avance de tus hitos y revisa cómo se reparte tu ingreso a lo largo del tiempo.
        </div>
      </div>

      {/* Bloque 1 · Mensual (flujo + registro mes a mes) */}
      <section id="seg-mensual" style={{ display: 'flex', flexDirection: 'column', gap: 14, scrollMarginTop: 16 }}>
        <MonthlyFlowBlock />
        <ScreenMesAMes />
      </section>

      {/* Bloque 2 · Hitos (v1.4.0c BIG-A · editable in-place via HitosEditor) */}
      <section>
        <Card>
          <HitosEditor />
        </Card>
      </section>

      {/* Bloque 3 · Reparto del ingreso en el tiempo */}
      <section>
        <RepartoIngresoBlock />
      </section>

      {/* Siguiente paso (P8) · dirección determinista según el RITMO de aporte: media de lo
          aportado (avgActual) frente a lo que el plan pide ahora (currentAporte). Es el señal
          más directo de "¿mantengo el ritmo?" en una pantalla de seguimiento mensual — no uso
          realVsPlanDelta (con el tramo de ahorro arrancando hoy, lo planificado en meses
          pasados es 0 → siempre "por delante") ni d.ahead (compara pace plano vs plan creciente
          con IPC → casi siempre "por detrás"). Sin verde (aquí no hay libertad plena). */}
      <section>
        {(() => {
          const noMeses = !(d.filledMonths && d.filledMonths.length);
          const ahead = !noMeses && d.avgActual >= d.currentAporte;
          let frase, label, onClick;
          if (noMeses) {
            frase = 'Aún no registras meses. Anota el primero para comparar realidad y plan.';
            label = 'Registrar un mes →';
            onClick = () => document.getElementById('seg-mensual')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (ahead) {
            frase = 'Vas por delante del plan. Mira cuánto adelanta tu fecha de libertad.';
            label = 'Ir a Proyección →';
            onClick = () => update({ activeTab: 'proy' });
          } else {
            frase = 'Vas por detrás del plan. Revisa tu aporte para recuperar el ritmo.';
            label = 'Ir a Proyección →';
            onClick = () => update({ activeTab: 'proy' });
          }
          return (
            <NextStep tone={(noMeses || ahead) ? 'forward' : 'behind'} body={frase} action={{ label, onClick }} />
          );
        })()}
      </section>
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
  const tg = useMemo(() => {
    const series = d.seriesPlan || [];
    for (let i = 0; i < series.length; i++) {
      if (series[i].portfolio >= goal.target) {
        return { age: series[i].age, months: i };
      }
    }
    return null;
  }, [d.seriesPlan, goal.target]);

  const needMonthly = useMemo(() => monthlyForGoal({
    age: profile.age, targetAge: goal.targetAge, capital: d.currentPortfolio, ret: plan.annualReturn, target: goal.target,
  }), [profile, goal, plan, d]);
  const currentAporte = d.currentAporte || 0;
  const onTrack = tg && tg.age <= goal.targetAge;
  const progress = Math.min(100, d.currentPortfolio / goal.target * 100);
  const category = goal.category || 'otro';
  const categoryLabel = GOAL_CATEGORY_LABEL[category] || 'Otro';

  return (
    <Card>
      <button onClick={onRemove} title="Eliminar meta"
        style={{
          position: 'absolute', top: 10, right: 12,
          fontFamily: T.mono, fontSize: T.size.body, color: T.faint,
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '4px 6px', lineHeight: 1, borderRadius: 4,
        }}>×</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 100%', minWidth: 0, paddingRight: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
            <input value={goal.name} onChange={(e) => onChange({ name: e.target.value })}
              style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, background: 'transparent', border: 'none', outline: 'none', color: T.ink, padding: 0, flex: '1 1 60%', minWidth: 100 }} />
            <Pill color={onTrack ? T.green : T.amber} bg={onTrack ? T.greenSoft : 'rgba(180,83,9,0.10)'} border="transparent" style={{ fontSize: T.size.eyebrow, padding: '3px 8px' }}>
              {onTrack ? 'En camino' : 'Falta'}
            </Pill>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Categoría</span>
            <select value={category} onChange={(e) => onChange({ category: e.target.value })}
              style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '4px 8px', background: T.bg, border: '1px solid ' + T.line, borderRadius: 999, color: T.ink, letterSpacing: T.tracking.wide }}>
              {GOAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 8 }}>
            <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.accent }}>
              <EditableNumber value={goal.target} onChange={(v) => onChange({ target: v })} min={100} max={10_000_000} width={100} color={T.accent} />€
            </span>
            <span style={{ fontFamily: T.serif, color: T.muted }}>a los <EditableNumber value={goal.targetAge} onChange={(v) => onChange({ targetAge: v })} min={profile.age + 1} max={90} width={36} color={T.ink} /> años</span>
          </div>
          <div style={{ marginTop: 14, height: 8, background: T.line, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: progress + '%', height: '100%', background: onTrack ? T.green : T.accent, borderRadius: 999, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, marginTop: 4, letterSpacing: T.tracking.wide }}>
            <span>{Math.round(progress)}% logrado · {fmtEur(d.currentPortfolio)}</span>
            <span>faltan {fmtEur(Math.max(0, goal.target - d.currentPortfolio))}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 18, paddingTop: 18, borderTop: '1px dashed ' + T.lineSoft }}>
        <SmallStat label="A tu ritmo actual" value={tg ? `${tg.age.toFixed(1)} años` : '—'} sub={tg ? `en ${(tg.months / 12).toFixed(1)} años` : 'fuera de alcance'} />
        <SmallStat label="Hace falta al mes" value={fmtEur(needMonthly)} sub={`para llegar a los ${goal.targetAge}`} accent={needMonthly > currentAporte} />
        <SmallStat label="Diferencia" value={needMonthly > currentAporte ? `+${fmtEur(needMonthly - currentAporte)}/mes` : 'Vas sobrado'} sub={needMonthly > currentAporte ? `extra sobre tu ${fmtEur(currentAporte)}` : 'al ritmo actual'} good={needMonthly <= currentAporte} bad={needMonthly > currentAporte} />
      </div>

      <GoalContextualBlock goal={goal} category={category} portfolio={d.currentPortfolio} />
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
        fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase',
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
          <Label>Pensión pública española</Label>
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
              <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>
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

export function AccountsCard() {
  const { accounts, activeAccountId, switchAccount, createAccount, renameAccount, deleteAccount } = useStore();
  const [renaming, setRenaming] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const list = Object.values(accounts || {});
  const hasMultiple = list.length > 1;

  const beginRename = (a) => { setRenaming(a.id); setDraftLabel(a.label); };
  const commitRename = () => {
    if (renaming && draftLabel.trim()) renameAccount(renaming, draftLabel.trim());
    setRenaming(null);
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Label>Personas en este dispositivo</Label>
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
                  {isActive && <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.accent, marginLeft: 8, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>activa</span>}
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
    </Card>
  );
}

export function ScreenAjustes() {
  const { state, activePlan,
    resetAll, reonboard, seedDemoConfirm, updatePlan, update, updateProfile } = useStore();
  const mobile = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <div>
        <Label>Datos</Label>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, letterSpacing: T.tracking.display, marginTop: 4 }}>
          Quién eres y dónde están tus cuentas.
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 8, maxWidth: 640, lineHeight: T.lh.normal }}>
          Datos personales y administrativos. Para ajustar tu plan (tramos, ahorro, eventos, asunciones), ve a Proyección. Para tus hitos, ve a Seguimiento.
        </div>
      </div>

      {/* PERFIL — v1.4.0c · BIG-A · podado: solo campos personales. Las 4 asunciones del modelo (retorno, inflación, tasa retiro, esperanza vida) se mueven a ScreenProyeccion → "Asunciones del modelo". */}
      <Card pad={mobile ? 16 : 24}>
        <Label style={{ marginBottom: 14 }}>Tu perfil</Label>
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
      </Card>

      {/* PENSIÓN PÚBLICA */}
      <PublicPensionCard plan={activePlan} updatePlan={updatePlan} profile={state.profile} />

      {/* CUENTAS */}
      <AccountsCard />

      {/* DATOS */}
      <Card>
        <Label style={{ marginBottom: 14 }}>Tus datos</Label>
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
                try { update(migrateToV2(JSON.parse(ev.target.result))); }
                catch(err) { alert('JSON inválido'); }
              };
              reader.readAsText(file);
            };
            input.click();
          }}>Importar JSON</Btn>
          <Btn variant="ghost" size="sm" onClick={seedDemoConfirm}>Cargar datos demo</Btn>
          <Btn variant="ghost" size="sm" onClick={resetAll} style={{ color: T.red, borderColor: T.red }}>Borrar todo</Btn>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn variant="ghost" size="sm" onClick={reonboard}>↻ Volver al onboarding</Btn>
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed ' + T.lineSoft, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
          {/* B8 · Permanent access to LandingPreOnboarding in revisit mode. */}
          <button onClick={() => window.__openRevisitLanding && window.__openRevisitLanding()} style={{
            fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, background: 'transparent',
            border: 'none', cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase', padding: 0,
          }}>Ver presentación de Mi Plan FIRE →</button>
          <button onClick={() => window.__openLanding && window.__openLanding()} style={{
            fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, background: 'transparent',
            border: 'none', cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase', padding: 0,
          }}>Ver presentación visual antigua →</button>
        </div>
      </Card>

    </div>
  );
}

export function ExpenseRow({ k, label, chips, expenses, onSetExpense }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed ' + T.lineSoft, paddingBottom: 10, marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 110 }}>
        <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>{label}</div>
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
        <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>{label}</div>
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

        <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.faint, marginBottom: 8 }}>
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
              <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Total</div>
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
              <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Total</div>
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
                <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Gastos declarados</div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight }}>{fmtEur(totalExpenses)}<span style={{ fontSize: T.size.caption, color: T.muted, marginLeft: 4 }}>/mes</span></div>
              </div>
              <div style={{ padding: 14, background: T.panel, borderRadius: 10, border: '1px solid ' + T.line }}>
                <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Hipoteca</div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight }}>
                  {data.mortgage.enabled
                    ? `Sí · ${fmtEur(data.mortgage.originalAmount)} · ${data.mortgage.type === 'fixed' ? data.mortgage.fixedRate + '% fijo' : `${data.mortgage.type} ${(data.mortgage.euriborRef + data.mortgage.spread).toFixed(1)}%`} · ${data.mortgage.termYears}a`
                    : 'No declarada'}
                </div>
              </div>
              <div style={{ padding: 14, background: T.panel, borderRadius: 10, border: '1px solid ' + T.line }}>
                <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Distribución del capital</div>
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
                <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.muted }}>Crecimiento salarial asumido</span>
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
            <div style={{ display: 'flex', gap: 14, fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wide, textTransform: 'uppercase', marginTop: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 0, borderTop: '2px dashed ' + T.faint }} /> {hasMultipleIncomeSegments ? 'Salario sobre el papel (según tu plan)' : `Salario sobre el papel (sube ${salaryGrowthAnnual.toFixed(1)}%/año)`}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 2, background: T.accent }} /> Poder adquisitivo (ajustado por inflación)
              </span>
            </div>
            <div style={{ marginTop: 16, padding: '14px 16px', background: T.panel, border: '1px solid ' + T.line, borderRadius: 10 }}>
              <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.normal }}>
                En <strong>{yearsToRetire} años</strong>, tu salario habrá crecido hasta <strong style={{ color: T.accent }}>{fmtEur(erosion.finalNominal)}/mes</strong> sobre el papel, pero comprará lo que <strong style={{ color: T.accent }}>{fmtEur(erosion.finalReal)}</strong> compran hoy.
              </div>
            </div>
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed ' + T.line }}>
              <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Poder adquisitivo perdido (acumulado)</div>
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
        <div style={{ display: 'flex', gap: 14, fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wide, textTransform: 'uppercase', marginTop: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 0, borderTop: '2px dashed ' + T.faint }} /> En cuenta corriente (real)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 2, background: T.accent }} /> Con Mi Plan (real)
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 16 }}>
          <div style={{ padding: '12px 14px', background: T.panel, border: '1px solid ' + T.line, borderRadius: 10 }}>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Sin Plan</div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.faint, letterSpacing: T.tracking.tight }}>{fmtEur(oppCost.parkedFinalReal)}</div>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 4, letterSpacing: T.tracking.wide }}>ajustado por inflación</div>
          </div>
          <div style={{ padding: '12px 14px', background: T.ink, color: T.bg, borderRadius: 10 }}>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Con Plan</div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight }}>{fmtEur(oppCost.investedFinalReal)}</div>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: 'rgba(255,255,255,0.45)', marginTop: 4, letterSpacing: T.tracking.wide }}>ajustado por inflación</div>
          </div>
        </div>
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed ' + T.line }}>
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Diferencia</div>
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
                      <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>{row.label}</div>
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
              <div style={{ display: 'flex', gap: 14, fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wide, textTransform: 'uppercase', marginTop: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 10, background: T.accent }} /> Capital amortizado
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 14, height: 10, background: T.amber }} /> Intereses
                </span>
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed ' + T.line }}>
                <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>Intereses totales a lo largo del plazo</div>
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
                    <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>{c.label}</div>
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
          fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase',
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

  // "Leído" persistente (para retomar): se marca al ABRIR un concepto. Vive en
  // plan.readLessons ({id:true}, patrón de phaseManualChecks); default en lectura, sin
  // tocar migrateToV2 ni LEARN_CORPUS (contenido editorial cerrado, solo se referencia).
  const { state, mutatePlan } = useStore();
  const readLessons = (state.plan && state.plan.readLessons) || {};
  const markRead = (id) => { if (id && !readLessons[id]) mutatePlan(p => ({ ...p, readLessons: { ...(p.readLessons || {}), [id]: true } })); };
  const openConcept = (id) => { markRead(id); setActiveId(id); };

  const allConcepts = Object.entries(LEARN_CORPUS).map(([id, c]) => ({ id, ...c }));
  // For the Conceptos tab, surface every entry of LEARN_CORPUS as a card —
  // not just those with full articles — so the levels stay coherent.
  const filteredConcepts = allConcepts.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return c.title.toLowerCase().includes(q) || (c.short && c.short.toLowerCase().includes(q));
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
        <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.faint }}>
          Aprende
        </div>
        <h1 style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayXxl, lineHeight: 1, letterSpacing: T.tracking.display, margin: '8px 0 0', color: T.ink }}>
          Los conceptos<br />que sostienen tu plan
        </h1>
        <p style={{ fontFamily: T.serif, fontSize: T.size.lead, lineHeight: T.lh.normal, color: T.muted, marginTop: 18, maxWidth: 580 }}>
          No tienes que leerlos todos, ni en orden. Vuelve cuando algo te confunda. Cada artículo es independiente.
        </p>
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
              <h2 style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.faint, marginBottom: 16 }}>
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
                    <div style={{ marginTop: 12, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.faint }}>
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
                      <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.faint }}>
                        {LEARN_LEVEL_LABELS[lvlId] || 'Avanzado'}
                      </span>
                      {readLessons[c.id] && <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.faint }}>✓ leído</span>}
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
              <h2 style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.faint, marginBottom: 14 }}>
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
                    <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint }}>→</span>
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

      {activeId && <ConceptModal id={activeId} onClose={() => setActiveId(null)} />}
    </div>
  );
}

export function KpiPill({ onClick }) {
  const d = useDerived();
  const { state } = useStore();
  const mobile = useIsMobile();
  // Más presencia en escritorio (tamaño/padding/sparkline mayores); en móvil se
  // mantiene compacto. Usa el breakpoint del proyecto (useIsMobile).
  const sw = mobile ? 24 : 34, sh = mobile ? 9 : 12;
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: mobile ? 8 : 10,
      padding: mobile ? '5px 11px' : '8px 16px',
      background: T.ink, color: T.bg, borderRadius: 999,
      border: 'none', cursor: onClick ? 'pointer' : 'default',
      fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto',
    }}>
      <span style={{ fontFamily: T.mono, fontSize: mobile ? 9 : 11, letterSpacing: '0.12em', color: 'rgba(245,240,230,0.6)' }}>
        {state.profile.retireAge}→
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

export function Shell() {
  const { state, update, seedDemo } = useStore();
  const mobile = useIsMobile();
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
  if (!state.hasSeenLandingPreOnboarding) {
    return (
      <>
        <LandingPreOnboarding
          mode="intro"
          onStart={() => update({ hasSeenLandingPreOnboarding: true })}
          onOpenManifesto={() => setShowManifesto(true)}
        />
        {showManifesto && <WhyDifferentModal onClose={() => setShowManifesto(false)} />}
      </>
    );
  }
  if (!state.landingSeen) return <Landing
    mode="intro"
    onStart={() => update({ landingSeen: true })}
    onLoadDemo={() => seedDemo()}
  />;
  if (!state.onboardingComplete) return <Onboarding />;
  if (showLanding) return <Landing mode="view" onClose={() => setShowLanding(false)} />;
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
    { id: 'seguimiento', label: 'Seguimiento', symbol: '◧' },
    { id: 'aprender', label: 'Aprende', symbol: '◇' },
    { id: 'ajustes', label: 'Datos', symbol: '◌' },
  ];

  if (mobile) return (
    <>
    <div style={{ width: '100vw', minHeight: '100vh', background: T.bg, color: T.ink, fontFamily: T.serif, display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '10px 14px', background: T.panel, borderBottom: '1px solid ' + T.line, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => setShowRevisitLanding(true)} aria-label="Ver presentación de Mi Plan FIRE" style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontStyle: 'italic', fontSize: 22, color: T.accent, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1 }}>
          Mi Plan
        </button>
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
        <button onClick={() => setShowRevisitLanding(true)} aria-label="Ver presentación de Mi Plan FIRE" style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontStyle: 'italic', fontSize: 28, color: T.accent, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1 }}>
          Mi Plan
        </button>
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
