# CHANGELOG mi_plan_v5_6.html

Derivado de `mi_plan_v5_5.html`. Una línea por cambio significativo.

## Sprint v1.0 · Sub-prompt A

### A1 · Renombrado de nomenclatura visible
- Nav tab `Hoy` → `Mi Plan` en el array de tabs del `Shell` (mobile y desktop). Nombre interno `id: 'hoy'` y la clave `state.activeTab === 'hoy'` se preservan: cero impacto en estado persistido.
- Cabecera de pantalla en `ScreenHoy`: `<Label>Hoy, {fecha}</Label>` → `<Label>Mi Plan · {fecha}</Label>`. El "·" mantiene la legibilidad del patrón fecha contextualizada.
- `DisplayModeToggle`: `€ Futuro` → `€ con inflación` (modo nominal); `€ Hoy` → `€ sin inflación` (modo real). El atributo `title` también actualizado para describir mejor cada modo. IDs internos `'nominal'` / `'real'` y el `state.displayMode` no cambian.
- Otros call-sites visibles en cards:
  - `RetirementCard`: `"X nominales"` / `"X en € de hoy"` → `"X con inflación"` / `"X sin inflación"`.
  - `MonteCarloCard` axis label: `Patrimonio (€ de hoy)` → `Patrimonio (€ sin inflación)`.
  - `ScreenSinMiPlan` Verdad 2 KPIs y leyenda: `en € de hoy` → `en € sin inflación` (3 ocurrencias incluyendo "Poder adquisitivo").
  - Onboarding paso 8 KPIs: `en € de hoy` → `en € sin inflación` (2 ocurrencias).
  - `LEARN_CORPUS` artículo de inflación (glossary + body): referencias al modo `"€ Hoy"` → `"€ sin inflación"` (2 ocurrencias). Contenido conceptual intacto.
  - Comentario interno en `applyRealMode` actualizado por coherencia.
- "Hoy" preservado en contextos donde es adverbio temporal, no nombre del producto: el glossary de DCA ("HOY") y todas las menciones en prosa del corpus. Esos NO se tocan.

### A2 · Ordenación visual de series en gráficos apilados
- `FlowTimelineCard` ("Cómo se reparte tu ingreso en el tiempo"): el orden de las dos `<Area>` se invierte. Ahora `life` (mayor magnitud, ~80% del ingreso) se renderiza primero (base del stack), y `invest` (~15-20%) se apila encima. Convención visual de "magnitud mayor en la base" aplicada al bloque que el feedback marcaba como contraintuitivo. Leyenda y tooltip se mantienen con el orden original (Inversión primero como destacada).
- `MonthlyFlowCard` no aplica: no es stacked vertical sino una barra horizontal de proporción. Se mantiene como estaba.
- `HouseholdSummaryCard` no aplica: KPIs en grid, no stacked.
- Mortgage `BarChart` en `ScreenSinMiPlan` Verdad 4 no aplica: `principal` e `interest` tienen magnitudes comparables y cambiantes año a año; el orden actual coincide con el patrón editorial (principal en accent abajo, intereses en amber encima).

### A3 · Hitos predeterminados eliminados para usuarios nuevos
- `defaultGoals(data)` ahora devuelve `[]`. Antes precargaba "Fondo de emergencia", "Algo grande que persigues" y "Libertad financiera" — el usuario veía hitos en su plan que él no había creado.
- `seedDemo` (la pantalla demo lanzada desde Landing) sigue trayendo sus 3 hitos propios (Entrada del piso, Año sabático, Independencia financiera) porque es un demo deliberado, no un usuario nuevo.
- Migración: usuarios existentes con hitos guardados los conservan. El cambio solo afecta a la inicialización vía onboarding.
- Placeholder en `ScreenPlan` cuando `goals.length === 0` reescrito con el copy del prompt: *"Aún no has añadido ningún hito a tu plan. Los hitos son metas intermedias (un colchón de liquidez, comprar una vivienda, pagar la entrada, etc.) que te ayudan a estructurar tu camino. Añade el primero cuando quieras."* Estilo serif 15 italic muted, alineado a la izquierda en lugar del centrado anterior.

### A4 · Agrupación visual de tramos cuando exceden 5
- `TramoListEditor` ahora maneja un state local `[expanded, setExpanded]`.
- Cuando `tramos.length > 5 && !expanded`, renderiza solo el primero, el segundo, un botón colapsado "+ N tramos intermedios (mostrar todos)", el penúltimo y el último. Estilo del placeholder: `border: 1px dashed`, `background: T.panel`, mono uppercase 11, `cursor: pointer`.
- Click en el botón pone `expanded = true` y desbloquea todos. Cuando ya está expandido aparece un botón discreto `↑ Colapsar intermedios` para volver al estado plegado.
- Cuando `tramos.length <= 5`, comportamiento idéntico al anterior (todos visibles).
- Funciona transparentemente para los 3 usos actuales del componente en Ajustes (ingresos, complementos, ahorro) y se moverá transparente cuando el sub-prompt B reubique la configuración de tramos.

## Verificación
- Babel: sintaxis OK tras cada cambio significativo.
- Runtime Playwright + Chromium headless:
  - Nav muestra `◐ Mi Plan` (sustituye a `◐ Hoy`). ✓
  - Toggles `€ con inflación` / `€ sin inflación` visibles; ninguna mención de `€ Hoy` / `€ Futuro` queda. ✓
  - Cabecera de pantalla `MI PLAN · {DÍA}, {FECHA}` correcta. ✓
  - Usuario nuevo (localStorage limpio → onboarding completo): pantalla Plan muestra el placeholder editorial; no aparece "Fondo de emergencia". ✓
  - Cero `pageerror`, cero errores de consola.

## No tocado (por las reglas del sub-prompt)
- `CLAUDE_CODE_CONTEXTO.md` no se actualiza en este sub-prompt. Se actualiza al final del sprint en G.
- Nombres internos de variables (`realMode`, `nominalMode`, `displayMode`, `state.activeTab === 'hoy'`, etc.) y claves de localStorage: intactos.
- LEARN_CORPUS ids, comentarios estructurales del código y el motor `projectV2`: intactos.
