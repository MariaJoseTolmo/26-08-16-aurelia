import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WastePerformanceCriticalNoteIcon } from './icons/WasteCompanyPerformanceIcons';
import { WarehouseFormLotIcon } from './icons/WarehouseIntakeFormIcons';
import {
  WasteSinaderNoticeIcon,
  WasteSinaderNoticeInfoIcon,
} from './icons/WasteSinaderReportIcons';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WastePill } from './components/WastePill';
import { WasteDefinitionGrid } from './components/WasteDefinitionGrid';
import { WasteFolioCloseModal } from './components/WasteFolioCloseModal';
import { WasteFolioClosureDocsSection } from './components/WasteFolioClosureDocsSection';
import { WasteFolioDetailDivider, WasteFolioDetailPanel } from './components/WasteFolioDetailPanel';
import { WasteFolioFooterActionButton } from './components/WasteFolioFooterActionButton';
import { WasteFolioListCard } from './components/WasteFolioListCard';
import { WasteFolioMasterDetail } from './components/WasteFolioMasterDetail';
import { WasteFolioNotice } from './components/WasteFolioNotice';
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
 * DOS DE LAS TRES PESTAÑAS ESTÁN INTEGRADAS, una por nodo. "Pendientes de revisión"
 * existe —con su contador, porque el diseño lo muestra— y su panel explica que la
 * bandeja llega después, en vez de fingir una lista vacía o esconder la pestaña y perder
 * el contador.
 *
 * TODO EL ESTADO ES DE CLIENTE: los folios salen de `WASTE_SIDREP_CLOSED_FOLIOS` y
 * `WASTE_SIDREP_OPEN_FOLIOS`, las maquetas de los nodos. Cuando exista el endpoint, cada
 * lista pasa a un hook de TanStack Query y los contadores de las pestañas a la misma
 * respuesta; el resto de la vista no cambia. Ver `wasteSidrepFolios.ts` y
 * `wasteSidrepOpenFolios.ts`.
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
const TABS: WasteTab<WasteSidrepFolioTabId>[] = [
  { id: 'pending', label: 'Pendientes de revisión', count: 3 },
  { id: 'open', label: 'Abiertos', count: 12 },
  { id: 'closed', label: 'Cerrados', count: 48 },
];

const TABS_BASE_ID = 'waste-sidrep-folios';

/** Rótulos accesibles de las listas maestras. Los nodos no les ponen título visible. */
const OPEN_LIST_LABEL = 'Folios SIDREP abiertos';
const CLOSED_LIST_LABEL = 'Folios SIDREP cerrados';

const PENDING_NOTICE =
  'La bandeja de folios pendientes de revisión se integra en una próxima iteración. Por ahora la vista muestra los folios abiertos y los ya cerrados.';

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
 * Por qué "Confirmar cierre" queda deshabilitado dentro del modal.
 *
 * El formulario es completo y validado, pero todavía no hay endpoint al que mandarlo. Es
 * el mismo criterio que el "Descargar PDF" del respaldo antes de que existiera el suyo: el
 * modal se abre y se llena, y el primario queda en el `#e2e2e2` que el propio nodo
 * `4230:13314` dibuja hasta que haya a quién confirmarle.
 */
const OPEN_FOLIO_CONFIRM_HINT =
  'El registro del cierre en la plataforma se integra en una próxima iteración.';

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
 * Pestaña "Abiertos" — nodo `3081:7463`.
 *
 * Un folio abierto es un traslado EN CURSO, así que el panel no habla de pesos recibidos
 * sino de tiempo: cuántos días lleva abierto, si se pasó del plazo, y que la plataforma
 * del Ministerio todavía no confirmó la recepción.
 */
function WasteSidrepOpenFoliosPanel() {
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

  const rows = useMemo(() => WASTE_SIDREP_OPEN_FOLIOS.map(openFolioListRow), []);
  const selected = useMemo(
    () => WASTE_SIDREP_OPEN_FOLIOS.find((folio) => folio.folio === selectedId) ?? null,
    [selectedId],
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
          onClose={() => setClosingFolio(null)}
          disabledHint={OPEN_FOLIO_CONFIRM_HINT}
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
}

function WasteSidrepFoliosBody({ activeTab }: WasteSidrepFoliosBodyProps) {
  return (
    <div className="flex w-full min-w-[1100px] flex-col items-start px-[28px] pb-[40px] pt-[20px]">
      <div
        role="tabpanel"
        id={wasteTabPanelId(TABS_BASE_ID, activeTab)}
        aria-labelledby={wasteTabId(TABS_BASE_ID, activeTab)}
        className="w-full"
      >
        {activeTab === 'open' ? (
          <WasteSidrepOpenFoliosPanel />
        ) : activeTab === 'closed' ? (
          <WasteSidrepClosedFoliosPanel />
        ) : (
          <WasteSidrepFoliosInfoNotice>{PENDING_NOTICE}</WasteSidrepFoliosInfoNotice>
        )}
      </div>
    </div>
  );
}

export function WasteSidrepFoliosPage() {
  /*
   * ENTRA EN "ABIERTOS" y no en "Cerrados", que era el default de la iteración anterior.
   * Es la pestaña que el nodo de esta vista dibuja activa (`3081:7684`), y es la que pide
   * acción: un folio abierto fuera de plazo es trabajo pendiente, mientras que un folio
   * cerrado ya es archivo. "Pendientes de revisión" será el default cuando su bandeja
   * exista, porque va todavía más arriba en esa escala.
   */
  const [activeTab, setActiveTab] = useState<WasteSidrepFolioTabId>('open');

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
                tabs={TABS}
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
            <WasteSidrepFoliosBody activeTab={activeTab} />
          </div>
        }
      />
    </div>
  );
}
