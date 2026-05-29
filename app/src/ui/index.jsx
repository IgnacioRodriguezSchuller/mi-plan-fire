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

// Editable number that looks like text (used inline in sentences)
export function EditableNumber({ value, onChange, min, max, step = 1, suffix = '', width, color = T.accent, big = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { if (!editing) setDraft(String(value)); }, [value, editing]);
  const commit = () => {
    setEditing(false);
    const n = parseFloat(draft.replace(',', '.'));
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
        <span style={{ fontFamily: T.display, fontSize: T.size.subtitle, color: accent, letterSpacing: T.tracking.tight, lineHeight: 1 }}>{display}</span>
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
      background: T.paper, border: '1px solid ' + T.line, borderRadius: 14,
      padding: finalPad, position: 'relative',
      ...style, minWidth: 0, overflow: 'hidden',
    }}>{children}</div>
  );
}

export function Label({ children, style = {} }) {
  return (
    <div style={{
      fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.widest,
      textTransform: 'uppercase', color: T.muted, ...style,
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
      <div style={{ fontFamily: T.display, fontSize: T.size.displayLg, letterSpacing: T.tracking.display, lineHeight: 1, color: bad ? T.red : good ? T.green : muted ? T.faint : T.ink }}>{value}</div>
    </div>
  );
}

export function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px dashed ' + T.lineSoft, paddingBottom: 8 }}>
      <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.muted }}>{label}</span>
      <span style={{ fontFamily: T.display, fontSize: T.size.subtitle, color: T.ink }}>{children}</span>
    </div>
  );
}

// Row + optional italic warning beneath. Used in Ajustes for out-of-range hints.
export function RowWithWarning({ label, warning, children }) {
  return (
    <div style={{ borderBottom: '1px dashed ' + T.lineSoft, paddingBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider, textTransform: 'uppercase', color: T.muted }}>{label}</span>
        <span style={{ fontFamily: T.display, fontSize: T.size.subtitle, color: T.ink }}>{children}</span>
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
      <div style={{ fontFamily: T.display, fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, color: good ? T.green : bad ? T.amber : accent ? T.accent : T.ink, lineHeight: T.lh.tight, wordBreak: 'break-word' }}>{value}</div>
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
