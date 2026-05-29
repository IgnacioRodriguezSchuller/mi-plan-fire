# CHANGELOG v1.4.0e · 2026-05

Cierre del paquete v1.4.0. Aplicación del Bloque 4 doctrinal (inputs P3) + limpieza de huérfanos + deudas residuales.

## Cambios

### P3 inputs y selects (Bloque 4 de doctrina v1.2.1)
- Añadido reset CSS global para `<input>`, `<select>`, `<textarea>` en el bloque `<style>` del `<head>`: `appearance: none` (cross-browser), `background-color: #faf3e4` (T.inputBg), `color: T.muted`, `border: 1px solid T.line`, `border-radius: 6px`, `box-shadow: inset 0 1px 2px rgba(26,22,18,0.04)`.
- Excepciones declaradas explícitamente:
  - `input[type="range"]` (sliders): `appearance: auto` para restaurar el thumb nativo + `background: transparent` + `border: none`.
  - `input[type="checkbox"]`: `appearance: auto` para mantener el cuadradito nativo con `accentColor: T.accent` inline.
- Focus state: borde T.accent + halo `0 0 0 2px rgba(194,65,12,0.15)`.
- **Modo oscuro macOS/iOS**: el reset elimina el fondo gris-negro heredado del sistema. Verificado vía Playwright con `colorScheme: 'dark'`: el 100% de inputs renderiza con fondo cream (combinación de `T.inputBg`, `T.bg`, o `transparent` heredando del padre cream — todos visualmente equivalentes).
- Comportamiento de cascada documentado: los inputs con `style="background: transparent"` (ej. input "Nombre" en Datos) mantienen su look subrayado-dashed porque el inline gana al CSS global. Los inputs con `style="background: T.bg"` (TramoListEditor `type="month"` y `type="number"`) renderizan en `#f5f0e6` (T.bg) — casi idéntico a `T.inputBg` (`#faf3e4`), diferencia indistinguible visualmente.

### Limpieza de funciones huérfanas
- Eliminada `function FinancialHealthCard({ plan, profile, d })` (150 líneas). Cero callers JSX. Huérfana tras el rediseño de Mi Plan en v1.1.1. Mismo patrón que `KpiCard` eliminada en SP-01 de v1.4.0b.
- Eliminada `function NextGoalCard({ goals, d, goTo })` (46 líneas). Cero callers JSX. Mismo motivo.
- `function HitosOverview`: ya estaba eliminada en BIG-A v1.4.0c. Verificado: 0 ocurrencias.
- Reemplazadas por comentarios marcadores de una línea con trazabilidad.

### Deuda SP-05.D cerrada
- Lead 1.A del Movimiento 1 en Mi Plan: reducido de 4 a 3 énfasis visibles. Cifra de "gastas {fmtEur(monthlyLife)}" desnegritada (quitada `<strong>`) para cumplir la cuota doctrinal ≤3 énfasis por párrafo (doctrina §2 "Scope bloque · prosa", regla 3/4).
- Justificación de la elección: la trinidad protagonista del párrafo es **patrimonio (accent) + ingreso (ink) + ahorro (green)** = "qué tienes / qué ganas / qué guardas". Los gastos son información contextual, no protagonistas — quedan en prosa normal sin perder legibilidad.
- Bonus: el strong de "Proyección" en la rama excluyente `else` (cuando no hay income) ahora explicita `fontStyle: 'normal'` por consistencia (las otras 3 negritas del párrafo lo tenían explícito, ese era residuo).

### Renombre prop confusa
- `function Stat({ accent, ... })` → `function Stat({ good, ... })`. La prop pintaba `T.green`, no `T.accent`. Renombrada para reflejar la semántica.
- Único caller actualizado: `<Stat label="Diferencia" value={...} accent={diff >= 0} bad={diff < 0} />` → `good={diff >= 0}`.

## Cierre del paquete v1.4.0

v1.4.0e es el último sprint del paquete v1.4.0. Resumen del paquete:

| Versión | Sprint | Foco |
|---|---|---|
| v1.4.0a | — | Limpieza Probador del free. |
| v1.4.0b | SP-01 a SP-07 | Aplicación doctrina visual v1.2.1 (shell editorial, callouts U1, A9 KPIs, charts conservadores). |
| v1.4.0c | BIG-A | Reasignación funcional pestañas (Ajustes → Datos · tramos/ahorro/eventos/asunciones → Proyección · hitos → Seguimiento). |
| v1.4.0d | BIG-B | Reorganización interna Proyección + Card Ingresos unificada (Salario base + Complementos) + fixes copy residuales. |
| **v1.4.0e** | **BIG-C** | **Inputs P3 + limpieza huérfanos (FinancialHealthCard, NextGoalCard) + deuda SP-05.D (lead 1.A) + Stat rename.** |

Próximo paquete: v1.5.0 (TBD — definir alcance en chat nuevo).

## Auditoría grep final

```
function FinancialHealthCard      → 0 ✓
function NextGoalCard             → 0 ✓
function HitosOverview            → 0 ✓ (eliminada en BIG-A)
<FinancialHealthCard              → 0 ✓
<NextGoalCard                     → 0 ✓
<HitosOverview                    → 0 ✓
accent={diff                      → 0 ✓
<Stat .* accent=                  → 0 ✓
<Stat .* good=                    → 1 ✓ (línea 6218, Diferencia)
<strong> visibles en lead 1.A    → 3 ✓ (patrimonio + ingreso + ahorro)
input/select/textarea reset CSS  → presente ✓ (líneas ~32-50 del <style>)
```

## Validación

- **Babel**: ✓ Sintaxis OK.
- **Runtime e2e** (Playwright + Chromium headless 1280×900 con `colorScheme: 'dark'`):
  - 5 pantallas (Plan, Proyección, Seguimiento, Aprende, Datos) cargan sin errores en consola.
  - Lead 1.A: 3 strong visibles confirmados con valores [`7.9k€`, `2.4k€/mes neto`, `432€`].
  - Inputs en modo oscuro: 100% renderizan con fondo cream (mezcla T.inputBg + T.bg + transparent heredando cream del padre). Cero inputs con fondo negro/gris del sistema.
  - HitosEditor en Seguimiento: input + select renderizan con borde cream + fondo cream.
  - ProgressionWizard: botón "Asistente progresión" disponible en Salario base.
- **Compatibilidad localStorage v1.4.0d → v1.4.0e**: state intacto, sin migraciones nuevas.

## Notas finales sobre el reset CSS

El reset es **defensa de futuro**: cualquier `<input>` añadido en sprints posteriores sin style inline tendrá automáticamente el look doctrinal cream + borde + radius + focus accent. Los inputs existentes con inline `background: T.bg` o `transparent` mantienen su look — el inline gana siempre.

La diferencia entre `T.bg` (`#f5f0e6`) y `T.inputBg` (`#faf3e4`) es de 5-7 unidades RGB — indistinguible visualmente. Si en un futuro se quiere unificar todo a `T.inputBg`, basta con buscar `background: T.bg` en estilos inline de inputs y reemplazar; el producto seguiría funcionando idéntico.
