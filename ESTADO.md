# ESTADO — Mi Plan FIRE

> Fuente **única** del estado del proyecto. Al cerrar cada sprint, actualiza este archivo. Para arrancar un chat de planificación, pega la sección **Resumen**.

_Actualizado: 2026-06-17_

## Resumen
- **Versión funcional activa:** v1.5.0a3.
- **Arquitectura:** codebase modular en `app/src/` (Vite single-file). El monolito `mi_plan_v1_5_0a_3.html` está **congelado** como red de regresión (hash `b3ea52b1…`). `app/src` diverge a propósito.
- **Despliegue:** la app ya es **web pública** en **`app.miplanfire.com`** vía **GitHub Pages** (workflow `.github/workflows/deploy-pages.yml`, build single-file → `dist/index.html`). `<meta robots noindex>` mientras la beta no se anuncie.
- **Repo:** `github.com/IgnacioRodriguezSchuller/mi-plan-fire`, **público**. Historial reescrito el 2026-06-10 para retirar trailers de coautoría; **atribución cortada** (`attribution` en `.claude/settings.json`) → ningún commit nuevo lleva trailer. Para el HEAD exacto: `git log --oneline -1`.
- **Usuarios externos:** 0 (beta no anunciada). Sin auth, sin pagos, todo local.
- **Verificadores:** content/state en verde; tokens/lib en su **estado conocido** (divergencias intencionales documentadas: Fraunces; `lostFirstYear`; aporte creciente del MC; `bandsByAge`; `projectDecumulation` pensión ×14/12 — H1).

## Hitos recientes (en git)
- **Auditoría integral + cascada S1–S10** (`2dea6f8`…`a300fe4`, 10 commits): respuesta a 6 auditorías (estilo/diseño, funciones, contenido, conectividad, storytelling, guiado UX) ejecutadas como entregables en `AUDITORIAS/`. S1: **veredicto único** «¿voy bien?» (`verdict`/`verdictAge`/`verdictCopy` en `useDerived`, resuelve la contradicción de tres señales independientes). S2: quick wins (meta completa, 1 presentación, KpiPill con cursor, disclaimer único). S3: **limpieza Proyección antigua** (`ScreenProyeccionLegacy`/`ProyeccionEngine`/helpers/imports muertos). S6: **primitivas Cartel** (`CartelCard`/`CartelBtn`/`CartelLabel`/`cartelNums`) + tokenización rgba + DOCTRINA actualizada (diglosia derogada → una voz serif). S4: **editar gasto+asignación desde Datos** (`ExpensesForm` + card en `ScreenAjustes`). S5: **modo real** en Proyección (toggle `DisplayModeToggle` en Asunciones) + «€ de 2026» en todo el JSX + hero al veredicto + alias glosario «tu número». S7: **WhatIfCard** sandbox (preview de edad de libertad). S8: Hoy → «Empieza aquí» + densidad (colapsa detalle) + chrome Cartel *(parcial)*. S9: Seguimiento+Datos → eyebrows de sección a `CartelLabel` *(parcial)*. S10: import con confirmación, `appearance:none` en selects, clamp ingreso-0, docs. Invariantes respetados en todos los pasos.
- **Proyección · Cartel · funciones de la original portadas** (`cad0d1c`…`6266c22`, 9 commits): tramos de ingreso/complemento **editables en línea** (importe + fechas vía `CartelMonthValue` + añadir/borrar, sin split/solapes); control de **IPC** del salario (`salaryInflationFactor`); **declarar el gasto** en detalle vía overlay Cartel nuevo (`GastoSheet`, portado a `document.body`, reusa el payload de `ActualLifeOnboarding` sin tocarlo → el número usa `sumExpenses`); los **tipos de FIRE** (Coast/Lean/**Fat** nuevo en el motor + FIRE pleno) como marcadores en la curva + leyenda; **cierre** con CTA «Ir a Mes a mes». Recálculo en vivo verificado; motor/`migrateToV2`/tokens intactos.
- **Proyección · Cartel «completa»** (`2c816da`, sobre la Fase 1 `71896ba`): rediseño póster editorial con los 7 spreads y datos/lógica REALES — `LifeChart` y `MonteCarloChart` data-driven, `Stats3`, `CartelTramoRow`, derivación del número (gasto×12×25), tramos de ingreso editables. La línea de vida se proyecta hasta el cruce (`endAge` opcional de `projectV2`, aditivo) para mostrar el ★ en el caso 'tarde'. Recálculo en vivo verificado (ahorro y gasto). `ScreenProyeccionLegacy` se conserva como referencia para Fase 2.
- **fiTarget sin descontar pensión** (`4f1561f`): "tu número" = gasto anual / tasa de retiro, sin restar la pensión; antes se anulaba a 0 cuando pensión ≥ gasto y borraba el ★. La pensión sigue en la simulación temporal (mejora durabilidad, no baja el objetivo). Copy de la card de pensión actualizado.
- **Tanda de copy de supuestos** (`31046b7`, `c529577`): "En neto, como tu salario" en la progresión; "· 8 % anual asumido" en parado/invertido; línea de inflación condicional al modo bajo el desglose de la meta; píldora SUPUESTOS en Proyección con salto a la card; subrayado dashed accent en términos `Concept`.
- **Ruta de fases usable en móvil** (`db55971`): indicadores de estado redondos vs casillas manuales cuadradas (Fase 3 ya no simula ser clicable); título sincronizado con la fase seleccionada + marca "ahora" en la activa; selección reforzada + scroll; hit area ≥44px.
- **H1 · pensión a 14 pagas** (`38cb6c6`): `projectDecumulation` reparte el anual de 14 pagas en 12 meses (factor 14/12) — coherente con `runMonteCarlo` (`monthlyAmount*14`).
- **Deploy GitHub Pages** (`4314061`): web pública + workflow de build + noindex de beta.
- **H11 · seedDemo con confirmación** (`4fb22d9`): cargar la demo pide confirmación (modal rojo) antes de sustituir datos; landing exenta por construcción.
- **Reescritura de historial + atribución cortada** (`12b71d7`): retirados los 38 trailers de coautoría; `attribution` vacío en settings.
- **H2 · separador de miles** (`c82de35`): `parseSpanishNumber` en `EditableNumber` ("1.500" → 1500, no 1,5).
- **Hito ★ libertad honesto** (`e9646a3`): "—" + "todavía no llega" cuando no se alcanza, sin fallback silencioso a retireAge.
- **Estilos globales del baseline restaurados** (`f61bc62`): inputs con `appearance: none` (invariante; bug dark-mode macOS/iOS cerrado), `.tab-enter`, overrides recharts.
- **Proyección → lenguaje de Plan** (`ed90412` y previos): nube de probabilidad MC por edad (`bandsByAge`), amanecer del hero, motor línea de vida + dial, espina FIRE; Monte Carlo veraz (aporte creciente).
- **Limpieza** (`ee7d034`): borrados `ScreenPlan`, `computeNextStep` y 17 imports muertos; `verify-lib` re-cableado.
- **Gobernanza** (`e1eb850`): `design-system/` ignorado (skill ui-ux-pro-max); `CLAUDE_CODE_CONTEXTO.md` adelgazado.
- Etapa 1 (monolito → `app/src`) cerrada en `4979854`. Tag de retorno: `baseline-pre-migracion`.

## Pendientes (ABIERTOS)
1. **[GRANDE]** Seguimiento → al lenguaje de Plan (sin empezar).
2. **[MEDIO · En limpio / Siguiente paso]** Sistema "Siguiente paso": al marcar una fase manual el usuario espera ir a algún sitio. Hoy solo togglea + persiste (decisión consciente). Resolver con el sistema de Siguiente paso. P2 de la tanda de fases.
3. **[MOTOR · sprint propio]** Edad real cuando NO llega + **cap `retireAge`**: la detección FI determinista está capada a `endAge = retireAge`, así que `ageAtFiReal` solo sale ≤ retireAge y el caso "vas tarde" es indetectable (el MC no está capado → asimetría). Plan: extender las series de detección vía `opts.endAge` (aditivo) + diseñar el estado "vas tarde".
4. **[MODELO · decidir]** Etiqueta "Total al jubilarte" / convención de pagas en `RetirementCard`: la pensión se muestra como `monthlyAmount` crudo (14 pagas) y se suma al retiro de cartera (convención 12). Decidir etiqueta. (Quedó aparte tras H1.)
5. **[DOCTRINA · decidir el dueño]** Principio **P8**: pendiente de decisión; NO está en `DOCTRINA_DISENO.md` aún.
6. **[LIMPIEZA]** Retirar puentes técnicos: shim `window.Recharts`, `resolve.dedupe` en `vite.config`, `import React` en `screens`. (La nube MC añadió usos nuevos del shim.)
7. **[COPY · RESUELTO S5]** «€ de hoy» → «€ de 2026» en todo el JSX visible. El modo real ya está expuesto vía `DisplayModeToggle` en Proyección/Asunciones.
8. **[PRO · lejano]** Exportación PDF profesional (listada como feature Pro "próximamente" en `CHANGELOG_v5_10.md`).
9. **[MEDIO]** Modal "cálculo completo" · branding FIRE en logo/landing · onboarding con cumpleaños · auditoría "¿falta contenido?". *(a confirmar si "cálculo completo" se refiere al `SinMiPlanModal` ya existente o a otro.)*
10. **[GRANDE · Cartel Fase 2 · PARCIAL — cola pendiente]** Primitivas creadas (S6); chrome de sección migrado en Hoy/Seguimiento/Datos (S8/S9). **Queda para la cola de Fase 2:** (a) eyebrows micro de tarjeta («TU PATRIMONIO», «PLAN/REAL/NOTA», etc.) y sub-tarjetas (`PublicPensionCard`, `AccountsCard`, `GoalRow`, `MonthRow`) en Hoy/Seguimiento; (b) GX6: leyenda «los números subrayados los pones tú» fuera de Proyección (depende de migrar los editables de esas pantallas al estilo dashed del Cartel).

## Preguntas abiertas / producto
- Feedback de Juanjo (CFA): densidad · "cockpit" · "mucho número, poca dopamina". La tensión visualizar-vs-narrar queda pendiente pantalla a pantalla.
- Cap `retireAge` (pendiente 3): ¿hasta qué edad proyectar la detección FI — lifeExpectancy o retireAge + N? ¿Cómo se cuenta "vas tarde" en el hero sin alarmismo?
