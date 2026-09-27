CREATE TABLE IF NOT EXISTS fire_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  confidence REAL,
  detected_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wind_readings (
  id TEXT PRIMARY KEY,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  wind_speed_kmh REAL NOT NULL,
  wind_direction_deg REAL NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drift_alerts (
  id TEXT PRIMARY KEY,
  fire_event_id TEXT NOT NULL,
  bearing_to_site REAL NOT NULL,
  is_within_drift_cone INTEGER NOT NULL,
  estimated_arrival_minutes REAL,
  computed_at TEXT NOT NULL,
  FOREIGN KEY (fire_event_id) REFERENCES fire_events(id)
);

CREATE TABLE IF NOT EXISTS citizen_reports (
  id TEXT PRIMARY KEY,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  classification TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  submitted_at TEXT NOT NULL
);
