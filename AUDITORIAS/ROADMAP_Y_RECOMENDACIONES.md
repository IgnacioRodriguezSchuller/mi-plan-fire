# Roadmap y recomendaciones — Mi Plan FIRE

> **Qué es esto y cómo usarlo.** Esto es **mi opinión priorizada** (Claude Code), separada de los hallazgos a propósito: léela en paralelo a lo que te diga **Claude en chat** y quédate con la síntesis. Cada bloque enlaza los **IDs de hallazgo** (ver los 6 docs de eje), propone una **dirección**, y trae un **prompt listo para pegar** en una sesión de Claude Code. Todo respeta los invariantes del proyecto (no tocar `projectV2`/`runMonteCarlo`/`migrateToV2`/baseline/`LEARN_CORPUS`/claves localStorage; color por tokens; `appearance:none`; **un prompt → repaso → commit**).
>
> **Antes de nada:** Datos → **Cargar datos demo** (el demo en localStorage estaba sucio durante la auditoría).

---

## TL;DR — orden que yo seguiría
1. **P0 · Fuente única de "¿voy bien?"** (ST1/GX1) — lo único que rompe confianza. Primero.
2. **P1 rápidos** (quick wins): `ED3` (clip de meta), `CN3` (landings redundantes), `GX3` (CTA concreto), `ST4`/`CN4` (KpiPill).
3. **P1 estructural · edición de gasto/asignación** (FN1/FN2/CN1) — devuelve una capacidad central.
4. **P1 · decisión de vocabulario "€ de hoy"** (CO1) — necesita que Nacho decida convención.
5. **Limpieza** (FN3/FN4/FN6 + CN2) — borra/archiva código muerto antes de la Fase 2.
6. **P1 grande · Cartel Fase 2** (ED1 + ED2/ED4) — unificar el sistema visual. Es el ESTADO #10.
7. **P2/P3** por temas (densidad de Hoy GX2, Aprende CO3-CO6, etc.).

---

## TEMA 1 — Fuente única de "¿voy bien?" (P0)
**Resuelve:** `ST1`, `GX1`, y de rebote `ST2`. **El más importante.**

**Diagnóstico.** Tres señales (`destinoEstado` vs `retireAge`; `realVsPlanDelta`; `avgActual ≥ currentAporte`) producen veredictos contradictorios ("tarde" / "por delante" / "por detrás") en la misma sesión. `ageAtFiReal` y `ageAtFiPlan` **ya existen** en `useDerived`.

**Dirección recomendada.** Definir **un** veredicto canónico en `useDerived` y que **todas** las pantallas lo consuman:
- `verdict` ∈ { `adelantado`, `en-linea`, `atrasado`, `sin-datos`, `no-llega` } derivado de comparar `ageAtFiReal` vs `ageAtFiPlan` (con un umbral de tolerancia, p. ej. ±0.5 años para "en línea").
- Un único `verdictCopy` (frase + tono) y un único `verdictAge` (la edad de libertad protagonista).
- Hoy, Seguimiento (arriba y NextStep) y el `KpiPill` leen `verdict`/`verdictAge`. Se retira `avgActual ≥ currentAporte` como criterio de veredicto (puede quedar como dato secundario "tu ritmo este mes", sin etiqueta de "vas bien/mal").

**Por qué así.** `ageAtFiReal` vs `ageAtFiPlan` es honesto (proyecta a horizonte), accionable (una edad) y único (misma métrica en todas partes). "Media de aportes" mide otra cosa y por eso contradice.

**Dependencias.** Ninguna; usa variables existentes. Hacer **antes** de tocar copy de NextStep en otras tareas.

**Invariantes/riesgos.** Solo `useDerived` (derivados) + lectura en pantallas; no toca el motor (`projectV2`) ni `migrateToV2`. Verificar que `ageAtFiPlan` no sea `null` en casos límite (capar como hace el resto).

> **PROMPT (pegar en Claude Code):**
> «En `app/src/state/index.jsx` (`useDerived`), añade un veredicto único `verdict` y `verdictAge` derivados de comparar `ageAtFiReal` con `ageAtFiPlan` (tolerancia ±0.5 años → `en-linea`; maneja `null` → `sin-datos`/`no-llega`). Exporta `verdict`, `verdictAge` y un `verdictCopy` (frase sobria + tono accent/amber/green) en el objeto de retorno, con defaults en lectura. Luego haz que `ScreenHoy` ("Tu destino" + su `NextStep`), `ScreenSeguimiento` (mensaje superior + `NextStep` inferior) y el `KpiPill` consuman SOLO `verdict`/`verdictAge`/`verdictCopy`. Elimina el uso de `avgActual ≥ currentAporte` como criterio de veredicto (déjalo, si acaso, como dato neutro "tu ritmo este mes"). No toques `projectV2`/`runMonteCarlo`/`migrateToV2`. DoD: en la misma sesión, Hoy y Seguimiento dan el MISMO veredicto; build OK, 4 verificadores sin diffs nuevos, consola limpia. Un commit + entrada en CHANGELOG.»

---

## TEMA 2 — Superficies de edición (gasto/asignación) (P1)
**Resuelve:** `FN1`, `FN2`, `CN1`.

**Diagnóstico.** La **asignación de activos** solo se edita en el onboarding; los **gastos** se editan por dos vías que pueden divergir (`GastoSheet` y `ActualLifeOnboarding`).

**Dirección recomendada.**
1. Extraer un `ExpensesForm({expenses, onSave})` reutilizable; que lo usen **tanto** `GastoSheet` como el paso de gastos de `ActualLifeOnboarding` (sin alterar el contrato del modal compartido).
2. Añadir en **Datos** una tarjeta "Tu situación económica" con botón "Editar gastos y asignación" que abra el flujo de `ActualLifeOnboarding` en modo edición (preservando `plan.actualLife`, sin rehacer todo el onboarding).

**Dependencias.** Idealmente tras la limpieza (Tema 4) para no duplicar trabajo sobre código que se va.

**Invariantes/riesgos.** No cambiar el shape de `plan.actualLife` ni `migrateToV2`. Cuidado: `ActualLifeOnboarding` lo comparten onboarding y "Sin mi plan" — reutilizar sin romper esos llamadores.

> **PROMPT:** «Crea `ExpensesForm({expenses,onSave})` (5 categorías, total en vivo, estilo Cartel) y haz que `GastoSheet` lo use. Añade en `ScreenAjustes` una tarjeta "Tu situación económica" con un botón que abra `ActualLifeOnboarding` en modo edición preservando `plan.actualLife` (gastos+hipoteca+asignación). No cambies el shape persistido ni `migrateToV2`. DoD: editar asignación desde Datos persiste y recalcula el retorno; "Sin mi plan" sigue leyendo bien. Un commit + changelog.»

---

## TEMA 3 — Limpieza: código muerto y entradas redundantes (P1/P2)
**Resuelve:** `FN3`, `FN4`, `FN6`, `CN2`, `CN3`.

**Dirección recomendada.**
- **Decidir** (requiere Nacho, ver abajo) el destino de `ScreenProyeccionLegacy`/`ProyeccionEngine`: archivar en `src/legacy/` o eliminar. Recomiendo **eliminar** (el baseline congelado ya es la red de regresión) salvo que quieras "modo anterior".
- `WhatIfCard`: o se integra en Proyección como sandbox "¿y si subo el aporte?", o se elimina. Recomiendo **integrarlo** (es valioso) en un sprint aparte; si no, borrarlo.
- `DisplayModeToggle`/modo real: decidir si se expone en "Asunciones" o se retira. Conecta con `CO1`.
- Landings (`CN3`): dejar **una** entrada clara ("Ver la presentación") y retirar/renombrar "visual antigua".

**Invariantes/riesgos.** No tocar el baseline. Al borrar, recablear `verify-lib` si procede (como en limpiezas previas).

> **PROMPT (limpieza mínima, sin decisiones de producto):** «Elimina el código muerto de la Proyección antigua: `ScreenProyeccionLegacy`, `ProyeccionEngine` y los helpers que solo ellos usan (`TramoListEditor`, `EventListEditor`, `DisplayModeToggle` si queda huérfano), más imports muertos. NO toques `ScreenProyeccion` (Cartel) ni el baseline. En `ScreenAjustes`, unifica las dos entradas de presentación en una sola ("Ver la presentación de Mi Plan FIRE"). DoD: build OK, 4 verificadores sin diffs nuevos, consola limpia, ninguna referencia rota. Un commit + changelog.» *(Antes, confirmar con Nacho qué hacer con `WhatIfCard` y el "modo real".)*

---

## TEMA 4 — Cartel Fase 2: unificar el sistema visual (P1, grande)
**Resuelve:** `ED1`, `ED2`, `ED4`, y de paso `GX6` (descubribilidad).

**Diagnóstico.** Conviven dos dialectos (Cartel serif vs mono-caja). Es el pendiente **ESTADO #10**.

**Dirección recomendada (por fases, no de golpe).**
1. **Extraer tokens del Cartel**: `CartelCard`, `CartelBtn` (serif, accent, sin uppercase), eyebrow serif, medidas. Documentar qué se relaja fuera de Proyección de la doctrina "sin movimiento".
2. **Migrar `ScreenHoy` primero** (es la cara de entrada y la más densa → combinar con Tema 6). Luego `ScreenSeguimiento`, luego `ScreenAjustes`. `ScreenAprende` ya está cerca.
3. Reemplazar `Btn`/`Pill`/`Label` mono por las primitivas Cartel donde aplique; eyebrows mono → eyebrow serif salvo donde el 11px mono sea intencional.

**Dependencias.** Hacer **después** de la limpieza (Tema 3) y de definir el veredicto único (Tema 1, porque cambia textos de Hoy/Seguimiento).

**Invariantes/riesgos.** Color solo por tokens; mantener `appearance:none`; no romper `verify-tokens` (mover, no inventar valores). Grande → varios commits (uno por pantalla).

> **PROMPT (paso 1):** «Crea en `app/src/ui/cartel.jsx` (o un nuevo `ui/cartel-system`) primitivas reutilizables `CartelCard`, `CartelBtn` y un eyebrow serif, tokenizando lo que hoy está inline (bordes `PosterFrame`, `MonteCarloBand`, `addTramoStyle`, `ctaBtn`). Extrae los 2 `rgba()` literales (`ED6`) a constantes nombradas. No cambies el render de Proyección visualmente. DoD: galería (`?gallery`) muestra las primitivas; build OK; verify-tokens sin diffs nuevos. Un commit + changelog. (Migración de pantallas en commits siguientes.)»

---

## TEMA 5 — Vocabulario (P1/P2)
**Resuelve:** `CO1` (€ de hoy), `CO4` ("tu número"), `ST3` (nombres del destino), `ST4` (header).

**Dirección recomendada.**
- `CO1`: **decisión de Nacho** sobre convención (ver abajo). Una vez decidida, barrido de strings.
- `ST3`: elegir **un** nombre canónico para el destino (sugiero "edad de libertad") y usarlo en todas las pantallas; "En limpio"/"Tu destino" se alinean.
- `ST4`: que el `KpiPill` muestre la **edad de libertad** (`verdictAge`) además/en vez del capital a `retireAge`, para que header y relato coincidan.
- `CO4`: alias "tu número" en el glosario apuntando a "regla del 4 %".

> **PROMPT (tras decidir CO1 y el nombre canónico):** «Unifica el nombre del destino a "edad de libertad" en `ScreenHoy`/`ScreenProyeccion`/`ScreenSeguimiento`. Haz que `KpiPill` muestre la edad de libertad (`verdictAge`). Aplica la convención decidida para "€ de hoy" en todo el JSX visible. Añade alias "tu número" en el glosario (`content/index.js`) apuntando a "regla-4" SIN tocar `LEARN_CORPUS` existente. DoD: build OK, verificadores sin diffs nuevos. Un commit + changelog.»

---

## TEMA 6 — Densidad y guía de Hoy (P1/P2)
**Resuelve:** `GX2`, `GX3`, `GX4`, `GX5`.

**Dirección recomendada.**
- **Jerarquía en Hoy**: un foco por pantalla. Mover el detalle (fork, monedas, renta) a un "Más detalles" o a Proyección; dejar en Hoy: patrimonio + un mensaje de dirección (veredicto único) + ruta resumida + 1 siguiente paso.
- **NextStep concreto** (`GX3`): verbo + destino exacto ("Sube tu aporte en Proyección", "Baja tu objetivo de gasto").
- **Fases** (`GX4`): reforzar afford. de clicable y dar feedback/destino al marcar un paso.
- **Empieza aquí** (`GX5`): bloque de 3 pasos para usuario nuevo que desaparece al completarse.

> **PROMPT (densidad):** «Reordena `ScreenHoy` para tener UN foco: (1) patrimonio, (2) dirección (veredicto único + edad de libertad), (3) ruta de 5 fases resumida, (4) un único `NextStep` con CTA concreto (verbo + pantalla destino). Mueve fork/monedas/renta detallados a un desplegable "Ver más" o a Proyección. Añade un bloque "Empieza aquí" (3 pasos) visible solo si faltan datos clave. No dupliques disclaimers. DoD: Hoy cabe en ~2 scrolls; build OK; consola limpia. Un commit + changelog.»

---

## TEMA 7 — Robustez y herramientas (P2)
`FN7` (confirmar import), `FN8` (cotización en pensión multipersona), `FN9` (`HouseholdSummaryCard` solo si ≥2), `FN10` (clamp de ingreso 0 → copy sano), `ED5` (`appearance:none` en select de metas y sliders de onboarding), `ED7` (comentar invariante hero/accent).

> **PROMPT (lote de robustez):** «Aplica: (a) confirmación+preview al importar JSON en `ScreenAjustes`; (b) `appearance:none`+`WebkitAppearance:none` al `<select>` de categoría de `HitosEditor` y a los `input[type=range]` del `Onboarding`; (c) en `HouseholdSummaryCard`, no renderizar si hay 1 sola persona; (d) clamp/aviso cuando el ingreso vigente es 0 para que "Sin mi plan" no imprima "0 €/mes"; (e) comentario en `Stats3`/`ComputedNumber` fijando "cifra hero nunca `T.accent`, salvo ★ edad de libertad en `T.green`". DoD: build OK; verificadores sin diffs nuevos; dark-mode sin fondos negros en esos inputs. Un commit por sub-ítem o un commit agrupado con changelog.»

---

## TEMA 8 — Aprende (P2/P3)
`CO3` (niveles↔corpus), `CO5` (TABLON dinámico), `CO6` (documentar modelo), `CO7` (regla emojis/símbolos), `ED8` (consolidar iconos).

> **PROMPT:** «Reconcilia `LEARN_LEVELS` con `LEARN_CORPUS` en `content/index.js`: lista los IDs de `LEARN_LEVELS` sin entrada en `LEARN_CORPUS` y, SIN inventar contenido editorial, o bien quítalos de los niveles o bien deja un stub marcado "pendiente de redacción" (a decidir con Nacho). Documenta en un comentario qué pestaña de Aprende renderiza qué (Conceptos/El Tablón/Glosario). No alteres el texto cerrado de `LEARN_CORPUS`. DoD: ningún concepto citado en niveles queda sin destino; verify-content OK. Un commit + changelog.»

---

## Decisiones de producto que necesito de Nacho (no las decido yo)
1. **Convención "€ de hoy"** (`CO1`): ¿eliminar, renombrar ("valor 2026" / "poder de compra de hoy"), o solo bajo un toggle de "modo real"? → desbloquea Tema 5 y `FN6`.
2. **Código muerto** (`FN3`/`CN2`): ¿eliminar la Proyección antigua o archivarla como "modo anterior"?
3. **`WhatIfCard`** (`FN4`): ¿integrar el sandbox "¿y si…?" en Proyección o eliminar?
4. **Modo real** (`FN6`): ¿exponerlo como control o retirarlo?
5. **Aprende** (`CO3`): para los conceptos citados sin artículo (tramo, lean/coast, irpf…), ¿redactar contenido nuevo (rompe el "corpus cerrado", requiere tu visto bueno) o quitarlos de los niveles?
6. **Nombre canónico del destino** (`ST3`): ¿"edad de libertad" como término único?

## Quick wins (poco esfuerzo, alto valor)
- `ED3`: arreglar el clip del nombre de meta (overflow del `<input>` bajo el badge) en `GoalRow`.
- `CN3`: dejar una sola entrada de presentación en Datos.
- `CN4`/`ST4`: `cursor:pointer`+hover en `KpiPill` y mostrar la edad de libertad.
- `GX3`: CTAs de NextStep con verbo + destino concreto.
- `CO2`: quitar el disclaimer duplicado del cierre del Cartel (dejar el del footer).

## Sugerencia de secuencia (sprints de "un prompt → repaso → commit")
```
S1  P0 veredicto único (Tema 1)                 ← primero, cambia textos de Hoy/Seguimiento
S2  Quick wins (ED3, CN3, CN4/ST4, CO2, GX3)
S3  Limpieza código muerto + landings (Tema 3)  ← requiere decisiones 2,3,4
S4  Edición gasto/asignación (Tema 2)
S5  Vocabulario (Tema 5)                          ← requiere decisión 1,6
S6  Cartel Fase 2 · paso 1 primitivas (Tema 4)
S7  Cartel Fase 2 · migrar Hoy + densidad (Tema 4+6)
S8  Cartel Fase 2 · migrar Seguimiento, Datos
S9  Robustez (Tema 7) + Aprende (Tema 8)
```
