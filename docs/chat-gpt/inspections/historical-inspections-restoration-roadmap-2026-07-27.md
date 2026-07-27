# Roadmap de restauración histórica de inspecciones

**Fecha:** 2026-07-27  
**Estado:** diagnóstico cerrado; pendiente implementación por fases  
**Fuente:** `Planilla de inspecciones Medio Ambiente.xlsx`, hoja `CONSOLIDADO`  
**Volumen identificado:** 2.308 inspecciones históricas  
**Periodo:** 2023 al 19-02-2026

## 1. Objetivo

Restaurar en Aurelia las inspecciones de Medio Ambiente realizadas antes de la existencia del módulo actual, de modo que queden disponibles como información histórica consultable, filtrable y auditable.

La restauración debe conservar la información real disponible en el Excel sin inventar entidades operacionales que nunca existieron en Aurelia.

## 2. Decisión arquitectónica principal

La importación se realizará como **histórico resumido**.

Cada fila válida de `CONSOLIDADO` producirá:

1. Una fila en `inspections`.
2. Una fila de trazabilidad en `inspection_legacy_imports`.
3. Cero a tres hitos agregados en `inspection_legacy_milestones`.
4. Una entrada inicial en `inspection_status_history`.

No se crearán artificialmente:

- hallazgos en `inspection_findings`;
- respuestas de checklist en `inspection_checklist_answers`;
- seguimientos por observación en `inspection_followups`;
- evidencias fotográficas;
- usuarios ficticios con capacidad de autenticación;
- respuestas a templates actuales.

Esta decisión está respaldada por el modelo real:

- `inspection_followups` exige `finding_id` y una secuencia entre 1 y 3;
- `inspection_checklist_answers` exige `checklist_item_id`;
- no existen triggers que recalculen los contadores de `inspections`;
- ya existen inspecciones actuales cuyos contadores declarados no coinciden con la cantidad física de hallazgos;
- `findings_count` y `open_findings_count` pueden representar información histórica agregada.

## 3. Alcance

### 3.1 Incluido

- Inspecciones de la hoja `CONSOLIDADO`.
- Áreas, empresas e inspectores históricos.
- Estado final abierto o cerrado.
- Total de observaciones.
- Observaciones pendientes al último hito válido.
- Seguimientos S1, S2 y S3 como hitos agregados.
- Texto original de área, sector, empresa, inspector y detalle.
- Trazabilidad completa hasta archivo, hoja y fila fuente.
- Importación idempotente.
- Dry-run y conciliación antes de insertar.
- Visualización de registros históricos en Gestión/Historial en modo de solo lectura.

### 3.2 Fuera de alcance

- Reconstrucción de hallazgos individuales.
- Reconstrucción de respuestas por ítem de checklist.
- Carga de fotografías o archivos no contenidos en la fuente.
- Generación de responsables por hallazgo.
- Reapertura, reasignación, aprobación, rechazo o ejecución de registros históricos.
- Prórrogas, disputas y vencimientos escalonados.
- Conversión de inspectores históricos en usuarios autenticables.
- Asignación artificial de sectores operacionales actuales a macrozonas históricas.

## 4. Evidencia confirmada en la base de datos

### 4.1 Catálogos organizacionales

Existen:

- `business_units`;
- `gerencias`;
- `areas`;
- `sectors`;
- `locations`.

`areas.gerencia_id` admite `NULL`. Las áreas actuales informadas no tienen gerencia asociada, por lo que las áreas históricas pueden crearse inicialmente sin gerencia.

No existen sectores sin área y `locations` no contiene registros útiles para esta restauración.

### 4.2 Estados

Estados de inspección disponibles:

- `draft`;
- `scheduled`;
- `in_progress`;
- `submitted`;
- `under_review`;
- `returned`;
- `closed`;
- `cancelled`.

Mapeo histórico recomendado:

| Excel | Aurelia |
|---|---|
| Abierto | `in_progress` |
| Cerrado | `closed` |

### 4.3 Tipos y templates

Todos los registros actuales de Hallazgo y Checklist usan:

- `inspection_type_id`: `environmental`;
- nombre: `Inspección ambiental`.

La distinción operacional actual es:

- Hallazgo: `template_id IS NULL`;
- Checklist: `template_id IS NOT NULL`.

Sólo existe el template:

- `TPL-ENV-GENERAL-001`;
- `Checklist ambiental general`;
- versión 1;
- tres ítems.

Los checklist históricos no deben vincularse automáticamente a este template porque el Excel no contiene respuestas a sus ítems y los checklist históricos corresponden a múltiples materias distintas.

Por lo tanto:

- todos los históricos usarán `inspection_type_id = environmental`;
- todos usarán `template_id = NULL`;
- `legacy_mode` indicará `finding` o `checklist`;
- frontend y API usarán `legacy_mode` para mostrar el badge histórico correcto.

## 5. Volumen y consistencia de la fuente

La hoja `CONSOLIDADO` contiene 2.308 claves únicas por:

```text
AÑO + Nº
```

Totales conciliados:

- 18.214 observaciones totales;
- 18.051 observaciones cerradas;
- 163 observaciones pendientes.

La base no contiene inspecciones entre 2023-01-01 y 2026-02-19, por lo que no existe solapamiento temporal conocido con los registros a restaurar.

## 6. Interpretación de seguimientos

Las columnas de observaciones cerradas de S1, S2 y S3 son **incrementales**, no acumuladas.

Ejemplo:

```text
Inspección inicial: 1 cerrada
S1:                 3 cerradas adicionales
S2:                 2 cerradas adicionales
Total cerrado:      6
```

Reglas:

```text
findings_count = Nº Observaciones
```

```text
closed_final =
  closed_initial
  + closed_s1
  + closed_s2
  + closed_s3
```

```text
open_findings_count =
  pendientes del último seguimiento con fecha real;
  si no existe seguimiento con fecha, pendientes de la inspección inicial
```

No se considerará válido un valor calculado en S1/S2/S3 cuando:

- la fecha del seguimiento esté vacía;
- la fecha sea una fórmula residual sin hito real;
- la fecha sea anterior a la inspección sin justificación;
- la fecha no respete la secuencia cronológica.

Los valores descartados se conservarán en `raw_payload` y generarán una advertencia.

## 7. Modelo de datos propuesto

### 7.1 Tabla `inspection_legacy_imports`

```sql
CREATE TABLE inspection_legacy_imports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  inspection_id uuid NOT NULL UNIQUE
    REFERENCES inspections(id) ON DELETE CASCADE,

  source_system varchar(100) NOT NULL,
  source_file_name varchar(255) NOT NULL,
  source_sheet varchar(100) NOT NULL,
  source_row integer NOT NULL,

  legacy_year integer NOT NULL,
  legacy_number integer NOT NULL,

  legacy_mode varchar(30) NOT NULL,
  legacy_inspector_name varchar(255),
  legacy_area_name varchar(255),
  legacy_company_name varchar(255),
  legacy_sector_name text,
  legacy_detail text,

  raw_payload jsonb NOT NULL,
  import_warnings jsonb,

  imported_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_inspection_legacy_mode
    CHECK (legacy_mode IN ('finding', 'checklist')),

  CONSTRAINT uq_inspection_legacy_source
    UNIQUE (source_system, legacy_year, legacy_number)
);
```

Índices recomendados:

```sql
CREATE INDEX idx_inspection_legacy_year_number
  ON inspection_legacy_imports (legacy_year, legacy_number);

CREATE INDEX idx_inspection_legacy_mode
  ON inspection_legacy_imports (legacy_mode);

CREATE INDEX idx_inspection_legacy_inspector_name
  ON inspection_legacy_imports (lower(legacy_inspector_name));

CREATE INDEX idx_inspection_legacy_company_name
  ON inspection_legacy_imports (lower(legacy_company_name));

CREATE INDEX idx_inspection_legacy_area_name
  ON inspection_legacy_imports (lower(legacy_area_name));
```

### 7.2 Tabla `inspection_legacy_milestones`

```sql
CREATE TABLE inspection_legacy_milestones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  legacy_import_id uuid NOT NULL
    REFERENCES inspection_legacy_imports(id) ON DELETE CASCADE,

  sequence_number integer NOT NULL,
  occurred_at date NOT NULL,

  closed_increment integer NOT NULL DEFAULT 0,
  pending_after integer NOT NULL DEFAULT 0,

  closed_percentage numeric(5,2),
  pending_percentage numeric(5,2),

  raw_payload jsonb,

  CONSTRAINT chk_legacy_milestone_sequence
    CHECK (sequence_number BETWEEN 1 AND 3),

  CONSTRAINT chk_legacy_milestone_counts
    CHECK (closed_increment >= 0 AND pending_after >= 0),

  CONSTRAINT uq_legacy_milestone_sequence
    UNIQUE (legacy_import_id, sequence_number)
);
```

### 7.3 No modificar `inspection_followups`

Los hitos históricos no deben insertarse en `inspection_followups` porque:

- esa tabla representa seguimiento de un hallazgo individual;
- exige `finding_id`;
- crear un hallazgo por contador falsearía la semántica del dato.

## 8. Mapeo a `inspections`

| Campo destino | Regla |
|---|---|
| `inspection_type_id` | UUID de `environmental`: `fb8d8d6c-7e7c-4eba-9e12-2fe809e6ef5f` |
| `template_id` | `NULL` para todos los históricos |
| `company_id` | Coincidencia directa, alias aprobado o empresa histórica archivada |
| `area_id` | Coincidencia directa, alias aprobado o área histórica archivada |
| `sector_id` | `NULL` |
| `location_id` | `NULL` |
| `inspector_user_id` | Karen Opazo cuando corresponda; resto `NULL` |
| `title` | Descripción/tipo histórico + área + fecha |
| `description` | Resumen breve del origen histórico |
| `status` | `closed` o `in_progress` |
| `started_at` | Fecha de inspección del Excel |
| `completed_at` | Fecha de inspección para registros válidos |
| `closed_at` | Primer hito real en que pendientes llega a cero; si no existe hito, fecha de inspección cuando ya figura cerrado |
| `findings_count` | Nº Observaciones |
| `open_findings_count` | Pendientes del último hito válido |
| `score` | `NULL` |
| `notes` | Marcador legible de restauración histórica |
| `created_at` | Fecha de importación, no fecha histórica |
| `updated_at` | Fecha de importación |

`raw_payload` conservará todos los valores originales, incluidas celdas no mapeadas.

## 9. Historial de estado

Cada inspección importada tendrá una fila en `inspection_status_history`:

```text
from_status = NULL
to_status   = closed | in_progress
reason      = historical inspection restoration
metadata    = {
  sourceSystem,
  sourceFile,
  sourceSheet,
  sourceRow,
  legacyYear,
  legacyNumber
}
```

La implementación debe respetar el patrón actual de la tabla, donde la creación usa `from_status = NULL`.

No se reconstruirán transiciones intermedias inexistentes.

## 10. Homologación de áreas

### 10.1 Coincidencias directas o normalizadas

| Excel | Base |
|---|---|
| Exploraciones | Exploraciones |
| Mantención | Mantención |
| Medio Ambiente | Medio Ambiente |
| Mina | Mina |
| Planta Procesos | Planta Procesos |
| Planta procesos | Planta Procesos |
| Planta de procesos | Planta Procesos |
| Planta de proceso | Planta Procesos |
| Servicios Generales | Servicios Generales |
| Sustaining | Sustaining |

Cobertura estimada: 1.595 inspecciones.

### 10.2 Áreas históricas faltantes

| Área histórica | Registros |
|---|---:|
| Construcción | 647 |
| Gestión activos | 18 |
| Seguridad Patrimonial | 16 |
| Gerencia de Operaciones | 11 |
| HS | 11 |
| IT | 9 |
| Finanzas | 1 |

Total: 713 inspecciones.

Decisión:

- crear estas áreas como `archived`;
- `gerencia_id = NULL`;
- código determinístico prefijado, por ejemplo `HIST-AREA-CONSTRUCCION`;
- no mostrarlas en creación de nuevas inspecciones;
- sí permitirlas en filtros e informes históricos.

## 11. Homologación de empresas

### 11.1 Cobertura

- 1.425 filas con coincidencia directa o por mayúsculas;
- 156 filas con alias altamente probable;
- 727 filas asociadas a empresas ausentes o pendientes de revisión.

### 11.2 Alias aprobables técnicamente

| Valor Excel | Empresa existente |
|---|---|
| Copec-CSI | COPEC |
| CSI-Copec | COPEC |
| Scaf logística | SCAF |
| RS Ingeniería | RS ING |
| Develp | DEVLE |
| Eco Minera | ECO MINING |
| Hidromotions | HIDROMOTORES |
| Geomafe | GEOMAV |
| TREBA | TREBIA |

Estos alias deben declararse en un archivo de configuración versionado, no resolverse por similitud durante la importación.

### 11.3 Equivalencias que requieren aprobación del cliente

```text
Hintek  → HINTER
Pucará  → PUUCA
```

### 11.4 Empresas históricas faltantes

Las empresas sin equivalencia segura deben crearse como catálogo histórico:

```text
status = archived
is_contractor = true
```

El esquema actual no expuso un `company_type` obligatorio. Si existe en la entidad, debe usarse un valor soportado; no introducir `'historical'` sin verificar el contrato real.

Código recomendado:

```text
HIST_SERVITRAM
HIST_RENTAMAQ
HIST_ALMAR_WATER
```

La matriz final debe incluir las 36 empresas históricas detectadas, entre ellas:

- Servitram;
- RENTAMAQ;
- Almar Water;
- WESTFIRE;
- ACP;
- ALS;
- EVH;
- Hualpen;
- MKL;
- MyP;
- TERRACORP;
- Sodexo;
- Mineral Drilling;
- KDM;
- Rentaclima;
- Wenco;
- Andinor;
- CEI Atacama;
- OMT;
- Nortenergy;
- SQ Templo.

### 11.5 Corrección de Gold Fields

El registro actual de Gold Fields aparece con `is_contractor = true`.

Debe corregirse mediante migración revisada:

```sql
UPDATE companies
SET is_contractor = false
WHERE id = '3252bece-a2df-4471-a270-da9ca8decd9d';
```

No ejecutar manualmente fuera de la migración.

## 12. Inspectores históricos

Coincidencia directa confirmada:

```text
Karen Opazo S. → Karen Opazo
user_id: d1e87725-1a0a-4006-8336-f8138ee7f29e
848 inspecciones
```

El resto de los nombres no existe como usuario actual y se conservará en `legacy_inspector_name` con `inspector_user_id = NULL`.

No crear cuentas ficticias.

Inspectores principales pendientes de usuario:

| Nombre histórico | Registros |
|---|---:|
| Janina Santander T. | 664 |
| Francisco Báez A. | 527 |
| Camila Zapata | 62 |
| Javier Guzmán B. | 52 |
| Patricio Acuña G. | 43 |
| Marjorie Yañez P. | 32 |
| Catalina Cortés M. | 27 |
| Daniel Martínez Y. | 25 |
| Aurora Hidalgo M. | 19 |
| Diego Aguilera S. | 1 |

La autoría múltiple se conservará literalmente:

```text
Daniel Martinez; Camila Zapata
Marjorie Yañez/Catalina Cortés
```

## 13. Sectores y ubicaciones

No se realizará mapeo automático a `sectors` ni `locations`.

Razones:

- el Excel contiene macrozonas y agrupaciones físicas;
- una misma denominación aparece asociada a varias áreas;
- algunos registros contienen múltiples sectores separados por comas;
- los sectores actuales son entidades operacionales específicas;
- `locations` no contiene catálogo que permita homologación segura.

Regla:

```text
sector_id = NULL
location_id = NULL
legacy_sector_name = valor original
legacy_detail = valor original
```

Los filtros históricos deberán considerar `legacy_sector_name`.

## 14. Hallazgo versus Checklist histórico

Distribución:

- 1.997 Hallazgo;
- 311 Checklist.

Regla:

```text
legacy_mode = finding | checklist
inspection_type_id = environmental
template_id = NULL
```

El frontend no debe inferir que un histórico con `template_id = NULL` siempre es Hallazgo. Cuando exista `inspection_legacy_imports`, `legacy_mode` tiene precedencia para el badge.

## 15. Cuarentena y excepciones

### 15.1 Registro sin total de observaciones

```text
Año: 2026
Nº: 120
Fecha: 19-02-2026
Empresa: MKL
Estado: Abierto
Nº Observaciones: vacío
```

Decisión inicial: cuarentena. No importar hasta confirmar el total o aprobar explícitamente `0`.

### 15.2 Anomalías cronológicas

Casos identificados:

```text
2023 Nº 234
2023 Nº 242
2024 Nº 119
2024 Nº 227
2025 Nº 15
2025 Nº 516
```

Caso evidente:

```text
Inspección: 18-07-2025
S1:         19-01-1900
S2:         24-07-2025
```

Regla:

- descartar el hito con fecha 1900;
- conservar sus valores en `raw_payload`;
- agregar advertencia `INVALID_MILESTONE_DATE`;
- utilizar el siguiente hito cronológicamente válido;
- no corregir silenciosamente fechas ambiguas.

## 16. Archivo de homologación versionado

Crear un archivo legible por el importador, por ejemplo:

```text
apps/api/src/modules/inspection-legacy-import/config/catalog-aliases.json
```

Estructura mínima:

```json
{
  "areas": {
    "planta procesos": "99396f81-c09a-4194-b3bf-ffaec94e89ba",
    "planta de procesos": "99396f81-c09a-4194-b3bf-ffaec94e89ba"
  },
  "companies": {
    "copec-csi": "06a0a9ce-fe13-4a0d-869a-e9354909ba6c",
    "csi-copec": "06a0a9ce-fe13-4a0d-869a-e9354909ba6c"
  },
  "inspectors": {
    "karen opazo s.": "d1e87725-1a0a-4006-8336-f8138ee7f29e"
  }
}
```

No almacenar decisiones de homologación sólo en código imperativo.

## 17. Arquitectura del importador

Módulo propuesto:

```text
apps/api/src/modules/inspection-legacy-import/
  inspection-legacy-import.module.ts
  inspection-legacy-import.service.ts
  inspection-legacy-normalizer.service.ts
  inspection-legacy-resolver.service.ts
  inspection-legacy-validator.service.ts
  inspection-legacy-reconciliation.service.ts
  config/catalog-aliases.json
  dto/
  entities/
```

Comando propuesto:

```text
pnpm --filter api import:legacy-inspections -- --file <ruta> --dry-run
```

Modo de escritura:

```text
pnpm --filter api import:legacy-inspections -- --file <ruta> --apply --batch-id <id-dry-run-aprobado>
```

No exponer inicialmente un endpoint público de carga.

## 18. Fases de implementación

### Fase 0 — Congelamiento de fuente

Objetivo: fijar la entrada que será importada.

Acciones:

- calcular SHA-256 del Excel;
- registrar nombre, tamaño, fecha y hash;
- declarar `CONSOLIDADO` como única hoja fuente;
- rechazar el proceso si el hash cambia entre dry-run y apply.

Salida:

```text
source-manifest.json
```

### Fase 1 — Migración de esquema

Acciones:

- crear `inspection_legacy_imports`;
- crear `inspection_legacy_milestones`;
- agregar índices;
- corregir `Gold fields.is_contractor` mediante migración;
- crear entidades TypeORM;
- registrar relaciones de sólo lectura en inspecciones.

Criterio de salida:

- migración up/down funcional;
- build y lint de API verdes;
- no alterar registros actuales.

### Fase 2 — Matriz de catálogos

Acciones:

- normalizar texto sin perder valor original;
- generar matrices para áreas, empresas e inspectores;
- aplicar sólo aliases explícitos;
- generar catálogo de faltantes;
- preparar migración de áreas y empresas históricas archivadas.

Estados de resolución:

```text
DIRECT_MATCH
ALIAS_MATCH
CREATE_ARCHIVED
KEEP_TEXT_ONLY
MANUAL_REVIEW
BLOCKED
```

Criterio de salida:

- 100% de las filas con decisión de área;
- 100% con decisión de empresa;
- 100% con decisión de inspector;
- equivalencias Hintek/HINTER y Pucará/PUUCA resueltas o en cuarentena.

### Fase 3 — Extractor y normalizador

Acciones:

- leer únicamente `CONSOLIDADO`;
- validar cabeceras esperadas;
- normalizar fechas y números;
- conservar número de fila original;
- derivar `legacy_mode`;
- calcular contadores finales;
- construir hitos válidos;
- registrar advertencias.

El normalizador no debe consultar ni escribir la base.

Criterio de salida:

- 2.308 filas leídas;
- 2.308 claves únicas;
- totales conciliados con la fuente;
- pruebas unitarias sobre fechas, fórmulas residuales y secuencias.

### Fase 4 — Dry-run contra base real

Acciones:

- resolver UUIDs;
- detectar duplicados por clave histórica;
- verificar ausencia temporal;
- validar FKs;
- clasificar cada fila;
- no ejecutar inserts.

Salidas obligatorias:

```text
legacy-inspections-dry-run-summary.json
legacy-inspections-ready.csv
legacy-inspections-warnings.csv
legacy-inspections-quarantine.csv
legacy-inspections-catalog-actions.csv
legacy-inspections-reconciliation.json
```

Resumen mínimo:

- total leído;
- listo para importar;
- con advertencia;
- en cuarentena;
- bloqueado;
- duplicado existente;
- áreas por crear;
- empresas por crear;
- aliases utilizados;
- totales de observaciones y pendientes.

### Fase 5 — Aprobación humana

No se ejecuta `--apply` sin aprobación de:

- responsable funcional de Medio Ambiente;
- responsable técnico de Aurelia;
- dueño de la base o encargado de despliegue.

Aprobaciones pendientes explícitas:

- Hintek ↔ HINTER;
- Pucará ↔ PUUCA;
- tratamiento de 2026 Nº 120;
- seis anomalías cronológicas;
- creación de 36 empresas históricas;
- creación de siete áreas históricas.

### Fase 6 — Importación transaccional

Estrategia:

- ejecutar en transacción por lotes;
- tamaño configurable, recomendado 100;
- insertar primero catálogos archivados aprobados;
- insertar `inspections`;
- insertar `inspection_legacy_imports`;
- insertar milestones;
- insertar status history;
- confirmar lote sólo si todas las filas del lote pasan.

Idempotencia:

```text
UNIQUE (source_system, legacy_year, legacy_number)
```

La reejecución debe producir:

- cero duplicados;
- registros existentes clasificados como `ALREADY_IMPORTED`;
- ninguna actualización implícita.

### Fase 7 — Conciliación post-importación

Queries y reportes deben verificar:

- cantidad de filas importadas;
- cantidad en cuarentena;
- distribución por año;
- distribución por estado;
- distribución por modo;
- distribución por área y empresa;
- suma de observaciones;
- suma de pendientes;
- cantidad de hitos S1/S2/S3;
- ausencia de hallazgos sintéticos;
- ausencia de respuestas sintéticas;
- integridad de claves y FKs;
- cero duplicados por clave histórica.

Criterio central:

```text
importados + cuarentena + bloqueados = 2.308
```

### Fase 8 — API de consulta histórica

Extender respuestas de detalle e historial con:

```ts
isHistorical: boolean;
legacy?: {
  year: number;
  number: number;
  mode: 'finding' | 'checklist';
  inspectorName: string | null;
  areaName: string | null;
  companyName: string | null;
  sectorName: string | null;
  detail: string | null;
  warnings: string[];
};
legacyMilestones?: Array<{
  sequenceNumber: 1 | 2 | 3;
  occurredAt: string;
  closedIncrement: number;
  pendingAfter: number;
  closedPercentage: number | null;
  pendingPercentage: number | null;
}>;
```

Filtros históricos:

- año y número;
- inspector histórico;
- área histórica;
- empresa histórica;
- sector/macrozone histórica;
- modo Hallazgo/Checklist;
- estado;
- fecha.

La autoridad de acceso continúa backend-first.

### Fase 9 — Web y Mobile

Los históricos deben aparecer principalmente en Historial.

Comportamiento:

- badge `Histórica`;
- badge Hallazgo/Checklist según `legacy_mode`;
- detalle en modo de solo lectura;
- sin acciones de ejecutar, aprobar, rechazar, reasignar o editar;
- seguimiento renderizado desde `inspection_legacy_milestones`;
- datos generales mostrando texto histórico cuando no exista FK actual;
- aviso de procedencia: `Registro restaurado desde planilla histórica`;
- mostrar advertencias sólo a perfiles autorizados o en vista técnica.

No mezclar milestones históricos con `inspection_followups`.

### Fase 10 — Cierre y respaldo

Acciones:

- respaldo previo y posterior;
- conservar Excel fuente y hash en repositorio documental seguro;
- guardar reportes dry-run y conciliación como artefactos;
- documentar batch importado;
- documentar rollback probado;
- congelar matriz de aliases utilizada.

## 19. Rollback

Cada ejecución tendrá un `batch_id` en metadata o una tabla de batches si se implementa.

Rollback recomendado:

1. Identificar imports del batch.
2. Eliminar `inspection_legacy_imports`; el cascade elimina milestones.
3. Eliminar `inspection_status_history` asociado al batch.
4. Eliminar inspecciones importadas.
5. Mantener o retirar catálogos históricos sólo si no tienen otras referencias.

No usar truncates ni deletes por rango de fecha.

Antes de aplicar:

- snapshot de base;
- export de tablas afectadas;
- prueba de rollback en ambiente no productivo.

## 20. Validaciones técnicas

Comandos mínimos:

```powershell
pnpm --filter @aurelia/contracts build
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:scope
pnpm --filter api test:roles
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter mobile-inspecciones typecheck
pnpm --filter mobile-inspecciones lint
pnpm --filter mobile-inspecciones test:smoke
```

Pruebas específicas:

- normalización de nombres;
- aliases explícitos;
- áreas archivadas;
- empresas archivadas;
- inspector actual versus texto histórico;
- checklist histórico sin template;
- estado abierto/cerrado;
- acumulación incremental de cerradas;
- pendientes del último hito con fecha;
- fechas de 1900;
- seguimiento fuera de secuencia;
- fila sin total de observaciones;
- idempotencia;
- rollback;
- acceso read-only.

## 21. Criterios de aceptación

La restauración se considera lista para producción cuando:

1. El archivo fuente está congelado por hash.
2. El dry-run procesa las 2.308 filas.
3. Cada fila queda en `READY`, `WARNING`, `QUARANTINE`, `BLOCKED` o `ALREADY_IMPORTED`.
4. Ninguna fila queda sin explicación.
5. Las decisiones de catálogo están aprobadas.
6. El apply usa exactamente el manifest aprobado.
7. La reejecución no crea duplicados.
8. La conciliación reproduce los totales aprobados.
9. No se crean hallazgos ni respuestas ficticias.
10. Los registros históricos son sólo lectura.
11. Web y Mobile muestran correctamente Hallazgo/Checklist histórico.
12. Los filtros pueden encontrar inspector, área, empresa y sector históricos.
13. El rollback fue probado.
14. Todos los gates técnicos aplicables están verdes.

## 22. Entregables

- Migración de esquema.
- Entidades y contratos.
- Configuración versionada de aliases.
- Migración de catálogos históricos.
- Importador CLI.
- Dry-run.
- Reportes CSV/JSON.
- Pruebas unitarias e integración.
- Endpoints de consulta histórica.
- Visualización read-only Web/Mobile.
- Runbook de ejecución y rollback.
- Informe final de conciliación.

## 23. Secuencia recomendada de commits

Mantener un commit por archivo cuando sea viable y evitar commits monolíticos.

Orden sugerido:

1. Roadmap.
2. Migración `inspection_legacy_imports`.
3. Migración `inspection_legacy_milestones`.
4. Entidad legacy import.
5. Entidad milestone.
6. Contratos.
7. Alias config.
8. Normalizador.
9. Resolver de catálogos.
10. Validador.
11. Dry-run reporter.
12. Importador transaccional.
13. Tests por servicio.
14. API de historial.
15. Web read-only.
16. Mobile read-only.
17. Runbook.
18. Release note y conciliación.

## 24. Decisión final de viabilidad

**Viable.**

La restauración puede implementarse sin degradar el modelo operacional actual siempre que:

- se mantenga resumida;
- se preserve el dato original;
- se diferencie explícitamente del dato nativo;
- se usen tablas de trazabilidad separadas;
- se evite inventar hallazgos, respuestas y seguimientos individuales;
- la carga pase primero por dry-run, aprobación y conciliación.
