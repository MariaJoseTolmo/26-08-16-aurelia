# PDF detallado de inspección

La exportación invocada desde el botón `Descargar PDF` del modal de detalle corresponde al informe individual de una inspección.

Endpoint operativo:

```http
GET /api/inspections/:id/export/pdf
```

El informe consolida:

- identificación y datos generales de la inspección;
- resumen de observaciones;
- observaciones ejecutadas, abiertas, cerradas y rechazadas;
- condición detectada, medida propuesta y acción ejecutada;
- evidencias de antes y después cuando los archivos están disponibles;
- responsables, fechas y SLA;
- historial de seguimientos;
- comentarios y responsables de firma.

La generación utiliza la infraestructura común de `ReportsModule`:

- `ReportPdfService` administra el documento y la salida binaria;
- `InspectionDetailReportPdfService` contiene la composición específica de inspecciones;
- `FilesService` resuelve las evidencias locales para incorporarlas al documento.

El endpoint periódico creado previamente queda separado para una futura exportación consolidada por año, trimestre o mes. No reemplaza el PDF individual del modal.
