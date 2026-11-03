"use client";

import { useEffect, useRef, useState } from "react";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function ServiceTeamPhoto({
  photoUrl,
  fullPhotoUrl,
  downloadUrl,
  initials,
}: {
  photoUrl: string | null;
  fullPhotoUrl: string | null;
  downloadUrl: string | null;
  initials: string;
}) {
  const [open, setOpen] = useState(false);
  // The photo route returns an error when the file can't be loaded from storage — show the
  // initials instead of a broken image.
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // onError can fire before hydration attaches the handler, so also check once on mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!photoUrl || failed) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-semibold">
        {initials}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2.5">
        {/* shrink-0 + max-w-none: in a tight table column the flex row would otherwise squeeze the
            image's width (Tailwind's img max-width: 100%) while its height stays fixed, making an oval. */}
        <button type="button" onClick={() => setOpen(true)} className="block shrink-0 rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- private photo route, not a static asset */}
          <img
            ref={imgRef}
            src={photoUrl}
            alt=""
            onError={() => setFailed(true)}
            className="h-10 w-10 max-w-none rounded-full object-cover transition hover:opacity-80"
          />
        </button>
        <a
          href={downloadUrl ?? photoUrl}
          aria-label="Download photo"
          title="Download photo"
          className="ml-1 shrink-0 text-gray-400 hover:text-kids-navy transition"
        >
          <DownloadIcon className="h-5 w-5" />
        </a>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- private photo route, not a static asset */}
          <img
            src={fullPhotoUrl ?? photoUrl}
            alt=""
            className="max-h-[80vh] max-w-full rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={downloadUrl ?? photoUrl}
            aria-label="Download photo"
            title="Download photo"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 text-white hover:opacity-70"
          >
            <DownloadIcon className="h-7 w-7" />
          </a>
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
