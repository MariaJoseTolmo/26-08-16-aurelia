# Resource scope smoke iteration - 2026-06-29

## Objetivo

Validar que la autorización fina por recurso no solo exista en código, sino que bloquee efectivamente accesos fuera del alcance de empresa del usuario.

## Script agregado

```txt
apps/api/src/test/api-scope-smoke.ts
```

## Comando

```powershell
pnpm --filter api test:scope
```

## Casos cubiertos

```txt
ADMIN crea recursos para SOMACOR y STRACON
Usuario SOMACOR puede ver recursos SOMACOR
Usuario SOMACOR no puede ver detalle de recursos STRACON
Usuario SOMACOR no ve recursos STRACON en listados
Usuario SOMACOR no puede crear recursos asociados a STRACON
Usuario STRACON puede ver recursos STRACON
Usuario STRACON no puede ver detalle de recursos SOMACOR
```

## Módulos cubiertos

```txt
Inspecciones
Incidentes
```

## Criterio de éxito

```txt
api resource scope smoke tests passed
```

## Criterio de falla

El script falla si un usuario ve, crea o consulta directamente un recurso fuera de su alcance de compañía.

## Pendiente futuro

Extender el mismo patrón a subrecursos secundarios:

```txt
inspection findings
inspection followups
incident immediate actions
incident investigations
incident action plans
```
