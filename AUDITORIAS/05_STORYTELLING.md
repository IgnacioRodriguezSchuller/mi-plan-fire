# Eje 5 · Storytelling (arco narrativo) — Hallazgos

> **Contexto.** El recorrido es `LandingPreOnboarding` → `Landing` → `Onboarding` → app. Cada pantalla "cuenta" algo: Hoy = dónde estás / hacia dónde vas / tu ruta; Proyección (Cartel) = el destino dibujado en 7 spreads; Seguimiento = plan vs realidad; Aprende = los porqués. El narrador clasifica al usuario con `destinoEstado`, `cruceEdad`, lean/coast/fat (en `useDerived`). Solo hallazgos aquí; la causa raíz técnica del P0 está al final.

## Fortalezas
- **Landing + PreOnboarding** repiten tres principios (Privacidad / Educación / Sin rodeos) → marca consistente y promesa honesta ("solo matemáticas, las tuyas, en tu dispositivo").
- **Estructura en 3 movimientos** en Hoy (dónde estás → hacia dónde puedes ir → tu ruta): progresión lógica.
- **El Cartel** es un relato visual fuerte: hero → línea de vida → palanca → ingresos → asunciones → ¿y te dura? → cierre.
- **`SinMiPlanModal`** ("Tu situación si no haces nada") es un excelente relato de "lo que está en juego".
- **Coherencia del titular del destino** entre Hoy ("TU DESTINO · libre, pero tarde, a los 70") y Proyección ("Libre, pero tarde: a los 70"): cuando el dato es el mismo, el mensaje rima.

---

## ST1 · Contradicción de veredictos — la app se contradice sobre si vas bien · **P0**
- **Evidencia (en pantalla, una misma sesión demo).**
  - `ScreenHoy`: «TU DESTINO · libre, pero **tarde**, a los 70» + NextStep «Llegas **tarde** a tu meta. Ajusta tu plan.»
  - `ScreenSeguimiento` (arriba): «Vas **por delante**. A este ritmo, alcanzas la independencia financiera a los **69.5** en lugar de los 70.3.» + metas «Vas **sobrado**».
  - `ScreenSeguimiento` (abajo, NextStep): «Vas **por detrás** del plan. Revisa tu aporte para recuperar el ritmo.»
- **Evidencia (en código, `useDerived`).** Tres señales independientes alimentan esos mensajes (detalle al final).
- **Qué se observa.** En una sola sesión el usuario lee "tarde", "por delante", "sobrado" y "por detrás" sobre el **mismo** plan. Incluso **dentro de Seguimiento** conviven "por delante/sobrado" (arriba) y "por detrás" (abajo).
- **Por qué importa.** Es el problema más grave: destruye la confianza. Si la herramienta no se pone de acuerdo consigo misma, el usuario no sabe a cuál creer. Es un **P0** porque afecta el mensaje central del producto ("¿voy bien?").

```
   HOY                         SEGUIMIENTO (arriba)        SEGUIMIENTO (abajo)
   ┌───────────────┐           ┌───────────────────┐       ┌───────────────────────┐
   │ libre, pero    │  ⇄  ⚠    │ Vas por delante    │  ⇄ ⚠ │ SIGUIENTE PASO         │
   │ TARDE, a los 70│   contra │ 69.5 vs 70.3       │ contra│ Vas POR DETRÁS del plan│
   │ "Llegas tarde" │          │ metas: "sobrado"   │       │ "recupera el ritmo"    │
   └───────────────┘           └───────────────────┘       └───────────────────────┘
        ageAtFiReal vs retireAge     realVsPlanDelta             avgActual ≥ currentAporte
```

## ST2 · El tono esperanzador de Hoy choca con su propio NextStep · **P1**
- **Evidencia.** En `ScreenHoy`, el Movimiento 2 afirma «hoy cambias tu futuro» / «multiplica por 9 lo que pones» (verde, optimista), pero el cierre de la misma pantalla puede decir «Llegas tarde a tu meta».
- **Qué se observa.** Subidón y bajón en la misma scroll-view.
- **Por qué importa.** Es la cara local de `ST1`: el relato emocional se sabotea a sí mismo. (Se resuelve junto con el P0.)

## ST3 · Nomenclatura del "destino" inconsistente · **P2**
- **Evidencia.** El mismo concepto se llama: «Tu destino» (Hoy), «En limpio» (Proyección/Seguimiento), «patrimonio libre» (★ del LifeChart), «edad de libertad», «el cruce».
- **Qué se observa.** Cinco nombres para la idea central (la edad en que las rentas cubren el gasto).
- **Por qué importa.** Diluye el concepto estrella; el usuario no consolida un único término mental.

## ST4 · El número protagonista del header no es el del relato · **P2**
- **Evidencia.** El `KpiPill` del header muestra «60 → 545k€» (`retireAge` + capital a esa edad). El hero protagoniza «a los **70**» (edad de libertad). El relato gira en torno a 70; el header ancla en 60.
- **Qué se observa.** La cifra "siempre visible" (header) no es la que el relato declara como meta.
- **Por qué importa.** Confunde cuál es "el número": ¿60 o 70? Debilita el ancla narrativo.

---

## ⭐ Causa raíz de la contradicción de veredictos (detalle técnico)
Las tres señales viven en `useDerived` (`state/index.jsx`) y **miden cosas distintas**:

| Mensaje (dónde) | Variable que lo decide | Qué compara realmente |
|---|---|---|
| **Hoy "Tu destino" / "tarde"** | `destinoEstado` ← `cruceEdad` (=`ageAtFiReal`) vs `profile.retireAge` | Edad proyectada (a horizonte de vida, ritmo real) en que el patrimonio real ≥ `fiTarget`, comparada con la edad de jubilación deseada. |
| **Seguimiento "plan vs realidad" / "69.5 vs 70.3"** | `realVsPlanDelta` (cartera real − cartera plan en el último mes registrado) | Desempeño **histórico acumulado** hasta el último mes con datos. |
| **Seguimiento NextStep "por delante/por detrás"** | `avgActual ≥ currentAporte` | **Media aritmética** de aportes registrados vs lo que el plan prescribe **para hoy**. Ni proyecta ni mira el destino. |

**Por qué divergen.** Puedes haber aportado mucho los últimos meses (`avgActual` alto → "por delante"), tener una cartera algo por encima del plan en el último mes (`realVsPlanDelta>0` → "69.5"), y aun así, **proyectando a horizonte de vida**, cruzar tu número **después** de la jubilación deseada (`cruceEdad>retireAge` → "tarde"). Tres verdades parciales, vocabulario solapado.

**La pieza que falta.** No hay **una sola definición** de "¿voy bien?". `ageAtFiReal` (edad FIRE con datos reales) y `ageAtFiPlan` (edad FIRE del plan) **ya existen** en `useDerived`: comparar uno con otro daría un veredicto único y honesto para todas las pantallas. La prescripción concreta está en `ROADMAP_Y_RECOMENDACIONES.md` (tema transversal #2).

### Punteros de reproducción rápida
| Hallazgo | Cómo verlo |
|---|---|
| ST1 | Datos → Cargar demo → registrar 1-2 meses con aporte alto → comparar Hoy ("tarde") vs Seguimiento (arriba "por delante", abajo "por detrás"). |
| ST4 | Mirar el header (60 → 545k€) mientras el hero dice "a los 70". |
