import { ID_CARD_WIDTH_MM, ID_CARD_HEIGHT_MM } from "@/components/IdCard";

export interface IdCardExportItem {
  fileBaseName: string;
  frontEl: HTMLElement;
  backEl: HTMLElement;
}

export function sanitizeFileName(name: string) {
  return name.trim().replace(/[^a-zA-Z0-9-_]+/g, "_");
}

async function captureCardCanvas(el: HTMLElement) {
  // Tailwind 4 emits oklch()/color() for its palette, which the unmaintained html2canvas
  // can't parse ("unsupported color function"). html2canvas-pro is a maintained fork with
  // support for modern CSS color functions, same API otherwise.
  const { default: html2canvas } = await import("html2canvas-pro");
  return html2canvas(el, {
    scale: 3,
    backgroundColor: "#ffffff",
    useCORS: true,
    // The on-screen preview shadow (shadow-md) paints outside the card's box — capturing it
    // bakes a soft gray margin into the exported image. Drop it so the export is a clean,
    // edge-to-edge card, matching what already happens for print (print:shadow-none).
    onclone: (_document, cloned) => {
      cloned.style.boxShadow = "none";
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
