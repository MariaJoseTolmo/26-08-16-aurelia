import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import svgPaths from "../imports/DashboardInspecciones-1/svg-t645lbzayh";
import loginSvgPaths from "../imports/IniciarSesion/svg-ndjuuzpcf4";
import loginBg from "../imports/IniciarSesion/bfd3dc358adbb21dd7586fbf69208bce777f25fa.png";

// ── Colores exactos del Figma ────────────────────────────────────────────
const F = {
  navy:        "#002659",
  navyEnd:     "#004a3a",
  header:      "#012659",
  teal:        "#00B398",
  gold:        "#c8a064",
  cerradas:    "#27677c",   // area chart
  abiertas:    "#d87b40",   // area chart
  cerradasEmp: "#1f6f8b",   // company chart
  abiertasEmp: "#e07838",   // company chart
  gray:        "#f7f7f7",
  border:      "#e3e3e3",
  text:        "#131313",
  textMid:     "#646464",
  red:         "#c4365a",
  tableHeader: "#001e39",
  tableDiv:    "#122e47",
};

// ── Sidebar logo isotipo ─────────────────────────────────────────────────
function LogoIsotipo() {
  const ps = [
    svgPaths.p25e65900, svgPaths.p37d9ee00, svgPaths.p3fd03040, svgPaths.p127b47f2,
    svgPaths.p4631180,  svgPaths.p28e4c980, svgPaths.p27096680, svgPaths.p356acc00,
    svgPaths.p2154a300, svgPaths.p27d1ac80, svgPaths.p355749f0, svgPaths.p61e52c0,
    svgPaths.p16f28f00, svgPaths.pdff6600,  svgPaths.pf6ef100,  svgPaths.p3c4e1af0,
    svgPaths.p159c7c80, svgPaths.p2897c540, svgPaths.p25eb0c00, svgPaths.p2148f880,
    svgPaths.p1e965700, svgPaths.p3b520680, svgPaths.p17d5f200, svgPaths.pd42c200,
    svgPaths.p1c48f900, svgPaths.p1e5d400,  svgPaths.p259cd580,
  ];
  return (
    <svg viewBox="0 0 30 30" width={30} height={30} fill="none" style={{ flexShrink: 0 }}>
      {ps.map((d, i) => d && <path key={i} d={d} fill="white" />)}
    </svg>
  );
}

// ── Icono SVG genérico ───────────────────────────────────────────────────
function Icon({ d, color = "white", opacity = 1, w = 17, h = 13 }: {
  d: string; color?: string; opacity?: number; w?: number; h?: number;
}) {
  if (!d) return null;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} fill="none" style={{ flexShrink: 0, display: "block" }}>
      <path d={d} fill={color} fillOpacity={opacity} />
    </svg>
  );
}

// ── KPI card (estilo exacto del Figma: accent bar 3px, icon, label, valor, subtítulo) ─
interface KpiDef {
  label: string; value: string; subtitle: React.ReactNode;
  accent: string; iconPath: string; iconColor: string; height?: number;
}

function KpiCard({ def }: { def: KpiDef }) {
  const h = def.height ?? 106;
  return (
    <div className="relative flex-1 min-w-[130px] bg-white rounded-lg overflow-hidden flex flex-col"
      style={{ height: h, border: `1px solid ${F.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      {/* Accent bar */}
      <div className="absolute" style={{ left: 1, top: 1, bottom: 1, width: 3, background: def.accent, borderRadius: 1 }} />
      <div className="flex flex-col items-start p-[15px] w-full h-full overflow-hidden">
        {/* Icon + label */}
        <div className="relative flex items-center mb-0" style={{ height: 13 }}>
          <svg viewBox="0 0 12.5 10" width={12.5} height={10} fill="none" style={{ flexShrink: 0 }}>
            <path d={def.iconPath} fill={def.iconColor} />
          </svg>
          <span className="absolute" style={{ left: 12.5, fontSize: 10, fontWeight: 600, color: F.textMid, letterSpacing: "0.4px", textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: "13px", top: 0.5 }}>
            {" "}{def.label}
          </span>
        </div>
        {/* Value */}
        <p style={{ fontSize: 26, fontWeight: 700, color: F.text, lineHeight: "26px", marginTop: 6, marginBottom: 0 }}>{def.value}</p>
        {/* Subtitle */}
        <p style={{ fontSize: 11, color: F.textMid, marginTop: 5 }}>{def.subtitle}</p>
      </div>
    </div>
  );
}

// ── Main KPI section data (del Figma exacto) ─────────────────────────────
const kpiMain: KpiDef[] = [
  {
    label: "Inspecciones 2026", value: "430",
    subtitle: <><span style={{ fontWeight: 700, color: "#24588b" }}>3.594</span>{" hallazgos del año"}</>,
    accent: "#001e39", iconColor: "#001E39", iconPath: svgPaths.p1711cfc0,
  },
  {
    label: "Cerradas", value: "400", subtitle: "93,02% del total",
    accent: "#6cc24a", iconColor: "#6CC24A", iconPath: svgPaths.p2acec00,
  },
  {
    label: "Abiertas", value: "30", subtitle: "pendientes de cierre",
    accent: "#463100", iconColor: "#F9A411", iconPath: svgPaths.p162f2a3a,
  },
  {
    label: "Hallazgos", value: "3.594", subtitle: "hallazgos registrados",
    accent: "#00b398", iconColor: "#00B398", iconPath: svgPaths.p31927d00,
  },
  {
    label: "% Cierre del año", value: "93,02%", subtitle: "meta >99%",
    accent: "#c8a064", iconColor: "#C8A064", iconPath: svgPaths.p12a2ea00,
  },
  {
    label: "% Cierre histórico", value: "99,32%", subtitle: "referencia 2023–2026",
    accent: "#24588b", iconColor: "#1F6F8B", iconPath: svgPaths.p347ba580,
  },
];

// ── Company KPI section data ──────────────────────────────────────────────
const kpiCompany: KpiDef[] = [
  {
    label: "Empresas con obs. abiertas", value: "8", subtitle: "EECC en seguimiento",
    accent: "#c8a064", iconColor: "#C8A064", iconPath: svgPaths.p3e906a80, height: 93,
  },
  {
    label: "Observaciones abiertas", value: "55", subtitle: "pendientes de cierre",
    accent: "#463100", iconColor: "#F9A411", iconPath: svgPaths.p31927d00, height: 93,
  },
  {
    label: "Inspecciones abiertas", value: "11", subtitle: "con obs. sin cerrar",
    accent: "#001e39", iconColor: "#001E39", iconPath: svgPaths.p1711cfc0, height: 93,
  },
  {
    label: "Días abierto (máx · prom)", value: "18 · 9,7", subtitle: "urgencia de cierre",
    accent: "#463100", iconColor: "#BD3B5B", iconPath: svgPaths.p162f2a3a, height: 93,
  },
];

// ── Chart data (proporcional a píxeles del Figma) ─────────────────────────
const annualData = [
  { año: "2023", Cerradas: 312, Abiertas: 11 },
  { año: "2024", Cerradas: 348, Abiertas: 16 },
  { año: "2025", Cerradas: 378, Abiertas: 24 },
  { año: "2026", Cerradas: 400, Abiertas: 30 },
];
const obsData = [
  { mes: "Ene", Cerradas: 580, Abiertas: 44 },
  { mes: "Feb", Cerradas: 621, Abiertas: 38 },
  { mes: "Mar", Cerradas: 598, Abiertas: 52 },
  { mes: "Abr", Cerradas: 672, Abiertas: 41 },
  { mes: "May", Cerradas: 643, Abiertas: 49 },
];
const evolucionData = [
  { mes: "Ene", Cerradas: 820, Abiertas: 115 },
  { mes: "Feb", Cerradas: 845, Abiertas: 102 },
  { mes: "Mar", Cerradas: 790, Abiertas: 128 },
  { mes: "Abr", Cerradas: 880, Abiertas: 93  },
  { mes: "May", Cerradas: 915, Abiertas: 88  },
];
const areaData = [
  { area: "Planta Procesos",      Cerradas: 1400, Abiertas: 18 },
  { area: "Sustaining",           Cerradas: 428,  Abiertas: 22 },
  { area: "Gerencia Operaciones", Cerradas: 300,  Abiertas: 15 },
  { area: "Medio Ambiente",       Cerradas: 210,  Abiertas: 28 },
  { area: "Gestión Activos",      Cerradas: 165,  Abiertas: 12 },
  { area: "IT",                   Cerradas: 42,   Abiertas: 5  },
];
// Company chart: values derived from Figma pixel widths (861px = 30 units)
const companyData = [
  { empresa: "ICV",          Cerradas: 28, Abiertas: 14 },
  { empresa: "AGGREKO",      Cerradas: 24, Abiertas: 13 },
  { empresa: "SOMACOR",      Cerradas: 18, Abiertas: 9  },
  { empresa: "AKD",          Cerradas: 11, Abiertas: 5  },
  { empresa: "GARDE CORPS",  Cerradas: 9,  Abiertas: 4  },
  { empresa: "FAST MODULAR", Cerradas: 8,  Abiertas: 4  },
  { empresa: "GOLD FIELDS",  Cerradas: 7,  Abiertas: 3  },
  { empresa: "RESITER",      Cerradas: 6,  Abiertas: 3  },
];
const tableRows = [
  { n: 357, empresa: "SOMACOR",      area: "Planta Procesos",     dias: 18, obs: 1,  critical: true  },
  { n: 364, empresa: "SOMACOR",      area: "Planta Procesos",     dias: 17, obs: 8,  critical: true  },
  { n: 360, empresa: "GARDE CORPS",  area: "Servicios Generales", dias: 16, obs: 1,  critical: true  },
  { n: 376, empresa: "GOLD FIELDS",  area: "Servicios Generales", dias: 11, obs: 3,  critical: false },
  { n: 269, empresa: "RESITER",      area: "Servicios Generales", dias: 9,  obs: 3,  critical: false },
  { n: 390, empresa: "GARDE CORPS",  area: "Medio Ambiente",      dias: 8,  obs: 3,  critical: false },
  { n: 392, empresa: "AKD",          area: "Mina",                dias: 8,  obs: 5,  critical: false },
  { n: 393, empresa: "ICV",          area: "Mina",                dias: 8,  obs: 7,  critical: false },
  { n: 395, empresa: "AGGREKO",      area: "Planta Procesos",     dias: 4,  obs: 13, critical: false },
  { n: 396, empresa: "FAST MODULAR", area: "Suministros",         dias: 4,  obs: 3,  critical: false },
  { n: 398, empresa: "ICV",          area: "Mina",                dias: 2,  obs: 4,  critical: false },
];

// ── Sidebar nav modules ───────────────────────────────────────────────────
const sidebarModules = [
  { d: svgPaths.p310aa500, label: "Incidentes"            },
  { d: svgPaths.p2dc9ff00, label: "SPR"                   },
  { d: svgPaths.p3302000,  label: "Impuesto verde"        },
  { d: svgPaths.p1662c880, label: "Residuos"              },
  { d: svgPaths.p2ba27780, label: "Controles críticos"    },
  { d: svgPaths.p36b36200, label: "Monitoreo de agua"     },
  { d: svgPaths.pa12e800,  label: "Material particulado"  },
  { d: svgPaths.p3deddd80, label: "Meteorológico"         },
  { d: svgPaths.p7073000,  label: "Sustancias peligrosas" },
  { d: svgPaths.p2d335200, label: "Gestión del cambio"    },
  { d: svgPaths.p11153a00, label: "Catastro de agua"      },
  { d: svgPaths.p28d9e680, label: "Incumplimientos"       },
  { d: svgPaths.p1a049cf2, label: "Workflow contratos"    },
];

// ── Shared: card wrapper ──────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="bg-white rounded-lg w-full" style={{ border: `1px solid ${F.border}`, boxShadow: "0 1px 1.5px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

// ── Shared: tooltip ───────────────────────────────────────────────────────
const tt = { fontSize: 11, borderRadius: 6, borderColor: F.border };

// ── Shared: chart legend ──────────────────────────────────────────────────
function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex items-center justify-center gap-5 pt-2">
      {items.map(({ color, label }) => (
        <span key={label} className="flex items-center gap-2" style={{ fontSize: 12, color: F.textMid }}>
          <span style={{ width: 14, height: 14, borderRadius: 2, background: color, flexShrink: 0, display: "inline-block" }} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar() {
  return (
    <aside className="flex flex-col h-screen shrink-0 overflow-hidden"
      style={{ width: 220, background: `linear-gradient(to bottom, ${F.navy}, ${F.navyEnd})` }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0 px-4"
        style={{ height: 56, background: F.header, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <LogoIsotipo />
        <span style={{ fontSize: 9.4, letterSpacing: "2.35px", textTransform: "uppercase", color: "#6e87a7", fontFamily: "Inter, sans-serif" }}>
          AUREL<span style={{ color: F.gold }}>IA</span>
        </span>
      </div>

      {/* Nav scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-1">
        <div className="px-2.5 pt-2">

          {/* Módulos label */}
          <div className="flex items-center gap-1.5 px-1 pt-2.5 pb-1">
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.08px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Módulos</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Dashboard (inactive) */}
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[7px]">
            <Icon d={svgPaths.p21fc2800} w={17} h={13} color="white" opacity={0.38} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>Dashboard</span>
          </div>

          {/* Inspecciones (active) */}
          <div className="rounded-[7px]" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <Icon d={svgPaths.p3116fa00} w={18} h={14} color={F.teal} opacity={1} />
              <span className="flex-1" style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>Inspecciones</span>
              <svg viewBox="0 0 12.5 10" width={12} height={10} fill="none" style={{ transform: "rotate(90deg)", opacity: 0.4 }}>
                <path d={svgPaths.p254ca000} fill="white" fillOpacity={0.4} />
              </svg>
            </div>
            {/* Active sub-item: Dashboard */}
            <div className="flex items-center pl-[38px] pr-2.5 py-1.5 rounded-[6px]"
              style={{ background: "rgba(0,179,152,0.09)" }}>
              <div style={{ width: 2.5, height: 13, background: F.teal, borderRadius: 2, flexShrink: 0 }} />
              <div style={{ width: 4, height: 4, background: F.teal, borderRadius: 2, flexShrink: 0, marginLeft: 7 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: F.teal, marginLeft: 7 }}>Dashboard</span>
            </div>
            {/* Sub-items */}
            {["Gestión de inspecciones", "Historial"].map((l) => (
              <div key={l} className="flex items-center gap-1.5 pl-[38px] pr-2.5 py-1.5">
                <div style={{ width: 4, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.44)" }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Rest of modules */}
          {sidebarModules.map((m) => (
            <div key={m.label} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[7px]">
              <Icon d={m.d} w={17} h={13} color="white" opacity={0.38} />
              <span className="flex-1 truncate" style={{ fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>{m.label}</span>
              <span style={{ fontSize: 8.5, fontWeight: 600, color: "rgba(255,255,255,0.32)", background: "rgba(255,255,255,0.07)", padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>Próximo</span>
            </div>
          ))}

          {/* Configuración general */}
          <div className="flex items-center gap-1.5 px-1 pt-2.5 pb-1 mt-1">
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.08px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Configuración general</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[7px]">
            <Icon d={svgPaths.p38e16350} w={17} h={13} color="white" opacity={0.38} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>Configuración</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-2.5 pt-2 pb-2.5"
        style={{ background: "rgba(0,38,89,0.6)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Notificaciones */}
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-1.5">
            <Icon d={svgPaths.p37698970} w={13.75} h={11} color="white" opacity={0.28} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>Notificaciones</span>
          </div>
          <div className="flex items-center justify-center" style={{ width: 16, height: 16, background: F.red, borderRadius: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>7</span>
          </div>
        </div>
        {/* Idioma */}
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <div className="flex items-center gap-1.5">
            <Icon d={svgPaths.pd684400} w={13.75} h={11} color="white" opacity={0.28} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>Idioma</span>
          </div>
          <div className="flex overflow-hidden" style={{ height: 18, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20 }}>
            <span className="flex items-center px-2" style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>EN</span>
            <span className="flex items-center px-2" style={{ fontSize: 10, fontWeight: 700, color: "white", background: F.teal }}>ES</span>
          </div>
        </div>
        {/* Usuario */}
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, background: F.gold, borderRadius: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#001e39" }}>KO</span>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Karen Opazo S.</p>
            <div className="flex items-center gap-1">
              <Icon d={svgPaths.p17be400} w={10} h={8} color="white" opacity={0.32} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>Admin GF HSE</span>
            </div>
          </div>
          <Icon d={svgPaths.paecc880} w={13.75} h={11} color="white" opacity={0.2} />
        </div>
      </div>
    </aside>
  );
}

// ── Header ────────────────────────────────────────────────────────────────
function Header() {
  return (
    <div className="bg-white shrink-0 px-6" style={{ height: 56, borderBottom: `1px solid ${F.border}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <p style={{ fontSize: 18, fontWeight: 700, color: F.text }}>Dashboard · Inspecciones</p>
      <p style={{ fontSize: 12, color: F.textMid, marginTop: 2 }}>Indicadores de cumplimiento del período actual</p>
    </div>
  );
}

// ── Análisis anual de hallazgos (Container48 + Container55) ───────────────
function KpiSection() {
  return (
    <div className="w-full">
      {/* Container48: section header with border-b-2 */}
      <div className="relative w-full" style={{ borderBottom: `2px solid ${F.border}`, paddingBottom: 14, marginBottom: 14 }}>
        {/* Left: icon + title */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 34, height: 34, background: "rgba(200,160,100,0.15)" }}>
            <svg viewBox="0 0 18.75 15" width={18} height={14} fill="none">
              <path d={svgPaths.p16888980} fill="#8E6E3E" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: F.text }}>Análisis anual de hallazgos</p>
            <p style={{ fontSize: 11, color: F.textMid }}>Cumplimiento, evolución temporal y contribución por área</p>
          </div>
          {/* Right: controls */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative bg-white rounded-lg" style={{ height: 36, border: `1px solid #d1d1d1`, padding: "0 28px 0 9px", minWidth: 80 }}>
              <span style={{ fontSize: 13, color: F.text, lineHeight: "36px" }}>2026</span>
              <svg viewBox="0 0 12.5 10" width={12.5} height={10} fill="none" style={{ position: "absolute", right: 10, top: 13 }}>
                <path d={svgPaths.pf36e620} fill={F.text} />
              </svg>
            </div>
            <div className="relative bg-white rounded-lg" style={{ height: 36, border: `1px solid #d1d1d1`, padding: "0 28px 0 9px", minWidth: 100 }}>
              <span style={{ fontSize: 13, color: F.text, lineHeight: "36px" }}>T1 · Ene–Mar</span>
              <svg viewBox="0 0 12.5 10" width={12.5} height={10} fill="none" style={{ position: "absolute", right: 10, top: 13 }}>
                <path d={svgPaths.pf36e620} fill={F.text} />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 bg-white rounded-[7px] px-3"
              style={{ height: 34, border: `1px solid #d1d1d1`, cursor: "pointer" }}>
              <Icon d={svgPaths.p12771800} w={13.75} h={11} color={F.textMid} opacity={1} />
              <span style={{ fontSize: 11, fontWeight: 600, color: F.textMid }}>{" Limpiar"}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Container55: KPI cards */}
      <div className="flex flex-wrap gap-3 w-full">
        {kpiMain.map((d) => <KpiCard key={d.label} def={d} />)}
      </div>
    </div>
  );
}

// ── Inspecciones cerradas y abiertas + Observaciones (Container68) ─────────
function BarChartsRow() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      {/* Container69: Inspecciones cerradas y abiertas */}
      <Card>
        <div className="px-[19px] py-[17px]">
          <p style={{ fontSize: 13, fontWeight: 700, color: F.text, marginBottom: 2 }}>Inspecciones cerradas y abiertas</p>
          <p style={{ fontSize: 11, color: F.textMid, marginBottom: 14 }}>Año 2026 resaltado · contexto 2023–2026</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={annualData} barGap={3} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="año" tick={{ fontSize: 10, fill: F.textMid }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: F.textMid }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="Cerradas" fill={F.cerradas} radius={[2, 2, 0, 0]} />
              <Bar dataKey="Abiertas" fill={F.abiertas} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <ChartLegend items={[{ color: F.cerradas, label: "Cerradas" }, { color: F.abiertas, label: "Abiertas" }]} />
        </div>
      </Card>
      {/* Container70: Observaciones cerradas y abiertas */}
      <Card>
        <div className="px-[19px] py-[17px]">
          <p style={{ fontSize: 13, fontWeight: 700, color: F.text, marginBottom: 2 }}>Observaciones cerradas y abiertas</p>
          <p style={{ fontSize: 11, color: F.textMid, marginBottom: 14 }}>Acumulado por año · 2026</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={obsData} barGap={3} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: F.textMid }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: F.textMid }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="Cerradas" fill={F.cerradas} radius={[2, 2, 0, 0]} />
              <Bar dataKey="Abiertas" fill={F.abiertas} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <ChartLegend items={[{ color: F.cerradas, label: "Cerradas" }, { color: F.abiertas, label: "Abiertas" }]} />
        </div>
      </Card>
    </div>
  );
}

// ── % Cierre histórico + % Cierre del período + Evolución (Container71) ───
function DonutChart({ pct, data }: { pct: string; data: [number, number] }) {
  const d = [{ v: data[0] }, { v: data[1] }];
  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      <PieChart width={160} height={160}>
        <Pie data={d} dataKey="v" cx={79} cy={79} innerRadius={52} outerRadius={70} startAngle={90} endAngle={-270} strokeWidth={0}>
          <Cell fill={F.cerradas} /><Cell fill={F.abiertas} />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: 28, fontWeight: 700, color: "#001e39", lineHeight: 1 }}>{pct}</span>
        <span style={{ fontSize: 10, color: F.textMid, marginTop: 3 }}>cerradas</span>
      </div>
    </div>
  );
}

function DonutRow() {
  const legend = [{ color: F.cerradas, label: "Cerradas" }, { color: F.abiertas, label: "Abiertas" }];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
      {/* Container72: % Cierre histórico */}
      <Card>
        <div className="px-[19px] py-[17px] flex flex-col items-center">
          <p style={{ fontSize: 13, fontWeight: 700, color: F.text, alignSelf: "flex-start", marginBottom: 2 }}>% Cierre histórico</p>
          <p style={{ fontSize: 11, color: F.textMid, alignSelf: "flex-start", marginBottom: 14 }}>2023–2026</p>
          <DonutChart pct="99,3%" data={[99.3, 0.7]} />
          <ChartLegend items={legend} />
        </div>
      </Card>
      {/* Container81: % Cierre del período */}
      <Card>
        <div className="px-[19px] py-[17px] flex flex-col items-center">
          <p style={{ fontSize: 13, fontWeight: 700, color: F.text, alignSelf: "flex-start", marginBottom: 2 }}>% Cierre del período</p>
          <p style={{ fontSize: 11, color: F.textMid, alignSelf: "flex-start", marginBottom: 14 }}>may· 2026</p>
          <DonutChart pct="81,8%" data={[81.8, 18.2]} />
          <ChartLegend items={legend} />
        </div>
      </Card>
      {/* Container90: Evolución de observaciones 2026 */}
      <Card>
        <div className="px-[19px] py-[17px]">
          <p style={{ fontSize: 13, fontWeight: 700, color: F.text, marginBottom: 2 }}>Evolución de observaciones 2026</p>
          <p style={{ fontSize: 11, color: F.textMid, marginBottom: 14 }}>Seguimiento mensual · abiertas vs cerradas</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={evolucionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: F.textMid }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: F.textMid }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tt} />
              <Line type="monotone" dataKey="Cerradas" stroke={F.cerradas} strokeWidth={2} dot={{ r: 3, fill: F.cerradas }} />
              <Line type="monotone" dataKey="Abiertas" stroke={F.abiertas} strokeWidth={2} dot={{ r: 3, fill: F.abiertas }} />
            </LineChart>
          </ResponsiveContainer>
          <ChartLegend items={legend} />
        </div>
      </Card>
    </div>
  );
}

// ── Observaciones por área (Container91 = BarChartEditable) ───────────────
function AreaSection() {
  return (
    <Card>
      <div className="px-[19px] py-[17px]">
        <p style={{ fontSize: 13, fontWeight: 700, color: F.text, marginBottom: 2 }}>Observaciones por área</p>
        <p style={{ fontSize: 11, color: F.textMid, marginBottom: 14 }}>Comparativo de volumen · cerradas vs abiertas · año 2026</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={areaData} layout="vertical" barGap={2} barSize={6} margin={{ left: 130 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: F.textMid }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="area" tick={{ fontSize: 11, fill: F.textMid }} axisLine={false} tickLine={false} width={128} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="Cerradas" fill={F.cerradas} radius={[0, 2, 2, 0]} />
            <Bar dataKey="Abiertas" fill={F.abiertas} radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[{ color: F.cerradas, label: "Cerradas" }, { color: F.abiertas, label: "Abiertas" }]} />
      </div>
    </Card>
  );
}

// ── Análisis por empresa (ContainerMargin32: Container92 + 98 + 107 + 108) ─
function CompanySection() {
  return (
    <div className="flex flex-col gap-[14px] w-full pt-2">

      {/* Container92: header bar con border-b-2, SIN card wrapper */}
      <div className="relative w-full" style={{ borderBottom: `2px solid ${F.border}`, paddingBottom: 14 }}>
        <div className="flex items-center gap-2.5">
          {/* Container94: icon box */}
          <div className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 34, height: 34, background: "rgba(200,160,100,0.15)" }}>
            <svg viewBox="0 0 18.75 15" width={18} height={14} fill="none">
              <path d={svgPaths.p16888980} fill="#8E6E3E" />
            </svg>
          </div>
          {/* Container95: title + subtitle */}
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: F.text }}>Análisis por empresa</p>
            <p style={{ fontSize: 11, color: F.textMid }}>Observaciones abiertas y seguimiento por empresa contratista (EECC)</p>
          </div>
          {/* Frame1: dropdown + limpiar */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative bg-white rounded-lg" style={{ height: 36, border: `1px solid #d1d1d1`, padding: "0 28px 0 9px", minWidth: 140 }}>
              <span style={{ fontSize: 13, color: F.text, lineHeight: "36px" }}>Todas las empresas</span>
              <svg viewBox="0 0 12.5 10" width={12.5} height={10} fill="none" style={{ position: "absolute", right: 10, top: 13 }}>
                <path d={svgPaths.pf36e620} fill={F.text} />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 bg-white rounded-[7px] px-3"
              style={{ height: 34, border: `1px solid #d1d1d1`, cursor: "pointer" }}>
              <Icon d={svgPaths.p12771800} w={13.75} h={11} color={F.textMid} opacity={1} />
              <span style={{ fontSize: 11, fontWeight: 600, color: F.textMid }}>{" Limpiar"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Container98: 4 KPI cards individuales SIN wrapper card */}
      <div className="flex flex-wrap gap-3 w-full">
        {kpiCompany.map((d) => <KpiCard key={d.label} def={d} />)}
      </div>

      {/* Container107: company bar chart card */}
      <Card>
        <div className="px-[19px] py-[17px]">
          <p style={{ fontSize: 13, fontWeight: 700, color: F.text, marginBottom: 2 }}>Inspecciones abiertas y cerradas por empresa</p>
          <p style={{ fontSize: 11, color: F.textMid, marginBottom: 14 }}>Empresas con observaciones mayo 2026</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={companyData} layout="vertical" barGap={2} barSize={8} margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="empresa" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} width={78} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="Cerradas" name="Obs. cerradas" fill={F.cerradasEmp} radius={[0, 2, 2, 0]} />
              <Bar dataKey="Abiertas" name="Obs. abiertas" fill={F.abiertasEmp} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <ChartLegend items={[{ color: F.cerradasEmp, label: "Obs. cerradas" }, { color: F.abiertasEmp, label: "Obs. abiertas" }]} />
        </div>
      </Card>

      {/* Container108: table card */}
      <Card>
        <div className="px-[19px] py-[17px] overflow-clip rounded-lg">
          {/* Container109: table header */}
          <div className="flex items-center justify-between pb-[15px] pt-[14px] px-[18px] -mx-[19px] -mt-[17px] mb-4"
            style={{ borderBottom: `1px solid ${F.border}` }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: F.text }}>Detalle de observaciones abiertas</p>
              <p style={{ fontSize: 11, color: F.textMid, marginTop: 2 }}>Ordenado por días abierto · seguimiento por fila</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Text48 */}
              <div className="rounded-[6px] px-2.5 flex items-center" style={{ height: 21, background: "#ffd0db" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#570b1d", whiteSpace: "nowrap" }}>3 tienen observaciones en estado crítico</span>
              </div>
              {/* Text49 */}
              <div className="rounded-[6px] px-2.5 flex items-center" style={{ height: 21, background: "#e6f3ff" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#24588b", whiteSpace: "nowrap" }}>11 inspecciones abiertas</span>
              </div>
            </div>
          </div>

          {/* Frame87: table */}
          <div className="overflow-x-auto -mx-[19px]">
            <table className="w-full border-collapse" style={{ minWidth: 600 }}>
              <thead>
                <tr style={{ background: F.tableHeader }}>
                  {/* Nº */}
                  <th className="px-3 py-[9.5px] text-left" style={{ width: 86, borderRight: `1px solid ${F.tableDiv}` }}>
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.44px", textTransform: "uppercase" }}>Nº</span>
                      <Icon d={svgPaths.p2c5a2400} w={12.5} h={10} color="white" opacity={0.7} />
                    </div>
                  </th>
                  {/* empresa */}
                  <th className="px-3 py-[9.5px] text-left flex-1" style={{ borderRight: `1px solid ${F.tableDiv}` }}>
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.44px", textTransform: "uppercase" }}>empresa</span>
                      <Icon d={svgPaths.p2c5a2400} w={12.5} h={10} color="white" opacity={0.7} />
                    </div>
                  </th>
                  {/* área */}
                  <th className="px-3 py-[9.5px] text-left" style={{ borderRight: `1px solid ${F.tableDiv}` }}>
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.44px", textTransform: "uppercase" }}>área</span>
                      <Icon d={svgPaths.p2c5a2400} w={12.5} h={10} color="white" opacity={0.7} />
                    </div>
                  </th>
                  {/* días abierto (gold color) */}
                  <th className="px-3 py-[9.5px] text-left" style={{ width: 121.5, borderRight: `1px solid ${F.tableDiv}` }}>
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: 11, fontWeight: 600, color: F.gold, letterSpacing: "0.44px", textTransform: "uppercase" }}>días abierto</span>
                      <Icon d={svgPaths.p2c5a2400} w={12.5} h={10} color={F.gold} opacity={1} />
                    </div>
                  </th>
                  {/* obs. abiertas */}
                  <th className="px-3 py-[9.5px] text-left" style={{ width: 127.5, borderRight: `1px solid ${F.tableDiv}` }}>
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.44px", textTransform: "uppercase" }}>obs. abiertas</span>
                      <Icon d={svgPaths.p2c5a2400} w={12.5} h={10} color="white" opacity={0.7} />
                    </div>
                  </th>
                  {/* desplegar fila */}
                  <th className="px-3 py-[9.5px] text-left" style={{ width: 122 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.44px", textTransform: "uppercase" }}>desplegar fila</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} style={{ height: 33, background: row.critical ? "#ffd0db" : "#fff", borderBottom: `1px solid ${F.border}` }}>
                    <td className="px-3" style={{ fontSize: 12, color: F.textMid, borderRight: `1px solid ${F.border}` }}>{row.n}</td>
                    <td className="px-3" style={{ fontSize: 12, fontWeight: 600, color: F.text, borderRight: `1px solid ${F.border}` }}>{row.empresa}</td>
                    <td className="px-3" style={{ fontSize: 12, color: F.textMid, borderRight: `1px solid ${F.border}` }}>{row.area}</td>
                    <td className="px-3" style={{ fontSize: 12, color: row.critical ? "#570b1d" : F.textMid, borderRight: `1px solid ${F.border}` }}>{row.dias}</td>
                    <td className="px-3" style={{ fontSize: 12, color: F.textMid, borderRight: `1px solid ${F.border}` }}>{row.obs}</td>
                    <td className="px-3 flex items-center justify-center" style={{ height: 33 }}>
                      <Icon d={svgPaths.pf36e620} w={12.5} h={10} color={F.text} opacity={1} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function Dashboard() {
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto" style={{ background: F.gray }}>
          <div className="flex flex-col gap-[14px] px-6 py-5">
            <KpiSection />
            <BarChartsRow />
            <DonutRow />
            <AreaSection />
            <CompanySection />
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────
function LoginAureliaLogo() {
  const pieces = [
    { d: loginSvgPaths.p2e0f7480, w: 58.312, h: 59,      ml: 0,      mt: 0,     vb: "0 0 58.3117 59"      },
    { d: loginSvgPaths.p20c0fe00, w: 8.131,  h: 5.792,   ml: 37.14,  mt: 11.2,  vb: "0 0 8.13112 5.792"   },
    { d: loginSvgPaths.pe6b6f00,  w: 5.16,   h: 4.775,   ml: 39.86,  mt: 19.77, vb: "0 0 5.16027 4.77549" },
    { d: loginSvgPaths.p3c258ef0, w: 4.102,  h: 7.666,   ml: 40.8,   mt: 26.82, vb: "0 0 4.10242 7.66619" },
    { d: loginSvgPaths.p12fc9500, w: 21.071, h: 13.903,  ml: 19.66,  mt: 16.76, vb: "0 0 21.0714 13.9029" },
    { d: loginSvgPaths.p180c3880, w: 5.686,  h: 3.531,   ml: 33.2,   mt: 11.85, vb: "0 0 5.68611 3.53053" },
    { d: loginSvgPaths.p1b437e80, w: 6.608,  h: 6.396,   ml: 22.7,   mt: 29.51, vb: "0 0 6.60772 6.39555" },
    { d: loginSvgPaths.p197b6d40, w: 3.058,  h: 7.497,   ml: 30.56,  mt: 40.39, vb: "0 0 3.05808 7.49677" },
    { d: loginSvgPaths.p10691c00, w: 3.777,  h: 10.324,  ml: 33.87,  mt: 36.83, vb: "0 0 3.7774 10.3239"  },
    { d: loginSvgPaths.p2d539d00, w: 3.058,  h: 7.486,   ml: 26.77,  mt: 40.38, vb: "0 0 3.05754 7.48618" },
    { d: loginSvgPaths.p39c31410, w: 4.269,  h: 11.425,  ml: 18.7,   mt: 34.14, vb: "0 0 4.26894 11.4252" },
    { d: loginSvgPaths.p289d3e0,  w: 4.264,  h: 11.425,  ml: 37.41,  mt: 34.13, vb: "0 0 4.26386 11.4252" },
    { d: loginSvgPaths.p18adb880, w: 4.961,  h: 10.853,  ml: 16.18,  mt: 30.19, vb: "0 0 4.96066 10.8534" },
    { d: loginSvgPaths.p296a8500, w: 3.788,  h: 10.324,  ml: 22.75,  mt: 36.83, vb: "0 0 3.78758 10.3239" },
    { d: loginSvgPaths.p3d489780, w: 3.833,  h: 3.494,   ml: 30.67,  mt: 11.89, vb: "0 0 3.8331 3.49428"  },
    { d: loginSvgPaths.p73a0480,  w: 3.05,   h: 5.58,    ml: 41.79,  mt: 23.54, vb: "0 0 3.04953 5.58022" },
    { d: loginSvgPaths.p2d8280,   w: 7.1,    h: 3.407,   ml: 37.77,  mt: 16.5,  vb: "0 0 7.09998 3.4075"  },
    { d: loginSvgPaths.p2ad93cf0, w: 5.177,  h: 4.786,   ml: 15.37,  mt: 19.77, vb: "0 0 5.17698 4.78607" },
    { d: loginSvgPaths.pe69e800,  w: 8.144,  h: 5.792,   ml: 15.11,  mt: 11.2,  vb: "0 0 8.14384 5.792"   },
    { d: loginSvgPaths.p2150b900, w: 3.05,   h: 5.591,   ml: 15.55,  mt: 23.55, vb: "0 0 3.04953 5.59081" },
    { d: loginSvgPaths.p3a41ff80, w: 4.116,  h: 7.666,   ml: 15.47,  mt: 26.81, vb: "0 0 4.11571 7.66619" },
    { d: loginSvgPaths.p1ed60900, w: 8.27,   h: 5.898,   ml: 26.02,  mt: 33.83, vb: "0 0 8.26974 5.89788" },
    { d: loginSvgPaths.p27ee9100, w: 6.608,  h: 6.396,   ml: 30.99,  mt: 29.51, vb: "0 0 6.60754 6.39555" },
    { d: loginSvgPaths.p1f62b000, w: 5.665,  h: 3.541,   ml: 21.52,  mt: 11.85, vb: "0 0 5.66493 3.54098" },
    { d: loginSvgPaths.p2537b780, w: 4.954,  h: 10.853,  ml: 39.25,  mt: 30.19, vb: "0 0 4.95388 10.8534" },
    { d: loginSvgPaths.p2cd59800, w: 7.099,  h: 3.418,   ml: 15.53,  mt: 16.5,  vb: "0 0 7.099 3.41809"   },
    { d: loginSvgPaths.p3abd2000, w: 3.833,  h: 3.494,   ml: 25.87,  mt: 11.89, vb: "0 0 3.83309 3.49428" },
    { d: loginSvgPaths.p1441b400, w: 2.647,  h: 5.644,   ml: 137.67, mt: 17.5,  vb: "0 0 2.64716 5.64376" },
    { d: loginSvgPaths.p31c27e00, w: 6.819,  h: 6.184,   ml: 143.05, mt: 17.21, vb: "0 0 6.8191 6.18378"  },
    { d: loginSvgPaths.p281a4100, w: 7.137,  h: 5.93,    ml: 152.18, mt: 17.5,  vb: "0 0 7.13674 5.92965" },
    { d: loginSvgPaths.pf1ea800,  w: 7.751,  h: 5.644,   ml: 161.29, mt: 17.52, vb: "0 0 7.75091 5.64375" },
    { d: loginSvgPaths.p301c9a00, w: 7.454,  h: 5.771,   ml: 170.57, mt: 17.43, vb: "0 0 7.45442 5.77082" },
    { d: loginSvgPaths.p33f62540, w: 3.579,  h: 3.113,   ml: 108.32, mt: 18.52, vb: "0 0 3.57896 3.11307" },
    { d: loginSvgPaths.p12caf900, w: 4.235,  h: 3.155,   ml: 88.57,  mt: 18.5,  vb: "0 0 4.23546 3.15542" },
    { d: loginSvgPaths.p25a02580, w: 11.023, h: 9.371,   ml: 124.27, mt: 13.8,  vb: "0 0 11.0228 9.37097" },
    { d: loginSvgPaths.p1f4f5900, w: 117.396,h: 14.676,  ml: 65.02,  mt: 10.89, vb: "0 0 117.396 14.6759" },
  ];
  return (
    <div style={{ display: "inline-grid", gridTemplateColumns: "max-content", gridTemplateRows: "max-content", lineHeight: 0, placeItems: "start", position: "relative", flexShrink: 0 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: "relative", gridColumn: "1", gridRow: "1", width: p.w, height: p.h, marginLeft: p.ml, marginTop: p.mt }}>
          <svg style={{ display: "block", position: "absolute", inset: 0, width: "100%", height: "100%" }} fill="none" preserveAspectRatio="none" viewBox={p.vb}>
            <path d={p.d} fill="#24588B" />
          </svg>
        </div>
      ))}
      <div style={{ gridColumn: "1", gridRow: "1", marginLeft: 64.09, marginTop: 29.12, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 18.487, letterSpacing: 4.6217, textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: "18.487px" }}>
          <span style={{ color: "#6e87a7" }}>AUREL</span>
          <span style={{ color: "#c8a064" }}>IA</span>
        </p>
      </div>
    </div>
  );
}

function GoldFieldsIsotipo() {
  const ps = [
    loginSvgPaths.p3cfdf80, loginSvgPaths.p1d7acd00, loginSvgPaths.p1c85e800, loginSvgPaths.p1de69280,
    loginSvgPaths.p5210a80, loginSvgPaths.p1d300100, loginSvgPaths.p1824dd00, loginSvgPaths.p1960b600,
    loginSvgPaths.p376f5b80, loginSvgPaths.p23cac700, loginSvgPaths.p3adece80, loginSvgPaths.p1bcf4a00,
    loginSvgPaths.p10eb2700, loginSvgPaths.p36e5ce00, loginSvgPaths.p347a6800, loginSvgPaths.pabbf700,
    loginSvgPaths.p1b2ae980, loginSvgPaths.p2c12c900, loginSvgPaths.p1f0e1d40, loginSvgPaths.p121af080,
    loginSvgPaths.p2e011100, loginSvgPaths.p2b28ee00, loginSvgPaths.p374a6600, loginSvgPaths.p5dac100,
    loginSvgPaths.p318de680, loginSvgPaths.p3a615f00,
  ];
  return (
    <svg style={{ display: "block", position: "absolute", inset: 0, width: "100%", height: "100%" }} fill="none" preserveAspectRatio="none" viewBox="0 0 85 85">
      {ps.map((d, i) => <path key={i} d={d} fill="white" />)}
    </svg>
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    // Simula llamada a API (en canvas no hay backend)
    await new Promise((r) => setTimeout(r, 900));
    if (email.includes("@") && password.length >= 4) {
      onLogin();
    } else {
      setError("Credenciales incorrectas. Verifique su usuario y contraseña.");
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    height: 40, background: "#f6faff", border: "1px solid #d1d1d1",
    borderRadius: 8, padding: "0 12px", fontSize: 14, color: "#131313",
    letterSpacing: 0.28, outline: "none", width: "100%",
    boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif",
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", background: "#fff", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>

      {/* Panel izquierdo */}
      <div style={{ flex: "1 1 60%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 80px", minWidth: 0 }}>

        <div style={{ marginBottom: 40 }}>
          <LoginAureliaLogo />
        </div>

        <div style={{ textAlign: "center", marginBottom: 56, width: "100%", maxWidth: 449 }}>
          <p style={{ margin: "0 0 16px", fontSize: 24, fontWeight: 700, color: "#131313", letterSpacing: 0.48, lineHeight: "29px" }}>
            {"Le damos la bienvenida a "}
            <span style={{ color: "#24588b" }}>AurelIA</span>
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 400, color: "#131313", letterSpacing: 0.32, lineHeight: "25.9px" }}>
            Sistema de gestión ambiental
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 449, display: "flex", flexDirection: "column", gap: 24 }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#131313", letterSpacing: 0.28, lineHeight: "22.7px" }}>
              Nombre de usuario
            </label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@goldfields.com" autoComplete="username" required style={inp}
              onFocus={(e) => { e.target.style.borderColor = "#24588b"; e.target.style.boxShadow = "0 0 0 2px rgba(36,88,139,0.12)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "#d1d1d1"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#131313", letterSpacing: 0.28, lineHeight: "22.7px" }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" autoComplete="current-password" required
                style={{ ...inp, paddingRight: 44 }}
                onFocus={(e) => { e.target.style.borderColor = "#24588b"; e.target.style.boxShadow = "0 0 0 2px rgba(36,88,139,0.12)"; }}
                onBlur={(e)  => { e.target.style.borderColor = "#d1d1d1"; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, padding: 0, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Mostrar/ocultar contraseña">
                <svg style={{ width: 18, height: 14 }} fill="none" viewBox="0 0 18 14">
                  <path d={loginSvgPaths.p2c96d600} fill="#00B398" />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: "#c0392b", textAlign: "center", background: "#fef2f2", padding: "8px 12px", borderRadius: 6 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8 }}>
            <button type="button" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#c8a064", textDecoration: "underline", letterSpacing: 0.28, lineHeight: "22.7px", fontFamily: "inherit" }}>
              Recuperar contraseña
            </button>
          </div>

          <button type="submit" disabled={loading}
            style={{ height: 39, background: loading ? "#d4b07a" : "#c8a064", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 0.28, cursor: loading ? "not-allowed" : "pointer", width: "100%", fontFamily: "inherit", transition: "background 0.15s" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#b8904a"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#c8a064"; }}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        {/* Selector idioma */}
        <div style={{ marginTop: 56, display: "flex" }}>
          <div style={{ height: 32, background: "#fff", borderRadius: "8px 0 0 8px", border: "1px solid #d1d1d1", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 14px", cursor: "pointer" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#131313" }}>EN</span>
          </div>
          <div style={{ height: 32, background: "#c8a064", borderRadius: "0 8px 8px 0", border: "1px solid #c8a064", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 14px", cursor: "pointer" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>ES</span>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div style={{ flex: "0 0 40%", position: "relative", overflow: "hidden" }}>
        <img src={loginBg} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(180.033deg, rgb(0,29,57) 0%, rgb(0,179,152) 129.83%)", mixBlendMode: "overlay" }} />
        <div style={{ position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)", width: 303, height: 85, background: "rgba(0,29,57,0.75)", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center" }}>
          <p style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", margin: 0, fontWeight: 700, fontSize: 12, color: "#fff", letterSpacing: 0.24, lineHeight: "19.4px", width: 140 }}>
            Una aplicación interna de Gold Fields
          </p>
          <div style={{ position: "absolute", right: 0, top: 0, width: 85, height: 85 }}>
            <GoldFieldsIsotipo />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return <Dashboard />;
}
