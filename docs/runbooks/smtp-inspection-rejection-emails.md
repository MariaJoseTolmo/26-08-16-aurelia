# Runbook SMTP — correos de observaciones rechazadas

## Objetivo

AurelIA envía un correo transaccional cuando un hallazgo u observación cambia efectivamente al estado `REJECTED`. El rechazo queda confirmado aunque el proveedor SMTP no esté disponible; el envío se registra por separado y se reintenta hasta tres veces.

## Variables de entorno

Configurar en el entorno de la API:

```text
SMTP_HOST=<host del relay o proveedor>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=<referencia a secreto>
SMTP_PASS=<referencia a secreto>
SMTP_FROM=AurelIA <no-reply-aurelia@kabeli.cl>
SMTP_TIMEOUT_MS=15000
WEB_APP_URL=https://<dominio-web-aurelia>
NOTIFICATION_DEEP_LINK_SECRET=<secreto aleatorio dedicado>
NOTIFICATION_DEEP_LINK_MINUTES=1440
```

En producción, el arranque de la API falla si falta `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` o `SMTP_FROM`.

## TLS

Configuración recomendada:

- Puerto `587`: `SMTP_SECURE=false` y `SMTP_REQUIRE_TLS=true`. La conexión comienza como SMTP y debe actualizarse mediante STARTTLS antes de autenticar.
- Puerto `465`: `SMTP_SECURE=true`. La conexión usa TLS implícito desde el inicio.
- Nunca permitir autenticación con usuario y contraseña sobre una conexión sin TLS.

El certificado del servidor se valida con `rejectUnauthorized=true`. No desactivar esa validación en producción.

## Gestión de secretos

`SMTP_USER`, `SMTP_PASS` y `NOTIFICATION_DEEP_LINK_SECRET` deben almacenarse en Azure Key Vault, secretos del pipeline o el gestor de secretos equivalente. No deben guardarse en `.env` versionados, archivos de configuración, tickets ni logs.

Rotación sugerida:

1. Crear la credencial nueva en el proveedor SMTP.
2. Actualizar el secreto en Key Vault.
3. Reiniciar o desplegar la API.
4. Ejecutar la prueba de entrega.
5. Revocar la credencial anterior.

## DNS y reputación de entrega

Antes de habilitar producción, infraestructura debe validar el dominio utilizado por `SMTP_FROM`:

- SPF autorizado para el proveedor o relay.
- DKIM habilitado y validado.
- DMARC publicado inicialmente con monitoreo y luego ajustado según política corporativa.
- Reverse DNS y HELO/EHLO coherentes cuando se opera un relay propio.

El sobre SMTP y el encabezado `From` deben pertenecer a un dominio autorizado por el proveedor.

## Flujo de negocio

1. Un usuario con capacidad de revisión rechaza un hallazgo e ingresa un motivo obligatorio.
2. La base de datos confirma el estado `REJECTED`.
3. La API identifica responsables asignados. Si no existen, busca supervisores activos del área.
4. Se crea una notificación interna con un `eventKey` idempotente.
5. Se genera un deep link firmado y temporal por destinatario.
6. Se renderiza el template `inspection.finding-rejected`.
7. Se envía por SMTP y se registra el estado de entrega.

Una edición posterior del mismo hallazgo rechazado no vuelve a enviar el correo. Un nuevo ciclo de corrección y rechazo sí genera un evento nuevo porque cambia `rejectedAt`.

## Trazabilidad

La tabla de entregas de notificaciones registra:

- canal `email`;
- destino;
- estado `PENDING`, `SENT`, `RETRYING`, `FAILED` o `BOUNCED`;
- contador de intentos;
- `messageId` del proveedor cuando existe;
- identificadores de inspección, hallazgo, destinatario y template.

No registrar el cuerpo completo del correo, el motivo de rechazo ni credenciales SMTP en logs operativos.

## Pruebas

Ejecutar desde la raíz del monorepo:

```bash
pnpm --filter api test:mail
pnpm --filter api build
```

El conjunto `test:mail` valida:

- template existente de asignación;
- template de observación rechazada y escape HTML;
- envío e idempotencia del servicio de rechazo;
- configuración SMTP de desarrollo y producción;
- transporte SMTP y exigencia de STARTTLS;
- integración de asignaciones móviles existente.

Para una prueba real de entrega, usar una cuenta de QA y comprobar:

- recepción en bandeja de entrada;
- asunto y remitente correctos;
- visualización en Outlook y cliente móvil;
- botón `Ejecutar observación` dirigido al login o hallazgo correspondiente;
- expiración del enlace según `NOTIFICATION_DEEP_LINK_MINUTES`;
- registro `SENT` con `messageId`.

## Diagnóstico

### La API no inicia

Revisar el mensaje de validación de variables. En producción no se permiten placeholders ni configuración parcial.

### El servidor no anuncia STARTTLS

Confirmar puerto y política del proveedor. En puerto 587, AurelIA aborta si `SMTP_REQUIRE_TLS=true` y STARTTLS no está disponible.

### Autenticación rechazada

Validar credencial, permisos de relay, remitente autorizado y posible requisito de contraseña de aplicación. Rotar el secreto si existe sospecha de exposición.

### Todos los destinatarios son rechazados

Revisar políticas del relay, dominio permitido, restricciones de destinatario y reputación DNS. El rechazo de todos los `RCPT TO` impide enviar el cuerpo.

### El rechazo se guardó pero no llegó correo

Es el comportamiento esperado ante una falla externa: el flujo de negocio no se revierte. Revisar la entrega asociada a la notificación y el último error sanitizado.

## Rollback

Para deshabilitar temporalmente el correo sin revertir datos:

1. retirar o invalidar la configuración SMTP en un entorno no productivo; o
2. desplegar una versión que registre `MessagingModule` con transporte deshabilitado.

En producción, retirar variables provoca fallo de arranque deliberado. Para un rollback productivo, desplegar la versión anterior de la API y conservar las tablas de notificaciones y entregas; no requieren migración inversa para este cambio.
