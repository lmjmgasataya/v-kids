"use client";

import { useState } from "react";

export function ServiceTeamPhoto({ photoUrl, initials }: { photoUrl: string | null; initials: string }) {
  const [open, setOpen] = useState(false);

  if (!photoUrl) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-semibold">
        {initials}
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset */}
        <img src={photoUrl} alt="" className="h-10 w-10 rounded-full object-cover transition hover:opacity-80" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset */}
          <img
            src={photoUrl}
            alt=""
            className="max-h-[80vh] max-w-full rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 text-2xl leading-none text-white hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
