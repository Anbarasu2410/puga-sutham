"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";


interface WindReading {
    recordedAt: string;
    windSpeedKmh: number;
}

interface ReadingsChartProps {
    data: WindReading[];
}

export function ReadingsChart({ data }: ReadingsChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center bg-white rounded-2xl border border-slate-200/60 ring-1 ring-slate-900/5 shadow-sm">
                <p className="text-slate-500 font-medium">No historical readings available.</p>
            </div>
        );
    }

    // Sort chronological
    const sortedData = [...data].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    // Format data for Recharts
    const chartData = sortedData.map(d => {
        const timeString = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(d.recordedAt));
        return {
            time: timeString,
            "Wind Speed (km/h)": d.windSpeedKmh
        };
    });

    return (
        <div className="w-full h-[320px] bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md ring-1 ring-black/[0.03] flex flex-col">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mb-6">Wind Velocity</h3>
            <div className="flex-1 w-full relative -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} width={40} />
                        <Tooltip
                            contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", background: "#fff", fontWeight: 600, fontSize: "13px" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="Wind Speed (km/h)"
                            stroke="#0F172A"
                            strokeWidth={3.5}
                            dot={{ r: 4, fill: "#0F172A", stroke: "#fff", strokeWidth: 2 }}
                            activeDot={{ r: 7, fill: "#0F172A", stroke: "#fff", strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
