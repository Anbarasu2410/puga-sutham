import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { fetchCurrentWind, KEELADI_LAT, KEELADI_LON } from "../../../lib/weather";
import { calculateDriftRisk } from "../../../lib/drift";
import crypto from "crypto";

export async function POST() {
    try {
        if (!db) {
            throw new Error("Database client is not initialized.");
        }

        // 1. Get latest wind reading (either we call Open-Meteo or assume it's already there)
        // To be perfectly robust, we fetch it fresh and log it to Turso right now.
        const windData = await fetchCurrentWind();
        const windId = crypto.randomUUID();

        await db.execute({
            sql: `INSERT INTO wind_readings (id, latitude, longitude, wind_speed_kmh, wind_direction_deg, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                windId,
                KEELADI_LAT,
                KEELADI_LON,
                windData.windSpeedKmh,
                windData.windDirectionDeg,
                windData.recordedAt
            ]
        });

        // 2. Fetch recent fires from Turso
        // We only care about fires detected in the last ~24 hours to avoid alerting on old data.
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const firesQuery = await db.execute({
            sql: `SELECT * FROM fire_events WHERE detected_at > ?`,
            args: [oneDayAgo]
        });

        const alerts = [];
        const driftAlertTime = new Date().toISOString();

        // 3. Compute risk for each fire
        for (const fire of firesQuery.rows) {
            const { bearingToSite, isWithinDriftCone, estimatedArrivalMinutes } = calculateDriftRisk(
                Number(fire.latitude),
                Number(fire.longitude),
                KEELADI_LAT,
                KEELADI_LON,
                windData.windDirectionDeg,
                windData.windSpeedKmh
            );

            const alertId = crypto.randomUUID();

            // 4. Write alert to Turso
            await db.execute({
                sql: `INSERT INTO drift_alerts (id, fire_event_id, bearing_to_site, is_within_drift_cone, estimated_arrival_minutes, computed_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
                args: [
                    alertId,
                    fire.id,
                    bearingToSite,
                    isWithinDriftCone ? 1 : 0,
                    estimatedArrivalMinutes,
                    driftAlertTime
                ]
            });

            alerts.push({
                fireEventId: fire.id,
                isWithinDriftCone,
                estimatedArrivalMinutes
            });
        }

        return NextResponse.json({ success: true, data: alerts });

    } catch (error) {
        console.error("Error in /api/drift-check:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to compute drift checks" } },
            { status: 500 }
        );
    }
}
