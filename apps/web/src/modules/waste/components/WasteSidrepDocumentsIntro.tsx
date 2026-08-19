import { WasteViewIntro } from './WasteViewIntro';

/**
 * Encabezado del cuerpo del flujo SIDREP — nodo `3765:39366`.
 *
 * La maqueta vive en `WasteViewIntro`, ya compartida con `3564:1323`, `3765:38499`
 * y `3765:38869`. Este nodo declara `items-start`, igual que los otros dos
 * formularios. Acá quedan solo sus dos textos.
 */

/** Texto del nodo `3765:39369`. */
export const SIDREP_DOCUMENTS_HEADING = 'Solicitud de retiro de residuo peligroso';

/** Texto del nodo `3765:39371`. */
export const SIDREP_DOCUMENTS_DESCRIPTION =
  'Completa los datos del traslado y adjunta la documentación requerida. Medio Ambiente revisará tu solicitud dentro de las próximas 6 horas.';

interface WasteSidrepDocumentsIntroProps {
  heading?: string;
  description?: string;
}

export function WasteSidrepDocumentsIntro({
  heading = SIDREP_DOCUMENTS_HEADING,
  description = SIDREP_DOCUMENTS_DESCRIPTION,
}: WasteSidrepDocumentsIntroProps) {
  return <WasteViewIntro heading={heading} description={description} align="start" />;
}
