-- ============================================================
-- Big V's Best Routes™ — Supabase SQL Setup (Run 10)
-- Powered by 4P3X Intelligent AI™ | Created by Kyzel Kreates™
--
-- Execute order (STRICT — do not reorder):
--   1.  Extensions
--   2.  Tables
--   3.  Indexes
--   4.  updated_at trigger function
--   5.  Triggers
--   6.  Enable RLS (on every table)
--   7.  RLS Policies
--   8.  Realtime publication (schema-ready label)
--   9.  Verification queries
--
-- Security rules:
--   ▸ RLS is ENABLED on all tables.
--   ▸ Policies use auth.uid() — not service role keys.
--   ▸ No insecure public write policies exist.
--   ▸ Demo records must NOT be inserted via this schema.
--   ▸ All tables include source_mode = 'live' constraint-friendly
--     design — app layer enforces this before inserting.
--
-- Advisory:
--   Backend sync improves data persistence and cross-device
--   visibility. It does NOT guarantee route safety, legal
--   compliance, road restriction accuracy, or live road conditions.
--   Drivers must always follow road signs, restrictions, traffic
--   laws, and their own professional judgement.
--
-- Realtime status: SCHEMA-READY
--   Publication lines are prepared below but commented out
--   pending full realtime subscription wiring in a later run.
--   Do not enable publication on tables without verifying
--   the frontend subscription code is in place first.
-- ============================================================


-- ==============================================================
--  SECTION 1 — EXTENSIONS
-- ==============================================================

-- uuid_generate_v4() — for any legacy UUID generation needs.
-- Supabase projects usually have this pre-enabled.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgcrypto — for gen_random_uuid() (preferred over uuid-ossp on PG 14+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ==============================================================
--  SECTION 2 — TABLES
-- ==============================================================

-- ─── bv_vehicles ─────────────────────────────────────────────
-- Stores live vehicle profiles. Mirrors useVehicleStore (SSOT).
-- Demo vehicles are NOT inserted here — source_mode enforced in app.
CREATE TABLE IF NOT EXISTS bv_vehicles (
  id                  TEXT         PRIMARY KEY,
  user_id             UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT         NOT NULL DEFAULT '',
  registration        TEXT         NOT NULL DEFAULT '',
  vehicle_type        TEXT         NOT NULL DEFAULT '',
  make                TEXT         NOT NULL DEFAULT '',
  model               TEXT         NOT NULL DEFAULT '',
  year                SMALLINT,
  fuel_type           TEXT         NOT NULL DEFAULT '',
  gross_weight_kg     NUMERIC(10,2),
  unladen_weight_kg   NUMERIC(10,2),
  height_m            NUMERIC(6,3),
  width_m             NUMERIC(6,3),
  length_m            NUMERIC(6,3),
  axle_count          SMALLINT,
  status              TEXT         NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','inactive','archived')),
  source_mode         TEXT         NOT NULL DEFAULT 'live'
                      CHECK (source_mode IN ('live','local')),
  metadata            JSONB        NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── bv_routes ───────────────────────────────────────────────
-- Stores live route plans. Mirrors useRouteStore (SSOT).
CREATE TABLE IF NOT EXISTS bv_routes (
  id                  TEXT         PRIMARY KEY,
  user_id             UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT         NOT NULL DEFAULT '',
  origin_label        TEXT         NOT NULL DEFAULT '',
  origin_lat          DOUBLE PRECISION,
  origin_lng          DOUBLE PRECISION,
  destination_label   TEXT         NOT NULL DEFAULT '',
  destination_lat     DOUBLE PRECISION,
  destination_lng     DOUBLE PRECISION,
  distance_km         NUMERIC(10,3),
  duration_min        NUMERIC(10,2),
  vehicle_id          TEXT,
  risk_level          TEXT         DEFAULT NULL,
  status              TEXT         NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','planned','archived')),
  source_mode         TEXT         NOT NULL DEFAULT 'live'
                      CHECK (source_mode IN ('live','local')),
  metadata            JSONB        NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── bv_route_assignments ────────────────────────────────────
-- Links route plans to vehicles for the Driver PWA.
-- Mirrors useAssignmentStore (SSOT).
CREATE TABLE IF NOT EXISTS bv_route_assignments (
  id                      TEXT         PRIMARY KEY,
  user_id                 UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id                TEXT,
  route_name              TEXT         NOT NULL DEFAULT '',
  vehicle_id              TEXT,
  vehicle_name            TEXT         NOT NULL DEFAULT '',
  priority                TEXT         NOT NULL DEFAULT 'normal'
                          CHECK (priority IN ('normal','important','review_before_driving')),
  notes                   TEXT         NOT NULL DEFAULT '',
  safety_review_required  BOOLEAN      NOT NULL DEFAULT FALSE,
  status                  TEXT         NOT NULL DEFAULT 'assigned'
                          CHECK (status IN (
                            'draft','assigned','received','reviewed',
                            'inProgress','paused','completed','needsReview','cancelled'
                          )),
  sync_status             TEXT         NOT NULL DEFAULT 'syncedLocal',
  source_mode             TEXT         NOT NULL DEFAULT 'live'
                          CHECK (source_mode IN ('live','local')),
  metadata                JSONB        NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── bv_trip_sessions ────────────────────────────────────────
-- Records navigation sessions. Mirrors useTripSessionStore (SSOT).
CREATE TABLE IF NOT EXISTS bv_trip_sessions (
  id                       TEXT         PRIMARY KEY,
  user_id                  UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id            TEXT,
  route_id                 TEXT,
  vehicle_id               TEXT,
  status                   TEXT         NOT NULL DEFAULT 'active'
                           CHECK (status IN (
                             'notStarted','active','paused','completed',
                             'needsReview','cancelled','syncPending','syncedLocal','syncFailed'
                           )),
  started_at               TIMESTAMPTZ,
  paused_at                TIMESTAMPTZ,
  resumed_at               TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  gps_status               TEXT         NOT NULL DEFAULT 'idle',
  map_mode                 TEXT         NOT NULL DEFAULT '2d'
                           CHECK (map_mode IN ('2d','3d')),
  acknowledgement_accepted BOOLEAN      NOT NULL DEFAULT FALSE,
  checklist_completed      BOOLEAN      NOT NULL DEFAULT FALSE,
  driver_notes             TEXT         NOT NULL DEFAULT '',
  sync_status              TEXT         NOT NULL DEFAULT 'syncedLocal',
  source_mode              TEXT         NOT NULL DEFAULT 'live'
                           CHECK (source_mode IN ('live','local')),
  metadata                 JSONB        NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── bv_driver_reports ───────────────────────────────────────
-- Driver-submitted in-trip observations and incidents.
-- Mirrors useDriverReportStore (SSOT).
CREATE TABLE IF NOT EXISTS bv_driver_reports (
  id               TEXT         PRIMARY KEY,
  user_id          UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type      TEXT         NOT NULL DEFAULT 'other'
                   CHECK (report_type IN (
                     'route_concern','legal_restriction','low_bridge','width_restriction',
                     'weight_restriction','road_closure','unsafe_road','gps_map_issue',
                     'vehicle_issue','delay','completed_with_notes','other'
                   )),
  severity         TEXT         NOT NULL DEFAULT 'info'
                   CHECK (severity IN ('info','caution','high','critical')),
  notes            TEXT         NOT NULL DEFAULT '',
  route_id         TEXT,
  vehicle_id       TEXT,
  trip_session_id  TEXT,
  assignment_id    TEXT,
  gps_lat          DOUBLE PRECISION,
  gps_lng          DOUBLE PRECISION,
  gps_accuracy_m   NUMERIC(10,2),
  manual_location  TEXT         NOT NULL DEFAULT '',
  status           TEXT         NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','reviewed','actionRequired','resolved','archived')),
  sync_status      TEXT         NOT NULL DEFAULT 'syncedLocal',
  source_mode      TEXT         NOT NULL DEFAULT 'live'
                   CHECK (source_mode IN ('live','local')),
  metadata         JSONB        NOT NULL DEFAULT '{}',
  submitted_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── bv_compliance_checks ────────────────────────────────────
-- AI advisory compliance check results.
-- Advisory only — does not guarantee legal compliance.
CREATE TABLE IF NOT EXISTS bv_compliance_checks (
  id           TEXT         PRIMARY KEY,
  user_id      UUID         REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id     TEXT,
  vehicle_id   TEXT,
  check_type   TEXT         NOT NULL DEFAULT 'general',
  result       TEXT         NOT NULL DEFAULT 'unknown',
  risk_level   TEXT,
  notes        TEXT         NOT NULL DEFAULT '',
  checked_by   TEXT         NOT NULL DEFAULT 'system',
  source_mode  TEXT         NOT NULL DEFAULT 'live'
               CHECK (source_mode IN ('live','local')),
  metadata     JSONB        NOT NULL DEFAULT '{}',
  checked_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── bv_sync_logs ────────────────────────────────────────────
-- Lightweight audit/sync event log.
-- Records every save/load/sync attempt for evidence trail.
CREATE TABLE IF NOT EXISTS bv_sync_logs (
  id           TEXT         PRIMARY KEY,
  entity_type  TEXT         NOT NULL DEFAULT 'unknown',
  entity_id    TEXT,
  action       TEXT         NOT NULL DEFAULT 'unknown',
  status       TEXT         NOT NULL DEFAULT 'ok',
  notes        TEXT         NOT NULL DEFAULT '',
  source       TEXT         NOT NULL DEFAULT 'system',
  source_mode  TEXT         NOT NULL DEFAULT 'live'
               CHECK (source_mode IN ('live','local','demo')),
  metadata     JSONB        NOT NULL DEFAULT '{}',
  logged_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ==============================================================
--  SECTION 3 — INDEXES
-- ==============================================================

-- bv_vehicles
CREATE INDEX IF NOT EXISTS idx_bv_vehicles_user_id   ON bv_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_bv_vehicles_status     ON bv_vehicles(status);

-- bv_routes
CREATE INDEX IF NOT EXISTS idx_bv_routes_user_id      ON bv_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_bv_routes_vehicle_id   ON bv_routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bv_routes_status       ON bv_routes(status);

-- bv_route_assignments
CREATE INDEX IF NOT EXISTS idx_bv_assignments_user_id  ON bv_route_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_bv_assignments_route_id ON bv_route_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_bv_assignments_vehicle  ON bv_route_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bv_assignments_status   ON bv_route_assignments(status);

-- bv_trip_sessions
CREATE INDEX IF NOT EXISTS idx_bv_sessions_user_id     ON bv_trip_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bv_sessions_assignment  ON bv_trip_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_bv_sessions_route_id    ON bv_trip_sessions(route_id);
CREATE INDEX IF NOT EXISTS idx_bv_sessions_status      ON bv_trip_sessions(status);

-- bv_driver_reports
CREATE INDEX IF NOT EXISTS idx_bv_reports_user_id      ON bv_driver_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bv_reports_trip_session ON bv_driver_reports(trip_session_id);
CREATE INDEX IF NOT EXISTS idx_bv_reports_severity     ON bv_driver_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bv_reports_status       ON bv_driver_reports(status);

-- bv_compliance_checks
CREATE INDEX IF NOT EXISTS idx_bv_compliance_user_id   ON bv_compliance_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_bv_compliance_route     ON bv_compliance_checks(route_id);

-- bv_sync_logs
CREATE INDEX IF NOT EXISTS idx_bv_sync_logs_entity     ON bv_sync_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_bv_sync_logs_logged_at  ON bv_sync_logs(logged_at DESC);


-- ==============================================================
--  SECTION 4 — updated_at TRIGGER FUNCTION
-- ==============================================================

-- Shared trigger function — fires BEFORE UPDATE on any table.
CREATE OR REPLACE FUNCTION bv_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================
--  SECTION 5 — TRIGGERS
-- ==============================================================

-- Drop and recreate triggers safely using IF EXISTS (PG 14+).
-- If your Supabase project is PG 13 or below, use the
-- DROP TRIGGER ... IF EXISTS / CREATE TRIGGER pattern instead.

-- bv_vehicles
DROP TRIGGER IF EXISTS trg_bv_vehicles_updated_at ON bv_vehicles;
CREATE TRIGGER trg_bv_vehicles_updated_at
  BEFORE UPDATE ON bv_vehicles
  FOR EACH ROW EXECUTE FUNCTION bv_set_updated_at();

-- bv_routes
DROP TRIGGER IF EXISTS trg_bv_routes_updated_at ON bv_routes;
CREATE TRIGGER trg_bv_routes_updated_at
  BEFORE UPDATE ON bv_routes
  FOR EACH ROW EXECUTE FUNCTION bv_set_updated_at();

-- bv_route_assignments
DROP TRIGGER IF EXISTS trg_bv_assignments_updated_at ON bv_route_assignments;
CREATE TRIGGER trg_bv_assignments_updated_at
  BEFORE UPDATE ON bv_route_assignments
  FOR EACH ROW EXECUTE FUNCTION bv_set_updated_at();

-- bv_trip_sessions
DROP TRIGGER IF EXISTS trg_bv_sessions_updated_at ON bv_trip_sessions;
CREATE TRIGGER trg_bv_sessions_updated_at
  BEFORE UPDATE ON bv_trip_sessions
  FOR EACH ROW EXECUTE FUNCTION bv_set_updated_at();

-- bv_driver_reports
DROP TRIGGER IF EXISTS trg_bv_reports_updated_at ON bv_driver_reports;
CREATE TRIGGER trg_bv_reports_updated_at
  BEFORE UPDATE ON bv_driver_reports
  FOR EACH ROW EXECUTE FUNCTION bv_set_updated_at();

-- bv_compliance_checks
DROP TRIGGER IF EXISTS trg_bv_compliance_updated_at ON bv_compliance_checks;
CREATE TRIGGER trg_bv_compliance_updated_at
  BEFORE UPDATE ON bv_compliance_checks
  FOR EACH ROW EXECUTE FUNCTION bv_set_updated_at();

-- bv_sync_logs — no updated_at trigger (append-only log)


-- ==============================================================
--  SECTION 6 — ENABLE ROW LEVEL SECURITY (RLS)
--  RLS IS ENABLED ON ALL TABLES
-- ==============================================================

ALTER TABLE bv_vehicles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bv_routes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bv_route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bv_trip_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bv_driver_reports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bv_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bv_sync_logs         ENABLE ROW LEVEL SECURITY;


-- ==============================================================
--  SECTION 7 — RLS POLICIES
--  ▸ Authenticated users can only access their own records.
--  ▸ No insecure public write policies exist.
--  ▸ No service role key required from the frontend.
--  ▸ All policies use auth.uid() from Supabase Auth.
-- ==============================================================

-- ── bv_vehicles policies ─────────────────────────────────────
DROP POLICY IF EXISTS "bv_vehicles_select_own"  ON bv_vehicles;
DROP POLICY IF EXISTS "bv_vehicles_insert_own"  ON bv_vehicles;
DROP POLICY IF EXISTS "bv_vehicles_update_own"  ON bv_vehicles;
DROP POLICY IF EXISTS "bv_vehicles_delete_own"  ON bv_vehicles;

CREATE POLICY "bv_vehicles_select_own"
  ON bv_vehicles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bv_vehicles_insert_own"
  ON bv_vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_vehicles_update_own"
  ON bv_vehicles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_vehicles_delete_own"
  ON bv_vehicles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── bv_routes policies ───────────────────────────────────────
DROP POLICY IF EXISTS "bv_routes_select_own"  ON bv_routes;
DROP POLICY IF EXISTS "bv_routes_insert_own"  ON bv_routes;
DROP POLICY IF EXISTS "bv_routes_update_own"  ON bv_routes;
DROP POLICY IF EXISTS "bv_routes_delete_own"  ON bv_routes;

CREATE POLICY "bv_routes_select_own"
  ON bv_routes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bv_routes_insert_own"
  ON bv_routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_routes_update_own"
  ON bv_routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_routes_delete_own"
  ON bv_routes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── bv_route_assignments policies ────────────────────────────
DROP POLICY IF EXISTS "bv_assignments_select_own"  ON bv_route_assignments;
DROP POLICY IF EXISTS "bv_assignments_insert_own"  ON bv_route_assignments;
DROP POLICY IF EXISTS "bv_assignments_update_own"  ON bv_route_assignments;
DROP POLICY IF EXISTS "bv_assignments_delete_own"  ON bv_route_assignments;

CREATE POLICY "bv_assignments_select_own"
  ON bv_route_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bv_assignments_insert_own"
  ON bv_route_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_assignments_update_own"
  ON bv_route_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_assignments_delete_own"
  ON bv_route_assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── bv_trip_sessions policies ─────────────────────────────────
DROP POLICY IF EXISTS "bv_sessions_select_own"  ON bv_trip_sessions;
DROP POLICY IF EXISTS "bv_sessions_insert_own"  ON bv_trip_sessions;
DROP POLICY IF EXISTS "bv_sessions_update_own"  ON bv_trip_sessions;
DROP POLICY IF EXISTS "bv_sessions_delete_own"  ON bv_trip_sessions;

CREATE POLICY "bv_sessions_select_own"
  ON bv_trip_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bv_sessions_insert_own"
  ON bv_trip_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_sessions_update_own"
  ON bv_trip_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_sessions_delete_own"
  ON bv_trip_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── bv_driver_reports policies ───────────────────────────────
DROP POLICY IF EXISTS "bv_reports_select_own"  ON bv_driver_reports;
DROP POLICY IF EXISTS "bv_reports_insert_own"  ON bv_driver_reports;
DROP POLICY IF EXISTS "bv_reports_update_own"  ON bv_driver_reports;
DROP POLICY IF EXISTS "bv_reports_delete_own"  ON bv_driver_reports;

CREATE POLICY "bv_reports_select_own"
  ON bv_driver_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bv_reports_insert_own"
  ON bv_driver_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_reports_update_own"
  ON bv_driver_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_reports_delete_own"
  ON bv_driver_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── bv_compliance_checks policies ────────────────────────────
DROP POLICY IF EXISTS "bv_compliance_select_own"  ON bv_compliance_checks;
DROP POLICY IF EXISTS "bv_compliance_insert_own"  ON bv_compliance_checks;
DROP POLICY IF EXISTS "bv_compliance_update_own"  ON bv_compliance_checks;
DROP POLICY IF EXISTS "bv_compliance_delete_own"  ON bv_compliance_checks;

CREATE POLICY "bv_compliance_select_own"
  ON bv_compliance_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bv_compliance_insert_own"
  ON bv_compliance_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_compliance_update_own"
  ON bv_compliance_checks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bv_compliance_delete_own"
  ON bv_compliance_checks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── bv_sync_logs policies ─────────────────────────────────────
-- sync_logs has no user_id FK (append-only log, system-written).
-- Authenticated users can read all logs — service role writes.
-- TODO (Run 11 — Auth): Tighten to per-user scoping once auth is fully wired.
DROP POLICY IF EXISTS "bv_sync_logs_select_auth"  ON bv_sync_logs;
DROP POLICY IF EXISTS "bv_sync_logs_insert_auth"  ON bv_sync_logs;

CREATE POLICY "bv_sync_logs_select_auth"
  ON bv_sync_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bv_sync_logs_insert_auth"
  ON bv_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- ==============================================================
--  SECTION 8 — REALTIME PUBLICATION (SCHEMA-READY)
--
--  Status: SCHEMA-READY — not yet fully activated.
--
--  The tables below are designed for Supabase Realtime.
--  Publication lines are provided for when the frontend
--  subscription code is implemented in a later run.
--
--  DO NOT uncomment unless:
--    a) Frontend realtime subscriptions are fully implemented.
--    b) You have confirmed your Supabase plan supports realtime.
--    c) You have reviewed row filter policies for realtime.
--
--  To enable realtime on a table, uncomment the relevant line
--  and run it via the Supabase SQL Editor.
--
--  REFERENCE COMMANDS (do not run unless ready):
--
--  ALTER PUBLICATION supabase_realtime ADD TABLE bv_route_assignments;
--  ALTER PUBLICATION supabase_realtime ADD TABLE bv_trip_sessions;
--  ALTER PUBLICATION supabase_realtime ADD TABLE bv_driver_reports;
--  ALTER PUBLICATION supabase_realtime ADD TABLE bv_compliance_checks;
--  ALTER PUBLICATION supabase_realtime ADD TABLE bv_vehicles;
--  ALTER PUBLICATION supabase_realtime ADD TABLE bv_routes;
--
--  Note: bv_sync_logs is append-only and does not need realtime.
-- ==============================================================


-- ==============================================================
--  SECTION 9 — VERIFICATION QUERIES
--  Run these after the above to confirm setup is correct.
-- ==============================================================

-- Confirm all tables exist
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN (
     'bv_vehicles','bv_routes','bv_route_assignments',
     'bv_trip_sessions','bv_driver_reports',
     'bv_compliance_checks','bv_sync_logs'
   )
 ORDER BY table_name;

-- Confirm RLS is enabled on all tables
SELECT tablename, rowsecurity
  FROM pg_tables
 WHERE schemaname = 'public'
   AND tablename IN (
     'bv_vehicles','bv_routes','bv_route_assignments',
     'bv_trip_sessions','bv_driver_reports',
     'bv_compliance_checks','bv_sync_logs'
   )
 ORDER BY tablename;
-- Expected: rowsecurity = TRUE for all rows

-- Confirm policies exist
SELECT tablename, policyname, permissive, roles, cmd
  FROM pg_policies
 WHERE tablename IN (
     'bv_vehicles','bv_routes','bv_route_assignments',
     'bv_trip_sessions','bv_driver_reports',
     'bv_compliance_checks','bv_sync_logs'
   )
 ORDER BY tablename, cmd;
-- Expected: SELECT/INSERT/UPDATE/DELETE policies per table

-- Confirm triggers exist
SELECT trigger_name, event_manipulation, event_object_table
  FROM information_schema.triggers
 WHERE trigger_schema = 'public'
   AND trigger_name LIKE 'trg_bv_%'
 ORDER BY event_object_table;

-- Confirm indexes exist
SELECT indexname, tablename
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND tablename LIKE 'bv_%'
 ORDER BY tablename, indexname;

-- ============================================================
-- END OF big-vs-best-routes-run10.sql
-- ============================================================
