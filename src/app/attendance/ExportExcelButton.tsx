"use client";

import { useState } from "react";
import { exportAttendanceExcel } from "./actions";

export function ExportExcelButton({ date }: { date: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const { filename, base64 } = await exportAttendanceExcel(date);
      const byteChars = atob(base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);

      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="shrink-0 whitespace-nowrap bg-kids-green hover:bg-kids-green/90 text-white text-sm font-bold px-4 py-2 rounded-full transition disabled:opacity-60"
    >
      {loading ? "Exporting…" : "Export Excel"}
    </button>
  );
}
