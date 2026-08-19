export interface NavigationItem {
  to: string;
  key: string;
  label: string;
  hint: string;
}

export const mainNavItems: NavigationItem[] = [
  { to: '/', key: 'dashboard', label: 'Dashboard', hint: 'Resumen ejecutivo' },
  { to: '/inspections', key: 'inspections', label: 'Inspecciones', hint: 'Operacion en terreno' },
  { to: '/incidents', key: 'incidents', label: 'Incidentes', hint: 'Seguimiento ambiental' },
  { to: '/critical-controls', key: 'critical-controls', label: 'Controles criticos', hint: 'Matriz por area' },
  { to: '/reports', key: 'reports', label: 'Reportes', hint: 'Indicadores y cortes' },
];

export const settingsNavItems: NavigationItem[] = [
  { to: '/admin', key: 'admin', label: 'Administracion', hint: 'Usuarios y catalogos' },
];

export const allNavItems: NavigationItem[] = [...mainNavItems, ...settingsNavItems];