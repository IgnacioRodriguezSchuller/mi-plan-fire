// Gráficos — extraídos byte-a-byte de mi_plan_v1_5_0a_3.html.
// Etapa 1 · Paso 3 · Tanda 4. Solo se añade `export` + imports; mismo JSX,
// mismos colores, ejes y formato.
//
// ─────────────────────────────────────────────────────────────────────────
// PUENTE TEMPORAL DE COMPATIBILIDAD UMD → ESM (Recharts).
// En el monolito, Recharts se cargaba como UMD y quedaba en `window.Recharts`;
// los gráficos hacen `const R = window.Recharts || {}`. En el build Vite,
// Recharts es un módulo npm (no toca `window`). Para mantener los CUERPOS de
// los gráficos byte-a-byte (siguen leyendo `window.Recharts`), publicamos aquí
// el módulo bajo ese mismo global. Es un puente: cuando se reescriban los
// gráficos para importar Recharts directamente, esta línea se puede borrar sin
// romper nada más.
// ─────────────────────────────────────────────────────────────────────────
import * as Recharts from 'recharts'
import { useMemo } from 'react'
import { T } from '../tokens/index.js'
import {
  fmtEur, toRealEur, todayKey, addMonthsKey, computeIncomeFor, computePlannedFor,
} from '../lib/index.js'
import { Card, Label } from '../ui/index.jsx'

if (typeof window !== 'undefined' && !window.Recharts) {
  window.Recharts = Recharts
}

// Reusable line chart — Recharts wrapper. Keeps old prop shape for back-compat.
export function LineChart({ series, planSeries = null, height = 260, stroke = T.accent, fill = 'rgba(194,65,12,0.10)', planStroke = T.faint, showInvested = false, showAxis = true, milestones = [], onHover }) {
  const R = window.Recharts || {};
  const { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } = R;
  if (!ResponsiveContainer) return <div style={{ height, color: T.muted, fontFamily: T.mono, fontSize: T.size.eyebrow }}>Cargando gráfico…</div>;

  // Build a unified dataset by month index
  const data = series.map((s, i) => {
    const row = {
      monthIndex: i,
      age: s.age,
      year: s.year || (s.age != null ? Math.round(s.age) : i),
      portfolio: s.portfolio,
      invested: s.invested != null ? s.invested : s.aportado,
    };
    if (planSeries && planSeries[i]) row.plan = planSeries[i].portfolio;
    return row;
  });

  // Year tick formatter: show year only at integer year boundaries
  const N = data.length;
  const startAge = series[0]?.age ?? 0;
  const endAge = series[N - 1]?.age ?? startAge + 1;
  const yearSpan = endAge - startAge;
  const yearStep = yearSpan > 25 ? 10 : yearSpan > 10 ? 5 : 2;

  const tickIndices = [];
  for (let a = Math.ceil(startAge); a <= endAge; a += yearStep) {
    const idx = Math.round((a - startAge) / yearSpan * (N - 1));
    tickIndices.push(idx);
  }

  const tooltipFmt = (value, name) => {
    const labels = { portfolio: 'Total', plan: 'Plan inicial', invested: 'Aportado' };
    return [fmtEur(value), labels[name] || name];
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
          <CartesianGrid stroke={T.lineSoft} strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="monthIndex"
            ticks={tickIndices}
            tickFormatter={(v) => {
              const row = data[v]; if (!row) return '';
              return Math.round(row.age) + '';
            }}
            tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
            axisLine={{ stroke: T.line }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtEur}
            tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={tooltipFmt}
            labelFormatter={(v) => {
              const row = data[v]; if (!row) return '';
              return `${Math.round(row.age)} años`;
            }}
            contentStyle={{
              background: T.ink, border: 'none', borderRadius: 6,
              fontFamily: T.mono, fontSize: T.size.eyebrow, color: '#fff',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: T.size.eyebrow, marginBottom: 4 }}
            itemStyle={{ color: '#fff' }}
            cursor={{ stroke: T.ink, strokeWidth: 1, opacity: 0.3 }}
          />
          {milestones.map((m, i) => (
            <ReferenceLine key={i} y={m.value} stroke={m.color || T.green} strokeDasharray="3 3" strokeOpacity={0.7}
              label={{ value: m.label, fill: m.color || T.green, fontFamily: T.mono, fontSize: T.size.eyebrow, position: 'insideTopRight' }} />
          ))}
          {/* Filled area underneath the main line */}
          <Area type="monotone" dataKey="portfolio" stroke="none" fill={fill} isAnimationActive={false} />
          {showInvested && (
            <Line type="monotone" dataKey="invested" stroke={T.faint} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          )}
          {planSeries && (
            <Line type="monotone" dataKey="plan" stroke={planStroke} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          )}
          <Line type="monotone" dataKey="portfolio" stroke={stroke} strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 5, fill: stroke }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Small sparkline (no axes)
export function Sparkline({ series, width = 120, height = 40, stroke = T.accent, fill = 'rgba(194,65,12,0.12)' }) {
  if (!series || series.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...series.map(s => s.portfolio));
  const min = Math.min(...series.map(s => s.portfolio));
  const x = (i) => (i / (series.length - 1)) * width;
  const y = (v) => height - 2 - ((v - min) / (max - min || 1)) * (height - 4);
  const path = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s.portfolio)}`).join(' ');
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={area} fill={fill} />
      <path d={path} stroke={stroke} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ============================================================
// Lifecycle chart — accumulation + decumulation in one view
// X axis: age from current age → lifeExpectancy
// Two visual phases: building (green/accent area) + drawdown (faded area)
// Vertical reference line at retire age
// ============================================================
export function LifecycleChart({ plan, profile, d, realMode, inflRate, height = 280 }) {
  const R = window.Recharts || {};
  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } = R;

  // Build combined series — each row has both `accum` and `decum` fields
  // so Recharts renders them as separate areas with the right color.
  const series = useMemo(() => {
    const accum = d.seriesPlan || [];
    const decum = d.seriesDecum || [];
    const accumYears = profile.retireAge - profile.age;
    const totalMonths = accum.length + Math.max(0, decum.length - 1);
    const out = [];
    // Sample every quarter to keep series light
    const stride = 3;
    for (let i = 0; i < accum.length; i += stride) {
      const p = accum[i];
      const months = i;
      const portfolio = realMode ? toRealEur(p.portfolio, months, inflRate) : p.portfolio;
      out.push({
        monthIndex: months,
        age: profile.age + months / 12,
        accum: portfolio,
        decum: null,
      });
    }
    // Connector point: bridge with both series at retire age
    if (accum.length > 0 && decum.length > 0) {
      const bridgeMonth = accum.length - 1;
      const bridgePortfolio = realMode ? toRealEur(accum[bridgeMonth].portfolio, bridgeMonth, inflRate) : accum[bridgeMonth].portfolio;
      out.push({
        monthIndex: bridgeMonth,
        age: profile.retireAge,
        accum: bridgePortfolio,
        decum: bridgePortfolio,
      });
    }
    // Decumulation phase: months continue from retire
    for (let i = 1; i < decum.length; i += stride) {
      const months = accum.length - 1 + i;
      const portfolio = realMode ? toRealEur(decum[i].portfolio, months, inflRate) : decum[i].portfolio;
      out.push({
        monthIndex: months,
        age: profile.retireAge + i / 12,
        accum: null,
        decum: portfolio,
      });
    }
    return out;
  }, [d.seriesPlan, d.seriesDecum, profile.age, profile.retireAge, realMode, inflRate]);

  if (!ResponsiveContainer || !series.length) return null;

  // X ticks: every 5 or 10 years
  const lifeExp = plan.lifeExpectancy || 90;
  const span = lifeExp - profile.age;
  const step = span > 40 ? 10 : 5;
  const tickAges = [];
  for (let a = Math.ceil(profile.age / step) * step; a <= lifeExp; a += step) {
    tickAges.push(a);
  }
  // Find closest monthIndex for each tick age
  const tickIndices = tickAges.map((a) => {
    const m = Math.round((a - profile.age) * 12);
    // Find nearest point in series
    let best = series[0], bestDiff = Math.abs(series[0].monthIndex - m);
    for (const p of series) {
      const diff = Math.abs(p.monthIndex - m);
      if (diff < bestDiff) { best = p; bestDiff = diff; }
    }
    return best.monthIndex;
  });

  const retireMonthIdx = (profile.retireAge - profile.age) * 12;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={series} margin={{ top: 10, right: 12, left: 0, bottom: 6 }}>
          <defs>
            <linearGradient id="accumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.accent} stopOpacity={0.30} />
              <stop offset="100%" stopColor={T.accent} stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="decumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.muted} stopOpacity={0.22} />
              <stop offset="100%" stopColor={T.muted} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={T.lineSoft} strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="monthIndex"
            ticks={tickIndices}
            tickFormatter={(v) => {
              const row = series.find(s => s.monthIndex === v);
              return row ? Math.round(row.age) + '' : '';
            }}
            tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
            axisLine={{ stroke: T.line }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtEur}
            tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value, name) => {
              if (value == null) return [null, null];
              const labels = { accum: 'Acumulando', decum: 'Retirando' };
              return [fmtEur(value), labels[name] || name];
            }}
            labelFormatter={(v) => {
              const row = series.find(s => s.monthIndex === v);
              return row ? `${Math.round(row.age)} años` : '';
            }}
            contentStyle={{ background: T.ink, border: 'none', borderRadius: 6, fontFamily: T.mono, fontSize: T.size.eyebrow, color: '#fff', padding: '6px 10px' }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: T.size.eyebrow, marginBottom: 4 }}
            itemStyle={{ color: '#fff' }}
          />
          <ReferenceLine
            x={retireMonthIdx}
            stroke={T.accent}
            strokeWidth={1}
            strokeDasharray="4 4"
            label={{
              value: `${profile.retireAge}`,
              position: 'top',
              fill: T.accent,
              fontFamily: T.mono,
              fontSize: T.size.eyebrow,
            }}
          />
          <Area type="monotone" dataKey="accum" stroke={T.accent} strokeWidth={2} fill="url(#accumGrad)" isAnimationActive={false} connectNulls={false} />
          <Area type="monotone" dataKey="decum" stroke={T.muted} strokeWidth={1.6} strokeDasharray="3 3" fill="url(#decumGrad)" isAnimationActive={false} connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// v1.1.1 · Gráfica dual del Movimiento 2: trayectoria del plan del usuario vs
// trayectoria del plan estándar. Renderiza una u dos líneas según perfil:
//   A → sólo línea del plan estándar (no hay plan del usuario que dibujar)
//   B → ambas líneas, estándar destacada al mismo nivel para motivar contraste
//   C → línea del usuario protagonista, estándar como referencia ligera
export function LifecycleChartDual({ userSeries, standardSeries, profile, realMode, inflRate, height = 280 }) {
  const R = window.Recharts || {};
  const { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } = R;

  const data = useMemo(() => {
    // v1.2.1: key por meses enteros (no por age float) para evitar desajustes
    // por floating-point cuando userSeries y standardSeries vienen de proyecciones
    // con orígenes distintos.
    const ageMap = new Map();
    const adjust = (val, ageOffsetMonths) => {
      if (!realMode || !inflRate) return val;
      const yearsFromNow = ageOffsetMonths / 12;
      return val / Math.pow(1 + inflRate / 100, yearsFromNow);
    };
    (userSeries || []).forEach((row, i) => {
      if (row.age == null) return;
      const monthsKey = Math.round(row.age * 12);
      if (!ageMap.has(monthsKey)) ageMap.set(monthsKey, { age: monthsKey / 12 });
      ageMap.get(monthsKey).user = adjust(row.portfolio, i);
    });
    (standardSeries || []).forEach((row, i) => {
      if (row.age == null) return;
      const monthsKey = Math.round(row.age * 12);
      if (!ageMap.has(monthsKey)) ageMap.set(monthsKey, { age: monthsKey / 12 });
      ageMap.get(monthsKey).std = adjust(row.portfolio, i);
    });
    return Array.from(ageMap.values()).sort((a, b) => a.age - b.age);
  }, [userSeries, standardSeries, realMode, inflRate]);

  if (!ResponsiveContainer || data.length === 0) {
    return <div style={{ height, color: T.muted, fontFamily: T.mono, fontSize: T.size.eyebrow }}>Cargando gráfico…</div>;
  }

  const startAge = data[0].age;
  const endAge = data[data.length - 1].age;
  const span = Math.max(0.5, endAge - startAge);
  const tickStep = span > 25 ? 10 : span > 10 ? 5 : span > 4 ? 2 : 1;
  const ticks = [];
  for (let a = Math.ceil(startAge); a <= endAge; a += tickStep) ticks.push(a);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
          <CartesianGrid stroke={T.lineSoft} strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} ticks={ticks}
            tickFormatter={(v) => Math.round(v) + ''}
            tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
            axisLine={{ stroke: T.line }} tickLine={false} />
          <YAxis tickFormatter={fmtEur}
            tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
            axisLine={false} tickLine={false} width={56}
            label={{ value: realMode ? 'Patrimonio (ajustado por inflación)' : 'Patrimonio (€)', angle: -90, position: 'insideLeft', offset: 10, fill: T.muted, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: T.tracking.wide, style: { textAnchor: 'middle' } }} />
          {profile && profile.retireAge && (
            <ReferenceLine x={profile.retireAge} stroke={T.faint} strokeDasharray="4 3"
              label={{ value: 'jubilación', position: 'top', fill: T.muted, fontFamily: T.mono, fontSize: T.size.eyebrow }} />
          )}
          <Tooltip
            formatter={(v, name) => [fmtEur(v), name === 'user' ? 'Tu trayectoria' : 'Plan estándar']}
            labelFormatter={(age) => `${Math.round(age)} años`}
            contentStyle={{ background: T.ink, border: 'none', borderRadius: 6, fontFamily: T.mono, fontSize: T.size.eyebrow, color: '#fff', padding: '8px 12px' }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: T.size.eyebrow, marginBottom: 4 }} />
          {userSeries && userSeries.length > 0 && (
            <Line type="monotone" dataKey="user" stroke={T.accent} strokeWidth={2} dot={false}
              isAnimationActive={false} activeDot={{ r: 4, fill: T.accent }} />
          )}
          {standardSeries && standardSeries.length > 0 && (
            <Line type="monotone" dataKey="std"
              stroke={userSeries && userSeries.length > 0 ? T.faint : T.accent}
              strokeWidth={userSeries && userSeries.length > 0 ? 1.5 : 2}
              strokeDasharray={userSeries && userSeries.length > 0 ? '4 4' : '0'}
              dot={false} isAnimationActive={false} activeDot={{ r: 3.5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiLineChart({ scenarios, height = 320, onHover }) {
  const R = window.Recharts || {};
  const { ResponsiveContainer, LineChart: RLC, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } = R;
  if (!ResponsiveContainer) return <div style={{ height, color: T.muted, fontFamily: T.mono, fontSize: T.size.eyebrow }}>Cargando gráfico…</div>;

  // Build rows aligned by age (month precision) so scenarios with different
  // starting ages stay visually aligned on the X axis.
  const ageMap = new Map();
  scenarios.forEach((sc, k) => {
    (sc.series || []).forEach((row) => {
      if (row.age == null) return;
      const ageKey = Math.round(row.age * 12) / 12; // 1-month precision
      if (!ageMap.has(ageKey)) ageMap.set(ageKey, { age: ageKey });
      ageMap.get(ageKey)['s' + k] = row.portfolio;
    });
  });
  const data = Array.from(ageMap.values()).sort((a, b) => a.age - b.age);
  const startAge = data.length ? data[0].age : 0;
  const endAge = data.length ? data[data.length - 1].age : startAge + 1;
  const span = Math.max(0.5, endAge - startAge);
  const tickStep = span > 25 ? 10 : span > 10 ? 5 : span > 4 ? 2 : 1;
  const ticks = [];
  for (let a = Math.ceil(startAge); a <= endAge; a += tickStep) ticks.push(a);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RLC data={data} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
          <CartesianGrid stroke={T.lineSoft} strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="age"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={ticks}
            tickFormatter={(v) => Math.round(v) + ''}
            tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
            axisLine={{ stroke: T.line }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtEur}
            tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value, name) => {
              const i = parseInt(name.replace('s', ''), 10);
              return [fmtEur(value), scenarios[i]?.label || name];
            }}
            labelFormatter={(age) => `${Math.round(age)} años`}
            contentStyle={{ background: T.ink, border: 'none', borderRadius: 6, fontFamily: T.mono, fontSize: T.size.eyebrow, color: '#fff', padding: '8px 12px' }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: T.size.eyebrow, marginBottom: 4 }}
            itemStyle={{ color: '#fff' }}
            cursor={{ stroke: T.ink, strokeWidth: 1, opacity: 0.3 }}
          />
          {scenarios.map((sc, k) => (
            <Line key={k} type="monotone" dataKey={'s' + k} stroke={sc.color} strokeWidth={sc.bold ? 2 : 1.5}
              strokeDasharray={sc.dashed ? '4 4' : '0'}
              dot={false} isAnimationActive={false} connectNulls={false}
              activeDot={{ r: sc.bold ? 5 : 3.5, fill: sc.color }} />
          ))}
        </RLC>
      </ResponsiveContainer>
    </div>
  );
}

export function FlowTimelineCard({ plan, profile, maxYears, compact }) {
  // Stack inversión + vives along the years. Si maxYears se especifica, sólo
  // se proyecta hasta ese horizonte desde hoy (no hasta retireAge).
  const series = useMemo(() => {
    const out = [];
    const startKey = todayKey();
    const fullMonths = Math.max(0, Math.round((profile.retireAge - profile.age) * 12));
    const months = maxYears != null ? Math.min(fullMonths, maxYears * 12) : fullMonths;
    for (let m = 0; m <= months; m += 3) {
      const key = addMonthsKey(startKey, m);
      const income = computeIncomeFor(plan, key);
      const invest = computePlannedFor(plan, key);
      const life = Math.max(0, income - invest);
      out.push({
        monthIndex: m,
        age: profile.age + m / 12,
        income, invest, life,
      });
    }
    return out;
  }, [plan.incomeSegments, plan.bonusSegments, plan.savingSegments, profile.age, profile.retireAge, maxYears]);

  const R = window.Recharts || {};
  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = R;

  if (!series.length || series.every(s => s.income === 0)) return null;
  if (!ResponsiveContainer) return null;

  const startAge = profile.age;
  const endAge = profile.retireAge;
  const span = endAge - startAge;
  const step = span > 25 ? 10 : span > 10 ? 5 : 2;
  const tickIndices = [];
  for (let a = Math.ceil(startAge); a <= endAge; a += step) {
    const idx = Math.round((a - startAge) / span * (series.length - 1));
    tickIndices.push(idx);
  }

  // Final-month aggregate for header context
  const last = series[series.length - 1];
  const first = series[0];
  const lifetimeInvest = series.reduce((s, p) => s + p.invest, 0) * 3; // *3 because quarterly samples
  const lifetimeIncome = series.reduce((s, p) => s + p.income, 0) * 3;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <div>
          <Label>Cómo se reparte tu ingreso</Label>
          <div style={{ fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: T.size.body, marginTop: 6, lineHeight: T.lh.normal }}>
            En {Math.round(span)} años invertirás unos <strong style={{ color: T.green, fontStyle: 'normal' }}>{fmtEur(lifetimeInvest)}</strong>, de un ingreso total de {fmtEur(lifetimeIncome)}.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, fontFamily: T.serif, fontStyle: 'italic', fontSize: T.size.caption, color: T.muted, letterSpacing: 0, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: T.green, display: 'inline-block' }}></span>
          Inversión
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: T.panel, border: '1px solid ' + T.line, display: 'inline-block' }}></span>
          Para vivir
        </span>
      </div>

      <div style={{ width: '100%', height: compact ? 160 : 200 }}>
        <ResponsiveContainer>
          <AreaChart data={series} margin={{ top: 6, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid stroke={T.lineSoft} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="monthIndex"
              ticks={tickIndices}
              tickFormatter={(v) => {
                const row = series.find(s => s.monthIndex === v);
                return row ? Math.round(row.age) + '' : '';
              }}
              tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
              axisLine={{ stroke: T.line }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtEur}
              tick={{ fill: T.faint, fontFamily: T.mono, fontSize: T.size.eyebrow, letterSpacing: '0.04em' }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              formatter={(value, name) => {
                const labels = { invest: 'Inversión', life: 'Para vivir' };
                return [fmtEur(value), labels[name] || name];
              }}
              labelFormatter={(v) => {
                const row = series.find(s => s.monthIndex === v);
                return row ? `${Math.round(row.age)} años · ${fmtEur(row.income)}/mes` : '';
              }}
              // B6 · Tooltip rows reflect vertical position of the stack: invest
              // sits on top in the chart, so it appears first in the tooltip.
              itemSorter={(item) => item && item.dataKey === 'invest' ? 0 : 1}
              contentStyle={{ background: T.ink, border: 'none', borderRadius: 6, fontFamily: T.mono, fontSize: T.size.caption, color: '#fff', padding: '6px 10px' }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: T.size.eyebrow, marginBottom: 4 }}
              itemStyle={{ color: '#fff' }}
            />
            <defs>
              <linearGradient id="reparto-invest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.58} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0.14} />
              </linearGradient>
              <linearGradient id="reparto-life" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.panel} stopOpacity={0.85} />
                <stop offset="100%" stopColor={T.panel} stopOpacity={0.42} />
              </linearGradient>
            </defs>
            {/* Reparto · inversión a la BASE (verde con degradado, anclada a 0) + "para vivir"
                encima como banda beige suave (T.panel, visible pero ligera). Curva monotone (suave).
                Antes: life a la base (masa beige pesada) + invest flotando arriba en tira fina (feo). */}
            <Area type="monotone" dataKey="invest" stackId="1" stroke={T.green} strokeWidth={2.5} fill="url(#reparto-invest)" isAnimationActive={false} />
            <Area type="monotone" dataKey="life" stackId="1" stroke={T.line} strokeWidth={1} fill="url(#reparto-life)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
