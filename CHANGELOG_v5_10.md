# CHANGELOG mi_plan_v5_10.html

Derivado de `mi_plan_v5_9.html`. Una línea por cambio significativo.

## Sprint v1.0 · Sub-prompt E · Sistema free/pro + Monte Carlo dividido + Asset Allocation extendido

### E1 · Flag interno `isPro`
- Nuevo campo `state.isPro` (boolean):
  - `false` por defecto en `emptyState()`.
  - Migración idempotente en `migrateToV2`: usuarios existentes con `isPro == null` se inicializan a `false`.
  - `seedDemo` mantiene el comportamiento; el demo arranca free como cualquier usuario.
- Helper de detección: no se ha extraído función externa; los componentes leen `state.isPro` vía `useStore()` (suficientemente legible y consistente con el patrón actual).

### E2 · Monte Carlo dividido (free / Pro)
- `MonteCarloCard` lee `isPro` al inicio y condiciona el render. Sin extraer dos componentes — el cuerpo es uno solo con bloques condicionales que mantienen la coherencia visual.
- **Modo free**:
  - Header con KPI grande % éxito y zona (Excelente/Aceptable/Frágil/Crítico) — sin cambios.
  - Copy del header: *"{N} simulaciones de tu plan completo, con volatilidad de mercado. El % de éxito resume el resultado pero esconde la asimetría: las bandas del gráfico te enseñan el rango plausible de futuros."*
  - Chart: solo banda externa p10-p90 + líneas tenues p10/p90 + mediana sólida (3 elementos visibles según el prompt, sin la banda interna p25-p75).
  - Leyenda con 2 entradas: `Mediana (p50)` + `Rango plausible (p10–p90)`.
  - Grid de KPIs p10/p50/p90 a la edad de jubilación — sin cambios.
  - CTA discreto al final: *"Para análisis avanzado (rangos centrales adicionales, año probable de quiebra si el plan falla, escenarios de mala secuencia de retornos), pasa a **Pro**. Ver análisis Monte Carlo Pro →"* (lleva a Ajustes; sub-prompt G afina la ruta si fuera necesario).
  - **Bloqueos**: SoR toggle no se renderiza; `OnboardingHelp` ("¿Cómo leer este gráfico?" y "Supuestos de esta simulación") no se renderizan; bloque "Si el plan falla" tampoco.
  - Por seguridad: `useEffect` resetea `sequenceMode` a `'random'` cada vez que `isPro` pasa a false, para que un usuario que vuelva a free no quede con la simulación en modo crash.
- **Modo Pro**:
  - Header con copy más exigente (el de v5.5: *"…leerlo solo es engañoso. Mira las bandas del gráfico y, sobre todo, lo que dice 'Si el plan falla' al final."*).
  - SoR toggle visible (aleatoria / caída temprana / caída tardía).
  - Chart con 5 bandas (p10/p25/p50/p75/p90), banda interna p25-p75 más opaca.
  - Leyenda completa con las tres entradas (Mediana, Rango probable, Rango plausible).
  - `OnboardingHelp` "¿Cómo leer este gráfico?" y "Supuestos de esta simulación" disponibles.
  - Bloque "Si el plan falla" (cuando `result.depletionAgeStats != null`).
  - CTA Pro oculto.
- El motor `runMonteCarlo` y su firma quedan intactos. Lo que cambia es solo qué se renderiza.

### E3 · Asset Allocation con rentabilidades editables (solo Pro)
- `AllocRow` ahora recibe `isPro` como prop.
- Cuando `isPro && customKey`: input editable `EditableNumber` con rango ampliado `-50% a +50%` (libertad del usuario Pro; el copy del prompt: "El usuario es responsable").
- Cuando `!isPro` (o cuando no hay `customKey`): solo se muestra el valor numérico como texto, sin input.
- El cálculo del valor mostrado se centraliza en `customReturn`: si hay `customReturns[k]`, ese; si no, fallback al `planReturn` cuando `returnLabel === 'plan'`, 2% para depósitos, 0 para "otros".
- Los 5 call-sites en `ActualLifeOnboarding` pasan `isPro={isPro}` con `const isPro = !!state.isPro`.
- El cómputo de `effectiveReturn` del capital (helper `computeEffectiveCapitalReturn`) sigue funcionando igual: lee `allocation.customReturns` que ahora puede contener valores ajustados por usuarios Pro o quedar como defaults para free.

### E4 · Toggle testing + inventario en Ajustes
- Nueva Card al final de `ScreenAjustes` con borde dashed y título "Modo testing (temporal)".
- Subtítulo italic muted que explica que es un toggle interno de desarrollo y que se eliminará antes del lanzamiento público real (post Sprint 2).
- Checkbox `Activar modo Pro (solo para testing en desarrollo)` que mutea `state.isPro` directamente.
- Cuando `state.isPro === true`: bloque "Funcionalidades Pro activas" con lista:
  - ✓ Monte Carlo completo (5 bandas, sequence-of-returns, supuestos plegables, año de quiebra)
  - ✓ Asset Allocation con rentabilidades editables por categoría
  - ○ Sin Mi Plan Pro (próximamente en v1.x)
  - ○ Diagnóstico de tipo FIRE personalizado (próximamente en v1.x)
  - ○ Plan de reconversión con DCA (próximamente en v1.x)
  - ○ Exportación PDF profesional (próximamente en v1.x)
  - ○ Comparador de escenarios paralelos avanzado (próximamente en v1.x)
  - ○ Importación CSV de extractos bancarios (próximamente en v1.x)

## Verificación · Playwright + Chromium headless
- Modo free (por defecto): MonteCarloCard muestra el KPI %, oculta el SoR toggle, los OnboardingHelp y el bloque depletion, leyenda con 2 entradas, CTA Pro presente al final. ✓
- Toggle "Activar modo Pro" en Ajustes funciona, marca `state.isPro = true` en localStorage. ✓
- Tras activar Pro, MonteCarloCard muestra SoR toggle, OnboardingHelp completos, "Rango probable" en leyenda, "Si el plan falla" (cuando hay fallos), y el CTA Pro desaparece. ✓
- Inventario Pro se renderiza con los 9 ítems esperados (2 activos, 7 próximamente). ✓
- Sintaxis Babel OK tras cada cambio. Babel emite un warning informativo de "deoptimised styling" porque el archivo supera 500KB; no es error, solo nota.
- Cero `pageerror`, cero errores de consola.

## No tocado
- `CLAUDE_CODE_CONTEXTO.md`: corresponde al sub-prompt G.
- Motor `runMonteCarlo` y su firma: intactos. La división free/Pro es puramente de presentación.
- `projectV2`, `LEARN_CORPUS`, claves de localStorage, IDs internos de tabs: intactos.
- Toggle Pro testing es **temporal**: documentado dentro de la propia Card y aquí. Se eliminará o condicionará a una variable de entorno antes del lanzamiento público real (post Sprint 2).
