# CHANGELOG mi_plan_v4.html

Trabajo derivado de `mi_plan_v3_con_aprende.html`. Una línea por cambio significativo.

## Hotfix · 2026-05-18 · Rules of Hooks (3 violaciones)
- **MonteCarloCard** (causa del crash post-onboarding reportado): el `useMemo` para `ageTicks` añadido en C3 quedó situado **después** de tres `return` tempranos (`running && !result`, `error`, `!result`). En los primeros renders (estado `running`, `!result`) el hook no se ejecutaba; al llegar al render normal se introducía un hook extra. Resultado: `Rendered more hooks than during the previous render` y pantalla en blanco tras completar el onboarding. Fix: movido el `useMemo` de `ageTicks` arriba, inmediatamente después del `useMemo` de `chartData` y antes de cualquier `return`.
- **Concept** (Aprende, latente): `useEffect` declarado después de `if (!concept) return <span>{children}</span>`. No se manifestaba en el bug reportado porque los usos actuales pasan ids válidos del corpus, pero crashearía con un id mistypeado. Fix: `useEffect` movido antes del guard. La sección Aprende está cerrada por contexto, pero un fix de Rules-of-Hooks no toca contenido — solo reordena hooks.
- **ConceptModal** (Aprende, latente): mismo patrón — `useState` y `useEffect` después de `if (!concept) return null`. Fix análogo: hooks antes del guard.
- Validación: Playwright + Chromium headless con todas las dependencias servidas localmente. Flujo testado: onboarding completo paso a paso (nombre → edad → capital → ingreso → ahorro → evolución → retiro → recap → dashboard) + navegación por las 6 tabs + activación del modal de pensión pública. Cero `pageerror`, cero errores en consola.

## Prompt 1 — Bugs y correcciones de comportamiento

### C1 · Capacidad de ahorro en onboarding (fricción escalonada)
- Añadido helper `getSavingsTier(pct)` (justo antes de `function Onboarding`) con 6 tramos (0-10 / 10-20 / 20-35 / 35-50 / 50-70 / 70-100%) que devuelven `{label, color, message}`.
- Step 5 onboarding · modo Proporcional: quitado el tope 50% del slider (ahora 0-100) y el tope 80% del EditableNumber (ahora 0-100). Añadidos chip de etiqueta de tramo y mensaje educativo del tramo bajo el ratio.
- Step 5 onboarding · modo Fijo €: calculado el ratio implícito monthly/income; cuando income>0 se muestra el chip de etiqueta y el mensaje del tramo. Si income=0 no se muestra (no es calculable).
- ScreenAjustes: revisado, el ahorro se edita por tramos (edición experta); no se aplica fricción según contexto.

### C2 · Pensión pública desactivada por defecto + disclaimer + bloqueo pre-jubilación
- Verificado: `useStore` arranca con `plan.publicPension.enabled = false` (línea ~1301) y la migración `migrateToV2` solo inicializa si el campo no existe (línea ~1111), respetando estados previos.
- Añadida variante `amber` al componente `Btn` (background T.amber, color blanco, border T.amber).
- Nuevo componente `PublicPensionDisclaimerModal` justo antes de `PublicPensionCard`: maxWidth 560, fontFamily T.serif fontSize 15 lineHeight 1.6, título en T.display, copy textual del prompt, dos botones (`ghost` Cancelar + `amber` Activar de todas formas), cierre por ESC o click fuera.
- `PublicPensionCard`: el toggle ahora abre el modal cuando `enabled === false`. Desactivar (toggle desde `enabled === true`) sigue siendo directo sin modal. El modal aparece cada vez que se reactiva — no se cachea.
- `FinancialHealthCard`: añadido aviso "Pensión pública activada. Empezará a contar desde los XX años. No suma a tu ingreso actual." cuando `pen.enabled && profile.age < pen.startAge`. La passive income ("Tu dinero ya trabaja") nunca sumó pensión — verificado.
- Verificado en motores de proyección: `projectDecumulation` (línea ~825) y `monteCarlo` (línea ~1049) solo aplican pensión cuando `ageNow >= penStartAge`. No requirió cambio.

### C3 · Monte Carlo legible de primeras
- Frase introductoria justo encima del gráfico (T.serif italic 14, T.muted, lineHeight 1.55).
- Ejes con labels explícitos: X="Edad", Y="Patrimonio (€)" (o "Patrimonio (€ de hoy)" en modo real). Ticks limpias cada 5 ó 10 años según rango (computadas con `useMemo`).
- Leyenda de bandas reescrita con tres swatches: amber dashed (10% peor), accent solid (mediana), verde con fill 0.30 (10% mejor). Estilo T.mono 10 uppercase.
- Bloque colapsable "¿Cómo leer este gráfico?" usando `OnboardingHelp`, con copy multi-párrafo (qué hace, lo que importa, qué son las bandas, número clave). Inserta `result.trials` dinámicamente.
- Tooltip actualizado: muestra edad redondeada y labels reescritas ("10% peor (p10)" / "Mediana (p50)" / "10% mejor (p90)").
- Reemplazado el footer paragraph anterior por el bloque colapsable; queda solo la frase final de "En el N% de simulaciones la cartera se agota..." sin cambios.

### C4 · Mes a Mes con curvas duales (plan vs realidad)
- `projectV2` extendido con tres opciones nuevas, todas opcionales y back-compat (`undefined` = comportamiento idéntico al anterior):
  - `actualByKey`: mapa `{ '2025-01': 350, ... }`. Si un mes generado tiene entrada, su aporte se reemplaza por el valor real.
  - `months`: número explícito de meses a proyectar (override del cálculo edad→retireAge).
  - `endAge`: edad final objetivo (alternativa a `months`).
  - `startAge`: edad de referencia para el primer mes de la serie.
  - La `age` por fila ahora se calcula desde el `startKey` real, no asumiendo profile.age en t=0.
- `useDerived` enriquecido: `firstRegisteredKey`, `lastRegisteredKey`, `seriesPlanFromStart`, `seriesRealFromStart`, `planPortfolioAtLastReg`, `realPortfolioAtLastReg`, `realVsPlanDelta`, `realVsPlanRatio`, `fiTarget`, `ageAtFiPlan`, `ageAtFiReal`. Las dos series cubren desde el primer mes registrado hasta la edad de jubilación, parten de `plan.capital`, comparten plan; la "real" sobreescribe aportes con actuals para meses registrados.
- `MultiLineChart` refactorizado para alinear filas por edad (no por índice), de forma que series con distintos puntos de inicio coexisten en el mismo gráfico sin desalinear el eje X. XAxis pasa a `type="number"` con dataKey="age".
- `applyRealMode` en `ScreenProyeccion` ahora usa el `key` de cada fila para calcular `monthsFromNow` — necesario para que la conversión a € de hoy sea correcta cuando la serie viene del pasado.
- `ScreenMesAMes`: sustituido el chart anterior (`<LineChart series=seriesActualPace planSeries=seriesPlan>`) por `<MultiLineChart>` con dos escenarios (Plan original en T.faint dashed + Curva real en T.green/T.red/T.accent solid 2.8). Mensaje comparativo reescrito: usa `realPortfolioAtLastReg` vs `planPortfolioAtLastReg` para "en línea / por delante / por detrás" con fechas de FI recalculadas (`ageAtFiReal` vs `ageAtFiPlan`) cuando están disponibles.
- `ScreenProyeccion`: cuando hay histórico registrado y no se está en probador, sustituye "Confirmados" por las curvas duales (Plan original + Curva real protagonista en verde/rojo). En probador y sin histórico se mantiene el comportamiento previo.
- Bug 4d (planned obsoleto): `totalPlannedSoFar` en `useDerived` y el "Tu plan dice X€" en `ScreenHoy` ya no leen el snapshot guardado en `month.planned`; ambos recomputan en vivo con `computePlannedFor`. La snapshot se mantiene en el estado por compatibilidad hacia atrás pero ya no se usa para mostrar nada al usuario.

### C5 · Inputs numéricos: barrido de calidad
- 5a · Onboarding capital inicial: verificado `EditableNumber` con `min=0 max=10_000_000` y chips `[0, 500, 2000, 5000, 15000, 50000]`. Acepta cifras grandes y 0. No requirió cambios.
- 5b · Ajustes edad / edad de jubilación: `EditableNumber` de Edad actual ahora detecta cuando `v >= retireAge` y aplica `updateProfile({ age: v, retireAge: v+1 })` en un solo update para evitar estado inconsistente. La Edad de jubilación ya tenía `min={profile.age + 1}`.
- 5c · Eventos: verificado que el input de importe es `type="number"` sin min, soporta valores negativos (proyectV2 los aplica como gasto puntual). `MonthInput` es `type="month"` sin restricción de fecha máxima — fechas hasta retireAge+30 admitidas nativamente. No requirió cambios.
- 5d · Warnings amber: añadido helper `RowWithWarning` (Row + micro-text amber italic 13). Aplicado a Retorno anual (>15%), Inflación esperada (>8%), Tasa de retiro (<3% o >6%) con copy explicativo. Esperanza de vida sin warning.
- 5d (extra) · Slider de Retorno en `ScreenProyeccion`: rango ampliado a `min=0 max=20` (era `min=1 max=15`) para coincidir con el de Ajustes. Warning amber inline cuando >15%.
