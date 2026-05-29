# Mi Plan FIRE — CHANGELOG v1.2.0

Sub-sprint **v1.2.0** · adelgazar Mi Plan. Origen: `mi_plan_v1_1_1.html`.

Tres cambios localizados en `ScreenHoy`. Cero cambios al motor de proyección, a otras pantallas, al sistema de hitos o a Aprende.

---

## A · Compactar Movimiento 1.B

- **Sustituido `<ScreenSinMiPlan embedded compactView />` inline** por dos KPIs destilados + CTA modal. El sub-bloque 1.B pasaba de 2.000-4.000 px de scroll (Verdad 1 + Verdad 2 con dos gráficas Recharts, y Verdad 3/4/5 si había `ActualLifeOnboarding`) a dos cards lado a lado + un botón.
- **KPI 1 · Poder adquisitivo perdido**: cifra `−{lost}` en `T.red`, label `Poder adquisitivo perdido en {N} años`, caption explicando que es la diferencia entre salario nominal acumulado y su valor real ajustado por inflación.
- **KPI 2 · Lo que dejarías de tener si no inviertes**: cifra `oppDifference` en `T.accent`, label `Lo que dejarías de tener si no inviertes`, caption con el `{planReturn}%` del usuario.
- **CTA `Ver el cálculo completo →`** abre el modal nuevo `SinMiPlanModal`.
- **Componente nuevo `SinMiPlanModal`**: patrón overlay + escape-key handler + `document.body.style.overflow` lock idéntico a `WhyDifferentModal`. `maxWidth: 920` (más ancho que Why porque contiene gráficas Recharts). Contenido interior: `<ScreenSinMiPlan embedded />` (vista completa con todas las Verdades).
- **Función pura `computeSinPlanKPIs(plan, profile)`**: devuelve `{ lost, oppDifference, yearsToRetire, planReturn, hasData }`. Vive justo antes de `SinMiPlanModal` y `ScreenHoy`.
  - **Vía elegida**: alternativa minimalista (no extraer los `useMemo` internos de `ScreenSinMiPlan`). Razón: `ScreenSinMiPlan` tiene `salaryGrowthAnnual` como estado local editable por el usuario vía slider; en los KPIs del Mov 1.B queremos un valor de referencia conservador y estable. Acoplar los dos cómputos exigiría exponer/levantar ese estado o introducir un parámetro adicional. La duplicación es ~30 líneas, pura, sin dependencias del estado local del modal, y se itera con `for` mes a mes idéntico al original. Documentado en el comentario de cabecera de la función.
  - Uso de `salaryGrowthAnnual = 1.0` (default = "salario sube al ritmo del IPC") como referencia para los KPIs destilados. El usuario puede explorar otros valores abriendo el modal y usando el slider que vive dentro.
- **Prop `compactView` eliminado** de la firma de `ScreenSinMiPlan` y de la lógica condicional `sectionStyle`. Eliminado también el comentario de cabecera que lo describía. Era la única llamada que lo usaba.

## B · Eliminar Monte Carlo del Movimiento 2

- **Eliminado el `useEffect`** que corría `runMonteCarlo(plan, profile, { trials: 200, ... })` en background dentro de `ScreenHoy`. Eliminado el `useState` `basicMC`/`setBasicMC` y las variables derivadas `successPct`, `successColor`.
- **Eliminado el bloque visual** del Monte Carlo (la caja con el porcentaje grande sobre fondo de color verde/ámbar/rojo + caption "200 simulaciones con volatilidad histórica").
- **Sustituido por un cierre minimalista**: un CTA `Profundizar en Proyección →` alineado a la derecha, sin prosa adicional, sin caption, sin KPI. La pantalla está pidiendo aire.
- **`runMonteCarlo` intacto**: sigue usándose en `MonteCarloCard` de Proyección. No tocada.
- Auditoría grep tras el cambio: `grep -nE "basicMC|compactView"` → 0 ocurrencias en todo el archivo. `successPct`/`successColor` siguen apareciendo legítimamente dentro de `MonteCarloCard` (Proyección), no en `ScreenHoy`.

## C · Jerarquía visual de los tres movimientos

- **Encabezados elevados de eyebrows a headers narrativos**. Antes los tres bloques 1/2/3 se anunciaban con un `<div>` mono 11px color `T.faint` ("1 · DÓNDE ESTÁS"). Ahora se anuncian con un `<h2>` display Fraunces, `clamp(24px, 3vw, 32px)`, color `T.ink`, precedido por la numeración `01`/`02`/`03` en mono 13px color `T.faint` y separados con `borderBottom: 1px solid T.line` y `paddingBottom: 12px`.
- **Copies actualizados**:
  - `01 · Dónde estás`
  - `02 · Hacia dónde puedes ir`
  - `03 · Tu ruta`
- **Jerarquía respetada**: el título "Hola, {nombre}" mantiene su `clamp(28px, 4vw, 44px)`, claramente más grande que el `clamp(24px, 3vw, 32px)` de los movimientos. El título sigue siendo el elemento dominante de la pantalla.
- **Sin nuevo componente**: el patrón se inlinea tres veces. La idea era introducir un componente sólo si aparecía un cuarto uso en este sprint; no aparece.

---

## Restricciones respetadas

- ✅ `RutaCincoFases` no modificada (sólo cambia su encabezado, ver C).
- ✅ `ScreenProyeccion`, `ScreenSeguimiento`, `ScreenAprende`, `ScreenAjustes`, `Onboarding`, `Landing*` intocadas.
- ✅ Sin renames de campos del estado persistido. Sin nuevos campos en estado.
- ✅ Sin dependencias externas nuevas.
- ✅ `projectV2`, `runMonteCarlo`, `projectStandardPlan`, `computeUserProfile` intactos.
- ✅ Cero llamadas de red.
- ✅ Vocabulario: "Ajustar por inflación" preservado en captions. Cero ocurrencias nuevas de `"€ sin/con inflación"`, `"€ de hoy"`, `"€ futuros"`.
- ✅ Tono editorial: sin marketing-speak, frases breves, sin emojis.

## Validación

- **Babel**: ✓ Sintaxis OK tras todos los cambios.
- **Runtime e2e** (Playwright + Chromium headless, viewport 1280×900 + 380×800):
  - C · Headers narrativos: tres `<h2>` con "Dónde estás", "Hacia dónde puedes ir", "Tu ruta" en ambos viewports ✓
  - C · Numeración `01`/`02`/`03` presente ✓
  - A · Dos KPIs ("Poder adquisitivo perdido", "Lo que dejarías de tener si no inviertes") + CTA "Ver el cálculo completo →" ✓
  - A · Verdad 1/2 no se renderizan inline en Mi Plan (solo en el modal) ✓
  - A · Modal abre con clic, muestra el header "Tu situación si no haces nada", contiene Verdad 1 + Verdad 2 ✓
  - A · Modal se cierra con tecla Escape ✓
  - A · Modal se cierra con clic fuera (verificado por `dispatchEvent` sobre el overlay; mismo patrón overlay+stopPropagation que `WhyDifferentModal`). Test de `page.mouse.click()` da un falso negativo por hit-testing de Playwright con scrollers anidados — no es bug de la app.
  - B · NO "Probabilidad de éxito · simulación rápida" en Mi Plan ✓
  - B · NO badge "éxito" en Mi Plan ✓
  - B · CTA "Profundizar en Proyección →" sí presente ✓
  - Regresión · Proyección sigue mostrando `MonteCarloCard` con "Probabilidad de éxito" ✓
- **grep auditores**:
  - `grep -nE "€\s*(sin|con)\s+inflación|€\s*de\s+hoy|€\s*futuros"` → 0 ocurrencias ✓
  - `grep -nE "basicMC|compactView"` → 0 ocurrencias ✓
  - `successPct`/`successColor` quedan en `MonteCarloCard` (Proyección) como uso legítimo intocado ✓
  - `grep -n "ScreenSinMiPlan"`: declaración + 1 llamada en `SinMiPlanModal` (vista completa) + comentarios. Sin llamadas sueltas.

---

## Resumen

| Cambio | Pieza | Estado |
|---|---|---|
| A | Mov 1.B compactado: 2 KPIs + modal | ✓ |
| A | `SinMiPlanModal` (overlay+escape+body-lock, maxWidth 920) | ✓ |
| A | `computeSinPlanKPIs` pure function | ✓ |
| A | Prop `compactView` eliminado | ✓ |
| B | `useEffect` `runMonteCarlo` + estado `basicMC` eliminados | ✓ |
| B | Bloque MC visual sustituido por CTA minimalista | ✓ |
| C | Headers `01`/`02`/`03` + display Fraunces + borderBottom | ✓ |
| Validación | Babel + e2e + grep auditores | ✓ |
