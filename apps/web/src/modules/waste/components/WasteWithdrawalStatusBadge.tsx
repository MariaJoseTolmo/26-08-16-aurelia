import type { ReactNode } from 'react';
import { WASTE_WITHDRAWAL_STATUS_LABELS, type WasteWithdrawalStatus } from '../wasteWithdrawalRows';
import { WastePill, type WastePillTone } from './WastePill';

/**
 * Pastillas de la tabla de retiros. La MISMA caja aparece cuatro veces en los
 * nodos, con tres paletas:
 *
 *   `3817:55580`  "Informativo"            bg #f7f7f7 · border #e3e3e3 · texto #acacac
 *   `3817:55589`  "Cerrado"                bg #c5fff6 · SIN borde       · texto #006153
 *   `3817:56001`  "Pendiente"              bg #fff0e6 · SIN borde       · texto #6b3a1f
 *   `3817:55964`  "A espera de aprobación" bg #fff0e6 · SIN borde       · texto #6b3a1f
 *
 * La cuarta no es un estado: es la celda FOLIO SIDREP de una solicitud enviada. Usa
 * la misma pastilla ámbar que "Pendiente" —y la misma paleta que la tarjeta de aviso
 * SIDREP, `#fff0e6`/`#6b3a1f`— porque habla de lo mismo: falta que Medio Ambiente
 * apruebe.
 *
 * La caja —`rounded-[5px]` · `px-[9px] py-[3px]` · Inter Bold 10px— ya no vive acá:
 * la comparte todo el módulo en `WastePill` desde que "Reporte SINADER" necesitó las
 * mismas etiquetas sin hablar de retiros. `WasteWithdrawalPill` se conserva con su
 * nombre y su API porque tres archivos la importan, y porque en el contexto de
 * retiros el nombre sigue siendo el correcto.
 *
 * NO es `WasteHazardBadge`: aquella es `rounded-[20px]`, lleva icono y usa
 * `gap-[5px]`. Son dos pastillas distintas del sistema de diseño.
 */
/**
 * `red` entró con el estado "Rechazado" de la tabla de histórico: la pastilla es la misma
 * caja y el tono ya existía en `WastePill` —el par de la franja de rechazo `4295:24658`—,
 * así que restringir el tipo a los tres tonos dibujados en los nodos de retiros habría
 * obligado a esa tabla a saltearse este componente para pintar la misma pastilla.
 */
export type WasteWithdrawalPillTone = Extract<
  WastePillTone,
  'neutral' | 'teal' | 'amber' | 'red'
>;

export function WasteWithdrawalPill({
  tone,
  children,
}: {
  tone: WasteWithdrawalPillTone;
  children: ReactNode;
}) {
  return <WastePill tone={tone}>{children}</WastePill>;
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
