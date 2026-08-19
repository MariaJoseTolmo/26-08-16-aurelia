# START_HERE

Guia de entrada para cualquier IA o colaborador que intervenga en Aurelia.

Objetivos:
- Reducir tiempo de contexto inicial.
- Evitar cambios sin leer la documentación minima necesaria.
- Mantener consistencia entre contratos, API, base de datos y apps.

## 1) Regla de arranque (obligatoria)

Antes de cualquier cambio:
1. Leer [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).
2. Leer [ARCHITECTURE.md](ARCHITECTURE.md).
3. Leer [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).
4. Si eres colaborador nuevo, leer [ONBOARDING_PLAYBOOK.md](ONBOARDING_PLAYBOOK.md).
5. Elegir una ruta de intervención de la sección 2.

## 2) Rutas de lectura por tipo de intervención

### 2.0 Foco funcional asignado (antes del tipo de cambio)

Si el desarrollador parte con una instruccion orientada a modulo, usar primero esta decision:

- `inspections` web: seguir lectura de frontend + estado + contratos.
- `mobile-inspecciones`: seguir lectura de mobile offline + contratos.
- `incidents` web/mobile: leer contexto y arquitectura, pero asumir estado parcial / placeholder salvo autorizacion explicita.
- `api` / `contracts` / `database`: seguir rutas A, B o E segun corresponda.

Cuando el foco sea `incidents`, la IA debe detenerse y explicitar en su plan que el modulo no esta hoy en expansion funcional por defecto.

### A. Cambio de endpoint API
1. [API_GUIDELINES.md](API_GUIDELINES.md)
2. [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md)
3. [docs/api](api)
4. Documento de fase aplicable en [docs/database](database)

### B. Cambio de esquema DB o migraciones
1. [docs/database/02-domain-model.md](database/02-domain-model.md)
2. [docs/database/04-ddl-postgres-current.sql](database/04-ddl-postgres-current.sql)
3. [docs/database/08-ddl-legacy-to-current-mapping.md](database/08-ddl-legacy-to-current-mapping.md)
4. [docs/database/04-ddl-postgres-draft.sql](database/04-ddl-postgres-draft.sql)
5. [docs/database/05-typeorm-entities-plan.md](database/05-typeorm-entities-plan.md)
6. [API_GUIDELINES.md](API_GUIDELINES.md)
7. Migraciones reales en `apps/api/src/database/migrations`

### C. Cambio mobile offline
1. [MOBILE_OFFLINE_STRATEGY.md](MOBILE_OFFLINE_STRATEGY.md)
2. [docs/database/07-mobile-sync-ddl.md](database/07-mobile-sync-ddl.md)
3. [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md)
4. Documentacion de app movil afectada

### D. Seguridad / hardening
1. [API_GUIDELINES.md](API_GUIDELINES.md)
2. [docs/security/security-report-methodology.md](security/security-report-methodology.md)
3. Iteraciones en [docs/security](security)

### E. Contratos compartidos
1. [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md)
2. [ARCHITECTURE.md](ARCHITECTURE.md)
3. [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)
4. Ver consumidores (api/web/mobile) antes de cambiar tipos

## 3) Taxonomia documental (escalabilidad)

Usar esta clasificacion para mantener orden:
- Canonica: define reglas activas y decisiones vigentes.
- Fase: plan o cierre de una fase de implementacion.
- Iteracion: registro incremental de una mejora puntual.
- Referencia: material externo o inspiracional.
- Historica: registro antiguo no vigente para ejecutar cambios nuevos.

Recomendacion de naming para nuevos archivos:
- `phaseN-topic-YYYY-MM-DD.md`
- `iteration-topic-YYYY-MM-DD.md`
- `decision-topic-YYYY-MM-DD.md`

## 4) Flujo de iteracion documental (obligatorio)

Cada intervención debe cerrar con:
1. Alcance: que se toco y por que.
2. Impacto: modulos afectados (API, DB, web, mobile, contracts).
3. Evidencia: migracion/endpoint/tabla/contrato actualizado.
4. Riesgos: impactos pendientes o drift conocido.
5. Siguiente accion: quien valida y que falta.

Si el cambio nace desde un foco de modulo (por ejemplo: "hoy trabajaras en incidentes web"), el reporte debe indicar ademas:
6. Documentos leidos en orden.
7. Confirmacion de si el modulo estaba habilitado para expansion funcional o solo mantenimiento tecnico.

## 5) Regla anti-drift (DDL vs entidades)

Si se crea o cambia una entidad TypeORM que implique persistencia:
1. Actualizar migracion correspondiente.
2. Revisar [docs/database/04-ddl-postgres-draft.sql](database/04-ddl-postgres-draft.sql).
3. Registrar decision si hay divergencia de naming entre DDL y entidades.
4. Actualizar backlog de limpieza en [DOCS_CLEANUP_BACKLOG.md](DOCS_CLEANUP_BACKLOG.md).

## 6) Donde registrar deuda documental

Toda inconsistencia o documento potencialmente obsoleto debe quedar en:
- [DOCS_CLEANUP_BACKLOG.md](DOCS_CLEANUP_BACKLOG.md)

No borrar documentacion historica sin confirmar ownership funcional/tecnico del dominio.
