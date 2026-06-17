# Eje 3 · Contenido — Hallazgos

> **Contexto.** El contenido editorial vive en `app/src/content/index.js`: `LEARN_CORPUS` (artículos por concepto, **cerrado** por invariante), `LEARN_LEVELS` (qué conceptos van en cada nivel: esencial/profundizando/avanzado), `TABLON` (citas cortas), y `LEARN_DISCLAIMER` (aviso legal unificado). El copy de producto está en `screens/index.jsx` y `flows/index.jsx`. La voz es **sobria, sin gamificación, sin emojis nuevos**. Solo hallazgos aquí.

## Fortalezas
- **`LEARN_DISCLAIMER` unificado**: una sola fuente para "no es asesoramiento / no garantiza rentabilidades / responsabilidad del usuario / normativa a fecha".
- **Corpus por niveles**: escalada esencial → profundizando → avanzado, con "EMPIEZA AQUÍ" como entrada.
- **Voz editorial consistente**: tono adulto, frases recordables en `TABLON` («Aporta poco, pero pronto»), avisos honestos ("histórico no predice futuro").
- **Vocabulario núcleo disciplinado**: "libertad/independencia financiera", "patrimonio", "tu número", "edad de libertad" se usan con criterio en la mayoría de la app.

---

## CO1 · Tensión del vocabulario monetario "€ de hoy" · **P1**
- **Evidencia.** Strings visibles con "de hoy": en `ScreenProyeccion` («= 432.000 € de hoy», recordatorio «ajustado por la inflación … en € de hoy»); en `ScreenHoy` («equivale a 260k€ de hoy», «866€ de hoy»). El modo nominal/real conmuta el sufijo "€" vs "€ de hoy".
- **Qué se observa.** La unificación nominal (v1.4) reintrodujo "€ de hoy" en JSX visible, justo lo que la regla **ESTADO #7** quería evitar.
- **Por qué importa.** "de hoy" puede confundir (¿hoy del usuario? ¿año base?) y choca con una regla de copy ya declarada. Necesita decisión de convención (eliminar, renombrar a "en euros de 2026", o declararlo intencional para el modo real).

```
  ANTES (actual, ambiguo)            POSIBLES CONVENCIONES (a decidir, ver roadmap)
  "= 432.000 € de hoy"               A) "≈ 432.000 € en poder de compra de hoy"
  "866 € de hoy"                     B) "≈ 432.000 € (valor 2026)"
                                     C) dejarlo solo bajo el toggle de "modo real"
```

## CO2 · Disclaimers repetidos sin jerarquía · **P2**
- **Evidencia.** El aviso "herramienta de proyección, no asesoramiento" aparece en: footer (móvil y desktop), cierre de `ScreenProyeccion` (spread CIERRE), y `LEARN_DISCLAIMER` en Aprende. En el **CIERRE del Cartel**, el aviso sale **dos veces casi idéntico** (en el spread y en el footer inmediatamente debajo).
- **Qué se observa.** Redundancia visible, especialmente el doblete cierre+footer.
- **Por qué importa.** Repetir el descargo le resta peso y ensucia el cierre editorial; conviene una sola aparición jerarquizada por contexto.

```
  Spread CIERRE:  "Herramienta de proyección. No es asesoramiento financiero, ni garantiza rentabilidades."
  Footer (justo debajo): "Herramienta de proyección, no de asesoramiento financiero. No garantiza rentabilidades."
  → casi el mismo texto, apilado.
```

## CO3 · `LEARN_LEVELS` cita conceptos que no existen en `LEARN_CORPUS` · **P2**
- **Evidencia.** `LEARN_LEVELS` (sobre todo el nivel avanzado) referencia IDs que no tienen entrada en `LEARN_CORPUS` (candidatos detectados: `tramo`, `eventos-posibles`, `lean-coast`/`lean-coast-fat`, `irpf`, `tributacion-pp`). La app además usa "Tramo", "Eventos posibles", "Lean/Coast" en la UI de Proyección sin artículo en Aprende.
- **Qué se observa.** Conceptos nombrados sin destino de lectura.
- **Por qué importa.** El usuario que busca "Tramo" o "Lean" en Aprende no lo encuentra. **Atención al invariante**: `LEARN_CORPUS` está cerrado → la salida no es "inventar contenido" sin permiso, sino **reconciliar `LEARN_LEVELS`** o decisión de producto de Nacho. (Verificación final pendiente de confirmar IDs exactos.)

## CO4 · "tu número" sin entrada propia en el Glosario · **P2**
- **Evidencia.** "tu número" es protagonista en Proyección/Hoy, pero en Aprende solo aparece dentro de "regla del 4 %", sin entrada/alias propio.
- **Qué se observa.** Término clave del producto sin definición localizable.
- **Por qué importa.** Fricción educativa: el concepto que más se repite en la UI no es "buscable".

## CO5 · `TABLON` con copy hardcodeado que puede divergir de `LEARN_CORPUS` · **P2**
- **Evidencia.** Cada cita de `TABLON` lleva `text` manual + `source` apuntando a un concepto de `LEARN_CORPUS`, pero el `text` no se deriva del corpus.
- **Qué se observa.** Si cambia la "regla" del corpus, la cita del Tablón no se actualiza.
- **Por qué importa.** Riesgo de mensajes que se contradicen entre Tablón y Conceptos con el tiempo.

## CO6 · Modelo de Aprende no documentado · **P2**
- **Evidencia.** No hay nota que explique qué renderiza cada pestaña: Conceptos (¿`LEARN_CORPUS` filtrado por `LEARN_LEVELS`?), El Tablón (¿`TABLON`?), Glosario (¿campo `glossary` de cada entrada?).
- **Qué se observa.** La taxonomía es implícita.
- **Por qué importa.** Quien quiera ampliar Aprende (o auditarlo) no sabe la regla de pertenencia.

## CO7 · Coherencia de marcación: emoji vs símbolos Unicode · **P3**
- **Evidencia.** `✨` aparece en "Asistente de progresión" (ya en uso, permitido). Conviven símbolos Unicode estándar (`★`, `⚠`, `✓`, `↻`, `×`).
- **Qué se observa.** Mezcla de un emoji con un set de símbolos.
- **Por qué importa.** Pura consistencia de voz. **Invariante**: no añadir emojis nuevos; `✨` se conserva por ser preexistente. Solo conviene **documentar** la regla (símbolos sí, emojis no).

---

### Punteros de reproducción rápida
| Hallazgo | Cómo verlo |
|---|---|
| CO1 | Proyección → spread «Tu línea de vida» («= 432.000 € de hoy») y Hoy → Movimiento 2 («260k€ de hoy»). |
| CO2 | Proyección → último spread (CIERRE) + footer justo debajo. |
| CO3/CO4 | Aprende → buscar "Tramo", "Lean", "tu número". |
| CO7 | Buscar `✨` en la cabecera del asistente de progresión. |
