# Eje 1 · Coherencia de estilo y diseño — Hallazgos

> **Contexto para lectura en frío.** La app define su sistema en `app/src/tokens/index.js` (objeto `T`): paleta crema (`T.bg #f5f0e6`), una única serif **Fraunces** (`T.display`/`T.serif`), una mono **DM Mono** (`T.mono`), y escalas `T.size`/`T.lh`/`T.tracking`. La pantalla **Proyección** usa el sistema "Cartel" (`app/src/ui/cartel.jsx`): editorial, **solo serif**, sin mono, valores editables con subrayado punteado + lápiz. El resto de pantallas (`ScreenHoy`, `ScreenSeguimiento`, `ScreenAjustes`, `ScreenAprende`) y las primitivas de `app/src/ui/index.jsx` (`Btn`, `Pill`, `Label`, `Slider`, `Card`) usan el sistema **antiguo**: eyebrows en `T.mono` MAYÚSCULAS + cajas. Solo hallazgos aquí; la prescripción está en `ROADMAP_Y_RECOMENDACIONES.md`.

## Fortalezas
- **Sistema de tokens centralizado y verificado** (`verify-tokens.mjs` contra baseline). Color y tipografía salen casi siempre de `T.*`.
- **Cartel editorial muy coherente**: `Spread`, `PosterFrame`, `SectionTag`, `EditableValue`, `ComputedNumber`, `LifeChart`, `MonteCarloChart`, `Stats3`, `Reveal` comparten lenguaje (serif itálica, sin caja, reveal suave).
- **Disciplina de color semántico**: `T.green` reservado al ★ de edad de libertad; `T.amber` para advertencias; `T.red` para borrar/alarma; `T.accent` para destacado/CTA.
- **Fraunces unificada**: cifras hero y números inline comparten formas (Instrument Serif jubilada).
- **Dark-mode**: verificado en vivo que los inputs de `MonthRow` (Seguimiento) conservan fondo crema en `prefers-color-scheme: dark` (invariante `appearance:none` respetado ahí).

---

## ED1 · Dos dialectos visuales conviven sin transición · **P1**
- **Evidencia.** *Cartel (serif puro):* `ScreenProyeccion` + `cartel.jsx`. *Antiguo (mono + caja):* `ScreenHoy`, `ScreenSeguimiento`, `ScreenAjustes`, `ScreenAprende`, y las primitivas `Btn`/`Pill`/`Label`/`Slider` de `ui/index.jsx` (todas con `textTransform:'uppercase'` + `T.mono` + `T.size.eyebrow`). Strings mono visibles: «TU PATRIMONIO», «CADA MES APARTAS», «TU DESTINO», «SIGUIENTE PASO», «DATOS», «TU PERFIL», numeración de sección «01/02/03».
- **Qué se observa.** Al saltar de Proyección (editorial, serif, aire) a Plan/Datos (etiquetas mono en mayúsculas, tarjetas con borde) cambia la identidad visual a media app.
- **Por qué importa.** Es la incoherencia de estilo #1. Rompe la sensación de "un solo producto" y contradice la dirección Cartel. Coincide con el pendiente **ESTADO #10 (Cartel Fase 2)**.

```
  CARTEL (Proyección)                 ANTIGUO (Hoy / Datos / Seguimiento)
  ┌───────────────────────┐          ┌───────────────────────────────┐
  │      Proyección        │ serif    │ TU PATRIMONIO        ← T.mono  │ mono caps
  │   Libre, pero          │ itálica  │ 7.9k€                          │ + caja con
  │   tarde: a los 70.     │ sin caja │ ───────────────────────────── │ borde
  │   545k€   906k€   67   │          │ + SUPUESTOS   VER EL CÁLCULO → │
  └───────────────────────┘          └───────────────────────────────┘
```

## ED2 · Tres estilos de botón en paralelo · **P2**
- **Evidencia.** (1) `Btn` (`ui/index.jsx`): mono, uppercase, tracking ancho. (2) `ctaBtn` en `ScreenProyeccion`: serif, peso 600, fondo `T.accent` (no usa `Btn`). (3) inline en Cartel: `addTramoStyle` («+ añadir tramo»), botón «borrar» (serif itálica, sin fondo).
- **Qué se observa.** Misma acción ("botón") con tres tratamientos según zona.
- **Por qué importa.** No hay primitiva de botón única; cada pantalla decide. Aumenta deuda y dificulta la Fase 2.

## ED3 · El nombre de meta se recorta bajo el badge «EN CAMINO» · **P2**
- **Evidencia.** `GoalRow` en `ScreenSeguimiento` (sección HITOS). Repro: Datos → Cargar datos demo → Seguimiento → scroll a HITOS.
- **Qué se observa.** La meta «Entrada del piso» se muestra como «**Entrada del pis**…» porque el `<input>` del nombre queda tapado por el chip «EN CAMINO» a su derecha.
- **Por qué importa.** Parece texto cortado/bug; es un overflow de layout (no de copy). Da sensación de inacabado en una tarjeta central.

```
  ┌───────────────────────────────────────┐
  │ Entrada del pis▌  [ EN CAMINO ]    ×   │  ← el input del nombre se solapa
  │ CATEGORÍA  Otro                        │     con el badge: "piso" se corta
  └───────────────────────────────────────┘
```

## ED4 · Cuatro variantes de "card" sin primitiva común · **P2/P3**
- **Evidencia.** `Card` (`ui/index.jsx`, papel + borde + radio 14) · borde inline de `TramoRow` (radio 10, color condicional) · `MonteCarloBand` (`cartel.jsx`, fondo `T.ink`, radio 18) · shells de `NextStep`.
- **Qué se observa.** Cuatro contenedores tipo tarjeta con radios/bordes/paddings distintos.
- **Por qué importa.** La Fase 2 (ESTADO #10) pide precisamente tokenizar tarjetas; hoy no hay fuente única.

## ED5 · Inputs a verificar sin `appearance:none` · **P2**
- **Evidencia.** Confirmado **OK** en `MonthRow` (dark-mode en vivo). **A verificar:** el `<select>` de categoría en `HitosEditor` y los `input[type=range]` del `Onboarding`. El editor de `TramoRow` legacy también carece, pero **es código muerto** (solo lo usa `ScreenProyeccionLegacy`). `EditableValue`/`CartelMonthValue`/`MonthInput` sí cumplen.
- **Qué se observa.** Riesgo del bug documentado de dark-mode macOS/iOS (fondos crema → casi-negro) en controles nativos sin neutralizar.
- **Por qué importa.** Es un invariante del proyecto; aplica a inputs **vivos** (select de metas, sliders de onboarding).

## ED6 · Dos `rgba()` literales en el Cartel fuera del registro de tokens · **P3**
- **Evidencia.** `cartel.jsx`: borde de `PosterFrame` (`rgba(26,22,18,.28)`, derivado de `T.ink`) y label del peor-10 % en `MonteCarloBand` (`rgba(255,253,247,.7)`, derivado de `T.bg`). (El derivado `ACCENT_LIGHT #f4a06a` sí está nombrado como constante.)
- **Qué se observa.** Son derivados legítimos, pero literales sueltos en JSX.
- **Por qué importa.** Rompe en sentido estricto "color solo por `T.*`" y escapa al verificador.

## ED7 · Invariante "cifra hero nunca `T.accent`" sin documentar + caso límite · **P2/P3**
- **Evidencia.** La doctrina dice que las cifras hero no llevan `T.accent` (única excepción: ★ edad de libertad en `T.green`). No hay comentario que lo fije en `Stats3`/`ComputedNumber`. Caso límite: el valor **P90** de `Stats3` en el spread "¿Y te dura?" usa `color: T.accent`.
- **Qué se observa.** Un número grande va en accent (el "mejor 10 %"). Es defendible (accent = destacado), pero queda en zona gris sin regla escrita.
- **Por qué importa.** Sin la regla comentada, un futuro editor no sabe si es intención o desliz.

## ED8 · Dos juegos de iconos con conceptos solapados · **P3**
- **Evidencia.** `CartelIcon`/`LineIcon` (`cartel.jsx`) y `LearnIcon` (`ui/index.jsx`) dibujan ambos 'interes-compuesto', 'inflacion', 'patrimonio', etc.
- **Qué se observa.** El mismo concepto tiene dos trazados según el módulo.
- **Por qué importa.** Duplicación de diseño; riesgo de que diverjan visualmente.

---

### Punteros de reproducción rápida
| Hallazgo | Cómo verlo |
|---|---|
| ED1 | Alterna nav: Proyección ↔ Plan ↔ Datos. |
| ED3 | Seguimiento → HITOS → tarjeta «Entrada del piso». |
| ED5 | Seguimiento → HITOS → desplegar `<select>` CATEGORÍA con macOS en modo oscuro. |
| ED7 | Proyección → spread «¿Y te dura?» → fila P10 · mediana · P90 (P90 en naranja). |
