# API hardening iteration - 2026-06-26

## Objetivo

Subir la API desde MVP/demo hacia una base de seguridad inicial sin bloquear el avance funcional de mobile inspecciones.

## Alcance respetado

No se tocó la fidelidad visual ni el flujo asistido mobile de inspecciones.

## Estado revisado antes de cambiar código

- `AuthService` validaba una contraseña demo y devolvía `demo-token-${user.id}`.
- `JwtTokenService` ya existía, pero el login no lo usaba para emitir el token.
- `JwtAuthGuard` validaba Bearer token, pero no estaba activo como `APP_GUARD` global.
- `AuthController.getMe` ya leía `request.user`, pero `fullName` seguía usando el email.
- `HealthController` no tenía marca pública explícita.
- `MobileBootstrapController`, `MobileSyncController`, inspecciones, organización y usuarios no tenían marca pública, por lo que quedan protegidos al activar el guard global.
- El cliente mobile ya enviaba `Authorization: Bearer <token>` cuando existe sesión.
- `apps/api/src/test/api-smoke.ts` ejecutaba flujos sin Bearer token, por lo que quedaba desalineado con el guard global.
- Los permisos base ya existían en seed para organización, usuarios, roles y permisos, pero no había guard declarativo que los exigiera por endpoint.
- El login emitía permisos fallback: `*` para ADMIN e `inspections:create`, `inspections:read` para otros roles.
- Inspecciones, incidentes, SPR, evidencias y mobile seguían solo con JWT, sin permisos declarativos.

## Cambios aplicados

### Decorador de rutas públicas

Se agregó:

```txt
apps/api/src/modules/auth/public.decorator.ts
```

Expone `@Public()` e `IS_PUBLIC_KEY` para declarar explícitamente rutas o controladores fuera del guard global.

### Token service

Se actualizó:

```txt
apps/api/src/modules/auth/jwt-token.service.ts
```

El payload firmado incluye:

```txt
sub
email
fullName
roles
permissions
iat
exp
```

También valida estructura de header, algoritmo `HS256`, tipo `JWT`, firma HMAC, expiración y forma mínima del payload.

Variables esperadas:

```txt
API_TOKEN_KEY
API_TOKEN_TTL_SECONDS
```

`API_TOKEN_KEY` debe tener al menos 32 caracteres.

### Login con token firmado y permisos reales

Se actualizó:

```txt
apps/api/src/modules/auth/auth.service.ts
```

El login ya no devuelve `demo-token-*`. Ahora:

1. Normaliza el email.
2. Valida usuario activo existente en base de datos.
3. Valida contraseña desde env.
4. Carga roles desde `user_roles`.
5. Carga permisos reales desde `role_permissions` y `permissions`.
6. Emite token firmado con `JwtTokenService`.
7. Actualiza `lastLoginAt`.
8. Devuelve usuario y token compatible con el cliente mobile actual.

Se eliminaron los permisos fijos del login:

```txt
ADMIN -> *
otros roles -> inspections:create, inspections:read
```

El token queda alineado con lo que exista realmente en `role_permissions`.

Variables de compatibilidad dev:

```txt
API_LOGIN_PASSWORD
DEMO_LOGIN_PASSWORD
```

Se prefiere `API_LOGIN_PASSWORD`. `DEMO_LOGIN_PASSWORD` queda como compatibilidad local temporal, sin valor hardcodeado.

### Configuración de secretos por ambiente

Se actualizó:

```txt
apps/api/src/config/configuration.ts
```

Expone:

```txt
security.tokenKey
security.tokenTtlSeconds
auth.loginPassword
```

No se dejó `JWT_SECRET`, `API_TOKEN_KEY` ni contraseña de login hardcodeada.

### Guard global JWT

Se actualizó:

```txt
apps/api/src/modules/auth/auth.module.ts
```

`JwtAuthGuard` quedó activo como `APP_GUARD`.

### Guard con metadata pública

Se actualizó:

```txt
apps/api/src/modules/auth/jwt-auth.guard.ts
```

El guard consulta `@Public()` con `Reflector`. Si la ruta no es pública, exige `Authorization: Bearer <token>`.

### Decorador y guard global de permisos

Se agregaron:

```txt
apps/api/src/modules/auth/require-permissions.decorator.ts
apps/api/src/modules/auth/permissions.guard.ts
```

`@RequirePermissions(...)` protege rutas de forma declarativa. `PermissionsGuard` se registró como segundo `APP_GUARD`, respeta `@Public()`, permite rutas sin permisos declarados y retorna `403` cuando el token no contiene todos los permisos requeridos.

El guard ya no acepta `*` como bypass administrativo. Toda ruta con permisos declarados exige permisos explícitos.

### Matriz de permisos por rol

Se actualizó:

```txt
apps/api/src/database/seeds/001-seed-phase1.ts
```

Se agregaron permisos operacionales para:

```txt
mobile
inspections
incidents
spr
evidences
comments
workflows
```

También se agregaron asignaciones por rol:

```txt
ADMIN -> todos los permisos existentes
SUPERVISOR -> lectura/escritura operacional, aprobación SPR/workflows, validación de evidencias, lectura de usuarios
INSPECTOR -> mobile sync, lectura/escritura operacional, envío SPR, evidencias y comentarios
APPROVER -> lectura operacional, aprobación SPR/workflows, validación de evidencias
VIEWER -> lectura operacional
```

El seed es idempotente con `ON CONFLICT DO NOTHING`.

### Usuarios, roles, permisos y organización protegidos

Se actualizaron:

```txt
apps/api/src/modules/users/users.controller.ts
apps/api/src/modules/roles/roles.controller.ts
apps/api/src/modules/organization/organization.controller.ts
```

Permisos aplicados:

```txt
users:read
users:write
roles:read
roles:write
permissions:read
permissions:write
organization:read
organization:write
```

### Mobile protegido con permisos

Se actualizaron:

```txt
apps/api/src/modules/mobile-bootstrap/mobile-bootstrap.controller.ts
apps/api/src/modules/mobile-sync/mobile-sync.controller.ts
```

Permisos aplicados:

```txt
GET /api/mobile/bootstrap -> mobile:read
GET /api/mobile/sync -> mobile:sync
GET /api/mobile/sync/:batchId -> mobile:sync
POST /api/mobile/sync -> mobile:sync
```

### Inspecciones protegidas con permisos

Se actualizaron:

```txt
apps/api/src/modules/inspections/inspections.controller.ts
apps/api/src/modules/inspections/inspection-transversal.controller.ts
```

Permisos aplicados:

```txt
GET /api/inspections/* -> inspections:read
POST/PATCH /api/inspections/* -> inspections:write
GET /api/inspections/:id/evidences -> evidences:read
POST /api/inspections/:id/evidences/:evidenceId/link -> inspections:write + evidences:write
GET /api/inspections/:id/comments -> comments:read
POST /api/inspections/:id/comments -> comments:write
```

### Incidentes protegidos con permisos

Se actualizaron:

```txt
apps/api/src/modules/incidents/incidents.controller.ts
apps/api/src/modules/incidents/incident-transversal.controller.ts
```

Permisos aplicados:

```txt
GET /api/incidents/* -> incidents:read
POST/PATCH /api/incidents/* -> incidents:write
GET /api/incidents/:id/evidences -> evidences:read
POST /api/incidents/:id/evidences/:evidenceId/link -> incidents:write + evidences:write
GET /api/incidents/:id/comments -> comments:read
POST /api/incidents/:id/comments -> comments:write
```

### SPR protegido con permisos

Se actualizó:

```txt
apps/api/src/modules/spr/spr.controller.ts
```

Permisos aplicados:

```txt
GET /api/spr/* -> spr:read
POST/PATCH /api/spr/monthly-records/* -> spr:write
POST /api/spr/monthly-records/:id/submit -> spr:submit
POST /api/spr/monthly-records/:id/approve -> spr:approve
POST /api/spr/monthly-records/:id/reject -> spr:approve
GET /api/spr/monthly-records/:id/evidences -> evidences:read
POST /api/spr/monthly-records/:id/evidences/:evidenceId/link -> spr:write + evidences:write
GET /api/spr/monthly-records/:id/comments -> comments:read
POST /api/spr/monthly-records/:id/comments -> comments:write
```

### Evidencias protegidas con permisos

Se actualizó:

```txt
apps/api/src/modules/evidences/evidences.controller.ts
```

Permisos aplicados:

```txt
GET /api/evidences -> evidences:read
POST /api/evidences -> evidences:write
POST /api/evidences/:id/link -> evidences:write
PATCH /api/evidences/:id/validate -> evidences:validate
```

### Login público y `/api/me` real

Se actualizó:

```txt
apps/api/src/modules/auth/auth.controller.ts
```

`POST /api/auth/login` quedó público con `@Public()`.

`GET /api/me` queda protegido y responde desde `request.user`:

```txt
id
email
fullName
roles
permissions
isPlaceholder=false
```

### Health público

Se actualizó:

```txt
apps/api/src/modules/health/health.controller.ts
```

El controlador quedó marcado con `@Public()` para mantener disponible `GET /api/health` sin token.

### Smoke test autenticado, RBAC real y permisos operacionales

Se actualizó:

```txt
apps/api/src/test/api-smoke.ts
```

El smoke test ahora:

1. Configura secretos efímeros si no existen variables de entorno.
2. Asegura la matriz de permisos operacionales en la base de prueba.
3. Valida `GET /api/health` sin token.
4. Valida `GET /api/me` sin token con respuesta `401`.
5. Valida `GET /api/mobile/bootstrap` sin token con respuesta `401`.
6. Valida login inválido con respuesta `401`.
7. Ejecuta login válido con usuario inspector.
8. Valida `/api/me` con usuario autenticado real.
9. Valida permisos operacionales del inspector.
10. Valida que el inspector no tenga permisos administrativos ni `spr:approve`.
11. Valida que mobile, organización, inspecciones, incidentes y SPR funcionen para inspector.
12. Valida `403` para inspector en usuarios, roles y permisos.
13. Ejecuta login admin.
14. Valida que admin no reciba wildcard `*`.
15. Valida que admin reciba permisos reales desde `role_permissions`.
16. Reutiliza Bearer token admin para los flujos existentes de inspecciones, incidentes y SPR.

### Headers, CORS y rate limit

Se mantiene lo ya aplicado:

```txt
apps/api/src/shared/security/http-security.ts
apps/api/src/main.ts
```

CORS sigue usando `CORS_ORIGINS`, los headers básicos siguen activos y el rate limit in-memory se mantiene en 180 requests por minuto por ip, método y path.

### Cliente mobile

No se modificó el flujo visual ni asistido mobile.

Se mantiene lo ya aplicado:

```txt
apps/mobile-inspecciones/src/shared/services/http-client.ts
```

El cliente mobile seguirá llamando bootstrap/sync después de login porque conserva el token en sesión y lo envía como Bearer. El usuario inspector ahora tiene `mobile:read` y `mobile:sync` desde la matriz de permisos.

## Rutas públicas

```txt
POST /api/auth/login
GET /api/health
```

## Comandos de validación local

Instalar dependencias:

```bash
pnpm install
```

Configurar variables mínimas para levantar API manualmente:

```bash
$env:API_TOKEN_KEY="dev-local-token-key-change-me-32-characters"
$env:AURELIA_DEMO_USER_PASSWORD="AureliaDemo123!"
$env:CORS_ORIGINS="http://localhost:8081,http://localhost:8082,http://localhost:8083,http://localhost:8084,http://localhost:3001,http://localhost:5173"
```

Actualizar seed de permisos:

```bash
pnpm --filter api seed
pnpm --filter api seed:demo
```

Levantar API:

```bash
pnpm --filter api dev
```

Validar health público:

```bash
curl http://localhost:3000/api/health
```

Validar endpoint protegido sin token:

```bash
curl -i http://localhost:3000/api/mobile/bootstrap
```

Resultado esperado:

```txt
401
```

Login inspector:

```bash
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"karen.opazo@goldfields.com","password":"AureliaDemo123!"}'
```

Guardar token inspector en PowerShell:

```bash
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body '{"email":"karen.opazo@goldfields.com","password":"AureliaDemo123!"}'
$token = $login.token
```

Validar mobile con Bearer inspector:

```bash
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/mobile/bootstrap -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/mobile/sync -Headers @{ Authorization = "Bearer $token" }
```

Validar RBAC inspector sin permisos administrativos:

```bash
Invoke-WebRequest -Method Get -Uri http://localhost:3000/api/users -Headers @{ Authorization = "Bearer $token" }
```

Resultado esperado:

```txt
403
```

Login admin y validación de permisos reales:

```bash
$adminLogin = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body '{"email":"carlos.aguirre@goldfields.com","password":"AureliaDemo123!"}'
$adminToken = $adminLogin.token
$adminMe = Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/me -Headers @{ Authorization = "Bearer $adminToken" }
$adminMe.permissions
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/users -Headers @{ Authorization = "Bearer $adminToken" }
```

## Actualización bloque 1 - credenciales reales por usuario

- Se reemplazó la contraseña compartida por validación de hash por usuario en `users.password_hash`.
- `API_LOGIN_PASSWORD` y `DEMO_LOGIN_PASSWORD` dejan de ser el mecanismo principal de autenticación.
- Los usuarios demo usan `AURELIA_DEMO_USER_PASSWORD` para generar y validar `password_hash`.
- Se agregó control de `failed_login_attempts` y bloqueo temporal con `locked_until` tras intentos fallidos.

## Bloque 2: sesiones y refresh tokens

- El login crea una sesión persistida en `user_sessions`.
- El access token incluye `sid` para identificar la sesión activa.
- El refresh token se entrega al cliente una sola vez por emisión.
- En base de datos se guarda solo el hash del refresh token (`session_key_hash`).
- El refresh rota la sesión, revoca la anterior y registra `replaced_by_session_id`.
- El logout revoca la sesión actual asociada al `sid` del access token.
- El logout-all revoca todas las sesiones activas del usuario.
- `API_SESSION_TTL_SECONDS` controla la duración de cada sesión.

Smoke test:

```bash
pnpm --filter api test:smoke
```

Build API:

```bash
pnpm --filter @aurelia/contracts build
pnpm --filter api build
```

## Pendientes obligatorios para producción

1. Reemplazar contraseña compartida por credenciales por usuario o SSO/OIDC.
2. Agregar hash de password si se implementa auth local.
3. Agregar refresh tokens, revocación y rotación.
4. Persistir sesiones/token metadata para revocación.
5. Implementar storage seguro native para token mobile.
6. Definir cifrado de datos sensibles en base de datos.
7. Agregar auditoría de login, sync, evidencias, aprobaciones y cambios de estado.
8. Ampliar tests de seguridad con expiración, token alterado, Bearer malformado y matriz por rol completa.
9. Evaluar rate limit persistente o distribuido para producción.
10. Conectar workflows reales a `workflows:*` cuando existan controladores/servicios expuestos.

## Nivel estimado

```txt
Antes: 4/10 aproximado
Después de esta iteración: 6.5/10 aproximado
Objetivo productivo: 8/10+
```

La API queda con JWT firmado, guard global, rutas públicas explícitas, RBAC declarativo, permisos reales desde base de datos, matriz operacional por rol y smoke test alineado al flujo autenticado. Todavía no queda productiva hasta cerrar credenciales por usuario, refresh/revocación, storage seguro mobile y auditoría.
