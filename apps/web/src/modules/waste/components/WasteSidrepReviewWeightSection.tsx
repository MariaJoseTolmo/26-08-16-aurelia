import { WasteSidrepWeightIcon } from '../icons/WasteSidrepDocumentsIcons';
import { formatQuantity } from '../wasteFilterPrimitives';
import { WarehouseFormCard } from './WarehouseFormCard';

/**
 * Tarjeta "Peso del residuo" del paso 3 — nodo `3765:35729`.
 *
 * Los tres pesos ya los transcribió el backend en el paso 1; acá se muestran
 * resumidos en una sola caja azul, con el NETO como protagonista y el bruto y la
 * tara como aclaración.
 *
 * Geometría del nodo:
 *
 *   tarjeta  `WarehouseFormCard` con `bodyGap` — no tiene párrafo
 *   caja     `3765:35735` bg #e6f3ff · border #c5d8f0 · rounded-[8px]
 *            flex items-center justify-between · px-[17px] py-[13px]
 *   rótulo   Inter Semi Bold 11.5px #0d3862
 *   detalle  Inter Regular 10.5px #0d3862 al 75% de opacidad
 *   valor    Inter Bold 19px #0d3862
 *
 * La caja usa el MISMO par azul que el tono `info` de `WarehouseFormCard`
 * (`#e6f3ff` / `#c5d8f0` / `#0d3862`), pero no es esa tarjeta: es una caja interior
 * con otro padding y otro radio. Por eso va acá y no como un tono más.
 *
 * El `opacity-75` del detalle es del nodo (`3765:35739`) y se conserva tal cual en
 * vez de resolverlo a un color plano: es lo que declara el diseño.
 *
 * EL SEPARADOR ES UN MENOS UNICODE (`−`, U+2212) y no un guion: es lo que trae el
 * nodo `3765:35740`, y en una resta de pesos es el carácter correcto.
 */

export const SIDREP_REVIEW_WEIGHT_TITLE = 'Peso del residuo';

/** Texto del nodo `3765:35738`. */
export const SIDREP_REVIEW_NET_WEIGHT_LABEL = 'Peso neto declarado';

interface WasteSidrepReviewWeightSectionProps {
  /** Los tres pesos en kg, como string numérico. */
  grossWeightKg: string;
  tareWeightKg: string;
  netWeightKg: string;
}

export function WasteSidrepReviewWeightSection({
  grossWeightKg,
  tareWeightKg,
  netWeightKg,
}: WasteSidrepReviewWeightSectionProps) {
  return (
    <WarehouseFormCard
      bodyGap
      icon={<WasteSidrepWeightIcon className="block h-[13.5px] w-[16.875px] shrink-0 overflow-visible text-[#131313]" />}
      title={SIDREP_REVIEW_WEIGHT_TITLE}
    >
      <div className="flex w-full flex-col items-center pt-[3px]">
        <div className="flex w-full items-center justify-between rounded-[8px] border border-solid border-[#c5d8f0] bg-[#e6f3ff] px-[17px] py-[13px]">
          <div className="flex min-w-px flex-col items-start">
            <p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold not-italic leading-[normal] text-[#0d3862]">
              {SIDREP_REVIEW_NET_WEIGHT_LABEL}
            </p>
            <p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#0d3862] opacity-75">
              {`Bruto ${formatQuantity(grossWeightKg)} kg − Tara ${formatQuantity(tareWeightKg)} kg`}
            </p>
          </div>
          <p className="shrink-0 whitespace-nowrap font-['Inter:Bold',sans-serif] text-[19px] font-bold not-italic leading-[normal] text-[#0d3862]">
            {`${formatQuantity(netWeightKg)} kg`}
          </p>
        </div>
      </div>
    </WarehouseFormCard>
  );
}
