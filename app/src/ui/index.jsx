// Primitivas visuales — extraídas byte-a-byte de mi_plan_v1_5_0a_3.html.
// Etapa 1 · Paso 3 · Tanda 3. Solo se añade `export` + imports; mismo JSX,
// mismos estilos, sin rediseñar ni cambiar clases.
//
// Dependencias: T (tokens migrados) y useIsMobile (hooks migrados, por Card).
// Stat/SmallStat usan Label (mismo módulo).
//
// NO incluidas en esta tanda (dependen de capas no migradas):
//  - DisplayModeToggle, KpiPill -> state (useStore/useDerived)
//  - GoalRow -> content (GOAL_CATEGORIES) + screens (GoalContextualBlock) + Card
import { useState, useEffect } from 'react'
import { T } from '../tokens/index.js'
import { useIsMobile } from '../hooks/useIsMobile.js'

// Parseo de número en formato español (H2). `parseFloat(draft.replace(',', '.'))`
// a secas corrompía datos: "1.500" → 1.5 y "1.500,50" → 1.5 (el punto de millares
// se leía como decimal). Reglas, en orden:
//   1. fuera espacios (incluidos \u00A0 NBSP y \u202F NNBSP, separadores
//      de millar en algunos locales).
//   2. más de una coma → NaN (descarte).
//   3. exactamente una coma → la coma ES el decimal: fuera todos los puntos
//      (millares), coma → punto.
//   4. sin coma: si el string entero es un patrón de millares con punto
//      (-?\d{1,3}(.\d{3})+) → fuera puntos; si no, parseFloat tal cual
//      (un "1.5" suelto se respeta como 1,5).
// Pura y sin dependencias a propósito: scripts/test-parse-spanish-number.mjs la
// extrae del fuente y la ejecuta en node.
export function parseSpanishNumber(str) {
  if (str == null) return NaN;
  const s = String(str).trim().replace(/[\s\u00A0\u202F]/g, '');
  if (s === '') return NaN;
  const commas = (s.match(/,/g) || []).length;
  if (commas > 1) return NaN;
  if (commas === 1) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) return parseFloat(s.replace(/\./g, ''));
  return parseFloat(s);
}

// Editable number that looks like text (used inline in sentences)
export function EditableNumber({ value, onChange, min, max, step = 1, suffix = '', width, color = T.accent, big = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { if (!editing) setDraft(String(value)); }, [value, editing]);
  const commit = () => {
    setEditing(false);
    const n = parseSpanishNumber(draft);
    if (!isNaN(n)) {
      const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n));
      onChange(clamped);
    } else {
      setDraft(String(value));
    }
  };
  // Autosize: width based on current content (in ch units, +1 for padding)
  const displayed = editing ? draft : String(value);
  const autoWidth = width != null ? width : `${Math.max(2, displayed.length) + 1}ch`;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
      <input
        type="text"
        inputMode="decimal"
        value={editing ? draft : value}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => { setEditing(true); setDraft(String(value)); e.target.select(); }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setDraft(String(value)); e.target.blur(); } }}
        style={{
          width: autoWidth, background: 'transparent',
          border: 'none', borderBottom: '2px dashed ' + color,
          color, font: 'inherit', textAlign: 'center', outline: 'none', padding: '0 4px',
          fontSize: 'inherit', fontFamily: 'inherit',
        }}
      />
      {suffix && <span style={{ color }}>{suffix}</span>}
    </span>
  );
}

export function Slider({ label, value, onChange, min, max, step = 1, suffix = '', fmt = null, accent = T.accent }) {
  const display = fmt ? fmt(value) : value + suffix;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.muted }}>{label}</span>
        <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: accent, letterSpacing: T.tracking.tight, lineHeight: 1 }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} value={value} step={step} onChange={(e) => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, marginTop: 2 }}>
        <span>{fmt ? fmt(min) : min + suffix}</span>
        <span>{fmt ? fmt(max) : max + suffix}</span>
      </div>
    </div>
  );
}

export function Pill({ children, color = T.muted, bg = 'transparent', border = T.line, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999, background: bg,
      border: '1px solid ' + border, color,
      fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase',
      ...style,
    }}>{children}</span>
  );
}

export function Card({ children, style = {}, pad }) {
  const mobile = useIsMobile();
  const finalPad = pad != null ? pad : (mobile ? 14 : 24);
  return (
    <div style={{
      background: T.bg, border: '1px solid ' + T.line, borderRadius: 16,
      padding: finalPad, position: 'relative',
      ...style, minWidth: 0, overflow: 'hidden',
    }}>{children}</div>
  );
}

// Cartel Fase 2 · cierre fino: el eyebrow ÚNICO del producto es serif (una sola voz, P4 de la
// doctrina). Antes era mono MAYÚSCULAS; ahora serif itálica (idéntico a CartelLabel). El cambio
// propaga la voz a todas las pantallas/modales que usan <Label> en una sola edición.
export function Label({ children, style = {} }) {
  return (
    <div style={{
      fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, letterSpacing: 0,
      color: T.muted, ...style,
    }}>{children}</div>
  );
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', style = {} }) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: T.size.eyebrow },
    md: { padding: '12px 22px', fontSize: T.size.caption },
    lg: { padding: '16px 32px', fontSize: T.size.caption },
  };
  const variants = {
    primary: { background: T.ink, color: T.bg, border: '1px solid ' + T.ink },
    accent: { background: T.accent, color: '#fff', border: '1px solid ' + T.accent },
    amber: { background: T.amber, color: '#fff', border: '1px solid ' + T.amber },
    ghost: { background: 'transparent', color: T.ink, border: '1px solid ' + T.line },
    text: { background: 'transparent', color: T.accent, border: 'none', padding: 0 },
  };
  return (
    <button onClick={onClick} style={{
      ...sizes[size], ...variants[variant],
      borderRadius: 999, fontFamily: T.mono,
      letterSpacing: T.tracking.widest, textTransform: 'uppercase',
      cursor: 'pointer', transition: 'transform 0.12s, opacity 0.15s',
      ...style,
    }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  );
}

// "Siguiente paso" · card de dirección unificada (Proyección, Hoy, Seguimiento). Una sola
// anatomía: Card + borde-izquierdo de tono (accent = avanzas/ok · amber = atención/tarde —
// NUNCA verde) + kicker Label "Siguiente paso" + prosa serif (lead) + link de acción
// (Btn variant="text", el botón texto canónico). `body` = frase principal; `children` cuelga
// estructura extra (p.ej. las vías Coast/Lean de Proyección).
export function NextStep({ tone = 'forward', body, action, children, style = {} }) {
  const c = tone === 'behind' ? T.amber : T.accent;
  return (
    <Card style={{ borderLeft: '3px solid ' + c, ...style }}>
      <Label style={{ color: c }}>Siguiente paso</Label>
      {body != null && (
        <div style={{ fontFamily: T.serif, fontSize: T.size.lead, lineHeight: T.lh.normal, color: T.ink, marginTop: 12 }}>{body}</div>
      )}
      {action && (
        <div style={{ marginTop: 14 }}>
          <Btn variant="text" size="sm" onClick={action.onClick}>{action.label}</Btn>
        </div>
      )}
      {children}
    </Card>
  );
}

// Compact month picker (YYYY-MM input)
export function MonthInput({ value, onChange, placeholder = '', allowEmpty = false }) {
  return (
    <input
      type="month"
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder}
      style={{
        fontFamily: T.mono, fontSize: T.size.caption, padding: '8px 10px',
        background: T.bg, border: '1px solid ' + T.line, borderRadius: 6,
        color: T.ink, outline: 'none', width: '100%', boxSizing: 'border-box',
      }}
    />
  );
}

export function Stat({ label, value, muted, good, bad }) {
  return (
    <div>
      <Label style={{ marginBottom: 6 }}>{label}</Label>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayLg, letterSpacing: T.tracking.display, lineHeight: 1, color: bad ? T.red : good ? T.green : muted ? T.faint : T.ink }}>{value}</div>
    </div>
  );
}

export function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px dashed ' + T.lineSoft, paddingBottom: 8 }}>
      <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.muted }}>{label}</span>
      <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink }}>{children}</span>
    </div>
  );
}

// Row + optional italic warning beneath. Used in Ajustes for out-of-range hints.
export function RowWithWarning({ label, warning, children }) {
  return (
    <div style={{ borderBottom: '1px dashed ' + T.lineSoft, paddingBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.muted }}>{label}</span>
        <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink }}>{children}</span>
      </div>
      {warning && (
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.amber, fontSize: T.size.caption, marginTop: 6, lineHeight: T.lh.normal }}>
          {warning}
        </div>
      )}
    </div>
  );
}

export function SmallStat({ label, value, sub, accent, good, bad }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Label style={{ marginBottom: 4 }}>{label}</Label>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, color: good ? T.green : bad ? T.amber : accent ? T.accent : T.ink, lineHeight: T.lh.tight, wordBreak: 'break-word' }}>{value}</div>
      <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, marginTop: 2, fontStyle: 'italic', lineHeight: T.lh.snug }}>{sub}</div>
    </div>
  );
}

export function LegendChip({ color, label, dashed }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}>
      <svg width="22" height="6"><line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 4' : ''} /></svg>
      {label}
    </span>
  );
}

// LearnIcon (baseline POR DECIDIR → ui/): icono SVG puro, solo depende de T.
// v5.11 (F2.5) · Minimalist single-stroke icons for the Esencial concepts.
// Each renders inside a 36×36 box, stroke 1.6 in T.ink. Concepts without a
// dedicated icon fall back to <LearnIconFallback />.
export function LearnIcon({ id, size = 36, color }) {
  const stroke = color || T.ink;
  const sw = 1.6;
  const common = { width: size, height: size, viewBox: '0 0 36 36', fill: 'none', stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (id) {
    case 'interes-compuesto': // curva exponencial creciente
      return <svg {...common}><path d="M 5 30 Q 18 30 24 18 T 31 5" /><circle cx="31" cy="5" r="1.5" fill={stroke} /></svg>;
    case 'retorno-anual': // flecha hacia arriba con un punto
      return <svg {...common}><path d="M 18 30 L 18 8" /><path d="M 11 15 L 18 8 L 25 15" /></svg>;
    case 'inflacion': // monedas decrecientes
      return <svg {...common}><circle cx="10" cy="14" r="5" /><circle cx="18" cy="20" r="4" /><circle cx="26" cy="25" r="3" /></svg>;
    case 'volatilidad': // ola
      return <svg {...common}><path d="M 4 18 Q 9 8 14 18 T 24 18 T 32 18" /></svg>;
    case 'riesgo-incertidumbre': // signo de interrogación dentro de un círculo
      return <svg {...common}><circle cx="18" cy="18" r="13" /><path d="M 14 14 Q 14 10 18 10 Q 22 10 22 14 Q 22 17 18 18 L 18 21" /><circle cx="18" cy="25" r="0.8" fill={stroke} /></svg>;
    case 'patrimonio': // bóveda con barras
      return <svg {...common}><rect x="6" y="10" width="24" height="18" rx="1.5" /><line x1="6" y1="16" x2="30" y2="16" /><line x1="12" y1="20" x2="12" y2="26" /><line x1="18" y1="20" x2="18" y2="26" /><line x1="24" y1="20" x2="24" y2="26" /></svg>;
    case 'horizonte': // reloj de arena
      return <svg {...common}><path d="M 10 6 L 26 6" /><path d="M 10 30 L 26 30" /><path d="M 10 6 Q 10 12 18 18 Q 26 24 26 30" /><path d="M 26 6 Q 26 12 18 18 Q 10 24 10 30" /></svg>;
    case 'aporte-mensual': // calendario con flecha de entrada
      return <svg {...common}><rect x="6" y="9" width="24" height="20" rx="2" /><line x1="6" y1="14" x2="30" y2="14" /><line x1="12" y1="6" x2="12" y2="11" /><line x1="24" y1="6" x2="24" y2="11" /><path d="M 14 22 L 22 22" /><path d="M 19 19 L 22 22 L 19 25" /></svg>;
    case 'asset-allocation': // tres rectángulos verticales de distintas alturas
      return <svg {...common}><rect x="6" y="14" width="6" height="16" /><rect x="15" y="8" width="6" height="22" /><rect x="24" y="20" width="6" height="10" /></svg>;
    case 'fondos-indexados': // varias líneas horizontales subiendo (índice)
      return <svg {...common}><line x1="5" y1="28" x2="31" y2="10" /><line x1="5" y1="32" x2="5" y2="6" /><line x1="3" y1="30" x2="33" y2="30" /></svg>;
    case 'comisiones': // signo % grande
      return <svg {...common}><circle cx="11" cy="11" r="4" /><circle cx="25" cy="25" r="4" /><line x1="9" y1="27" x2="27" y2="9" /></svg>;
    case 'diversificacion': // diagrama de tres círculos solapados
      return <svg {...common}><circle cx="14" cy="14" r="7" /><circle cx="22" cy="14" r="7" /><circle cx="18" cy="22" r="7" /></svg>;
    case 'pignoracion': // escudo (asegurar sin vender)
      return <svg {...common}><path d="M 18 4 L 28 8 L 28 18 Q 28 26 18 32 Q 8 26 8 18 L 8 8 Z" /><path d="M 14 18 L 17 21 L 23 14" /></svg>;
    default:
      // Fallback: rombo abstracto.
      return <svg {...common}><path d="M 18 5 L 31 18 L 18 31 L 5 18 Z" /></svg>;
  }
}
