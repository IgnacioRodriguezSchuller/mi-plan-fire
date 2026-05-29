# Mi Plan FIRE — Auditoría visual v1.3.0

Inventario tipográfico previo a la tokenización. Documenta los valores históricos, su frecuencia, familia tipográfica dominante y token destino. Queda como referencia futura.

Origen: `mi_plan_v1_2_1.html` (~9.921 líneas, ~545 KB).

---

## Resumen ejecutivo

| Eje | Valores únicos antes | Ocurrencias | Tokens nuevos | Excepciones |
|---|---|---|---|---|
| `fontSize` numérico | 20 (10-96px) | 560 | 5 base + 4 display | 2 (64, 96 hero) |
| `fontSize` clamp() | 20 combinaciones | 33 | 4 display tokens | 0 (todas mapeadas) |
| `lineHeight` | 14 (0.95-1.7) | 202 | 4 tokens | 16 (`lineHeight: 1` funcional) |
| `letterSpacing` | 14 (-0.03em a 0.18em) | 290 | 6 tokens | 0 |
| **Total** | **68** | **1085** | **23** | **18** |

---

## Tabla 1 · fontSize numérico

| Valor | Ocurrencias | Familia dominante | Casos de uso típicos | Token destino |
|---|---|---|---|---|
| 10 | 1 | mono | Caption del toggle "afecta a las cifras de la trayectoria" en Mi Plan | `T.size.eyebrow` (11) |
| 11 | 249 | mono uppercase | Labels, eyebrows, captions micro, ticks de Recharts, badges | `T.size.eyebrow` (11) — el 99% (243) es mono; 3 ocurrencias eran serif italic y se suben a `T.size.caption` (13) por suelo tipográfico |
| 12 | 22 | serif/mixto | Captions secundarios, prosa pequeña | `T.size.caption` (13) — sube por legibilidad |
| 13 | 79 | serif/sans | Caption, helper text, metadatos | `T.size.caption` (13) |
| 14 | 76 | serif | Body fino, captions densos | `T.size.body` (15) — sube por legibilidad |
| 15 | 16 | serif | Body de prosa | `T.size.body` (15) |
| 16 | 14 | serif | Body lead, prosa hero pequeña | `T.size.lead` (17) — sube por jerarquía |
| 17 | 9 | serif | Lead intro | `T.size.lead` (17) |
| 18 | 8 | serif/display | Subtítulos pequeños | `T.size.subtitle` (22) — sube por jerarquía |
| 20 | 3 | display | Cifras medianas | `T.size.subtitle` (22) |
| 22 | 42 | display | KPIs medianos, números fijos | `T.size.subtitle` (22) |
| 24 | 8 | display | Títulos h3, KPIs grandes en cards, headings de modal | `T.size.subtitle` (22) — mantiene peso, evita compaction |
| 26 | 9 | display | KPIs grandes, títulos secundarios, inputs hero (input goal) | `T.size.subtitle` (22) |
| 28 | 8 | display | Headers de sección | `T.size.displayMd` (clamp 24-32) |
| 32 | 3 | display | Cifras display grandes | `T.size.displayMd` (clamp 24-32) |
| 36 | 3 | display | Cifras hero KPIs (MC %, "siguiente hito") | `T.size.displayLg` (clamp 28-44) |
| 38 | 2 | display | Cifras hero KpiCard | `T.size.displayLg` (clamp 28-44) |
| 48 | 7 | display | Hero numérico de Stats, headers grandes | `T.size.displayLg` (clamp 28-44) |
| 64 | 1 | display | Input hero del Onboarding paso 1 (nombre) | **Excepción inline** · marcador editorial del input nombre |
| 96 | 1 | display | Hero numérico del paso espejo "Antes de soltarte" | **Excepción inline** · pieza visual hero del paso 8/9 |

Excepciones marcadas con `/* excepción · {razón corta} */`.

---

## Tabla 2 · fontSize clamp() responsive

| Valor original | Ocurrencias | Token destino |
|---|---|---|
| `clamp(24px, 3vw, 32px)` | 3 | `T.size.displayMd` (exacto) |
| `clamp(28px, 4vw, 44px)` | 1 | `T.size.displayLg` (exacto) |
| `clamp(40px, 6vw, 64px)` | 1 | `T.size.displayXxl` (exacto) |
| `clamp(34px, 5vw, 52px)` | 2 | `T.size.displayXl` (exacto) |
| `clamp(30px, 3.4vw, 44px)` | 5 | `T.size.displayLg` (cercano, max 44 igual) |
| `clamp(28px, 3.4vw, 44px)` | 1 | `T.size.displayLg` |
| `clamp(32px, 5.5vw, 44px)` | 1 | `T.size.displayLg` |
| `clamp(28px, 5vw, 40px)` | 2 | `T.size.displayLg` (cercano) |
| `clamp(28px, 5.5vw, 40px)` | 1 | `T.size.displayLg` |
| `clamp(22px, 4vw, 30px)` | 4 | `T.size.displayMd` (cercano) |
| `clamp(22px, 3vw, 28px)` | 1 | `T.size.displayMd` |
| `clamp(24px, 4.4vw, 32px)` | 1 | `T.size.displayMd` (exacto en max) |
| `clamp(24px, 3.6vw, 32px)` | 1 | `T.size.displayMd` |
| `clamp(38px, 7vw, 56px)` | 2 | `T.size.displayXl` (cercano, error ~10%) |
| `clamp(16px, 3.4vw, 22px)` | 3 | `T.size.subtitle` (22 fijo en max) |
| `clamp(16px, 4vw, 22px)` | 1 | `T.size.subtitle` |
| `clamp(18px, 2.6vw, 22px)` | 1 | `T.size.subtitle` |
| `clamp(17px, 2.4vw, 20px)` | 1 | `T.size.lead` (17 fijo) |
| `clamp(15px, 2vw, 17px)` | 1 | `T.size.lead` |
| `clamp(19px, 2.2vw, 23px)` | 1 | `T.size.subtitle` (cercano) |

**Total mapeado: 33 / 33**. Cero excepciones (todos los rangos encajan en algún display token con error <15%).

---

## Tabla 3 · lineHeight

| Valor | Ocurrencias | Token destino |
|---|---|---|
| 0.95 | 1 | `T.lh.tight` (1.15) |
| 1 | 16 | **Excepción funcional** · cifras display de KPIs hero, botones de icono (×, +/-), badges centrados |
| 1.05 | 2 | `T.lh.tight` |
| 1.1 | 13 | `T.lh.tight` |
| 1.15 | 10 | `T.lh.tight` (exacto) |
| 1.2 | 10 | `T.lh.snug` (1.3) |
| 1.3 | 2 | `T.lh.snug` (exacto) |
| 1.35 | 1 | `T.lh.snug` |
| 1.4 | 12 | `T.lh.snug` |
| 1.5 | 60 | `T.lh.normal` (exacto) |
| 1.55 | 59 | `T.lh.normal` (cercano) |
| 1.6 | 11 | `T.lh.relaxed` (exacto) |
| 1.65 | 3 | `T.lh.relaxed` |
| 1.7 | 2 | `T.lh.relaxed` |

**Total mapeado a tokens: 186 / 202**. Excepciones: 16 (`lineHeight: 1` funcional).

---

## Tabla 4 · letterSpacing

| Valor | Ocurrencias | Token destino |
|---|---|---|
| -0.03em | 1 | `T.tracking.display` (-0.02em) |
| -0.025em | 1 | `T.tracking.display` |
| -0.02em | 25 | `T.tracking.display` (exacto) |
| -0.015em | 1 | `T.tracking.tight` (-0.01em) |
| -0.01em | 70 | `T.tracking.tight` (exacto) |
| 0.04em | 12 | `T.tracking.wide` (0.08em) |
| 0.05em | 7 | `T.tracking.wide` |
| 0.06em | 4 | `T.tracking.wide` |
| 0.08em | 29 | `T.tracking.wide` (exacto) |
| 0.1em | 39 | `T.tracking.wider` (0.12em) |
| 0.12em | 50 | `T.tracking.wider` (exacto) |
| 0.14em | 37 | `T.tracking.widest` (0.16em) |
| 0.16em | 10 | `T.tracking.widest` (exacto) |
| 0.18em | 4 | `T.tracking.widest` |

**Total mapeado: 290 / 290**. Cero excepciones.

---

## Excepciones explícitas

### `fontSize` (2)

1. `mi_plan_v1_3_0.html:4546` — `fontSize: 64, /* excepción · hero del input "nombre" en Onboarding paso 1 */`
2. `mi_plan_v1_3_0.html:5255` — `fontSize: 96, /* excepción · hero numérico del paso espejo "Antes de soltarte" */`

### `lineHeight: 1` (16, funcionales)

Patrón idiomático en cifras display gigantes (KPIs hero) y botones de icono. El `lineHeight: 1` colapsa la altura del bloque al cap-height del número/icono, evitando hueco vertical innecesario. Mantenido inline sin comentario individual (patrón sistémico, documentado aquí).

Ubicaciones:
- `2181` — Concept tooltip number badge.
- `2702`, `4316`, `5736`, `7529`, `9507` — botones de icono (×, +/-) y rellenar.
- `2801`, `9420` (h3 article) — botones inline.
- `3419` — `MonteCarloCard` % éxito hero.
- `4170` — Landing pre-onboarding hero "Mi *Plan* FIRE".
- `6093`, `6102` — KPIs destilados del Movimiento 1.B en Mi Plan.
- `6216`, `6264` — `KpiCard` hero number + KPI Verdad 1.
- `6341`, `6721` — cifra "siguiente hito" y `Stat` hero.
- `9558` — landing principal h1.

---

## Comparativa de inventario antes/después

| Métrica | v1.2.1 | v1.3.0 | Δ |
|---|---|---|---|
| Valores únicos de `fontSize` (numérico) | 20 | 0 literales (2 excepciones) | -100% (-90% si cuentas excepciones) |
| Valores únicos de `fontSize` (clamp) | 20 | 0 literales | -100% |
| Valores únicos de `lineHeight` | 14 | 1 literal (`1` funcional) | -93% |
| Valores únicos de `letterSpacing` | 14 | 0 literales | -100% |
| Ocurrencias tokenizadas | 0 | 1068 | — |

---

## Reglas de uso (resumen para sub-sprints futuros)

1. **Suelo tipográfico**: `11px` (`T.size.eyebrow`) sólo en `T.mono` uppercase. En serif/sans/display, mínimo `T.size.caption` (13).
2. **Familia recomendada por token**:
   - `eyebrow` (11) → `T.mono`, `textTransform: uppercase`.
   - `caption` (13), `body` (15), `lead` (17) → `T.serif` o `T.sans`.
   - `subtitle` (22) → `T.display` o `T.serif` (cifras y subtítulos).
   - `displayMd/Lg/Xl/Xxl` → `T.display` (headers y hero numbers).
3. **lineHeight**: si no hay razón clara, `T.lh.normal` (1.5). Para títulos display, `T.lh.tight` (1.15). Para prosa larga, `T.lh.relaxed` (1.6).
4. **letterSpacing**: para display siempre `T.tracking.display` (-0.02em). Para mono uppercase, `T.tracking.wider` o `widest`. Para body normal, sin letterSpacing (default `0`).
5. **clamp()**: no introducir nuevos clamp. Si hace falta uno responsivo, mapear a uno de los 4 display tokens o crear uno nuevo en `T.size`.
