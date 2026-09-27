"use client";

import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./Map").then(mod => mod.Map), {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-slate-200 animate-pulse rounded-lg" />
});

export function MapWrapper(props: any) {
    return <DynamicMap {...props} />;
}
