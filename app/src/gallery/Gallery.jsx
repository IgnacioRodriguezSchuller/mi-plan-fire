// Galería de componentes — herramienta de desarrollo PERMANENTE (Tanda 3).
// Renderiza cada primitiva de ui/ con variantes representativas para
// validación visual. No es UI de producto; no borrar.
import { useState } from 'react'
import { T } from '../tokens/index.js'
import {
  EditableNumber, Slider, Pill, Card, Label, Btn, MonthInput,
  Stat, SmallStat, Row, RowWithWarning, LegendChip,
} from '../ui/index.jsx'

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

export default function Gallery() {
  const [num, setNum] = useState(42)
  const [big, setBig] = useState(1200)
  const [sliderV, setSliderV] = useState(15)
  const [sliderEur, setSliderEur] = useState(60000)
  const [month, setMonth] = useState('2026-05')

  return (
    <div style={{ background: T.bg, color: T.ink, padding: '2rem', fontFamily: T.sans }}>
      <h1 style={{ fontFamily: T.display, fontSize: T.size.displayLg, lineHeight: T.lh.tight, margin: '0 0 4px' }}>
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
    </div>
  )
}
