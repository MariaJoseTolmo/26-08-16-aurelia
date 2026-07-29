# Dashboard EECC y canal de acceso de inspectores - 2026-07-28

## Alcance

Se implementó una experiencia diferenciada para la aplicación `mobile-inspecciones`:

1. Los usuarios con rol `INSPECTOR` pueden iniciar el flujo de nueva inspección desde mobile aunque una sesión antigua no exponga todavía la capacidad granular `inspections:create`.
2. Los usuarios de empresa contratista con rol `INSPECTION_RESPONSIBLE` reciben un dashboard de hallazgos asignados basado en los nodos Figma `693:34465` y `693:34568`.
3. Los usuarios con rol `INSPECTOR`, excepto quienes también tengan `ADMIN`, no pueden iniciar ni conservar una sesión web. El login mobile identifica explícitamente el cliente `mobile-inspecciones`.

## Fuente de diseño

La implementación se basó en el Design Context estructurado de Figma, no en capturas rasterizadas:

- `693:34465`: estado sin formularios pendientes.
- `693:34568`: estado con inspecciones y hallazgos asignados.

Se trasladaron a React Native los tamaños, jerarquías, colores, métricas, textos, estados vacíos, tarjetas y navegación inferior, reutilizando `StyleSheet`, tokens y assets locales del proyecto.

## Impacto

### Mobile

- Nuevo dashboard EECC con:
  - identificación visual `EECC`;
  - métricas de inspecciones asignadas, inspecciones abiertas y observaciones cerradas;
  - estado vacío perfilado;
  - tarjetas de hallazgos asignados con criticidades por estado;
  - pestañas `Mis hallazgos` e `Historial`;
  - apertura de los modales reales de detalle.
- El enrutamiento se decide por rol funcional y empresa: `INSPECTION_RESPONSIBLE`, sin `ADMIN` y con correo externo a Gold Fields.
- `INSPECTOR` obtiene capacidad de creación dentro de mobile.

### API y contratos

- `LoginRequest` incorpora el cliente de autenticación como campo opcional compatible con consumidores existentes.
- La API rechaza el login web para perfiles `INSPECTOR` que no sean también `ADMIN`.
- No se modificaron entidades ni esquema de base de datos.

### Web

- El cliente web declara `client: web`.
- Las sesiones almacenadas de inspectores se invalidan durante hidratación para impedir que una sesión previa conserve acceso al portal.

## Evidencia técnica

Flujo de autenticación:

```txt
web -> POST /auth/login { client: "web" } -> inspector no admin: 403
mobile-inspecciones -> POST /auth/login { client: "mobile-inspecciones" } -> permitido
```

Selección de dashboard mobile:

```txt
INSPECTION_RESPONSIBLE + empresa externa -> MobileAssignedFindingsScreen
resto de perfiles autorizados -> MobileInspectionManagementScreen
```

## Riesgos y límites

- La identificación del cliente de login es una política de aplicación; no sustituye mecanismos de attestation del dispositivo.
- El alcance de datos EECC continúa dependiendo del `ResourceScopeService`, que limita inspecciones por empresa y área.
- La fidelidad final debe validarse en Android/iOS reales, especialmente con nombres largos, chips múltiples y distintas densidades de pantalla.

## Validación requerida

```bash
pnpm --filter @aurelia/contracts build
pnpm --filter api build
pnpm --filter api lint
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
pnpm --filter mobile-inspecciones typecheck
pnpm --filter mobile-inspecciones lint
pnpm --filter mobile-inspecciones test:smoke
```

Validaciones funcionales:

1. Inspector Gold Fields: puede crear inspecciones desde mobile y no puede iniciar sesión en web.
2. Supervisor/responsable EECC: ve el dashboard perfilado y solo las inspecciones dentro de su alcance de empresa/área.
3. Usuario administrador: conserva acceso web y dashboard mobile general.
4. Estado EECC sin asignaciones y estado con asignaciones coinciden con los nodos Figma indicados.
