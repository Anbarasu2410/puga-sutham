const { createClient } = require("@libsql/client");

async function main() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL || "file:local.db",
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const scenario = process.argv[2];

    if (scenario === "danger") {
        console.log("Simulating HIGH RISK smoke drift...");
        const fireId = "mock_fire_danger";

        // Keeladi coords: 9.851, 78.219
        // Put fire slightly West of Keeladi
        await db.execute({
            sql: `INSERT OR REPLACE INTO fire_events (id, source, latitude, longitude, confidence, detected_at) VALUES (?, 'firms', 9.851, 78.150, 0.9, ?)`,
            args: [fireId, new Date().toISOString()]
        });

        // Wind blowing from West (270 degrees) at 15 km/h
        await db.execute({
            sql: `INSERT INTO wind_readings (id, latitude, longitude, wind_speed_kmh, wind_direction_deg, recorded_at) VALUES (?, 9.851, 78.219, 15, 270, ?)`,
            args: ['mock_wind_1', new Date().toISOString()]
        });

        // Mark as drift alert active
        await db.execute({
            sql: `INSERT OR REPLACE INTO drift_alerts (id, fire_event_id, bearing_to_site, is_within_drift_cone, estimated_arrival_minutes, computed_at) VALUES (?, ?, 90, 1, 45, ?)`,
            args: ['mock_alert_1', fireId, new Date().toISOString()]
        });

        console.log("Done! Refresh your browser to see the RED HIGH RISK banner.");
    }

    else if (scenario === "warning") {
        console.log("Simulating WARNING (fire exists, but wind blowing away)...");
        const fireId = "mock_fire_warning";

        // Put fire South of Keeladi
        await db.execute({
            sql: `INSERT OR REPLACE INTO fire_events (id, source, latitude, longitude, confidence, detected_at) VALUES (?, 'firms', 9.750, 78.219, 0.8, ?)`,
            args: [fireId, new Date().toISOString()]
        });

        // BUT wind blowing from South (meaning smoke goes North, hits site!)
        // Wait, let's make wind blow from North (meaning smoke goes South, away from site)
        await db.execute({
            sql: `INSERT INTO wind_readings (id, latitude, longitude, wind_speed_kmh, wind_direction_deg, recorded_at) VALUES (?, 9.851, 78.219, 12, 0, ?)`,
            args: ['mock_wind_2', new Date().toISOString()]
        });

        // Alert strictly says NOT within cone (0)
        await db.execute({
            sql: `INSERT OR REPLACE INTO drift_alerts (id, fire_event_id, bearing_to_site, is_within_drift_cone, estimated_arrival_minutes, computed_at) VALUES (?, ?, 0, 0, NULL, ?)`,
            args: ['mock_alert_2', fireId, new Date().toISOString()]
        });

        console.log("Done! Refresh your browser to see the AMBER WARNING banner.");
    }

    else if (scenario === "clear") {
        console.log("Clearing all mock data to return to SAFE state...");
        await db.execute("DELETE FROM drift_alerts WHERE id LIKE 'mock_%'");
        await db.execute("DELETE FROM fire_events WHERE id LIKE 'mock_%'");
        await db.execute("DELETE FROM wind_readings WHERE id LIKE 'mock_%'");
        console.log("Done! Refresh your browser to see the GREEN SAFE banner.");
    }

    else {
        console.log("How to use this testing tool:");
        console.log("node --env-file=.env.local mock-scenarios.js danger");
        console.log("node --env-file=.env.local mock-scenarios.js warning");
        console.log("node --env-file=.env.local mock-scenarios.js clear");
    }
}

main();
