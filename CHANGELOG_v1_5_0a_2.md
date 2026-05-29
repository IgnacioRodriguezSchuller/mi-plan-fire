# CHANGELOG v1.5.0a.2 · 2026-05

Mini-sprint para cerrar **H36** (sub-bloque 1.D "CTA Pro" visible en Mi Plan) y
**H37** (pantalla `SinMiPlanProPlaceholder` destino del CTA) detectados tras el
sprint LIMPIEZA v1.5.0a. Eran la filtración más visible del modelo de negocio
en el HTML, incompatible con el Modelo §7 de `DECISIONES_PRODUCTO_4.md`.

## Cambios (3 puntos)

### Punto 1 · Eliminado sub-bloque 1.D "CTA Pro" de ScreenMiPlan (L5798–5806)
- Eliminado el div entero del sub-bloque (9 líneas: contenedor + texto + Btn).
- Cerrado el `</section>` correctamente tras el sub-bloque 1.C anterior.
- Transición visual al "Movimiento 2" verificada: limpia, sin necesidad de
  ajustar márgenes adicionales.

### Punto 2 · Eliminada pantalla `SinMiPlanProPlaceholder`
- Eliminada la función completa (L5550–5578, 29 líneas + 2 de comentario).
- Eliminadas las 2 rutas `{tab === 'sinplan-pro' && <SinMiPlanProPlaceholder goTo={setTab} />}`
  (mobile + desktop, antes en L9294 y L9361).
- Reescrito el comentario L4966 quitando la frase
  `desplegable → "Profundizar (Pro)").` y manteniendo el resto del comentario
  sobre `ActualLifeOnboarding`.
- Limpiados 2 comentarios obsoletos que mencionaban "Pro" en `MonteCarloCard`
  (L3460 "free/Pro" → simple; L3487–3489 "CTA Pro eliminados con el colapso a
  versión free" → "CTA promocional eliminada con el colapso al HTML libre").

### Punto 3 · Neutralizado `ctaLabel` en L5545
- `ctaLabel: 'Revisión fiscal España 2026: disponible en la versión web.'`
  → `ctaLabel: null,`.
- Verificado que `computeNextStep` no tiene callers en el código (función
  huérfana) — el cambio a `null` es totalmente seguro. No se añade guard porque
  no hay renderer que consuma el valor.

## Auditoría grep (especificación del sprint)

```
Profundizar (Pro)                  → 0 ✓
sinplan-pro                        → 0 ✓
SinMiPlanProPlaceholder            → 0 ✓
funcionalidad Pro                  → 0 ✓
disponible en la versión web       → 0 ✓
\bpro\b (case-insensitive)         → 2 (ambas legítimas):
  · L20  — "Pro features" en header AGPL (excepción documentada en el spec)
  · L1546 — "branching free/pro" en comentario migrateToV2 sobre el zombie isPro
```

Ninguna mención al modelo de negocio activo permanece. Las 2 ocurrencias de
`\bpro\b` son: (1) el descriptor del header AGPL que explica la oferta dual
HTML/web, y (2) trazabilidad técnica del campo zombie `state.isPro`.

## Δ líneas

- v1.5.0a: 9394 líneas.
- v1.5.0a.2: 9351 líneas.
- **Δ = −43 líneas**.

## Validación

- **Babel**: ✓ Sintaxis OK.
- **Runtime e2e** (Playwright + Chromium headless 1280×900):
  - **Onboarding** → completa.
  - **5 pantallas** (Plan, Proyección, Seguimiento, Aprende, Datos): cargan sin
    errores nuevos en consola.
  - **Sub-bloque 1.D ausente en Plan**: "Profundizar (Pro)" = 0 visible,
    "Es una funcionalidad..." = 0 visible.
  - **Sub-bloque 1.B mantenido**: "Ver el cálculo completo →" sigue presente
    (la transición a Movimiento 2 no perdió aire visual).
  - **Total errores de consola**: 0.

## Cierre de H36 y H37

Las 3 incidencias anotadas en `BUGS_ENCONTRADOS_v1_5_0a.md` están resueltas.
El documento se actualiza marcándolas como cerradas en v1.5.0a.2.
