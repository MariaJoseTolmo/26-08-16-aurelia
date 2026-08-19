# Fase 7.2 - Contratos compartidos MUE / Controles críticos

## Objetivo

Alinear la implementación inicial de Fase 7 con la arquitectura del proyecto, moviendo la definición contractual del dominio MUE y controles críticos a `packages/contracts`.

## Problema corregido

La primera iteración de Fase 7 implementó entidades, controladores, servicios y smoke test directamente en `apps/api`, pero varios endpoints todavía devolvían entidades TypeORM y los DTOs de autoevaluación no implementaban contratos compartidos.

## Cambios en `packages/contracts`

### Enums agregados

```txt
ControlAnswerValue
ControlAssessmentStatus
ControlRiskLevel
```

Archivos:

```txt
packages/contracts/src/enums/control-answer-value.enum.ts
packages/contracts/src/enums/control-assessment-status.enum.ts
packages/contracts/src/enums/control-risk-level.enum.ts
```

### Interfaces actualizadas/agregadas

```txt
Mue
MueDetail
CriticalControl
ControlVerificationItem
ControlAreaAssignment
ControlSelfAssessment
ControlSelfAssessmentAnswer
ControlEvidence
```

Archivos:

```txt
packages/contracts/src/interfaces/mue.interface.ts
packages/contracts/src/interfaces/control-self-assessment.interface.ts
```

### DTOs compartidos

```txt
CreateMueRequest
MueResponse
MueDetailResponse
CriticalControlResponse
ControlVerificationItemResponse
ControlAreaAssignmentResponse
CreateControlSelfAssessmentRequest
UpsertControlSelfAssessmentAnswerRequest
UpsertControlSelfAssessmentAnswersRequest
```

Archivos:

```txt
packages/contracts/src/dtos/mue/create-mue.request.ts
packages/contracts/src/dtos/mue/mue.response.ts
packages/contracts/src/dtos/critical-controls/create-control-self-assessment.request.ts
packages/contracts/src/dtos/critical-controls/index.ts
```

## Cambios en API

### DTOs locales vinculados a contratos

Los DTOs de API mantienen decoradores de `class-validator`, pero ahora implementan los contratos compartidos:

```txt
CreateControlSelfAssessmentDto implements CreateControlSelfAssessmentRequest
UpsertControlSelfAssessmentAnswerDto implements UpsertControlSelfAssessmentAnswerRequest
UpsertControlSelfAssessmentAnswersDto implements UpsertControlSelfAssessmentAnswersRequest
```

### Responses mapeadas

`MueService` ya no retorna entidades TypeORM directamente en sus métodos públicos. Ahora mapea a contratos compartidos:

```txt
MueResponse
MueDetailResponse
CriticalControlResponse
ControlVerificationItemResponse
ControlAreaAssignmentResponse
```

`CriticalControlsService` retorna `ControlSelfAssessment` desde contracts y normaliza:

```txt
fechas Date -> ISO string
numeric compliance_score -> number
status -> ControlAssessmentStatus
answer -> ControlAnswerValue
```

## Smoke test actualizado

El smoke test MUE fue ajustado para validar la respuesta contractual de `complianceScore` como número.

Comando:

```powershell
pnpm --filter api exec ts-node src/test/api-mue-smoke.ts
```

## Estado

Con este ajuste, la Fase 7 queda alineada con el patrón de contratos compartidos usado por el resto del proyecto.

Sigue pendiente:

```txt
contratos para validación/aprobación de autoevaluaciones
contratos para evidencias por respuesta
contratos para dashboard de cumplimiento MUE
contratos para importación masiva desde Evidence Pack / CCM
```
