-- Aurelia - PostgreSQL DDL addendum for inspection finding risk catalogs
-- This block complements docs/database/04-ddl-postgres-draft.sql.

CREATE TABLE IF NOT EXISTS inspection_risk_probabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  score INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (score BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS inspection_risk_consequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  score INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (score BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_inspection_risk_probabilities_active_sort ON inspection_risk_probabilities (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_inspection_risk_consequences_active_sort ON inspection_risk_consequences (is_active, sort_order);

INSERT INTO inspection_risk_probabilities (code, name, description, score, sort_order, is_active) VALUES
  ('MUY_IMPROBABLE', 'Muy improbable', 'Ocurrencia excepcional o altamente improbable.', 1, 1, TRUE),
  ('IMPROBABLE', 'Improbable', 'Podría ocurrir, pero no se espera en condiciones normales.', 2, 2, TRUE),
  ('POSIBLE', 'Posible', 'Puede ocurrir bajo condiciones operacionales habituales.', 3, 3, TRUE),
  ('PROBABLE', 'Probable', 'Es esperable que ocurra si no se corrige la condición.', 4, 4, TRUE),
  ('CASI_SEGURO', 'Casi seguro', 'Alta frecuencia esperada o condición recurrente.', 5, 5, TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  score = EXCLUDED.score,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO inspection_risk_consequences (code, name, description, score, sort_order, is_active) VALUES
  ('INSIGNIFICANTE', 'Insignificante', 'Impacto ambiental menor o sin afectación relevante.', 1, 1, TRUE),
  ('MENOR', 'Menor', 'Impacto acotado, reversible y controlable en terreno.', 2, 2, TRUE),
  ('MODERADO', 'Moderado', 'Impacto ambiental moderado que requiere gestión y seguimiento.', 3, 3, TRUE),
  ('MAYOR', 'Mayor', 'Impacto relevante con potencial afectación operacional o regulatoria.', 4, 4, TRUE),
  ('CATASTROFICO', 'Catastrófico', 'Impacto severo o crítico con alta exposición ambiental/regulatoria.', 5, 5, TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  score = EXCLUDED.score,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = NOW();
