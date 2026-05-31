# Mi Plan FIRE — Documento de contexto para Claude Code

> Documento de referencia para próximos prompts de implementación.
> Mayo 2026. **Versión de la app: v1.4.0b** (SP-01 a SP-07 · ciclo completo bajo `DOCTRINA_DISENO.md v1.2.1`).
>
> **Documento de diseño maestro: `DOCTRINA_DISENO.md` v1.2.** Toda decisión visual o de UX debe consultarse allí antes que aquí. Este documento (CONTEXTO) es la referencia técnica; la doctrina es la referencia editorial/visual.

> 🔁 **ACTUALIZACIÓN post-Etapa 1 (mayo 2026 · migración cerrada).** La app ya **NO es un HTML monolítico**: la **fuente de verdad es `app/src/`** (modular, build **Vite** single-file). El monolito `mi_plan_v1_5_0a_3.html` queda **congelado como RED DE REGRESIÓN** (no se edita; hash `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`). **Correr/construir:** `cd app && npm run dev` (app real, http://localhost:5173) · `npm run build` → `dist/index.html` (lead magnet single-file) · `?gallery` abre la galería de componentes. **Estructura por capas:** `tokens/ lib/ hooks/ ui/ charts/ content/ modals/ flows/ state/ screens/`. **Contrato localStorage intacto** (claves `miplan.state.v1` / `miplan.accounts.v1`, `migrateToV2` sin tocar) — sigue siendo regla dura. Registro: **`CHANGELOG_v1_5_0a_3_src.md`**. *El resto de este documento describe el comportamiento del producto (sigue vigente: los componentes/flows existen en `app/src/`); las secciones sobre el flujo de trabajo del HTML están desfasadas y van marcadas.*

---

## ¿Qué es Mi Plan FIRE?

Mi Plan FIRE es una herramienta web de planificación financiera personal a largo plazo orientada al perfil **FIRE-en-formación español** (no a principiantes generales, no a inversores avanzados). *(Arquitectura post-Etapa 1: codebase modular en `app/src/` con build **Vite** a HTML autocontenido; antes era un monolito single-file con React vía Babel-standalone in-browser.)*

Funciona enteramente en local: cero backend, todo el estado en `localStorage`. Sin cuenta, sin nube, sin perfilado. La promesa de privacidad es verificable: cualquiera puede abrir el HTML y leer el código.

**El código fuente vive en `app/src/`** (modular, build Vite single-file → `dist/index.html`). El HTML monolítico `mi_plan_v1_5_0a_3.html` (9.372 líneas) queda **congelado como red de regresión** — no se edita (hash `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`). *(Histórico: el archivo de trabajo fue `mi_plan_v1_4_0b.html` y, hasta el cierre de la Etapa 1, los sucesivos `mi_plan_v*.html`.)*

---

## Filosofía del producto

Mi Plan FIRE no es una calculadora. Es una herramienta de planificación **con criterio editorial explícito**. Las decisiones de diseño se subordinan a tres principios:

1. **Desvelar la realidad económica del individuo.** El producto existe para que el usuario vea lo que le está pasando con su dinero, no para que se sienta bien. Si el plan es frágil, el producto lo dice. Si la pensión pública es incierta, el producto lo dice.

2. **No esperar a que nos salven.** La mentalidad del usuario FIRE-en-formación es que ni el Estado, ni el mercado, ni la inflación van a "arreglarse solos". El plan se construye sobre la propia disciplina del usuario, no sobre asunciones externas optimistas.

3. **Camino B en regulación financiera.** Mi Plan FIRE educa sobre categorías de producto (fondos indexados, ETFs, planes de pensiones, robo-advisors) y menciona índices (MSCI World, S&P 500, etc.). **No** menciona gestoras, brokers, ni productos concretos por nombre comercial. **No** da recomendaciones personalizadas en el sentido del artículo 140 LMV / MiFID II.

Los cinco compromisos del manifiesto público (`WhyDifferentModal`): privacidad verificable, Camino B, no impone tipo FIRE, sin retención artificial, honesto cuando incomoda.

Cualquier cambio de UX o copy debe pasar estos filtros antes de implementarse.

---

## Tono y voz

- Español de España, tuteo cercano pero no amiguete.
- Frases breves. Una idea por párrafo cuando es prosa larga.
- Sin emojis salvo iconos ya en uso (✓, ?, ↗, ↘, ◇, ⌖, ◐, ◧, ◢, ✦, ◌, ●, ○).
- Sin marketing-speak. Sin "potencia tu futuro financiero". Sin "transforma tu vida".
- Honesto incluso cuando incomoda. Si la cifra es decepcionante, se muestra y se explica.
- Sin condescendencia con el usuario. Asumimos inteligencia, pedimos atención.
- **Vocabulario monetario** (definitivo, v1.1.x): el toggle visible al usuario se llama **"Ajustar por inflación"** + switch O/I. Las claves internas `state.displayMode === 'nominal' | 'real'` **no cambian**. En captions y prosa, las cifras descontadas por inflación se etiquetan como **"(ajustado por inflación)"** o **"ajustado por inflación"**. Nomenclatura prohibida en strings JSX visibles: `"€ con/sin inflación"`, `"€ Futuro/Hoy"`, `"€ de hoy"`. Auditoría grep cierra cada sub-sprint que toque copy.

---

## Estado funcional actual (v1.1.1)

### Flujo del usuario

1. **`LandingPreOnboarding`** (primera apertura + usuarios migrados de v1.0 vía `migrationsApplied.v1_1_0_landing_reset`): título display "Mi *Plan* **FIRE**" + 3 bullets de manifiesto + 2 CTAs. Tras el click "Empezar →", flag `hasSeenLandingPreOnboarding = true`. Si `onboardingComplete = true`, el usuario va directo al dashboard sin repetir onboarding.
2. **`Landing` actual** ("Tu dinero, a treinta años vista"): seis direcciones de diseño, CTA "Empezar Mi Plan".
3. **`Onboarding` 9 pasos**: nombre → edad → capital → ingreso (NETO destacado) → ahorro (fijo/porcentual con preview) → evolución salarial (estable/escalonado/variable inline) → edad de retiro → espejo "Antes de soltarte" (Verdad 1 + Verdad 2) → recap "Esto es lo que Mi Plan FIRE va a hacer contigo".
4. **Dashboard** con nav de 5 secciones.

**Revisitar la landing**: logo de cabecera (mobile + desktop) y botón "Ver presentación de Mi Plan FIRE →" en Ajustes disparan `window.__openRevisitLanding`, que renderiza `LandingPreOnboarding` en modo `revisit` con CTA "← Volver" en lugar de "Empezar →". No toca el flag persistido.

### Nav final (5 secciones)

1. **`◐ Mi Plan`** (antes "Hoy") — pantalla principal rediseñada en v1.1.1 y adelgazada en v1.2.0, **tres movimientos narrativos** con encabezados elevados a headers (display Fraunces, numeración `01`/`02`/`03` mono ancillary, separador `borderBottom`):
   - *01 · Dónde estás* — 4 sub-bloques:
     - 1.A Tu situación actual (prosa cohesionada con KPIs).
     - 1.B Sin un plan → **destilado en v1.2.0**: dos KPIs (Poder adquisitivo perdido en Y años + Lo que dejarías de tener si no inviertes) + CTA `Ver el cálculo completo →` que abre `SinMiPlanModal` con la vista completa de `<ScreenSinMiPlan embedded />` (Verdad 1, 2 y, si hay `ActualLifeOnboarding`, 3/4/5). Cómputo de los KPIs en función pura `computeSinPlanKPIs(plan, profile)`.
     - 1.C Reparto del ingreso compacto → `<FlowTimelineCard maxYears={5} compact />`, próximos 5 años.
     - 1.D CTA Pro → "Profundizar (Pro) →" navega a `sinplan-pro` placeholder.
   - *02 · Hacia dónde puedes ir* — prosa adaptativa según `computeUserProfile(state)`:
     - Perfil **A** (no aporta) → sólo línea del plan estándar.
     - Perfil **B** (saving rate < 15%) → línea usuario accent + estándar fina dashed.
     - Perfil **C** (saving rate ≥ 15%) → línea usuario protagonista + estándar como referencia ligera.
   - El componente `<LifecycleChartDual>` renderiza la gráfica dual. El plan estándar viene de `projectStandardPlan(state)` con los parámetros de `STANDARD_PLAN_REFERENCE` (20% saving, retorno 8%, allocation por horizonte).
   - **v1.2.0**: el KPI Monte Carlo % básico (200 trials) y su `useEffect` se han eliminado de Mi Plan. El Monte Carlo profundo sigue en `MonteCarloCard` de Proyección, intacto. El Movimiento 2 cierra con un CTA minimalista `Profundizar en Proyección →` alineado a la derecha.
   - *Movimiento 3 · Tu ruta* — `<RutaCincoFases>` con ruta visual de **5 fases**:
     - F1 Cimientos · F2 Saneamiento de deuda (condicional, skipped si no hay deuda mala declarada) · F3 Colchón de liquidez (1/3/6 meses) · F4 Inversión sistemática (puede ir paralela a F3) · F5 Optimización fiscal (continua).
     - Sistema de check **mixto**: auto-detección (`monthlyLife>0`, `aporte>0`, `allocation.suma==100`...) + manuales persistidos en `plan.phaseManualChecks: { stepId: dateString }`.
     - Reset automático del paso 4.3 (rebalanceo anual) si tiene >365 días.
     - **v1.2.1**: `phaseEstimate` ahora computa fechas reales del plan del usuario (antes era hardcode `yr + offset`). `computeActivePhase` expone `monthlyLife, aporte, liquidEff, currentPortfolio, fireNumber, annualReturn, withdrawalRate, lifeExpectancy, profileAge`. Fase 3 estima meses para colchón completo (`gap / aporte`). Fase 4 usa fórmula cerrada del futuro valor para estimar fecha FIRE: `n = log((target*r + a) / (p0*r + a)) / log(1+r)`. Etiquetas posibles: `Completada`, `No aplica`, `Pendiente`, `Manual`, `Continua`, `Estimada en {año}`, `Estimada en N meses`, `Estimada este mes`, `Necesita aporte mensual`, `Cálculo no disponible`, `Inalcanzable con plan actual`, `Define tu gasto en Ajustes`.
     - Bloque de **Destinos** debajo: ★ Libertad financiera, ☼ Jubilación pública.
   - `computeNextStep()` (rule engine antiguo) sigue definido pero no se usa en Mi Plan; queda para reutilización futura.

2. **`◢ Proyección`** — incluye `SupuestosEditables` (sandbox de sesión), curva de patrimonio (`MultiLineChart`), ajustes rápidos (Slider), año-por-año, y `MonteCarloCard` al final.

3. **`◧ Seguimiento`** — incluye `MonthlyFlowCard` (flujo del mes), `ScreenMesAMes` con ventana de **3 meses (anterior + actual + siguiente)** + botón "Ver calendario completo →" que abre `MonthlyCalendarModal` (rejilla anual heat-map, celdas vacías clicables que crean el mes vía `ensureMonth`, detalle editable con `EditableNumber`, botones "+6 meses / +1 año" dentro del modal), `HitosOverview` (read-only) y `FlowTimelineCard`.

4. **`◇ Aprende`** — tres sub-tabs: **Conceptos** (default, con sub-tabs de nivel Esencial/Profundizando/Avanzado/Todos), **El Tablón** (reglas destiladas), **Glosario** (búsqueda). Total **36 conceptos** tras v1.1.1 (añadido `pignoracion` en Avanzado).

5. **`◌ Ajustes`** — configuración completa: perfil + asunciones generales (con warnings amber), **Ajuste del salario por IPC** (`salaryInflationFactor` con 3 opciones: 100%/50%/0%, añadido en v1.1.0), pensión pública (`PublicPensionCard`), tramos de ingreso/complementos/ahorro, eventos (confirmados/posibles), hitos (`HitosEditor` con **categorías** + bloques contextuales, ver M4 v1.1.1), cuentas multi-perfil (`AccountsCard`), datos (import/export/reset), **modo testing Pro** (toggle temporal), botón "Ver presentación de Mi Plan FIRE →".

### Sistema free/Pro

- Flag `state.isPro` (default `false`). Toggle en Ajustes → "Modo testing (temporal)".
- En Pro: Monte Carlo completo (5 bandas, SoR toggle, plegables, año de quiebra), Asset Allocation con rentabilidades editables por categoría.
- En free: Monte Carlo simplificado (banda exterior p10-p90 + mediana), allocation con rentabilidad como texto plano.
- El toggle de testing es **temporal**: se eliminará o se condicionará a variable de entorno antes del lanzamiento público.

### Sistema de hitos con categorías (v1.1.1)

Cada `goal` tiene un campo `category` (default `'otro'`). Las 8 categorías son: `liquidez | vivienda | coche | objetoGrande | ayudaFamiliar | herencia | jubilacion | otro` (constante `GOAL_CATEGORIES`).

`GoalContextualBlock` renderiza al final de cada `GoalRow` una nota desplegable según la categoría y el ratio target/patrimonio:
- `liquidez`: siempre → cuenta remunerada / renta fija a corto plazo.
- `vivienda` con `target > 30% patrimonio` → bloque pignoración (copy literal v1.1.1) + link a la lección.
- `coche` / `objetoGrande` con `target > 20%` → mismo bloque pignoración.
- `ayudaFamiliar` con `target > 10%` → planificación fiscal (donaciones intervivos).
- `herencia`: siempre → lump sum vs DCA.
- `jubilacion`: nota informativa.
- `otro`: sin trigger.

Bridge global `window.__openLearnConcept(id)` (state `globalConceptId` en `Shell` + `<ConceptModal>` renderizado en raíz) permite a `GoalContextualBlock` abrir la lección de pignoración sin cambiar de pestaña.

### Plan estándar de referencia (v1.1.1)

```js
const STANDARD_PLAN_REFERENCE = {
  savingRate: 0.20,
  allocationRV_youngHorizon: 0.80,
  allocationRV_midHorizon: 0.60,
  allocationRV_nearHorizon: 0.40,
  annualReturn: 8.0,
  inflationRate: 2.5,
  rebalanceFrequency: 'annual',
};
```

`projectStandardPlan(state)` corre `projectV2` con plan estándar (savingSegments con 20% del income actual, retorno 8%, inflación 2.5%, salaryFactor 1.0, sin eventos). No toca el state del usuario. **Importante**: `projectV2(...)` devuelve directamente el array `series`, no un objeto `{ series, ... }`. En v1.2.1 se corrigió un bug donde `projectStandardPlan` hacía `return { series: res.series, ... }` con `res.series === undefined`, lo que dejaba la línea del plan estándar sin renderizar (o renderizada degenerada como "línea vertical" cuando Recharts caía con un único punto válido). El fix usa `const series = projectV2(...); return { series, targetMonthly };`.

`LifecycleChartDual` usa **meses enteros** (`Math.round(row.age * 12)`) como clave del `ageMap` para evitar desajustes de floating-point entre dos proyecciones con orígenes distintos. Cambio defensivo introducido en v1.2.1.

`setTab` (Shell) en v1.2.1 ejecuta `window.scrollTo({ top: 0, behavior: 'instant' })` dentro de un `requestAnimationFrame` tras el `update`, con guard `if (t === state.activeTab) return` para no resetear cuando el usuario re-clica el tab activo.

---

## Convenciones de código

- **JSX dentro de `<script type="text/babel" data-presets="react">`**, transpilado en el cliente con `@babel/standalone`. No hay build system.
- **React 18 (UMD)**, Recharts 2.10, sin más dependencias externas.
- Estado global vía hook custom `useStore()`. Actualización vía `update`, `updatePlan`, `updateProfile`, `mutatePlan`, etc.
- Persistencia automática en `localStorage` con clave `miplan.accounts.v1` (wrapper multi-cuenta sobre el legacy `mi-plan-state`).
- Theme centralizado en objeto `T` (paleta, fuentes). Fuentes principales: `T.display` (Fraunces), `T.serif` (Instrument Serif), `T.mono` (DM Mono).
- Colores clave: `T.accent` (#c2410c naranja), `T.amber`, `T.green`, `T.red`, `T.ink`, `T.bg`, `T.paper`, `T.panel`, `T.line`, `T.lineSoft`, `T.inputBg` (#faf3e4 · v1.2 doctrina · P3 inputs · sólo se usa en v1.4.0c), `T.muted`, `T.faint`.
- Layout responsive. Hook `useIsMobile()` distingue mobile/desktop.
- Cabecera AGPL-3.0 en el `<!DOCTYPE>`, con placeholder `[TU NOMBRE]` para que el autor lo rellene antes de publicar.

---

## Sistema tipográfico (v1.3.0)

Tres ejes tokenizados en el objeto `T`: `T.size`, `T.lh`, `T.tracking`. **Ningún literal numérico de fontSize/lineHeight/letterSpacing debe introducirse fuera de los tokens** salvo excepción documentada inline con comentario `/* excepción · {razón} */`.

### `T.size` — tamaños de fuente

| Token | Valor | Uso |
|---|---|---|
| `T.size.eyebrow` | 11 | **Sólo mono uppercase** (suelo absoluto). Labels, eyebrows, captions micro. |
| `T.size.caption` | 13 | Caption serif/sans, helper text, metadatos. |
| `T.size.body` | 15 | Texto base de lectura (prosa, items de lista, descripciones). |
| `T.size.lead` | 17 | Texto destacado, intro de sección, frases hero pequeñas. |
| `T.size.subtitle` | 22 | Subtítulo, números secundarios (KPIs medianos, cifras fijas). |
| `T.size.displayMd` | `clamp(24px, 3vw, 32px)` | Headers de movimiento, KPI grande, título de sección. |
| `T.size.displayLg` | `clamp(28px, 4vw, 44px)` | "Hola, {nombre}", KPIs hero. |
| `T.size.displayXl` | `clamp(34px, 5vw, 52px)` | Onboarding heroes. |
| `T.size.displayXxl` | `clamp(40px, 6vw, 64px)` | Landing hero. |

### `T.lh` — line-height

| Token | Valor | Uso |
|---|---|---|
| `T.lh.tight` | 1.15 | Títulos display, números hero. |
| `T.lh.snug` | 1.3 | Subtítulos, cifras medianas. |
| `T.lh.normal` | 1.5 | Prosa de lectura (default). |
| `T.lh.relaxed` | 1.6 | Prosa larga, artículos de Aprende, manifiesto. |

### `T.tracking` — letter-spacing

| Token | Valor | Uso |
|---|---|---|
| `T.tracking.display` | -0.02em | Display tipografía, hero numbers. |
| `T.tracking.tight` | -0.01em | Headers medianos. |
| `T.tracking.normal` | 0 | Default (omitir property en JSX). |
| `T.tracking.wide` | 0.08em | Mono labels suaves. |
| `T.tracking.wider` | 0.12em | Mono labels (eyebrows, captions caps). |
| `T.tracking.widest` | 0.16em | Mono labels muy espaciados (numeración de pasos). |

### Reglas de uso

1. **Suelo tipográfico**: `T.size.eyebrow` (11) **sólo** en `T.mono` uppercase. En serif/sans/display, mínimo `T.size.caption` (13).
2. **Familia por defecto por token**:
   - `eyebrow` → `T.mono` + `textTransform: 'uppercase'` + `T.tracking.wider` o `widest`.
   - `caption`, `body`, `lead` → `T.serif` o `T.sans`.
   - `subtitle` → `T.display` o `T.serif`.
   - `displayMd/Lg/Xl/Xxl` → `T.display`, normalmente con `T.tracking.display` y `T.lh.tight`.
3. **clamp()**: no introducir nuevos. Si hace falta un responsivo, usar uno de los 4 display tokens o añadir uno nuevo en `T.size`.
4. **Excepciones**: si una sustitución produce visual peor, mantener inline con comentario `/* excepción · {razón} */`. Excepciones actuales: `fontSize: 64` (hero input nombre Onboarding paso 1), `fontSize: 96` (hero paso espejo), `lineHeight: 1` (16 ocurrencias funcionales en cifras display + botones icon — patrón idiomático sin comentario individual, listado en `AUDITORIA_VISUAL_v1_3_0.md`).

Documentos de referencia: `AUDITORIA_VISUAL_v1_3_0.md` (inventario completo antes/después) y `CHANGELOG_v1_3_0.md` (resumen del sprint).

---

## Convenciones de nombres internos

**Importante para no romper datos persistidos:**

- En código y en `localStorage` se mantienen los nombres antiguos: `sandbox`, `'hipotetico'`, `sandboxActive`, `state.sandbox`, `state.displayMode === 'nominal'` / `'real'`, `state.activeTab === 'hoy'`, etc.
- En UI visible se usa el vocabulario nuevo: "evento posible", "Mi Plan" (tab), "Ajustar por inflación". El vocabulario "Probador" / "Probar escenario" **ya no aparece en UI** desde v1.4.0a (Probador eliminado del free, reservado para Pro). Internamente `state.sandbox` y los callbacks `startSandbox`/`applySandbox`/`discardSandbox` siguen declarados como zombi para compatibilidad de estado persistido y reactivación en Sprint 4.
- **NO renombrar los nombres internos en ningún caso.** Los usuarios con estado guardado se romperían.
- Cuando se añada un campo nuevo al estado, usar nombres descriptivos en inglés tipo `monthlyExpense`, `mortgage`, `currentAllocation`, `isPro`, `hasSeenLandingPreOnboarding`, `variableSegments`.

---

## Convenciones de migración de estado

Cuando se añade un campo nuevo al estado:

1. Definir un valor por defecto explícito.
2. Aplicar el valor por defecto en `emptyState()` (estado inicial completo) **y** en `migrateToV2()` (usuarios con estado anterior).
3. La migración tiene que ser **idempotente**: si el campo ya existe, no tocarlo.
4. **No** eliminar campos existentes aunque queden obsoletos. Dejarlos como zombis. La compatibilidad hacia atrás es no negociable.
5. El `Shell` puede normalizar valores legacy de `state.activeTab` vía `useEffect` (ejemplo: `'plan'` → `'ajustes'`, `'mes'` → `'seguimiento'`, `'sinplan'` → `'hoy'` desde v1.1.1).
6. Para migraciones one-shot que reabren un flow (ej. "mostrar la landing al usuario existente una sola vez"), usar bandera bajo `state.migrationsApplied: { v1_X_Y_name: true }` para registrar la aplicación y evitar repetir.

### Campos del estado y migraciones aplicadas

| Campo | Tipo | Default | Desde |
|---|---|---|---|
| `state.plan.salaryInflationFactor` | number 0.0-1.0 | `1.0` | v1.1.0 |
| `state.plan.phaseManualChecks` | objeto `{ stepId: dateString }` | `{}` | v1.1.1 |
| `goal.category` | string en `GOAL_CATEGORIES` | `'otro'` | v1.1.1 |
| `state.migrationsApplied` | objeto bandera | `{}` (se llena por migraciones) | v1.1.0 |
| `state.hasSeenLandingPreOnboarding` | bool | `false` en nuevos, **forzado a `false` una vez** para usuarios v1.0 vía `migrationsApplied.v1_1_0_landing_reset` | v5.8 + migración v1.1.0 |
| `state.isPro` | bool | `false` | v5.10 |

---

## Niveles del corpus Aprende (`LEARN_LEVELS`)

Los **36** ids de `LEARN_CORPUS` se agrupan en tres niveles:

```
esencial (12):
  interes-compuesto, retorno-anual, inflacion, volatilidad,
  riesgo-incertidumbre, patrimonio, horizonte, aporte-mensual,
  asset-allocation, fondos-indexados, comisiones, diversificacion

profundizando (13):
  regla-4, monte-carlo, libertad-financiera, tasa-retiro,
  secuencia-retornos, esperanza-vida, independencia-jubilacion,
  etfs-vs-fondos, plan-pensiones, broker, robo-advisors,
  inversion-pasiva, dca

avanzado (11):
  tramos, eventos-pos-conf, probador, lean-coast-fat, rebalanceo,
  pignoracion,
  irpf, pension-publica, base-reguladora, tributacion-pp, modelo-720
```

Si necesitas envolver un término que no está en esta lista, **no inventes un id nuevo**. O bien usa el id existente más cercano (por ejemplo "inflación" para envolver "el IPC"), o bien deja el texto plano sin `<Concept>`.

Iconos SVG inline para los **12 conceptos Esencial** vía `<LearnIcon id />` + 1 icono para `pignoracion` (escudo) en Avanzado. Los 22 restantes usan fallback (rombo abstracto). Generar el resto sigue el patrón establecido.

---

## Cómo trabajar

> ⚠️ **Desfasado tras la Etapa 1.** El flujo de abajo (copiar el HTML, editar la copia, validar con Babel, abrir en navegador) describía el **monolito** y ya **no aplica** para desarrollo. Ahora: `cd app && npm run dev` (Vite dev server) · `npm run build` → `dist/index.html` · verificadores deterministas en `app/scripts/` (`verify-tokens/lib/content/state.mjs`) · el HTML monolítico está **congelado** (red de regresión). Se conserva lo de abajo como referencia histórica del lead magnet.

- El archivo a modificar es `mi_plan_v1_1_1.html`. **Trabaja siempre sobre una copia** (`cp mi_plan_v1_1_1.html mi_plan_v1_x.html` con la versión que toque) y modifica la copia.
- Valida sintaxis JSX después de cada bloque significativo de cambios. Stack de validación al final del documento.
- Si modificas estado persistido, escribe la migración correspondiente en `migrateToV2()` y `emptyState()`.
- Después de cambios significativos, abre el archivo en un navegador para verificar runtime. La validación Babel no detecta errores de React (Rules of Hooks, etc.).
- Para tests headless, Playwright + Chromium con todas las deps locales en `/tmp/runtime/` (react.js, react-dom.js, prop-types.js, react-is.js, Recharts.js, babel.js). Pattern probado en cada sub-prompt del Sprint v1.0.

---

## Lo que **no** debe hacerse

- No cambiar el motor de proyección (`projectV2`) salvo que el prompt lo pida explícitamente y aún así con cautela. Su firma es estable: añadidos opcionales (`actualByKey`, `endAge`, `startAge`, `months`, `effectiveReturn`) son aditivos.
- No cambiar la firma exterior de `runMonteCarlo`. Solo añadir opts opcionales (`sequenceMode`, etc.).
- No introducir dependencias externas nuevas (librerías, fonts, APIs).
- No cambiar la promesa de "todo en local". Cero llamadas de red, cero fetch.
- No renombrar campos del estado persistido. No renombrar claves de localStorage.
- No tocar `LEARN_CORPUS` (contenido editorial cerrado). Los niveles viven aparte en `LEARN_LEVELS`.
- No usar emojis salvo los ya en uso.
- No introducir "celebraciones" tipo confeti, sonidos, animaciones llamativas. El producto es sobrio por diseño.
- No retiros artificiales (sin notificaciones, sin rachas, sin gamificación adictiva).

---

## Lo que sí debe hacerse

- Mantener coherencia visual con la estética editorial (fuentes serif para prosa, mono para labels, display para cifras grandes).
- Usar el sistema de colores semánticos: amber para advertencias, red para alarma fuerte, green para confirmación positiva, accent para destacado normal.
- Para cualquier copy nuevo, usar el tono y voz definidos arriba. Si el prompt no especifica el copy, derivar del manifiesto editorial.
- Para cualquier input numérico nuevo, validar rangos razonables y permitir edición libre.
- Cuando se añada un campo al estado, contemplar la migración idempotente.
- Cuando se introduzca un nuevo gating (free/Pro), respetar la convención: lectura vía `state.isPro` desde `useStore()`, sin extraer dos componentes salvo necesidad real.

---

## Comunicación durante el trabajo

- Documenta los cambios en un changelog tipo `CHANGELOG_v1_x.md` en la misma carpeta. Una línea por cambio.
- Si encuentras decisiones de producto que no están claras en el prompt, **pregunta antes de inventar**. No improvises copy editorial. No improvises cambios de comportamiento que no se hayan pedido.
- Si encuentras un bug colateral mientras trabajas, anótalo en `BUGS_ENCONTRADOS.md`. No lo arregles salvo que sea bloqueante para el trabajo en curso.

---

## Stack de validación

> ⚠️ **Desfasado tras la Etapa 1.** La validación Babel-in-browser de abajo aplicaba al monolito. Ahora la build/validación es `npm run build` (Vite transpila y empaqueta en disco) + los verificadores deterministas en `app/scripts/`. Lo de abajo se conserva como histórico.

```bash
# Babel para validar sintaxis JSX
cd /tmp/babelcheck
npm init -y
npm install @babel/core @babel/preset-react @babel/preset-env

# Script de validación tipo:
node -e "
const babel = require('@babel/core');
const fs = require('fs');
const html = fs.readFileSync('mi_plan_v1_0.html', 'utf8');
const match = html.match(/<script type=\"text\/babel\" data-presets=\"react\">([\s\S]*?)<\/script>/);
if (!match) { console.error('No script block found'); process.exit(1); }
try {
  babel.transformSync(match[1], { presets: ['@babel/preset-env', '@babel/preset-react'] });
  console.log('Sintaxis OK');
} catch (err) {
  console.error('Error:', err.message);
  if (err.loc) console.error('Línea:', err.loc.line);
  process.exit(1);
}
"
```

Para runtime, montar deps locales y servir el HTML con file://. Playwright + Chromium headless funciona con `ignoreHTTPSErrors: true` y deps en `/tmp/runtime/` (react, react-dom, recharts, prop-types, react-is, babel).

---

## Estructura del archivo (referencia rápida)

> ⚠️ **Post-Etapa 1:** este orden describe el **monolito congelado**. En `app/src/` el mismo contenido vive modularizado por capas (`tokens/ lib/ hooks/ ui/ charts/ content/ modals/ flows/ state/ screens/`). El mapa de abajo sigue siendo útil para localizar símbolos en el HTML de regresión.

Las secciones principales del archivo `mi_plan_v1_1_1.html` siguen este orden aproximado (líneas verificadas con `grep -n`):

1. **Cabecera HTML + AGPL** (líneas 1-26)
2. **Scripts CDN + `<script type="text/babel">`** (líneas ~26-60)
3. **Theme `T`** (línea ~66)
4. **`GOAL_CATEGORIES`** (línea ~106) — añadido v1.1.1
5. **`LEARN_CORPUS`** (línea ~124)
6. **`TABLON`, `LEARN_DISCLAIMER`, `CATEGORY_LABELS`** (líneas ~520-580)
7. **`LEARN_LEVELS`, `LEARN_LEVEL_LABELS`, `LEARN_LEVEL_BY_ID`** (línea ~585)
8. **`LearnIcon`** (línea ~622, incluye icono `pignoracion`)
9. **Motor de proyección**: `projectV2`, `toRealEur`, `inferVolatility`, `runMonteCarlo` (líneas ~795-1260)
10. **State / store**: `migrateToV2`, `seedState`, `emptyState`, `StateProvider`, `useStore`, `useDerived` (líneas ~1450-2050)
11. **Componentes UI base**: `EditableNumber`, `Slider`, `LineChart`, `Card`, `Btn`, `DisplayModeToggle` (líneas ~2050-2920, interruptor único v1.1.0)
12. **`LifecycleChart` (legacy)** (línea ~2954)
13. **Cards de datos**: `RetirementCard`, `MonteCarloCard` (free/Pro), `HouseholdSummaryCard`, `MonthlyFlowCard`, `FlowTimelineCard` (con maxYears/compact v1.1.1), `FinancialHealthCard` (líneas ~3050-3990)
14. **Landing flow**: `LandingPreOnboarding`, `WhyDifferentModal`, `Landing`, `Onboarding` (líneas ~4050-5290)
15. **`STANDARD_PLAN_REFERENCE`, `computeUserProfile`, `projectStandardPlan`, `LifecycleChartDual`** (líneas ~5300-5430) — todos v1.1.1
16. **`computeActivePhase`, `_withinYear`, `RutaCincoFases`** (líneas ~5440-5710) — v1.1.1
17. **`computeNextStep` (legacy)**, `SinMiPlanProPlaceholder`, `ScreenHoy` (rediseñada v1.1.1: 3 movimientos con 1.A–1.D, gráfica dual, ruta 5 fases) (líneas ~5720-6020)
18. **`ScreenMesAMes` + `MonthlyCalendarModal`** (con `addMonths`/`ensureMonth`/`update` v1.1.0) (líneas ~5900-6175)
19. **`HitosEditor`, `HitosOverview`, `GoalRow` + `GoalContextualBlock`** (líneas ~6885-7150)
20. **`SupuestosEditables`, `ScreenProyeccion`, `MultiLineChart`** (líneas ~6435-6870)
21. **`ScreenAjustes`** + `RowWithWarning`, `Row` (línea ~7390)
22. **Antes de Mi Plan**: `ExpenseRow`, `AllocRow`, `ActualLifeOnboarding`, `ScreenSinMiPlan` (con `compactView` v1.1.1) (líneas ~7710-8830)
23. **Aprende**: `Concept`, `ConceptModal`, `OnboardingHelp`, `ScreenAprende` (líneas ~8830-9220)
24. **`Shell`** (mobile y desktop) con `globalConceptId` + `<ConceptModal>` global + `__openLearnConcept` (líneas ~9230-fin)
25. **`</script>` + cierre HTML**

Estos números son aproximados; pueden haberse desplazado tras tu trabajo. Usa `grep -n` para localizar funciones específicas.

---

## Historia · Sprint v1.0 (v5.6 → v1.0)

| Sub-prompt | Versión | Cambios principales |
|---|---|---|
| A | v5.6 | Renombrado de nav (Hoy→Mi Plan), modos monetarios (Con/Sin inflación), stacked-charts ordering, hitos no precargados, tramos colapsables. |
| B | v5.7 | Nav final 5 secciones. `ScreenPlan` deprecado. `ScreenSinMiPlan` queda fuera de nav. `HitosEditor` movido a Ajustes. `ScreenSeguimiento` esqueleto. Placeholder Supuestos en Proyección. Normalización legacy de `activeTab`. |
| C | v5.8 | `LandingPreOnboarding` + `WhyDifferentModal` (manifiesto 5 bloques). Flag `hasSeenLandingPreOnboarding`. |
| D | v5.9 | Mi Plan reescrita como narrativa de 3 movimientos. `computeNextStep` rule engine. Sin Mi Plan integrado como desplegable. `SinMiPlanProPlaceholder`. `SupuestosEditables` con sandbox de sesión en Proyección. MonteCarloCard movido a Proyección. MonthlyFlowCard y FlowTimelineCard movidos a Seguimiento. |
| E | v5.10 | Flag `isPro`. MonteCarloCard dividido free/Pro. AllocRow editable solo Pro. Toggle testing + inventario Pro en Ajustes. |
| F | v5.11 | Onboarding pulido: NETO destacado, preview saving, tope explanation, variable inline (hasta 4 tramos), paso 8 simplificado. Aprende reorganizada en 3 niveles con tarjetas SVG (12 iconos Esencial dibujados). |
| G | **v1.0** | Cabecera AGPL-3.0 con placeholder `[TU NOMBRE]`. Changelog consolidado. Este contexto actualizado. |

## Historia · Sub-sprint v1.1.0 (v1.0 → v1.1.0)

8 bug fixes + 4 hotfixes posteriores:

- **B1**: pestaña Aprende en mobile (eliminado el `.filter()` que la ocultaba).
- **B2**: Movimiento 2 reacciona al toggle €/€-real con coletilla "(ajustado por inflación)" (hotfix posterior, ver abajo).
- **B3**: `plan.salaryInflationFactor` (100%/50%/0% del IPC) aplicado en `projectV2` a `incomeSegments` y `bonusSegments`. UI en onboarding paso 4 y Ajustes.
- **B4**: Onboarding paso 5 — Porcentual descrito antes que Fijo.
- **B5**: Calendario mensual con heatmap anual + ventana de meses recientes.
- **B6**: Tooltip de flujo: Invertido arriba de Ahorrado bruto (`itemSorter`).
- **B7**: Cero `fontSize: 8/9/10` en todo el archivo (186 + 19 reemplazos).
- **B8**: Migración one-shot `migrationsApplied.v1_1_0_landing_reset` → re-mostrar landing una vez a usuarios v1.0. Logo + Ajustes abren landing en modo `revisit` con "← Volver".

**4 hotfixes** aplicados luego (incorporados como paso 0 del sub-sprint v1.1.1):
- `DisplayModeToggle` rediseñado como interruptor único "Ajustar por inflación" + switch O/I.
- `MonthlyCalendarModal` con celdas vacías clicables (vía `ensureMonth`), detalle editable y botones +6m/+1año dentro del modal.
- Copy del Movimiento 2: "(en € de hoy)" → "(ajustado por inflación)".
- Ventana de meses recientes en Seguimiento: anterior + actual + siguiente.

## Historia · Sub-sprint v1.1.1 (v1.1.0 → v1.1.1)

Cambio estructural mayor en Mi Plan + sistema de hitos contextuales + lección de pignoración + auditoría editorial:

- **M1**: Movimiento 1 absorbe Sin Mi Plan en 4 sub-bloques (1.A situación, 1.B `ScreenSinMiPlan` embedded compact, 1.C `FlowTimelineCard` 5 años, 1.D CTA Pro). Ruta `'sinplan'` deja de ser navegable.
- **M2**: Movimiento 2 → "Hacia dónde puedes ir". Tres perfiles (A/B/C) por `computeUserProfile`. Gráfica `LifecycleChartDual` con plan estándar `STANDARD_PLAN_REFERENCE` proyectado vía `projectStandardPlan`. Prosa adaptativa.
- **M3**: Movimiento 3 → `RutaCincoFases` con 5 fases (Cimientos, Saneamiento, Colchón, Inversión, Optimización). `computeActivePhase` + check mixto auto/manual + `plan.phaseManualChecks` persistido. Reset anual del paso 4.3.
- **M4**: Sistema de 8 categorías de hito (`GOAL_CATEGORIES`) + `GoalContextualBlock` con triggers contextuales (pignoración para hitos vivienda > 30% del patrimonio, cuenta remunerada para colchón, lump sum vs DCA para herencia, etc.). Bridge `window.__openLearnConcept`.
- **M5**: Nueva lección "Pignoración de activos" en Avanzado de `LEARN_CORPUS` + icono SVG (escudo).
- **M6**: Auditoría editorial sistemática. Cero ocurrencias de `"€ sin/con inflación"`, `"€ de hoy"`, `"€ futuros"` en strings JSX visibles.

## Historia · Sub-sprint v1.2.0 (v1.1.1 → v1.2.0)

Adelgazar Mi Plan. Tres cambios localizados en `ScreenHoy`:

- **A · Compactar Movimiento 1.B**: `<ScreenSinMiPlan embedded compactView />` inline sustituido por dos KPIs destilados (Poder adquisitivo perdido + Lo que dejarías de tener si no inviertes) + CTA `Ver el cálculo completo →` que abre el nuevo `SinMiPlanModal` (patrón overlay+escape+body-lock idéntico a `WhyDifferentModal`, `maxWidth: 920`, contenido `<ScreenSinMiPlan embedded />` con vista completa). Función pura `computeSinPlanKPIs(plan, profile)` con `salaryGrowthAnnual = 1.0` fijo (referencia conservadora). Prop `compactView` eliminado.
- **B · Eliminar Monte Carlo del Movimiento 2**: `useEffect` que corría `runMonteCarlo(plan, profile, { trials: 200, ... })` en background, estado `basicMC`, variables `successPct`/`successColor`, y el badge visual con el porcentaje grande → todos eliminados de `ScreenHoy`. Sustituidos por un CTA minimalista `Profundizar en Proyección →` alineado a la derecha. `runMonteCarlo` y `MonteCarloCard` en Proyección **intactos**.
- **C · Headers narrativos**: los tres encabezados (1, 2, 3) pasan de eyebrows (mono 11px faint) a headers visibles (display Fraunces `clamp(24px, 3vw, 32px)` ink, precedidos por numeración `01`/`02`/`03` en mono 13px faint, separados por `borderBottom: 1px solid T.line`). El título "Hola, {nombre}" `clamp(28px, 4vw, 44px)` sigue siendo el elemento dominante.

## Historia · Sub-sprint v1.2.1 (v1.2.0 → v1.2.1)

Hotfix tras testing de v1.2.0. Siete items localizados:

- **1 · Escape Unicode literal**: cuatro ocurrencias de `ó` (texto JSX, no string literal) sustituidas por `ó` real en `DisplayModeToggle`. Fix de bug visible "AJUSTAR POR INFLACI\U00F3N".
- **2 · Caption del toggle en Mi Plan**: añadida nota discreta `"afecta a las cifras de la trayectoria"` bajo `<DisplayModeToggle />` en Mi Plan, para evitar la confusión de "el toggle no funciona en todas partes" (los KPIs de Mov 1.B son por definición reales y no cambian con el modo).
- **3 · Fix plan estándar vertical en M2**: causa raíz era `projectStandardPlan` haciendo `return { series: res.series }` cuando `projectV2(...)` devuelve directamente el array (`res.series === undefined`). Fix en una línea + endurecimiento de `LifecycleChartDual` usando meses enteros como ageKey.
- **4 · `phaseEstimate` calculado de verdad**: antes era hardcode `yr + (phaseNum === 1 ? 0 : ...)`. Ahora cada fase tiene su propia lógica derivada del plan. Fase 3: meses para colchón completo. Fase 4: fórmula cerrada del futuro valor para fecha FIRE. `computeActivePhase` expone derivadas adicionales (`monthlyLife, aporte, liquidEff, currentPortfolio, fireNumber, annualReturn, withdrawalRate, lifeExpectancy, profileAge`).
- **5 · Reset scroll al cambiar de tab**: `setTab` ejecuta `window.scrollTo({ top: 0, behavior: 'instant' })` dentro de `requestAnimationFrame`, con guard de re-clic en tab activo.
- **6 · Onboarding paso 8/9 limpieza**: bloque "Más adelante, dentro de Mi Plan…" eliminado. "Sin Mi Plan" / "Con Mi Plan" → "Sin Plan" / "Con Plan" en KPIs de las Verdades (onboarding + `ScreenSinMiPlan` + tooltip de su chart). "Salario nominal" → "Salario sobre el papel" en toda la jerga visible (onboarding + KPI Mov 1.B + tooltip/leyenda/prosa de `ScreenSinMiPlan`). El nombre del producto "Mi Plan FIRE" y la pantalla "Sin Mi Plan Pro" **no** se renombran.
- **7 · Onboarding paso 9/9 rediseñado**: prosa densa convertida en estructura visual de dos columnas (mobile: stack) con bullets cortos. Texto reducido ~60%. Intro 2 líneas, "Lo que sí" 4 bullets, "Lo que no" 3 bullets, cierre 1 frase.

## Historia · Sub-sprint v1.3.0 (v1.2.1 → v1.3.0)

Auditoría visual sistemática. Tokenización tipográfica de fontSize + lineHeight + letterSpacing.

- **Tokens nuevos en `T`**: `T.size.{eyebrow, caption, body, lead, subtitle, displayMd, displayLg, displayXl, displayXxl}` · `T.lh.{tight, snug, normal, relaxed}` · `T.tracking.{display, tight, normal, wide, wider, widest}`. Ver sección "Sistema tipográfico" arriba.
- **1.068 sustituciones aplicadas en 4 pasadas mecánicas**: letterSpacing (290), lineHeight (186), fontSize numérico (590), fontSize clamp (33). Cero cambios de copy, lógica, layout o estado.
- **Suelo tipográfico**: 11px sólo en mono uppercase; serif/sans/display mínimo 13px. Esto subió legibilidad: 12px y 14px desaparecieron como literales.
- **20 valores únicos de `fontSize` → 9 tokens + 2 excepciones**. 14 valores `lineHeight` → 4 tokens + 16 funcionales. 14 valores `letterSpacing` → 6 tokens.
- **Excepciones**: `fontSize: 64` (input hero Onboarding paso 1) y `fontSize: 96` (paso espejo) marcadas inline con `/* excepción · {razón} */`. Los 16 `lineHeight: 1` funcionales (cifras display gigantes + botones icon) quedan sin comentario individual por patrón sistémico, listados en `AUDITORIA_VISUAL_v1_3_0.md`.
- **Archivo `AUDITORIA_VISUAL_v1_3_0.md`**: documento de referencia con tablas before/after por cada eje. No se descarta; queda como referencia para sub-sprints futuros.
- **Crecimiento del archivo**: +33 líneas / +15 KB (+2,8%) por la adición de los tres sub-objetos en `T` y los dos comentarios de excepción. Aceptable.

## Historia · Sub-sprint v1.4.0a (v1.3.0 → v1.4.0a)

Quitar Probador (gate Pro). Primera de tres fases de la reestructuración nav. Eliminación quirúrgica del sistema de sandbox/Probador del producto free; reservado para una sección Pro unificada en Sprint 4.

- **Componentes eliminados**: `function SandboxBanner`, `function SupuestosEditables`. Sustituidos por comentarios marcadores.
- **Renderizados eliminados**: `<SandboxBanner />` en ambos shells; cabecera de `ScreenProyeccion` simplificada (sin botones Probar/Aplicar/Descartar, sin rama de subtítulo "Estás explorando un escenario"); `<SupuestosEditables />` y Card "Ajustes rápidos" en Proyección; Card Sandbox en cabecera de Ajustes.
- **`useStore` API**: exports eliminados (`startSandbox`, `discardSandbox`, `applySandbox`, `sandboxActive`). `activePlan` simplificado a `state.plan` (sin fallback `state.sandbox || state.plan`).
- **`useDerived` API**: campos eliminados del return (`seriesSandbox`, `finalSandbox`); variables internas eliminadas (`sandboxEffReturn`, `sandboxCurrentPortfolio`); `sandboxActive` fuera de las deps del `useMemo`.
- **`ScreenProyeccion` refactor**: `effectivePlan`/`effectiveProfile`/`effectiveInflRate` y todo el sistema de `overrides` eliminados. `MonteCarloCard` ahora recibe `plan`/`profile`/`inflRate` directos. Subtítulo único: "Con los tramos, ahorros y eventos confirmados de tu plan actual."
- **Zombi mantenido** (compatibilidad): `state.sandbox` field (preservado por `migrateToV2`), callbacks `startSandbox`/`discardSandbox`/`applySandbox` declarados pero NO exportados, `mutatePlan` intacto (lo usan mutadores de tramos/eventos).
- **Roadmap**: en Sprint 4 vuelve el **Probador unificado** (un solo sistema, no dos) como funcionalidad Pro. Cuando se reintroduzca: reactivar exports en `useStore`, restaurar `<SandboxBanner />` o equivalente, decidir si el patrón pasa por `state.sandbox` (estado-bound) o session-only.

## Historia · Ciclo v1.4.0b · SP-01 a SP-07 (v1.4.0a → v1.4.0b)

Ciclo completo bajo `DOCTRINA_DISENO.md v1.2.1` (doctrina v1.2 actualizada en SP-03). Documento maestro de cambios: `CHANGELOG_v1_4_0b.md`.

- **SP-01** · saneamiento. `T.inputBg = '#faf3e4'` añadido (P3 inputs). `function KpiCard` eliminada (huérfana, variante highlight inverted). `sandboxSeries` zombi limpio en `LineChart` (3 puntos post-eliminación de Probador en v1.4.0a).
- **SP-02** · callouts unificados al patrón U1. Lección clave / Regla / Aviso del `ConceptModal` convergen: `borderLeft 3px {color}` · `padding 14px 20px` · `radius '0 6px 6px 0'` · `bg rgba(color, 0.06-0.08)`. Antipatrón A7 resuelto.
- **SP-03** · A9 aplicado a 7 cifras hero/destilado. Cifras descriptivas → `T.ink` (4 ediciones). Pérdida teórica → `T.red` (3 ediciones, incluyendo +1 ampliación coherente en ScreenSinMiPlan). Intereses hipoteca `T.amber` legítimo. Doctrina patch v1.2.1 generada: `T.amber` añadido como cuarta opción válida para cifras hero (coste contratado · atención sin alarma). Hallazgo: `FinancialHealthCard` y `NextGoalCard` son código huérfano (sin callers JSX) tras rediseño v1.1.1 — candidato a limpieza futura.
- **SP-04** · charts conservadores. Líneas principales 2px sólida. Líneas referencia 1.5px dashed "4 4" T.faint. 18 ticks +`letterSpacing: 0.04em`. `LegendChip` autocontenido (mono uppercase muted). MultiLineChart dinámico normalizado por coherencia (no estaba en listado literal, violación idéntica). Excepciones intactas: p10/p90 Monte Carlo (banda), Area decum, Area invest stacked, ReferenceLine markers.
- **SP-05** · prosa, lead y sub-anclajes. Lead 1.A: `subtitle (22) → lead (17)` con `lh.relaxed (1.6)` y `maxWidth 640`. Sub-anclaje 1.B "Sin un plan" con patrón doctrinal completo (numeración mono `1.B` + `<h3>` display). Deuda SP-05.D: lead 1.A tiene 4 énfasis `<strong>` (>3), pendiente de SP futuro.
- **SP-06** · Shell desktop reescrito. Sidebar 210px sustituido por **header sticky horizontal**: logo italic accent 28 + 5 tabs display italic 17 + `KpiPill` (componente nuevo, sustituye a MiniProjectionFooter eliminada) + circle 28×28 con `AccountMenu` popover (componente nuevo). Footer mono uppercase. Tab "Mi Plan" → "Plan". State: `showAccountMenu`, `accountAnchorRef`.
- **SP-07** · Shell mobile reescrito. Header sticky compacto + bottom nav fijo con **5 tabs display italic** (era mono uppercase). Labels abreviadas inline ("Proyección" → "Proy.", "Seguimiento" → "Seguim."). `KpiPill` + circle 24×24 con `AccountMenu` reusados de SP-06. Footer compartido. `AccountPill` eliminada (0 callers tras la reescritura).

**Resultados consolidados**:
- Δ tamaño: +31 líneas / -2 KB (dentro del rango esperado -100 a +50).
- Babel ✓ tras cada SP. Runtime e2e desktop+mobile ✓.
- Auditoría grep final: `MiniProjectionFooter`, `KpiCard`, `AccountPill`, `sandboxSeries`, `dataKey="sandbox"`, escape `\u00XX`, "€ sin/con inflación", `fontSize hero displayLg/displayMd con T.accent`, `strokeWidth={2.5}/{2.4}/{2.8}`, `strokeDasharray="5 4"`, ticks sin letterSpacing → **todos 0**.
- Compatibilidad localStorage v1.4.0a → v1.4.0b ✓ (state.sandbox zombi preservado).

**Pendiente del ciclo** (no son bugs, son decisiones de scope explícito):
- Aplicar `T.inputBg` en `<input>`/`<select>` del producto · SP-08 (próximo).
- Reescribir prosa lead 1.A para resolver deuda SP-05.D.
- Limpieza huérfanos `FinancialHealthCard`/`NextGoalCard`.
- Normalizar `ReferenceLine` markers (dash `"3 3"`) si la doctrina §2 extiende su alcance.
- Probador unificado (Pro) · Sprint 4.

---

## Lo que **no** se hace en este sprint (roadmap explícito)

- No PWA · Sprint 2
- No GitHub público · Sprint 2
- No landing en miplanfire.com · Sprint 2
- No Plausible Analytics · Sprint 2
- No newsletter · Sprint 3
- No paywall real · Sprint 4 (condicional)
- No iconos para los 22 conceptos restantes de Profundizando/Avanzado · v1.x si hay demanda
- No reescritura del motor de proyección
- No cambio de claves de localStorage
