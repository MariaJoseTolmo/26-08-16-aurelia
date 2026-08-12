import { BellIcon } from '../../../shared/components/icons/BellIcon';
import { WarehousePageNextIcon } from '../icons/WarehouseIntakeIcons';
import { WasteWithdrawalDraftFormIcon } from '../icons/WasteWithdrawalFormIcons';
import {
  WASTE_WITHDRAWAL_DRAFT_NOTICE,
  type WasteWithdrawalDraftProgress,
} from '../wasteWithdrawalDraft';

/**
 * Aviso "Formulario inconcluso" — nodo Figma `4278:15644`, emplazado en la vista de
 * histórico (`4278:14803`) entre la bajada y la barra de acciones.
 *
 *   `4278:15645`  encabezado   border-b #e3e3e3 · px-[14px] pt-[10px] pb-[11px]
 *                              campana 15 × 12 · gap-[7px] · Inter Semi Bold 12px #001e39
 *   `4278:15650`  cuerpo       px-[14px] py-[10px]
 *     `4278:15651`  tarjeta    rounded-[12px] · border #e3e3e3 · bg white
 *       `4278:15652`  columna izquierda  w-[219px] · p-[14px]
 *       `4278:15655`  fila del proceso   flex-1 · border-l-[1.5px] · pl-[15.5px] pr-[14px] py-[14px]
 *       `4278:15673`  punto rojo         #c4365a · 16 × 16
 *
 * ES EL MISMO CASCARÓN QUE `SprProcessStatusSection`. La tarjeta con `rounded-[9px]`,
 * borde `#e3e3e3` y encabezado de campana + título en Inter Semi Bold 12px `#001e39`
 * es un componente del UI Kit que SPR ya dibuja para "Estatus del proceso". No se
 * extrajo a `shared/` en esta entrega por una diferencia de 1px —SPR usa `py-[10px]`
 * y este nodo `pt-[10px] pb-[11px]`—: unificarlos mueve una pantalla de SPR que nadie
 * pidió tocar. La campana SÍ se compartió, que era el duplicado real. Queda anotado.
 *
 * TODA LA TARJETA ES EL BOTÓN, no solo el chevrón. El nodo no dibuja un control
 * aparte: el chevrón de `4278:15669` es la señal de que la fila lleva a algún lado, y
 * el destino es el paso que falta completar. Un área de clic de 16 × 13px para
 * retomar un formulario sería hostil.
 *
 * EL PUNTO ROJO VA CENTRADO SOBRE EL DIVISOR. El nodo lo pone en `x=211` con 16px de
 * ancho, y el divisor está en 219: 211 + 8 = 219, o sea el centro del punto cae
 * exactamente sobre la línea. No es una coincidencia de posición a mano, así que se
 * escribe como tal.
 *
 * El punto es decorativo: `aria-hidden`. Lo que tiene que anunciar el lector de
 * pantalla es que hay un formulario sin terminar y a qué paso lleva, y eso va en el
 * `aria-label` del botón.
 */
interface WasteWithdrawalDraftNoticeProps {
  progress: WasteWithdrawalDraftProgress;
  /** Transportista del borrador, ya como rótulo — nodo `4278:15663`. */
  carrierLabel: string;
  /** "Hoy 16:54". */
  savedAtLabel: string;
  onResume: () => void;
}

export function WasteWithdrawalDraftNotice({
  progress,
  carrierLabel,
  savedAtLabel,
  onResume,
}: WasteWithdrawalDraftNoticeProps) {
  /*
   * SIN `p-px`, aunque el design-context lo declare. El nodo mide 150.5 de alto y sus
   * hijos arrancan en `y=1`: 1 + 36 + 112.5 + 1 = 150.5. O sea el único inset es el
   * borde, que Figma dibuja HACIA ADENTRO. En Tailwind `border` ya lo aporta; sumarle
   * `p-px` mete un segundo píxel por lado y la tarjeta terminaría en 152.5.
   */
  return (
    <section
      className="w-full rounded-[9px] border border-solid border-[#e3e3e3] bg-white"
      data-name="Notificaciones del proceso"
    >
      <div className="w-full border-b border-solid border-[#e3e3e3] px-[14px] pb-[11px] pt-[10px]">
        <div className="flex items-center gap-[7px]">
          <BellIcon className="block h-[12px] w-[15px] shrink-0 text-[#24588b]" />
          <p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#001e39]">
            {WASTE_WITHDRAWAL_DRAFT_NOTICE.heading}
          </p>
        </div>
      </div>

      <div className="flex w-full items-center px-[14px] py-[10px]">
        <button
          type="button"
          onClick={onResume}
          /*
           * `hover:bg-[#fafcff]` no está en el nodo —Figma no dibuja el hover— y es
           * el mismo tono con el que `SprProcessStatusSection` marca sus filas
           * accionables. Un bloque que navega y no responde al puntero no se lee como
           * clickeable.
           */
          /*
            `overflow-hidden` porque la columna derecha lleva fondo blanco y llega al
            borde: sin recorte, sus esquinas cuadradas se asoman por fuera del
            `rounded-[12px]`. Es el `overflow-clip` del nodo.
          */
          className="relative flex w-full items-stretch overflow-hidden rounded-[12px] border border-solid border-[#e3e3e3] bg-white text-left hover:bg-[#fafcff]"
          /*
            Sin pasos numerados el rótulo no puede decir "en el paso N de M": el
            borrador todavía está en el formulario, o es un retiro que no pasa por
            SIDREP. Ahí anuncia la acción, que es lo que el usuario necesita oír.
          */
          aria-label={
            progress.steps
              ? `${WASTE_WITHDRAWAL_DRAFT_NOTICE.title}: continuar la ${WASTE_WITHDRAWAL_DRAFT_NOTICE.processName.toLowerCase()} en el paso ${progress.steps.step} de ${progress.steps.totalSteps}`
              : `${WASTE_WITHDRAWAL_DRAFT_NOTICE.title}: continuar la ${WASTE_WITHDRAWAL_DRAFT_NOTICE.processName.toLowerCase()}`
          }
        >
          <div className="relative flex w-[219px] shrink-0 flex-col justify-center p-[14px]">
            <p className="font-['Inter:Bold',sans-serif] text-[15px] font-bold not-italic leading-[normal] text-[#131313]">
              {WASTE_WITHDRAWAL_DRAFT_NOTICE.title}
            </p>
            <p className="font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]">
              {WASTE_WITHDRAWAL_DRAFT_NOTICE.helper}
            </p>

            {/*
              Punto rojo `4278:15673`. Va colgado del BORDE DERECHO de esta columna con
              `-right-[8px]` —la mitad de sus 16px— en vez del `left-[211px]` del nodo.
              Es la misma posición y dice por qué: el punto está centrado sobre el
              divisor. Con el número crudo, el borde de 1px de la tarjeta lo corre un
              píxel y cualquier cambio de ancho de la columna lo deja flotando.
            */}
            <span
              aria-hidden="true"
              className="absolute -right-[8px] top-[12.4px] size-[16px] rounded-[8px] bg-[#c4365a]"
            />
          </div>

          <div className="relative flex min-w-px flex-1 items-center gap-[12px] border-l-[1.5px] border-solid border-[#e3e3e3] bg-white py-[14px] pl-[15.5px] pr-[14px] drop-shadow-[0px_1px_2px_rgba(0,0,0,0.06)]">
            <span className="flex size-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#ffeab8]">
              <WasteWithdrawalDraftFormIcon className="block h-[18px] w-[22.5px] shrink-0 text-[#463100]" />
            </span>

            <div className="flex min-w-px flex-1 flex-col items-start">
              <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[13px] font-bold not-italic leading-[normal] text-[#131313]">
                {WASTE_WITHDRAWAL_DRAFT_NOTICE.processName}
              </p>
              <div className="pt-[3px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
                <p>{carrierLabel}</p>
                <p>{savedAtLabel}</p>
              </div>
              {/*
                La barra y el rótulo salen del MISMO `percent`, así que no pueden
                discrepar. El nodo dibuja la barra al 38% con el rótulo en 33%
                —`4278:15666` mide 236px sobre 621.59— y gana el número escrito, que
                es el que se lee.

                SIN PASOS NO HAY BARRA. Ver la nota de `steps` en
                `wasteWithdrawalDraft`: dibujarla al 100% sobre un formulario
                inconcluso diría lo contrario de lo que el aviso viene a decir.
              */}
              {progress.steps ? (
                <div className="flex w-full items-center gap-[8px] pt-[8px]">
                  <div className="h-[4px] min-w-px flex-1 overflow-hidden rounded-[2px] bg-[#e3e3e3]">
                    <div
                      className="h-[4px] rounded-[2px] bg-[#c8a064]"
                      style={{ width: `${progress.steps.percent}%` }}
                    />
                  </div>
                  <span className="shrink-0 font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal] text-[#8e6e3e]">
                    {progress.steps.percent}%
                  </span>
                </div>
              ) : null}
            </div>

            {/*
              El chevrón de `4278:15669` es el MISMO glifo que la flecha "siguiente"
              del pie de las tablas, escalado 1.3 (16.25 × 13 contra 12.5 × 10): se
              compararon los coeficientes de los dos `path` y la razón es 1.3006
              constante. Se reutiliza ese componente; el nombre habla de paginación
              porque es donde apareció primero, no porque el dibujo sea de ahí.
            */}
            <WarehousePageNextIcon className="block h-[13px] w-[16.25px] shrink-0 text-[#acacac]" />

            {/*
              Pastilla `4278:15671`. El nodo le da 64px de ancho fijo y pone el texto
              en `top-[2px]`, que no es el centro de sus 18px de alto: es una caja de
              texto de Figma. Acá el ancho lo da el contenido —"Pasos 2/3" mide lo
              mismo que "Pasos 1/3"— y el texto va centrado.
            */}
            {progress.steps ? (
              <span className="absolute right-[10px] top-[11px] flex h-[18px] items-center rounded-[6px] border border-solid border-[#e8c86a] bg-[#ffeab8] px-[7px] font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal] text-[#463100]">
                {progress.steps.stepsLabel}
              </span>
            ) : null}
          </div>
        </button>
      </div>
    </section>
  );
}
