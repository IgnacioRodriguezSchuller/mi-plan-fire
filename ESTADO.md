# ESTADO — Mi Plan FIRE

> Fuente **única** del estado del proyecto. Al cerrar cada sprint, actualiza este archivo. Para arrancar un chat de planificación, pega la sección **Resumen**.

_Actualizado: 2026-06-04_

## Resumen
- **Versión funcional activa:** v1.5.0a3.
- **Arquitectura:** codebase modular en `app/src/` (Vite single-file). El monolito `mi_plan_v1_5_0a_3.html` está **congelado** como red de regresión (hash `b3ea52b1…`). `app/src` diverge a propósito.
- **Repo:** `github.com/IgnacioRodriguezSchuller/mi-plan-fire`. Para el HEAD exacto: `git log --oneline -1`.
- **Usuarios externos:** 0 (beta no lanzada). Sin auth, sin pagos, todo local.

## Hitos recientes (en git)
- Etapa 1 (monolito → `app/src`) cerrada en `49798543`. Tag de retorno: `baseline-pre-migracion` (`aada8b6`).
- Tipografía unificada en **Fraunces** (Instrument Serif jubilada); carga de fuentes restaurada.
- Rediseño de la pantalla **Plan** (3 movimientos: M1 dónde estás · M2 hacia dónde puedes ir · M3 tu ruta).
- **Monedas del M2** veraces: múltiplo real abstracto (`finalReal / aportadoReal`, mismo modelo y unidades), sin umbral ni caso estándar; guarda de dato degenerado.
- **Hito "tu dinero te adelanta"** (edad-rendimiento) implementado: primera edad en que `capital × retorno > aporte` del año (demo C = 40); fallback honesto "—" si no aporta o no cruza.
- **Encuadre global** unificado: el `Shell` define `CONTENT_MAX = 720` una vez (eliminados los maxWidth por-pantalla); `KpiPill` mayor en escritorio.
- Doctrina sincronizada hasta revisión 1.9.

## Pendientes (en orden)
1. **[GRANDE]** Proyección → al lenguaje de Plan.
2. **[GRANDE]** Seguimiento → al lenguaje de Plan.
3. **[MEDIO]** Modal "cálculo completo" · branding FIRE en logo/landing · onboarding con cumpleaños · auditoría "¿falta contenido?".
4. **[MOTOR · confirmar contra `lib` actual]** La proyección está capada a `endAge = retireAge` → el hero "vas tarde" nunca se activa (asimetría: la app dice cuánto te adelantas, no cuánto te retrasas). Verificar si sigue así.
5. **[MOTOR · confirmar]** `d.ageAtFi` huérfano vs `d.ageAtFiReal` (ya usado en el ★ de la ruta): confirmar que no queda fallback silencioso a `retireAge`.
6. **[LIMPIEZA · commit aparte]** Borrar código muerto tras confirmar 0 usos: `ScreenPlan` (huérfano) y `computeNextStep` (en `lib`). Re-pasar el examen de regresión.
7. **[LIMPIEZA]** Retirar puentes técnicos al reescribir los gráficos: shim `window.Recharts`, `resolve.dedupe` en `vite.config`, `import React` en `screens`.
8. **[DOCS]** Adelgazar `CLAUDE_CODE_CONTEXTO.md`: quitar el flujo del monolito (v1.1.1, validación Babel-in-browser); conservar solo la voz editorial y lo que no esté ya en `CLAUDE.md`.

## Preguntas abiertas / producto
- Feedback de Juanjo (CFA): densidad · "cockpit" · "mucho número, poca dopamina". La tensión visualizar-vs-narrar queda pendiente de resolver pantalla a pantalla.
