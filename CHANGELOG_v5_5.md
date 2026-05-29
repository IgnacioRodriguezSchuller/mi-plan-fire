# CHANGELOG mi_plan_v5_5.html

Derivado de `mi_plan_v5_4.html`. Una línea por cambio significativo.

## Sprint 1 · Rediseño de `MonteCarloCard` (feature insignia)

### MC1 · Fan chart de 5 bandas
- `chartData` (en `MonteCarloCard`) ahora mapea `p10/p25/p50/p75/p90` y precomputa cuatro campos derivados (`outerLow`, `outerSpan`, `innerLow`, `innerSpan`) que Recharts usa para apilar dos `<Area>` con gradiente.
- El `<ComposedChart>` se reescribe con dos pares de `Area` apiladas (truco `stackId` + un area invisible al low + un area visible al span) para pintar dos bandas concéntricas en `T.accent`:
  - Inner band (p25–p75): gradiente `mcbandInner` con alpha 0.26 → 0.14 ("rango probable").
  - Outer band (p10–p90): gradiente `mcbandOuter` con alpha 0.10 → 0.04 ("rango plausible").
- Mediana p50 como `<Line>` sólida 2.4px en `T.accent`.
- p10 y p90 como `<Line>` finas (1px) con `strokeOpacity={0.35}` en `T.accent`: marcan los bordes sin dominar visualmente.
- Tooltip actualizado: muestra `p10/p25/Mediana/p75/p90` con etiquetas legibles y **suprime** las filas técnicas `outerLow/outerSpan/innerLow/innerSpan` que confundirían al usuario.
- Leyenda reescrita con tres entradas que ahora cuentan: *"Mediana — la mitad de futuros queda por encima, la mitad por debajo"*, *"Rango probable — 50% central (p25–p75)"*, *"Rango plausible — 80% central (p10–p90)"*.

### MC2 · Año probable de quiebra
- `runMonteCarlo` ahora registra `depletionYear` por trial (índice del primer año en que el portfolio toca 0) y acumula `depletionYears = [...]`.
- El retorno incluye dos campos nuevos:
  - `depletionYears`: array de años índice donde el plan falló (vacío si todos exitosos).
  - `depletionAgeStats`: `{ median, p25, p75, count }` calculados sobre los años de fallo más `fromAge`, o `null` si no hubo fallos. Edades enteras (`Math.round`).
- Nueva sección visible en la card solo cuando `result.depletionAgeStats != null`, justo antes del párrafo final. Copy editorial honesto-incómodo:
  - *"En los N escenarios donde tu cartera se agota, la edad mediana en que ocurre es **X** años. La mitad central de fracasos ocurre entre los p25 y los p75."*
  - *"Importa porque a los X años, ¿qué fuentes de ingreso te quedan? Pensión pública, ayuda familiar, vender vivienda. Si ninguna basta, este es el momento real de tu riesgo."*
- Verificado runtime: con el plan demo (88% éxito), la sección aparece con la cifra de los 12% de fallos.

### MC3 · Supuestos transparentes plegables
- Segundo `OnboardingHelp` añadido después del de "¿Cómo leer este gráfico?". Título: *"Supuestos de esta simulación"*.
- Tabla `auto 1fr` con 8 filas: Modelo, Rentabilidad media, Volatilidad asumida, Inflación, Tasa de retiro, Simulaciones, Aporte mensual y **Secuencia de retornos** (extra para reflejar el toggle del MC4). Todos los valores vienen del `plan` y `result` en vivo: cambiar el plan recalcula los valores expuestos.
- Cierre con párrafo italic muted: *"…El modelo no predice; explora consecuencias de tus asunciones."*

### MC4 · Sequence-of-returns: caída temprana vs tardía
- **Motor**: nueva opción `opts.sequenceMode` en `runMonteCarlo` (`'random'` por defecto, `'early-crash'`, `'late-crash'`).
- Implementación: por cada trial se generan todos los retornos del año primero (`buildYearReturns`), se ordenan ascendente, se separan los 5 peores y se colocan en el slot correspondiente. El resto se baraja con Fisher–Yates y rellena las posiciones libres.
  - `early-crash`: 5 peores en `[yearsAccum, yearsAccum+5)` — primeros años de decumulación, ancla del "riesgo de secuencia" descrito por Bengen.
  - `late-crash`: 5 peores en `[yearsTotal-5, yearsTotal)` — finales del plan.
- Edge case: si `yearsTotal <= 5`, el modo cae a `random` para no degenerar.
- **UI**: toggle minimalista entre header y chart con label `Secuencia de retornos:` + 3 chips estilo badge (`fontFamily: T.mono`, accent fill cuando activo). Texto contextual italic-muted aparece solo cuando NO es `random`, explicando qué se está forzando y la idea académica detrás.
- `sequenceMode` añadido al `inputsKey` y propagado al `runMonteCarlo` para que el cambio dispare re-ejecución.
- También aparece en la tabla de supuestos para que el usuario vea qué modo está activo cuando lee el plegable.
- **Verificación cuantitativa** runtime con el demo: Aleatoria 88% éxito, Caída temprana 4%, Caída tardía 95%. El efecto SoR es dramático y la dirección es la esperada (early < random < late, en este orden).

### MC5 · Suavizado del copy del header
- El párrafo bajo "Probabilidad de éxito" cambia de la descripción técnica del modelo (que ya vive en el plegable de supuestos) a un mensaje editorial:
  - Antes: *"{N} simulaciones con volatilidad realista (X% σ anual). Cada año aplica un retorno aleatorio en torno a tu Y%."*
  - Ahora: *"{N} simulaciones de tu plan completo. El % de éxito resume el resultado pero esconde la asimetría: leerlo solo es engañoso. Mira las bandas del gráfico y, sobre todo, lo que dice 'Si el plan falla' al final."*
- El badge grande del % se mantiene intacto (decisión editorial explícita del prompt).

## Compatibilidad
- La firma exterior `runMonteCarlo(plan, profile, opts)` se preserva. Los campos nuevos del retorno (`depletionYears`, `depletionAgeStats`, `sequenceMode`) son aditivos: ningún consumidor previo se rompe.
- `projectV2` sin tocar.
- Claves de state sin tocar.
- 500 trials por defecto, sin subir.

## Verificación
- Babel: sintaxis OK tras cada bloque MC1–MC5.
- Runtime Playwright + Chromium headless con todas las dependencias locales:
  - MC1: leyenda nueva visible (Mediana / Rango probable / Rango plausible). ✓
  - MC2: bloque "Si el plan falla" aparece en el demo (con 12% de fallos). ✓
  - MC3: encabezado "Supuestos de esta simulación" + apertura muestra la tabla con "Lognormal (retornos log-normales…)". ✓
  - MC4: toggle visible, las tres modalidades funcionan; cifras del demo (8% retorno, 4% withdrawal, vida 90) coinciden con la teoría de Bengen — Aleatoria 88%, Caída temprana 4%, Caída tardía 95%. ✓
  - MC5: copy nuevo presente. ✓
  - Cero `pageerror`, cero errores de consola.

## ADN editorial · revisión
- ¿Vendemos tranquilidad falsa? No. El header dice explícitamente "leerlo solo es engañoso". El bloque "Si el plan falla" no oculta el momento real del riesgo.
- ¿Ocultamos la asimetría? No. El fan chart visibiliza ambas colas. El toggle SoR es el más honesto posible: deja que el usuario fuerce el peor escenario y vea por sí mismo el colapso de su % éxito.
- ¿Marketing-speak? No. Cero "potencia", "transforma", "asegura".
- ¿Asume usuario tonto? No. Vocabulario p25/p50/p75 explícito en leyendas; supuestos numéricos transparentes; copy del SoR menciona Bengen.
