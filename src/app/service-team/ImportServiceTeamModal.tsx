"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildServiceTeamImportTemplate } from "@/lib/csv";
import { importServiceTeamCsv, type ImportSummary } from "./actions";

export function ImportServiceTeamModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function close() {
    setOpen(false);
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDownloadTemplate() {
    const blob = new Blob([buildServiceTeamImportTemplate()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "service-team-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      const summary = await importServiceTeamCsv(text);
      setResult(summary);
      if (summary.imported > 0) router.refresh();
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 whitespace-nowrap bg-kids-magenta hover:bg-kids-magenta/90 text-white text-sm font-bold px-4 py-2 rounded-full transition"
      >
        Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
              Import Service Team from CSV
            </h3>

            <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>
                Download the template and fill in one row per member.{" "}
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="font-semibold text-kids-navy hover:underline"
                >
                  Download Template
                </button>
              </li>
              <li>Save it as CSV, then upload the edited file below.</li>
            </ol>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
              className="mt-4 w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-kids-navy file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />

            {result && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
                <p className="font-semibold text-kids-green">{result.imported} member(s) imported.</p>
                {result.errors.length > 0 && (
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-red-600">
                    {result.errors.map((err) => (
                      <li key={err.row}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || importing}
                className="rounded-full bg-kids-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-kids-navy/90 disabled:opacity-50"
              >
                {importing ? "Importing…" : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
