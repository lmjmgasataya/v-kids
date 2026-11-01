"use client";

import { useMemo, type CSSProperties } from "react";
import { renderPhotoBadge, useLoadedImage, type PhotoCrop } from "@/lib/photoBadge";

export function QrPhotoBadge({ src, crop, style }: { src: string; crop: PhotoCrop; style?: CSSProperties }) {
  const img = useLoadedImage(src);
  const { zoom, x, y } = crop;
  const badge = useMemo(() => (img ? renderPhotoBadge(img, { zoom, x, y }) : null), [img, zoom, x, y]);
  if (!badge) return null;
  // eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a static asset
  return <img src={badge} alt="" className="absolute" style={style} />;
}
