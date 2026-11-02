# Project memory

## Product intent & audience

- **Ruta Limpia**: plataforma de control para transporte de carga que conecta operación, evidencias, validación y cobranza.
- Propósito central: convertir cada servicio en un expediente completo, visible y accionable, reduciendo el tiempo entre entrega y cobro.
- Audiencias principales:
  - Dueños y gerentes: visión ejecutiva y métricas para decidir.
  - Operaciones: alta, seguimiento, incidencias y cierre de servicios.
  - Clientes: consulta de estado, evidencias y validación de entrega.
  - Administración/cobranza: expedientes completos y servicios listos para facturar o cobrar.
- El piloto debe demostrar el flujo completo con un cliente, una ruta y aproximadamente 5–20 servicios.

## Brand personality & voice

- Marca operativa, clara, confiable y orientada a resultados.
- Comunicación directa y accionable; priorizar estados, responsables, próximos pasos y tiempos.
- Evitar lenguaje técnico innecesario y pantallas que requieran interpretación.
- Mensaje de referencia: **“De la ruta al cobro, en tiempo real”.**

## Visual design & UX direction

- Identidad visual basada en fondo azul oscuro, blanco, azul brillante y verde para estados positivos.
- Experiencia tipo centro de control: información jerarquizada, estados visibles y acciones principales fáciles de localizar.
- Navegación organizada alrededor de servicios, incidencias, evidencias y cobranza.
- Tableros con servicios agrupados por estado: programados, en ruta, entregados, con incidencia y listos para cobro.
- Cada servicio debe tener una ficha o expediente único con avance, responsable, evidencias, incidencias y próximos pasos.
- Usar filtros por cliente, estado, fecha y responsable para localizar rápidamente servicios.
- Representar el ciclo operativo mediante una línea de avance desde salida hasta entrega, validación y disponibilidad para cobro.
- Priorizar acciones explícitas como **Abrir evidencia** y **Validar entrega**.
- Mostrar avisos y pendientes por rol, incluyendo quién fue notificado y qué acción falta.
- Los indicadores ejecutivos deben enfocarse en decisión: servicios en curso, entregas del día, incidencias, expedientes pendientes, servicios listos para cobrar y monto asociado.
- Mantener datos persistentes para retomar el trabajo desde distintos dispositivos.
- Bloquear o advertir el avance a “listo para cobro” cuando falte información obligatoria.

## Decisions, constraints & rationale

- El producto debe cubrir el flujo integral: alta del servicio, seguimiento, entrega, evidencia, validación y aviso a cobranza.
- El expediente por servicio es la unidad principal de trabajo y trazabilidad.
- Las incidencias deben registrar al menos tipo, hora, impacto, responsable y acción pendiente.
- Las evidencias pueden incluir POD, fotografías, documentos y observaciones.
- La comunicación debe incluir contexto completo del servicio para disminuir llamadas y mensajes manuales.
- Métricas prioritarias:
  - Tiempo entre entrega y disponibilidad para cobro.
  - Porcentaje de expedientes completos.
  - Tiempo de envío de evidencias.
  - Interacciones manuales por servicio.
  - Monto de servicios listos para cobro.
- El piloto debe poder compararse con la operación anterior para evidenciar valor.
- La solución debe quedar preparada para futuras integraciones con GPS, sistemas de transporte, facturación y otras herramientas existentes.
- Crecimiento previsto en tres etapas: piloto operativo, integración con la operación real y escalamiento empresarial.
- La primera versión debe ser demostrable y clara, sin perder de vista la posible operación con datos reales.

## Open questions & assumptions

- No está definido si la primera versión será una demostración con datos de ejemplo o una herramienta operativa desde el inicio.
- Falta priorizar el rol principal de la primera experiencia: dirección, operaciones, cliente o cobranza.
- Aún no se han confirmado cliente, ruta ni formato real de evidencias para el piloto.
- Deben definirse los campos obligatorios que impiden marcar un servicio como listo para cobro.
- Falta establecer los permisos y vistas específicos para cada tipo de usuario.
- Se asume que el flujo de validación de entrega y aviso a cobranza es parte esencial del piloto.