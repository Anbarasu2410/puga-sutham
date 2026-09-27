"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, UploadCloud, Loader2, X } from "lucide-react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import { classifyImage } from "../lib/model";
import { KEELADI_LAT, KEELADI_LON } from "../lib/weather";

export function PhotoUpload() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [result, setResult] = useState<{ classification: "smoke" | "clear", confidence: number } | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const router = useRouter();

    const [isDesktop, setIsDesktop] = useState(false);
    const [showWebcam, setShowWebcam] = useState(false);
    const webcamRef = useRef<Webcam>(null);

    useEffect(() => {
        setIsDesktop(!(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)));
    }, []);

    const captureScreenshot = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setShowWebcam(false);
                processDataUrl(imageSrc);
            }
        }
    }, [webcamRef]);

    const processDataUrl = (dataUrl: string) => {
        setStatus("loading");
        setResult(null);

        if (imageRef.current) {
            // We must wait for the img tag to physically finish rendering the new src
            // before we allow TensorFlow to read its pixels.
            imageRef.current.onload = async () => {
                try {
                    // Attempt to classify locally in browser using TF.js
                    const prediction = await classifyImage(imageRef.current!);
                    setResult(prediction);

                    // Get User location, or fallback to site location for hackathon MVP
                    let lat = KEELADI_LAT;
                    let lon = KEELADI_LON;

                    if ("geolocation" in navigator) {
                        try {
                            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(resolve, reject);
                            });
                            lat = position.coords.latitude;
                            lon = position.coords.longitude;
                        } catch (err) {
                            console.warn("Geolocation blocked/failed, falling back to Keeladi coords");
                        }
                    }

                    // Submit the validated TF.js result directly to backend
                    const res = await fetch("/api/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            latitude: lat,
                            longitude: lon,
                            classification: prediction.classification,
                            confidenceScore: prediction.confidence
                        })
                    });

                    if (!res.ok) throw new Error("Failed to submit result");

                    setStatus("success");
                    router.refresh(); // Refresh dashboard to show the new purple marker
                } catch (err) {
                    console.error("Classification/Upload failed:", err);
                    setStatus("error");
                }
            };

            // Trigger the image load
            imageRef.current.src = dataUrl;
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            if (event.target?.result) {
                processDataUrl(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="w-full bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md flex flex-col gap-4 ring-1 ring-black/[0.03]">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Citizen Reporting</h3>

            <p className="text-slate-500 text-sm font-medium">
                Verify anomalous smoke drift. AI runs entirely on edge.
            </p>

            {/* Hidden inputs for both options */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
                id="cameraInput"
                disabled={status === "loading"}
            />
            <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="uploadInput"
                disabled={status === "loading"}
            />

            {showWebcam ? (
                <div className="flex flex-col gap-3 relative rounded-xl overflow-hidden bg-black object-cover">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "environment" }}
                        className="w-full rounded-xl"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                        <button
                            onClick={() => setShowWebcam(false)}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white transition-all shadow-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <button
                            onClick={captureScreenshot}
                            className="bg-white hover:bg-slate-100 p-4 rounded-full text-slate-900 transition-all shadow-xl ring-4 ring-white/30"
                        >
                            <Camera className="w-7 h-7" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {/* If on desktop, intercept "Take Photo" to open the WebRTC webcam instead of a file input */}
                    {isDesktop ? (
                        <button
                            onClick={() => setShowWebcam(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer transition-all font-bold text-sm tracking-wide
                  ${status === "loading" ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg"}`}
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Processing AI...</>
                            ) : (
                                <><Camera className="w-5 h-5" /> Take Photo</>
                            )}
                        </button>
                    ) : (
                        <label
                            htmlFor="cameraInput"
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer transition-all font-bold text-sm tracking-wide
                  ${status === "loading" ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg"}`}
                        >
                            {status === "loading" ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Processing AI...</>
                            ) : (
                                <><Camera className="w-5 h-5" /> Take Photo</>
                            )}
                        </label>
                    )}

                    <label
                        htmlFor="uploadInput"
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer transition-all font-bold text-sm tracking-wide
              ${status === "loading" ? "bg-slate-100 text-slate-400" : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow-md"}`}
                    >
                        {status === "loading" ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Processing AI...</>
                        ) : (
                            <><UploadCloud className="w-5 h-5" /> Upload Photo</>
                        )}
                    </label>
                </div>
            )}

            {/* Visually hidden but required for TF.js analysis */}
            <img ref={imageRef} alt="Preview" className="hidden" crossOrigin="anonymous" />

            {status === "success" && result && (
                <div className={`p-4 rounded-md mt-2 flex justify-between items-center ${result.classification === "smoke" ? "bg-red-50 text-red-800 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"}`}>
                    <div className="flex flex-col">
                        <span className="font-bold capitalize">{result.classification} Detected</span>
                        <span className="text-sm opacity-80">Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <CheckCircle className="w-6 h-6 opacity-80" />
                </div>
            )}

            {status === "error" && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-md text-sm text-center">
                    Failed to process or upload image. (Ensure model files are placed in /public/model).
                </div>
            )}
        </div>
    );
}

// Needed to make it compile with CheckCircle icon properly referenced
import { CheckCircle } from "lucide-react";
