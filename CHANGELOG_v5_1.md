# CHANGELOG mi_plan_v5_1.html

Derivado de `mi_plan_v5.html`. Una línea por cambio significativo.

## Prompt 3 — Correcciones post-v5

### C1 · Nav mobile reducida a 5 tabs + accesos en `ScreenHoy`
- En `Shell`, la barra inferior mobile filtra `sinplan` y `aprender` del array `tabs` antes del `.map`. El array `tabs` global y el router de pantallas no cambian — ambas tabs siguen funcionando vía `state.activeTab` y son accesibles desde el sidebar desktop.
- En `ScreenHoy`, añadidos dos `Btn variant="ghost" size="sm"` justo antes del cierre del `<div>` exterior: `⌖ Sin Mi Plan →` y `◇ Aprende →`. Ambos usan `goTo(id)` para navegar.
- Sidebar desktop sin cambios: sigue con los 7 items.

### C2 · Crecimiento salarial editable en Verdad 1
- Eliminado el `const salaryGrowthAnnual = 1.0` hardcodeado en `ScreenSinMiPlan`.
- Sustituido por `useState(1.0)` local; no se persiste en `localStorage` (exploratorio por diseño).
- Añadido el `useMemo` deps del `salaryGrowthAnnual`.
- Dentro de la Card de Verdad 1, antes del `<ErosionChart />`, nuevo bloque con `EditableNumber min=0 max=10 step=0.1` y label "Crecimiento salarial asumido X % / año" + micro-texto italic T.muted con el contexto histórico español.

### C3 · Verdad 2 itera con `computePlannedFor` mes a mes
- Reescrito el `useMemo` de `oppCost`. Ya no usa la cifra `investment` constante; calcula `computePlannedFor(plan, addMonthsKey(tk, m))` por cada mes del loop. Reutiliza la función `addMonthsKey` ya existente (línea ~603); no duplica.
- Curva "Con Mi Plan" ahora coherente con la de `ScreenProyeccion`: si el plan tiene tramos de ahorro escalonados, la aportación crece a lo largo del tiempo y el coste de oportunidad refleja la realidad del plan completo.
- Deps del `useMemo` cambiadas a `[plan, inflRate, planReturn, profile.age, monthsToRetire, tk]` (incluye `plan` entero para detectar cambios en tramos).

### C4 · Guard de allocation en `finish` del modal
- En `ActualLifeOnboarding.finish()`, antes de construir el `payload`: calcula `totalAlloc` y `allocValid = |total − 100| < 0.01`. Si inválido, `setStep(2)` (paso de allocation) y `return`, sin guardar nada.
- Defensa contra estado corrupto cargado de sesión anterior. El flujo normal del modal ya bloquea avanzar de paso 3 a paso 4 con allocation incorrecta (botón muestra "Completa para continuar"), pero esta defensa cubre el caso de `data.allocation` inicial inválido.
- Sin mensaje toast adicional — el indicador rojo/amber del paso 3 ya explica el problema.

### C5 · Documentación · CLAUDE_CODE_CONTEXTO.md
- Cambiada la línea que listaba `T.mono (JetBrains Mono)` por `T.mono (DM Mono)` para reflejar la fuente realmente usada en `<style>`. Cambio puramente documental, no afecta runtime.

## Verificación
- Sintaxis Babel OK.
- Runtime Playwright + Chromium headless:
  - **Mobile (390px viewport)**: nav inferior cuenta exactamente 5 tabs (`◐Hoy`, `◧Mes a mes`, `◢Proyección`, `✦Plan`, `◌Ajustes`). "Sin Mi Plan" y "Aprende" ausentes del nav, presentes en `ScreenHoy` como botones ghost. Click en `⌖ Sin Mi Plan →` navega correctamente a la pantalla. ✓
  - **Desktop (1280px viewport)**: sidebar conserva los 7 items intactos. ✓
  - **Verdad 1 editable**: cambiar el `salaryGrowthAnnual` de 1% a 3% modificó la cifra de pérdida acumulada de −309k€ a −462k€. ✓
  - **Allocation guard**: con localStorage corrupto (allocation suma 60), el modal abre en step 1, pasos 1-2 avanzan, paso 3 muestra "Completa para continuar" en el botón y no permite avanzar al paso 4. ✓
  - Cero `pageerror`, cero errores de consola en todos los flujos.
