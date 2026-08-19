import type { ReactNode } from 'react';

/**
 * Armazón del maestro-detalle de "Folios SIDREP" — nodos `3083:10908` (pestaña
 * "Cerrados") y `3081:7870` (pestaña "Abiertos").
 *
 * Las dos pestañas dibujan la MISMA grilla: la lista de folios a la izquierda y el
 * detalle del elegido a la derecha, declarado STICKY —su hueco se llama "Sticky
 * placeholder – Container" en los dos nodos— para que el detalle quede a la vista
 * mientras se recorre una lista larga.
 *
 * Vive acá y no repetido en cada panel porque es geometría del diseño y no de una
 * pestaña: con la grilla escrita en línea en dos lugares, el día que el diseño cambie
 * la proporción hay que acordarse de los dos.
 *
 * Geometría del design context: 547.72 y 476.27 con `gap-[16px]`, que sobre los 1044
 * del cuerpo suman exactamente el ancho disponible. Van como `fr` y no en píxeles —el
 * brief prohíbe anchos fijos— así que la proporción del diseño se conserva y las dos
 * columnas crecen con el viewport. Debajo de `lg` se apilan: a menos de 1024 el detalle
 * en 476px queda ilegible al lado de la lista.
 *
 * El `top-[20px]` del sticky es el mismo `pt-[20px]` del cuerpo de la vista: al
 * fijarse, el panel queda a la misma distancia del borde superior que tenía al entrar.
 */
interface WasteFolioMasterDetailProps {
  /** La lista maestra — `WasteFolioListCard` en las dos pestañas. */
  list: ReactNode;
  /** El panel del folio elegido, o el aviso de "elegí un folio". */
  detail: ReactNode;
}

export function WasteFolioMasterDetail({ list, detail }: WasteFolioMasterDetailProps) {
  return (
    <div className="grid w-full grid-cols-1 items-start gap-[16px] lg:grid-cols-[547.72fr_476.27fr]">
      {list}
      <div className="w-full lg:sticky lg:top-[20px]">{detail}</div>
    </div>
  );
}
