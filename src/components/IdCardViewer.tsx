"use client";

import { useRef, useState } from "react";
import { IdCardFront, IdCardBack, ServiceTeamIdCardFront } from "./IdCard";
import { exportIdCardsToPdf, exportIdCardsToPngZip, sanitizeFileName } from "@/lib/idCardExport";
import { idCardNameFontSize, idCardTeamNameFontSize } from "@/lib/format";
import { updateIdCardNameScale } from "@/app/kids/actions";
import {
  updateServiceTeamIdCardNameScale,
  updateServiceTeamIdCardPhotoCrop,
} from "@/app/service-team/actions";
import { DEFAULT_PHOTO_CROP, type PhotoCrop } from "@/lib/photoBadge";
import { PhotoCropEditor } from "./PhotoCropEditor";

const SAVE_DEBOUNCE_MS = 400;

export function IdCardViewer({
  displayName,
  fullName,
  qrDataUrl,
  fileBaseName,
  backSubtitle,
  variant = "kid",
  kidId,
  initialNameScale = 100,
  photoSrc,
  initialPhotoCrop = DEFAULT_PHOTO_CROP,
}: {
  displayName: string;
  fullName: string;
  qrDataUrl: string;
  fileBaseName: string;
  backSubtitle?: string;
  variant?: "kid" | "team";
  kidId?: number;
  initialNameScale?: number;
  photoSrc?: string | null;
  initialPhotoCrop?: PhotoCrop;
}) {
  const Front = variant === "team" ? ServiceTeamIdCardFront : IdCardFront;
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"pdf" | "png" | null>(null);
  const [nameScale, setNameScale] = useState(initialNameScale / 100);
  const [editableDisplayName, setEditableDisplayName] = useState(displayName);
  const shownDisplayName = editableDisplayName.trim() || displayName;
  const baseNameFontSize =
    variant === "team" ? idCardTeamNameFontSize(shownDisplayName) : idCardNameFontSize(shownDisplayName);
  const nameFontSize = Math.round(baseNameFontSize * nameScale);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [photoCrop, setPhotoCrop] = useState(initialPhotoCrop);
  const cropSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handlePhotoCropChange(next: PhotoCrop) {
    setPhotoCrop(next);
    if (kidId == null || variant !== "team") return;

    if (cropSaveTimer.current) clearTimeout(cropSaveTimer.current);
    cropSaveTimer.current = setTimeout(() => {
      void updateServiceTeamIdCardPhotoCrop(kidId, next);
    }, SAVE_DEBOUNCE_MS);
  }

  function handleNameScaleChange(next: number) {
    setNameScale(next);
    if (kidId == null) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const scale100 = Math.round(next * 100);
      void (variant === "team" ? updateServiceTeamIdCardNameScale(kidId, scale100) : updateIdCardNameScale(kidId, scale100));
    }, SAVE_DEBOUNCE_MS);
  }

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
      <Front displayName={shownDisplayName} fullName={fullName} nameFontSize={nameFontSize} />
      <IdCardBack
        qrDataUrl={qrDataUrl}
        fullName={fullName}
        subtitle={backSubtitle}
        photoSrc={photoSrc}
        photoCrop={photoCrop}
      />

      {/* Hidden flat (square, shadowless) copies dedicated to PDF/PNG capture — html2canvas
          doesn't reliably respect the preview's shadow/rounded corners, so export uses its
          own always-flat instance instead of fighting that in the capture step. */}
      <div className="fixed -left-[9999px] top-0 flex flex-col items-center print:hidden">
        <Front ref={frontRef} displayName={shownDisplayName} fullName={fullName} nameFontSize={nameFontSize} flat />
        <IdCardBack
          ref={backRef}
          qrDataUrl={qrDataUrl}
          fullName={fullName}
          subtitle={backSubtitle}
          photoSrc={photoSrc}
          photoCrop={photoCrop}
          flat
        />
      </div>

      <div className="print:hidden flex flex-col items-center gap-1.5 w-full max-w-xs">
        <label htmlFor="display-name" className="text-sm font-semibold text-gray-600">
          Name on card
        </label>
        <div className="flex items-center gap-2 w-full">
          <input
            id="display-name"
            type="text"
            value={editableDisplayName}
            onChange={(e) => setEditableDisplayName(e.target.value)}
            className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-kids-navy"
          />
          {editableDisplayName !== displayName && (
            <button
              type="button"
              onClick={() => setEditableDisplayName(displayName)}
              className="text-xs font-semibold text-kids-navy hover:underline whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="print:hidden flex flex-col items-center gap-1.5 w-full max-w-xs">
        <label htmlFor="name-scale" className="text-sm font-semibold text-gray-600">
          Name size: {Math.round(nameScale * 100)}%
        </label>
        <input
          id="name-scale"
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={nameScale}
          onChange={(e) => handleNameScaleChange(Number(e.target.value))}
          className="w-full accent-kids-navy"
        />
      </div>

      {photoSrc && (
        <div className="print:hidden flex flex-col items-center gap-1.5 w-full max-w-xs">
          <span className="text-sm font-semibold text-gray-600">QR photo position</span>
          <PhotoCropEditor src={photoSrc} crop={photoCrop} onChange={handlePhotoCropChange} />
        </div>
      )}

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
