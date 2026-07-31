"use client";

import { useRef, useState } from "react";
import { IdCardFront, IdCardBack } from "./IdCard";
import { exportIdCardsToPdf, exportIdCardsToPngZip, sanitizeFileName } from "@/lib/idCardExport";

export function IdCardViewer({
  displayName,
  fullName,
  qrDataUrl,
  fileBaseName,
  backSubtitle,
}: {
  displayName: string;
  fullName: string;
  qrDataUrl: string;
  fileBaseName: string;
  backSubtitle?: string;
}) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"pdf" | "png" | null>(null);

  async function handleExportPdf() {
    if (!frontRef.current || !backRef.current || exporting) return;
    setExporting("pdf");
    try {
      const base = sanitizeFileName(fileBaseName);
      await exportIdCardsToPdf(
        [{ fileBaseName: base, frontEl: frontRef.current, backEl: backRef.current }],
        `${base}.pdf`
      );
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPng() {
    if (!frontRef.current || !backRef.current || exporting) return;
    setExporting("png");
    try {
      const base = sanitizeFileName(fileBaseName);
      await exportIdCardsToPngZip(
        [{ fileBaseName: base, frontEl: frontRef.current, backEl: backRef.current }],
        `${base}.zip`
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <IdCardFront displayName={displayName} fullName={fullName} />
      <IdCardBack qrDataUrl={qrDataUrl} fullName={fullName} subtitle={backSubtitle} />

      {/* Hidden flat (square, shadowless) copies dedicated to PDF/PNG capture — html2canvas
          doesn't reliably respect the preview's shadow/rounded corners, so export uses its
          own always-flat instance instead of fighting that in the capture step. */}
      <div className="fixed -left-[9999px] top-0 flex flex-col items-center print:hidden">
        <IdCardFront ref={frontRef} displayName={displayName} fullName={fullName} flat />
        <IdCardBack ref={backRef} qrDataUrl={qrDataUrl} fullName={fullName} subtitle={backSubtitle} flat />
      </div>

      <div className="print:hidden flex items-center gap-3 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-kids-navy hover:bg-kids-navy/90 text-white font-bold px-6 py-2.5 rounded-xl transition"
        >
          Print ID card
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exporting !== null}
          className="bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-kids-navy font-bold px-6 py-2.5 rounded-xl border border-kids-navy transition"
        >
          {exporting === "pdf" ? "Exporting…" : "Export PDF"}
        </button>
        <button
          type="button"
          onClick={handleExportPng}
          disabled={exporting !== null}
          className="bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-kids-navy font-bold px-6 py-2.5 rounded-xl border border-kids-navy transition"
        >
          {exporting === "png" ? "Exporting…" : "Export PNG"}
        </button>
      </div>
    </>
  );
}
