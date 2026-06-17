# Eje 6 · Guiado de experiencia del usuario — Hallazgos

> **Contexto.** El andamiaje de guía son: la primitiva `NextStep` (un "siguiente paso" por pantalla), la `RutaCincoFases` (Cimientos → Saneamiento → Colchón → Inversión → Optimización), el `Onboarding`, los estados vacíos, y señales de descubribilidad (subrayado punteado = editable, helpers). Solo hallazgos aquí.

## Fortalezas
- **Primitiva `NextStep`** reutilizable (cuerpo + acción) presente en Hoy/Proyección/Seguimiento: la intención de "siempre hay un siguiente paso" es correcta.
- **`RutaCincoFases`**: progreso visual + detección automática de hitos + panel de pasos; estructura el camino FIRE.
- **Señal de descubribilidad explícita** en Proyección: «Los números **subrayados** los pones tú. El resto los calcula tu plan.»
- **Edición in-place** en `HitosEditor` y `MonthRow` (sin modales para lo cotidiano).
- **Cargador de demo** con confirmación: permite explorar sin miedo.

---

## GX1 · `NextStep` da guía contradictoria entre pantallas · **P1**
- **Evidencia.** Misma primitiva, **lógica distinta**: Hoy decide con `destinoEstado`; Seguimiento decide con `avgActual ≥ currentAporte`. (Es la cara UX de `ST1`.)
- **Qué se observa.** El "siguiente paso" de Hoy ("Llegas tarde") puede contradecir al de Seguimiento ("vas por delante" / "por detrás") en la misma sesión.
- **Por qué importa.** El componente diseñado para **orientar** termina **desorientando**. Necesita alimentarse de la fuente única (`ageAtFiReal` vs `ageAtFiPlan`).

## GX2 · Densidad tipo "cockpit" en Hoy · **P1**
- **Evidencia.** `ScreenHoy` apila ~12 bloques: patrimonio + fork parado/invertido + inflación + "ver cálculo completo" + 2× "supuestos" + "multiplica por 9" + renta + ruta de 5 fases + "tu destino" + "siguiente paso". Coincide con el feedback del CFA ("mucho número, poca dopamina", "densidad", "cockpit").
- **Qué se observa.** No hay una jerarquía clara de cuál es **la** acción principal de la pantalla; todo compite por atención.
- **Por qué importa.** La pantalla de aterrizaje abruma; el usuario no sabe dónde mirar primero. Es tensión visualizar-vs-narrar pendiente (ESTADO · feedback de Juanjo).

```
  HOY (scroll) — densidad actual
  [Hola, Alex] [TU PATRIMONIO] [CADA MES APARTAS + fork] [inflación] [+SUPUESTOS][VER CÁLCULO]
  [hoy cambias tu futuro] [multiplica x9 + dots] [renta jubilación] [+SUPUESTOS][PROFUNDIZAR]
  [Tu ruta · 5 fases + checklist] [TU DESTINO 70] [SIGUIENTE PASO]
  → ~12 tarjetas, sin un foco único.
```

## GX3 · CTA del NextStep ambiguo ("Ajusta tu plan") · **P2**
- **Evidencia.** Hoy: "Llegas tarde a tu meta. **Ajusta tu plan.** → Ir a Proyección". Pero "ajustar el plan" también podría ser Datos (perfil, pensión).
- **Qué se observa.** El verbo no dice **qué** ajustar ni **dónde** exactamente.
- **Por qué importa.** Un siguiente paso debe ser inequívoco ("Sube tu aporte en Proyección" / "Baja tu objetivo de gasto"), si no, el usuario duda.

## GX4 · `RutaCincoFases`: señalización débil y marcado sin destino · **P2**
- **Evidencia.** Las fases son clicables (hay texto «Toca cualquier fase para ver sus pasos») pero la afford. visual es tenue; y marcar un paso manual (`toggleManual` → `phaseManualChecks`) **no lleva a ningún sitio** ni confirma (pendiente **ESTADO #2**).
- **Qué se observa.** El usuario marca "hecho" y no pasa nada perceptible; no sabe si avanza.
- **Por qué importa.** Rompe el bucle de feedback de la herramienta de guía por excelencia.

## GX5 · Estados vacíos pobres para usuario nuevo · **P2**
- **Evidencia.** Hoy (sin ingreso) ofrece CTAs a **archivos distintos** ("Define un ingreso en Ajustes" / "añade un tramo en Proyección"); Seguimiento sin meses: "Registra un mes" sin decir cuál; Hitos: "Registra al menos 3 meses" sin indicar el primero.
- **Qué se observa.** El primer uso no tiene un "empieza aquí" único y secuencial.
- **Por qué importa.** La primera sesión es decisiva; hoy el usuario nuevo recibe instrucciones dispersas.

## GX6 · Descubribilidad de editables desigual · **P2/P3**
- **Evidencia.** Proyección **sí** explica el subrayado ("los números subrayados los pones tú"); el resto de pantallas no tiene esa leyenda. En Hoy/Datos hay números derivados y números editables con tratamiento parecido.
- **Qué se observa.** Fuera de Proyección, el usuario no sabe qué puede tocar.
- **Por qué importa.** Capacidades editables que no se descubren = no se usan.

## GX7 · Onboarding: ¿explica el "porqué" de cada dato? (a auditar a fondo) · **P2**
- **Evidencia.** `Onboarding` y `ActualLifeOnboarding` existen (en `screens/index.jsx`); el flujo pide perfil, ingresos, gastos, hipoteca, asignación. No se auditó paso a paso si **justifica** cada campo ni si permite saltar/volver con claridad.
- **Qué se observa.** Hueco de auditoría: falta el recorrido detallado del onboarding (longitud, obligatoriedad, "por qué te pido esto").
- **Por qué importa.** Es la primera impresión y la base de todos los cálculos; merece su propio pase. (No es un defecto confirmado, es un **pendiente de auditoría**.)

---

### Punteros de reproducción rápida
| Hallazgo | Cómo verlo |
|---|---|
| GX1 | Comparar el "Siguiente paso" de Hoy vs el de Seguimiento (pueden contradecirse). |
| GX2 | Hoy → scroll completo: contar bloques. |
| GX4 | Hoy → Ruta de fases → tocar una fase / marcar un paso manual. |
| GX5 | Datos → Borrar todo (o instancia nueva) → recorrer pantallas sin datos. |
| GX7 | Datos → "Volver al onboarding" → recorrer el flujo evaluando los "por qué". |
