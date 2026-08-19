# Documentación de Aurelia

Base documental y técnica para los equipos de API, Web y Mobile. El objetivo es que cada equipo construya su parte con criterios consistentes, sin acoplarse entre sí, compartiendo contratos a través de `@aurelia/contracts`.

## Inicio rapido para IA y nuevos colaboradores

- Punto de entrada principal: [START_HERE.md](START_HERE.md)
- Ruta por tipo de intervención (API, DB, mobile offline, seguridad, contratos)
- Criterios para distinguir documentación canónica vs iterativa/histórica
- Flujo de actualización documental para mantener escalabilidad

## Índice

| Documento | Para qué sirve |
| --- | --- |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Qué es Aurelia, dominio funcional, roles, módulos y motivo del monorepo. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Estructura del monorepo, apps, packages, stack y flujo de datos. |
| [ONBOARDING_PLAYBOOK.md](ONBOARDING_PLAYBOOK.md) | Estado real por módulo, prioridades activas, guardrails y checklist operativo para nuevos devs. |
| [ONBOARDING_BRIEF_2_DEVS.md](ONBOARDING_BRIEF_2_DEVS.md) | Brief ejecutivo para arrancar onboarding de 2 devs con foco actual del proyecto. |
| [AI_PROMPT_MASTER_2_DEVS.md](AI_PROMPT_MASTER_2_DEVS.md) | Prompt maestro paste-ready para ejecutar tareas con IA bajo restricciones del proyecto. |
| [DAILY_REPORT_TEMPLATE_2_DEVS.md](DAILY_REPORT_TEMPLATE_2_DEVS.md) | Plantilla de reporte diario estandarizada para seguimiento PMO. |
| [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md) | Cómo se usa y se extiende `@aurelia/contracts` (la fuente de verdad de tipos). |
| [API_GUIDELINES.md](API_GUIDELINES.md) | Convenciones del backend NestJS: módulos, DTOs, validación, migraciones. |
| [FRONTEND_GUIDELINES.md](FRONTEND_GUIDELINES.md) | Convenciones de la web React + Vite. |
| [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) | Principios de diseño, estados de UI, accesibilidad, formularios. |
| [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) | Estrategia de estado: TanStack Query (server) + Zustand (cliente/UI). |
| [MOBILE_OFFLINE_STRATEGY.md](MOBILE_OFFLINE_STRATEGY.md) | Estrategia offline-first futura para las apps móviles. |
| [MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md](MOBILE_OFFLINE_STORAGE_MIGRATION_PLAN.md) | Plan técnico ejecutable para migrar persistencia offline mobile a storage nativo durable. |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | Setup, comandos, CI/CD por app afectada y estado actual del proyecto. |
| [database/04-ddl-postgres-current.sql](database/04-ddl-postgres-current.sql) | DDL operativo current-only alineado a entidades y migraciones vigentes. |
| [database/08-ddl-legacy-to-current-mapping.md](database/08-ddl-legacy-to-current-mapping.md) | Mapeo canónico entre nombres legacy del DDL y modelo actual de entidades/migraciones. |
| [DOCS_CLEANUP_BACKLOG.md](DOCS_CLEANUP_BACKLOG.md) | Backlog de optimización, consolidación y limpieza documental. |

## Estado actual del proyecto

Estado operativo resumido (documentación y código):

- Existe implementación activa por fases en API, con migraciones y entidades por módulo.
- El DDL draft puede tener drift puntual respecto al estado real de entidades/migraciones.
- La documentación de fases e iteraciones convive con documentación canónica, por lo que se debe iniciar en [START_HERE.md](START_HERE.md) antes de intervenir.

Para estado técnico detallado y comandos: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).
