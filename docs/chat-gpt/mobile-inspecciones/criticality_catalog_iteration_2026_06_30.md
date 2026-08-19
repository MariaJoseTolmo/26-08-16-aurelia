# Criticality catalog iteration - 2026-06-30

## Objetivo

Sacar `Probabilidad` y `Consecuencia` del código del formulario manual de Hallazgo y dejarlas disponibles desde base de datos.

## Backend agregado

Tablas nuevas:

```txt
inspection_risk_probabilities
inspection_risk_consequences
```

Migración:

```txt
apps/api/src/database/migrations/1782890000000-CreateInspectionRiskCatalogs.ts
```

Entidades:

```txt
apps/api/src/modules/inspections/entities/inspection-risk-probability.entity.ts
apps/api/src/modules/inspections/entities/inspection-risk-consequence.entity.ts
```

Controller nuevo:

```txt
apps/api/src/modules/inspections/inspection-criticality-catalog.controller.ts
```

Endpoints:

```txt
GET /api/inspections/finding-catalogs/risk-probabilities
GET /api/inspections/finding-catalogs/risk-consequences
```

Seed actualizado:

```txt
apps/api/src/database/seeds/003-seed-finding-classifications.ts
```

Script:

```bash
pnpm --filter api seed:finding-classifications
```

## Frontend aplicado

Archivo intervenido:

```txt
apps/mobile-inspecciones/src/modules/inspection/ManualFindingObservationsScreen.tsx
```

Cambios:

```txt
1. Probabilidad ya no cicla valores por click.
2. Probabilidad abre un modal/lista de opciones.
3. Consecuencia ya no cicla valores por click.
4. Consecuencia abre un modal/lista de opciones.
5. Las opciones se cargan desde los endpoints de catálogo.
6. Si el endpoint falla, se mantiene fallback local temporal para no bloquear la demo.
7. La foto ahora abre selector previo: Tomar foto / Cargar desde galería.
8. Tomar foto usa cámara del dispositivo.
9. Cargar desde galería usa selector de archivos/galería.
10. La matriz 5x5 separa los números del eje X por celda.
```

Servicio mobile:

```txt
apps/mobile-inspecciones/src/shared/services/api/inspection-finding-catalogs.api.ts
```

Funciones:

```txt
fetchInspectionRiskProbabilities()
fetchInspectionRiskConsequences()
```

## DDL

Se creó addendum SQL:

```txt
docs/database/04-ddl-postgres-risk-catalogs-addendum.sql
```

Este bloque corresponde a las tablas que deben incorporarse a:

```txt
docs/database/04-ddl-postgres-draft.sql
```

El DDL incluye:

```txt
inspection_risk_probabilities
inspection_risk_consequences
indexes active/sort
seed idempotente para probabilidad y consecuencia
```

## Validación backend

```bash
pnpm --filter @aurelia/contracts build
pnpm --filter api migration:run
pnpm --filter api seed:finding-classifications
pnpm --filter api dev
```

Probar:

```bash
curl http://localhost:3000/api/inspections/finding-catalogs/risk-probabilities
curl http://localhost:3000/api/inspections/finding-catalogs/risk-consequences
```

## Validación frontend

```bash
pnpm web -- --clear
```

Flujo:

```txt
/inspection/manual/observations
Agregar observación
Presionar Probabilidad -> abre modal
Presionar Consecuencia -> abre modal
Presionar Fotografía Antes -> abre selector Tomar foto / Cargar desde galería
Revisar matriz 5x5 -> encabezado X separado por celda
```
