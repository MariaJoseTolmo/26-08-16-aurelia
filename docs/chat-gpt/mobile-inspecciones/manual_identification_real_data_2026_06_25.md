# Manual identification real data - 2026-06-25

## Ruta

```txt
/inspection/manual/identification
```

## Decisión técnica

No se requiere Google Maps para esta iteración.

El proyecto `mobile-inspecciones` ya tiene `expo-location`, por lo que la captura real de coordenadas puede resolverse con permisos del navegador/dispositivo y GPS.

Para el preview visual del mapa se usa un tile público de OpenStreetMap calculado desde latitud/longitud. Esto permite validar el flujo sin agregar dependencia nueva ni API key.

Para producción se debe evaluar proveedor formal si se requiere:

- SLA comercial.
- Mapas satelitales.
- Uso offline.
- Pin arrastrable real.
- Políticas corporativas de uso de mapas.

Opciones candidatas:

- Google Maps Platform.
- Mapbox.
- ArcGIS Maps SDK / servicios corporativos GIS.

## Cambios aplicados

### Catálogos reales

Áreas y sectores ya estaban conectados a API:

```txt
GET /api/organization/areas
GET /api/organization/sectors?areaId=<id>
```

La vista mantiene estos servicios reales mediante `useManualInspectionCatalogs`.

### Sesión / banner de red

Se agregó:

```txt
apps/mobile-inspecciones/src/modules/inspection/useManualConnectivityStatus.ts
```

El banner ya no muestra siempre `Sin red · guardando localmente`.

Ahora distingue:

```txt
Con red · sesión activa
Sin sesión · guardando localmente
Sin red · guardando localmente
```

En web usa `navigator.onLine` y eventos `online/offline`. En native queda como online por defecto hasta integrar `@react-native-community/netinfo`.

### Ubicación real

Se agregó:

```txt
apps/mobile-inspecciones/src/modules/inspection/useManualInspectionLocation.ts
```

Responsabilidad:

- Pedir permisos foreground con `expo-location`.
- Capturar latitud, longitud, precisión y altitud.
- Convertir lat/lon a etiqueta UTM aproximada.
- Guardar datos en `manualInspection.store`.

### Store del borrador

Se actualizó:

```txt
apps/mobile-inspecciones/src/modules/inspection/manualInspection.store.ts
```

Nuevos campos:

```txt
latitude
longitude
altitude
locationCapturedAt
```

### Store del flujo

Se agregó:

```txt
apps/mobile-inspecciones/src/modules/inspection/manualInspectionFlow.store.ts
```

Responsabilidad:

- Mantener `currentStep`.
- Controlar el picker activo de área, sector o fecha.
- Abrir/cerrar selectores sin mezclar estado UI dentro del borrador.

### Selectores reales

Se agregó:

```txt
apps/mobile-inspecciones/src/modules/inspection/ManualSelectionUi.tsx
```

Incluye:

- `ManualFormStepper` con distribución balanceada del stepper.
- `SelectSheet` para área, sector y fecha.

La pantalla ya no cicla área/sector al tocar. Ahora abre una lista modal y permite seleccionar explícitamente.

La fecha ya no es un campo muerto. Ahora abre una lista de fechas próximas.

### Mapa real

Se actualizó:

```txt
apps/mobile-inspecciones/src/shared/components/form/ManualFormUi.tsx
```

`LocationMapPreview` ahora recibe:

```txt
latitude
longitude
accuracyLabel
```

Si hay coordenadas, renderiza tile real de OpenStreetMap. Si no hay ubicación, muestra placeholder.

## Pendientes

1. Evaluar proveedor formal de mapas antes de producción.
2. Agregar `@react-native-community/netinfo` si se necesita estado real de red en iOS/Android.
3. Implementar pin arrastrable real.
4. Persistir borrador local en storage, no solo Zustand en memoria.
5. Enviar ubicación al backend cuando exista endpoint de creación de inspección manual.
6. Reemplazar selector de fecha por calendario visual completo si el diseño lo exige.

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

Validar en navegador:

1. Iniciar sesión.
2. Ir a `/inspection/manual/identification`.
3. Tocar área y seleccionar desde lista.
4. Tocar sector y seleccionar desde lista.
5. Tocar fecha y seleccionar desde lista.
6. Presionar `Capturar ubicación`.
7. Aceptar permiso de ubicación del navegador.
8. Confirmar que aparece coordenada real, precisión y mapa.
