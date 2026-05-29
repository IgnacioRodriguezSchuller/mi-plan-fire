# CHANGELOG mi_plan_v1_0.html

**Versión v1.0 · sello del Sprint v1.0**

Documento consolidado del sprint (v5.6 → v5.11 → v1.0). Los changelogs intermedios se conservan en el filesystem como referencia histórica, pero el canon a partir de aquí es este.

Trabajo realizado sobre `mi_plan_v5_5.html` como base. Resultado: `mi_plan_v1_0.html`.

---

## A · Renombrados, micro-fixes y movimientos sencillos *(v5.6)*

- **Nav tab "Hoy" → "Mi Plan"** en el array de tabs del `Shell` (mobile y desktop). Nombre interno `id: 'hoy'` y la clave `state.activeTab === 'hoy'` se preservan: cero impacto en estado persistido.
- **Cabecera de pantalla "Hoy, {fecha}" → "Mi Plan · {fecha}"** en `ScreenHoy`. El "·" mantiene la legibilidad del patrón fecha contextualizada.
- **`DisplayModeToggle`: "€ Futuro" → "€ con inflación", "€ Hoy" → "€ sin inflación"**. IDs internos `'nominal'` / `'real'` y `state.displayMode` intactos. Renombrado propagado a todos los call-sites visibles: `RetirementCard`, `MonteCarloCard`, `ScreenSinMiPlan` Verdad 2, onboarding paso 8, glossary del concepto inflación.
- **Stacked charts · convención**: en `FlowTimelineCard`, la serie de mayor magnitud (`life`, ~80% del ingreso) va al fondo del stack; `invest` se apila encima. Los demás charts apilados (MonthlyFlowCard, HouseholdSummaryCard, mortgage bars) no son stacked verticales tradicionales y no aplica.
- **Hitos no precargados para usuarios nuevos**: `defaultGoals()` devuelve `[]`. Usuarios existentes con hitos guardados los conservan. Placeholder editorial: *"Aún no has añadido ningún hito a tu plan. Los hitos son metas intermedias (un colchón de liquidez, comprar una vivienda, pagar la entrada, etc.) que te ayudan a estructurar tu camino. Añade el primero cuando quieras."*
- **Tramos colapsables cuando N > 5**: `TramoListEditor` con state local `expanded`. Renderiza primeros 2 + botón "+ N tramos intermedios" + últimos 2. Botón `↑ Colapsar` cuando expandido.

## B · Movimiento de configuración a Ajustes *(v5.7)*

- **Nav final de 5 secciones en orden estricto**: `◐ Mi Plan · ◢ Proyección · ◧ Seguimiento · ◇ Aprende · ◌ Ajustes`. Mobile y desktop con la misma estructura.
- **`HitosEditor` extraído** como componente módulo (antes inline en `ScreenPlan`). Insertado en `ScreenAjustes` entre Eventos y Cuentas.
- **`ScreenPlan` deprecado** como ruta. Stub que muestra "se ha movido a Ajustes". Normalización legacy en `Shell`: `useEffect` que cambia `activeTab === 'plan'` a `'ajustes'` al montar.
- **"Sin Mi Plan" deja la nav**. El componente `ScreenSinMiPlan` queda accesible vía router pero no se lista en la nav. La integración real (desplegable) llega en D.
- **`ScreenSeguimiento` esqueleto** con 3 bloques: Mensual (`ScreenMesAMes`), Hitos (read-only `HitosOverview`), Reparto del ingreso (`FlowTimelineCard`).
- **`HitosOverview`** nuevo componente: vista de seguimiento con barras de progreso, % logrado e indicador "En camino / Vas justo". Sin edición (la edición vive en Ajustes).
- **Placeholder "Supuestos editables"** en `ScreenProyeccion` (dashed Card) anunciando lo que llega en D.
- Router actualizado en mobile y desktop. Normalización legacy: `activeTab: 'plan'` → Ajustes, `activeTab: 'mes'` → Seguimiento.

## C · Landing pre-onboarding *(v5.8)*

- **Nuevo componente `LandingPreOnboarding`** — primera pantalla del flujo para usuario nuevo. Título display "Mi *Plan* **FIRE**" + subtítulo bilingüe FIRE + 3 párrafos prose serif + 3 bullets accent uppercase (Privacidad verificable / Sin gurús / Honesto cuando incomoda) + 2 CTAs ("Empezar →" + "Antes, quiero saber más →"). Max 600px, centrado.
- **Nuevo componente `WhyDifferentModal`** — manifiesto modal con 5 bloques: Privacidad verificable, Camino B en regulación, No impone un tipo de FIRE, Sin retención artificial, Honesto cuando incomoda. Estilo coherente con `ConceptModal`. Copy derivado del manifiesto editorial documentado.
- **Flag de persistencia `state.hasSeenLandingPreOnboarding`**:
  - `false` por defecto en `emptyState()`.
  - `true` en `seedState()` (el demo bypassea la pre-landing).
  - Migración idempotente: usuarios con `onboardingComplete=true` reciben `true` (no ven la nueva landing al cargar).
- **Flujo del usuario nuevo**: pre-onboarding → Landing actual → onboarding 9 pasos → dashboard.

## D · Mi Plan en tres movimientos + Sin Mi Plan integrado + Supuestos editables *(v5.9)*

- **`ScreenHoy` reescrita como narrativa de tres movimientos**, abandonando el dashboard de cards desconectadas:
  - **Movimiento 1 · Dónde estás** — prosa cohesionada con KPIs incrustados (patrimonio, salario, gasto, ahorro, % saving rate) + frase de horizonte.
  - **Movimiento 2 · Hacia dónde vas** — prosa con asunciones inline (`{planReturn}% anual`, `{withdrawalRate}%`), patrimonio nominal vs real, retiro mensual equivalente, juicio de suficiencia coloreado, badge grande con % Monte Carlo (200 trials, calculado en useEffect debounced) + CTA `Profundizar en Proyección →`.
  - **Movimiento 3 · Siguiente paso** — card con `borderLeft: 3px solid T.accent`. Contenido decidido por el rule engine `computeNextStep(state, d)`.
- **`computeNextStep` rule engine** con 5 reglas en prioridad:
  1. No hay hito de liquidez (regex sobre `goals[].name`).
  2. No hay aporte mensual.
  3. Tasa de ahorro < 15%.
  4. Allocation conservadora (RV < 30%) con horizonte > 15 años (solo si `actualLife.completed`).
  5. Default: optimización fiscal (sin CTA navegable, marca v1.x).
- **Bloques sacados de Mi Plan**: `MonteCarloCard` → Proyección. `MonthlyFlowCard` → Seguimiento (wrapper `MonthlyFlowBlock`). `FlowTimelineCard` ya estaba en Seguimiento. `FinancialHealthCard`, `RetirementCard`, `LifecycleChart`, `WhatIfCard`, `NextGoalCard`, "Este mes", cards editoriales: eliminados. Componentes legacy se mantienen en el archivo por si se reutilizan.
- **Sin Mi Plan integrado como desplegable** al final de Mi Plan: cabecera "¿Y si no tuviera plan?" + indicador `Desplegar ▾`. Al expandir renderiza `<ScreenSinMiPlan embedded />` (nuevo prop oculta su header). Al final del desplegable, CTA `Profundizar (Pro) →` navega a `SinMiPlanProPlaceholder`.
- **Nueva pantalla `SinMiPlanProPlaceholder`** con lista de funcionalidades Pro futuras (FIRE perfilado, reconversión, DCA personalizado, etc.) + botón Volver.
- **`SupuestosEditables` en Proyección**: 5 `EditableNumber` (inflación, retorno, tasa retiro, edad FIRE, esperanza vida). State local de overrides en `ScreenProyeccion`. `effectivePlan = { ...plan, ...planOver }` y `effectiveProfile.retireAge` con override. Las 3 llamadas a `projectV2` y el `MonteCarloCard` reciben effective*. Badge `⚠ supuestos modificados · solo en esta sesión` cuando hay overrides; por-campo badge `modificado` amber + cifra en amber + nota `original: X`. Botones `Aplicar a mi plan` + `Restaurar valores de Ajustes`. Cuando `sandboxActive`: componente con opacity 0.6 y nota aclaratoria.
- **Mi Plan NO se ve afectada por overrides** porque lee `state.plan`/`state.profile` directamente vía store. Verificado.

## E · Sistema free/pro + Monte Carlo dividido *(v5.10)*

- **Flag `state.isPro`** (boolean, default `false`). Migración idempotente en `migrateToV2`.
- **`MonteCarloCard` condicionado por `isPro`** sin extraer dos componentes (cuerpo único con bloques condicionales):
  - **Free**: chart con solo banda exterior p10-p90 + líneas tenues p10/p90 + mediana sólida. Leyenda 2 entradas (Mediana, Rango plausible). SoR toggle oculto. `OnboardingHelp` (¿Cómo leer? + Supuestos) ocultos. Bloque "Si el plan falla" oculto. CTA Pro discreto al final. `useEffect` resetea `sequenceMode` a `'random'` cuando isPro pasa a false.
  - **Pro**: todo el render de v5.5 (5 bandas, SoR toggle, plegables, depletion). CTA Pro oculto.
- **`AllocRow` editable solo en Pro** — recibe `isPro` como prop. Free: rentabilidad como texto plano. Pro: `EditableNumber` con rango ampliado `-50% a +50%`.
- **Toggle testing + inventario Pro en Ajustes** — Card al final con borde dashed: checkbox `Activar modo Pro (solo para testing en desarrollo)` + (cuando activo) lista "Funcionalidades Pro activas" con 9 ítems (2 activos + 7 próximamente).
- **Toggle Pro testing marcado como temporal** — documentado en la propia Card y en CHANGELOG. Se eliminará o se condicionará a variable de entorno antes del lanzamiento público real (post Sprint 2).
- Motor `runMonteCarlo` y firma intactos. La división free/Pro es puramente de presentación.

## F · Onboarding pulido + Aprende por niveles *(v5.11)*

### F1 · Onboarding pulido
- **F1.1 · Aporte porcentual vs fijo** — en step 5, bloque inline visible que define Fijo vs Porcentual + preview en directo "Con tu salario actual de X €/mes, esto serían Y €/mes de aporte".
- **F1.2 · Neto destacado** — step 4 con badge `NETO` accent + párrafo aclaratorio neto vs bruto + ejemplo concreto (35.000 €/año bruto → 2.000 €/mes neto).
- **F1.3 · "/mes" visible** — auditados todos los inputs mensuales del onboarding; ya mostraban "€/mes" o "%/mes" como sufijo. Confirmado sin cambios.
- **F1.4 · Tope explanation** — en step 6 Escalonado, micro-explicación inline del concepto "Tope" (salario máximo de la carrera).
- **F1.5 · Variable inline** — el step 6 Variable ya no redirige a Ajustes. Configurador inline para hasta 4 tramos (`Salario inicial` + tramos con `Empieza a los N meses` + botón `+ Añadir tramo`). Nuevo state `data.variableSegments` propagado a `livePlan` y `finish()`.
- **F1.6 · Paso 8 simplificado** — mantiene las dos verdades calculadas (erosión salarial + coste oportunidad). Eliminado el CTA "Descubre más" y el modal `ActualLifeOnboarding` embebido en el onboarding inicial. Reemplazado por nota apuntando a "Mi Plan → ¿Y si no tuviera plan? → Profundizar (Pro)". State `showActualLifeModal` eliminado.

### F2 · Aprende por niveles
- **F2.1 · Mapping `LEARN_LEVELS`** — tres niveles con ids precisos: `esencial` (12 conceptos), `profundizando` (13), `avanzado` (10). Helpers `LEARN_LEVEL_LABELS`, `LEARN_LEVEL_SUB` y lookup inverso `LEARN_LEVEL_BY_ID` precomputado.
- **F2.2 · Vista por tarjetas** — tab "Conceptos" (renombrado desde "Artículos") con grid responsive. Cada tarjeta: icono SVG arriba-izquierda, tag de nivel arriba-derecha, título display 20px, descripción 1 línea en serif 13 muted, hover accent. Grid 3/2/1 columnas según ancho.
- **F2.3 · Filtro por nivel** — 4 sub-tabs en Conceptos: Esencial (default) / Profundizando / Avanzado / Todos. Subtítulo italic-muted descriptivo por nivel. Nav primaria de Aprende reordenada: Conceptos default, Tablón y Glosario intactos.
- **F2.4 · Lección individual sin cambios** — click en tarjeta abre `ConceptModal` exactamente como antes.
- **F2.5 · Iconos SVG** — nuevo componente `<LearnIcon id size color />` con 12 SVGs trazados a mano para los Esencial (curva exponencial, flecha, ondas, bóveda, reloj de arena, calendario con flecha, etc.). Trazo único `T.ink` 1.6, viewBox 36×36. Conceptos sin icono dedicado usan fallback (rombo abstracto). Los 23 conceptos restantes pueden recibir icono propio en v1.x.

## G · Sellado v1.0

### G1 · Cabecera AGPL-3.0
- Comentario HTML añadido entre `<!DOCTYPE html>` y `<html lang="es">`. Incluye placeholder literal `[TU NOMBRE]` (sin sustituir — el autor lo rellena manualmente antes de publicar). Versión `1.0`. Recordatorio explícito de "single-file local-first, no backend, no telemetry, no tracking".

### G2 · Versión visible
- `<title>Mi Plan FIRE</title>` verificado sin cambios.
- Auditadas las menciones de "v5.x" en el código: todas viven en comentarios internos (`// v5.X · ...`). Sin strings visibles al usuario que requieran sustitución.
- Las menciones de "v1.x" en copy (referencias a funcionalidades próximas) se mantienen — apuntan al roadmap post-v1.0.

### G3 · Changelog consolidado
- `CHANGELOG_v1_0.md` (este documento) sustituye como canon a los changelogs intermedios `CHANGELOG_v5_6.md` a `CHANGELOG_v5_11.md`. Los intermedios se mantienen como referencia histórica.

### G4 · `CLAUDE_CODE_CONTEXTO.md` actualizado
- Estructura del archivo refleja v1.0: nav final de 5 secciones, narrativa de tres movimientos en Mi Plan, sistema free/Pro, Aprende por niveles, Landing pre-onboarding, onboarding pulido, hitos no precargados, vocabulario "Con inflación / Sin inflación".
- Secciones evergreen (Filosofía, Tono, Convenciones de código, LEARN_CORPUS, Migración de estado, Lo que no debe hacerse, etc.) conservadas y aumentadas donde aplica.
- Nueva sección "Historia v5.6 → v1.0" con una línea por sub-prompt del sprint.

---

## Verificación global v1.0
- Sintaxis Babel: OK tras cada sub-prompt del sprint.
- Runtime Playwright + Chromium headless con todas las dependencias locales:
  - Flujo completo del usuario nuevo (pre-onboarding → landing → onboarding 9 pasos → dashboard): cero `pageerror`.
  - Navegación por las 5 tabs: cero errores en consola.
  - Toggle Pro funcional (free → Pro → free): MonteCarloCard se reorganiza, allocation editable activa/desactiva, inventario aparece/desaparece.
  - Supuestos editables en Proyección modifica chart y MonteCarlo en la sesión sin afectar Mi Plan.
  - Aprende con tabs de nivel y tarjetas con icono; click abre ConceptModal.
- Babel emite warning informativo de "deoptimised styling" porque el archivo supera 500KB (8.783 líneas, ~485KB del bloque JSX). No es error.

## Compatibilidad hacia atrás
- Estado persistido en `localStorage` (clave `mi-plan-state` wrapped en `miplan.accounts.v1`): intacto.
- Migración idempotente de los campos nuevos: `hasSeenLandingPreOnboarding`, `isPro`. Usuarios existentes con `onboardingComplete=true` no ven la nueva landing al cargar v1.0.
- Convenciones internas: `id: 'hoy'`, `id: 'plan'` (legacy normalizado), `state.activeTab`, `state.displayMode`, `state.sandbox`, `sandboxActive`, etc. intactos.
- Motor `projectV2` y `runMonteCarlo`: firmas preservadas, solo aditivos opcionales.

## No se hace en este sprint (roadmap explícito)
- No PWA · Sprint 2
- No GitHub público · Sprint 2
- No landing en miplanfire.com · Sprint 2
- No Plausible Analytics · Sprint 2
- No newsletter · Sprint 3
- No paywall real · Sprint 4 (condicional)
- No iconos para los 23 conceptos de Profundizando/Avanzado · v1.x si hay demanda
- No reescritura del motor de proyección
- No cambio de claves de localStorage
