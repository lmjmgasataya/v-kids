"use client";

import { useEffect, useRef } from "react";
import { clampPhotoCrop, DEFAULT_PHOTO_CROP, photoCropTransform, useLoadedImage, type PhotoCrop } from "@/lib/photoBadge";
import { ID_CARD_PHOTO_ZOOM_MIN, ID_CARD_PHOTO_ZOOM_MAX } from "@/lib/constants";

const VIEW_PX = 200;
const CIRCLE_PX = 150;

// Drag the photo to move the face into the circle; slider to zoom. The area outside the circle
// is dimmed so it's clear what ends up on the card.
export function PhotoCropEditor({
  src,
  crop,
  onChange,
}: {
  src: string;
  crop: PhotoCrop;
  onChange: (crop: PhotoCrop) => void;
}) {
  const img = useLoadedImage(src);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ startX: number; startY: number; startCrop: PhotoCrop } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = VIEW_PX * dpr;
    canvas.height = VIEW_PX * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const center = VIEW_PX / 2;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, VIEW_PX, VIEW_PX);
    const { scale, left, top } = photoCropTransform(img, crop, CIRCLE_PX, center, center);
    ctx.drawImage(img, left, top, img.naturalWidth * scale, img.naturalHeight * scale);

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_PX, VIEW_PX);
    ctx.arc(center, center, CIRCLE_PX / 2, 0, Math.PI * 2);
    ctx.fill("evenodd");

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, CIRCLE_PX / 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [img, crop]);

  function update(next: PhotoCrop) {
    if (!img) return;
    onChange(clampPhotoCrop(next, img.naturalWidth, img.naturalHeight));
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag.current || !img) return;
    const { startX, startY, startCrop } = drag.current;
    const { scale } = photoCropTransform(img, startCrop, CIRCLE_PX, 0, 0);
    update({
      ...startCrop,
      x: startCrop.x - ((e.clientX - startX) / (img.naturalWidth * scale)) * 100,
      y: startCrop.y - ((e.clientY - startY) / (img.naturalHeight * scale)) * 100,
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        style={{ width: VIEW_PX, height: VIEW_PX }}
        className="rounded-xl cursor-grab active:cursor-grabbing touch-none select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { startX: e.clientX, startY: e.clientY, startCrop: crop };
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      />
      <p className="text-xs text-gray-500">Drag to move the face into the circle</p>
      <div className="flex items-center gap-2 w-full max-w-[200px]">
        <span className="text-xs text-gray-500">Zoom</span>
        <input
          type="range"
          min={ID_CARD_PHOTO_ZOOM_MIN}
          max={ID_CARD_PHOTO_ZOOM_MAX}
          step={5}
          value={crop.zoom}
          onChange={(e) => update({ ...crop, zoom: Number(e.target.value) })}
          aria-label="Photo zoom"
          className="flex-1 accent-kids-navy"
        />
      </div>
      <button
        type="button"
        onClick={() => update(DEFAULT_PHOTO_CROP)}
        className="text-xs font-semibold text-kids-navy hover:underline"
      >
        Reset position
      </button>
    </div>
  );
}
