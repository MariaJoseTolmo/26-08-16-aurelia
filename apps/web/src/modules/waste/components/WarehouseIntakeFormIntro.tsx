import { WasteViewIntro } from './WasteViewIntro';

/**
 * Encabezado del cuerpo de "Nueva recepción a bodega" — nodo `3564:1323`.
 *
 * La maqueta vive en `WasteViewIntro`: el nodo `3765:38499` de "Solicitud de
 * retiro" declara exactamente la misma geometría y no tenía sentido tenerla dos
 * veces. Acá queda lo propio de esta vista, que son sus dos textos.
 */

/** Texto del nodo `3564:1326`. Prop con default hasta que la bodega venga de la API. */
export const WAREHOUSE_INTAKE_FORM_HEADING = 'Registrar ingreso a Bodega — Plataforma 18';

/** Texto del nodo `3564:1328`. */
export const WAREHOUSE_INTAKE_FORM_DESCRIPTION =
  'Registra el ingreso de un lote de residuos peligrosos a la bodega de acopio. Este registro no requiere aprobación — queda disponible de inmediato para el seguimiento del plazo máximo de 6 meses de almacenamiento.';

interface WarehouseIntakeFormIntroProps {
  heading?: string;
  description?: string;
}

export function WarehouseIntakeFormIntro({
  heading = WAREHOUSE_INTAKE_FORM_HEADING,
  description = WAREHOUSE_INTAKE_FORM_DESCRIPTION,
}: WarehouseIntakeFormIntroProps) {
  return <WasteViewIntro heading={heading} description={description} align="start" />;
}
