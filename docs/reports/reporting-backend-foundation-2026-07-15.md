# Base común de reportabilidad

## Objetivo

Centralizar en `ReportsModule` las capacidades transversales que podrán reutilizar inspecciones, incidentes, SPR y otros módulos.

## Servicios comunes

- `ReportPeriodService`: interpreta año, trimestre o mes y entrega rango, meses y etiqueta.
- `ReportScopeService`: resuelve alcance por empresa para usuarios Gold Fields, administradores y EECC.

Ambos servicios se exportan desde `ReportsModule` para ser consumidos por otros módulos cuando corresponda.

## Reporte periódico de inspecciones

Endpoint de datos:

```http
GET /api/reports/inspections/periodic/data?year=2026&period=q1&inspectionState=all
```

Valores admitidos:

- `period`: `year`, `q1`, `q2`, `q3`, `q4`, `m1` a `m12`.
- `inspectionState`: `all`, `open`, `closed`.
- `companyId`: opcional y validado contra el alcance del usuario.

El payload contiene:

- metadatos del periodo y generación;
- resumen ejecutivo;
- distribución mensual, por tipo y por área;
- listado completo de inspecciones;
- inspecciones que requieren atención;
- empresas con mayor pendiente.

## Seguridad

- Administradores y usuarios internos Gold Fields pueden consultar todas las empresas o una empresa específica.
- Usuarios EECC quedan restringidos a las empresas asociadas en base de datos.
- Un `companyId` fuera del alcance de un usuario EECC produce un conjunto vacío.

## Próxima iteración

Implementar un renderer PDF dentro de `ReportsModule` que consuma exclusivamente el payload validado del servicio periódico. El renderer no debe volver a consultar la base de datos. Luego se conectará el modal web a los endpoints PDF y XLSX.
