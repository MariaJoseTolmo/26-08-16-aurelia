# Metodología propuesta para informe formal de seguridad aplicada

## Documento recomendado

El documento recomendado para entregar a gerencia, PMO y cliente es:

```txt
Informe Técnico de Seguridad Aplicativa y Controles Implementados
```

El informe debe estar basado principalmente en:

```txt
OWASP Application Security Verification Standard ASVS 5.0.0 - Nivel 1
```

Complementado con:

```txt
NIST SP 800-218 Secure Software Development Framework SSDF 1.1
OWASP SAMM 2.0.3 como referencia de madurez de proceso
```

## Por qué OWASP ASVS

OWASP ASVS es adecuado porque permite verificar controles técnicos de seguridad en aplicaciones web y APIs. Es más preciso para este caso que OWASP Top 10, porque no se limita a riesgos generales: permite declarar controles implementados, parcialmente implementados, no aplicables y pendientes.

Para el estado actual de AurelIA, el alcance recomendado es:

```txt
ASVS Nivel 1
```

Nivel 1 es apropiado para una primera entrega técnica de una aplicación en construcción o preproducción. No corresponde declarar cumplimiento Nivel 2 o Nivel 3 sin pruebas formales adicionales, revisión independiente, gestión de secretos productivos, hardening de infraestructura y pentest.

## Forma del entregable

El entregable debería tener dos piezas:

```txt
1. Informe ejecutivo-técnico
2. Matriz de controles de seguridad
```

El informe explica el nivel de seguridad alcanzado, la arquitectura de protección y los controles relevantes.

La matriz permite auditar cada control con evidencia técnica concreta: código, commit, endpoint, prueba smoke, decisión de diseño o pendiente.

## Alcance técnico sugerido

El informe debe cubrir:

```txt
Autenticación
Gestión de sesiones
Autorización por permisos
Autorización por alcance de recurso
Auditoría de eventos críticos
Rate limiting
Sanitización de errores
Trazabilidad con requestId
Validación de entrada
Protección de respuestas sensibles
Separación dev/prod para mecanismos de seguridad
Pruebas smoke de seguridad
Riesgos pendientes y próximos pasos
```

## Declaración recomendada

No declarar:

```txt
La aplicación es segura
La aplicación cumple OWASP completo
La aplicación fue certificada
La aplicación fue pentesteada
```

Declarar:

```txt
La aplicación incorpora una primera línea de controles de seguridad aplicativa alineados a OWASP ASVS Nivel 1, con evidencia técnica trazable en repositorio y pruebas smoke automatizadas para autenticación, autorización, auditoría, rate limit, sanitización de errores y control de alcance por recurso.
```

## Estructura propuesta del informe

```txt
1. Resumen ejecutivo
2. Alcance del informe
3. Metodología utilizada
4. Arquitectura de seguridad implementada
5. Controles implementados
6. Evidencias técnicas
7. Resultado de pruebas smoke
8. Mapa OWASP ASVS Nivel 1
9. Riesgos residuales
10. Recomendaciones para QA/producción
11. Anexos técnicos
```

## Estado actual estimado

```txt
Nivel: Base robusta para desarrollo / pre-QA
Declaración técnica: controles aplicativos críticos implementados y validados por smoke tests
No equivale a: certificación, auditoría externa o pentest
```

## Próximo documento a construir

El siguiente documento formal debería ser:

```txt
docs/security/informe-seguridad-aplicativa-aurelia.md
```

Y luego, si se requiere entregable formal externo:

```txt
Informe de Seguridad Aplicativa AurelIA - OWASP ASVS L1.pdf
```
