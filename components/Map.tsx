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
    isWithinDriftCone?: boolean;
}

interface MapProps {
    siteLat: number;
    siteLon: number;
    fires: FireEvent[];
    smokeReports?: any[];
    clearReports?: any[];
}

export function Map({ siteLat, siteLon, fires, smokeReports = [], clearReports = [] }: MapProps) {
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
                <Marker
                    key={`fire-${fire.id}`}
                    position={[fire.latitude, fire.longitude]}
                >
                    <Popup>
                        <p className="font-bold">NASA Fire Detection</p>
                        <p className="text-zinc-600">Satellite fire observation</p>
                    </Popup>
                </Marker>
            ))}

            {/* Citizen Smoke Reports */}
            {smokeReports.map((report) => (
                <Circle
                    key={`smoke-${report.id}`}
                    center={[report.latitude, report.longitude]}
                    pathOptions={{
                        color: "#9333EA", // Vibrant Purple
                        fillColor: "#9333EA",
                        fillOpacity: 1.0,
                    }}
                    radius={1500}
                >
                    <Popup>
                        <p className="font-bold text-[#9333EA]">Citizen Smoke Observation</p>
                        <p>AI Confidence: {Math.round(report.confidenceScore * 100)}%</p>
                    </Popup>
                </Circle>
            ))}

            {/* Citizen Clear Reports */}
            {clearReports.map((report) => (
                <Circle
                    key={`clear-${report.id}`}
                    center={[report.latitude, report.longitude]}
                    pathOptions={{
                        color: "#10B981", // Emerald Green
                        fillColor: "#10B981",
                        fillOpacity: 0.8,
                    }}
                    radius={1500}
                >
                    <Popup>
                        <p className="font-bold text-[#10B981]">Clear Air Observation</p>
                        <p>AI Confidence: {Math.round(report.confidenceScore * 100)}%</p>
                    </Popup>
                </Circle>
            ))}
        </MapContainer>
    );
}
