-- Tabla: Llamadas SDR - +Pacientes
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

CREATE TABLE IF NOT EXISTS "Llamadas SDR - +Pacientes" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "Mes" text,
  "Fecha" timestamptz,
  "Location ID" text,
  "Location Name" text,
  "Nombre" text,
  "Contact ID" text,
  "Dirección de la Llamada" text,
  "Tipo de Llamada" text,
  "Call Duration (s)" integer,
  "Fecha de Creación del Contacto" timestamptz,
  "Fecha del Primer Contacto" timestamptz,
  "Speed to Lead (min)" numeric,
  "User ID" text,
  "User Name" text,
  "Contact URL" text,
  "Agendó Demo En La Llamada" boolean,
  "Grabación" text,
  "Transcripción" text,
  "Resumen" text,
  "Fecha de la Demo" timestamptz,
  "Evento" text,
  "Campaign ID" text,
  "Ad Set ID" text,
  "Ad ID" text,
  created_at timestamptz DEFAULT now()
);

-- Índices útiles para filtros y reportes
CREATE INDEX IF NOT EXISTS idx_llamadas_sdr_fecha ON "Llamadas SDR - +Pacientes" ("Fecha");
CREATE INDEX IF NOT EXISTS idx_llamadas_sdr_contact_id ON "Llamadas SDR - +Pacientes" ("Contact ID");
CREATE INDEX IF NOT EXISTS idx_llamadas_sdr_user_id ON "Llamadas SDR - +Pacientes" ("User ID");
CREATE INDEX IF NOT EXISTS idx_llamadas_sdr_mes ON "Llamadas SDR - +Pacientes" ("Mes");

-- Opcional: habilitar RLS (Row Level Security) si quieres políticas por usuario
-- ALTER TABLE "Llamadas SDR - +Pacientes" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE "Llamadas SDR - +Pacientes" IS 'Registro de llamadas SDR para +Pacientes';
