"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function DataSyncer() {
    const router = useRouter();
    const hasSynced = useRef(false);

    useEffect(() => {
        async function syncData() {
            try {
                // 1. Fetch live fires from NASA (or Redis cache if < 20 min old). Auto-saves to Turso DB.
                await fetch("/api/fires");

                // 2. Fetch live wind from Open-Meteo, run drift math, and auto-save Alerts to Turso DB.
                await fetch("/api/drift-check", { method: "POST" });

                // 3. Command Next.js to quietly re-render the page with the newly updated Turso data!
                router.refresh();
            } catch (e) {
                console.error("Failed background real-time sync", e);
            }
        }

        // Only run the initial sync once per mount to prevent spam
        if (!hasSynced.current) {
            hasSynced.current = true;
            syncData();
        }

        // Set up a background loop to automatically sync every 15 minutes while the dashboard is left open
        const interval = setInterval(syncData, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [router]);

    return null; // This component is invisible
}
