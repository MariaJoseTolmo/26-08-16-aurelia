import { WasteRejectedBanner } from './WasteRejectedBanner';

/**
 * Franja de rechazo del panel de detalle de una solicitud — nodo `4295:24658`, la banda
 * roja que corona la tarjeta cuando la solicitud ya fue rechazada y espera correcciones.
 *
 * ES A DONDE LLEVA "Enviar rechazo". El modal `4295:24214` escribe el motivo; esta franja
 * es donde ese motivo queda a la vista, emplazada por el nodo `4295:24241`.
 *
 * NO ES `WasteFolioNotice` Y LA DIFERENCIA NO ES DE TONO. Aquél es un recuadro DENTRO del
 * cuerpo del panel: tiene borde en los cuatro lados, `rounded-[8px]`, márgenes laterales
 * y una sola tipografía. Esto es una BANDA A SANGRE pegada al borde superior de la
 * tarjeta —sin radio propio, sin borde salvo la línea de 2px que la separa de lo que
 * sigue— y con dos tipografías: un titular en negrita y una cita en itálica. Pasarle al
 * otro un cuarto tono habría dejado un componente donde el tono decide si hay caja o no.
 *
 * TAMPOCO ES `WasteNoticeBanner`, que es la banda de ANCHO DE VISTA de la cabecera: ésta
 * vive dentro de una tarjeta de 474px y su `px-[20px]` es el del panel, no el de la vista.
 *
 * Geometría del design context:
 *
 *   banda    bg #ffd0db · border-b-2 #bd3b5b · px-[20px] pt-[10px] pb-[12px] · gap-[10px]
 *            `items-start`: el titular arranca arriba y la cita crece hacia abajo
 *   icono    caja de 20 × 16 con el glifo de 16 × 16 centrado — ver `AlertCircleIcon`
 *   titular  Inter Bold 12px · leading normal · #570b1d
 *   cita     pt-[3px] · Inter Italic 11px · leading-[16.5px] · #570b1d
 *   estado   la misma línea, en Inter Semi Bold SIN itálica
 *
 * LOS TRES TEXTOS COMPARTEN EL `#570b1d` y el nodo no los distingue por color sino por
 * peso e inclinación: el titular pesa, la cita se inclina —porque es la voz de otro— y el
 * cierre vuelve a la vertical con medio peso, que es lo que lo lee como estado y no como
 * parte de la cita.
 */
interface WasteFolioRejectedBannerProps {
  /** Titular del nodo `4295:24663`: qué pasó, cuándo. */
  heading: string;
  /**
   * El motivo que se escribió en el modal, YA ENTRECOMILLADO. Las comillas las pone quien
   * arma el texto y no este componente: son parte del contenido —el nodo las dibuja
   * dentro del párrafo en itálica— y no de la caja.
   */
  reason: string;
  /** Cierre del nodo `4295:24665`: en qué queda la solicitud. */
  note: string;
}

export function WasteFolioRejectedBanner({
  heading,
  reason,
  note,
}: WasteFolioRejectedBannerProps) {
  return <WasteRejectedBanner heading={heading} reason={reason} note={note} />;
}
