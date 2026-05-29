# Prompt 1 — Bugs y correcciones de comportamiento

> Para Claude Code. Autonomía alta: ejecuta, valida y entrega. Sin pasos intermedios de aprobación.

---

## Contexto

Lee primero `CLAUDE_CODE_CONTEXTO.md` en esta misma carpeta. Contiene la filosofía del producto, las convenciones de código, el inventario del estado actual y las reglas de no hacer / sí hacer. Todo el trabajo de este prompt debe cumplir esas reglas.

El archivo de trabajo es `mi_plan_v3_con_aprende.html`. Cópialo a `mi_plan_v4.html` y trabaja sobre la copia. **No** modifiques el original. Anota cada cambio en `CHANGELOG_v4.md`. Anota bugs colaterales en `BUGS_ENCONTRADOS.md` sin arreglarlos.

## Objetivo

Cinco correcciones de comportamiento. Las cinco son alto valor, bajo riesgo. Implementa las cinco en una sola sesión. Valida sintaxis Babel después de cada bloque. Al terminar, abre el archivo en navegador y verifica runtime de cada cambio.

---

## Corrección 1 · Capacidad de ahorro en el onboarding sin tope con fricción por umbral

**Bug actual:** el slider de capacidad de ahorro en el onboarding (paso "¿cuánto puedes guardar?") está topado en 50%. Para perfiles con alta capacidad de ahorro (vive con padres, doble ingreso sin hijos, etc.) este tope es artificial.

**Comportamiento esperado:**

1. Quita el tope duro del 50%. El nuevo tope efectivo es 100% (no se puede ahorrar más que tu sueldo).
2. Añade **fricción visual escalonada** según rangos basados en estadística realista de ahorro doméstico en España:

| Rango (% del sueldo) | Etiqueta visual | Color | Mensaje |
|---|---|---|---|
| 0-10% | "Por debajo de la media" | `T.muted` | *"La media española ronda el 10-12% del ingreso disponible. Por debajo, el interés compuesto se queda corto para metas a largo plazo."* |
| 10-20% | "Saludable" | `T.green` | *"En el rango sostenible para la mayoría de perfiles. Es donde están los planes FIRE en construcción."* |
| 20-35% | "Alto" | `T.green` | *"Por encima de la media española. Requiere estilo de vida ajustado y/o ingresos altos. Sostenible si la situación material lo permite."* |
| 35-50% | "Muy alto" | `T.amber` | *"Solo realista en circunstancias específicas: sin hijos, sin hipoteca, ingresos altos, o vida muy austera. Asegúrate de que es lo que aportas en tu peor mes, no en tu mejor mes."* |
| 50-70% | "Excepcional" | `T.amber` | *"Posible para perfiles muy concretos: convive sin gastos de vivienda, doble ingreso pleno, ingresos altos con vida muy contenida. Un plan basado en lo que aportas en tu mejor mes fracasa siempre. Un plan basado en lo que aportas en tu peor mes funciona."* |
| 70-100% | "Improbable a largo plazo" | `T.red` | *"Sostener 70%+ del sueldo durante años es muy raro fuera de situaciones temporales (acumulación pre-FIRE intensa, ahorro para entrada de vivienda en plazo concreto). Considera bajar a un nivel que puedas mantener cuando cambien tus circunstancias."* |

**Detalles de implementación:**

- El mensaje aparece debajo del input, en una línea separada con fontFamily `T.serif` italic, tamaño 14, lineHeight 1.55, con el color del rango.
- La etiqueta del rango aparece a la derecha del valor numérico, en `T.mono` 10px uppercase.
- Aplica el mismo sistema también en el modo "Fijo en €": calcula el ratio implícito (monthly / income) y aplica los rangos sobre ese porcentaje. Si `income === 0`, no muestres el mensaje (no se puede calcular el ratio).
- **No** bloquees el avance del onboarding. La fricción es visual y educativa, no restrictiva.
- Aplica el mismo sistema también en `ScreenAjustes` si encuentras un slider equivalente. Si no hay slider equivalente porque allí se edita por tramos, no añadas nada (los tramos son edición experta, no necesitan tutelaje).

---

## Corrección 2 · Pensión pública desactivada por defecto + disclaimer al activar

**Bug actual:** la pensión pública aparece activada por defecto. Esto contradice la filosofía del producto: planificar sin contar con ella, considerarla como ingreso adicional cuando llegue.

Además, hay un bug funcional secundario: aunque el usuario active la pensión, ésta aparece sumada en cards como FinancialHealthCard ("Tu dinero ya trabaja") incluso cuando el usuario es más joven que la edad legal de jubilación. **No deberías cobrar pensión a los 32 años.**

**Comportamiento esperado:**

### 2a. Por defecto desactivada

1. En `useStore` (la función de inicialización del estado), asegúrate de que `plan.publicPension.enabled` arranca en `false`. Si ya está en `false` por defecto en código, verifica que la migración no la activa.
2. Si un usuario tiene estado guardado en `localStorage` con `publicPension.enabled === true`, **no lo desactives automáticamente**. Respeta su elección.
3. En cualquier card que muestre datos relacionados con pensión: si no está activada, no muestres nada relacionado. No muestres "Pensión: 0€/mes" como placeholder.

### 2b. Disclaimer al activar

Cuando el usuario active el toggle de "Activar pensión pública" en `PublicPensionCard`, **antes** de que el toggle se aplique:

1. Aparece un modal de confirmación con el siguiente contenido (copy exacto, no parafrasees):

> **Activar pensión pública**
>
> *Antes de incluirla en tu plan, lee esto.*
>
> La pensión pública española opera bajo sistema de reparto: las cotizaciones actuales pagan las pensiones actuales. La proporción de cotizantes por pensionista lleva una década cayendo y los informes oficiales prevén que siga cayendo durante las próximas tres décadas.
>
> Eso no significa que el sistema vaya a colapsar mañana. Sí significa que las pensiones futuras pueden mantener cuantía nominal pero perder poder adquisitivo, endurecer requisitos, o ver modificada la fórmula de cálculo. Las reformas de 2011, 2013, 2021 y 2023 ya han modificado la fórmula varias veces.
>
> **Mi Plan recomienda planificar tu independencia financiera sin contar con la pensión pública**, y considerarla como ingreso adicional cuando llegue, no como pilar del plan. Si decides incluirla en tu proyección, hazlo sabiendo que es la variable más incierta de tu plan a 30 años.
>
> [ Cancelar ] [ Activar de todas formas ]

2. Estilo del modal: consistente con `ConceptModal` ya existente. Ancho máximo 560px, padding generoso, fontSize 15 en body, lineHeight 1.6, fontFamily `T.serif`. El título en `T.display`. El botón "Cancelar" en `Btn` variant ghost, "Activar de todas formas" en `Btn` variant `amber` (si no existe, crea una variante o usa accent con border-color amber).
3. Si el usuario pulsa Cancelar o cierra el modal (ESC, click fuera), el toggle **no** se activa.
4. Si el usuario pulsa "Activar de todas formas", el toggle se activa normalmente y aparece la `PublicPensionCard` expandida.
5. El mismo disclaimer debe aparecer si el usuario reactiva la pensión tras haberla desactivado. No hay "ya lo viste una vez, no te lo enseño más" — la decisión es lo suficientemente importante para reafirmarla.

### 2c. La pensión no se cobra hasta la edad de jubilación

En todas las cards y cálculos que muestren la pensión como ingreso activo:

1. Comprueba si la edad actual del usuario (`state.profile.age`) es **mayor o igual** a la edad legal de jubilación configurada en `plan.publicPension` (campo `startAge` o similar; si no existe, asume 67).
2. Si la edad actual < edad de inicio de pensión: en cards de Hoy, FinancialHealthCard, MonthlyFlowCard etc., **no** sumes la pensión al ingreso pasivo actual. La pensión no entra en el cálculo hasta esa edad.
3. En la proyección a largo plazo (`projectV2`), la pensión sí debe aparecer **a partir del mes correspondiente a su edad de inicio**. Verifica que esto ya funciona así; si no, corrígelo.
4. En cualquier card que muestre la pensión como contribución al "Tu dinero ya trabaja" o equivalente, si la pensión está activada pero aún no aplicable por edad, muestra un mensaje claro:

> *"Pensión pública activada. Empezará a contar desde los XX años. No suma a tu ingreso actual."*

Estilo: `T.serif` italic, `T.muted`, fontSize 12, debajo de la cifra principal o como banda inferior de la card.

---

## Corrección 3 · Monte Carlo legible de primeras

**Bug actual:** la card de Monte Carlo (`MonteCarloCard`, función al ~línea 2400-2700) muestra el gráfico pero no se interpreta sin leer el artículo de Aprende. Los ejes no están labeleados, no hay leyenda visual de las bandas, no hay frase introductoria que sintetice qué se ve.

**Comportamiento esperado:**

### 3a. Frase introductoria justo encima del gráfico

Una sola frase de máximo dos líneas, fontFamily `T.serif`, fontSize 14, color `T.muted`, lineHeight 1.55, italic:

> *"Cada línea es un futuro posible. Cada futuro asume retornos aleatorios año a año en torno a tu media histórica. Lo importante no es la línea exacta, sino en qué porcentaje de futuros tu patrimonio cubre la meta."*

### 3b. Ejes con labels explícitos

Si el `LineChart` o componente equivalente que usa la card lo permite, añade:

- Eje X label: "Edad". Ticks cada 5 o 10 años, según el rango visible. **No** uses "meses desde inicio" o similar.
- Eje Y label: "Patrimonio (€)". Si el estado de displayMode es 'real', sub-label "ajustado por inflación a € de hoy".

Si los componentes existentes no soportan labels nativos, añade los labels como elementos absolutos posicionados al lado del gráfico (no hace falta integración compleja con Recharts).

### 3c. Leyenda de bandas

Justo debajo del gráfico, una tira horizontal con tres swatches y etiquetas:

- Swatch color amber, dashed: *"10% peor de los escenarios"*
- Swatch color `T.accent`, sólido: *"Escenario típico (mediana)"*
- Swatch color verde claro (`T.green` con opacidad 0.3): *"10% mejor de los escenarios"*

Estilo: `T.mono` 10px uppercase, gap 12, padding-top 8. Si la card ya tiene una leyenda implícita, sustitúyela; no dupliques.

### 3d. Cómo leer este gráfico (colapsable)

Debajo de la leyenda, un botón "+ ¿Cómo leer este gráfico?" similar a `OnboardingHelp` pero adaptado al contexto de card. Al desplegar, muestra:

> Mi Plan corre [N] simulaciones de tu plan, donde cada año recibe un retorno aleatorio en torno a tu rendimiento medio asumido (con la volatilidad correspondiente). Cada simulación traza una curva distinta.
>
> **Lo que importa no es una curva concreta.** Es la distribución de resultados. Si en el 85% de simulaciones tu patrimonio cubre tu meta, tu plan es robusto. Si solo en el 50%, es frágil: solo funcionará si tienes suerte con la secuencia de retornos.
>
> **Las bandas que ves** representan los percentiles. La banda inferior (amber) es el 10% de escenarios peores. La línea central (naranja) es la mediana. La banda superior (verde) es el 10% de escenarios mejores. Tu plan vive en el espacio entre las bandas.
>
> **El número clave** es el porcentaje de éxito: ¿en qué proporción de futuros llegas a tu meta? Más del 80% es señal de plan sólido. Menos del 70%, señal de plan frágil.

(Sustituye [N] por la variable real con el número de trials que use la implementación.)

### 3e. Tooltip al hover

Si el gráfico ya soporta hover y muestra valores: asegúrate de que el tooltip muestra **edad** (no "mes 240"), **patrimonio en €**, y opcionalmente el percentil. Si esto no está implementado, no es bloqueante.

---

## Corrección 4 · Mes a Mes con curvas duales (plan vs realidad)

**Bug actual:** en ScreenMesAMes, cuando el usuario aporta más de lo previsto en un mes, en algunos casos la proyección muestra "vas con retraso vs plan". Esto contradice la realidad y mina la confianza del usuario.

**Causa probable:** el `planned` registrado en cada mes es snapshot del plan vigente cuando se creó el mes. Si después el usuario cambia el plan en Ajustes (sube el aporte), el `planned` antiguo queda obsoleto, pero el `computePlannedFor` recalcula contra el plan vigente. El usuario aporta más que el "planned" guardado pero menos que el plan recalculado vigente, y el sistema dice "vas con retraso".

**Comportamiento esperado:**

### 4a. Dos curvas en la pantalla Proyección (y donde aplique)

Junto a la curva del "plan original" debe mostrarse una segunda curva: la **curva real reconstruida**.

- **Plan original**: la curva que ya existe. Asume aportaciones según los tramos y eventos definidos. Sin cambios.
- **Curva real reconstruida**: a partir del estado actual del usuario, reconstruye lo que **realmente** habría pasado si en los meses ya registrados se hubieran aportado las cantidades reales (`actual`), no las planificadas. Para meses futuros (sin `actual`), usa la planificación normal.

Es decir: la curva real **diverge** de la del plan en los meses donde aportaste más o menos de lo previsto, y luego sigue paralela según el plan a partir del último mes registrado.

Estilo visual: la curva real en color `T.green` si el patrimonio acumulado real está por encima del plan original a la última fecha registrada, en `T.red` si está por debajo. Línea sólida 2.5px. La curva del plan original en `T.accent` o `T.faint` según destaque (la real es la protagonista cuando hay datos reales).

### 4b. Reescritura de los mensajes comparativos

En ScreenMesAMes, los mensajes actuales de "vas por delante / con retraso" deben usar la nueva lógica:

- Compara el **patrimonio real acumulado a la fecha del último mes registrado** con el **patrimonio del plan original a esa misma fecha**.
- Si real > plan: *"Vas por delante. A este ritmo, alcanzas la independencia financiera a los XX años en lugar de los YY originalmente previstos."* (Calcular XX recalculando la proyección desde el patrimonio real actual.)
- Si real < plan: *"Vas por detrás del plan original. Si esto se mantiene, tu independencia se retrasa hasta los XX años."*
- Si real ≈ plan (diferencia <1%): *"Vas en línea con tu plan."*

Estilo: tipografía editorial, sin alarmismo. Las cifras concretas son las que hablan, no los adjetivos.

### 4c. Garantía técnica

- La función `projectV2` debe poder recibir un parámetro adicional `realContributions` con el array de aportaciones reales mes a mes registradas. Si lo recibe, las usa en lugar del cálculo planificado para los meses pasados.
- Si la función actual no soporta este parámetro, extiéndela manteniendo compatibilidad hacia atrás: si `realContributions` es `undefined`, comportamiento idéntico al actual.
- **Atención:** este cambio toca el motor de proyección. Es la corrección con más riesgo técnico del prompt. Valida exhaustivamente que las curvas existentes (Proyección, Hoy, onboarding preview) siguen pintándose correctamente.

### 4d. Eliminación del bug del "planned" obsoleto

Independientemente de las curvas duales, el sistema **no** debe decir "vas con retraso" cuando el usuario aportó más que el plan original. Si tras los cambios anteriores este caso sigue ocurriendo en alguna pantalla, identifica dónde y corrígelo.

---

## Corrección 5 · Inputs numéricos: revisión general

Mientras trabajas en las correcciones anteriores, revisa los siguientes inputs y aplica las correcciones que correspondan. Pequeño barrido de calidad.

### 5a. Onboarding · campo de capital inicial

Verifica que acepta cifras grandes (hasta 10M€) y pequeñas (incluso 0). Verifica que los chips de quick-set (0, 500, 2000, 5000, 15000, 50000) funcionan correctamente.

### 5b. Ajustes · edad y edad de jubilación

Verifica que la edad de jubilación **siempre** es mayor que la edad actual. Si el usuario sube su edad por encima de la edad de jubilación, fuerza un ajuste automático: edad de jubilación = edad + 1.

### 5c. Eventos · importe y fecha

Verifica que los importes de eventos pueden ser negativos (gastos imprevistos) sin que el sistema los trate como error. Verifica que las fechas en eventos futuros se pueden poner hasta la edad de jubilación + 30 años.

### 5d. Sliders · retorno, inflación, tasa de retiro

Verifica los rangos:
- Retorno anual: 0% a 20%. Por encima de 15% mostrar warning amber.
- Inflación: 0% a 15%. Por encima de 8% mostrar warning amber.
- Tasa de retiro: 2% a 8%. Por debajo de 3% o por encima de 6%, warning amber.
- Esperanza de vida: 70 a 110 años. Sin warning, edad libre.

Los warnings son del estilo de los micro-textos ya existentes en Ajustes (italic, T.muted, fontSize 13, debajo del slider).

---

## Entregable final

1. Archivo `mi_plan_v4.html` con las cinco correcciones implementadas.
2. `CHANGELOG_v4.md` con una línea por cambio significativo.
3. `BUGS_ENCONTRADOS.md` con cualquier bug colateral encontrado y **no** arreglado (con su gravedad estimada).
4. Validación Babel ejecutada al menos al final de cada corrección y al final del trabajo completo.
5. Verificación runtime en navegador con captura de pantalla rápida de cada cambio (o descripción textual si no hay capturas).
6. Si encuentras alguna ambigüedad en este prompt que no puedas resolver por las reglas del documento de contexto, **para y pregunta**. No improvises sobre filosofía del producto, copy editorial, ni cambios de comportamiento no especificados.
