import { ClockIcon } from '../../../shared/components/icons/ClockIcon';
import { WarehouseOverdueBadgeIcon } from '../icons/WarehouseControlIcons';
import { EXPIRATION_KIND_STYLES, resolveExpirationKind } from '../wasteWarehouseThresholds';
import { WarehouseSectionTitle } from './WarehouseSectionTitle';

/**
 * "Próximos vencimientos" — nodos `3686:25779` (título), `3686:25784` (tarjeta)
 * y `3686:25786` / `25795` / `25804` (filas).
 *
 *   tarjeta   bg white · border #e3e3e3 · rounded-[10px] · px-[19px] py-[15px]
 *   fila      border-b #e3e3e3 · flex gap-[12px] items-start · pt-[12px] pb-[13px]
 *   badge     size-[30px] · rounded-[8px] · glifo 15 × 12 centrado
 *   título    Inter Regular 12px · leading-[18px] · #131313, con la fecha en Bold
 *   detalle   Inter Regular 11px · #646464
 *
 * El icono lo decide la regla de negocio: alerta si el lote está vencido, reloj
 * ámbar si todavía no lo está.
 */

export interface WarehouseExpirationItem {
  /** Residuo del lote, p. ej. "Aceite lubricante usado". */
  wasteName: string;
  /** Fecha de ingreso ya formateada, p. ej. "18 ene 2026". */
  intakeDate: string;
  /** Línea inferior, p. ej. "6,1 meses en bodega · vencido, requiere retiro inmediato". */
  detail: string;
  isOverdue: boolean;
}

export const WAREHOUSE_EXPIRATION_DEFAULTS: WarehouseExpirationItem[] = [
  {
    wasteName: 'Aceite lubricante usado',
    intakeDate: '18 ene 2026',
    detail: '6,1 meses en bodega · vencido, requiere retiro inmediato',
    isOverdue: true,
  },
  {
    wasteName: 'Baterías de plomo-ácido',
    intakeDate: '22 feb 2026',
    detail: '5,2 meses en bodega · quedan ~24 días',
    isOverdue: false,
  },
  {
    wasteName: 'Envases contaminados',
    intakeDate: '25 feb 2026',
    detail: '5,0 meses en bodega · quedan ~30 días',
    isOverdue: false,
  },
];

interface WarehouseUpcomingExpirationsProps {
  items?: WarehouseExpirationItem[];
}

export function WarehouseUpcomingExpirations({
  items = WAREHOUSE_EXPIRATION_DEFAULTS,
}: WarehouseUpcomingExpirationsProps) {
  return (
    <div className="flex w-full flex-col gap-[8px]">
      <WarehouseSectionTitle icon={<ClockIcon className="block size-full" />}>
        Próximos vencimientos
      </WarehouseSectionTitle>

      <div className="flex w-full flex-1 flex-col items-start rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[15px]">
        {items.map((item, index) => (
          <WarehouseExpirationRow
            key={`${item.wasteName}-${item.intakeDate}`}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function WarehouseExpirationRow({ item, isLast }: { item: WarehouseExpirationItem; isLast: boolean }) {
  const kind = resolveExpirationKind(item.isOverdue);
  const style = EXPIRATION_KIND_STYLES[kind];
  /* El de "por vencer" es el reloj compartido; el de "vencido" es otro glifo. */
  const Icon = kind === 'overdue' ? WarehouseOverdueBadgeIcon : ClockIcon;

  return (
    <div
      className={`flex w-full items-start gap-[12px] pb-[13px] pt-[12px] ${isLast ? '' : 'border-b border-solid border-[#e3e3e3]'}`}
    >
      <div
        className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px]"
        style={{ backgroundColor: style.badgeBackground }}
      >
        <Icon className="block h-[12px] w-[15px] shrink-0" style={{ color: style.iconColor }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <p className="font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[18px] text-[#131313]">
          {item.wasteName} — ingresó{' '}
          <span className="font-['Inter:Bold',sans-serif] font-bold">{item.intakeDate}</span>
        </p>
        <p className="font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
          {item.detail}
        </p>
      </div>
    </div>
  );
}
