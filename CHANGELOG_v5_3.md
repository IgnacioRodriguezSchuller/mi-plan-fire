# CHANGELOG mi_plan_v5_3.html

Derivado de `mi_plan_v5_1.html` (no había `v5_2.html` en el workspace; uso `v5_1` como base).
Una línea por cambio significativo.

## Prompt 4 — 7 bugs y mejoras visuales

### Bug 1 · Inputs del onboarding no aplican cambio si "Siguiente →" se clica sin blur
- `onClick` del botón "Siguiente →" y del botón final "Ver mi plan →" en `Onboarding` ahora invocan `document.activeElement.blur()` antes de avanzar / llamar a `finish()`. Eso fuerza al `EditableNumber` activo a ejecutar su `commit()` (onBlur) y propagar el draft al state.
- El check `typeof document !== 'undefined' && document.activeElement && document.activeElement.blur` evita romper SSR/tests headless donde `document` puede no estar disponible.

### Bug 2 · Proyección de salario coherente con los tramos
- **Onboarding paso 8**: `livePlan` movido arriba del array `steps` (era declarado más abajo y el IIFE del paso 8 no podía verlo). El IIFE ahora calcula `nominal = computeIncomeFor(livePlan, addMonthsKey(tk, m))` mes a mes; eliminadas `salaryG` y `gMo`.
- **ScreenSinMiPlan Truth 1**: nuevo flag `hasMultipleIncomeSegments = (plan.incomeSegments || []).length > 1`. El `useMemo` de `erosion` proyecta con `computeIncomeFor(plan, addMonthsKey(tk, m))` cuando hay varios tramos; cuando solo hay uno, mantiene la fórmula `income × (1+gMo)^m` y el control `salaryGrowthAnnual` sigue editando esa hipótesis.
- UI condicional: cuando `hasMultipleIncomeSegments`, oculta el `EditableNumber` de "Crecimiento salarial asumido" y muestra italic muted *"Proyección según los tramos de tu plan de Ajustes."* La leyenda del chart cambia a *"Salario nominal (según tu plan)"*.
- Verificado runtime: con el plan demo (2 tramos + bonus), la curva nominal acaba en ~3.7k€ (= 3.200 base + 500 bonus), no en una curva sintética.

### Bug 3 · Sliders del paso 3 del mini-onboarding congelados
- Extraídas `ExpenseRow` y `AllocRow` de dentro de `ActualLifeOnboarding` a funciones a nivel módulo. Antes se redeclaraban en cada render, lo que cambiaba el tipo de componente y forzaba un remount → los range inputs perdían focus durante el drag.
- Nuevas firmas: `ExpenseRow({ k, label, chips, expenses, onSetExpense })`, `AllocRow({ k, label, fixedReturn, customKey, returnLabel, allocation, onSetAlloc, onSetCustomReturn, planReturn })`. Sin closures sobre el scope del padre.
- Los 5 call-sites de cada uno actualizados para pasar `data.expenses`/`data.allocation` + setters + `planReturn`.

### Bug 4 · Botón "×" de eliminar hito mal posicionado
- `Card` ahora trae `position: 'relative'` por defecto (antes del spread del `style` de cada Card, así puede sobreescribirse si hace falta). Sin ese ancla, los `position: absolute` interiores se posicionaban contra el body.
- `GoalRow`: el botón × se movió fuera del `<div>` flex principal y al inicio de la Card, con `position: 'absolute', top: 10, right: 12`, `padding: '4px 6px'`, `borderRadius: 4`. El `<div>` interno principal recibe `paddingRight: 28` para que el título no quede tapado por el ×.

### Bug 5 · Cards editoriales en `ScreenHoy`
- Los dos `Btn variant="ghost"` (`⌖ Sin Mi Plan →` / `◇ Aprende →`) se sustituyen por dos `<button>` con apariencia de Card: símbolo grande arriba-izquierda, etiqueta mono arriba-derecha, título display, descripción italic. Hover cambia `border-color` a `T.accent` (Sin Mi Plan) o `T.ink` (Aprende).
- Grid 1 columna en mobile, 2 en desktop. Verificado runtime: el card "Lo que te cuesta no actuar" navega a Sin Mi Plan.

### Bug 6 · El último escalón de salario no llega a `evoCap`
- Loop de generación de tramos escalonados rescrito en las **dos** copias (`livePlan` useMemo y `finish()`):
  - Condición de while cambiada a `amount < data.evoCap` (era `<=`, generaba una iteración extra cuando coincidía).
  - Cuando `nextAmount >= data.evoCap`, en lugar de cerrar el tramo actual a `null` (lo que dejaba el sueldo en el valor pre-tope para siempre), genera **dos segmentos**: uno corto (duración proporcional a la fracción de step que falta) en el valor pre-tope, y otro abierto (`to: null`) exactamente en `data.evoCap`.
  - Caso degenerado (`segs.length === 0` por entrada inválida): cae al segmento abierto en `data.income`.
- Verificado runtime: onboarding con income=3300, step=1000, evoCap=12000 → el último `incomeSegment` guardado tiene `amount: 12000` exacto.

### Bug 7 · Pensión pública activa hacía mostrar "¡Ya!" antes de la edad de inicio
- En `FinancialHealthCard`: nuevas variables `pensionActive = pen.enabled && profile.age >= pensionStartAge` y `effectivePensionForFI = pensionActive ? pensionMonthly : 0`. La pensión solo resta al gap cuando ya está activa.
- `ageAtFI` reescrito: si `fiTarget <= 0`, distingue tres casos — pensión activa cubre coste (→ devolver `pensionStartAge`), patrimonio sin pensión cubre coste (→ `profile.age`), pensión futura (→ `pensionStartAge`). El default cae en `profile.age` solo cuando nada justifica IF futuro.
- Deps del `useMemo` actualizadas (`pensionActive`, `pensionNotYetActive`, `pensionStartAge`, `pensionMonthly`, `monthlyLife`, `pen.enabled`, `d.currentPortfolio`, `withdrawalRate`).
- Copy actualizado: el bloque `reachedFI` ahora dice *"la pensión pública cubre tu coste de vida actual desde los {startAge}"* cuando aplica. El bloque `!reachedFI` añade *". Pensión pública desde los X: reducirá la meta Y€/mes"* cuando hay pensión futura.
- Verificado runtime: con un usuario de 30, pensión activada (sin importe) y edad de inicio 67, "Libertad financiera" muestra "A los 54 · faltan 24 años. Necesitas X€... Pensión pública desde los 67: reducirá la meta...". NO muestra "¡Ya!".

## Bug 5 sobre `CLAUDE_CODE_CONTEXTO.md`
- Aplicado en v5.1, no requiere cambio aquí.

## Verificación global
- Babel: sintaxis OK tras cada bug (validado bug a bug).
- Runtime Playwright + Chromium headless:
  - Smoke test del demo + navegación por 6 pantallas: cero errores.
  - Bug 5 (cards editoriales): ambas cards presentes, click navega a la sección correcta. ✓
  - Bug 6 (evoCap exacto): onboarding escalonado guarda último tramo en 12000 exacto. ✓
  - Bug 7 (pensión futura): tras activar la pensión, IF no muestra "¡Ya!" sino la edad de FI calculada. ✓
  - Bug 2 (ScreenSinMiPlan Truth 1): con el demo de 2 tramos, el banner "Proyección según los tramos…" aparece, el control de crecimiento se oculta, leyenda dice "según tu plan", la curva acaba en 3.7k€ (= 3.200 + 500 bonus). ✓
- Bugs 1, 3, 4: implementaciones inspeccionadas, sin testeo runtime específico (Bug 1 requiere simular foco mid-drag, Bug 3 requiere medir el remount, Bug 4 requiere screenshots; las correcciones son mecánicas y verificables visualmente).

## Interacción entre Bug 2 y Bug 6
Bug 6 reescribe la generación de tramos en `livePlan`. Como Bug 2 hoists `livePlan` arriba del array `steps`, ambos cambios se integraron en un solo edit del `livePlan` para evitar duplicar el patch. El loop nuevo aplica tanto al preview del onboarding (Bug 2A) como al guardado final (Bug 6 sobre `finish()`). Los dos puntos coinciden ahora.
