import { WasteViewIntro } from './WasteViewIntro';

/**
 * Encabezado del cuerpo de "Solicitud de retiro" — nodo `3765:38499`.
 *
 * La maqueta vive en `WasteViewIntro`, compartida con `3564:1323`. Acá quedan
 * los dos textos del nodo y la alineación que declara la fila (`items-end`,
 * frente al `items-start` de la otra vista).
 */

/** Texto del nodo `3765:38502`. */
export const WASTE_WITHDRAWAL_HEADING = 'Histórico de retiros de residuos';

/** Texto del nodo `3765:38504`. */
export const WASTE_WITHDRAWAL_DESCRIPTION =
  'Vista consolidada de todos los retiros — peligrosos (con folio SIDREP y aprobación) y no peligrosos (informativo).';

interface WasteWithdrawalIntroProps {
  heading?: string;
  description?: string;
}

export function WasteWithdrawalIntro({
  heading = WASTE_WITHDRAWAL_HEADING,
  description = WASTE_WITHDRAWAL_DESCRIPTION,
}: WasteWithdrawalIntroProps) {
  return <WasteViewIntro heading={heading} description={description} align="end" />;
}
