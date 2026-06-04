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

### 2026-06 · Pantalla Plan · disciplina cromática (regla A2) + ruta R1
- **Causa raíz**: el color (verde/rojo/acento) estaba repartido por toda la pantalla
  Plan sin criterio — patrimonio en acento, meta/llegada/rentas en verde/ámbar,
  cajas con bordes de color, fases sobre panel gris — diluyendo la carga semántica.
  No había un único punto donde el color "significara" algo.
- **Cambio** (solo color/estilo/caja en `ScreenHoy` + `RutaCincoFases`; cero copy,
  fuentes, cifras ni lógica):
  - **Regla maestra**: verde/rojo se quedan SOLO en la bifurcación del bloque 01
    (cifra + barra + fork de "si lo dejas parado" rojo / "si lo inviertes" verde);
    el acento solo en marca, enlaces de acción, tooltips y el foco de la fase actual;
    todo lo demás en `T.ink` / `T.muted` / `T.faint`.
  - **Bloque 01**: patrimonio acento→tinta (icono→faint); barra de reparto sin los %
    impresos encima (segmento ahorro a `T.ink`), el % movido a la leyenda
    ("Ahorras · 432€ (18%)" en tinta); cajas de bifurcación a borde neutro `T.line`
    (conservan cifra/barra en rojo/verde); "El mismo dinero…" a muted; inflación a tinta.
  - **Bloque 02**: META/LLEGADA y panel de rentas a borde neutro `T.line` radius 12;
    cifra LLEGADA y barra renta verde/ámbar→`T.ink`; veredictos ("Llegas justo…",
    "Te alcanzaría…") a muted; hero "Serías libre a los X" verde/ámbar→tinta.
  - **Bloque 03 (R1)**: fases sin fondo panel gris → transparente + borde `1px T.line`
    radius 12 (actual: `1.5px T.accent`); nodos = verde+check (completada/no aplica),
    acento+nº (actual), borde line + nº faint (futura), acento+estrella (destino);
    estados = verde / acento / faint; checks de items hechos en verde; Destinos
    conserva borde punteado.
- **Decisiones flageadas** (interpretación de la regla maestra, no en la lista
  por-elemento del encargo): (a) hero de edad FIRE neutralizado a tinta (perdía su
  verde/ámbar; oculto para el perfil justo); (b) checkboxes manuales unificados a
  verde (antes acento). Ambas revertibles si se prefiere lo previo.
- **No tocado**: copy, fuentes, cifras/lógica, tooltips, enlaces de acción (siguen en
  acento), modal "Cálculo completo", baseline.
- **Doctrina**: `DOCTRINA_DISENO.md` §2 (Disciplina cromática · regla A2) + revisión
  1.4 (2026-06).
- **Verificación** (DOM + build): único rojo/verde = bifurcación; bloque 02 todo
  tinta (sin verde ni naranja); bloque 03 fases sin panel gris, actual con borde
  acento, nodos/estados según R1; consola limpia; sin dependencias nuevas; build OK
  (~1,01 MB); hash baseline intacto `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`.

### 2026-06 · Tipografía · serif unificada en Fraunces (Instrument Serif jubilada)
- **Causa raíz** (dos problemas): (1) `T.display` = Instrument Serif se veía
  demasiado fina a tamaño display y, además, **ni se cargaba** — la migración del
  monolito a `/src` dejó fuera el `<link>` de Google Fonts (igual que el `<style>`
  global), así que todo el serif caía al fallback del sistema. (2) Las cifras vivían
  en **dos familias**: las hero en `T.display` (Instrument Serif) y los números de
  prosa en `T.serif` (Fraunces), con formas distintas en la misma pantalla.
- **Cambio** (sistema queda en 2 familias: Fraunces + DM Mono):
  - `src/tokens/index.js`: `T.display` de `'Instrument Serif, serif'` →
    `"'Fraunces', Georgia, serif"`. Token NO fusionado: sigue nombrando el registro
    de titulares/cifras. `T.serif` también con fallback Georgia (Fraunces 400).
  - **Peso display**: Fraunces es variable y cae a 400 (fino) por defecto. Los **134
    usos de `fontFamily: T.display`** (en `ui/`, `modals/`, `screens/`, `flows/`,
    `gallery/`) reciben `fontWeight: 600` + `fontOpticalSizing: 'auto'`. La prosa
    (`T.serif`) se mantiene en 400. Sin helper central previo → aplicado en cada uso.
  - **Carga de fuentes** restaurada en `index.html`: `<link>` a Google Fonts con
    `Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400` +
    `DM+Mono:wght@400;500`. Preconnect a googleapis/gstatic. `font-optical-sizing:
    auto` también en `body` (index.css).
  - **Instrument Serif jubilada**: fuera del `<link>` y del token; sin referencias de
    fuente residuales (solo comentarios de documentación + la palabra "instrumento"
    en prosa de contenido, sin relación).
- **Inter**: se conserva en el `<link>` SOLO porque la **galería dev** (`?gallery`,
  `Gallery.jsx`) la usa vía `T.sans`; el producto no la renderiza, así que su woff2
  **no se descarga** (coste cero). Anotado por si se quiere retirar también — la
  galería caería a `system-ui` sin romperse.
- **No tocado**: `T.serif`/`T.mono` como registros, copy, cifras, lógica, contrato
  localStorage (`schemaVersion 2`), baseline.
- **Verificación** (runtime + Network): `document.fonts` carga Fraunces 400/500/600
  (+ital 400) y DM Mono 400/500; **Instrument Serif ausente** por todos lados;
  woff2 de Fraunces 600 descargado (`loaded`), Inter declarada pero no descargada;
  título y cifra hero computan `Fraunces, Georgia, serif` peso **600** opsz auto;
  consola sin 404 de fuentes; `miplan.accounts.v1` con `schemaVersion 2` intacto;
  sin dependencias nuevas; build OK (~1,01 MB); hash baseline intacto
  `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`.

### 2026-06 · Pantalla Plan · rediseño de los tres movimientos (presentación)
- **Causa raíz**: Plan presentaba los datos de forma plana y densa — jerarquía
  débil, cifras sin protagonista, color sin sistema, bloques sin aire. El rediseño
  da a cada movimiento un protagonista grande, color racionado y respiración.
- **Cambio** (solo presentación de `ScreenHoy` + `RutaCincoFases`; cifras, copy
  adaptativo y lógica de fases INTACTOS, todo derivado de variables existentes):
  - **M1 "Dónde estás"**: dos cards NEUTRAS (`T.paper` + borde line + sombra suave,
    sin tinte). Card A = patrimonio (`d.currentPortfolio`, `T.ink` ~44px). Card B =
    el eje: ahorro mensual (`planAporte`) ~60px + subtítulo (`savingRate`% ·
    `monthlyLife`) + fork SVG (rojo/verde) a dos fbox (parado `parkedFinalReal` rojo
    / invertido `finalReal` verde) + cierre. Se conservan la inflación y el CTA
    "Ver el cálculo completo".
  - **M2 "Hacia dónde puedes ir"** (anclaje renombrado): cards con fondo verde
    difuminado. Gancho (todos los perfiles): "El tiempo trabaja para ti / Hoy
    decides cambiar tu futuro". Cuerpo (perfiles B y C que aportan): "casi
    cuadruplica" + monedas (aportado = `planAporte × monthsToRetire` → final =
    `finalReal`; 4 monedas verdes fijas) + cierre con la renta de retiro
    (`retirementMonthlyReal`, ámbar) adaptado al veredicto de suficiencia
    (comfortable/tight/short). **Perfil A (no aporta): solo el gancho, sin monedas.**
    Se conserva la ramificación `userProfile` (A/B/C) y el CTA "Profundizar en
    Proyección".
  - **M3 "Tu ruta"** (`RutaCincoFases` reescrito): card naranja difuminada con
    encabezado "Fase {activePhase} de 5 · {nombre}", barra de 5 tramos por estado,
    5 pestañas clicables (reemplazan el acordeón; `setSelected` en vez de
    `togglePhase`) y panel de detalle INTEGRADO (pasos + checkboxes con `toggleManual`
    + estimación). Hitos fuera de la card: edad de libertad (`d.ageAtFiReal`, **verde**
    · excepción), jubilación (`publicPension.startAge || 67`), y un hito
    "tu dinero te adelanta" marcado **pendiente** (ver reportes).
- **Reportes pedidos**:
  1. **Hito edad-rendimiento (~42): el cálculo NO existe** en el código (no hay
     ninguna derivada del año en que el rendimiento anual supera al aporte anual).
     No se inventó: el hito se renderiza con "—" + "cálculo pendiente". A resolver aparte.
  2. **DisplayModeToggle / LifecycleChartDual**: NO estaban en el M2 de ScreenHoy
     (solo importado el chart, nunca renderizado). El `<DisplayModeToggle>` vive en
     ScreenProyección y controla cifras de ESA pantalla → fuera de scope, conservado.
  3. **Copy del perfil A**: el M2 actual (rediseños previos) no tenía un mensaje
     distinto para A; mostraba el mismo diseño meta/llegada. Para A se renderiza solo
     el gancho (que ya es la invitación "empieza a invertir"); no se inventó copy.
- **Decisiones anotadas**: `T.greenSoft`/`T.accentSoft` (tokens) usados en los
  gradientes en vez de `rgba(verde,.06)` literal, por la regla "siempre tokens".
- **Verificación** (runtime · perfiles A/B/C): cifras dinámicas correctas (patrimonio
  7.9k, aporta 432€/18%, parado 113k, invertido 592k, aportado 156k → final 592k
  ≈3,8×, renta 2.0k, fase 3 Colchón, libertad 60, pensión 67); A sin monedas, B
  (86k→351k ≈4×) y C con monedas; las 5 pestañas abren su detalle; móvil 375 sin
  desborde; consola limpia; sin dependencias nuevas; build OK; `schemaVersion 2`
  intacto; hash baseline intacto `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`.

### 2026-06 · Plan · veracidad de las monedas M2 + hito edad-rendimiento + encuadre
- **(1) Monedas del M2 — veracidad.** **Diagnóstico**: el final (`finalReal`) usa
  projectV2 = aporte CRECIENTE (subidas por segmentos de ingreso + IPC). El aportado
  con ese modelo es 357k nominal y el final nominal 1,24M → **3,47× (sin bug)**: el
  final SÍ crece con las subidas. El "1,65×" que se sospechaba era comparar aportado
  **nominal** (357k) con final **real** (592k) — desajuste de unidades, no bug de
  proyección. **Defecto real**: la versión anterior pareaba aportado constante
  (`planAporte×meses` = 156k) con final real (592k) → 3,81× **falso** (modelo y
  unidades distintos). **Arreglo**: `aportadoReal` = suma de cada aporte mensual de
  `d.seriesPlan` deflactado a hoy (mismo modelo creciente, mismas unidades reales que
  `finalReal`). El ratio mostrado = `finalReal / aportadoReal`, verdadero. Para el
  demo C da **2,53×** (< 3×) → se muestra un **caso estándar** etiquetado ("Un
  ejemplo · 300 €/mes · 30 años · 8% → 108k → 420k", disclaimer "no son tus cifras"),
  separado de la renta de cierre que sí es la real. Con horizonte largo (ratio ≥ 3,5×)
  se muestran TUS cifras ("casi cuadruplica", p.ej. 330k → 1,24M = 3,76×, coherente
  con el "Invertido" del M1). Umbral propuesto: **3×** (3,0–3,5 → "más que triplica";
  ≥3,5 → "casi cuadruplica"). Perfil A (no aporta): sin cuerpo.
- **(2) Hito "tu dinero te adelanta".** Implementado (sustituye el "cálculo
  pendiente"): primera edad en que `capital_inicio_año × retorno` supera al aporte de
  ese año, recorriendo `d.seriesPlan` (mismo modelo creciente). Comparación
  like-with-like en € nominales del año → demo C = **40** (con tasa real daría 43).
  Si no aporta o no cruza → fallback honesto ("—" + "necesita aporte"), nunca una
  cifra inventada.
- **(3) Encuadre.** M1 y M2 usaban `maxWidth 620`; M3, `720`. Igualados a **720** →
  los tres movimientos comparten margen lateral exacto (medido: left 100 · right 820
  · width 720 los tres).
- **No tocado**: `projectV2`, `computeActivePhase`, lógica de fases, suficiencia,
  copy adaptativo por perfil, contrato localStorage (`schemaVersion 2`), baseline.
- **Verificación** (runtime, perfiles A/B/C): ratio mostrado = final/aportado del
  modelo único (sin ajustes); caso estándar < 3× y personal ≥ 3× (coherente con M1);
  hito 40 (B/C) / "—" (A); tres movimientos alineados; sin roturas; consola limpia;
  sin deps nuevas; build OK; hash baseline intacto
  `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`.

### 2026-06 · Plan M2 · monedas = múltiplo real abstracto (sin umbral ni caso estándar)
- **Cambio**: las monedas del M2 representan el MÚLTIPLO REAL del caso de forma
  abstracta, sin tope arriba ni abajo, y la frase de encabezado se adapta al MISMO
  ratio sin contradecirlo. **Sustituye** la lógica de umbral 3× + caso estándar
  (1.7), eliminada por completo (sin copy huérfano: fuera "Un ejemplo · 300 €/mes…",
  el 108k→420k y el disclaimer).
- **Un solo número**: `ratio = finalReal / aportadoReal` (reusa el del header, mismo
  modelo creciente y unidades reales, coherente con el "Invertido" del M1). Monedas
  y frase derivan SIEMPRE de ese ratio → jamás se contradicen.
- **Monedas (bucle, sin tope)**: izq 1 moneda `T.ink` (aportadoReal) → der
  `floor(ratio)` monedas `T.green` llenas + 1 de fracción con `opacity = max(decimal,
  0.15)` (finalReal). Genera N monedas con un bucle (soporta ×5/×8/×12…), con
  `flex-wrap` a varias filas + reescala del disco (34→24 px) si hay >8 → no desborda
  en 375 ni desktop. **Guarda de dato degenerado** (`ratio` no-finito o ≥ 30, p.ej.
  aportadoReal≈0): se oculta el bloque de monedas (como perfil sin aporte),
  preservando la renta; nunca cientos de monedas ni NaN en pantalla.
- **Frase por tramos** (copy final): `≥4.5` → "multiplica por {round(ratio)} lo que
  pones." (número real; nunca "casi cuadruplica" cuando es más); `3.5–4.5` → "casi
  cuadruplica lo que pones."; `2.5–3.5` → "casi triplica lo que pones."; `1.8–2.5` →
  "más que duplica lo que pones."; `1.3–1.8` → "multiplica lo que pones por {X,X}.";
  `<1.3` → línea 1 "Esto no ha hecho más que empezar:" / línea 2 "cada año que pase,
  multiplica más." (ángulo-futuro, sin desinflar ni mentir). Cierre de renta intacto.
- **No tocado**: `aportadoReal`/`crecimientoRatio` (header), modelo de cálculo,
  resto del M2/M1/M3, contrato localStorage.
- **Verificación** (los 4 extremos, cifras reales = final/aportado, nada hardcodeado):
  · **C** 2,53× → 2 llenas + 1 a 0.53, "casi triplica" (234k→594k).
  · **alto** 5,0× → "multiplica por 5", 5 monedas; **muy alto** 7,78× → "multiplica
    por 8", 8 monedas con WRAP a 2 filas, `overflowX 0` en 375 (NO "casi cuadruplica").
  · **bajo** 1,03× → "Esto no ha hecho más que empezar / cada año que pase, multiplica
    más", 1 llena + 1 a 0.15; (1,5× → "multiplica por 1,5").
  · **degenerado** (capital 5M + aporte 1% → ratio gigante) → 0 monedas, sin NaN,
    gancho + renta preservados, `overflowX 0`.
  · móvil 375 sin desborde en todos; consola limpia; sin deps nuevas; build OK;
    `schemaVersion 2` intacto; hash baseline intacto
    `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`.
