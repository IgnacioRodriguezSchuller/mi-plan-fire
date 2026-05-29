# CHANGELOG mi_plan_v5_11.html

Derivado de `mi_plan_v5_10.html`. Una línea por cambio significativo.

## Sprint v1.0 · Sub-prompt F · Onboarding pulido + Aprende por niveles

### F1 · Onboarding pulido

**F1.1 · Aporte porcentual vs fijo · micro-explicación inline + preview**
- En el step 5 ("¿Cuánto de eso puedes guardar?") añadidos dos elementos antes de los inputs:
  1. Bloque inline (visible, no tooltip) que define **Fijo** vs **Porcentual** con ejemplos.
  2. Preview en vivo: cuando hay ingreso definido, muestra *"Con tu salario actual de X €/mes, esto serían Y €/mes de aporte (Z% de tu neto / cantidad fija)."* Se actualiza al cambiar el modo o el valor.

**F1.2 · Neto destacado**
- Step 4 ("¿cuánto ganas al mes?") ahora incluye:
  - Badge inline `NETO` con `background: T.accent`, color blanco, mono uppercase, 11px.
  - Párrafo aclaratorio en serif italic: *"introduce tu salario **neto** (lo que efectivamente recibes en cuenta cada mes después de IRPF y Seguridad Social), no el bruto. Si pones bruto, el plan estará distorsionado."*
  - Ejemplo en serif italic faint: *"Ejemplo: si tu bruto es 35.000 €/año y el neto que ingresas son 24.000 €/año, divide 24.000/12 = **2.000 € mensuales** netos."*

**F1.3 · "/mes" visible**
- Auditados todos los inputs mensuales del onboarding (steps 4, 5 percent, 5 fixed): ya tienen `€ / mes` o `% / mes` como sufijo grande del input. Confirmado sin cambios.

**F1.4 · Tope explanation**
- En el step 6 ("¿Tu salario evoluciona?") modo Escalonado, añadida una micro-explicación inline con borde superior `1px dashed`: *"**Tope**: el salario máximo al que esperas llegar en tu carrera. La progresión sube desde tu salario actual hasta este tope a lo largo de los años. Si dejas el mismo valor que tu salario actual, no habrá progresión."*

**F1.5 · Variable configurable inline**
- Eliminado el placeholder *"Crearemos un solo tramo... podrás añadir tramos a medida en Ajustes"*.
- Nuevo configurador inline: hasta 4 tramos directos desde el onboarding. Primer tramo es "Salario inicial" (sin fecha de inicio porque es t=0). Tramos 2-4 con campo "Empieza a los N meses" + botón `× quitar`. Botón `+ Añadir tramo` (dashed accent) limitado a 4 max. Pie con micro-texto explicando que se puede ampliar luego en Ajustes.
- Estado nuevo `data.variableSegments` (inicializado a `null`) que captura `[{ amount, fromMonth }, ...]`.
- `livePlan` y `finish()` extendidos para generar los `incomeSegments` desde `data.variableSegments` cuando `evolution === 'variable'` y la lista no está vacía. Mantienen el comportamiento por defecto (single open tramo en `data.income`) cuando no hay segmentos.

**F1.6 · Paso 8 simplificado**
- El paso 8 (espejo "Antes de soltarte") mantiene las dos verdades calculadas (erosión salarial + coste de oportunidad).
- Eliminado el bloque CTA `Descubre más sobre tu situación actual →` que abría el mini-onboarding secundario.
- Sustituido por una nota italic muted: *"Más adelante, dentro de Mi Plan, podrás abrir el bloque '¿Y si no tuviera plan?' y, desde allí, profundizar con tus gastos reales, hipoteca y dónde está tu dinero hoy."*
- Eliminado el state `showActualLifeModal` y el bloque `<ActualLifeOnboarding ...>` del onboarding principal (esa entrada de UX vive ahora dentro del desplegable Sin Mi Plan de Mi Plan → CTA "Profundizar (Pro)").
- El paso 9 (recap) se mantiene intacto.

### F2 · Aprende reorganizada por niveles

**F2.1 · Estructura por niveles**
- Nuevo mapping `LEARN_LEVELS` con tres claves: `esencial` (12 conceptos), `profundizando` (13), `avanzado` (10).
- Helpers `LEARN_LEVEL_LABELS` (UI label) y `LEARN_LEVEL_SUB` (subtítulo descriptivo).
- Inverse lookup `LEARN_LEVEL_BY_ID` (id → nivel) precomputado al cargar el módulo.
- Cualquier id no mapeado cae en `avanzado` por defecto.

**F2.2 · Vista por tarjetas**
- En el tab Conceptos (renombrado desde "Artículos"), cada concept se renderiza como tarjeta con:
  - Icono SVG (esquina superior izquierda) + tag de nivel (esquina superior derecha, mono 8px uppercase).
  - Título display 20px.
  - Descripción 1 línea en serif 13 muted.
  - Hover: borde accent + `transform: translateY(-1px)`.
- Grid responsive con `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))` (≈3/2/1 columnas según ancho).
- Las tarjetas surgen de **todos los ids de LEARN_CORPUS**, no solo los que tienen `article` completo (antes la sub-sección Artículos filtraba solo los que tenían artículo; ahora todos son navegables).

**F2.3 · Filtro por nivel**
- Cuatro tabs al inicio de Conceptos: `Esencial` (default), `Profundizando`, `Avanzado`, `Todos`.
- Subtítulo italic-muted cambia según el nivel ("Para quien empieza" / "Para quien ya entiende lo básico" / "Para optimización").
- En modo Todos no se muestra subtítulo.
- Nav primaria de Aprende reordenada: ahora `Conceptos` (default) / El Tablón / Glosario. Tablón y Glosario se mantienen intactos.

**F2.4 · Lección individual sin cambios**
- Click en tarjeta abre `ConceptModal` exactamente como antes. Comportamiento del modal preservado.

**F2.5 · Iconos SVG**
- Nuevo componente `<LearnIcon id size color />` con 12 iconos SVG inline trazados a mano para los Esencial: interes-compuesto (curva exponencial + punto), retorno-anual (flecha hacia arriba), inflacion (monedas decrecientes), volatilidad (ola), riesgo-incertidumbre (interrogante en círculo), patrimonio (bóveda con barras), horizonte (reloj de arena), aporte-mensual (calendario con flecha de entrada), asset-allocation (3 barras verticales de distinta altura), fondos-indexados (líneas de índice), comisiones (signo % grande), diversificacion (3 círculos solapados).
- Trazo único `stroke: T.ink` con grosor 1.6, viewBox 36×36, escalable vía prop `size`.
- Para los conceptos sin icono dedicado (Profundizando y Avanzado), fallback `LearnIconFallback`: rombo abstracto. Los 23 conceptos restantes pueden recibir su icono propio en v1.x.

## Verificación · Playwright + Chromium headless
- Onboarding: badge `NETO` visible, explicación neto vs bruto, ejemplo 24.000 €/año. ✓
- Step 5: explicación inline Fijo/Porcentual y preview "Con tu salario actual…". ✓
- Step 6 Escalonado: explicación inline de Tope. ✓
- Step 6 Variable: configurador inline con campos `Salario inicial` + botón `+ Añadir tramo`. ✓
- Step 8: muestra Verdad 1 y 2 sin CTA de mini-onboarding. ✓
- Aprende: tab `Conceptos` por defecto, 4 sub-tabs de nivel, sub-label "Para quien empieza" visible. ✓
- Avanzado tab: lista incluye `IRPF / Modelo 720 / Rebalanceo`. ✓
- Click en tarjeta abre `ConceptModal` (verificado con "interés compuesto"). ✓
- Cero `pageerror`, cero errores de consola. Babel emite el warning informativo de "deoptimised styling" por tamaño del archivo (no es error).

## No tocado
- `CLAUDE_CODE_CONTEXTO.md`: corresponde al sub-prompt G.
- `LEARN_CORPUS` (contenido editorial de cada concept): intacto. Sólo se añade el mapping externo `LEARN_LEVELS` por id.
- `ConceptModal`, `OnboardingHelp`, `projectV2`, `runMonteCarlo`, IDs internos, claves de localStorage: intactos.
- Iconos para los 23 conceptos de Profundizando y Avanzado: usan fallback (rombo abstracto). Generar los 23 restantes a mano excedería el alcance razonable de este sub-prompt; documentado para v1.x. La sección Aprende es funcional con el set actual.
