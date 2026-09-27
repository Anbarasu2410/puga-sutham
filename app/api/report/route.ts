import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { redis } from "../../../lib/redis";
import { Ratelimit } from "@upstash/ratelimit";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
});

const reportSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    classification: z.enum(["smoke", "clear"]),
    confidenceScore: z.number().min(0).max(1),
});

export async function POST(request: Request) {
    try {
        const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

        try {
            const { success: rateLimitSuccess } = await ratelimit.limit(ip);
            if (!rateLimitSuccess) {
                return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } }, { status: 429 });
            }
        } catch (rlError) {
            console.warn("Ratelimit check failed, bypassing...", rlError);
        }

        const body = await request.json();

        // Zod validation
        const parsed = reportSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "INVALID_INPUT", message: "Invalid payload format. Latitude, longitude, classification, and confidenceScore are required." }
                },
                { status: 400 }
            );
        }

        if (!db) {
            throw new Error("Database not connected");
        }

        const reportId = `report_${crypto.randomUUID()}`;
        const { latitude, longitude, classification, confidenceScore } = parsed.data;

        await db.execute({
            sql: `INSERT INTO citizen_reports (id, latitude, longitude, classification, confidence_score, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                reportId,
                latitude,
                longitude,
                classification,
                confidenceScore,
                new Date().toISOString()
            ]
        });

        // Invalidate the cache for the home page so UI updates instantly
        revalidatePath("/");

        return NextResponse.json({ success: true, data: { id: reportId } }, { status: 201 });
    } catch (error) {
        console.error("Error saving citizen report:", error);
        return NextResponse.json(
            { success: false, error: { code: "SERVER_ERROR", message: "Failed to process citizen report." } },
            { status: 500 }
        );
    }
}
