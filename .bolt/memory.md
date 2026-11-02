# Project memory

## Product intent & audience

- **Ruta Limpia** es una plataforma de control para transporte de carga que conecta operación, evidencias, validación y cobranza.
- Su propósito es convertir cada servicio en un expediente completo, visible y accionable, reduciendo el tiempo entre entrega y cobro.
- Audiencias principales:
  - Dirección y gerencia: métricas y visión operativa.
  - Operaciones: alta, seguimiento, incidencias y cierre.
  - Clientes: estado, evidencias y validación de entrega.
  - Administración/cobranza: expedientes completos y servicios listos para cobrar.
- La primera versión funciona como centro de control operativo con datos piloto persistentes.

## Brand personality & voice

- Marca operativa, clara, confiable y orientada a resultados.
- Comunicación directa y accionable, con énfasis en estados, responsables, pendientes y próximos pasos.
- Evitar lenguaje técnico innecesario y pantallas que requieran interpretación.
- Mensaje de referencia: **“De la ruta al cobro, en tiempo real”.**

## Visual design & UX direction

- UI minimalista, con jerarquía visual clara, navegación simple y acciones principales fáciles de localizar.
- Identidad visual basada en azul oscuro, blanco, azul brillante y verde para estados positivos.
- Experiencia tipo centro de control, con estados visibles y agrupación operativa por servicio.
- Interfaz responsive para distintos tamaños de pantalla; los paneles y vistas laterales deben comportarse correctamente en móvil.
- Tablero con servicios agrupados por estado y métricas de servicios en curso, entregas, incidencias y monto listo para cobrar.
- Búsqueda y filtros por estado, ruta, unidad y responsable, con etiquetas y textos directos y consistentes.
- El expediente de servicio concentra avance, evidencias, incidencias y línea de tiempo.
- La carga de evidencias prioriza archivos reales sobre captura manual de texto o URLs. Soporta JPG, PNG, WebP y PDF, con límite de 10 MB por archivo.
- Mostrar evidencias vinculadas al servicio mediante enlaces temporales y mantener acciones explícitas como abrir evidencias y validar entrega.
- La validación de entrega permanece bloqueada cuando el expediente no tiene evidencias.
- Priorizar información persistente y retomable, evitando flujos que dependan únicamente del estado local del navegador.
- Accesibilidad integrada: foco visible para teclado, enlace para saltar al contenido, etiquetas claras en controles y mensajes de error anunciables.
- Respetar la preferencia del usuario por reducir movimiento; evitar animaciones innecesarias.

## Decisions, constraints & rationale

- El expediente por servicio es la unidad principal de trabajo y trazabilidad.
- La primera implementación cubre seguimiento, entrega, evidencias, validación e identificación de servicios listos para cobranza.
- Los datos piloto están conectados a Supabase y son persistentes.
- El entorno actual es una aplicación React construida con Vite.
- El piloto actual contiene ocho servicios de ejemplo.
- Las evidencias reales se almacenan de forma privada en Supabase Storage y quedan asociadas automáticamente al servicio correspondiente.
- El acceso a cada archivo se resuelve mediante una URL temporal, en lugar de exponer almacenamiento público.
- Se eliminó la dependencia de pegar textos o URLs manualmente para registrar evidencias.
- La interfaz fue simplificada sin alterar los flujos de servicios, evidencias, incidencias, validación y cobranza.
- Se aplicaron mejoras de navegación, accesibilidad, mensajes de error, comportamiento responsive y reducción de movimiento.
- La aplicación compila correctamente después de los ajustes recientes.
- La primera versión prioriza una demostración operativa clara y accionable antes de incorporar capacidades avanzadas de operación real.
- Próximas capacidades previstas: creación de servicios e inicio de sesión con roles.
- La solución debe conservar una arquitectura preparada para sustituir o ampliar los datos piloto con operación real e integraciones futuras.

## Open questions & assumptions

- Aún no está definido si la transición inmediata será hacia una herramienta operativa real o una demostración ampliada.
- Falta confirmar el modelo de autenticación, roles y permisos por vista.
- Falta implementar y definir el flujo completo de creación de servicios.
- Deben definirse los campos obligatorios exactos que bloquean la validación y el paso a cobranza.
- No se han confirmado cliente, ruta, formatos de evidencia ni reglas reales del piloto.
- Se asume que los ocho servicios actuales son datos demostrativos persistidos en Supabase y no información operativa definitiva.
- El flujo de carga de archivos quedó integrado, pero todavía requiere validación visual e interactiva en navegador dentro del entorno disponible.