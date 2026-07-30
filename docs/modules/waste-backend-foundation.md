# Módulo de residuos — base backend

## Alcance de esta primera iteración

La base implementada cubre la estructura necesaria para comenzar el desarrollo de las pantallas diseñadas en Figma:

1. Catálogos de unidades, categorías operativas y tipos de residuos.
2. Bodegas de acopio e ingresos a bodega.
3. Lotes almacenados y libro auditable de movimientos.
4. Solicitudes de retiro y selección de lotes.
5. Trazabilidad de aprobación y folio SIDREP para residuos peligrosos.
6. Períodos y líneas consolidadas SINADER para residuos no peligrosos.
7. Permisos iniciales y tipos de referencia para evidencias.

Esta iteración expone consultas de lectura. Los comandos transaccionales de ingreso, reserva, retiro, aprobación, cierre y declaración deben implementarse sobre estas entidades usando transacciones de base de datos.

## Agregados principales

### Catálogos

- `waste_units`
- `waste_operational_categories`
- `waste_types`

La peligrosidad y los requisitos regulatorios se configuran en el tipo de residuo. Los residuos específicos no se cargan como datos ficticios en la migración; deben provenir del catálogo funcional validado por Medio Ambiente.

### Bodega

- `waste_warehouses`
- `waste_receipts`
- `waste_lots`
- `waste_inventory_movements`

`waste_inventory_movements` es el libro de auditoría de cantidades. `current_quantity` y `reserved_quantity` en el lote permiten consultas eficientes, pero todo comando debe registrar también su movimiento correspondiente.

### Retiros

- `waste_withdrawal_requests`
- `waste_withdrawal_items`

Una solicitud puede incluir varios lotes. Para evitar doble retiro, la creación y actualización de solicitudes debe bloquear los lotes seleccionados y reservar la cantidad dentro de una única transacción.

### SIDREP

- `waste_sidrep_records`

Sólo debe existir para solicitudes peligrosas. Aurelia registra el folio generado externamente, su aprobación, pesos de despacho y recepción y el cierre final.

### SINADER

- `waste_sinader_periods`
- `waste_sinader_period_lines`

Los movimientos no peligrosos alimentarán el período vigente. Al finalizar el mes, el período debe congelarse como `pending_declaration`; la confirmación humana lo cambia a `declared` y registra el folio externo.

## Endpoints iniciales

Todos requieren `waste:read`.

```text
GET /api/waste/units
GET /api/waste/categories
GET /api/waste/types
GET /api/waste/warehouses
GET /api/waste/receipts
GET /api/waste/lots
GET /api/waste/lots/:id
GET /api/waste/lots/:id/movements
GET /api/waste/withdrawal-requests
GET /api/waste/withdrawal-requests/:id
GET /api/waste/sidrep
GET /api/waste/sinader/periods
GET /api/waste/sinader/periods/:id
```

Filtros principales disponibles:

```text
/types: categoryId, hazardous, status
/warehouses: businessUnitId, areaId, active
/receipts: warehouseId, from, to
/lots: warehouseId, wasteTypeId, status, hazardous, availableOnly, overdue, nearDue
/withdrawal-requests: warehouseId, status, approvalStatus, hazardous
/sidrep: status, folio
/sinader/periods: businessUnitId, year, month, status
```

## Permisos creados

```text
waste:read
waste:write
waste:approve
waste:close
waste:configure
waste:export
```

La migración los asigna inicialmente al rol `ADMIN`. Los roles funcionales específicos deben definirse cuando se confirme la matriz de responsabilidades del módulo.

## Evidencias

La migración registra estos tipos transversales:

```text
waste_receipt
waste_lot
waste_withdrawal_request
waste_sidrep_record
waste_sinader_period
```

Los documentos, fotografías, tickets, HDS y certificados deben utilizar `files`, `evidences` y `evidence_links`; no se deben crear tablas de archivos exclusivas para residuos.

## Próximas iteraciones

1. DTOs y comandos para registrar ingresos y crear lotes.
2. Reserva transaccional de cantidades al crear solicitudes de retiro.
3. Aprobación, rechazo, registro de folio y cierre SIDREP.
4. Cálculo y congelamiento mensual SINADER.
5. Reglas documentales configurables por tipo de residuo y etapa.
6. Umbrales RCA, alertas y dashboard.
7. Catálogos autorizados de transportistas, vehículos y destinos.
8. Contratos compartidos para frontend web y exportaciones.

## Validación local

```bash
pnpm --filter @aurelia/contracts build
pnpm --filter api test:waste
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api migration:run
```
