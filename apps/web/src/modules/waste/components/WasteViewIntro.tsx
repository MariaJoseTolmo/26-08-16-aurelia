/**
 * Encabezado del cuerpo de una vista del módulo de residuos: un `<h2>` y su
 * párrafo descriptivo.
 *
 * El mismo bloque aparece en tres nodos del archivo Medio-Ambiente-Core con
 * geometría idéntica:
 *
 *   `3564:1323`  "Nueva recepción a bodega"    (fila `items-start`)
 *   `3765:38499` "Solicitud de retiro"         (fila `items-end`)
 *   `3765:38869` "Nueva solicitud de retiro"   (fila `items-start`)
 *
 * Geometría del design context, común a ambos:
 *
 *   fila        flex justify-between w-full
 *   caja        flex-[1_0_0] min-w-px · flex flex-col items-start
 *   Heading 2   h-[25px] · interior pt-[2px]
 *               Inter Bold 19px · leading-[normal] · whitespace-nowrap
 *               var(--gray/900_txt, #131313)
 *   Paragraph   w-full · interior pt-[4px]
 *               Inter Regular 12.5px · leading-[18.75px] · w-full
 *               var(--gray/600_cta, #646464)
 *
 * Las alturas no se fijan a mano: las produce el texto. `pt-[2px]` + una línea
 * de 19px ≈ 25px; `pt-[4px]` + una línea de 18.75px ≈ 23px, que es lo que
 * completa los 48px del contenedor en `3765:38499`.
 *
 * Tres desvíos deliberados respecto del design context:
 *
 * 1. El ancho fijo del Heading 2 —`w-[520px]` en `3564:1325` y `3765:38871`,
 *    `w-[560px]` en `3765:38501`— se descarta. Es el ancho de la caja de texto en
 *    Figma, no una restricción de layout, y el brief prohíbe anchos fijos. Con
 *    `whitespace-nowrap` dentro de un `flex-col items-start` la caja ya se
 *    ajusta al contenido.
 * 2. Los tokens `--gray/900_txt` y `--gray/600_cta` se escriben con su valor
 *    hex: `src/styles/index.css` no está importado en la app, así que sus
 *    variables no resuelven. Es la convención vigente en `AppSidebar` y en el
 *    resto del módulo.
 * 3. El nodo emite ambos textos como `<p>`. El encabezado sale como `<h2>`
 *    porque el nodo se llama "Heading 2" y es el título del cuerpo, debajo del
 *    `<h1>` de `WarehouseHeader`. Estilos idénticos.
 *
 * El `justify-between` de la fila queda aunque hoy tenga un solo hijo: es lo que
 * declaran los nodos, y es lo que deja entrar un elemento a la derecha sin
 * remaquetar.
 */

interface WasteViewIntroProps {
  heading: string;
  description: string;
  /**
   * Alineación vertical de la fila. Con un único hijo que ocupa todo el ancho
   * las dos opciones se ven igual, pero cada nodo declara la suya y el día que
   * entre un control a la derecha la diferencia importa.
   */
  align?: 'start' | 'end';
}

export function WasteViewIntro({ heading, description, align = 'start' }: WasteViewIntroProps) {
  return (
    <div className={`flex w-full justify-between ${align === 'end' ? 'items-end' : 'items-start'}`} data-name="Container">
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
