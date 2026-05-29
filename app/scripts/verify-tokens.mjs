// Verificador de la Tanda 1 (tokens).
// Compara, VALOR A VALOR, los tokens extraídos a src/tokens/ contra el
// SOURCE REAL del monolito baseline (mi_plan_v1_5_0a_3.html). No afirma la
// igualdad: la calcula evaluando el bloque original del HTML en aislamiento.
// Sale con código !=0 si algo difiere.
import { readFileSync } from 'node:fs'

const HTML = new URL('../../mi_plan_v1_5_0a_3.html', import.meta.url)
const MODULE = new URL('../src/tokens/index.js', import.meta.url)

// 1) Reconstruir WEB_URL/T ORIGINALES desde el HTML, sin tocarlo.
const html = readFileSync(HTML, 'utf8')
const start = html.indexOf('const WEB_URL')
const end = html.indexOf('// ---------- Formatters ----------')
if (start < 0 || end < 0 || end <= start) {
  console.error('✗ No se pudo localizar el bloque de tokens en el HTML (marcadores movidos).')
  process.exit(2)
}
const slice = html.slice(start, end)
let original
try {
  // El slice declara `const WEB_URL` y `const T` (+ T.size/lh/tracking).
  original = new Function(`${slice}\n;return { WEB_URL, T };`)()
} catch (e) {
  console.error('✗ Error evaluando el bloque original del HTML:', e.message)
  process.exit(2)
}

// 2) Importar el módulo extraído.
const mod = await import(MODULE.href)
const extracted = { WEB_URL: mod.WEB_URL, T: mod.T }

// 3) Deep-equal con rutas + recogida de diferencias.
const diffs = []
function deepEqual(a, b, path) {
  if (typeof a !== typeof b) {
    diffs.push(`${path}: tipo ${typeof a} (orig) != ${typeof b} (extraído)`)
    return
  }
  if (a === null || typeof a !== 'object') {
    if (a !== b) diffs.push(`${path}: ${JSON.stringify(a)} (orig) != ${JSON.stringify(b)} (extraído)`)
    return
  }
  const ka = Object.keys(a).sort()
  const kb = Object.keys(b).sort()
  const onlyOrig = ka.filter((k) => !kb.includes(k))
  const onlyExtr = kb.filter((k) => !ka.includes(k))
  onlyOrig.forEach((k) => diffs.push(`${path}.${k}: presente en orig, ausente en extraído`))
  onlyExtr.forEach((k) => diffs.push(`${path}.${k}: presente en extraído, ausente en orig`))
  ka.filter((k) => kb.includes(k)).forEach((k) => deepEqual(a[k], b[k], `${path}.${k}`))
}

deepEqual(original.WEB_URL, extracted.WEB_URL, 'WEB_URL')
deepEqual(original.T, extracted.T, 'T')

// 4) Dump lado a lado.
function dump(label, obj) {
  console.log(`\n--- ${label} ---`)
  console.log('WEB_URL =', JSON.stringify(obj.WEB_URL))
  for (const top of ['', 'size', 'lh', 'tracking']) {
    const node = top === '' ? obj.T : obj.T[top]
    const prefix = top === '' ? 'T' : `T.${top}`
    for (const [k, v] of Object.entries(node)) {
      if (top === '' && typeof v === 'object') continue // sub-bloques se imprimen aparte
      console.log(`  ${prefix}.${k} = ${JSON.stringify(v)}`)
    }
  }
}
dump('ORIGINAL (mi_plan_v1_5_0a_3.html)', original)
dump('EXTRAÍDO (src/tokens/index.js)', extracted)

// 5) Veredicto.
console.log('\n================ RESULTADO ================')
if (diffs.length === 0) {
  console.log('✓ PASS — tokens idénticos valor-a-valor con el baseline.')
  process.exit(0)
} else {
  console.error(`✗ FAIL — ${diffs.length} diferencia(s):`)
  diffs.forEach((d) => console.error('   • ' + d))
  process.exit(1)
}
