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

/**
 * Las dos grillas de datos que dibuja el diseño para el MISMO folio. Difieren de
 * verdad —en el cuerpo del valor, en la separación del par y en la de las columnas—
 * así que se preservan las dos en vez de unificar por cuenta propia:
 *
 *   `panel` `3083:10974`  el panel de detalle, al lado de la lista
 *                         gap-x-[16px] gap-y-[12px] · par gap-[2px] · valor 12.5px
 *   `modal` `3085:13271`  el respaldo completo, donde el dato es el protagonista
 *                         gap-x-[28px] gap-y-[14px] · par gap-[3px] · valor 13px
 *
 * El rótulo es el MISMO en las dos (`WasteFieldLabel`), y por eso no entra acá: lo
 * que el modal agranda es el valor, no su etiqueta.
 */
export type WasteDefinitionGridVariant = 'panel' | 'modal';

const GRID_VARIANT: Record<WasteDefinitionGridVariant, { grid: string; item: string; value: string }> = {
  panel: { grid: 'gap-x-[16px] gap-y-[12px]', item: 'gap-[2px]', value: 'text-[12.5px]' },
  modal: { grid: 'gap-x-[28px] gap-y-[14px]', item: 'gap-[3px]', value: 'text-[13px]' },
};

/**
 * Cuánto de la fila ocupa un par.
 *
 * `full` sale del nodo `4327:35781`, la última fila de "Datos del traslado" en el
 * respaldo NO PELIGROSO: ahí "Cantidad de contenedores" queda sola y el nodo le da la
 * fila entera en vez de dejar media columna vacía a su derecha.
 *
 * ES UNA PROPIEDAD DEL PAR Y NO DE LA GRILLA porque quien decide el ancho es el dato:
 * la grilla no sabe cuántos pares va a recibir ni cuál queda impar. Con la variante en
 * la grilla, agregar un campo obligaba a recontar y ajustar a mano.
 */
export type WasteDefinitionItemSpan = 'half' | 'full';

export interface WasteDefinitionItem {
  /** Rótulo del dato, en su capitalización natural. La mayúscula la pone el CSS. */
  label: string;
  value: string;
  /**
   * Hex del valor cuando el dato es una señal y no un número más. Sin esto va
   * `#131313`, que es lo que muestran cinco de los seis nodos.
   */
  valueTone?: string;
  /** Ver `WasteDefinitionItemSpan`. Por defecto media fila, como todos los demás pares. */
  span?: WasteDefinitionItemSpan;
}

interface WasteDefinitionGridProps {
  items: WasteDefinitionItem[];
  /** Ver `WasteDefinitionGridVariant`. Por defecto la del panel, que fue la primera. */
  variant?: WasteDefinitionGridVariant;
}

export function WasteDefinitionGrid({ items, variant = 'panel' }: WasteDefinitionGridProps) {
  const geometry = GRID_VARIANT[variant];

  return (
    <dl className={`grid w-full grid-cols-1 sm:grid-cols-2 ${geometry.grid}`} data-name="Container">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex flex-col items-start ${geometry.item} ${
            /*
             * `sm:col-span-2` y no `col-span-2`: debajo de `sm` la grilla ya es de una
             * sola columna, así que ahí todo par ocupa la fila entera y forzar dos
             * columnas de span apuntaría a una que no existe.
             */
            item.span === 'full' ? 'sm:col-span-2' : ''
          }`}
        >
          <dt>
            <WasteFieldLabel>{item.label}</WasteFieldLabel>
          </dt>
          <dd
            className={`w-full font-['Inter:Semi_Bold',sans-serif] font-semibold not-italic leading-[normal] text-[#131313] ${geometry.value}`}
            style={item.valueTone ? { color: item.valueTone } : undefined}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
