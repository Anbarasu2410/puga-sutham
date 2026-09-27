import { NextResponse } from "next/server";
import { fetchActiveFires } from "../../../lib/firms";
import { redis } from "../../../lib/redis";
import { db } from "../../../lib/db";

const CACHE_KEY = "fires_data_current";
const CACHE_TTL_SECONDS = 1200; // 20 mins

export async function GET() {
    try {
        let cachedFires = null;
        try {
            cachedFires = await redis.get(CACHE_KEY);
            if (cachedFires) {
                return NextResponse.json({ success: true, data: cachedFires });
            }
        } catch (redisError) {
            console.warn("Redis is not available or failed:", redisError);
        }

        // Cache miss or Redis down: fetch fresh data
        const rawFires = await fetchActiveFires();
        const finalFires = [];

        // Store new ones in Turso
        for (const f of rawFires) {
            // Use a consistent ID format to avoid duplicating the same firm event
            const fireId = `firms_${f.detectedAt}_${f.latitude}_${f.longitude}`;
            finalFires.push({
                id: fireId,
                ...f
            });

            // Insert into Turso using IGNORE on conflict (wait, Turso SQLite doesn't natively have IGNORE without unique constraint on ID)
            // Since it's a PRIMARY KEY, INSERT OR IGNORE works perfectly to avoid dupes!
            try {
                if (db) {
                    await db.execute({
                        sql: `INSERT OR IGNORE INTO fire_events (id, source, latitude, longitude, confidence, detected_at) 
                  VALUES (?, 'firms', ?, ?, ?, ?)`,
                        args: [fireId, f.latitude, f.longitude, f.confidence, f.detectedAt]
                    });
                }
            } catch (dbErr) {
                console.warn("Could not insert fire into DB:", dbErr);
            }
        }

        try {
            if (finalFires.length >= 0) {
                await redis.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(finalFires));
            }
        } catch (redisError) {
            console.warn("Redis set failed:", redisError);
        }

        return NextResponse.json({ success: true, data: finalFires });
    } catch (error) {
        console.error("Error in /api/fires:", error);

        // Per API.md: "if unreachable or key invalid, /api/fires returns the last cached Redis value if available, otherwise an empty array with a stale: true flag"
        // Since we already failed to return earlier if it was valid cache, we might not have it. But wait, `redis.get()` above returned if it existed.
        // If we're here, cache is empty or expired. We should try to read it anyway if we can or just return stale array.
        // However, if process fails (e.g. no NASA MAP KEY), return stale flag.

        return NextResponse.json({
            success: true,
            data: [],
            stale: true
        });
    }
}
