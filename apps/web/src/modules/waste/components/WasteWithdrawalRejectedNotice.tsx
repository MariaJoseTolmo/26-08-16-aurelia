import { AlertCircleIcon } from '../../../shared/components/icons/AlertCircleIcon';
import {
  WASTE_WITHDRAWAL_REJECTED_NOTICE,
  type WasteWithdrawalRejectedNoticeData,
} from '../wasteWithdrawalRejectedNotice';
import { WasteProcessNoticeCard, WasteProcessNoticeIcon } from './WasteProcessNoticeCard';

/**
 * Aviso "Rechazadas" — nodo Figma `4278:17632`, emplazado en la vista de histórico
 * (`4278:17511`) entre la bajada y la barra de acciones.
 *
 * EL CASCARÓN VIVE EN `WasteProcessNoticeCard`, compartido con el aviso de formulario
 * inconcluso. Acá queda lo propio de este nodo:
 *
 *   `4278:17640`  columna izquierda  rótulo 15px bold #131313 + conteo 19px bold #570b1d
 *   `4278:17643`  fila del proceso   glifo rosa, proceso, bajada y fecha del último rechazo
 *
 * NO ES UN BOTÓN: el nodo no dibuja chevrón —el de borrador sí— y el propio texto manda a
 * mirar la columna "Folio SIDREP" de la tabla que está justo abajo. No hay una pantalla a
 * la que llevar: quien tiene que corregir es el transportista, no quien mira el histórico.
 *
 * EL CONTEO ES LO QUE PESA, y por eso es el texto más grande de la tarjeta —19px contra los
 * 15 del rótulo— y el único en el vino `#570b1d` del sistema. Las dos medidas salen del
 * nodo: sus cajas de texto miden 18 y 23 de alto con el `leading` normal de Inter (1.21),
 * o sea 15px y 19px.
 *
 * EL GLIFO ES `AlertCircleIcon`, el mismo círculo con exclamación que la franja de rechazo
 * del panel de detalle. Se comparó el SVG que exporta este nodo (`4278:18058`, caja de
 * 22.5 × 18) contra el componente: es el MISMO path de 16 × 16, desplazado +3.25 en x y +1
 * en y, o sea el dibujo centrado con aire a los costados. Es la cuarta caja del mismo
 * glifo; ver la lista en `AlertCircleIcon`.
 */
interface WasteWithdrawalRejectedNoticeProps {
  notice: WasteWithdrawalRejectedNoticeData;
}

export function WasteWithdrawalRejectedNotice({ notice }: WasteWithdrawalRejectedNoticeProps) {
  return (
    <WasteProcessNoticeCard
      aside={
        <>
          <p className="font-['Inter:Bold',sans-serif] text-[15px] font-bold not-italic leading-[normal] text-[#131313]">
            {WASTE_WITHDRAWAL_REJECTED_NOTICE.label}
          </p>
          <p className="font-['Inter:Bold',sans-serif] text-[19px] font-bold not-italic leading-[normal] text-[#570b1d]">
            {notice.countLabel}
          </p>
        </>
      }
    >
      <WasteProcessNoticeIcon background="bg-[#ffd0db]">
        <AlertCircleIcon className="block size-[16px] shrink-0 text-[#570b1d]" />
      </WasteProcessNoticeIcon>

      <div className="flex min-w-px flex-1 flex-col items-start">
        <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[13px] font-bold not-italic leading-[normal] text-[#131313]">
          {WASTE_WITHDRAWAL_REJECTED_NOTICE.processName}
        </p>
        {/*
          La bajada y la fecha son DOS párrafos en un bloque de 11px, igual que el
          transportista y el guardado del aviso de borrador: el nodo los dibuja como un solo
          texto de dos líneas, pero son dos datos —qué pasó y cuándo— y la segunda línea no
          es un salto del párrafo sino otra cosa.
        */}
        <div className="pt-[3px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[#646464]">
          <p>{WASTE_WITHDRAWAL_REJECTED_NOTICE.description}</p>
          <p>{notice.rejectedAtLabel}</p>
        </div>
      </div>
    </WasteProcessNoticeCard>
  );
}
