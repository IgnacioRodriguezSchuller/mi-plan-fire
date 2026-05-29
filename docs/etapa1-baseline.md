# Etapa 1 · Baseline pre-migración

> **Fecha:** mayo 2026
> **Archivo congelado:** `mi_plan_v1_5_0a_3.html` (9.372 líneas)
> **Punto de retorno git:** tag `baseline-pre-migracion`
> **Propósito:** foto exacta de qué hace y qué contiene la app monolítica HOY, antes de migrarla por etapas a `/src` con build de archivo único (tipo Vite). Esta es la red de seguridad y el examen de regresión que cada paso posterior debe pasar idéntico.

Este documento **no** cambia ni una línea del HTML. Es solo inventario y contrato.

---

## 1 · Checklist de regresión (verificada en runtime)

Verificada con Playwright + Chromium headless (1280×900) sobre una copia local de `mi_plan_v1_5_0a_3.html` (scripts CDN reescritos a locales solo para el test; el original intacto). **Resultado: todo verde, 0 errores de consola en toda la sesión.**

Cada paso posterior de la migración debe reproducir esta lista idéntica:

- [x] **Carga sin errores en consola.** 0 errores en load. (La nota `[BABEL] deoptimised >500KB` es informativa, no un error.)
- [x] **Landing inicial** renderiza con botones "Empezar →" y "Antes, quiero saber más →".
- [x] **WhyDifferentModal** se abre desde "Antes, quiero saber más" y contiene el link a `miplanfire.com`.
- [x] **Onboarding completo** de principio a fin: Landing → (wizard de 9 pasos | "Saltar · usar demo") → app principal con menú de cuenta visible.
- [x] **Las 5 pantallas ruteadas** cargan sin errores nuevos:
  - [x] `ScreenHoy` (tab **Plan**)
  - [x] `ScreenProyeccion` (tab **Proyección**)
  - [x] `ScreenSeguimiento` (tab **Seguimiento**)
  - [x] `ScreenAprende` (tab **Aprende**)
  - [x] `ScreenAjustes` (tab **Datos**)
- [x] **Sub-pantallas no ruteadas directamente** (renderizadas dentro de otras):
  - [x] `ScreenMesAMes` — vive **dentro** de ScreenSeguimiento (L7004). Verificado: bloque mensual visible en Seguimiento.
  - [x] `ScreenSinMiPlan embedded` — vive **dentro** de `SinMiPlanModal` (L5635). Verificado: modal "Ver el cálculo completo →" abre con label "Poder adquisitivo perdido".
- [x] **Gráficos Recharts pintan** donde se usan (conteo de `<svg.recharts-surface>`):
  - [x] Plan: 2 svg · Proyección: 2 svg · Seguimiento: 2 svg
  - [x] SinMiPlanModal: 4 svg
- [x] **AccountMenu → AboutModal**: abre con botón "Ver versión web →".
- [x] **Aprende** carga corpus/glosario (ConceptModal disponible vía `<Concept>`).
- [x] **Persistencia localStorage tras reload**: la app NO vuelve a landing tras recargar; los datos core del plan sobreviven byte-idénticos.
  - Verificado: `{name:"Alex", age:30, capital:4500, segs:2}` idéntico antes y después del reload.
  - El blob serializado cambia solo por **defaults aditivos** que la carga normaliza (`displayMode`, campo zombie `isPro`) — esperado, no es pérdida de datos.
- [x] **0 errores de consola** acumulados en toda la sesión (carga + 5 pantallas + modales + reload).

### Flujos críticos extra detectados (añadir al examen)

- **Migración legacy → accounts**: `migrateToV2` (L1528) + lectura de `miplan.state.v1` para migrar a `miplan.accounts.v1`. Debe seguir migrando estados v1 antiguos sin romper.
- **Multi-cuenta**: `AccountsCard` (L7417) + `AccountMenu` (L9124) — crear/cambiar/borrar cuentas.
- **ActualLifeOnboarding** (L7680): el cuestionario de gastos/allocation reales (modal independiente del onboarding inicial).
- **Modo display real/nominal**: `DisplayModeToggle` (L2929) — alterna cifras ajustadas por inflación.
- **Editores de plan en Proyección**: TramoListEditor, EventListEditor, ProgressionWizard — añadir/editar/borrar/dividir tramos de ingreso, bonus, ahorro y eventos.

> **Cómo re-ejecutar el examen:** reescribir los 5 `<script src="https://cdnjs…">` (L77–81) a copias locales, abrir con Playwright/Chromium 1280×900, y recorrer la checklist. El script usado vive en `/tmp/runtime/e2e_baseline.js` (no versionado; es andamiaje de test).

---

## 2 · Inventario de componentes (mapa del corte)

~110 símbolos top-level agrupados por carpeta destino propuesta. Rangos de línea sobre `mi_plan_v1_5_0a_3.html`. Los marcados **POR DECIDIR** no encajan limpio en el esquema del prompt y NO se fuerzan.

### `tokens/`
| Símbolo | Línea | Nota |
|---|---|---|
| `WEB_URL` | 91 | constante de dominio web |
| `T` | 94 | objeto de tokens. Sub-bloques: `T.size` (~120), `T.lh` (~131), `T.tracking` (~137), `T.inputBg` |

### `content/`
| Símbolo | Línea | Nota |
|---|---|---|
| `TABLON` | 586 | corpus de contenido editorial |
| `LearnIcon` | 689 | **POR DECIDIR** — componente de icono; podría ir a `ui/` |

### `state/`
| Símbolo | Línea | Nota |
|---|---|---|
| `STORAGE_KEY` / `ACCOUNTS_KEY` | 1626 / 1627 | claves localStorage — **ver §3 contrato** |
| `migrateToV2` | 1528 | migración v1→v2 |
| `loadState` / `saveState` | 1629 / 1637 | legacy single-state |
| `loadAccountsData` / `saveAccountsData` | 1642 / 1675 | contenedor multi-cuenta |
| `initialAccountsData` / `seedState` / `emptyState` | 1679 / 1694 / 1763 | semillas de estado |
| `StateCtx` | 1814 | React context |
| `StateProvider` | 1816 | provider + persistencia |
| `useDerived` | 1975 | hook de derivados |
| `usePlanMutators` | 2834 | hook de mutadores |
| `useIsMobile` | 1964 | **POR DECIDIR** — hook genérico; podría ir a `hooks/` o `ui/` |

### `lib/` *(propuesta nueva — POR DECIDIR)*
> El esquema del prompt no contempla carpeta para **funciones puras de cálculo** (no son componentes React). Propongo `lib/` (o `state/calc/`). No forzado.

| Símbolo | Línea |
|---|---|
| `project` / `timeToGoal` / `monthlyForGoal` | 728 / 749 / 761 |
| `todayKey` / `monthKeyFromDate` / `addMonthsKey` / `compareKeys` | 775 / 780 / 784 / 790 |
| `isKeyInSegment` / `findActiveSegment` / `sumActiveSegments` | 794 / 801 / 809 |
| `detectSegmentOverlaps` / `segmentHasOverlap` / `normalizeSegments` | 817 / 832 / 838 |
| `readableMonth` / `parseKeyMonths` | 858 / 2887 |
| `projectV2` | 867 |
| `sumExpenses` / `sumAllocation` | 1007 / 1015 |
| `computeEffectiveCapitalReturn` / `buildMortgageSchedule` | 1026 / 1058 |
| `currentMonthlyAporte` / `computePlannedFor` / `computeIncomeFor` / `currentMonthlyIncome` | 1094 / 1099 / 1111 / 1115 |
| `toRealEur` / `projectDecumulation` / `estimateSpanishPension` / `computeCurrentPortfolio` | 1122 / 1139 / 1199 / 1246 |
| `randomNormal` / `inferVolatility` / `percentile` / `runMonteCarlo` | 1307 / 1321 / 1333 / 1347 |
| `getSavingsTier` | 4089 |
| `seedMonths` / `defaultGoals` | 4969 / 4984 |
| `computeUserProfile` / `projectStandardPlan` / `computeActivePhase` / `_withinYear` | 5098 / 5112 / 5143 / 5237 |
| `computeSinPlanKPIs` | 5553 |
| `computeNextStep` | 5477 — **POR DECIDIR**: huérfana (0 callers JSX) |

### `ui/`
| Símbolo | Línea | Nota |
|---|---|---|
| `EditableNumber` | 2145 | |
| `Slider` | 2184 | |
| `Pill` | 2313 | |
| `Card` | 2325 | |
| `Label` | 2337 | |
| `Btn` | 2346 | |
| `MonthInput` | 2389 | |
| `DisplayModeToggle` | 2929 | |
| `Stat` | 6304 | |
| `SmallStat` | 7212 | |
| `Row` | 7034 | |
| `RowWithWarning` | 7044 | |
| `GoalRow` | 7060 | |
| `LegendChip` | 5866 | |
| `KpiPill` | 9032 | |
| `TramoRow` / `TramoListEditor` / `EventListEditor` | 2406 / 2547 / 2777 | **POR DECIDIR** — editores; quizá `ui/editors/` |

### `charts/`
| Símbolo | Línea | Nota |
|---|---|---|
| `LineChart` | 2203 | |
| `Sparkline` | 2297 | |
| `LifecycleChart` | 2978 | |
| `LifecycleChartDual` | 5017 | |
| `MonteCarloCard` | 3246 | |
| `MultiLineChart` | 6832 | |
| `RetirementCard` | 3123 | **POR DECIDIR** — card con gráfico/datos; quizá `ui/cards/` |
| `HouseholdSummaryCard` | 3498 | **POR DECIDIR** |
| `MonthlyFlowCard` | 3600 | **POR DECIDIR** |
| `FlowTimelineCard` | 3711 | **POR DECIDIR** |

### `modals/`
| Símbolo | Línea | Nota |
|---|---|---|
| `ConfirmModal` | 2894 | |
| `WhyDifferentModal` | 3914 | |
| `SinMiPlanModal` | 5600 | envuelve `<ScreenSinMiPlan embedded />` |
| `MonthlyCalendarModal` | 6153 | |
| `PublicPensionDisclaimerModal` | 7233 | |
| `ConceptModal` | 8639 | |
| `AboutModal` | 9070 | |
| `ProgressionWizard` | 2648 | **POR DECIDIR** — wizard modal-ish |

### `screens/`
| Símbolo | Línea | Estado |
|---|---|---|
| `ScreenHoy` | 5641 | **ruteada** (tab Plan) |
| `ScreenProyeccion` | 6501 | **ruteada** (tab Proyección) |
| `ScreenSeguimiento` | 6988 | **ruteada** (tab Seguimiento) |
| `ScreenAprende` | 8811 | **ruteada** (tab Aprende) — *ausente de la lista del prompt* |
| `ScreenAjustes` | 7506 | **ruteada** (tab Datos) |
| `ScreenMesAMes` | 5946 | sub-pantalla **dentro de** ScreenSeguimiento (L7004) |
| `ScreenSinMiPlan` | 8064 | renderizada `embedded` **dentro de** SinMiPlanModal (L5635) |
| `ScreenPlan` | 6975 | **POR DECIDIR · HUÉRFANO** — 0 usos JSX; stub "esto se movió a Seguimiento/Proyección". Candidato a borrar (anotado, NO tocado en este paso) |

#### Sub-componentes específicos de pantalla *(POR DECIDIR — quizá `screens/<x>/fragments/`)*
| Símbolo | Línea | Pertenece a |
|---|---|---|
| `WhatIfCard` | 5875 | ScreenHoy |
| `RutaCincoFases` | 5247 | ScreenHoy |
| `MonthRow` | 6313 | ScreenMesAMes |
| `HitosEditor` | 6908 | ScreenSeguimiento |
| `RepartoIngresoBlock` / `MonthlyFlowBlock` | 7023 / 7029 | ScreenSeguimiento |
| `GoalContextualBlock` | 7141 | Seguimiento/goals |
| `ExpenseRow` / `AllocRow` | 7629 / 7654 | ScreenAjustes / ActualLifeOnboarding |
| `AccountsCard` | 7417 | ScreenAjustes |
| `PublicPensionCard` | 7287 | ScreenProyeccion/Ajustes |

### `flows/`
| Símbolo | Línea |
|---|---|
| `LandingPreOnboarding` | 3844 |
| `Landing` | 3974 |
| `Onboarding` | 4122 |
| `ActualLifeOnboarding` | 7680 |

### Raíz de la app
| Símbolo | Línea | Nota |
|---|---|---|
| `Shell` | 9161 | layout + routing por tabs |
| `App` | 9359 | root |
| `Concept` | 8544 | **POR DECIDIR** — trigger inline de ConceptModal; quizá `ui/` o `content/` |
| `OnboardingHelp` | 8787 | **POR DECIDIR** |

---

## 3 · CONTRATO localStorage — NO RENOMBRAR

> ⚠️ **Regla dura de toda la migración.** Estas claves y el formato guardado **no se renombran ni se tocan** en ninguna etapa. Romper esto = perder los planes reales de los usuarios.

| Clave | Línea | Rol |
|---|---|---|
| `miplan.state.v1` | 1626 (`STORAGE_KEY`) | **legacy** single-state. Se **lee** para migrar planes antiguos. No escribir nuevos formatos aquí. |
| `miplan.accounts.v1` | 1627 (`ACCOUNTS_KEY`) | **actual** contenedor multi-cuenta. Formato vivo. |

**Reglas de extracción:**
1. El módulo de estado (`state/`: StateProvider, load/save, migrateToV2) se extrae **el ÚLTIMO** de toda la migración.
2. Antes de tocar `state/`, se verifica cargando un **plan real ya guardado** y comprobando que sobrevive byte-idéntico en sus datos core (ver §1: name/age/capital/segments).
3. `schemaVersion` actual = **2**. `migrateToV2` debe seguir siendo idempotente.
4. Campo zombie `isPro` se mantiene en el estado por compatibilidad (no se usa en UI; no eliminar de la migración).

---

## 4 · Dependencias externas (versiones exactas)

Cargadas vía CDN cdnjs en `mi_plan_v1_5_0a_3.html` L77–81:

| Dependencia | Versión | Línea | Uso |
|---|---|---|---|
| `react` | 18.2.0 | 77 | UMD `react.production.min.js` |
| `react-dom` | 18.2.0 | 78 | UMD `react-dom.production.min.js` |
| `prop-types` | 15.8.1 | 79 | requerido por Recharts |
| `recharts` | 2.10.3 | 80 | gráficos |
| `@babel/standalone` | 7.23.2 | 81 | transpila el `<script type="text/babel">` en el navegador |

> Nota de test: Recharts 2.10.3 requiere `react-is` en runtime; el andamiaje de test lo añade localmente. En el HTML de producción, Recharts lo trae empaquetado en su UMD. Tras la migración a build, `react-is` será dependencia transitiva resuelta por el bundler.

**Tras la migración**: `@babel/standalone` desaparece (el build transpila en disco). React/ReactDOM/Recharts/prop-types pasan a `package.json` con estas versiones exactas como punto de partida.

---

## 5 · Notas para el siguiente paso (Paso 2 · montar Vite)

- El esquema de carpetas del prompt necesita **2 carpetas extra** no contempladas: `lib/` (funciones puras de cálculo) y opcionalmente `hooks/`. Confirmar antes de cortar.
- `ScreenPlan` (huérfano) y `computeNextStep` (huérfana) son candidatos a borrado — decidir si se limpian durante la migración o se dejan.
- Orden de extracción sugerido (de hojas a raíz): `tokens/` → `lib/` → `ui/` → `charts/` → `content/` → `modals/` → `flows/` → `screens/` → `state/` (último) → `Shell`/`App`.
- El examen de regresión (§1) se corre tras **cada** extracción.
