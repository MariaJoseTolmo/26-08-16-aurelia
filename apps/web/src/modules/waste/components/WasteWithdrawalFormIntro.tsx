import { WasteViewIntro } from './WasteViewIntro';

/**
 * Encabezado del cuerpo de "Nueva solicitud de retiro" — nodo `3765:38869`.
 *
 * La maqueta vive en `WasteViewIntro`, compartida con `3564:1323` y `3765:38499`.
 * Este nodo declara `items-start`, igual que el del formulario de recepción.
 * Acá quedan solo sus dos textos.
 */

/** Texto del nodo `3765:38872`. Va con mayúsculas en "Solicitud" y "Retiro", como el diseño. */
export const WASTE_WITHDRAWAL_FORM_HEADING = 'Nueva Solicitud de Retiro';

/** Texto del nodo `3765:38874`. */
export const WASTE_WITHDRAWAL_FORM_DESCRIPTION =
  'Todo retiro debe estar vinculado a un lote registrado en Recepción en Bodega. Selecciona el lote que vas a retirar.';

interface WasteWithdrawalFormIntroProps {
  heading?: string;
  description?: string;
}

export function WasteWithdrawalFormIntro({
  heading = WASTE_WITHDRAWAL_FORM_HEADING,
  description = WASTE_WITHDRAWAL_FORM_DESCRIPTION,
}: WasteWithdrawalFormIntroProps) {
  return <WasteViewIntro heading={heading} description={description} align="start" />;
}
