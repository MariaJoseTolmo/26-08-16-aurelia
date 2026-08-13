import { WarehouseFormOriginIcon } from '../icons/WarehouseIntakeFormIcons';
import { WarehouseFormCard } from './WarehouseFormCard';

/**
 * Tarjeta "Datos del residuo y transporte" del paso 3 — nodo `3765:35692`.
 *
 * Es un RESUMEN, no un formulario: los tres datos ya se llenaron en el paso 1 y acá
 * solo se leen antes de firmar. Por eso no usa `WarehouseFormReadOnlyField`, que
 * dibuja una caja de campo: el nodo no dibuja cajas, solo rótulo y valor sueltos.
 *
 * Geometría del nodo:
 *
 *   tarjeta  la de `WarehouseFormCard`, sin párrafo y sin `bodyGap`
 *   fila     `3765:35698` flex gap-[14px] items-start, con `pt-[3px]` propio
 *   columna  `gap-[3px]`
 *   rótulo   Inter Semi Bold 10.5px · #646464 · tracking-[0.21px] · UPPERCASE
 *   valor    Inter Semi Bold 13px · #131313
 *
 * El `uppercase` es del nodo y no del texto: la capa dice "Patente del vehículo" en
 * capitalización normal y es el estilo el que la sube. Se reproduce con CSS por lo
 * mismo — así el texto sigue siendo legible para un lector de pantalla y traducible.
 *
 * Los 316.664px de cada columna NO se fijan: son 954 repartidos en tres con dos
 * gaps de 14. Van `flex-1`, que da la misma medida y aguanta un viewport angosto.
 */

export const SIDREP_REVIEW_TRANSPORT_TITLE = 'Datos del residuo y transporte';

interface ReviewFieldProps {
  label: string;
  value: string;
}

function ReviewField({ label, value }: ReviewFieldProps) {
  return (
    <div className="flex min-w-px flex-1 flex-col items-start gap-[3px] self-stretch">
      <p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold uppercase not-italic leading-[normal] tracking-[0.21px] text-[#646464]">
        {label}
      </p>
      <p className="truncate font-['Inter:Semi_Bold',sans-serif] text-[13px] font-semibold not-italic leading-[normal] text-[#131313]">
        {value}
      </p>
    </div>
  );
}

interface WasteSidrepReviewTransportSectionProps {
  /** Patente tecleada en el paso 1. Nodo `3765:35718`. */
  plate: string;
  /** Conductor del paso 1. Nodo `3765:35723`. */
  driver: string;
  /** Lugar de disposición final, que es a quién se le entrega. Nodo `3765:35728`. */
  recipient: string;
}

export function WasteSidrepReviewTransportSection({
  plate,
  driver,
  recipient,
}: WasteSidrepReviewTransportSectionProps) {
  return (
    <WarehouseFormCard
      /* Mismo camión que "Origen del ingreso" (`3564:1363`), verificado contra el asset. */
      icon={<WarehouseFormOriginIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={SIDREP_REVIEW_TRANSPORT_TITLE}
    >
      <div className="w-full pt-[3px]">
        <div className="flex w-full items-start gap-[14px]">
          <ReviewField label="Patente del vehículo" value={plate} />
          <ReviewField label="Conductor" value={driver} />
          <ReviewField label="Empresa destinataria" value={recipient} />
        </div>
      </div>
    </WarehouseFormCard>
  );
}
