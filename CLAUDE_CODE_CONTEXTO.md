# Mi Plan FIRE — Documento de contexto para Claude Code

> Documento de referencia para próximos prompts de implementación.
> Junio 2026. **Versión de la app: v1.5.0a3** (codebase modular `app/src/`, ver `ESTADO.md`).
>
> **Documento de diseño maestro: `DOCTRINA_DISENO.md`.** Toda decisión visual o de UX debe consultarse allí antes que aquí. Este documento (CONTEXTO) es la referencia editorial/técnica complementaria a `CLAUDE.md`; lo que ya está en `CLAUDE.md` (flujo de trabajo, invariantes, mapa de documentos) no se repite aquí.
>
> *(Adelgazado en junio 2026 — pendiente 8 de `ESTADO.md`: las secciones del flujo del monolito —estado funcional v1.1.1, validación Babel-in-browser, mapa de líneas del HTML, historias de sprint— se retiraron. La historia por versión vive en los `CHANGELOG_v*.md`; el registro actual es `CHANGELOG_v1_5_0a_3_src.md`.)*

---

## ¿Qué es Mi Plan FIRE?

Mi Plan FIRE es una herramienta web de planificación financiera personal a largo plazo orientada al perfil **FIRE-en-formación español** (no a principiantes generales, no a inversores avanzados).

Funciona enteramente en local: cero backend, todo el estado en `localStorage`. Sin cuenta, sin nube, sin perfilado. La promesa de privacidad es verificable: cualquiera puede abrir el HTML y leer el código.

**El código fuente vive en `app/src/`** (modular, build Vite single-file → `dist/index.html`, el lead magnet). El HTML monolítico `mi_plan_v1_5_0a_3.html` queda **congelado como red de regresión** — no se edita (hash `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`). Estructura por capas: `tokens/ lib/ hooks/ ui/ charts/ content/ modals/ flows/ state/ screens/`.

---

## Filosofía del producto

Mi Plan FIRE no es una calculadora. Es una herramienta de planificación **con criterio editorial explícito**. Las decisiones de diseño se subordinan a tres principios:

1. **Desvelar la realidad económica del individuo.** El producto existe para que el usuario vea lo que le está pasando con su dinero, no para que se sienta bien. Si el plan es frágil, el producto lo dice. Si la pensión pública es incierta, el producto lo dice.

2. **No esperar a que nos salven.** La mentalidad del usuario FIRE-en-formación es que ni el Estado, ni el mercado, ni la inflación van a "arreglarse solos". El plan se construye sobre la propia disciplina del usuario, no sobre asunciones externas optimistas.

3. **Camino B en regulación financiera.** Mi Plan FIRE educa sobre categorías de producto (fondos indexados, ETFs, planes de pensiones, robo-advisors) y menciona índices (MSCI World, S&P 500, etc.). **No** menciona gestoras, brokers, ni productos concretos por nombre comercial. **No** da recomendaciones personalizadas en el sentido del artículo 140 LMV / MiFID II.

Los cinco compromisos del manifiesto público (`WhyDifferentModal`): privacidad verificable, Camino B, no impone tipo FIRE, sin retención artificial, honesto cuando incomoda.

Cualquier cambio de UX o copy debe pasar estos filtros antes de implementarse.

---

## Tono y voz

- Español de España, tuteo cercano pero no amiguete.
- Frases breves. Una idea por párrafo cuando es prosa larga.
- Sin emojis salvo iconos ya en uso (✓, ?, ↗, ↘, ◇, ⌖, ◐, ◧, ◢, ✦, ◌, ●, ○).
- Sin marketing-speak. Sin "potencia tu futuro financiero". Sin "transforma tu vida".
- Honesto incluso cuando incomoda. Si la cifra es decepcionante, se muestra y se explica.
- Sin condescendencia con el usuario. Asumimos inteligencia, pedimos atención.
- **Vocabulario monetario** (definitivo, v1.1.x): el toggle visible al usuario se llama **"Ajustar por inflación"** + switch O/I. Las claves internas `state.displayMode === 'nominal' | 'real'` **no cambian**. En captions y prosa, las cifras descontadas por inflación se etiquetan como **"(ajustado por inflación)"** o **"ajustado por inflación"**. Nomenclatura prohibida en strings JSX visibles: `"€ con/sin inflación"`, `"€ Futuro/Hoy"`, `"€ de hoy"`. Auditoría grep cierra cada sub-sprint que toque copy. *(Nota junio 2026: la unificación a cifras nominales del sprint de Plan reintrodujo etiquetas "de hoy" en Proyección — la regla y esa decisión están en tensión; resolver con Nacho antes de la siguiente auditoría de copy.)*

---

## Sistemas vivos transversales

Conocimiento de producto que no se deriva fácilmente del código y sigue vigente:

- **Free/Pro**: flag `state.isPro` (default `false`, zombi protegido). Toggle "Modo testing (temporal)" en Ajustes; se eliminará o condicionará antes del lanzamiento. En Pro: Monte Carlo completo (5 bandas, SoR), allocation editable. El Probador/sandbox se eliminó del free en v1.4.0a; `state.sandbox` y sus callbacks quedan como zombis para reactivación futura como Pro.
- **Hitos con categorías**: cada `goal` tiene `category` (8 valores en `GOAL_CATEGORIES`, default `'otro'`). `GoalContextualBlock` muestra notas contextuales según categoría y ratio target/patrimonio (pignoración para vivienda >30%, cuenta remunerada para liquidez, lump sum vs DCA para herencia…).
- **Bridge global de lecciones**: `window.__openLearnConcept(id)` (state `globalConceptId` en `Shell` + `ConceptModal` en raíz) permite abrir una lección de Aprende desde cualquier pantalla sin cambiar de tab.
- **Plan estándar de referencia**: `STANDARD_PLAN_REFERENCE` (20% saving, retorno 8%, inflación 2.5%, allocation por horizonte) + `projectStandardPlan(state)`. Ojo: `projectV2(...)` devuelve directamente el array `series`, no `{ series }`.
- **Shell**: header sticky horizontal en desktop (logo + 5 tabs + `KpiPill` + `AccountMenu`), bottom nav en mobile con labels abreviadas ("Proy.", "Seguim."). El encuadre de contenido lo da `CONTENT_MAX` (una sola vez, en el Shell).

---

## Convenciones de código

- **Proyecto Vite** (`app/`): React 18 + Recharts 2.10 + prop-types, deps fijadas exactas, sin ninguna otra dependencia. JSX moderno; `import React` explícito donde se usa el namespace.
- Estado global vía hook custom `useStore()` (provider en `state/`). Actualización vía `update`, `updatePlan`, `updateProfile`, `mutatePlan`, etc. Derivadas memoizadas en `useDerived()`.
- Persistencia automática en `localStorage` con claves `miplan.state.v1` / `miplan.accounts.v1` (wrapper multi-cuenta). `schemaVersion 2`.
- Theme centralizado en objeto `T` (`tokens/`): paleta + fuentes + `T.size`/`T.lh`/`T.tracking`. Fuentes: `T.display` y `T.serif` (Fraunces — Instrument Serif jubilada en v1.5.0), `T.mono` (DM Mono), `T.sans` (Inter, solo galería dev).
- Colores clave: `T.accent` (#c2410c), `T.amber`, `T.green`, `T.red`, `T.ink`, `T.bg`, `T.paper`, `T.panel`, `T.line`, `T.lineSoft`, `T.inputBg` (#faf3e4), `T.muted`, `T.faint`.
- Layout responsive con `useIsMobile()`.
- Estilos globales (reset, inputs con `appearance: none`, `.tab-enter`, overrides de recharts) en `app/src/index.css`, portados del baseline.
- Puentes técnicos vigentes (pendiente de retirada, ver `ESTADO.md`): shim `window.Recharts` en `charts/`, `resolve.dedupe` en `vite.config.js`.
- Cabecera AGPL-3.0 con placeholder `[TU NOMBRE]` para rellenar antes de publicar.

---

## Sistema tipográfico (v1.3.0)

Tres ejes tokenizados en el objeto `T`: `T.size`, `T.lh`, `T.tracking`. **Ningún literal numérico de fontSize/lineHeight/letterSpacing debe introducirse fuera de los tokens** salvo excepción documentada inline con comentario `/* excepción · {razón} */`.

### `T.size` — tamaños de fuente

| Token | Valor | Uso |
|---|---|---|
| `T.size.eyebrow` | 11 | **Sólo mono uppercase** (suelo absoluto). Labels, eyebrows, captions micro. |
| `T.size.caption` | 13 | Caption serif/sans, helper text, metadatos. |
| `T.size.body` | 15 | Texto base de lectura (prosa, items de lista, descripciones). |
| `T.size.lead` | 17 | Texto destacado, intro de sección, frases hero pequeñas. |
| `T.size.subtitle` | 22 | Subtítulo, números secundarios (KPIs medianos, cifras fijas). |
| `T.size.displayMd` | `clamp(24px, 3vw, 32px)` | Headers de movimiento, KPI grande, título de sección. |
| `T.size.displayLg` | `clamp(28px, 4vw, 44px)` | "Hola, {nombre}", KPIs hero. |
| `T.size.displayXl` | `clamp(34px, 5vw, 52px)` | Onboarding heroes. |
| `T.size.displayXxl` | `clamp(40px, 6vw, 64px)` | Landing hero. |

### `T.lh` — line-height

| Token | Valor | Uso |
|---|---|---|
| `T.lh.tight` | 1.15 | Títulos display, números hero. |
| `T.lh.snug` | 1.3 | Subtítulos, cifras medianas. |
| `T.lh.normal` | 1.5 | Prosa de lectura (default). |
| `T.lh.relaxed` | 1.6 | Prosa larga, artículos de Aprende, manifiesto. |

### `T.tracking` — letter-spacing

| Token | Valor | Uso |
|---|---|---|
| `T.tracking.display` | -0.02em | Display tipografía, hero numbers. |
| `T.tracking.tight` | -0.01em | Headers medianos. |
| `T.tracking.normal` | 0 | Default (omitir property en JSX). |
| `T.tracking.wide` | 0.08em | Mono labels suaves. |
| `T.tracking.wider` | 0.12em | Mono labels (eyebrows, captions caps). |
| `T.tracking.widest` | 0.16em | Mono labels muy espaciados (numeración de pasos). |

### Reglas de uso

1. **Suelo tipográfico**: `T.size.eyebrow` (11) **sólo** en `T.mono` uppercase. En serif/sans/display, mínimo `T.size.caption` (13).
2. **Familia por defecto por token**:
   - `eyebrow` → `T.mono` + `textTransform: 'uppercase'` + `T.tracking.wider` o `widest`.
   - `caption`, `body`, `lead` → `T.serif` o `T.sans`.
   - `subtitle` → `T.display` o `T.serif`.
   - `displayMd/Lg/Xl/Xxl` → `T.display`, normalmente con `T.tracking.display` y `T.lh.tight`.
3. **clamp()**: no introducir nuevos. Si hace falta un responsivo, usar uno de los 4 display tokens o añadir uno nuevo en `T.size`.
4. **Excepciones**: si una sustitución produce visual peor, mantener inline con comentario `/* excepción · {razón} */`. Excepciones actuales: `fontSize: 64` (hero input nombre Onboarding paso 1), `fontSize: 96` (hero paso espejo), `lineHeight: 1` (ocurrencias funcionales en cifras display + botones icon — patrón idiomático sin comentario individual, listado en `AUDITORIA_VISUAL_v1_3_0.md`).

Documentos de referencia: `AUDITORIA_VISUAL_v1_3_0.md` (inventario completo antes/después) y `CHANGELOG_v1_3_0.md` (resumen del sprint).

---

## Convenciones de nombres internos

**Importante para no romper datos persistidos:**

- En código y en `localStorage` se mantienen los nombres antiguos: `sandbox`, `'hipotetico'`, `sandboxActive`, `state.sandbox`, `state.displayMode === 'nominal'` / `'real'`, `state.activeTab === 'hoy'`, etc.
- En UI visible se usa el vocabulario nuevo: "evento posible", "Plan" (tab), "Ajustar por inflación". El vocabulario "Probador" / "Probar escenario" **ya no aparece en UI** desde v1.4.0a (Probador eliminado del free, reservado para Pro). Internamente `state.sandbox` y los callbacks `startSandbox`/`applySandbox`/`discardSandbox` siguen declarados como zombi para compatibilidad de estado persistido y reactivación futura.
- **NO renombrar los nombres internos en ningún caso.** Los usuarios con estado guardado se romperían.
- Cuando se añada un campo nuevo al estado, usar nombres descriptivos en inglés tipo `monthlyExpense`, `mortgage`, `currentAllocation`, `isPro`, `hasSeenLandingPreOnboarding`, `variableSegments`.

---

## Convenciones de migración de estado

Cuando se añade un campo nuevo al estado:

1. Definir un valor por defecto explícito.
2. Aplicar el valor por defecto en `emptyState()` (estado inicial completo) **y** en `migrateToV2()` (usuarios con estado anterior).
3. La migración tiene que ser **idempotente**: si el campo ya existe, no tocarlo.
4. **No** eliminar campos existentes aunque queden obsoletos. Dejarlos como zombis. La compatibilidad hacia atrás es no negociable.
5. El `Shell` puede normalizar valores legacy de `state.activeTab` vía `useEffect` (ejemplo: `'plan'` → `'ajustes'`, `'mes'` → `'seguimiento'`, `'sinplan'` → `'hoy'` desde v1.1.1).
6. Para migraciones one-shot que reabren un flow (ej. "mostrar la landing al usuario existente una sola vez"), usar bandera bajo `state.migrationsApplied: { v1_X_Y_name: true }` para registrar la aplicación y evitar repetir.

### Campos del estado y migraciones aplicadas

| Campo | Tipo | Default | Desde |
|---|---|---|---|
| `state.plan.salaryInflationFactor` | number 0.0-1.0 | `1.0` | v1.1.0 |
| `state.plan.phaseManualChecks` | objeto `{ stepId: dateString }` | `{}` | v1.1.1 |
| `goal.category` | string en `GOAL_CATEGORIES` | `'otro'` | v1.1.1 |
| `state.migrationsApplied` | objeto bandera | `{}` (se llena por migraciones) | v1.1.0 |
| `state.hasSeenLandingPreOnboarding` | bool | `false` en nuevos, **forzado a `false` una vez** para usuarios v1.0 vía `migrationsApplied.v1_1_0_landing_reset` | v5.8 + migración v1.1.0 |
| `state.isPro` | bool | `false` | v5.10 |

---

## Niveles del corpus Aprende (`LEARN_LEVELS`)

Los **36** ids de `LEARN_CORPUS` se agrupan en tres niveles:

```
esencial (12):
  interes-compuesto, retorno-anual, inflacion, volatilidad,
  riesgo-incertidumbre, patrimonio, horizonte, aporte-mensual,
  asset-allocation, fondos-indexados, comisiones, diversificacion

profundizando (13):
  regla-4, monte-carlo, libertad-financiera, tasa-retiro,
  secuencia-retornos, esperanza-vida, independencia-jubilacion,
  etfs-vs-fondos, plan-pensiones, broker, robo-advisors,
  inversion-pasiva, dca

avanzado (11):
  tramos, eventos-pos-conf, probador, lean-coast-fat, rebalanceo,
  pignoracion,
  irpf, pension-publica, base-reguladora, tributacion-pp, modelo-720
```

Si necesitas envolver un término que no está en esta lista, **no inventes un id nuevo**. O bien usa el id existente más cercano (por ejemplo "inflación" para envolver "el IPC"), o bien deja el texto plano sin `<Concept>`.

Iconos SVG inline para los **12 conceptos Esencial** vía `<LearnIcon id />` + 1 icono para `pignoracion` (escudo) en Avanzado. Los 22 restantes usan fallback (rombo abstracto). Generar el resto sigue el patrón establecido.

---

## Reglas de motor y gating (complemento a los invariantes de CLAUDE.md)

- `projectV2` tiene firma estable; sus añadidos opcionales conocidos son `actualByKey`, `endAge`, `startAge`, `months`, `effectiveReturn` (aditivos). `runMonteCarlo` ídem (`sequenceMode`, `volatility`, `includeHypothetical`…).
- Para cualquier input numérico nuevo, validar rangos razonables y permitir edición libre.
- Cuando se introduzca un nuevo gating (free/Pro), respetar la convención: lectura vía `state.isPro` desde `useStore()`, sin extraer dos componentes salvo necesidad real.
- Para copy nuevo sin especificar en el prompt, derivar del manifiesto editorial (sección Filosofía) — nunca improvisar.
