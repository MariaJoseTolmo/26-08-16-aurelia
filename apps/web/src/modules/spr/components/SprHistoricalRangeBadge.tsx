interface SprHistoricalRangeBadgeProps {
  count: number;
}

// PLACEHOLDER: badge resumen de alertas historicas (Figma 1395:4639).
export function SprHistoricalRangeBadge({ count }: SprHistoricalRangeBadgeProps) {
  if (count <= 0) return null;

  const label = count === 1 ? '1 valor fuera del rango histórico' : `${count} valores fuera del rango histórico`;

  return (
    <div className="flex items-center gap-[5px] rounded-[5px] border border-[#f5c4a0] bg-[#fff0e6] px-[10px] py-[4px]">
      <span className="flex size-[12px] shrink-0 items-center justify-center rounded-[6px] bg-[#e8720c] font-['Inter:Bold',sans-serif] text-[8px] font-bold text-white">!</span>
      <p className="font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#e8720c]">{label}</p>
    </div>
  );
}
