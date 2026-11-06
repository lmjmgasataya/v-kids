"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { PHOTO_MAX_PX } from "@/lib/constants";

// Same quality the server's sharp fallback uses (src/lib/photoUpload.ts).
const PHOTO_JPEG_QUALITY = 0.82;

// Draws the source onto the canvas scaled down to fit PHOTO_MAX_PX. Photos are resized here,
// in the browser, so the server can store the upload as-is instead of running sharp on it.
function drawScaled(canvas: HTMLCanvasElement, source: CanvasImageSource, width: number, height: number): boolean {
  const scale = Math.min(1, PHOTO_MAX_PX / Math.max(width, height));
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return true;
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", PHOTO_JPEG_QUALITY));
}

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

    Promise.resolve()
      .then(() => {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera API unavailable");
        return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      })
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
      .catch(() => {
        if (cancelled) return;
        setError("Couldn't access the camera. Please allow camera permission, or upload a photo instead.");
        setMode("idle");
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [mode]);

  // Swaps the resized JPEG into the file input the form submits (doesn't fire onChange).
  function setInputFile(blob: Blob) {
    if (!fileInputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(new File([blob], "photo.jpg", { type: "image/jpeg" }));
    fileInputRef.current.files = dt.files;
  }

  async function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    // Always save the true (unmirrored) frame, even though the live preview may be mirrored.
    if (!drawScaled(canvas, video, video.videoWidth, video.videoHeight)) return;
    const blob = await canvasToJpeg(canvas);
    if (!blob) return;
    setInputFile(blob);
    setCapturedPreview(canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY));
    setMode("captured");
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

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = canvasRef.current;
    try {
      // Applies EXIF orientation while decoding, so the canvas copy comes out upright.
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const drawn = canvas !== null && drawScaled(canvas, bitmap, bitmap.width, bitmap.height);
      bitmap.close();
      const blob = drawn ? await canvasToJpeg(canvas) : null;
      if (blob) {
        setInputFile(blob);
        setCapturedPreview(canvas!.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY));
        setMode("captured");
        return;
      }
    } catch {
      // The browser can't decode it (e.g. HEIC outside Safari) — upload the original
      // instead; the server resizes anything that isn't already small.
    }
    try {
      const reader = new FileReader();
      reader.onerror = () => setError("Couldn't read that photo. Please try uploading a different file.");
      reader.onload = () => {
        setCapturedPreview(reader.result as string);
        setMode("captured");
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Couldn't read that photo. Please try uploading a different file.");
    }
  }

  function openFilePicker() {
    try {
      fileInputRef.current?.click();
    } catch {
      setError("File upload isn't available on this device. Please try again or continue without a photo.");
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Photo {required && <span className="text-red-500">*</span>}
      </label>

      {error ? (
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept="image/*"
          required={required}
          onChange={handleFileSelect}
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
          {mode === "idle" ? (
            <div className="grid max-w-[280px] grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("live")}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-6 text-gray-500 transition-[transform,background-color,color,box-shadow,border-color] duration-150 active:scale-95 hover:-translate-y-0.5 hover:border-kids-navy/50 hover:text-kids-navy hover:shadow-md"
              >
                <span className="text-3xl">📷</span>
                <span className="text-sm font-semibold">Open Camera</span>
              </button>
              <button
                type="button"
                onClick={openFilePicker}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-6 text-gray-500 transition-[transform,background-color,color,box-shadow,border-color] duration-150 active:scale-95 hover:-translate-y-0.5 hover:border-kids-navy/50 hover:text-kids-navy hover:shadow-md"
              >
                <span className="text-3xl">🖼️</span>
                <span className="text-sm font-semibold">Upload Photo</span>
              </button>
            </div>
          ) : (
            <div className="relative aspect-square max-w-[240px] overflow-hidden rounded-xl border border-gray-300 bg-black">
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
          )}
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
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
