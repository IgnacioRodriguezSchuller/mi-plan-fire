# Mi Plan FIRE — Doctrina de diseño

> Documento vivo. Toda decisión visual o de interacción del producto se subordina a este texto. Cualquier prompt futuro a Claude Code que toque UI o UX debe referenciarlo en cabecera.
>
> **Versión:** 1.11 · Junio 2026 · Destilada en chat de planificación tras el cierre de v1.4.0a y evolucionada hasta la rev. 1.11 (ver registro §6): atemperamiento Ruta B, paleta P3 de inputs, T.amber para cifras hero, rediseño de la pantalla Plan (3 movimientos), serif unificada en Fraunces y unidad de presentación NOMINAL por defecto.
> **Documentos hermanos:** `CLAUDE_CODE_CONTEXTO.md` (contexto técnico), `DECISIONES_PRODUCTO_4.md` (bitácora editorial y modelo de distribución).
> **Aplica a:** el codebase `app/src/` (build **Vite** single-file; v1.5.0a.3 funcional, app idéntica) y versiones posteriores. *(Post-Etapa 1, mayo 2026: el HTML `mi_plan_v1_5_0a_3.html` queda **congelado como red de regresión**, no se edita — hash `b3ea52b1…3603e7`; ver `CHANGELOG_v1_5_0a_3_src.md`.)* La doctrina visual/UX de abajo **no cambia** con la migración.

---

## §1 · Principios

Siete principios. Cualquier regla operativa de §2 se justifica desde uno de ellos. Cualquier antipatrón de §3 viola uno de ellos.

**P1 · Producto financiero con voz editorial, no pieza editorial sobre finanzas.** La estructura del producto manda sobre la narrativa cuando compiten por el ojo. El usuario navega por anclajes antes de leer prosa.

**P2 · Jerarquía visual por niveles de scope.** No hay una escala lineal única. Cada scope tiene su techo y nada dentro lo excede. Cuatro scopes: marca (logo, nav), página (address una vez), sección (anclaje numerado, techo de su sección), bloque (lead, KPI destilado, body, controles).

**P3 · UX iOS.** Proximidad funcional (controles renderizados solo donde tienen efecto), divulgación progresiva inline (sin overlays flotantes salvo para modales conscientes), comportamiento de expansión con reglas explícitas de overflow.

**P4 · Diglosia tipográfica.** El producto habla dos idiomas y ningún elemento es ambiguo. **Fraunces como serif única en dos pesos — display 600, prosa 400 — más DM Mono para la voz técnica. Instrument Serif jubilada en v1.5.0.** Voz editorial cálida (Fraunces, peso 600 para display/cifras y 400 para prosa/citas). Voz técnica fría (DM Mono para labels, eyebrows, ticks, metadata, footer legal). Cada elemento sabe en qué idioma habla; las cifras viven todas en la misma familia (Fraunces), así hero y prosa comparten formas.
>
> **Actualización (dirección «Cartel» · cascada S6):** la diglosia queda **derogada en la UI viva** → se adopta **una sola voz serif (Fraunces)**. La Proyección «Cartel» ya es serif-pura; las primitivas `CartelCard` / `CartelBtn` / `CartelLabel` / `cartelNums` (en `ui/cartel.jsx`) sustituyen a los eyebrows mono-MAYÚSCULAS y propagan esa voz a Hoy/Seguimiento/Datos (S8/S9). `DM Mono` (`T.mono`) se **conserva definido** en el objeto `T` (baseline + verificadores) pero **sin uso vivo nuevo**. El footer legal mono y la numeración de anclaje se revisan al migrar cada pantalla.

**P5 · Economía de énfasis.** El acento cromático y el peso bold son recursos escasos. Se reservan a tres situaciones: (a) marca, una vez por pantalla; (b) cifras o términos-ancla que el ojo debe poder cazar en lectura diagonal, máximo 3 por párrafo y 4 por viewport; (c) elementos recién activados o fácilmente pasables por alto. Si todo es accent, nada lo es.

**P6 · No romper convenciones humanas salvo cuando hace falta.** El ojo del usuario está entrenado por iOS, Apple, Stripe, NYT, Granta. Romper esos patrones tiene coste cognitivo. La doctrina rompe el patrón solo cuando hay razón editorial específica (ej.: el address "Hola, {nombre}" mayor que los anclajes de sección porque el saludo es momento, no estructura). En todo lo demás, sigue la convención.

**P7 · Orden de lectura canónico.** Al entrar a una pantalla: logo (escaneo periférico de marca) → address si lo hay → anclaje de sección → contenido → controles.

---

## §2 · Reglas operativas

Mapeo elemento → tokens. Ordenado por scope.

### Disciplina cromática (regla A2)

Regla maestra de color, **gobierna toda la pantalla**: el color (verde/rojo) se reserva a los momentos de oposición con carga; el resto va en tinta; el naranja es solo marca y acento. **Excepción: el color de estado de progreso.** En detalle:

- **Verde / rojo** → solo donde dos caminos se oponen con consecuencia (en Plan: la bifurcación "si lo dejas parado" / "si lo inviertes" — cifra, barra y fork). Único punto de color semántico de la pantalla.
- **Acento (naranja)** → solo marca (logo, nav activa), enlaces y botones de acción, tooltips de términos punteados, y el foco de "lo activo ahora" (la fase actual de una ruta: nodo + borde + estado).
- **Todo lo demás** (patrimonio, metas, llegadas, rentas, iconos de etiqueta, números sin oposición) → `T.ink` (o `T.muted` / `T.faint` si es secundario).
- **Excepción funcional · color de estado de progreso** (R1): en una ruta por fases el estado conserva un color mínimo — verde (completada / no aplica), acento (actual), faint (futura); los checks de items ya hechos se quedan verdes.
- **Caja única**: contenedores con fondo transparente, borde `1px T.line`, radius 12. Excepciones: el foco activo (borde `1.5px T.accent`) y los destinos (borde punteado).

### Scope marca

**Logo "Mi Plan"** · `fontFamily: T.display` italic, `fontSize: 28` (excepción inline marcada `/* excepción · brand identity */`), `color: T.accent`, `lineHeight: 1`. Clicable, dispara `window.__openRevisitLanding`. Top-left de la barra global en ambos shells.

**Nav principal (5 secciones)** · `fontFamily: T.display` italic, `T.size.lead` (17), `color: T.ink`. Tab activo: `borderBottom: 2px solid T.accent`. Inactivo: borderBottom transparente. Gap entre tabs 24px. Migración explícita desde mono uppercase 11 del código actual. Iconos heredados (◐ Mi Plan · ◢ Proyección · ◧ Seguimiento · ◇ Aprende · ◌ Ajustes).

### Scope página

**Encuadre lateral · columna de contenido compartida** · El ancho y el centrado del contenido los define UNA sola vez el Shell (`CONTENT_MAX = 720`, columna centrada en escritorio dentro del padding lateral del `<main>`); en móvil el contenido es full-width con el padding lateral del shell. **Ninguna pantalla define su propio `maxWidth`/centrado de página** — todas heredan el mismo encuadre para que las secciones queden alineadas idénticas (mismo margen izquierdo/derecho). Antes cada pantalla repetía el suyo (Plan 720, Aprende/Ajustes 880, resto full-width), lo que producía desnivel entre secciones.

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

**KPI destilado** (dentro de card normal, ej. "Tasa de ahorro · 34%") · `T.display` (Fraunces 600), `T.size.displayMd` (28), `T.tracking.tight`, `T.lh.tight`, `color: T.ink`. Sufijo de unidad: `T.display`, `T.size.lead` (17) o (20), `color: T.muted`. **Excepción de scope declarada:** el destilado puede ser mayor que su sub-anclaje porque la cifra es el contenido del bloque, la etiqueta no.

**KPI hero** (cifra protagonista, ej. "−210.000€") · `T.display`, `T.size.displayLg` (38), `T.tracking.display`, `T.lh.tight`. Color semántico cuando aplica: `T.ink` (descriptivo, p.ej. patrimonio, edad de libertad financiera, target de hito), `T.green` (ganancia, valor #3B6D11 ligeramente aclarado para legibilidad), `T.red` (pérdida inesperada, riesgo, o coste teórico del framing "lo que pierdes si no actúas"), `T.amber` (coste contratado o asumido que merece atención visual sin alarma, p.ej. intereses totales de hipoteca, comisiones acumuladas significativas). Sufijo de unidad: `T.display`, 22, `color: T.muted`. **Regla operativa**: el color solo cambia cuando la ganancia o pérdida es el mensaje principal del bloque; en cifras descriptivas, siempre `T.ink`. **Toda cifra hero vive sobre fondo claro.** No existe variante "inverted" en el producto. **Excepción declarada (v1.5.0): la edad de libertad financiera, normalmente descriptiva (`T.ink`), se muestra en `T.green` en el hito ★ de "Tu ruta" (pantalla Plan) por ser el clímax de la ruta — es el único punto donde una cifra descriptiva toma color semántico a propósito.**

**Cifra editable inline** (`EditableNumber`) · `T.display` weight 500, `color: T.ink`, `borderBottom: 1px dashed T.accent`, `padding: 0 2px`, `cursor: pointer`. Vive dentro de prosa serif. Al editar, comportamiento idem `<input>` (ver scope inputs).

**Sufijo de unidad** · `T.display`, tamaño proporcional al número (subtitle si número subtitle, lead si número destilado/hero medium, 22 si número 38). `color: T.muted`. `marginLeft: 2-4`.

**Delta / variación** · `T.mono`, `T.size.eyebrow` (11), color semántico (`T.green` / `T.red` sobre fondo claro; `T.greenInverted` / `T.redInverted` sobre fondo inverted). `marginLeft: 8-10`.

### Scope bloque · controles e inputs

**Toggle ON/OFF** · Switch iOS-clásico. Ancho 36, alto 20, bola 16. ON: fondo `T.ink`, bola `T.bg`, bola alineada derecha. OFF: fondo `T.line`, bola `T.paper`, bola alineada izquierda. Pegado al elemento que afecta. Si no afecta a nada visible en el contexto, no se renderiza.

**Segmented control** · Regla dual:
- *Cuando la decisión tiene consecuencia financiera y necesita explicación* (Proporcional/Fijo, modo de aporte, allocations): **cards con descripción inline**. Cada opción es un botón flexible con `<strong>` en Fraunces 600, 17 + `<span>` Fraunces italic 13 muted como descripción de una frase. Active: `borderColor: T.accent`, `background: rgba(T.accent, 0.04)`. Idle: `border: 1px solid T.line`, `background: T.paper`.
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

### Scope bloque · selectores de nivel / jerarquía

**Regla maestra: di menos, deja que se vea sin leer; los niveles nunca al mismo peso.** Un selector que ofrece opciones jerárquicas (niveles, fases, grados de profundidad) no las presenta con el mismo peso visual: la jerarquía se *ve* antes de leerse. Deriva de P5 (economía de énfasis) y P1 (navegar por anclajes antes que por prosa).

**Selector de nivel · "puertas" apiladas** · Cada opción es una caja a ancho completo, apilada en vertical, con `border: 1px solid T.line`, `borderRadius: 12`, `padding: 14px 16px`. Nombre en `T.display` 22 / `T.ink`; guía en `T.serif` 14 / `T.muted`. **Las cajas comparten tamaño y color; el único diferenciador es la opacidad** (`activa: 1`, `inactivas: INACTIVE_OPACITY ≈ 0.35`, sacado a constante por si hay que subirlo en device real). El punto de entrada se marca con un chip de acento ("Empieza aquí": `T.mono` 11 uppercase, `color: T.accent`, `background: T.accentSoft`). Nunca pills al mismo peso con un susurro debajo: la guía vive dentro de cada puerta, no en prosa muted aparte. No se ofrece una opción "Todos" si otra vista (Glosario) ya la cubre.

### Pantalla Plan · patrón de los tres movimientos (v1.5.0)

Cada movimiento tiene un protagonista grande, color racionado y aire (padding de card ~26-28px, separación amplia entre movimientos). El color del fondo de las cards cuenta una historia: **el presente es sobrio (sin tinte); el futuro tiene color.**

**Unidad de presentación · NOMINAL por defecto (regla de coherencia).** Toda cifra de patrimonio FUTURO se muestra en **euros nominales** (los que tendrás, sin deflactar) en toda la app: el pill superior (`KpiPill`), el "invertido"/"parado" del M1 y las monedas del M2 enseñan la **misma magnitud** (el patrimonio del plan a la edad de retiro: `finalNominal` = `d.finalPlan.portfolio`, ~1,24M en el demo). El modo **real** solo aparece como **recordatorios de aterrizaje** explícitos (el recordatorio del M2 que deflacta a € de hoy, la aclaración real de la renta) y en Proyección vía su toggle. **Una misma magnitud no puede salir en real en un sitio y nominal en otro** (era el bug: pill/M1 en real 594k mientras las monedas en nominal 1,24M). Cifras de HOY (patrimonio actual, ahorro mensual) no se tocan: en el presente real = nominal. Nota técnica: como el motor modela el salario creciendo con el IPC (`salaryInflationFactor`, 1.0 = seguimiento pleno), las cifras nominales **sí dependen** del supuesto de inflación (más inflación → más euros nominales) — el nominal no es "inflación-invariante", la distinción nominal/real es de **presentación**, no de mecánica.

- **M1 "Dónde estás" — cards neutras.** Card A = patrimonio (eyebrow mono + cifra `T.display` 600 ~44px en `T.ink`: descriptiva, NO verde). Card B = el eje: ahorro mensual protagonista (`T.display` 600 ~60px `T.ink`) + subtítulo serif (% del sueldo · gasto) + "fork" SVG (dos trazos 2.5px, izq `T.red` / der `T.green`) a dos fbox (parado en rojo / invertido en verde) + cierre serif italic muted. Cards en **estilo neutro**: `background: T.paper`, `border: T.line`, `boxShadow: 0 1px 3px rgba(26,22,18,.06)`, **sin tinte de color de fondo**. Deliberado: el presente es sobrio.
- **M2 "Hacia dónde puedes ir" — cards verdes.** Fondo `linear-gradient(180deg, T.greenSoft, transparent)`, `border: T.green`. El cuerpo se lee de arriba a abajo: **gancho (card propia)** → y en la 2ª card: **frase del múltiplo → monedas (nominal) → recordatorio (real, aterrizaje) → renta**.
  - **Pieza 1 · Gancho (card propia, todos los perfiles, incl. A).** Dos líneas `T.display` 600: la 1ª condicional en `T.muted` ("Si pones el tiempo y el interés compuesto de tu lado…"), la 2ª en **`T.green`** como pago ("hoy cambias tu futuro."). El verde es coherente con el tema de la card (futuro positivo = confirmación), no `T.accent`. Es una invitación condicional: aplica también al perfil A, que aún no aporta.
  - **Cuerpo (segunda card, solo perfiles que aportan, B y C).** Frase por tramos (verde) + monedas + recordatorio + renta. **VERACIDAD — UN SOLO NÚMERO (innegociable)**: `ratio = finalNominal / aportadoBaseNominal`, MISMO modelo de aporte (creciente, projectV2) y **MISMA unidad (`€` corrientes / NOMINAL)** en numerador y denominador — jamás se mezcla. `aportadoBaseNominal` = suma de los aportes **sin deflactar** (lo que el usuario realmente irá metiendo) **+ patrimonio inicial** (`currentPortfolio`): "lo que pones" en euros corrientes = ahorros de partida + todos los aportes, para no atribuir al aporte el crecimiento del capital que ya tenías. **Las monedas Y la frase derivan SIEMPRE de ese mismo ratio nominal**, nunca se contradicen, nunca se redondea hacia un mensaje bonito.
  - **Nominal en las cifras, real solo en el recordatorio.** El patrimonio (etiqueta derecha de las monedas) y la renta se muestran en **nominal**; el **recordatorio** (pieza subordinada, ver abajo) las aterriza a € de hoy. El ratio, las monedas y sus dos etiquetas viven todos en nominal → el dibujo (N,x monedas) y los números a sus lados **cuadran** (1.24M/357k ≈ 3,5× ↔ 3 monedas y media). El real ya no entra en el ratio: queda aislado en el recordatorio.
  - **Monedas abstractas, sin tope arriba ni abajo**: izq 1 moneda `T.ink` (lo que pones, etiqueta = `aportadoBaseNominal`, nominal) → flecha `T.amber` → der el ratio dibujado: `floor(ratio)` monedas `T.green` llenas (bucle, soporta ×5, ×8, ×12…) + 1 moneda de fracción con `opacity = max(decimal, 0.15)` (etiqueta = `finalNominal`, nominal). Robustez: `flex-wrap` a varias filas + reescala del disco si hay muchas → nunca desborda en 375. **Guarda de dato degenerado** (NaN/Infinity, o `aportadoNominal≈0` → ratio ≥ 30): no se pintan decenas de monedas, se oculta el bloque (como perfil sin aporte) preservando la renta. No es un tope al mensaje, es robustez.
  - **Recordatorio de inflación** (subordinado, `T.serif` `T.muted` ≥16px, no protagonista; va **justo debajo de las monedas y ANTES de la renta**): aterriza el patrimonio nominal de las monedas en € de hoy — "Recuerda: ajustado por la inflación, ese patrimonio equivale a {finalReal} de hoy." (`finalReal` = `finalNominal` deflactado). Gated igual que las monedas (`ratioValido`).
  - **Cierre de renta** (al final del bloque, `T.display` 600): renta **nominal del primer año de jubilación** en `T.amber` + su aclaración real en la MISMA frase + veredicto de suficiencia. "Y te dan {nominal}/mes cuando te jubiles — es decir, {real} de hoy: {veredicto}". El ancla real es el PRIMER AÑO (Bengen: la renta mantiene poder de compra constante, no hay un único "real" para 30 años). Toda cifra real (recordatorio + aclaración de la renta) se recalcula EN VIVO desde la inflación del modelo; nada hardcodeado.
  - **Frase adaptada al mismo ratio** (línea 2 nunca afirma un múltiplo que las monedas no dibujen): `≥4.5` → "multiplica por {round(ratio)}…" (número real, jamás "casi cuadruplica" cuando es más); `3.5–4.5` → "casi cuadruplica…"; `2.5–3.5` → "casi triplica…"; `1.8–2.5` → "más que duplica…"; `1.3–1.8` → "multiplica lo que pones por {X,X}"; `<1.3` → ángulo-futuro ("Esto no ha hecho más que empezar: / cada año que pase, multiplica más.") en vez de presumir un múltiplo pobre. Perfil A (no aporta, `monthlyAporte === 0`): conserva el **gancho (card propia)** como invitación condicional, pero **sin cuerpo** (ni monedas, ni recordatorio, ni renta — no hay proyección de patrimonio que mostrar ni que deflactar). **Una cifra que engaña es un fallo grave, no licencia de marketing: no hay umbral ni "caso estándar" — el dibujo dice la verdad, sea cual sea.**
- **M3 "Tu ruta" — card naranja + hitos.** Card `linear-gradient(180deg, T.accentSoft, transparent)`, `border: T.accent`: encabezado "Fase n de 5 · nombre" (`T.accent`), barra de 5 tramos por estado (completada `T.green` / no-aplica `T.lineSoft` / activa `T.accent` / futura `T.line` .5), 5 pestañas clicables (marcador circular + nombre corto; la activa resaltada con borde acento + `T.paper`) y un panel de detalle **integrado** (borderTop, hereda el difuminado — no una caja blanca flotando). **El grid de las 5 pestañas usa `repeat(5, minmax(0, 1fr))`** (no `1fr`) + `minWidth: 0` y `overflowWrap`/`hyphens: auto` en el nombre: así los tracks encogen bajo el `min-content` del nombre más largo ("Optimización"/"Saneamiento") y las 5 caben SIEMPRE en 375 (el nombre largo silabea a 2 líneas), sin desbordar la card. **Hitos FUERA de la card**, fila de 3: "tu dinero te adelanta" (primera edad en que el rendimiento anual de la cartera supera al aporte de ese año — mismo modelo de aporte que el M2; fallback honesto si no aporta/no cruza), la edad de libertad en `T.green` (excepción declarada, ver §2 KPI hero), y la jubilación legal.



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

### Tipografía (serif unificada en Fraunces · v1.5.0)

`T.display` = **Fraunces 600** (display, hero, anclajes, KPIs grandes, cifras). Registro de titulares/cifras; mismo token, peso 600 + `font-optical-sizing: auto` en todo uso.
`T.serif` = **Fraunces 400** (prosa, lead, body, captions).
`T.mono` = DM Mono (labels, eyebrows, ticks, footer).
**Fraunces es la serif única** (variable, eje opsz): cifras hero (600) y números inline en prosa (400) comparten formas. **Instrument Serif jubilada en v1.5.0** — se veía demasiado fina a tamaño display y, tras la migración a `/src`, ni siquiera se cargaba (todo caía al fallback serif del sistema).
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
| 2026-06 | 1.3 | **Regla maestra "di menos, deja que se vea sin leer; los niveles nunca al mismo peso" + patrón de selector de nivel por "puertas".** Añadida a §2 (Scope bloque · selectores de nivel). Surge del rediseño del selector de niveles de Aprende → Conceptos: antes 4 pills al mismo peso (Esencial/Profundizando/Avanzado/Todos) + guía de nivel en serif itálica muted que "apenas se leía". Sustituido por tres puertas apiladas diferenciadas solo por opacidad, con la guía dentro de cada puerta y un chip "Empieza aquí" en el punto de entrada; "Todos" eliminado (lo cubre el Glosario). | La jerarquía debe verse antes de leerse; cuatro opciones al mismo peso con un susurro debajo no daban ni punto de entrada ni feedback de selección legible. |
| 2026-06 | 1.4 | **Disciplina cromática (regla A2) + caja única.** Añadida a §2: el color verde/rojo se reserva a los momentos de oposición con carga (la bifurcación de Plan), el resto va en tinta, y el naranja es solo marca/acento; excepción para el color de estado de progreso (ruta por fases R1). Contenedores unificados a fondo transparente + borde 1px line + radius 12 (excepto foco activo 1.5px acento y destinos punteado). | Surge del rediseño visual de la pantalla Plan: green/red/accent estaban repartidos por patrimonio, meta, llegada, rentas y bordes de caja sin criterio, diluyendo su carga. Concentrar el color devuelve significado a la bifurcación y deja respirar al resto en tinta. |
| 2026-06 | 1.5 | **Serif unificada en Fraunces · Instrument Serif jubilada.** §Tipografía y P4 actualizados: `T.display` pasa de Instrument Serif a Fraunces (peso 600 + `font-optical-sizing: auto` en todo uso display); `T.serif` sigue en Fraunces 400. La carga de fuentes (un `<link>` de Google Fonts que la migración a `/src` había dejado fuera) se restaura en `index.html` con Fraunces 400/500/600 + opsz y DM Mono; Instrument Serif eliminada de la carga. | Instrument Serif se veía demasiado fina a tamaño display y, además, ni se cargaba (todo caía al fallback serif del sistema). Y las cifras vivían en dos familias (hero en display, números de prosa en serif). Unificar en Fraunces arregla las tres cosas: peso con cuerpo, carga real, y cifras con formas consistentes. |
| 2026-06 | 1.6 | **Patrón de presentación de la pantalla Plan (3 movimientos) + excepción cromática del ★ libertad.** §2: nuevo patrón "Pantalla Plan · los tres movimientos" (M1 cards neutras con card-eje + fork; M2 cards verdes con gancho + monedas "cuadruplica"; M3 card naranja con barra + pestañas de fase + panel integrado + hitos). En la regla de KPI hero se documenta la excepción: la edad de libertad financiera, normalmente descriptiva (`T.ink`), se muestra en `T.green` en el hito ★ de la ruta por ser el clímax. | Rediseño visual de Plan: cada movimiento gana un protagonista grande, color racionado (presente sobrio sin tinte, futuro con color verde/naranja) y aire. El ★ verde es la única cifra descriptiva que toma color a propósito, y debe quedar registrado para no leerse como incoherencia. |
| 2026-06 | 1.7 | **Veracidad de las monedas del M2 (regla innegociable) + hito edad-rendimiento.** §2: la regla de las monedas exige aportado y final con el MISMO modelo de aporte y MISMAS unidades (€ de hoy); el ratio nunca se ajusta para "cuadruplicar". Por debajo de 3× (o sin aporte) → caso estándar etiquetado, separado de los datos personales. Documentado también el hito "tu dinero te adelanta". | El M2 mostraba un 3,8× falso (aportado constante 156k vs final real 592k: modelo y unidades distintos). Con el modelo único honesto el ratio real del demo es 2,5× → caso estándar. Es una app financiera: una cifra que engaña es un fallo grave. |
| 2026-06 | 1.8 | **Monedas del M2 = múltiplo real abstracto, sin tope; frase adaptada al mismo ratio.** Sustituye el umbral 3× + caso estándar de la 1.7: las monedas dibujan `floor(ratio)` llenas + 1 fracción (opacity = decimal), con bucle (sin límite superior), flex-wrap y reescala (no desborda en 375); guarda de dato degenerado (ratio ≥ 30 / no-finito → fallback). La frase de encabezado deriva del MISMO ratio por tramos (≥4.5 usa el número real "multiplica por N"; <1.3 mira al futuro), nunca contradice a las monedas. | El umbral 3× ocultaba el dato real del usuario tras un ejemplo genérico. El dato es el dato: las monedas y la frase son el mismo número (final/aportado) y lo dicen sin adornar ni anclarse en "cuadruplica". |
| 2026-06 | 1.9 | **Encuadre lateral compartido (`CONTENT_MAX`) documentado + barrido de Instrument Serif residual.** §2 Scope página: el ancho/centrado del contenido lo define una sola vez el Shell (`CONTENT_MAX = 720`); ninguna pantalla define el suyo (antes Plan 720, Aprende/Ajustes 880, resto full-width). Y se sincronizan dos referencias que aún citaban Instrument Serif como fuente vigente → **Fraunces 600**: el KPI destilado y el `<strong>` de las cards de decisión con descripción inline. (Las menciones de "jubilada" en P4, §Tipografía y §6-1.5 se conservan como histórico.) | Sincronizar la doctrina con los commits `c09488d` (Fraunces única + rediseño Plan) y `23a0ef6` (encuadre `CONTENT_MAX`): quedaban citas a Instrument Serif y faltaba registrar el encuadre compartido. |
| 2026-06 | 1.10 | **M2 reestructurado en TRES piezas + cifras nominales con aclaración real + base del ratio corregida.** §2 patrón M2: (1) gancho como pieza/card propia con la 2ª línea en **`T.green`** (texto nuevo "Si pones el tiempo… / hoy cambias tu futuro."), común a todos los perfiles incl. A; (2) monedas + cierre de renta; (3) recordatorio de inflación nuevo (`T.serif` `T.muted` ≥16px) que aterriza el patrimonio nominal a € de hoy. El **patrimonio y la renta se muestran en NOMINAL** con su real aclarado aparte (patrimonio en la pieza 3, renta nominal del 1er año de jubilación + real en la misma frase). El **ratio incluye el patrimonio inicial** en la base: `aportadoBase = aportadoReal + currentPortfolio` → demo 2,53× → **2,45×**; sigue calculándose en **real** (final y aportado en € de hoy, misma unidad). La etiqueta derecha de las monedas pasa a `finalNominal`; perfil A conserva solo el gancho. | Separar el "wow" (cifra nominal grande) de la honestidad (su valor real de hoy) sin mezclarlos en una sola cifra confusa: la pieza 3 reconcilia nominal↔real. El ratio estaba inflado porque el final incluía el patrimonio inicial pero el aportado no; meterlo en ambos lados lo deja honesto. Todo en vivo desde la inflación del modelo. |
| 2026-06 | 1.11 | **App unificada en NOMINAL por defecto (pill + M1 + M2) + recordatorios real + ratio sobre nominal + reorden M2 + fix desborde M3.** Nueva regla §2 "Unidad de presentación · NOMINAL por defecto": toda cifra de patrimonio futuro (pill `KpiPill`, "invertido"/"parado" del M1, monedas del M2) muestra la **misma magnitud** en euros nominales (`finalNominal` ~1,24M); el real solo en recordatorios de aterrizaje. Antes había incoherencia: pill/M1 en real (594k) vs monedas en nominal (1,24M). El **ratio de las monedas pasa a nominal** (`finalNominal/aportadoBaseNominal`, ambos en € corrientes) → demo 2,45× (real) → **~3,47×** (nominal); monedas y frase cuadran con las etiquetas. **Orden del cuerpo M2** reordenado: frase → monedas → **recordatorio (real)** → renta (el recordatorio sube entre monedas y renta). **M3 stepper**: `repeat(5, minmax(0,1fr))` + `hyphens:auto` → las 5 fases caben en 375 sin desbordar. | Coherencia de unidades: una misma magnitud no puede salir en dos unidades en la misma pantalla. Decisión de producto: nominal por defecto (los euros que tendrás), real como recordatorio. El ratio real descuadraba con las monedas que ya mostraban nominal; calcularlo en nominal los reconcilia. El stepper cortaba la 5ª fase en móvil. |

| 2026-06-13 | 1.11 (cabecera reconciliada) | **Ninguna regla nueva.** Se corrige la cabecera del documento, que había quedado congelada en `1.2.1` mientras este registro avanzaba hasta la `1.11`; ahora ambas citan el mismo número. El principio P8 sigue **fuera** del documento, pendiente de decisión del dueño. | Higiene documental: la versión visible debía casar con el último número del registro interno. |
| 2026-06-18 | 1.12 | **Seguimiento · bento + divulgación progresiva + hitos visuales.** §2: la pantalla Seguimiento adopta un patrón "estado arriba" — el veredicto `NextStep` sube a una fila bento de 2 columnas junto a "Tu mes" en escritorio (1 columna en móvil) + un stat de **media real** en la cabecera. Superficies secundarias **tras disclosure** (P3): el gráfico "plan vs realidad" (`MultiLineChart`) y el formulario de alta de meta. **Hitos → tarjetas visuales**: cada meta es un **anillo de progreso** (% al centro, verde en-camino / amber falta) + nombre + objetivo + píldora, en rejilla `repeat(auto-fit, minmax(180px,1fr))`; las 3 sub-stats analíticas ("a tu ritmo / hace falta / diferencia") se retiran de la vista y la **edición vive al tocar la tarjeta** (la función no se pierde). Ancho heredado del Shell (`CONTENT_MAX 720`), sin maxWidth propio. Gráfica del reparto (`FlowTimelineCard`): inversión a la base (verde) + "para vivir" encima, curva `monotone`. | Subir Seguimiento al listón editorial del resto **sin perder funciones**: la divulgación progresiva limpia la vista, el veredicto arriba da "dónde estás" de un vistazo, y los hitos pasan de bloque denso de texto a **imagen** (anillos). Decisión de producto del dueño tras ver maquetas; los hitos visuales y el "estado arriba" se documentan para no leerse como incoherencia con P7 (orden de lectura). |
| 2026-06-18 | 1.13 | **Proyección · el toggle de vista global sube al Hero + tramos colapsables + segmented control.** §2: un control que cambia la **unidad de toda la pantalla** (el `DisplayModeToggle` Nominal / «€ de hoy») vive **arriba del todo** (Hero), no enterrado entre las asunciones; se rediseña como **segmented control Cartel** (dos opciones mono, píldora activa en `T.accent`, fondo `T.panel`) en lugar del switch. Y se ratifica la **divulgación progresiva** también en Proyección: los grupos de tramos de ingreso (Salario base, Complementos) se **colapsan tras una fila-resumen** («… · {actual} €/mes» + chevron `▸ editar`/`▾ ocultar`), por defecto cerrados; el aporte mensual se queda visible. | Un selector que reescribe todas las cifras de la pantalla es lo primero que el lector necesita encuadrar, no un detalle de la letra pequeña; subirlo al Hero y darle forma de segmented lo hace legible como elección de vista. Los tramos editables son maquinaria de ajuste, no lectura: plegarlos por defecto baja el ruido sin perder la función (mismo patrón que Seguimiento 1.12). |
| 2026-06-18 | 1.14 | **Ningún número crudo en la UI + divulgación progresiva: lo que es el dato se ve, lo que es nota se pliega.** Regla de cifras (§Tokens / §2): **ningún `float` sin formatear llega a la pantalla**. Cifras € → `fmtEur`/`fmtNum`; **porcentajes → máx 1 decimal, separador es-ES (coma), sin coma colgando** (helper `fmtPctView`); cuando un % se calcula/recalcula (p.ej. la tasa de ahorro tras un ajuste) se **redondea antes de persistir** además de al mostrar. (Surge de un float de 17 dígitos —«22.166666666666668 %»— filtrado a producción.) Ajuste de divulgación progresiva por pantalla: lo que **es** el contenido se ve por defecto, lo que es **nota/aterrizaje** se pliega. Concretado: *Seguimiento* muestra el **calendario completo inline** desde el inicio (mismo componente en modo `inline`, sin modal); *Plan M2* muestra las **monedas** desde el inicio (son el dato visual) y pliega solo el **recordatorio en € de hoy**. **«Leído» de Aprende = acción explícita**, no efecto colateral de abrir: control «Marcar como leído» ↔ «✓ Leído» (verde) dentro del concepto, con indicador en tarjetas y glosario. | Es una app financiera: un número con 17 decimales es un fallo de credibilidad, no un detalle estético. Y la divulgación progresiva (P3) debe distinguir el dato de su anotación: plegar el calendario o las monedas escondía el contenido, no el ruido — se invierte. «Leído» auto-marcado al abrir no es fiable (abrir ≠ leer); un control explícito lo vuelve veraz, coherente con la confirmación guiada del resto del producto. |
| 2026-06-18 | 1.15 | **«El libro» · vista imprimible del corpus + diario, sin gamificar + placeholder de Amazon.** Nuevo tipo de superficie: un **overlay full-page imprimible** (`BookView`) que compila `LEARN_CORPUS` (solo lectura) ordenado por nivel + páginas de **diario de finanzas** (plantillas en blanco para rellenar a mano). Convenciones: (1) la impresión se resuelve con **`@media print` aislando `.book-overlay`** (oculta el resto de la app) + clase **`.no-print`** para la toolbar — sin segunda hoja de estilo ni dependencia; (2) el diario es contenido **nuevo de la vista**, nunca entra en `LEARN_CORPUS` (corpus cerrado); (3) las plantillas son **formularios sobrios** (líneas/celdas en blanco), sin marcadores ni «logros» — la regla anti-gamificación aplica también al material imprimible; (4) los enlaces de compra son **`<a href>` con URL placeholder configurable** (`AMAZON_BOOK_URL`), nunca `fetch` (cero red); vacío → «Próximamente». | El libro es el lead magnet imprimible: tiene que salir bien en papel/PDF sin framework de impresión y sin traicionar la voz sobria. Aislar el overlay es la vía mínima y robusta; registrar la convención evita que un futuro «diario» derive en gamificación o que el enlace de Amazon se implemente como llamada de red. |
| 2026-06-19 | 1.16 | **«El libro» pasa de PDF imprimible gratis a desplegable de COMPRA (supersede 1.15) + cierre cartel reutilizable + ticker «leído» como píldora.** **Producto**: NO se regala el corpus en PDF imprimible; el gratis es **leer en la web, lección por lección**. Se retira `BookView`/`@media print`/`window.print`; en su lugar, un **desplegable de compra** (`BookPromo`) con **portada dibujada en CSS** (adorno, cero red), descripción de contenido y **CTA a Amazon** (`AMAZON_BOOK_URL` placeholder → «Próximamente»). La convención de §6 1.15 sobre impresión queda **derogada**; se conservan: anti-gamificación, cero red (compra = `<a href>`), corpus cerrado intacto. **§2 patrón de cierre**: las pantallas que redirigen al final adoptan el **cierre tipo cartel de Proyección** — eyebrow + titular serif `clamp(34→72)` + sub itálica + `CartelBtn`, **sin caja** (aplicado al cierre de Plan, antes un `NextStep` con borde; conserva la lógica de veredicto/destino). **Indicador de estado «leído»**: píldora rellena (`T.green` fondo / `T.bg` texto, mono) en vez de texto verde — más visible sin gamificar. | Coherencia de producto: el lead magnet de pago no se canibaliza regalando el PDF; el valor gratis es el propio corpus en la web. Coherencia visual: un cierre de página es un momento editorial (el «ahora, mes a mes» de Proyección), no una caja de aviso; unificar el patrón hace que las pantallas rimen. La píldora da al estado «leído» el peso que pedía el dueño sin convertirlo en logro. |

Toda modificación futura entra aquí con fecha. Si en v1.4.0b o posteriores aparece un caso que la doctrina no cubre, se añade a §2 y se data en §6. No se modifica doctrina ad-hoc en código sin actualizar este documento.

---

## Plan de ejecución acordado

- **v1.4.0b** aplica Bloques 1, 2, 3, 5, 6: identidad (logo, nav), prosa, KPIs sobre fondo claro, contenedores (callouts unificados U1), charts conservadores. Refactor moderado. Añade un único token a `T`: `T.inputBg` (#faf3e4), aunque sólo se usa en v1.4.0c.
- **v1.4.0c** aplica Bloque 4: refactor de ~50+ inputs al patrón sin negro. Específicamente: (a) background T.inputBg, sin borde, shadow inset T.line/T.accent; (b) reset CSS obligatorio (`appearance: none` y `-webkit-appearance: none`) para evitar que el navegador en modo oscuro sobrescriba el fondo; (c) texto del input en T.muted, nunca T.ink; (d) labels en Fraunces 13 muted con copy en frase natural. **Auditoría visual obligatoria en macOS/iOS modo oscuro como parte del cierre del sub-sprint** — sin esta verificación, el bug que motivó la revisión 1.2 puede persistir.

`CLAUDE_CODE_CONTEXTO.md` debe actualizarse en v1.4.0b para referenciar este documento desde su cabecera y añadir `T.inputBg` al apartado de paleta.
