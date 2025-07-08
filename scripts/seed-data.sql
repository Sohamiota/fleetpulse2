-- Seed data for FleetPulse demo
-- This script populates the database with sample fleet data

-- Insert sample devices
INSERT INTO devices (id, name, type, status) VALUES
('van-001', 'Delivery Van 001', 'delivery', 'online'),
('van-002', 'Delivery Van 002', 'delivery', 'online'),
('van-003', 'Delivery Van 003', 'delivery', 'offline'),
('truck-001', 'Cargo Truck 001', 'cargo', 'online'),
('truck-002', 'Cargo Truck 002', 'cargo', 'warning'),
('drone-001', 'Survey Drone 001', 'drone', 'online'),
('van-004', 'Delivery Van 004', 'delivery', 'online'),
('truck-003', 'Cargo Truck 003', 'cargo', 'online')
ON CONFLICT (id) DO NOTHING;

-- Insert sample telemetry data (last 24 hours)
INSERT INTO telemetry (device_id, timestamp, location, latitude, longitude, speed, temperature, fuel, humidity)
SELECT 
    device_id,
    NOW() - (random() * INTERVAL '24 hours'),
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    latitude,
    longitude,
    speed,
    temperature,
    fuel,
    humidity
FROM (
    SELECT 
        unnest(ARRAY['van-001', 'van-002', 'truck-001', 'truck-002', 'drone-001', 'van-004', 'truck-003']) as device_id,
        37.7749 + (random() - 0.5) * 0.1 as latitude,  -- San Francisco area
        -122.4194 + (random() - 0.5) * 0.1 as longitude,
        (random() * 60 + 20)::integer as speed,  -- 20-80 mph
        (random() * 30 + 70)::integer as temperature,  -- 70-100°F
        (random() * 80 + 20)::integer as fuel,  -- 20-100%
        (random() * 40 + 30)::integer as humidity  -- 30-70%
    FROM generate_series(1, 100)  -- Generate 100 records per device
) as sample_data;

-- Insert sample alerts
INSERT INTO alerts (device_id, alert_type, severity, message, is_active) VALUES
('van-002', 'speed', 'high', 'Vehicle van-002 exceeding speed limit: 85 mph', true),
('truck-002', 'temperature', 'medium', 'High engine temperature detected: 95°F', true),
('van-001', 'fuel', 'medium', 'Low fuel warning: 12%', false),
('truck-001', 'speed', 'high', 'Vehicle truck-001 exceeding speed limit: 82 mph', false),
('drone-001', 'temperature', 'low', 'Temperature sensor reading abnormal: 45°F', true)
ON CONFLICT DO NOTHING;

-- Insert sample geofences (delivery zones)
INSERT INTO geofences (name, description, boundary, is_active) VALUES
(
    'Downtown Delivery Zone',
    'Main delivery area in downtown San Francisco',
    ST_SetSRID(ST_GeomFromText('POLYGON((-122.425 37.770, -122.415 37.770, -122.415 37.780, -122.425 37.780, -122.425 37.770))'), 4326)::geography,
    true
),
(
    'Airport Restricted Zone', 
    'No-fly zone around San Francisco International Airport',
    ST_SetSRID(ST_GeomFromText('POLYGON((-122.385 37.610, -122.375 37.610, -122.375 37.620, -122.385 37.620, -122.385 37.610))'), 4326)::geography,
    true
)
ON CONFLICT DO NOTHING;
