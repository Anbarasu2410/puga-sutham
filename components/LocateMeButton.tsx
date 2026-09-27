"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";

export function LocateMeButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLocate = () => {
        setLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Push the new coordinates into the URL to trigger the dashboard shift!
                    router.push(`/?lat=${latitude}&lon=${longitude}`);
                    setLoading(false);
                },
                (error) => {
                    console.error("Geolocation failed:", error);
                    alert("Please allow location access in your browser to use this feature.");
                    setLoading(false);
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLocate}
            disabled={loading}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-semibold tracking-wide py-1.5 px-4 rounded-lg shadow-sm transition-all disabled:opacity-70"
        >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
            {loading ? "Locating..." : "Protect My Location"}
        </button>
    );
}
