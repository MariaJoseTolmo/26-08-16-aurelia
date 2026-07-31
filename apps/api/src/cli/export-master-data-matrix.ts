import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { DataSource } from 'typeorm';
import { XlsxWorkbookService, XlsxCell, XlsxCellStyle, XlsxSheet } from '../modules/reports/xlsx-workbook.service';

// Load .env before any DB access
config({ path: resolve(__dirname, '../../.env') });

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function bool(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? 'Sí' : 'No';
}

function cell(value: XlsxCell['value'], style: XlsxCellStyle = 'default'): XlsxCell {
  return { value, style };
}

function hdr(label: string): XlsxCell {
  return { value: label, style: 'header' };
}

function hdrs(labels: string[]): XlsxCell[] {
  return labels.map(hdr);
}

function sep(values: string[]): string {
  return values.filter(Boolean).join(' · ');
}

function roleStyle(roleCode: string): XlsxCellStyle {
  const upper = (roleCode ?? '').toUpperCase();
  if (upper.includes('ADMIN')) return 'danger';
  if (upper.includes('SUPERVISOR')) return 'warning';
  if (upper.includes('INSPECTOR')) return 'success';
  return 'default';
}

function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function safeEnvGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
  return v;
}

// ─── Git info (no throw) ─────────────────────────────────────────────────────

function gitBranch(): string {
  try { return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch { return 'N/A'; }
}

function gitCommit(): string {
  try { return execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch { return 'N/A'; }
}

// ─── Data types ──────────────────────────────────────────────────────────────

interface RawUser {
  id: string; email: string; first_name: string; last_name: string;
  position: string | null; is_active: boolean; company_id: string | null;
  company_name: string | null; area_id: string | null; area_name: string | null;
  last_login_at: string | null; created_at: string; updated_at: string;
  has_password: boolean;
}

interface RawRole { id: string; code: string; name: string; description: string | null; is_system: boolean; is_active: boolean; user_count: string; created_at: string; updated_at: string; }
interface RawPermission { id: string; code: string; name: string; module: string; action: string; description: string | null; created_at: string; }
interface RawRolePermission { role_id: string; role_code: string; role_name: string; perm_code: string; perm_name: string; module: string; action: string; }
interface RawUserRole { user_id: string; role_id: string; role_code: string; role_name: string; assigned_at: string; }
interface RawUserCompany { user_id: string; company_id: string; company_name: string; assigned_at: string; }
interface RawUserArea { user_id: string; area_id: string; area_name: string; assigned_at: string; }
interface RawCompany { id: string; code: string | null; name: string; tax_id: string | null; company_type: string | null; is_contractor: boolean; status: string; user_count: string; created_at: string; updated_at: string; }
interface RawArea { id: string; code: string; name: string; description: string | null; status: string; gerencia_id: string | null; gerencia_name: string | null; sector_count: string; user_count: string; created_at: string; updated_at: string; }
interface RawSector { id: string; code: string; name: string; description: string | null; status: string; area_id: string | null; area_name: string | null; created_at: string; updated_at: string; }
interface RawCatalog { catalog: string; id: string; code: string | null; name: string; description: string | null; status: string | null; }
interface RawWorkflow { id: string; code: string; name: string; entity_type: string; is_active: boolean; }

// ─── Sheet builders ──────────────────────────────────────────────────────────

function buildUsersSheet(
  users: RawUser[],
  userRoleMap: Map<string, RawUserRole[]>,
  userCompanyMap: Map<string, RawUserCompany[]>,
  userAreaMap: Map<string, RawUserArea[]>,
  demoPassword: string,
): XlsxSheet {
  const COLS = [
    'Nombre', 'Apellido', 'Correo electrónico', 'Empresa', 'Cargo', 'Rol principal',
    'Contraseña', 'Flujos vinculados', 'Estado', 'Empresas adicionales',
    'Áreas vinculadas', 'Roles adicionales', 'Origen', 'Último acceso',
    'Fecha de creación', 'Última actualización', 'ID interno', 'Observaciones',
  ];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const u of users) {
    const roles = userRoleMap.get(u.id) ?? [];
    const primRole = roles[0];
    const extraRoles = roles.slice(1);
    const extraCompanies = userCompanyMap.get(u.id) ?? [];
    const areas = userAreaMap.get(u.id) ?? [];
    const roleStyle_ = primRole ? roleStyle(primRole.role_code) : 'default';
    const flujos = roles.map(r => r.role_name);
    const obs = primRole ? `Rol: ${primRole.role_code}${roles.length > 1 ? ` +${roles.length - 1} más` : ''}` : '';

    rows.push([
      cell(u.first_name),
      cell(u.last_name),
      cell(u.email),
      cell(u.company_name ?? ''),
      cell(u.position ?? ''),
      cell(primRole?.role_name ?? '', roleStyle_),
      u.has_password
        ? cell(demoPassword, 'warning')
        : cell('No exportable · requiere restablecimiento', 'muted'),
      cell(sep(flujos) || '(sin flujos asignados)', flujos.length > 0 ? 'teal' : 'muted'),
      cell(bool(u.is_active), u.is_active ? 'success' : 'danger'),
      cell(sep(extraCompanies.map(c => c.company_name))),
      cell(sep(areas.map(a => a.area_name))),
      cell(sep(extraRoles.map(r => r.role_name))),
      cell('Sistema'),
      cell(fmtDate(u.last_login_at), 'date'),
      cell(fmtDate(u.created_at), 'date'),
      cell(fmtDate(u.updated_at), 'date'),
      cell(u.id, 'muted'),
      cell(obs),
    ]);
  }
  return {
    name: 'Usuarios',
    columns: [14,16,26,22,18,18,34,30,8,28,28,28,10,18,18,18,38,30].map(w => ({ width: w })),
    rows,
    freezeRows: 1,
    autoFilter: `A1:R1`,
  };
}

function buildUsuariosFlujos(users: RawUser[], userRoleMap: Map<string, RawUserRole[]>): XlsxSheet {
  const COLS = ['ID Usuario', 'Nombre completo', 'Correo', 'Flujo (rol)', 'Código rol', 'Asignado el'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const u of users) {
    const roles = userRoleMap.get(u.id) ?? [];
    if (roles.length === 0) {
      rows.push([cell(u.id, 'muted'), cell(`${u.first_name} ${u.last_name}`), cell(u.email), cell('(sin flujo)', 'muted'), cell(''), cell('')]);
    } else {
      for (const r of roles) {
        rows.push([
          cell(u.id, 'muted'), cell(`${u.first_name} ${u.last_name}`), cell(u.email),
          cell(r.role_name, roleStyle(r.role_code)), cell(r.role_code), cell(fmtDate(r.assigned_at), 'date'),
        ]);
      }
    }
  }
  return { name: 'Usuarios_Flujos', columns: [38,24,28,22,16,18].map(w => ({ width: w })), rows, freezeRows: 1 };
}

function buildEmpresasSheet(companies: RawCompany[]): XlsxSheet {
  const COLS = ['Código', 'Nombre', 'RUT/Tax ID', 'Tipo empresa', '¿Es contratista?', 'Estado', 'Usuarios directos', 'Fecha creación', 'Última actualización', 'ID interno'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const c of companies) {
    rows.push([
      cell(c.code ?? ''),
      cell(c.name),
      cell(c.tax_id ?? ''),
      cell(c.company_type ?? ''),
      cell(bool(c.is_contractor), c.is_contractor ? 'warning' : 'default'),
      cell(c.status, c.status === 'active' ? 'success' : 'danger'),
      cell(Number(c.user_count), 'integer'),
      cell(fmtDate(c.created_at), 'date'),
      cell(fmtDate(c.updated_at), 'date'),
      cell(c.id, 'muted'),
    ]);
  }
  return { name: 'Empresas', columns: [12,28,16,18,14,10,16,18,18,38].map(w => ({ width: w })), rows, freezeRows: 1, autoFilter: 'A1:J1' };
}

function buildAreasSheet(areas: RawArea[]): XlsxSheet {
  const COLS = ['Código', 'Nombre', 'Descripción', 'Gerencia', 'Estado', 'Sectores', 'Usuarios directos', 'Fecha creación', 'Última actualización', 'ID interno'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const a of areas) {
    rows.push([
      cell(a.code),
      cell(a.name),
      cell(a.description ?? ''),
      cell(a.gerencia_name ?? ''),
      cell(a.status, a.status === 'active' ? 'success' : 'danger'),
      cell(Number(a.sector_count), 'integer'),
      cell(Number(a.user_count), 'integer'),
      cell(fmtDate(a.created_at), 'date'),
      cell(fmtDate(a.updated_at), 'date'),
      cell(a.id, 'muted'),
    ]);
  }
  return { name: 'Areas', columns: [12,24,28,20,10,10,16,18,18,38].map(w => ({ width: w })), rows, freezeRows: 1, autoFilter: 'A1:J1' };
}

function buildSectoresSheet(sectors: RawSector[]): XlsxSheet {
  const COLS = ['Código', 'Nombre', 'Descripción', 'Área padre', 'Estado', 'Fecha creación', 'Última actualización', 'ID interno'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const s of sectors) {
    rows.push([
      cell(s.code),
      cell(s.name),
      cell(s.description ?? ''),
      cell(s.area_name ?? '', s.area_id ? 'default' : 'warning'),
      cell(s.status, s.status === 'active' ? 'success' : 'danger'),
      cell(fmtDate(s.created_at), 'date'),
      cell(fmtDate(s.updated_at), 'date'),
      cell(s.id, 'muted'),
    ]);
  }
  return { name: 'Sectores', columns: [12,24,28,20,10,18,18,38].map(w => ({ width: w })), rows, freezeRows: 1, autoFilter: 'A1:H1' };
}

function buildRolesSheet(roles: RawRole[]): XlsxSheet {
  const COLS = ['Código', 'Nombre', 'Descripción', '¿Sistema?', 'Activo', 'Usuarios asignados', 'Fecha creación', 'Última actualización', 'ID interno'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const r of roles) {
    rows.push([
      cell(r.code, roleStyle(r.code)),
      cell(r.name),
      cell(r.description ?? ''),
      cell(bool(r.is_system)),
      cell(bool(r.is_active), r.is_active ? 'success' : 'danger'),
      cell(Number(r.user_count), 'integer'),
      cell(fmtDate(r.created_at), 'date'),
      cell(fmtDate(r.updated_at), 'date'),
      cell(r.id, 'muted'),
    ]);
  }
  return { name: 'Roles', columns: [20,24,30,10,8,18,18,18,38].map(w => ({ width: w })), rows, freezeRows: 1 };
}

function buildRolesPermisosSheet(perms: RawRolePermission[]): XlsxSheet {
  const COLS = ['Rol', 'Código rol', 'Permiso', 'Código permiso', 'Módulo', 'Acción'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const p of perms) {
    rows.push([
      cell(p.role_name), cell(p.role_code, roleStyle(p.role_code)),
      cell(p.perm_name), cell(p.perm_code, 'teal'),
      cell(p.module), cell(p.action),
    ]);
  }
  return { name: 'Roles_Permisos', columns: [22,20,28,26,16,16].map(w => ({ width: w })), rows, freezeRows: 1, autoFilter: 'A1:F1' };
}

function buildUsuariosEmpresasSheet(relations: RawUserCompany[], users: RawUser[]): XlsxSheet {
  const userMap = new Map(users.map(u => [u.id, u]));
  const COLS = ['Nombre usuario', 'Correo', 'Empresa vinculada', 'ID empresa', 'Asignado el', 'ID usuario'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const r of relations) {
    const u = userMap.get(r.user_id);
    rows.push([
      cell(u ? `${u.first_name} ${u.last_name}` : r.user_id),
      cell(u?.email ?? ''),
      cell(r.company_name),
      cell(r.company_id, 'muted'),
      cell(fmtDate(r.assigned_at), 'date'),
      cell(r.user_id, 'muted'),
    ]);
  }
  return { name: 'Usuarios_Empresas', columns: [24,28,24,38,18,38].map(w => ({ width: w })), rows, freezeRows: 1 };
}

function buildUsuariosAreasSheet(relations: RawUserArea[], users: RawUser[]): XlsxSheet {
  const userMap = new Map(users.map(u => [u.id, u]));
  const COLS = ['Nombre usuario', 'Correo', 'Área vinculada', 'ID área', 'Asignado el', 'ID usuario'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const r of relations) {
    const u = userMap.get(r.user_id);
    rows.push([
      cell(u ? `${u.first_name} ${u.last_name}` : r.user_id),
      cell(u?.email ?? ''),
      cell(r.area_name),
      cell(r.area_id, 'muted'),
      cell(fmtDate(r.assigned_at), 'date'),
      cell(r.user_id, 'muted'),
    ]);
  }
  return { name: 'Usuarios_Areas', columns: [24,28,24,38,18,38].map(w => ({ width: w })), rows, freezeRows: 1 };
}

function buildCatalogosSheet(catalogs: RawCatalog[]): XlsxSheet {
  const COLS = ['Catálogo', 'Código', 'Nombre', 'Descripción', 'Estado', 'ID'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const c of catalogs) {
    rows.push([
      cell(c.catalog, 'teal'),
      cell(c.code ?? ''),
      cell(c.name),
      cell(c.description ?? ''),
      cell(c.status ?? '', c.status === 'active' ? 'success' : c.status ? 'danger' : 'default'),
      cell(c.id, 'muted'),
    ]);
  }
  return { name: 'Catalogos_Detectados', columns: [22,14,30,30,10,38].map(w => ({ width: w })), rows, freezeRows: 1, autoFilter: 'A1:F1' };
}

function buildResumenSheet(counts: Record<string, number>, alerts: string[]): XlsxSheet {
  const rows: XlsxCell[][] = [
    [hdr('Indicador'), hdr('Valor')],
    [cell('Usuarios totales'), cell(counts.users, 'integer')],
    [cell('Usuarios activos'), cell(counts.activeUsers, 'integer')],
    [cell('Usuarios inactivos'), cell(counts.inactiveUsers, 'integer')],
    [cell('Empresas'), cell(counts.companies, 'integer')],
    [cell('Áreas'), cell(counts.areas, 'integer')],
    [cell('Sectores'), cell(counts.sectors, 'integer')],
    [cell('Roles'), cell(counts.roles, 'integer')],
    [cell('Permisos'), cell(counts.permissions, 'integer')],
    [cell('Asignaciones usuario-empresa'), cell(counts.userCompanies, 'integer')],
    [cell('Asignaciones usuario-área'), cell(counts.userAreas, 'integer')],
    [cell('Asignaciones usuario-rol'), cell(counts.userRoles, 'integer')],
    [cell('Catálogos detectados'), cell(counts.catalogs, 'integer')],
    [cell('')],
    [hdr('Alertas de calidad'), hdr('Descripción')],
    ...alerts.map((a, i) => [cell(`[A${i + 1}]`, 'warning'), cell(a)]),
    ...(alerts.length === 0 ? [[cell('Sin alertas detectadas', 'success'), cell('')]] : []),
  ];
  return { name: 'Resumen', columns: [36, 30].map(w => ({ width: w })), rows, freezeRows: 0 };
}

function buildDiccionarioSheet(): XlsxSheet {
  const entries: [string, string, string][] = [
    ['Usuarios', 'Nombre', 'Primer nombre del usuario'],
    ['Usuarios', 'Apellido', 'Apellido del usuario'],
    ['Usuarios', 'Correo electrónico', 'Dirección de correo (única en el sistema)'],
    ['Usuarios', 'Empresa', 'Empresa principal asignada (campo company_id en BD)'],
    ['Usuarios', 'Cargo', 'Posición o cargo laboral'],
    ['Usuarios', 'Rol principal', 'Primer rol asignado en tabla user_roles'],
    ['Usuarios', 'Contraseña', 'Contraseña demo (AURELIA_DEMO_USER_PASSWORD) si el usuario tiene hash; de lo contrario "No exportable · requiere restablecimiento"'],
    ['Usuarios', 'Flujos vinculados', 'Derivado de roles asignados (no existe tabla user_flows). Equivale a los flujos habilitados por los roles del usuario.'],
    ['Usuarios', 'Estado', 'is_active: Sí = activo, No = desactivado'],
    ['Usuarios', 'Empresas adicionales', 'Empresas vinculadas vía tabla user_companies (muchos-a-muchos)'],
    ['Usuarios', 'Áreas vinculadas', 'Áreas vinculadas vía tabla user_areas (muchos-a-muchos)'],
    ['Usuarios', 'Roles adicionales', 'Roles adicionales más allá del rol principal'],
    ['Usuarios', 'Último acceso', 'Fecha y hora del último login exitoso (last_login_at)'],
    ['Usuarios', 'ID interno', 'UUID primario de la tabla users'],
    ['Empresas', 'Código', 'Código corto único de la empresa'],
    ['Empresas', 'RUT/Tax ID', 'Identificador fiscal'],
    ['Empresas', '¿Es contratista?', 'true = empresa contratista, false = empresa propia'],
    ['Áreas', 'Gerencia', 'Gerencia padre en la jerarquía BusinessUnit → Gerencia → Área'],
    ['Roles', 'Código', 'Identificador único del rol (ej: ADMIN, INSPECTOR)'],
    ['Roles', '¿Sistema?', 'is_system = true indica que el rol es del sistema y no debe eliminarse'],
    ['Roles_Permisos', 'Código permiso', 'Código único del permiso (ej: inspections:read)'],
    ['Roles_Permisos', 'Módulo', 'Módulo al que pertenece el permiso'],
    ['Roles_Permisos', 'Acción', 'Acción que habilita (read, write, admin, etc.)'],
    ['Catalogos_Detectados', 'Catálogo', 'Nombre de la tabla catálogo de origen'],
    ['General', 'Fechas', 'Formato: dd-mm-yyyy hh:mm (hora local del servidor al momento de extracción)'],
    ['General', 'Múltiples valores', 'Separados por " · " (espacio punto espacio)'],
    ['General', 'Estado', '"active" = activo, "inactive" = inactivo'],
  ];
  const COLS = ['Hoja', 'Columna', 'Descripción'];
  const rows: XlsxCell[][] = [hdrs(COLS)];
  for (const [sheet, col, desc] of entries) {
    rows.push([cell(sheet, 'teal'), cell(col), cell(desc)]);
  }
  return { name: 'Diccionario', columns: [20, 24, 50].map(w => ({ width: w })), rows, freezeRows: 1 };
}

function buildMetadatosSheet(branch: string, commit: string, outputFile: string): XlsxSheet {
  const now = new Date();
  const rows: XlsxCell[][] = [
    [hdr('Campo'), hdr('Valor')],
    [cell('Script'), cell('apps/api/src/cli/export-master-data-matrix.ts')],
    [cell('Generado el'), cell(fmtDate(now), 'date')],
    [cell('Rama git'), cell(branch)],
    [cell('Commit git'), cell(commit)],
    [cell('Archivo generado'), cell(outputFile)],
    [cell('Base de datos'), cell(`${process.env.DB_HOST ?? 'N/A'}:${process.env.DB_PORT ?? 'N/A'} / ${process.env.DB_NAME ?? 'N/A'}`)],
    [cell('Operación'), cell('Solo lectura — ningún INSERT, UPDATE ni DELETE ejecutado')],
    [cell('Contraseñas'), cell('Usuarios con hash: muestra contraseña demo de entorno. Usuarios sin hash: "No exportable · requiere restablecimiento". Hashes nunca exportados.')],
    [cell('Nota'), cell('Los flujos vinculados se derivan de la asignación de roles (no existe tabla user_flows)')],
  ];
  return { name: 'Metadatos', columns: [24, 60].map(w => ({ width: w })), rows, freezeRows: 0 };
}

// ─── Catalog query helpers ────────────────────────────────────────────────────

interface CatalogDef {
  table: string;
  label: string;
  hasStatus: boolean;
  hasCode: boolean;
  hasDescription: boolean;
}

const CATALOG_DEFS: CatalogDef[] = [
  { table: 'inspection_types',              label: 'Tipos de inspección',       hasStatus: true,  hasCode: true,  hasDescription: true  },
  { table: 'inspection_states',             label: 'Estados de inspección',     hasStatus: true,  hasCode: true,  hasDescription: true  },
  { table: 'inspection_finding_types',      label: 'Tipos de hallazgo',         hasStatus: true,  hasCode: true,  hasDescription: true  },
  { table: 'inspection_finding_severities', label: 'Severidades de hallazgo',   hasStatus: true,  hasCode: true,  hasDescription: true  },
  { table: 'incident_types',               label: 'Tipos de incidente',        hasStatus: true,  hasCode: true,  hasDescription: true  },
  { table: 'incident_levels',              label: 'Niveles de incidente',      hasStatus: true,  hasCode: true,  hasDescription: true  },
  { table: 'workflow_definitions',          label: 'Flujos de trabajo',         hasStatus: false, hasCode: true,  hasDescription: true  },
  { table: 'business_units',               label: 'Unidades de negocio',       hasStatus: true,  hasCode: true,  hasDescription: true  },
  { table: 'gerencias',                    label: 'Gerencias',                 hasStatus: true,  hasCode: true,  hasDescription: true  },
];

async function fetchCatalog(ds: DataSource, def: CatalogDef): Promise<RawCatalog[]> {
  try {
    const codeCol = def.hasCode ? 'code::text' : 'NULL::text';
    const descCol = def.hasDescription ? 'description' : 'NULL::text';
    const statusCol = def.hasStatus
      ? (def.table === 'workflow_definitions' ? `CASE WHEN is_active THEN 'active' ELSE 'inactive' END` : 'status::text')
      : 'NULL::text';
    const sql = `SELECT id::text, ${codeCol} AS code, name, ${descCol} AS description, ${statusCol} AS status FROM ${def.table} ORDER BY name`;
    const rows: any[] = await ds.query(sql);
    return rows.map(r => ({ catalog: def.label, id: r.id, code: r.code, name: r.name, description: r.description, status: r.status }));
  } catch {
    // Table may not exist in this DB instance; skip silently
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Validate required env vars (no values printed)
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
  for (const v of requiredVars) {
    safeEnvGet(v);
  }

  // Demo password shown for users with a password hash (never exposes the hash itself)
  const demoPassword = process.env.AURELIA_DEMO_USER_PASSWORD ?? 'Ver entorno · AURELIA_DEMO_USER_PASSWORD';

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: [],
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  console.log('[OK] Conectado a la base de datos (solo lectura)');

  try {
    // ── Queries ────────────────────────────────────────────────────────────
    const [users, userRolesRaw, userCompaniesRaw, userAreasRaw, companies, areas, sectors, roles, permissions, rolePermsRaw, catalogs] =
      await Promise.all([
        ds.query<RawUser[]>(`
          SELECT u.id, u.email, u.first_name, u.last_name, u.position, u.is_active,
                 u.company_id, c.name AS company_name,
                 u.area_id,    a.name AS area_name,
                 u.last_login_at, u.created_at, u.updated_at,
                 (u.password_hash IS NOT NULL) AS has_password
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          LEFT JOIN areas     a ON a.id = u.area_id
          ORDER BY u.last_name, u.first_name
        `),
        ds.query<RawUserRole[]>(`
          SELECT ur.user_id, ur.role_id, r.code AS role_code, r.name AS role_name, ur.created_at AS assigned_at
          FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          ORDER BY ur.user_id, r.name
        `),
        ds.query<RawUserCompany[]>(`
          SELECT uc.user_id, uc.company_id, c.name AS company_name, uc.created_at AS assigned_at
          FROM user_companies uc
          JOIN companies c ON c.id = uc.company_id
          ORDER BY uc.user_id, c.name
        `),
        ds.query<RawUserArea[]>(`
          SELECT ua.user_id, ua.area_id, a.name AS area_name, ua.created_at AS assigned_at
          FROM user_areas ua
          JOIN areas a ON a.id = ua.area_id
          ORDER BY ua.user_id, a.name
        `),
        ds.query<RawCompany[]>(`
          SELECT c.id, c.code, c.name, c.tax_id, c.company_type, c.is_contractor, c.status::text AS status,
                 COUNT(DISTINCT u.id) AS user_count, c.created_at, c.updated_at
          FROM companies c
          LEFT JOIN users u ON u.company_id = c.id
          GROUP BY c.id
          ORDER BY c.name
        `),
        ds.query<RawArea[]>(`
          SELECT a.id, a.code, a.name, a.description, a.status::text AS status,
                 a.gerencia_id, g.name AS gerencia_name,
                 COUNT(DISTINCT s.id) AS sector_count,
                 COUNT(DISTINCT u.id) AS user_count,
                 a.created_at, a.updated_at
          FROM areas a
          LEFT JOIN gerencias g ON g.id = a.gerencia_id
          LEFT JOIN sectors s   ON s.area_id = a.id
          LEFT JOIN users u     ON u.area_id = a.id
          GROUP BY a.id, g.name
          ORDER BY a.name
        `),
        ds.query<RawSector[]>(`
          SELECT s.id, s.code, s.name, s.description, s.status::text AS status,
                 s.area_id, a.name AS area_name, s.created_at, s.updated_at
          FROM sectors s
          LEFT JOIN areas a ON a.id = s.area_id
          ORDER BY s.name
        `),
        ds.query<RawRole[]>(`
          SELECT r.id, r.code, r.name, r.description, r.is_system, r.is_active,
                 COUNT(DISTINCT ur.user_id) AS user_count, r.created_at, r.updated_at
          FROM roles r
          LEFT JOIN user_roles ur ON ur.role_id = r.id
          GROUP BY r.id
          ORDER BY r.name
        `),
        ds.query<RawPermission[]>(`SELECT id, code, name, module, action, description, created_at FROM permissions ORDER BY module, action`),
        ds.query<RawRolePermission[]>(`
          SELECT rp.role_id, r.code AS role_code, r.name AS role_name,
                 p.code AS perm_code, p.name AS perm_name, p.module, p.action
          FROM role_permissions rp
          JOIN roles r ON r.id = rp.role_id
          JOIN permissions p ON p.id = rp.permission_id
          ORDER BY r.name, p.module, p.action
        `),
        Promise.all(CATALOG_DEFS.map(def => fetchCatalog(ds, def))).then(arr => arr.flat()),
      ]);

    // ── Build lookup maps ──────────────────────────────────────────────────
    const userRoleMap = new Map<string, RawUserRole[]>();
    for (const r of userRolesRaw) {
      const arr = userRoleMap.get(r.user_id) ?? [];
      arr.push(r);
      userRoleMap.set(r.user_id, arr);
    }
    const userCompanyMap = new Map<string, RawUserCompany[]>();
    for (const r of userCompaniesRaw) {
      const arr = userCompanyMap.get(r.user_id) ?? [];
      arr.push(r);
      userCompanyMap.set(r.user_id, arr);
    }
    const userAreaMap = new Map<string, RawUserArea[]>();
    for (const r of userAreasRaw) {
      const arr = userAreaMap.get(r.user_id) ?? [];
      arr.push(r);
      userAreaMap.set(r.user_id, arr);
    }

    // ── Quality alerts ─────────────────────────────────────────────────────
    const alerts: string[] = [];
    const emailSet = new Set<string>();
    for (const u of users) {
      if (emailSet.has(u.email)) alerts.push(`Email duplicado detectado: ${u.email}`);
      emailSet.add(u.email);
    }
    const usersWithoutRole = users.filter(u => !userRoleMap.has(u.id));
    if (usersWithoutRole.length > 0) {
      alerts.push(`${usersWithoutRole.length} usuario(s) sin rol asignado: ${usersWithoutRole.slice(0, 3).map(u => u.email).join(', ')}${usersWithoutRole.length > 3 ? '...' : ''}`);
    }
    const usersWithoutCompany = users.filter(u => !u.company_id);
    if (usersWithoutCompany.length > 0) {
      alerts.push(`${usersWithoutCompany.length} usuario(s) sin empresa principal asignada`);
    }
    const sectorsWithoutArea = sectors.filter(s => !s.area_id);
    if (sectorsWithoutArea.length > 0) {
      alerts.push(`${sectorsWithoutArea.length} sector(es) huérfano(s) sin área padre`);
    }
    const tempEmailPattern = /@(temp|test|example|mailinator|yopmail)\./i;
    const tempEmails = users.filter(u => tempEmailPattern.test(u.email));
    if (tempEmails.length > 0) {
      alerts.push(`${tempEmails.length} usuario(s) con correo temporal/de prueba`);
    }
    const inactiveUsers = users.filter(u => !u.is_active);
    if (inactiveUsers.length > 0) {
      alerts.push(`${inactiveUsers.length} usuario(s) inactivo(s) — verificar si deben depurarse`);
    }

    // ── Count summary ──────────────────────────────────────────────────────
    const counts = {
      users: users.length,
      activeUsers: users.filter(u => u.is_active).length,
      inactiveUsers: inactiveUsers.length,
      companies: companies.length,
      areas: areas.length,
      sectors: sectors.length,
      roles: roles.length,
      permissions: permissions.length,
      userCompanies: userCompaniesRaw.length,
      userAreas: userAreasRaw.length,
      userRoles: userRolesRaw.length,
      catalogs: catalogs.length,
    };

    // ── Build sheets ───────────────────────────────────────────────────────
    const branch = gitBranch();
    const commit = gitCommit();
    const timestamp = nowStamp();
    const artifactsDir = resolve(__dirname, '../../artifacts');
    const fileName = `AurelIA_Matriz_Maestros_${timestamp}.xlsx`;
    const filePath = join(artifactsDir, fileName);

    const sheets: XlsxSheet[] = [
      buildUsersSheet(users, userRoleMap, userCompanyMap, userAreaMap, demoPassword),
      buildUsuariosFlujos(users, userRoleMap),
      buildEmpresasSheet(companies),
      buildAreasSheet(areas),
      buildSectoresSheet(sectors),
      buildRolesSheet(roles),
      buildRolesPermisosSheet(rolePermsRaw),
      buildUsuariosEmpresasSheet(userCompaniesRaw, users),
      buildUsuariosAreasSheet(userAreasRaw, users),
      buildCatalogosSheet(catalogs),
      buildResumenSheet(counts, alerts),
      buildDiccionarioSheet(),
      buildMetadatosSheet(branch, commit, filePath),
    ];

    const xlsxService = new XlsxWorkbookService();
    const buffer = xlsxService.build(sheets, {
      title: 'AurelIA — Matriz Maestros',
      creator: 'export-master-data-matrix CLI',
      createdAt: new Date().toISOString(),
    });

    mkdirSync(artifactsDir, { recursive: true });
    writeFileSync(filePath, buffer);

    console.log('\n=== RESUMEN ===');
    console.log(`Usuarios:                      ${counts.users}`);
    console.log(`  · Activos:                   ${counts.activeUsers}`);
    console.log(`  · Inactivos:                 ${counts.inactiveUsers}`);
    console.log(`Empresas:                      ${counts.companies}`);
    console.log(`Áreas:                         ${counts.areas}`);
    console.log(`Sectores:                      ${counts.sectors}`);
    console.log(`Roles:                         ${counts.roles}`);
    console.log(`Permisos:                      ${counts.permissions}`);
    console.log(`Relaciones usuario-empresa:    ${counts.userCompanies}`);
    console.log(`Relaciones usuario-área:       ${counts.userAreas}`);
    console.log(`Relaciones usuario-rol:        ${counts.userRoles}`);
    console.log(`Catálogos (filas):             ${counts.catalogs}`);
    if (alerts.length > 0) {
      console.log('\n=== ALERTAS DE CALIDAD ===');
      for (const a of alerts) console.log(`  ⚠  ${a}`);
    }
    console.log(`\nArchivo generado: ${filePath}`);
    console.log(`Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`);

    process.exit(0);
  } finally {
    await ds.destroy();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  // Print error without exposing connection strings or secrets
  const sanitized = message
    .replace(/password=[^&\s]*/gi, 'password=***')
    .replace(/postgresql:\/\/[^\s]*/gi, 'postgresql://***');
  console.error('[ERROR]', sanitized);
  process.exit(1);
});
