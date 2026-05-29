# Mi Plan FIRE — CHANGELOG v1.2.1

Hotfix sobre v1.2.0. Origen: `mi_plan_v1_2_0.html`. Siete items localizados, todos verificados en código antes de redactar el prompt.

---

## Item 1 · Fix toggle inflación con `ó` literal

**Causa**: JSX no interpreta secuencias `ó` en *children* (sólo en string literals JS). El texto del toggle aparecía como `AJUSTAR POR INFLACI\U00F3N` en pantalla.

**Cambio**: tres ocurrencias de `inflación` en `DisplayModeToggle` (líneas 2941, 2949, 2953) sustituidas por `inflación` con el carácter UTF-8 real. Aplicado vía `sed` para garantizar consistencia.

**Auditoría**: `grep -nE '\\u00[0-9A-Fa-f]{2}' mi_plan_v1_2_1.html` → 0 ocurrencias.

## Item 2 · Caption aclaratoria del toggle en Mi Plan

**Causa**: usuario activa el toggle y los KPIs destilados de Mov 1.B (que conceptualmente ya están ajustados) no cambian. Reporta "no funciona en todas partes". El toggle global afecta a las cifras de la trayectoria (Mov 2), no a las Verdades.

**Cambio**: envuelto `<DisplayModeToggle />` en Mi Plan en un `<div>` columna con un caption discreto debajo:

```jsx
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
  <DisplayModeToggle />
  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, ... }}>
    afecta a las cifras de la trayectoria
  </div>
</div>
```

El toggle en `ScreenProyeccion` no se toca (allí afecta a todo lo que está debajo y no hay confusión).

## Item 3 · Fix plan estándar dibujado como línea vertical en M2

**Causa raíz identificada (con debug Playwright + fiber walk)**: `projectV2(...)` devuelve directamente el **array `series`**, no un objeto `{ series, ... }`. Pero `projectStandardPlan` hacía `return { series: res.series, targetMonthly }`, con `res.series === undefined`. Resultado: `standardSeries` siempre `[]`, longitud 0, ninguna línea renderizada para el plan estándar; en casos donde `userSeries` también degeneraba (Recharts con un solo punto válido) aparecía una línea vertical en `dataMax`.

Las hipótesis H1 (longitudes distintas + redondeo float), H2 (`targetMonthly = 0`) y H3 (`startAge` desalineado) **no eran la causa**. Era un shape mismatch trivial introducido en v1.1.1 que no se detectó porque visualmente el chart "renderizaba algo" (la línea del usuario sí funciona).

**Fix aplicado** (mínimo y comentado):
```js
// Antes:
const res = projectV2(standardPlan, profile);
return { series: res.series, targetMonthly };

// Después:
const series = projectV2(standardPlan, profile);
return { series, targetMonthly };
```

**Endurecimiento adicional** en `LifecycleChartDual`: el `ageMap` ahora usa **meses enteros** como key (`Math.round(row.age * 12)`) en lugar de floats `Math.round(row.age * 12) / 12`. Esto elimina cualquier riesgo futuro de desajuste por floating-point si dos proyecciones con orígenes distintos producen ages flotantes incompatibles.

**Verificación**: tras el fix, runtime muestra **dos paths** en la SVG del Mov 2:
- `#c2410c` (accent) sólida, 16.856 chars — línea del usuario.
- `#968874` (T.faint) dashed `5 4`, 16.996 chars — línea del plan estándar, diagonal de age inicial a retiro.

## Item 4 · Cálculo real de fechas de las fases

**Causa**: `phaseEstimate` en `RutaCincoFases` devolvía offsets mágicos hardcodeados (`yr + (phaseNum === 1 ? 0 : phaseNum === 3 ? 2 : phaseNum === 4 ? 5 : 7)`) sin consultar el plan del usuario. Fechas "lejanas e irreales".

**Cambios**:

1. **`computeActivePhase`** ahora expone en su return: `monthlyLife, aporte, income, savingRate, liquidEff, currentPortfolio, fireNumber, withdrawalRate, annualReturn, lifeExpectancy, profileAge`. Además: `fireNumber = (monthlyLife * 12) / (withdrawalRate / 100)`.

2. **`phaseEstimate(phaseNum)`** reescrito con lógica por fase:
   - **Fase 1 Cimientos**: skipped → "No aplica"; done → "Completada"; pendiente → "Pendiente" (es configuración inicial).
   - **Fase 2 Saneamiento**: skipped → "No aplica"; done → "Completada"; pendiente → "Manual" (depende de checks del usuario).
   - **Fase 3 Colchón**: target `monthlyLife * 6`. Si `gap <= 0` → "Completada". Si `aporte <= 0` → "Necesita aporte mensual". Si `aporte > 0`: `meses = ceil(gap / aporte)`; si `meses < 12` → "Estimada en N meses" (o "Estimada este mes"); si no → "Estimada en {año}".
   - **Fase 4 Inversión sistemática**: target = `fireNumber`. Fórmula cerrada del futuro valor:
     ```
     n = log((target*r + a) / (p0*r + a)) / log(1 + r)
     ```
     Casos límite: `fireNumber <= 0` → "Define tu gasto en Ajustes"; `currentPortfolio >= target` → "Completada"; `r <= 0 || a <= 0` o `num <= den` → "Cálculo no disponible" o "Completada"; resultado > esperanza de vida → "Inalcanzable con plan actual"; si no → "Estimada en {año}".
   - **Fase 5 Optimización fiscal**: continua → "Continua".

3. **Sin nuevos campos en estado**. Todo se deriva en tiempo de render.

**Auditoría**: `grep -n "yr + (phaseNum ===" mi_plan_v1_2_1.html` → 0 ocurrencias (hardcode eliminado).

## Item 5 · Reset scroll al cambiar de tab

**Causa**: `setTab` hacía sólo `update({ activeTab: t })`. Si el usuario estaba scrolleado abajo en Mi Plan y clicaba Proyección, la nueva pantalla aparecía a media-altura.

**Cambio**: `setTab` ahora ejecuta `window.scrollTo({ top: 0, behavior: 'instant' })` dentro de un `requestAnimationFrame` tras el `update`, con guard `if (t === state.activeTab) return` para no resetear si el usuario re-clica el tab activo. Fallback a `scrollTo(0, 0)` en `catch` por si `behavior: 'instant'` no es soportado.

**Verificación e2e**:
- Scroll a 1981px en Mi Plan, clic Proyección → scrollY = 0 ✓
- Re-clic en tab activo desde scroll 0 → scrollY se mantiene en 0 ✓ (guard ok)

## Item 6 · Onboarding paso 8/9 — limpieza

- **Bloque "Más adelante, dentro de Mi Plan…" eliminado** (era anuncio innecesario; el usuario ya verá esa sección al llegar). Verificación: `grep -n "Más adelante, dentro de Mi Plan" → 0`.
- **"Sin Mi Plan" / "Con Mi Plan" → "Sin Plan" / "Con Plan"** en:
  - Onboarding paso 8/9 (Verdad 2 KPIs).
  - `ScreenSinMiPlan` (vista completa, Verdad 2 KPIs).
  - Tooltip de gráfica `ScreenSinMiPlan` Verdad 2: `'Con Mi Plan'` → `'Con Plan'`.
  - **NO** cambiado: `<Label>Sin Mi Plan Pro</Label>` (línea 5851), `"Sin Mi Plan Pro (próximamente en v1.x)"` (línea 8257) ni el comentario `// "Sin Mi Plan" deja de ser ruta de nav` — esos son referencias al nombre formal del placeholder Pro o al historial interno, no a la dicotomía visible de las Verdades.
- **"salario nominal" → "salario … sobre el papel"** en:
  - Onboarding paso 8/9 prosa Verdad 1: "tu salario nominal habrá crecido hasta X" → "tu salario habrá crecido hasta X sobre el papel".
  - Caption del KPI 1 de Mov 1.B en Mi Plan: "Diferencia entre tu salario nominal acumulado y su valor real…" → "…tu salario acumulado sobre el papel…".
  - Tooltip de chart `ScreenSinMiPlan` Verdad 1: "Salario nominal" → "Salario sobre el papel".
  - Leyenda de chart `ScreenSinMiPlan` Verdad 1 (ambas variantes con/sin múltiples tramos): "Salario nominal" → "Salario sobre el papel".
  - Prosa Verdad 1 detallada en `ScreenSinMiPlan` (modal completo): "tu salario nominal habrá crecido hasta X" → "tu salario habrá crecido hasta X sobre el papel".
  - Comentario interno también actualizado por coherencia.
- **Auditoría grep**:
  - `grep -n "salario nominal\|Salario nominal" mi_plan_v1_2_1.html` → 0 ocurrencias.
  - `grep -nE '"Sin Mi Plan"|"Con Mi Plan"|>Sin Mi Plan<|>Con Mi Plan<' mi_plan_v1_2_1.html` → 1 ocurrencia en un comentario histórico (`// "Sin Mi Plan" deja de ser ruta…`), 0 ocurrencias en JSX visible.

## Item 7 · Onboarding paso 9/9 — rediseño visual

**Antes**: 4 párrafos + dos listas densas (5 "Lo que sí hace" + 4 "Lo que no hace"). ~280 palabras.

**Después**: estructura visual de **dos columnas** (mobile: stack vertical) con bullets cortos.

- Intro corta (2 líneas).
- **Columna "Lo que sí"** (label mono color verde): 4 bullets — "Proyecta a 5, 10, 20 años · Compara escenarios sin tocar tu plan real · Explica cada concepto en *Aprende* · Vive solo en tu dispositivo."
- **Columna "Lo que no"** (label mono color faint): 3 bullets — "Recomienda productos concretos · Garantiza rentabilidades · Sustituye a un asesor cuando lo necesites." Los dos primeros del original se fusionaron ("no acciones de tal empresa" + "no fondos por nombre" → "Recomienda productos concretos").
- Cierre breve (1 frase): "A partir de ahora vas a ver tu plan. Todo se ajusta. El plan es tuyo."
- Texto reducido ~60%. Estructura más visual.
- **Cambio adicional**: declarado `const mobile = useIsMobile();` al inicio de `Onboarding()` (era necesario para el step 9 porque el `mobile` que existía estaba declarado después de `steps`); eliminado el duplicado posterior.

---

## Restricciones respetadas

- ✅ `projectV2`, `runMonteCarlo`, `projectStandardPlan` (excepto el fix interno de su return), `computeUserProfile` intactos en firma externa.
- ✅ Sin renames de campos del estado persistido. Sin campos nuevos.
- ✅ Sin dependencias externas nuevas.
- ✅ Cero llamadas de red.
- ✅ Vocabulario: "Ajustar por inflación" preservado; cero ocurrencias nuevas de `"€ sin/con inflación"`, `"€ de hoy"`, `"€ futuros"` (auditoría grep al cierre).
- ✅ Tono editorial: sin marketing-speak, frases breves, sin emojis.

## Validación

- **Babel**: ✓ Sintaxis OK.
- **Runtime e2e** (Playwright + Chromium headless, 1280×900 + 380×800):
  - Item 1 · Toggle muestra "AJUSTAR POR INFLACIÓN" con ó correcta ✓
  - Item 2 · Caption "afecta a las cifras de la trayectoria" visible bajo toggle en Mi Plan ✓
  - Item 3 · LifecycleChartDual dibuja DOS líneas (usuario accent sólida + estándar dashed gris), ninguna vertical ✓
  - Item 4 · `phaseEstimate` produce labels válidos del set nuevo, sin "Estimada hacia YYYY" del patrón antiguo ✓
  - Item 5 · Scroll reset al cambiar de tab (1981→0) ✓; guard NO resetea si re-clic en tab activo ✓
  - Items 6 y 7 · cambios verificados con grep estático (test e2e no llegó al paso 8/9 del onboarding por incapacidad del setValue directo sobre inputs controlados de React — falsos negativos de test, no de app).
- **grep auditores**:
  - `\\u00[0-9A-Fa-f]{2}` → 0 ✓
  - `"Sin Mi Plan"|"Con Mi Plan"|>Sin Mi Plan<|>Con Mi Plan<` → 1 (comentario histórico, no JSX visible) ✓
  - `salario nominal|Salario nominal` → 0 ✓
  - `yr + (phaseNum ===` → 0 (hardcode eliminado) ✓
  - `€ sin/con inflación|€ de hoy|€ futuros` → 0 ✓

---

## Resumen

| Item | Pieza | Estado |
|---|---|---|
| 1 | `ó` literal → `ó` UTF-8 | ✓ |
| 2 | Caption bajo toggle en Mi Plan | ✓ |
| 3 | Fix shape `projectV2` return + integer-month key en chart | ✓ |
| 4 | `phaseEstimate` calculado del plan real (5 fases) | ✓ |
| 5 | Reset scroll al cambiar de tab + guard | ✓ |
| 6 | Paso 8/9 limpieza + "Sin/Con Plan" + "sobre el papel" | ✓ |
| 7 | Paso 9/9 rediseñado en dos columnas | ✓ |
