import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  WasteFolioSupportDocIcon,
  WasteFolioSupportEqualsIcon,
  WasteFolioSupportPdfIcon,
} from '../icons/WasteFolioSupportIcons';
import { WastePerformanceNormalIcon } from '../icons/WasteCompanyPerformanceIcons';
import {
  WasteWithdrawalContinueArrowIcon,
  WasteWithdrawalModalCloseIcon,
} from '../icons/WasteWithdrawalFormIcons';
import { WasteDefinitionGrid, type WasteDefinitionItem } from './WasteDefinitionGrid';
import type { WasteSidrepFolioPackageDoc } from '../wasteSidrepFolios';

/**
 * Modal "Respaldo de Traslado de Residuo" — DOS NODOS, una sola maqueta:
 *
 *   `3085:13254`  peligroso     emplazado en `3085:12902`
 *   `4327:35730`  no peligroso  emplazado en `4327:35379`
 *
 * Lo abre "Ver respaldo completo" (`3083:11032`), el pie del panel de detalle de un
 * folio SIDREP cerrado.
 *
 * Es el respaldo consolidado que se lleva a una fiscalización: el traslado completo
 * —quién lo llevó, en qué vehículo, con qué resolución—, la conciliación de pesos y,
 * cuando corresponde, el paquete de documentos, con su descarga en PDF.
 *
 * LAS DOS VARIANTES SE DIFERENCIAN EN DOS COSAS Y NADA MÁS. Cabecera, pastilla teal,
 * banda de pesos, nota legal y pie son idénticos nodo a nodo; lo que cambia es:
 *
 *   1. EL TÍTULO — "…de Residuo Peligroso" contra "…de Residuo No Peligroso".
 *   2. EL PAQUETE — el nodo peligroso lista "Documentos incluidos en este paquete"
 *      (guía RESPEL, HDS, fotografías del vehículo, declaración SIDREP) y el no
 *      peligroso NO TIENE esa sección: un traslado no peligroso no genera ninguno de
 *      esos documentos, así que después de la banda de pesos viene directo la nota.
 *
 * Las dos las decide UNA SOLA prop, `variant`, y el tipo de las props es una unión
 * discriminada por ella: con `variant="nonHazardous"` el compilador PROHÍBE pasar
 * `packageDocs`. Con dos props independientes —una para el título y otra para el
 * paquete— alcanzaba con tocar una para armar un respaldo que se titula "No Peligroso"
 * y lista una guía RESPEL, que es exactamente el documento que no puede existir.
 *
 * ES UN PANEL A LA DERECHA, no una tarjeta centrada, y eso sale del emplazamiento: el
 * nodo mide 538 × 985 en x=766, y=16 dentro de un frame de 1320 de ancho, o sea a 16px
 * del borde derecho y 16 del superior. El velo cubre TODO el viewport, también el
 * sidebar. Por eso el velo es `justify-end items-start` con `p-[16px]` en vez del
 * `items-center justify-center` de los otros modales del módulo.
 *
 * EL PANEL TOMA TODO EL ALTO DISPONIBLE, y no el de su contenido. Lo dice el nodo raíz
 * `4327:35730`, que es `justify-between` sobre `size-full`: mide 538 × 687 dentro de un
 * frame de 720, o sea el alto entero menos los 16px de arriba y abajo, y el hueco que
 * Figma marca "Automático" entre la nota legal y el pie es el espacio elástico que empuja
 * "Descargar PDF" contra el borde inferior.
 *
 * ESO IMPORTA JUSTO EN LA VARIANTE NO PELIGROSA. Sin el paquete de documentos, el
 * contenido no llega a llenar la pantalla, y con el panel acotado a `max-h-full` —como
 * estaba— se encogía hasta su contenido y el botón quedaba pegado a la nota en vez del
 * fondo. Por eso va `h-full`: el pie es una franja anclada abajo, no lo que sigue al
 * último párrafo.
 *
 * El hueco elástico NO se maqueta como un `justify-between` ni como un separador: lo
 * absorbe el `flex-1` del cuerpo, que es el único de los tres hijos que crece. En una
 * columna de tres donde el del medio se estira, el resultado es el mismo y el cuerpo
 * conserva su superficie blanca hasta el pie, como en el nodo.
 *
 * LOS 985px DE ALTO DEL NODO PELIGROSO NO CABEN EN EL VIEWPORT de 720 que dibuja el
 * fondo, y no es un error del diseño: Figma estiró el frame contenedor a 1031 para
 * mostrar el modal entero. Con `h-full` ese caso funciona igual —el cuerpo toma el
 * desplazamiento y la cabecera y el pie quedan quietos—; la diferencia es sólo si el
 * cuerpo scrollea o le sobra espacio. Esa división es la razón por la que la cabecera y
 * el cuerpo NO comparten el contenedor `3085:13255` del nodo: ahí son un grupo de Figma,
 * acá tienen que ser hermanos para que sólo uno scrollee.
 *
 * Geometría del design context:
 *
 *   panel     bg white · rounded-[16px] · w-[538px] · h-full (`size-full` del nodo)
 *   cabecera  px-[14px] py-[12px] · fila gap-[12px] items-center
 *             bloque izq flex-1 gap-[8px]; textos gap-[4px]
 *             título    Inter Bold 16px · leading-[22px] · tracking-[0.32px] · #2a2a2a
 *             subtítulo Inter Bold 11px · #646464
 *             pastilla  bg var(--teal/100,#c5fff6) · rounded-[20px] · px-[12px] py-[4px]
 *                       gap-[6px] · glifo 13.75 × 11 · texto Inter Bold 11px #006153
 *             cierre    caja 32 × 32
 *   cuerpo    border-t #e3e3e3 · px-[14px] pt-[15px] pb-[14px]
 *   rótulo    border-b #e3e3e3 · pb-[9px]
 *             Inter Bold 12px · tracking-[0.36px] · uppercase · #001e39
 *   grilla    py-[4px] → `WasteDefinitionGrid` en variante `modal`
 *   pesos     pt-[16px] · caja bg var(--gray/100_surf,#f7f7f7) · border #e3e3e3
 *             rounded-[8px] · px-[19px] py-[15px] · justify-between
 *             cifra Inter Bold 16px #131313 · rótulo pt-[2px] 9.5px #646464 uppercase
 *   paquete   py-[12px] · gap-[6px]
 *             fila bg #f9fafb · rounded-[6px] · px-[8px] py-[6px] · gap-[7px]
 *             casilla size-[24px] · bg #e6f3ff · rounded-[5px] · glifo 13.75 × 11
 *             nombre Inter Semi Bold 10px #131313 · peso Inter Regular 9px #acacac
 *   nota      border-t #e3e3e3 · pt-[17px]
 *             Inter Regular 9.5px / 15.2px · var(--gray/500,#acacac)
 *   pie       border-t #e3e3e3 · px-[20px] pt-[15px] pb-[14px] · justify-end
 *             botón border-[1.5px] #d1d1d1 · rounded-[8px] · h-[40px] · flex-1
 *                   gap-[6px] · glifo 16.25 × 13 · texto Inter Semi Bold 13px #333
 *
 * El `max-w-[1353.6px]` del cuerpo y el `rounded-[2px]` del mismo nodo se descartan:
 * el primero es mayor que el propio panel y el segundo no se ve, porque el cuerpo va
 * pegado a los bordes rectos de una tarjeta que ya redondea por fuera con
 * `overflow-hidden`.
 *
 * Los 538px SÍ se fijan, con `max-w-full`: es el ancho de un panel de diálogo, no de un
 * layout, y es el mismo criterio de `WasteSinaderDeclareModal` con sus 480.
 */

/**
 * Qué respaldo se está dibujando. Ver la nota del encabezado: de esto cuelgan el título
 * y la existencia del paquete de documentos.
 */
export type WasteFolioSupportVariant = 'hazardous' | 'nonHazardous';

/** Textos de los nodos `3085:13260` y `4327:35736`. */
export const WASTE_FOLIO_SUPPORT_TITLES: Record<WasteFolioSupportVariant, string> = {
  hazardous: 'Respaldo de Traslado de Residuo Peligroso',
  nonHazardous: 'Respaldo de Traslado de Residuo No Peligroso',
};

/** Rótulos de los nodos `3085:13270` y `3085:13339`. */
export const WASTE_FOLIO_SUPPORT_TRANSFER_SECTION = 'Datos del traslado';
export const WASTE_FOLIO_SUPPORT_PACKAGE_SECTION = 'Documentos incluidos en este paquete';

/** Texto del nodo `3085:13421`. */
export const WASTE_FOLIO_SUPPORT_DOWNLOAD = 'Descargar PDF';

/**
 * Nota al pie del nodo `3085:13416`.
 *
 * Se versiona como constante y no incrustada en el JSX porque es texto legal: dice de
 * dónde sale la información y a qué registro oficial remitirse, y cambiarlo no es una
 * edición de maqueta. El nodo la cierra con un espacio sobrante que no se reproduce.
 */
export const WASTE_FOLIO_SUPPORT_DISCLAIMER =
  'Este documento fue generado automáticamente por AurelIA como respaldo consolidado para procesos de fiscalización ambiental. La información contenida corresponde a los registros ingresados por Medio Ambiente y por la Empresa Colaboradora durante la gestión del presente folio. Para verificar el estado oficial de la declaración, consulte la Ventanilla Única del RETC (SIDREP).';

/** Rótulos de la banda de pesos — nodos `3085:13322`, `3085:13329` y `3085:13336`. */
const WEIGHT_DISPATCHED_LABEL = 'Despachado';
const WEIGHT_RECEIVED_LABEL = 'Recibido';

/**
 * Rótulo de una sección del cuerpo. Se usa dos veces en el mismo nodo, así que vive
 * acá como helper local en vez de repetir la fila de clases.
 *
 * NO es `WasteFieldLabel`: aquél es el gris de 10px de un dato suelto y éste es el azul
 * marino de 12px que encabeza una sección, con su línea inferior. Son dos rótulos
 * distintos del sistema de diseño.
 */
function SupportSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex w-full flex-col items-start border-b border-solid border-[#e3e3e3] pb-[9px]"
      data-name="Container"
    >
      <h3 className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[12px] font-bold uppercase not-italic leading-[normal] tracking-[0.36px] text-[#001e39]">
        {children}
      </h3>
    </div>
  );
}

/** Una de las tres cifras de la banda de pesos. */
function WeightFigure({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center" data-name="Container">
      <p className="whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[16px] font-bold not-italic leading-[normal] text-[#131313]">
        {value}
      </p>
      <div className="w-full pt-[2px]" data-name="Container">
        <p className="whitespace-nowrap text-center font-['Inter:Regular',sans-serif] text-[9.5px] font-normal uppercase not-italic leading-[normal] text-[#646464]">
          {label}
        </p>
      </div>
    </div>
  );
}

interface WasteFolioSupportModalBaseProps {
  open: boolean;
  /** Folio, residuo y transportista: "Folio SIDREP 2026-SD-04690 · …". Nodo `3085:13261`. */
  subtitle: string;
  /** Rótulo del estado, sin el "Estado: " que el modal antepone. */
  status: string;
  /**
   * Los datos del traslado — `folioSupportFacts`. Ocho en el nodo peligroso
   * (`3085:13271`) y siete en el no peligroso (`4327:35747`), el último a fila completa.
   * El recorte lo decide la proyección del folio, no este componente.
   */
  facts: WasteDefinitionItem[];
  /** Peso despachado ya formateado con unidad: "1.020 kg". */
  dispatched: string;
  /** Peso recibido en destino, mismo formato. */
  received: string;
  /** Brecha con unidad: "15 kg". Con cierre exacto, "0 kg". */
  difference: string;
  /**
   * Cómo se califica la brecha — el "(normal)" del nodo `3085:13336`. El rótulo se
   * arma acá como "Diferencia (normal)"; sin calificación queda sólo "Diferencia".
   */
  differenceQualifier?: string | null;
  onClose: () => void;
  /**
   * Genera y baja el PDF del respaldo — nodo `3084:11044`, que renderiza la API. Sin esto
   * el botón queda DESHABILITADO en vez de simular la descarga: un botón que no hace nada
   * ante un respaldo de fiscalización es peor que uno visiblemente apagado.
   */
  onDownload?: () => void;
  /** Bloquea el botón mientras la API arma el documento. */
  isDownloading?: boolean;
  /**
   * Mensaje del último intento fallido.
   *
   * Se muestra JUNTO AL BOTÓN y no como un `toast`: el modal tapa la vista, así que un
   * aviso que aparece por fuera puede quedar detrás del velo. Y sale con `role="alert"`
   * para que el lector de pantalla lo anuncie sin tener que volver a recorrer el diálogo.
   */
  downloadError?: string | null;
}

/**
 * El paquete VIAJA CON LA VARIANTE, no como prop aparte: ver la nota del encabezado.
 * `hazardous` lo exige y `nonHazardous` lo prohíbe, y las dos cosas las comprueba el
 * compilador en el punto de uso.
 */
type WasteFolioSupportModalProps = WasteFolioSupportModalBaseProps &
  (
    | {
        variant: 'hazardous';
        /** Los respaldos que componen el paquete — nodo `3085:13342` y hermanos. */
        packageDocs: WasteSidrepFolioPackageDoc[];
      }
    | { variant: 'nonHazardous'; packageDocs?: never }
  );

export function WasteFolioSupportModal({
  open,
  variant,
  subtitle,
  status,
  facts,
  dispatched,
  received,
  difference,
  differenceQualifier = null,
  packageDocs,
  onClose,
  onDownload,
  isDownloading = false,
  downloadError = null,
}: WasteFolioSupportModalProps): ReactNode {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  /*
   * El foco entra al PANEL y no al botón de cierre. Los dos hacen que Escape y el Tab
   * arranquen dentro del diálogo, pero enfocar el botón le deja su anillo de foco
   * dibujado desde el momento en que se abre —como si estuviera por accionarse—,
   * mientras el panel se anuncia por su `aria-labelledby` y no pinta nada. Por eso el
   * contenedor lleva `tabIndex={-1}`: lo hace enfocable por código sin meterlo en el
   * orden de tabulación.
   *
   * El panel es de LECTURA y no tiene campos, así que no hay un "primer control"
   * natural al que llevar el foco.
   */
  useEffect(() => {
    if (!open) return undefined;

    dialogRef.current?.focus();
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const differenceLabel = differenceQualifier
    ? `Diferencia (${differenceQualifier})`
    : 'Diferencia';

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-end bg-[rgba(19,19,19,0.75)] p-[16px]"
      onMouseDown={(event) => {
        // Solo el click en el velo cierra; uno que empieza dentro del panel no.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex h-full w-[538px] max-w-full flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] outline-none"
        data-node-id={variant === 'hazardous' ? '3085:13254' : '4327:35730'}
      >
        <div
          className="flex w-full shrink-0 flex-col items-center bg-white px-[14px] py-[12px]"
          data-name="Container"
        >
          <div className="flex w-full items-center gap-[12px]">
            <div className="flex min-w-px flex-1 flex-col items-start justify-center gap-[8px]">
              <div className="flex w-full flex-col items-start gap-[4px]">
                <h2
                  id={titleId}
                  className="w-full font-['Inter:Bold',sans-serif] text-[16px] font-bold not-italic leading-[22px] tracking-[0.32px] text-[#2a2a2a]"
                >
                  {WASTE_FOLIO_SUPPORT_TITLES[variant]}
                </h2>
                {/*
                  El subtítulo hereda el `font-bold` del bloque `3085:13259` en el nodo:
                  no es un párrafo regular en gris, es negrita en gris.
                */}
                <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold not-italic leading-[normal] text-[#646464]">
                  {subtitle}
                </p>
              </div>
              {/*
                Pastilla `3085:13262`. NO es `WastePill`: aquélla va `px-[9px] py-[3px]`
                sin icono, y ésta lleva glifo con `gap-[6px]` y `px-[12px] py-[4px]`. Es
                la misma caja que `WasteHazardBadge` —cápsula con icono— pero con el par
                teal y otro padding, así que va acá.

                El tilde en círculo es el MISMO glifo que la pastilla "Normal" de
                desempeño por empresa; se reusa su componente en la caja de este nodo.
              */}
              <span className="flex shrink-0 items-center gap-[6px] rounded-[20px] bg-[#c5fff6] px-[12px] py-[4px]">
                <WastePerformanceNormalIcon className="block h-[11px] w-[13.75px] shrink-0 text-[#006153]" />
                <span className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[11px] font-bold not-italic leading-[normal] text-[#006153]">
                  {`Estado: ${status}`}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar el respaldo"
              className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-black transition-colors hover:bg-[#f7f7f7]"
            >
              <WasteWithdrawalModalCloseIcon className="block size-[32px] shrink-0" />
            </button>
          </div>
        </div>

        {/*
          El cuerpo es el único que scrollea. El `min-h-0` es lo que se lo permite: sin
          él, un hijo flex no se encoge por debajo de su contenido y el panel entero
          crecería más allá del `max-h-full`, dejando el pie fuera de la pantalla.
        */}
        <div
          className="flex min-h-0 w-full flex-1 flex-col items-start overflow-y-auto border-t border-solid border-[#e3e3e3] bg-white px-[14px] pb-[14px] pt-[15px]"
          data-name="Container"
        >
          <SupportSectionTitle>{WASTE_FOLIO_SUPPORT_TRANSFER_SECTION}</SupportSectionTitle>

          <div className="w-full py-[4px]">
            <WasteDefinitionGrid items={facts} variant="modal" />
          </div>

          {/*
            Banda de conciliación `3085:13317`: despachado → recibido = diferencia. Los
            dos separadores son vectores del nodo y no caracteres de texto, así que
            miden igual y se alinean entre sí.

            En una ventana angosta las tres cifras se apilan (`flex-wrap` con
            `justify-center`) en vez de comprimirse: son números de 16px que no admiten
            recorte.
          */}
          <div className="w-full pt-[16px]" data-name="Container:margin">
            <div
              className="flex w-full flex-wrap items-center justify-between gap-y-[12px] rounded-[8px] border border-solid border-[#e3e3e3] bg-[#f7f7f7] px-[19px] py-[15px]"
              data-name="Container"
            >
              <WeightFigure value={dispatched} label={WEIGHT_DISPATCHED_LABEL} />
              <WasteWithdrawalContinueArrowIcon className="block h-[14px] w-[17.5px] shrink-0 text-[#acacac]" />
              <WeightFigure value={received} label={WEIGHT_RECEIVED_LABEL} />
              <WasteFolioSupportEqualsIcon className="block h-[14px] w-[17.5px] shrink-0 text-[#acacac]" />
              <WeightFigure value={difference} label={differenceLabel} />
            </div>
          </div>

          {/*
            El paquete `3085:13341` es LO ÚNICO que el nodo no peligroso no dibuja. Ahí
            la nota va pegada al pie de la banda de pesos: el `Container:margin`
            `4327:35882` no aporta separación —la línea arranca en y=289, exactamente
            donde termina la banda— y el `pt-[17px]` de adentro es el mismo.
          */}
          {packageDocs ? (
            <>
              <div className="w-full pt-[26px]" data-name="Container:margin">
                <SupportSectionTitle>{WASTE_FOLIO_SUPPORT_PACKAGE_SECTION}</SupportSectionTitle>
              </div>

              <div className="w-full py-[12px]" data-name="Container:margin">
                <ul className="flex w-full flex-col items-start gap-[6px]" data-name="Container">
                  {packageDocs.map((doc) => (
                    <li
                      key={doc.label}
                      className="flex w-full items-center gap-[7px] rounded-[6px] bg-[#f9fafb] px-[8px] py-[6px]"
                      data-name="Container"
                    >
                      <span className="flex size-[24px] shrink-0 items-center justify-center rounded-[5px] bg-[#e6f3ff]">
                        <WasteFolioSupportDocIcon className="block h-[11px] w-[13.75px] shrink-0 text-[#24588b]" />
                      </span>
                      <span className="min-w-px flex-1 truncate font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold not-italic leading-[normal] text-[#131313]">
                        {doc.label}
                      </span>
                      <span className="shrink-0 whitespace-nowrap font-['Inter:Regular',sans-serif] text-[9px] font-normal not-italic leading-[normal] text-[#acacac]">
                        {doc.size}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}

          <div className="w-full border-t border-solid border-[#e3e3e3] pt-[17px]" data-name="Container">
            <p className="w-full font-['Inter:Regular',sans-serif] text-[9.5px] font-normal not-italic leading-[15.2px] text-[#acacac]">
              {WASTE_FOLIO_SUPPORT_DISCLAIMER}
            </p>
          </div>
        </div>

        <div
          className="flex w-full shrink-0 flex-col items-stretch gap-[8px] border-t border-solid border-[#e3e3e3] bg-white px-[20px] pb-[14px] pt-[15px]"
          data-name="Container"
        >
          {downloadError ? (
            <p
              role="alert"
              className="w-full font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#570b1d]"
            >
              {downloadError}
            </p>
          ) : null}
          {/*
            Botón `3085:13418`. NO es `WasteSecondaryActionButton`: aquél lleva borde de
            1px, texto Inter Bold 12px #646464 y `px-[19px] py-[10px]`, sin icono. Éste
            tiene borde de 1.5px, alto fijo de 40, glifo y texto Semi Bold 13px #333.
          */}
          <button
            type="button"
            onClick={onDownload}
            disabled={!onDownload || isDownloading}
            /*
              `aria-busy` y el rótulo cambiado: la descarga tarda lo que la API tarde en
              componer el documento, y sin señal el botón apagado se lee como roto.
            */
            aria-busy={isDownloading}
            title={onDownload ? undefined : 'La generación del PDF del respaldo aún no está disponible'}
            className="flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-solid border-[#d1d1d1] bg-white px-[15.5px] py-[1.5px] transition-colors hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
          >
            <WasteFolioSupportPdfIcon className="block h-[13px] w-[16.25px] shrink-0 overflow-visible text-[#333333]" />
            <span className="whitespace-nowrap text-center font-['Inter:Semi_Bold',sans-serif] text-[13px] font-semibold not-italic leading-[normal] text-[#333333]">
              {isDownloading ? 'Generando PDF…' : WASTE_FOLIO_SUPPORT_DOWNLOAD}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
