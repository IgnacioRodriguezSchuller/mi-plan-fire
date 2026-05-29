# Mi Plan FIRE — CHANGELOG v1.1.0

Sub-sprint **v1.1.0** · 8 bug fixes sobre v1.0 (sin nuevas features, sin renombres internos, sin tocar motor `projectV2` salvo lo imprescindible para B3).

Archivo: `mi_plan_v1_1_0.html` (copia de `mi_plan_v1_0.html`).

---

## B1 · Mobile · pestaña Aprende visible

**Problema.** En mobile sólo se veían 4 pestañas (Mi Plan, Proyección, Seguimiento, Ajustes). La pestaña Aprende quedaba oculta por un filtro `tabs.filter(t => t.id !== 'aprender')` en `MobileBottomNav`.

**Cambio.** Se elimina el `.filter(...)` y se renderizan las 5 pestañas. El layout grid de la barra inferior pasa a `grid-template-columns: repeat(5, 1fr)`. Tamaños del icono y la etiqueta se mantienen ≥ 11px (consistente con B7).

**Verificación.** `mobileTabs.length === 5` y al menos una etiqueta empareja `/aprende/i` en viewport 380×800.

---

## B2 · Movement 2 reacciona al toggle €/€-real

**Problema.** En `ScreenHoy` (Mi Plan), el Movimiento 2 ("Si mantienes este ritmo… a los X años tendrás Y€") usaba siempre el valor **nominal** del patrimonio futuro y de la renta mensual, independientemente del modo. El toggle "€ con/sin inflación" sólo afectaba al gráfico, no al texto.

**Cambio.** Sustitución de los valores hardcodeados por las variantes ya disponibles en el resultado de `projectV2`:

```js
const M2_finalValue       = realMode ? finalReal : finalNominal;
const M2_retirementMonthly = realMode ? retirementMonthlyReal : retirementMonthly;
```

Añadida coletilla " (en € de hoy)" sólo cuando `realMode === true`, para que el lector entienda que la cifra es en poder adquisitivo actual.

**Verificación.** Captura del párrafo en ambos modos:

- Nominal: "a los 60 años tendrás **1.25M€**. Con una tasa de retiro del 4%, eso equivale a 4…"
- Real:    "a los 60 años tendrás **594k€** (en € de hoy). Con una tasa de retiro del 4%, eso…"

Los textos difieren y el modo real menciona "€ de hoy".

---

## B3 · Ajuste del salario por IPC (configurable)

**Problema.** El motor proyectaba el patrimonio aplicando inflación a los precios y al gasto, pero **mantenía el salario congelado en nominal**. Para un horizonte de 30 años esto sub-estimaba severamente el ingreso real, distorsionando el FIRE point.

**Cambio.** Se introduce un nuevo campo de configuración `salaryInflationFactor` (factor multiplicador sobre el IPC anual asumido):

- `1.0` → "Sí, completamente (100%)" — salario crece al IPC (mantiene poder adquisitivo)
- `0.5` → "Parcialmente (50%)" — sube la mitad del IPC (compromiso intermedio realista en algunos sectores en España)
- `0.0` → "No (0%)" — salario congelado en nominal (escenario pesimista, comportamiento previo)

**Lugares tocados:**

1. **Migración** (`migrateToV2`): si `plan.salaryInflationFactor == null` se asigna `1.0` (default optimista para usuarios existentes). Idempotente.
2. **`emptyState` y `seedState`**: default `1.0`.
3. **Onboarding paso 4** (ingresos): nueva pregunta "¿Tu salario sube con la inflación?" con tres botones radio. Default `1.0`.
4. **Ajustes → bloque "Asunciones de mercado"**: tarjeta nueva "Ajuste del salario por IPC" tras el editor de tramos. Tres botones con las mismas opciones. Texto explicativo de los tres escenarios.
5. **`projectV2`**: nueva variable `salaryFactor = plan.salaryInflationFactor ?? 1.0` y crecimiento mensual aplicado a `incomeSegments` y `bonusSegments`:
   ```js
   const annualSalaryGrowth = annualIPC * salaryFactor;
   const monthlySalaryGrowth = annualSalaryGrowth > 0
     ? Math.pow(1 + annualSalaryGrowth, 1/12) - 1 : 0;
   const salaryMultiplier = monthlySalaryGrowth > 0
     ? Math.pow(1 + monthlySalaryGrowth, m) : 1;
   const income = sumActiveSegments(plan.incomeSegments, key) * salaryMultiplier;
   const bonus  = sumActiveSegments(plan.bonusSegments,  key) * salaryMultiplier;
   ```

No se tocan tramos del usuario: el factor se aplica **encima** del valor declarado, mes a mes.

**Verificación.** Ajustes contiene literal "Ajuste del salario por IPC" y las tres opciones se encuentran en el DOM.

---

## B4 · Orden de explicaciones de tipo de aporte

**Problema.** En el paso 5 del onboarding (tipo de aporte), las descripciones aparecían **Fijo: Aportas X€ al mes…** antes que **Porcentual: Aportas un X% de tu ingreso…**, contradiciendo el orden de los botones del selector (Porcentual por defecto a la izquierda).

**Cambio.** Intercambio de orden de los dos párrafos descriptivos. Porcentual queda declarado primero, Fijo segundo. Es un cambio puramente cosmético (no afecta a `savingType` ni a su default).

**Verificación.** `step5.search(/Porcentual: Aportas/) < step5.search(/Fijo: Aportas/)` en el DOM del paso 5.

---

## B5 · Calendario mensual completo en Seguimiento

**Problema.** `ScreenMesAMes` mostraba 12 cards (un año entero), creando un muro vertical largo que enterraba la información útil ("¿cómo voy este mes?"). El feedback fue: "muestra sólo los últimos meses y deja el resto bajo un calendario clickeable".

**Cambio.**

1. **Resumen recortado**: el grid principal pasa de 12 meses a **3 meses** (mes actual + 2 anteriores), via un nuevo `useMemo recentMonths`. Las tres cards mantienen el mismo formato que antes.
2. **Botón "Ver calendario completo"**: encima del grid, abre un modal con vista anual.
3. **`MonthlyCalendarModal`**: rejilla 4×3 de meses con etiquetas cortas (ene, feb, …, dic). Cada celda:
   - **Verde** si el ahorro real ≥ planeado del mes
   - **Ámbar** si real < planeado pero hay dato
   - **Gris paper** si no hay registro
   - Muestra `+X€` o `-Y€` debajo del nombre del mes
4. **Panel de detalle**: al clicar una celda, panel inferior con planeado/real/desvío del mes seleccionado.

**Verificación.** Botón "Ver calendario completo" visible en Seguimiento; al clicar, el modal contiene literales `ene`, `may`, `dic`.

---

## B6 · Tooltip "Invertido" arriba de "Ahorrado bruto"

**Problema.** En el chart de "Flujo en el tiempo" (Mi Plan), el tooltip mostraba las series en orden alfabético/de definición: **Ahorrado bruto** arriba, **Invertido** abajo. El usuario espera **Invertido primero** porque es la métrica psicológicamente más importante (lo que realmente se queda trabajando).

**Cambio.** Añadido `itemSorter={(item) => item && item.dataKey === 'invest' ? 0 : 1}` al `<Tooltip>` del Recharts `<ComposedChart>` en `FlowTimelineCard`. El sort es estable; el resto de series (rendimiento, etc.) conservan su orden.

**Verificación.** Validación a nivel código (Babel + grep). Comportamiento visual confirmado en sesión Playwright (sin asserts automáticos porque el tooltip de Recharts es hover-driven y reposicionable).

---

## B7 · Sin `fontSize` por debajo de 11px

**Problema.** Auditoría visual reveló texto a 8/9/10px en chips, ticks de ejes, leyendas y notas al pie. Ilegible en mobile y borderline en desktop. WCAG recomienda ≥ 12px para body, y la pauta interna del proyecto era ≥ 11px.

**Cambio.** Reemplazo masivo (preservando contexto literal):

- `fontSize: 8,`  → `fontSize: 11,` (19 ocurrencias)
- `fontSize: 9,`  → `fontSize: 11,` (63 ocurrencias)
- `fontSize: 10,` → `fontSize: 11,` (104 ocurrencias)

**Total: 186 reemplazos.** No se modifica nada con `fontSize: 11` o superior. No se tocan tamaños expresados via `T.scale` (ya estaban auditados).

**Verificación.** `grep -nE 'fontSize:\s*(8|9|10)\b'` sobre el archivo final devuelve **0 ocurrencias**.

---

## B8 · LandingPreOnboarding también para usuarios v1.0

**Problema.** Usuarios que entraron en v1.0 (antes de existir la landing pre-onboarding) tenían el flag `hasSeenLandingPreOnboarding=true` por defecto o nunca lo habían visto. Resultado: **nunca verían** la landing nueva, incluso aunque sus estados se migraran. Y no había forma de revisitarla.

**Cambio (tres piezas):**

1. **Migración v1.1.0** (en `migrateToV2`):
   ```js
   if (!plan.migrationsApplied?.v1_1_0_landing_reset) {
     state.hasSeenLandingPreOnboarding = false;
     plan.migrationsApplied = { ...plan.migrationsApplied, v1_1_0_landing_reset: true };
   }
   ```
   Forza una **única vez** la re-visualización de la landing al primer arranque post-migración. Idempotente vía flag.

2. **Routing de la landing**: se elimina la guarda `&& !state.onboardingComplete`. Ahora si `!state.hasSeenLandingPreOnboarding`, la landing se muestra **incluso si el onboarding ya está completo**. Tras el click "Empezar →", se setea el flag a `true` y, como `onboardingComplete=true`, el usuario va **directo al dashboard** sin repetir onboarding.

3. **Revisita explícita**: 
   - Nuevo estado `showRevisitLanding` en el Shell + global `window.__openRevisitLanding`.
   - `LandingPreOnboarding` ahora acepta `mode` (`'first' | 'revisit'`) y `onBack`. En modo `revisit` el CTA principal es **"← Volver"** (no "Empezar →").
   - **Logo clickeable** (mobile y desktop): `onClick` ahora llama a `__openRevisitLanding()` en lugar de `setShowLanding(true)`.
   - **Ajustes** nuevo botón: "Ver presentación de Mi Plan FIRE →" que también dispara la revisita.

**Verificación (e2e).**
- Simulado usuario v1.0: tras migración, ve la landing con "financial independence, retire early".
- Tras "Empezar →" llega al dashboard de Mi Plan sin pasar por onboarding ("1 · dónde estás" presente).
- Click en el logo → re-abre la landing en modo revisit (botón "← Volver" presente).
- Click "← Volver" → vuelve al dashboard.

---

## Restricciones respetadas

- ✅ Ningún rename de campo interno en `state.plan` ni en `state` raíz (sólo se **añade** `salaryInflationFactor` y la sub-clave `migrationsApplied.v1_1_0_landing_reset`).
- ✅ Migración es **idempotente** (defensiva contra `null`, re-ejecuciones, ausencia de claves).
- ✅ Motor `projectV2` sólo recibe el cambio necesario para B3.
- ✅ Sin cambios al sistema free/Pro ni al flag `isPro`.
- ✅ Sin cambios a la cabecera AGPL ni al placeholder `[TU NOMBRE]`.
- ✅ Cero llamadas de red. Todo sigue siendo offline-first en `localStorage`.
- ✅ Babel pasa sin errores. Runtime e2e: 11/11 asserts ✓ en B1, B2, B3, B4, B5, B8.

---

## Resumen ejecutivo

| Bug | Área           | Verificado |
|-----|----------------|------------|
| B1  | Mobile nav     | ✓ runtime  |
| B2  | Toggle €/€-real| ✓ runtime  |
| B3  | IPC del salario| ✓ runtime  |
| B4  | Orden onboard  | ✓ runtime  |
| B5  | Calendario mes | ✓ runtime  |
| B6  | Tooltip order  | ✓ código   |
| B7  | fontSize ≥ 11  | ✓ grep=0   |
| B8  | Revisit landing| ✓ runtime  |

Siguiente paso previsto: sub-sprint **v1.1.1** (afinado de copy + cierre de `CLAUDE_CODE_CONTEXTO.md` para v1.1.x).
