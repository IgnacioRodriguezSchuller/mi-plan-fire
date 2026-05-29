# Mi Plan FIRE — CHANGELOG v1.4.0b

Ciclo completo de 7 sub-prompts (SP-01 a SP-07) bajo la `DOCTRINA_DISENO.md v1.2.1` (que evolucionó de v1.2 → v1.2.1 en SP-03). Origen: `mi_plan_v1_4_0a.html`.

Objetivo del sprint: alinear el producto con la doctrina visual destilada (paleta P3, callouts U1, A9 KPI hero, charts conservadores, lead/sub-anclajes, shell editorial). Δ neto: **+31 líneas / -2 KB**.

---

## SP-01 · Saneamiento de tokens y zombis

- `T.inputBg = '#faf3e4'` añadido al objeto T (entre `lineSoft` y `accent`). Único token nuevo de la paleta v1.2 doctrina. P3 inputs. Usado en v1.4.0c.
- `function KpiCard` eliminada (22 líneas). Tenía variante "highlight" inverted que la doctrina v1.1 eliminó por atemperamiento Ruta B. Cero callers vivos.
- Zombi `sandboxSeries` en `LineChart` limpio en 3 puntos: signature, mapeo, render condicional verde dashed `6 3`. Limpieza del residuo post-eliminación de Probador en v1.4.0a.
- `CLAUDE_CODE_CONTEXTO.md` cabecera con referencia obligatoria a `DOCTRINA_DISENO.md v1.2`. Sección de paleta lista `T.inputBg`.

## SP-02 · Callouts unificados al patrón U1

Los 3 callouts del `ConceptModal` (Lección clave / Regla / Aviso) convergen al patrón U1 doctrinal: `borderLeft 3px solid {color semántico}` · `padding 14px 20px` · `borderRadius '0 6px 6px 0'` · `background rgba(color, 0.06-0.08)`.

| Callout | Antes | Después |
|---|---|---|
| Lección | padding `20px 24px` sin radius · cuerpo `subtitle 22` | padding `14px 20px` · `0 6px 6px 0` · cuerpo `lead 17` |
| Regla | `border 1px line` · `bg T.bg` · `radius 8` · padding `18px 22px` | `borderLeft 3px T.muted` · `bg rgba(110,98,83,0.06)` · `radius '0 6px 6px 0'` · padding `14px 20px` |
| Aviso | `border 1px amber` · `radius 8` · padding `18px 22px` | `borderLeft 3px amber` · `radius '0 6px 6px 0'` · padding `14px 20px` |

Antipatrón A7 ("diferencias de tratamiento entre callouts del mismo rol") resuelto.

## SP-03 · A9 aplicado a cifras hero/destilado + doctrina patch v1.2.1

6 ediciones del SP + 1 ampliación coherente:

**Grupo 1 · cifras descriptivas → T.ink** (era T.green o T.accent sin razón semántica):
- Insight card "Tu dinero ya trabaja" (passiveMonthly).
- Insight card "Libertad financiera" (ageAtFI).
- NextGoalCard target (próximo hito).
- Pensión pública estimada.

**Grupo 2 · pérdida teórica → T.red** (era T.accent inconsistente con cifras hermanas ya en T.red):
- Onboarding paso 8/9 "Verdad 2 · Diferencia".
- Mov 1.B "Lo que dejarías de tener si no inviertes".
- **+ ampliación coherente**: `ScreenSinMiPlan` "Verdad 2 · Diferencia" (cifra que ve el usuario al abrir `SinMiPlanModal`). El SP listaba línea 4999 (onboarding) pero el criterio de verificación apuntaba al modal; aplicado a ambos lugares para mantener coherencia A9 entre cifras hermanas.

**Grupo 3 · intereses hipoteca mantiene T.amber** (uso legítimo de "coste contratado con atención sin alarma"). Este caso motivó la actualización de doctrina.

**Doctrina patch v1.2 → v1.2.1** generada en `DOCTRINA_DISENO_v1_2_1_PATCH.md`:
- Cabecera: bump de versión.
- §2 "KPI hero": `T.amber` añadido como cuarta opción válida (coste contratado).
- §3 antipatrón A9: amber + edades + targets enumerados; accent prohibido en cifras hero.
- §6 Revisiones: nueva fila explicando el patch.
- Mapping rápido: token list `ink/green/red/amber`.

**Hallazgo no resuelto**: las ediciones A.1/A.2 (`FinancialHealthCard`) y A.3 (`NextGoalCard`) están aplicadas en código pero sus componentes parent no tienen callers JSX vivos (huérfanos post-rediseño v1.1.1, mismo patrón que `KpiCard` eliminada en SP-01). Candidato a SP de limpieza futuro.

## SP-04 · Charts conservadores

Doctrina §2 "Scope sección · charts": línea principal 2px sólida · referencia 1.5px dashed "4 4" T.faint · ticks letterSpacing 0.04em · leyenda mono uppercase muted.

| Eje | Ediciones |
|---|---|
| **A · strokes principales → 2px** | `portfolio` 2.5, `p50` 2.4, `user` 2.8, `real` 2.4, `investedReal` 2.4 → todos **2** |
| **B · referencias → 1.5px dashed "4 4"** | `plan` "5 4" → "4 4"; `invested` muted/1/"2 3" → faint/1.5/"4 4"; `nominal` 1.6/"5 4" → 1.5/"4 4"; `parkedReal` 1.6/"5 4" → 1.5/"4 4"; `std` condicional ternario normalizado |
| **C · ticks** | 18 ocurrencias `tick={{...eyebrow}}` → +`letterSpacing: '0.04em'` |
| **D · LegendChip** | autocontenido: + `fontFamily T.mono` / `color T.muted` / `letterSpacing T.tracking.wider` / uppercase; swatch 2.5 → 2; "3 3" → "4 4" |
| **Extra · MultiLineChart dinámico** | scenarios.map: bold `2.8` → 2, ref `1.6` → 1.5, dash `'5 4'` → `'4 4'`. No estaba en listado literal del SP pero su violación era idéntica; aplicado por coherencia con el resto de charts post-SP-04 |

**Excepciones intactas**: p10/p90 Monte Carlo (banda incertidumbre, `strokeWidth=1` opacity 0.35), Area decum (`1.6` `"3 3"`), Area invest stepAfter (`1.4` stacked), ReferenceLine markers (fuera del alcance de "líneas de serie").

## SP-05 · Prosa, lead y sub-anclajes

- **A · Lead 1.A de Mi Plan**: `T.size.subtitle → T.size.lead` (22→17), `T.lh.normal → T.lh.relaxed` (1.5→1.6), `maxWidth 720 → 640`. Ratio jerarquía 44:32:17 conforme doctrina.
- **B · Sub-anclaje 1.B "Sin un plan"**: eyebrow temático sustituido por patrón completo doctrinal — flex baseline gap 10 + numeración mono eyebrow widest "1.B" + `<h3>` display subtitle ink. Párrafo descriptivo siguiente `maxWidth 720 → 640`.
- **C · Sin numeración** en sub-bloques sin título temático (1.A lead, 1.C widget, 1.D CTA): regla "numeración sólo donde hay título visible" aplicada.

**Deuda SP-05.D**: lead 1.A contiene **4 énfasis `<strong>`** (patrimonio + ingreso/Ajustes + gasto + ahorro), excede ≤3 doctrinal. No se reescribió prosa en este SP por riesgo de regresión. Candidato a SP futuro.

**Pendiente complementaria**: extender el patrón sub-anclaje a Movimientos 2 y 3 si tienen sub-bloques con eyebrow temático (no migrados en este SP).

## SP-06 · Shell desktop · top nav editorial + KpiPill + AccountMenu

Sustituye sidebar 210px por header sticky horizontal:

```
[Mi Plan italic accent 28] [Plan│Proy│Seg│Aprende│Ajustes display italic 17 con borderBottom accent activo] [KpiPill ink · ○ avatar 28×28]
```

- **KpiPill** (componente nuevo): pill ink con `retireAge → cifra finalPace + sparkline mini 24×9`. Sustituye a `MiniProjectionFooter` (eliminada). onClick → `setTab('proy')`. Reutiliza `d.finalPace.portfolio` y `d.seriesActualPace`.
- **AccountMenu** (componente nuevo): popover absolute anchor al botón circle. 3 items placeholder (Exportar / Borrar / Acerca de) reservados para Sprint 4. Cierra con click fuera, escape, o click en item.
- **Tab label "Mi Plan" → "Plan"** (id `hoy` intacto).
- **Footer legal**: `<footer>` mono uppercase eyebrow widest con texto "DATOS GUARDADOS EN LOCAL · MI PLAN V1.4.0B".
- **`MiniProjectionFooter` eliminada** (función + render): superficie ink-fondo persistente en pie del sidebar — violaba la Ruta B atemperada. Su info se condensa en `KpiPill`.

State añadido en Shell: `showAccountMenu` + `accountAnchorRef`. `useRef` ya disponible.

## SP-07 · Shell mobile · bottom nav editorial + cabecera KpiPill

Sustituye bottom nav mono uppercase por bottom nav editorial italic display:

```
header sticky: [Mi Plan italic 22 accent] [KpiPill] [○ avatar 24×24]
↓ main scroll ↓
footer: DATOS GUARDADOS EN LOCAL · MI PLAN V1.4.0B
bottom nav fijo: ◐ Plan │ ◢ Proy. │ ◧ Seguim. │ ◇ Aprende │ ◌ Ajustes
                        (display italic 10px, símbolo display subtitle, borderTop accent activo)
```

- KpiPill y AccountMenu reusan los componentes de SP-06.
- Labels italic abreviadas inline: "Proyección" → "Proy.", "Seguimiento" → "Seguim." (caben en columna ~70px).
- ◌ Ajustes navega a `ScreenAjustes` (el popover es del avatar, no del tab Ajustes).
- Footer 80px padding-bottom para que el contenido no quede tapado por el bottom nav fijo.
- **`AccountPill` eliminada**: 0 callers tras la reescritura mobile. Sustituida en ambos shells por el botón circle + AccountMenu.

---

## Doctrina v1.2 → v1.2.1

Actualizada en SP-03 vía `DOCTRINA_DISENO_v1_2_1_PATCH.md` (5 ediciones: cabecera + §2 KPI hero + §3 A9 + §6 Revisiones + mapping rápido). Aplicar manualmente sobre el documento maestro.

---

## Auditoría final

```
function MiniProjectionFooter   → 0 ✓
function KpiCard                → 0 ✓
function AccountPill            → 0 ✓
function SandboxBanner          → 0 (v1.4.0a)
function SupuestosEditables     → 0 (v1.4.0a)
sandboxSeries / dataKey="sandbox" → 0 (SP-01)
fontSize hero displayLg/displayMd con T.accent → 0 ✓ (SP-03)
strokeWidth={2.5}|{2.4}|{2.8}    → 0 ✓ (SP-04)
strokeDasharray="5 4"             → 0 ✓ (SP-04)
ticks sin letterSpacing           → 0 ✓ (SP-04)
escape unicode literal \u00XX    → 0 (v1.2.1)
"€ sin/con inflación" JSX visible → 0 (v1.1.1)
```

**Surfaces inverted residuales** (legítimas, no violaciones a Ruta B):
- `Btn variant=primary` (línea 2334): patrón de botón primary del sistema.
- Botones icon circle (líneas 2686, 4267, 4343): icon buttons funcionales.
- Badges helper micro contextuales (líneas 3186, 3643, 8797): elementos discretos no compiten con contenido.
- KpiPill (línea 9477): pill compacta del top nav, sustituta funcional de la MiniProjectionFooter eliminada.

La Ruta B atempera **superficies inverted grandes persistentes** (sidebar dashboard, card destacada). No prohíbe botones primary ni elementos micro inverted que cumplen función discriminada.

---

## Estructura del archivo

| Métrica | v1.4.0a | v1.4.0b | Δ |
|---|---|---|---|
| Líneas | 9.722 | 9.753 | **+31** |
| Tamaño | ~540 KB | ~538 KB | -2 KB |

Δ dentro del rango esperado (-100 a +50). Δ positivo por adición de componentes (KpiPill, AccountMenu), comentarios doctrina, footer legal; compensado por eliminación de KpiCard, MiniProjectionFooter, AccountPill, sandboxSeries.

---

## Validación

- **Babel**: ✓ tras cada uno de los 7 SPs.
- **Runtime e2e** Playwright + Chromium headless:
  - **Desktop 1280×900** (SP-06): header sticky, logo italic accent, 5 tabs display italic con borderBottom activo, KpiPill 60→725k€ con sparkline, AccountMenu popover (3 items, cierra con Escape/click fuera), footer mono uppercase, 0 sidebar, navegación entre tabs ok.
  - **Mobile 390×844** (SP-07): header sticky compacto, logo italic 22px, KpiPill, avatar 24×24, bottom nav con 5 tabs display italic ("Plan / Proy. / Seguim. / Aprende / Ajustes"), borderTop accent activo, footer presente, ◌ Ajustes navega a ScreenAjustes, popover funcional.
- **Compatibilidad de estado persistido**: localStorage v1.4.0a carga sin errores en v1.4.0b (state.sandbox zombi preservado, tabs ids intactos).

---

## Roadmap inmediato

| Versión | Sprint | Foco |
|---|---|---|
| v1.4.0c | SP-08 (próximo) | P3 inputs · usar `T.inputBg` en `<input>` y `<select>` del producto |
| — | — | SP futuro · resolver deuda SP-05.D (énfasis lead 1.A) |
| — | — | SP futuro · limpieza huérfanos `FinancialHealthCard` y `NextGoalCard` (siguen en código sin callers) |
| — | — | SP futuro · normalizar ReferenceLine markers (dash `3 3` fuera del alcance de SP-04) |
| Sprint 4 | — | Probador unificado (Pro): reactivar `state.sandbox` + callbacks `startSandbox/applySandbox/discardSandbox` (zombi desde v1.4.0a) |

---

## Resumen ejecutivo

| SP | Pieza | Estado |
|---|---|---|
| 01 | T.inputBg + KpiCard eliminada + sandboxSeries limpio | ✓ |
| 02 | 3 callouts ConceptModal unificados al patrón U1 | ✓ |
| 03 | A9 aplicado a 7 cifras hero + doctrina patch v1.2.1 | ✓ |
| 04 | 5 strokes principales 2px + 5 referencias 1.5px "4 4" + 18 ticks letterSpacing + LegendChip autocontenido + MultiLineChart dinámico | ✓ |
| 05 | Lead 1.A bajado a `lead 17` + sub-anclaje "1.B · Sin un plan" completo | ✓ |
| 06 | Shell desktop reescrito · KpiPill + AccountMenu + footer + MiniProjectionFooter eliminada | ✓ |
| 07 | Shell mobile reescrito · KpiPill + AccountMenu + bottom nav italic + AccountPill eliminada | ✓ |
