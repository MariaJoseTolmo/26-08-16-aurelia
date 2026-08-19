import { WarehouseHazardousIcon } from '../icons/WarehouseTableIcons';

/**
 * Aviso de clasificación peligrosa de la tarjeta "Categoría y residuo
 * específico" — nodo `3713:27422`, dentro del wrapper `3713:27430`.
 *
 * Aparece cuando la categoría elegida es peligrosa y hace visible la
 * consecuencia que la bajada de la tarjeta solo enuncia en abstracto ("La
 * categoría operativa determina automáticamente si el residuo es peligroso").
 *
 * Geometría del nodo:
 *
 *   caja    bg #ffd0db · border #f0a0b0 · rounded-[8px] · px-[15px] py-[12px]
 *           flex items-start · gap-[10px]
 *   icono   14.375 × 11.5
 *   texto   Inter Regular 11.5px · leading-[17.25px] · #570b1d
 *           "peligroso" en Bold
 *
 * Los 42px de alto del nodo salen de 12 + 18 + 12, no se fijan.
 *
 * EL TEXTO VA EN TRES CORRIDAS SEPARADAS y no en un `<p>` con un `<strong>`
 * adentro. No es capricho: el nodo las declara como tres hijos del mismo flex con
 * `gap-[10px]`, y las medidas lo confirman —la primera termina en x=300.375 y la
 * negrita arranca en 310.375—. Con un `<strong>` en línea el espacio sería el de
 * un blanco tipográfico (~3px) y "peligroso" quedaría pegado al texto.
 *
 * `flex-wrap` es un agregado: el nodo es una sola fila de ~690px sobre 994, así
 * que al ancho de referencia se ve idéntico, pero sin él las corridas
 * `whitespace-nowrap` desbordarían la tarjeta en un viewport angosto.
 *
 * EL ICONO SE REUTILIZA. Es el mismo glifo que `WarehouseHazardousIcon` (nodo
 * `3765:42730`) escalado ×1.15: 3.60547 × 1.15 = 4.14629 y 8.03711 × 1.15 =
 * 9.24268, que son las coordenadas exactas del asset de este nodo. Su `viewBox`
 * de 12.5 × 10 escala solo a la caja de 14.375 × 11.5 que pide el diseño.
 */

/** Sigla de la categoría, tal como la nombra el nodo. */
export const WAREHOUSE_INTAKE_HAZARD_NOTICE_CATEGORY = 'RESPEL';

const TEXT_CLASS =
  "whitespace-nowrap font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] text-[#570b1d]";

interface WarehouseIntakeHazardNoticeProps {
  /** Sigla que se nombra en el aviso. Prop por si mañana hay otra categoría peligrosa. */
  category?: string;
}

export function WarehouseIntakeHazardNotice({
  category = WAREHOUSE_INTAKE_HAZARD_NOTICE_CATEGORY,
}: WarehouseIntakeHazardNoticeProps) {
  return (
    <div
      role="status"
      className="flex w-full flex-wrap items-start gap-[10px] rounded-[8px] border border-solid border-[#f0a0b0] bg-[#ffd0db] px-[15px] py-[12px]"
    >
      <WarehouseHazardousIcon className="block h-[11.5px] w-[14.375px] shrink-0 text-[#570b1d]" />
      <p className={TEXT_CLASS}>Categoría {category} — este lote se clasifica como</p>
      <p className={`${TEXT_CLASS} font-['Inter:Bold',sans-serif] font-bold`}>peligroso</p>
      <p className={TEXT_CLASS}>y activará el seguimiento de 6 meses de almacenamiento.</p>
    </div>
  );
}
