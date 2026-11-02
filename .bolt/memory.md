# Project memory

## Product intent & audience

- **Ruta Limpia** es una plataforma de control para transporte de carga que conecta operación, evidencias, validación y cobranza.
- Su propósito es convertir cada servicio en un expediente completo, visible y accionable, reduciendo el tiempo entre entrega y cobro.
- Audiencias principales:
  - Dirección y gerencia: métricas y visión operativa.
  - Operaciones: alta, seguimiento, incidencias y cierre.
  - Clientes: estado, evidencias y validación de entrega.
  - Administración/cobranza: expedientes completos y servicios listos para cobrar.
- La primera versión implementada funciona como centro de control operativo con datos piloto persistentes.

## Brand personality & voice

- Marca operativa, clara, confiable y orientada a resultados.
- Comunicación directa y accionable, con énfasis en estados, responsables, pendientes y próximos pasos.
- Evitar lenguaje técnico innecesario y pantallas que requieran interpretación.
- Mensaje de referencia: **“De la ruta al cobro, en tiempo real”.**

## Visual design & UX direction

- Identidad visual basada en azul oscuro, blanco, azul brillante y verde para estados positivos.
- Experiencia tipo centro de control, con jerarquía visual clara, estados visibles y acciones principales localizables.
- Interfaz responsive para distintos tamaños de pantalla.
- Tablero operativo con servicios agrupados por estado y métricas de servicios en curso, entregas, incidencias y monto listo para cobrar.
- Búsqueda y filtros por estado, ruta, unidad y responsable.
- El expediente de servicio concentra avance, evidencias, incidencias y línea de tiempo.
- Acciones explícitas como abrir evidencias y validar entrega.
- Validación de entrega con bloqueo cuando faltan evidencias.
- Vistas diferenciadas para operación, cobranza e incidencias:
  - Cobranza: expedientes listos y monto acumulado.
  - Incidencias: responsables e instrucciones pendientes.
- Preferir información persistente y retomable, evitando flujos que dependan únicamente del estado local del navegador.

## Decisions, constraints & rationale

- El expediente por servicio es la unidad principal de trabajo y trazabilidad.
- La primera implementación cubre el flujo de seguimiento, entrega, evidencias, validación e identificación de servicios listos para cobranza.
- Los datos piloto están conectados a Supabase y son persistentes.
- El entorno actual es una aplicación React construida con Vite.
- El piloto actual contiene ocho servicios de ejemplo.
- La aplicación compila correctamente después de corregir un error de sintaxis en la vista lateral del expediente.
- La primera versión prioriza una demostración operativa clara y accionable antes de incorporar capacidades de operación real más avanzadas.
- Próximas capacidades previstas: carga real de archivos, creación de servicios e inicio de sesión con roles.
- La solución debe conservar una arquitectura preparada para sustituir o ampliar los datos piloto con operación real e integraciones futuras.

## Open questions & assumptions

- Aún no está definido si la transición inmediata será hacia una herramienta operativa real o una demostración ampliada.
- Falta confirmar el modelo de autenticación, roles y permisos por vista.
- Falta implementar y definir el flujo completo de creación de servicios.
- Falta implementar carga, almacenamiento y visualización de archivos reales de evidencia.
- Deben definirse los campos obligatorios exactos que bloquean la validación y el paso a cobranza.
- No se han confirmado cliente, ruta, formatos de evidencia ni reglas reales del piloto.
- Se asume que los ocho servicios actuales son datos demostrativos persistidos en Supabase y no información operativa definitiva.