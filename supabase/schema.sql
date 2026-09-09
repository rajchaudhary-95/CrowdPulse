-- =============================================================================
-- CROWDPULSE / OMNIVENUE - SUPABASE POSTGRESQL SCHEMA & SEED SCRIPT
-- =============================================================================
-- Copy this entire file and paste it into your Supabase Dashboard -> SQL Editor,
-- then click "RUN". It will set up all tables, automated auth triggers,
-- Row-Level Security (RLS) policies, and initial mega-event seed data.
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USER PROFILES TABLE (Linked to Supabase auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor', 'organizer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger: Automatically create profile entry when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'visitor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. ZONES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  geo_center JSONB NOT NULL,
  geo_boundary JSONB,
  total_capacity JSONB NOT NULL,
  live_metrics JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read zones" ON public.zones;
CREATE POLICY "Anyone can read zones"
  ON public.zones FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Organizers can modify zones" ON public.zones;
CREATE POLICY "Organizers can modify zones"
  ON public.zones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('organizer', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- 3. VENUES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone_id TEXT REFERENCES public.zones(id) ON DELETE SET NULL,
  location JSONB NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10000,
  scheduled_events JSONB DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read venues" ON public.venues;
CREATE POLICY "Anyone can read venues"
  ON public.venues FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Organizers can modify venues" ON public.venues;
CREATE POLICY "Organizers can modify venues"
  ON public.venues FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('organizer', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- 4. TRANSIT EDGES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transit_edges (
  id TEXT PRIMARY KEY,
  source_zone_id TEXT NOT NULL,
  target_zone_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  capacity_per_hour INTEGER NOT NULL,
  current_flow_rate INTEGER DEFAULT 0,
  congestion_index NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'optimal',
  polyline JSONB DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transit_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read transit edges" ON public.transit_edges;
CREATE POLICY "Anyone can read transit edges"
  ON public.transit_edges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Organizers can modify transit edges" ON public.transit_edges;
CREATE POLICY "Organizers can modify transit edges"
  ON public.transit_edges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('organizer', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- 5. ALERTS & INCIDENT PLAYBOOKS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'advisory', 'warning', 'critical')),
  affected_zone_ids JSONB DEFAULT '[]'::JSONB,
  message TEXT NOT NULL,
  recommended_action TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'mitigating', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read alerts" ON public.alerts;
CREATE POLICY "Anyone can read alerts"
  ON public.alerts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Organizers can modify alerts" ON public.alerts;
CREATE POLICY "Organizers can modify alerts"
  ON public.alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('organizer', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- 6. OPERATIONAL AUDIT LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read audit logs" ON public.audit_logs;
CREATE POLICY "Anyone authenticated can read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Organizers can insert audit logs" ON public.audit_logs;
CREATE POLICY "Organizers can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('organizer', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- 7. HISTORICAL VISITOR FLOW SNAPSHOTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visitor_flow_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  tick_index INTEGER,
  system_occupancy_total INTEGER,
  zones_summary JSONB DEFAULT '[]'::JSONB
);

ALTER TABLE public.visitor_flow_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read visitor flow snapshots" ON public.visitor_flow_snapshots;
CREATE POLICY "Anyone can read visitor flow snapshots"
  ON public.visitor_flow_snapshots FOR SELECT
  USING (true);

-- -----------------------------------------------------------------------------
-- 8. INITIAL SEED DATA (PILLAI ALEGRIA FESTIVAL ZONES, VENUES & EDGES)
-- -----------------------------------------------------------------------------
INSERT INTO public.zones (id, name, category, geo_center, geo_boundary, total_capacity, live_metrics, metadata)
VALUES
(
  'zone-main-ground',
  'Alegria Main Concert Ground',
  'venue_cluster',
  '{"lat": 18.9908, "lng": 73.1282}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[18.9915, 73.1278], [18.9916, 73.1288], [18.9903, 73.1289], [18.9902, 73.1279]]]}'::JSONB,
  '{"venue": 7000, "transit": 4000, "hospitality": 1500}'::JSONB,
  '{"currentVenueOccupancy": 5850, "currentTransitPressure": 0.92, "currentHospitalityOccupancy": 1200, "compositeStressScore": 88, "status": "critical"}'::JSONB,
  '{"accessibilityScore": 92, "transitConnectedZoneIds": ["zone-quadrangle", "zone-sports-ground"]}'::JSONB
),
(
  'zone-quadrangle',
  'The Central Quadrangle (The Quad)',
  'venue_cluster',
  '{"lat": 18.9902, "lng": 73.1277}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[18.9906, 73.1274], [18.9907, 73.1280], [18.9898, 73.1281], [18.9897, 73.1275]]]}'::JSONB,
  '{"venue": 2500, "transit": 3500, "hospitality": 1200}'::JSONB,
  '{"currentVenueOccupancy": 1850, "currentTransitPressure": 0.68, "currentHospitalityOccupancy": 850, "compositeStressScore": 66, "status": "elevated"}'::JSONB,
  '{"accessibilityScore": 98, "transitConnectedZoneIds": ["zone-main-ground", "zone-canteen-back", "zone-atrium-main"]}'::JSONB
),
(
  'zone-canteen-back',
  'Campus Canteen & Boys Gate 2',
  'hospitality',
  '{"lat": 18.9895, "lng": 73.1272}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[18.9899, 73.1268], [18.9900, 73.1275], [18.9890, 73.1276], [18.9889, 73.1269]]]}'::JSONB,
  '{"venue": 1800, "transit": 2500, "hospitality": 2000}'::JSONB,
  '{"currentVenueOccupancy": 1100, "currentTransitPressure": 0.48, "currentHospitalityOccupancy": 1400, "compositeStressScore": 46, "status": "normal"}'::JSONB,
  '{"accessibilityScore": 95, "transitConnectedZoneIds": ["zone-quadrangle", "zone-panvel-transit", "zone-sports-ground"]}'::JSONB
),
(
  'zone-atrium-main',
  'Engineering Atrium & Girls/Artist Gate 1',
  'venue_cluster',
  '{"lat": 18.9900, "lng": 73.1280}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[18.9904, 73.1278], [18.9905, 73.1285], [18.9895, 73.1286], [18.9894, 73.1279]]]}'::JSONB,
  '{"venue": 2000, "transit": 3500, "hospitality": 800}'::JSONB,
  '{"currentVenueOccupancy": 1350, "currentTransitPressure": 0.54, "currentHospitalityOccupancy": 450, "compositeStressScore": 52, "status": "normal"}'::JSONB,
  '{"accessibilityScore": 100, "transitConnectedZoneIds": ["zone-quadrangle", "zone-panvel-transit"]}'::JSONB
),
(
  'zone-sports-ground',
  'PICA Lawn & Sports Ground',
  'buffer',
  '{"lat": 18.9912, "lng": 73.1270}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[18.9918, 73.1265], [18.9919, 73.1274], [18.9907, 73.1275], [18.9906, 73.1266]]]}'::JSONB,
  '{"venue": 2000, "transit": 1500, "hospitality": 1500}'::JSONB,
  '{"currentVenueOccupancy": 550, "currentTransitPressure": 0.22, "currentHospitalityOccupancy": 400, "compositeStressScore": 24, "status": "normal"}'::JSONB,
  '{"accessibilityScore": 90, "transitConnectedZoneIds": ["zone-main-ground", "zone-canteen-back"]}'::JSONB
),
(
  'zone-panvel-transit',
  'Panvel Station & Sector 16 Transit Hub',
  'transit_hub',
  '{"lat": 18.9915, "lng": 73.1220}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[18.9930, 73.1205], [18.9935, 73.1235], [18.9900, 73.1240], [18.9895, 73.1210]]]}'::JSONB,
  '{"venue": 3000, "transit": 10000, "hospitality": 3000}'::JSONB,
  '{"currentVenueOccupancy": 2200, "currentTransitPressure": 0.65, "currentHospitalityOccupancy": 1700, "compositeStressScore": 58, "status": "normal"}'::JSONB,
  '{"accessibilityScore": 96, "transitConnectedZoneIds": ["zone-atrium-main", "zone-canteen-back"]}'::JSONB
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  geo_center = EXCLUDED.geo_center,
  total_capacity = EXCLUDED.total_capacity,
  live_metrics = EXCLUDED.live_metrics;

-- Venues Seed
INSERT INTO public.venues (id, name, zone_id, location, capacity, scheduled_events)
VALUES
(
  'venue-alegria-main-stage',
  'Alegria Main Concert Arena (Sports Ground)',
  'zone-main-ground',
  '{"lat": 18.9908, "lng": 73.1282}'::JSONB,
  7000,
  '[{"eventId": "evt-alegria-edm-night", "name": "Celebrity Headliner & DJ EDM Night", "category": "Concert", "attendanceExpected": 6800, "status": "upcoming"}]'::JSONB
),
(
  'venue-quad-stage',
  'The Quadrangle Cultural Stage',
  'zone-quadrangle',
  '{"lat": 18.9902, "lng": 73.1277}'::JSONB,
  2500,
  '[{"eventId": "evt-alegria-flashmob", "name": "Alegria Mega Flashmob & Battle of the Bands", "category": "Cultural", "attendanceExpected": 2300, "status": "upcoming"}]'::JSONB
),
(
  'venue-atrium-hall',
  'Engineering Concourse & Atrium Arena',
  'zone-atrium-main',
  '{"lat": 18.9900, "lng": 73.1280}'::JSONB,
  2000,
  '[{"eventId": "evt-alegria-fashion", "name": "Mr. & Ms. Alegria Fashion Night & Tech Showcase", "category": "Fashion/Showcase", "attendanceExpected": 1700, "status": "upcoming"}]'::JSONB
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity;

-- Transit Edges Seed
INSERT INTO public.transit_edges (id, source_zone_id, target_zone_id, mode, capacity_per_hour, current_flow_rate, congestion_index, status, polyline)
VALUES
('edge-depot-maingate', 'zone-panvel-transit', 'zone-atrium-main', 'shuttle_bus', 4000, 2600, 0.65, 'moderate', '[[18.9915, 73.1220], [18.9908, 73.1250], [18.9900, 73.1280]]'::JSONB),
('edge-depot-canteengate', 'zone-panvel-transit', 'zone-canteen-back', 'pedestrian_walkway', 3500, 1800, 0.51, 'moderate', '[[18.9915, 73.1220], [18.9905, 73.1245], [18.9895, 73.1272]]'::JSONB),
('edge-maingate-quad', 'zone-atrium-main', 'zone-quadrangle', 'pedestrian_walkway', 5000, 3100, 0.62, 'moderate', '[[18.9900, 73.1280], [18.9901, 73.1278], [18.9902, 73.1277]]'::JSONB),
('edge-canteengate-quad', 'zone-canteen-back', 'zone-quadrangle', 'pedestrian_walkway', 4500, 2200, 0.49, 'moderate', '[[18.9895, 73.1272], [18.9899, 73.1274], [18.9902, 73.1277]]'::JSONB),
('edge-quad-mainground', 'zone-quadrangle', 'zone-main-ground', 'pedestrian_walkway', 5500, 5100, 0.92, 'gridlock', '[[18.9902, 73.1277], [18.9905, 73.1280], [18.9908, 73.1282]]'::JSONB),
('edge-canteen-sports', 'zone-canteen-back', 'zone-sports-ground', 'pedestrian_walkway', 4000, 1100, 0.28, 'free_flow', '[[18.9895, 73.1272], [18.9904, 73.1269], [18.9912, 73.1270]]'::JSONB),
('edge-emergency-gate3', 'zone-main-ground', 'zone-sports-ground', 'shuttle_bus', 2000, 400, 0.20, 'free_flow', '[[18.9908, 73.1282], [18.9910, 73.1275], [18.9912, 73.1270]]'::JSONB)
ON CONFLICT (id) DO UPDATE SET
  capacity_per_hour = EXCLUDED.capacity_per_hour,
  current_flow_rate = EXCLUDED.current_flow_rate;

