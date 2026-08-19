# Manual inspection type step - 2026-06-25

## Figma reference

```txt
https://www.figma.com/design/DymqBWIjfxvuU6UK9wNI3p/Medio-Ambiente-Core?node-id=633-14601&m=dev
```

Nodo pantalla:

```txt
633:14601
```

Nodo body usado para ajuste fino:

```txt
633:14944
```

El nodo body sí entregó `get_design_context`, por lo que el ajuste de tipografía y espaciado del cuerpo se basó en ese contexto.

## Ruta creada

```txt
/inspection/manual/type
```

Archivo Expo Router:

```txt
apps/mobile-inspecciones/app/inspection/manual/type.tsx
```

Pantalla:

```txt
apps/mobile-inspecciones/src/modules/inspection/ManualInspectionTypeScreen.tsx
```

## Contratos usados

```txt
InspectionType
```

Importado desde:

```txt
@aurelia/contracts
```

Mapeo actual de opciones:

```txt
Hallazgo              -> InspectionType.ENVIRONMENTAL
Checklist normativo   -> InspectionType.REGULATORY
```

## Estado y arquitectura

### Zustand

Se extendió:

```txt
apps/mobile-inspecciones/src/modules/inspection/manualInspection.store.ts
```

Nuevos campos:

```txt
inspectionType
inspectionTypeLabel
```

Se extendió:

```txt
apps/mobile-inspecciones/src/modules/inspection/manualInspectionFlow.store.ts
```

Nuevas acciones:

```txt
goToIdentification()
goToType()
goToObservations()
```

### TanStack Query

Este paso no consume datos de servidor directamente. Usa estado local del borrador y enum compartido desde contracts.

La separación sigue vigente:

- catálogos de área/sector: TanStack Query en paso 1;
- selección temporal de tipo: Zustand, porque es draft local/offline.

## Cambios UI

- Se creó pantalla de tipo de inspección según Figma.
- Header con botón atrás, título, subtítulo y badge `GF HSE`.
- Banner de conectividad reutilizado.
- Stepper reutilizado con soporte para pasos completados.
- Card `Hallazgo` y card `Checklist normativo` seleccionable.
- Footer con `Atrás` y `Continuar`.
- Se ajustó body con nodo `633:14944`: título 18px, subtítulo 12px, card title 14px y descripción 11px.
- Se redujo tipografía de header/footer que había quedado sobredimensionada.

## Correcciones de navegación

- El botón `Continuar` del paso 1 queda deshabilitado mientras falte área, sector, fecha o ubicación.
- Cuando los campos requeridos están completos, navega a `/inspection/manual/type`.
- Se mantiene validación defensiva en `next()` por si se invoca manualmente.

## Pendientes

1. Validar pixel-to-pixel en navegador contra Figma.
2. Definir si `Hallazgo` requiere un enum más específico que `InspectionType.ENVIRONMENTAL`.
3. Crear pantalla `/inspection/manual/observations` para el paso 3.
4. Reemplazar `Alert` temporal del botón Continuar por navegación real al paso 3.
5. Confirmar si la opción `Hallazgo` debe quedar deshabilitada o seleccionable.

## Comandos de prueba

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
git pull origin main
pnpm install
pnpm --filter api start:dev
```

En otro terminal:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia\apps\mobile-inspecciones
pnpm web -- --clear
```

Validación:

1. Entrar a `/inspection/manual/identification`.
2. Confirmar que `Continuar` está deshabilitado si falta área, sector, fecha o ubicación.
3. Completar área, sector, fecha y ubicación.
4. Presionar `Continuar`.
5. Confirmar navegación a `/inspection/manual/type`.
6. Seleccionar `Hallazgo` o `Checklist normativo`.
7. Confirmar que cambia el texto: `Para esta inspección se ha seleccionado ...`.
