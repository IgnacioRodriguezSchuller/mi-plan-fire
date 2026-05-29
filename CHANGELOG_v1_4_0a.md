# Mi Plan FIRE — CHANGELOG v1.4.0a

Sub-sprint **v1.4.0a** · quitar Probador (gate Pro). Origen: `mi_plan_v1_3_0.html`.

Primera de tres fases de la reestructuración nav. Eliminación quirúrgica del sistema de sandbox/Probador del producto free. **No mueve UI entre pantallas** (eso es v1.4.0b). Bajo riesgo: el motor, el estado persistido y las pantallas adyacentes quedan intactos.

---

## Contexto

El producto tenía **dos** sandboxes superpuestos:

1. **Tipo A · estado-bound**: `state.sandbox` + funciones `startSandbox`/`applySandbox`/`discardSandbox`. Persiste, banner sticky cuando activo.
2. **Tipo B · session-only**: `SupuestosEditables` con `overrides` locales en Proyección. Sliders sobre retorno/inflación/aporte que no persisten.

Decisión del autor: eliminar AMBOS del free; reintroducir un Probador unificado en Pro (Sprint 4). Eliminación silenciosa, sin placeholder visible.

---

## Eliminado del producto free

### Componentes

- `function SandboxBanner` — banner sticky con Aplicar/Descartar. Sustituido por comentario marcador.
- `function SupuestosEditables` — sliders session-only de retorno/inflación/aporte. Sustituido por comentario marcador.

### Renderizados

- `<SandboxBanner />` en shell mobile y shell desktop.
- Cabecera de `ScreenProyeccion`: bloque condicional `{sandboxActive && ...}` con "Plan real: ... · diff ...", rama "Estás explorando un escenario" del subtítulo, y ternario completo con botones `Probar escenario`/`Descartar`/`Aplicar al plan`. Cabecera queda: título + subtítulo único "Con los tramos, ahorros y eventos confirmados de tu plan actual."
- `<SupuestosEditables />` en `ScreenProyeccion`.
- Card "Ajustes rápidos" en `ScreenProyeccion` (con sliders de retorno, jubilación, capital inicial). Todos esos parámetros siguen editables en `ScreenAjustes`. El mensaje "Para editar ingresos, aportes y eventos, ve a Ajustes" se elimina con la card.
- Card Sandbox en cabecera de `ScreenAjustes` (botones Probar/Aplicar/Descartar).

### `useStore` (API)

Eliminados del return:
- `startSandbox`, `discardSandbox`, `applySandbox`
- `sandboxActive`

Simplificado:
- `activePlan: state.plan` (antes `state.sandbox || state.plan`).

### `useDerived` (API)

Campos eliminados del return:
- `seriesSandbox`
- `finalSandbox`

Variables internas eliminadas:
- `sandboxEffReturn`
- `sandboxCurrentPortfolio`
- bloque `const seriesSandbox = sandboxActive ? projectV2(state.sandbox, ...) : null;`

Dependencias del `useMemo`: `sandboxActive` eliminado de las deps (línea ~2122 nueva).

### `ScreenProyeccion` (refactor)

- Destructuring del `useStore` simplificado a `{ state }` (todo lo demás llega vía `state`, `useDerived` y `useIsMobile`).
- `effectivePlan`, `effectiveProfile`, `effectiveInflRate`, `overrides`, `setOverrides`, `hasOverrides`, `applyRealMode` (con dependency `inflRate` simple), `activeStartCapital` (sin rama sandbox), `scenarios` (sin rama `if (sandboxActive)`) — todos refactorizados para usar `plan`, `profile`, `inflRate` directamente.
- `MonteCarloCard` ahora recibe `plan={plan} profile={profile} inflRate={inflRate}` (antes `effectivePlan`/`effectiveProfile`/`effectiveInflRate`).

### `ScreenAjustes`

- Destructuring `useStore` ya no lista `sandboxActive`, `startSandbox`, `applySandbox`, `discardSandbox`.

### Comentario en helpers

- Línea ~2858: `// Helpers to mutate tramos/events through the store (sandbox-aware via mutatePlan)` → `// Helpers to mutate tramos/events through the store via mutatePlan`. `mutatePlan` sigue intacto: lo usan los mutadores de tramos/eventos (`addIncome`, `updateIncome`, etc.).

---

## Zombi mantenido (compatibilidad de estado persistido)

| Pieza | Razón |
|---|---|
| `state.sandbox` field | Si un usuario tenía un sandbox guardado en localStorage, no lo perdemos. `migrateToV2` línea 1588 sigue preservándolo (`sandbox: state.sandbox \|\| null`). Cuando vuelva el Probador en Pro, se podrá leer. |
| `const startSandbox`, `const discardSandbox`, `const applySandbox` callbacks | Declarados arriba (líneas ~1866-1871), no exportados en el return. Quedan en memoria pero no en API pública. Se reactivan cuando el Probador vuelva. |
| `mutatePlan` callback | Sigue siendo necesario para los mutadores de tramos/eventos. NO se toca. |

---

## Auditoría grep (post-migración)

```
function SandboxBanner | function SupuestosEditables   → 0
<SandboxBanner | <SupuestosEditables                   → 0
"Probar escenario"                                     → 0
"Modo escenario"                                       → 0
"Ajustes rápidos"                                      → 0
sandboxActive                                          → 0
seriesSandbox | finalSandbox                           → 0
effectivePlan | effectiveProfile | effectiveInflRate   → 0
state.sandbox                                          → 1 (migrateToV2 ~1588, zombi)
startSandbox | applySandbox | discardSandbox           → 4 (3 callbacks + 1 comentario interno, NO en useStore return ni en JSX)
sinplan-pro | SinMiPlanProPlaceholder                  → intactos (no relacionado con Probador)
"Aplicar al plan →"                                    → 1 (WhatIfCard legacy, coincidencia de string, NO Probador)
```

---

## Validación

- **Babel**: ✓ Sintaxis OK tras cada bloque de cambios.
- **Runtime e2e** (Playwright + Chromium headless, viewport 1280×900):
  - Mi Plan renderiza con toggle "AJUSTAR POR INFLACIÓN" ✓
  - Proyección sin "Probar escenario →", sin "Modo escenario activo", sin Card "Ajustes rápidos" ✓
  - Proyección con curva de patrimonio + "Tu yo del futuro" + Monte Carlo ✓
  - Subtítulo único: "Con los tramos, ahorros y eventos confirmados de tu plan actual." ✓
  - Ajustes sin Card Sandbox en cabecera; "Tu perfil" y resto de cards intactas ✓
- **Compatibilidad de estado persistido**:
  - Forzado `state.sandbox = { ...plan, capital: 99999 }` en localStorage + reload.
  - Producto carga sin errores. `state.sandbox` se preserva en el JSON (zombi). `useStore` lo ignora (ya no lo expone). `state.plan` se sigue usando como antes. ✓

---

## Restricciones respetadas

- ✅ Sin tocar lógica de motor (`projectV2`, `runMonteCarlo`, `projectStandardPlan`, `computeUserProfile`, `computeActivePhase`).
- ✅ Sin renames de campos del estado persistido.
- ✅ Sin campos nuevos al estado.
- ✅ Sin dependencias externas nuevas.
- ✅ Cero llamadas de red.
- ✅ Eliminación silenciosa: sin "próximamente en Pro" como placeholder visible.
- ✅ Vocabulario v1.2.1 preservado.
- ✅ Tokens visuales v1.3.0 (`T.size.*`, `T.lh.*`, `T.tracking.*`) intactos en las piezas adyacentes que no se han tocado.

---

## Estructura del archivo

| Métrica | v1.3.0 | v1.4.0a | Δ |
|---|---|---|---|
| Líneas | 9.950 | ~9.660 | -290 |
| Tamaño | ~560 KB | ~540 KB | -3,6% |

Reducción debida a eliminación de `SandboxBanner` (35 líneas), `SupuestosEditables` (~78 líneas), Card Sandbox de Ajustes (~25 líneas), Card "Ajustes rápidos" de Proyección (~20 líneas), variables/useMemo de overrides en `ScreenProyeccion` (~80 líneas), variables sandbox de `useDerived` (~15 líneas), `<SandboxBanner />` × 2 (mobile + desktop).

---

## Resumen

| Pieza | Estado |
|---|---|
| A · `function SandboxBanner` eliminada | ✓ |
| A · `function SupuestosEditables` eliminada | ✓ |
| B · `<SandboxBanner />` mobile + desktop | ✓ |
| C · `ScreenProyeccion` simplificada | ✓ |
| D · Card Sandbox en `ScreenAjustes` eliminada | ✓ |
| E · `state.sandbox` zombi mantenido | ✓ |
| F · `useStore` return limpio (sin sandbox exports) | ✓ |
| G · `useDerived` sin `seriesSandbox`/`finalSandbox` | ✓ |
| H · Comentario `sandbox-aware via mutatePlan` actualizado | ✓ |
| Babel + grep + e2e + compat localStorage | ✓ |
