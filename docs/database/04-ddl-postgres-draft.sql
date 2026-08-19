-- Aurelia - PostgreSQL DDL Draft v0.2
-- Strategy: strict foreign keys for core domain relationships and controlled polymorphic links for transversal records.
-- Target: PostgreSQL 16+
-- Notes:
-- 1. This is a draft for validation before TypeORM entities and migrations.
-- 2. Tables that represent core business relationships use strict FKs.
-- 3. Transversal tables such as evidences, comments, audit_logs and workflow_instances use entity_type + entity_id.
-- 4. TypeORM entities should be generated after validating naming, cardinalities and required fields with stakeholders.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE app_environment AS ENUM ('local', 'dev', 'qa', 'prod');
CREATE TYPE record_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE validation_status AS ENUM ('draft', 'pending_review', 'returned', 'validated', 'approved', 'rejected', 'closed', 'cancelled');
CREATE TYPE inspection_global_status AS ENUM ('open', 'in_progress', 'closed', 'cancelled');
CREATE TYPE inspection_type AS ENUM ('checklist', 'finding');
CREATE TYPE checklist_answer_value AS ENUM ('complies', 'does_not_comply', 'partially_complies', 'not_applicable');
CREATE TYPE finding_risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('notified', 'flash_report_pending', 'under_validation', 'validated', 'under_investigation', 'action_plan_open', 'closed', 'cancelled');
CREATE TYPE incident_level_code AS ENUM ('level_0', 'level_1', 'level_2', 'level_3', 'level_4', 'level_5');
CREATE TYPE incident_investigation_type AS ENUM ('five_why', 'icam');
CREATE TYPE workflow_instance_status AS ENUM ('running', 'completed', 'cancelled');
CREATE TYPE workflow_step_status AS ENUM ('pending', 'in_progress', 'approved', 'returned', 'rejected', 'skipped');
CREATE TYPE notification_channel AS ENUM ('email', 'system', 'sms', 'whatsapp');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
CREATE TYPE evidence_status AS ENUM ('uploaded', 'pending_validation', 'validated', 'rejected');
CREATE TYPE file_storage_provider AS ENUM ('azure_blob', 'local', 'external_url');
CREATE TYPE spr_record_status AS ENUM ('draft', 'submitted', 'approved_by_responsible', 'approved_by_manager', 'final');
CREATE TYPE spr_approval_status AS ENUM ('pending', 'approved', 'rejected', 'returned');
CREATE TYPE emission_source_status AS ENUM ('active', 'inactive', 'decommissioned');

-- =========================================================
-- COMMON FUNCTIONS
-- =========================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- CORE ORGANIZATIONAL MODEL
-- =========================================================

CREATE TABLE business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gerencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES business_units(id),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gerencia_id UUID REFERENCES gerencias(id),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES areas(id),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES sectors(id),
  code VARCHAR(50),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  altitude_m NUMERIC(10, 2),
  macrozone VARCHAR(100),
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sector_id, name)
);

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(250) NOT NULL,
  tax_id VARCHAR(50),
  is_contractor BOOLEAN NOT NULL DEFAULT TRUE,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- USERS, ROLES AND PERMISSIONS
-- =========================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  position VARCHAR(160),
  phone VARCHAR(50),
  company_id UUID REFERENCES companies(id),
  area_id UUID REFERENCES areas(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_area_assignments (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, area_id)
);

CREATE TABLE user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, company_id)
);

CREATE TABLE user_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, area_id)
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_key_hash VARCHAR(128) NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address VARCHAR(64),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  replaced_by_session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- CONTROLLED POLYMORPHIC REFERENCES
-- =========================================================

CREATE TABLE entity_reference_types (
  code VARCHAR(80) PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO entity_reference_types (code, description) VALUES
  ('mue', 'Major unwanted event'),
  ('critical_control', 'Critical control'),
  ('control_assessment', 'Critical control self assessment'),
  ('control_assessment_answer', 'Critical control assessment answer'),
  ('inspection', 'Inspection header'),
  ('inspection_finding', 'Inspection finding or observation'),
  ('inspection_followup', 'Inspection follow-up'),
  ('incident', 'Environmental incident'),
  ('incident_flash_report', 'Incident flash report'),
  ('incident_investigation', 'Incident investigation'),
  ('incident_action_plan', 'Incident action plan'),
  ('spr_record', 'SPR monthly record'),
  ('emission_source', 'Fixed emission source'),
  ('emission_activity_level', 'Monthly emission activity level')
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- FILES AND EVIDENCES
-- =========================================================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_provider file_storage_provider NOT NULL DEFAULT 'azure_blob',
  container_name VARCHAR(160),
  blob_path TEXT,
  external_url TEXT,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120),
  size_bytes BIGINT,
  checksum_sha256 VARCHAR(128),
  uploaded_by_user_id UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id),
  title VARCHAR(250),
  description TEXT,
  evidence_type VARCHAR(80),
  status evidence_status NOT NULL DEFAULT 'uploaded',
  captured_at TIMESTAMPTZ,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_by_user_id UUID REFERENCES users(id),
  validated_by_user_id UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
  entity_type VARCHAR(80) NOT NULL REFERENCES entity_reference_types(code),
  entity_id UUID NOT NULL,
  relation_type VARCHAR(80) NOT NULL DEFAULT 'supporting_evidence',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (evidence_id, entity_type, entity_id, relation_type)
);

-- =========================================================
-- COMMENTS, AUDIT AND NOTIFICATIONS
-- =========================================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(80) NOT NULL REFERENCES entity_reference_types(code),
  entity_id UUID NOT NULL,
  author_user_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(80) REFERENCES entity_reference_types(code),
  entity_id UUID,
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(80) REFERENCES entity_reference_types(code),
  entity_id UUID,
  channel notification_channel NOT NULL DEFAULT 'email',
  status notification_status NOT NULL DEFAULT 'pending',
  subject VARCHAR(250),
  body TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  email CITEXT,
  name VARCHAR(200),
  recipient_type VARCHAR(50) NOT NULL DEFAULT 'to',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- =========================================================
-- WORKFLOW
-- =========================================================

CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  entity_type VARCHAR(80) NOT NULL REFERENCES entity_reference_types(code),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_definition_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  required_role_id UUID REFERENCES roles(id),
  sla_hours INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workflow_definition_id, step_order),
  UNIQUE (workflow_definition_id, code)
);

CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id UUID REFERENCES workflow_definitions(id),
  entity_type VARCHAR(80) NOT NULL REFERENCES entity_reference_types(code),
  entity_id UUID NOT NULL,
  status workflow_instance_status NOT NULL DEFAULT 'running',
  started_by_user_id UUID REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_instance_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  workflow_definition_step_id UUID REFERENCES workflow_definition_steps(id),
  step_order INTEGER NOT NULL,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  status workflow_step_status NOT NULL DEFAULT 'pending',
  assigned_to_user_id UUID REFERENCES users(id),
  assigned_role_id UUID REFERENCES roles(id),
  due_at TIMESTAMPTZ,
  completed_by_user_id UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- MUE AND CRITICAL CONTROLS
-- =========================================================

CREATE TABLE mues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(250) NOT NULL,
  description TEXT,
  predominant_control_type VARCHAR(120),
  expected_main_evidence TEXT,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE critical_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mue_id UUID NOT NULL REFERENCES mues(id) ON DELETE CASCADE,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(250) NOT NULL,
  description TEXT,
  control_type VARCHAR(120),
  objective TEXT,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mue_id, code)
);

CREATE TABLE critical_control_area_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  critical_control_id UUID NOT NULL REFERENCES critical_controls(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id),
  gerencia_id UUID REFERENCES gerencias(id),
  responsible_user_id UUID REFERENCES users(id),
  responsible_name VARCHAR(200),
  expected_evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE control_verification_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  critical_control_id UUID NOT NULL REFERENCES critical_controls(id) ON DELETE CASCADE,
  code VARCHAR(80),
  question TEXT NOT NULL,
  expected_evidence TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE control_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  critical_control_id UUID REFERENCES critical_controls(id),
  area_id UUID REFERENCES areas(id),
  company_id UUID REFERENCES companies(id),
  assessment_date DATE NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER CHECK (period_month BETWEEN 1 AND 12),
  status validation_status NOT NULL DEFAULT 'draft',
  created_by_user_id UUID REFERENCES users(id),
  validated_by_user_id UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE control_assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_assessment_id UUID NOT NULL REFERENCES control_assessments(id) ON DELETE CASCADE,
  verification_item_id UUID NOT NULL REFERENCES control_verification_items(id),
  answer checklist_answer_value NOT NULL,
  comment TEXT,
  answered_by_user_id UUID REFERENCES users(id),
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (control_assessment_id, verification_item_id)
);

CREATE TABLE control_area_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mue_id UUID NOT NULL REFERENCES mues(id) ON DELETE CASCADE,
  critical_control_id UUID REFERENCES critical_controls(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  gerencia_id UUID REFERENCES gerencias(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  area_name_snapshot VARCHAR(240),
  responsible_name_snapshot VARCHAR(240),
  responsible_role VARCHAR(160),
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE control_self_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mue_id UUID NOT NULL REFERENCES mues(id) ON DELETE CASCADE,
  critical_control_id UUID REFERENCES critical_controls(id) ON DELETE SET NULL,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  gerencia_id UUID REFERENCES gerencias(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  compliance_score NUMERIC(5, 2),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  validated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE control_self_assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES control_self_assessments(id) ON DELETE CASCADE,
  verification_item_id UUID NOT NULL REFERENCES control_verification_items(id) ON DELETE CASCADE,
  answer VARCHAR(40) NOT NULL,
  comment TEXT,
  risk_level VARCHAR(40),
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, verification_item_id)
);

CREATE TABLE control_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES control_self_assessment_answers(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
  relation_type VARCHAR(80) NOT NULL DEFAULT 'control_assessment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (answer_id, evidence_id)
);

-- =========================================================
-- INSPECTIONS
-- =========================================================

CREATE TABLE inspection_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(250) NOT NULL,
  description TEXT,
  category VARCHAR(120),
  version VARCHAR(40) NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_checklist_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES inspection_checklist_templates(id) ON DELETE CASCADE,
  name VARCHAR(250) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES inspection_checklist_sections(id) ON DELETE CASCADE,
  code VARCHAR(80),
  question TEXT NOT NULL,
  expected_evidence TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_finding_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(260) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_finding_severities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  closure_time_label VARCHAR(160) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(80) UNIQUE,
  inspection_date DATE NOT NULL,
  inspection_type inspection_type NOT NULL,
  checklist_template_id UUID REFERENCES inspection_checklist_templates(id),
  inspector_user_id UUID REFERENCES users(id),
  business_unit_id UUID REFERENCES business_units(id),
  gerencia_id UUID REFERENCES gerencias(id),
  area_id UUID REFERENCES areas(id),
  sector_id UUID REFERENCES sectors(id),
  location_id UUID REFERENCES locations(id),
  company_id UUID REFERENCES companies(id),
  global_status inspection_global_status NOT NULL DEFAULT 'open',
  closure_days INTEGER,
  closed_at TIMESTAMPTZ,
  closed_by_user_id UUID REFERENCES users(id),
  observations TEXT,
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_checklist_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES inspection_checklist_items(id),
  answer checklist_answer_value NOT NULL,
  comment TEXT,
  answered_by_user_id UUID REFERENCES users(id),
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (inspection_id, checklist_item_id)
);

CREATE TABLE inspection_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES inspection_checklist_items(id) ON DELETE SET NULL,
  finding_type_id UUID REFERENCES inspection_finding_types(id) ON DELETE SET NULL,
  severity_id UUID REFERENCES inspection_finding_severities(id) ON DELETE SET NULL,
  responsible_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  severity inspection_finding_severity NOT NULL,
  status inspection_finding_status NOT NULL DEFAULT 'open',
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES users(id),
  due_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_finding_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES inspection_findings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (finding_id, user_id)
);

CREATE TABLE inspection_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES inspection_findings(id) ON DELETE CASCADE,
  followup_number INTEGER NOT NULL CHECK (followup_number BETWEEN 1 AND 3),
  followup_date DATE NOT NULL,
  observation TEXT,
  closure_date DATE,
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (finding_id, followup_number)
);

CREATE TABLE inspection_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  from_status inspection_global_status,
  to_status inspection_global_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(id),
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id),
  export_type VARCHAR(40) NOT NULL DEFAULT 'pdf',
  generated_by_user_id UUID REFERENCES users(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- INCIDENTS
-- =========================================================

CREATE TABLE incident_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_level_rules (
  level INTEGER PRIMARY KEY CHECK (level BETWEEN 0 AND 5),
  name VARCHAR(160) NOT NULL,
  description TEXT,
  notification_sla_hours INTEGER NOT NULL,
  requires_icam BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO incident_level_rules (level, name, description, notification_sla_hours, requires_icam) VALUES
  (0, 'Insignificant or near miss', 'Insignificant or quasi-incident', 24, FALSE),
  (1, 'Minor', 'Minor incident with minimal impact', 24, FALSE),
  (2, 'Short-term impact', 'Non-compliance or incident with short-term impact', 12, FALSE),
  (3, 'Serious', 'Serious incident requiring ICAM investigation', 12, TRUE),
  (4, 'Major', 'Major incident requiring ICAM investigation', 6, TRUE),
  (5, 'Catastrophic', 'Catastrophic incident requiring immediate escalation', 2, TRUE)
ON CONFLICT (level) DO NOTHING;

CREATE TABLE incident_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code incident_level_code NOT NULL UNIQUE,
  level_number INTEGER NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  sla_hours INTEGER NOT NULL,
  requires_investigation BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(250),
  event_datetime TIMESTAMPTZ NOT NULL,
  detection_datetime TIMESTAMPTZ,
  reported_datetime TIMESTAMPTZ,
  incident_type_id UUID REFERENCES incident_types(id),
  incident_level INTEGER NOT NULL REFERENCES incident_level_rules(level),
  status incident_status NOT NULL DEFAULT 'notified',
  business_unit_id UUID REFERENCES business_units(id),
  gerencia_id UUID REFERENCES gerencias(id),
  area_id UUID REFERENCES areas(id),
  sector_id UUID REFERENCES sectors(id),
  location_id UUID REFERENCES locations(id),
  company_id UUID REFERENCES companies(id),
  exact_location TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  description TEXT NOT NULL,
  material_damage TEXT,
  environmental_impact TEXT,
  is_spie BOOLEAN,
  is_tsf_related BOOLEAN NOT NULL DEFAULT FALSE,
  is_cyanide_related BOOLEAN NOT NULL DEFAULT FALSE,
  notification_due_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_by_user_id UUID REFERENCES users(id),
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_involved_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  position VARCHAR(160),
  age INTEGER CHECK (age >= 0),
  seniority_months INTEGER CHECK (seniority_months >= 0),
  company_id UUID REFERENCES companies(id),
  involvement_type VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_immediate_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  action_datetime TIMESTAMPTZ,
  responsible_user_id UUID REFERENCES users(id),
  responsible_name VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_flash_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL UNIQUE REFERENCES incidents(id) ON DELETE CASCADE,
  report_number VARCHAR(80),
  generated_at TIMESTAMPTZ,
  generated_by_user_id UUID REFERENCES users(id),
  summary TEXT,
  pdf_file_id UUID REFERENCES files(id),
  validation_status validation_status NOT NULL DEFAULT 'draft',
  validated_by_user_id UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  status VARCHAR(80) NOT NULL,
  validator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  comments TEXT,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  investigation_type incident_investigation_type NOT NULL,
  start_date DATE,
  end_date DATE,
  led_by_user_id UUID REFERENCES users(id),
  conclusion TEXT,
  root_cause TEXT,
  status validation_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (incident_id, investigation_type)
);

CREATE TABLE incident_investigation_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES incident_investigations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name VARCHAR(200),
  role_description VARCHAR(200),
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR name IS NOT NULL)
);

CREATE TABLE incident_investigation_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES incident_investigations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_peepo_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL UNIQUE REFERENCES incident_investigations(id) ON DELETE CASCADE,
  people TEXT,
  equipment TEXT,
  environment TEXT,
  procedures TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES incident_investigations(id) ON DELETE CASCADE,
  event_datetime TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_five_why_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES incident_investigations(id) ON DELETE CASCADE,
  why_number INTEGER NOT NULL CHECK (why_number BETWEEN 1 AND 5),
  question TEXT NOT NULL DEFAULT '¿Por qué?',
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (investigation_id, why_number)
);

CREATE TABLE incident_five_why_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL UNIQUE REFERENCES incident_investigations(id) ON DELETE CASCADE,
  problem_statement TEXT NOT NULL,
  why1 TEXT,
  why2 TEXT,
  why3 TEXT,
  why4 TEXT,
  why5 TEXT,
  root_cause TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  investigation_id UUID REFERENCES incident_investigations(id) ON DELETE SET NULL,
  action_description TEXT NOT NULL,
  responsible_user_id UUID REFERENCES users(id),
  responsible_company_id UUID REFERENCES companies(id),
  due_date DATE,
  completion_date DATE,
  status validation_status NOT NULL DEFAULT 'pending_review',
  validation_notes TEXT,
  validated_by_user_id UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_action_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_id UUID NOT NULL REFERENCES incident_action_plans(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (action_plan_id, evidence_id)
);

CREATE TABLE incident_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  from_status incident_status,
  to_status incident_status NOT NULL,
  changed_by_user_id UUID REFERENCES users(id),
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_disseminations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  flash_report_id UUID REFERENCES incident_flash_reports(id),
  sent_by_user_id UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ,
  recipient_scope VARCHAR(160),
  notification_id UUID REFERENCES notifications(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- SPR
-- =========================================================

CREATE TABLE measurement_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE spr_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  symbol VARCHAR(40),
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE spr_measure_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE spr_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measure_group_id UUID REFERENCES spr_measure_groups(id),
  parameter_code VARCHAR(80) NOT NULL UNIQUE,
  gri_code VARCHAR(80),
  company_code VARCHAR(80),
  name VARCHAR(250) NOT NULL,
  description TEXT,
  unit_id UUID REFERENCES measurement_units(id),
  is_sox BOOLEAN NOT NULL DEFAULT FALSE,
  requires_evidence BOOLEAN NOT NULL DEFAULT FALSE,
  status record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE spr_parameter_area_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_id UUID NOT NULL REFERENCES spr_parameters(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id),
  responsible_user_id UUID REFERENCES users(id),
  manager_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parameter_id, area_id)
);

CREATE TABLE spr_monthly_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_id UUID NOT NULL REFERENCES spr_parameters(id),
  area_id UUID REFERENCES areas(id),
  business_unit_id UUID REFERENCES business_units(id),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  value NUMERIC(18, 6) NOT NULL,
  source_information TEXT,
  status spr_record_status NOT NULL DEFAULT 'draft',
  submitted_by_user_id UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  responsible_approved_by_user_id UUID REFERENCES users(id),
  responsible_approved_at TIMESTAMPTZ,
  manager_approved_by_user_id UUID REFERENCES users(id),
  manager_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parameter_id, area_id, period_year, period_month)
);

CREATE TABLE spr_consolidation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_parameter_id UUID NOT NULL REFERENCES spr_parameters(id),
  rule_code VARCHAR(100) NOT NULL,
  description TEXT,
  rule_expression JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (target_parameter_id, rule_code)
);

CREATE TABLE spr_record_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES spr_monthly_records(id) ON DELETE CASCADE,
  approver_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status spr_approval_status NOT NULL DEFAULT 'pending',
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- GREEN TAX / EMISSIONS
-- =========================================================

CREATE TABLE pollutants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  unit_id UUID REFERENCES measurement_units(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emission_source_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emission_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_identifier VARCHAR(100) NOT NULL UNIQUE,
  internal_tag VARCHAR(100),
  serial_number VARCHAR(120),
  source_type_id UUID REFERENCES emission_source_types(id),
  category VARCHAR(80),
  installed_power_kw NUMERIC(14, 4),
  thermal_power_mwt NUMERIC(14, 4),
  nominal_consumption_lh NUMERIC(14, 4),
  thermal_efficiency_percent NUMERIC(7, 4),
  abatement_efficiency_percent NUMERIC(7, 4) NOT NULL DEFAULT 0,
  status emission_source_status NOT NULL DEFAULT 'active',
  gerencia_id UUID REFERENCES gerencias(id),
  area_id UUID REFERENCES areas(id),
  location_id UUID REFERENCES locations(id),
  macrozone VARCHAR(120),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  altitude_m NUMERIC(10, 2),
  engine_brand VARCHAR(120),
  engine_model VARCHAR(120),
  manufacture_year INTEGER,
  useful_life_hours NUMERIC(14, 2),
  stack_inner_diameter_m NUMERIC(10, 4),
  stack_outer_diameter_m NUMERIC(10, 4),
  stack_height_m NUMERIC(10, 4),
  gas_velocity_ms NUMERIC(10, 4),
  gas_temperature_c NUMERIC(10, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emission_activity_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emission_source_id UUID NOT NULL REFERENCES emission_sources(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_quarter INTEGER GENERATED ALWAYS AS (((period_month - 1) / 3) + 1) STORED,
  fuel_consumption_liters NUMERIC(18, 6) NOT NULL DEFAULT 0,
  operation_hours NUMERIC(18, 6) NOT NULL DEFAULT 0,
  processed_tons NUMERIC(18, 6),
  source_information TEXT,
  reported_by_user_id UUID REFERENCES users(id),
  reported_at TIMESTAMPTZ,
  status validation_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (emission_source_id, period_year, period_month)
);

CREATE TABLE emission_stoppages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emission_source_id UUID NOT NULL REFERENCES emission_sources(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE TABLE emission_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type_id UUID NOT NULL REFERENCES emission_source_types(id),
  pollutant_id UUID NOT NULL REFERENCES pollutants(id),
  factor_value NUMERIC(18, 10) NOT NULL,
  factor_unit VARCHAR(80) NOT NULL,
  valid_from DATE,
  valid_to DATE,
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type_id, pollutant_id, valid_from)
);

CREATE TABLE emission_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_level_id UUID NOT NULL REFERENCES emission_activity_levels(id) ON DELETE CASCADE,
  emission_factor_id UUID NOT NULL REFERENCES emission_factors(id),
  pollutant_id UUID NOT NULL REFERENCES pollutants(id),
  calculated_value NUMERIC(18, 8) NOT NULL,
  calculation_formula TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (activity_level_id, pollutant_id)
);

CREATE TABLE green_tax_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pollutant_id UUID REFERENCES pollutants(id),
  code VARCHAR(80) NOT NULL,
  name VARCHAR(200) NOT NULL,
  threshold_value NUMERIC(18, 6) NOT NULL,
  threshold_unit VARCHAR(80) NOT NULL,
  period_type VARCHAR(40) NOT NULL DEFAULT 'annual',
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pollutant_id, code, valid_from)
);

-- =========================================================
-- MOBILE SYNC
-- =========================================================

CREATE TABLE mobile_sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(120) NOT NULL,
  local_id VARCHAR(160) NOT NULL,
  idempotency_key VARCHAR(220) NOT NULL UNIQUE,
  device_id VARCHAR(160) NOT NULL,
  device_session_id VARCHAR(160) NOT NULL,
  operation_type VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  remote_id VARCHAR(160),
  error_code VARCHAR(120),
  error_message TEXT,
  payload JSONB,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- INITIAL CATALOG DATA
-- =========================================================

INSERT INTO measurement_units (code, name) VALUES
  ('TON', 'Ton'),
  ('KG', 'Kilogram'),
  ('KLT', 'Kiloliter'),
  ('MWH', 'Megawatt-hour'),
  ('MLT', 'Megaliter'),
  ('KM', 'Kilometer'),
  ('USD', 'US Dollar'),
  ('LC', 'Local Currency'),
  ('L', 'Liter'),
  ('H', 'Hour')
ON CONFLICT (code) DO NOTHING;

INSERT INTO pollutants (code, name) VALUES
  ('MP', 'Material particulado'),
  ('SO2', 'Sulfur dioxide'),
  ('NOX', 'Nitrogen oxides'),
  ('CO2', 'Carbon dioxide')
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_area ON users(area_id);
CREATE INDEX idx_areas_gerencia ON areas(gerencia_id);
CREATE INDEX idx_sectors_area ON sectors(area_id);
CREATE INDEX idx_locations_sector ON locations(sector_id);

CREATE INDEX idx_evidence_links_entity ON evidence_links(entity_type, entity_id);
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);

CREATE INDEX idx_critical_controls_mue ON critical_controls(mue_id);
CREATE INDEX idx_control_assessments_period ON control_assessments(period_year, period_month);
CREATE INDEX idx_control_assessment_answers_assessment ON control_assessment_answers(control_assessment_id);
CREATE INDEX idx_control_area_assignments_mue ON control_area_assignments(mue_id);
CREATE INDEX idx_control_area_assignments_control ON control_area_assignments(critical_control_id);
CREATE INDEX idx_control_self_assessments_mue ON control_self_assessments(mue_id);
CREATE INDEX idx_control_self_assessments_period ON control_self_assessments(period_year, period_month);
CREATE INDEX idx_control_self_assessments_status ON control_self_assessments(status);
CREATE INDEX idx_control_self_assessment_answers_assessment ON control_self_assessment_answers(assessment_id);
CREATE INDEX idx_control_evidences_answer ON control_evidences(answer_id);

CREATE INDEX idx_inspections_date ON inspections(inspection_date);
CREATE INDEX idx_inspections_status ON inspections(global_status);
CREATE INDEX idx_inspections_area_company ON inspections(area_id, company_id);
CREATE INDEX idx_inspection_findings_inspection ON inspection_findings(inspection_id);
CREATE INDEX idx_inspection_findings_type ON inspection_findings(finding_type_id);
CREATE INDEX idx_inspection_findings_severity_catalog ON inspection_findings(severity_id);
CREATE INDEX idx_inspection_findings_responsible_company ON inspection_findings(responsible_company_id);
CREATE INDEX idx_inspection_findings_status_due ON inspection_findings(status, due_at);
CREATE INDEX idx_inspection_finding_responsibles_finding ON inspection_finding_responsibles(finding_id);
CREATE INDEX idx_inspection_followups_finding ON inspection_followups(finding_id);
CREATE INDEX idx_inspection_finding_types_active_sort ON inspection_finding_types(is_active, sort_order);
CREATE INDEX idx_inspection_finding_severities_active_sort ON inspection_finding_severities(is_active, sort_order);
CREATE INDEX idx_inspection_types_code ON inspection_types(code);

CREATE INDEX idx_incidents_event_datetime ON incidents(event_datetime);
CREATE INDEX idx_incidents_level_status ON incidents(incident_level, status);
CREATE INDEX idx_incidents_area_company ON incidents(area_id, company_id);
CREATE INDEX idx_incidents_type ON incidents(incident_type_id);
CREATE INDEX idx_incident_action_plans_status_due ON incident_action_plans(status, due_date);
CREATE INDEX idx_incident_validations_incident ON incident_validations(incident_id);
CREATE INDEX idx_incident_action_evidences_action ON incident_action_evidences(action_plan_id);
CREATE INDEX idx_incident_action_evidences_evidence ON incident_action_evidences(evidence_id);
CREATE INDEX idx_incident_levels_code ON incident_levels(code);
CREATE INDEX idx_incident_investigation_team_investigation ON incident_investigation_team(investigation_id);

CREATE INDEX idx_spr_monthly_records_period ON spr_monthly_records(period_year, period_month);
CREATE INDEX idx_spr_monthly_records_parameter ON spr_monthly_records(parameter_id);
CREATE INDEX idx_spr_monthly_records_status ON spr_monthly_records(status);
CREATE INDEX idx_spr_record_approvals_record ON spr_record_approvals(record_id);
CREATE INDEX idx_spr_units_code ON spr_units(code);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_revoked_at ON user_sessions(revoked_at);
CREATE INDEX idx_user_companies_user ON user_companies(user_id);
CREATE INDEX idx_user_companies_company ON user_companies(company_id);
CREATE INDEX idx_user_areas_user ON user_areas(user_id);
CREATE INDEX idx_user_areas_area ON user_areas(area_id);

CREATE INDEX idx_mobile_sync_operations_device_local ON mobile_sync_operations(device_id, local_id);
CREATE INDEX idx_mobile_sync_operations_batch ON mobile_sync_operations(batch_id);

CREATE INDEX idx_emission_sources_type ON emission_sources(source_type_id);
CREATE INDEX idx_emission_activity_levels_period ON emission_activity_levels(period_year, period_month);
CREATE INDEX idx_emission_activity_levels_source ON emission_activity_levels(emission_source_id);
CREATE INDEX idx_emission_calculations_activity ON emission_calculations(activity_level_id);

-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'business_units','gerencias','areas','sectors','locations','companies',
    'users','roles','permissions',
    'user_sessions',
    'files','evidences','comments','notifications',
    'workflow_definitions','workflow_definition_steps','workflow_instances','workflow_instance_steps',
    'user_companies','user_areas',
    'mues','critical_controls','control_verification_items','control_assessments','control_assessment_answers',
    'control_area_assignments','control_self_assessments','control_self_assessment_answers',
    'inspection_types','inspection_checklist_templates','inspection_checklist_sections','inspection_checklist_items','inspection_finding_types','inspection_finding_severities','inspections','inspection_checklist_answers','inspection_findings','inspection_finding_responsibles','inspection_followups',
    'incident_types','incident_levels','incidents','incident_involved_people','incident_immediate_actions','incident_flash_reports','incident_investigations','incident_investigation_team','incident_peepo_analysis','incident_timeline_events','incident_five_why_items','incident_five_why_analysis','incident_action_plans',
    'measurement_units','spr_units','spr_measure_groups','spr_parameters','spr_monthly_records','spr_consolidation_rules','spr_record_approvals',
    'pollutants','emission_source_types','emission_sources','emission_activity_levels','emission_stoppages','emission_factors','green_tax_thresholds',
    'mobile_sync_operations','control_evidences'
  ] LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- =========================================================
-- VALIDATION NOTES FOR NEXT ITERATION
-- =========================================================

-- Pending validation:
-- 1. Confirm whether users are internal only or include contractor users with limited tenant-like access.
-- 2. Confirm official catalog values for gerencias, areas, sectors and companies.
-- 3. Confirm all MUE and critical control catalogs from the final spreadsheet.
-- 4. Confirm whether inspection checklist templates should be versioned immutably.
-- 5. Confirm exact PDF export persistence rules.
-- 6. Confirm whether mobile offline records require a dedicated sync_jobs table in the backend.
-- 7. Confirm whether evidence_links polymorphic approach is accepted by the team.
-- 8. Confirm if incident notification SLA should be stored as deadline snapshots on incidents or calculated dynamically from incident_level_rules.
-- 9. Confirm whether SPR SOX approvals require legally valid digital signatures or only application approval records.
-- 10. Confirm whether emission calculations should be materialized in emission_calculations or generated as views.
