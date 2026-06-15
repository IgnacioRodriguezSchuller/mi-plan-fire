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

### 2026-06 · Encuadre lateral global unificado + pill superior mayor en escritorio
- **(1) Encuadre centralizado**: el ancho/centrado del contenido lo define ahora
  UNA vez el `Shell` (`CONTENT_MAX = 720`, columna centrada en el `<main>` de
  escritorio). Eliminados los `maxWidth` por-pantalla que producían desnivel:
  `ScreenHoy` (era `READING_MAX 720`, borrado el const), `ScreenAprende` (880) y
  `ScreenAjustes` (880) → todas heredan el encuadre del Shell; Proyección /
  Seguimiento / MesAMes (que eran full-width) también. Solo cambia el contenedor
  exterior, no el contenido. Móvil intacto (full-width con padding lateral del
  shell, `20px 12px`). Verificado en escritorio 1280: las 5 secciones (Plan /
  Proyección / Seguimiento / Aprende / Datos) idénticas — **left 280 · right 1000 ·
  width 720**. (Aprende: su grid de cards pasa de 3 a 2 columnas por el ancho menor,
  reflow responsive automático.)
- **(2) `KpiPill` mayor en escritorio**: responsive vía `useIsMobile`. Escritorio
  `padding 8px 16px` (antes 5/11), valor **20px** (antes `T.size.body` 15), eyebrow
  11 (antes 9), sparkline 34×12 (antes 24×9); móvil compacto sin cambios (5/11, 15,
  24×9). Tipografía/colores por tokens, solo escala.
- **No tocado**: contenido/diseño interno de las pantallas, lógica, contrato
  localStorage.
- **Verificación**: 5 secciones alineadas idénticas (escritorio); pill visiblemente
  mayor sin romper la barra; móvil 375 `overflowX 0` en las 5 secciones, padding
  lateral móvil intacto, pill compacto; consola limpia; sin deps nuevas; build OK;
  `schemaVersion 2` intacto; hash baseline intacto
  `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`.

### 2026-06 · Plan M1 · pulido de copy (cierre + supuesto de inflación)
- **Cierre del M1**: "El mismo dinero. La diferencia la pone el tiempo." →
  **"El mismo tiempo. La diferencia la pone el interés compuesto."** Más preciso: lo
  que comparten los dos escenarios del fork (parado / invertido) es el horizonte, no
  el dinero.
- **Supuesto de inflación del M1** (nota "Supuestos"): recortado a solo "Pérdida de
  poder de compra del primer año: un año de inflación ({inflRate}%) sobre tu salario
  anual." Eliminada la coletilla "A lo largo de N años… son {lost} — pero esa cifra
  mezcla magnitudes; la honesta es la de un año concreto", que se autocontradecía. El
  `%` sigue dinámico.
- **No tocado**: lógica, cifras, baseline. Sin deps nuevas; build OK; hash intacto.
- **Diagnóstico anotado (sin arreglar, pendiente de decisión)**: el ratio de las
  monedas del M2 (`finalReal/aportadoReal`) está **algo inflado** — el final parte del
  patrimonio inicial (`currentPortfolio`) y crece con él, pero el aportado NO cuenta
  ese inicial. Demo: ratio 2,53× → 2,45× (incluir inicial en ambos) / 2,37× (excluir
  de ambos). Bias pequeño aquí (inicial 7,9k→38k del final) pero grande para
  patrimonios iniciales altos. A decidir la base honesta antes de tocar.

### 2026-06 · Plan M2 · reestructura en 3 piezas + cifras nominales con aclaración real + base del ratio
- **Causa raíz**: (1) el cuerpo del M2 mezclaba gancho, monedas y renta sin una lectura
  clara de tres tiempos; (2) las cifras se mostraban en **real** (592k), que es honesto
  pero pequeño y poco motivador, sin enseñar el número nominal "wow" (1,24M); (3) el
  ratio de las monedas estaba **inflado** (diagnóstico de la entrada anterior): el final
  incluye el patrimonio inicial pero el aportado no.
- **Cambio (todo en `ScreenHoy`, cuerpo del M2; todas las cifras en vivo)**:
  - **Pieza 1 · gancho** (card propia, todos los perfiles): texto nuevo "Si pones el
    tiempo y el interés compuesto de tu lado… / **hoy cambias tu futuro.**", la 2ª línea
    en `T.green` (antes el gancho era otro y la 2ª línea iba en `T.accent`).
  - **Pieza 2 · monedas + renta**: el `headL1` enlaza con el gancho ("Esta decisión no
    solo trabaja para ti:"); la lógica por tramos del múltiplo se conserva intacta. La
    etiqueta **derecha de las monedas pasa a NOMINAL** (`finalNominal`, ~1,24M; antes
    `finalReal`). El **cierre de renta** muestra la **nominal del primer año de
    jubilación** en `T.amber` + su aclaración real en la misma frase: "Y te dan
    {nominal}/mes cuando te jubiles — es decir, {real} de hoy: {veredicto}".
  - **Pieza 3 · recordatorio (nuevo)**: línea subordinada `T.serif` `T.muted` 16px que
    aterriza el patrimonio nominal a € de hoy — "Recuerda: ajustado por la inflación, ese
    patrimonio equivale a {finalReal} de hoy." Gated en `ratioValido`.
  - **Base del ratio corregida**: `aportadoBase = aportadoReal + currentPortfolio` (lo
    que pones = patrimonio inicial + todos los aportes). El ratio se sigue calculando en
    **real** (numerador `finalReal` y denominador `aportadoBase`, ambos en € de hoy —
    misma unidad). Etiqueta izquierda de las monedas = `aportadoBase`. Demo: 2,53× →
    **2,45×** ("más que duplica"). Eliminado el const muerto `renta`.
- **Decisión de unidad (coherencia)**: el **ratio/monedas viven en real** (2,45×,
  242k→592k conceptual), pero la **etiqueta derecha muestra el nominal** (1,24M) por
  motivación; la **pieza 3 reconcilia** ese nominal con su real, así el dibujo y los
  números no se contradicen. La renta tiene un real **por año** (Bengen mantiene poder
  de compra constante), por eso el ancla real es el **primer año de jubilación**.
- **Perfil A** (`monthlyAporte === 0`): conserva solo la **pieza 1 (gancho)** como
  invitación condicional; sin piezas 2 ni 3 (no hay patrimonio que mostrar/deflactar).
  Verificado en runtime forzando aporte 0.
- **No tocado**: motor (`projectV2`/`runMonteCarlo` sin cambios de firma), la lógica de
  tramos del múltiplo, las monedas (dibujo/wrap/reescala/guarda degenerada), claves
  localStorage / `schemaVersion 2` / `isPro`, baseline. Sin deps nuevas.
- **Verificación**: build OK; los 4 verificadores en su estado conocido (tokens y lib
  marcan las divergencias **intencionales** preexistentes —`T.serif` con fallback
  Georgia y `lostFirstYear` aditivo—, no tocadas hoy); consola limpia; hash baseline
  intacto. Runtime (demo Alex, 375 y 1280): 3 piezas en orden; **prueba en vivo**
  cambiando inflación 2,5%→5%: recordatorio 592k→**382k** y renta real 2,0k→**1,3k** se
  mueven (derivados, no hardcoded); ratio recalcula a 1,58× ("multiplica por 1,6"); el
  M2 no desborda en 375 (el único overflow horizontal es el stepper de fases del M3,
  preexistente). Demo restaurado a su estado original tras las pruebas.

### 2026-06 · Plan · unificación en NOMINAL (pill + M1 + M2) + ratio nominal + reorden M2 + fix M3
- **Causa raíz**: incoherencia de unidades en la misma pantalla — el pill (`KpiPill`) y el
  M1 "invertido" mostraban el patrimonio a los 60 en **real** (594k) mientras las monedas
  del M2 lo mostraban en **nominal** (1,24M): la misma magnitud en dos unidades. Además el
  ratio/monedas del M2 se calculaba en real (2,45×) pero las cifras a su lado eran nominales
  → el nº de monedas no cuadraba con las etiquetas. Y el stepper de 5 fases del M3 desbordaba
  en móvil (la 5ª fase quedaba cortada). Decisión de producto: **nominal por defecto** (los €
  que tendrás), real solo como recordatorios de aterrizaje.
- **Cambio**:
  - **Pill (`KpiPill`)**: de `toRealEur(d.finalPlan.portfolio, …)` → **`d.finalPlan.portfolio`**
    (nominal). Mismo nº que el "invertido" del M1, las monedas del M2 y el hero de Proyección.
  - **M1 fork**: "invertido" → `finalNominal` (= pill = monedas); "parado" → nuevo
    `sinPlanKPIs.parkedFinalNominal`. Ambas cajas en nominal (comparación justa, misma unidad).
    Patrimonio actual (7,9k) y ahorro mensual (432) intactos (presente: real = nominal).
  - **`computeSinPlanKPIs` (lib)**: devuelve además `parkedFinalNominal` / `investedFinalNominal`
    (campos **aditivos**; ya calculaba `parkedNominal`/`investedNominal` internamente).
  - **M2 ratio sobre nominal**: `ratio = finalNominal / aportadoBaseNominal`, ambos en €
    corrientes. `aportadoBaseNominal` = suma de aportes **sin deflactar** + `currentPortfolio`.
    Etiquetas de monedas: izq `aportadoBaseNominal`, der `finalNominal`. Guarda `ratioValido`
    pasa a `aportadoNominal > 0`. Eliminados `aportadoReal`/`aportadoBase` (reales) del ratio;
    `finalReal` se conserva SOLO para el recordatorio.
  - **Reorden del cuerpo M2**: frase → monedas → **recordatorio (real, sube aquí)** → renta
    (antes el recordatorio iba al final). La nota "Supuestos" del M2 pasa de "Cifras en euros
    de hoy" → "Cifras en euros nominales… el recordatorio las ajusta a € de hoy".
  - **M3 stepper**: `gridTemplateColumns` de `repeat(5, 1fr)` → **`repeat(5, minmax(0, 1fr))`**
    + `minWidth: 0` en el botón + `overflowWrap: break-word` / `hyphens: auto` en el nombre.
    Las 5 fases caben SIEMPRE en 375 (el nombre largo silabea a 2 líneas: "Optimi-zación").
    Pestañas clicables y panel de detalle intactos.
- **Coherencia de cifras (verificado en runtime, demo Alex)**: pill = M1 invertido = M2
  monedas-final = **1,24M€** nominal (coinciden). M1 parado = 236k€ nominal (deflactado ≈113k).
  Ratio nominal = 1,24M / 357k ≈ **3,47×** → "casi triplica" (3 monedas llenas + 0,47); las
  monedas y la frase cuadran con las etiquetas 357k→1,24M.
- **Nominal vs inflación (hallazgo honesto, IMPORTANTE)**: la premisa "las cifras nominales no
  se mueven con la inflación" **NO se sostiene con este motor**. `projectV2` modela el salario
  creciendo con el IPC (`salaryInflationFactor = 1.0`), así que más inflación → más euros
  nominales. Prueba (inflación 2,5%→5%): pill/invertido/monedas-final 1,24M→**1,65M** (suben),
  aportadoNominal 357k→547k, ratio 3,47→3,02, recordatorio 592k→**382k**, renta real 2,0k→**1,3k**.
  Es decir, **nominal y real se mueven ambos, por mecanismos distintos** (nominal por el salario
  IPC; real por el deflactor). El "parado" no se mueve (236k) porque `computeSinPlanKPIs` usa
  aportes sin crecimiento IPC. La distinción nominal/real es de **presentación**, no de
  invariancia — conviene que Nacho lo sepa (ver Reporte).
- **No tocado**: firmas de `projectV2`/`runMonteCarlo`; semántica del motor; la lógica por tramos
  de la frase (solo cambia la magnitud de entrada de real→nominal); `migrateToV2`; claves
  localStorage / `schemaVersion 2` / `isPro`; baseline. Sin deps nuevas.
- **Verificación**: build OK; verificadores `content`/`state` en verde; `tokens`/`lib` con sus
  divergencias **intencionales** preexistentes (los campos nominales nuevos de
  `computeSinPlanKPIs` son aditivos, no añaden FAIL — el verificador reporta antes el
  `lostFirstYear` ya conocido); consola limpia; hash baseline intacto. 375: sin overflowX en
  NINGÚN bloque (M3 ya no desborda, las 5 fases completas); 1280 sin desborde. Perfil A: solo
  gancho. Demo restaurado a su estado original.
### 2026-06 · Proyección · sprint "al lenguaje de Plan" (6 commits sin entrada — registro retroactivo)

> Registro consolidado de la auditoría 2026-06-10: los commits `87e9e12` → `ec1e4b6`
> entraron sin entrada en este changelog. Resumen por commit; el detalle vive en
> los cuerpos de commit.

- **`87e9e12` charts al lenguaje accent (A2)**: los gráficos de Proyección adoptan la
  disciplina cromática de Plan.
- **`8475319` MC: aporte creciente + plan base = solo confirmado**: `runMonteCarlo`
  abandona el aporte mensual PLANO y deriva su calendario anual de la serie de
  `projectV2` (`pt.monthlyAporte` agrupado por año) → hereda crecimiento salarial por
  IPC, tramos y eventos; `includeHypothetical` default `false`. Corrige la divergencia
  histórica mediana-MC vs determinista. **Divergencia intencional nueva en
  `verify-lib`** (runMonteCarlo.paths difiere del baseline: el motor nuevo es el bueno).
- **`678054e` hero del momento de libertad (dos estados)**: LLEGA (edad protagonista,
  verde doctrinal) / NO LLEGA (brecha en accent, sin fallback a retireAge) + coherencia
  de unidad + eje MC legible.
- **`6195e2c` motor (línea de vida + dial) y supervivencia legible**.
- **`5d2b4a3` espina FIRE en el motor**: el número desde el gasto (25× anual), el
  cruce, la palanca.
- **`ec1e4b6` amanecer del hero**: sol en arco según edad FIRE (CSS en `index.css`,
  `prefers-reduced-motion` respetado).

### 2026-06-10 · Proyección · nube de probabilidad MC por edad (commit `0b9e533`)

- **Causa raíz**: la rejilla 10×10 comunicaba el % de éxito pero no la FORMA de la
  incertidumbre (cuándo se abre la dispersión, cuánto cae la cola).
- **Cambio**: `runMonteCarlo` devuelve `bandsByAge` (percentiles por año reetiquetados
  por edad, P10..P90; aditivo puro). `MonteCarloCard` pinta nube P10–P90 + P25–P75 con
  gradiente, mediana accent, meta "tu número" (plana en real / inflada en nominal) y
  frontera ACUMULACIÓN/JUBILACIÓN en retireAge; eje Y capado contra la cola larga.
- **No tocado**: firma de `runMonteCarlo` (añadido opcional), percentiles/éxito
  existentes, migraciones, claves localStorage, baseline.
- **Verificación**: build OK; verificadores en estado conocido (bandsByAge entra como
  aditivo en verify-lib); consola limpia; 1280/375 sin desborde; cruce mediana×meta = 60
  coherente con el hero.

### 2026-06-10 · Estilos globales del baseline restaurados (commit `7a4fb59`)

- **Causa raíz**: la migración a /src solo portó el reset de layout del `<style>` de
  cabecera del baseline. Faltaba el INVARIANTE de inputs (`appearance: none` +
  `-webkit-appearance: none` — bug documentado de modo oscuro macOS/iOS), el foco
  accent, spinners, range/checkbox, placeholder, hover/active de botones, `::selection`,
  `fadeUp`/`.tab-enter` (el Shell usaba la clase sin regla) y los overrides de recharts.
- **Cambio**: bloque ENTERO portado a `app/src/index.css` (decisión de Nacho).
- **Verificación**: emulación dark → 0 inputs con fondo oscuro; los EditableNumber
  inline ganan por especificidad como en el baseline; fadeUp activo; ticks DM Mono.

### 2026-06-10 · Plan M3 · hito ★ libertad honesto (commit `67fbf3a`)

- **Causa raíz**: `libertadAge` caía en silencio a `retireAge` cuando el plan no
  llegaba → el ★ verde mentía (mostraba la edad de jubilación como clímax conseguido).
- **Cambio**: fallback honesto "—" muted + nota mono "todavía no llega" (patrón de
  `momentumAge`; copy derivado del hero de Proyección). Verde y ★ solo si la edad existe.
- **Verificación**: ambos estados en navegador (retorno 8% / 1%); demo restaurado.

### 2026-06-10 · Limpieza de código muerto (commit `4ab4da6`)

- **Cambio**: borrados `ScreenPlan` (stub huérfano, sin tab en el router),
  `computeNextStep` (lib; importada pero jamás invocada) y 17 imports de lib sin uso en
  screens. `verify-lib` re-cableado: el caso de computeNextStep sale del examen y
  `computeSinPlanKPIs` (viva, envuelta por la antigua slice) gana slice propia.
- **No tocado**: las funciones de lib que siguen vivas en state/verificadores.
- **Verificación**: 0 usos confirmados símbolo a símbolo; build OK; verify-lib 43
  filas · 201 casos en estado conocido; 5 pestañas renderizan sin errores nuevos.

### 2026-06-10 · Gobernanza (commit `791eb3d` + docs)

- `.gitignore` += `design-system/` (artefacto potencial de la skill de terceros
  ui-ux-pro-max; la doctrina vinculante es `DOCTRINA_DISENO.md`).
- `CLAUDE_CODE_CONTEXTO.md` adelgazado (pendiente 8): fuera el flujo del monolito
  (estado v1.1.1, validación Babel, mapa de líneas, historias de sprint — viven en los
  `CHANGELOG_v*.md`); queda voz editorial + convenciones no cubiertas por `CLAUDE.md`.
- `ESTADO.md` actualizado al cierre de esta tanda.

### 2026-06-10 · Historial reescrito para retirar trailers de coautoría de IA

- Reescritura de los **mensajes** de commit con `git filter-repo` (clon fresco, solo
  mensajes): eliminados los 38 trailers `Co-Authored-By: Claude …`. **El código no cambia
  ni un byte** (árbol raíz idéntico `2f42ee96…`; baseline `b3ea52b1…` intacto; 45 commits).
- `git push --force-with-lease` ejecutado por Nacho a mano. Backup previo en
  `~/Downloads/miplanfire-backup-pre-rewrite.bundle`.
- **Los hashes de commit citados en documentos anteriores a esta fecha ya no resuelven**
  (toda la cadena recibió hashes nuevos al reescribirse los mensajes).
- `.claude/settings.json` += `attribution: { commit: "", pr: "" }` → corta la atribución
  automática de IA en futuros commits y PRs.

### 2026-06-13 · Proyección · cruce FIRE detectable más allá de retireAge + estado del destino

- **Causa raíz**: `ageAtFiPlan`/`ageAtFiReal` leían de `seriesPlanFromStart`/`seriesRealFromStart`,
  capadas en `retireAge` para el gráfico plan-vs-realidad. Si el cruce FIRE caía DESPUÉS de la
  jubilación, la serie no llegaba y `ageHittingTarget` devolvía `null` → "vas tarde" era indetectable.
- **Cambio**: dos series de detección independientes (`seriesPlanForDetect`/`seriesRealForDetect`,
  `endAge` 90) que alimentan `ageHittingTarget`; `ageAtFiPlan`/`ageAtFiReal` pasan a leer de ellas.
  Nuevos `cruceEdad` (= `ageAtFiReal`, ritmo REAL — sin meses registrados la serie real == plan) y
  `destinoEstado` (`'libre'` ≤ retireAge · `'tarde'` > retireAge · `'no-llega'` null) expuestos en
  `useDerived`, aún SIN consumir en UI (la card "En limpio" es el siguiente prompt).
- **No tocado**: `projectV2`/`projectDecumulation`, las series dibujadas (`seriesPlanFromStart`/
  `seriesRealFromStart`), `planAtLastReg`/`realAtLastReg`, claves localStorage, baseline congelado.
  El **Fix A** (deflactado vía `toRealEur` dentro de `ageHittingTarget`) ya estaba aplicado en el
  código vivo ("Vía (a)"); esta tanda es la "Vía (b)".
- **Verificación**: harness determinista contra el motor + demo Alex en navegador (valores idénticos).
  Alex cruza REAL a **59,75** (antes `null` por el cap; el plan a 60,08, que también caía en `null`);
  caso "tarde" (ahorro 3%) → `cruceEdad 88,25`, `destinoEstado 'tarde'`; objetivo imposible (50 M€) →
  `null`, `'no-llega'`. Sin NaN en Hoy/Proy/Seguim; arranque móvil 375×812 limpio; `npm run build` OK;
  verificadores sin diffs nuevos; hash baseline intacto.

### 2026-06-14 · Proyección · card "En limpio" — retrato del destino FIRE

- **Causa raíz**: ScreenProyeccion terminaba en datos y gráficos, sin un retrato en lenguaje
  claro del destino: qué número necesita el usuario y a qué edad lo alcanza.
- **Cambio**: card "En limpio" al pie de `ScreenProyeccion` (forma C — un dato grande arriba,
  voz debajo), 3 estados según `destinoEstado`: `'libre'` (edad en `T.green`), `'tarde'`
  (edad en `T.amber`), `'no-llega'` (sobrio, sin dígito). Muestra `fiTarget` con `fmtEur` y la
  nota "cifra en € de hoy". Edad redondeada `Math.ceil`. Consume `cruceEdad`/`destinoEstado`/
  `fiTarget` ya expuestos por `useDerived`.
- **No tocado**: motor (`useDerived`/`projectV2`/`projectDecumulation`), series, claves
  localStorage, baseline. Verde solo en el estado 'libre' (excepción documentada de libertad).
- **Verificación**: 3 estados en navegador (Alex 'libre' → ★60 verde y 590k€; 'tarde' → 89 ámbar;
  objetivo imposible → sobrio, sin dígito); sin NaN; móvil 375×812; consola limpia; `npm run build` OK.

### 2026-06-14 · Proyección · card "Siguiente paso" — vías de retiro temprano (Coast/Lean) + palanca +5pp

- **Causa raíz**: la pantalla retrataba el destino ("En limpio") pero no decía qué hacer
  después. Faltaba dirección y nombrar los hitos FIRE como vías del camino (no como identidad).
- **Cambio**: motor en `useDerived` (reusa `seriesRealForDetect` + `ageHittingTarget`):
  `coastEdad` (capitaliza a `fiTarget` sin aportar más; `rReal=(retorno−inflación)/100`),
  `leanEdad`/`leanGastoMes`/`leanPct` (gasto esencial, default 0.70 en lectura),
  `ahorroMas5Edad` (`extraMonthly` = 5% del ingreso). UI: card "Siguiente paso" bajo "En limpio"
  según `destinoEstado`, vías nombradas "Coast FIRE"/"Lean FIRE" (nunca clasifican al usuario),
  control `leanPct` 60/70/80, ancla `#proy-dial`, nav a Mes a mes vía `update({activeTab:'seguimiento'})`.
- **No tocado**: `projectV2`/`projectDecumulation`/`migrateToV2` (solo se llaman con opciones
  existentes), series dibujadas, claves localStorage, baseline. `leanPct` por defecto en el punto
  de lectura (sin migración → `verify-state` 8/8 intacto). Verde en NINGÚN estado de esta card.
- **Verificación**: Alex (`coastEdad 58,75 ≤ cruce 59,75`; `leanEdad 54,58`; `+5pp 57,83`;
  `leanGastoMes 1378` a 70%); 'tarde' (+5pp → 80, Lean 82 < 88, borde ámbar); 'no-llega' (palanca
  base sola / vía Lean si llega; `cruce null` sin crash); `leanPct` 60/70/80 monótono (79/82/84);
  móvil 375×812; consola limpia; `npm run build` OK; verificadores en verde; hash baseline intacto.

### 2026-06-14 · Proyección · hitos FIRE (Coast/Lean) marcados sobre la curva de patrimonio

- **Causa raíz**: la línea de vida solo señalaba el ★ del cruce FIRE; el camino se leía como una
  sola meta lejana, sin los hitos intermedios (Coast/Lean) que el motor ya calcula.
- **Cambio**: en `ProyeccionEngine`, sobre la MISMA curva (`ComposedChart`), dos `ReferenceDot`
  nuevos junto al ★ existente: Coast (punto sólido `T.accent`, en `d.coastEdad`) y Lean (punto
  hueco `T.accent`, en `d.leanEdad`), vía el helper `dotAt` (misma interpolación que `fiDot`). Las
  edades (`Math.ceil`) se nombran en la leyenda — "lean 55 · coast 59 · ★ libre 60" — no como
  etiqueta sobre la curva, para no solaparse cuando caen juntas. Solo dentro del dominio
  [hoy, retireAge]; fuera (estados 'tarde'/'no-llega', edades > jubilación) no se dibujan — esa
  dirección vive en la card "Siguiente paso".
- **No tocado**: el ★ FIRE (único verde, única estrella, única etiqueta sobre la curva) ni su
  lógica; `projectV2`/series; sin emojis nuevos ni colores fuera de tokens.
- **Aplazado**: Fat FIRE (`fatEdad = ageHittingTarget(seriesRealForDetect, fiTarget*1.25)`) — omitido
  por densidad sobre un cluster ya apretado; anotado para una tanda futura.
- **Verificación**: Alex 'libre' (lean ○55 / coast ●59 / ★60 sobre la curva; leyenda completa;
  coast/lean en accent, ★ en verde); 'tarde'/'no-llega' (sin marcadores en curva —hitos > 60—, sin
  crash); móvil 375×812 (leyenda en 2 líneas, legible); consola limpia; `npm run build` OK.

### 2026-06-14 · Hoy · resumen + dirección fundidos al pie de la ruta (rediseño de los 3 hitos)

- **Causa raíz**: la fila de 3 hitos al pie de `RutaCincoFases` ("tu dinero te adelanta / eres
  libre / pensión pública") eran tres cifras sin jerarquía que confundían; y la pantalla Hoy no
  terminaba en una dirección (doctrina P8).
- **Cambio**: un solo bloque que (1) hace HÉROE la edad de libertad (★ + `libertadAge`, verde —
  única excepción cromática) — ámbar sin ★ si llega 'tarde', "—" muted si 'no-llega'; (2) hila los
  hitos en una frase de lectura (`momentumAge` "te adelanta" + `pensionAge` "pensión") sin tres
  números compitiendo; (3) cierra en la dirección (kicker "Siguiente paso") determinista: sin meses
  → "Registra tu primer mes" (Mes a mes); 'libre' → "Vas en camino" (Mes a mes); 'tarde' → "Llegas
  tarde, ajusta tu plan" (Proyección); 'no-llega' → "Aún sin edad, ajusta ahorro u objetivo"
  (Proyección). Nav vía `update({activeTab})`. `libertadAge` pasa a `Math.ceil` (invariante 6) y el
  color del héroe lo rige `destinoEstado` (antes era verde siempre que hubiera cruce, incluso 'tarde').
- **No tocado**: la card de las 5 fases ni su lógica; `momentumAge`/`pensionAge`; motor; series; claves.
- **Verificación**: 4 ramas de dirección (Alex 'libre' ★60 verde → Mes a mes; 'tarde' 89 ámbar →
  Proyección; 'no-llega' "—" → Proyección; sin meses → "Registra tu primer mes", con prioridad);
  verde solo en 'libre' (0 verdes en 'tarde'/'no-llega'); nav funciona; móvil 375×812; consola limpia.

### 2026-06-14 · Seguimiento · "Siguiente paso" al pie (P8)

- **Causa raíz**: Seguimiento (Mes a mes) no terminaba en una dirección (doctrina P8); el fondo
  de pantalla quedaba muerto tras el reparto del ingreso.
- **Cambio**: card "Siguiente paso" al final de `ScreenSeguimiento` (se añade `useDerived` +
  `update`). Regla determinista por RITMO de aporte: sin meses → "Anota el primero" (scroll a la
  sección Mes a mes, ancla `#seg-mensual`); media aportada ≥ lo que pide el plan
  (`avgActual ≥ currentAporte`) → "Vas por delante" (Proyección, borde accent); por debajo →
  "Vas por detrás, revisa tu aporte" (Proyección, borde ámbar). Sin verde. Se descartó
  `realVsPlanDelta` (tramo de ahorro arranca hoy → pasado planificado 0, siempre "delante") y
  `d.ahead` (pace plano vs plan creciente con IPC → casi siempre "detrás").
- **No tocado**: motor, series, claves, el resto de bloques de Seguimiento.
- **Verificación**: 3 ramas (delante/detrás/sin-meses) con actuals forzados; borde accent/ámbar
  correcto; ancla de scroll presente; móvil 375×812; consola limpia; `npm run build` OK.

### 2026-06-14 · Hoy · affordance de las casillas de fase (lo tocable vs lo informativo)

- **Causa raíz**: en `RutaCincoFases`, el indicador de estado AUTO pendiente era un círculo hueco
  con borde — se leía como un checkbox vacío y la gente intentaba pulsarlo (no es interactivo).
- **Cambio**: el indicador AUTO pendiente pasa a un punto pequeño muted (estado, no checkbox); el
  AUTO hecho mantiene el ✓ en círculo verde. La CASILLA manual (que sí se marca) gana aspecto de
  control pulsable: fondo papel + borde marcado (`T.muted`) + relieve sutil (boxShadow). Cuadrado =
  tocar, redondo = estado.
- **No tocado**: la lógica (`toggleManual`, qué pasos son manuales); el ✓ verde de "hecho"
  (semántica de confirmación, ya existente, no la libertad).
- **Verificación**: Colchón (auto: 2 ✓ verdes + 1 punto pendiente); Optimización (3 casillas
  manuales con relieve); el marcado manual sigue funcionando (✓ verde, toggle ida/vuelta); consola
  limpia; `npm run build` OK. Marcadores de tamaño fijo → idénticos en móvil.

### 2026-06-14 · Proyección · pill de Supuestos reforzada como invitación a ajustar

- **Causa raíz**: Juanjo pidió 2× "asunciones primero". No se suben (romperían "di menos"), pero el
  acceso desde arriba era una línea de texto faint sin borde, fácil de pasar por alto.
- **Cambio**: la pill "Supuestos · … — ajustar" pasa a chip pulsable (fondo `T.paper` + borde
  `T.line` + forma píldora + "ajustar →" en accent, valores en `T.muted`). Mismo jump-link a
  `#proy-asunciones`.
- **No tocado**: la posición de la card de Asunciones (sigue 7ª en la pantalla); el motor.
- **Verificación**: chip visible y sobrio (a juego con el toggle de inflación contiguo); el
  scroll-link lleva a la card en desktop y móvil; cabe en 375×812 (envuelve a 2 líneas, sin
  desbordar); consola limpia; `npm run build` OK.

### 2026-06-14 · Antes de Mi Plan · rentabilidad editable por clase de activo

- **Causa raíz**: Juanjo quería ajustar la rentabilidad esperada por clase (depósito 1,5–2,5%,
  otros 5–10%…). El motor YA combina rentabilidades por clase (`computeEffectiveCapitalReturn`,
  media ponderada sobre `allocation.customReturns`), pero la edición se quitó en v1.5.0a (solo
  fallback de lectura) → no había forma de tocarlas.
- **Cambio**: reexpuesto `setCustomReturn` en `ActualLifeOnboarding`; `AllocRow` muestra la
  rentabilidad como `EditableNumber` (0–20%, paso 0,5) para depósito/fondos-ETF/plan/otros; la
  liquidez sigue fija a 0%. NO se toca el motor: la media ponderada y `computeEffectiveCapitalReturn`
  quedan igual; solo se escribe a `allocation.customReturns[key]`.
- **No tocado**: `projectV2`/`computeEffectiveCapitalReturn`; claves localStorage; defaults de
  lectura (depósito 2,0 · fondos/plan = `annualReturn` · otros 0).
- **Verificación**: editor "¿Dónde está tu dinero hoy?" → los 4 campos de rentabilidad editables
  (cash fijo 0%, defaults 2/8/8/0 correctos); el "retorno medio ponderado" responde (100% fondos →
  8%); consola limpia; `npm run build` OK. Sin guardar → demo intacta.

### 2026-06-14 · Aprende · marca "leído" persistente en los conceptos

- **Causa raíz**: no había forma de saber qué conceptos ya habías leído → difícil retomar el
  aprendizaje donde lo dejaste.
- **Cambio**: al ABRIR un concepto (desde Conceptos, El Tablón o Glosario) se marca como leído en
  `plan.readLessons` ({id:true}, patrón de `phaseManualChecks`); las cards de Conceptos muestran un
  badge mono "✓ leído". Default en lectura (`plan.readLessons || {}`), sin migración.
- **No tocado**: `LEARN_CORPUS`/`LEARN_LEVELS` (contenido editorial cerrado, solo se referencia);
  `migrateToV2`; claves localStorage. Badge en `T.faint` (no verde — no es libertad).
- **Verificación**: abrir "Interés compuesto" → `plan.readLessons` gana la clave y la card muestra
  "✓ leído" (1 sola); persiste tras recargar; móvil 375×812; consola limpia; `npm run build` OK.

### 2026-06-14 · Onboarding · aclara "neto" en la progresión salarial escalonada

- **Causa raíz**: en el paso de progresión "escalonado" la nota "En neto, como tu salario" era
  ambigua sobre si el incremento (+€/mes) y el tope iban en neto o en bruto.
- **Cambio**: nota más explícita — "Importes en neto (lo que recibes en cuenta), igual que tu
  salario — no el bruto." Copy menor, sin lógica.
- **No tocado**: nada más; misma posición y estilo (mono eyebrow faint) en `Onboarding()`.
- **Verificación**: `npm run build` OK; la app arranca sin errores de consola; string sustituido en
  el componente que se muestra al elegir "escalonado" en la progresión salarial.

---

## Pase de unificación visual (redo de la capa visual de la narrativa de dirección)

La narrativa de dirección (entradas anteriores) era correcta en copy pero su ejecución visual
rompía el sistema de diseño (texto suelto sin Card, px/lineHeight crudos, 3 "Siguiente paso"
distintos, link/pill a mano, contradicción 60/61 en el cruce). Este pase **no cambia copy ni
lógica**; lleva todo al estándar existente (primitivas + tokens + jerarquía canónica).

### 2026-06-15 · UI · primitiva NextStep + unifica los "Siguiente paso" de Proyección y Seguimiento

- **Causa raíz**: las cards "Siguiente paso" estaban estilizadas de tres formas distintas y el link
  de acción se hacía a mano (`Btn variant="text"` se usaba 0 veces) → inconsistencia visual.
- **Cambio**: nueva primitiva `NextStep` en `ui/index.jsx` — `Card` + borde-izquierdo de tono
  (`accent` = avanzas/ok · `amber` = atención/tarde, **nunca verde**) + `Label` "Siguiente paso" +
  prosa serif lead + `Btn variant="text"` (primer uso del botón texto canónico). `ScreenProyeccion`
  y `ScreenSeguimiento` migran a `NextStep`; los botones `leanPct` pasan a geometría `Pill` (4×10).
- **No tocado**: copy, reglas deterministas, motor/`useDerived`. El bloque de Hoy se migra en su
  propio commit (pasa a Card). 
- **Verificación**: Proyección 'tarde' (borde amber, body + link `Btn` + vía Lean, 0 verdes);
  Seguimiento 'por delante' (borde accent, `Card` radius 14 / pad 24, link `Btn`); consola limpia;
  `npm run build` OK.

### 2026-06-15 · Proyección · reconcilia la edad de cruce — 'tarde' manda (hero + sol + ★ de la curva)

- **Causa raíz**: el hero ("Eres libre a los 60", verde, vía `reachesFreedom` + `Math.round`) y el ★
  de la curva contradecían a "En limpio"/"Siguiente paso"/resumen de Plan ("61 · tarde", ámbar, vía
  `destinoEstado` + `Math.ceil`) cuando el cruce caía justo tras la jubilación (zona 60–61).
- **Cambio** (solo render, sin tocar `useDerived`): hero, sol, ★ de la curva y pie del gráfico pasan
  a regirse por `d.destinoEstado` + `Math.ceil(d.cruceEdad)`. 'libre' → "Eres libre a los X" verde +
  sol por edad + ★ verde en la curva; 'tarde' → "Llegas a tu meta, pero tarde: a los X" ámbar + sol
  bajo ámbar + SIN ★ (el cruce cae fuera del dominio de la curva); 'no-llega' → la brecha + puesta total.
- **No tocado**: motor/`useDerived`/`projectV2`; la fila KPI; el verde del Monte Carlo ("X aguantan",
  resultado positivo, semántica propia, no es libertad).
- **Verificación**: 3 estados (libre 45 → verde + ★ verde; tarde 61 → ámbar + sin ★ + caption "fuera
  de la curva"; no-llega → sin ★ ni verde de cruce); el hero coincide con "En limpio"; consola limpia;
  `npm run build` OK.

### 2026-06-15 · Hoy · el resumen de la ruta pasa a Card + reutiliza NextStep

- **Causa raíz**: el "resumen + dirección" al pie de `RutaCincoFases` era **texto desnudo sobre el
  fondo** (un `<div>` con `borderTop`), con la cifra hero en px crudos (`mobile?40:52`) y `lineHeight
  1.05` — rompía el ritmo de cards de la pantalla (M1/M2/M3) y se leía como sin estilar.
- **Cambio**: dos cards al pie (mismo patrón que Proyección "En limpio" + "Siguiente paso"): un
  **retrato** (`Card` + `Label` "Tu destino" + kicker de estado + cifra `T.size.displayLg`/`T.lh.tight`/
  `T.tracking.display` —verde 'libre', ámbar 'tarde', sin cifra 'no-llega'— + frase de lectura serif que
  hila momentum + pensión) y la dirección vía la primitiva **`NextStep`**. Sin px ni lineHeight crudos;
  márgenes al ritmo de Card.
- **No tocado**: copy, reglas de dirección, `momentumAge`/`pensionAge`/`libertadAge`, motor.
- **Verificación**: Plan 'tarde' → retrato (radius 14, "61" ámbar displayLg 44, lectura) + NextStep
  (borde ámbar, link `Btn`); coincide con el hero/curva de Proyección; consola limpia; `npm run build` OK.

---

## Elevación visual ("subir lo soso al nivel de los momentos buenos" — referencia: el M2 de Plan)

Feedback: lo utilitario (gráficas frías, filas de cifras planas, chrome gris) desentona con los
bloques ricos y compuestos (M2 "monedas", hero, sol). Objetivo: que cada bloque sea un *momento
diseñado* — composición, jerarquía y calidez — sin gamificar y sin romper la disciplina de color
(verde/acento reservados a oposición/payoff; cifras descriptivas en tinta).

### 2026-06-15 · Proyección · "En limpio" gemela + chart y banda de KPIs elevados

- **Cambio**: (1) **"En limpio"** gemela del hero retrato (cifra `displayLg` —no `displayXxl`—, ★ en
  'libre', `lineHeight` token); (2) **chart "Tu línea de vida"**: relleno en degradado de 3 paradas
  bajo la curva, línea 3px, marcadores con halo (glow), **stat de lectura protagonista** (kicker +
  cifra `displayMd` que sigue al scrub), fondo de card cálido (lavado accent en esquina), plot más
  alto; (3) la fila de KPIs pasa a **banda de stats compuesta** (filete superior, divisores
  verticales, cifras `displayMd`, eyebrows en `muted`).
- **No tocado**: motor/`useDerived`, copy, claves. Color: cifras descriptivas en `T.ink` (el degradado
  del chart usa opacidad sobre `T.accent`, no un color nuevo).
- **Verificación**: Proyección 'tarde' (hero/sol/En limpio/curva coherentes; banda de KPIs compuesta;
  chart con cuerpo); consola limpia; `npm run build` OK.

### 2026-06-15 · Proyección · "Asunciones del modelo" como banda de stats editable

- **Cambio**: la lista "etiqueta / valor" (`RowWithWarning` en 2 columnas) pasa a una **banda de
  stats** (mismo lenguaje que la fila de KPIs): 4 celdas con divisores verticales, eyebrow-concepto
  + cifra display editable (`displayMd`) + unidad muted + aviso inline. Más presente y compuesta;
  sigue siendo editable.
- **No tocado**: la primitiva `RowWithWarning` (no se toca; este card usa celdas propias), el motor,
  los avisos (misma lógica de rangos).
- **Verificación**: 4 cifras editables (8 % / 2,5 % / 4 % / 90 años) con presencia + divisores +
  concept-links; consola limpia; `npm run build` OK.

### 2026-06-15 · Proyección · "En limpio" gemela del retrato de Hoy

- **Causa raíz**: la cifra de "En limpio" usaba `displayXxl` (40-64, mayor que el propio hero de la
  pantalla) y `lineHeight: 1.55` crudo → no rimaba con el retrato de Hoy ni con el hero.
- **Cambio**: cifra `displayXxl` → `T.size.displayLg` (igual que Hoy y que el hero de Proyección);
  `lineHeight 1.55` → `T.lh.normal`; ★ añadida a la cifra 'libre' (verde) para paridad con Hoy.
- **No tocado**: copy, estados, motor, la nota "cifra en € de hoy".
- **Verificación**: cifra 44px (= retrato de Hoy), ámbar en 'tarde', `lineHeight` 1.5; consola limpia;
  `npm run build` OK.

### 2026-06-15 · Proyección · la pill de Supuestos adopta la geometría de `Pill`

- **Causa raíz**: la pill estaba hecha a mano con padding `7×14` (más alta/chunky que la primitiva `Pill`).
- **Cambio**: padding → `4×10` (geometría `Pill` estándar; radius 999, mono eyebrow, `tracking.wide`,
  borde `T.line` ya coincidían). Sigue siendo `<button>` para el jump-link y para que el texto largo
  envuelva en móvil (la `Pill` real es inline-flex y desbordaría).
- **Verificación**: padding `4×10`, radius 999, borde `T.line`; `npm run build` OK.
