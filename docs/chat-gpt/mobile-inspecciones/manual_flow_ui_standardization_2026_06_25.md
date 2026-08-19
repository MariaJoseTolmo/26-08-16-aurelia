# Manual flow UI standardization - 2026-06-25

## Motivo

Se detectó inconsistencia visual entre `/inspection/manual/identification` y `/inspection/manual/type`:

- Header con tamaños de fuente distintos.
- Footer con botón `Continuar` distinto entre vistas.
- Duplicación de implementación en vez de un componente reutilizable del flujo.

## Decisión

Se creó un scaffold reutilizable para el flujo manual:

```txt
apps/mobile-inspecciones/src/shared/components/form/ManualFlowScaffold.tsx
```

Componentes:

```txt
ManualFlowHeader
ManualFlowFooter
```

Este archivo pasa a ser la fuente única para:

- Header del flujo manual.
- Badge `GF HSE`.
- Botón primario `Continuar`.
- Botón secundario `Cancelar` / `Atrás`.
- Estado disabled del botón primario.
- Home indicator del footer.

## Pantallas actualizadas

```txt
apps/mobile-inspecciones/src/modules/inspection/ManualIdentificationConnected.tsx
apps/mobile-inspecciones/src/modules/inspection/ManualInspectionTypeScreen.tsx
```

Ambas pantallas ahora usan:

```txt
ManualFlowHeader
ManualFlowFooter
```

## Mapa y pin manual

El pedido anterior sobre el mapa se mantiene integrado con esta estandarización.

Archivos relacionados:

```txt
apps/mobile-inspecciones/src/shared/utils/geo.utils.ts
apps/mobile-inspecciones/src/shared/components/form/ManualFormUi.tsx
apps/mobile-inspecciones/src/modules/inspection/ManualIdentificationConnected.tsx
```

Cambios:

- El placeholder del mapa ahora usa degradado, no fondo plano.
- El mapa acepta `onCoordinateChange`.
- Al tocar el mapa después de capturar ubicación, se recalcula lat/lon según el punto tocado.
- La etiqueta UTM se actualiza con la nueva coordenada.
- El texto de ayuda ahora indica: `Toca el mapa para ajustar manualmente la ubicación del pin`.

## Nota técnica

El ajuste manual actual es por tap sobre el mapa, no drag continuo. Es una implementación segura para web/mobile sin agregar una dependencia pesada de mapas interactivos.

Para arrastre real con pan/drag continuo se debe evaluar:

- `react-native-maps` para native.
- Mapbox / Google Maps / ArcGIS Maps SDK si se requiere proveedor formal.
- Compatibilidad Expo Web.

## Pendientes

1. Validar pixel-to-pixel de header/footer en ambas vistas.
2. Evaluar si `ManualHeader`, `ManualFooter` y `FormStepper` antiguos deben eliminarse de `ManualFormUi.tsx` en una limpieza posterior.
3. Confirmar si el pin debe moverse por tap o arrastre continuo.
4. Ejecutar build/lint local para detectar imports no usados.

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

Validar:

1. `/inspection/manual/identification` y `/inspection/manual/type` deben compartir mismo header/footer.
2. El botón `Continuar` debe verse igual en ambas vistas.
3. En `identification`, completar campos y capturar ubicación.
4. Tocar el mapa en otro punto.
5. Verificar que cambia la coordenada/UTM.
6. Presionar continuar y validar navegación a `/inspection/manual/type`.
