// Galería de componentes — herramienta de desarrollo PERMANENTE (Tanda 3).
// Renderiza cada primitiva de ui/ con variantes representativas para
// validación visual. No es UI de producto; no borrar.
import { useState, useMemo } from 'react'
import { T } from '../tokens/index.js'
import {
  EditableNumber, Slider, Pill, Card, Label, Btn, MonthInput,
  Stat, SmallStat, Row, RowWithWarning, LegendChip, LearnIcon,
} from '../ui/index.jsx'
import {
  LineChart, Sparkline, LifecycleChart, LifecycleChartDual, MultiLineChart, FlowTimelineCard,
} from '../charts/index.jsx'
import { project, projectV2, projectDecumulation, projectStandardPlan } from '../lib/index.js'
import {
  ConfirmModal, WhyDifferentModal, MonthlyCalendarModal, PublicPensionDisclaimerModal,
  ProgressionWizard, Concept, ConceptModal, AboutModal,
} from '../modals/index.jsx'
import { TABLON, LEARN_CORPUS } from '../content/index.js'
import { LandingPreOnboarding, Landing } from '../flows/index.jsx'
import { CartelCard, CartelBtn, CartelLabel, cartelNums } from '../ui/cartel.jsx'

function Section({ name, note, children }) {
  return (
    <section style={{ marginBottom: 34 }}>
      <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest, textTransform: 'uppercase', color: T.accent, borderBottom: '1px solid ' + T.line, paddingBottom: 6, marginBottom: 14 }}>
        {name}{note ? <span style={{ color: T.faint, marginLeft: 8, letterSpacing: T.tracking.wide }}>· {note}</span> : null}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>{children}</div>
    </section>
  )
}

// Plan/perfil de ejemplo para alimentar los gráficos con datos realistas.
const samplePlan = {
  capital: 12000, annualReturn: 8, inflationRate: 2.5, salaryInflationFactor: 1.0,
  withdrawalRate: 4.0, lifeExpectancy: 90,
  incomeSegments: [{ id: 'i1', from: '2020-01', to: null, amount: 2500 }],
  bonusSegments: [{ id: 'b1', from: '2020-01', to: null, amount: 0 }],
  savingSegments: [{ id: 's1', from: '2020-01', to: null, type: 'fixed', value: 600 }],
  events: [],
  publicPension: { enabled: true, monthlyAmount: 1000, startAge: 67 },
}
const sampleProfile = { age: 30, retireAge: 60 }

function ChartBox({ name, w = 640, children }) {
  return (
    <div style={{ width: w, maxWidth: '100%' }}>
      <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.faint, marginBottom: 6 }}>{name}</div>
      {children}
    </div>
  )
}

export default function Gallery() {
  const [num, setNum] = useState(42)
  const [big, setBig] = useState(1200)
  const [sliderV, setSliderV] = useState(15)
  const [sliderEur, setSliderEur] = useState(60000)
  const [month, setMonth] = useState('2026-05')
  const [openModal, setOpenModal] = useState(null)
  const [openFlow, setOpenFlow] = useState(null)

  // Calendario de ejemplo para MonthlyCalendarModal (props/callbacks mock).
  const year = new Date().getFullYear()
  const monthsGrouped = [[String(year), [
    { key: `${year}-01`, monthIndex: 0, year, actual: 600, label: 'ene. ' + year, note: '' },
    { key: `${year}-02`, monthIndex: 1, year, actual: 450, label: 'feb. ' + year, note: 'mes flojo' },
    { key: `${year}-03`, monthIndex: 2, year, actual: 800, label: 'mar. ' + year, note: '' },
  ]]]

  // Datos de ejemplo para charts/ (proyecciones reales con las funciones de lib).
  const charts = useMemo(() => {
    const lineSeries = project({ age: 30, retireAge: 60, capital: 12000, monthly: 600, ret: 8 })
    const userSeries = projectV2(samplePlan, sampleProfile)
    const retireCapital = userSeries.length ? userSeries[userSeries.length - 1].portfolio : 0
    const decum = projectDecumulation(retireCapital, samplePlan, sampleProfile.retireAge, samplePlan.lifeExpectancy).series
    const std = projectStandardPlan({ plan: samplePlan, profile: sampleProfile }).series
    const scenarios = [
      { label: '8% anual (base)', color: T.accent, bold: true, series: userSeries },
      { label: '10% anual', color: T.green, dashed: true, series: projectV2({ ...samplePlan, annualReturn: 10 }, sampleProfile) },
      { label: '5% anual', color: T.faint, dashed: true, series: projectV2({ ...samplePlan, annualReturn: 5 }, sampleProfile) },
    ]
    return { lineSeries, userSeries, std, decum, scenarios }
  }, [])

  return (
    <div style={{ background: T.bg, color: T.ink, padding: '2rem', fontFamily: T.sans }}>
      <h1 style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, lineHeight: T.lh.tight, margin: '0 0 4px' }}>
        Galería de componentes · <code>ui/</code>
      </h1>
      <p style={{ fontFamily: T.sans, fontSize: T.size.caption, color: T.muted, marginTop: 0, marginBottom: 28 }}>
        Tanda 3 — 12 primitivas extraídas byte-a-byte. Validación visual.
      </p>

      <Section name="Btn" note="variantes × tamaños">
        {['primary', 'accent', 'amber', 'ghost', 'text'].map((v) => (
          <Btn key={v} variant={v} onClick={() => {}}>{v}</Btn>
        ))}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexBasis: '100%' }}>
          <Btn variant="primary" size="sm">sm</Btn>
          <Btn variant="primary" size="md">md</Btn>
          <Btn variant="primary" size="lg">lg</Btn>
        </div>
      </Section>

      <Section name="Card" note="pad por defecto y custom">
        <Card style={{ maxWidth: 260 }}>
          <Label style={{ marginBottom: 6 }}>Card por defecto</Label>
          <div style={{ fontFamily: T.serif, color: T.muted, fontSize: T.size.body }}>
            Contenido de ejemplo dentro de una Card.
          </div>
        </Card>
        <Card pad={10} style={{ maxWidth: 200 }}>
          <Label>pad=10</Label>
        </Card>
      </Section>

      <Section name="Pill">
        <Pill>neutra</Pill>
        <Pill color={T.green} bg={T.greenSoft} border="transparent">en camino</Pill>
        <Pill color={T.amber} bg="rgba(180,83,9,0.10)" border="transparent">falta</Pill>
        <Pill color={T.accent} bg={T.accentSoft} border="transparent">acento</Pill>
      </Section>

      <Section name="Label">
        <Label>Etiqueta mono uppercase</Label>
      </Section>

      <Section name="Stat" note="neutro / muted / good / bad">
        <Stat label="Patrimonio" value="124k€" />
        <Stat label="Apagado" value="—" muted />
        <Stat label="En camino" value="+8.2%" good />
        <Stat label="Pérdida" value="-3.1%" bad />
      </Section>

      <Section name="SmallStat" note="accent / good / bad">
        <SmallStat label="A tu ritmo" value="58.4 años" sub="en 28.4 años" />
        <SmallStat label="Hace falta" value="450€/mes" sub="para los 60" accent />
        <SmallStat label="Diferencia" value="Vas sobrado" sub="al ritmo actual" good />
        <SmallStat label="Diferencia" value="+120€/mes" sub="extra sobre 330€" bad />
      </Section>

      <Section name="Row / RowWithWarning">
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row label="Retorno anual">8%</Row>
          <Row label="Inflación">2.5%</Row>
          <RowWithWarning label="Tasa de retiro" warning="Por encima del 4% recomendado a 30 años.">6%</RowWithWarning>
          <RowWithWarning label="Edad objetivo">60</RowWithWarning>
        </div>
      </Section>

      <Section name="LegendChip" note="sólido y dashed">
        <LegendChip color={T.accent} label="Tu trayectoria" />
        <LegendChip color={T.faint} label="Plan estándar" dashed />
        <LegendChip color={T.green} label="Aportado" dashed />
      </Section>

      <Section name="EditableNumber" note="interactivo — pulsa y edita">
        <span style={{ fontFamily: T.serif, fontSize: T.size.lead }}>
          Quiero ahorrar <EditableNumber value={num} onChange={setNum} min={0} max={100} suffix="%" /> de mi sueldo.
        </span>
        <span style={{ fontFamily: T.serif, fontSize: T.size.lead }}>
          Capital: <EditableNumber value={big} onChange={setBig} min={0} max={1_000_000} width={90} color={T.ink} />€
        </span>
      </Section>

      <Section name="Slider" note="interactivo">
        <div style={{ width: 320 }}>
          <Slider label="Tasa de ahorro" value={sliderV} onChange={setSliderV} min={0} max={60} suffix="%" />
        </div>
        <div style={{ width: 320 }}>
          <Slider label="Objetivo" value={sliderEur} onChange={setSliderEur} min={0} max={500000} step={5000}
            fmt={(v) => (v / 1000).toFixed(0) + 'k€'} accent={T.green} />
        </div>
      </Section>

      <Section name="MonthInput" note="interactivo">
        <div style={{ width: 220 }}>
          <MonthInput value={month} onChange={setMonth} />
          <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 6 }}>
            valor: {String(month)}
          </div>
        </div>
      </Section>

      <Section name="charts/" note="alimentados con datos de ejemplo realistas">
        <ChartBox name="LineChart · showInvested + milestone">
          <LineChart series={charts.lineSeries} showInvested milestones={[{ value: 300000, label: 'meta 300k', color: T.green }]} />
        </ChartBox>
        <ChartBox name="Sparkline" w={180}>
          <Sparkline series={charts.lineSeries} width={180} height={48} />
        </ChartBox>
        <ChartBox name="LifecycleChart · nominal">
          <LifecycleChart plan={samplePlan} profile={sampleProfile} d={{ seriesPlan: charts.userSeries, seriesDecum: charts.decum }} realMode={false} inflRate={samplePlan.inflationRate} />
        </ChartBox>
        <ChartBox name="LifecycleChart · real (ajustado por inflación)">
          <LifecycleChart plan={samplePlan} profile={sampleProfile} d={{ seriesPlan: charts.userSeries, seriesDecum: charts.decum }} realMode={true} inflRate={samplePlan.inflationRate} />
        </ChartBox>
        <ChartBox name="LifecycleChartDual · nominal (tú vs estándar)">
          <LifecycleChartDual userSeries={charts.userSeries} standardSeries={charts.std} profile={sampleProfile} realMode={false} inflRate={samplePlan.inflationRate} />
        </ChartBox>
        <ChartBox name="LifecycleChartDual · real">
          <LifecycleChartDual userSeries={charts.userSeries} standardSeries={charts.std} profile={sampleProfile} realMode={true} inflRate={samplePlan.inflationRate} />
        </ChartBox>
        <ChartBox name="MultiLineChart · 3 escenarios de retorno">
          <MultiLineChart scenarios={charts.scenarios} height={300} />
        </ChartBox>
        <ChartBox name="FlowTimelineCard · (POR DECIDIR, puro → movido)">
          <FlowTimelineCard plan={samplePlan} profile={sampleProfile} />
        </ChartBox>
      </Section>

      <Section name="modals/" note="pulsa para abrir cada modal">
        <div style={{ width: '100%', fontFamily: T.serif, fontSize: T.size.lead, color: T.ink, marginBottom: 4 }}>
          Trigger <code>Concept</code>: el{' '}
          <Concept id="interes-compuesto">interés compuesto</Concept>{' '}
          es el motor del patrimonio. (clic → tooltip → "Saber más" abre <code>ConceptModal</code>)
        </div>
        <Btn variant="ghost" size="sm" onClick={() => setOpenModal('confirm')}>ConfirmModal</Btn>
        <Btn variant="ghost" size="sm" onClick={() => setOpenModal('why')}>WhyDifferentModal</Btn>
        <Btn variant="ghost" size="sm" onClick={() => setOpenModal('calendar')}>MonthlyCalendarModal</Btn>
        <Btn variant="ghost" size="sm" onClick={() => setOpenModal('pension')}>PublicPensionDisclaimerModal</Btn>
        <Btn variant="ghost" size="sm" onClick={() => setOpenModal('wizard')}>ProgressionWizard</Btn>
        <Btn variant="ghost" size="sm" onClick={() => setOpenModal('about')}>AboutModal</Btn>
        <Btn variant="ghost" size="sm" onClick={() => setOpenModal('concept')}>ConceptModal (directo)</Btn>
      </Section>

      <Section name="flows/" note="pantalla completa — botón flotante para cerrar">
        <div style={{ width: '100%', fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic', marginBottom: 4 }}>
          Movidos (prop-driven). Onboarding y ActualLifeOnboarding NO están aquí:
          importan state directamente (pendientes para la tanda de state).
        </div>
        <Btn variant="ghost" size="sm" onClick={() => setOpenFlow('landingPre')}>LandingPreOnboarding</Btn>
        <Btn variant="ghost" size="sm" onClick={() => setOpenFlow('landing')}>Landing</Btn>
      </Section>

      <Section name="content/ · LearnIcon" note="iconos SVG (último = fallback)">
        {['interes-compuesto', 'retorno-anual', 'inflacion', 'volatilidad', 'riesgo-incertidumbre', 'patrimonio', 'horizonte', 'aporte-mensual', 'asset-allocation', 'fondos-indexados', 'comisiones', 'diversificacion', 'pignoracion', 'desconocido'].map((id) => (
          <div key={id} style={{ textAlign: 'center', width: 76 }}>
            <LearnIcon id={id} size={36} />
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, marginTop: 4, wordBreak: 'break-word', letterSpacing: '0.04em' }}>{id}</div>
          </div>
        ))}
      </Section>

      <Section name="ui/cartel · primitivas (S6)" note="voz serif única — para propagar a Hoy/Seguimiento/Datos">
        <CartelCard style={{ width: 280 }}>
          <CartelLabel>Etiqueta serif</CartelLabel>
          <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 28, marginTop: 6 }}>CartelCard</div>
          <div style={{ fontFamily: T.serif, fontSize: 15, color: T.muted, marginTop: 8 }}>Tarjeta editorial (borde por tono, serif).</div>
        </CartelCard>
        <CartelCard tone={T.accent} style={{ width: 280 }}>
          <CartelLabel>tone = T.accent</CartelLabel>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <CartelBtn onClick={() => {}}>Primario</CartelBtn>
            <CartelBtn variant="text" onClick={() => {}}>+ enlace</CartelBtn>
          </div>
        </CartelCard>
        <CartelCard style={{ width: 220 }}>
          <CartelLabel>cartelNums · columna alineada</CartelLabel>
          <div style={{ marginTop: 8 }}>
            {[1440, 960, 12500, 240].map((n, i) => (
              <div key={i} style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 20, textAlign: 'right', ...cartelNums }}>{n.toLocaleString('es-ES')} €</div>
            ))}
          </div>
        </CartelCard>
      </Section>

      <Section name="content/ · TABLON" note={`${TABLON.length} temas · corpus ${Object.keys(LEARN_CORPUS).length} conceptos`}>
        <div style={{ width: '100%', columns: '2 300px', columnGap: 28 }}>
          {TABLON.map((t, i) => (
            <div key={i} style={{ breakInside: 'avoid', marginBottom: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.accent, marginBottom: 6 }}>{t.theme}</div>
              {t.lessons.map((l, j) => (
                <div key={j} style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.muted, marginBottom: 6, lineHeight: T.lh.snug }}>
                  “{l.text}” <span style={{ color: T.faint, fontStyle: 'normal' }}>· {l.source}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Renders de modales (controlados por openModal) */}
      {openModal === 'confirm' && (
        <ConfirmModal open title="¿Borrar el plan?" body="Esta acción no se puede deshacer. Se eliminarán todos los datos del plan actual."
          destructive confirmLabel="Borrar" cancelLabel="Cancelar"
          onConfirm={() => setOpenModal(null)} onCancel={() => setOpenModal(null)} />
      )}
      {openModal === 'why' && <WhyDifferentModal onClose={() => setOpenModal(null)} />}
      {openModal === 'calendar' && (
        <MonthlyCalendarModal grouped={monthsGrouped} plan={samplePlan}
          setMonth={() => {}} addMonths={() => {}}
          ensureMonth={(y, idx) => `${y}-${String(idx + 1).padStart(2, '0')}`} update={() => {}}
          onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'pension' && <PublicPensionDisclaimerModal open onCancel={() => setOpenModal(null)} onConfirm={() => setOpenModal(null)} />}
      {openModal === 'wizard' && <ProgressionWizard onClose={() => setOpenModal(null)} onApply={() => setOpenModal(null)} />}
      {openModal === 'about' && <AboutModal onClose={() => setOpenModal(null)} />}
      {openModal === 'concept' && <ConceptModal id="interes-compuesto" onClose={() => setOpenModal(null)} />}

      {/* Flows a pantalla completa (preview con cierre flotante) */}
      {openFlow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, overflow: 'auto', background: T.bg }}>
          <button onClick={() => setOpenFlow(null)}
            style={{ position: 'fixed', top: 12, right: 12, zIndex: 3001, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', background: T.ink, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer' }}>
            ✕ cerrar preview
          </button>
          {openFlow === 'landingPre' && (
            <LandingPreOnboarding mode="intro"
              onStart={() => { console.log('LandingPreOnboarding · onStart'); setOpenFlow(null); }}
              onOpenManifesto={() => { console.log('LandingPreOnboarding · onOpenManifesto'); setOpenFlow(null); }} />
          )}
          {openFlow === 'landing' && (
            <Landing mode="intro"
              onStart={() => { console.log('Landing · onStart'); setOpenFlow(null); }}
              onLoadDemo={() => { console.log('Landing · onLoadDemo'); setOpenFlow(null); }}
              onClose={() => setOpenFlow(null)} />
          )}
        </div>
      )}
    </div>
  )
}
