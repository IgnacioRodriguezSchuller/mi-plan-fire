// Entry de desarrollo (Etapa 1). Monta la galería de componentes (Tanda 3) y
// mantiene un encabezado que consume tokens (T, WEB_URL) y lib (project,
// fmtEur) para que esas capas sigan empaquetándose en el build.
import { T, WEB_URL } from './tokens'
import { project, fmtEur } from './lib'
import Gallery from './gallery/Gallery.jsx'

export default function App() {
  const series = project({ age: 30, retireAge: 60, capital: 12000, monthly: 400, ret: 8 })
  const finalPortfolio = series[series.length - 1].portfolio
  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: '100vh' }}>
      <header style={{ padding: '1.5rem 2rem 0', fontFamily: T.sans }}>
        <p style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.accent, margin: 0 }}>
          Mi Plan FIRE · andamiaje
        </p>
        <p style={{ fontFamily: T.sans, fontSize: T.size.caption, color: T.faint, marginTop: 4 }}>
          tokens + lib OK · proyección de ejemplo a los 60:{' '}
          <strong>{fmtEur(finalPortfolio)}</strong> ·{' '}
          <a href={WEB_URL} style={{ color: T.accent }}>{WEB_URL}</a>
        </p>
      </header>
      <Gallery />
    </div>
  )
}
