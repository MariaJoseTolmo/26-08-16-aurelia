# Decisión: roles funcionales por módulo

**Fecha:** 2026-07-17  
**Estado:** Implementado; validación de build, migración y pruebas de regresión pendiente  
**Migración:** `1783100000000-MigrateFunctionalRoles`

## 1. Problema

El catálogo inicial `ADMIN`, `SUPERVISOR`, `INSPECTOR`, `APPROVER`, `VIEWER` mezclaba responsabilidades de inspecciones, SPR, incidentes y controles críticos. `SUPERVISOR` e `INSPECTOR` acumulaban permisos de varios módulos y `APPROVER` no representaba una etapa de aprobación concreta.

Esto impedía distinguir, entre otros:

- quién crea una inspección y quién corrige una observación;
- quién puede aprobar o rechazar el cierre de una observación;
- responsable, gerente de área, especialista y aprobación final SPR;
- generación, validación, coordinación, superintendencia e investigación ICAM;
- verificación, ownership, supervisión y aprobación de controles críticos.

## 2. Catálogo vigente

### Transversal

- `ADMIN`
- `VIEWER`

### Inspecciones

- `INSPECTOR`
- `INSPECTION_RESPONSIBLE`
- `INSPECTION_CLOSURE_VERIFIER`

### SPR

- `SPR_RESPONSIBLE`
- `SPR_AREA_MANAGER`
- `SPR_SUSTAINABILITY_SPECIALIST`
- `SPR_ENVIRONMENT_MANAGER`

### Incidentes

- `INCIDENT_GENERATOR`
- `INCIDENT_ENV_VALIDATOR`
- `INCIDENT_ENV_COORDINATOR`
- `INCIDENT_SUPERINTENDENT`
- `INCIDENT_ICAM_LEAD`

### Controles críticos

- `CONTROL_VERIFIER`
- `CONTROL_OWNER`
- `CONTROL_SUPERINTENDENT`
- `CONTROL_MANAGER`
- `CONTROL_CORPORATE_APPROVER`

`SUPERVISOR` y `APPROVER` se mantienen temporalmente en el enum compartido para compatibilidad de compilación y tokens antiguos, pero la migración los deja inactivos y elimina sus asignaciones. La API no incorpora roles inactivos a nuevas sesiones y el catálogo administrativo solo expone roles activos.

## 3. Preservación de comportamiento

### Inspecciones

- Los usuarios que aparecen como `inspector_user_id` conservan `INSPECTOR`.
- Los responsables registrados en `inspection_findings` o `inspection_finding_responsibles` reciben `INSPECTION_RESPONSIBLE`.
- Los antiguos inspectores/supervisores Gold Fields reciben `INSPECTION_CLOSURE_VERIFIER`.
- Los antiguos inspectores/supervisores de empresas contratistas reciben `INSPECTION_RESPONSIBLE`.
- La revisión de cierre exige el permiso `inspections:review` y que el usuario pertenezca a la empresa principal/Gold Fields. Se conserva así la restricción organizacional previa, pero se elimina la autorización implícita basada solo en correo o empresa.

### SPR

- `INSPECTOR` deja de habilitar el formulario SPR.
- `SPR_RESPONSIBLE` habilita captura y envío.
- `SPR_AREA_MANAGER`, `SPR_SUSTAINABILITY_SPECIALIST` y `SPR_ENVIRONMENT_MANAGER` habilitan la vista de área.
- Las relaciones `responsible_user_id` y `approver_user_id` de `spr_parameter_area_assignments` tienen prioridad al reasignar usuarios.
- Los permisos existentes `spr:write`, `spr:submit` y `spr:approve` se conservan para no romper endpoints actuales.
- Se crean `spr:validate` y `spr:finalize` para separar etapas cuando los controladores implementen el workflow definitivo.

### Incidentes

El módulo está parcialmente implementado. Los roles quedan creados y reciben los permisos existentes necesarios para mantener el API actual. También se crean permisos más granulares de validación, coordinación, ICAM y cierre, pero su exigencia endpoint por endpoint queda pendiente para la expansión funcional del módulo.

### Controles críticos

Los permisos existentes `critical-controls:read/write/submit/approve` se redistribuyen entre los cinco roles funcionales. Las relaciones reales de asignación y autoevaluación se utilizan para inferir owner, verificador y validador.

## 4. Reasignación de usuarios

La migración aplica estas fuentes en orden acumulativo:

1. **Relaciones reales del dominio**: inspector, responsable de hallazgo, asignación SPR, reportante/validador/líder de incidente y responsables/validadores de controles.
2. **Roles legados**: se otorgan roles funcionales equivalentes para preservar las capacidades actuales.
3. **Cargo explícito** (`users.position`): solo para perfiles inequívocos como gerente de Medio Ambiente, coordinador, superintendente, especialista de Sustentabilidad o líder ICAM.

Un usuario puede recibir múltiples roles. No se intenta reducirlo a un único perfil porque Aurelia ya soporta `user_roles` muchos-a-muchos.

## 5. Workflows

Las referencias de `workflow_definition_steps.required_role_id` y `workflow_instance_steps.assigned_role_id` que apuntaban a `SUPERVISOR` o `APPROVER` se remapean según el `entity_type`:

| Dominio | `SUPERVISOR` | `APPROVER` |
| --- | --- | --- |
| Inspecciones | `INSPECTION_CLOSURE_VERIFIER` | `INSPECTION_CLOSURE_VERIFIER` |
| SPR | `SPR_AREA_MANAGER` | `SPR_SUSTAINABILITY_SPECIALIST` |
| Incidentes | `INCIDENT_SUPERINTENDENT` | `INCIDENT_ENV_VALIDATOR` |
| Controles | `CONTROL_SUPERINTENDENT` | `CONTROL_CORPORATE_APPROVER` |

## 6. Ejecución

Respaldar la base antes de migrar.

```powershell
git fetch aurelia-old feature/inspecciones/carlo
git merge --ff-only aurelia-old/feature/inspecciones/carlo

pnpm --filter @aurelia/contracts build
pnpm --filter api build
pnpm --filter web typecheck

pnpm --filter api migration:run
```

Para una base donde las migraciones no se administren todavía, el seed equivalente es idempotente:

```powershell
pnpm --filter api seed:functional-roles
```

No es necesario ejecutar migración y seed sobre la misma base.

## 7. Renovación de sesiones

Los JWT existentes contienen roles y permisos anteriores. Después de aplicar la migración:

1. reiniciar la API;
2. cerrar sesiones activas o solicitar a todos los usuarios cerrar sesión;
3. iniciar sesión nuevamente para emitir tokens con roles activos.

## 8. Consultas de verificación

### Catálogo activo

```sql
SELECT code, name, is_active
FROM roles
ORDER BY code;
```

### No deben existir asignaciones legadas

```sql
SELECT r.code, COUNT(*)
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE r.code IN ('SUPERVISOR', 'APPROVER')
GROUP BY r.code;
```

Resultado esperado: cero filas.

### Usuarios activos sin rol activo

```sql
SELECT u.id, u.email, u.position
FROM users u
WHERE u.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id
      AND r.is_active = true
  );
```

Resultado esperado: cero filas.

### Roles por usuario

```sql
SELECT
  u.email,
  u.position,
  string_agg(r.code, ', ' ORDER BY r.code) AS roles
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id AND r.is_active = true
GROUP BY u.id, u.email, u.position
ORDER BY u.email;
```

### Verificadores de cierre

```sql
SELECT u.email, c.name AS company
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
LEFT JOIN companies c ON c.id = u.company_id
WHERE r.code = 'INSPECTION_CLOSURE_VERIFIER';
```

Revisar que solo usuarios Gold Fields/empresa principal hayan recibido este rol.

## 9. Validación funcional mínima

- Inspector Gold Fields: puede crear inspecciones y revisar cierre si tiene ambos roles.
- Inspector sin rol de cierre: puede levantar inspecciones, pero no aprobar/rechazar evidencias.
- Responsable EECC: puede trabajar sobre observaciones dentro de su alcance de empresa.
- Responsable SPR: abre el formulario SPR y puede enviar registros.
- Gerente de área SPR: abre `Mi área` y conserva aprobación.
- Viewer: mantiene lectura sin escritura.
- Admin: mantiene todos los permisos.

## 10. Pendientes deliberados

- Aplicar los nuevos permisos granulares a endpoints específicos del flujo definitivo de incidentes.
- Aplicar `spr:validate` y `spr:finalize` cuando existan las acciones separadas en el backend.
- Revisar manualmente usuarios con cargos ambiguos. La migración prioriza continuidad operacional y puede otorgar más de un rol funcional a antiguos `SUPERVISOR`/`APPROVER`.
- Eliminar físicamente `SUPERVISOR` y `APPROVER` del enum y de la tabla solo después de confirmar que no existen tokens, integraciones ni datos históricos que los referencien.
