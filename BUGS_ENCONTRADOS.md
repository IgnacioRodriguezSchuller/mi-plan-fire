# Bugs colaterales encontrados (no arreglados)

Anotados durante el trabajo de Prompt 1. Formato: descripción · gravedad estimada (bajo / medio / alto) · ubicación aproximada.

## Encontrados durante Prompt 1

- **`FinancialHealthCard` infraestima el patrimonio FI cuando hay gap pensión-jubilación** · gravedad media · línea ~3179.
  El cálculo asume que la pensión cubre `monthlyGap` desde el momento de FI. Si el usuario alcanza FI a los 50 pero la pensión empieza a los 67, durante 17 años el portfolio tiene que cubrir TODO el `monthlyLife` (no `monthlyGap`). El target FI real es mayor del que se muestra. Fuera del scope del prompt; la corrección C2.2c solo añade el aviso visual de "pensión activada pero no aplicable aún".

- **`MonthlyFlowCard` no contempla pensión** · gravedad baja · línea ~2944.
  Solo muestra ingreso vs inversión actual, sin referencia a la pensión. Correcto para "Tu mes" actual (la pensión no es ingreso actual), pero podría considerarse mostrarla como referencia futura. No es un bug per se, solo una limitación informativa.

- **`Slider` de Retorno en `ScreenProyeccion` tenía rango distinto al de Ajustes** · gravedad baja · línea ~4967.
  Era `min=1 max=15` vs Ajustes con `min=0 max=20`. Corregido como parte de C5d (alineado a 0-20 con warning >15).

- **El `month.planned` snapshot guardado en cada mes es legacy y queda zombie** · gravedad muy baja · estado persistido.
  Tras C4 ya no se usa para mostrar nada. Se mantiene en el estado por back-compat según convenciones (no se elimina campo existente). Si en el futuro se decide migrar, la limpieza es trivial.

- **`computeCurrentPortfolio` sigue usando `plan.capital` como seed independientemente de cuándo se editó** · gravedad baja · línea ~906.
  Si el usuario edita `plan.capital` después de haber registrado meses, la "real reconstructed" curve usará el nuevo capital como punto de partida desde el primer mes registrado, lo que reescribe la historia. No es nuevo (existía antes de C4), pero ahora es más visible con las curvas duales. Necesitaría un snapshot de "capital inicial al primer mes registrado" para fijarlo. Fuera del scope.

## Encontrados durante la auditoría de Proyección (Sprint 1 · 2026-06-18)

- **`fiTargetImplausible` (canary de pensión) es frágil** · gravedad media · `state/index.jsx` `useDerived`.
  Con pensión activa y `fiTarget < gastoAnual·5` se emite `verdict='sin-datos'` para no mostrar un veredicto inverosímil. Es un parche tras quitar la resta de pensión del nº FIRE; funciona como red de seguridad pero el umbral (×5) es arbitrario y no se explica. Revisar si el modelo de pensión se estabiliza. Fuera del scope de Sprint 1.

- **Volatilidad del Monte Carlo por tabla fija (`inferVolatility`)** · gravedad baja · `lib/index.js`.
  σ se infiere del retorno anual con una tabla de lookup (≤2 %→1,5σ … >12 %→20σ), no de la composición real de la cartera. Aceptable como aproximación; se sustituirá en el sprint de "MC avanzado".

- **Pensión hardcodeada a España** · gravedad baja · `lib/index.js` (`estimateSpanishPension`, 14 pagas).
  Reglas y nº de pagas españolas codificadas. Correcto hoy (app ES-only), frágil si se internacionaliza.

- **Coast/Fat FIRE devuelven `null` en silencio fuera de rango** · gravedad muy baja · `state/index.jsx` `useDerived`.
  Cuando la edad de Coast/Fat cae fuera del dominio de detección (≤90), se devuelve `null` y la UI muestra "—" / "fuera de alcance". Correcto, pero no distingue "no aplica" de "no se alcanza nunca". Suficiente por ahora.

