// Tokens del sistema de diseño — extraídos byte-a-byte de
// mi_plan_v1_5_0a_3.html (WEB_URL: L91 · T: L94-144).
// Etapa 1 · Paso 3 · Tanda 1. Los valores DEBEN coincidir con el baseline;
// el verificador (scripts/verify-tokens.mjs) lo comprueba valor-a-valor.

// ---------- Constants ----------
export const WEB_URL = 'https://miplanfire.com';

// ---------- Tokens ----------
export const T = {
  bg: '#f5f0e6',
  paper: '#fffdf7',
  panel: '#ebe4d5',
  ink: '#1a1612',
  muted: '#6e6253',
  faint: '#968874',
  line: '#d4c9b0',
  lineSoft: '#e0d6bf',
  inputBg: '#faf3e4', // v1.2 doctrina · P3 inputs
  accent: '#c2410c',
  accentSoft: 'rgba(194,65,12,0.08)',
  green: '#15803d',
  greenSoft: 'rgba(21,128,61,0.10)',
  amber: '#b45309',
  red: '#b91c1c',
  ink2: '#0f0f10',
  // Serif única del producto. display = registro de titulares/cifras (peso 600
  // en uso), serif = prosa (peso 400). Misma familia (Fraunces) → las cifras
  // hero y los números inline comparten formas. Instrument Serif jubilada (v1.5.0).
  display: "'Fraunces', Georgia, serif",
  serif: "'Fraunces', Georgia, serif",
  mono: 'DM Mono, monospace',
  sans: 'Inter, system-ui, sans-serif',
};

// v1.3.0 · Sistema tipográfico tokenizado. Tres ejes (size, lineHeight,
// letterSpacing). Suelo absoluto: 11px sólo en mono uppercase; serif/sans
// mínimo 13px. Ver CHANGELOG_v1_3_0.md y AUDITORIA_VISUAL_v1_3_0.md.
T.size = {
  eyebrow:    11, // SOLO mono uppercase. Suelo absoluto.
  caption:    13, // Caption serif/sans, helper text, metadatos.
  body:       15, // Texto base de lectura.
  lead:       17, // Texto destacado, intro de sección.
  subtitle:   22, // Subtítulo, números secundarios (KPIs medianos).
  displayMd:  'clamp(24px, 3vw, 32px)',  // Header de movimiento, KPI grande
  displayLg:  'clamp(28px, 4vw, 44px)',  // "Hola, {nombre}"
  displayXl:  'clamp(34px, 5vw, 52px)',  // Onboarding heroes
  displayXxl: 'clamp(40px, 6vw, 64px)',  // Landing hero
};
T.lh = {
  tight:   1.15, // Títulos display, números hero
  snug:    1.3,  // Subtítulos, cifras medianas
  normal:  1.5,  // Prosa de lectura (default)
  relaxed: 1.6,  // Prosa larga (artículos, manifiesto)
};
T.tracking = {
  display:  '-0.02em', // Display tipografía
  tight:    '-0.01em', // Headers medianos
  normal:   '0',       // Default
  wide:     '0.08em',  // Mono labels suaves
  wider:    '0.12em',  // Mono labels (eyebrows, caps)
  widest:   '0.16em',  // Mono labels muy espaciados
};
