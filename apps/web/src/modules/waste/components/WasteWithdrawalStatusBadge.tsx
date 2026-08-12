import type { ReactNode } from 'react';
import { WASTE_WITHDRAWAL_STATUS_LABELS, type WasteWithdrawalStatus } from '../wasteWithdrawalRows';

/**
 * Pastillas de la tabla de retiros. La MISMA caja aparece cuatro veces en los
 * nodos, con tres paletas:
 *
 *   `3817:55580`  "Informativo"            bg #f7f7f7 · border #e3e3e3 · texto #acacac
 *   `3817:55589`  "Cerrado"                bg #c5fff6 · SIN borde       · texto #006153
 *   `3817:56001`  "Pendiente"              bg #fff0e6 · SIN borde       · texto #6b3a1f
 *   `3817:55964`  "A espera de aprobación" bg #fff0e6 · SIN borde       · texto #6b3a1f
 *
 * Caja común: `rounded-[5px]` · `px-[9px] py-[3px]` · Inter Bold 10px. Por eso la
 * geometría vive una sola vez en `WasteWithdrawalPill` y cada uso elige su tono.
 *
 * La cuarta no es un estado: es la celda FOLIO SIDREP de una solicitud enviada. Usa
 * la misma pastilla ámbar que "Pendiente" —y la misma paleta que la tarjeta de aviso
 * SIDREP, `#fff0e6`/`#6b3a1f`— porque habla de lo mismo: falta que Medio Ambiente
 * apruebe.
 *
 * NO es `WasteHazardBadge`: aquella es `rounded-[20px]`, lleva icono y usa
 * `gap-[5px]`. Son dos pastillas distintas del sistema de diseño.
 *
 * Los anchos fijos de los nodos (76.336, 57.68, 65, 133 px) NO se reproducen: son la
 * caja de texto de Figma. Con `px-[9px]` el ancho lo da el contenido y sale la misma
 * medida, y además tolera rótulos más largos.
 */
export type WasteWithdrawalPillTone = 'neutral' | 'teal' | 'amber';

const PILL_TONE: Record<WasteWithdrawalPillTone, string> = {
  neutral: 'border border-solid border-[#e3e3e3] bg-[#f7f7f7] text-[#acacac]',
  teal: 'bg-[#c5fff6] text-[#006153]',
  amber: 'bg-[#fff0e6] text-[#6b3a1f]',
};

export function WasteWithdrawalPill({
  tone,
  children,
}: {
  tone: WasteWithdrawalPillTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[5px] px-[9px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal] ${PILL_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<WasteWithdrawalStatus, WasteWithdrawalPillTone> = {
  informational: 'neutral',
  pending: 'amber',
  closed: 'teal',
};

export function WasteWithdrawalStatusBadge({ status }: { status: WasteWithdrawalStatus }) {
  return (
    <WasteWithdrawalPill tone={STATUS_TONE[status]}>
      {WASTE_WITHDRAWAL_STATUS_LABELS[status]}
    </WasteWithdrawalPill>
  );
}
