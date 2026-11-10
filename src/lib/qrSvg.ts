import { create } from "qrcode";

/**
 * SVG data URL for an ID card QR, built synchronously from the QR matrix. About 10x cheaper
 * than qrcode's PNG `toDataURL` and vector (sharp at any print size), so list pages can draw
 * one per row in the browser instead of shipping a PNG per row from the server.
 */
export function qrSvgDataUrl(payload: string, errorCorrectionLevel: "M" | "H" = "M"): string {
  const { modules } = create(payload, { errorCorrectionLevel });
  const size = modules.size;
  let path = "";
  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!modules.get(row, col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < size && modules.get(row, col)) col++;
      path += `M${start} ${row + 0.5}h${col - start}`;
    }
  }
  // Each run of dark modules is one 1-unit-wide stroke; single quotes and escaping only what a
  // data URL needs (not encodeURIComponent) keep the URL small.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}' shape-rendering='crispEdges'><rect width='${size}' height='${size}' fill='white'/><path stroke='black' d='${path}'/></svg>`;
  return `data:image/svg+xml,${svg.replace(/[<>#%]/g, encodeURIComponent)}`;
}
