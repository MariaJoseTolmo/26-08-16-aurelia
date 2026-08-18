import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { ClockIcon } from '../../shared/components/icons/ClockIcon';
import { Snackbar } from '../../shared/components/Snackbar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WastePerformanceCriticalNoteIcon } from './icons/WasteCompanyPerformanceIcons';
import { WarehouseFormLotIcon } from './icons/WarehouseIntakeFormIcons';
import { WasteFolioVerifiedIcon } from './icons/WasteSidrepPendingFolioIcons';
import {
  WasteSinaderMarkDeclaredIcon,
  WasteSinaderModalCloseIcon,
  WasteSinaderNoticeIcon,
  WasteSinaderNoticeInfoIcon,
} from './icons/WasteSinaderReportIcons';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WasteFolioAttachmentsSection } from './components/WasteFolioAttachmentsSection';
import { WastePill } from './components/WastePill';
import { WasteDefinitionGrid } from './components/WasteDefinitionGrid';
import { WasteFolioCloseModal } from './components/WasteFolioCloseModal';
import { WasteFolioClosureDocsSection } from './components/WasteFolioClosureDocsSection';
import { WasteFolioDetailDivider, WasteFolioDetailPanel } from './components/WasteFolioDetailPanel';
import { WasteFolioFooterActionButton } from './components/WasteFolioFooterActionButton';
import { WasteFolioListCard } from './components/WasteFolioListCard';
import { WasteFolioMasterDetail } from './components/WasteFolioMasterDetail';
import { WasteFolioNotice } from './components/WasteFolioNotice';
import { WasteFolioRejectedBanner } from './components/WasteFolioRejectedBanner';
import { WasteFolioRejectModal } from './components/WasteFolioRejectModal';
import { WasteFolioSupportModal } from './components/WasteFolioSupportModal';
import { WasteNoticeBanner } from './components/WasteNoticeBanner';
import { WasteTabs, wasteTabId, wasteTabPanelId, type WasteTab } from './components/WasteTabs';
import { WasteTertiaryActionButton } from './components/WasteTertiaryActionButton';
import { WasteViewIntro } from './components/WasteViewIntro';
import { WasteWeightDifferenceNotice } from './components/WasteWeightDifferenceNotice';
import { downloadWasteFolioSupportExport } from '../../shared/services/waste-warehouse-export.service';
import {
  folioDetailSubtitle,
  folioFacts,
  folioListRow,
  folioSupportExportRequest,
  folioSupportFacts,
  folioSupportSubtitle,
  WASTE_SIDREP_CLOSED_FOLIOS,
  WASTE_SIDREP_FOLIO_CLOSED_STATUS,
  type WasteSidrepFolio,
} from './wasteSidrepFolios';
import {
  openFolioCloseSubtitle,
  openFolioClosedMessage,
  openFolioDetailSubtitle,
  openFolioFacts,
  openFolioListRow,
  openFolioSlaAlert,
  WASTE_SIDREP_FOLIO_OPEN_STATUS,
  WASTE_SIDREP_OPEN_FOLIO_ACTION,
  WASTE_SIDREP_OPEN_FOLIO_NOTICE,
  WASTE_SIDREP_OPEN_FOLIOS,
  type WasteSidrepOpenFolio,
} from './wasteSidrepOpenFolios';
import {
  pendingRequestDetailSubtitle,
  pendingRequestFacts,
  pendingRequestListRow,
  pendingRequestRejectedMessage,
  pendingRequestRejectionHeading,
  pendingRequestRejectionQuote,
  pendingRequestSlaAlert,
  pendingRequestVerification,
  WASTE_SIDREP_PENDING_REQUESTS,
  WASTE_SIDREP_REQUEST_APPROVE_ACTION,
  WASTE_SIDREP_REQUEST_PENDING_STATUS,
  WASTE_SIDREP_REQUEST_REJECT_ACTION,
  WASTE_SIDREP_REQUEST_REJECTED_NOTE,
  WASTE_SIDREP_REQUEST_REJECTED_STATUS,
  type WasteSidrepPendingRequest,
  type WasteSidrepRequestRejection,
} from './wasteSidrepPendingFolios';

/**
 * "Folios SIDREP" — nodos Figma `3083:10562` (pestaña "Cerrados") y `3081:7463`
 * (pestaña "Abiertos") del archivo Medio-Ambiente-Core. Se llega desde el rol
 * `WASTE_ENV_APPROVER`, ítem "Folios SIDREP" del sidebar.
 *
 * ES UN MAESTRO-DETALLE, la primera vista del módulo que lo es: la lista de folios a la
 * izquierda y el detalle del folio elegido a la derecha, que los dos nodos declaran
 * STICKY —su hueco en la grilla se llama "Sticky placeholder – Container"— para que el
 * detalle quede a la vista mientras se recorre una lista larga. El armazón de esa grilla
 * vive en `WasteFolioMasterDetail`, porque las dos pestañas lo comparten.
 *
 * El cromo de la vista NO es el de las demás pantallas del módulo, y por eso el cuerpo
 * no repite el `bg-white ... pt-[20px]` de `WasteHistoryPage`:
 *
 *   `3081:7670`  header de 56px con el `<h1>`      → `WarehouseHeader`
 *   `3081:7673`  franja BLANCA con borde inferior  → párrafo + pestañas
 *   `3081:7693`  cuerpo GRIS `#f7f7f7`             → la grilla del maestro-detalle
 *
 * La franja es parte del encabezado y no del cuerpo: queda fija arriba del área
 * desplazable, que es lo que hace que las pestañas no se vayan al hacer scroll.
 *
 * LAS TRES PESTAÑAS ESTÁN INTEGRADAS, una por nodo: `3073:5688` es "Pendientes de
 * revisión", `3081:7463` "Abiertos" y `3083:10562` "Cerrados". Las tres reusan el mismo
 * armazón —`WasteFolioMasterDetail`, `WasteFolioListCard`, `WasteFolioDetailPanel`— y lo
 * que cambia entre ellas es qué se pone en cada ranura.
 *
 * LA PRIMERA NO LISTA FOLIOS SINO SOLICITUDES, y por eso su modelo vive aparte: el folio
 * SIDREP nace cuando el aprobador dice que sí. Ver `wasteSidrepPendingFolios.ts`.
 *
 * TODO EL ESTADO ES DE CLIENTE: las listas salen de `WASTE_SIDREP_PENDING_REQUESTS`,
 * `WASTE_SIDREP_OPEN_FOLIOS` y `WASTE_SIDREP_CLOSED_FOLIOS`, las maquetas de los nodos.
 * Cuando exista el endpoint, cada lista pasa a un hook de TanStack Query y los contadores
 * de las pestañas a la misma respuesta; el resto de la vista no cambia.
 */

/** Texto del nodo `3081:7672`, el `<h1>` del header. */
export const WASTE_SIDREP_FOLIOS_TITLE = 'Folios SIDREP';

/** Texto del nodo `3081:7675`. Idéntico en los dos nodos de la vista. */
export const WASTE_SIDREP_FOLIOS_DESCRIPTION =
  'Revisa y aprueba las solicitudes de retiro de residuos peligrosos. El SLA de revisión es de 6 horas desde el ingreso.';

/** Texto del nodo `3083:11035`. */
export const WASTE_SIDREP_FOLIOS_SUPPORT_ACTION = 'Ver respaldo completo';

type WasteSidrepFolioTabId = 'pending' | 'open' | 'closed';

/**
 * Pestañas del nodo `3081:7676`, con los contadores que dibuja: 3, 12 y 48.
 *
 * Los 48 de "Cerrados" y los 12 de "Abiertos" NO son la cantidad de folios de las
 * maquetas —cada nodo dibuja tres—: son los totales del período, y las listas están
 * paginadas en el diseño real. Se conservan los números del nodo en vez de contar las
 * filas, que diría "3" y sería un dato distinto del que el diseño muestra.
 */
const OPEN_TAB_COUNT = 12;
const CLOSED_TAB_COUNT = 48;

/**
 * Los contadores se MUEVEN al cerrar un folio, y eso también sale del diseño: el nodo
 * `3081:9331` —la vista después de confirmar un cierre— dibuja 3, 11 y 49 donde el
 * `3081:7676` dibujaba 3, 12 y 48. O sea que el folio cambia de bandeja y los dos totales
 * lo acusan.
 */
function foliosTabs(closedCount: number): WasteTab<WasteSidrepFolioTabId>[] {
  return [
    /*
     * EL 3 DE "PENDIENTES" SÍ SE CUENTA, al revés que los otros dos. El nodo dibuja
     * exactamente las tres solicitudes que lista, así que contar la bandeja da el mismo
     * número que el diseño muestra y además no queda desfasado si se agrega una cuarta.
     * En "Abiertos" y "Cerrados" los contadores son totales del período —el diseño lista
     * tres de 12 y de 48—, y por eso ahí van los literales del nodo.
     *
     * RECHAZAR NO MUEVE ESTE CONTADOR, y eso lo decide el nodo `4295:24241`: dibuja la
     * primera solicitud ya rechazada y la pestaña sigue diciendo 3. Una solicitud
     * rechazada NO SALE de la bandeja —se queda con su pastilla "Rechazado" esperando la
     * corrección del transportista, con el reloj del SLA corriendo—, así que no hay nada
     * que descontar. Es lo contrario del cierre de folio, donde el folio sí cambia de
     * bandeja y los dos totales lo acusan.
     */
    { id: 'pending', label: 'Pendientes de revisión', count: WASTE_SIDREP_PENDING_REQUESTS.length },
    { id: 'open', label: 'Abiertos', count: OPEN_TAB_COUNT - closedCount },
    { id: 'closed', label: 'Cerrados', count: CLOSED_TAB_COUNT + closedCount },
  ];
}

const TABS_BASE_ID = 'waste-sidrep-folios';

/** Rótulos accesibles de las listas maestras. Los nodos no les ponen título visible. */
const PENDING_LIST_LABEL = 'Solicitudes de retiro pendientes de revisión';
const OPEN_LIST_LABEL = 'Folios SIDREP abiertos';
const CLOSED_LIST_LABEL = 'Folios SIDREP cerrados';

/**
 * Por qué "Aprobar y generar folio" sigue DESHABILITADO mientras "Rechazar" ya no lo está.
 *
 * LAS DOS ACCIONES SE ABRIERON POR SEPARADO PORQUE SON DOS NODOS SEPARADOS. "Rechazar"
 * tiene el suyo —`4295:24214`, el modal de motivo— y por eso quedó integrado. Aprobar
 * genera el folio SIDREP, o sea que escribe en la plataforma del Ministerio y mueve la
 * solicitud a "Abiertos": ese diálogo todavía no está dibujado. Es la misma política con
 * la que entró "Registrar cierre" para un folio no peligroso: antes que un botón que se ve
 * activo y no hace nada, el estado deshabilitado que el módulo ya tiene con el motivo en
 * su `title`.
 */
const PENDING_APPROVE_ACTION_HINT =
  'La aprobación de solicitudes se integra en una próxima iteración.';

/**
 * Por qué "Registrar cierre" queda deshabilitado en un folio NO peligroso.
 *
 * El botón abre el formulario de registro de cierre, y ese formulario depende de la
 * peligrosidad: el nodo `4230:13273` pide la declaración SIDREP, que un traslado no
 * peligroso no genera. El cierre de un traslado no peligroso es otro nodo y otra
 * iteración, así que ahí el botón va en el estado deshabilitado que el módulo ya tiene
 * —`#e2e2e2` / `#acacac`— con el motivo en su `title`, en vez de abrir un formulario que
 * pide un documento que no existe.
 *
 * En un folio PELIGROSO el botón va ACTIVO, como lo dibuja el nodo `3081:7977`.
 */
const OPEN_FOLIO_ACTION_HINT =
  'El registro de cierre de un traslado no peligroso se integra en una próxima iteración.';

/**
 * Cuánto queda a la vista el snackbar de confirmación —el del cierre de folio y el del
 * rechazo de solicitud, que comparten instancia—.
 *
 * El nodo no dibuja duración —Figma no dibuja el tiempo—, y acá se deja por debajo del
 * default de 6s del componente: el aviso está centrado sobre el cuerpo y a 24px del borde
 * inferior, o sea que tapa la última fila de la lista mientras está.
 */
const FEEDBACK_SNACKBAR_MS = 5000;

/** Aviso azul reutilizado por los estados vacíos de las tres pestañas. */
function WasteSidrepFoliosInfoNotice({ children }: { children: string }) {
  return (
    <WasteNoticeBanner
      icon={
        <WasteSinaderNoticeInfoIcon className="block h-[11.5px] w-[13.508px] shrink-0 text-[#24588b]" />
      }
    >
      {children}
    </WasteNoticeBanner>
  );
}

/**
 * Pestaña "Pendientes de revisión" — nodos `3073:5688` (la bandeja) y `4295:24241` (la
 * misma bandeja después de enviar un rechazo).
 *
 * La bandeja de trabajo del aprobador: solicitudes de retiro de residuo peligroso que
 * todavía no son folio y esperan un sí o un no, contra un SLA de 6 horas. Por eso el
 * panel muestra los adjuntos completos —es con lo que se decide— y cierra con las dos
 * acciones en la misma franja en vez de una sola primaria.
 *
 * RECHAZAR NO SACA A LA SOLICITUD DE ACÁ. El segundo nodo lo dibuja explícito: la
 * solicitud rechazada sigue en la lista, primera y seleccionada, con la pastilla
 * "Rechazado" al lado de su reloj de SLA, y su panel se corona con la franja del motivo.
 * El estado de la cabecera SIGUE SIENDO "Pendiente" (`4295:24536`) y las dos acciones del
 * pie siguen ahí: el rechazo no resuelve la solicitud, la devuelve para que la corrijan.
 */
interface WasteSidrepPendingFoliosPanelProps {
  /**
   * Los rechazos enviados en esta sesión, por número de solicitud. Vive en la PÁGINA y no
   * acá porque también lo consume el snackbar, que se dibuja fuera del área desplazable.
   */
  rejections: Record<string, WasteSidrepRequestRejection>;
  onRequestRejected: (request: WasteSidrepPendingRequest, reason: string) => void;
}

function WasteSidrepPendingFoliosPanel({
  rejections,
  onRequestRejected,
}: WasteSidrepPendingFoliosPanelProps) {
  /*
   * El nodo entra con la solicitud del TOPE DE LA LISTA abierta (`3073:5922`), que es la
   * que tiene el fondo azul. Misma política que las otras dos pestañas —se busca por
   * condición y no por posición— sólo que acá la condición es el orden de la bandeja: la
   * lista ya llega priorizada por urgencia del SLA, así que la primera es la que toca.
   */
  const [selectedId, setSelectedId] = useState<string | null>(
    () => WASTE_SIDREP_PENDING_REQUESTS[0]?.request ?? null,
  );

  /*
   * La solicitud que se está rechazando, y no un `boolean`: mismo criterio que
   * `closingFolio` en "Abiertos". Guardar la solicitud es lo que hace que el rechazo no
   * pueda terminar aplicado sobre otra si la selección de la lista cambia con el modal
   * encima.
   */
  const [rejectingRequest, setRejectingRequest] = useState<WasteSidrepPendingRequest | null>(null);

  /*
   * UNA SOLICITUD RECHAZADA SIGUE EN LA BANDEJA, y no es una licencia: el nodo `4295:24241`
   * dibuja la lista DESPUÉS del rechazo y la solicitud sigue ahí, primera, seleccionada y
   * con su reloj de SLA en teal. Lo que cambia es que suma la pastilla "Rechazado" y que
   * su panel se corona con la franja del motivo. Tiene sentido: rechazar no resuelve la
   * solicitud, la devuelve —el transportista corrige y vuelve—, así que sacarla de la
   * bandeja habría dejado al aprobador sin dónde ver qué pidió corregir.
   */
  const requests = WASTE_SIDREP_PENDING_REQUESTS;
  const rows = useMemo(
    () =>
      requests.map((request) => ({
        ...pendingRequestListRow(request),
        /* Pastilla del nodo `4295:24655`. Sólo la lleva la solicitud ya rechazada. */
        badge: rejections[request.request] ? (
          <WastePill tone="red">{WASTE_SIDREP_REQUEST_REJECTED_STATUS}</WastePill>
        ) : undefined,
      })),
    [requests, rejections],
  );
  const selected = useMemo(
    () => requests.find((request) => request.request === selectedId) ?? requests[0] ?? null,
    [requests, selectedId],
  );
  const selectedRejection = selected ? rejections[selected.request] : undefined;

  if (rows.length === 0) {
    return (
      <WasteSidrepFoliosInfoNotice>
        No hay solicitudes de retiro pendientes de revisión.
      </WasteSidrepFoliosInfoNotice>
    );
  }

  return (
    <>
      <WasteFolioMasterDetail
        list={
          <WasteFolioListCard
            label={PENDING_LIST_LABEL}
            rows={rows}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        }
        detail={
          selected ? (
            <WasteFolioDetailPanel
              banner={
                /*
                 * Franja `4295:24658`: a dónde lleva "Enviar rechazo". Sólo aparece cuando la
                 * solicitud ya fue rechazada, y CONVIVE con la alerta de SLA de abajo —el nodo
                 * dibuja las dos, una sobre otra— porque dicen cosas distintas: ésta, qué se
                 * pidió corregir; aquélla, cuánto queda del reloj para que vuelva corregida.
                 */
                selectedRejection ? (
                  <WasteFolioRejectedBanner
                    heading={pendingRequestRejectionHeading(selectedRejection)}
                    reason={pendingRequestRejectionQuote(selectedRejection.reason)}
                    note={WASTE_SIDREP_REQUEST_REJECTED_NOTE}
                  />
                ) : undefined
              }
              notice={
                /*
                 * ACÁ LA ALERTA VA SIEMPRE, al revés que en "Abiertos", donde sólo la lleva
                 * el folio fuera de plazo. El nodo `3073:5973` la dibuja en la solicitud que
                 * va EN TIEMPO: no avisa de un problema, dice cuánto queda del reloj, que es
                 * el dato que ordena esta bandeja. Lo que cambia con el tramo es la frase
                 * —ver `pendingRequestSlaAlert`—, no si aparece.
                 */
                <WasteFolioNotice
                  tone="warning"
                  icon={
                    <ClockIcon className="block h-[11px] w-[13.75px] shrink-0 text-[#6b3a1f]" />
                  }
                >
                  {pendingRequestSlaAlert(selected)}
                </WasteFolioNotice>
              }
              title={selected.wasteType}
              subtitle={pendingRequestDetailSubtitle(selected)}
              status={<WastePill tone="amber">{WASTE_SIDREP_REQUEST_PENDING_STATUS}</WastePill>}
              footer={
                /*
                 * Franja `3073:6083`: las dos acciones en mitades con `gap-[8px]`. El pie del
                 * panel ya aporta el `px-[20px] pt-[15px] pb-[14px]` y el borde superior, así
                 * que acá va sólo el reparto. `items-stretch` para que las dos midan lo mismo
                 * aunque una lleve borde y la otra no.
                 */
                <div className="flex w-full items-stretch gap-[8px]">
                  <div className="min-w-px flex-1">
                    {/* Abre el modal `4295:24214`, que es donde el rechazo se escribe. */}
                    <WasteFolioFooterActionButton
                      label={WASTE_SIDREP_REQUEST_REJECT_ACTION}
                      tone="danger"
                      icon={(className) => <WasteSinaderModalCloseIcon className={className} />}
                      onClick={() => setRejectingRequest(selected)}
                    />
                  </div>
                  <div className="min-w-px flex-1">
                    <WasteFolioFooterActionButton
                      label={WASTE_SIDREP_REQUEST_APPROVE_ACTION}
                      icon={(className) => <WasteSinaderMarkDeclaredIcon className={className} />}
                      disabled
                      disabledHint={PENDING_APPROVE_ACTION_HINT}
                    />
                  </div>
                </div>
              }
            >
              <WasteDefinitionGrid items={pendingRequestFacts(selected)} />
              <WasteFolioDetailDivider />
              {/*
              Aviso VERDE del nodo `3073:6018`. Es el único aviso en verde del módulo y
              dice algo distinto de los ámbar y rojos: que la plataforma ya cruzó patente
              y tipo de residuo contra la resolución sanitaria vigente del transportista.
              Va en párrafo, así que `multiline`.
            */}
              <WasteFolioNotice
                tone="success"
                density="multiline"
                icon={
                  <WasteFolioVerifiedIcon className="block size-[11px] shrink-0 text-[#2a5c16]" />
                }
              >
                {pendingRequestVerification(selected)}
              </WasteFolioNotice>
              <WasteFolioAttachmentsSection attachments={selected.attachments} />
            </WasteFolioDetailPanel>
          ) : (
            <WasteSidrepFoliosInfoNotice>
              Elegí una solicitud de la lista para revisarla.
            </WasteSidrepFoliosInfoNotice>
          )
        }
      />
      {rejectingRequest ? (
        <WasteFolioRejectModal
          open
          onClose={() => setRejectingRequest(null)}
          /*
           * Enviar CIERRA EL MODAL Y REGISTRA EL RECHAZO: la solicitud se queda donde está,
           * suma su pastilla en la lista y su panel se corona con la franja del motivo. El
           * snackbar sólo acusa que el envío salió.
           *
           * EL MOTIVO TIPEADO YA NO SE DESCARTA —la franja lo dibuja—, y ahí termina el
           * recorrido que el diseño resuelve. TODAVÍA NO HAY ESCRITURA REAL ni salida del
           * correo: esto mueve estado de cliente sobre la maqueta, igual que el resto de la
           * vista. Cuando exista el endpoint, este `onConfirm` pasa a ser el `onSuccess` de
           * un `useMutation` que manda el motivo, sin que cambie nada de lo que ve la
           * pantalla.
           */
          onConfirm={(reason) => {
            setRejectingRequest(null);
            onRequestRejected(rejectingRequest, reason);
          }}
        />
      ) : null}
    </>
  );
}

/**
 * Pestaña "Abiertos" — nodo `3081:7463`.
 *
 * Un folio abierto es un traslado EN CURSO, así que el panel no habla de pesos recibidos
 * sino de tiempo: cuántos días lleva abierto, si se pasó del plazo, y que la plataforma
 * del Ministerio todavía no confirmó la recepción.
 */
interface WasteSidrepOpenFoliosPanelProps {
  /**
   * Números de folio cerrados en esta sesión. Vive en la PÁGINA y no acá porque los
   * contadores de las pestañas también se mueven al cerrar, y la tira de pestañas está en
   * el header fijo: es el mismo motivo por el que `activeTab` está allá arriba.
   */
  closedFolios: string[];
  onFolioClosed: (folio: WasteSidrepOpenFolio) => void;
}

function WasteSidrepOpenFoliosPanel({
  closedFolios,
  onFolioClosed,
}: WasteSidrepOpenFoliosPanelProps) {
  /*
   * El nodo entra con el folio QUE PIDE ATENCIÓN abierto —el que se pasó del plazo— y no
   * con la lista sin selección. Misma política que la pestaña "Cerrados": se busca por
   * la CONDICIÓN y no por posición, así que sumar un cuarto folio no cambia con cuál
   * entra la vista.
   */
  const [selectedId, setSelectedId] = useState<string | null>(
    () =>
      (WASTE_SIDREP_OPEN_FOLIOS.find((folio) => folio.overSla) ?? WASTE_SIDREP_OPEN_FOLIOS[0])
        ?.folio ?? null,
  );

  /*
   * El folio que se está cerrando, y no un `boolean`: guardar el folio y no "está abierto
   * el modal" hace que la cabecera del modal no pueda quedar hablando de otro folio si la
   * selección de la lista cambia con el modal encima.
   */
  const [closingFolio, setClosingFolio] = useState<WasteSidrepOpenFolio | null>(null);

  /* Un folio cerrado deja de estar abierto: sale de esta bandeja. Nodo `3081:9331`. */
  const folios = useMemo(
    () => WASTE_SIDREP_OPEN_FOLIOS.filter((folio) => !closedFolios.includes(folio.folio)),
    [closedFolios],
  );
  const rows = useMemo(() => folios.map(openFolioListRow), [folios]);
  /*
   * LA SELECCIÓN CAE AL PRIMERO QUE QUEDE si el folio elegido se cerró, y se resuelve
   * derivando en vez de sincronizando con un efecto: un `useEffect` que corrigiera
   * `selectedId` renderizaría una vez el panel vacío antes de arreglarse. Es lo que
   * dibuja el nodo `3081:9331`, con el detalle del primer folio que sobrevive.
   */
  const selected = useMemo(
    () => folios.find((folio) => folio.folio === selectedId) ?? folios[0] ?? null,
    [folios, selectedId],
  );

  if (rows.length === 0) {
    return (
      <WasteSidrepFoliosInfoNotice>
        No hay folios SIDREP abiertos en el período.
      </WasteSidrepFoliosInfoNotice>
    );
  }

  const slaAlert = selected ? openFolioSlaAlert(selected) : null;

  return (
    <>
      <WasteFolioMasterDetail
        list={
          <WasteFolioListCard
            label={OPEN_LIST_LABEL}
            rows={rows}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        }
        detail={
          selected ? (
            <WasteFolioDetailPanel
              notice={
                /*
                 * Sólo el folio fuera de plazo lo lleva (nodo `3081:7923`). Un folio en
                 * tiempo se lee en la grilla y no necesita alerta.
                 */
                slaAlert ? (
                  <WasteFolioNotice
                    tone="danger"
                    icon={
                      <WastePerformanceCriticalNoteIcon className="block size-[11px] shrink-0 text-[#570b1d]" />
                    }
                  >
                    {slaAlert}
                  </WasteFolioNotice>
                ) : undefined
              }
              title={selected.wasteType}
              subtitle={openFolioDetailSubtitle(selected)}
              status={<WastePill tone="amber">{WASTE_SIDREP_FOLIO_OPEN_STATUS}</WastePill>}
              footer={
                /*
                 * Sólo un folio PELIGROSO abre el modal de cierre (`4230:13273`): es el que
                 * tiene declaración SIDREP, que es el documento del que cuelga el
                 * formulario. Ver `OPEN_FOLIO_ACTION_HINT`.
                 */
                <WasteFolioFooterActionButton
                  label={WASTE_SIDREP_OPEN_FOLIO_ACTION}
                  icon={(className) => <WarehouseFormLotIcon className={className} />}
                  onClick={selected.isHazardous ? () => setClosingFolio(selected) : undefined}
                  disabled={!selected.isHazardous}
                  disabledHint={OPEN_FOLIO_ACTION_HINT}
                />
              }
            >
              <WasteDefinitionGrid items={openFolioFacts(selected)} />
              <WasteFolioDetailDivider />
              {/*
              Aviso ámbar del nodo `3081:7968`. Va en TODOS los folios abiertos: no
              describe este traslado, describe qué significa que el folio esté abierto.
            */}
              <WasteFolioNotice
                tone="warning"
                density="multiline"
                icon={
                  <WasteSinaderNoticeIcon className="block size-[11px] shrink-0 text-[#6b3a1f]" />
                }
              >
                {WASTE_SIDREP_OPEN_FOLIO_NOTICE}
              </WasteFolioNotice>
            </WasteFolioDetailPanel>
          ) : (
            <WasteSidrepFoliosInfoNotice>
              Elegí un folio de la lista para ver su estado de traslado.
            </WasteSidrepFoliosInfoNotice>
          )
        }
      />
      {closingFolio ? (
        <WasteFolioCloseModal
          open
          subtitle={openFolioCloseSubtitle(closingFolio)}
          dispatchedKg={closingFolio.dispatchedKg}
          declarationReading={closingFolio.declarationReading}
          onClose={() => setClosingFolio(null)}
          /*
           * Confirmar CIERRA EL MODAL Y AVISA ARRIBA, que es lo que el diseño encadena:
           * `3083:9723` es el snackbar y `3081:9331` la vista detrás, ya sin este folio.
           *
           * TODAVÍA NO HAY ESCRITURA REAL. Esto mueve estado de cliente sobre la maqueta,
           * igual que el resto de la vista; el snackbar dice la verdad sobre la maqueta y
           * no sobre la plataforma del Ministerio. Cuando exista el endpoint, acá va un
           * `useMutation` y este `onConfirm` pasa a ser su `onSuccess`, sin que cambie nada
           * de lo que ve la pantalla.
           */
          onConfirm={() => {
            setClosingFolio(null);
            onFolioClosed(closingFolio);
          }}
        />
      ) : null}
    </>
  );
}

/** Pestaña "Cerrados" — nodo `3083:10562`. */
function WasteSidrepClosedFoliosPanel() {
  /*
   * El nodo entra con el folio QUE PIDE ATENCIÓN abierto —el que tiene diferencia de
   * peso fuera de tolerancia— y no con la lista sin selección. Es coherente con lo que
   * la pantalla es: una bandeja donde lo que pide atención se muestra primero.
   *
   * SE BUSCA POR LA CONDICIÓN Y NO POR POSICIÓN. Antes era "el último de la lista", que
   * coincidía con el del recuadro sólo porque la maqueta tenía tres folios en ese orden:
   * al sumar un cuarto, la vista entraba en un folio sin novedad.
   */
  const [selectedId, setSelectedId] = useState<string | null>(
    () =>
      (
        WASTE_SIDREP_CLOSED_FOLIOS.find((folio) => folio.gap?.exceedsTolerance) ??
        WASTE_SIDREP_CLOSED_FOLIOS[0]
      )?.folio ?? null,
  );
  /*
   * El respaldo se abre para el folio que está en el panel, así que basta un booleano:
   * guardar OTRO id abriría la puerta a que el modal muestre un folio distinto del que
   * la vista tiene abierto. Al cambiar de folio se cierra —ver `handleSelect`—.
   */
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const rows = useMemo(() => WASTE_SIDREP_CLOSED_FOLIOS.map(folioListRow), []);
  const selected = useMemo(
    () => WASTE_SIDREP_CLOSED_FOLIOS.find((folio) => folio.folio === selectedId) ?? null,
    [selectedId],
  );

  function handleSelect(id: string) {
    setSelectedId(id);
    // Elegir otro folio invalida el respaldo abierto: es el de otro traslado.
    setIsSupportOpen(false);
  }

  /*
   * El PDF lo renderiza la API (`POST /waste/sidrep/folios/export/pdf`) y no el navegador,
   * igual que las otras tres exportaciones del módulo: el documento lleva el membrete de
   * Gold Fields y se archiva como respaldo de fiscalización, así que su composición vive en
   * un solo lugar y no depende de qué navegador lo bajó.
   *
   * ES UNA MUTACIÓN DE TANSTACK QUERY y no un `fetch` suelto porque el botón necesita los
   * tres estados: deshabilitado mientras renderiza, y un mensaje si el servidor falla. Un
   * respaldo que "no pasó nada" al hacer clic es peor que uno que dice por qué no salió.
   */
  const supportExport = useMutation({
    mutationFn: (folio: WasteSidrepFolio) =>
      downloadWasteFolioSupportExport(folioSupportExportRequest(folio)),
  });

  /*
   * Lo que las DOS variantes del respaldo comparten, que es todo menos el título y el
   * paquete. Se arma una sola vez acá para que las dos ramas del JSX no puedan divergir:
   * agregar una prop al modal y olvidarla en una rama era el error que este helper hace
   * imposible.
   */
  function supportModalProps(folio: WasteSidrepFolio) {
    return {
      open: isSupportOpen,
      subtitle: folioSupportSubtitle(folio),
      status: WASTE_SIDREP_FOLIO_CLOSED_STATUS,
      facts: folioSupportFacts(folio),
      dispatched: `${folio.dispatchedKg} kg`,
      received: `${folio.receivedKg} kg`,
      difference: folio.gap ? `${folio.gap.kg} kg` : '0 kg',
      differenceQualifier: folio.gap?.qualifier ?? null,
      onClose: () => setIsSupportOpen(false),
      onDownload: () => supportExport.mutate(folio),
      isDownloading: supportExport.isPending,
      downloadError: supportExport.isError
        ? 'No se pudo generar el PDF del respaldo. Intentá de nuevo.'
        : null,
    };
  }

  if (rows.length === 0) {
    return (
      <WasteSidrepFoliosInfoNotice>
        No hay folios SIDREP cerrados en el período.
      </WasteSidrepFoliosInfoNotice>
    );
  }

  return (
    <>
      <WasteFolioMasterDetail
        list={
          <WasteFolioListCard
            label={CLOSED_LIST_LABEL}
            rows={rows}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        }
        detail={
          selected ? (
            <WasteFolioDetailPanel
              notice={
                /*
                 * Sólo el folio cuya brecha SE PASÓ de la tolerancia lo lleva (nodo
                 * `3437:3362`). Una diferencia dentro de tolerancia se ve en la grilla y
                 * no necesita alerta: es lo que separa al `2026-SD-04812` de los otros
                 * dos, que también tienen brecha.
                 */
                selected.gap?.exceedsTolerance ? (
                  <WasteWeightDifferenceNotice
                    /*
                     * Siempre `true` acá: este panel sólo dibuja el recuadro fuera de
                     * tolerancia, así que su variante verde (`3524:560`) no se usa. El
                     * modal de cierre sí muestra las dos.
                     */
                    exceedsTolerance
                    difference={`${selected.gap.kg}kg`}
                    percentage={selected.gap.percentage}
                    dispatched={`Despachado ${selected.dispatchedKg} kg`}
                    tolerance={selected.gap.tolerance}
                  />
                ) : undefined
              }
              title={selected.wasteType}
              subtitle={folioDetailSubtitle(selected)}
              status={<WastePill tone="amber">{WASTE_SIDREP_FOLIO_CLOSED_STATUS}</WastePill>}
              footer={
                /*
                 * TODO FOLIO CERRADO TIENE RESPALDO, peligroso o no — ver
                 * `folioSupportVariant`. La peligrosidad decide CUÁL de los dos modales se
                 * abre, no si el botón existe, así que el pie es incondicional.
                 */
                <WasteTertiaryActionButton
                  fullWidth
                  label={WASTE_SIDREP_FOLIOS_SUPPORT_ACTION}
                  onClick={() => setIsSupportOpen(true)}
                />
              }
            >
              <WasteDefinitionGrid items={folioFacts(selected)} />
              <WasteFolioDetailDivider />
              <WasteFolioClosureDocsSection docs={selected.docs} />
            </WasteFolioDetailPanel>
          ) : (
            /*
             * Con la lista cargada pero sin folio elegido. El nodo no dibuja este estado
             * —entra con uno seleccionado— pero se llega a él apenas la lista venga del
             * servidor y el primer render no tenga selección.
             */
            <WasteSidrepFoliosInfoNotice>
              Elegí un folio de la lista para ver su respaldo de cierre.
            </WasteSidrepFoliosInfoNotice>
          )
        }
      />

      {/*
        Modal de respaldo — `3085:13254` (peligroso, emplazado en `3085:12902`) o
        `4327:35730` (no peligroso, en `4327:35379`). Se dibuja con `createPortal` sobre
        `document.body`: donde se declare no cambia dónde aparece, y al lado de su folio
        se lee que muestra el que está seleccionado.

        LAS DOS RAMAS SON EL PRECIO DE QUE EL COMPILADOR COMPRUEBE LA REGLA. Las props del
        modal son una unión discriminada por `variant`, así que el paquete sólo se puede
        pasar en la rama peligrosa —y `selected.packageDocs` sólo existe ahí, porque el
        folio también es una unión—. Con una sola rama y `variant` calculado, TypeScript no
        podía relacionar las dos cosas y había que forzarlo con un cast.
      */}
      {selected ? (
        selected.isHazardous ? (
          <WasteFolioSupportModal
            variant="hazardous"
            packageDocs={selected.packageDocs}
            {...supportModalProps(selected)}
          />
        ) : (
          <WasteFolioSupportModal variant="nonHazardous" {...supportModalProps(selected)} />
        )
      ) : null}
    </>
  );
}

interface WasteSidrepFoliosBodyProps {
  /**
   * La pestaña activa llega por prop y no se guarda acá: la tira vive en el header fijo y
   * los paneles en el cuerpo desplazable, o sea en dos ramas distintas del árbol, así que
   * el estado tiene que estar en el ancestro común. Con un `useState` en cada lado —como
   * estaba— hacer clic en una pestaña movía el subrayado y no el contenido.
   */
  activeTab: WasteSidrepFolioTabId;
  /** Ver `WasteSidrepOpenFoliosPanelProps`; el cuerpo sólo los pasa hacia abajo. */
  closedFolios: string[];
  onFolioClosed: (folio: WasteSidrepOpenFolio) => void;
  /** Ver `WasteSidrepPendingFoliosPanelProps`; ídem. */
  rejections: Record<string, WasteSidrepRequestRejection>;
  onRequestRejected: (request: WasteSidrepPendingRequest, reason: string) => void;
}

function WasteSidrepFoliosBody({
  activeTab,
  closedFolios,
  onFolioClosed,
  rejections,
  onRequestRejected,
}: WasteSidrepFoliosBodyProps) {
  return (
    <div className="flex w-full min-w-[1100px] flex-col items-start px-[28px] pb-[40px] pt-[20px]">
      <div
        role="tabpanel"
        id={wasteTabPanelId(TABS_BASE_ID, activeTab)}
        aria-labelledby={wasteTabId(TABS_BASE_ID, activeTab)}
        className="w-full"
      >
        {activeTab === 'pending' ? (
          <WasteSidrepPendingFoliosPanel
            rejections={rejections}
            onRequestRejected={onRequestRejected}
          />
        ) : activeTab === 'open' ? (
          <WasteSidrepOpenFoliosPanel closedFolios={closedFolios} onFolioClosed={onFolioClosed} />
        ) : (
          <WasteSidrepClosedFoliosPanel />
        )}
      </div>
    </div>
  );
}

export function WasteSidrepFoliosPage() {
  /*
   * ENTRA EN "PENDIENTES DE REVISIÓN", que es lo que faltaba para cerrar la escala. Cada
   * nodo dibuja activa su propia pestaña, así que el default no lo decide el diseño sino
   * cuál pide acción primero: una solicitud contra un SLA de 6 horas vence hoy; un folio
   * abierto fuera de plazo se mide en días; uno cerrado ya es archivo. Era el default
   * anunciado desde la iteración anterior, cuando esta bandeja todavía no existía.
   */
  const [activeTab, setActiveTab] = useState<WasteSidrepFolioTabId>('pending');

  /*
   * Lo resuelto en esta sesión —folios cerrados y solicitudes rechazadas— y el aviso que
   * lo confirma. Viven acá y no en cada panel porque los consume también la tira de
   * pestañas, que está en el header fijo: el ancestro común es esta página.
   */
  const [closedFolios, setClosedFolios] = useState<string[]>([]);
  /*
   * Los rechazos van INDEXADOS POR SOLICITUD y no en una lista: la franja del panel busca
   * el de la solicitud abierta en cada render, y volver a rechazar la misma —que el nodo
   * permite, porque deja las dos acciones activas— tiene que REEMPLAZAR el motivo y no
   * apilar un segundo registro.
   */
  const [rejections, setRejections] = useState<Record<string, WasteSidrepRequestRejection>>({});
  /*
   * UN SOLO MENSAJE PARA LOS DOS FLUJOS, y no uno por acción: el snackbar es uno y está
   * anclado al borde inferior de la vista, así que dos estados sólo servirían para que
   * dos avisos se pisaran en el mismo lugar. Cerrar un folio y rechazar una solicitud son
   * además excluyentes en el tiempo: cada uno cierra su modal antes de avisar.
   */
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const tabs = useMemo(() => foliosTabs(closedFolios.length), [closedFolios.length]);

  const handleFolioClosed = useCallback((folio: WasteSidrepOpenFolio) => {
    setClosedFolios((previous) => [...previous, folio.folio]);
    setFeedbackMessage(openFolioClosedMessage(folio));
  }, []);

  const handleRequestRejected = useCallback(
    (request: WasteSidrepPendingRequest, reason: string) => {
      /*
       * El instante se SELLA ACÁ, cuando se envía, y no en el render de la franja: con
       * `new Date()` adentro del componente el titular cambiaría de hora en cada render.
       */
      setRejections((previous) => ({
        ...previous,
        [request.request]: { request: request.request, reason, rejectedAt: new Date() },
      }));
      setFeedbackMessage(pendingRequestRejectedMessage(request));
    },
    [],
  );

  const dismissFeedbackMessage = useCallback(() => setFeedbackMessage(null), []);

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Folios SIDREP">
      <AppSidebar />
      <DashboardFrameShell
        header={
          <>
            <WarehouseHeader title={WASTE_SIDREP_FOLIOS_TITLE} />
            {/*
              Franja `3081:7673`: blanca, con borde inferior y el `pb-px` que deja que el
              subrayado de 2px de la pestaña activa se monte sobre la línea en vez de
              empujarla. Va DENTRO del header del shell —no del cuerpo— para que quede
              fija cuando la lista de folios desborde.
            */}
            <div className="flex w-full shrink-0 flex-col items-start gap-[12px] border-b border-solid border-[#e3e3e3] bg-white px-[28px] pb-px pt-[14px]">
              <WasteViewIntro description={WASTE_SIDREP_FOLIOS_DESCRIPTION} />
              <WasteTabs
                baseId={TABS_BASE_ID}
                label="Estados de los folios SIDREP"
                tabs={tabs}
                value={activeTab}
                onChange={setActiveTab}
                variant="band"
              />
            </div>
          </>
        }
        content={
          /*
           * El área desplazable descuenta el header de 56px MÁS la franja de 85.5 del nodo
           * `3081:7673`: los dos quedan fijos arriba y sólo el cuerpo gris se desplaza, que
           * es lo que hace útil el panel sticky del detalle.
           *
           * EL GRIS VA ACÁ Y NO EN EL CUERPO. El nodo `3081:7693` es `flex-[1_0_0]`, o sea
           * que la superficie llena el alto disponible aunque el contenido no llegue: con el
           * `bg` en el cuerpo, una lista corta dejaba una banda blanca abajo.
           */
          <div className="h-[calc(100vh-56px-85.5px)] w-full overflow-auto bg-[#f7f7f7]">
            <WasteSidrepFoliosBody
              activeTab={activeTab}
              closedFolios={closedFolios}
              onFolioClosed={handleFolioClosed}
              rejections={rejections}
              onRequestRejected={handleRequestRejected}
            />
          </div>
        }
      />

      {/*
        Snackbar `3083:9723`, emplazado como en `3081:9331`: la instancia mide 525 × 48 en
        x=287.5, y=506.5 dentro de la columna de contenido de 1100 × 578.5. Eso es el CENTRO
        EXACTO en horizontal —(1100 − 525) / 2 = 287.5— y 24px por encima del borde inferior
        —578.5 − (506.5 + 48) = 24—.

        Va `fixed` con `left-[220px]` para descontar el sidebar y `mx-auto` para centrarse en
        lo que queda, el mismo emplazamiento que ya usa el snackbar de "Solicitud de retiro".
        El ancho NO se fija: los 525 del nodo son el texto más el padding, y los hijos van
        `shrink-0` en el propio nodo, así que `w-fit` los reproduce y acompaña a un folio con
        nombre más largo.

        SE DIBUJA FUERA DEL ÁREA DESPLAZABLE. Adentro se iría con el scroll, y el nodo lo
        ancla al borde inferior de la vista, no del contenido.
      */}
      <Snackbar
        open={feedbackMessage !== null}
        message={feedbackMessage ?? ''}
        autoHideMs={FEEDBACK_SNACKBAR_MS}
        onClose={dismissFeedbackMessage}
        dismissible
        className="fixed bottom-[24px] left-[220px] right-0 z-[90] mx-auto w-fit max-w-[calc(100vw-260px)]"
      />
    </div>
  );
}
