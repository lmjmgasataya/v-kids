"use client";

import { useMemo, useState } from "react";
import { IdCardFront, IdCardBack } from "@/components/IdCard";
import { inputCls } from "@/components/form";
import { useIdCardExport } from "@/lib/useIdCardExport";

interface KidRow {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  gender: string;
  serviceAttending: string;
  qrToken: string;
  guardianFirstName: string;
  guardianLastName: string;
  qrDataUrl: string;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "lastName", label: "Name" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "guardian", label: "Guardian" },
  { key: "serviceAttending", label: "Service" },
];

type SortKey = "lastName" | "age" | "gender" | "guardian" | "serviceAttending";

function compareRows(a: KidRow, b: KidRow, sort: SortKey): number {
  switch (sort) {
    case "lastName":
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
    case "age":
      return a.age - b.age;
    case "gender":
      return a.gender.localeCompare(b.gender);
    case "guardian":
      return `${a.guardianLastName} ${a.guardianFirstName}`.localeCompare(`${b.guardianLastName} ${b.guardianFirstName}`);
    case "serviceAttending":
      return a.serviceAttending.localeCompare(b.serviceAttending);
  }
}

export function PrintIdsWorkspace({ kids }: { kids: KidRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("lastName");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const sortedAll = useMemo(() => {
    const sorted = [...kids].sort((a, b) => compareRows(a, b, sort));
    if (dir === "desc") sorted.reverse();
    return sorted;
  }, [kids, sort, dir]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return sortedAll;
    return sortedAll.filter((kid) => `${kid.firstName} ${kid.lastName} ${kid.nickname ?? ""}`.toLowerCase().includes(search));
  }, [sortedAll, query]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((kid) => selected.has(kid.id));

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir("asc");
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const kid of filtered) next.delete(kid.id);
      } else {
        for (const kid of filtered) next.add(kid.id);
      }
      return next;
    });
  }

  const printable = sortedAll.filter((kid) => selected.has(kid.id));
  const { setFrontRef, setBackRef, exportPdf, exportPngZip, exporting } = useIdCardExport();

  const exportCards = printable.map((kid) => ({
    id: kid.id,
    fileBaseName: `${kid.firstName} ${kid.lastName}`,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="print:hidden flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Print IDs</h2>
          <p className="text-sm text-gray-500 mt-1">Select the kids you want to print ID cards for.</p>
        </div>
        <input
          type="search"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputCls} w-64`}
        />
      </div>

      <div className="print:hidden flex items-center justify-between gap-4">
        <span className="text-sm text-gray-500">
          {selected.size} of {kids.length} selected
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={printable.length === 0}
            onClick={() => window.print()}
            className="whitespace-nowrap bg-kids-navy hover:bg-kids-navy/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition"
          >
            Print {printable.length > 0 ? `${printable.length} ` : ""}ID{printable.length === 1 ? "" : "s"}
          </button>
          <button
            type="button"
            disabled={printable.length === 0 || exporting !== null}
            onClick={() => exportPdf(exportCards, "kids-id-cards.pdf")}
            className="whitespace-nowrap bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-kids-navy font-bold px-6 py-2.5 rounded-xl border border-kids-navy transition"
          >
            {exporting === "pdf" ? "Exporting…" : "Export PDF"}
          </button>
          <button
            type="button"
            disabled={printable.length === 0 || exporting !== null}
            onClick={() => exportPngZip(exportCards, "kids-id-cards.zip")}
            className="whitespace-nowrap bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-kids-navy font-bold px-6 py-2.5 rounded-xl border border-kids-navy transition"
          >
            {exporting === "png" ? "Exporting…" : "Export PNG"}
          </button>
        </div>
      </div>

      <div className="print:hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Select all"
                  className="h-4 w-4 accent-kids-navy"
                />
              </th>
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-gray-600">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 hover:text-kids-navy"
                  >
                    {col.label}
                    {sort === col.key && <span>{dir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-gray-400">
                  No kids match your search.
                </td>
              </tr>
            )}
            {filtered.map((kid) => (
              <tr
                key={kid.id}
                onClick={() => toggleOne(kid.id)}
                className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5"
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(kid.id)}
                    onChange={() => toggleOne(kid.id)}
                    aria-label={`Select ${kid.firstName} ${kid.lastName}`}
                    className="h-4 w-4 accent-kids-navy"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {kid.firstName} {kid.lastName}
                  </div>
                  {kid.nickname && <div className="text-xs text-gray-400">&quot;{kid.nickname}&quot;</div>}
                </td>
                <td className="px-4 py-3">{kid.age}</td>
                <td className="px-4 py-3">{kid.gender}</td>
                <td className="px-4 py-3">
                  {kid.guardianFirstName} {kid.guardianLastName}
                </td>
                <td className="px-4 py-3">{kid.serviceAttending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Always rendered (off-screen) so html2canvas can capture cards for PDF/PNG export; repositioned into the normal flow for native printing. */}
      <div className="fixed -left-[9999px] top-0 flex flex-col items-center print:static print:-mx-4 print:-my-8 print:gap-0">
        {printable.map((kid) => {
          const fullName = `${kid.firstName} ${kid.lastName}`;
          const displayName = kid.nickname?.trim() || kid.firstName;
          return (
            <div key={kid.id} className="contents">
              <IdCardFront ref={(el) => setFrontRef(kid.id, el)} displayName={displayName} fullName={fullName} />
              <IdCardBack ref={(el) => setBackRef(kid.id, el)} qrDataUrl={kid.qrDataUrl} fullName={fullName} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
