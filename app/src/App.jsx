// Placeholder del Paso 3 · Tanda 1. NO es UI real migrada todavía:
// su único trabajo es CONSUMIR los tokens ya extraídos a src/tokens/,
// para que el build los empaquete y se demuestre la cadena
// tokens/ -> entry. Los componentes reales llegan en tandas posteriores.
import { T, WEB_URL } from './tokens'
import { project, fmtEur } from './lib'

export default function App() {
  // Consumo de lib/ (Tanda 2): demuestra que el cálculo se empaqueta en el build.
  const series = project({ age: 30, retireAge: 60, capital: 12000, monthly: 400, ret: 8 })
  const finalPortfolio = series[series.length - 1].portfolio
  return (
    <main
      style={{
        background: T.bg,
        color: T.ink,
        fontFamily: T.serif,
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p
          style={{
            fontFamily: T.mono,
            fontSize: T.size.eyebrow,
            letterSpacing: T.tracking.wider,
            textTransform: 'uppercase',
            color: T.accent,
          }}
        >
          Etapa 1 · Paso 3 · Tanda 1
        </p>
        <h1 style={{ fontSize: T.size.displayLg, lineHeight: T.lh.tight, fontFamily: T.display }}>
          tokens/ extraídos
        </h1>
        <p style={{ fontFamily: T.sans, fontSize: T.size.body, lineHeight: T.lh.normal, color: T.muted }}>
          El sistema de diseño (<code>WEB_URL</code> y <code>T</code>) ya vive en{' '}
          <code>src/tokens/</code> y esta entrada lo consume. Aún no se ha movido
          ningún componente real del monolito.
        </p>
        <p style={{ fontFamily: T.sans, fontSize: T.size.caption, color: T.faint }}>
          lib/ · proyección de ejemplo a los 60: <strong>{fmtEur(finalPortfolio)}</strong>
        </p>
        <p style={{ fontFamily: T.sans, fontSize: T.size.caption, color: T.faint }}>
          Web:{' '}
          <a href={WEB_URL} style={{ color: T.accent }}>
            {WEB_URL}
          </a>
        </p>
      </div>
    </main>
  )
}
