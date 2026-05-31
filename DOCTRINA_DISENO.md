# Mi Plan FIRE — Doctrina de diseño

> Documento vivo. Toda decisión visual o de interacción del producto se subordina a este texto. Cualquier prompt futuro a Claude Code que toque UI o UX debe referenciarlo en cabecera.
>
> **Versión:** 1.2.1 · Mayo 2026 · Destilada en chat de planificación tras el cierre de v1.4.0a · Atemperada (Ruta B), paleta P3 de inputs, y T.amber añadido como cuarta opción válida para cifras hero (patch v1.2.1).
> **Documentos hermanos:** `CLAUDE_CODE_CONTEXTO.md` (contexto técnico), `DECISIONES_PRODUCTO_4.md` (bitácora editorial y modelo de distribución).
> **Aplica a:** el codebase `app/src/` (build **Vite** single-file; v1.5.0a.3 funcional, app idéntica) y versiones posteriores. *(Post-Etapa 1, mayo 2026: el HTML `mi_plan_v1_5_0a_3.html` queda **congelado como red de regresión**, no se edita — hash `b3ea52b1…3603e7`; ver `CHANGELOG_v1_5_0a_3_src.md`.)* La doctrina visual/UX de abajo **no cambia** con la migración.

---

## §1 · Principios

Siete principios. Cualquier regla operativa de §2 se justifica desde uno de ellos. Cualquier antipatrón de §3 viola uno de ellos.

**P1 · Producto financiero con voz editorial, no pieza editorial sobre finanzas.** La estructura del producto manda sobre la narrativa cuando compiten por el ojo. El usuario navega por anclajes antes de leer prosa.

**P2 · Jerarquía visual por niveles de scope.** No hay una escala lineal única. Cada scope tiene su techo y nada dentro lo excede. Cuatro scopes: marca (logo, nav), página (address una vez), sección (anclaje numerado, techo de su sección), bloque (lead, KPI destilado, body, controles).

**P3 · UX iOS.** Proximidad funcional (controles renderizados solo donde tienen efecto), divulgación progresiva inline (sin overlays flotantes salvo para modales conscientes), comportamiento de expansión con reglas explícitas de overflow.

**P4 · Diglosia tipográfica.** El producto habla dos idiomas y ningún elemento es ambiguo. Voz editorial cálida (Instrument Serif para display y citas, Fraunces para prosa). Voz técnica fría (DM Mono para labels, eyebrows, ticks, metadata, footer legal). Cada elemento sabe en qué idioma habla.

**P5 · Economía de énfasis.** El acento cromático y el peso bold son recursos escasos. Se reservan a tres situaciones: (a) marca, una vez por pantalla; (b) cifras o términos-ancla que el ojo debe poder cazar en lectura diagonal, máximo 3 por párrafo y 4 por viewport; (c) elementos recién activados o fácilmente pasables por alto. Si todo es accent, nada lo es.

**P6 · No romper convenciones humanas salvo cuando hace falta.** El ojo del usuario está entrenado por iOS, Apple, Stripe, NYT, Granta. Romper esos patrones tiene coste cognitivo. La doctrina rompe el patrón solo cuando hay razón editorial específica (ej.: el address "Hola, {nombre}" mayor que los anclajes de sección porque el saludo es momento, no estructura). En todo lo demás, sigue la convención.

**P7 · Orden de lectura canónico.** Al entrar a una pantalla: logo (escaneo periférico de marca) → address si lo hay → anclaje de sección → contenido → controles.

---

## §2 · Reglas operativas

Mapeo elemento → tokens. Ordenado por scope.

### Scope marca

**Logo "Mi Plan"** · `fontFamily: T.display` italic, `fontSize: 28` (excepción inline marcada `/* excepción · brand identity */`), `color: T.accent`, `lineHeight: 1`. Clicable, dispara `window.__openRevisitLanding`. Top-left de la barra global en ambos shells.

**Nav principal (5 secciones)** · `fontFamily: T.display` italic, `T.size.lead` (17), `color: T.ink`. Tab activo: `borderBottom: 2px solid T.accent`. Inactivo: borderBottom transparente. Gap entre tabs 24px. Migración explícita desde mono uppercase 11 del código actual. Iconos heredados (◐ Mi Plan · ◢ Proyección · ◧ Seguimiento · ◇ Aprende · ◌ Ajustes).

### Scope página

**Address "Hola, {nombre}"** · `fontFamily: T.display`, `T.size.displayLg` (clamp 28-44), `letterSpacing: T.tracking.display`, `T.lh.tight`, `color: T.ink`. **Excepción declarada del techo de scope:** deliberadamente mayor que los anclajes de sección como toque de atención medido. Una sola aparición por carga de página, solo en contextos de bienvenida personal (pantalla Mi Plan). No replicar este tamaño en otros saludos del producto.

**Footer legal** · `fontFamily: T.mono`, `T.size.eyebrow` (11), uppercase, `T.tracking.widest`, `color: T.faint`. Una línea informativa por pantalla. Sin CTA. Sin acento. Patrón: `datos guardados en local · mi plan v{x.y.z}`.

### Scope sección

**Anclaje numerado** · Flexbox baseline, gap 14, `paddingBottom: 12`, `borderBottom: 1px solid T.line`. Numeración ("01" / "02" / "03"): `T.mono`, `T.size.caption` (13), `T.tracking.widest`, `color: T.faint`. Título: `T.display`, `T.size.displayMd` (clamp 24-32), `T.tracking.tight`, `T.lh.tight`, `color: T.ink`. **Techo de su sección:** nada dentro la excede salvo las dos excepciones declaradas (KPI hero highlight, KPI destilado a 28).

**Sub-anclaje (1.A / 1.B / 1.C / 1.D)** · Mini-anclaje completo. Numeración ("1.A"): `T.mono`, `T.size.eyebrow` (11), `T.tracking.widest`, `color: T.faint`. Título: `T.display`, `T.size.subtitle` (22), `T.tracking.tight`, `T.lh.tight`, `color: T.ink`. Sin `borderBottom`. Gap 10 entre numeración y título. `margin-top: 24`.

### Scope bloque · prosa

**Lead narrativo** · `T.serif` (Fraunces), `T.size.lead` (17), regular, `T.lh.relaxed`, `color: T.ink`, `maxWidth: 560-640`. Cifras clave dentro del lead con énfasis inline (ver más abajo).

**Body de prosa** · `T.serif`, `T.size.body` (15), `T.lh.normal`, `color: T.ink` (alternativa: `T.muted` para subtonos secundarios).

**Body italic muted** · `T.serif` italic, `T.size.body` (15), `T.lh.normal`, `color: T.muted`. Usado para notas al margen, captions de aclaración, "estas cifras son orientativas".

**Helper text bajo controles** · `T.serif` italic, `T.size.caption` (13), `T.lh.normal`, `color: T.faint`. Aparece pegado al control que explica.

**Énfasis inline** · Dos variantes únicas. Para términos-ancla: `<strong>` + `color: T.ink` + `fontStyle: normal` (mantiene la familia de la prosa). Para cifras clave: `<strong>` + `color: T.accent` + `fontStyle: normal`. **Nunca se cambia familia tipográfica en énfasis inline** (no mono dentro de serif). **Cuota numérica obligatoria**: máximo 3 énfasis por párrafo. Máximo 4 cifras-accent visibles en un mismo viewport (~700px de scroll). Si un párrafo necesita más, el contenido se parte. Si un viewport necesita más, la pantalla se reorganiza.

### Scope bloque · cifras

**KPI destilado** (dentro de card normal, ej. "Tasa de ahorro · 34%") · `T.display` (Instrument Serif), `T.size.displayMd` (28), `T.tracking.tight`, `T.lh.tight`, `color: T.ink`. Sufijo de unidad: `T.display`, `T.size.lead` (17) o (20), `color: T.muted`. **Excepción de scope declarada:** el destilado puede ser mayor que su sub-anclaje porque la cifra es el contenido del bloque, la etiqueta no.

**KPI hero** (cifra protagonista, ej. "−210.000€") · `T.display`, `T.size.displayLg` (38), `T.tracking.display`, `T.lh.tight`. Color semántico cuando aplica: `T.ink` (descriptivo, p.ej. patrimonio, edad de libertad financiera, target de hito), `T.green` (ganancia, valor #3B6D11 ligeramente aclarado para legibilidad), `T.red` (pérdida inesperada, riesgo, o coste teórico del framing "lo que pierdes si no actúas"), `T.amber` (coste contratado o asumido que merece atención visual sin alarma, p.ej. intereses totales de hipoteca, comisiones acumuladas significativas). Sufijo de unidad: `T.display`, 22, `color: T.muted`. **Regla operativa**: el color solo cambia cuando la ganancia o pérdida es el mensaje principal del bloque; en cifras descriptivas, siempre `T.ink`. **Toda cifra hero vive sobre fondo claro.** No existe variante "inverted" en el producto.

**Cifra editable inline** (`EditableNumber`) · `T.display` weight 500, `color: T.ink`, `borderBottom: 1px dashed T.accent`, `padding: 0 2px`, `cursor: pointer`. Vive dentro de prosa serif. Al editar, comportamiento idem `<input>` (ver scope inputs).

**Sufijo de unidad** · `T.display`, tamaño proporcional al número (subtitle si número subtitle, lead si número destilado/hero medium, 22 si número 38). `color: T.muted`. `marginLeft: 2-4`.

**Delta / variación** · `T.mono`, `T.size.eyebrow` (11), color semántico (`T.green` / `T.red` sobre fondo claro; `T.greenInverted` / `T.redInverted` sobre fondo inverted). `marginLeft: 8-10`.

### Scope bloque · controles e inputs

**Toggle ON/OFF** · Switch iOS-clásico. Ancho 36, alto 20, bola 16. ON: fondo `T.ink`, bola `T.bg`, bola alineada derecha. OFF: fondo `T.line`, bola `T.paper`, bola alineada izquierda. Pegado al elemento que afecta. Si no afecta a nada visible en el contexto, no se renderiza.

**Segmented control** · Regla dual:
- *Cuando la decisión tiene consecuencia financiera y necesita explicación* (Proporcional/Fijo, modo de aporte, allocations): **cards con descripción inline**. Cada opción es un botón flexible con `<strong>` en Instrument Serif 17 + `<span>` Fraunces italic 13 muted como descripción de una frase. Active: `borderColor: T.accent`, `background: rgba(T.accent, 0.04)`. Idle: `border: 1px solid T.line`, `background: T.paper`.
- *Cuando es elección rápida sin consecuencia* (filtros, vistas, opciones cortas): **underline mono limpio**. Texto mono uppercase 11 con `borderBottom: 2px solid` accent en activo, transparent en inactivo. Gap 24px entre opciones.

**Slider** · Track 4px `background: T.line`, fill `background: T.accent`, thumb 18×18 `background: T.ink` con `border: 2px solid T.bg`. Valor numérico encima en `T.display` 22.

**Input** (toda variante: texto, número, etiqueta) · `T.serif` (Fraunces), `T.size.body` (15), `color: T.muted` (#6e6253, **nunca T.ink**). `background: T.inputBg` (#faf3e4, token nuevo, beige sutil más claro que el bg cream). **Sin borde estructural.** `borderRadius: 6`, `padding: 10px 12px`. `box-shadow: inset 0 0 0 1px T.line` en idle. **Focus:** `box-shadow: inset 0 0 0 1.5px T.accent`, sin halo externo, sin sombra de color. **Reset CSS obligatorio:** todo input debe llevar `appearance: none` y `-webkit-appearance: none` para evitar que el navegador (especialmente en macOS/iOS modo oscuro) sobrescriba el background con su estilo nativo oscuro. **Regla irrenunciable: cero negro en ningún elemento del input ni en su contenido.** El texto se ve deliberadamente más claro que la prosa del producto. Diglosia funcional: lo que lees es T.ink, lo que escribes es T.muted.

**Label encima del input** · `T.serif` (Fraunces), `T.size.caption` (13), `color: T.muted`. Copy en frase natural ("Cuánto ganas al mes (neto)") sin necesidad de voz interrogativa. No es entrevista, es formulario sobrio.

### Scope bloque · contenedores

**Card normal** · `background: T.paper`, `border: 1px solid T.line`, `borderRadius: 8`, `padding: 20px`. Contenedor por defecto. Sin sombras.

**Card highlight** · **Eliminada del producto en revisión 1.1 (atemperamiento Ruta B).** No se usa variante inverted.

**Callouts (Lección clave · Regla · Warning)** · Patrón unificado **U1**. `borderLeft: 3px solid {color semántico}` + `background: rgba({color}, 0.06-0.08)` + `borderRadius: 0 6px 6px 0` + `padding: 14px 18px-22px`. Eyebrow: `T.mono`, `T.size.eyebrow` (11), uppercase, tracking widest, color del semántico. Body: depende del rol:
- *Lección clave* (cita textual del corpus): body en `T.display` italic 17-20, color `T.ink`. Semántico: `T.accent`.
- *Regla* (norma destilada): body en `T.serif` italic 15-17, color `T.ink`. Semántico: `T.muted`.
- *Warning* (advertencia): body en `T.serif` regular 15, color `T.ink`. Semántico: `T.amber`.

**Modal** · Dos tamaños declarados:
- *Modal conversacional* (480-560 width): para flujos donde la atención debe quedarse fuera del documento con texto narrativo + 1 CTA. Patrón: `WhyDifferentModal`.
- *Modal embedded view* (920 width): para mostrar la vista completa de otra screen dentro de un overlay. Patrón: `SinMiPlanModal` con `<ScreenSinMiPlan embedded />`. `MonthlyCalendarModal`.
Ambos: `background: T.paper`, `borderRadius: 14`, overlay `rgba(T.ink, 0.6)`, sombra `0 12px 40px rgba(T.ink, 0.18)`. Close icon `T.mono` 14 top-right. Title `T.display` 26.

**Tooltip sobre término-concepto** · **V-expand · expansión inline.** Patrón: el término aparece en prosa con `borderBottom: 1px dotted T.muted` (idle) o dashed T.accent (al hover en desktop, siempre dashed en mobile). Al clic, se renderiza inline justo después del párrafo un callout reusando el patrón U1 de Lección clave (border-left accent + bg accentSoft + eyebrow mono accent + cuerpo serif italic + CTA "Leer ficha completa →" en mono accent que abre `ConceptModal`). Cierra al volver a clicar el término o al pulsar otro término. **Idéntico en mobile y desktop.** Coherente con P3 (divulgación progresiva inline).

**Empty state** · `border: 1px dashed T.line`, `padding: 38px 24px`, `textAlign: center`, `borderRadius: 10`, `background: rgba(T.paper, 0.4)`. Title `T.display` 20, descripción `T.serif` italic 14 muted (max-width 340 centered), CTA mono 11 uppercase color accent con `borderBottom: 1px solid T.accent`.

**Anidamiento** · Si un callout aparece dentro de una card, vive dentro de la card (sin sacarlo a flujo libre). Coherente con P2 (doctrina del techo de scope).

### Scope sección · charts

**Ticks (etiquetas de ejes)** · `T.mono`, `T.size.eyebrow` (11), color `T.faint`, `letterSpacing: 0.04em`.

**Líneas** · Principal 2px sólida `T.accent`. Referencia 1.5px dashed (`strokeDasharray: 4 4`) color `T.faint`. Convención universal: dashed = referencia, sólido = dato del usuario.

**Leyenda** · `T.mono` uppercase 11, color `T.muted`, posición inferior bajo el chart con margen 12px. Items inline con swatch 18×2.

**Grilla y axes** · Grilla horizontal sutil `T.lineSoft`. Axes `T.line`. Ticks `T.faint`.

---

## §3 · Antipatrones

Lo que NO se hace. Cada antipatrón es la violación de un principio.

**A1 · Anclaje de sección invadido por contenido.** Cualquier elemento de prosa (lead, body, etiqueta) que sea visualmente más grande que el anclaje de su sección viola P2. Excepción declarada: KPI destilado a 28 dentro de sub-bloque. Cualquier otra excepción se redacta explícitamente en §2 antes de implementar.

**A2 · Cambio de familia tipográfica para énfasis inline.** Meter una cifra en mono dentro de un párrafo serif rompe la diglosia (P4). El énfasis se hace con peso y color, no con familia.

**A3 · Toggle separado de su efecto.** Renderizar `DisplayModeToggle` "Ajustar por inflación" en una sección donde no cambia nada visible viola P3 (proximidad funcional). El toggle vive pegado a lo que modifica o no se renderiza.

**A4 · Más de 3 énfasis por párrafo / 4 cifras-accent por viewport.** Viola P5 (economía de énfasis). Si los necesitas, el contenido está mal estructurado.

**A5 · Helper técnico con label editorial (o viceversa).** Mezclar label `T.display` italic 17 con helper text en `T.mono` uppercase rompe la voz del formulario. Si los inputs son entrevista, todos los elementos del par label/input/helper hablan el mismo idioma editorial. Si son producto-y técnico, todo es mono. No se mezcla.

**A6 · Overlay flotante para divulgación menor.** Abrir un modal completo para mostrar la definición de un término es violación de P3. Para definiciones menores se usa expansión inline (V-expand). Modales solo cuando la atención debe quedarse fuera del documento.

**A7 · Diferencias de tratamiento entre callouts del mismo rol.** Si "Lección clave" se renderiza distinto en dos pantallas distintas, viola la consistencia de §2. Mismo rol → mismo patrón.

**A8 · Card que envuelve callout suelto que envuelve card.** Anidamiento triple. Si te encuentras anidando más de dos niveles de contenedor (card > callout > card), simplifica.

**A9 · KPI destilado en color sin razón semántica.** Las cifras descriptivas (patrimonio, ingresos, tasa de ahorro, edades, targets) son `T.ink`. El color (verde, rojo, amber, accent) se reserva para cifras donde la ganancia, pérdida o coste de atención es el mensaje, o para énfasis inline declarado. Accent en cifras hero/destilado nunca: es color de marca y de énfasis inline, no de cifra principal.

**A10 · Saludo personal replicado a tamaño hero en pantalla secundaria.** "Hola, {nombre}" displayLg solo aparece una vez por sesión, en la cabecera de Mi Plan. Saludos secundarios ("Bienvenido de vuelta", recap del onboarding paso 9) van como mucho a `T.size.subtitle` (22). Replicar el hero diluye su significado.

---

## §4 · Checklist de verificación

Cualquier pantalla o componente nuevo debe pasar estas preguntas binarias antes de darse por bueno. Si una respuesta es "no", la pantalla no se aprueba.

1. **¿El elemento más prominente visualmente del bloque es también el más importante semánticamente?** (P2)
2. **¿Cada control está visualmente pegado y vinculado al elemento que modifica, o no se renderiza si no aplica?** (P3, A3)
3. **¿Cada elemento expandible (desplegable, modal, callout inline) cabe en su espacio o tiene regla explícita de overflow/portal?** (P3)
4. **¿Los énfasis cromáticos y bold en el bloque son ≤3 por párrafo y ≤4 por viewport?** (P5, A4)
5. **¿Cada elemento tipográfico habla coherente con su scope?** (Voz editorial donde corresponde, voz técnica donde corresponde, sin mezcla dentro del mismo par funcional. P4, A5)
6. **¿Ningún elemento del scope viola el techo de su scope, salvo las excepciones declaradas en §2?** (P2, A1)
7. **¿Las decisiones del usuario con consecuencia financiera tienen su explicación inline (en cards descriptivas o en helper inmediato)?** (Coherencia con segmented V5)
8. **¿La pantalla funciona idéntica en mobile y desktop, o tiene fallback declarado para mobile?** (P3, evita V-pop, V-sidenote desktop-first)

---

## §5 · Referencia a tokens

### Tipografía (v1.3.0, no se modifica)

`T.display` = Instrument Serif (display, hero, anclajes, KPIs grandes).
`T.serif` = Fraunces (prosa, lead, body, captions).
`T.mono` = DM Mono (labels, eyebrows, ticks, footer).
`T.size.*` y `T.lh.*` y `T.tracking.*` ver `CLAUDE_CODE_CONTEXTO.md` §Sistema tipográfico.

### Paleta (v1.3.0 + tokens nuevos de esta doctrina)

Existentes:
- `T.bg` #f5f0e6 · `T.paper` #fffdf7 · `T.panel` #ebe4d5
- `T.ink` #1a1612 · `T.ink2` #0f0f10 · `T.muted` #6e6253 · `T.faint` #968874
- `T.line` #d4c9b0 · `T.lineSoft` #e0d6bf
- `T.accent` #c2410c · `T.accentSoft` rgba(194,65,12,0.08)
- `T.green` #15803d · `T.greenSoft` rgba(21,128,61,0.10)
- `T.amber` #b45309 · `T.red` #b91c1c

**Tokens nuevos en esta doctrina:** uno solo.
- `T.inputBg` = '#faf3e4' (beige sutil más claro que `T.bg` cream, fondo de todos los inputs)

La revisión 1.1 (atemperamiento Ruta B) eliminó los tres tokens propuestos en la versión 1.0 (`T.inkSoft`, `T.greenInverted`, `T.redInverted`) al desaparecer la variante inverted del producto. La revisión 1.2 (paleta P3 de inputs) añade `T.inputBg` como único token nuevo.

### Mapping rápido elemento → tokens

| Elemento | Familia | Size | Color | Notas |
|---|---|---|---|---|
| Logo "Mi Plan" | display italic | 28 [excepción] | T.accent | top-left, clicable |
| Nav tab | display italic | T.size.lead | T.ink | activo: borderBottom 2px T.accent |
| Address "Hola, {nombre}" | display | T.size.displayLg | T.ink | excepción declarada de scope |
| Anclaje sección título | display | T.size.displayMd | T.ink | techo de su sección |
| Anclaje sección numeración | mono | T.size.caption | T.faint | tracking widest |
| Sub-anclaje título (1.A) | display | T.size.subtitle | T.ink | gap 10 con numeración |
| Sub-anclaje numeración | mono | T.size.eyebrow | T.faint | tracking widest |
| Lead narrativo | serif | T.size.lead | T.ink | maxWidth 560-640, lh.relaxed |
| Body prosa | serif | T.size.body | T.ink | lh.normal |
| Body italic muted | serif italic | T.size.body | T.muted | notas al margen |
| Helper text | serif italic | T.size.caption | T.faint | pegado al control |
| Eyebrow KPI | mono uppercase | T.size.eyebrow | T.muted | tracking wider |
| Énfasis inline término | bold | hereda | T.ink | nunca cambia familia |
| Énfasis inline cifra | bold | hereda | T.accent | máx 3 por párrafo |
| KPI destilado | display | T.size.displayMd | T.ink | excepción scope sub-bloque |
| KPI hero | display | T.size.displayLg | T.ink/green/red/amber | color solo si pérdida/ganancia/coste es mensaje, siempre fondo claro |
| Editable inline | display weight 500 | hereda | T.ink | borderBottom dashed accent |
| Footer legal | mono uppercase | T.size.eyebrow | T.faint | tracking widest |
| Toggle ON | — | 36×20 | T.ink fondo, T.bg bola | iOS clásico |
| Toggle OFF | — | 36×20 | T.line fondo, T.paper bola | |
| Segmented cards | mixto | 17 + 13 | T.ink + T.muted | active borderColor T.accent |
| Segmented underline | mono uppercase | T.size.eyebrow | T.muted | active borderBottom T.accent |
| Slider track | — | 4px | T.line | |
| Slider fill | — | 4px | T.accent | |
| Slider thumb | — | 18×18 | T.ink + border T.bg | |
| Input idle | serif | T.size.body | **T.muted** (nunca T.ink) | bg T.inputBg #faf3e4, shadow inset T.line, sin borde |
| Input focus | serif | T.size.body | T.muted | shadow inset T.accent, sin halo |
| Label input | serif | T.size.caption | T.muted | copy en frase natural |
| Card normal | — | — | T.paper bg + T.line border | radius 8, padding 20 |
| Callout Lección | display italic body | 17-20 | borderLeft T.accent | bg accentSoft |
| Callout Regla | serif italic body | 15-17 | borderLeft T.muted | bg muted soft |
| Callout Warning | serif body | 15 | borderLeft T.amber | bg amber soft |
| Modal conversacional | — | 480-560 width | T.paper | radius 14 |
| Modal embedded | — | 920 width | T.paper | radius 14 |
| Tooltip V-expand | reusa callout Lección | — | borderLeft T.accent | inline expand |
| Empty state | mixto | display 20 + serif 14 | dashed T.line | radius 10 |
| Chart ticks | mono | T.size.eyebrow | T.faint | letterSpacing 0.04 |
| Chart línea principal | — | 2px | T.accent | sólida |
| Chart línea referencia | — | 1.5px | T.faint | dashed 4 4 |
| Chart leyenda | mono uppercase | T.size.eyebrow | T.muted | inferior |
| Chart grilla horizontal | — | — | T.lineSoft | sutil |
| Chart axes | — | — | T.line | |

---

## §6 · Revisiones

| Fecha | Versión doctrina | Qué cambió | Por qué |
|---|---|---|---|
| 2026-05 | 1.0 | Documento creado. Destilado del chat de planificación tras v1.4.0a. | Cerrar la fase de saneamiento con doctrina explícita antes de v1.4.0b. |
| 2026-05 | 1.1 | **Atemperamiento Ruta B.** Eliminada variante "KPI hero inverted" y "Card highlight". KPIs hero ahora siempre sobre fondo claro con T.green/T.red. Tokens nuevos T.inkSoft, T.greenInverted y T.redInverted eliminados de la propuesta. Inputs reformulados: texto en T.muted (nunca T.ink), borde T.lineSoft idle / T.accent focus, sin halo, sin caja oscura. Labels en Fraunces 13 muted con copy en frase natural (sin voz interrogativa editorial). | El conjunto KPIs hero inverted + inputs editoriales radicales rompía la armonía cálida del resto del producto. Específicamente, el "negro" del texto en inputs y el fondo oscuro del hero inverted eran disonancia visual no justificada. La doctrina conserva el espíritu editorial pero baja el dramatismo. |
| 2026-05 | 1.2 | **Paleta P3 de inputs aplicada + bug de reset CSS documentado.** Background del input cambia a T.inputBg (#faf3e4) beige sutil, sin borde estructural, shadow inset T.line en idle y T.accent en focus. Token nuevo T.inputBg añadido a la paleta. Documentada la obligación de `appearance: none` y `-webkit-appearance: none` en todo input para evitar que el navegador sobrescriba el fondo con su estilo nativo oscuro (bug detectado en macOS/iOS modo oscuro durante la sesión de validación visual). | El autor reportó persistentemente que los inputs se veían con fondo negro pese a tener background paper crema en código. Diagnóstico: reset CSS del navegador en modo oscuro ignoraba el background declarado. Solución: forzar appearance reset + paleta P3 con beige más oscuro que paper para que sea inequívocamente claro frente a cualquier inversión cromática. Aplica también a la auditoría del HTML actual en v1.4.0c. |
| 2026-05 | 1.2.1 | **T.amber añadido como cuarta opción válida para cifras hero.** Reservado a costes contratados que merecen atención visual sin alarma (intereses hipoteca, comisiones acumuladas). Detectado en audit SP-03 de v1.4.0b: la cifra "intereses totales de hipoteca" no encajaba en green/red/ink — es coste planificado, no pérdida inesperada (T.red exagera) ni descripción neutra (T.ink la invisibiliza). Amber es la gradación intermedia ya usada en otras superficies del producto (callout Warning). A9 actualizado en coherencia. | Cerrar el audit de cifras de v1.4.0b sin dejar una excepción no documentada. |

Toda modificación futura entra aquí con fecha. Si en v1.4.0b o posteriores aparece un caso que la doctrina no cubre, se añade a §2 y se data en §6. No se modifica doctrina ad-hoc en código sin actualizar este documento.

---

## Plan de ejecución acordado

- **v1.4.0b** aplica Bloques 1, 2, 3, 5, 6: identidad (logo, nav), prosa, KPIs sobre fondo claro, contenedores (callouts unificados U1), charts conservadores. Refactor moderado. Añade un único token a `T`: `T.inputBg` (#faf3e4), aunque sólo se usa en v1.4.0c.
- **v1.4.0c** aplica Bloque 4: refactor de ~50+ inputs al patrón sin negro. Específicamente: (a) background T.inputBg, sin borde, shadow inset T.line/T.accent; (b) reset CSS obligatorio (`appearance: none` y `-webkit-appearance: none`) para evitar que el navegador en modo oscuro sobrescriba el fondo; (c) texto del input en T.muted, nunca T.ink; (d) labels en Fraunces 13 muted con copy en frase natural. **Auditoría visual obligatoria en macOS/iOS modo oscuro como parte del cierre del sub-sprint** — sin esta verificación, el bug que motivó la revisión 1.2 puede persistir.

`CLAUDE_CODE_CONTEXTO.md` debe actualizarse en v1.4.0b para referenciar este documento desde su cabecera y añadir `T.inputBg` al apartado de paleta.
