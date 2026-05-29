// Entry de desarrollo (Etapa 1). Envuelve la app en el StateProvider MIGRADO
// (src/state) y muestra un panel mínimo (StateProbe) con los datos core de un
// plan cargado, para validar a mano que la persistencia sobrevive a recargas.
// Debajo, la galería de componentes (herramienta de desarrollo).
import { StateProvider, useStore, useDerived } from './state/index.jsx'
import { T } from './tokens'
import { fmtEur } from './lib'
import { Btn, Label } from './ui/index.jsx'
import Gallery from './gallery/Gallery.jsx'

function StateProbe() {
  const { state, accounts, activeAccountId, updateProfile, seedDemo, createAccount, switchAccount, resetAll } = useStore()
  const d = useDerived()
  const accIds = Object.keys(accounts || {})
  const row = { fontFamily: T.mono, fontSize: T.size.caption, color: T.ink, marginTop: 4 }
  const val = { color: T.accent, fontWeight: 600 }
  return (
    <div style={{ background: T.panel, borderBottom: '2px solid ' + T.line, padding: '1.25rem 2rem', fontFamily: T.sans }}>
      <Label>Prueba de persistencia · state/ migrado</Label>
      <div style={row}>nombre <span style={val}>{state.profile.name || '—'}</span> · edad <span style={val}>{state.profile.age}</span> · jubilación <span style={val}>{state.profile.retireAge}</span></div>
      <div style={row}>capital <span style={val}>{fmtEur(state.plan.capital)}</span> · patrimonio actual (derived) <span style={val}>{fmtEur(d.currentPortfolio)}</span></div>
      <div style={row}>cuentas <span style={val}>{accIds.length}</span> (activa: <span style={val}>{activeAccountId}</span>) · segmentos ingreso <span style={val}>{(state.plan.incomeSegments || []).length}</span> · hitos <span style={val}>{(state.goals || []).length}</span></div>
      <div style={row}>displayMode <span style={val}>{state.displayMode}</span> · schemaVersion <span style={val}>{state.schemaVersion}</span></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <Btn variant="accent" size="sm" onClick={() => seedDemo()}>Cargar plan demo</Btn>
        <Btn variant="ghost" size="sm" onClick={() => updateProfile({ name: 'Prueba', age: state.profile.age + 1 })}>Cambiar nombre/edad</Btn>
        <Btn variant="ghost" size="sm" onClick={() => createAccount('Pareja')}>Nueva cuenta</Btn>
        {accIds.length > 1 && (
          <Btn variant="ghost" size="sm" onClick={() => switchAccount(accIds.find((id) => id !== activeAccountId))}>Cambiar de cuenta</Btn>
        )}
        <Btn variant="ghost" size="sm" onClick={() => resetAll()}>Borrar (reset)</Btn>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 10, letterSpacing: T.tracking.wide }}>
        Se guarda en localStorage["miplan.accounts.v1"]. Recarga (⌘R) y debe sobrevivir idéntico.
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StateProvider>
      <StateProbe />
      <Gallery />
    </StateProvider>
  )
}
