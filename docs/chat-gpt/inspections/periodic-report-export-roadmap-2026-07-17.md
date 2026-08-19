# Roadmap de exportación periódica de inspecciones

Fecha: 2026-07-17
Rama: `feature/inspecciones/carlo`
Módulos: `packages/contracts`, `apps/api`, `apps/web`
Estado: implementación completa; validación local y fidelización visual pendientes.

## Objetivo

Implementar la exportación autenticada del informe periódico de inspecciones en PDF y Excel desde el modal **Exportar informe de inspecciones**, manteniendo una sola fuente de verdad para datos, reglas de agregación y control de acceso.

## Referencias Figma

- Página 1 — resumen ejecutivo: nodo `842:8548`
- Página 2 — listado representativo: nodo `842:8777`
- Página 3 — atención inmediata y empresas: nodo `842:9231`
- Menú de exportación: nodo `812:9901`
- Modal de exportación: nodo `812:9927`

## Decisiones funcionales

1. El PDF conserva la composición ejecutiva del diseño y muestra hasta 15 inspecciones representativas en la página de listado.
2. El Excel contiene el universo completo del período y estado seleccionados.
3. Los estados de observación del resumen son categorías mutuamente excluyentes:
   - cerradas;
   - SLA vencido;
   - ejecutadas pendientes de aprobación, dentro de plazo;
   - abiertas dentro de plazo.
4. La distribución por área cuenta inspecciones, no observaciones.
5. El alcance por empresa reutiliza `ReportScopeService`; ningún exportador puede ampliar el alcance autorizado del usuario.
6. PDF y Excel consumen el mismo `InspectionPeriodicReportResponse` producido por `InspectionPeriodicReportService`.
7. Las descargas web usan `httpDownload` y Bearer token; no se navega directamente a los endpoints.
8. El Excel se genera como OOXML dentro de la API, sin ExcelJS ni otra dependencia. Esto evita modificar el lockfile y simplifica el despliegue.

## Endpoints implementados

```text
GET /api/reports/inspections/periodic/data
GET /api/reports/inspections/periodic/pdf
GET /api/reports/inspections/periodic/xlsx
```

Parámetros comunes:

```text
year=<año>
period=year|q1|q2|q3|q4|m1..m12
inspectionState=all|open|closed
companyId=<opcional>
```

## Arquitectura implementada

```text
InspectionExportReportModal
  -> periodic-inspection-reports.service.ts
     -> /reports/inspections/periodic/pdf|xlsx

InspectionPeriodicReportController
  -> InspectionPeriodicReportExportService
     -> InspectionPeriodicReportService
     -> InspectionPeriodicReportPdfService
     -> InspectionPeriodicReportXlsxService
        -> XlsxWorkbookService

ReportPdfBrandingService
  -> header, títulos, footer, márgenes y numeración comunes
```

## Roadmap de implementación

### Fase 1 — Contratos y datos: completada

- [x] Corregir distribución por área a inspecciones.
- [x] Hacer excluyentes las categorías de observaciones.
- [x] Filtrar en SQL por período, estado cancelado y alcance de empresa.
- [x] Mantener tipos de respuesta compartidos en `@aurelia/contracts`.

Commits:

- `ce0c4350` — aclara contrato del reporte periódico.
- `6701de2f` — corrige agregaciones y limita la carga de datos.

### Fase 2 — Base PDF compartida: completada

- [x] Crear servicio reutilizable de branding PDF.
- [x] Conservar el renderer individual sin modificaciones.
- [x] Reutilizar logo, Inter, márgenes de 42 pt laterales / 36 pt verticales y footer seguro.

Commit:

- `575e689d` — agrega branding compartido para reportes PDF.

### Fase 3 — PDF periódico: completada

- [x] Crear renderer de las tres páginas.
- [x] Implementar KPI, barras, dona, tablas, chips y alertas con PDFKit.
- [x] Agregar endpoint autenticado `/pdf`.
- [x] Limitar la tabla del PDF a 15 filas y mantener totales reales.

Commits:

- `5536717a` — implementa PDF periódico de inspecciones.
- `390535e1` — orquesta exportaciones periódicas.
- `386d2891` — expone descarga PDF y Excel.
- `f09204cc` — registra servicios en `ReportsModule`.

### Fase 4 — Excel: completada

- [x] Generar `.xlsx` sin duplicar reglas de negocio.
- [x] Hojas: `Resumen`, `Inspecciones`, `Atención inmediata`, `Empresas`.
- [x] Autofiltro, panel congelado, fechas, porcentajes y estilos.
- [x] Agregar endpoint autenticado `/xlsx`.

Commits:

- `d0d6ed01` — agrega generador ZIP/OOXML para Excel.
- `2b412325` — implementa las cuatro hojas del informe.

### Fase 5 — Frontend: completada

- [x] Cambiar botón incorrecto `Rechazar observación` por `Exportar PDF` o `Exportar Excel`.
- [x] Conectar el modal con los endpoints autenticados.
- [x] Mostrar spinner y estado `Generando PDF…` / `Generando Excel…`.
- [x] Mantener el modal abierto en error y cerrarlo después de una descarga exitosa.

Commits:

- `ae396b7a` — agrega servicio autenticado de descarga periódica.
- `d091385e` — conecta el modal y corrige la acción principal.

### Fase 6 — Validación: pendiente de ejecución local

- [ ] `pnpm --filter @aurelia/contracts build`
- [ ] `pnpm --filter api lint`
- [ ] `pnpm --filter api build`
- [ ] `pnpm --filter web typecheck`
- [ ] `pnpm --filter web build`
- [ ] Validación visual del PDF contra los nodos Figma.
- [ ] Apertura del Excel en Microsoft Excel o LibreOffice sin advertencias de reparación.
- [ ] Pruebas de año, trimestre, mes, todas, abiertas y cerradas.
- [ ] Pruebas de permisos para Gold Fields y empresas contratistas.

## Archivos incorporados

```text
packages/contracts/src/dtos/reports/inspection-periodic-report.response.ts
apps/api/src/modules/reports/inspection-periodic-report.service.ts
apps/api/src/modules/reports/report-pdf-branding.service.ts
apps/api/src/modules/reports/inspection-periodic-report-pdf.service.ts
apps/api/src/modules/reports/xlsx-workbook.service.ts
apps/api/src/modules/reports/inspection-periodic-report-xlsx.service.ts
apps/api/src/modules/reports/inspection-periodic-report-export.service.ts
apps/api/src/modules/reports/inspection-periodic-report.controller.ts
apps/api/src/modules/reports/reports.module.ts
apps/web/src/shared/services/periodic-inspection-reports.service.ts
apps/web/src/modules/inspections/components/InspectionExportReportModal.tsx
```

## Riesgos y controles

- No se modificó el renderer del PDF individual.
- Las observaciones vencidas se clasifican antes que abiertas o ejecutadas para evitar doble conteo.
- La muestra de 15 filas solo afecta la página 2 del PDF; KPI y rankings usan el universo completo.
- Los endpoints reutilizan el alcance autorizado de `ReportScopeService`.
- El frontend descarga mediante Bearer token y `Blob`.
- El generador OOXML debe probarse en Excel y LibreOffice antes de desplegar.
- La primera iteración del PDF requiere comparación visual y ajustes de fidelidad con datos reales.

## Siguiente acción

1. Traer los commits desde `aurelia-old/feature/inspecciones/carlo`.
2. Ejecutar build y lint.
3. Generar un PDF trimestral con suficientes datos para llenar las tres páginas.
4. Generar un Excel y abrir las cuatro hojas.
5. Compartir capturas o archivos resultantes para la siguiente iteración de fidelización visual.
