"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ID_CARD_WIDTH_MM, ID_CARD_HEIGHT_MM } from "./IdCard";

// Cards are laid out in real mm units; shrink/grow them via CSS transform instead of rendering
// a second, differently-sized card component.
const MM_TO_PX = 96 / 25.4;
const CARD_WIDTH_PX = ID_CARD_WIDTH_MM * MM_TO_PX;
const CARD_HEIGHT_PX = ID_CARD_HEIGHT_MM * MM_TO_PX;
const THUMB_WIDTH_PX = 110;
const ENLARGED_WIDTH_PX = 420;

function ScaledIdCard({ width, children, className }: { width: number; children: ReactNode; className: string }) {
  const scale = width / CARD_WIDTH_PX;
  return (
    <div className={`shrink-0 overflow-hidden ${className}`} style={{ width, height: CARD_HEIGHT_PX * scale }}>
      <div
        style={{
          width: CARD_WIDTH_PX,
          height: CARD_HEIGHT_PX,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function EnlargedPreview({ title, sides, onClose }: { title: string; sides: ReactNode[]; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="print:hidden fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-4 rounded-2xl bg-white p-5 shadow-xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">{title}</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {sides.map((side, i) => (
            <ScaledIdCard key={i} width={ENLARGED_WIDTH_PX} className="rounded-lg border border-gray-200 shadow-md">
              {side}
            </ScaledIdCard>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="bg-kids-navy hover:bg-kids-navy/90 text-white font-bold px-6 py-2 rounded-xl transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Small inline thumbnails of a card's sides (pass `flat` cards); click to see them enlarged.
export function IdCardPreview({ title, sides }: { title: string; sides: ReactNode[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Click to enlarge"
        aria-label={`Enlarge ID preview for ${title}`}
        className="flex gap-2 rounded-md cursor-zoom-in transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-kids-navy"
      >
        {sides.map((side, i) => (
          <ScaledIdCard key={i} width={THUMB_WIDTH_PX} className="rounded-md border border-gray-200">
            {side}
          </ScaledIdCard>
        ))}
      </button>
      {open && <EnlargedPreview title={title} sides={sides} onClose={() => setOpen(false)} />}
    </>
  );
}
