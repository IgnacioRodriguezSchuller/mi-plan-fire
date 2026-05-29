// Verificador de contenido (Tanda 5). Comprueba que LEARN_CORPUS,
// CATEGORY_LABELS y TABLON migrados a src/content/ son IDÉNTICOS (deep-equal,
// byte-a-byte en valores) al original del monolito mi_plan_v1_5_0a_3.html,
// sin recortes. Sale !=0 si algo difiere.
import { readFileSync } from 'node:fs'
import * as content from '../src/content/index.js'

const html = readFileSync(new URL('../../mi_plan_v1_5_0a_3.html', import.meta.url), 'utf8')

function topLevel(start, closeSeq) {
  const s = html.indexOf(start)
  const c = html.indexOf(closeSeq, s + start.length)
  if (s < 0 || c < 0) throw new Error('no localizado: ' + start)
  return html.slice(s, c + closeSeq.length)
}
function evalConst(slice, name) {
  return new Function(`${slice}\n;return ${name};`)()
}

const orig = {
  LEARN_CORPUS: evalConst(topLevel('const LEARN_CORPUS = {', '\n};'), 'LEARN_CORPUS'),
  CATEGORY_LABELS: evalConst(topLevel('const CATEGORY_LABELS = {', '\n};'), 'CATEGORY_LABELS'),
  TABLON: evalConst(topLevel('const TABLON = [', '\n];'), 'TABLON'),
}

function eq(a, b, path, diffs) {
  if (a === b) return
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    if (!Object.is(a, b)) diffs.push(`${path}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`)
    return
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    if (!(k in a)) { diffs.push(`${path}.${k}: ausente en original`); continue }
    if (!(k in b)) { diffs.push(`${path}.${k}: ausente en migrado`); continue }
    eq(a[k], b[k], `${path}.${k}`, diffs)
  }
}

const rows = []
let anyFail = false
for (const name of ['LEARN_CORPUS', 'CATEGORY_LABELS', 'TABLON']) {
  const diffs = []
  eq(orig[name], content[name], name, diffs)
  const ok = diffs.length === 0
  if (!ok) anyFail = true
  const nO = JSON.stringify(orig[name]).length
  const nM = JSON.stringify(content[name]).length
  rows.push({ name, ok, diff: diffs[0] || '', nO, nM, lenMatch: nO === nM })
}

// Conteos de cobertura: ORIGINAL vs MIGRADO (deben coincidir exactamente).
const cov = [
  ['LEARN_CORPUS · conceptos', Object.keys(orig.LEARN_CORPUS).length, Object.keys(content.LEARN_CORPUS).length],
  ['TABLON · temas', orig.TABLON.length, content.TABLON.length],
  ['TABLON · lecciones', orig.TABLON.reduce((s, t) => s + t.lessons.length, 0), content.TABLON.reduce((s, t) => s + t.lessons.length, 0)],
  ['CATEGORY_LABELS · categorías', Object.keys(orig.CATEGORY_LABELS).length, Object.keys(content.CATEGORY_LABELS).length],
]
const covMismatch = cov.filter(([, o, m]) => o !== m)

console.log('\n=== DEEP-EQUAL + LONGITUD JSON (orig vs migrado) ===')
for (const r of rows) {
  console.log(`  ${r.name.padEnd(16)} ${r.ok ? 'PASS' : 'FAIL'}  | JSON orig ${r.nO} vs migrado ${r.nM} ${r.lenMatch ? '(=)' : '(≠!)'}${r.ok ? '' : '  → ' + r.diff}`)
}
console.log('\n=== CONTEOS ORIGINAL vs MIGRADO ===')
for (const [label, o, m] of cov) {
  console.log(`  ${label.padEnd(30)} orig ${o} vs migrado ${m}  ${o === m ? '✓' : '✗ DIFIERE'}`)
}
if (covMismatch.length) { anyFail = true }

if (anyFail) {
  console.error('\n✗ FAIL — el contenido NO es idéntico.')
  process.exit(1)
} else {
  console.log('\n✓ PASS — contenido copiado íntegro, idéntico al baseline.')
  process.exit(0)
}
