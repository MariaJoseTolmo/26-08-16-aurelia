# UI_UX_GUIDELINES

Principios de diseño y experiencia para web y móvil. El sistema de diseño visual (tokens, paleta, tipografía) **aún no está definido**; este documento fija principios y deja marcadores para completarlos.

## Principios generales

- **Claridad sobre densidad.** La plataforma maneja datos críticos ambientales: priorizar legibilidad y jerarquía visual.
- **Consistencia entre apps.** Web y móviles comparten lenguaje visual y nomenclatura (los mismos estados/enums de `@aurelia/contracts` deben mostrarse igual en todas partes).
- **Feedback inmediato.** Toda acción (guardar, enviar, aprobar) confirma su resultado.
- **Diseño por rol.** La interfaz se adapta al rol: un INSPECTOR ve registro; un APPROVER ve bandeja de aprobación; un VIEWER ve solo lectura.

## Estados de UI (obligatorios)

Cada vista que consume datos debe contemplar explícitamente:

| Estado | Qué mostrar |
| --- | --- |
| **Loading** | Skeleton o indicador; no dejar la pantalla en blanco. |
| **Empty** | Mensaje claro + acción sugerida (p. ej. "Crear inspección"). |
| **Error** | Mensaje comprensible + reintentar. |
| **Success** | Datos + confirmaciones de acciones. |

Estos estados se mapean naturalmente a TanStack Query (`isLoading`, `isError`, `data`). Ver [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md).

## Representación de estados de dominio

Los estados (`InspectionStatus`, `IncidentStatus`, `IncidentRiskLevel`, etc.) deben tener una representación visual **consistente** (color + etiqueta) definida en un único lugar y reutilizada. Ejemplo de criticidad:

| Nivel | Intención de color |
| --- | --- |
| `LOW` | Neutro / verde |
| `MEDIUM` | Amarillo |
| `HIGH` | Naranja |
| `CRITICAL` | Rojo |

> Los valores cromáticos exactos se definirán con el sistema de diseño. Mantener el mapeo centralizado para no divergir entre web y móvil.

## Formularios

- Validación alineada con las **constraints compartidas** (`schemas` de `@aurelia/contracts`) para que cliente y servidor coincidan.
- Errores de campo claros y cercanos al input.
- Acciones primarias/secundarias bien diferenciadas.
- En terreno (móvil), formularios cortos, con campos grandes y tolerantes a conectividad intermitente.

## Accesibilidad

- Contraste suficiente (objetivo WCAG AA).
- Targets táctiles cómodos en móvil.
- Etiquetas y `aria` en controles; navegación por teclado en web.
- No comunicar información solo por color (añadir texto/icono).

## Móvil / terreno

- Optimizar para uso con guantes, sol directo y conectividad pobre.
- Captura de evidencia (foto, GPS) con feedback de estado.
- Indicar claramente el estado de sincronización de cada registro (pendiente / sincronizado / error). Ver [MOBILE_OFFLINE_STRATEGY.md](MOBILE_OFFLINE_STRATEGY.md).

## Pendiente de definir

- [ ] Sistema de diseño (tokens: color, tipografía, espaciado, radios).
- [ ] Librería de componentes base (a evaluar).
- [ ] Mapa definitivo de color por estado/criticidad.
- [ ] Guía de iconografía.
