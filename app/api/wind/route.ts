import { NextResponse } from "next/server";
import { fetchCurrentWind } from "../../../lib/weather";
import { redis } from "../../../lib/redis";

const CACHE_KEY = "wind_data_current";
const CACHE_TTL_SECONDS = 900; // 15 mins

export async function GET() {
    try {
        // Attempt to get from cache first
        try {
            const cached = await redis.get(CACHE_KEY);
            if (cached) {
                return NextResponse.json({ success: true, data: cached });
            }
        } catch (redisError) {
            console.warn("Redis is not available or failed:", redisError);
            // Fallback to direct fetch if redis is not configured
        }

        // Fetch fresh data
        const rawData = await fetchCurrentWind();

        try {
            await redis.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(rawData));
        } catch (redisError) {
            console.warn("Redis set failed:", redisError);
        }

        return NextResponse.json({ success: true, data: rawData });
    } catch (error) {
        console.error("Error in /api/wind:", error);

        return NextResponse.json(
            { success: false, error: { message: "Failed to fetch wind data" } },
            { status: 500 }
        );
    }
}
