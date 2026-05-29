# CHANGELOG mi_plan_v5_7.html

Derivado de `mi_plan_v5_6.html`. Una línea por cambio significativo.

## Sprint v1.0 · Sub-prompt B · Movimiento de configuración a Ajustes

### B1 · Configuración a Ajustes (hitos)
- Extraído `HitosEditor` como componente a nivel módulo (antes vivía inline en `ScreenPlan`). Encapsula la lista de hitos, el formulario "Añadir una meta" y el placeholder editorial cuando `goals.length === 0`.
- Añadido `HitosEditor` a `ScreenAjustes` entre el bloque EVENTOS y el bloque CUENTAS, dentro de una `Card` propia.
- `TramoListEditor` (ingresos, complementos, ahorro) y `EventListEditor` ya vivían en Ajustes desde versiones previas — verificado sin tocar.
- `PublicPensionCard` ya estaba en Ajustes — verificado sin cambios.

### B2 · "Plan" eliminado como ruta de nav
- `ScreenPlan` queda como stub deprecation: si por cualquier motivo el componente se renderiza (estado corrupto, link antiguo), muestra un mensaje "La configuración de hitos se ha movido a Ajustes". El stub se mantiene por seguridad pero ya no es accesible vía nav.
- El array `tabs` del `Shell` ya no incluye `{ id: 'plan' }`. Tampoco el router renderiza el caso `tab === 'plan'`.
- Normalización legacy: `useEffect` en `Shell` detecta si `state.activeTab === 'plan'` al montar y lo cambia a `'ajustes'`. Los usuarios con estado guardado en la antigua pantalla Plan caen en Ajustes automáticamente.

### B3 · "Sin Mi Plan" deja de ser ruta de nav
- `{ id: 'sinplan' }` eliminado del array `tabs`. Por tanto deja de aparecer en sidebar desktop y en barra mobile.
- El componente `ScreenSinMiPlan` se conserva intacto (sub-prompt D lo integra como desplegable dentro de Mi Plan).
- El router sigue manteniendo `tab === 'sinplan' && <ScreenSinMiPlan />` para que la card editorial de `ScreenHoy` (`goTo('sinplan')`) siga funcionando como pasarela temporal. Cuando `activeTab === 'sinplan'`, no aparece ningún ítem destacado en la nav — coherente con el plan de integrar el contenido como desplegable en D.

### B4 · Nueva pantalla Seguimiento (esqueleto)
- Nuevo componente `ScreenSeguimiento` con tres bloques separados visualmente:
  1. **Mensual** — renderiza `<ScreenMesAMes />` tal cual (sin tocar lógica interna).
  2. **Hitos** — vista de seguimiento (no de configuración): nuevo componente `HitosOverview` que muestra cada hito con barra de progreso, % logrado, indicador "En camino / Vas justo", y la edad proyectada a la que se alcanzaría según `seriesPlan`. No tiene controles de edición ni botón de añadir; el copy redirige a "Ajustes → Hitos".
  3. **Reparto del ingreso en el tiempo** — `RepartoIngresoBlock` wrapper que renderiza `<FlowTimelineCard>` con el plan/profile en vivo del store.
- Header editorial con título display, subtítulo italic-muted explicando el propósito de la pantalla.

### B5 · ScreenProyeccion · esqueleto de Supuestos
- Card placeholder con borde dashed insertada justo antes del Main chart. Title: "Supuestos editables". Copy explicativo: anuncia el plan para D (edición inline de inflación / retorno / tasa de retiro / edad objetivo / esperanza de vida con sandbox de sesión y botón "Aplicar a mi plan"), y mientras tanto redirige a Ajustes → Tu perfil.
- El resto de `ScreenProyeccion` (curva de patrimonio, ajustes rápidos, yearMilestones, MonteCarloCard del card de Hoy) queda intacto. El MonteCarloCard sigue en `ScreenHoy` por ahora; sub-prompt D lo mueve aquí.

### B6 · Nav final y normalización legacy
- Array `tabs` reducido a 5 entradas en orden estricto: Mi Plan, Proyección, Seguimiento, Aprende, Ajustes.
- Mobile bar: ahora muestra **5 tabs** (Aprende sale, sigue accesible desde las cards editoriales de Mi Plan). Antes mostraba 5 tabs incluyendo Mes a mes; ahora Mes a mes vive en Seguimiento.
- Desktop sidebar: 5 entradas idénticas, sin filtros.
- Router actualizado en mobile y desktop: removidas las ramas `'plan'` y `'mes'`; añadida `'seguimiento'`. La rama `'sinplan'` se mantiene como antes (acceso interno desde card editorial de Mi Plan).
- `Object.assign(window, ...)` actualizado: añade `ScreenSeguimiento`, `HitosEditor`, `HitosOverview`. `ScreenPlan` se mantiene (componente stub).

### Verificación runtime · Playwright + Chromium headless
- Sidebar desktop: 5 tabs en orden `◐ Mi Plan · ◢ Proyección · ◧ Seguimiento · ◇ Aprende · ◌ Ajustes`. ✓
- Seguimiento renderiza los 3 bloques: header, Mensual (ScreenMesAMes), Hitos (HitosOverview), Reparto (FlowTimelineCard). ✓
- Ajustes contiene `HitosEditor` ("Añadir una meta"), `TramoListEditor`, `EventListEditor`, `PublicPensionCard`. ✓
- Proyección muestra el placeholder "Supuestos editables" antes del Main chart. ✓
- Normalización legacy: `activeTab: 'plan'` guardado → recargar → la app aterriza en Ajustes. `activeTab: 'mes'` → recargar → aterriza en Seguimiento. ✓
- Cero `pageerror`, cero errores de consola.

### No tocado (por las reglas del sub-prompt)
- `CLAUDE_CODE_CONTEXTO.md` no se actualiza (corresponde al sub-prompt G).
- IDs internos `'hoy'`, `'proy'`, `'sinplan'`, `'aprender'`, `'ajustes'` y la clave de localStorage: intactos.
- Componente `MonteCarloCard` y sus llamadas: intactos (movimiento real a D).
- `LEARN_CORPUS`, motor `projectV2`, `runMonteCarlo` y demás engines: intactos.
- Bloque "Tu perfil mini" que vivía dentro de la antigua `ScreenPlan` se elimina: ya estaba duplicado con la sección "Tu perfil" completa de `ScreenAjustes` (que tiene los warnings amber y más campos). Su presencia en ScreenPlan era redundante.
