"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";

type AlertStatus = "safe" | "warning" | "danger";

interface AlertBannerProps {
    status: AlertStatus;
    estimatedArrivalMinutes?: number | null;
    hasCitizenReports?: boolean;
}

export function AlertBanner({ status, estimatedArrivalMinutes, hasCitizenReports = false }: AlertBannerProps) {
    if (status === "safe") {
        return (
            <div className="w-full bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 px-4 py-3 flex items-center justify-center gap-3 backdrop-blur-md">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-semibold text-sm tracking-wide">SYSTEM SECURE — NO ACTIVE SMOKE DRIFT DETECTED IN RADIUS</p>
            </div>
        );
    }

    if (status === "warning") {
        return (
            <div className="w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-700 px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-4 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p className="font-bold text-sm tracking-wide uppercase">
                        {estimatedArrivalMinutes && estimatedArrivalMinutes > 120
                            ? "Active Monitoring: Distant anomaly detected."
                            : hasCitizenReports && (!estimatedArrivalMinutes)
                                ? "Citizen Alert: Local smoke verified by public network."
                                : "Notice: Anomaly detected nearby, monitoring wind vectors."}
                    </p>
                </div>
                {estimatedArrivalMinutes !== undefined && estimatedArrivalMinutes !== null && estimatedArrivalMinutes > 120 && (
                    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ring-1 ring-amber-500/30">
                        ETA: ~{Math.round(estimatedArrivalMinutes / 60)} HOURS
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full bg-red-600 border-b border-red-700 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-sm">
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
                <p className="font-bold text-sm tracking-wide uppercase">
                    Critical Drift Alert — Protective Action Recommended
                </p>
            </div>
            {estimatedArrivalMinutes !== undefined && estimatedArrivalMinutes !== null && (
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-inner ring-1 ring-white/50">
                    IMPACT IN ~{estimatedArrivalMinutes} MIN
                </div>
            )}
        </div>
    );
}
