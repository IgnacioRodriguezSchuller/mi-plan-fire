# Mi Plan FIRE — CHANGELOG v1.3.0

Sprint de auditoría visual sistemática. Tokenización de `fontSize` + `lineHeight` + `letterSpacing` en el objeto `T`. Origen: `mi_plan_v1_2_1.html`.

**1.068 sustituciones aplicadas**. Cero cambios de copy, lógica, layout o estado.

---

## Tokens nuevos en `T`

Añadidos tres sub-objetos al objeto `T` (línea ~88 del archivo):

```js
T.size = {
  // Niveles base (uso directo, no responsive)
  eyebrow:    11, // SOLO mono uppercase. Suelo absoluto.
  caption:    13, // Caption serif/sans, helper text, metadatos.
  body:       15, // Texto base de lectura.
  lead:       17, // Texto destacado, intro de sección.
  subtitle:   22, // Subtítulo, números secundarios (KPIs medianos).
  // Escala display responsive
  displayMd:  'clamp(24px, 3vw, 32px)',  // Header de movimiento, KPI grande
  displayLg:  'clamp(28px, 4vw, 44px)',  // "Hola, {nombre}"
  displayXl:  'clamp(34px, 5vw, 52px)',  // Onboarding heroes
  displayXxl: 'clamp(40px, 6vw, 64px)',  // Landing hero
};

T.lh = {
  tight:   1.15, // Títulos display, números hero
  snug:    1.3,  // Subtítulos, cifras medianas
  normal:  1.5,  // Prosa de lectura (default)
  relaxed: 1.6,  // Prosa larga (artículos, manifiesto)
};

T.tracking = {
  display:  '-0.02em', // Display tipografía
  tight:    '-0.01em', // Headers medianos
  normal:   '0',       // Default
  wide:     '0.08em',  // Mono labels suaves
  wider:    '0.12em',  // Mono labels (eyebrows, caps)
  widest:   '0.16em',  // Mono labels muy espaciados
};
```

Las familias tipográficas (`T.display`, `T.serif`, `T.mono`, `T.sans`) y los colores no se han tocado.

---

## Reglas aplicadas

1. **Suelo tipográfico**: 11px (`T.size.eyebrow`) sólo en `T.mono` uppercase. Serif/sans/display → mínimo 13px (`caption`).
2. **Eliminados como literales**: `fontSize: 12` (sube a 13), `fontSize: 14` (sube a 15), `fontSize: 18/20` (suben a 22 `subtitle`), `fontSize: 36/38` (a `displayLg`), `fontSize: 24/26` (a `subtitle`).
3. **20 valores únicos de `fontSize` numérico → 9 tokens + 2 excepciones documentadas**.
4. **20 combinaciones únicas de `fontSize: clamp()` → 4 tokens display** (todas mapeadas, cero excepciones).
5. **14 valores únicos de `lineHeight` → 4 tokens** + 16 excepciones funcionales (`lineHeight: 1` para cifras display y botones de icono).
6. **14 valores únicos de `letterSpacing` → 6 tokens** (cero excepciones).

---

## Auditoría grep (post-migración)

```
fontSize: 11 literal               → 0 (todas a T.size.eyebrow)
fontSize: 12 / 14 literal          → 0
lineHeight 1.55 / 1.65 / 1.05      → 0
letterSpacing antiguos             → 0
T.size.* usage                     → 592   (>500 esperado ✓)
T.lh.* usage                       → 186   (>150 esperado ✓)
T.tracking.* usage                 → 290   (>250 esperado ✓)
/* excepción comentarios            → 2     (64, 96)
fontSize: [n] literales restantes  → 2     (64 hero input nombre, 96 hero paso espejo)
lineHeight: 1 funcionales          → 16    (cifras hero, botones icon)
```

---

## Excepciones documentadas

### `fontSize` (2 con comentario inline)

| Línea | Valor | Razón |
|---|---|---|
| 4546 | 64 | hero del input "nombre" en Onboarding paso 1 |
| 5255 | 96 | hero numérico del paso espejo "Antes de soltarte" |

Ambas marcadas con `/* excepción · {razón} */` justo en la propiedad.

### `lineHeight: 1` (16, patrón idiomático sin comentario individual)

Cifras display gigantes (KPIs hero, `MonteCarloCard` %, `KpiCard` value, "siguiente hito") y botones de icono (×, +/-). El `lineHeight: 1` colapsa la altura al cap-height del número/icono, evitando hueco vertical. Documentado en `AUDITORIA_VISUAL_v1_3_0.md` con la lista completa de ubicaciones.

---

## Validación

- **Babel**: ✓ Sintaxis OK tras cada una de las 4 pasadas (letterSpacing, lineHeight, fontSize numérico, fontSize clamp).
- **Runtime e2e** (Playwright + Chromium headless, viewport 1280×900 + 380×800):
  - Tour completo Mi Plan → Proyección → Seguimiento → Aprende → Ajustes → Mi Plan en ambos viewports ✓
  - Cero `pageerror`, cero console errors (sólo notas Babel de tamaño, esperadas).
  - Headers `<h2>` de los 3 movimientos renderizan a 32px en desktop (`displayMd` clamp max) ✓
  - "Hola, X" hero renderiza a 44px en desktop (`displayLg` clamp max) ✓
  - Caption italic muted renderiza a 15px (`body`) ✓

---

## Estructura del archivo

| Métrica | v1.2.1 | v1.3.0 | Δ |
|---|---|---|---|
| Líneas | 9.921 | 9.954 | +33 |
| Tamaño | ~545 KB | ~560 KB | +2,8% |

El crecimiento (+33 líneas, +15 KB) viene de:
- 28 líneas nuevas en `T` (sub-objetos tokenizados + comentarios).
- Comentarios de excepción inline (2).
- Comentario de cabecera del sistema tipográfico.

---

## Restricciones respetadas

- ✅ Sin tocar lógica, motor (`projectV2`, `runMonteCarlo`), persistencia, layout (flex, grid, gap, padding, margin).
- ✅ Cambios sólo en `fontSize`, `lineHeight`, `letterSpacing`.
- ✅ Sin dependencias externas nuevas.
- ✅ Sin renames de campos del estado persistido.
- ✅ Cero llamadas de red.
- ✅ Sin emojis nuevos. Sin copy nuevo.
- ✅ Vocabulario v1.2.1 preservado: "Ajustar por inflación", "Sin Plan / Con Plan", "sobre el papel".

---

## Resumen ejecutivo

| Fase | Pieza | Estado |
|---|---|---|
| 1 | Auditoría e inventario (`AUDITORIA_VISUAL_v1_3_0.md`) | ✓ |
| 2 | Diseño de la escala tipográfica (3 tokens) | ✓ |
| 3 · Pasada 1 | letterSpacing (290 sustituciones, 14→6 tokens) | ✓ |
| 3 · Pasada 2 | lineHeight (186 sustituciones, 14→4 tokens + 16 funcionales) | ✓ |
| 3 · Pasada 3 | fontSize numérico (590 sustituciones, 20→9 tokens + 2 excepciones) | ✓ |
| 3 · Pasada 4 | fontSize clamp (33 sustituciones, 20 combinaciones→4 tokens) | ✓ |
| 4 | Babel + grep + runtime e2e | ✓ |
| 5 | CONTEXTO actualizado con sección "Sistema tipográfico (v1.3.0)" | ✓ |
