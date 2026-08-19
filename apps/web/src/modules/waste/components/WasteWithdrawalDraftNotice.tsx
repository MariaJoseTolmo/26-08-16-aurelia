import { WarehousePageNextIcon } from '../icons/WarehouseIntakeIcons';
import { WasteWithdrawalDraftFormIcon } from '../icons/WasteWithdrawalFormIcons';
import {
  WASTE_WITHDRAWAL_DRAFT_NOTICE,
  type WasteWithdrawalDraftProgress,
} from '../wasteWithdrawalDraft';
import { WasteProcessNoticeCard, WasteProcessNoticeIcon } from './WasteProcessNoticeCard';

/**
 * Aviso "Formulario inconcluso" — nodo Figma `4278:15644`, emplazado en la vista de
 * histórico (`4278:14803`) entre la bajada y la barra de acciones.
 *
 * EL CASCARÓN VIVE EN `WasteProcessNoticeCard`: encabezado de campana, tarjeta de dos
 * columnas, punto rojo sobre el divisor y la decisión de cuándo la tarjeta es un botón.
 * Se extrajo cuando apareció el segundo aviso de la vista (`4278:17632`, las solicitudes
 * rechazadas), que declara el mismo cascarón valor por valor. Acá queda lo propio de este
 * nodo, que es su contenido:
 *
 *   `4278:15652`  columna izquierda  título 15px bold + bajada 12px
 *   `4278:15655`  fila del proceso   glifo ámbar, proceso, transportista, guardado
 *   `4278:15666`  barra de progreso  sólo cuando hay pasos que numerar
 *   `4278:15671`  pastilla           "Pasos 1/3", ídem
 *
 * TODA LA TARJETA ES EL BOTÓN, no sólo el chevrón: el chevrón de `4278:15669` es la señal
 * de que la fila lleva a algún lado, y el destino es el paso que falta completar. Un área
 * de clic de 16 × 13px para retomar un formulario sería hostil.
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
  return (
    <WasteProcessNoticeCard
      onAction={onResume}
      /*
        Sin pasos numerados el rótulo no puede decir "en el paso N de M": el borrador
        todavía está en el formulario, o es un retiro que no pasa por SIDREP. Ahí anuncia
        la acción, que es lo que el usuario necesita oír.
      */
      actionLabel={
        progress.steps
          ? `${WASTE_WITHDRAWAL_DRAFT_NOTICE.title}: continuar la ${WASTE_WITHDRAWAL_DRAFT_NOTICE.processName.toLowerCase()} en el paso ${progress.steps.step} de ${progress.steps.totalSteps}`
          : `${WASTE_WITHDRAWAL_DRAFT_NOTICE.title}: continuar la ${WASTE_WITHDRAWAL_DRAFT_NOTICE.processName.toLowerCase()}`
      }
      aside={
        <>
          <p className="font-['Inter:Bold',sans-serif] text-[15px] font-bold not-italic leading-[normal] text-[#131313]">
            {WASTE_WITHDRAWAL_DRAFT_NOTICE.title}
          </p>
          <p className="font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]">
            {WASTE_WITHDRAWAL_DRAFT_NOTICE.helper}
          </p>
        </>
      }
    >
      <WasteProcessNoticeIcon background="bg-[#ffeab8]">
        <WasteWithdrawalDraftFormIcon className="block h-[18px] w-[22.5px] shrink-0 text-[#463100]" />
      </WasteProcessNoticeIcon>

      <div className="flex min-w-px flex-1 flex-col items-start">
        <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[13px] font-bold not-italic leading-[normal] text-[#131313]">
          {WASTE_WITHDRAWAL_DRAFT_NOTICE.processName}
        </p>
        <div className="pt-[3px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
          <p>{carrierLabel}</p>
          <p>{savedAtLabel}</p>
        </div>
        {/*
          La barra y el rótulo salen del MISMO `percent`, así que no pueden discrepar. El
          nodo dibuja la barra al 38% con el rótulo en 33% —`4278:15666` mide 236px sobre
          621.59— y gana el número escrito, que es el que se lee.

          SIN PASOS NO HAY BARRA. Ver la nota de `steps` en `wasteWithdrawalDraft`:
          dibujarla al 100% sobre un formulario inconcluso diría lo contrario de lo que el
          aviso viene a decir.
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
        El chevrón de `4278:15669` es el MISMO glifo que la flecha "siguiente" del pie de
        las tablas, escalado 1.3 (16.25 × 13 contra 12.5 × 10): se compararon los
        coeficientes de los dos `path` y la razón es 1.3006 constante. Se reutiliza ese
        componente; el nombre habla de paginación porque es donde apareció primero, no
        porque el dibujo sea de ahí.
      */}
      <WarehousePageNextIcon className="block h-[13px] w-[16.25px] shrink-0 text-[#acacac]" />

      {/*
        Pastilla `4278:15671`. El nodo le da 64px de ancho fijo y pone el texto en
        `top-[2px]`, que no es el centro de sus 18px de alto: es una caja de texto de Figma.
        Acá el ancho lo da el contenido —"Pasos 2/3" mide lo mismo que "Pasos 1/3"— y el
        texto va centrado.
      */}
      {progress.steps ? (
        <span className="absolute right-[10px] top-[11px] flex h-[18px] items-center rounded-[6px] border border-solid border-[#e8c86a] bg-[#ffeab8] px-[7px] font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal] text-[#463100]">
          {progress.steps.stepsLabel}
        </span>
      ) : null}
    </WasteProcessNoticeCard>
  );
}
