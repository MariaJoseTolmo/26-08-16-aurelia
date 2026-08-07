/**
 * Encabezado del cuerpo de "Nueva recepción a bodega" — nodo `3564:1323`.
 *
 * Geometría del design context:
 *
 *   fila        `3564:1323`  flex items-start justify-between w-full
 *   caja        `3564:1324`  flex-[1_0_0] min-w-px · flex flex-col items-start
 *   Heading 2   `3564:1325`  h-[25px] · interior pt-[2px]
 *               `3564:1326`  Inter Bold 19px · leading-[normal] · whitespace-nowrap
 *                            var(--gray/900_txt, #131313)
 *   Paragraph   `3564:1327`  w-full · interior pt-[4px]
 *               `3564:1328`  Inter Regular 12.5px · leading-[18.75px] · w-full
 *                            var(--gray/600_cta, #646464)
 *
 * Las alturas del nodo salen de la suma: el encabezado es `pt-[2px]` + una línea
 * de 19px ≈ 25px, y el párrafo `pt-[4px]` + dos líneas de 18.75px ≈ 42px. Por eso
 * no se fijan a mano: las produce el propio texto.
 *
 * Tres desvíos deliberados respecto del design context:
 *
 * 1. `w-[520px]` en el Heading 2 se descarta. Es el ancho de la caja de texto en
 *    Figma —el glifo mide 406px—, no una restricción de layout, y el brief prohíbe
 *    anchos fijos. Con `whitespace-nowrap` dentro de un `flex-col items-start` la
 *    caja ya se ajusta al contenido.
 * 2. Los tokens `--gray/900_txt` y `--gray/600_cta` se escriben con su valor hex.
 *    `src/styles/index.css` no está importado en la app, así que sus variables no
 *    resuelven; es la convención vigente en `AppSidebar` y en el resto del módulo.
 * 3. El nodo emite ambos textos como `<p>`. El encabezado sale como `<h2>` porque
 *    el nodo se llama "Heading 2" y es el título del cuerpo, debajo del `<h1>` de
 *    `WarehouseHeader`. Estilos idénticos.
 *
 * El `justify-between` de la fila queda aunque hoy tenga un solo hijo: es lo que
 * el nodo declara, y es lo que deja entrar un elemento a la derecha sin remaquetar.
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
  return (
    <div className="flex w-full items-start justify-between" data-name="Container">
      <div className="min-w-px flex-1" data-name="Container">
        <div className="flex w-full flex-col items-start">
          <div className="w-full pt-[2px]" data-name="Heading 2">
            <h2 className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[19px] font-bold not-italic leading-[normal] text-[#131313]">
              {heading}
            </h2>
          </div>
          <div className="w-full pt-[4px]" data-name="Paragraph">
            <p className="w-full font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[18.75px] text-[#646464]">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
