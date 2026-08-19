# ONBOARDING_BRIEF_2_DEVS

Estado: vigente al 2026-07-08.

## 1) Objetivo

Incorporar 2 desarrolladores nuevos con ejecucion asistida por IA, minimizando riesgo de drift arquitectonico y maximizando velocidad sobre el foco actual del producto.

## 2) Alcance autorizado

- Permitido:
  - Mejoras y nuevas historias en inspecciones web.
  - Mejoras y nuevas historias en mobile-inspecciones.
  - Ajustes de contratos compartidos con impacto controlado en consumidores.
  - Mantenimiento tecnico en mobile-incidentes sin expansion funcional.
- No autorizado:
  - Iniciar desarrollo funcional nuevo en incidentes.
  - Redefinir tipos/enums fuera de packages/contracts.
  - Exponer entidades TypeORM en responses HTTP.
  - Cambiar estrategia de estado sin decision de arquitectura.

## 3) Contexto minimo obligatorio

Lectura previa obligatoria:

1. [START_HERE.md](START_HERE.md)
2. [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
3. [ARCHITECTURE.md](ARCHITECTURE.md)
4. [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)
5. [CONTRACTS_GUIDELINES.md](CONTRACTS_GUIDELINES.md)
6. [ONBOARDING_PLAYBOOK.md](ONBOARDING_PLAYBOOK.md)

## 4) Calidad minima exigida

- Web:
  - pnpm --filter web test
- Mobile-inspecciones:
  - pnpm --filter mobile-inspecciones test
- API (si aplica):
  - pnpm --filter api build

Toda entrega debe incluir salida resumida de comandos ejecutados.

## 5) Criterio de asignacion para los 2 devs

- Dev A: inspecciones web (flujo UI, servicios, hooks, estado de pagina).
- Dev B: mobile-inspecciones (flujo operativo, offline, sincronizacion, UX de captura).
- Ambos: contratos y API solo cuando el ticket lo requiera.

## 6) Definicion de listo por ticket

Un ticket se considera listo cuando:

1. Respeta alcance autorizado.
2. Mantiene contratos unificados.
3. Pasa quality gates de la app afectada.
4. Entrega reporte con formato PMO.
5. Declara riesgos y pendientes.

## 7) Formato de reporte esperado por ticket

1. Estado: completado o completado con observaciones.
2. Alcance implementado.
3. Archivos modificados.
4. Contratos impactados.
5. Validaciones ejecutadas y resultado.
6. Riesgos detectados.
7. Siguiente accion recomendada.