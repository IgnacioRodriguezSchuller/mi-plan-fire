// Modales y trigger de concepto — extraídos byte-a-byte de
// mi_plan_v1_5_0a_3.html. Etapa 1 · Paso 3 · Tanda 5. Solo se añade
// `export` + imports; mismo JSX, textos y estilos.
//
// NO incluido: SinMiPlanModal (L5600) -> renderiza <ScreenSinMiPlan embedded/>,
// una screen aún no migrada. Pendiente para la tanda de screens.
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { T } from '../tokens/index.js'

// Portal a document.body: los overlays `position:fixed` se rompen si un ANCESTRO tiene
// `transform`/`will-change`/`filter` (p.ej. el `Reveal`, que anima con transform) → el fixed se
// ancla a ese ancestro y se RECORTA dentro del bloque en vez de cubrir el viewport. Renderizar el
// overlay en document.body lo saca de ese contexto. Cero red; SSR-safe (fallback sin document).
function Portal({ children }) {
  if (typeof document === 'undefined' || !document.body) return children;
  return createPortal(children, document.body);
}
import { Btn, Label, EditableNumber, MonthInput } from '../ui/index.jsx'
import { computePlannedFor, todayKey, addMonthsKey, compareKeys, readableMonth, fmtEur, uid } from '../lib/index.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { LEARN_CORPUS, CATEGORY_LABELS } from '../content/index.js'

export function ConfirmModal({ open, title, body, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = false, confirmDisabled = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <Portal>
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 500, padding: 18,
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bg, border: '1px solid ' + T.line, borderRadius: 14,
        padding: 22, maxWidth: 400, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, marginBottom: 10, lineHeight: T.lh.snug }}>{title}</div>
        <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.muted, lineHeight: T.lh.normal, marginBottom: 18 }}>{body}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '10px 18px', borderRadius: 999,
            background: 'transparent', color: T.ink, border: '1px solid ' + T.line,
            cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
          }}>{cancelLabel}</button>
          <button onClick={confirmDisabled ? undefined : onConfirm} disabled={confirmDisabled} style={{
            fontFamily: T.mono, fontSize: T.size.eyebrow, padding: '10px 18px', borderRadius: 999,
            background: destructive ? T.red : T.ink, color: '#fff',
            border: 'none', cursor: confirmDisabled ? 'not-allowed' : 'pointer', opacity: confirmDisabled ? 0.4 : 1,
            letterSpacing: T.tracking.wider, textTransform: 'uppercase', fontWeight: 600,
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
    </Portal>
  );
}


export function ProgressionWizard({ onClose, onApply }) {
  const [data, setData] = useState({
    initial: 2000,
    increment: 200,
    everyMonths: 12,
    cap: 5000,
    from: todayKey(),
    durationMonths: 240, // 20 years horizon by default
    label: 'Salario',
    replace: true,
  });
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const preview = useMemo(() => {
    const tramos = [];
    let amount = data.initial;
    let cursor = data.from;
    const end = addMonthsKey(data.from, data.durationMonths);
    while (compareKeys(cursor, end) < 0 && amount <= data.cap + 1) {
      const next = addMonthsKey(cursor, data.everyMonths);
      const nextAmount = amount + data.increment;
      const to = (nextAmount > data.cap || compareKeys(next, end) >= 0) ? null : addMonthsKey(next, -1);
      tramos.push({
        id: uid(),
        from: cursor,
        to: to,
        amount: Math.min(amount, data.cap),
        label: data.label,
      });
      if (nextAmount > data.cap) break;
      cursor = next;
      amount = nextAmount;
    }
    return tramos;
  }, [data]);

  return (
    <Portal>
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, zIndex: 200,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bg, borderRadius: 14, maxWidth: 540, width: '100%',
        maxHeight: '88vh', overflow: 'auto', padding: 24,
        border: '1px solid ' + T.line, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          position: 'sticky', top: -24, marginTop: -24, marginLeft: -24, marginRight: -24,
          padding: '16px 20px 12px', background: T.bg, borderBottom: '1px solid ' + T.line,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, zIndex: 5,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Label>Asistente</Label>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, letterSpacing: T.tracking.tight, marginTop: 2 }}>Rellenar progresión</div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{
            background: T.ink, color: '#fff', border: 'none', width: 36, height: 36, borderRadius: 999,
            fontSize: T.size.subtitle, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic', marginBottom: 14 }}>
          Genera tramos automáticamente. Después los puedes ajustar a mano.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
          <div>
            <Label style={{ marginBottom: 4 }}>Inicial (€/mes)</Label>
            <input type="number" value={data.initial} onChange={(e) => set('initial', +e.target.value)}
              style={{ fontFamily: T.mono, fontSize: T.size.caption, padding: '7px 8px', width: '100%', background: T.paper, border: '1px solid ' + T.line, borderRadius: 6, color: T.ink, outline: 'none' }} />
          </div>
          <div>
            <Label style={{ marginBottom: 4 }}>Etiqueta</Label>
            <input value={data.label} onChange={(e) => set('label', e.target.value)}
              style={{ fontFamily: T.serif, fontSize: T.size.caption, padding: '7px 8px', width: '100%', background: T.paper, border: '1px solid ' + T.line, borderRadius: 6, color: T.ink, outline: 'none' }} />
          </div>
          <div>
            <Label style={{ marginBottom: 4 }}>Incremento (€)</Label>
            <input type="number" value={data.increment} onChange={(e) => set('increment', +e.target.value)}
              style={{ fontFamily: T.mono, fontSize: T.size.caption, padding: '7px 8px', width: '100%', background: T.paper, border: '1px solid ' + T.line, borderRadius: 6, color: T.ink, outline: 'none' }} />
          </div>
          <div>
            <Label style={{ marginBottom: 4 }}>Cada (meses)</Label>
            <input type="number" value={data.everyMonths} onChange={(e) => set('everyMonths', +e.target.value)}
              style={{ fontFamily: T.mono, fontSize: T.size.caption, padding: '7px 8px', width: '100%', background: T.paper, border: '1px solid ' + T.line, borderRadius: 6, color: T.ink, outline: 'none' }} />
          </div>
          <div>
            <Label style={{ marginBottom: 4 }}>Tope (€)</Label>
            <input type="number" value={data.cap} onChange={(e) => set('cap', +e.target.value)}
              style={{ fontFamily: T.mono, fontSize: T.size.caption, padding: '7px 8px', width: '100%', background: T.paper, border: '1px solid ' + T.line, borderRadius: 6, color: T.ink, outline: 'none' }} />
          </div>
          <div>
            <Label style={{ marginBottom: 4 }}>Desde</Label>
            <MonthInput value={data.from} onChange={(v) => set('from', v)} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <input type="checkbox" checked={data.replace} onChange={(e) => set('replace', e.target.checked)} id="rep" />
          <label htmlFor="rep" style={{ fontFamily: T.serif, fontSize: T.size.caption, color: T.muted }}>
            Sustituir tramos existentes (si no, se añaden a la lista)
          </label>
        </div>

        <div style={{ padding: 12, background: T.panel, border: '1px solid ' + T.line, borderRadius: 8, marginBottom: 14 }}>
          <Label style={{ marginBottom: 8 }}>Vista previa · {preview.length} tramos</Label>
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {preview.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.ink, padding: '4px 8px', background: T.paper, borderRadius: 4 }}>
                <span>{readableMonth(t.from)} → {t.to ? readableMonth(t.to) : '∞'}</span>
                <strong style={{ color: T.accent }}>{fmtEur(t.amount)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={onClose}>Cancelar</Btn>
          <Btn variant="accent" size="sm" onClick={() => { onApply(preview, data.replace); onClose(); }}>
            Aplicar {preview.length} tramos
          </Btn>
        </div>
      </div>
    </div>
    </Portal>
  );
}


export function WhyDifferentModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  const mobile = useIsMobile();
  const Block = ({ children }) => (
    <div style={{ paddingTop: 18, borderTop: '1px dashed ' + T.lineSoft }}>
      <div style={{ fontFamily: T.serif, fontSize: T.size.body, lineHeight: T.lh.relaxed, color: T.ink }}>{children}</div>
    </div>
  );
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.62)',
      zIndex: 1200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '32px 16px', overflowY: 'auto',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bg, maxWidth: 640, width: '100%',
        borderRadius: 14, padding: mobile ? 26 : 40,
        fontFamily: T.serif, color: T.ink,
        boxShadow: '0 24px 60px rgba(26,22,18,0.3)',
        position: 'relative',
      }}>
        <button onClick={onClose} aria-label="Cerrar"
          style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, padding: 8, letterSpacing: T.tracking.wider }}>
          ✕ CERRAR
        </button>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 30 : 36, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight, color: T.ink, marginBottom: 22 }}>
          <em style={{ color: T.accent }}>Mi Plan FIRE</em> · qué es esto
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Block>
            Mi Plan FIRE educa sobre categorías de producto (fondos indexados, ETFs, planes de pensiones, robo-advisors) y menciona índices (MSCI World, S&P 500, etc.). No menciona gestoras concretas, brokers ni productos por nombre comercial. No emite recomendaciones personalizadas en el sentido del artículo 140 LMV / MiFID II. Te damos el mapa; el destino lo eliges tú.
          </Block>
        </div>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid ' + T.lineSoft, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Btn variant="primary" size="md" onClick={onClose}>Entendido, vamos →</Btn>
        </div>
      </div>
    </div>
  );
}


export function MonthlyCalendarModal({ grouped, plan, setMonth, addMonths, ensureMonth, update, onClose, inline = false }) {
  const [activeKey, setActiveKey] = useState(null);
  useEffect(() => {
    if (inline) return;  // inline: vive en el flujo de la página, sin lock de scroll ni captura global de Escape
    const onKey = (e) => { if (e.key === 'Escape') { if (activeKey) setActiveKey(null); else onClose(); } };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, activeKey, inline]);

  // Re-derivar el mes activo desde grouped (siempre fresco tras updates).
  const activeMonth = activeKey ? grouped.flatMap(([_, ms]) => ms).find(m => m.key === activeKey) : null;

  // Rango de años a renderizar. Usamos los años existentes en grouped y, si no
  // hay nada, el año actual como fallback.
  const yearsRange = useMemo(() => {
    if (grouped.length) return grouped.map(([y]) => +y);
    return [new Date().getFullYear()];
  }, [grouped]);

  const body = (
      <div onClick={(e) => e.stopPropagation()} style={inline ? {
        background: T.bg, width: '100%',
        borderRadius: 14, padding: 'clamp(20px, 3vw, 30px)',
        fontFamily: T.serif, color: T.ink,
        border: '1px solid ' + T.line,
        position: 'relative',
      } : {
        background: T.bg, maxWidth: 760, width: '100%',
        borderRadius: 14, padding: 'clamp(22px, 4vw, 36px)',
        fontFamily: T.serif, color: T.ink,
        boxShadow: '0 24px 60px rgba(26,22,18,0.3)',
        position: 'relative',
      }}>
        {!inline && (
          <button onClick={onClose} aria-label="Cerrar"
            style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, padding: 8, letterSpacing: T.tracking.wider }}>
            ✕ CERRAR
          </button>
        )}
        <Label>Calendario completo</Label>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight, marginTop: 4, marginBottom: 18 }}>
          Tu año en aportaciones.
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, background: T.green, borderRadius: 4 }} />En el plan o por encima
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, background: T.amber, borderRadius: 4 }} />Por debajo del plan
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, background: T.panel, border: '1px dashed ' + T.line, borderRadius: 4 }} />Sin datos · clic para crear
          </span>
        </div>
        {yearsRange.map((year) => {
          const ms = (grouped.find(([y]) => +y === year) || [null, []])[1];
          const cells = [];
          for (let i = 0; i < 12; i++) {
            const m = ms.find(x => x.monthIndex === i);
            cells.push({ idx: i, month: m });
          }
          return (
            <div key={year} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.muted, letterSpacing: T.tracking.tight }}>{year}</div>
                <div style={{ flex: 1, height: 1, background: T.line }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(78px, 1fr))', gap: 8 }}>
                {cells.map(({ idx, month }) => {
                  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                  const planned = month ? computePlannedFor(plan, month.key) : 0;
                  const actual = month && month.actual != null ? month.actual : null;
                  let bg, color, border;
                  if (!month || actual == null) {
                    bg = T.panel; color = T.faint; border = '1px dashed ' + T.line;
                  } else if (actual >= planned) {
                    bg = 'rgba(21,128,61,0.18)'; color = T.green; border = '1px solid ' + T.green;
                  } else {
                    bg = 'rgba(180,83,9,0.14)'; color = T.amber; border = '1px solid ' + T.amber;
                  }
                  const onCellClick = () => {
                    if (month) { setActiveKey(month.key); return; }
                    const key = ensureMonth(year, idx);
                    setActiveKey(key);
                  };
                  return (
                    <button key={idx} onClick={onCellClick}
                      style={{
                        background: bg, border, borderRadius: 8, padding: '10px 8px',
                        textAlign: 'center', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
                        fontFamily: T.serif,
                      }}>
                      <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color }}>{monthNames[idx]}</span>
                      <span style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.lead, color: T.ink, letterSpacing: T.tracking.tight }}>
                        {actual != null ? fmtEur(actual) : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {activeMonth && (
          <div style={{ marginTop: 18, padding: '16px 18px', background: T.panel, border: '1px solid ' + T.line, borderRadius: 10 }}>
            <Label>Detalle · {activeMonth.label.replace('.', '')}</Label>
            <div style={{ display: 'flex', gap: 22, marginTop: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>Plan</div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: T.ink, letterSpacing: T.tracking.tight }}>{fmtEur(computePlannedFor(plan, activeMonth.key))}</div>
              </div>
              <div>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, color: T.muted, letterSpacing: 0 }}>Real</div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, color: activeMonth.actual != null ? T.accent : T.faint, letterSpacing: T.tracking.tight }}>
                  <EditableNumber
                    value={activeMonth.actual != null ? activeMonth.actual : 0}
                    onChange={(v) => setMonth(activeMonth.key, { actual: v })}
                    min={0} max={1000000} step={10} color={T.accent} />
                  <span style={{ fontFamily: T.mono, fontSize: T.size.caption, color: T.faint, marginLeft: 4 }}>€</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {activeMonth.actual != null && (
                <Btn variant="ghost" size="sm" onClick={() => setMonth(activeMonth.key, { actual: null })}>Borrar registro</Btn>
              )}
              <Btn variant="ghost" size="sm" onClick={() => setActiveKey(null)}>Cerrar detalle</Btn>
            </div>
            {activeMonth.note && (
              <div style={{ marginTop: 10, fontFamily: T.serif, fontSize: T.size.caption, color: T.muted, fontStyle: 'italic', lineHeight: T.lh.normal }}>
                {activeMonth.note}
              </div>
            )}
          </div>
        )}

        {/* Botones añadir meses dentro del modal */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed ' + T.line, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: T.faint }}>Añadir periodos</span>
          <Btn variant="ghost" size="sm" onClick={() => addMonths(6)}>+ 6 meses</Btn>
          <Btn variant="ghost" size="sm" onClick={() => addMonths(12)}>+ 1 año</Btn>
        </div>
      </div>
  );
  return inline ? body : (
    <Portal>
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.55)',
      zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 16px', overflowY: 'auto',
    }}>
      {body}
    </div>
    </Portal>
  );
}


export function PublicPensionDisclaimerModal({ open, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <Portal>
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 16px', overflowY: 'auto',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.bg, border: '1px solid ' + T.line, borderRadius: 14,
          padding: 28, maxWidth: 560, width: '100%', margin: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayMd, letterSpacing: T.tracking.tight, lineHeight: T.lh.snug, marginBottom: 8, color: T.ink }}>
          Activar pensión pública
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.body, color: T.muted, marginBottom: 18, lineHeight: T.lh.normal }}>
          Antes de incluirla en tu plan, lee esto.
        </div>
        <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.relaxed, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
          <p style={{ margin: 0 }}>
            La pensión pública española opera bajo sistema de reparto: las cotizaciones actuales pagan las pensiones actuales. La proporción de cotizantes por pensionista lleva una década cayendo y los informes oficiales prevén que siga cayendo durante las próximas tres décadas.
          </p>
          <p style={{ margin: 0 }}>
            Eso no significa que el sistema vaya a colapsar mañana. Sí significa que las pensiones futuras pueden mantener cuantía nominal pero perder poder adquisitivo, endurecer requisitos, o ver modificada la fórmula de cálculo. Las reformas de 2011, 2013, 2021 y 2023 ya han modificado la fórmula varias veces.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ fontStyle: 'normal' }}>Mi Plan FIRE recomienda planificar tu independencia financiera sin contar con la pensión pública</strong>, y considerarla como ingreso adicional cuando llegue, no como pilar del plan. Si decides incluirla en tu proyección, hazlo sabiendo que es la variable más incierta de tu plan a 30 años.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Btn variant="ghost" size="md" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="amber" size="md" onClick={onConfirm}>Activar de todas formas</Btn>
        </div>
      </div>
    </div>
    </Portal>
  );
}


export function Concept({ id, children, inline = true }) {
  const [open, setOpen] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const ref = useRef(null);
  // All hooks must run unconditionally, before any early return,
  // so that hook order stays stable across renders (Rules of Hooks).
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
    };
  }, [open]);

  const concept = LEARN_CORPUS[id];
  if (!concept) return <span>{children}</span>;

  return (
    <span ref={ref} style={{ position: 'relative', display: inline ? 'inline' : 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          color: 'inherit',
          font: 'inherit',
          cursor: 'pointer',
          borderBottom: '1px dashed ' + T.accent,
          paddingBottom: 1,
          textDecoration: 'none',
        }}>
        {children}
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            zIndex: 200,
            width: 320,
            maxWidth: 'calc(100vw - 40px)',
            background: T.paper,
            border: '1px solid ' + T.line,
            borderRadius: 10,
            padding: '14px 16px',
            boxShadow: '0 12px 28px rgba(26,22,18,0.18)',
            fontFamily: T.serif,
            fontSize: T.size.body,
            lineHeight: T.lh.normal,
            color: T.ink,
            textAlign: 'left',
            cursor: 'auto',
          }}>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: T.faint, marginBottom: 6 }}>
            {concept.title}
          </div>
          <div style={{ marginBottom: 12 }}>{concept.tooltip}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderTop: '1px solid ' + T.lineSoft, paddingTop: 10 }}>
            <button
              onClick={() => { setOpen(false); setShowArticle(true); }}
              style={{
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0,
                color: T.accent,
              }}>
              Saber más →
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0,
                color: T.faint,
              }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
      {showArticle && <ConceptModal id={id} onClose={() => setShowArticle(false)} />}
    </span>
  );
}


export function ConceptModal({ id, onClose, read = false, onToggleRead }) {
  // Hooks first, then guard (Rules of Hooks).
  const [activeRelated, setActiveRelated] = useState(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const concept = LEARN_CORPUS[id];
  if (!concept) return null;
  const article = concept.article;
  return (
    <Portal>
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', overflowY: 'auto',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.paper, maxWidth: 720, width: '100%',
          borderRadius: 14, padding: 'clamp(28px, 5vw, 56px)',
          fontFamily: T.serif, color: T.ink,
          boxShadow: '0 24px 60px rgba(26,22,18,0.3)',
          position: 'relative',
        }}>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wider,
            color: T.faint, padding: 8,
          }}>
          ✕ CERRAR
        </button>

        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: T.faint, marginBottom: 12 }}>
          {CATEGORY_LABELS[concept.category] || concept.category}
        </div>

        {article ? (
          <>
            <h1 style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayXl, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, margin: 0, color: T.ink }}>
              {article.heading}
            </h1>
            <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.muted, marginTop: 6, fontStyle: 'italic' }}>
              {concept.title}
            </div>

            {article.lesson && (
              <div style={{ marginTop: 28, padding: '14px 20px', borderLeft: '3px solid ' + T.accent, background: T.accentSoft, borderRadius: '0 6px 6px 0' }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: T.accent, marginBottom: 8 }}>
                  Lección clave
                </div>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.lead, lineHeight: T.lh.snug, color: T.ink, fontStyle: 'italic' }}>
                  "{article.lesson}"
                </div>
              </div>
            )}

            <div style={{ marginTop: 28, fontSize: T.size.lead, lineHeight: T.lh.relaxed, color: T.ink }}>
              {article.body.split('\n\n').map((para, i) => {
                if (para.startsWith('**') && para.endsWith('**')) {
                  return <h3 key={i} style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.subtitle, marginTop: 28, marginBottom: 4, color: T.ink, fontStyle: 'normal' }}>{para.replace(/\*\*/g, '')}</h3>;
                }
                return <p key={i} style={{ margin: '0 0 16px' }} dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') }} />;
              })}
            </div>

            {article.rule && (
              <div style={{ marginTop: 24, padding: '14px 20px', borderLeft: '3px solid ' + T.muted, background: 'rgba(110,98,83,0.06)', borderRadius: '0 6px 6px 0' }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: T.muted, marginBottom: 6 }}>
                  Regla
                </div>
                <div style={{ fontFamily: T.serif, fontSize: T.size.lead, lineHeight: T.lh.normal, color: T.ink, fontStyle: 'italic' }}>
                  {article.rule}
                </div>
              </div>
            )}

            {article.warning && (
              <div style={{ marginTop: 16, padding: '14px 20px', borderLeft: '3px solid ' + T.amber, background: 'rgba(180,83,9,0.06)', borderRadius: '0 6px 6px 0' }}>
                <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: T.amber, marginBottom: 6 }}>
                  Aviso
                </div>
                <div style={{ fontFamily: T.serif, fontSize: T.size.body, lineHeight: T.lh.normal, color: T.ink }}>
                  {article.warning}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: T.size.displayXl, lineHeight: T.lh.tight, letterSpacing: T.tracking.display, margin: 0, color: T.ink }}>
              {concept.title}
            </h1>
            <div style={{ marginTop: 24, fontSize: T.size.lead, lineHeight: T.lh.relaxed, color: T.ink, whiteSpace: 'pre-line' }}>
              {concept.glossary}
            </div>
          </>
        )}

        {concept.seeAlso && concept.seeAlso.length > 0 && (
          <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid ' + T.lineSoft }}>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: T.faint, marginBottom: 12 }}>
              Ver también
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {concept.seeAlso.map(sid => {
                const sc = LEARN_CORPUS[sid];
                if (!sc) return null;
                return (
                  <button
                    key={sid}
                    onClick={() => setActiveRelated(sid)}
                    style={{
                      background: T.bg, border: '1px solid ' + T.line, borderRadius: 6,
                      padding: '8px 12px', cursor: 'pointer',
                      fontFamily: T.serif, fontSize: T.size.body, color: T.ink,
                    }}>
                    {sc.title} →
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Marcar/desmarcar como leído · control EXPLÍCITO (persistente en plan.readLessons).
            Verde sólido = leído; contorno = sin leer. Común a artículo y glosario. */}
        {onToggleRead && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid ' + T.lineSoft }}>
            <button onClick={onToggleRead} aria-pressed={read}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase',
                padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                background: read ? T.green : 'transparent',
                color: read ? T.bg : T.muted,
                border: '1px solid ' + (read ? T.green : T.line),
                appearance: 'none', WebkitAppearance: 'none',
              }}>
              {read ? '✓ Leído' : 'Marcar como leído'}
            </button>
          </div>
        )}
        <div style={{ marginTop: onToggleRead ? 18 : 32, paddingTop: onToggleRead ? 0 : 20, borderTop: onToggleRead ? 'none' : '1px solid ' + T.lineSoft, fontFamily: T.mono, fontSize: T.size.eyebrow, lineHeight: T.lh.relaxed, color: T.faint }}>
          Contenido educativo. No es asesoramiento financiero ni de inversión.
        </div>
      </div>

      {activeRelated && <ConceptModal id={activeRelated} onClose={() => setActiveRelated(null)} />}
    </div>
    </Portal>
  );
}


// Portales de donación (KDP-style placeholder, configurable). Vacío → «próximamente»;
// con URL → enlace activo. Cero red: es un <a href>, no fetch. Pega aquí tus URLs reales.
export const DONATE_KOFI_URL = '';      // p.ej. 'https://ko-fi.com/miplanfire'
export const DONATE_GITHUB_URL = '';    // p.ej. 'https://github.com/sponsors/IgnacioRodriguezSchuller'

export function AboutModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  const mobile = useIsMobile();
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(26,22,18,0.62)',
      zIndex: 1200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '32px 16px', overflowY: 'auto',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.bg, maxWidth: 560, width: '100%',
        borderRadius: 14, padding: mobile ? 26 : 36,
        fontFamily: T.serif, color: T.ink,
        boxShadow: '0 24px 60px rgba(26,22,18,0.3)',
        position: 'relative',
      }}>
        <button onClick={onClose} aria-label="Cerrar"
          style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, padding: 8, letterSpacing: T.tracking.wider }}>
          ✕ CERRAR
        </button>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 28 : 34, letterSpacing: T.tracking.tight, lineHeight: T.lh.tight, color: T.ink, marginBottom: 6 }}>
          <em style={{ color: T.accent }}>Mi Plan FIRE</em>
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: T.faint, marginBottom: 22 }}>
          Planificador FIRE honesto, libre y local
        </div>
        {(() => {
          const para = { fontFamily: T.serif, fontSize: T.size.body, color: T.muted, lineHeight: T.lh.relaxed, marginBottom: 14 };
          const strong = { color: T.ink, fontStyle: 'normal' };
          return (
            <>
              <div style={para}>
                Una herramienta para ver, <strong style={strong}>sin promesas</strong>, hacia dónde te lleva lo que ahorras: proyección a 30 años, Monte Carlo, tu número FIRE, diagnóstico, rebalanceo, comparador de escenarios y vista de hogar. <strong style={strong}>Todo incluido</strong> — no hay versión de pago ni funciones bloqueadas.
              </div>
              <div style={para}>
                Funciona <strong style={strong}>entera en tu navegador</strong>. Tus datos no salen de tu dispositivo: sin cuenta, sin nube, sin seguimiento, sin anuncios. Cuando borras, se borra. Puedes exportarlos cuando quieras.
              </div>
              <div style={{ ...para, marginBottom: 24 }}>
                Es <strong style={strong}>software libre y gratuito</strong> (AGPL-3.0). No es asesoramiento financiero ni garantiza rentabilidades: es una calculadora honesta, las matemáticas las pones tú.
              </div>
            </>
          );
        })()}
        {/* Donaciones · enlaces (cero red). Vacío → «próximamente». */}
        <div style={{ paddingTop: 20, borderTop: '1px solid ' + T.lineSoft }}>
          <div style={{ fontFamily: T.serif, fontSize: T.size.body, color: T.ink, lineHeight: T.lh.normal, marginBottom: 14 }}>
            Mantenerlo y mejorarlo lleva tiempo. Si te resulta útil y quieres echar una mano:
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { url: DONATE_KOFI_URL, label: 'Invítame a un café' },
              { url: DONATE_GITHUB_URL, label: 'Patrocina en GitHub' },
            ].map((d) => (
              d.url
                ? <a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', padding: '10px 16px', borderRadius: 999, background: T.ink, color: T.bg, textDecoration: 'none', whiteSpace: 'nowrap' }}>{d.label} →</a>
                : <span key={d.label}
                    style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', padding: '10px 16px', borderRadius: 999, border: '1px solid ' + T.line, color: T.faint, whiteSpace: 'nowrap' }}>{d.label} · próximamente</span>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px dashed ' + T.lineSoft, fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.widest, textTransform: 'uppercase' }}>
          agpl-3.0 · código en github (próximamente)
        </div>
      </div>
    </div>
  );
}
