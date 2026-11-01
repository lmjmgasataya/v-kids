import { useEffect, useState } from "react";
import { ID_CARD_PHOTO_ZOOM_MIN, ID_CARD_PHOTO_ZOOM_MAX } from "./constants";

// How a photo is cropped into the round ID card QR badge — matches the idCardPhotoZoom/X/Y
// columns on service_team_members. x/y is the focus point (% across/down the photo) placed at
// the circle's center.
export interface PhotoCrop {
  zoom: number;
  x: number;
  y: number;
}

export const DEFAULT_PHOTO_CROP: PhotoCrop = { zoom: 100, x: 50, y: 50 };

// White ring around the photo, as a fraction of the badge's diameter, so the photo doesn't
// blend into the QR modules around it. Keep it white: a brand-color ring was tried, but its dark
// segments read as QR modules and stopped the code decoding at 50% badge size.
const RING_RATIO = 0.05;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Keeps the focus point far enough from the photo's edges that the circle is always fully covered.
export function clampPhotoCrop(crop: PhotoCrop, width: number, height: number): PhotoCrop {
  const zoom = clamp(crop.zoom, ID_CARD_PHOTO_ZOOM_MIN, ID_CARD_PHOTO_ZOOM_MAX);
  const shortSide = Math.min(width, height);
  const halfX = (50 * shortSide) / ((width * zoom) / 100);
  const halfY = (50 * shortSide) / ((height * zoom) / 100);
  return { zoom, x: clamp(crop.x, halfX, 100 - halfX), y: clamp(crop.y, halfY, 100 - halfY) };
}

// Image-to-canvas scale and top-left offset that puts `crop` inside a circle of `diameter`
// centered at (cx, cy). Shared by the badge and the crop editor so they always agree.
export function photoCropTransform(img: HTMLImageElement, crop: PhotoCrop, diameter: number, cx: number, cy: number) {
  const { naturalWidth: w, naturalHeight: h } = img;
  const c = clampPhotoCrop(crop, w, h);
  const scale = (diameter / Math.min(w, h)) * (c.zoom / 100);
  return { scale, left: cx - (c.x / 100) * w * scale, top: cy - (c.y / 100) * h * scale };
}

// Renders the round, white-ringed badge as a PNG data URL — a plain image, so print and
// html2canvas PDF/PNG export render it exactly like the screen does.
export function renderPhotoBadge(img: HTMLImageElement, crop: PhotoCrop, size = 256): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;
  const photoDiameter = size * (1 - RING_RATIO * 2);

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(center, center, center, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center, center, photoDiameter / 2, 0, Math.PI * 2);
  ctx.clip();
  const { scale, left, top } = photoCropTransform(img, crop, photoDiameter, center, center);
  ctx.drawImage(img, left, top, img.naturalWidth * scale, img.naturalHeight * scale);

  return canvas.toDataURL("image/png");
}

export function useLoadedImage(src: string | null | undefined): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<{ src: string; img: HTMLImageElement } | null>(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setLoaded({ src, img });
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return loaded && loaded.src === src ? loaded.img : null;
}
