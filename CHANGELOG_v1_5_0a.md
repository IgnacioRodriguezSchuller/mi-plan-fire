# CHANGELOG v1.5.0a · 2026-05

Sprint LIMPIEZA. Pivot a "HTML gancho + web negocio": el HTML local se queda como
producto libre y gratuito (AGPL-3.0); las features avanzadas viven en la versión web.

## Cambios (9 puntos)

### 1. Constante `WEB_URL`
- Añadida `const WEB_URL = 'https://miplanfire.com';` antes del objeto `T`.
- Punto único de verdad para el dominio de la versión web.

### 2. Header AGPL del HTML (líneas 19–20)
- Reescrito: ahora declara explícitamente "Single-file HTML planner. Data lives in
  the browser's localStorage." + "Companion web version with sync and Pro features
  at miplanfire.com."

### 3. MonteCarloCard colapsada
- Eliminado state `sequenceMode`, su `useEffect`, todas las ramas `{isPro && ...}`
  y `{!isPro && ...}`, y el CTA promocional "Pasa a Pro".
- La tarjeta ahora muestra el resultado base sin branching free/pro.

### 4. AllocRow + ActualLifeOnboarding
- `AllocRow`: firma sin `isPro` ni `onSetCustomReturn`; `customReturn` renderiza
  como texto plano (`rinde X% nominal`) sin input editable.
- `ActualLifeOnboarding`: eliminados `const isPro = !!state.isPro;` y
  `setCustomReturn`; los 5 callers `<AllocRow>` actualizados (sin esas props).

### 5. ScreenAjustes: card "Modo testing (temporal)" eliminada completa
- Verificado con grep: `modo testing` → 0 ocurrencias.

### 6. WhyDifferentModal reescrito
- Dos bloques (manifiesto + camino B) + link `<a href={WEB_URL}>Versión web →</a>`
  discreto al final.
- Mantiene el patrón overlay + escape + body-overflow.

### 7. AboutModal nuevo
- Modal "Acerca de" añadido antes de `AccountMenu`.
- Patrón overlay + escape + body-overflow.
- Botón `Btn variant="ghost"` con `window.open(WEB_URL, '_blank', 'noopener')`.
- Conectado al AccountMenu vía nueva prop `onShowAbout`.

### 8. AccountMenu: nuevas props
- Firma actualizada: `function AccountMenu({ open, anchor, onClose, onGoToAjustes, onShowAbout })`.
- Item "Exportar datos" → `onGoToAjustes` (atajo a la pantalla donde se exporta).
- Item "Borrar todo" → `onGoToAjustes` (atajo a la pantalla donde se borra).
- Item "Acerca de" → `onShowAbout` (abre `AboutModal`).
- Shell instanciado en ambas ramas (mobile + desktop) con `onGoToAjustes={() => setTab('ajustes')}`
  y `onShowAbout={() => setShowAbout(true)}`.
- State nuevo en Shell: `const [showAbout, setShowAbout] = useState(false);` +
  `<AboutModal>` renderizado tras cada `<ConceptModal>`.

### 9. LEARN_CORPUS sanitizado
- Concepto `'probador'` eliminado completo (tooltip + glossary + seeAlso).
- Concepto `'eventos-pos-conf'` sanitizado (sin mención al Probador).
- `'probador'` eliminado de `LEARN_LEVELS`.
- Copy "Compruébalo en el Probador desde Proyección" → "Ajusta los parámetros en
  Proyección para ver otros escenarios".
- Label `sandbox: 'Probador'` eliminada del object del MultiLineChart.
- `ctaLabel` L5545: "Próximamente en v1.x: revisión fiscal España 2026" →
  "Revisión fiscal España 2026: disponible en la versión web."
- Comentario L1545 (`migrateToV2`): "v5.10 · free/pro flag..." →
  "Flag legacy isPro mantenido en estado por compatibilidad de migraciones.
  No tiene efecto en la UI actual (v1.5.0a colapsó branching free/pro)."

## Líneas rojas respetadas

- `state.isPro` se mantiene en `migrateToV2` + `emptyState` (campos persistidos
  no se eliminan — patrón zombie consistente con `state.sandbox`).
- Firma exterior de `runMonteCarlo` no cambia.
- Cero campos persistidos renombrados.
- Cero dependencias externas nuevas.
- Corpus Aprende tocado **solo** en el Punto 9 (purga de `'probador'`).

## Hallazgos no aplicados (anotados en BUGS_ENCONTRADOS_v1_5_0a.md)

Aplicada la restricción transversal del sprint:

| # | Ubicación | Descripción |
|---|---|---|
| 1 | L5804 | Botón visible "Profundizar (Pro) →" en ScreenMiPlan |
| 2 | L5552–5578 | Función `SinMiPlanProPlaceholder` (pantalla destino del botón anterior) |
| 3 | L4966, L5550 | Comentarios obsoletos que mencionan "Profundizar (Pro)" |

Forman una unidad coherente — recomendado abordarlos juntos en un próximo sprint.

## Auditoría grep final

```
Probador (case-insensitive)        → 0 ✓
Pasa a Pro / Hazte Pro / Modo Pro  → 0 ✓
Próximamente                       → 1 (excepción legítima: AboutModal L9137 "código en github (próximamente)")
modo testing                       → 0 ✓
{isPro && / {!isPro && (JSX)       → 0 ✓
sandbox: 'Probador'                → 0 ✓
const WEB_URL =                    → 1 ✓ (definición única)
WEB_URL (referencias totales)      → 3 ✓ (definición + WhyDifferentModal + AboutModal)
function AboutModal                → 1 ✓
<AboutModal (JSX)                  → 2 ✓ (mobile + desktop)
isPro: (en migrateToV2/emptyState) → 1 ✓ (mantenido por compatibilidad)
```

## Δ líneas

- v1.4.0e: **9539 líneas**.
- v1.5.0a: **9394 líneas**.
- **Δ = −145 líneas** (colapso de branching Pro/free + corpus probador + Card Modo testing).

## Validación

- **Babel**: ✓ Sintaxis OK (single deopt warning por tamaño del script — esperado e inocuo).
- **Runtime e2e** (Playwright + Chromium headless 1280×900):
  - **Bloque 0** Onboarding + WhyDifferentModal: ✓ link a `miplanfire.com` presente.
  - **Bloque 1** 5 pantallas (Plan, Proyección, Seguimiento, Aprende, Datos):
    todas cargan sin errores nuevos en consola.
  - **Bloque 2** AccountMenu → "Acerca de" → AboutModal: ✓ título "Mi Plan FIRE",
    subtítulo "v1.5.0a", botón "Ver versión web →" presentes.
  - **Bloque 3** AccountMenu → "Exportar datos" → navegación a Ajustes
    (`onGoToAjustes`): ✓ aterriza en Ajustes; "Modo testing" ausente.
  - **Bloque 4** localStorage compat `v1.4.0e → v1.5.0a` con `isPro: true`
    inyectado: ✓ reload sin errores nuevos. State `isPro` se ignora en la UI pero
    no rompe nada (patrón zombie funciona).
  - **Total errores de consola en toda la sesión**: 0.

## Notas finales

- Modelo de distribución pivotado: este HTML es el **producto gancho gratuito**.
  La versión web (`miplanfire.com`) cobija las features avanzadas y la sincronización.
- Las puertas al modelo de negocio quedan en 3 puntos discretos:
  1. WhyDifferentModal (onboarding) — link "Versión web →".
  2. AboutModal (menú de cuenta) — botón "Ver versión web →".
  3. Header AGPL del HTML — texto descriptivo.
- El usuario nunca encuentra paywalls ni promociones agresivas dentro del producto.
