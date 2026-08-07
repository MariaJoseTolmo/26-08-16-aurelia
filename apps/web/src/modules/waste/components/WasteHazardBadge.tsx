import { WarehouseHazardousIcon, WarehouseNonHazardousIcon } from '../icons/WarehouseTableIcons';

/**
 * Pastilla de peligrosidad de las tablas de residuos: `#ffd0db`/`#570b1d` para
 * peligroso, `#e6f3ff`/`#0d3862` para no peligroso.
 *
 * Estaba escrita dos veces, idéntica, en "Detalle de lotes en bodega" y en
 * "Ingresos a bodega". Es la misma pastilla del mismo dato, así que vive una
 * sola vez.
 */
export function WasteHazardBadge({ isHazardous }: { isHazardous: boolean }) {
  const background = isHazardous ? '#ffd0db' : '#e6f3ff';
  const color = isHazardous ? '#570b1d' : '#0d3862';
  const Icon = isHazardous ? WarehouseHazardousIcon : WarehouseNonHazardousIcon;

  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-[20px] px-[9px] py-[3px]"
      style={{ backgroundColor: background, color }}
    >
      <Icon className="block h-[10px] w-[12.5px] shrink-0" />
      <span className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal]">
        {isHazardous ? 'Peligroso' : 'No peligroso'}
      </span>
    </span>
  );
}
