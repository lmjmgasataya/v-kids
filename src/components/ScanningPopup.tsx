// Full-screen loading popup shown while a hardware (keyboard-wedge) barcode
// scan is resolving in search mode — the camera-based QrScanner has its own
// inline bouncing-dots indicator, but a hardware scan has no camera view to
// anchor one to, so this fills that gap with the same look as the rest of
// the check-in/kc-bucks confirm/success popups.
export function ScanningPopup() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-card-pop-in w-full max-w-sm rounded-2xl border-4 border-t-kids-magenta border-r-kids-navy border-b-kids-green border-l-kids-yellow bg-white p-8 shadow-xl ring-1 ring-black/5 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center justify-center gap-2.5" aria-label="Looking up scan result…">
          <span className="w-4 h-4 rounded-full bg-kids-magenta animate-bounce [animation-delay:-0.3s]" />
          <span className="w-4 h-4 rounded-full bg-kids-yellow animate-bounce [animation-delay:-0.2s]" />
          <span className="w-4 h-4 rounded-full bg-kids-green animate-bounce [animation-delay:-0.1s]" />
          <span className="w-4 h-4 rounded-full bg-kids-navy animate-bounce" />
        </div>
        <p className="text-base font-semibold text-kids-navy">Looking up scan…</p>
      </div>
    </div>
  );
}
