import { Suspense } from "react";
import { AlertBanner } from "../components/AlertBanner";
import { ReadingsChart } from "../components/ReadingsChart";
import { PhotoUpload } from "../components/PhotoUpload";
import { MapWrapper } from "../components/MapWrapper";
import { DataSyncer } from "../components/DataSyncer";
import { LocateMeButton } from "../components/LocateMeButton";
import { KEELADI_LAT, KEELADI_LON } from "../lib/weather";
import { db } from "../lib/db";

// Helper to calculate distance in km between two coordinates
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon1 - lon2) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const revalidate = 0; // Don't cache page heavily so we see fresh data

async function getDashboardData() {
  if (!db) {
    return { fires: [], windReadings: [], status: "safe" as const, eta: null };
  }

  // 1. Get recent fires
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const firesRes = await db.execute({
    sql: `SELECT * FROM fire_events WHERE detected_at > ?`,
    args: [oneDayAgo]
  });

  // 2. Get active alerts
  const alertsRes = await db.execute({
    sql: `SELECT * FROM drift_alerts WHERE is_within_drift_cone = 1 ORDER BY computed_at DESC LIMIT 10`,
    args: []
  });

  // 3. Get recent wind readings
  const windRes = await db.execute({
    sql: `SELECT recorded_at as recordedAt, wind_speed_kmh as windSpeedKmh FROM wind_readings ORDER BY recorded_at DESC LIMIT 20`,
    args: []
  });

  const mappedWind = windRes.rows.map((r: any) => ({
    recordedAt: r.recordedAt as string,
    windSpeedKmh: Number(r.windSpeedKmh)
  }));

  // 4. Get ALL recent verified citizen reports (both smoke and clear)
  const reportsRes = await db.execute({
    sql: `SELECT * FROM citizen_reports WHERE submitted_at > ?`,
    args: [oneDayAgo]
  });

  const allReports = reportsRes.rows.map((r: any) => ({
    id: r.id as string,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    classification: r.classification as string,
    confidenceScore: Number(r.confidence_score),
    submittedAt: new Date(r.submitted_at).getTime()
  }));

  const allSmokeReports = allReports.filter((r: any) => r.classification === "smoke");
  const clearReports = allReports.filter((r: any) => r.classification === "clear");

  // CITIZEN OVERRIDE LOGIC 1: Remove old Smoke Reports if a newer Clear report exists
  const activeSmokeReports = [];
  for (const sr of allSmokeReports) {
    const isResolved = clearReports.some((cr: any) => {
      const dist = getDistanceFromLatLonInKm(sr.latitude, sr.longitude, cr.latitude, cr.longitude);
      // Increased to 30km because Laptop Wi-Fi geolocation can regularly jump 10-20km
      return dist <= 30 && cr.submittedAt > sr.submittedAt;
    });
    if (!isResolved) activeSmokeReports.push(sr);
  }

  // CITIZEN OVERRIDE LOGIC 2: Filter out NASA fires if a newer "Clear" report exists within 5km
  const activeAlertIds = new Set(alertsRes.rows.map((r: any) => r.fire_event_id));

  const mappedFires: { id: string; latitude: number; longitude: number; isWithinDriftCone: boolean }[] = [];
  for (const f of firesRes.rows) {
    const fireLat = Number(f.latitude);
    const fireLon = Number(f.longitude);
    const fireTime = new Date(f.detected_at as string).getTime();

    // Check if citizen marked it as CLEAR after NASA detected it
    const isResolvedByCitizen = clearReports.some((cr: any) => {
      const dist = getDistanceFromLatLonInKm(fireLat, fireLon, cr.latitude, cr.longitude);
      return dist <= 30 && cr.submittedAt > fireTime; // Within 30km and newer than the fire
    });

    if (!isResolvedByCitizen) {
      mappedFires.push({
        id: f.id as string,
        latitude: fireLat,
        longitude: fireLon,
        isWithinDriftCone: activeAlertIds.has(f.id)
      });
    }
  }

  // Determine global status based on the FILTERED fires
  let globalStatus: "safe" | "warning" | "danger" = "safe";
  let eta: number | null = null;
  const activeDrifts = mappedFires.filter((f: any) => f.isWithinDriftCone);

  if (activeDrifts.length > 0) {
    const etas = alertsRes.rows
      .filter((r: any) => mappedFires.some((mf: any) => mf.id === r.fire_event_id))
      .map((r: any) => Number(r.estimated_arrival_minutes))
      .filter((val: number) => val > 0);

    if (etas.length > 0) {
      eta = Math.min(...etas);
      if (eta <= 120) globalStatus = "danger";
      else globalStatus = "warning";
    } else {
      globalStatus = "danger";
    }
  } else if (mappedFires.length > 0) {
    globalStatus = "warning";
  } else if (activeSmokeReports.length > 0) {
    // Highly important: if satellites missed it but a citizen reported smoke, set a warning!
    globalStatus = "warning";
  }

  return {
    fires: mappedFires,
    citizenReports: activeSmokeReports,
    windReadings: mappedWind,
    status: globalStatus,
    eta
  };
}

export default async function DashboardPage(props: { searchParams: Promise<{ lat?: string, lon?: string }> }) {
  const searchParams = await props.searchParams;

  // Override coordinates if the user clicked "Protect My Location"
  const siteLat = searchParams.lat ? parseFloat(searchParams.lat) : KEELADI_LAT;
  const siteLon = searchParams.lon ? parseFloat(searchParams.lon) : KEELADI_LON;
  const isCustomLocation = !!searchParams.lat && !!searchParams.lon;

  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-zinc-50 pb-12 font-sans selection:bg-zinc-200">

      {/* Sleek Alert Banner across the very top */}
      <div className="sticky top-0 z-50 shadow-sm">
        <AlertBanner
          status={data.status}
          estimatedArrivalMinutes={data.eta}
          hasCitizenReports={(data.citizenReports?.length ?? 0) > 0}
        />
      </div>

      <DataSyncer />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl tracking-tight font-bold text-zinc-900 mb-1">
              {isCustomLocation ? "Your Location" : "Puga Sutham Dashboard"}
            </h1>
            <p className="text-sm text-zinc-500 font-medium tracking-wide">
              {isCustomLocation
                ? "Live protective smoke tracking active for your GPS coordinates."
                : "Global Smoke Drift Monitor. Live protective tracking of agricultural burning."}
            </p>
          </div>
          <div className="flex flex-row items-center sm:justify-end gap-3 min-w-[220px]">
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-white shadow-sm border border-zinc-200 rounded-lg px-3 py-1.5 ring-1 ring-black/[0.02]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              LIVE GPS
            </div>
            <LocateMeButton />
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <Suspense fallback={<div className="w-full h-[500px] bg-zinc-200 animate-pulse rounded-xl" />}>
              <div className="bg-white p-1.5 rounded-xl shadow-sm border border-zinc-200 overflow-hidden ring-1 ring-black/[0.02]">
                <MapWrapper siteLat={siteLat} siteLon={siteLon} fires={data.fires} reports={data.citizenReports} />
              </div>
            </Suspense>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <ReadingsChart data={data.windReadings} />
            <PhotoUpload />
          </div>
        </div>
      </div>
    </main>
  );
}
