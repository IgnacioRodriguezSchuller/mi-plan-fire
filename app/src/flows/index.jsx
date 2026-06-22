// Flujos de entrada — extraídos byte-a-byte de mi_plan_v1_5_0a_3.html.
// Etapa 1 · Paso 3 · Tanda 6. Solo se añade `export` + imports; mismo JSX,
// textos y estilos.
//
// Movidos (prop-driven, sin state): LandingPreOnboarding (L3844), Landing (L3974).
// NO movidos (importan useStore directamente; pendientes para la tanda de state):
//   Onboarding (L4122) -> useStore() update/seedDemo
//   ActualLifeOnboarding (L7680) -> useStore() state/mutatePlan
import { useState, useEffect, useRef } from 'react'
import { T } from '../tokens/index.js'
import { Btn } from '../ui/index.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { DONATE_KOFI_URL, DONATE_GITHUB_URL } from '../modals/index.jsx'

// Iconos de línea propios para los 3 principios — mismo trazo que LearnIcon
// (viewBox 0 0 36 36, stroke 1.6, fill none, caps redondos). Sin librería de
// iconos (formas inspiradas en lock/map/arrow-right de Lucide, reescritas a mano).
const principleIconProps = { width: 30, height: 30, viewBox: '0 0 36 36', fill: 'none', stroke: T.accent, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
function IconLock() {
  return (
    <svg {...principleIconProps}>
      <rect x="9" y="16" width="18" height="13" rx="2" />
      <path d="M 13 16 v -3 a 5 5 0 0 1 10 0 v 3" />
      <path d="M 18 21 v 3.5" />
    </svg>
  );
}
function IconMap() {
  return (
    <svg {...principleIconProps}>
      <path d="M 6 9 l 8 -3 l 8 3 l 8 -3 v 21 l -8 3 l -8 -3 l -8 3 Z" />
      <path d="M 14 6 v 21" />
      <path d="M 22 9 v 21" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg {...principleIconProps}>
      <path d="M 5 18 H 29" />
      <path d="M 22 11 L 29 18 L 22 25" />
    </svg>
  );
}

export function LandingPreOnboarding({ onStart, onOpenManifesto, mode = 'intro', onBack, onLoadDemo, returning = false, onEnter }) {
  const mobile = useIsMobile();
  return (
    <div style={{
      width: '100vw', minHeight: '100vh', background: T.bg, color: T.ink,
      fontFamily: T.serif,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: mobile ? '40px 22px' : '60px 80px',
      overflowX: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: mobile ? 28 : 36 }}>
        {/* Title */}
        <div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 'clamp(40px, 12vw, 56px)' : 72, letterSpacing: T.tracking.display, lineHeight: 1, color: T.ink }}>
            Mi <em style={{ color: T.accent }}>Plan</em> <span style={{ color: T.accent }}>FIRE</span>
          </div>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: mobile ? 15 : 17, color: T.muted, marginTop: 10, lineHeight: T.lh.normal }}>
            Independencia Financiera, Retiro Temprano
          </div>
        </div>

        {/* Prose · un solo párrafo (las otras dos ideas pasan a los principios) */}
        <div style={{ fontFamily: T.serif, fontSize: mobile ? 15 : 16, lineHeight: T.lh.relaxed, color: T.ink }}>
          <p style={{ margin: 0 }}>
            Una herramienta para planificar tu camino hacia la independencia financiera. Te ayuda a ver cuánto necesitas, en cuánto tiempo, y qué decisiones mueven más esas cifras.
          </p>
        </div>

        {/* Principios · icono de línea + palabra, 3 columnas (icono T.accent,
            palabra mono versales T.muted). Sustituye a los 3 bullets en prosa. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: mobile ? 12 : 24, paddingTop: 18, borderTop: '1px solid ' + T.lineSoft }}>
          {[
            { icon: <IconLock />, label: 'Privacidad' },
            { icon: <IconMap />, label: 'Educación' },
            { icon: <IconArrowRight />, label: 'Sin rodeos' },
          ].map((p) => (
            <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
              {p.icon}
              <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.eyebrow, letterSpacing: 0, color: T.muted }}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* CTAs · 'intro' shows both buttons; 'revisit' shows just "Volver". */}
        <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 12, paddingTop: 4 }}>
          {mode === 'revisit' ? (
            <Btn variant="primary" size="lg" onClick={onBack}>← Volver</Btn>
          ) : returning ? (
            <Btn variant="accent" size="lg" onClick={onEnter}>Entrar →</Btn>
          ) : (
            <>
              <Btn variant="accent" size="lg" onClick={onStart}>Empezar →</Btn>
            </>
          )}
        </div>
        {/* Acceso a la demo · solo para visitantes nuevos (un usuario con datos no debe poder
            sobrescribirlos por error desde aquí; la demo sigue en Datos con confirmación). */}
        {mode !== 'revisit' && !returning && onLoadDemo && (
          <button onClick={onLoadDemo} style={{
            fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, background: 'transparent',
            border: 'none', cursor: 'pointer', letterSpacing: T.tracking.wide, textTransform: 'uppercase',
            padding: '4px 0', alignSelf: 'flex-start',
          }}>¿Prefieres curiosear? Ver una demo →</button>
        )}
      </div>
    </div>
  );
}


export function Landing({ onStart, onLoadDemo, onClose, mode = 'intro' }) {
  const mobile = useIsMobile();
  const isView = mode === 'view';
  // Donaciones · viven DENTRO de la presentación, en una tarjeta dedicada (#13). Cero red: SVG
  // inline + enlaces <a href>. Así el onboarding no expone donaciones «directo» (ítem 2 anterior).
  const donations = [{ url: DONATE_KOFI_URL, label: 'Invítame a un café' }, { url: DONATE_GITHUB_URL, label: 'Patrocina en GitHub' }];
  return (
    <div style={{
      width: '100vw', height: '100vh', background: T.bg, color: T.ink,
      fontFamily: T.serif, display: 'flex', flexDirection: 'column',
      padding: mobile ? '24px 22px' : '44px 72px',
      overflow: 'hidden', boxSizing: 'border-box', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mobile ? 24 : 40 }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 26 : 30, letterSpacing: T.tracking.tight }}>
          Mi <em style={{ color: T.accent }}>Plan</em>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 8 : 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* #T3 · Café · tarjeta prominente JUNTO A LA CRUZ (presentación). Cero red: <a href> + SVG. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 7 : 10, padding: mobile ? '6px 8px 6px 11px' : '7px 10px 7px 15px', background: T.paper, border: '1.5px solid ' + T.accent, borderRadius: 999, flexShrink: 0 }}>
            <svg width={mobile ? 19 : 22} height={mobile ? 19 : 22} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M4 9h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" />
              <path d="M17 10h2.2a2.3 2.3 0 0 1 0 4.6H17" />
              <path d="M7.5 3.4c-.5.7-.5 1.3 0 2M11 3.4c-.5.7-.5 1.3 0 2" />
            </svg>
            {!mobile && <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 15, color: T.ink, whiteSpace: 'nowrap' }}>Invítame a un café</span>}
            {(mobile ? donations.slice(0, 1) : donations).map((dn) => { const short = dn.label.includes('GitHub') ? 'GitHub' : 'Ko-fi'; return dn.url ? (
              <a key={dn.label} href={dn.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.bg, background: T.accent, textDecoration: 'none', padding: '6px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{short} →</a>
            ) : (
              <span key={dn.label} style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, textTransform: 'uppercase', color: T.faint, padding: '6px 10px', border: '1px solid ' + T.lineSoft, borderRadius: 999, whiteSpace: 'nowrap' }}>{short} · pronto</span>
            ); })}
          </div>
          {isView ? (
            <button onClick={onClose} aria-label="Cerrar" style={{
              background: T.ink, color: T.bg, border: 'none', width: 38, height: 38, borderRadius: 999,
              fontSize: T.size.subtitle, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}>×</button>
          ) : (
            <button onClick={onLoadDemo} style={{
              fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.muted, background: 'transparent',
              border: 'none', cursor: 'pointer', letterSpacing: T.tracking.wider, textTransform: 'uppercase',
              padding: 8,
            }}>Saltar · demo</button>
          )}
        </div>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: mobile ? 'clamp(14px, 3vh, 24px)' : 'clamp(26px, 5vh, 48px)', maxWidth: 760 }}>
        <div style={{
          fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 'clamp(33px, 9.5vw, 50px)' : 'clamp(44px, 5vw, 76px)',
          lineHeight: T.lh.tight, letterSpacing: T.tracking.display, textWrap: 'balance',
        }}>
          Tu dinero,<br />
          a treinta años<br />
          <em style={{ color: T.accent, fontStyle: 'italic' }}>vista.</em>
        </div>
        <div style={{
          fontFamily: T.serif, fontStyle: 'italic', color: T.muted,
          fontSize: mobile ? 15 : 18, marginTop: mobile ? 12 : 18, lineHeight: T.lh.normal, maxWidth: 560,
        }}>
          Una herramienta honesta para ver hacia dónde te lleva lo que ahorras hoy.
          Sin promesas. Sin asesoramiento. Solo matemáticas, las tuyas, en tu dispositivo.
        </div>
      </div>

      {/* Three principles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
        gap: mobile ? 'clamp(10px, 2vh, 16px)' : 22,
        marginBottom: mobile ? 'clamp(14px, 3vh, 24px)' : 'clamp(20px, 4vh, 40px)',
      }}>
        {[
          { n: '01', t: 'Tu vida real', d: 'Modelas tu salario por tramos, los pluses, las pausas. No un sueldo plano de fantasía.' },
          { n: '02', t: 'Escenarios sin miedo', d: 'Prueba qué pasa si compras un piso o cambias de trabajo. Sin tocar tu plan real.' },
          { n: '03', t: 'Tuyo', d: 'Todo en local. Sin cuenta, sin nube, sin perfilado. Cuando borras, se borra.' },
        ].map((p) => (
          <div key={p.n} style={{ borderTop: '1px solid ' + T.line, paddingTop: mobile ? 10 : 14 }}>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.widest, marginBottom: mobile ? 4 : 6 }}>
              {p.n}
            </div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontOpticalSizing: 'auto', fontSize: mobile ? 19 : 24, letterSpacing: T.tracking.tight, marginBottom: mobile ? 5 : 8 }}>
              {p.t}
            </div>
            <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, lineHeight: T.lh.normal }}>
              {p.d}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        marginTop: 'auto',
        display: 'flex', flexDirection: 'column', gap: 14,
        alignItems: mobile ? 'stretch' : 'flex-start',
      }}>
        {isView ? (
          <>
            <button onClick={onClose} style={{
              fontFamily: T.mono, fontSize: T.size.caption, padding: '14px 26px',
              background: 'transparent', color: T.ink, border: '1px solid ' + T.ink, borderRadius: 999,
              cursor: 'pointer', letterSpacing: T.tracking.widest, textTransform: 'uppercase',
              alignSelf: mobile ? 'stretch' : 'flex-start',
            }}>← Volver a mi plan</button>
          </>
        ) : (
          <>
            <button onClick={onStart} style={{
              fontFamily: T.mono, fontSize: T.size.caption, padding: '16px 28px',
              background: T.ink, color: T.bg, border: 'none', borderRadius: 999,
              cursor: 'pointer', letterSpacing: T.tracking.widest, textTransform: 'uppercase',
              alignSelf: mobile ? 'stretch' : 'flex-start',
            }}>Empezar mi plan →</button>
            <div style={{ fontFamily: T.mono, fontSize: T.size.eyebrow, color: T.faint, letterSpacing: T.tracking.wider }}>
              Tarda unos 90 segundos. Puedes cambiar todo después.
            </div>
          </>
        )}
      </div>

    </div>
  );
}

