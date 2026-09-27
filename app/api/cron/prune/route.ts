import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export const runtime = "edge"; // Required for Cloudflare Pages

export async function GET(request: Request) {
    // 1. SECURITY: Only allow the request if the correct secret password is provided
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If the SECRET is missing in the .env, or the header doesn't match, block the system.
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized: Invalid or missing Cron Secret" }, { status: 401 });
    }

    try {
        if (!db) {
            return NextResponse.json({ error: "Database not connected" }, { status: 500 });
        }

        // 2. PRUNE ALERTS (Children first, because of Foreign Key constraints)
        await db.execute("DELETE FROM drift_alerts WHERE computed_at < datetime('now', '-14 days')");

        // 3. PRUNE FIRES (Parents)
        await db.execute("DELETE FROM fire_events WHERE detected_at < datetime('now', '-14 days')");

        // 4. PRUNE WIND READINGS
        await db.execute("DELETE FROM wind_readings WHERE recorded_at < datetime('now', '-14 days')");

        // 5. PRUNE CITIZEN REPORTS
        await db.execute("DELETE FROM citizen_reports WHERE submitted_at < datetime('now', '-14 days')");

        return NextResponse.json({
            success: true,
            message: "Database successfully pruned of data older than 14 days."
        });

    } catch (error) {
        console.error("Database pruning failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
