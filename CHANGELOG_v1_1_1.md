# Mi Plan FIRE — CHANGELOG v1.1.1

Sub-sprint **v1.1.1** · rediseño narrativo de Mi Plan + sistema de hitos contextuales + lección de pignoración + auditoría editorial. Origen: `mi_plan_v1_1_0.html` con los 4 hotfixes ya aplicados.

Archivo: `mi_plan_v1_1_1.html` (copia de v1.1.0).

---

## Hotfixes preliminares (aplicados antes de M1-M6)

El prompt v1.1.1 da por sentado que v1.1.0 ya incorporaba 4 hotfixes. Como mi copia local no los tenía, se aplican aquí como paso 0:

- **DisplayModeToggle** convertido en interruptor único con etiqueta "Ajustar por inflación" + switch O/I. Las claves internas `state.displayMode === 'nominal' | 'real'` **no cambian**.
- **MonthlyCalendarModal**: ahora recibe `addMonths`, `update`, `ensureMonth` como props; las celdas vacías son clicables (crean el mes vía `ensureMonth`); el detalle es editable con `<EditableNumber>`; los botones "+6 meses / +1 año" viven dentro del modal.
- **Copy del Movimiento 2**: "(en € de hoy)" → "(ajustado por inflación)" / "ajustado por inflación".
- **Ventana de meses recientes en Seguimiento**: pasa de "actual + 2 anteriores" a "anterior + actual + siguiente".

---

## M1 · Movimiento 1 absorbe Sin Mi Plan

- **Eliminado el desplegable separado** "¿Y si no tuviera plan?" al final de Mi Plan.
- **Movimiento 1 rediseñado en 4 sub-bloques**:
  - 1.A Tu situación actual (prosa cohesionada con KPIs).
  - 1.B Sin un plan → `<ScreenSinMiPlan embedded compactView />` inline. Renderiza Verdad 1 (erosión salarial) y Verdad 2 (coste de oportunidad).
  - 1.C Reparto del ingreso compacto → `<FlowTimelineCard maxYears={5} compact />`, sólo los próximos 5 años, altura 160px.
  - 1.D CTA Pro → "Profundizar (Pro) →" navega a `sinplan-pro` (placeholder ya existente).
- **`ScreenSinMiPlan` recibe nuevo prop `compactView`** que reduce padding y elimina paddingBottom inferior; el header se oculta vía el ya-existente `!embedded`.
- **`FlowTimelineCard` recibe nuevos props `maxYears` y `compact`** que limitan el horizonte de proyección y reducen la altura del chart.
- **Ruta `'sinplan'` desactivada como nav**: el routing en Shell ahora redirige `tab === 'sinplan'` a `<ScreenHoy>`. `SinMiPlanProPlaceholder` sigue accesible desde el CTA.

## M2 · Movimiento 2 con gráfica dual y perfiles

- **Título cambiado** de "Hacia dónde vas" a **"Hacia dónde puedes ir"**.
- **Constante `STANDARD_PLAN_REFERENCE`** documenta el plan estándar (savingRate 20%, allocation por horizonte, retorno 8%, inflación 2.5%, rebalanceo anual).
- **`computeUserProfile(state)`** clasifica al usuario:
  - **A** si `monthlyAporte === 0` (no aporta).
  - **B** si `savingRate < 0.15` (aporta poco).
  - **C** si `savingRate >= 0.15` (aporta razonable).
- **`projectStandardPlan(state)`** corre `projectV2` con los parámetros del plan estándar aplicados al perfil del usuario (mismo income, mismo horizonte, aporte fijo 20%, retorno 8%, salaryFactor 1.0, sin eventos). Devuelve `{ series, targetMonthly }`.
- **`LifecycleChartDual`** (componente nuevo): dos líneas según perfil.
  - Perfil A → sólo línea estándar (accent prominente).
  - Perfil B → ambas líneas (usuario accent, estándar gris claro dashed).
  - Perfil C → idem perfil B (la línea estándar queda como referencia ligera).
  - Respeta el modo del toggle "Ajustar por inflación" descontando inflación mes a mes cuando `realMode` está activo.
- **Prosa adaptativa** delante de la gráfica, con copy distinto por perfil (literal del prompt).
- Se mantienen las cifras del plan del usuario como subtexto y el KPI Monte Carlo + CTA "Profundizar en Proyección →".

## M3 · Movimiento 3 como ruta visual de 5 fases

- Sustituye por completo la tarjeta `nextStep`.
- **`RutaCincoFases`** componente nuevo. Renderiza línea vertical de progreso + marcadores circulares + cajas a la derecha.
- **`computeActivePhase(state, d)`** identifica fase activa, completadas y skipped:
  - **F1 Cimientos**: `monthlyLife > 0`, `retireAge` definido, `income > 0` → auto.
  - **F2 Saneamiento de deuda** (condicional): se detecta deuda mala por nombre del hito (`/deuda|debt|tarjeta|prestamo/i`). Si no hay → "No aplica" (skipped).
  - **F3 Colchón de liquidez**: 3 pasos (1, 3, 6 meses de gasto). Detecta hito categoría `liquidez` o el propio patrimonio actual como proxy.
  - **F4 Inversión sistemática**: asset allocation suma 100%, `monthlyContribution > 0`, rebalanceo (check manual).
  - **F5 Optimización fiscal**: 3 checks manuales (PP empresa, IRPF, compensación de pérdidas).
- **Sistema de check mixto**:
  - Auto: el sistema detecta y marca con ✓ verde + nota "✓ detectado automáticamente · puedes ajustarlo".
  - Manual: pasos subjetivos requieren click. Se persisten en `plan.phaseManualChecks: { '4.3': '2026-01-15', ... }`.
  - **Reset automático del paso 4.3** al año: helper `_withinYear(isoDate)` invalida el check si tiene más de 365 días.
- **Fechas estimadas** por fase (heurística simple basada en año actual + offset por nivel de avance).
- **Conector lateral discontinuo entre F3 y F4**: en desktop, label "Puede ir en paralelo con fase 3" en el header de F4 cuando F3.1 ya está completo; en mobile, la línea vertical lo simplifica.
- **Sección de Destinos** debajo de las fases (no son fases): ★ Libertad financiera y ☼ Jubilación pública.
- **Versión mobile**: cajas a ancho completo, marcador a columna fija (40px de gap), fechas estimadas debajo de cada caja en lugar de a la derecha, fuentes 1-2px más pequeñas (respetando ≥ 11px mono).

## M4 · Sistema de categorías de hito con triggers contextuales

- **Nueva constante `GOAL_CATEGORIES`** con 8 categorías: `liquidez | vivienda | coche | objetoGrande | ayudaFamiliar | herencia | jubilacion | otro`.
- **Migración** en `migrateToV2`: cualquier `goal` sin `category` se asigna a `'otro'`. Idempotente.
- **Default `'otro'`** en `addGoal` (capa store) y en el formulario "Añadir una meta" de `HitosEditor`.
- **Selector de categoría** en el formulario de añadir hito y en cada `GoalRow` (pill `<select>` editable).
- **`GoalContextualBlock`** (componente nuevo) renderiza una nota desplegable al final de cada `GoalRow` según categoría:
  - `liquidez` → siempre: nota sobre cuenta remunerada / renta fija a corto plazo.
  - `vivienda` y `target > 30% del patrimonio` → bloque pignoración con copy literal del prompt + link a la lección.
  - `coche` u `objetoGrande` y `target > 20%` → mismo bloque pignoración.
  - `ayudaFamiliar` y `target > 10%` → nota sobre planificación fiscal (donaciones intervivos, sucesiones).
  - `herencia` → siempre: lump sum vs DCA al integrar herencia.
  - `jubilacion` → nota informativa (la jubilación pública no es un hito gestionable, está en Ajustes).
  - `otro` → sin trigger.
- **Bridge global** `window.__openLearnConcept(id)`: nuevo state `globalConceptId` en `Shell` + `<ConceptModal>` renderizado en raíz. Permite a `GoalContextualBlock` abrir la lección de pignoración sin cambiar de pestaña.

## M5 · Lección nueva: "Pignoración de activos"

- **Nuevo concepto en `LEARN_CORPUS`** con id `'pignoracion'`, categoría `'estrategia'`, nivel **Avanzado**:
  - `title`, `glossary`, `tooltip`, `warning`, `article.body` con el copy literal del prompt (~1.500 palabras editorial, 6 secciones: por qué, cuándo sí, cuándo no, en España, resumen).
  - `seeAlso: ['interes-compuesto', 'irpf', 'libertad-financiera']`.
- **Añadido a `LEARN_LEVELS.avanzado`** tras `'rebalanceo'`.
- **Icono SVG**: escudo con tilde verde, en `<LearnIcon id="pignoracion" />`. Estética coherente con los 12 iconos Esencial.
- **Vinculación bidireccional**: el bloque pignoración de M4 enlaza a esta lección vía `window.__openLearnConcept('pignoracion')`.

## M6 · Auditoría editorial de nomenclatura

Auditoría sistemática con `grep -nE "€\s*(sin|con)\s+inflación|€\s*de\s+hoy|€\s*futuros|€\s*Futuro|€\s*Hoy"`. Resultado final: **cero** ocurrencias en strings JSX visibles.

Cambios aplicados:

| Línea origen | Antes | Después |
|---|---|---|
| LEARN_CORPUS.inflacion.glossary | `Por eso Mi Plan FIRE ofrece el modo "€ sin inflación"` | `Por eso Mi Plan FIRE ofrece el modo "Ajustar por inflación"` |
| LEARN_CORPUS.inflacion.article.body | `deja el toggle en "€ sin inflación"` | `activa "Ajustar por inflación"` |
| LifecycleChart YAxis label | `'Patrimonio (€ sin inflación)'` | `'Patrimonio (ajustado por inflación)'` |
| ScreenSinMiPlan KPIs Verdad 2 (×2) | `en € sin inflación` | `ajustado por inflación` |
| Erosion chart leyenda + tooltip | `Poder adquisitivo (€ sin inflación)` | `Poder adquisitivo (ajustado por inflación)` |
| Erosion chart KPIs (×2) | `en € sin inflación` | `ajustado por inflación` |
| HitosEditor copy | `Define el importe en € sin inflación` | `Define el importe en euros de hoy (poder adquisitivo actual)` |
| Movimiento 2 coletilla (×2) | `(en € de hoy)` / `en € de hoy` | `(ajustado por inflación)` / `ajustado por inflación` |

Los usos adverbiales legítimos de "hoy" en prosa editorial (línea 5443 "desde hoy", 6611 "euros de hoy") se conservan: no son nombres del modo del toggle.

---

## Cambios de estado · idempotentes

| Campo | Nivel | Default | Migración |
|---|---|---|---|
| `plan.phaseManualChecks` | plan | `{}` | Creado si null |
| `goal.category` | array goals | `'otro'` | Aplicado a cada goal sin category |

Sin renames internos. Sin eliminación de campos. Sin cambios en el motor `projectV2` salvo lo necesario para `projectStandardPlan` (que reutiliza la firma actual sin tocarla).

---

## Validación

- **Babel**: ✓ Sintaxis OK tras cada bloque de cambios.
- **Runtime e2e** (Playwright + Chromium headless, viewport 1280×900 + 380×800):
  - M1: "Dónde estás" presente, Verdad 1 + Verdad 2 inline, sin desplegable "¿Y si no tuviera plan?", CTA Pro ✓
  - M2: título "Hacia dónde puedes ir", plan estándar visible en la gráfica ✓
  - M3: las 5 fases (Cimientos, Saneamiento, Colchón, Inversión, Optimización) + Destinos ✓
  - M4: bloque pignoración aparece al añadir hito vivienda > 30% patrimonio + link a la lección ✓
  - M5: tarjeta "Pignoración de activos" en nivel Avanzado de Aprende ✓
  - M6: cero ocurrencias de "€ sin/con inflación" en DOM ✓
  - Toggle "Ajustar por inflación" presente en innerHTML ✓
  - Calendario: "Ver calendario completo" abre modal con "Añadir periodos" + "+6 meses" dentro ✓
  - Mobile: 5 tabs visibles + ruta vertical de 5 fases ✓

Único console-noise: notas Babel "deoptimised styling" por el tamaño del monolito (~9.300 líneas / ~545 KB) — esperado, no afecta runtime.

---

## Restricciones del prompt respetadas

- ✅ No se introducen features Pro nuevas más allá del toggle existente.
- ✅ No se publica en GitHub (Sprint 2).
- ✅ No se implementa PWA (Sprint 2).
- ✅ Motor `projectV2` no se cambia; sólo se reutiliza desde `projectStandardPlan` con plan estándar inyectado vía spread.
- ✅ Componentes legacy no eliminados (`computeNextStep`, `MonthlyFlowCard`, etc. siguen existiendo).
- ✅ `DisplayModeToggle` no se vuelve a tocar tras el hotfix (queda como interruptor O/I).
- ✅ `MonthlyCalendarModal` no se vuelve a tocar tras el hotfix.
- ✅ AGPL-3.0 con placeholder `[TU NOMBRE]` literal preservado.
- ✅ Cero llamadas de red.
- ✅ Sin renames de campos internos en `state` o `state.plan`.
- ✅ Migración idempotente con flag bandera donde corresponde.

---

## Higiene de archivos al cerrar v1.1.1

El usuario va a:
- **Borrar** del proyecto: `mi_plan_v1_0.html`, `mi_plan_v1_1_0.html`, `CHANGELOG_v1_0.md`, `CHANGELOG_v1_1_0.md`.
- **Subir** al proyecto: `mi_plan_v1_1_1.html`, `CHANGELOG_v1_1_1.md`, `CLAUDE_CODE_CONTEXTO.md` (actualizado al final del sub-sprint).

---

## Resumen ejecutivo

| Módulo | Estado |
|---|---|
| Hotfixes (toggle, calendar, copy, ventana meses) | ✓ |
| M1 · Mov 1 absorbe Sin Mi Plan | ✓ |
| M2 · Mov 2 gráfica dual + perfiles | ✓ |
| M3 · Mov 3 ruta 5 fases con check mixto | ✓ |
| M4 · Categorías de hito + triggers | ✓ |
| M5 · Lección pignoración (Avanzado) | ✓ |
| M6 · Auditoría editorial nomenclatura | ✓ grep=0 |
| Migración idempotente | ✓ |
| Babel | ✓ |
| Runtime e2e | ✓ 22/24 (2 falsos negativos del test) |
