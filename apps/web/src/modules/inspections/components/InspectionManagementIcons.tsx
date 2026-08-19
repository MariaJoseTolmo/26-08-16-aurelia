type IconProps = {
  className?: string;
};

export function ClearFiltersIcon({ className = 'h-[10px] w-[12.5px]' }: IconProps) {
  return (
    <svg className={className} width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
      <path d="M2.25 1.25L10.75 8.75M10.75 1.25L2.25 8.75" stroke="#646464" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function HistoryClosedInspectionsIcon({ className = 'h-[11px] w-[13.75px]' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 640 512" fill="none" aria-hidden="true">
      <path transform="translate(64 0)" fill="#53BD49" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209 241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
    </svg>
  );
}

export function HistoryAverageClosureIcon({ className = 'h-[11px] w-[13.75px]' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 640 512" fill="none" aria-hidden="true">
      <path transform="translate(96 0)" fill="#24588B" d="M128 0c17.7 0 32 14.3 32 32v32h128V32c0-17.7 14.3-32 32-32s32 14.3 32 32v32h48c26.5 0 48 21.5 48 48v48H0v-48C0 85.5 21.5 64 48 64h48V32c0-17.7 14.3-32 32-32zM0 192h448v272c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192z" />
    </svg>
  );
}

export function HistoryClosedObservationsIcon({ className = 'h-[11px] w-[13.75px]' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 640 512" fill="none" aria-hidden="true">
      <path transform="translate(64 0)" fill="#53BD49" d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64v336c0 44.2 35.8 80 80 80h400c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z" />
    </svg>
  );
}

export function HistoryContractorCompaniesIcon({ className = 'h-[11px] w-[13.75px]' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 640 512" fill="none" aria-hidden="true">
      <path transform="translate(128 0)" fill="#24588B" d="M48 0C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h96v-80c0-26.5 21.5-48 48-48s48 21.5 48 48v80h96c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48H48zm32 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H96c-8.8 0-16-7.2-16-16v-32zm112-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16zm80 16c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16v-32zM96 96h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H96c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16zm80 16c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16v-32zm112-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16v-32c0-8.8 7.2-16 16-16z" />
    </svg>
  );
}

export function InspectionExportDocumentIcon({ className = 'h-[12px] w-[15px]' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 640 512" fill="none" aria-hidden="true">
      <path transform="translate(128 0)" fill="#333333" d="M64 0C28.7 0 0 28.7 0 64v384c0 35.3 28.7 64 64 64h256c35.3 0 64-28.7 64-64V160H256c-35.3 0-64-28.7-64-64V0H64zm160 0v96c0 17.7 14.3 32 32 32h96L224 0z" />
    </svg>
  );
}

export function InspectionExportChevronIcon({ className = 'h-[10px] w-[12.5px]' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 640 512" fill="none" aria-hidden="true">
      <path transform="translate(64 0)" fill="#333333" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
    </svg>
  );
}
