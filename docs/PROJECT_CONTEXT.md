# PROJECT_CONTEXT

## Qué es Aurelia

Aurelia es una **plataforma ambiental centralizada** para la gestión de controles críticos, inspecciones, incidentes, evidencias, flujos de aprobación, reportabilidad, alertas y asistencia con IA.

La plataforma se compone de:

- **Una web central por roles** — operación, supervisión, aprobación, administración y visualización.
- **Dos apps móviles** para registro en terreno: una de **inspecciones** y otra de **incidentes**.
- **Una API central** conectada a una base de datos común.

## Dominio funcional

Conceptos transversales del negocio (compartidos entre apps):

- **MUE** — unidad mayor (mina, planta, depósito, instalación, puerto).
- **Áreas** — subdivisiones operativas dentro de una MUE.
- **Controles críticos** — controles asociados a un área.
- **Inspecciones** — registros de verificación en terreno, con estados y flujo de aprobación.
- **Incidentes** — eventos ambientales con tipo, nivel de riesgo y seguimiento.
- **Evidencias** — fotos, documentos, GPS y formularios asociados a inspecciones/incidentes.
- **Flujos de aprobación** — registrar → revisar → validar → aprobar / devolver.
- **Reportabilidad** — segmentada por área, MUE, estado, responsable y criticidad.

> El modelo de datos definitivo y las reglas de negocio continúan evolucionando por módulo. Las responsabilidades funcionales se representan mediante roles específicos y permisos; el alcance de empresa/área se resuelve además con las asignaciones organizacionales del usuario.

## Roles

Catálogo funcional vigente:

| Dominio | Rol | Responsabilidad principal |
| --- | --- | --- |
| Transversal | `ADMIN` | Administración integral de usuarios, catálogos, permisos y configuración. |
| Transversal | `VIEWER` | Consulta y reportabilidad en modo lectura. |
| Inspecciones | `INSPECTOR` | Crear y ejecutar inspecciones en terreno. |
| Inspecciones | `INSPECTION_RESPONSIBLE` | Ejecutar acciones correctivas y adjuntar evidencias de observaciones asignadas. |
| Inspecciones | `INSPECTION_CLOSURE_VERIFIER` | Revisar evidencias y aprobar o rechazar cierres de observaciones. |
| SPR | `SPR_RESPONSIBLE` | Registrar y enviar datos mensuales de su área. |
| SPR | `SPR_AREA_MANAGER` | Revisar y aprobar los datos del área responsable. |
| SPR | `SPR_SUSTAINABILITY_SPECIALIST` | Validar técnicamente consolidación y evidencias. |
| SPR | `SPR_ENVIRONMENT_MANAGER` | Autorizar el cierre final del período. |
| Incidentes | `INCIDENT_GENERATOR` | Registrar incidentes, acciones inmediatas y Flash Report. |
| Incidentes | `INCIDENT_ENV_VALIDATOR` | Validar técnicamente incidentes y Flash Report. |
| Incidentes | `INCIDENT_ENV_COORDINATOR` | Coordinar clasificación, seguimiento y escalamiento. |
| Incidentes | `INCIDENT_SUPERINTENDENT` | Supervisar investigación, acciones y cierre. |
| Incidentes | `INCIDENT_ICAM_LEAD` | Liderar investigaciones ICAM. |
| Controles críticos | `CONTROL_VERIFIER` | Ejecutar verificaciones y autoevaluaciones. |
| Controles críticos | `CONTROL_OWNER` | Gestionar el cumplimiento y las evidencias del control asignado. |
| Controles críticos | `CONTROL_SUPERINTENDENT` | Supervisar y validar controles de su ámbito. |
| Controles críticos | `CONTROL_MANAGER` | Aprobar resultados y planes de acción. |
| Controles críticos | `CONTROL_CORPORATE_APPROVER` | Realizar la aprobación corporativa final. |

`SUPERVISOR` y `APPROVER` son códigos legados. La migración `1783100000000-MigrateFunctionalRoles` reasigna sus usuarios, actualiza referencias de workflow y los deja inactivos. No deben utilizarse para nuevas asignaciones.

La autorización efectiva combina:

1. roles funcionales;
2. permisos por acción;
3. empresa, área y asignación contextual del recurso.

## Módulos

| Módulo | Web | Mobile | API |
| --- | --- | --- | --- |
| Dashboard | ✓ | | |
| Inspecciones | ✓ | ✓ (app inspecciones) | ✓ |
| Incidentes | Parcial / placeholder | Parcial / placeholder (app incidentes) | ✓ |
| Controles críticos | ✓ | | ✓ |
| Evidencias | ✓ | ✓ | ✓ |
| Workflows / aprobaciones | ✓ | | ✓ |
| Reportes | ✓ | | ✓ |
| Administración (usuarios, roles, MUE, áreas) | ✓ | | ✓ |
| Notificaciones / IA | En evolución | | En evolución |

Nota de estado actual (2026-07): el desarrollo funcional activo está concentrado en inspecciones (web + mobile-inspecciones). El módulo de incidentes no está en foco funcional de implementación en esta etapa; sus roles se incorporan para dejar preparado el modelo de autorización, no para declarar el flujo completo terminado.

## Motivo del monorepo

Web, móviles y API comparten conceptos transversales: MUE, áreas, roles, estados, tipos de inspección/incidente, niveles de riesgo, evidencias, observaciones, flujos de aprobación y **los contratos HTTP** entre frontend, móviles y backend.

El monorepo permite **compartir esos contratos (enums, types, interfaces y request/response) en tiempo de desarrollo/build** mediante `@aurelia/contracts`, evitando duplicar definiciones entre apps.

Regla central: **el frontend y las móviles NO se acoplan a NestJS, TypeORM ni `class-validator`.** Solo consumen tipos agnósticos. Ver [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md).

Aunque cada app se despliega de forma independiente, comparte la misma fuente de verdad de tipos. Detalle técnico en [ARCHITECTURE.md](ARCHITECTURE.md).
