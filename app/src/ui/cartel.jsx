// Sistema «Cartel» (póster editorial) · Fase 1 · sección Proyección.
// Componentes y hooks reutilizables según HANDOFF-proyeccion-cartel.md. Paleta intacta
// (tokens T.*), Fraunces como display (sin DM Mono en etiquetas), movimiento que respeta
// prefers-reduced-motion. NO se usa fuera de Proyección todavía (Fase 2 propagará).
import { useState, useEffect, useRef } from 'react'
import { T } from '../tokens/index.js'
import { parseSpanishNumber } from './index.jsx'

// Tinte claro de accent SOLO para el realce de la banda ink (la maqueta usaba #f4a06a, que no
// está en la paleta; lo declaramos aquí como derivado de accent, no como color nuevo suelto).
export const ACCENT_LIGHT = '#f4a06a';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

// ── Formato español ───────────────────────────────────────────────────────────
export function fmtNum(v, decimals = 0) {
  // Agrupación manual de millares con punto (es-ES). toLocaleString('es-ES') no agrupa de
  // forma fiable en todos los motores/ICU, así que lo hacemos a mano: punto millares, coma decimal.
  const n = Number(v) || 0;
  const sign = n < 0 ? '-' : '';
  const fixed = Math.abs(n).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return sign + grouped + (decPart ? ',' + decPart : '');
}
// Cifra grande de dinero (1,25 M € / 612 k € / 7.900 €) — misma convención que la maqueta.
export function fmtMoneyBig(v) {
  const n = Math.round(v);
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2).replace('.', ',') + ' M €';
  if (Math.abs(n) >= 1e4) return Math.round(n / 1e3) + ' k €';
  return fmtNum(n) + ' €';
}

// ── useReveal · IntersectionObserver que RE-dispara en cada pasada de scroll ─────
// root: null (viewport). Funciona aunque el scroll viva en el contenedor del Shell: al
// desplazarse, la posición de los elementos respecto al viewport cambia. reduced-motion →
// siempre visible (sin animación).
export function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (prefersReduced()) { setInView(true); return; }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.intersectionRatio > threshold) setInView(true);
        else if (e.intersectionRatio === 0) setInView(false);
      });
    }, { threshold: [0, threshold] });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// Envoltorio que aparece (fade + translate) al revelarse; vuelve a animar al reentrar.
export function Reveal({ children, delay = 0, style = {} }) {
  const [ref, inView] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : 'translateY(28px)',
      transition: `opacity .85s ease ${delay}ms, transform .85s cubic-bezier(.2,.8,.2,1) ${delay}ms`,
      willChange: 'opacity, transform',
      ...style,
    }}>{children}</div>
  );
}

// ── ComputedNumber · resultado calculado (NO editable); count-up al revelarse ────
export function ComputedNumber({ value, format = fmtMoneyBig, duration = 1400, style = {}, as = 'div', ariaLabel }) {
  const [ref, inView] = useReveal();
  const [shown, setShown] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!inView) { setShown(0); return; }
    if (prefersReduced()) { setShown(value); return; }
    let start = null;
    const step = (ts) => {
      if (start == null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(value * e);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [inView, value, duration]);
  const Tag = as;
  return (
    <Tag ref={ref} aria-label={ariaLabel} style={{
      opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(28px)',
      transition: 'opacity .85s ease, transform .85s cubic-bezier(.2,.8,.2,1)',
      ...style,
    }}>{format(shown)}</Tag>
  );
}

// ── EditableValue · número que pone el usuario; subrayado punteado + lápiz ───────
// Input autoancho (accesible, foco visible). Al confirmar → parsea (es-ES), clampa, onChange.
const PencilIcon = ({ size = '0.55em' }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ width: size, height: size, marginLeft: '0.14em', verticalAlign: '0.04em', color: T.accent, opacity: 0.7, flexShrink: 0 }}>
    <path d="M4 16 L14 6 L18 10 L8 20 L4 20 Z" />
  </svg>
);

export function EditableValue({ value, onChange, min, max, decimals = 0, suffix = '', big = false, ariaLabel }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const display = fmtNum(value, decimals);
  useEffect(() => { if (!editing) setDraft(display); }, [display, editing]);
  const commit = () => {
    setEditing(false);
    const n = parseSpanishNumber(draft);
    if (!isNaN(n)) onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n)));
  };
  const shown = editing ? draft : display;
  const width = `${Math.max(1, shown.length) + 0.6}ch`;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap', color: T.ink }}>
      <input
        type="text" inputMode="decimal" value={shown} aria-label={ariaLabel} spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => { setEditing(true); setDraft(display); e.target.select(); }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setDraft(display); e.target.blur(); } }}
        style={{
          width, font: 'inherit', color: T.accent, background: 'transparent',
          border: 'none', borderBottom: (big ? '3px' : '2px') + ' dashed ' + T.accent,
          textAlign: 'center', outline: 'none', padding: '0 0.12em', borderRadius: 2,
          appearance: 'none', WebkitAppearance: 'none',
        }}
      />
      {suffix ? <span style={{ marginLeft: '0.18em' }}>{suffix}</span> : null}
      <PencilIcon size={big ? '0.42em' : '0.55em'} />
    </span>
  );
}

// ── SectionTag · etiqueta cursiva serif en accent (sustituye a la eyebrow mono) ──
export function SectionTag({ children, style = {} }) {
  return (
    <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 'clamp(18px, 2vw, 21px)', color: T.accent, letterSpacing: '0', ...style }}>
      {children}
    </div>
  );
}

// ── Spread · sección centrada a (casi) pantalla completa, aire generoso ──────────
export function Spread({ children, short = false, style = {} }) {
  return (
    <section style={{
      minHeight: short ? '72vh' : '88vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', gap: 0, padding: '6vh 0', ...style,
    }}>{children}</section>
  );
}

// ── PosterFrame · encuadre persistente que hugea la columna de contenido ─────────
// fixed; vertical inset (top deja sitio al nav); horizontal centrado hugando ~max+40.
export function PosterFrame({ top = 78, maxWidth = 760 }) {
  const corner = (pos) => ({
    position: 'absolute', width: 13, height: 13, border: '1px solid ' + T.ink, ...pos,
  });
  return (
    <div aria-hidden="true" style={{
      position: 'fixed', top, bottom: 18, zIndex: 1, pointerEvents: 'none',
      left: `max(16px, calc((100% - ${maxWidth}px) / 2))`,
      right: `max(16px, calc((100% - ${maxWidth}px) / 2))`,
      border: '1px solid rgba(26,22,18,.28)',
    }}>
      <i style={corner({ top: -1, left: -1, borderRight: 0, borderBottom: 0 })} />
      <i style={corner({ top: -1, right: -1, borderLeft: 0, borderBottom: 0 })} />
      <i style={corner({ bottom: -1, left: -1, borderRight: 0, borderTop: 0 })} />
      <i style={corner({ bottom: -1, right: -1, borderLeft: 0, borderTop: 0 })} />
    </div>
  );
}

// ── LineIcon · iconos de línea (viewBox 36, stroke 1.6) según el handoff ─────────
const ICONS = {
  'interes-compuesto': <><path d="M5 30 Q18 30 24 18 T31 5" /><circle cx="31" cy="5" r="1.8" fill="currentColor" /></>,
  'retorno-anual': <><path d="M18 30 L18 8" /><path d="M11 15 L18 8 L25 15" /></>,
  'tasa-retiro': <><path d="M18 8 L18 28" /><path d="M11 21 L18 28 L25 21" /></>,
  'inflacion': <><circle cx="10" cy="14" r="5" /><circle cx="19" cy="21" r="4" /><circle cx="27" cy="26" r="3" /></>,
  'horizonte': <><path d="M10 6 L26 6" /><path d="M10 30 L26 30" /><path d="M10 6 Q10 12 18 18 Q26 24 26 30" /><path d="M26 6 Q26 12 18 18 Q10 24 10 30" /></>,
  'patrimonio': <><rect x="6" y="10" width="24" height="18" rx="2" /><line x1="6" y1="16" x2="30" y2="16" /><path d="M24 22 h3" /></>,
  'esperanza-vida': <path d="M11 6 H25 M11 30 H25 M12 6 Q12 16 18 18 Q24 16 24 6 M12 30 Q12 20 18 18 Q24 20 24 30" />,
  'pension': <><path d="M8 30 V14 L18 8 L28 14 V30" /><line x1="6" y1="30" x2="30" y2="30" /></>,
  'montecarlo-fan': <><path d="M5 30 Q18 25 31 6" /><path d="M5 30 Q18 28 31 15" /><path d="M5 30 Q18 30 31 25" /></>,
};
export function LineIcon({ id, size = 44, color, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" stroke={color || 'currentColor'}
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }} aria-hidden="true">
      {ICONS[id] || <path d="M18 5 L31 18 L18 31 L5 18 Z" />}
    </svg>
  );
}

// ── HeroCurve · curva que cruza el umbral; se dibuja al revelarse ────────────────
// numberLabel = "tu número · 1,24 M €"; freeAge = edad de cruce (texto en el punto).
export function HeroCurve({ numberLabel, freeAge, style = {} }) {
  const [ref, inView] = useReveal(0.25);
  const pathRef = useRef(null);
  const [len, setLen] = useState(0);
  useEffect(() => { try { if (pathRef.current) setLen(pathRef.current.getTotalLength()); } catch (e) { /* jsdom */ } }, []);
  const drawn = prefersReduced() ? true : inView;
  return (
    <svg ref={ref} viewBox="0 0 560 240" style={{ width: 'min(560px, 82vw)', height: 'auto', display: 'block', margin: '0 auto', ...style }}>
      <line x1="20" y1="96" x2="540" y2="96" stroke={T.line} strokeWidth="1" strokeDasharray="5 6" />
      <text x="22" y="88" fontFamily={T.serif} fontStyle="italic" fontSize="15" fill={T.faint}>{numberLabel}</text>
      <path ref={pathRef} d="M20 222 C 200 218, 320 200, 380 138 C 440 78, 480 50, 540 30" fill="none" stroke={T.accent} strokeWidth="3"
        style={{ strokeDasharray: len || undefined, strokeDashoffset: drawn ? 0 : (len || 0), transition: 'stroke-dashoffset 2.1s cubic-bezier(.4,0,.1,1)' }} />
      <circle cx="20" cy="222" r="6" fill={T.ink} />
      <text x="34" y="226" fontFamily={T.serif} fontStyle="italic" fontSize="15" fill={T.ink}>hoy</text>
      <circle cx="392" cy="96" r="7" fill={T.accent} />
      <text x="406" y="86" fontFamily={T.serif} fontStyle="italic" fontSize="16" fill={T.accent}>libre · {freeAge}</text>
    </svg>
  );
}

// ── MonteCarloBand · banda ink + icono abanico + 3 estadísticos ──────────────────
export function MonteCarloBand({ survivors, lifeExp, p10, p50, p90 }) {
  const stat = (label, value, color) => (
    <Reveal style={{ flex: '1 1 0', minWidth: 120 }}>
      <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 'clamp(30px, 5vw, 56px)', letterSpacing: '-.03em', lineHeight: 0.9, color }}>{value}</div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, color: 'rgba(255,253,247,.72)', marginTop: 10 }}>{label}</div>
    </Reveal>
  );
  return (
    <Reveal style={{ width: '100%' }}>
      <div style={{ background: T.ink, color: T.bg, borderRadius: 18, padding: 'clamp(36px, 8vw, 80px) clamp(28px, 7vw, 72px)' }}>
        <LineIcon id="montecarlo-fan" size={72} color={ACCENT_LIGHT} style={{ margin: '0 auto 14px' }} />
        <h2 style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(30px, 6vw, 72px)', lineHeight: 1, letterSpacing: '-.02em', margin: 0 }}>
          Probamos cien futuros. <b style={{ fontStyle: 'normal', fontWeight: 600, color: ACCENT_LIGHT }}>{survivors} aguantan</b> hasta los {lifeExp}.
        </h2>
        <div style={{ display: 'flex', gap: 'clamp(28px, 5vw, 56px)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'clamp(28px, 6vh, 56px)' }}>
          {stat('el peor 10%', p10, 'rgba(255,253,247,.7)')}
          {stat('mediana', p50, T.bg)}
          {stat('el mejor 10%', p90, ACCENT_LIGHT)}
        </div>
      </div>
    </Reveal>
  );
}
