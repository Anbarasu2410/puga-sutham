import { Suspense } from "react";
import { AlertBanner } from "../components/AlertBanner";
import { ReadingsChart } from "../components/ReadingsChart";
import { PhotoUpload } from "../components/PhotoUpload";
import { MapWrapper } from "../components/MapWrapper";
import { DataSyncer } from "../components/DataSyncer";
import { LocateMeButton } from "../components/LocateMeButton";
import { KEELADI_LAT, KEELADI_LON } from "../lib/weather";
import { db } from "../lib/db";
import { calculateRisk } from "../lib/risk";

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
    return { fires: [], windReadings: [], smokeReports: [], clearReports: [], currentWind: { windSpeedKmh: 0, windDirectionDeg: 0 } };
  }

  // 1. Get recent fires
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const firesRes = await db.execute({
    sql: `SELECT * FROM fire_events WHERE detected_at > ?`,
    args: [oneDayAgo]
  });

  // 2. Get recent wind readings
  const windRes = await db.execute({
    sql: `SELECT recorded_at as recordedAt, wind_speed_kmh as windSpeedKmh, wind_direction_deg as windDirectionDeg FROM wind_readings ORDER BY recorded_at DESC LIMIT 1`,
    args: []
  });

  const windReading = windRes.rows.length > 0 ? {
    recordedAt: windRes.rows[0].recordedAt as string,
    windSpeedKmh: Number(windRes.rows[0].windSpeedKmh),
    windDirectionDeg: Number(windRes.rows[0].windDirectionDeg)
  } : { windSpeedKmh: 0, windDirectionDeg: 0 };

  const windResAll = await db.execute({
    sql: `SELECT recorded_at as recordedAt, wind_speed_kmh as windSpeedKmh FROM wind_readings ORDER BY recorded_at DESC LIMIT 20`,
    args: []
  });

  const mappedWind = windResAll.rows.map((r: any) => ({
    recordedAt: r.recordedAt as string,
    windSpeedKmh: Number(r.windSpeedKmh)
  })); // still keeping for chart

  // 3. Get ALL recent verified citizen reports (both smoke and clear)
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

  // Format fires properly
  const mappedFires = firesRes.rows.map((f: any) => ({
    id: f.id as string,
    latitude: Number(f.latitude),
    longitude: Number(f.longitude),
    detectedAt: new Date(f.detected_at as string).getTime()
  }));

  return {
    fires: mappedFires,
    smokeReports: allSmokeReports,
    clearReports: clearReports,
    windReadings: mappedWind, // Array for graph
    currentWind: windReading // Latest for risk calculation
  };
}

export default async function DashboardPage(props: { searchParams: Promise<{ lat?: string, lon?: string }> }) {
  const searchParams = await props.searchParams;

  // Override coordinates if the user clicked "Protect My Location"
  const siteLat = searchParams.lat ? parseFloat(searchParams.lat) : KEELADI_LAT;
  const siteLon = searchParams.lon ? parseFloat(searchParams.lon) : KEELADI_LON;
  const isCustomLocation = !!searchParams.lat && !!searchParams.lon;

  const data = await getDashboardData();

  // CALCULATE NON-DESTRUCTIVE RISK
  const riskResult = calculateRisk({
    fires: data.fires,
    smokeReports: data.smokeReports,
    clearReports: data.clearReports,
    windSpeedKmh: data.currentWind.windSpeedKmh,
    windDirectionDeg: data.currentWind.windDirectionDeg,
    siteLat: siteLat,
    siteLon: siteLon
  });

  return (
    <main className="min-h-screen bg-zinc-50 pb-12 font-sans selection:bg-zinc-200">

      {/* Sleek Alert Banner across the very top */}
      <div className="sticky top-0 z-50 shadow-sm">
        <AlertBanner
          status={riskResult.state}
          estimatedArrivalMinutes={riskResult.etaMinutes}
          hasCitizenReports={data.smokeReports.length > 0}
          score={riskResult.score}
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
                ? "Predicted smoke-drift risk for your GPS coordinates."
                : "Global Smoke Drift Monitor. Predicted smoke-drift risk of agricultural burning."}
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

            {/* Detailed Risk Breakdown Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200/80">
              <h3 className="text-xl font-bold text-zinc-900 mb-4">Risk Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Score</p>
                  <p className="text-2xl font-black text-slate-800">{riskResult.score} / 100</p>
                  <p className="text-xs text-zinc-400 mt-1">{riskResult.state}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Nearest Fire</p>
                  <p className="text-xl font-bold text-slate-800">
                    {riskResult.closestFireDist ? `${riskResult.closestFireDist.toFixed(1)} km` : "N/A"}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">Satellite offset</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Live Wind</p>
                  <p className="text-xl font-bold text-slate-800">
                    {data.currentWind.windSpeedKmh > 0 ? `${data.currentWind.windSpeedKmh} km/h` : "Calm"}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">Bearing {data.currentWind.windDirectionDeg}°</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Evidence</p>
                  <p className="text-sm font-bold text-slate-800">🔥 {riskResult.breakdown.fireCount} Space</p>
                  <p className="text-sm font-bold text-[#9333EA]">💨 {riskResult.breakdown.smokeCount} Smoke</p>
                  <p className="text-sm font-bold text-[#10B981]">✅ {riskResult.breakdown.clearCount} Clear</p>
                </div>
              </div>
            </div>

            <Suspense fallback={<div className="w-full h-[500px] bg-zinc-200 animate-pulse rounded-xl" />}>
              <div className="bg-white p-1.5 rounded-xl shadow-sm border border-zinc-200 overflow-hidden ring-1 ring-black/[0.02]">
                <MapWrapper siteLat={siteLat} siteLon={siteLon} fires={data.fires} smokeReports={data.smokeReports} clearReports={data.clearReports} />
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
