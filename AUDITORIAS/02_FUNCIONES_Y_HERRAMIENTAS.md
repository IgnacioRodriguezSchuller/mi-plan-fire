# Eje 2 · Funciones y herramientas — Hallazgos

> **Contexto.** El motor vive en `app/src/state/index.jsx` (`useDerived`, `usePlanMutators`, store con `update`/`updatePlan`/`seedDemo`) y `app/src/lib/index.js` (`projectV2`, `runMonteCarlo`, `computeIncomeFor`, `sumExpenses`). Las pantallas (`Screen*`) y overlays están en `app/src/screens/index.jsx`; modales en `app/src/modals/index.jsx`. La Proyección "Cartel" portó funciones de la antigua `ScreenProyeccionLegacy`/`ProyeccionEngine` (hoy muertas). Solo hallazgos aquí.

## Fortalezas
- **Mutadores CRUD completos** en `usePlanMutators`: `addIncome/updateIncome/deleteIncome` (ídem bonus, saving, events) + helpers `replaceIncomeWith`, `normalizeIncome`, `splitTramo`. Sin "setters muertos".
- **Recálculo en vivo**: editar gasto, ahorro %, importe/fechas de tramo o IPC actualiza hero, ★, número y curva sin recargar (verificado en sprints previos).
- **Multipersona** (`AccountsCard`, `miplan.accounts.v1`): cada persona es un plan aislado; crear/renombrar/eliminar.
- **Herramientas de datos** en Datos: exportar/importar JSON, cargar demo (con confirmación), borrar todo (con confirmación), volver al onboarding.
- **Declarar gasto en detalle**: overlay `GastoSheet` (5 categorías) que reusa el payload de `ActualLifeOnboarding` → el número FIRE pasa a usar `sumExpenses`.

---

## FN1 · Gastos/hipoteca/**asignación de activos** solo editables en el onboarding · **P1**
- **Evidencia.** `ActualLifeOnboarding` (pasos: gastos → hipoteca → asignación de activos → vista previa) escribe `plan.actualLife`. En vivo solo se reabre con **"Volver al onboarding"** (`reonboard`). `ScreenAjustes` **no** ofrece editar gastos ni asignación. `GastoSheet` (Proyección) cubre **solo gastos** (5 categorías), no hipoteca ni asignación.
- **Qué se observa.** Tras el onboarding, **la asignación de activos no es re-editable** salvo rehaciendo el flujo. Es el dato más escondido (alimenta `computeEffectiveCapitalReturn`, p. ej.).
- **Por qué importa.** Un usuario que cambia su cartera a los 6 meses no tiene dónde tocarlo sin rehacer onboarding. Capacidad central efectivamente "atrapada".

## FN2 · `GastoSheet` y `ActualLifeOnboarding` duplican la UI de gastos · **P1/P2**
- **Evidencia.** Ambos editan las mismas 5 categorías y escriben el mismo shape (`plan.actualLife.expenses`), pero son **componentes distintos** (`GastoSheet` en `screens`; paso 0 de `ActualLifeOnboarding`).
- **Qué se observa.** Dos formularios de gasto independientes.
- **Por qué importa.** Riesgo de divergencia (si se edita uno y no el otro, o si cambian las categorías) y doble mantenimiento. Candidato natural a un `ExpensesForm` compartido (sin tocar el invariante de no modificar el modal compartido por onboarding/«Sin mi plan»).

## FN3 · Código muerto colgado (Legacy + flag de doctrina) · **P1/P2**
- **Evidencia.** `ScreenProyeccionLegacy` y `ProyeccionEngine` están definidos y exportados pero **ningún tab los renderiza** (el `Shell` solo monta `ScreenProyeccion`). `const INCLUDE_POSSIBLE = false` (eventos posibles) se lee en 3 sitios sin UI de toggle.
- **Qué se observa.** ~500 líneas de pantalla viva-muerta + helpers solo usados por ella (`TramoListEditor`, `EventListEditor`, etc.).
- **Por qué importa.** Confunde sobre qué está activo, infla el bundle y arriesga edición accidental de código inerte. Decisión pendiente: archivar / eliminar / exponer como "modo".

## FN4 · `WhatIfCard` exportado pero nunca renderizado · **P2**
- **Evidencia.** `WhatIfCard` definido/exportado en `screens`; búsqueda de `<WhatIfCard` no aparece en ninguna pantalla viva.
- **Qué se observa.** Un sandbox "¿y si subo el aporte?" huérfano.
- **Por qué importa.** Es una herramienta potencialmente valiosa que quedó desconectada de la nueva Proyección.

## FN5 · `splitTramo` sin UI en el Cartel · **P2**
- **Evidencia.** Mutador `splitTramo` existe; `TramoRow` (Cartel) acepta `onSplit` pero **nadie se lo pasa** en `ScreenProyeccion`. La antigua `TramoListEditor` sí exponía "dividir".
- **Qué se observa.** No se puede partir un tramo (p. ej. una subida a mitad de año) desde la UI viva.
- **Por qué importa.** Pérdida de precisión para usuarios avanzados respecto a la versión anterior.

## FN6 · Modo real (`DisplayModeToggle`) sin exponer · **P2**
- **Evidencia.** `DisplayModeToggle` solo se usa dentro de `ProyeccionEngine` (muerto). `state.displayMode` **nunca se asigna** en la app viva; el modo nominal/real queda fijado.
- **Qué se observa.** La curva soporta nominal vs real, pero no hay control de usuario.
- **Por qué importa.** Se perdió una palanca pedagógica (ver cifras "de hoy" vs futuras) — y conecta con la tensión de vocabulario `CO1`.

## FN7 · "Importar JSON" sin confirmación ni preview · **P2**
- **Evidencia.** Exportar / Cargar demo / Borrar todo pasan por `ConfirmModal`; **Importar** abre `<input type="file">` y aplica directamente.
- **Qué se observa.** Importar sobrescribe el estado sin "¿seguro?" ni vista previa, y sin deshacer.
- **Por qué importa.** Un fichero antiguo o equivocado machaca datos reales sin red de seguridad.

## FN8 · `PublicPensionCard` asume base de cotización = ingreso · **P2**
- **Evidencia.** Auto-estima con `computeIncomeFor(plan, todayKey())`. No hay campo "tipo de cotización" en el perfil.
- **Qué se observa.** En multipersona (pareja sin ingresos, autónomo, no cotizante) la estimación de pensión sale distorsionada.
- **Por qué importa.** Coherencia rota del cálculo de pensión al cambiar de persona.

## FN9 · `HouseholdSummaryCard` ocupa sitio con 1 sola persona · **P3**
- **Evidencia.** Se renderiza en `ScreenHoy` aunque `list.length === 1`.
- **Qué se observa.** Card de "hogar" sin contenido útil en el caso común (un solo usuario).
- **Por qué importa.** Ruido/espacio desperdiciado; debería aparecer solo con ≥2 personas.

## FN10 · Robustez: ingreso → 0 cuando el último tramo cierra antes del horizonte · **P2**
- **Evidencia.** Con el demo **sucio** (2º tramo de salario cerrado en may-2030), "Ver el cálculo completo" (`SinMiPlanModal`) imprime «tu salario habrá crecido hasta **0 €/mes**» y la curva cae a 0. El demo **canónico** lo evita con `to:null` en el último tramo.
- **Qué se observa.** Si no hay tramo de ingreso vigente, el ingreso es 0 y el copy derivado se vuelve absurdo ("0 €").
- **Por qué importa.** Caso de borde real (un usuario puede cerrar su último tramo): la app debería clamping/avisar en vez de mostrar "0 €". Severidad acotada porque el demo correcto no lo dispara.

---

### Inventario rápido de controles por pantalla
| Pantalla | Controles principales (qué disparan) |
|---|---|
| **Hoy (Plan)** | Mayormente derivado/lectura. CTAs: «Ver el cálculo completo» (→`SinMiPlanModal`), «Profundizar en Proyección», «+ Supuestos». Ruta de 5 fases (toggles manuales `phaseManualChecks`). |
| **Proyección** | `EditableValue` gasto/ahorro%/importes; `CartelMonthValue` fechas; IPC (`salaryInflationFactor`); añadir/borrar tramo (`addIncome`/`deleteIncome`…); «Desglosar mi gasto» (→`GastoSheet`); CTA «Ir a Mes a mes». |
| **Seguimiento** | `MonthRow` (PLAN/REAL/NOTA → `setMonth`); `HitosEditor` (CRUD metas: `addGoal`/`updateGoal`/`removeGoal`); reparto de ingreso (lectura). |
| **Datos (Ajustes)** | Perfil (`EditableNumber` nombre/edad/jubilación/capital); pensión (activar/estimar); personas (crear/renombrar/eliminar); export/import/demo/borrar/reonboard. |
| **Aprende** | Pestañas Conceptos/El Tablón/Glosario; filtro por nivel; abrir `ConceptModal`; marcar leído (`readLessons`). |
