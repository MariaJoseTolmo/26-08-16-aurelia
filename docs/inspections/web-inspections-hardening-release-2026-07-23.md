# Release note · Cierre de hardening de procesos de inspecciones

Fecha: 2026-07-23  
Rama: `feature/inspecciones/carlo`

## Resumen ejecutivo

1. Mobile dejó de inyectar y consumir `inspections:write` para decisiones de interfaz.
2. Crear y continuar inspecciones depende exclusivamente de `inspections:create`.
3. `inspections:create` no concede implícitamente `inspections:execute`.
4. Se retiró el polling periódico de los bridges de asignación y filtros web.
5. El menú de acciones dejó de localizarse por labels y se identifica por semántica ARIA y relación estructural dentro de la tabla.
6. Los `MutationObserver` restantes no controlan autorización, scope ni mutaciones de negocio.
7. Los acoplamientos DOM residuales quedan aceptados temporalmente con plan de salida concreto.
8. No se habilitó Superadmin, prórroga, disputa ni SLA escalonado.

## Hallazgos finales

| Severidad | Hallazgo | Estado | Evidencia / decisión |
| --- | --- | --- | --- |
| Medio | Alias mobile `inspections:write` podía inflar capacidades de UI y escalar `create -> execute` | **Corregido** | `mobileSession.store.ts` elimina el permiso legacy en sesiones nuevas y persistidas. `mobileInspectionCapabilities.ts` reconoce solo capabilities canónicas. `InspectionsHomeFigmaScreen.tsx` usa `capabilities.create` para crear y continuar borradores. |
| Medio | Polling y selectores frágiles en bridges de inspecciones web | **Corregido parcialmente / Aceptado Temporal acotado** | Se eliminaron los `setInterval`. El menú de acciones ya no busca “Ver detalles”/“PDF” por texto. Permanecen observadores y selectores estructurales únicamente para composición visual compatible. |

## Cambios por archivo

### Mobile permissions

- `apps/mobile-inspecciones/src/modules/auth/mobileSession.store.ts`
  - Elimina `inspections:write` al recibir o hidratar una sesión.
  - No agrega aliases ni transforma una capability canónica en otra.

- `apps/mobile-inspecciones/src/modules/inspection/mobileInspectionCapabilities.ts`
  - Centraliza `read`, `create`, `execute`, `review`, `reassign` y `admin`.
  - Reconoce solamente los claims canónicos o el rol `ADMIN` ya soportado.
  - Retira la regla legacy que hacía que `inspections:write` habilitara simultáneamente `create` y `execute`.

- `apps/mobile-inspecciones/src/modules/inspection/InspectionsHomeFigmaScreen.tsx`
  - Usa `useMobileInspectionCapabilities()`.
  - Habilita “Nueva inspección” y continuidad de borradores mediante `capabilities.create`.
  - Mantiene independiente cualquier acción futura que requiera `execute`.

### Bridges web

- `apps/web/src/modules/inspections/components/InspectionAssignmentScopeBridge.tsx`
  - Retira el intervalo de 150 ms.
  - Sincroniza por cambios reales del store y `MutationObserver` agrupado con `requestAnimationFrame`.
  - La fijación de compañía en el draft sigue siendo declarativa desde el store y el backend conserva la autoridad de scope.

- `apps/web/src/modules/inspections/components/InspectionAreaSectorFilterBridge.tsx`
  - Retira los dos intervalos de 600 ms.
  - Sincroniza por mutaciones reales, `focus`, `popstate` y eventos `change` del select nativo.
  - Agrupa ráfagas de cambios mediante `requestAnimationFrame` para evitar ejecuciones repetidas.

- `apps/web/src/modules/inspections/components/InspectionTableActionMenuBridge.tsx`
  - Retira la búsqueda global de menús por `textContent` de sus acciones.
  - Localiza el menú mediante `aria-haspopup="menu"`, `aria-expanded="true"`, relación de hermanos y scope dentro de una tabla.
  - Agrupa mutaciones, resize y scroll mediante `requestAnimationFrame`.

- `docs/inspections/web-inspections-hardening-baseline-2026-07-23.md`
  - Declara el retiro completo del alias mobile.
  - Documenta la separación obligatoria entre `create` y `execute`.

## Aceptado temporal

### `InspectionAssignmentScopeBridge`

- **Motivo técnico:** el selector manual de compañía todavía no expone un prop declarativo `locked` desde su vista propietaria.
- **Impacto:** un cambio del texto del label podría impedir el bloqueo visual del botón.
- **Riesgo residual:** UX; no permite saltar el scope porque el store fija la compañía y la API valida compañía/área.
- **Plan de salida:** pasar `assignmentScope` y `companyLocked` a `FindingObservationsStep`, deshabilitar allí el selector y eliminar `manualCompanyButtons` y el observer asociado.

### `InspectionAreaSectorFilterBridge`

- **Motivo técnico:** los filtros personalizados se montan sobre selects existentes dentro de una tabla monolítica.
- **Impacto:** reordenar columnas puede impedir que un filtro visual se monte sobre su select.
- **Riesgo residual:** degradación de filtro/UX; no altera permisos ni resultados autorizados por API.
- **Plan de salida:** agregar anchors declarativos tipados o renderizar `TwoStepTableSelectFilter` y `MultiSelectTableFilter` directamente desde `InspectionTable`; luego retirar selectores `nth-child` y el bridge.

### `InspectionTableActionMenuBridge`

- **Motivo técnico:** el menú visual personalizado todavía espeja el dropdown propietario para conservar el comportamiento actual sin refactor de la tabla.
- **Impacto:** cambios en la relación trigger/dropdown o en el orden interno de acciones pueden romper el espejo.
- **Riesgo residual:** UX de menú/PDF; no concede capacidades ni evita guards de API.
- **Plan de salida:** mover PDF y detalle al `ActionsDropdown` declarativo, pasar `inspectionId` directamente y eliminar el bridge completo.

## Fuera de alcance conservado

No se habilitaron flujos operativos ni UI para:

- Superadmin.
- Solicitudes o resolución de prórroga.
- Disputa de hallazgos.
- Recordatorios, vencimientos y escalamiento escalonado de SLA.

## Validaciones obligatorias

Los siguientes gates deben ejecutarse después de sincronizar los commits finales. No se marcan en verde desde el conector porque este entorno no dispone del runtime Node ni del workspace instalado del desarrollador.

| Comando | Resultado actual |
| --- | --- |
| `pnpm --filter @aurelia/contracts build` | Pendiente de ejecución final local; contracts no fue modificado en este bloque |
| `pnpm --filter web typecheck` | Pendiente de ejecución final local tras cambios en tres bridges |
| `pnpm --filter web lint` | Pendiente de ejecución final local tras cambios en tres bridges |
| `pnpm --filter mobile-inspecciones typecheck` | Pendiente de ejecución final local tras retiro del alias y cambio de dashboard |
| `pnpm --filter mobile-inspecciones lint` | Pendiente de ejecución final local tras retiro del alias y cambio de dashboard |
| `pnpm --filter mobile-inspecciones test:smoke` | Pendiente; encadena typecheck y lint |

## Validación funcional mínima

1. Usuario con `inspections:create` y sin `inspections:execute`: puede crear/continuar borrador, pero no debe adquirir acciones de ejecución.
2. Usuario con solo `inspections:write`: no puede crear ni continuar borradores.
3. Usuario con `inspections:execute` y sin `inspections:create`: no puede iniciar una nueva inspección.
4. Scope EECC con compañía fija: el draft conserva la compañía y el selector manual aparece bloqueado.
5. Filtros de tabla: se montan después de navegar, refrescar datos y cambiar página, sin polling.
6. Menú de acciones: detalle y PDF funcionan aunque cambie el copy de las acciones fuente.

## Decisión final

**No listo para cierre administrativo hasta ejecutar los seis gates finales.**

No quedan hallazgos Medios de permisos mobile abiertos. Los bridges quedaron reducidos a compatibilidad visual temporal, sin polling ni autoridad de negocio, y cuentan con plan de salida explícito. El único bloqueador restante es la evidencia de ejecución de build, typecheck, lint y smoke test sobre los commits finales.
