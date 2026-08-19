import type { WeighingTicketAnalysisResponse } from '../../../shared/services/waste-withdrawal-validation.service';
import { WasteSidrepWeightIcon } from '../icons/WasteSidrepDocumentsIcons';
import {
  formatWeightKg,
  WEIGHING_TICKET_ACCEPT,
  WEIGHING_TICKET_HINT,
  WEIGHT_PENDING_LABEL,
} from '../wasteSidrepForm';
import { WarehouseFormCard } from './WarehouseFormCard';
import { WasteDerivedValueField } from './WasteDerivedValueField';
import { WasteSidrepFileDropzone } from './WasteSidrepFileDropzone';

/**
 * Tarjeta "Peso del residuo" — nodos `4230:10640` (sin ticket) y `4085:77270`
 * (validado).
 *
 * SIN TICKET (`4230:10649` y `4230:10657`):
 *
 *   carga   border-[1.5px] DASHED #d1d1d1 · bg white · rounded-[9px]
 *           flex gap-[12px] items-center · px-[17.5px] py-[15.5px]
 *           caja de icono 34 × 34 · bg white · border #e3e3e3 · glifo nube 17.5 × 14
 *           "Ticket de pesaje"          Inter Semi Bold 10px  #646464
 *           "Png, Jpg, Pdf· Máx. 10 MB" Inter Regular   9.5px #acacac
 *   pesos   bg #f7f7f7 · border #e3e3e3 · rounded-[8px] · px-[17px] py-[17.5px]
 *           rótulo Inter Semi Bold 11.5px #646464
 *           valor  Inter Regular  10.5px #646464 ("Se necesita ticket de pesaje")
 *
 * VALIDADO (`4085:77279` y `4085:77290`), lo que cambia:
 *
 *   carga   border-[1.5px] SOLIDO #a8dfa8 · bg #e0ffd3
 *           caja de icono con borde #a8dfa8 y el glifo pasa a ser el CHECK
 *           (`4085:77282` = `WarehouseFormAttachedCheckIcon`, verificado por
 *           checksum: es el mismo asset que ya usa "Respaldo" en el formulario de
 *           ingreso)
 *           segunda línea = nombre del archivo, Inter Regular 10.5px #2a5c16
 *           botón de quitar 24 × 24 · rounded-[5px] con la X de `432:6691`
 *   pesos   bg #e6f3ff · border #c5d8f0
 *           rótulo Inter Semi Bold 11.5px #0d3862
 *           valor  Inter BOLD 19px #0d3862 ("1.250 kg")
 *
 * LAS TRES CAJAS DE PESO SON `WasteDerivedValueField`, el campo que transcribe un
 * documento: el modal "Registrar cierre de folio" dibuja el mismo par de estados con la
 * declaración SIDREP (`4230:13438` → `4230:13650`), así que la geometría vive ahí.
 *
 * LOS PESOS LOS TRAE LA API, no se calculan acá. El párrafo del nodo dice que los
 * transcribe AurelIA desde el ticket; el front sube el archivo y muestra lo que
 * vuelve. Tampoco se deriva el neto de bruto menos tara: si el backend transcribe
 * los tres, el front no tiene por qué discrepar de un informe reglamentario.
 *
 * ESTADOS QUE EL DISEÑO NO DIBUJA. Mientras la subida corre, la segunda línea dice
 * "Analizando ticket…"; si falla, se emite una línea de error con "Reintentar"
 * debajo de la zona de carga, siguiendo el patrón de `CatalogFooter`.
 */

/** Texto del nodo `4230:10645`. */
export const SIDREP_WEIGHT_TITLE = 'Peso del residuo';

/** Texto del nodo `4230:10647`. */
export const SIDREP_WEIGHT_DESCRIPTION =
  'Ingrese el ticket del pesaje y AurelIA se encargará de transcribir los datos a los campos';

/** Rótulo del nodo `4230:10654`. */
export const WEIGHING_TICKET_LABEL = 'Ticket de pesaje';

interface WasteSidrepWeightSectionProps {
  ticket: File | null;
  onTicketChange: (file: File | null) => void;
  /** Pesos transcritos por la API, o `null` mientras no hay resultado. */
  weights: WeighingTicketAnalysisResponse | null;
  isAnalyzing: boolean;
  isError: boolean;
  onRetry: () => void;
}

/** Los tres pesos del nodo, con la clave de la respuesta que le corresponde. */
const WEIGHT_ROWS = [
  { label: 'Peso bruto', key: 'grossWeightKg' },
  { label: 'Peso tara', key: 'tareWeightKg' },
  { label: 'Peso neto', key: 'netWeightKg' },
] as const;

export function WasteSidrepWeightSection({
  ticket,
  onTicketChange,
  weights,
  isAnalyzing,
  isError,
  onRetry,
}: WasteSidrepWeightSectionProps) {
  const validated = weights !== null;

  return (
    <WarehouseFormCard
      bodyGap
      icon={
        <WasteSidrepWeightIcon className="block h-[13.5px] w-[16.875px] shrink-0 overflow-visible text-[#131313]" />
      }
      title={SIDREP_WEIGHT_TITLE}
      description={SIDREP_WEIGHT_DESCRIPTION}
    >
      <div className="flex w-full flex-col items-start gap-[8px]">
        <WasteSidrepFileDropzone
          label={WEIGHING_TICKET_LABEL}
          hint={WEIGHING_TICKET_HINT}
          accept={WEIGHING_TICKET_ACCEPT}
          file={ticket}
          onChange={onTicketChange}
          loadedHint={isAnalyzing ? 'Analizando ticket…' : undefined}
          /*
           * El verde depende de que la API haya respondido, no de que haya archivo:
           * con el ticket subido pero el análisis fallado, mostrarlo validado diría
           * algo que no es.
           */
          confirmed={validated}
        />

        {isError ? (
          <p
            role="alert"
            className="font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]"
          >
            No se pudo leer el ticket de pesaje.{' '}
            <button
              type="button"
              onClick={onRetry}
              className="font-['Inter:Bold',sans-serif] font-bold underline underline-offset-2"
            >
              Reintentar
            </button>
          </p>
        ) : null}

        <div className="w-full pt-[16px]">
          <div className="flex w-full items-start gap-[14px]">
            {WEIGHT_ROWS.map(({ label, key }) => (
              <WasteDerivedValueField
                key={label}
                label={label}
                value={weights ? formatWeightKg(weights[key]) : null}
                pendingLabel={isAnalyzing ? 'Analizando…' : WEIGHT_PENDING_LABEL}
              />
            ))}
          </div>
        </div>
      </div>
    </WarehouseFormCard>
  );
}
