import {
  WASTE_WITHDRAWAL_REJECTED_NOTICE,
  type WasteWithdrawalRejectedNoticeData,
} from '../wasteWithdrawalRejectedNotice';
import rejectedRequestIcon from '../icons/figma-4278-18197-rejected-request.svg';
import { WasteProcessNoticeCard, WasteProcessNoticeIcon } from './WasteProcessNoticeCard';

/**
 * Aviso "Rechazadas" — nodo Figma `4278:18184`, variante del nodo `4278:17632`,
 * emplazado en la vista de histórico entre la bajada y la barra de acciones.
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
 * EL GLIFO ES EL SVG EXPORTADO DEL NODO `4278:18197`, no un equivalente de una librería.
 * Su caja de 22.5 × 18 conserva el dibujo de 16 × 16 centrado con 3.25px de aire lateral
 * y 1px vertical, exactamente como lo entrega el design-context.
 */
interface WasteWithdrawalRejectedNoticeProps {
  notice: WasteWithdrawalRejectedNoticeData;
}

export function WasteWithdrawalRejectedNotice({ notice }: WasteWithdrawalRejectedNoticeProps) {
  return (
    <WasteProcessNoticeCard
      aside={
        <>
          <p className="font-['Inter:Bold',sans-serif] text-[15px] font-bold not-italic leading-[normal] text-[var(--waste-notice-title,#131313)]">
            {WASTE_WITHDRAWAL_REJECTED_NOTICE.label}
          </p>
          <p className="font-['Inter:Bold',sans-serif] text-[19px] font-bold not-italic leading-[normal] text-[var(--waste-notice-rejected-foreground,#570b1d)]">
            {notice.countLabel}
          </p>
        </>
      }
    >
      <WasteProcessNoticeIcon background="bg-[var(--waste-notice-rejected-surface,#ffd0db)]">
        <img
          src={rejectedRequestIcon}
          alt=""
          aria-hidden="true"
          className="block h-[18px] w-[22.5px] shrink-0"
        />
      </WasteProcessNoticeIcon>

      <div className="flex min-w-px flex-1 flex-col items-start">
        <p className="whitespace-nowrap font-['Inter:Bold',sans-serif] text-[13px] font-bold not-italic leading-[normal] text-[var(--waste-notice-title,#131313)]">
          {WASTE_WITHDRAWAL_REJECTED_NOTICE.processName}
        </p>
        {/*
          La bajada y la fecha son DOS párrafos en un bloque de 11px, igual que el
          transportista y el guardado del aviso de borrador: el nodo los dibuja como un solo
          texto de dos líneas, pero son dos datos —qué pasó y cuándo— y la segunda línea no
          es un salto del párrafo sino otra cosa.
        */}
        <div className="pt-[3px] font-['Inter:Regular',sans-serif] text-[11px] font-normal not-italic leading-[normal] text-[var(--waste-notice-muted,#646464)]">
          <p>{WASTE_WITHDRAWAL_REJECTED_NOTICE.description}</p>
          <p>{notice.rejectedAtLabel}</p>
        </div>
      </div>
    </WasteProcessNoticeCard>
  );
}
