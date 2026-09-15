"use client";

import { useMemo, useRef, useState } from "react";
import { ServiceTeamIdCardFront, IdCardBack, ID_CARD_WIDTH_MM, ID_CARD_HEIGHT_MM } from "@/components/IdCard";
import { inputCls } from "@/components/form";
import { useIdCardExport } from "@/lib/useIdCardExport";
import { capitalizeName, idCardDisplayName, idCardTeamNameFontSize } from "@/lib/format";
import { ID_CARD_NAME_SCALE_MIN, ID_CARD_NAME_SCALE_MAX } from "@/lib/constants";
import { updateServiceTeamIdCardNameScale } from "../actions";

interface MemberRow {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  birthday: string;
  serviceAttending: string;
  qrToken: string;
  idCardNameScale: number;
  qrDataUrl: string;
}

// Cards are laid out in real mm units; shrink them down to a small inline thumbnail via
// CSS transform instead of rendering a second, differently-sized card component.
const MM_TO_PX = 96 / 25.4;
const CARD_WIDTH_PX = ID_CARD_WIDTH_MM * MM_TO_PX;
const CARD_HEIGHT_PX = ID_CARD_HEIGHT_MM * MM_TO_PX;
const PREVIEW_WIDTH_PX = 110;
const PREVIEW_SCALE = PREVIEW_WIDTH_PX / CARD_WIDTH_PX;
const PREVIEW_HEIGHT_PX = CARD_HEIGHT_PX * PREVIEW_SCALE;

const SAVE_DEBOUNCE_MS = 400;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "lastName", label: "Name" },
  { key: "birthday", label: "Birthday" },
  { key: "serviceAttending", label: "Service" },
];

type SortKey = "lastName" | "birthday" | "serviceAttending";

// Birthdays are plain dates with no time component — format in UTC so the calendar day never shifts.
const birthdayFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" });

function compareRows(a: MemberRow, b: MemberRow, sort: SortKey): number {
  switch (sort) {
    case "lastName":
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
    case "birthday":
      return a.birthday.localeCompare(b.birthday);
    case "serviceAttending":
      return a.serviceAttending.localeCompare(b.serviceAttending);
  }
}

export function PrintIdsWorkspace({ members }: { members: MemberRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("lastName");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [scales, setScales] = useState<Record<number, number>>(() =>
    Object.fromEntries(members.map((member) => [member.id, member.idCardNameScale]))
  );
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  function handleScaleChange(memberId: number, value: number) {
    setScales((prev) => ({ ...prev, [memberId]: value }));

    const timers = saveTimers.current;
    if (timers[memberId]) clearTimeout(timers[memberId]);
    timers[memberId] = setTimeout(() => {
      delete timers[memberId];
      void updateServiceTeamIdCardNameScale(memberId, value);
    }, SAVE_DEBOUNCE_MS);
  }

  const sortedAll = useMemo(() => {
    const sorted = [...members].sort((a, b) => compareRows(a, b, sort));
    if (dir === "desc") sorted.reverse();
    return sorted;
  }, [members, sort, dir]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return sortedAll;
    return sortedAll.filter((member) => `${member.firstName} ${member.lastName}`.toLowerCase().includes(search));
  }, [sortedAll, query]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((member) => selected.has(member.id));

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
        for (const member of filtered) next.delete(member.id);
      } else {
        for (const member of filtered) next.add(member.id);
      }
      return next;
    });
  }

  const printable = sortedAll.filter((member) => selected.has(member.id));
  const { setFrontRef, setBackRef, exportPdf, exportPngZip, exporting } = useIdCardExport();

  const exportCards = printable.map((member) => ({
    id: member.id,
    fileBaseName: `${member.firstName} ${member.lastName}`,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="print:hidden flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Print IDs</h2>
          <p className="text-sm text-gray-500 mt-1">Select the service team members you want to print ID cards for.</p>
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
          {selected.size} of {members.length} selected
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
            onClick={() => exportPdf(exportCards, "service-team-id-cards.pdf")}
            className="whitespace-nowrap bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-kids-navy font-bold px-6 py-2.5 rounded-xl border border-kids-navy transition"
          >
            {exporting === "pdf" ? "Exporting…" : "Export PDF"}
          </button>
          <button
            type="button"
            disabled={printable.length === 0 || exporting !== null}
            onClick={() => exportPngZip(exportCards, "service-team-id-cards.zip")}
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
              <th className="px-4 py-3 text-left font-semibold text-gray-600">ID Preview</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Name Size</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 3} className="px-4 py-8 text-center text-gray-400">
                  No service team members match your search.
                </td>
              </tr>
            )}
            {filtered.map((member) => {
              const fullName = `${capitalizeName(member.firstName)} ${capitalizeName(member.lastName)}`;
              const displayName = idCardDisplayName(member.firstName, member.nickname);
              const scale = scales[member.id] ?? member.idCardNameScale;
              const nameFontSize = Math.round(idCardTeamNameFontSize(displayName) * (scale / 100));

              return (
                <tr
                  key={member.id}
                  onClick={() => toggleOne(member.id)}
                  className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(member.id)}
                      onChange={() => toggleOne(member.id)}
                      aria-label={`Select ${fullName}`}
                      className="h-4 w-4 accent-kids-navy"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{fullName}</td>
                  <td className="px-4 py-3">{birthdayFormatter.format(new Date(member.birthday))}</td>
                  <td className="px-4 py-3">{member.serviceAttending}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div
                      className="rounded-md border border-gray-200 shrink-0 overflow-hidden"
                      style={{ width: PREVIEW_WIDTH_PX, height: PREVIEW_HEIGHT_PX }}
                    >
                      <div
                        style={{
                          width: CARD_WIDTH_PX,
                          height: CARD_HEIGHT_PX,
                          transform: `scale(${PREVIEW_SCALE})`,
                          transformOrigin: "top left",
                        }}
                      >
                        <ServiceTeamIdCardFront
                          flat
                          displayName={displayName}
                          fullName={fullName}
                          nameFontSize={nameFontSize}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={ID_CARD_NAME_SCALE_MIN}
                        max={ID_CARD_NAME_SCALE_MAX}
                        step={5}
                        value={scale}
                        onChange={(e) => handleScaleChange(member.id, Number(e.target.value))}
                        aria-label={`Name size for ${fullName}`}
                        className="w-24 accent-kids-navy"
                      />
                      <span className="text-xs text-gray-500 w-9 text-right">{scale}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Always rendered (off-screen) so html2canvas can capture cards for PDF/PNG export; repositioned into the normal flow for native printing. */}
      <div className="fixed -left-[9999px] top-0 flex flex-col items-center print:static print:-mx-4 print:-my-8 print:gap-0">
        {printable.map((member) => {
          const fullName = `${capitalizeName(member.firstName)} ${capitalizeName(member.lastName)}`;
          const displayName = idCardDisplayName(member.firstName, member.nickname);
          const scale = scales[member.id] ?? member.idCardNameScale;
          const nameFontSize = Math.round(idCardTeamNameFontSize(displayName) * (scale / 100));
          return (
            <div key={member.id} className="contents">
              <ServiceTeamIdCardFront
                ref={(el) => setFrontRef(member.id, el)}
                displayName={displayName}
                fullName={fullName}
                nameFontSize={nameFontSize}
                flat
              />
              <IdCardBack
                ref={(el) => setBackRef(member.id, el)}
                qrDataUrl={member.qrDataUrl}
                fullName={fullName}
                subtitle="Service Team Member"
                flat
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
