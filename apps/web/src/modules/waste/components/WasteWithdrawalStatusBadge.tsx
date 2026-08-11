import { WASTE_WITHDRAWAL_STATUS_LABELS, type WasteWithdrawalStatus } from '../wasteWithdrawalRows';

/**
 * Pastilla de la columna "ESTADO" — nodos `3817:55580` ("Informativo") y
 * `3817:55589` ("Cerrado").
 *
 *   informativo  bg #f7f7f7 (gray/100_surf) · border #e3e3e3 (gray/300)
 *                texto #acacac (gray/500)
 *   cerrado      bg #c5fff6 · SIN borde · texto #006153
 *   ambas        rounded-[5px] · px-[9px] py-[3px] · Inter Bold 10px
 *
 * NO es `WasteHazardBadge` con otros colores, y por eso no se reutiliza: aquella
 * es `rounded-[20px]`, lleva icono y usa `gap-[5px]`; esta es `rounded-[5px]`,
 * no lleva icono y una de las dos variantes tiene borde. Son dos pastillas
 * distintas del sistema de diseño.
 *
 * Los anchos fijos del nodo (76.336 y 57.68 px) NO se reproducen: son la caja de
 * texto de Figma. Con `px-[9px]` el ancho lo da el contenido y sale la misma
 * medida —9 + 57 + 9 + 2 de borde ≈ 76 para "Informativo"; 9 + 40 + 9 ≈ 58 para
 * "Cerrado"—, y además tolera rótulos más largos cuando el set de estados crezca.
 *
 * Las alturas tampoco se fijan: `py-[3px]` sobre una línea de 10px da los 20px
 * de "Informativo" (con su borde) y los 18px de "Cerrado".
 */
const STATUS_STYLES: Record<WasteWithdrawalStatus, string> = {
  informational: 'border border-solid border-[#e3e3e3] bg-[#f7f7f7] text-[#acacac]',
  closed: 'bg-[#c5fff6] text-[#006153]',
};

export function WasteWithdrawalStatusBadge({ status }: { status: WasteWithdrawalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-[5px] px-[9px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal] whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {WASTE_WITHDRAWAL_STATUS_LABELS[status]}
    </span>
  );
}
