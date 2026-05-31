# Decisiones de producto — Mi Plan FIRE (v4)

> Bitácora editorial y de modelo de distribución. Documento hermano de `DOCTRINA_DISENO.md` (doctrina visual) y `CLAUDE_CODE_CONTEXTO.md` (contexto técnico).
>
> **Nota de origen:** este archivo se crea en mayo 2026 durante el Paso 0+1 de la migración. Versiones anteriores (`DECISIONES_PRODUCTO_3.md` y previas) se citan en changelogs y doctrina como documentos hermanos históricos pero no estaban presentes en el workspace al crear este; las decisiones vivas relevantes se recogen aquí desde §7 (modelo de distribución) en adelante.

---

## §7 · Modelo de distribución

**Decisión (v1.5.0a, mayo 2026):** pivote a "HTML gancho + web negocio".

- El `mi_plan_v1_5_0a_*.html` es el **producto gancho gratuito** (lead magnet), libre y bajo AGPL-3.0. Datos en localStorage del navegador.
- Las features avanzadas (sincronización, análisis Pro) viven en la **versión web** (`miplanfire.com`).
- El HTML no contiene paywalls ni promociones agresivas. Solo 3 puertas discretas al modelo de negocio: WhyDifferentModal (onboarding), AboutModal (menú de cuenta), header AGPL.

---

## §5.1 · Honestidad editorial

**Principios vigentes (reforzados en v1.5.0a.3):**

- **No inventar fechas, cifras ni estimaciones.** Toda cifra mostrada se calcula con los datos reales del usuario o se etiqueta con su supuesto explícito.
- **Honesto cuando incomoda.** Si una cifra es estructural (no depende de actuar), se presenta como tal (T.amber, no T.red) y se contextualiza, en vez de venderla como alarma.
- **No prometer features que no existen.** El onboarding describe solo lo que el HTML entrega hoy.

---

## §8 · Arquitectura y migración

**Decisión (mayo 2026):** migrar el HTML monolítico a `/src` con build de archivo único (tipo **Vite, NO Next.js**) en **Etapa 1**, reproduciendo el lead magnet actual **sin web/auth/pagos**.

- **Etapa 1** = sacar el monolito `mi_plan_v1_5_0a_3.html` a un proyecto `/src` modular con build de archivo único (Vite). Mismo producto, mismo comportamiento, mismas claves localStorage. Sin backend.
- **Etapa 2** = Next.js + Supabase + Stripe (web, auth, pagos). Posterior y separada.
- Al cerrar Etapa 1, **el HTML pasa a ser un build derivado** (artefacto generado), no la fuente de verdad.
- **Línea roja:** **no renombrar las claves localStorage** (`miplan.state.v1`, `miplan.accounts.v1`) en ninguna etapa. Ver `docs/etapa1-baseline.md` §3.
- Punto de retorno: tag git `baseline-pre-migracion`.
- Red de seguridad y examen de regresión: `docs/etapa1-baseline.md`.

**Estado · Etapa 1 CERRADA (mayo 2026).** Migración completada: el monolito se extrajo byte-a-byte a `app/src/` (modular, build Vite single-file).
- **Fuente de verdad = `app/src/`.** El HTML `mi_plan_v1_5_0a_3.html` quedó **congelado como red de regresión** (no se edita; hash `b3ea52b1f4a0960eecd0ee2a32d6d651fd3603e7`). *Matiz a la predicción de arriba: el monolito NO se regenera — el artefacto que produce el build es `dist/index.html`, separado.*
- **Correr/construir:** `cd app && npm run dev` (app real) · `npm run build` → `dist/index.html`. `?gallery` → galería de componentes (herramienta de desarrollo permanente).
- **Estructura por capas:** `tokens/ lib/ hooks/ ui/ charts/ content/ modals/ flows/ state/ screens/`.
- **App funcionalmente idéntica** a v1.5.0a.3 (examen de regresión §1 del baseline: 16/16 PASS). **Línea roja localStorage reafirmada:** claves (`miplan.state.v1` / `miplan.accounts.v1`) y formato sin tocar, `migrateToV2` copiado byte-a-byte.
- Registro de la migración: **`CHANGELOG_v1_5_0a_3_src.md`**. (Etapa 2 = Next.js + Supabase + Stripe: sin cambios — sigue posterior y separada.)
