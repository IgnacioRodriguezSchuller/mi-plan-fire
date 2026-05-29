# CHANGELOG mi_plan_v5_9.html

Derivado de `mi_plan_v5_8.html`. Una línea por cambio significativo.

## Sprint v1.0 · Sub-prompt D · Rediseño narrativo de Mi Plan + Sin Mi Plan integrado + Supuestos editables

### D1 · Mi Plan reescrita como narrativa de tres movimientos
- `ScreenHoy` completamente reescrita. Header ligero con saludo y `DisplayModeToggle`.
- **Movimiento 1 · Dónde estás**: una sola frase prosa cohesionada con KPIs incrustados (patrimonio, salario, gasto, ahorro, % saving rate) + frase de horizonte. Cero cards individuales por KPI.
- **Movimiento 2 · Hacia dónde vas**: prosa con asunciones inline (`{planReturn}% anual`, `{withdrawalRate}%`), patrimonio nominal vs real, retiro mensual equivalente, juicio de suficiencia (`Viable con margen` / `Viable, justo` / `No llega`). Bloque inferior con KPI grande del % de éxito Monte Carlo + CTA `Profundizar en Proyección →`.
- **Movimiento 3 · Siguiente paso**: card con `borderLeft: 3px solid T.accent`. Contenido decidido por el rule engine `computeNextStep(state, d)` (5 reglas en orden de prioridad: colchón de liquidez, DCA, tasa de ahorro <15%, allocation conservadora con horizonte largo, fiscal pro). CTA navegable al tab correspondiente (Aprende, en mayoría de casos).
- Monte Carlo básico se calcula con 200 trials (no 500) en un `useEffect` con `setTimeout(60)` para no bloquear el render; se muestra solo el % en un badge coloreado.
- HouseholdSummaryCard se mantiene si hay multi-cuenta (la card detecta sola y se autohide).

### D2 · Bloques sacados de Mi Plan
- `MonthlyFlowCard` → Seguimiento (nuevo wrapper `MonthlyFlowBlock`, al inicio del bloque "Mensual").
- `FlowTimelineCard` → ya estaba en Seguimiento desde sub-prompt B.
- `MonteCarloCard` → Proyección (al final, recibe `effectivePlan` para reflejar los overrides de sesión).
- `FinancialHealthCard`, `RetirementCard`, `LifecycleChart`, `WhatIfCard`, `NextGoalCard`, "Este mes" card y las dos cards editoriales del footer: eliminados de Mi Plan. Los datos relevantes se integran en los tres movimientos como prosa o KPIs simples. Componentes se mantienen en el archivo por si se reutilizan.

### D3 · Sin Mi Plan integrado como desplegable
- Bloque visualmente diferenciado al final de Mi Plan (`background: T.panel`, padding generoso): cabecera "¿Y si no tuviera plan?" + sub-frase "Compara tu patrimonio futuro con plan vs sin plan" + indicador `Desplegar ▾`.
- Al expandir, renderiza `<ScreenSinMiPlan embedded />` (nuevo prop `embedded` añadido al componente: oculta el header inicial para no duplicar el título).
- Al final del desplegable, mini-card con CTA `Profundizar (Pro) →` que navega a `'sinplan-pro'`.
- `ScreenSinMiPlan` se mantiene como ruta accesible si `activeTab === 'sinplan'` (router conservado de sub-prompt B); ya no aparece en nav.

### D4 · `SinMiPlanProPlaceholder`
- Nueva pantalla placeholder con `Label: "Sin Mi Plan Pro"` + headline + lista de "qué incluirá" (FIRE perfilado, recomendaciones de reconversión, plan DCA, etc.) + botón `← Volver a Mi Plan`.
- Router en mobile y desktop: `tab === 'sinplan-pro' && <SinMiPlanProPlaceholder goTo={setTab} />`.

### D5 · Proyección · `SupuestosEditables` con sandbox de sesión
- Nuevo componente `SupuestosEditables` con 5 `EditableNumber`: inflación, rentabilidad media, tasa de retiro, edad objetivo FIRE, esperanza de vida.
- API basada en `overrides` (objeto parcial de fields divergentes) + `onChange(nextOverrides)` (replace style, no patch). El caller pasa los overrides actuales y el componente devuelve el next state completo.
- Cuando un valor coincide con el del plan original, el override correspondiente se elimina (no hay ruido de "modificado" innecesario).
- Indicador visual por campo: badge `modificado` amber + cifra en `T.amber` cuando el override está activo + nota `original: X` debajo.
- Banner global `⚠ supuestos modificados · solo en esta sesión` cuando `hasOverrides`.
- Botones `Aplicar a mi plan` (variant accent) y `Restaurar valores de Ajustes` (variant ghost) aparecen solo cuando hay overrides activos.
- Si `sandboxActive`: el componente se renderiza con `opacity: 0.6` y un mensaje aclaratorio. Los overrides no aplican mientras el Probador está activo (semántica clara: Probador y SupuestosEditables son sandboxes paralelos).

### D6 · Refactor de `ScreenProyeccion` con `effectivePlan` / `effectiveProfile`
- `useState` local `[overrides, setOverrides] = useState({})`.
- `effectivePlan = sandboxActive ? activePlan : { ...plan, ...planOver }` (el override de `retireAge` se mueve a `effectiveProfile`).
- `effectiveProfile = { ...profile, retireAge: overrides.retireAge ?? profile.retireAge }`.
- Las tres llamadas a `projectV2` dentro del componente (`seriesActiveNominal`, `seriesRealNominal`, `seriesRealWithHypoNominal`) usan `effectivePlan` / `effectiveProfile`.
- `inflRate` del componente deriva ahora de `effectivePlan.inflationRate`.
- `MonteCarloCard` recibe `plan={effectivePlan}` y `profile={effectiveProfile}` para que el sandbox propague también a la simulación estocástica.
- Las dual curves (`seriesPlanFromStart` / `seriesRealFromStart`) vienen de `useDerived` con el plan REAL — son informativas y no se ven afectadas por overrides. Documentado en el código.
- `applyOverrides`: propaga al store vía `updatePlan(planFields)` + `updateProfile({retireAge})` y limpia `overrides`. `resetOverrides`: pone `overrides = {}`.

### D7 · Mi Plan no se ve afectado por los overrides
- ScreenHoy lee de `state.plan` y `state.profile` directamente vía `useStore` y `useDerived`. Los overrides son state local de `ScreenProyeccion`. Al volver a Mi Plan después de modificar supuestos, los KPIs y prosa siguen mostrando los valores configurados en Ajustes (verificado runtime).

## Verificación · Playwright + Chromium headless
- Mi Plan muestra los tres movimientos con jerarquía clara (`1 · Dónde estás`, `2 · Hacia dónde vas`, `3 · Siguiente paso`). ✓
- Las cards/componentes eliminados (MonteCarloCard, MonthlyFlowCard, FlowTimelineCard, cards editoriales) no aparecen en Mi Plan. ✓
- Monte Carlo % básico se computa (~86% con el demo) y aparece en el badge del movimiento 2. ✓
- Desplegable "¿Y si no tuviera plan?" expande y muestra "Verdad 1 · La erosión del salario" + CTA Pro. ✓
- Click en "Profundizar (Pro) →" navega al placeholder `Sin Mi Plan Pro` con la lista de funcionalidades futuras. ✓
- Proyección muestra los 5 labels de SupuestosEditables (Inflación / Rentabilidad / Tasa de retiro / Edad objetivo / Esperanza de vida). ✓
- MonteCarloCard movido a Proyección (heading "Supuestos de esta simulación" presente). ✓
- Modificar inflación dispara badge "supuestos modificados · solo en esta sesión" y muestra los botones Aplicar / Restaurar. ✓
- Cero `pageerror`, cero errores de consola.

## Sistema de reglas del Movimiento 3 — comportamiento
Las cinco reglas se evalúan en orden y devuelven la primera que se cumple:
1. **No hay hito de liquidez** (regex `/(emergencia|liquidez|colchón|colchon)/i` sobre `goals[].name`). Aplica a casi todos los usuarios nuevos (con `defaultGoals` vacío en v5.6).
2. **No hay aporte mensual** (`computePlannedFor(plan, todayKey()) <= 0`).
3. **Tasa de ahorro < 15%** (planAporte / income).
4. **Allocation conservadora**: solo si `actualLife.completed` y horizonte > 15 años, mira `fundsEtfs + pensionPlan` (RV). Si < 30%, dispara.
5. **Default** (todo bien): mensaje de optimización fiscal con CTA "Próximamente en v1.x". ctaTab es `null`, el copy se muestra como nota muted.

## No tocado
- `CLAUDE_CODE_CONTEXTO.md`: corresponde al sub-prompt G.
- IDs internos, clave de localStorage, `projectV2`, `runMonteCarlo`, `LEARN_CORPUS`, useDerived: intactos.
- Probador (sandbox): no se ha movido a sub-modo de Proyección como sugería el prompt al final. La integración del Probador como sub-modo de Proyección queda diferida: hoy convive como antes (se activa desde Ajustes). Documentado: cuando hay overrides en Proyección, el Probador y los overrides no se aplican simultáneamente — el comportamiento se mantiene predecible (overrides quedan en silencio cuando sandbox activo, con mensaje aclaratorio).
- Cards y componentes deprecated (MonthlyFlowCard, FlowTimelineCard, FinancialHealthCard, RetirementCard, LifecycleChart, WhatIfCard, NextGoalCard, KpiCard) se mantienen en el archivo. `MonthlyFlowCard` y `FlowTimelineCard` se siguen usando (en Seguimiento). Los demás quedan como código no llamado; eliminarlos definitivamente requeriría más limpieza y se difiere a v1.x si nadie los reutiliza.
