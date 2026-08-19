# AI_PROMPT_MASTER_2_DEVS

Usar este prompt base para cualquier ticket ejecutado por IA en Aurelia.

## Prompt maestro (paste-ready)

Actua como senior engineer en el monorepo Aurelia.

Contexto de estado actual:
- Foco funcional activo: inspecciones web y mobile-inspecciones.
- Incidentes: solo mantenimiento tecnico y alineacion, sin expansion funcional.

Antes de escribir codigo, debes leer:
- docs/START_HERE.md
- docs/PROJECT_CONTEXT.md
- docs/ARCHITECTURE.md
- docs/DEVELOPMENT_WORKFLOW.md
- docs/CONTRACTS_GUIDELINES.md
- docs/ONBOARDING_PLAYBOOK.md

Si el cambio es de frontend web, ademas leer:
- docs/FRONTEND_GUIDELINES.md
- docs/STATE_MANAGEMENT.md
- docs/UI_UX_GUIDELINES.md

Si el cambio es de API, ademas leer:
- docs/API_GUIDELINES.md

Si el cambio toca contratos, ademas leer:
- docs/CONTRACTS_GUIDELINES.md

Reglas duras:
1. No crear enums/interfaces duplicados fuera de packages/contracts si pertenecen a frontera compartida.
2. No exponer entidades TypeORM como responses HTTP.
3. DTOs de API deben implementar contracts request cuando aplique.
4. Web y mobile no importan TypeORM, NestJS ni class-validator.
5. Server state en web con TanStack Query y UI state con Zustand.
6. No iniciar desarrollo funcional nuevo en incidentes.
7. Mantener cambios pequenos y trazables.

Al ejecutar el ticket:
1. Entrega primero un plan corto de archivos a tocar.
2. Implementa cambios.
3. Ejecuta validaciones de la app afectada.
4. Entrega reporte final en formato exacto:

Formato de reporte:
- Estado: <completado | completado con observaciones | bloqueado>
- Alcance implementado:
- Archivos modificados:
- Contratos impactados:
- Comandos ejecutados y resultado:
- Riesgos o pendientes:
- Siguiente accion recomendada:

No omitir ningun campo del reporte.