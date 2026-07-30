import { ID_CARD_WIDTH_MM, ID_CARD_HEIGHT_MM } from "@/components/IdCard";

export interface IdCardExportItem {
  fileBaseName: string;
  frontEl: HTMLElement;
  backEl: HTMLElement;
}

export function sanitizeFileName(name: string) {
  return name.trim().replace(/[^a-zA-Z0-9-_]+/g, "_");
}

// Flat rgba() equivalent of the front card's decorative background, which is authored with
// color-mix(in srgb, <brand color> P%, transparent). html2canvas-pro's color parser doesn't
// support color-mix() (only hsl/rgb/lch/oklch/oklab/lab/color), so it drops those gradient
// layers when capturing — replaced 1:1 here since mixing an opaque color with `transparent`
// in srgb is exactly that color at alpha = P/100.
const FRONT_BG_IMAGE = [
  "radial-gradient(circle at 12% 12%, rgba(168, 64, 143, 0.20), transparent 55%)",
  "radial-gradient(circle at 88% 15%, rgba(28, 63, 139, 0.18), transparent 55%)",
  "radial-gradient(circle at 15% 92%, rgba(63, 169, 69, 0.20), transparent 55%)",
  "radial-gradient(circle at 90% 92%, rgba(240, 196, 25, 0.26), transparent 55%)",
].join(", ");

async function captureCardCanvas(el: HTMLElement) {
  // Tailwind 4 emits oklch()/color() for its palette, which the unmaintained html2canvas
  // can't parse ("unsupported color function"). html2canvas-pro is a maintained fork with
  // support for modern CSS color functions, same API otherwise.
  const { default: html2canvas } = await import("html2canvas-pro");
  // The card's CSS size (85.6mm/53.98mm) converts to a fractional CSS-pixel value. Left to
  // its default, html2canvas rounds the crop up (Math.ceil) to the next whole pixel, so the
  // capture overshoots the element's true edge by ~1px per side and picks up a sliver of
  // whatever sits behind it. Passing floored width/height pins the crop inside the element's
  // real box instead.
  const rect = el.getBoundingClientRect();
  return html2canvas(el, {
    scale: 3,
    width: Math.floor(rect.width),
    height: Math.floor(rect.height),
    backgroundColor: "#ffffff",
    useCORS: true,
    // The captured element is always a `flat` IdCardFront/IdCardBack (square corners, no
    // shadow — see IdCard.tsx), so there's no shadow/border-radius to fight here. All that's
    // left to patch is the color-mix() background, which html2canvas-pro can't parse.
    onclone: (_document, cloned) => {
      if (cloned.classList.contains("id-card-front-bg")) {
        cloned.style.backgroundImage = FRONT_BG_IMAGE;
      }
    },
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportIdCardsToPdf(items: IdCardExportItem[], filename: string) {
  const { jsPDF } = await import("jspdf");
  // jsPDF defaults to portrait and swaps width/height to match — since the card is wider
  // than it is tall, that silently rotated every page. Force landscape so the page keeps
  // the card's actual proportions and the image fills it edge-to-edge.
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [ID_CARD_WIDTH_MM, ID_CARD_HEIGHT_MM] });

  for (let i = 0; i < items.length; i++) {
    const { frontEl, backEl } = items[i];
    if (i > 0) pdf.addPage([ID_CARD_WIDTH_MM, ID_CARD_HEIGHT_MM], "landscape");

    const frontCanvas = await captureCardCanvas(frontEl);
    pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, ID_CARD_WIDTH_MM, ID_CARD_HEIGHT_MM);

    pdf.addPage([ID_CARD_WIDTH_MM, ID_CARD_HEIGHT_MM], "landscape");
    const backCanvas = await captureCardCanvas(backEl);
    pdf.addImage(backCanvas.toDataURL("image/png"), "PNG", 0, 0, ID_CARD_WIDTH_MM, ID_CARD_HEIGHT_MM);
  }

  pdf.save(filename);
}

export async function exportIdCardsToPngZip(items: IdCardExportItem[], filename: string) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  for (const { fileBaseName, frontEl, backEl } of items) {
    const frontCanvas = await captureCardCanvas(frontEl);
    const backCanvas = await captureCardCanvas(backEl);
    zip.file(`${fileBaseName}-front.png`, frontCanvas.toDataURL("image/png").split(",")[1], { base64: true });
    zip.file(`${fileBaseName}-back.png`, backCanvas.toDataURL("image/png").split(",")[1], { base64: true });
  }

  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, filename);
}
