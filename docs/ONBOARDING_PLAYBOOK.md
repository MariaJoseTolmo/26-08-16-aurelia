# ONBOARDING_PLAYBOOK

Playbook operativo para onboarding rapido de nuevos desarrolladores en Aurelia, con foco en trabajo asistido por IA sin drift arquitectonico.

Fecha de referencia: 2026-07-08.

## 1) Estado real por modulo

| Modulo | Estado real | Alcance recomendado hoy |
| --- | --- | --- |
| Inspecciones (web) | Activo | Permitir mejoras y nuevas historias en `apps/web` relacionadas a inspecciones |
| Inspecciones (mobile) | Activo | Permitir mejoras y nuevas historias en `apps/mobile-inspecciones` |
| Incidentes (web/mobile) | Parcial / placeholder | Solo mantenimiento tecnico y alineacion de contratos, sin expansion funcional |
| API | Activo por fases | Cambios por dominio con trazabilidad de migraciones y contratos |
| Contracts | Activo | Fuente unica de verdad para enums, request/response y tipos compartidos |

## 2) Prioridades actuales (orden de ejecucion)

1. Estabilidad de inspecciones en web y mobile-inspecciones.
2. Consistencia contracts <-> DTOs <-> consumidores.
3. Salud de quality gates (build, lint, smoke tests).
4. Coherencia documental para reducir errores de contexto en prompts de IA.
5. Cambios en incidentes solo si son de alineacion tecnica o deuda critica.

## 3) No tocar sin autorizacion explicita

- No iniciar desarrollo funcional nuevo en modulo de incidentes.
- No crear tipos/enums locales cuando ya existen o deben vivir en `@aurelia/contracts`.
- No exponer entidades TypeORM como responses HTTP.
- No introducir imports cruzados entre apps.
- No cambiar estrategia de estado (TanStack Query server state, Zustand UI state) sin decision de arquitectura.
- No alterar migraciones historicas ejecutadas en entornos compartidos.

## 4) Checklist de primer dia para nuevos devs

1. Leer, en este orden:
   - `docs/START_HERE.md`
   - `docs/PROJECT_CONTEXT.md`
   - `docs/ARCHITECTURE.md`
   - `docs/DEVELOPMENT_WORKFLOW.md`
   - `docs/CONTRACTS_GUIDELINES.md`
   - `docs/FRONTEND_GUIDELINES.md`
2. Levantar entorno base:
   - `pnpm install`
   - `pnpm build:contracts`
   - `docker compose up -d`
3. Validar baseline:
   - `pnpm --filter web test`
   - `pnpm --filter mobile-inspecciones test`
   - `pnpm --filter api build`
4. Antes de cada PR:
   - Confirmar alcance de modulo segun seccion 1.
   - Confirmar que no viola seccion 3.
   - Adjuntar evidencia de comandos ejecutados.

## 4.1 Si el dev parte desde una asignacion de modulo

Si la instruccion inicial es del tipo:

- "Hoy trabajaras en inspecciones web"
- "Hoy trabajaras en mobile-inspecciones"
- "Hoy trabajaras en incidentes web"

entonces la IA debe:

1. Leer primero [README.md](../README.md).
2. Seguir desde ahi a [START_HERE.md](START_HERE.md).
3. Declarar explicitamente que documentos adicionales leyó segun el foco.
4. Confirmar si el modulo permite expansion funcional o solo mantenimiento tecnico.
5. Solo despues proponer o ejecutar cambios.

## 5) Definicion de listo para cambios de codigo

Se autoriza implementacion cuando se cumplen todas:

- El cambio esta alineado a prioridades de seccion 2.
- El prompt de IA incluye documentos leidos y alcance permitido.
- Hay trazabilidad de contratos y consumidores afectados.
- Los quality gates de la app afectada quedan en verde.

## 6) Formato minimo de reporte en cada entrega

1. Alcance tocado.
2. Archivos modificados.
3. Contratos impactados.
4. Comandos ejecutados y resultado.
5. Riesgos o pendientes.

## 7) Kit listo para usar (2 nuevos devs)

- Brief operativo: [ONBOARDING_BRIEF_2_DEVS.md](ONBOARDING_BRIEF_2_DEVS.md)
- Prompt maestro para IA: [AI_PROMPT_MASTER_2_DEVS.md](AI_PROMPT_MASTER_2_DEVS.md)
- Plantilla de reporte diario: [DAILY_REPORT_TEMPLATE_2_DEVS.md](DAILY_REPORT_TEMPLATE_2_DEVS.md)