import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  WarehouseFormAttachedCheckIcon,
  WarehouseFormCloseIcon,
  WarehouseFormUploadIcon,
} from '../icons/WarehouseIntakeFormIcons';
import { WasteSidrepUploadIcon } from '../icons/WasteSidrepDocumentsIcons';

/**
 * Zona de carga de archivos del flujo SIDREP. El mismo nodo aparece en dos formas:
 *
 *   FILA (`variant="row"`)
 *     `4230:10649`  "Ticket de pesaje"        (paso 1)
 *     `3765:39861`  "Guía de despacho RESPEL" (paso 2)
 *     `3765:39868`  "HDS"                     (paso 2)
 *
 *     caja    border-[1.5px] DASHED #d1d1d1 · bg white · rounded-[9px]
 *             flex gap-[12px] items-center · px-[17.5px] py-[15.5px]
 *     icono   caja 34 × 34 · bg white · border #e3e3e3 · rounded-[8px]
 *             glifo nube 17.5 × 14
 *     rótulo  Inter Semi Bold 10px  #646464
 *     ayuda   Inter Regular   9.5px #acacac
 *
 *     CARGADA (`4085:77279`): bg #e0ffd3, borde SÓLIDO #a8dfa8, la caja del icono
 *     con borde #a8dfa8, el glifo pasa al check y aparece el botón de quitar.
 *
 *   BALDOSA (`variant="tile"`)
 *     `3765:39885` y hermanas — las cuatro fotos del vehículo (paso 2)
 *
 *     caja    border-[1.5px] DASHED #d1d1d1 · bg white · rounded-[7px] · 240 × 240
 *             flex flex-col items-center justify-center · p-[11.5px]
 *     glifo   20 × 16 — `WarehouseFormUploadIcon`, el mismo dibujo que la nube de
 *             "Fotografía de la etiqueta" del formulario de ingreso (`3564:1389`)
 *             escalado 20/17.5. NO es el de la fila: esa nube (`4230:10651`) mide lo
 *             mismo que `3564:1389` pero es otro dibujo.
 *     rótulo  pt-[4px] · Inter Semi Bold 10px  #646464 · centrado
 *     ayuda   pt-[2px] · Inter Regular   9.5px #acacac · centrado
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BALDOSA CON FOTO CARGADA — nodo `3765:40128`
 *
 * NO es la baldosa vacía pintada de verde, que era la extrapolación anterior y
 * estaba equivocada. El nodo mantiene la caja EXACTAMENTE igual —dashed `#d1d1d1`
 * sobre blanco— y le superpone dos cosas:
 *
 *   vista previa  `3765:40131`  la foto, centrada y sin recortar
 *   pie           `3765:40132`  bottom-[8px] left-[8px] · w-[224px] · p-[9.5px]
 *                               bg #e0ffd3 · border-[1.5px] #a8dfa8 · rounded-[9px]
 *                               caja de icono 19 × 19 · rounded-[4px] · glifo 10 × 8
 *                               rótulo   Inter Semi Bold 10px   #131313  ("Frontal-")
 *                               archivo  Inter Regular   10.5px #2a5c16  ("foto.jpg")
 *                               quitar   18 × 18 · rounded-[5px] · X de 12 × 12
 *
 * DE DÓNDE SALE LA CAJA DE LA VISTA PREVIA. El nodo la posiciona con
 * `left-1/2 top-[calc(50%-14px)]` y dos `translate`, o sea centrada y 14px arriba.
 * Traducido a insets sobre la baldosa de 240: `top-[8px] bottom-[36px]` (196 de
 * alto) e `inset-x-[2px]` (236 de ancho). Se verifica con las dos muestras del
 * diseño: la foto vertical de `3765:40131` queda 136 × 196 —limitada por el alto— y
 * la horizontal de `3765:40157` queda 236 × 94 —limitada por el ancho—. Las dos
 * salen exactas con `object-contain` en esa caja, así que van los insets en vez de
 * los px, que además sobreviven a que la baldosa sea responsiva.
 *
 * El pie TAPA un poco la foto, y es lo que el nodo hace: la previa llega hasta
 * y=204 y el pie arranca en y=194.
 *
 * Los dos iconos del pie ya existían, verificado comparando trazados módulo escala:
 * el check de 10 × 8 es `WarehouseFormAttachedCheckIcon` (17.5 × 14) escalado
 * 0.5714, y la X es `figma-432-6691-close.svg` tal cual.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El `<input type="file">` va oculto detrás de un `<button>`: el nodo dibuja un
 * recuadro sin control visible, y envolverlo así lo hace operable con teclado sin
 * cambiar el aspecto. En la baldosa cargada el disparador y el botón de quitar son
 * HERMANOS y no anidados —un `<button>` dentro de otro es HTML inválido y rompe el
 * teclado—: el disparador es una capa absoluta que cubre la baldosa y el pie va
 * encima.
 */

type DropzoneVariant = 'row' | 'tile';

/**
 * URL local de la vista previa, revocada al cambiar de archivo o al desmontar.
 *
 * Sin el `revokeObjectURL` cada foto elegida deja un blob retenido en memoria
 * mientras viva la pestaña, y en esta pantalla se eligen cuatro y se reemplazan
 * varias veces.
 */
function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // Solo las imágenes tienen previa; un PDF no se puede mostrar así.
    if (!file || !file.type.startsWith('image/')) {
      setUrl(null);
      return undefined;
    }

    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}

interface WasteSidrepFileDropzoneProps {
  variant?: DropzoneVariant;
  label: string;
  /** Formatos y tamaño máximo, tal como los escribe el nodo. */
  hint: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  /**
   * Texto de la segunda línea con archivo cargado. Por defecto el nombre del
   * archivo; el ticket de pesaje lo usa para decir "Analizando ticket…".
   */
  loadedHint?: string;
  /**
   * `true` cuando la carga está confirmada y la FILA va en verde. El ticket lo ata
   * a la respuesta de la API, no a la existencia del archivo.
   *
   * La BALDOSA lo ignora: su estado cargado depende de que haya archivo, porque lo
   * que muestra es la foto y no el resultado de una validación.
   */
  confirmed?: boolean;
  /** Contenido extra a la derecha, dentro de la caja. Solo la variante fila. */
  trailing?: ReactNode;
}

/** Caja de la zona sin archivo: la misma en las dos variantes. */
const EMPTY_SHELL = 'border-dashed border-[#d1d1d1] bg-white';

export function WasteSidrepFileDropzone({
  variant = 'row',
  label,
  hint,
  accept,
  file,
  onChange,
  loadedHint,
  confirmed = false,
  trailing,
}: WasteSidrepFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useObjectUrl(variant === 'tile' ? file : null);

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      aria-label={label}
      className="hidden"
      onChange={(event) => onChange(event.target.files?.[0] ?? null)}
    />
  );

  if (variant === 'tile') {
    /*
     * `aspect-square` en vez de los 240px del nodo: las cuatro baldosas de
     * `3765:39883` suman 990 dentro de un contenedor de 954, así que el diseño se
     * desborda 36px. La proporción cuadrada y el gap de 10px se conservan; el
     * desborde no.
     */
    if (!file) {
      return (
        <div className="w-full">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`flex aspect-square w-full flex-col items-center justify-center rounded-[7px] border-[1.5px] p-[11.5px] transition-colors ${EMPTY_SHELL}`}
          >
            <WarehouseFormUploadIcon className="block h-[16px] w-[20px] shrink-0 text-[#acacac]" />
            <span className="w-full pt-[4px] text-center font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] text-[#646464]">
              {label}
            </span>
            <span className="w-full pt-[2px] text-center font-['Inter:Regular',sans-serif] text-[9.5px] font-normal not-italic leading-[normal] text-[#acacac]">
              {hint}
            </span>
          </button>
          {input}
        </div>
      );
    }

    return (
      <div className="relative aspect-square w-full">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={`Reemplazar la foto ${label.toLowerCase()}`}
          className={`absolute inset-0 rounded-[7px] border-[1.5px] ${EMPTY_SHELL}`}
        />
        {/* Insets derivados del nodo: 196 de alto y 236 de ancho sobre la baldosa de 240. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-[2px] bottom-[36px] top-[8px]">
          {previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-contain" /> : null}
        </div>
        <div className="absolute bottom-[8px] left-[8px] right-[8px] flex items-center gap-[12px] rounded-[9px] border-[1.5px] border-solid border-[#a8dfa8] bg-[#e0ffd3] p-[9.5px]">
          <span className="flex min-w-px flex-1 items-center gap-[4px]">
            <span className="flex size-[19px] shrink-0 items-center justify-center rounded-[4px] border border-solid border-[#a8dfa8] bg-white p-px">
              <WarehouseFormAttachedCheckIcon className="block h-[8px] w-[10px] shrink-0 text-[#2a5c16]" />
            </span>
            {/*
              El nodo parte el texto en dos: el rótulo con el guion pegado
              (`3765:40138`) y el nombre del archivo (`3765:40139`), cada uno con su
              propio tamaño y color.
            */}
            <span className="flex min-w-0 items-start">
              <span className="shrink-0 whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] text-[#131313]">
                {label}-
              </span>
              <span className="truncate font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#2a5c16]">
                {file.name}
              </span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Quitar la foto ${label.toLowerCase()}`}
            className="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] transition-colors hover:bg-[rgba(0,0,0,0.06)]"
          >
            <WarehouseFormCloseIcon className="block size-[12px] shrink-0 text-[#2a5c16]" />
          </button>
        </div>
        {input}
      </div>
    );
  }

  const labelClass = `font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] ${
    confirmed ? 'text-[#131313]' : 'text-[#646464]'
  }`;
  const hintClass = `font-['Inter:Regular',sans-serif] font-normal not-italic leading-[normal] ${
    file ? 'text-[10.5px] text-[#2a5c16]' : 'text-[9.5px] text-[#acacac]'
  }`;

  return (
    <div
      className={`flex w-full items-center gap-[12px] rounded-[9px] border-[1.5px] px-[17.5px] py-[15.5px] ${
        confirmed ? 'border-solid border-[#a8dfa8] bg-[#e0ffd3]' : EMPTY_SHELL
      }`}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-w-px flex-1 items-center gap-[12px] text-left"
      >
        <span
          className={`flex size-[34px] shrink-0 items-center justify-center rounded-[8px] border border-solid bg-white p-px ${
            confirmed ? 'border-[#a8dfa8]' : 'border-[#e3e3e3]'
          }`}
        >
          {confirmed ? (
            <WarehouseFormAttachedCheckIcon className="block h-[14px] w-[17.5px] shrink-0 text-[#2a5c16]" />
          ) : (
            <WasteSidrepUploadIcon className="block h-[14px] w-[17.5px] shrink-0 text-[#acacac]" />
          )}
        </span>
        <span className="flex min-w-0 flex-col items-start gap-[2px]">
          <span className={`truncate ${labelClass}`}>{label}</span>
          <span className={`truncate ${hintClass}`}>{loadedHint ?? (file ? file.name : hint)}</span>
        </span>
      </button>
      {trailing}
      {/* Botón de quitar del nodo `4085:77287`; sin archivo no hay nada que quitar. */}
      {file ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Quitar ${file.name}`}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[5px] transition-colors hover:bg-[rgba(0,0,0,0.05)]"
        >
          <WarehouseFormCloseIcon
            className={`block size-[16px] shrink-0 ${confirmed ? 'text-[#2a5c16]' : 'text-[#646464]'}`}
          />
        </button>
      ) : null}
      {input}
    </div>
  );
}
