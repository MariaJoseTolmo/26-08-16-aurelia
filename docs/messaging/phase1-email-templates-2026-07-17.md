# Mensajería por correo - plantilla de hallazgo asignado

## Objetivo

Proveer una base transversal de mensajería en la API para que inspecciones, SPR, incidentes, controles críticos y workflows puedan renderizar y enviar correos sin duplicar HTML ni acoplar la lógica de negocio al protocolo SMTP.

Esta iteración deja completamente conectada la notificación de **hallazgo asignado** del módulo de inspecciones.

## Diseño de referencia

Figma:

- Desktop: nodo `693:33892`.
- Mobile: nodo `693:33925`.
- Logo: nodo `693:33900`, exportado como SVG y almacenado en el repositorio.

| Elemento | Desktop | Mobile |
| --- | ---: | ---: |
| Contenedor | 650 px | 360 px / 100% |
| Header | 100 px | 70 px |
| Logo | 174 x 57 px | 116 x 38 px |
| Título | 24/29 px | 16/28 px |
| Cuerpo | 16/25.9 px | 14/24 px |
| CTA | 450 x 39 px | 296 x 39 px |
| Footer | 100 px | 78 px |

## Arquitectura

```txt
apps/api/src/modules/messaging/
  assets/aurelia-email-logo.svg
  disabled-email.transport.ts
  email-template.service.ts
  messaging.module.ts
  messaging.service.ts
  messaging.types.ts
  smtp-email.transport.ts

apps/api/src/modules/inspections/
  inspection-assignment-email.service.ts
```

### `EmailTemplateService`

- Renderiza HTML responsive compatible con clientes de correo.
- Genera una alternativa `text/plain`.
- Escapa todos los parámetros visibles.
- Valida URLs de CTA y solo acepta `http` o `https`.
- Expone el template `inspection.finding-assigned`.

### `MessagingService`

- Expone métodos comunes de renderizado y envío.
- Valida destinatarios.
- Delega la entrega al puerto `EmailTransport`.

### `SmtpEmailTransport`

Implementación SMTP real sin acoplar los módulos consumidores al protocolo. Incluye:

- SMTP con STARTTLS para `SMTP_SECURE=false` cuando el servidor lo anuncia;
- TLS implícito para `SMTP_SECURE=true`;
- autenticación `AUTH PLAIN` y `AUTH LOGIN`;
- mensajes MIME `multipart/alternative` con HTML y texto plano;
- codificación UTF-8 de asuntos y nombres;
- múltiples destinatarios `to`, `cc` y `bcc`;
- timeout configurable;
- resultado con destinatarios aceptados y rechazados.

El transporte SMTP queda registrado por defecto mediante `MessagingModule.register()`. `DisabledEmailTransport` permanece disponible para pruebas o ambientes que deseen registrar explícitamente el módulo con `{ disabled: true }`.

## Variables de entorno

```dotenv
WEB_APP_URL=http://localhost:5173

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario-smtp
SMTP_PASS=secreto-smtp
SMTP_FROM=AurelIA <no-reply-aurelia@kabeli.cl>
SMTP_TIMEOUT_MS=15000
```

Reglas:

- `SMTP_HOST` y `SMTP_FROM` son obligatorios al intentar enviar.
- `SMTP_USER` y `SMTP_PASS` deben configurarse juntos. Ambos pueden omitirse si infraestructura permite relay autenticado por red.
- `SMTP_SECURE=false` se usa normalmente con puerto 587 y permite STARTTLS.
- `SMTP_SECURE=true` se usa para TLS implícito, normalmente en puerto 465.
- `WEB_APP_URL` define el dominio del botón del correo. Si se omite, el servicio usa el primer origen web de `CORS_ORIGINS`, priorizando el puerto 5173 en desarrollo.
- En Azure, usuario y contraseña deben venir de secretos o referencias a Key Vault; nunca se versionan valores reales.

## Evento de negocio conectado

El frontend crea primero la inspección y todas sus observaciones. Al finalizar el formulario actualiza la inspección a `IN_PROGRESS`.

La API detecta esa transición una sola vez y después:

1. busca todas las observaciones abiertas de la inspección;
2. obtiene responsables desde `inspection_finding_responsibles` y `owner_user_id`;
3. agrupa las observaciones por usuario;
4. envía un solo correo por usuario con el número de observaciones que tiene asignadas;
5. utiliza la empresa del usuario, la empresa responsable del hallazgo o la empresa de la inspección;
6. genera un enlace hacia la ruta autenticada `/inspections`, con los parámetros usados por el modal de detalle;
7. registra éxito o error en los logs de la API.

No se dispara desde cada creación o edición individual de hallazgo. Esto evita duplicar mensajes cuando el formulario crea varias observaciones o cuando la UI realiza actualizaciones consecutivas.

La creación o actualización de la inspección no se revierte si SMTP falla. El error queda registrado para que una indisponibilidad de correo no bloquee el flujo operacional.

## Parámetros del template

```ts
{
  recipientName,
  companyName,
  inspectionNumber,
  observationCount,
  platformUrl,
}
```

Ejemplo de uso transversal:

```ts
await messaging.sendInspectionFindingAssigned({
  to: [{ email: user.email, name: user.fullName }],
  params: {
    recipientName: user.fullName,
    companyName: company.name,
    inspectionNumber: inspectionReference,
    observationCount: findings.length,
    platformUrl,
  },
});
```

## Pruebas

```powershell
pnpm --filter api test:mail
```

El comando ejecuta:

1. smoke test del template desktop/mobile;
2. servidor SMTP local efímero;
3. autenticación SMTP de prueba;
4. validación de `MAIL FROM`, `RCPT TO` y `DATA`;
5. validación del MIME HTML/texto y `Message-ID`.

No utiliza las credenciales SMTP reales ni envía correo a Internet.

Para una prueba end-to-end real:

1. configurar las variables SMTP en `apps/api/.env`;
2. iniciar API y web;
3. crear una inspección con observaciones;
4. asignar un usuario activo con correo real;
5. finalizar el formulario;
6. comprobar el correo y el log `Inspection assignment email sent`.

## Consideraciones operativas

- El envío actual es inmediato y best effort.
- El servidor debe permitir salida de red hacia el host y puerto SMTP.
- El remitente de `SMTP_FROM` debe estar autorizado por el relay.
- Para reintentos persistentes, trazabilidad de entrega y recuperación tras reinicios se recomienda una siguiente fase con outbox y worker. Esa mejora no es necesaria para que el correo actual se renderice y entregue por SMTP, pero sí para garantías de entrega de nivel transaccional.
- El SVG se incluye como `data:`. Debe probarse en los clientes corporativos objetivo; si Outlook bloquea SVG embebido, el transporte puede evolucionar a una imagen CID sin cambiar el template de dominio.

## Próximas plantillas

- evidencia ejecutada pendiente de aprobación;
- evidencia rechazada;
- observación cerrada;
- SLA próximo a vencer o vencido;
- cierre completo de inspección;
- eventos SPR, incidentes y controles críticos.
