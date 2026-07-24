import { LogoMark } from "./LogoMark";

const brandStripe = (
  <div className="h-[3mm] flex shrink-0">
    <div className="flex-1 bg-kids-magenta" />
    <div className="flex-1 bg-kids-navy" />
    <div className="flex-1 bg-kids-green" />
    <div className="flex-1 bg-kids-yellow" />
  </div>
);

export function IdCardFront({ displayName, fullName }: { displayName: string; fullName: string }) {
  return (
    <div className="id-card-front-bg w-[85.6mm] h-[54mm] rounded-[3mm] print:rounded-none shadow-md print:shadow-none border border-gray-200 print:border print:border-gray-300 overflow-hidden flex flex-col break-after-page">
      <div className="flex items-center gap-1.5 px-[5mm] pt-[3.5mm]">
        <LogoMark size={22} priority />
        <span className="text-[7px] font-bold tracking-widest text-kids-navy uppercase font-[family-name:var(--font-fredoka)]">
          Kids Church
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-[4mm] gap-1">
        <div className="text-[30px] leading-tight font-bold text-kids-navy font-[family-name:var(--font-fredoka)] break-words">
          {displayName}
        </div>
        <div className="text-[9px] text-gray-500">{fullName}</div>
      </div>
      {brandStripe}
    </div>
  );
}

export function IdCardBack({ qrDataUrl, fullName }: { qrDataUrl: string; fullName: string }) {
  return (
    <div className="w-[85.6mm] h-[54mm] bg-white rounded-[3mm] print:rounded-none shadow-md print:shadow-none border border-gray-200 print:border print:border-gray-300 overflow-hidden flex flex-col">
      {brandStripe}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Check-in QR code" className="w-[28mm] h-[28mm]" />
        <div className="text-[7px] text-gray-500 text-center px-[4mm]">Scan to check in / out · {fullName}</div>
      </div>
    </div>
  );
}
