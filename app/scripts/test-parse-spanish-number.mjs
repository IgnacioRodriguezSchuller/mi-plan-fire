// Casos de prueba de parseSpanishNumber (H2 · separador de miles en EditableNumber).
// src/ui/index.jsx es JSX (node no lo importa), así que extraemos la función del
// fuente —pura y sin dependencias a propósito— y la evaluamos, al estilo de las
// slices de verify-lib.mjs. Si la función se mueve o se renombra, este script
// falla en seco (exit 1), no en silencio.
import { readFileSync } from 'node:fs'

const SRC = new URL('../src/ui/index.jsx', import.meta.url)
const src = readFileSync(SRC, 'utf8')

const start = src.indexOf('export function parseSpanishNumber(str) {')
if (start === -1) { console.error('✗ no se encontró parseSpanishNumber en src/ui/index.jsx'); process.exit(1) }
const end = src.indexOf('\n}', start)
const fnSource = src.slice(start, end + 2).replace(/^export /, '')
const parseSpanishNumber = new Function(`${fnSource}; return parseSpanishNumber;`)()

const CASES = [
  // [input, esperado] — esperado NaN = descarte (EditableNumber revierte al valor previo)
  ['1.500', 1500],          // punto de millares español
  ['1500', 1500],
  ['1.500,50', 1500.5],     // formato español completo
  ['1,5', 1.5],
  ['1.5', 1.5],             // un punto suelto sin patrón de millares = decimal
  ['0,75', 0.75],
  ['12.345.678', 12345678],
  ['1.5000', 1.5],          // 4 dígitos tras el punto: no es grupo de millares
  ['-2.300', -2300],
  ['', NaN],
  ['abc', NaN],
  ['1,2,3', NaN],           // dos comas → inválido
  // Round-trip de la siembra del draft (String(value), formato JS crudo):
  ['1500.5', 1500.5],
  ['-1.5', -1.5],
  // Espacios como separador de millar (normal, NBSP, NNBSP) y ruido de bordes:
  ['1 500', 1500],
  ['1 500,25', 1500.25],
  ['1 500', 1500],
  ['  1.500  ', 1500],
  [',', NaN],
  ['1.50', 1.5],            // grupo de 2 → no millares → decimal tal cual
]

let fails = 0
for (const [input, expected] of CASES) {
  const got = parseSpanishNumber(input)
  const ok = Number.isNaN(expected) ? Number.isNaN(got) : got === expected
  if (!ok) fails++
  console.log(`${ok ? '✓' : '✗'} ${JSON.stringify(input).padEnd(18)} → ${String(got).padEnd(10)}${ok ? '' : ` (esperado ${expected})`}`)
}

console.log('---------------------------------------------')
if (fails) { console.error(`✗ FAIL — ${fails} caso(s) con diferencia`); process.exit(1) }
console.log(`✓ PASS — ${CASES.length} casos (12 del encargo + 8 de round-trip/espacios)`)
