# Web Inspections - Roadmap de hardening de lógica y procesos

Fecha: 2026-07-23
Ámbito: apps/web + apps/api + packages/contracts
Estado: planificado para ejecución por agente técnico

## 1) Contexto y objetivo

Este roadmap cubre los faltantes de lógica, seguridad de permisos y workflows operativos del módulo de inspecciones web.

Queda explícitamente fuera del alcance principal de este documento:

- Diseño visual y refinamientos de interfaz (se derivan al equipo UI).

Sí incluye cuando corresponde:

- Señales mínimas de estado en UI necesarias para que el proceso lógico funcione de punta a punta.

Objetivo:

- Llevar el flujo web a cumplimiento funcional por perfil (Inspector, Proveedor/EECC, Admin HSE, Superadmin) con reglas de acceso y trazabilidad auditables.

## 2) Hallazgos a cerrar (resumen)

1. RBAC parcial en frontend (algunos bloqueos por parche de UI, no por capacidad integral).
2. Falta de implementación operativa del perfil Superadmin.
3. Faltan workflows de negocio de proveedor: prórroga, disputa, enlace expirado, rebote de correo, recordatorios escalonados.
4. Restricción de visibilidad por perfil no está plenamente garantizada a nivel funcional.
5. Faltan piezas de IA operativa y reglas de pre-validación/duplicados en flujo de cierre.

## 3) Principios de implementación

1. Seguridad primero: permisos validados en API; frontend solo refleja capacidades.
2. Sin bypass por DOM/bridges para autorización.
3. Contratos compartidos como única fuente de verdad para estados y transiciones.
4. Trazabilidad completa: cada transición relevante debe registrar actor, fecha y motivo.
5. Entregas verticales: cada fase debe quedar deployable y testeable.

## 4) Fases de ejecución

## Fase 0 - Baseline y congelamiento controlado

Objetivo:

- Definir baseline técnico y de pruebas antes de cambios de comportamiento.

Tareas:

1. Levantar inventario de permisos y roles usados en inspecciones (web + api + contracts).
2. Mapear transiciones actuales de estado de hallazgo e inspección.
3. Documentar feature flags o toggles existentes (si aplica).
4. Definir matriz de trazabilidad por endpoint crítico.

Entregables:

- Documento de baseline en docs/inspections con tabla de endpoints, permisos y transiciones.

Criterios de aceptación:

- Existe una matriz única aprobada para usar en las siguientes fases.

---

## Fase 1 - RBAC real por capacidad (backend-first)

Objetivo:

- Eliminar dependencia de bloqueos visuales para autorización.

Tareas API:

1. Definir capacidades explícitas para inspecciones:
	- inspections.read
	- inspections.create
	- inspections.execute
	- inspections.review
	- inspections.reassign
	- inspections.admin
2. Aplicar guards/policies en endpoints:
	- listado gestión/historial
	- detalle
	- ejecutar
	- aprobar/rechazar
	- reasignar SLA/responsables
	- exportaciones
3. Aplicar filtros por alcance en consultas (scope por empresa/área/usuario según rol).

Tareas Web:

1. Consumir capacidades de sesión de forma centralizada.
2. Mostrar/ocultar acciones según capability, no por role hardcodeado.
3. Reemplazar lógica de bloqueo frágil por control declarativo.

Entregables:

- Políticas de acceso en API y consumo consistente en web.
- Tests de autorización por endpoint y por perfil.

Criterios de aceptación:

1. Un usuario sin capacidad no puede ejecutar acción aunque manipule UI.
2. Los listados solo devuelven registros dentro de su alcance permitido.
3. Se eliminan dependencias de confirmaciones o bridges para simular permisos.

---

## Fase 2 - Workflow de proveedor/EECC completo

Objetivo:

- Completar el ciclo operativo esperado para proveedor.

Tareas:

1. Implementar solicitud de prórroga:
	- estado intermedio
	- motivo obligatorio
	- aprobación/rechazo por Admin HSE
	- auditoría
2. Implementar disputa de hallazgo:
	- estado disputado
	- motivo
	- resolución (reasignar o ratificar)
3. Implementar reenvío de evidencia tras rechazo:
	- mantener historial de iteraciones
4. Definir claramente los eventos de notificación por cada transición.

Entregables:

- Endpoints y contratos para prórroga/disputa.
- Flujo de estados consistente en detalle y notificaciones.

Criterios de aceptación:

1. Proveedor puede solicitar prórroga con motivo y ver su estado.
2. Admin puede aprobar/rechazar prórroga con trazabilidad.
3. Disputa cambia estado y exige resolución explícita.
4. Rechazo de evidencia permite nuevo envío sin perder historial.

---

## Fase 3 - SLA y automatizaciones de proceso

Objetivo:

- Formalizar vencimientos y recordatorios escalonados.

Tareas:

1. Definir política configurable por severidad:
	- primer recordatorio
	- segundo recordatorio
	- escalamiento
2. Implementar job/proceso programado para vencimientos.
3. Persistir eventos de recordatorio/escalamiento.
4. Exponer estado de SLA en dashboard y detalle con fuente de verdad de backend.

Entregables:

- Motor de SLA y recordatorios funcional.
- Métricas básicas de cumplimiento de SLA.

Criterios de aceptación:

1. Hallazgos vencidos generan eventos en los tiempos definidos.
2. El flujo de alertas queda trazado y consultable.
3. La UI muestra estado consistente con backend.

---

## Fase 4 - Notificaciones robustas y deep links confiables

Objetivo:

- Hacer que el canal de notificación sea confiable y auditable.

Tareas:

1. Manejo de enlaces temporales:
	- token firmado
	- expiración configurable
	- fallback a login
2. Registrar fallos de entrega (ej. rebote de correo) y exponerlos a Admin/Superadmin.
3. Reintento controlado de notificaciones fallidas.
4. Trazabilidad por hilo de inspección/hallazgo.

Entregables:

- Esquema de token de enlace y validación.
- Registro de entrega/fallo por notificación.

Criterios de aceptación:

1. Enlace expirado no rompe flujo y redirige correctamente.
2. Fallo de envío queda visible para gestión.
3. Deep link abre el contexto exacto cuando el token es válido.

---

## Fase 5 - Superadmin operativo (mínimo viable)

Objetivo:

- Habilitar operación real del perfil Superadmin más allá de un placeholder.

Tareas:

1. Módulo de administración funcional mínimo:
	- usuarios/roles
	- catálogos críticos de inspecciones
	- parámetros SLA
2. Gestión de integraciones básicas:
	- estado de notificaciones
	- credenciales no sensibles por referencia/config
3. Auditoría consultable:
	- cambios de SLA
	- cambios de rol/permisos
	- acciones críticas sobre hallazgos

Entregables:

- Vistas y endpoints mínimos de superadmin.

Criterios de aceptación:

1. Superadmin puede administrar configuración crítica sin tocar BD manualmente.
2. Toda acción crítica deja rastro auditable.

---

## Fase 6 - IA operativa y reglas de apoyo al cierre

Objetivo:

- Pasar de soporte visual a lógica útil de IA en operación.

Tareas:

1. Pre-validación opcional antes/después con resultado explicable.
2. Detección de potencial duplicado con score de confianza.
3. Registro de decisión humana vs sugerencia IA (override explícito).

Entregables:

- Endpoints/servicios de sugerencia y registro de override.

Criterios de aceptación:

1. La recomendación IA nunca sustituye autorización humana.
2. Cada override queda trazado con usuario, fecha y motivo.

## 5) Backlog técnico detallado por frente

## Backend

1. Politicas RBAC por endpoint en inspecciones.
2. Extensión de estado para prórroga/disputa (si no existe).
3. Jobs SLA con scheduler y tabla de eventos.
4. Notificaciones con tracking de entrega/fallo.
5. Auditoría transversal de acciones críticas.

## Frontend web

1. Capa única de capabilities para inspecciones.
2. Guardas de acciones en componentes críticos.
3. Flujos operativos para prórroga/disputa/reenvío.
4. Estado de notificaciones y enlaces expirados.
5. Pantallas mínimas de Superadmin funcional.

## Contratos compartidos

1. DTOs y enums para nuevos estados y eventos.
2. Contratos de notificaciones (delivery status, reason).
3. Contratos de auditoría para consumo en web.

## 6) Plan de pruebas obligatorio

## Pruebas de autorización

1. Por endpoint y por capability.
2. Casos de intento sin permiso.
3. Casos de scope cruzado entre empresas/áreas.

## Pruebas de workflow

1. Happy path proveedor: ejecutar, enviar evidencia, validación admin.
2. Prórroga: solicitud, aprobación/rechazo, efectos en dueAt.
3. Disputa: apertura, resolución, notificaciones.
4. Vencimiento SLA: primer/segundo recordatorio y escalamiento.

## Pruebas de notificaciones

1. Deep link válido.
2. Enlace expirado.
3. Rebote/fallo de entrega y reintento.

## Pruebas de regresión

1. Creación de inspección hallazgo/checklist.
2. Detalle y export PDF.
3. Historial y KPIs.

## 7) Secuencia recomendada para el agente ejecutor

1. Fase 0 + Fase 1 en primer bloque (seguridad base).
2. Fase 2 + Fase 3 en segundo bloque (workflow y SLA).
3. Fase 4 en tercer bloque (notificaciones confiables).
4. Fase 5 + Fase 6 en cuarto bloque (superadmin e IA operativa).

Cada bloque debe cerrar con:

1. Contratos actualizados.
2. Tests verdes.
3. Nota de release en docs/inspections con cambios, riesgos y rollback.

## 8) Riesgos y mitigaciones

1. Riesgo: romper flujos actuales por cambios de autorización.
	Mitigación: introducir capabilities con rollout controlado y tests por endpoint.
2. Riesgo: complejidad de estados nuevos.
	Mitigación: máquina de estados explícita y validaciones centralizadas.
3. Riesgo: inconsistencia entre web y api.
	Mitigación: contracts-first y build de contracts como gate obligatorio.

## 9) Definición de terminado (DoD)

Se considera completado cuando:

1. Los perfiles operan con permisos correctos sin bypass de UI.
2. Los workflows de proveedor y admin cubren prórroga/disputa/rechazo/reenvío/cierre.
3. SLA y notificaciones funcionan con trazabilidad completa.
4. Superadmin mínimo está operativo para administración crítica.
5. Existe evidencia de pruebas automáticas y validación manual de los escenarios clave.
