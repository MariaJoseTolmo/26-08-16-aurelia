import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAllWasteTypes,
  useWasteCategories,
  useWasteUnits,
} from '../../shared/hooks/useWasteCatalogs';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import type { WarehouseFormCatalogState } from './components/WarehouseFormControls';
import { WasteWithdrawalFormActions } from './components/WasteWithdrawalFormActions';
import { WasteWithdrawalFormIntro } from './components/WasteWithdrawalFormIntro';
import { WasteWithdrawalSectorSection } from './components/WasteWithdrawalSectorSection';
import { WasteWithdrawalTruckshopLotSection } from './components/WasteWithdrawalTruckshopLotSection';
import { toCategoryOptions, toUnitOptions, toWasteTypeOptions } from './warehouseIntakeForm';
import { WASTE_WITHDRAWAL_FORM_TITLE } from './WasteWithdrawalFormPage';
import { WASTE_WITHDRAWAL_TRUCKSHOP_SECTOR } from './wasteWithdrawalSectors';
import {
  createWasteWithdrawalTruckshopValues,
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
 * Con Bodega (Plataforma 18) el diseño no dibuja nada extra. La bifurcación es
 * por sector y no un "hay sector elegido": el nodo solo la muestra con Truckshop.
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

  const isTruckshop = sector === WASTE_WITHDRAWAL_TRUCKSHOP_SECTOR;

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
   * Cambiar de sector LIMPIA el lote.
   *
   * Es el mismo criterio que `handleLotConfirm` en `WasteWithdrawalFormPage`:
   * los datos que se tecleron para Truckshop no describen un retiro que ahora
   * sale de otro sector, y dejarlos escondidos —la tarjeta desaparece con
   * Plataforma 18— haría que volver a Truckshop mostrara datos viejos como si
   * fueran de esta sesión.
   */
  function handleSectorChange(value: string) {
    if (value === sector) return;
    setSector(value);
    setLot(createWasteWithdrawalTruckshopValues());
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
                  La tarjeta cuelga de Truckshop y de nada más: es lo que declara
                  el nodo `4223:9770`. Con Bodega (Plataforma 18) el diseño no
                  dibuja ninguna sección extra, así que no se inventa una.
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
              </div>
            </div>
            {/*
              "Cancelar retiro" vuelve al histórico. Acá no hay borrador que
              descartar —el sector no se persiste—, así que no llama a `clearDraft`:
              hacerlo borraría el borrador del OTRO flujo, que es de otra pantalla.
            */}
            <WasteWithdrawalFormActions onCancel={() => navigate('/waste/solicitud-retiro')} />
          </div>
        }
      />
    </div>
  );
}
