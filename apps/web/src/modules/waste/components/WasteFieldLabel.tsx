import type { ReactNode } from 'react';

/**
 * Rótulo de campo del módulo de residuos: el gris chico en mayúsculas que
 * encabeza un dato de sólo lectura o una sub-sección.
 *
 * Sale del panel de detalle de "Folios SIDREP" (`3083:10959`), donde el MISMO
 * estilo cumple dos papeles:
 *
 *   `3083:10977` y hermanos  rótulo de cada dato de la grilla
 *   `3083:11016`             encabezado de "Documentos de cierre"
 *
 * Geometría del design context, común a los siete nodos:
 *
 *   Inter Semi Bold 10px · leading-[normal] · not-italic
 *   tracking-[0.2px] · uppercase · whitespace-nowrap
 *   var(--gray/600_cta, #646464)
 *
 * El `uppercase` va como clase y NO en el texto: los rótulos llegan en su
 * capitalización natural ("Peso neto despachado") y el lector de pantalla los
 * anuncia así, mientras la mayúscula queda donde corresponde, en la presentación.
 *
 * EL `block` NO ES DECORATIVO Y NO SE PUEDE SACAR. Como `inline`, el rótulo hereda
 * la `line-height` de 24px del `body` para la caja de línea de su contenedor —el
 * `<dt>` de la grilla, el `<div>` del encabezado de "Documentos de cierre"— y cada
 * rótulo mide 24px en vez de 12: la grilla de seis datos crecía 36px y la sección
 * de documentos 12. Siendo bloque, el rótulo establece su propia caja de línea con
 * su propio `leading-[normal]`, y las alturas coinciden con el nodo. Medido con
 * `getBoundingClientRect`, no estimado.
 *
 * El color va en hex —el mismo fallback que Figma entrega para su variable—
 * porque `src/styles/index.css` no está importado en la app y sus tokens no
 * resuelven. Es la convención vigente en el resto del módulo.
 */

interface WasteFieldLabelProps {
  children: ReactNode;
}

export function WasteFieldLabel({ children }: WasteFieldLabelProps) {
  return (
    <span className="block whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold uppercase not-italic leading-[normal] tracking-[0.2px] text-[#646464]">
      {children}
    </span>
  );
}
