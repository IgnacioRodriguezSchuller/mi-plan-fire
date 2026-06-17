# Auditoría integral · Mi Plan FIRE — Índice

> **Qué es esto.** Diagnóstico de 6 ejes de la app (`app/src`), pensado para que **otro Claude lo lea en frío** y pueda actuar. Cada eje tiene su propio doc con **hallazgos** (evidencia objetiva). Mi opinión priorizada vive aparte en `ROADMAP_Y_RECOMENDACIONES.md`, para que la **contrastes** con lo que te diga Claude en chat.
>
> _Fecha: 2026-06-16 · Versión auditada: v1.5.0a3 · Estado del demo durante la auditoría: **sucio** (ver nota abajo)._

## Cómo está organizado
| Archivo | Contenido |
|---|---|
| `01_ESTILO_Y_DISENO.md` | Coherencia visual, tokens, tipografía, primitivas, dark-mode. |
| `02_FUNCIONES_Y_HERRAMIENTAS.md` | Inventario de controles, código muerto, paridad Cartel↔legacy, robustez. |
| `03_CONTENIDO.md` | Copy, voz editorial, Aprende (corpus/niveles/glosario), disclaimers, vocabulario monetario. |
| `04_CONECTIVIDAD.md` | Grafo de navegación, CTAs, dead-ends, redundancias, fuente de edición de cada dato. |
| `05_STORYTELLING.md` | Arco narrativo y la **contradicción de veredictos** (causa raíz). |
| `06_GUIADO_UX.md` | NextStep, onboarding, ruta de fases, estados vacíos, densidad. |
| `ROADMAP_Y_RECOMENDACIONES.md` | **Aparte.** Mi plan priorizado P0→P3 + prompts listos para pegar. Para contrastar. |

## Método (todo READ-ONLY, no se tocó la app)
1. **Paseo visual** por las 5 pantallas y los 7 spreads del Cartel (desktop + chequeo dark-mode de inputs).
2. **3 auditorías de código** en paralelo (estilo+contenido / funciones+conectividad / storytelling+guiado).
3. **Verificación cruzada**: cada afirmación clave contrastada con el código real. Las referencias van **por nombre de símbolo / string**, nunca por número de línea (el código diverge del baseline).

> ⚠️ **Nota de estado del demo.** Durante la auditoría el `localStorage` tenía datos **alterados por pruebas previas** (ahorro 40 % vs **18 %** canónico; 2º tramo de salario cerrado en may-2030 vs `to:null` canónico). Por eso se vieron «0 €/mes» en *Sin mi plan* y un 40 % de ahorro: son **artefactos del estado**, no defectos. Antes de juzgar cifras exactas: **Datos → Cargar datos demo**. La contradicción de veredictos (ST1) y el resto de hallazgos estructurales son **independientes** del estado del demo (confirmados en código).

## Mapa de la app (5 pestañas + flujos previos)
```
LandingPreOnboarding → Landing → Onboarding → ┌─────────────────────────────────────────┐
                                              │  Shell (header + nav 5 tabs + footer)   │
                                              ├─────────────────────────────────────────┤
  tab id  · label nav · componente           │  hoy   · "Plan"        · ScreenHoy        │
                                              │  proy  · "Proyección"  · ScreenProyeccion │ (Cartel)
                                              │  segui.· "Seguimiento" · ScreenSeguimiento│
                                              │  aprend· "Aprende"     · ScreenAprende    │
                                              │  ajuste· "Datos"       · ScreenAjustes    │
                                              └─────────────────────────────────────────┘
Modales/overlays: SinMiPlanModal · GastoSheet · ConceptModal · AboutModal · WhyDifferentModal · ActualLifeOnboarding
```
Nota IA: el **id** de tab no coincide con su **label** (`hoy`→"Plan", `ajustes`→"Datos"). Y "Proyección" es a la vez **relato** y **superficie de edición** del plan; "Datos" quedó como perfil+administración.

## Resumen ejecutivo
La app tiene **una base de producto fuerte** (motor de proyección honesto, voz editorial sobria, Cartel editorial precioso, local-first). Los problemas no son de "falta features" sino de **coherencia entre piezas**: dos sistemas de diseño conviviendo, y —más grave— **la app no tiene una única definición de "¿voy bien?"**, así que se contradice a sí misma en la misma sesión.

### Puntuación por eje (subjetiva, 1–5)
| Eje | Nota | Titular |
|---|:--:|---|
| 1 · Estilo y diseño | **3/5** | Cartel excelente, pero conviven 2 dialectos (serif editorial vs mono-caja). |
| 2 · Funciones | **3.5/5** | Muy completa; pero hay capacidades escondidas/muertas y edición fragmentada. |
| 3 · Contenido | **3.5/5** | Voz sólida; tensiones de vocabulario («€ de hoy») y huecos niveles↔corpus. |
| 4 · Conectividad | **3.5/5** | Buenos cross-refs; redundancias de landing y un dato no re-editable. |
| 5 · Storytelling | **2.5/5** | Gran relato por pantalla, roto por la **contradicción de veredictos (P0)**. |
| 6 · Guiado UX | **2.5/5** | Hay andamiaje (NextStep/fases), pero guía contradictoria y pantallas densas. |

### Recuento de hallazgos
- **P0 (bloqueante de confianza): 1** → `ST1` (contradicción de veredictos), con su cara UX `GX1`.
- **P1 (importante): 6** → `ED1`, `FN1`, `CO1`, `CN1`, `ST2`, `GX2`.
- **P2 (relevante): ~22** · **P3 (pulido): ~8**.

## Los 5 temas transversales
1. **Dos sistemas de diseño** (Cartel serif vs legacy mono-caja). → `ED1`. Es el pendiente **ESTADO #10 (Cartel Fase 2)**.
2. **No hay fuente única de "¿voy bien?"** → `ST1`/`GX1`. Tres señales (`destinoEstado`, `avgActual≥currentAporte`, `realVsPlanDelta`) dan veredictos opuestos. Unificable con `ageAtFiReal` vs `ageAtFiPlan` (ya existen).
3. **Superficies de edición fragmentadas/escondidas** (asignación de activos no re-editable; gastos por dos vías). → `FN1`/`FN2`/`CN1`.
4. **Código muerto y entradas redundantes** (Legacy, `WhatIfCard`, 2 landings). → `FN3`/`FN4` + `CN2`/`CN3`.
5. **Tensiones de vocabulario** («€ de hoy», nombres del destino, «tu número»). → `CO1`/`CO4` + `ST3`/`ST4`.

## Leyenda de severidad
| | Significado | Criterio |
|---|---|---|
| **P0** | Rompe la confianza en el producto | El usuario recibe información contradictoria/errónea sobre su plan. |
| **P1** | Importante | Daña coherencia, descubribilidad o una capacidad central; no es un bug duro. |
| **P2** | Relevante | Fricción, redundancia o deuda visible; impacto acotado. |
| **P3** | Pulido | Consistencia fina, documentación, limpieza. |

## Invariantes (toda recomendación los respeta)
No tocar firmas de `projectV2`/`runMonteCarlo` (solo añadidos opcionales) · `migrateToV2` intacto · defaults de campos nuevos **en lectura** · sin renombrar claves de `localStorage` ni campos persistidos · `LEARN_CORPUS` cerrado · **color solo por tokens `T.*`** · inputs con `appearance:none` · cero red/deps · baseline `mi_plan_v1_5_0a_3.html` congelado · commits sin coautoría · referenciar por **nombre**, no por línea.

## Convención de IDs
`ED`=Estilo/Diseño · `FN`=Funciones · `CO`=Contenido · `CN`=Conectividad · `ST`=Storytelling · `GX`=Guiado UX. El roadmap referencia estos IDs.
