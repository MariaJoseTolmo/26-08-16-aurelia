import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAllWasteTypes,
  useWasteCategories,
  useWasteUnits,
} from '../../shared/hooks/useWasteCatalogs';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { useSessionStore } from '../../shared/stores/session.store';
import { useWasteWithdrawalDraftStore } from '../../shared/stores/waste-withdrawal-draft.store';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import type { WarehouseFormCatalogState } from './components/WarehouseFormControls';
import { WasteWithdrawalFormActions } from './components/WasteWithdrawalFormActions';
import { WasteWithdrawalFormIntro } from './components/WasteWithdrawalFormIntro';
import { WasteWithdrawalSectorSection } from './components/WasteWithdrawalSectorSection';
import { WasteSidrepWeightSection } from './components/WasteSidrepWeightSection';
import { WasteWithdrawalDirectRegistrationSection } from './components/WasteWithdrawalDirectRegistrationSection';
import { WasteWithdrawalLotPickerModal } from './components/WasteWithdrawalLotPickerModal';
import { WasteWithdrawalSelectedLotSection } from './components/WasteWithdrawalSelectedLotSection';
import { WasteWithdrawalSidrepNoticeSection } from './components/WasteWithdrawalSidrepNoticeSection';
import { WasteWithdrawalTruckshopLotSection } from './components/WasteWithdrawalTruckshopLotSection';
import { WasteWithdrawalWasteSection } from './components/WasteWithdrawalWasteSection';
import { buildWasteWithdrawableLots, type WasteWithdrawableLot } from './wasteWithdrawableLots';
import { toCategoryOptions, toUnitOptions, toWasteTypeOptions } from './warehouseIntakeForm';
import { WASTE_WITHDRAWAL_FORM_TITLE } from './WasteWithdrawalFormPage';
import { useWeighingTicketAnalysis } from '../../shared/hooks/useWasteWithdrawalValidation';
import { resolveDisposalSiteLabel } from './wasteSidrepForm';
import {
  createWasteWithdrawalDirectValues,
  isWasteWithdrawalDirectComplete,
  type WasteWithdrawalDirectValues,
} from './wasteWithdrawalDirectForm';
import { isWithdrawalQuantityWithinAvailable } from './wasteWithdrawalForm';
import { createWithdrawalRowFromLot } from './wasteWithdrawalRows';
import {
  createWarehouseWithdrawalDraft,
  resolveWithdrawerCompany,
} from './wasteWithdrawalSectorDraft';
import {
  resolveWasteWithdrawalSectorLabel,
  WASTE_WITHDRAWAL_TRUCKSHOP_SECTOR,
  WASTE_WITHDRAWAL_WAREHOUSE_SECTOR,
} from './wasteWithdrawalSectors';
import {
  createTruckshopWithdrawalDraft,
  createWasteWithdrawalTruckshopValues,
  isWasteWithdrawalTruckshopComplete,
  type WasteWithdrawalTruckshopValues,
} from './wasteWithdrawalTruckshopForm';

/**
 * "Nueva Solicitud de Retiro" del retirador de residuos — nodo `4217:7111`.
 *
 * ES OTRA PANTALLA, NO UN ESTADO DE `WasteWithdrawalFormPage`. Las dos se llaman
 * igual y las dos salen del botón "Nueva solicitud" de `WasteWithdrawalRequestPage`,
 * pero el rol decide a cuál se va: el resto de los usuarios arrancan eligiendo el
 * RESIDUO (`3765:38765`) y el retirador arranca eligiendo el SECTOR del que sale.
 * Meter las dos en un componente con un `if` de rol dejaría una pantalla que no es
 * ninguna de las dos y que cambia de forma según quién mire.
 *
 * Lo que sí comparten está compartido, y es casi todo el marco:
 *
 *   `4217:7210`  Header, h-56              → `WarehouseHeader`
 *   `4217:7215`  encabezado del cuerpo     → `WasteWithdrawalFormIntro`
 *   `4217:7221`  "Sector"                  → `WasteWithdrawalSectorSection`
 *   `4217:7231`  barra de acciones, h-64   → `WasteWithdrawalFormActions`
 *
 * CON TRUCKSHOP ELEGIDO la pantalla es el nodo `4223:9770`, que es esta misma
 * más una tarjeta:
 *
 *   `4223:9920`  "Lote seleccionado"       → `WasteWithdrawalTruckshopLotSection`
 *
 * CON BODEGA (PLATAFORMA 18) la pantalla es el nodo `4218:7583`, que suma otra:
 *
 *   `4218:7716`  "Residuo a retirar"      → `WasteWithdrawalWasteSection`
 *
 * Tampoco es un componente nuevo: `4218:7716` es el `3765:38875` de la otra nueva
 * solicitud —se compararon el icono y los tres textos, son los mismos—, así que
 * viene con su modal de selección de lote.
 *
 * CON EL LOTE ELEGIDO Y PELIGROSO la pantalla es el nodo `3748:32500`, que suma
 * las dos últimas:
 *
 *   `3748:32789`  "Lote seleccionado"      → `WasteWithdrawalSelectedLotSection`
 *   `3748:32690`  aviso SIDREP             → `WasteWithdrawalSidrepNoticeSection`
 *
 * Las dos ya existían. La primera es la `3765:39024` SIN el selector de
 * transportista —por eso esa prop pasó a ser opcional— y la segunda es la
 * `3765:39060` de siempre, en su estado deshabilitado.
 *
 * LOS DOS SECTORES NO SON DOS ESTADOS DEL MISMO FORMULARIO. Bodega ELIGE un lote ya
 * recepcionado, con su saldo y su fecha de ingreso; Truckshop DESCRIBE el residuo
 * contra los catálogos porque nunca pasó por una recepción. Por eso son dos
 * tarjetas distintas y no una con campos que aparecen y desaparecen.
 *
 * Y CON UN RESIDUO PELIGROSO se suma una tercera, el nodo `4230:10019`:
 *
 *   `4230:10232`  aviso SIDREP             → `WasteWithdrawalSidrepNoticeSection`
 *
 * CON UN RESIDUO NO PELIGROSO se suman OTRAS DOS, el nodo `4230:10740`:
 *
 *   `4355:41178`  "Peso del residuo"       → `WasteSidrepWeightSection`
 *   `4230:10922`  "Este retiro no requiere aprobación"
 *                                          → `WasteWithdrawalDirectRegistrationSection`
 *
 * Ninguna es nueva: la primera es la tarjeta de peso del paso 1 de SIDREP
 * (`4230:10640`) y la segunda es la del cierre directo de la otra nueva solicitud
 * (`3785:44731`), con sus mismos textos.
 *
 * Y SON EXCLUYENTES CON EL AVISO SIDREP, no acumulativas: los dos copys se
 * contradicen a propósito —"Al ser categoría RESPEL…" contra "Al no ser…"—. La
 * diferencia con el camino peligroso es que este TERMINA acá: registra el retiro y
 * vuelve al histórico, sin pasar por las tres pantallas de documentos.
 *
 * Ese aviso NO es un componente nuevo: `4230:10232` es el `3765:39060` que ya usa
 * `WasteWithdrawalFormPage`, dibujado con el CTA activo en vez de deshabilitado.
 * Se compararon los dos assets —la flecha es idéntica carácter por carácter y el
 * icono es el glifo de la pastilla "Peligroso" escalado 1.35, el mismo que ya
 * resuelve `WarehouseHazardousIcon`—.
 *
 * "Continuar a documentos SIDREP" lleva al paso 1 del flujo SIDREP, el nodo
 * `3765:34511`, que es la MISMA pantalla que ya usa el otro camino
 * (`WasteSidrepDocumentsPage`) con un campo más en su resumen: "Sector".
 *
 * Para llegar hay que dejar el borrador en `waste-withdrawal-draft.store`, que es
 * lo que esa pantalla lee y lo que su guard exige. La traducción de lo que se
 * describe acá al `WasteWithdrawableLot` que espera allá vive en
 * `createTruckshopWithdrawalDraft`, junto con la lista de qué campos este camino
 * NO puede conocer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A CONFIRMAR CON DISEÑO: ESTE CAMINO NO TIENE SALDO NI TRANSPORTISTA
 *
 * El resumen del nodo `4085:77576` dibuja "2 de 4 contenedores" y
 * "[Nombre de la EECC]", pero ninguno de los dos datos existe en este flujo:
 *
 *   el "de 4"     sale del saldo de un lote recepcionado, y acá el residuo se
 *                 DESCRIBE en vez de elegirse de la lista de lotes con saldo
 *   la EECC       es el placeholder de la empresa del usuario logueado, no de un
 *                 selector — esta pantalla no pide transportista
 *
 * Se muestran sin inventar: la cantidad queda "2 contenedores" y el transportista
 * cae al "—" de `resolveCarrierLabel`. Falta definir si el retirador debería
 * elegir un lote registrado —y entonces tiene saldo— o si su empresa sale de la
 * sesión.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * El encabezado del cuerpo se reusa TAL CUAL, con sus dos textos por defecto: los
 * nodos `4217:7218` y `4217:7220` dicen exactamente lo mismo que `3765:38872` y
 * `3765:38874`, incluida la bajada que habla de elegir el lote.
 *
 * DOS MEDIDAS DIFIEREN DE LA PANTALLA HERMANA Y NO SE UNIFICAN:
 *
 * 1. El Main Content va en `#f7f7f7` y no en blanco. El nodo `4217:7213` lo
 *    declara con `--gray/100_surf`, mientras que la pantalla de `3765:38867` va
 *    blanca. Es la misma superficie gris del listado de retiros.
 * 2. El cuerpo cierra con `pb-[40px]` (nodo `4217:7214`), no con los `pb-[22px]`
 *    que `WasteWithdrawalFormPage` tuvo que tomar prestados de `3564:1312` porque
 *    su propio nodo no declaraba padding inferior. Acá está declarado, así que se
 *    usa el de acá.
 *
 * NO HAY BOTÓN PARA AVANZAR, y no se inventa. La barra de acciones del nodo
 * `4217:7231` trae un solo control, "Cancelar retiro". El diseño todavía no dibuja
 * qué pasa después de elegir el sector, y un primario inventado tendría que ir a
 * alguna ruta que tampoco existe. Elegir el sector deja el chip marcado y nada más.
 *
 * Por lo mismo el sector vive en `useState` y no en `waste-withdrawal-draft.store`:
 * ese store persiste el borrador del flujo SIDREP, que arranca en el lote. Guardar
 * ahí un sector que ninguna pantalla lee todavía dejaría un borrador que hace
 * aparecer el aviso "Formulario inconcluso" de una solicitud que no empezó.
 */

export function WasteWithdrawalSectorPage() {
  const navigate = useNavigate();
  const [sector, setSector] = useState<string | null>(null);
  const [lot, setLot] = useState<WasteWithdrawalTruckshopValues>(createWasteWithdrawalTruckshopValues);
  const setDraft = useWasteWithdrawalDraftStore((state) => state.setDraft);
  const clearDraft = useWasteWithdrawalDraftStore((state) => state.clearDraft);
  const registerWithdrawal = useWasteWithdrawalDraftStore((state) => state.registerWithdrawal);
  /**
   * Campos del retiro NO peligroso: patente y lugar de disposición final.
   *
   * Se reusa `WasteWithdrawalDirectValues` —el modelo del mismo camino en la otra
   * nueva solicitud— porque el nodo `4230:10922` pide exactamente esos dos campos.
   */
  const [directValues, setDirectValues] = useState<WasteWithdrawalDirectValues>(
    createWasteWithdrawalDirectValues,
  );
  /**
   * Ticket de pesaje y su transcripción.
   *
   * Es la MISMA `useMutation` del paso 1 de SIDREP, con la misma tarjeta: el nodo
   * `4355:41178` es el `4230:10640`. Vive en el componente y no en el store porque
   * este camino no cruza ninguna ruta — se registra acá mismo.
   */
  const [weighingTicket, setWeighingTicket] = useState<File | null>(null);
  const ticketMutation = useWeighingTicketAnalysis();
  const user = useSessionStore((state) => state.user);

  const isTruckshop = sector === WASTE_WITHDRAWAL_TRUCKSHOP_SECTOR;
  const isWarehouse = sector === WASTE_WITHDRAWAL_WAREHOUSE_SECTOR;

  /**
   * Lote elegido en el modal y si el modal está abierto — camino de bodega.
   *
   * `new Date()` se resuelve una sola vez al montar, igual que en el resto del
   * módulo: alimenta las fechas de ingreso de los lotes de muestra.
   */
  const [today] = useState(() => new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [warehouseLot, setWarehouseLot] = useState<WasteWithdrawableLot | null>(null);
  const [warehouseQuantity, setWarehouseQuantity] = useState('');
  const lots = useMemo(() => buildWasteWithdrawableLots(today), [today]);

  /**
   * Cantidad pedida dentro del saldo del lote.
   *
   * Se reusa la regla del otro camino en vez de escribir un `quantity !== ''`:
   * pasarse del disponible es una solicitud que la API va a rechazar, y ese chequeo
   * ya está resuelto. NO se usa `isWasteWithdrawalFormComplete`, que además exige
   * transportista: por este camino el transportista es la EECC y no se elige.
   */
  const warehouseReady = warehouseLot
    ? isWithdrawalQuantityWithinAvailable({
        lot: warehouseLot,
        quantity: warehouseQuantity,
        carrier: null,
      })
    : false;

  /**
   * Habilita "Registrar retiro" del nodo `4230:10943`.
   *
   * Pide el lote descrito completo MÁS los dos campos de su tarjeta, que es la misma
   * regla que usa el camino no peligroso de `WasteWithdrawalFormPage`: registrar sin
   * cantidad ni unidad es una fila que no dice nada.
   *
   * ─────────────────────────────────────────────────────────────────────────────
   * A CONFIRMAR CON DISEÑO: NO EXIGE EL TICKET DE PESAJE
   *
   * El nodo dibuja el botón deshabilitado con la tarjeta de peso vacía, pero también
   * con la patente y el lugar de disposición vacíos, así que no permite distinguir si
   * el ticket es requisito. Se deja fuera de la regla porque es lo que hace hoy este
   * mismo CTA en el otro camino, y sumar un requisito que el diseño no enuncia
   * bloquearía a un usuario sin motivo escrito.
   *
   * Tiene su contra: el retiro alimenta el consolidado SINADER, donde el peso importa.
   * Si el ticket es obligatorio, se agrega `ticketMutation.data !== null` acá y no hay
   * nada más que tocar.
   * ─────────────────────────────────────────────────────────────────────────────
   */
  const canRegisterDirect =
    isWasteWithdrawalTruckshopComplete(lot) && isWasteWithdrawalDirectComplete(directValues);

  /*
   * Los tres catálogos se piden SIEMPRE, no solo con Truckshop elegido: son
   * hooks y no pueden colgar de una condición. No es un costo real —los tres
   * llevan el `staleTime` de 5 minutos de `useWasteCatalogs` y el resto del
   * módulo ya los tiene en cache— y evita que la tarjeta aparezca en blanco
   * esperando su primer fetch justo cuando se la elige.
   */
  const wasteTypesQuery = useAllWasteTypes();
  const categoriesQuery = useWasteCategories();
  const unitsQuery = useWasteUnits();

  const wasteTypes = useMemo<WarehouseFormCatalogState>(
    () => ({
      options: toWasteTypeOptions(wasteTypesQuery.data ?? []),
      isLoading: wasteTypesQuery.isLoading,
      isError: wasteTypesQuery.isError,
      onRetry: () => void wasteTypesQuery.refetch(),
    }),
    [wasteTypesQuery],
  );

  const categories = useMemo<WarehouseFormCatalogState>(
    () => ({
      options: toCategoryOptions(categoriesQuery.data ?? []),
      isLoading: categoriesQuery.isLoading,
      isError: categoriesQuery.isError,
      onRetry: () => void categoriesQuery.refetch(),
    }),
    [categoriesQuery],
  );

  const units = useMemo<WarehouseFormCatalogState>(
    () => ({
      options: toUnitOptions(unitsQuery.data ?? []),
      isLoading: unitsQuery.isLoading,
      isError: unitsQuery.isError,
      onRetry: () => void unitsQuery.refetch(),
    }),
    [unitsQuery],
  );

  /**
   * Si el residuo elegido es peligroso, para el aviso del nodo `4230:10232`.
   *
   * Sale de `WasteType.isHazardous` y NO de `defaultHazardous` de la categoría,
   * que es lo que usa `WarehouseIntakeFormPage`. No es una inconsistencia: allá
   * el aviso cuelga de haber elegido CATEGORÍA, antes de que exista un residuo,
   * así que el default es el único dato disponible. Acá el residuo ya está
   * elegido, y el contrato es explícito —"la peligrosidad efectiva de un ingreso
   * la manda `WasteType.isHazardous`, que es propiedad del residuo"—.
   *
   * Tampoco se compara el rótulo de la categoría contra "RESPEL", aunque sea lo
   * que dice el copy de la tarjeta: eso es texto, la bandera es el dato.
   */
  const hazardousWaste = useMemo(
    () => (wasteTypesQuery.data ?? []).some((type) => type.id === lot.wasteTypeId && type.isHazardous),
    [wasteTypesQuery.data, lot.wasteTypeId],
  );

  /**
   * Cambiar de sector LIMPIA el lote.
   *
   * Es el mismo criterio que `handleLotConfirm` en `WasteWithdrawalFormPage`:
   * los datos que se tecleron para Truckshop no describen un retiro que ahora
   * sale de otro sector, y dejarlos escondidos —la tarjeta desaparece con
   * Plataforma 18— haría que volver a Truckshop mostrara datos viejos como si
   * fueran de esta sesión.
   */
  /**
   * Cambiar de sector LIMPIA lo elegido en el sector anterior.
   *
   * Limpia LOS DOS caminos y no solo el que se deja: los datos de Truckshop no
   * describen un retiro que ahora sale de bodega, y el lote de bodega no es el
   * residuo que se estaba describiendo. Como la tarjeta del sector saliente
   * desaparece, dejarlos escondidos haría que volver muestre datos viejos como si
   * fueran de esta sesión. Es el mismo criterio que `handleLotConfirm` en
   * `WasteWithdrawalFormPage`.
   */
  function handleSectorChange(value: string) {
    if (value === sector) return;
    setSector(value);
    setLot(createWasteWithdrawalTruckshopValues());
    setWarehouseLot(null);
    setWarehouseQuantity('');
    setDirectValues(createWasteWithdrawalDirectValues());
    handleTicketChange(null);
  }

  /**
   * Elegir archivo dispara el análisis; quitarlo descarta el resultado anterior.
   *
   * El `reset()` no es opcional: sin él, quitar el ticket dejaría los tres pesos en
   * pantalla sobre un archivo que ya no está. Es literal el mismo handler del paso 1
   * de SIDREP, porque es la misma tarjeta.
   */
  function handleTicketChange(file: File | null) {
    setWeighingTicket(file);
    ticketMutation.reset();
    if (file) ticketMutation.mutate(file);
  }

  /**
   * Cierra el retiro NO peligroso — nodo `4230:10922`.
   *
   * NO GUARDA BORRADOR, igual que su gemelo en `WasteWithdrawalFormPage`: este camino
   * no cambia de ruta, registra y vuelve al histórico. Un `setDraft` acá dejaría un
   * borrador huérfano que haría aparecer "Formulario inconcluso" de una solicitud ya
   * registrada.
   *
   * El lote se arma con la misma traducción que usa el camino peligroso, así que los
   * dos describen el residuo de la misma manera.
   */
  function handleRegisterDirect() {
    if (!sector) return;

    const { lot: syntheticLot } = createTruckshopWithdrawalDraft({
      values: lot,
      sectorLabel: resolveWasteWithdrawalSectorLabel(sector),
      company: resolveWithdrawerCompany(user),
      wasteTypes: wasteTypesQuery.data ?? [],
      categories: categoriesQuery.data ?? [],
      units: unitsQuery.data ?? [],
    });
    if (!syntheticLot) return;

    registerWithdrawal(
      createWithdrawalRowFromLot({
        lot: syntheticLot,
        quantity: lot.quantity,
        recipient: resolveDisposalSiteLabel(directValues.disposalSite),
        /* Registrado de una: informativo y sin folio, como manda la tabla. */
        status: 'informational',
        today,
      }),
    );
    navigate('/waste/solicitud-retiro');
  }

  /**
   * Cambiar de lote LIMPIA la cantidad.
   *
   * Sin esto queda tecleada una cantidad válida para el saldo anterior contra un
   * lote que puede tener menos disponible, y el aviso SIDREP habilitado sobre una
   * solicitud que la API rechazaría. Es literal el mismo caso que `handleLotConfirm`
   * en `WasteWithdrawalFormPage`.
   */
  function handleLotConfirm(confirmed: WasteWithdrawableLot) {
    if (warehouseLot?.id !== confirmed.id) {
      setWarehouseLot(confirmed);
      setWarehouseQuantity('');
    }
    setPickerOpen(false);
  }

  /** Avanza al paso 1 de SIDREP con el lote real que se eligió del modal. */
  function handleContinueFromWarehouse() {
    if (!sector || !warehouseLot) return;

    setDraft(
      createWarehouseWithdrawalDraft({
        lot: warehouseLot,
        quantity: warehouseQuantity,
        sectorLabel: resolveWasteWithdrawalSectorLabel(sector),
        company: resolveWithdrawerCompany(user),
      }),
    );
    navigate('/waste/solicitud-retiro/nueva/sidrep');
  }

  /**
   * Avanza al paso 1 del flujo SIDREP — nodo `3765:34511`.
   *
   * GUARDAR ES UN REQUISITO, no una optimización: la pantalla siguiente es otra
   * ruta, este `useState` se desmonta y su tarjeta de resumen necesita el residuo,
   * la cantidad y el sector. Es el mismo motivo que `handleContinueToSidrep` en
   * `WasteWithdrawalFormPage`.
   *
   * Además es lo que hace pasar el guard de esa pantalla, que devuelve al listado
   * cuando el borrador no trae lote.
   */
  function handleContinueToSidrep() {
    if (!sector) return;

    setDraft(
      createTruckshopWithdrawalDraft({
        values: lot,
        sectorLabel: resolveWasteWithdrawalSectorLabel(sector),
        company: resolveWithdrawerCompany(user),
        wasteTypes: wasteTypesQuery.data ?? [],
        categories: categoriesQuery.data ?? [],
        units: unitsQuery.data ?? [],
      }),
    );
    navigate('/waste/solicitud-retiro/nueva/sidrep');
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Nueva solicitud (sector)">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={WASTE_WITHDRAWAL_FORM_TITLE} />}
        content={
          /* El header de 56px queda fuera del scroll, igual que en el resto del módulo. */
          <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-[#f7f7f7]" data-name="Main Content">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex w-full flex-col items-start gap-[16px] px-[28px] pb-[40px] pt-[20px]">
                <WasteWithdrawalFormIntro />
                <WasteWithdrawalSectorSection value={sector} onChange={handleSectorChange} />
                {/*
                  Bodega abre "Residuo a retirar" (nodo `4218:7716`), que es el mismo
                  `3765:38875` de la otra nueva solicitud —icono y textos idénticos,
                  comparados contra el asset—. Acá el residuo se ELIGE de los lotes
                  recepcionados; en Truckshop se describe.
                */}
                {isWarehouse ? (
                  <WasteWithdrawalWasteSection
                    selectedLot={warehouseLot}
                    onSelect={() => setPickerOpen(true)}
                  />
                ) : null}
                {/*
                  Con lote elegido se suma "Lote seleccionado" (nodo `3748:32789`),
                  que es la tarjeta `3765:39024` SIN el selector de transportista:
                  acá el transportista es la EECC del usuario y no hay nada que
                  elegir.
                */}
                {isWarehouse && warehouseLot ? (
                  <WasteWithdrawalSelectedLotSection
                    lot={warehouseLot}
                    quantity={warehouseQuantity}
                    onQuantityChange={setWarehouseQuantity}
                  />
                ) : null}
                {/*
                  Y si el lote es PELIGROSO, el aviso SIDREP (nodo `3748:32690`, el
                  mismo `3765:39060` de siempre). La condición está en su copy: "Al
                  ser categoría RESPEL…".
                */}
                {isWarehouse && warehouseLot?.isHazardous ? (
                  <WasteWithdrawalSidrepNoticeSection
                    canContinue={warehouseReady}
                    onContinue={handleContinueFromWarehouse}
                  />
                ) : null}
                {/*
                  La tarjeta de Truckshop cuelga de ese sector y de nada más: es lo
                  que declara el nodo `4223:9770`.
                */}
                {isTruckshop ? (
                  <WasteWithdrawalTruckshopLotSection
                    values={lot}
                    onChange={setLot}
                    wasteTypes={wasteTypes}
                    categories={categories}
                    units={units}
                  />
                ) : null}
                {/*
                  El aviso SIDREP cuelga del residuo PELIGROSO, y la condición está
                  en su propio copy: "Al ser categoría RESPEL…". Es el mismo
                  componente que ya usa `WasteWithdrawalFormPage` — el nodo
                  `4230:10232` es el `3765:39060` dibujado con el CTA activo, se
                  compararon los dos assets y son el mismo glifo.
                */}
                {isTruckshop && hazardousWaste ? (
                  <WasteWithdrawalSidrepNoticeSection
                    canContinue={isWasteWithdrawalTruckshopComplete(lot)}
                    onContinue={handleContinueToSidrep}
                  />
                ) : null}
                {/*
                  RESIDUO NO PELIGROSO — nodo `4230:10740`. Las dos tarjetas son
                  EXCLUYENTES con el aviso SIDREP de arriba: una dice "Al ser
                  categoría RESPEL…" y la otra "Al no ser…". La condición está en el
                  copy, igual que en `WasteWithdrawalFormPage`.

                  Sin residuo elegido todavía no se muestra ninguna de las dos: un
                  `!hazardousWaste` a secas las haría aparecer con la tarjeta en
                  blanco, porque "no peligroso" y "sin elegir" se leen igual.
                */}
                {isTruckshop && lot.wasteTypeId !== null && !hazardousWaste ? (
                  <>
                    {/* El nodo `4355:41178` es el `4230:10640` del paso 1 de SIDREP. */}
                    <WasteSidrepWeightSection
                      ticket={weighingTicket}
                      onTicketChange={handleTicketChange}
                      weights={ticketMutation.data ?? null}
                      isAnalyzing={ticketMutation.isPending}
                      isError={ticketMutation.isError}
                      onRetry={() => {
                        if (weighingTicket) ticketMutation.mutate(weighingTicket);
                      }}
                    />
                    <WasteWithdrawalDirectRegistrationSection
                      plate={directValues.plate}
                      onPlateChange={(value) => setDirectValues({ ...directValues, plate: value })}
                      disposalSite={directValues.disposalSite}
                      onDisposalSiteChange={(value) =>
                        setDirectValues({ ...directValues, disposalSite: value })
                      }
                      canRegister={canRegisterDirect}
                      onRegister={handleRegisterDirect}
                    />
                  </>
                ) : null}
              </div>
            </div>
            {/*
              "Cancelar retiro" DESCARTA el borrador, igual que en la pantalla
              hermana. Desde que el CTA de SIDREP escribe en el store, cancelar sin
              limpiar dejaría el aviso "Formulario inconcluso" ofreciendo retomar una
              solicitud que el usuario acaba de tirar.
            */}
            <WasteWithdrawalFormActions
              onCancel={() => {
                clearDraft();
                navigate('/waste/solicitud-retiro');
              }}
            />
            {/*
              El mismo modal `3765:40585` de la otra nueva solicitud. Vive fuera del
              scroll, como allá, porque se dibuja sobre toda la pantalla.
            */}
            <WasteWithdrawalLotPickerModal
              open={pickerOpen}
              lots={lots}
              selectedLotId={warehouseLot?.id ?? null}
              onClose={() => setPickerOpen(false)}
              onConfirm={handleLotConfirm}
            />
          </div>
        }
      />
    </div>
  );
}
