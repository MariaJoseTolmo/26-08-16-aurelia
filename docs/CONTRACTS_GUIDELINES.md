# CONTRACTS_GUIDELINES

`@aurelia/contracts` es la **única fuente de verdad** para la forma de los datos que cruzan la frontera HTTP entre API, web y móviles.

## Principio fundamental

Los contratos son **agnósticos al framework**. El package **no** depende de NestJS, TypeORM, React, Expo, `class-validator` ni `class-transformer`. Su única devDependency es `typescript`.

Esto permite que web y móviles consuman tipos sin acoplarse al backend.

## Qué vive en contracts

```txt
packages/contracts/src
  /enums          Valores compartidos (InspectionStatus, IncidentRiskLevel, Role, ...)
  /interfaces     Modelos de dominio (Inspection, Incident, Area, ...) y BaseEntity
  /types          Utilidades (ID, ISODateString, GeoLocation, Pagination, ApiResponse)
  /dtos           Request/Response por dominio (*.request.ts / *.response.ts)
  /schemas        Restricciones de validación compartidas (objetos planos)
  index.ts        Barrel raíz
```

| Categoría | Emite runtime | Notas |
| --- | --- | --- |
| `enum` | Sí (objeto JS) | Usable como valor (`@IsEnum`, columnas) y como tipo. |
| `interface` / `type` | No | Se borran al compilar: cero peso en web/móvil. |
| `*.request` / `*.response` | No | Tipos de la frontera HTTP. |
| `schemas` (constraints) | Sí (objeto plano) | Límites/longitudes; sin dependencias de validadores. |

## Qué NO vive en contracts

- Entidades TypeORM, repositories, services o cualquier lógica de backend.
- Decoradores de `class-validator` / `class-transformer`.
- Componentes, hooks o lógica de React/React Native.
- Cualquier dependencia de un framework.

## El patrón clave: DTO de NestJS `implements` el contrato

El contrato define la **forma**; el backend agrega **validación** sin contaminar el contrato:

```ts
// @aurelia/contracts (agnóstico)
export interface CreateInspectionRequest {
  title: string;
  type: InspectionType;
  areaId: string;
  // ...
}

// apps/api (acoplado a Nest, alineado por el compilador)
export class CreateInspectionDto implements CreateInspectionRequest {
  @IsString() @MinLength(InspectionConstraints.title.minLength)
  title: string;

  @IsEnum(InspectionType) // enum importado de contracts
  type: InspectionType;

  @IsUUID()
  areaId: string;
}
```

- `implements` hace que **TypeScript falle en build** si el DTO se desvía del contrato.
- Los decoradores viven solo en el backend.
- El enum es el mismo objeto en ambos lados: `@IsEnum` valida exactamente los valores que conoce el frontend.

Ejemplo real: [create-inspection.dto.ts](../apps/api/src/modules/inspections/dto/create-inspection.dto.ts).

## Cómo consumir contratos

```ts
import { InspectionStatus, CreateInspectionRequest } from '@aurelia/contracts';
```

Funciona en `api`, `web`, `mobile-inspecciones` y `mobile-incidentes`.

- En **web/móvil**, importa tipos con `import type { ... }` cuando solo necesites el tipo (mejor tree-shaking). Los `enum` que uses como valor sí van con `import` normal.
- En **API**, importa enums y constraints como valores; importa los request/response como tipos para tipar controllers/services.

## Cómo agregar un contrato nuevo

1. Crea el archivo en la carpeta correspondiente (`enums/`, `interfaces/`, `dtos/<dominio>/`).
2. Expórtalo desde el `index.ts` de su carpeta (barrel).
3. `pnpm build:contracts` (o tener el watch activo).
4. Consúmelo desde las apps. Si es un request del backend, crea el DTO que lo `implements`.

Convenciones de nombres:

- Enums: `*.enum.ts` → `PascalCase` con valores `UPPER_SNAKE`.
- Requests: `create-x.request.ts` → `CreateXRequest`.
- Responses: `x.response.ts` → `XResponse` (suele ser alias de la interfaz de dominio).

## Versionado

Mientras el modelo no esté definido, los contratos pueden cambiar libremente. Una vez estabilizados, los cambios incompatibles deben coordinarse entre los tres equipos (un cambio en contracts afecta a todos sus consumidores y Turborepo los marca como afectados en CI).
