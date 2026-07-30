"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

interface Props {
  name: string;
  initialPreviewUrl?: string | null;
  required?: boolean;
}

type Mode = "existing" | "idle" | "live" | "captured";

export function PhotoCapture({ name, initialPreviewUrl, required }: Props) {
  const [mode, setMode] = useState<Mode>(initialPreviewUrl ? "existing" : "idle");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        // Mirror the preview unless we know we landed on the rear camera — front-facing
        // (or unreported, e.g. most laptop webcams) feels backwards to look at unmirrored.
        const facingMode = stream.getVideoTracks()[0]?.getSettings().facingMode;
        setMirrored(facingMode !== "environment");
        setCameraReady(true);
      })
      .catch(() => setError("Couldn't access the camera. Please allow camera permission, or upload a photo instead."));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [mode]);

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Always save the true (unmirrored) frame, even though the live preview may be mirrored.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob || !fileInputRef.current) return;
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        setCapturedPreview(canvas.toDataURL("image/jpeg"));
        setMode("captured");
      },
      "image/jpeg",
      0.9
    );
  }

  function closeCamera() {
    setCameraReady(false);
    setMode("idle");
  }

  function retake() {
    setCapturedPreview(null);
    setCameraReady(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMode("idle");
  }

  function resetToExisting() {
    setCapturedPreview(null);
    setCameraReady(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMode("existing");
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedPreview(reader.result as string);
      setMode("captured");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Photo {required && <span className="text-red-500">*</span>}
      </label>

      {error ? (
        <input
          type="file"
          name={name}
          accept="image/*"
          required={required}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-kids-navy file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
        />
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            name={name}
            accept="image/*"
            required={required && mode !== "existing"}
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="relative aspect-square max-w-[240px] overflow-hidden rounded-xl border border-gray-300 bg-black">
            {mode === "idle" && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-white/80">
                <button
                  type="button"
                  onClick={() => setMode("live")}
                  className="flex flex-col items-center gap-1 hover:text-white transition"
                >
                  <span className="text-3xl">📷</span>
                  <span className="text-sm font-semibold">Open camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 hover:text-white transition"
                >
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm font-semibold">Upload photo</span>
                </button>
              </div>
            )}
            {mode === "existing" && initialPreviewUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- preview of the current stored photo
              <img src={initialPreviewUrl} alt="Current photo" className="h-full w-full object-cover" />
            )}
            {mode === "captured" && capturedPreview && (
              // eslint-disable-next-line @next/next/no-img-element -- frame captured from the live camera canvas
              <img src={capturedPreview} alt="Captured photo" className="h-full w-full object-cover" />
            )}
            {mode === "live" && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={mirrored ? { transform: "scaleX(-1)" } : undefined}
              />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-2 flex gap-2">
            {mode === "live" && (
              <>
                <button
                  type="button"
                  onClick={takePhoto}
                  disabled={!cameraReady}
                  className="bg-kids-navy hover:bg-kids-navy/90 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
                >
                  Take photo
                </button>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="text-sm font-semibold text-gray-600 hover:underline"
                >
                  Close camera
                </button>
              </>
            )}
            {(mode === "existing" || mode === "captured") && (
              <button type="button" onClick={retake} className="text-sm font-semibold text-kids-navy hover:underline">
                Change photo
              </button>
            )}
            {mode === "idle" && initialPreviewUrl && (
              <button
                type="button"
                onClick={resetToExisting}
                className="text-sm font-semibold text-gray-600 hover:underline"
              >
                Undo, keep current photo
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
