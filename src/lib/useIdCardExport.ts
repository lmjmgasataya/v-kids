import { useCallback, useRef, useState } from "react";
import { exportIdCardsToPdf, exportIdCardsToPngZip, sanitizeFileName, type IdCardExportItem } from "./idCardExport";

export interface ExportableCard {
  id: number;
  fileBaseName: string;
}

export function useIdCardExport() {
  const refs = useRef(new Map<number, { front: HTMLDivElement | null; back: HTMLDivElement | null }>());
  const [exporting, setExporting] = useState<"pdf" | "png" | null>(null);

  const setFrontRef = useCallback((id: number, el: HTMLDivElement | null) => {
    const entry = refs.current.get(id) ?? { front: null, back: null };
    entry.front = el;
    refs.current.set(id, entry);
  }, []);

  const setBackRef = useCallback((id: number, el: HTMLDivElement | null) => {
    const entry = refs.current.get(id) ?? { front: null, back: null };
    entry.back = el;
    refs.current.set(id, entry);
  }, []);

  function collectItems(cards: ExportableCard[]): IdCardExportItem[] {
    const items: IdCardExportItem[] = [];
    for (const card of cards) {
      const entry = refs.current.get(card.id);
      if (entry?.front && entry?.back) {
        items.push({ fileBaseName: sanitizeFileName(card.fileBaseName), frontEl: entry.front, backEl: entry.back });
      }
    }
    return items;
  }

  async function exportPdf(cards: ExportableCard[], filename: string) {
    if (exporting) return;
    setExporting("pdf");
    try {
      await exportIdCardsToPdf(collectItems(cards), filename);
    } finally {
      setExporting(null);
    }
  }

  async function exportPngZip(cards: ExportableCard[], filename: string) {
    if (exporting) return;
    setExporting("png");
    try {
      await exportIdCardsToPngZip(collectItems(cards), filename);
    } finally {
      setExporting(null);
    }
  }

  return { setFrontRef, setBackRef, exportPdf, exportPngZip, exporting };
}
