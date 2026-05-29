# CHANGELOG v1.5.0a.3 · 2026-05

Mini-sprint de honestidad editorial post-LIMPIEZA. Cierra **H41**, **H43**,
**H44** (HTML) y **H42** (doctrina). El objetivo era pulir promesas, copy y
presentación de cifras para que el HTML aguante una auditoría externa de la
comunidad FIRE en GitHub.

## Cambios (4 puntos)

### Punto 1 · H41 · Eliminada promesa falsa en onboarding paso 9
- L4749 — Lista "Lo que sí" del paso "Esto es lo que Mi Plan FIRE va a hacer
  contigo":
  - **Antes**: `Compara escenarios sin tocar tu plan real.`
  - **Después**: `Te enseña qué decisiones cambian más las cifras.`
- Razón: la feature "Probador" se eliminó en v1.5.0a; prometerla era engaño.
  El nuevo copy mantiene el espíritu (entendimiento de palancas) sin exigir
  una UI que ya no existe.

### Punto 2 · H44 · Neutralizado KPI "Poder adquisitivo perdido" en 1.B
- L5733 — Label: `Poder adquisitivo perdido en X años` → `Erosión salarial
  por inflación en X años`.
- L5734 — Color de la cifra `−{fmtEur(sinPlanKPIs.lost)}`: `T.red` → `T.amber`
  (sancionado por DOCTRINA §2: T.amber para coste contratado/estructural que
  merece atención visual sin alarma).
- L5737–5739 — Caption reescrito explicitando supuesto y diferenciando de la
  segunda Card: `Asumiendo que tu salario sube ~1% nominal al año (media
  española) y la inflación 2,5%. Esta erosión la sufre todo asalariado medio;
  el plan no la elimina, pero la siguiente Card sí muestra qué SÍ depende de
  actuar.`
- **No tocado**: el modal completo "Sin un plan" (Verdad 1) sigue mostrando
  `−X` en T.red porque ese contexto SÍ trae prosa contextualizadora ("Si tu
  salario sube exactamente al ritmo de la inflación, tu poder adquisitivo se
  mantiene…").

### Punto 3 · H43 · Refactor sub-bloque 1.A para evitar frases agramaticales
- L5705–5715 — Sustituido el bloque de fragmentos JSX concatenados con
  puntuación suelta por una función inmediata `(() => { ... })()` que compone
  la frase condicionalmente antes de renderizar.
- Las 4 partes (`Tienes X`, `Ganas Y`, `gastas Z`, `ahorras W`) se montan en
  un array y se unen con coma + " y " antes del último, terminando con un
  único punto final.
- Comentario explicativo `H43 · Refactor` añadido en cabecera del bloque.

### Punto 4 · H42 · DOCTRINA_DISENO.md cabecera actualizada
- Cabecera (línea 6–7):
  - **Antes**: `CLAUDE_CODE_CONTEXTO_7.md` (contexto técnico),
    `AUDITORIA_VISUAL_v1_3_0.md` (inventario tipográfico histórico),
    `DECISIONES_PRODUCTO_3.md` (bitácora editorial). Aplica a
    `mi_plan_v1_4_0a.html`.
  - **Después**: `CLAUDE_CODE_CONTEXTO_9.md` (contexto técnico),
    `DECISIONES_PRODUCTO_4.md` (bitácora editorial y modelo de distribución).
    Aplica a `mi_plan_v1_5_0a.html`.
- Eliminada referencia a `AUDITORIA_VISUAL_v1_3_0.md` (no existe en el
  proyecto).
- Bonus para cumplir auditoría grep `→ 0 ocurrencias`: actualizadas
  también las 2 referencias residuales a `CLAUDE_CODE_CONTEXTO_7.md` en el
  cuerpo del documento (L173 §Sistema tipográfico, L257 nota histórica de
  migración).

## Auditoría grep

```
Compara escenarios sin tocar tu plan real          → 0 ✓
Poder adquisitivo perdido en (en 1.B)              → 0 ✓
Erosión salarial por inflación                     → 1 ✓
color: T.red.*sinPlanKPIs.lost                     → 0 ✓
color: T.amber + sinPlanKPIs.lost (bloque contig.) → 1 ✓
Te enseña qué decisiones cambian más las cifras    → 1 ✓
Doctrina refs viejas (7/3/v1.4.0a/AUDITORIA)       → 0 ✓
Doctrina refs nuevas (9/4/v1.5.0a)                 → 4 ✓
```

## Δ líneas

- v1.5.0a.2: 9351 líneas.
- v1.5.0a.3: 9372 líneas.
- **Δ = +21 líneas** (refactor sub-bloque 1.A: ~10 líneas concatenadas →
  ~30 líneas de función compuesta + comentario; el resto son ajustes menores).

## Validación

- **Babel**: ✓ Sintaxis OK.
- **Runtime e2e** (Playwright + Chromium headless 1280×900):

  **Bloque B · KPI sub-bloque 1.B**
  - Label `Erosión salarial por inflación en X años` visible. ✓
  - Caption con `~1% nominal al año (media española)` visible. ✓
  - Label viejo `Poder adquisitivo perdido en` ausente del 1.B. ✓
  - Color computado de la cifra: `rgb(180, 83, 9)` = `#B45309` = T.amber. ✓

  **Bloque C · 4 casos sub-bloque 1.A** (state custom inyectado vía
  localStorage + reload):
  - **C1** income=0 → `Tienes 7.9k€ de patrimonio. Sin ingreso definido —
    añade un tramo en Proyección.` ✓ PASS (sin "..", ",.", " .").
  - **C2** income>0, monthlyLife=0 (actualLife empty), planAporte=0 →
    `Tienes 7.9k€ de patrimonio. Ganas 2.4k€/mes neto.` ✓ PASS.
  - **C3** income>0, monthlyLife>0, planAporte=0 → `Tienes 7.9k€ de
    patrimonio. Ganas 2.4k€/mes neto y gastas 2.4k€.` ✓ PASS.
  - **C4** demo default → `Tienes 7.9k€ de patrimonio. Ganas 2.4k€/mes neto,
    gastas 2.0k€ y ahorras 432€ (18% de tu neto).` ✓ PASS.

  **Bloque D · AboutModal**
  - Sigue abriéndose desde AccountMenu → "Acerca de". Botón "Ver versión
    web →" presente. ✓

  **Bloque E · Modal "Sin un plan" Verdad 1**
  - Click "Ver el cálculo completo →" abre el modal. Label `Poder
    adquisitivo perdido (acumulado)` visible dentro del modal. Color del
    `−X` en el modal: `rgb(185, 28, 28)` = T.red. ✓ Sin cambio (el modal
    SÍ tiene prosa contextualizadora).

  **Errores en consola**: 0 en toda la sesión.

  **Onboarding paso 9** (lista "Lo que sí"): verificado estáticamente vía
  grep (L4749). El wizard tiene 9 pasos cada uno con `Siguiente →`
  bloqueado hasta rellenar input — navegar por todos requiere mockear cada
  input. La auditoría grep + lectura directa del JSX confirman que el copy
  está aplicado en el sitio correcto (`title: 'Esto es lo que Mi Plan
  FIRE va a hacer contigo'` en L4735, "Lo que sí" en L4745, item editado en
  L4749).

## Notas finales

- No se ha tocado `projectV2`, `runMonteCarlo`, ni firma exterior de
  ninguna función pública.
- Cero campos persistidos renombrados.
- Cero cambios en el corpus Aprende.
- Cero hallazgos colaterales — `BUGS_ENCONTRADOS_v1_5_0a_3.md` no se crea.
