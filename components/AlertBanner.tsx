"use client";

import { AlertTriangle, CheckCircle, Info, Watch, Activity } from "lucide-react";

type AlertStatus = "CLEARED" | "UNVERIFIED" | "WATCH" | "WARNING" | "CONFIRMED" | "DECAYING";

interface AlertBannerProps {
    status: AlertStatus;
    estimatedArrivalMinutes?: number | null;
    hasCitizenReports?: boolean;
    score?: number;
}

export function AlertBanner({ status, estimatedArrivalMinutes, hasCitizenReports = false, score = 0 }: AlertBannerProps) {
    if (status === "CLEARED") {
        return (
            <div className="w-full bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 px-4 py-3 flex items-center justify-center gap-3 backdrop-blur-md">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-semibold text-sm tracking-wide">SYSTEM CLEARED / LOW RISK (Score: {score}/100)</p>
            </div>
        );
    }

    if (status === "DECAYING") {
        return (
            <div className="w-full bg-blue-500/10 border-b border-blue-500/20 text-blue-700 px-4 py-3 flex items-center justify-center gap-3 backdrop-blur-md">
                <Activity className="w-5 h-5 flex-shrink-0" />
                <p className="font-bold text-sm tracking-wide uppercase">
                    Risk Decaying — Anomaly dissipating (Score: {score}/100)
                </p>
            </div>
        );
    }

    if (status === "UNVERIFIED" || status === "WATCH") {
        return (
            <div className="w-full bg-amber-400/20 border-b border-amber-500/30 text-amber-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-4 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    {status === "WATCH" ? <Watch className="w-5 h-5 flex-shrink-0" /> : <Info className="w-5 h-5 flex-shrink-0" />}
                    <p className="font-bold text-sm tracking-wide uppercase">
                        {status === "WATCH" ? "Watch: Predicted smoke-drift risk" : "Unverified: Data anomaly under investigation"}
                        {" "}(Score: {score}/100)
                    </p>
                </div>
                {estimatedArrivalMinutes !== undefined && estimatedArrivalMinutes !== null && (
                    <div className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ring-1 ring-amber-500/30">
                        ETA: ~{Math.round(estimatedArrivalMinutes)} MIN
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
                    {status === "CONFIRMED" ? "Critical Alert — Protective Action Recommended" : "Warning: Approaching drift risk"}
                    {" "}(Score: {score}/100)
                </p>
            </div>
            {estimatedArrivalMinutes !== undefined && estimatedArrivalMinutes !== null && (
                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-inner ring-1 ring-white/50">
                    Estimated arrival: ~{estimatedArrivalMinutes} min
                </div>
            )}
        </div>
    );
}
