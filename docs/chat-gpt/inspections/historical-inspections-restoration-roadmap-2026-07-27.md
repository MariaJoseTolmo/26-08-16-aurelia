# Roadmap de restauración de inspecciones históricas — versión 2

**Fecha inicial:** 2026-07-27  
**Última decisión funcional:** 2026-07-28  
**Estado:** implementación en curso  
**Fuente:** `Planilla de inspecciones Medio Ambiente.xlsx`, hoja `CONSOLIDADO`  
**Volumen:** 2.308 inspecciones, periodo 2023 al 19-02-2026

## 1. Decisión funcional autoritativa

La marca **legacy** aplica únicamente a las inspecciones provenientes del Excel.

Los valores organizacionales y de identidad presentes en la fuente se incorporarán como **datos maestros actuales, activos y utilizables**:

- áreas;
- sectores;
- empresas;
- inspectores/usuarios;
- relaciones entre esas entidades.

No se asumirá que un valor es obsoleto por no existir en los seeds anteriores. Los seeds iniciales fueron construidos para desarrollo y pruebas y no constituyen un maestro empresarial completo.

## 2. Objetivo

Restaurar en Aurelia las inspecciones ambientales realizadas antes de la existencia del módulo actual, manteniendo:

- consulta y filtros históricos;
- estado final abierto/cerrado;
- total de observaciones;
- avance agregado de cierre;
- autoría;
- área, empresa y sectores;
- trazabilidad hasta archivo, hoja y fila;
- idempotencia y capacidad de conciliación.

La restauración no debe inventar información que el Excel no contiene.

## 3. Modelo de restauración

Cada fila válida de `CONSOLIDADO` producirá:

1. una fila en `inspections`;
2. una fila en `inspection_legacy_imports`;
3. cero a tres hitos agregados en `inspection_legacy_milestones`;
4. una o más relaciones en `inspection_legacy_participants`;
5. cero o más relaciones en `inspection_legacy_sector_links`;
6. una entrada inicial en `inspection_status_history`.

No se reconstruirán artificialmente:

- hallazgos individuales en `inspection_findings`;
- respuestas de checklist;
- seguimientos asociados a una observación específica;
- comentarios;
- fotografías;
- archivos o evidencias;
- responsables por hallazgo;
- aprobaciones, rechazos o disputas no documentadas;
- contenido por ítem de checklist.

## 4. Catálogo maestro actual

La fuente maestra versionada es:

```text
apps/api/src/modules/inspection-legacy-import/config/inspection-master-data.json
```

Contiene:

- 14 áreas activas;
- 78 sectores activos relacionados con su área;
- 76 empresas activas;
- 11 inspectores activos y seleccionables;
- 2 grupos explícitos de autoría múltiple.

### 4.1 Áreas

Las áreas de la fuente se consideran actuales:

- Construcción;
- Servicios Generales;
- Planta Procesos;
- Sustaining;
- Mina;
- Exploraciones;
- Medio Ambiente;
- Mantención;
- Gestión activos;
- Seguridad Patrimonial;
- Gerencia de Operaciones;
- HS;
- IT;
- Finanzas.

Variantes como `Planta procesos`, `Planta de procesos` y `Planta de proceso` se normalizan a `Planta Procesos`.

Todas se cargan con:

```text
status = active
```

No se utiliza prefijo `HIST-` ni estado `archived`.

### 4.2 Sectores

Los sectores se crean como maestros actuales dentro de su área.

Una misma denominación puede existir en áreas diferentes, por ejemplo:

- Campamento;
- Planta Procesos;
- Plataformas EECC;
- Planta Filtro;
- Suministro Hídrico.

Cada relación Área + Sector recibe un código estable independiente.

Cuando una inspección contiene más de un sector separado por coma:

- el primero se registra como `inspections.sector_id` para compatibilidad;
- todos se registran en `inspection_legacy_sector_links` respetando el orden fuente;
- el texto original completo se conserva en `legacy_sector_name`.

El campo `Detalle` no se convertirá automáticamente en `locations`, porque contiene una mezcla de equipos, instalaciones, puntos y descripciones libres. Se conservará como texto original hasta realizar un levantamiento específico de ubicaciones.

### 4.3 Empresas

Las empresas de la fuente se consideran actuales y activas.

Reglas:

- `Gold Fields` usa código `CORP` y `is_contractor = false`;
- las demás empresas del Excel se cargan con `is_contractor = true`;
- sólo se agrupan variantes explícitas de escritura de una misma empresa;
- no se ejecutan merges difusos por similitud.

Por lo tanto, nombres como los siguientes se conservan como empresas distintas mientras no exista una decisión empresarial que indique lo contrario:

- Hintek / HINTER;
- Pucará / PUUCA;
- Develp / DEVLE;
- Eco Minera / ECO MINING;
- Hidromotions / HIDROMOTORES;
- Geomafe / GEOMAV;
- TREBA / TREBIA.

Esto evita perder trazabilidad o fusionar proveedores diferentes basándose sólo en similitud ortográfica.

### 4.4 Usuarios e inspectores

Los inspectores del Excel se crean como usuarios actuales, activos y seleccionables.

Inspectores individuales:

- Karen Opazo;
- Janina Santander;
- Francisco Báez;
- Camila Zapata;
- Javier Guzmán;
- Patricio Acuña;
- Marjorie Yañez;
- Catalina Cortés;
- Daniel Martínez;
- Aurora Hidalgo;
- Diego Aguilera.

Todos se vinculan inicialmente a:

```text
company = CORP
role = INSPECTOR
is_active = true
```

Karen conserva su correo confirmado existente.

Para personas cuyo correo corporativo no está contenido en el Excel se usa temporalmente un identificador técnico:

```text
<nombre>@pending-directory.aurelia.local
```

Estos usuarios:

- tienen registro activo y pueden ser seleccionados/asignados;
- no reciben contraseña;
- no pueden autenticarse hasta confirmar el correo corporativo real;
- deben ser actualizados posteriormente contra el directorio corporativo sin crear una segunda identidad.

Autorías múltiples confirmadas:

```text
Daniel Martinez; Camila Zapata
Marjorie Yañez/Catalina Cortés
```

En estos casos:

- el primer usuario se conserva como `inspector_user_id` principal;
- todos se registran en `inspection_legacy_participants`;
- el texto original se mantiene en `legacy_inspector_name`.

## 5. Inspecciones legacy

### 5.1 Identificación

Cada inspección se identifica idempotentemente mediante:

```text
source_system + legacy_year + legacy_number
```

La fuente declarada es:

```text
legacy_environmental_inspections_spreadsheet
```

### 5.2 Tipo y modo

Todas las inspecciones usan el tipo activo:

```text
environmental
```

La fuente contiene:

- 1.997 Hallazgos;
- 311 Checklist.

Los registros históricos no se vinculan al template actual `TPL-ENV-GENERAL-001`, porque no existen respuestas por ítem y el Excel agrupa múltiples checklists distintos.

Regla:

```text
inspection_type_id = environmental
template_id = NULL
legacy_mode = finding | checklist
```

La API y los frontends deben dar precedencia a `legacy_mode` para el badge histórico.

### 5.3 Estado

Mapeo:

| Excel | Aurelia |
|---|---|
| Abierto | `in_progress` |
| Cerrado | `closed` |

No se reconstruyen estados intermedios inexistentes.

### 5.4 Contadores

```text
findings_count = Nº Observaciones
```

Las observaciones cerradas de S1, S2 y S3 son incrementales:

```text
closed_final =
  closed_initial
  + closed_s1
  + closed_s2
  + closed_s3
```

```text
open_findings_count =
  pendientes del último seguimiento con fecha válida;
  si no existe seguimiento, pendientes de la inspección inicial
```

Totales esperados:

- 18.214 observaciones;
- 18.051 cerradas;
- 163 pendientes.

### 5.5 Seguimientos

Los hitos S1–S3 representan progreso agregado, no la identidad de las observaciones cerradas.

Se guardan en `inspection_legacy_milestones`:

- secuencia;
- fecha;
- cantidad cerrada adicional;
- cantidad pendiente posterior;
- porcentajes;
- payload fuente.

En la interfaz se mostrarán como:

- Inspección inicial;
- Seguimiento 1;
- Seguimiento 2;
- Seguimiento 3;
- observaciones cerradas y pendientes con porcentaje.

No se afirmará cuál observación específica fue cerrada.

## 6. Tablas de trazabilidad

### 6.1 `inspection_legacy_imports`

Conserva:

- inspección destino;
- archivo, hoja y fila;
- año y número históricos;
- modo Hallazgo/Checklist;
- textos originales;
- payload completo;
- advertencias de importación;
- fecha de importación.

### 6.2 `inspection_legacy_milestones`

Conserva S1–S3 agregados sin falsear `inspection_followups`, que exige un hallazgo individual.

### 6.3 `inspection_legacy_participants`

Conserva todos los inspectores de la fuente:

- UUID de usuario;
- nombre fuente;
- orden;
- indicador principal.

### 6.4 `inspection_legacy_sector_links`

Conserva todos los sectores de una inspección:

- UUID del sector;
- nombre fuente;
- orden;
- indicador principal.

## 7. Seed de maestros

Seed principal:

```text
apps/api/src/database/seeds/009-seed-inspections-master-data.ts
```

Comando:

```text
pnpm --filter api seed:inspections-master
```

El seed es idempotente y:

- activa/actualiza las 14 áreas;
- activa/actualiza los 78 sectores;
- activa/actualiza las 76 empresas;
- corrige Gold Fields como empresa no contratista;
- crea/actualiza los 11 inspectores;
- asigna rol INSPECTOR y empresa CORP;
- conserva contraseñas existentes;
- no asigna contraseña a identidades pendientes de directorio.

Separación de comandos:

```text
pnpm --filter api seed
```

Carga infraestructura, clasificaciones y maestros reales.

```text
pnpm --filter api seed:demo
```

Agrega escenarios demo opcionales para desarrollo.

El seed antiguo de responsables queda como alias de compatibilidad hacia el seed maestro real.

## 8. Dry-run

El dry-run debe ejecutarse después de migraciones y seed maestro.

Clasificaciones permitidas:

```text
READY
WARNING
QUARANTINE
BLOCKED
ALREADY_IMPORTED
```

Resoluciones de catálogo:

```text
DIRECT_MATCH
ALIAS_MATCH
CREATE_ACTIVE
KEEP_TEXT_ONLY
MANUAL_REVIEW
BLOCKED
```

Después de ejecutar el seed maestro, una segunda resolución debe convertir todos los `CREATE_ACTIVE` válidos en `DIRECT_MATCH` o `ALIAS_MATCH` con UUID real.

Artefactos:

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

## 9. Apply

El servicio `InspectionLegacyApplyService` aplica el lote en una única transacción.

Precondiciones:

- archivo validado contra SHA-256 congelado;
- maestros cargados;
- área y empresa con UUID;
- todos los sectores informados con UUID;
- todos los inspectores informados con UUID;
- ninguna fila `BLOCKED` o `QUARANTINE`;
- conciliación aprobada.

Por fila:

1. verifica idempotencia;
2. crea `inspections`;
3. crea `inspection_legacy_imports`;
4. crea hitos S1–S3;
5. crea participantes;
6. crea relaciones de sector;
7. crea historial de estado.

Si una operación falla, se revierte todo el lote.

## 10. Cuarentena conocida

Registro con total ausente:

```text
Año: 2026
Nº: 120
Fecha: 19-02-2026
Empresa: MKL
Estado: Abierto
Nº Observaciones: vacío
```

Debe permanecer en cuarentena hasta confirmar el total o aprobar explícitamente cero.

Anomalías cronológicas conocidas:

```text
2023 Nº 234
2023 Nº 242
2024 Nº 119
2024 Nº 227
2025 Nº 15
2025 Nº 516
```

La fecha `19-01-1900` se descarta como fecha inválida, conservando el valor original en `raw_payload`.

## 11. Fuente congelada

Manifest:

```text
apps/api/src/modules/inspection-legacy-import/config/source-manifest.json
```

Valores críticos:

```text
SHA-256: 11f094771d95c36ed777c82197ac76fd4a6abc55ac784eee0b19783d760174b4
Tamaño: 1.081.162 bytes
Hoja: CONSOLIDADO
Rango: A5:AK2312
Filas: 2.308
```

El apply debe rechazar un archivo que no coincida exactamente con el manifest aprobado.

## 12. Estado de implementación

### Completado

- diagnóstico de fuente y base;
- roadmap v2;
- manifest de fuente;
- catálogo maestro versionado;
- normalizador de fechas, estados y contadores;
- resolución de maestros actuales;
- validación y conciliación;
- reporter JSON/CSV;
- migración de imports e hitos;
- entidades TypeORM;
- migración de participantes y sectores múltiples;
- seed maestro real;
- separación entre seed normal y seed demo;
- apply transaccional e idempotente;
- smoke tests de normalización, dry-run y reporter.

### Pendiente inmediato

- lector físico XLSX;
- CLI `import:legacy-inspections`;
- prueba completa de 2.308 filas contra una base local;
- resolver la fila 2026 Nº 120;
- ejecutar conciliación final;
- realizar apply en ambiente de ensayo;
- contratos y endpoints read-only para exponer campos legacy;
- adaptación Web/Mobile de detalle histórico;
- validación funcional y técnica de cierre.

## 13. Secuencia operativa

En una base local limpia o respaldada:

```text
pnpm --filter @aurelia/contracts build
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api test:legacy-import
pnpm --filter api migration:run
pnpm --filter api seed
```

Después:

```text
import --dry-run
revisión de artefactos
aprobación
import --apply
conciliación SQL
```

## 14. Criterios de aceptación

La restauración estará lista cuando:

- las 2.308 filas estén clasificadas exactamente una vez;
- la fila sin total esté corregida o explícitamente excluida;
- no existan `BLOCKED`;
- todas las áreas, empresas, sectores e inspectores tengan UUID maestro;
- el total de observaciones sea 18.214;
- cerradas y pendientes concilien en 18.051 y 163;
- los hitos válidos coincidan con la fuente;
- no se creen hallazgos, respuestas, imágenes o comentarios ficticios;
- las autorías y sectores múltiples se conserven;
- una segunda ejecución no duplique inspecciones;
- rollback y restauración desde respaldo estén ensayados;
- Web y Mobile muestren las inspecciones legacy en modo de sólo lectura.

## 15. Regla de seguridad

No ejecutar `--apply` directamente en una base compartida.

Orden obligatorio:

1. respaldo;
2. migraciones;
3. seed maestro;
4. dry-run;
5. revisión de cuarentena y advertencias;
6. apply en ensayo;
7. conciliación;
8. aprobación;
9. apply definitivo.
