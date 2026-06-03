# CHANGELOG v1.5.0a.3-src · 2026-05 · ARQUITECTURA — reconstrucción del monolito en /src (misma versión funcional, sin cambios)

> ⚠️ **Esto NO cambia features.** Es una migración de arquitectura. La app es
> funcionalmente idéntica a v1.5.0a.3. El HTML baseline `mi_plan_v1_5_0a_3.html`
> no cambió **ni un byte** (hash SHA-1 `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`,
> verificado tras cada tanda). Quien lea esto en el futuro: no busques cambios de
> comportamiento — no los hay. Misma versión funcional que `v1.5.0a.3`; el sufijo
> `-src` solo indica "reconstruida en `/src`". No se sube minor: no implica
> features nuevas.

Etapa 1 del plan de migración: el monolito `mi_plan_v1_5_0a_3.html` (un único
HTML con React + Recharts por CDN y Babel-standalone transpilando en el
navegador, **9.372 líneas**, **139 símbolos top-level reales = 118 funciones +
21 constantes** (medido por grep sobre el HTML, no estimado), ~85 de ellos
componentes React) se ha extraído **byte-a-byte** a un codebase modular en
`app/src/` que se compila con **Vite** a un **único HTML autocontenido**
(`dist/index.html`, ~1,0 MB). Adiós a `@babel/standalone`: ahora se transpila en
disco.

## Qué cambia (solo la arquitectura)
- **Fuente**: 1 HTML monolítico → módulos ES en `app/src/` por capas.
- **Build**: Babel-in-browser (runtime) → Vite + `vite-plugin-singlefile` (disco).
- **Dependencias**: de CDN a `package.json` con **versiones exactas del baseline**:
  `react 18.2.0`, `react-dom 18.2.0`, `recharts 2.10.3`, `prop-types 15.8.1`
  (tooling: `vite 6.4.2`). Sin `@babel/standalone`.

## Qué NO cambia
- Comportamiento, copy, cifras, gráficos, flujo de onboarding: **idénticos**.
- **Contrato localStorage intacto**: claves `miplan.state.v1` / `miplan.accounts.v1`
  sin renombrar, formato serializado sin tocar, `schemaVersion 2`, campo zombie
  `isPro` preservado, `migrateToV2` copiado byte-a-byte (sin cambiar su lógica).
- El HTML baseline congelado sigue en el repo como fuente de verdad y red de
  regresión.

## Cómo correr
```
cd app
npm install
npm run dev      # app real (http://localhost:5173) — Node 22 (.nvmrc)
npm run build    # genera el lead magnet: dist/index.html (single-file)
npm run preview  # sirve la build
```
- `http://localhost:5173/?gallery` → **galería de componentes** (herramienta de
  desarrollo permanente: muestra cada primitiva/gráfico/modal con datos de ejemplo).

## Estructura nueva (capas, de hojas a raíz)
```
app/src/
  tokens/    WEB_URL, T (sistema de diseño)
  lib/       45 funciones puras = 41 de cálculo (project, projectV2, runMonteCarlo,
             estimateSpanishPension…) + 4 funciones flecha arrastradas (fmtEur, uid,
             fmtEurFull, fmtPct); más la constante STANDARD_PLAN_REFERENCE
  hooks/     useIsMobile
  ui/        primitivas (Btn, Card, Slider, EditableNumber…) + LearnIcon
  charts/    LineChart, Sparkline, Lifecycle(Dual), MultiLineChart, FlowTimelineCard
  content/   TABLON, LEARN_CORPUS (35 conceptos), CATEGORY_LABELS, GOAL_*, LEARN_*
  modals/    ConfirmModal, ConceptModal, AboutModal, WhyDifferentModal,
             MonthlyCalendarModal, PublicPensionDisclaimerModal, ProgressionWizard…
  flows/     LandingPreOnboarding, Landing
  state/     persistence.js (load/save/migrate/seed, sin JSX) + index.jsx
             (StateProvider, useStore, useDerived, usePlanMutators)
  screens/   las 7 pantallas + fragmentos + onboardings + Shell + App
  gallery/   galería de componentes (dev)
  App.jsx    entry (app real; ?gallery → galería)
```
- **lib = 45 funciones exactas**: 41 declaraciones `function` (movidas en la tanda
  lib) **+ 4 arrastradas** (`fmtEur` en la tanda lib · `uid` en modals ·
  `fmtEurFull`/`fmtPct` en la tanda final). Más 1 constante de datos
  (`STANDARD_PLAN_REFERENCE`).

## Recorrido: 1 andamiaje + 8 tandas (9 commits sobre `baseline-pre-migracion`)
Cada tanda se extrajo byte-a-byte y se verificó antes de comitear; tras cada una
se re-verificó que el hash del HTML seguía intacto.

| # | Commit | Tanda | Verificación |
|---|---|---|---|
| 1 | `6489db4` | andamiaje Vite (single-file) | `npm run dev`/`build` OK |
| 2 | `750c3da` | tokens | verify-tokens (valor-a-valor vs HTML) |
| 3 | `3fd4a51` | lib (cálculo) | **verify-lib: 206 casos** (RNG+reloj mockeados, deterministas) |
| 4 | `f4eada1` | ui (12 primitivas) + useIsMobile | galería visual |
| 5 | `c1cb2f2` | charts (6 gráficos) | galería con datos reales |
| 6 | `1be07e3` | content + modals (8) | **verify-content: deep-equal** del corpus (35 conceptos íntegros) |
| 7 | `34eb762` | flows (landings) | galería visual |
| 8 | `8feee51` | **state** (persistencia) | **verify-state: 8/8** (roundtrip multi-cuenta, legacy, idempotencia, isPro, claves, control negativo) + prueba manual en navegador |
| 9 | `4979854` | screens + Shell + App | **examen de regresión §1: 16/16 PASS** + prueba manual |

Verificadores reproducibles en `app/scripts/`: `verify-tokens.mjs`, `verify-lib.mjs`,
`verify-content.mjs`, `verify-state.mjs`.

## Bug de migración corregido (1)
- **`React is not defined`** en `screens/index.jsx` (al renderizar `ScreenHoy`).
  Causa: en el monolito `React` era el global UMD; algunos componentes usan
  `React.Fragment` con `key` dentro de `.map`, y al modularizar faltaba el import.
  Fix **mínimo**: `import React from 'react'` en el módulo. **Sin cambio de lógica.**

## Rarezas del ORIGINAL preservadas byte-a-byte (NO son bugs — NO arreglar)
Documentadas para que nadie las "corrija" rompiendo la compatibilidad del estado:
- **`migrateToV2` no es estrictamente idempotente sobre estado legacy**: la 1ª
  pasada reconstruye `plan` con solo 7 campos y descarta los defaults que los
  upserts añaden; la 2ª pasada los re-rellena → **punto fijo en la 2ª pasada**.
  Es conducta del baseline; tocarla cambiaría qué se vuelve el estado guardado de
  usuarios reales.
- **Reset one-off B8**: `migrateToV2` pone `hasSeenLandingPreOnboarding = false`
  una sola vez a estados sin `migrationsApplied.v1_1_0_landing_reset` → un usuario
  v1 migrado ve la landing **una vez**. Intencional en el original.

## Deuda técnica anotada (limpieza futura, re-divisible)
- **`screens/index.jsx` consolida 36 componentes en un archivo.** Se hizo así para
  evitar imports circulares por **fragmentos compartidos** (`ExpenseRow`, `AllocRow`,
  `OnboardingHelp`) usados por screens *y* onboardings. Re-divisible más adelante a
  `ui/editors`, `charts` (cards), `flows` (onboardings) y `screens`, **re-pasando el
  examen de regresión** en cada split.
- **Puentes técnicos a limpiar** (no afectan comportamiento): shim
  `window.Recharts` (compat UMD→ESM) en `charts/index.jsx`; `resolve.dedupe:
  ['react','react-dom']` en `vite.config.js` (evita el "Invalid hook call" de
  Recharts en dev); `import React` en `screens` (por `<React.Fragment key>`).
- **Código muerto NO borrado durante la migración** (decisión: mover ≠ limpiar):
  `ScreenPlan` (huérfano, 0 callers) y `computeNextStep` (en `lib`, huérfana). Se
  borrarán en un **commit aparte** tras confirmar 0 usos, para no ensuciar el
  examen de regresión.

## Validación
- **Examen de regresión §1 del baseline (`docs/etapa1-baseline.md`): 16/16 PASS**,
  validado en navegador: carga sin errores · landing + WhyDifferentModal · onboarding
  (wizard + demo) · las 5 pantallas ruteadas (Plan/Proyección/Seguimiento/Aprende/
  Datos) + sub-pantallas (MesAMes, ScreenSinMiPlan) · gráficos Recharts pintando ·
  AboutModal / ConceptModal · persistencia `localStorage` tras recarga · migración
  legacy v1→v2 · **0 errores de consola** en toda la sesión.
- `npm run build` → `dist/index.html` autocontenido (~1,0 MB), sin scripts CDN ni
  babel-standalone.
- Hash de `mi_plan_v1_5_0a_3.html` **intacto** tras toda la migración:
  `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`.

## Trazabilidad
- Punto de retorno: tag **`baseline-pre-migracion`** (`aada8b6`).
- Commit final de la Etapa 1: **`49798543`** (HEAD de `master`).
- 9 commits (andamiaje + 8 tandas), todos respaldados en GitHub
  (`github.com/IgnacioRodriguezSchuller/mi-plan-fire`).

## Notas finales
- Cero campos persistidos renombrados · cero cambios de formato serializado.
- Cero cambios en `projectV2`, `runMonteCarlo`, `migrateToV2` ni en ninguna firma
  pública (solo `+export`/imports).
- Cero cambios en el corpus Aprende (verificado deep-equal, 35 conceptos íntegros).

---

## Cambios de diseño posteriores a la migración (track `app/src`)

> La migración (todo lo de arriba) fue byte-a-byte: `app/src` nació funcionalmente
> idéntica al baseline. A partir de aquí, `app/src` **diverge a propósito** del HTML
> congelado con sprints de producto/diseño. El baseline `mi_plan_v1_5_0a_3.html`
> permanece **congelado** (hash intacto) como red de regresión de la *migración*, no
> como espejo de estos cambios. Sprints de feature previos viven en el historial git
> (`a51f238` rediseño pantalla Plan … `21509fb` bloque "Lo que podría ser" + edad
> FIRE real-vs-real). A partir de aquí se anotan aquí.

### 2026-06 · Aprende → Conceptos · selector de niveles por "puertas"
- **Causa raíz**: el selector eran 4 pills al mismo peso (Esencial / Profundizando /
  Avanzado / Todos) con la guía de nivel (`LEARN_LEVEL_SUB`) debajo en serif itálica
  muted que "apenas se leía". Sin punto de entrada ni feedback de selección legible.
  "Todos" duplicaba lo que ya ofrece la pestaña Glosario.
- **Cambio** (solo presentación de `LearnScreen`, `section === 'conceptos'`):
  - Eliminado el nivel **"Todos"**: fuera la entrada `todos` del array inline de
    niveles y la clave `todos: allConcepts` de `conceptsByLevel`. El default sigue
    `esencial`; verificado que nada más dependía de `level === 'todos'` (eran sus
    únicas 3 apariciones). Glosario sin tocar.
  - Pills + susurro → **tres "puertas" apiladas en vertical** (`esencial`,
    `profundizando`, `avanzado`): `<button>` a ancho completo, columna, `border 1px
    T.line`, `radius 12`, `padding 14px 16px`, `marginBottom 8`. Nombre en
    `T.display` 22 / `T.ink`; guía en `T.serif` 14 / `T.muted`, **dentro** de cada
    puerta. Mismo tamaño y color; el único diferenciador es la **opacidad** (activa
    `1`, inactivas `INACTIVE_OPACITY = 0.35`, sacado a constante por si hay que
    subirlo en device real). Chip **"Empieza aquí"** solo en `esencial` (vía el
    `<Pill>` reutilizable, cuya raíz es un `<span>` no interactivo → válido dentro
    del `<button>` de la puerta).
  - Grid de cards (F2.2) intacto, filtrando por `conceptsByLevel[level]`.
- **No tocado**: constantes `LEARN_*` (solo se consumen), El Tablón, Glosario,
  header de la pantalla, tokens, `ConceptModal` y la apertura de cada card.
- **Doctrina**: `DOCTRINA_DISENO.md` §2 (Scope bloque · selectores de nivel) +
  revisión 1.3 (2026-06): regla "di menos, deja que se vea sin leer; los niveles
  nunca al mismo peso".
- **Verificación**: tres puertas (Esencial activa op.1 + chip "Empieza aquí", las
  otras a op.0.35), sin "Todos"; clic cambia la opacidad y filtra el grid (Esencial
  12 / Profundizando 13 / Avanzado 10 cards = `LEARN_LEVELS`); Glosario y El Tablón
  intactos; móvil 375 sin desborde; consola limpia; sin dependencias nuevas; build
  OK; hash baseline intacto `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`.
