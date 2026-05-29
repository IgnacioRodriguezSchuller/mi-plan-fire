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

