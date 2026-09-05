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
-- 8. INITIAL SEED DATA (5 OLYMPIC COMPLEX ZONES & VENUES)
-- -----------------------------------------------------------------------------
INSERT INTO public.zones (id, name, category, geo_center, geo_boundary, total_capacity, live_metrics, metadata)
VALUES
(
  'zone-main-arena',
  'Grand Olympic Arena Zone',
  'venue_cluster',
  '{"lat": 28.5865, "lng": 77.2345}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[28.5890, 77.2310], [28.5895, 77.2380], [28.5840, 77.2385], [28.5835, 77.2315]]]}'::JSONB,
  '{"venue": 65000, "transit": 25000, "hospitality": 12000}'::JSONB,
  '{"currentVenueOccupancy": 42000, "currentTransitPressure": 0.72, "currentHospitalityOccupancy": 8500, "compositeStressScore": 68, "status": "elevated"}'::JSONB,
  '{"accessibilityScore": 98, "transitConnectedZoneIds": ["zone-transit-hub", "zone-promenade", "zone-north-courts"]}'::JSONB
),
(
  'zone-transit-hub',
  'Central Intermodal Transit Hub',
  'transit_hub',
  '{"lat": 28.5805, "lng": 77.2280}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[28.5825, 77.2250], [28.5830, 77.2310], [28.5780, 77.2315], [28.5775, 77.2255]]]}'::JSONB,
  '{"venue": 8000, "transit": 45000, "hospitality": 6000}'::JSONB,
  '{"currentVenueOccupancy": 3200, "currentTransitPressure": 0.86, "currentHospitalityOccupancy": 4100, "compositeStressScore": 78, "status": "warning"}'::JSONB,
  '{"accessibilityScore": 95, "transitConnectedZoneIds": ["zone-main-arena", "zone-fan-park", "zone-promenade"]}'::JSONB
),
(
  'zone-fan-park',
  'Olympic Village Fan Festival Park',
  'fan_zone',
  '{"lat": 28.5765, "lng": 77.2370}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[28.5790, 77.2335], [28.5795, 77.2410], [28.5740, 77.2415], [28.5735, 77.2340]]]}'::JSONB,
  '{"venue": 35000, "transit": 18000, "hospitality": 20000}'::JSONB,
  '{"currentVenueOccupancy": 15200, "currentTransitPressure": 0.42, "currentHospitalityOccupancy": 11400, "compositeStressScore": 44, "status": "normal"}'::JSONB,
  '{"accessibilityScore": 92, "transitConnectedZoneIds": ["zone-transit-hub", "zone-promenade"]}'::JSONB
),
(
  'zone-promenade',
  'Grand Concourse & Food Promenade',
  'pedestrian_corridor',
  '{"lat": 28.5820, "lng": 77.2355}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[28.5840, 77.2335], [28.5845, 77.2385], [28.5800, 77.2380], [28.5795, 77.2330]]]}'::JSONB,
  '{"venue": 15000, "transit": 12000, "hospitality": 18000}'::JSONB,
  '{"currentVenueOccupancy": 6800, "currentTransitPressure": 0.52, "currentHospitalityOccupancy": 9200, "compositeStressScore": 51, "status": "normal"}'::JSONB,
  '{"accessibilityScore": 99, "transitConnectedZoneIds": ["zone-main-arena", "zone-transit-hub", "zone-fan-park", "zone-north-courts"]}'::JSONB
),
(
  'zone-north-courts',
  'North Aquatic Center & Practice Courts',
  'auxiliary_venue',
  '{"lat": 28.5915, "lng": 77.2310}'::JSONB,
  '{"type": "Polygon", "coordinates": [[[28.5940, 77.2280], [28.5945, 77.2345], [28.5895, 77.2350], [28.5890, 77.2285]]]}'::JSONB,
  '{"venue": 18000, "transit": 10000, "hospitality": 5000}'::JSONB,
  '{"currentVenueOccupancy": 5100, "currentTransitPressure": 0.35, "currentHospitalityOccupancy": 2100, "compositeStressScore": 32, "status": "normal"}'::JSONB,
  '{"accessibilityScore": 90, "transitConnectedZoneIds": ["zone-main-arena", "zone-promenade"]}'::JSONB
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
  'venue-main-stadium',
  'Olympic Main Stadium',
  'zone-main-arena',
  '{"lat": 28.5868, "lng": 77.2348}'::JSONB,
  60000,
  '[{"eventId": "evt-finals-01", "name": "Men 100m Sprint Finals", "category": "Athletics", "attendanceExpected": 58000, "status": "in_progress"}]'::JSONB
),
(
  'venue-fan-stage',
  'Live Concert Stage & Beer Garden',
  'zone-fan-park',
  '{"lat": 28.5760, "lng": 77.2375}'::JSONB,
  25000,
  '[{"eventId": "evt-concert-01", "name": "Sunset Electronic Symphony", "category": "Live Concert", "attendanceExpected": 18000, "status": "scheduled"}]'::JSONB
),
(
  'venue-aquatic-center',
  'North Aquatic Center',
  'zone-north-courts',
  '{"lat": 28.5918, "lng": 77.2315}'::JSONB,
  15000,
  '[{"eventId": "evt-swim-01", "name": "4x100m Freestyle Relay Heats", "category": "Swimming", "attendanceExpected": 12500, "status": "scheduled"}]'::JSONB
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity;

-- Transit Edges Seed
INSERT INTO public.transit_edges (id, source_zone_id, target_zone_id, mode, capacity_per_hour, current_flow_rate, congestion_index, status, polyline)
VALUES
('edge-hub-arena-shuttle', 'zone-transit-hub', 'zone-main-arena', 'express_shuttle', 14000, 11800, 0.84, 'congested', '[[28.5805, 77.2280], [28.5830, 77.2300], [28.5865, 77.2345]]'::JSONB),
('edge-hub-fanpark-shuttle', 'zone-transit-hub', 'zone-fan-park', 'express_shuttle', 12000, 5200, 0.43, 'optimal', '[[28.5805, 77.2280], [28.5780, 77.2320], [28.5765, 77.2370]]'::JSONB),
('edge-promenade-walkway', 'zone-promenade', 'zone-main-arena', 'pedestrian_walkway', 16000, 9100, 0.57, 'optimal', '[[28.5820, 77.2355], [28.5840, 77.2350], [28.5865, 77.2345]]'::JSONB),
('edge-fanpark-promenade', 'zone-fan-park', 'zone-promenade', 'pedestrian_walkway', 15000, 7400, 0.49, 'optimal', '[[28.5765, 77.2370], [28.5790, 77.2360], [28.5820, 77.2355]]'::JSONB),
('edge-arena-north-courts', 'zone-main-arena', 'zone-north-courts', 'pedestrian_walkway', 10000, 3100, 0.31, 'optimal', '[[28.5865, 77.2345], [28.5890, 77.2330], [28.5915, 77.2310]]'::JSONB)
ON CONFLICT (id) DO UPDATE SET
  capacity_per_hour = EXCLUDED.capacity_per_hour,
  current_flow_rate = EXCLUDED.current_flow_rate;
