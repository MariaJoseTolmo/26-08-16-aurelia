# Runbook de restauración de inspecciones históricas

**Fuente:** `Planilla de inspecciones Medio Ambiente.xlsx`  
**Hoja:** `CONSOLIDADO`  
**SHA-256 aprobado:** `11f094771d95c36ed777c82197ac76fd4a6abc55ac784eee0b19783d760174b4`

## 1. Principios

- ejecutar primero en una base local o de ensayo;
- obtener respaldo antes de migraciones y apply;
- sólo las inspecciones son legacy;
- áreas, sectores, empresas e inspectores se crean como maestros activos;
- no se generan hallazgos, respuestas, comentarios, imágenes ni evidencias ficticias;
- los hitos S1–S3 representan progreso agregado;
- el apply completo es transaccional e idempotente.

## 2. Preparación técnica

Desde la raíz del monorepo:

```powershell
pnpm --filter @aurelia/contracts build
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api test:legacy-import
```

Aplicar migraciones:

```powershell
pnpm --filter api migration:run
```

Cargar maestros reales:

```powershell
pnpm --filter api seed:inspections-master
```

## 3. Verificar maestros

```sql
SELECT status::text, count(*)
FROM areas
GROUP BY status
ORDER BY status;
```

```sql
SELECT count(*) AS active_master_areas
FROM areas
WHERE status = 'active'
  AND code IN (
    'AREA-CONSTRUCCION',
    'AREA-SERVICIOS',
    'AREA-PLANTA',
    'AREA-SUSTAINING',
    'AREA-MINA',
    'AREA-EXPLORACION',
    'AREA-MAMBIENTE',
    'AREA-MANTENCION',
    'AREA-GESTION-ACTIVOS',
    'AREA-SEGURIDAD-PATRIMONIAL',
    'AREA-GERENCIA-OPERACIONES',
    'AREA-HS',
    'AREA-IT',
    'AREA-FINANZAS'
  );
```

Resultado esperado: `14`.

```sql
SELECT count(*) AS active_master_sectors
FROM sectors
WHERE status = 'active'
  AND code LIKE 'SECT-%';
```

El catálogo versionado contiene `78` sectores provenientes de la fuente; una base demo puede contener sectores adicionales.

```sql
SELECT count(*) AS active_source_companies
FROM companies
WHERE status = 'active';
```

El catálogo versionado contiene `76` empresas de la fuente; pueden existir otras empresas válidas de módulos adicionales.

```sql
SELECT code, name, is_contractor, status::text
FROM companies
WHERE code = 'CORP';
```

Resultado esperado:

```text
CORP | Gold Fields | false | active
```

```sql
SELECT
  count(*) AS source_inspectors,
  count(*) FILTER (WHERE password_hash IS NULL) AS without_password
FROM users
WHERE email = 'karen.opazo@goldfields.com'
   OR email LIKE '%@pending-directory.aurelia.local';
```

Resultado esperado: `11` usuarios. Los identificadores `pending-directory` deben permanecer sin contraseña hasta validar correo corporativo.

## 4. Dry-run

```powershell
pnpm --filter api import:legacy-inspections -- `
  --file "C:\ruta\Planilla de inspecciones Medio Ambiente.xlsx" `
  --output ".\artifacts\legacy-inspections\dry-run-01"
```

El comando valida automáticamente:

- nombre;
- tamaño;
- SHA-256;
- hoja;
- cabeceras;
- rango y cantidad de filas.

Debe generar:

```text
legacy-inspections-dry-run-summary.json
legacy-inspections-ready.csv
legacy-inspections-warnings.csv
legacy-inspections-quarantine.csv
legacy-inspections-blocked.csv
legacy-inspections-already-imported.csv
legacy-inspections-catalog-actions.csv
legacy-inspections-reconciliation.json
```

### Resultado objetivo tras ejecutar el seed maestro

```text
BLOCKED = 0
CREATE_ACTIVE = 0
```

Se espera una cuarentena conocida mientras no se corrija la fila 2026 Nº 120.

## 5. Revisión obligatoria del dry-run

Verificar en el JSON de conciliación:

```text
totalRows = 2308
finding = 1997
checklist = 311
closed = 2253
inProgress = 55
findingsCount = 18214
closedFindingsCount = 18051
openFindingsCount = 163
milestoneS1 = 1616
milestoneS2 = 136
milestoneS3 = 15
```

La cantidad S1 ya excluye la fecha inválida de 1900.

Revisar completamente:

- `legacy-inspections-quarantine.csv`;
- `legacy-inspections-blocked.csv`;
- advertencias cronológicas;
- acciones de catálogo;
- autorías múltiples;
- sectores múltiples.

## 6. Apply

No ejecutar mientras exista una fila en `BLOCKED` o `QUARANTINE`.

Cuando la conciliación esté aprobada:

```powershell
pnpm --filter api import:legacy-inspections -- `
  --file "C:\ruta\Planilla de inspecciones Medio Ambiente.xlsx" `
  --output ".\artifacts\legacy-inspections\apply-01" `
  --apply `
  --confirm-source-sha 11f094771d95c36ed777c82197ac76fd4a6abc55ac784eee0b19783d760174b4
```

El apply:

- vuelve a ejecutar verificación y dry-run;
- rechaza cualquier catálogo sin UUID;
- verifica idempotencia;
- inserta todo en una transacción;
- revierte todo si falla una fila.

## 7. Conciliación posterior

### Inspecciones importadas

```sql
SELECT count(*) AS imported_inspections
FROM inspection_legacy_imports
WHERE source_system = 'legacy_environmental_inspections_spreadsheet';
```

Esperado final: `2308`, salvo exclusión aprobada y documentada de la fila en cuarentena.

### Claves duplicadas

```sql
SELECT legacy_year, legacy_number, count(*)
FROM inspection_legacy_imports
WHERE source_system = 'legacy_environmental_inspections_spreadsheet'
GROUP BY legacy_year, legacy_number
HAVING count(*) > 1;
```

Esperado: vacío.

### Totales

```sql
SELECT
  count(*) AS inspections,
  sum(i.findings_count) AS findings,
  sum(i.open_findings_count) AS open_findings,
  sum(i.findings_count - i.open_findings_count) AS closed_findings
FROM inspection_legacy_imports li
JOIN inspections i ON i.id = li.inspection_id
WHERE li.source_system = 'legacy_environmental_inspections_spreadsheet';
```

Esperado:

```text
inspections = 2308
findings = 18214
open_findings = 163
closed_findings = 18051
```

### Modos

```sql
SELECT legacy_mode, count(*)
FROM inspection_legacy_imports
WHERE source_system = 'legacy_environmental_inspections_spreadsheet'
GROUP BY legacy_mode
ORDER BY legacy_mode;
```

Esperado:

```text
checklist = 311
finding = 1997
```

### Estados

```sql
SELECT i.status::text, count(*)
FROM inspection_legacy_imports li
JOIN inspections i ON i.id = li.inspection_id
WHERE li.source_system = 'legacy_environmental_inspections_spreadsheet'
GROUP BY i.status
ORDER BY i.status;
```

Esperado:

```text
closed = 2253
in_progress = 55
```

### Hitos

```sql
SELECT sequence_number, count(*)
FROM inspection_legacy_milestones m
JOIN inspection_legacy_imports li ON li.id = m.legacy_import_id
WHERE li.source_system = 'legacy_environmental_inspections_spreadsheet'
GROUP BY sequence_number
ORDER BY sequence_number;
```

Esperado:

```text
1 = 1616
2 = 136
3 = 15
```

### Participantes múltiples

```sql
SELECT
  li.legacy_year,
  li.legacy_number,
  count(p.id) AS participants,
  string_agg(p.source_name, ' | ' ORDER BY p.sequence_number) AS names
FROM inspection_legacy_imports li
JOIN inspection_legacy_participants p ON p.legacy_import_id = li.id
WHERE li.source_system = 'legacy_environmental_inspections_spreadsheet'
GROUP BY li.id, li.legacy_year, li.legacy_number
HAVING count(p.id) > 1
ORDER BY li.legacy_year, li.legacy_number;
```

Esperado: ocho inspecciones con autoría múltiple.

### Sectores múltiples

```sql
SELECT
  count(*) AS inspections_with_multiple_sectors
FROM (
  SELECT legacy_import_id
  FROM inspection_legacy_sector_links
  GROUP BY legacy_import_id
  HAVING count(*) > 1
) q;
```

### Integridad de relaciones

```sql
SELECT count(*) AS participants_without_user
FROM inspection_legacy_participants
WHERE user_id IS NULL;
```

Esperado tras seed maestro y apply: `0` para filas que informan inspector.

```sql
SELECT count(*) AS sector_links_without_sector
FROM inspection_legacy_sector_links
WHERE sector_id IS NULL;
```

Esperado tras seed maestro y apply: `0` para filas que informan sector.

### Confirmar que no se fabricaron entidades de detalle

```sql
SELECT count(*) AS synthetic_findings
FROM inspection_findings f
JOIN inspection_legacy_imports li ON li.inspection_id = f.inspection_id
WHERE li.source_system = 'legacy_environmental_inspections_spreadsheet';
```

Esperado: `0`.

```sql
SELECT count(*) AS synthetic_answers
FROM inspection_checklist_answers a
JOIN inspection_legacy_imports li ON li.inspection_id = a.inspection_id
WHERE li.source_system = 'legacy_environmental_inspections_spreadsheet';
```

Esperado: `0`.

## 8. Prueba de idempotencia

Ejecutar nuevamente exactamente el mismo comando `--apply`.

Resultado esperado:

```text
importedRows = 0
alreadyImportedRows = 2308
```

Los conteos SQL no deben cambiar.

## 9. Rollback controlado de la restauración

Usar sólo con respaldo y en ambiente aprobado.

```sql
BEGIN;

CREATE TEMP TABLE rollback_legacy_inspection_ids AS
SELECT inspection_id
FROM inspection_legacy_imports
WHERE source_system = 'legacy_environmental_inspections_spreadsheet';

SELECT count(*) AS rows_to_delete
FROM rollback_legacy_inspection_ids;

DELETE FROM inspections
WHERE id IN (SELECT inspection_id FROM rollback_legacy_inspection_ids);

COMMIT;
```

La FK `ON DELETE CASCADE` elimina trazabilidad, hitos, participantes, sectores e historial asociado. Los maestros actuales no se eliminan porque no son legacy.

## 10. Evidencia de cierre

Conservar junto al respaldo:

- hash del archivo;
- commit utilizado;
- salida de build/lint/tests;
- artefactos del dry-run aprobado;
- resultado del apply;
- consultas de conciliación;
- responsable y fecha de aprobación;
- resultado de la segunda ejecución idempotente.
