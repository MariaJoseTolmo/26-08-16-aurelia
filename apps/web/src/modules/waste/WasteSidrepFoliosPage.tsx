import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WasteSinaderNoticeInfoIcon } from './icons/WasteSinaderReportIcons';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WastePill } from './components/WastePill';
import { WasteDefinitionGrid } from './components/WasteDefinitionGrid';
import { WasteFolioClosureDocsSection } from './components/WasteFolioClosureDocsSection';
import { WasteFolioDetailDivider, WasteFolioDetailPanel } from './components/WasteFolioDetailPanel';
import { WasteFolioListCard } from './components/WasteFolioListCard';
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
  folioHasSupport,
  folioListRow,
  folioSupportExportRequest,
  folioSupportFacts,
  folioSupportSubtitle,
  WASTE_SIDREP_CLOSED_FOLIOS,
  WASTE_SIDREP_FOLIO_CLOSED_STATUS,
  type WasteSidrepFolio,
} from './wasteSidrepFolios';

/**
 * "Folios SIDREP" — nodo Figma `3083:10562` del archivo Medio-Ambiente-Core.
 * Se llega desde el rol `WASTE_ENV_APPROVER`, ítem "Folios SIDREP" del sidebar
 * (`3083:10656`, que en el nodo es el ítem ACTIVO).
 *
 * ES UN MAESTRO-DETALLE, la primera vista del módulo que lo es: la lista de folios
 * a la izquierda (`3083:10909`) y el detalle del folio elegido a la derecha
 * (`3083:10959`), que el nodo declara STICKY —su hueco en la grilla se llama
 * "Sticky placeholder – Container"— para que el detalle quede a la vista mientras se
 * recorre una lista larga.
 *
 * El cromo de la vista NO es el de las demás pantallas del módulo, y por eso el
 * cuerpo no repite el `bg-white ... pt-[20px]` de `WasteHistoryPage`:
 *
 *   `3083:10769`  header de 56px con el `<h1>`      → `WarehouseHeader`
 *   `3083:10772`  franja BLANCA con borde inferior  → párrafo + pestañas
 *   `3083:10792`  cuerpo GRIS `#f7f7f7`             → la grilla del maestro-detalle
 *
 * La franja es parte del encabezado y no del cuerpo: queda fija arriba del área
 * desplazable, que es lo que hace que las pestañas no se vayan al hacer scroll.
 *
 * SÓLO LA PESTAÑA "CERRADOS" ESTÁ INTEGRADA en esta iteración, que es la única que
 * el nodo dibuja. Las otras dos existen —con su contador, porque el diseño lo
 * muestra— y su panel explica que la bandeja llega después, en vez de fingir una
 * lista vacía o esconder la pestaña y perder el contador.
 *
 * TODO EL ESTADO ES DE CLIENTE: los folios salen de `WASTE_SIDREP_CLOSED_FOLIOS`,
 * la maqueta del nodo. Cuando exista el endpoint, la lista pasa a un hook de
 * TanStack Query y los contadores de las pestañas a la misma respuesta; el resto de
 * la vista no cambia. Ver `wasteSidrepFolios.ts`.
 */

/** Texto del nodo `3083:10771`, el `<h1>` del header. */
export const WASTE_SIDREP_FOLIOS_TITLE = 'Folios SIDREP';

/** Texto del nodo `3083:10774`. */
export const WASTE_SIDREP_FOLIOS_DESCRIPTION =
  'Revisa y aprueba las solicitudes de retiro de residuos peligrosos. El SLA de revisión es de 6 horas desde el ingreso.';

/** Texto del nodo `3083:11035`. */
export const WASTE_SIDREP_FOLIOS_SUPPORT_ACTION = 'Ver respaldo completo';

type WasteSidrepFolioTabId = 'pending' | 'open' | 'closed';

/**
 * Pestañas del nodo `3083:10776`, con los contadores que dibuja: 3, 12 y 48.
 *
 * Los 48 de "Cerrados" NO son la cantidad de folios de la maqueta —el nodo dibuja
 * tres—: es el total del período, y la lista está paginada en el diseño real. Se
 * conserva el número del nodo en vez de contar las filas, que diría "3" y sería un
 * dato distinto del que el diseño muestra.
 */
const TABS: WasteTab<WasteSidrepFolioTabId>[] = [
  { id: 'pending', label: 'Pendientes de revisión', count: 3 },
  { id: 'open', label: 'Abiertos', count: 12 },
  { id: 'closed', label: 'Cerrados', count: 48 },
];

const TABS_BASE_ID = 'waste-sidrep-folios';

/** Rótulo accesible de la lista maestra. El nodo no le pone título visible. */
const LIST_LABEL = 'Folios SIDREP cerrados';

const PENDING_NOTICE =
  'La bandeja de folios pendientes de revisión se integra en una próxima iteración. Por ahora la vista muestra los folios ya cerrados.';

const OPEN_NOTICE =
  'La bandeja de folios abiertos se integra en una próxima iteración. Por ahora la vista muestra los folios ya cerrados.';

interface WasteSidrepFoliosBodyProps {
  /**
   * La pestaña activa llega por prop y no se guarda acá: la tira vive en el header
   * fijo y los paneles en el cuerpo desplazable, o sea en dos ramas distintas del
   * árbol, así que el estado tiene que estar en el ancestro común. Con un `useState`
   * en cada lado —como estaba— hacer clic en una pestaña movía el subrayado y no el
   * contenido.
   */
  activeTab: WasteSidrepFolioTabId;
}

function WasteSidrepFoliosBody({ activeTab }: WasteSidrepFoliosBodyProps) {
  /*
   * El nodo entra con el TERCER folio abierto —el que tiene diferencia de peso— y
   * no con la lista sin selección. Es coherente con lo que la pantalla es: una
   * bandeja donde lo que pide atención se muestra primero.
   */
  const [selectedId, setSelectedId] = useState<string | null>(
    WASTE_SIDREP_CLOSED_FOLIOS[WASTE_SIDREP_CLOSED_FOLIOS.length - 1]?.folio ?? null,
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

  /*
   * El respaldo de traslado existe SÓLO para residuo peligroso — ver `folioHasSupport`.
   * De este único booleano cuelgan las dos cosas que tienen que coincidir: que el pie
   * del panel dibuje el botón, y que el modal esté abierto. Así un folio sin respaldo no
   * puede quedar con el modal en pantalla ni por un cambio de selección ni por un estado
   * que sobrevivió.
   */
  const hasSupport = selected !== null && folioHasSupport(selected);

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

  return (
    <div className="flex w-full min-w-[1100px] flex-col items-start px-[28px] pb-[40px] pt-[20px]">
      {activeTab === 'closed' ? (
        <div
          role="tabpanel"
          id={wasteTabPanelId(TABS_BASE_ID, 'closed')}
          aria-labelledby={wasteTabId(TABS_BASE_ID, 'closed')}
          className="w-full"
        >
          {rows.length === 0 ? (
            <WasteNoticeBanner
              icon={
                <WasteSinaderNoticeInfoIcon className="block h-[11.5px] w-[13.508px] shrink-0 text-[#24588b]" />
              }
            >
              No hay folios SIDREP cerrados en el período.
            </WasteNoticeBanner>
          ) : (
            /*
             * Grilla del nodo `3083:10908`: 547.72 y 476.27 con `gap-[16px]`, que
             * sobre los 1044 del cuerpo suman exactamente el ancho disponible. Van
             * como `fr` y no en píxeles —el brief prohíbe anchos fijos— así que la
             * proporción del diseño se conserva y las dos columnas crecen con el
             * viewport. Debajo de `lg` se apilan: a menos de 1024 el detalle en
             * 476px queda ilegible al lado de la lista.
             */
            <div className="grid w-full grid-cols-1 items-start gap-[16px] lg:grid-cols-[547.72fr_476.27fr]">
              <WasteFolioListCard
                label={LIST_LABEL}
                rows={rows}
                selectedId={selectedId}
                onSelect={handleSelect}
              />

              {/*
                El detalle es STICKY, como declara el hueco `3083:10958`. El
                `top-[20px]` es el mismo `pt-[20px]` del cuerpo: al fijarse, el panel
                queda a la misma distancia del borde superior que tenía al entrar.
              */}
              <div className="w-full lg:sticky lg:top-[20px]">
                {selected ? (
                  <WasteFolioDetailPanel
                    notice={
                      /*
                       * Sólo el folio cuya brecha SE PASÓ de la tolerancia lo lleva
                       * (nodo `3437:3362`). Una diferencia dentro de tolerancia se ve
                       * en la grilla y no necesita alerta: es lo que separa al
                       * `2026-SD-04812` de los otros dos, que también tienen brecha.
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
                       * Sin respaldo no hay pie: `WasteFolioDetailPanel` con `footer`
                       * vacío no dibuja la franja ni su línea, en vez de dejar un botón
                       * apagado que promete un documento que no existe.
                       */
                      hasSupport ? (
                        <WasteTertiaryActionButton
                          fullWidth
                          label={WASTE_SIDREP_FOLIOS_SUPPORT_ACTION}
                          onClick={() => setIsSupportOpen(true)}
                        />
                      ) : undefined
                    }
                  >
                    <WasteDefinitionGrid items={folioFacts(selected)} />
                    <WasteFolioDetailDivider />
                    <WasteFolioClosureDocsSection docs={selected.docs} />
                  </WasteFolioDetailPanel>
                ) : (
                  /*
                   * Con la lista cargada pero sin folio elegido. El nodo no dibuja
                   * este estado —entra con uno seleccionado— pero se llega a él
                   * apenas la lista venga del servidor y el primer render no tenga
                   * selección.
                   */
                  <WasteNoticeBanner
                    icon={
                      <WasteSinaderNoticeInfoIcon className="block h-[11.5px] w-[13.508px] shrink-0 text-[#24588b]" />
                    }
                  >
                    Elegí un folio de la lista para ver su respaldo de cierre.
                  </WasteNoticeBanner>
                )}
              </div>

              {/*
                Modal `3085:13254`, emplazado en `3085:12902`. Va montado ACÁ y no en
                el pie del panel porque se dibuja con `createPortal` sobre
                `document.body`: donde se declare no cambia dónde aparece, y al lado de
                su folio se lee que muestra el que está seleccionado.
              */}
              {selected && hasSupport ? (
                <WasteFolioSupportModal
                  open={isSupportOpen}
                  subtitle={folioSupportSubtitle(selected)}
                  status={WASTE_SIDREP_FOLIO_CLOSED_STATUS}
                  facts={folioSupportFacts(selected)}
                  dispatched={`${selected.dispatchedKg} kg`}
                  received={`${selected.receivedKg} kg`}
                  difference={selected.gap ? `${selected.gap.kg} kg` : '0 kg'}
                  differenceQualifier={selected.gap?.qualifier ?? null}
                  packageDocs={selected.packageDocs}
                  onClose={() => setIsSupportOpen(false)}
                  onDownload={() => supportExport.mutate(selected)}
                  isDownloading={supportExport.isPending}
                  downloadError={
                    supportExport.isError
                      ? 'No se pudo generar el PDF del respaldo. Intentá de nuevo.'
                      : null
                  }
                />
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <div
          role="tabpanel"
          id={wasteTabPanelId(TABS_BASE_ID, activeTab)}
          aria-labelledby={wasteTabId(TABS_BASE_ID, activeTab)}
          className="w-full"
        >
          <WasteNoticeBanner
            icon={
              <WasteSinaderNoticeInfoIcon className="block h-[11.5px] w-[13.508px] shrink-0 text-[#24588b]" />
            }
          >
            {activeTab === 'pending' ? PENDING_NOTICE : OPEN_NOTICE}
          </WasteNoticeBanner>
        </div>
      )}
    </div>
  );
}

export function WasteSidrepFoliosPage() {
  const [activeTab, setActiveTab] = useState<WasteSidrepFolioTabId>('closed');

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Folios SIDREP">
      <AppSidebar />
      <DashboardFrameShell
        header={
          <>
            <WarehouseHeader title={WASTE_SIDREP_FOLIOS_TITLE} />
            {/*
              Franja `3083:10772`: blanca, con borde inferior y el `pb-px` que deja
              que el subrayado de 2px de la pestaña activa se monte sobre la línea en
              vez de empujarla. Va DENTRO del header del shell —no del cuerpo— para
              que quede fija cuando la lista de folios desborde.
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
           * El área desplazable descuenta el header de 56px MÁS la franja de 85.5 del
           * nodo `3083:10772`: los dos quedan fijos arriba y sólo el cuerpo gris se
           * desplaza, que es lo que hace útil el panel sticky del detalle.
           *
           * EL GRIS VA ACÁ Y NO EN EL CUERPO. El nodo `3083:10792` es `flex-[1_0_0]`,
           * o sea que la superficie llena el alto disponible aunque el contenido no
           * llegue: con el `bg` en el cuerpo, una lista corta dejaba una banda blanca
           * abajo. Con el gris en el contenedor desplazable, el cuerpo aporta sólo su
           * padding y la superficie se comporta como en el diseño.
           */
          <div className="h-[calc(100vh-56px-85.5px)] w-full overflow-auto bg-[#f7f7f7]">
            <WasteSidrepFoliosBody activeTab={activeTab} />
          </div>
        }
      />
    </div>
  );
}
