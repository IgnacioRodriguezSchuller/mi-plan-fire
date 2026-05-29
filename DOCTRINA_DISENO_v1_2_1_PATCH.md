# DOCTRINA_DISENO.md · Patch v1.2 → v1.2.1

Generado por SP-03 (v1.4.0b). Cinco ediciones a aplicar en el documento maestro `DOCTRINA_DISENO.md`. Cada bloque contiene la cadena exacta del ANTES (para localizar) y la cadena exacta del DESPUÉS (para sustituir).

Justificación: la auditoría de SP-03 identificó que `T.amber` se usaba legítimamente en la cifra "intereses totales de hipoteca" pero la doctrina §2 y §3 no lo contemplaban como cuarta opción válida. Esta versión patch reconoce el uso y documenta su criterio (coste contratado / atención sin alarma).

---

## D.1 · Cabecera (líneas 1-7 aprox)

ANTES:
> **Versión:** 1.2 · Mayo 2026 · Destilada en chat de planificación tras el cierre de v1.4.0a · Atemperada (Ruta B) y paleta P3 de inputs tras validación visual del autor.

DESPUÉS:
> **Versión:** 1.2.1 · Mayo 2026 · Destilada en chat de planificación tras el cierre de v1.4.0a · Atemperada (Ruta B), paleta P3 de inputs, y T.amber añadido como cuarta opción válida para cifras hero (patch v1.2.1).

---

## D.2 · §2 "Scope bloque · cifras" — entrada "KPI hero"

Localizar la frase que enumera los colores semánticos:

ANTES:
> Color semántico cuando aplica: `T.ink` (descriptivo, p.ej. patrimonio), `T.green` (ganancia, valor #3B6D11 ligeramente aclarado para legibilidad), `T.red` (pérdida). Sufijo de unidad: `T.display`, 22, `color: T.muted`.

DESPUÉS:
> Color semántico cuando aplica: `T.ink` (descriptivo, p.ej. patrimonio, edad de libertad financiera, target de hito), `T.green` (ganancia, valor #3B6D11 ligeramente aclarado para legibilidad), `T.red` (pérdida inesperada, riesgo, o coste teórico del framing "lo que pierdes si no actúas"), `T.amber` (coste contratado o asumido que merece atención visual sin alarma, p.ej. intereses totales de hipoteca, comisiones acumuladas significativas). Sufijo de unidad: `T.display`, 22, `color: T.muted`.

---

## D.3 · §3 antipatrón A9 — actualizar para mencionar T.amber

ANTES:
> **A9 · KPI destilado en color sin razón semántica.** Las cifras descriptivas (patrimonio, ingresos, tasa de ahorro) son `T.ink`. El color (verde, rojo, accent) se reserva para cifras donde la pérdida o ganancia es el mensaje, o para énfasis inline declarado.

DESPUÉS:
> **A9 · KPI destilado en color sin razón semántica.** Las cifras descriptivas (patrimonio, ingresos, tasa de ahorro, edades, targets) son `T.ink`. El color (verde, rojo, amber, accent) se reserva para cifras donde la ganancia, pérdida o coste de atención es el mensaje, o para énfasis inline declarado. Accent en cifras hero/destilado nunca: es color de marca y de énfasis inline, no de cifra principal.

---

## D.4 · §6 Revisiones — añadir nueva fila al final de la tabla

Insertar como última fila:

```
| 2026-05 | 1.2.1 | **T.amber añadido como cuarta opción válida para cifras hero.** Reservado a costes contratados que merecen atención visual sin alarma (intereses hipoteca, comisiones acumuladas). Detectado en audit SP-03 de v1.4.0b: la cifra "intereses totales de hipoteca" no encajaba en green/red/ink — es coste planificado, no pérdida inesperada (T.red exagera) ni descripción neutra (T.ink la invisibiliza). Amber es la gradación intermedia ya usada en otras superficies del producto (callout Warning). A9 actualizado en coherencia. | Cerrar el audit de cifras de v1.4.0b sin dejar una excepción no documentada. |
```

---

## D.5 · Tabla "Mapping rápido elemento → tokens" — actualizar fila "KPI hero"

ANTES:
```
| KPI hero | display | T.size.displayLg | T.ink/green/red | color solo si pérdida/ganancia es mensaje, siempre fondo claro |
```

DESPUÉS:
```
| KPI hero | display | T.size.displayLg | T.ink/green/red/amber | color solo si pérdida/ganancia/coste es mensaje, siempre fondo claro |
```

---

## Resumen de cambios

| Edición | Sección | Cambio principal |
|---|---|---|
| D.1 | Cabecera | Versión bump 1.2 → 1.2.1, nota de patch |
| D.2 | §2 KPI hero | Enumera `T.amber` como cuarta opción semántica |
| D.3 | §3 A9 | Antipatrón actualizado: incluye amber + clarifica accent prohibido |
| D.4 | §6 Revisiones | Nueva fila histórica explicando el patch |
| D.5 | Mapping rápido | Token list "ink/green/red/amber" en lugar de "ink/green/red" |
