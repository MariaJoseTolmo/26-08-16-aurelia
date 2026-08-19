# Fase 7 - MUE y controles críticos

## Objetivo

Iniciar la implementación backend/API del dominio MUE y controles críticos, según el roadmap de base de datos.

El roadmap define para esta fase la gestión de MUE, controles críticos, verificaciones, autoevaluaciones, responsables y evidencias. También define como tablas principales `mues`, `critical_controls`, `control_verification_items`, `control_area_assignments`, `control_self_assessments`, `control_self_assessment_answers` y `control_evidences`.

## Fuentes funcionales revisadas

```txt
Areas que interactuan en los MUE.docx
Self Assesment Evidences EN.xlsx
Autoevalucion Controles Críticos - Rev 0.xlsx
CCM 170825 Simplified es-ES_16-11-2025.xlsx
```

## Hallazgos de análisis

```txt
MUE catalogados: 6
Controles críticos identificados desde Evidence Pack: 43
Ítems de verificación identificados desde Evidence Pack: 142
Autoevaluaciones existentes en archivo cliente: 11 hojas por área/MUE
CCM base: 25 hojas, incluyendo bowties, controles, tarjetas y CCV por MUE
```

## Áreas/responsables detectados

```txt
MUE1: Gcia Planta - Superintendencia Procesos
MUE1: Gcia Planta - Superintendencia Aguas y Relaves
MUE2: Gcia Mina - Perforación y Tronadura
MUE3: Gcia Medio Ambiente
MUE4: Gcia Servicios Técnicos - Superintendencia de Aguas
MUE5: Gcia Planta - Superintendencia Aguas y Relaves
MUE5: Gcia Medio Ambiente
MUE6: Gcia Sustentabilidad - Cumplimiento Ambiental
MUE6: Gcia Sustentabilidad - Permisos
MUE6: Gcia Legal
MUE6: Gcia Medio Ambiente
```

## Implementación realizada

Se reemplazaron placeholders iniciales por el modelo relacional base del dominio.

### Entidades agregadas

```txt
MueEntity
CriticalControlEntity
ControlVerificationItemEntity
ControlAreaAssignmentEntity
ControlSelfAssessmentEntity
ControlSelfAssessmentAnswerEntity
ControlEvidenceEntity
```

### Módulos registrados

```txt
MueModule
CriticalControlsModule
```

### Migraciones agregadas

```txt
1782510000000-CreateMueCriticalControls.ts
1782511000000-SeedMueCriticalControls.ts
```

### Endpoints agregados

```txt
GET /api/mue
GET /api/mue/:id
GET /api/mue/:id/controls
GET /api/mue/:id/assignments
GET /api/critical-controls/catalog/controls
GET /api/critical-controls/catalog/verification-items
GET /api/critical-controls/catalog/assignments
GET /api/critical-controls/self-assessments
GET /api/critical-controls/self-assessments/:id
POST /api/critical-controls/self-assessments
PATCH /api/critical-controls/self-assessments/:id/answers
POST /api/critical-controls/self-assessments/:id/submit
```

### Permisos agregados

```txt
critical-controls:read
critical-controls:write
critical-controls:submit
critical-controls:approve
```

## Smoke test agregado

```txt
apps/api/src/test/api-mue-smoke.ts
```

Valida:

```txt
login real
consulta de catálogo MUE
consulta de controles por MUE
consulta de ítems de verificación
creación de autoevaluación
registro de respuesta
cálculo de cumplimiento
submit de autoevaluación
```

Comando:

```powershell
pnpm --filter api exec ts-node src/test/api-mue-smoke.ts
```

## Alcance de esta primera iteración

Esta iteración cierra la base estructural de Fase 7, pero no cierra toda la Fase 7 funcional.

Queda pendiente:

```txt
carga completa de los 142 ítems de verificación desde Evidence Pack
normalización multilingüe español/inglés de controles y evidencias
endpoint para evidencias por respuesta
validación/aprobación de autoevaluaciones
reportabilidad por MUE, área y responsable
scope por área/empresa aplicado a MUE y subrecursos
pantallas web/mobile de autoevaluación
importador formal desde Excel CCM/Evidence Pack
```

## Criterio de cierre futuro de Fase 7

La fase podrá cerrarse cuando exista:

```txt
catálogo MUE1-MUE6 completo
controles críticos por MUE completos
ítems de verificación completos
responsables y áreas asociados
autoevaluación operativa con evidencias
flujo submit/validate
dashboard básico de cumplimiento
smoke test pasando
```
