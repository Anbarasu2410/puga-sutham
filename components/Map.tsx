"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface FireEvent {
    id: string;
    latitude: number;
    longitude: number;
    isWithinDriftCone: boolean;
}

interface MapProps {
    siteLat: number;
    siteLon: number;
    fires: FireEvent[];
    reports?: any[];
}

export function Map({ siteLat, siteLon, fires, reports = [] }: MapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-full h-[400px] bg-slate-200 animate-pulse rounded-lg" />;
    }

    return (
        <MapContainer
            key={`${siteLat}-${siteLon}`} // Forces re-mount on GPS change
            center={[siteLat, siteLon]}
            zoom={11}
            className="w-full h-[500px] rounded-xl z-0 relative"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Central Target Site Marker */}
            <Marker position={[siteLat, siteLon]}>
                <Popup className="font-semibold text-zinc-800">
                    Protected Zone Target
                </Popup>
            </Marker>

            {/* 50km reference circle */}
            <Circle
                center={[siteLat, siteLon]}
                pathOptions={{ color: "#0369A1", fillColor: "transparent", weight: 1, dashArray: "5, 5" }}
                radius={50000}
            />

            {/* Fire Markers */}
            {fires.map((fire) => (
                <Circle
                    key={fire.id}
                    center={[fire.latitude, fire.longitude]}
                    pathOptions={{
                        color: fire.isWithinDriftCone ? "#DC2626" : "#D97706",
                        fillColor: fire.isWithinDriftCone ? "#DC2626" : "#D97706",
                        fillOpacity: 0.5,
                    }}
                    radius={2000}
                >
                    <Popup>
                        <p className="font-bold">Detected Fire</p>
                        <p>{fire.isWithinDriftCone ? "Risk: DRIFT HEADING TO SITE" : "Risk: Low"}</p>
                    </Popup>
                </Circle>
            ))}
            {/* Citizen Smoke Reports */}
            {reports.map((report) => (
                <Circle
                    key={report.id}
                    center={[report.latitude, report.longitude]}
                    pathOptions={{
                        color: "#9333EA", // Vibrant Purple
                        fillColor: "#9333EA",
                        fillOpacity: 1.0,
                    }}
                    radius={1500}
                >
                    <Popup>
                        <p className="font-bold text-[#9333EA]">Citizen Smoke Report</p>
                        <p>AI Validated (Confidence: {Math.round(report.confidenceScore * 100)}%)</p>
                    </Popup>
                </Circle>
            ))}
        </MapContainer>
    );
}
