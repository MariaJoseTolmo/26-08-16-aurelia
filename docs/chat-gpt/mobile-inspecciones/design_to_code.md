# Contexto maestro para continuar el proyecto GoldFields II / AurelIA

## 1. Objetivo de este chat nuevo

Este chat debe continuar el trabajo del proyecto **GoldFields II / AurelIA**, una plataforma ambiental para Gold Fields, con foco actual en la app móvil de inspecciones.

El objetivo principal es avanzar de forma ordenada en:

* Integración visual desde Figma hacia el repo real.
* Implementación de pantallas mobile en Expo / React Native.
* Fidelidad visual alta, idealmente pixel-perfect cuando exista frame Figma.
* Integración progresiva con backend NestJS, base de datos PostgreSQL y contratos compartidos.
* Reutilización de componentes tipo UI Kit interno.
* Evitar mocks permanentes cuando ya exista o deba existir endpoint real.
* Mantener coherencia con arquitectura del repo.
* Entregar siempre comandos claros para que el usuario pueda traer cambios y levantar la app localmente.

---

## 2. Repositorio y conectores disponibles

Tenemos conectores activos a:

### GitHub

Repositorio principal:

```txt
CarloAguirre/Aurelia
```

Rama de trabajo actual:

```txt
main
```

El asistente puede leer y escribir archivos directamente en GitHub mediante el conector.

Cada intervención de código debe terminar con:

1. Commits realizados.
2. Archivos principales modificados/creados.
3. Ruta o flujo afectado.
4. Comandos exactos para que el usuario haga `git pull` y levante la app.
5. Pendientes o riesgos detectados.

### Figma

Archivo Figma principal:

```txt
https://www.figma.com/design/DymqBWIjfxvuU6UK9wNI3p/Medio-Ambiente-Core
```

El asistente puede intentar usar:

* `get_metadata`
* `get_design_context`
* `get_screenshot`
* `use_figma`

Cuando el frame sea grande o el contexto falle, usar la captura enviada por el usuario como referencia visual principal y decirlo explícitamente.

---

## 3. Stack y estructura del monorepo

Monorepo con pnpm.

Estructura relevante:

```txt
apps/
  api/
    NestJS + TypeORM + PostgreSQL
  web/
    React / Vite
  mobile-inspecciones/
    Expo / React Native
  mobile-incidentes/
packages/
  contracts/
```

App actual en foco:

```txt
apps/mobile-inspecciones
```

Stack mobile:

```txt
Expo
React Native
expo-router
react-native-svg
@expo/vector-icons
StyleSheet
Zustand o stores simples
Servicios API propios
```

Backend:

```txt
apps/api
NestJS
TypeORM
PostgreSQL
```

Contratos compartidos:

```txt
packages/contracts
```

---

## 4. Principios de trabajo

### 4.1 No inventar

Si un conector falla, decirlo claramente.

No asumir que un frame Figma fue leído correctamente si no fue así.

No inventar endpoints, entidades o relaciones si no se han inspeccionado archivos del repo.

### 4.2 Primero entender la arquitectura

Antes de escribir código:

1. Leer archivos existentes del módulo.
2. Revisar rutas.
3. Revisar servicios/hooks/stores existentes.
4. Revisar `FIGMA_MAKE_BRIEF.md`.
5. Revisar la Guía Maestra de referencias cuando el cambio afecte modelo de datos o flujo funcional.

### 4.3 Figma no es solo inspiración

Cuando se trabaje una vista desde Figma:

1. Extraer metadata/contexto del frame.
2. Obtener screenshot cuando sea posible.
3. Identificar:

   * dimensiones
   * paddings
   * colores
   * jerarquía visual
   * textos
   * íconos
   * componentes reutilizables
4. Si los íconos son críticos, usar SVG reales exportados desde Figma o assets subidos al repo.
5. Evitar aproximaciones con FontAwesome cuando el diseño exige fidelidad.

### 4.4 Reutilización tipo UI Kit

No crear componentes duplicados por cada pantalla si ya existe una pieza equivalente.

Priorizar creación/reutilización de componentes compartidos en:

```txt
apps/mobile-inspecciones/src/shared/components
```

Ejemplos deseables:

```txt
shared/components/brand/GoldFieldsAureliaLogo.tsx
shared/components/icons/*
shared/components/ui/*
```

Ya existe o se creó:

```txt
apps/mobile-inspecciones/src/shared/components/brand/GoldFieldsAureliaLogo.tsx
apps/mobile-inspecciones/src/shared/components/icons/SparklesMark.tsx
apps/mobile-inspecciones/src/shared/components/icons/PaperPlaneMark.tsx
```

---

## 5. Flujo funcional actual de inspecciones mobile

El flujo mobile actual que se está construyendo es:

```txt
/access
  ↓
/inspection/dashboard
  ↓ botón "Nueva inspección"
/inspection/start
  ↓ botón "Iniciar con asistente"
/inspection/chat
```

Y para formulario manual:

```txt
/inspection/start
  ↓ botón "Usar formulario manual"
/inspection/manual/identification
```

La vista `/inspection/start` ya quedó muy fiel al diseño Figma. De esa vista salen dos caminos:

1. Asistente AurelIA.
2. Formulario manual.

---

## 6. Pantallas trabajadas hasta ahora

### 6.1 Pantalla de selección de modo

Figma node:

```txt
804:1459
```

Ruta:

```txt
/inspection/start
```

Archivo:

```txt
apps/mobile-inspecciones/src/modules/inspection/InspectionModeScreen.tsx
```

Ruta Expo:

```txt
apps/mobile-inspecciones/app/inspection/start.tsx
```

Función:

* Pregunta: “¿Cómo deseas registrar esta inspección?”
* Botón “Iniciar con asistente” navega a:

```txt
/inspection/chat
```

* Botón “Usar formulario manual” debe navegar a:

```txt
/inspection/manual/identification
```

Esta pantalla quedó muy parecida a Figma y usa SVGs reales para iconografía cuando fue necesario.

### 6.2 Chat / asistente AurelIA

Ruta:

```txt
/inspection/chat
```

Archivo:

```txt
apps/mobile-inspecciones/src/modules/inspection/InspectionChatScreen.tsx
```

Componentes relacionados:

```txt
ChatHeader.tsx
ChatInput.tsx
BotBubble.tsx
TypingIndicator.tsx
AiProposalCard.tsx
QuickOpts.tsx
```

Se reemplazaron íconos problemáticos por SVGs propios:

```txt
SparklesMark.tsx
PaperPlaneMark.tsx
```

Motivo: algunos íconos de FontAwesome no existían en Expo y aparecían como `?`.

### 6.3 Login / Access

Ruta:

```txt
/access
```

Archivo:

```txt
apps/mobile-inspecciones/src/modules/auth/AureliaAccessScreen.tsx
```

Ruta Expo:

```txt
apps/mobile-inspecciones/app/access.tsx
```

Figma node:

```txt
635:25151
```

Estado actual:

* Pantalla visual creada.
* Se corrigió el layout para evitar que “Diseñado y desarrollado por KABELI” quede encima del botón.
* Se creó un logo reusable:

```txt
apps/mobile-inspecciones/src/shared/components/brand/GoldFieldsAureliaLogo.tsx
```

Importante:

El logo todavía puede requerir reemplazo por el SVG 1:1 oficial exportado completo desde Figma, porque el SVG original era muy largo y algunas respuestas del conector se truncaban o eran bloqueadas. Mientras tanto se usa una versión vectorial aproximada mucho mejor que el círculo “GF”.

### 6.4 Home / Dashboard inspecciones

Ruta:

```txt
/inspection/dashboard
```

Figma nodes intentados:

```txt
638:2045
642:3112
```

El más completo usado:

```txt
642:3112
```

Ruta Expo:

```txt
apps/mobile-inspecciones/app/inspection/dashboard.tsx
```

Pantalla nueva de fidelidad:

```txt
apps/mobile-inspecciones/src/modules/inspection/InspectionsHomeFigmaScreen.tsx
```

Home anterior simplificado:

```txt
apps/mobile-inspecciones/src/modules/inspection/InspectionsHomeScreen.tsx
```

La ruta actual debe apuntar a:

```txt
InspectionsHomeFigmaScreen
```

Home incluye:

* Header navy.
* Logo Gold Fields AurelIA.
* Campana.
* Saludo a Karen Opazo S.
* Rol: Inspector · Admin GF HSE.
* Métricas:

  * Total 2026
  * Abiertas
  * SLA vencidos
  * Obs. cerradas
* Botón Filtrar.
* Botón Nueva inspección.
* Bloque Formularios inconclusos.
* Cards de inspecciones.
* Tabs inferiores:

  * Gestión de inspecciones
  * Historial

Se agregaron SVGs reales para:

```txt
apps/mobile-inspecciones/assets/icons/home-filter.svg
apps/mobile-inspecciones/assets/icons/home-plus.svg
apps/mobile-inspecciones/assets/icons/home-bell.svg
apps/mobile-inspecciones/assets/icons/home-shield.svg
apps/mobile-inspecciones/assets/icons/home-finding.svg
apps/mobile-inspecciones/assets/icons/home-status.svg
```

---

## 7. Usuario demo solicitado

El usuario pidió crear o usar un seed para una inspectora mockeada del diseño:

```txt
Nombre: Karen Opazo S.
Email / usuario: karen.opazo@goldfields.com
Clave: Aurelia2026!
Empresa: Gold Fields
Área sugerida: Medio Ambiente
Rol: Inspector / Admin GF HSE
```

Se agregó o avanzó una integración demo de auth:

Endpoint backend:

```txt
POST /auth/login
```

Servicio:

```txt
apps/api/src/modules/auth/auth.service.ts
```

Respuesta esperada:

```ts
{
  token: string,
  user: {
    id: string,
    email: string,
    fullName: string,
    firstName: string,
    lastName: string,
    position: string | null,
    companyId: string | null,
    companyName: string | null,
    areaId: string | null,
    areaName: string | null,
    roles: Role[],
    permissions: string[]
  }
}
```

Pendiente importante:

Verificar que exista seed real en base de datos para Karen Opazo y no solo fallback visual/demo.

---

## 8. Documentos importantes del repo/proyecto

Revisar cuando sea necesario:

```txt
docs/FIGMA_MAKE_BRIEF.md
```

Este documento da reglas para integrar Figma Make / diseños con la estructura real del repo.

También existe una guía maestra en las fuentes del proyecto:

```txt
Guía Maestra de referencias para la creacion de la base de datos.docx
```

Usarla cuando se trabaje:

* flujo real de inspecciones
* usuarios
* áreas
* sectores
* empresas
* formularios
* hallazgos
* criticidad
* SLA
* acciones correctivas
* modelo de datos
* endpoints backend

También existe una imagen o referencia del flujo completo:

```txt
Levantar inspección - Mobile.png
```

El usuario la menciona como fuente del flujo completo de inspecciones mobile.

---

## 9. Criterios visuales importantes

### 9.1 Fidelidad

El usuario quiere que las pantallas queden muy cercanas a Figma. Cuando diga “pixel-perfect”, priorizar:

* SVGs reales.
* Medidas del metadata Figma.
* Posicionamiento exacto.
* Colores exactos.
* Tipografía Inter o equivalente.
* Espaciados similares.
* Bordes, sombras y radios.
* Evitar aproximaciones de íconos.

### 9.2 Iconografía

No usar FontAwesome por defecto si el ícono aparece diferente al diseño.

Preferencia actual:

1. Exportar SVG desde Figma con `use_figma`.
2. Guardar SVG en:

```txt
apps/mobile-inspecciones/assets/icons
```

3. Importarlo como componente.
4. Usarlo con `width` y `height`.

Ejemplo:

```tsx
import FilterIcon from '../../../assets/icons/home-filter.svg';

<FilterIcon width={15} height={12} />
```

Ya se usa `react-native-svg`, por lo tanto los SVGs deben poder importarse correctamente según configuración del proyecto.

### 9.3 Logo

No usar texto improvisado para el logo.

Actualmente existe:

```txt
GoldFieldsAureliaLogo.tsx
```

Pero si se puede exportar el logo completo 1:1 desde Figma y guardarlo como asset, hacerlo.

---

## 10. Comandos estándar que siempre se deben entregar al usuario

Después de cada intervención en GitHub, entregar como mínimo:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
git pull origin main
cd apps\mobile-inspecciones
pnpm web -- --clear
```

Si hubo cambios de dependencias:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
git pull origin main
pnpm install
cd apps\mobile-inspecciones
pnpm web -- --clear
```

Si falla `pnpm install` con errores tipo `execa_tmp`:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force node_modules\execa_tmp_* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\mobile-inspecciones\node_modules -ErrorAction SilentlyContinue
pnpm store prune
pnpm install --force
cd apps\mobile-inspecciones
pnpm web -- --clear
```

Si falta `react-native-svg`:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
pnpm --filter mobile-inspecciones exec expo install react-native-svg
cd apps\mobile-inspecciones
pnpm web -- --clear
```

Si se necesita levantar backend:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
pnpm --filter api start:dev
```

Si se necesita levantar mobile en otro terminal:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia\apps\mobile-inspecciones
pnpm web -- --clear
```

---

## 11. Formato de respuesta esperado después de tocar código

Cada vez que el asistente haga cambios en GitHub, responder así:

````md
Listo. Cambié lo siguiente:

Commits:
- <sha> <mensaje>
- <sha> <mensaje>

Archivos principales:
- ruta/archivo1.tsx
- ruta/archivo2.ts
- ruta/archivo3.svg

Flujo afectado:
- /access → /inspection/dashboard → /inspection/start

Cómo probar:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
git pull origin main
pnpm install
cd apps\mobile-inspecciones
pnpm web -- --clear
````

Pendientes:

* pendiente 1
* pendiente 2

````

No terminar una intervención sin comandos.

---

## 12. Estado de rutas actuales

Rutas esperadas:

```txt
/
  debe redirigir o renderizar /access

/access
  pantalla login/acceso

/inspection/dashboard
  Home de inspecciones

/inspection/start
  selección de modo: asistente o formulario manual

/inspection/chat
  flujo conversacional con AurelIA

/inspection/manual/identification
  paso 1 del formulario manual
````

Botones esperados:

```txt
/access -> Iniciar sesión -> /inspection/dashboard
/inspection/dashboard -> Nueva inspección -> /inspection/start
/inspection/start -> Iniciar con asistente -> /inspection/chat
/inspection/start -> Usar formulario manual -> /inspection/manual/identification
```

---

## 13. Integración backend pendiente / deseada

No dejar el flujo como solo mock visual. Ir integrando progresivamente.

Prioridades sugeridas:

### 13.1 Auth real/demo

* Confirmar seed real de Karen Opazo.
* Login con email/usuario y contraseña.
* Guardar sesión en store mobile.
* Usar nombre real en Home.

### 13.2 Home real

Crear endpoint si no existe:

```txt
GET /inspections/mobile/home
```

Debe devolver:

```ts
{
  metrics: {
    totalYear: number;
    open: number;
    expiredSla: number;
    closedPercentage: number;
  };
  drafts: InspectionDraftSummary[];
  inspections: InspectionHomeCard[];
}
```

### 13.3 Catálogos para formulario manual

El paso manual de identificación necesita datos reales:

* inspector actual
* empresa del inspector
* áreas
* sectores
* ubicación
* fecha
* faena

Endpoints posibles:

```txt
GET /mobile/catalogs/inspection-start
GET /areas
GET /sectors?areaId=
GET /companies
```

Pero antes de crear endpoints, inspeccionar backend existente.

### 13.4 Formulario manual

El formulario manual debería tener pasos:

1. Identificación.
2. Tipo.
3. Observación.
4. Resumen.
5. Confirmación/envío.

El frame trabajado para el paso 1 es:

```txt
804:1173
```

Ruta:

```txt
/inspection/manual/identification
```

Debe dejar de tener selects mockeados y usar datos reales del backend.

---

## 14. Problemas conocidos y precauciones

### 14.1 Figma puede fallar por frame demasiado grande

Cuando se pasa un link de un canvas muy grande o flujo completo, el conector puede devolver metadata insuficiente o fallar.

Solución:

* Pedir frame específico.
* Usar `node-id`.
* Usar `get_screenshot`.
* Si falla, usar imagen adjunta como fuente visual.
* Informar que no se obtuvo contexto completo.

### 14.2 SVGs largos pueden truncarse o bloquearse

El logo Gold Fields/AurelIA exportado como SVG completo puede ser largo. Si el conector lo devuelve truncado:

* Intentar exportar por partes.
* Usar screenshot PNG temporal si no hay alternativa.
* Idealmente pedir al usuario subir el SVG al repo.
* O crear un asset manual aproximado, avisando que no es 1:1.

### 14.3 No romper imports SVG

Si se importan SVGs como componentes, verificar que el proyecto tenga soporte para SVG en React Native / Expo.

Ya se agregó o se requiere:

```txt
react-native-svg
```

Si Metro no reconoce SVG, revisar configuración.

### 14.4 No duplicar Home

Actualmente puede existir:

```txt
InspectionsHomeScreen.tsx
InspectionsHomeFigmaScreen.tsx
```

La versión nueva de fidelidad es:

```txt
InspectionsHomeFigmaScreen.tsx
```

Después conviene consolidar y renombrar para no mantener duplicados.

---

## 15. Preferencias del usuario

* Responder en español.
* Ser directo, práctico y no inventar.
* Si algo no se sabe o falló, decirlo.
* Evitar respuestas genéricas.
* En código, evitar comentarios innecesarios.
* Priorizar integración real por sobre demos eternas.
* Priorizar fidelidad visual cuando se trabaja desde Figma.
* Siempre entregar comandos exactos para Windows / PowerShell.
* El usuario trabaja localmente en:

```txt
C:\Users\carlo\Desktop\aurelia\Aurelia
```

---

## 16. Prompt corto para iniciar el nuevo chat

Puedes comenzar el nuevo chat pegando esto:

```md
Estoy continuando el proyecto GoldFields II / AurelIA. Trabajamos sobre el repo `CarloAguirre/Aurelia`, rama `main`, con conectores a GitHub y Figma. El foco actual es `apps/mobile-inspecciones`, una app Expo/React Native. Necesito que respetes la arquitectura del repo, leas `docs/FIGMA_MAKE_BRIEF.md` antes de integrar diseños, uses Figma como fuente visual y priorices SVGs reales para iconografía. Después de cada intervención en GitHub debes darme commits, archivos modificados y comandos PowerShell para hacer pull y levantar la app.

Flujo actual:
`/access` → `/inspection/dashboard` → `/inspection/start` → `/inspection/chat` o `/inspection/manual/identification`.

Quiero continuar desde el estado actual, refinando fidelidad visual e integrando datos reales con backend NestJS/PostgreSQL progresivamente.
```

---

## 17. Comandos base para el usuario

Para traer cambios:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
git pull origin main
```

Para instalar dependencias:

```powershell
pnpm install
```

Para levantar mobile inspecciones:

```powershell
cd apps\mobile-inspecciones
pnpm web -- --clear
```

Para levantar backend:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
pnpm --filter api start:dev
```

Para limpiar error pnpm/execa:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force node_modules\execa_tmp_* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\mobile-inspecciones\node_modules -ErrorAction SilentlyContinue
pnpm store prune
pnpm install --force
cd apps\mobile-inspecciones
pnpm web -- --clear
```

---

## 18. Próximo paso recomendado

El próximo chat debería partir por:

1. Revisar que `/access` y `/inspection/dashboard` compilen.
2. Si hay error con SVG imports, corregir Metro/config o usar wrappers `react-native-svg`.
3. Refinar el logo a SVG/asset real 1:1.
4. Consolidar `InspectionsHomeScreen` y `InspectionsHomeFigmaScreen`.
5. Hacer que el login use inputs reales.
6. Conectar Home a backend.
7. Hacer que “Usar formulario manual” abra un formulario funcional con catálogos reales.
