import { WasteFieldLabel } from './WasteFieldLabel';

/**
 * Grilla de datos de sólo lectura del módulo de residuos — nodo `3083:10974`, el
 * cuerpo del panel de detalle de "Folios SIDREP".
 *
 * Seis pares rótulo/valor en dos columnas. NO es un formulario ni una tabla: son
 * datos ya cerrados que sólo se leen, así que sale como `<dl>` con sus `<dt>` /
 * `<dd>`, que es la estructura que un lector de pantalla necesita para anunciar
 * "Peso neto despachado, 610 kg" en vez de dos textos sueltos.
 *
 * Geometría del design context:
 *
 *   grilla  grid-cols-[209.13px 209.14px] · grid-rows-[29px 29px 29px]
 *           gap-x-[16px] gap-y-[12px]
 *   item    flex flex-col gap-[2px] items-start
 *   rótulo  → `WasteFieldLabel` (Inter Semi Bold 10px #646464 uppercase)
 *   valor   Inter Semi Bold 12.5px · var(--gray/900_txt, #131313)
 *
 * Dos desvíos deliberados:
 *
 * 1. Las dos columnas de 209.13px se reemplazan por `sm:grid-cols-2` con columnas
 *    elásticas: 209.13 × 2 + 16 = 434.27, que es EXACTAMENTE el ancho interior del
 *    panel, así que la medida no es una restricción sino el reparto en mitades que
 *    el grid ya hace solo. Debajo de `sm` cae a una columna, porque a 209px por
 *    columna "Peso recibido en destino" no entra en una línea.
 * 2. Las filas de 29px no se fijan: las produce el contenido —2px de gap + 12 del
 *    rótulo + 15 del valor = 29— y así una fila con el valor en dos líneas crece
 *    en vez de recortarse.
 *
 * EL VALOR SE COLOREA SÓLO CUANDO ES UNA SEÑAL. El nodo pinta cinco valores en
 * `#131313` y uno —"Diferencia de peso: 20 kg", nodo `3083:10989`— en `#6b3a1f`,
 * el marrón del recuadro de alerta que está arriba en el mismo panel. Es el mismo
 * criterio que las filas de KPI del módulo: el número va neutro salvo que el
 * diseño lo destaque, y por eso `valueTone` es opcional y no un tono por defecto.
 *
 * El color llega por `style` y no por clase: Tailwind no puede generar
 * `text-[...]` desde una variable, y es lo que ya hace `WasteKpiCard`.
 */

export interface WasteDefinitionItem {
  /** Rótulo del dato, en su capitalización natural. La mayúscula la pone el CSS. */
  label: string;
  value: string;
  /**
   * Hex del valor cuando el dato es una señal y no un número más. Sin esto va
   * `#131313`, que es lo que muestran cinco de los seis nodos.
   */
  valueTone?: string;
}

interface WasteDefinitionGridProps {
  items: WasteDefinitionItem[];
}

export function WasteDefinitionGrid({ items }: WasteDefinitionGridProps) {
  return (
    <dl
      className="grid w-full grid-cols-1 gap-x-[16px] gap-y-[12px] sm:grid-cols-2"
      data-name="Container"
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-start gap-[2px]">
          <dt>
            <WasteFieldLabel>{item.label}</WasteFieldLabel>
          </dt>
          <dd
            className="w-full font-['Inter:Semi_Bold',sans-serif] text-[12.5px] font-semibold not-italic leading-[normal] text-[#131313]"
            style={item.valueTone ? { color: item.valueTone } : undefined}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
