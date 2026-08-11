import { WasteWithdrawalSelectedLotIcon } from '../icons/WasteWithdrawalFormIcons';

/**
 * Aviso de validación de "Datos del traslado" — nodo `4085:77266`.
 *
 *   contenedor  `4085:77265` pt-[14px] · w-full
 *   caja        bg #e0ffd3 · border #a8dfa8 · rounded-[8px]
 *               flex gap-[10px] items-start · px-[15px] py-[12px]
 *   icono       14.375 × 11.5 · #2a5c16
 *   texto       Inter Regular 11.5px · leading-[17.25px] · #2a5c16
 *
 * El `whitespace-nowrap` del nodo se descarta: el mensaje lo arma el backend con
 * el número de resolución y la razón social, así que su largo es variable y con
 * `nowrap` desbordaría la tarjeta. Es el mismo criterio ya aplicado a los párrafos
 * de `WarehouseFormCard`.
 *
 * ESTADOS QUE EL DISEÑO NO DIBUJA. Figma solo da el éxito. La carga y el error se
 * emiten como líneas de texto en el mismo lugar, siguiendo el patrón que ya usa
 * `CatalogFooter` en `WarehouseFormControls` para exactamente esto: el error en
 * `#bd3b5b` con un "Reintentar" pegado, en vez de inventar dos superficies más.
 *
 * Con `valid: false` el backend dice que la patente NO está autorizada. Se muestra
 * como error y no como aviso verde: es un dato que impide continuar, aunque la
 * consulta HTTP haya salido bien.
 */
interface WasteSidrepValidationNoticeProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Mensaje ya compuesto. `null` mientras no hay resultado válido. */
  message: string | null;
  /** Motivo del rechazo cuando el backend responde `valid: false`. */
  rejectedMessage?: string | null;
}

export function WasteSidrepValidationNotice({
  isLoading,
  isError,
  onRetry,
  message,
  rejectedMessage = null,
}: WasteSidrepValidationNoticeProps) {
  if (isLoading) {
    return (
      <div className="w-full pt-[14px]">
        <p
          role="status"
          className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] text-[#646464]"
        >
          Validando patente y tipo de residuo contra el maestro de transportistas…
        </p>
      </div>
    );
  }

  if (isError || rejectedMessage) {
    return (
      <div className="w-full pt-[14px]">
        <p
          role="alert"
          className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] text-[#bd3b5b]"
        >
          {rejectedMessage ?? 'No se pudo validar la patente contra el maestro de transportistas.'}{' '}
          <button
            type="button"
            onClick={onRetry}
            className="font-['Inter:Bold',sans-serif] font-bold underline underline-offset-2"
          >
            Reintentar
          </button>
        </p>
      </div>
    );
  }

  if (!message) return null;

  return (
    <div className="w-full pt-[14px]">
      <div className="flex w-full items-start gap-[10px] rounded-[8px] border border-solid border-[#a8dfa8] bg-[#e0ffd3] px-[15px] py-[12px]">
        {/* Mismo glifo que el encabezado "Lote seleccionado" (`3765:39026`), en la caja de 14.375 × 11.5 del nodo `4085:77267`. */}
        <WasteWithdrawalSelectedLotIcon className="mt-[2px] block h-[11.5px] w-[14.375px] shrink-0 text-[#2a5c16]" />
        <p className="font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[17.25px] text-[#2a5c16]">
          {message}
        </p>
      </div>
    </div>
  );
}
