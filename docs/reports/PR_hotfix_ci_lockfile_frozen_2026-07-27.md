# Hotfix: lockfile + tipados de pdfkit para CI

## Título sugerido del PR
fix(ci): align lockfile and add pdfkit typings for api build

## Resumen
Este PR corrige dos fallas de CI:

1. Instalación con frozen lockfile.
2. Build de api por tipados faltantes de pdfkit.

El pipeline estaba fallando con `ERR_PNPM_OUTDATED_LOCKFILE` por desalineación entre `pnpm-lock.yaml` y los manifiestos del workspace.

Además, el build de api fallaba en TypeScript por no encontrar declaraciones para el módulo `pdfkit`.

## Contexto
- PR anterior ya fue mergeado.
- El arreglo se publica en una rama nueva para reingresar el fix de forma limpia:
  - Rama: `hotfix/ci-lockfile-frozen-20260727`
  - Commit aplicado: `f04a67bd`

## Cambios incluidos
- Actualización de lockfile del monorepo:
  - `pnpm-lock.yaml`
- Declaración explícita de tipos para pdfkit en api:
  - `apps/api/package.json` agrega `@types/pdfkit` en devDependencies

No se introducen cambios funcionales de negocio ni de código de aplicación.

## Resultado esperado
- Los jobs de CI que ejecutan `pnpm install --frozen-lockfile` deben pasar nuevamente.
- El build de api debe compilar sin errores TS relacionados a pdfkit.

## Riesgo
Bajo.

El cambio es acotado a lockfile y no modifica lógica de runtime.

## Validación realizada
- Se regeneró lockfile en raíz del monorepo con:
  - `pnpm install --lockfile-only`
- Se ejecutó build local de:
  - `pnpm --filter @aurelia/contracts build`
  - `pnpm --filter api build`
- Se ejecutó lint local de api:
  - `pnpm --filter api lint`
- Se ejecutó typecheck explícito de api:
  - `pnpm --filter api exec tsc -p tsconfig.json --noEmit`
- Se publicó rama remota para PR:
  - https://github.com/Kabeli-cl/aurelia-app/tree/hotfix/ci-lockfile-frozen-20260727

## Checklist
- [x] Lockfile sincronizado con el estado actual del workspace.
- [x] Tipados de pdfkit declarados explícitamente en api.
- [x] Rama hotfix publicada en origin.
- [ ] Confirmar checks de CI en GitHub tras abrir/actualizar PR.

## Notas
El smoke test actual de api reporta una falla de permisos en entorno local (`inspector permissions should not include users:read`). No bloquea este hotfix porque no es parte del error de build/lockfile y requiere análisis funcional separado.