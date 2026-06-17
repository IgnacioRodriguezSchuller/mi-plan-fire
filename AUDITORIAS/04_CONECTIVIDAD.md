# Eje 4 · Conectividad entre pantallas y secciones — Hallazgos

> **Contexto.** La navegación la centraliza `Shell` (`screens/index.jsx`) con `setTab`/`update({activeTab})`. Hay 5 tabs + flujos previos (`LandingPreOnboarding`/`Landing`/`Onboarding`) + modales globales abiertos por `window.__openLanding`, `window.__openRevisitLanding`, `window.__openLearnConcept`. Solo hallazgos aquí.

## Fortalezas
- **Cross-references explícitos en copy**: "Para ajustar tu plan, ve a Proyección", "Para tus hitos, ve a Seguimiento", "lo que ves en Plan sale en vivo de los tramos en Ajustes".
- **5 tabs claros** + reset de scroll al cambiar de tab (`setTab` con `scrollTo(0,0)`).
- **Openers globales de modales** (concepto/landing/about) accesibles desde cualquier contexto.
- **CTAs direccionales** coherentes en el flujo principal (Hoy → Proyección; Proyección → Seguimiento).

---

## CN0 · Grafo de navegación (artefacto de referencia)
```
ENTRADA
  LandingPreOnboarding ──"Empezar →"──▶ Landing ──"Empezar mi plan →"──▶ Onboarding ──▶ Shell(hoy)
  LandingPreOnboarding ──"…saber más →"──▶ WhyDifferentModal
  Landing ──"cargar demo"──▶ seedDemo() ──▶ Shell

SHELL (global)
  logo "Mi Plan" ─────────▶ window.__openRevisitLanding()  (LandingPreOnboarding modo revisit)
  KpiPill (patrimonio) ────▶ tab proy
  círculo cuenta ──────────▶ AccountMenu ─▶ "Ir a Ajustes" (tab ajustes) | AboutModal

TAB hoy  (ScreenHoy)
  ├─ "Ver el cálculo completo →" ─▶ SinMiPlanModal (overlay)
  ├─ "Profundizar en Proyección →" ─▶ tab proy
  ├─ "+ Supuestos" ─▶ (ancla/scroll a supuestos)
  ├─ Ruta 5 fases ─▶ selecciona fase (panel in-place; NO navega)
  └─ NextStep "Ir a Proyección/Mes a mes →" ─▶ tab proy | seguimiento

TAB proy (ScreenProyeccion · Cartel)
  ├─ "Desglosar mi gasto →" ─▶ GastoSheet (overlay, portal a body)
  ├─ edición in-place (gasto, ahorro%, tramos, fechas, IPC)
  └─ "Ir a Mes a mes →" ─▶ tab seguimiento

TAB seguimiento (ScreenSeguimiento)
  ├─ MonthRow (registro mensual, in-place)
  ├─ HitosEditor (CRUD metas, in-place)
  ├─ "Ver calendario completo →" ─▶ (ScreenMesAMes / ancla)
  └─ NextStep "Ir a Proyección →"

TAB aprender (ScreenAprende)
  └─ Conceptos/El Tablón/Glosario ─▶ ConceptModal (overlay)

TAB ajustes (ScreenAjustes · "Datos")
  ├─ Exportar/Importar JSON · Cargar demo · Borrar todo · "Volver al onboarding"
  ├─ "Ver presentación de Mi Plan FIRE →" ─▶ window.__openRevisitLanding()
  └─ "Ver presentación visual antigua →" ─▶ window.__openLanding()
```

## CN1 · Acceso a editar gastos/asignación fragmentado (asignación, inexistente) · **P1**
- **Evidencia.** Tres vías de "tu situación económica" que no convergen: (1) onboarding (`ActualLifeOnboarding`: gastos+hipoteca+asignación), (2) Proyección (`GastoSheet`: **solo** gastos), (3) Datos: **nada**. (Liga con `FN1`.)
- **Qué se observa.** No hay un lugar único y descubrible para editar gasto/hipoteca/asignación; la **asignación de activos** no es alcanzable fuera del onboarding.
- **Por qué importa.** El usuario no sabe dónde tocar su cartera; la única vía es rehacer onboarding (o "Cargar demo", que machaca todo).

## CN2 · `ScreenProyeccionLegacy` es callejón sin salida · **P2**
- **Evidencia.** Definida pero sin entrada de navegación (ningún `activeTab` la monta). (Liga con `FN3`.)
- **Qué se observa.** Pantalla colgada, alcanzable solo por estado obsoleto/edición.
- **Por qué importa.** Deuda y riesgo: decidir archivar `src/legacy/`, eliminar, o exponer como "modo anterior".

## CN3 · Entradas redundantes a presentación/landing · **P2**
- **Evidencia.** Cuatro caminos a "ver la presentación": logo del header (`__openRevisitLanding`), Datos → "Ver presentación de Mi Plan FIRE →" (`__openRevisitLanding`), Datos → "Ver presentación visual antigua →" (`__openLanding`), más `WhyDifferentModal` desde el manifiesto.
- **Qué se observa.** Dos botones contiguos en Datos hacen cosas parecidas pero distintas; el naming "antigua" desincentiva y confunde.
- **Por qué importa.** El usuario no distingue qué es cada presentación; conviene consolidar/renombrar.

## CN4 · `KpiPill` navega sin afford. de clicable · **P3**
- **Evidencia.** `KpiPill` (header) hace `onClick={() => setTab('proy')}` pero sin `cursor:pointer` ni feedback de hover.
- **Qué se observa.** La píldora de patrimonio es un atajo a Proyección que no parece pulsable.
- **Por qué importa.** Atajo útil que pasa desapercibido (sobre todo en desktop sin hover).

## CN5 · Asimetría de "volver" desde el Cartel · **P3**
- **Evidencia.** `ScreenHoy` ofrece "Profundizar en Proyección →" (ida), pero `ScreenProyeccion` no tiene un "volver al resumen" explícito (solo la barra de tabs). El cierre sí lleva a Seguimiento.
- **Qué se observa.** El recorrido empuja hacia delante pero no ofrece retorno contextual.
- **Por qué importa.** Menor; en móvil obliga a buscar la barra de tabs. (El cierre "Ir a Mes a mes" mitiga parcialmente.)

---

## Fuente de edición vs dónde se muestra cada dato
| Dato | Se edita en | Se muestra en | ¿Descubrible? |
|---|---|---|---|
| Nombre, edad, jubilación, capital | Datos → Perfil | Hoy (saludo), Proyección (hero) | ✅ |
| Ingresos / complementos / aporte % / IPC | Proyección | Hoy (cálculo), Proyección (hero) | ✅ (complementos/IPC, parcial) |
| Gastos (5 categorías) | Onboarding **y** `GastoSheet` (Proy) | Hoy (fork), Proyección (número) | ⚠️ dos vías |
| **Asignación de activos** | **Solo onboarding** | (afecta retorno, no se muestra) | ❌ **no re-editable** |
| Retorno / inflación / tasa retiro / esperanza vida | Proyección → Asunciones | Hoy, Proyección | ✅ |
| Pensión pública | Datos → Pensión | Proyección (hero), Hoy | ✅ |
| Meses reales / notas | Seguimiento | Seguimiento, curva real-vs-plan | ✅ |
| Hitos (metas) | Seguimiento → Hitos | Seguimiento | ✅ |

**Observación clave**: la **asignación de activos** es el único dato sin superficie de edición viva (ver `CN1`/`FN1`).

### Punteros de reproducción rápida
| Hallazgo | Cómo verlo |
|---|---|
| CN1 | Datos → buscar dónde editar "gastos/asignación" (no está); Proyección → "Desglosar mi gasto" (solo gastos). |
| CN3 | Datos → sección final: dos botones "Ver presentación…". |
| CN4 | Header → píldora "60→ 545k€": pulsa (lleva a Proyección) pero no parece botón. |
