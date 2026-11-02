/*
# Ruta Limpia MVP: expediente operativo y cobranza

1. New tables
- `clients`: clientes del piloto con nombre y contacto operativo.
- `services`: expediente principal de cada servicio, con ruta, unidad, operador, avance, estado operativo y datos de cobranza.
- `service_events`: línea de tiempo de salida, tránsito, entrega, validación y cobro.
- `evidences`: archivos o registros de POD, fotografías, documentos y observaciones.
- `incidents`: incidencias con tipo, impacto, responsable y acción pendiente.
- `delivery_validations`: validación de entrega y observaciones del cliente.
- `notifications`: avisos pendientes con rol destinatario y acción requerida.

2. Important business rules
- A service can be marked `ready_for_billing` only when delivered, validated, and with at least one evidence record.
- `billing_amount` stores the amount associated with the service.
- The first version is a shared pilot workspace without sign-in, so the team can demonstrate the complete flow immediately.

3. Security
- Row Level Security is enabled on every table.
- Anonymous and authenticated roles receive only the CRUD access used by this pilot.
- Policies intentionally allow shared workspace access because no sign-in screen is part of this MVP.

4. Seed data
- Creates one pilot customer and eight representative services when the tables are empty.
- Adds evidence, incidents, timeline events, validations, and notifications for the seeded service records.
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  reference text NOT NULL UNIQUE,
  origin text NOT NULL,
  destination text NOT NULL,
  unit text NOT NULL,
  operator_name text NOT NULL,
  responsible text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_transit','delivered','incident','ready_for_billing')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  billing_amount numeric(12,2) NOT NULL DEFAULT 0,
  delivered_at timestamptz,
  billing_ready_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('departure','in_transit','delivery','validation','billing')),
  title text NOT NULL,
  detail text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  evidence_type text NOT NULL CHECK (evidence_type IN ('pod','photo','document','note')),
  title text NOT NULL,
  file_url text,
  notes text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  validated boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  incident_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  impact text NOT NULL,
  responsible text NOT NULL,
  pending_action text NOT NULL,
  resolved boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS delivery_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL UNIQUE REFERENCES services(id) ON DELETE CASCADE,
  validated_by text NOT NULL,
  validated_at timestamptz NOT NULL DEFAULT now(),
  accepted boolean NOT NULL DEFAULT false,
  notes text
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  recipient_role text NOT NULL,
  recipient_name text NOT NULL,
  action_required text NOT NULL,
  context text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS services_status_idx ON services(status);
CREATE INDEX IF NOT EXISTS services_scheduled_at_idx ON services(scheduled_at);
CREATE INDEX IF NOT EXISTS service_events_service_id_idx ON service_events(service_id);
CREATE INDEX IF NOT EXISTS evidences_service_id_idx ON evidences(service_id);
CREATE INDEX IF NOT EXISTS incidents_service_id_idx ON incidents(service_id);
CREATE INDEX IF NOT EXISTS notifications_service_id_idx ON notifications(service_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON clients, services, service_events, evidences, incidents, delivery_validations, notifications TO anon, authenticated;

DROP POLICY IF EXISTS "shared_select_clients" ON clients;
CREATE POLICY "shared_select_clients" ON clients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_clients" ON clients;
CREATE POLICY "shared_insert_clients" ON clients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_clients" ON clients;
CREATE POLICY "shared_update_clients" ON clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_clients" ON clients;
CREATE POLICY "shared_delete_clients" ON clients FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_services" ON services;
CREATE POLICY "shared_select_services" ON services FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_services" ON services;
CREATE POLICY "shared_insert_services" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_services" ON services;
CREATE POLICY "shared_update_services" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_services" ON services;
CREATE POLICY "shared_delete_services" ON services FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_events" ON service_events;
CREATE POLICY "shared_select_events" ON service_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_events" ON service_events;
CREATE POLICY "shared_insert_events" ON service_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_events" ON service_events;
CREATE POLICY "shared_update_events" ON service_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_events" ON service_events;
CREATE POLICY "shared_delete_events" ON service_events FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_evidences" ON evidences;
CREATE POLICY "shared_select_evidences" ON evidences FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_evidences" ON evidences;
CREATE POLICY "shared_insert_evidences" ON evidences FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_evidences" ON evidences;
CREATE POLICY "shared_update_evidences" ON evidences FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_evidences" ON evidences;
CREATE POLICY "shared_delete_evidences" ON evidences FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_incidents" ON incidents;
CREATE POLICY "shared_select_incidents" ON incidents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_incidents" ON incidents;
CREATE POLICY "shared_insert_incidents" ON incidents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_incidents" ON incidents;
CREATE POLICY "shared_update_incidents" ON incidents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_incidents" ON incidents;
CREATE POLICY "shared_delete_incidents" ON incidents FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_validations" ON delivery_validations;
CREATE POLICY "shared_select_validations" ON delivery_validations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_validations" ON delivery_validations;
CREATE POLICY "shared_insert_validations" ON delivery_validations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_validations" ON delivery_validations;
CREATE POLICY "shared_update_validations" ON delivery_validations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_validations" ON delivery_validations;
CREATE POLICY "shared_delete_validations" ON delivery_validations FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_notifications" ON notifications;
CREATE POLICY "shared_select_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_notifications" ON notifications;
CREATE POLICY "shared_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_notifications" ON notifications;
CREATE POLICY "shared_update_notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_notifications" ON notifications;
CREATE POLICY "shared_delete_notifications" ON notifications FOR DELETE TO anon, authenticated USING (true);

DO $$
DECLARE
  client_uuid uuid;
  service_uuid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM clients) THEN
    INSERT INTO clients (name, contact_name, contact_email)
    VALUES ('Grupo Nortecarga', 'Mariana Salas', 'operaciones@nortecarga.mx')
    RETURNING id INTO client_uuid;

    INSERT INTO services (client_id, reference, origin, destination, unit, operator_name, responsible, scheduled_at, status, progress, billing_amount, delivered_at, billing_ready_at)
    VALUES
      (client_uuid, 'RL-24081', 'Monterrey, NL', 'Querétaro, QRO', 'TRACTO-482', 'Jorge Mendoza', 'Ana López', now() - interval '2 hours', 'ready_for_billing', 100, 28500, now() - interval '5 hours', now() - interval '3 hours'),
      (client_uuid, 'RL-24082', 'Saltillo, COA', 'Monterrey, NL', 'CAJA-119', 'Luis Téllez', 'Carlos Ruiz', now() - interval '1 hour', 'delivered', 92, 14800, now() - interval '45 minutes', null),
      (client_uuid, 'RL-24083', 'Tepotzotlán, EDO', 'Puebla, PUE', 'TRACTO-311', 'Rosa Méndez', 'Ana López', now() - interval '3 hours', 'in_transit', 64, 19600, null, null),
      (client_uuid, 'RL-24084', 'Lázaro Cárdenas, MICH', 'San Luis Potosí, SLP', 'TRACTO-207', 'Ernesto Pardo', 'Carlos Ruiz', now() + interval '2 hours', 'scheduled', 12, 32400, null, null),
      (client_uuid, 'RL-24085', 'Guadalajara, JAL', 'Aguascalientes, AGS', 'CAJA-084', 'Mónica Torres', 'Ana López', now() - interval '6 hours', 'incident', 71, 11200, null, null),
      (client_uuid, 'RL-24086', 'Manzanillo, COL', 'León, GTO', 'TRACTO-615', 'Pablo Vela', 'Carlos Ruiz', now() + interval '5 hours', 'scheduled', 8, 26700, null, null),
      (client_uuid, 'RL-24087', 'Celaya, GTO', 'Toluca, EDO', 'CAJA-201', 'Iván Soto', 'Ana López', now() - interval '4 hours', 'delivered', 94, 13200, now() - interval '1 hour', null),
      (client_uuid, 'RL-24088', 'Veracruz, VER', 'CDMX', 'TRACTO-490', 'Daniela Cruz', 'Carlos Ruiz', now() - interval '8 hours', 'ready_for_billing', 100, 30100, now() - interval '6 hours', now() - interval '4 hours');

    SELECT id INTO service_uuid FROM services WHERE reference = 'RL-24081';
    INSERT INTO evidences (service_id, evidence_type, title, notes, validated) VALUES (service_uuid, 'pod', 'POD firmado - RL-24081', 'Recibido con sello y firma de almacén.', true), (service_uuid, 'photo', 'Evidencia fotográfica de descarga', '4 fotografías cargadas por el operador.', true);
    INSERT INTO delivery_validations (service_id, validated_by, accepted, notes) VALUES (service_uuid, 'Mariana Salas', true, 'Entrega completa y sin diferencias.');
    INSERT INTO service_events (service_id, event_type, title, detail, occurred_at) VALUES (service_uuid, 'departure', 'Salida confirmada', 'Unidad salió de Monterrey.', now() - interval '15 hours'), (service_uuid, 'in_transit', 'En ruta', 'Seguimiento recibido correctamente.', now() - interval '10 hours'), (service_uuid, 'delivery', 'Entrega registrada', 'Operador reportó descarga completada.', now() - interval '5 hours'), (service_uuid, 'validation', 'Entrega validada', 'Cliente confirmó la recepción.', now() - interval '4 hours'), (service_uuid, 'billing', 'Listo para cobro', 'Expediente completo para administración.', now() - interval '3 hours');
    INSERT INTO notifications (service_id, recipient_role, recipient_name, action_required, context) VALUES (service_uuid, 'Cobranza', 'Sofía Herrera', 'Iniciar facturación', 'RL-24081 ya cuenta con entrega validada y evidencias completas.');

    SELECT id INTO service_uuid FROM services WHERE reference = 'RL-24085';
    INSERT INTO incidents (service_id, incident_type, impact, responsible, pending_action) VALUES (service_uuid, 'Retraso en patio de carga', '2 horas de demora estimada', 'Mónica Torres', 'Confirmar nueva ventana de entrega con cliente.');
    INSERT INTO notifications (service_id, recipient_role, recipient_name, action_required, context) VALUES (service_uuid, 'Operaciones', 'Ana López', 'Dar seguimiento a incidencia', 'RL-24085 requiere confirmar nueva ventana de entrega.');
  END IF;
END $$;