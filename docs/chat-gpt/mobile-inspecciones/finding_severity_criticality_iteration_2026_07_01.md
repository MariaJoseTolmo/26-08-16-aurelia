# Finding severity criticality iteration - 2026-07-01

## Objetivo

Cambiar `/inspection/manual/observations` para que la criticidad de un hallazgo ya no se calcule con matriz 5x5 de probabilidad/consecuencia.

El nuevo flujo usa un selector único de criticidad:

```txt
Menor
Moderado
Grave
```

## Fuente de datos

La criticidad se consume desde el catálogo existente:

```txt
inspection_finding_severities
```

Endpoint usado por mobile:

```txt
GET /api/inspections/finding-catalogs/severities
```

Función mobile:

```txt
fetchInspectionFindingSeveritiesLocalFirst()
```

Esto permite:

```txt
1. Cargar desde API cuando hay red.
2. Usar bootstrap local cuando no hay red.
```

## Cambios mobile

Archivo nuevo:

```txt
apps/mobile-inspecciones/src/modules/inspection/ManualFindingObservationsSeverityScreen.tsx
```

Archivo reemplazado por reexport:

```txt
apps/mobile-inspecciones/src/modules/inspection/ManualFindingObservationsScreen.tsx
```

Cambios aplicados:

```txt
1. Se elimina visualmente la matriz 5x5.
2. Se elimina el doble selector Probabilidad/Consecuencia.
3. Se agrega selector único: Seleccione la criticidad.
4. El selector abre un modal inferior con el mismo patrón visual usado por Tipo de hallazgo.
5. El modal muestra título y descripción de cada criticidad.
6. El SLA se lee desde closureTimeLabel del catálogo.
7. El botón Guardar observación exige criticidad seleccionada.
```

## Cambios seed

Archivo actualizado:

```txt
apps/api/src/database/seeds/003-seed-finding-classifications.ts
```

SLA actualizado:

```txt
Menor -> 14 Días
Moderado -> 5 Días
Grave -> 3 Días
```

## Validación

```bash
pnpm --filter api seed:finding-classifications
pnpm web -- --clear
```

Flujo:

```txt
/inspection/manual/observations
Agregar observación
Seleccione la criticidad
Elegir Menor/Moderado/Grave
Ver SLA calculado
Guardar observación
```

## Nota técnica

El catálogo de criticidad ya existía como `inspection_finding_severities`, por lo que no se creó una nueva tabla. El Excel cargado no contiene una hoja/celdas con los textos de criticidad; los valores usados corresponden al catálogo ya modelado y al diseño Figma entregado.
