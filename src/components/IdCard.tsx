import { forwardRef } from "react";
import { LogoMark } from "./LogoMark";

// Standard CR80 card size: 85.60mm x 53.98mm (3.37in x 2.125in)
export const ID_CARD_WIDTH_MM = 85.6;
export const ID_CARD_HEIGHT_MM = 53.98;

const brandStripe = (
  <div className="h-[3mm] flex shrink-0">
    <div className="flex-1 bg-kids-magenta" />
    <div className="flex-1 bg-kids-navy" />
    <div className="flex-1 bg-kids-green" />
    <div className="flex-1 bg-kids-yellow" />
  </div>
);

export const IdCardFront = forwardRef<HTMLDivElement, { displayName: string; fullName: string; flat?: boolean }>(
  function IdCardFront({ displayName, fullName, flat }, ref) {
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
          <div className="text-[55px] leading-tight font-bold text-kids-navy font-[family-name:var(--font-fredoka)] break-words">
            {displayName}
          </div>
          <div className="text-[9px] text-gray-500">{fullName}</div>
        </div>
        {brandStripe}
      </div>
    );
  }
);

export const IdCardBack = forwardRef<HTMLDivElement, { qrDataUrl: string; fullName: string; flat?: boolean }>(
  function IdCardBack({ qrDataUrl, fullName, flat }, ref) {
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Check-in QR code" className="w-[28mm] h-[28mm]" />
          <div className="text-[7px] text-gray-500 text-center px-[4mm]">Scan to check in / out · {fullName}</div>
        </div>
        <div className="text-[6px] leading-snug text-gray-400 text-center px-[4mm] pb-[2mm]">
          If found, please return to Victory Iloilo (033 3291529)
          <br />
          Paseo De Arcangeles, Benigno S. Aquino Drive, Mandurriao, Iloilo City
        </div>
      </div>
    );
  }
);
