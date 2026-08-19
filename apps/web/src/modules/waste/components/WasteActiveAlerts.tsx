import { ClockIcon } from '../../../shared/components/icons/ClockIcon';
import type {
  WasteAlertKind,
  WasteDashboardAlert,
} from '../../../shared/services/waste-dashboard.service';
import { WarehouseOverdueBadgeIcon } from '../icons/WarehouseControlIcons';
import { WarehouseFormCloseIcon, WarehouseFormLotIcon } from '../icons/WarehouseIntakeFormIcons';
import { WasteAlertWeightIcon } from '../icons/WasteDashboardIcons';
import { WASTE_ALERT_SEVERITY_STYLES } from '../wasteWarehouseThresholds';
import { WarehouseSectionTitle } from './WarehouseSectionTitle';

/**
 * "Alertas activas" — nodos `3086:13893` (título), `3086:13897` (tarjeta) y
 * `3086:13900` / `13909` / `3530:609` (filas).
 *
 * LA FILA ES LA MISMA que `WarehouseExpirationRow` de "Próximos vencimientos"
 * (`3686:25786`), comprobado nodo por nodo:
 *
 *   tarjeta   bg white · border #e3e3e3 · rounded-[10px] · px-[19px] py-[15px]
 *   fila      border-b #e3e3e3 · flex gap-[12px] items-start · pt-[12px] pb-[13px]
 *   badge     size-[30px] · rounded-[8px] · glifo 15 × 12 centrado
 *   título    Inter Regular 12px · leading-[18px] · #131313, valores en Bold
 *
 * No se comparte el componente porque las dos filas difieren en tres cosas y
 * ninguna es cosmética: acá el detalle va en 10.5px (allá 11px), la última fila
 * cierra con `py-[12px]` en vez de `pb-[13px]`, y estas filas llevan botón de
 * descarte. Unificarlas pedía tres props condicionales para ahorrar ocho líneas de
 * JSX; lo que SÍ se comparte es lo que puede divergir de verdad —la paleta de
 * gravedad, en `WASTE_ALERT_SEVERITY_STYLES`, y los cuatro glifos—.
 *
 * TRES DE LOS CUATRO ICONOS YA EXISTÍAN y se reutilizan: `ClockIcon` compartido,
 * `WarehouseFormLotIcon` y `WarehouseFormCloseIcon`. Ver `WasteDashboardIcons`,
 * donde queda anotada la comparación de cada `path`.
 *
 * Un desvío deliberado: la tarjeta del nodo es `flex-[1_0_0]` y mide 283.5px
 * contra los 257px de sus tres filas. Ese estirón sale del frame de 812px de alto
 * fijo, no de una regla de diseño, así que acá la altura la da el contenido.
 */

/** Glifo por regla disparada. El COLOR lo pone la gravedad, no la regla. */
const ALERT_KIND_ICONS: Record<WasteAlertKind, typeof ClockIcon> = {
  FOLIO_CLOSURE_OVERDUE: ClockIcon,
  WEIGHT_DISCREPANCY: WasteAlertWeightIcon,
  STORAGE_LIMIT: WarehouseFormLotIcon,
};

const SECTION_TITLE = 'Alertas activas';

interface WasteActiveAlertsProps {
  alerts: WasteDashboardAlert[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDismiss: (alertId: string) => void;
  /** Alerta con el descarte en vuelo, para deshabilitar su botón. */
  dismissingId?: string;
}

export function WasteActiveAlerts({
  alerts,
  isLoading,
  isError,
  onRetry,
  onDismiss,
  dismissingId,
}: WasteActiveAlertsProps) {
  /*
   * El contador sale de la LISTA, no de un campo aparte.
   *
   * El nodo escribe "Alertas activas (2)" con tres filas dibujadas. El desajuste se
   * explica por el id del tercer nodo —`3530:609`, muy posterior a los `3086:139xx`
   * de las otras dos—: la fila se agregó después y el contador del título quedó sin
   * actualizar. Derivarlo de la lista lo deja siempre coherente, y además de acuerdo
   * con la tarjeta KPI "Alertas activas", que muestra el mismo número.
   */
  const title = isLoading || isError ? SECTION_TITLE : `${SECTION_TITLE} (${alerts.length})`;

  return (
    <div className="flex w-full flex-col">
      {/*
        El icono del título (nodo `3086:13894`, 17.5 × 14) es el MISMO triángulo que
        `WarehouseOverdueBadgeIcon` (nodo `3686:25788`, 15 × 12) reescalado: se
        comparó el `path` en ocho puntos y la razón es 1.16667 exacta
        (7.5→8.75, 8.325→9.7125, 13.3875→15.6188, 9.86719→11.5117). El `viewBox` lo
        reescala solo, así que no se versiona un segundo asset.
      */}
      <WarehouseSectionTitle icon={<WarehouseOverdueBadgeIcon className="block size-full" />}>
        {title}
      </WarehouseSectionTitle>

      <div className="mt-[10px] flex w-full flex-col items-start overflow-clip rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[15px]">
        <WasteActiveAlertsBody
          alerts={alerts}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
          onDismiss={onDismiss}
          dismissingId={dismissingId}
        />
      </div>
    </div>
  );
}

/**
 * ESTADOS QUE EL DISEÑO NO DIBUJA. El nodo solo muestra el caso con alertas.
 *
 * El vacío es el más importante de los tres y no es un fallo: cero alertas es la
 * buena noticia de esta pantalla, así que se enuncia como tal en vez de dejar la
 * tarjeta en blanco.
 */
function WasteActiveAlertsBody({
  alerts,
  isLoading,
  isError,
  onRetry,
  onDismiss,
  dismissingId,
}: WasteActiveAlertsProps) {
  if (isLoading) {
    return (
      <div className="flex w-full flex-col" aria-busy="true" aria-live="polite">
        <span className="sr-only">Cargando alertas activas…</span>
        {/* Tres filas, la geometría exacta de `WasteAlertRow`, para no saltar de alto. */}
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className={`flex w-full items-start gap-[12px] pb-[13px] pt-[12px] ${row === 2 ? '' : 'border-b border-solid border-[#e3e3e3]'}`}
          >
            <div className="size-[30px] shrink-0 animate-pulse rounded-[8px] bg-[#ededed]" />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-[4px]">
              <div className="h-[18px] w-full animate-pulse rounded-[4px] bg-[#ededed]" />
              <div className="h-[11px] w-[180px] animate-pulse rounded-[4px] bg-[#f2f2f2]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p
        role="alert"
        className="py-[12px] font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#bd3b5b]"
      >
        No se pudieron cargar las alertas.{' '}
        <button
          type="button"
          onClick={onRetry}
          className="font-['Inter:Bold',sans-serif] font-bold underline underline-offset-2"
        >
          Reintentar
        </button>
      </p>
    );
  }

  if (alerts.length === 0) {
    return (
      <p className="py-[12px] font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[18px] text-[#646464]">
        Sin alertas activas. No hay folios fuera de plazo ni diferencias de peso por justificar.
      </p>
    );
  }

  return (
    <ul className="flex w-full list-none flex-col">
      {alerts.map((alert, index) => (
        <WasteAlertRow
          key={alert.id}
          alert={alert}
          isLast={index === alerts.length - 1}
          onDismiss={onDismiss}
          isDismissing={dismissingId === alert.id}
        />
      ))}
    </ul>
  );
}

function WasteAlertRow({
  alert,
  isLast,
  onDismiss,
  isDismissing,
}: {
  alert: WasteDashboardAlert;
  isLast: boolean;
  onDismiss: (alertId: string) => void;
  isDismissing: boolean;
}) {
  const style = WASTE_ALERT_SEVERITY_STYLES[alert.severity];
  const Icon = ALERT_KIND_ICONS[alert.kind];

  return (
    <li
      /*
       * La última fila del nodo (`3530:609`) cierra con `py-[12px]` y sin borde; las
       * otras dos van `pt-[12px] pb-[13px]` con `border-b`. Ese píxel de diferencia
       * es del nodo, no un redondeo.
       */
      className={`flex w-full items-start gap-[12px] ${isLast ? 'py-[12px]' : 'border-b border-solid border-[#e3e3e3] pb-[13px] pt-[12px]'}`}
    >
      <div
        className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px]"
        style={{ backgroundColor: style.badgeBackground }}
      >
        <Icon className="block h-[12px] w-[15px] shrink-0" style={{ color: style.iconColor }} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start">
        <p className="w-full font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[18px] text-[#131313]">
          {alert.message.map((segment, index) =>
            segment.strong ? (
              /*
               * `index` como key es correcto acá: los fragmentos son posicionales
               * dentro de una frase inmutable, no una lista que se reordene.
               */
              <span key={index} className="font-['Inter:Bold',sans-serif] font-bold">
                {segment.text}
              </span>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </p>
        <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#646464]">
          {alert.detail}
        </p>
      </div>

      {/*
        Botón de descarte del nodo `3430:2353`: caja de 24 × 24 `rounded-[5px]` con
        la X de 16 × 16 centrada. Solo lo llevan las alertas descartables.
      */}
      {alert.dismissible ? (
        <button
          type="button"
          onClick={() => onDismiss(alert.id)}
          disabled={isDismissing}
          aria-label="Descartar alerta"
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[5px] text-[#131313] transition-colors hover:bg-[#f7f7f7] disabled:opacity-40"
        >
          <WarehouseFormCloseIcon className="block size-[16px] shrink-0" />
        </button>
      ) : null}
    </li>
  );
}
