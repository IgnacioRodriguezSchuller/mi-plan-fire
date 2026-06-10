# ESTADO — Mi Plan FIRE

> Fuente **única** del estado del proyecto. Al cerrar cada sprint, actualiza este archivo. Para arrancar un chat de planificación, pega la sección **Resumen**.

_Actualizado: 2026-06-10_

## Resumen
- **Versión funcional activa:** v1.5.0a3.
- **Arquitectura:** codebase modular en `app/src/` (Vite single-file). El monolito `mi_plan_v1_5_0a_3.html` está **congelado** como red de regresión (hash `b3ea52b1…`). `app/src` diverge a propósito.
- **Repo:** `github.com/IgnacioRodriguezSchuller/mi-plan-fire`. Para el HEAD exacto: `git log --oneline -1`.
- **Usuarios externos:** 0 (beta no lanzada). Sin auth, sin pagos, todo local.
- **Verificadores:** content/state en verde; tokens/lib en su **estado conocido** (divergencias intencionales documentadas: Fraunces, `lostFirstYear`, aporte creciente del MC, `bandsByAge`).

## Hitos recientes (en git)
- **Proyección → lenguaje de Plan** (sprint en curso, ver pendiente 1): hero del momento de libertad con dos estados (LLEGA/NO LLEGA, sin fallback), amanecer con sol en arco, motor línea de vida + dial, espina FIRE (número desde gasto, cruce, palanca), **nube de probabilidad MC por edad** (`bandsByAge`, reemplaza la rejilla 10×10).
- **Monte Carlo veraz**: `runMonteCarlo` usa el aporte CRECIENTE de `projectV2` (tramos + IPC + eventos, solo confirmado por defecto) — corregida la divergencia histórica con la proyección determinista.
- **Estilos globales del baseline restaurados** en `index.css`: inputs con `appearance: none` (invariante; bug dark-mode macOS/iOS cerrado), `.tab-enter`, overrides recharts.
- **Hito ★ libertad honesto** en Plan M3: "—" + "todavía no llega" cuando no se alcanza (antes caía en silencio a retireAge).
- **Limpieza**: borrados `ScreenPlan`, `computeNextStep` y 17 imports muertos; `verify-lib` re-cableado (43 filas · 201 casos).
- Auditoría completa del repo (2026-06-10): árbol, commits, config/skills, invariantes, motor. Gobernanza: `design-system/` ignorado (skill ui-ux-pro-max); `CLAUDE_CODE_CONTEXTO.md` adelgazado (cerrado el antiguo pendiente 8).
- Etapa 1 (monolito → `app/src`) cerrada en `4979854`. Tag de retorno: `baseline-pre-migracion` (`aada8b6`).

## Pendientes (en orden)
1. **[GRANDE]** Proyección → al lenguaje de Plan: **en curso** (hero, motor, espina y nube hechos; falta repaso de cierre de Nacho para declararla terminada).
2. **[GRANDE]** Seguimiento → al lenguaje de Plan (sin empezar).
3. **[MEDIO]** Modal "cálculo completo" · branding FIRE en logo/landing · onboarding con cumpleaños · auditoría "¿falta contenido?". *(Nota: ya existe `SinMiPlanModal` "Antes de Mi Plan · cálculo completo" en Plan — confirmar con Nacho si este pendiente se refería a otro modal.)*
4. **[MOTOR · sprint propio, decidido 2026-06-10]** La proyección determinista está capada a `endAge = retireAge` (CONFIRMADO en auditoría) → el hero "vas tarde" nunca se activa y `ageAtFiReal` solo puede salir ≤ retireAge. El MC NO está capado (horizonte lifeExpectancy) → asimetría. Plan: extender las series de detección FI vía `opts.endAge` (aditivo) + diseñar el estado "vas tarde".
5. **[LIMPIEZA]** Retirar puentes técnicos al reescribir los gráficos: shim `window.Recharts`, `resolve.dedupe` en `vite.config`, `import React` en `screens`. *(Ojo: la nube MC añadió 2 usos nuevos del shim — la deuda crece mientras no se haga.)*
6. **[COPY · decidir con Nacho]** La regla de vocabulario monetario (prohibido "€ de hoy" en JSX visible, v1.1.x) está en tensión con la unificación nominal del sprint de Plan, que reintrodujo etiquetas "de hoy" en Proyección. Resolver y re-auditar copy.
7. **[PROCESO]** Mantener el changelog al día: los 6 commits del sprint de Proyección entraron sin entrada (registro retroactivo añadido 2026-06-10). Una entrada por commit al cerrar cada prompt.

## Preguntas abiertas / producto
- Feedback de Juanjo (CFA): densidad · "cockpit" · "mucho número, poca dopamina". La tensión visualizar-vs-narrar queda pendiente de resolver pantalla a pantalla.
- Cap `retireAge` (pendiente 4): ¿hasta qué edad proyectar la detección FI — lifeExpectancy o retireAge + N? ¿Cómo se cuenta "vas tarde" en el hero sin alarmismo?
