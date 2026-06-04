# CLAUDE.md — Mi Plan FIRE

Guía de trabajo para Claude Code. **Se carga automáticamente en cada sesión.** Léela entera antes de tocar nada.

## Qué es esto
App de planificación financiera **FIRE**, **local-first** (todo en el navegador, cero red), en español. Producto con **voz editorial**: sobrio, sin gamificación. Autor y único dev: Nacho. **Nacho decide producto; tú decides lo técnico y la secuenciación.**

## Fuente de verdad (LÉELO)
- **Código vivo: `app/` (proyecto Vite).** El desarrollo pasa aquí: `cd app && npm run dev`.
- **`mi_plan_v1_5_0a_3.html` (raíz) está CONGELADO**: baseline de la migración y red de regresión. Hash SHA-1 `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`. **NUNCA lo edites** (ya denegado en `.claude/settings.json`). `app/src` **diverge a propósito** del baseline con sprints de diseño.
- **Referencia los símbolos por NOMBRE / string / ruta, NUNCA por número de línea.** El baseline y `app/src` divergen; los números de línea del baseline ya no aplican a `app/src`.

## Cómo se trabaja
```bash
cd app
npm install          # deps fijadas exactas (Node 22 · ver .nvmrc → nvm use)
npm run dev          # http://localhost:5173
npm run build        # → dist/index.html (single-file, el lead magnet)
npm run preview
node scripts/verify-tokens.mjs   # idem verify-lib / verify-content / verify-state
```
- `http://localhost:5173/?gallery` → galería de componentes (cada primitiva/gráfico/modal con datos de ejemplo). Úsala para revisar visualmente.
- El layout y el diseño se juzgan **en el navegador**, no en informes.

## Invariantes — lo que NO se hace (salvo que el prompt lo pida explícitamente)
- No cambiar las firmas de `projectV2` ni `runMonteCarlo`: solo añadidos **opcionales** (aditivos).
- No tocar `migrateToV2`: tiene **rarezas intencionales del baseline** (no idempotente a la 1ª pasada; reset one-off B8). NO son bugs. Cambiarlas altera el estado guardado de usuarios reales.
- No renombrar **claves de localStorage** (`miplan.state.v1`, `miplan.accounts.v1`) ni campos del estado persistido. `schemaVersion 2`. El campo zombie `isPro` se conserva.
- **Cero red**: ningún `fetch`, ninguna API, ninguna dependencia o fuente nueva.
- No tocar `LEARN_CORPUS` (contenido editorial cerrado; los niveles viven en `LEARN_LEVELS`).
- Nada de gamificación: sin confeti, sonidos, rachas, notificaciones ni "celebraciones". El producto es sobrio por diseño.
- Sin emojis nuevos (solo los ya en uso).
- **Inputs**: `appearance: none` + `-webkit-appearance: none` obligatorio. Sin esto, el modo oscuro de macOS/iOS pinta los fondos crema en casi-negro (bug documentado).
- **Color solo por tokens** (`T.*`), nunca rgba literal. Semántica: amber=advertencia, red=alarma, green=confirmación, accent=destacado. Las cifras hero NO llevan `T.accent` (única excepción documentada: el ★ de edad de libertad va en `T.green`).

## Antes de commitear
- `npm run build` OK · los 4 verificadores en verde · **hash del baseline intacto** · **consola del navegador limpia** (la build no detecta errores de React —Rules of Hooks, etc.—, así que abre la app).
- **Ritmo: un prompt → repaso → commit.** No encadenar varios sprints sin commit intermedio.
- Si una decisión de producto o de copy no está clara: **PREGUNTA, no inventes.** Los bugs colaterales se anotan en `BUGS_ENCONTRADOS.md`; no se arreglan salvo que bloqueen el trabajo en curso.

## Mapa de documentos
- **Estado actual + pendientes** → `ESTADO.md` (fuente única; actualízalo al cerrar sprint).
- **Doctrina de diseño (vinculante)** → `DOCTRINA_DISENO.md`.
- **Decisiones de producto** → `DECISIONES_PRODUCTO_4.md`.
- **Voz editorial + contexto técnico extendido** → `CLAUDE_CODE_CONTEXTO.md`.
- **Registro de cambios** → `CHANGELOG_v1_5_0a_3_src.md` (una entrada por cambio: causa raíz · cambio · no-tocado · verificación).
