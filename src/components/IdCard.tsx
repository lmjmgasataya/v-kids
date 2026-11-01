import { forwardRef } from "react";
import { LogoMark } from "./LogoMark";
import { QrPhotoBadge } from "./QrPhotoBadge";
import { DEFAULT_PHOTO_CROP, type PhotoCrop } from "@/lib/photoBadge";
import { ID_CARD_PHOTO_SCALE } from "@/lib/constants";
import { idCardNameFontSize, idCardTeamNameFontSize } from "@/lib/format";

// Standard CR80 card size: 85.60mm x 53.98mm (3.37in x 2.125in)
export const ID_CARD_WIDTH_MM = 85.6;
export const ID_CARD_HEIGHT_MM = 53.98;

const brandStripe = (
  <div className="h-[4mm] flex shrink-0">
    <div className="flex-1 bg-kids-magenta" />
    <div className="flex-1 bg-kids-navy" />
    <div className="flex-1 bg-kids-green" />
    <div className="flex-1 bg-kids-yellow" />
  </div>
);

export const IdCardFront = forwardRef<
  HTMLDivElement,
  { displayName: string; fullName: string; flat?: boolean; nameFontSize?: number }
>(function IdCardFront({ displayName, fullName, flat, nameFontSize }, ref) {
  return (
    <div
      ref={ref}
      className={`id-card-front-bg w-[85.6mm] h-[53.98mm] overflow-hidden flex flex-col break-after-page ${
        flat
          ? "rounded-none"
          : "rounded-[3mm] print:rounded-none shadow-md print:shadow-none border border-gray-200 print:border print:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-1.5 px-[5mm] pt-[3.5mm]">
        <LogoMark size={22} priority />
        <span className="text-[7px] font-bold tracking-widest text-kids-navy uppercase font-[family-name:var(--font-fredoka)]">
          Kids Church
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-[4mm] gap-1 -mt-[5mm]">
        <div
          style={{ fontSize: nameFontSize ?? idCardNameFontSize(displayName) }}
          className={`leading-tight font-bold text-kids-navy font-[family-name:var(--font-fredoka)] max-w-full ${
            displayName.trim().includes(" ") ? "whitespace-nowrap" : "break-words"
          }`}
        >
          {displayName}
        </div>
        <div className="text-[9px] text-gray-500">{fullName}</div>
      </div>
      {brandStripe}
    </div>
  );
});

// Service team front: same layout, colors, and opacity level as the kid card, just swapping
// the radial-dot background for a diagonal sweep (see .id-card-front-bg-team) so the two are
// still visually related but distinguishable at a glance.
export const ServiceTeamIdCardFront = forwardRef<
  HTMLDivElement,
  { displayName: string; fullName: string; flat?: boolean; nameFontSize?: number }
>(function ServiceTeamIdCardFront({ displayName, fullName, flat, nameFontSize }, ref) {
  return (
    <div
      ref={ref}
      className={`id-card-front-bg-team w-[85.6mm] h-[53.98mm] overflow-hidden flex flex-col break-after-page ${
        flat
          ? "rounded-none"
          : "rounded-[3mm] print:rounded-none shadow-md print:shadow-none border border-gray-200 print:border print:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-1.5 px-[5mm] pt-[3.5mm]">
        <LogoMark size={22} priority />
        <span className="text-[7px] font-bold tracking-widest text-kids-navy uppercase font-[family-name:var(--font-fredoka)]">
          Kids Church
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-[4mm] gap-0.5 -mt-[3mm]">
        <div className="text-[13px] font-semibold text-black font-[family-name:var(--font-fredoka)]">
          Hi, I&apos;m Teacher
        </div>
        <div
          style={{ fontSize: nameFontSize ?? idCardTeamNameFontSize(displayName) }}
          className={`leading-tight font-bold text-black font-[family-name:var(--font-fredoka)] max-w-full ${
            displayName.trim().includes(" ") ? "whitespace-nowrap" : "break-words"
          }`}
        >
          {displayName}
        </div>
        <div className="text-[9px] text-gray-500">{fullName}</div>
      </div>
      {brandStripe}
    </div>
  );
});

const QR_SIZE_MM = 30;
const PHOTO_SIZE_MM = (QR_SIZE_MM * ID_CARD_PHOTO_SCALE) / 100;

// photoSrc/photoCrop: optional round photo badge over the middle of the QR (service
// team cards). Only pass a photo with a QR generated at errorCorrectionLevel "H", or it won't scan.
export const IdCardBack = forwardRef<
  HTMLDivElement,
  {
    qrDataUrl: string;
    fullName: string;
    flat?: boolean;
    subtitle?: string;
    photoSrc?: string | null;
    photoCrop?: PhotoCrop;
  }
>(function IdCardBack(
  {
    qrDataUrl,
    fullName,
    flat,
    subtitle = "Scan to check in / out",
    photoSrc,
    photoCrop = DEFAULT_PHOTO_CROP,
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={`w-[85.6mm] h-[53.98mm] bg-white overflow-hidden flex flex-col ${
        flat
          ? "rounded-none"
          : "rounded-[3mm] print:rounded-none shadow-md print:shadow-none border border-gray-200 print:border print:border-gray-300"
      }`}
    >
      {brandStripe}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
        <div className="relative w-[30mm] h-[30mm] mt-[8mm]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Check-in QR code" className="w-full h-full" />
          {photoSrc && (
            <QrPhotoBadge
              src={photoSrc}
              crop={photoCrop}
              style={{
                width: `${PHOTO_SIZE_MM}mm`,
                height: `${PHOTO_SIZE_MM}mm`,
                left: `${(QR_SIZE_MM - PHOTO_SIZE_MM) / 2}mm`,
                top: `${(QR_SIZE_MM - PHOTO_SIZE_MM) / 2}mm`,
              }}
            />
          )}
        </div>
        <div className="text-[7px] text-gray-500 text-center px-[4mm]">
          {subtitle} · {fullName}
        </div>
      </div>
      <div className="text-[6px] leading-snug text-gray-400 text-center px-[4mm] pb-[2mm]">
        If found, please return to Victory Iloilo (033 3291529)
        <br />
        Paseo De Arcangeles, Benigno S. Aquino Drive, Mandurriao, Iloilo City
      </div>
    </div>
  );
});
