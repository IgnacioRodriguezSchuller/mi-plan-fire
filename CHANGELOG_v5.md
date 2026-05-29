# CHANGELOG mi_plan_v5.html

Trabajo derivado de `mi_plan_v4.html` (con el hotfix de Rules of Hooks ya aplicado).
Una línea por cambio significativo.

## Prompt 2 — Evolución de producto: pantalla "Antes de Mi Plan"

### Decisiones de hitos (autonomía total aprobada)
- **HITO 1 · Wireframes / nav**: aprobados tal cual los presenté. Sin cambios.
- **HITO 2 · Integración técnica**: `projectV2` recibe `effectiveReturn` opcional. Se modela con tracking interno separado de "legacy portfolio" (capital inicial al `effectiveReturn`) y "new portfolio" (aportes futuros al `plan.annualReturn`). Refleja la realidad: tu cuenta corriente sigue al 0% aunque añadas dinero nuevo a un fondo indexado. Si `effectiveReturn` es `null/undefined` o coincide con el rate del plan, comportamiento idéntico al de v4. Los gastos declarados sustituyen `monthlyLife = income − investment` en `FinancialHealthCard` y en `useDerived` para el cálculo de fiTarget. La hipoteca **no** se suma a gastos (ya está implícita en `expenses.housing`).
- **HITO 3 · Nav final**: ícono **⌖**, label **"Sin Mi Plan"** (corto, claro en nav), título de pantalla "Antes de Mi Plan". Posición: entre Hoy y Mes a mes.

### Estado · migración y modelo
- `emptyState()`: añadido `plan.actualLife` con defaults (completed=false, expenses ceros, mortgage disabled, allocation ceros). No activa nada, sigue la convención "no activar nada por defecto".
- `migrateToV2`: añadido upsert idempotente del campo `actualLife` para usuarios existentes con state v4. Si ya existe, no se toca (respeta la elección del usuario).
- `finish()` del Onboarding principal: ahora incluye `actualLife: data.actualLife || defaults` en el `update`, preservando lo que el usuario haya rellenado en el paso 8.

### Motor de proyección
- `projectV2`: nueva opción `effectiveReturn`. Cuando se proporciona y difiere de `plan.annualReturn`, internamente lleva dos sub-portfolios — `legacy` (capital inicial compuesto al `effectiveReturn`) y `new` (aportes mensuales + eventos al `plan.annualReturn`). Si no se proporciona, comportamiento idéntico al de v4. El campo `aportado` cumulativo del row no cambia.
- `computeCurrentPortfolio`: misma extensión `opts.effectiveReturn`. Mismo tracking dual para reconstrucción histórica del patrimonio actual.
- `useDerived`: calcula `effectiveReturn = computeEffectiveCapitalReturn(plan)` y lo propaga a todas las llamadas de `projectV2` y `computeCurrentPortfolio` (incluyendo `seriesPlanFromStart`, `seriesRealFromStart`, `seriesActualPace`, `seriesPlanWithHypo`, `seriesSandbox`). En modo sandbox se calcula el `sandboxEffReturn` por separado. Si `actualLife.completed === false`, devuelve `null` y el motor sigue al rate del plan (back-compat).
- `useDerived`: el `monthlyLifeNow` que alimenta el `fiTarget` ahora usa `sumExpenses(actualLife)` cuando `actualLife.completed`. Si no, fallback al derivado `income − investment` legacy.
- `useDerived`: nuevo retorno `effectiveReturn` y `usingDeclaredExpenses` para que las cards puedan diferenciar el caso.

### Helpers nuevos
- `sumExpenses(actualLife)`: suma de gastos declarados.
- `sumAllocation(actualLife)`: suma de la distribución (debe ser 100 para validar).
- `computeEffectiveCapitalReturn(plan)`: media ponderada del retorno del capital según `allocation`. Las categorías con `customReturns[k] != null` usan ese valor; las demás caen al defecto (cash=0, deposits=2, fundsEtfs y pensionPlan = plan.annualReturn, other=0). Devuelve `null` si actualLife no está completo.
- `buildMortgageSchedule(mortgage)`: tabla francesa anual (principal + intereses + balance por año). Soporta tipo fijo y variable (euribor + spread). Devuelve `[]` si la hipoteca no está activa.

### UI · `ActualLifeOnboarding` (modal de 4 pasos)
- Modal a pantalla completa, z-index 1100, fontFamily T.serif, maxWidth 640. Cierre con ESC, click fuera o botón ×.
- Reutilizable: prop `overridePlan` permite pasar un plan-mock cuando se invoca desde el onboarding principal (antes de que el plan real esté en el store). Si no, lee `state.plan`.
- Prop `onComplete(payload)`: el caller decide qué hacer con el payload (mutatePlan en `ScreenSinMiPlan`, o `set('actualLife', payload)` en el onboarding principal). Si no se pasa, fallback automático a `mutatePlan`.
- Paso 1 · Gastos: 5 categorías con `EditableNumber` + chips. Total live y warning amber si gastos+inversión > ingreso.
- Paso 2 · Hipoteca: toggle sí/no. Si sí: importe, plazo, año inicio, tipo fijo/variable, tipo o (euribor + spread). Mensaje aclaratorio sobre la cuota ya estando en "Vivienda".
- Paso 3 · Distribución: 5 sliders (cash, deposits, fundsEtfs, pensionPlan, other) con `EditableNumber` + range. Cada categoría con custom-return editable inline. Validación de suma 100%. Preview en vivo del retorno ponderado.
- Paso 4 · Confirmación: resumen + impacto en el plan (gasto anual para regla del 4%, retorno efectivo del capital, vista completa desbloqueada).

### UI · `ScreenSinMiPlan` (pantalla principal)
- Header editorial con título "Tu situación si no haces nada".
- **Verdad 1 · La erosión del salario**: gráfico LineChart con dos series (salario nominal al 1%/año dashed, poder adquisitivo real solid accent). Cifra grande de pérdida acumulada en rojo. Calculado con `inflationRate` configurable desde Ajustes.
- **Verdad 2 · El coste de oportunidad**: gráfico con dos series (dinero parado en CC vs invertido al plan return, ambas en términos reales). Dos cifras enfrentadas (sin Mi Plan / con Mi Plan) + diferencia.
- **CTA**: cuando `actualLife.completed === false`, una card amber-soft con el botón "Descubre más sobre tu situación actual →" que abre el modal.
- **Verdad 3 · Coste real del día a día** (vista completa): desglose vertical del salario en barras horizontales con porcentaje. Categoría "Sobrante sin destino" en amber dashed. Mensaje de conversión: "Esos X € sin destino pueden convertirse en Y € en N años…". Warning si overspending.
- **Verdad 4 · Coste oculto de la hipoteca** (vista completa, solo si `mortgage.enabled`): BarChart apilado con capital amortizado (accent) e intereses (amber) año a año. Cifra grande de intereses totales en T.amber + porcentaje sobre principal. Si tipo variable, indica "Asumiendo tipo actual del X%, sujeto a revisión".
- **Verdad 5 · Dónde está tu dinero hoy** (vista completa): barras horizontales por categoría con color por umbral (<1% rojo, 1-3% amber, >3% verde). Importe absoluto y rentabilidad real (nominal − inflación). Frase final con retorno medio ponderado y "si moviéramos X a inversión, subiría a Y%".
- Footer: botón "Editar mis datos →" que re-abre el modal en modo edición (lee los valores actuales).

### Onboarding principal · nuevo paso 8
- Estructura del onboarding: 9 pasos (7 de configuración + espejo nuevo + recap), antes 8. La barra de progreso, etiqueta `Paso X de Y` y validaciones de avance se reescalan automáticamente porque usan `steps.length`.
- Nuevo paso 8 (espejo): título "Antes de soltarte: tu situación si no haces nada." Muestra Verdad 1 y Verdad 2 calculadas inline con los datos del formulario (`data.income`, `data.capital`, `data.savingPercent`/`data.monthly`, `data.annualReturn`, etc.). Sin gráfico para no sobrecargar el paso; solo las cifras clave.
- Dos botones inferiores: "Siguiente →" (salta al recap) o "Descubre más sobre tu situación actual →" que abre el `ActualLifeOnboarding` modal por encima del onboarding usando `overridePlan` derivado del `livePlan` ya existente.
- Si el usuario completa el mini-onboarding desde el paso 8, el CTA cambia a "✓ Datos añadidos · Editar" y el payload queda en `data.actualLife` listo para que `finish()` lo persista.
- El recap (ahora paso 9) se mantiene exactamente como estaba en v4.

### Navegación
- Nueva tab en mobile y desktop: `{ id: 'sinplan', label: 'Sin Mi Plan', symbol: '⌖' }`, insertada entre Hoy y Mes a mes en ambos shells. La nav de mobile mantiene los 7 items en línea (era 6); se sigue viendo bien en viewport estrecho gracias al `flex: 1` por tab.

### Verificación
- Sintaxis Babel: OK tras cada bloque significativo.
- Runtime Playwright + Chromium headless con todas las deps locales:
  - Onboarding completo (9 pasos) → dashboard, sin errores.
  - Paso 8: muestra Verdad 1 y 2, CTA visible, "Siguiente" salta al recap.
  - Modal desde paso 8: abre, cierra con ESC y con ×, retorna al onboarding sin errores.
  - Tab "Sin Mi Plan" en el dashboard: vista mínima visible con CTA cuando `completed=false`; vista completa con Verdad 3, 4, 5 cuando `completed=true`.
  - Mini-onboarding completo desde el dashboard: avanza por los 4 pasos, persiste vía `mutatePlan`, sobrevive al reload (localStorage).
  - Backward-compat: usuario sin `actualLife` ve vista mínima, NO ve Verdad 3-5. Las 6 pantallas existentes (Hoy, Mes a mes, Proyección, Plan, Aprende, Ajustes) cargan sin errores.
  - El `effectiveReturn` se aplica: tras completar el mini-onboarding con 100% en cash, la proyección "a los 60" baja de 725k€ a 653k€ (refleja que el capital inicial ya no rinde 8%).
  - Cero `pageerror`, cero errores en consola.
