# CHANGELOG mi_plan_v5_8.html

Derivado de `mi_plan_v5_7.html`. Una línea por cambio significativo.

## Sprint v1.0 · Sub-prompt C · Landing pre-onboarding

### C1 · Nuevo componente `LandingPreOnboarding`
- Primera pantalla que ve un usuario completamente nuevo (antes que el `Landing` actual). Diseño minimalista, centrado vertical y horizontal, máximo 600px de ancho.
- Cabecera con título display "Mi *Plan* **FIRE**" + subtítulo italic "Financial Independence, Retire Early · Independencia Financiera, Retiro Temprano".
- Tres párrafos prose serif explicando qué es la herramienta, su funcionamiento local-first, y la no-recomendación de productos.
- Tres bullets `T.mono` accent uppercase: "Privacidad verificable", "Sin gurús", "Honesto cuando incomoda" (copy literal del prompt).
- CTA primario `Empezar →` (variante accent) y CTA secundario `Antes, quiero saber más →` (variante ghost). En mobile se apilan verticalmente; en desktop en horizontal.

### C2 · Nuevo componente `WhyDifferentModal`
- Modal a pantalla completa (z-index 1200) con el manifiesto del producto. Activado desde el CTA secundario de `LandingPreOnboarding`.
- Estilo coherente con `ConceptModal`: maxWidth 640, padding generoso, header mono "Manifiesto" + título display, párrafo italic-muted introductorio.
- Cinco bloques separados por `1px dashed`, cada uno con título mono uppercase en `T.accent` y cuerpo serif 15/1.6. Copy derivado del manifiesto editorial documentado en CLAUDE_CODE_CONTEXTO.md (filosofía + tono + Camino B):
  - **Privacidad verificable** — el archivo es público, sin red, sin tracking; la promesa "todo en local" se puede comprobar leyendo el código.
  - **Camino B en regulación financiera** — educa sobre categorías, no recomienda productos por nombre comercial, no emite asesoramiento personalizado (art. 140 LMV / MiFID II).
  - **No impone un tipo de FIRE** — no hay "Lean/Coast/Fat" prefabricado; cada persona define su mezcla.
  - **Sin retención artificial** — cero dark patterns, sin notificaciones forzadas, sin rachas, sin gamificación adictiva.
  - **Honesto cuando incomoda** — si el plan es frágil te lo decimos; la función no es vender tranquilidad.
- Cierre con botón `Entendido, vamos →`. Cierre también con ESC o click fuera.

### C3 · Flag de persistencia
- Nuevo campo `state.hasSeenLandingPreOnboarding` (boolean):
  - `false` por defecto en `emptyState()`.
  - `true` en `seedState()` (el demo bypassea la pre-landing).
  - Migración idempotente en `migrateToV2`: para usuarios existentes con `hasSeenLandingPreOnboarding == null` se inicializa a `!!state.onboardingComplete`, de modo que usuarios que ya hayan completado el onboarding no ven la nueva landing al cargar v5.8.
- Solo se muestra `LandingPreOnboarding` cuando `!hasSeenLandingPreOnboarding && !onboardingComplete`. Al pulsar "Empezar →" el flag se pone a `true` y nunca vuelve a aparecer, salvo que el usuario borre el estado completo (verificado en runtime con `localStorage.clear()`).

### C4 · Integración en `Shell`
- Nuevo estado local `[showManifesto, setShowManifesto]` en `Shell`.
- Bloque condicional al principio del Shell, antes del Landing actual:
  ```jsx
  if (!state.hasSeenLandingPreOnboarding && !state.onboardingComplete) {
    return <><LandingPreOnboarding ... />{showManifesto && <WhyDifferentModal ... />}</>;
  }
  ```
- Flujo completo para usuario nuevo: pre-onboarding → landing actual → onboarding 9 pasos → dashboard.

### C5 · Window exports
- `Object.assign(window, { Landing, LandingPreOnboarding, WhyDifferentModal })` extendido (antes solo `Landing`).

## Verificación runtime · Playwright + Chromium headless
- Usuario nuevo aterriza en `LandingPreOnboarding`: título, tres bullets y los dos CTAs presentes. ✓
- Click en "Antes, quiero saber más →" abre el modal con los 5 bloques. ✓
- ESC cierra el modal y devuelve al pre-landing sin progresar. ✓
- "Empezar →" avanza al `Landing` actual ("Tu dinero, a treinta años vista"). ✓
- Reload tras "Empezar" salta directo al landing actual (flag persistido). ✓
- `localStorage` contiene `hasSeenLandingPreOnboarding: true`. ✓
- `localStorage.clear()` + reload → la pre-landing vuelve a aparecer. ✓
- Cero `pageerror`, cero errores de consola.

## No tocado (por las reglas del sub-prompt)
- `CLAUDE_CODE_CONTEXTO.md` no se actualiza (corresponde al sub-prompt G).
- El `Landing` actual ("Tu dinero, a treinta años vista") se mantiene tal cual; la nueva pre-onboarding lo precede en el flujo, no lo reemplaza.
- `Onboarding`, `projectV2`, `runMonteCarlo`, `LEARN_CORPUS`, IDs internos y claves de localStorage: intactos.
