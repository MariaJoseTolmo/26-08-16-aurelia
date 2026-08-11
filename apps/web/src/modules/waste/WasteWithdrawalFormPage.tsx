import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { useWasteWithdrawalDraftStore } from '../../shared/stores/waste-withdrawal-draft.store';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WasteWithdrawalFormActions } from './components/WasteWithdrawalFormActions';
import { WasteWithdrawalFormIntro } from './components/WasteWithdrawalFormIntro';
import { WasteWithdrawalLotPickerModal } from './components/WasteWithdrawalLotPickerModal';
import { WasteWithdrawalSelectedLotSection } from './components/WasteWithdrawalSelectedLotSection';
import { WasteWithdrawalSidrepNoticeSection } from './components/WasteWithdrawalSidrepNoticeSection';
import { WasteWithdrawalWasteSection } from './components/WasteWithdrawalWasteSection';
import { buildWasteWithdrawableLots, type WasteWithdrawableLot } from './wasteWithdrawableLots';
import {
  createWasteWithdrawalFormValues,
  isWasteWithdrawalFormComplete,
  type WasteWithdrawalFormValues,
} from './wasteWithdrawalForm';

/**
 * Vista "Nueva solicitud" del módulo de residuos. Se llega desde el botón
 * `3817:55662` de "Solicitud de retiro".
 *
 * Es el paralelo exacto de `WarehouseIntakeFormPage`, que se llega desde el botón
 * `3817:57823` de "Ingresos a bodega": misma relación pantalla-lista/pantalla-alta
 * y misma ruta hija (`/waste/solicitud-retiro/nueva` contra
 * `/waste/ingresos-bodega/nuevo`).
 *
 * Que la ruta sea HIJA no es cosmético: el sub-ítem "Solicitud de retiro" del
 * sidebar está declarado sin `end`, así que `isRouteActive` lo deja resaltado
 * mientras se está acá. Con `end: true` ninguna ruta del módulo coincidiría,
 * `findActiveModule` caería al listado completo de módulos y se perdería el
 * sidebar contextual — es la misma nota que ya está en `AppSidebar`.
 *
 * La pantalla completa es el nodo `3765:38765`, cuya columna derecha es
 * `3765:38863` (1060 de ancho):
 *
 *   `3765:38864`  Header, h-56               → `WarehouseHeader`
 *   `3765:38867`  Main Content
 *     `3765:38869`  encabezado del cuerpo    → `WasteWithdrawalFormIntro`
 *     `3765:38875`  "Residuo a retirar"      → `WasteWithdrawalWasteSection`
 *   `3765:38885`  barra de acciones, h-64  → `WasteWithdrawalFormActions`
 *
 * CON UN LOTE PELIGROSO ELEGIDO la pantalla es el nodo `3765:38986`, que suma dos
 * tarjetas y cambia una:
 *
 *   `3765:38998`  "Residuo a retirar" con la fila del lote en lugar del recuadro
 *   `3765:39024`  "Lote seleccionado"  → `WasteWithdrawalSelectedLotSection`
 *   `3765:39060`  aviso SIDREP         → `WasteWithdrawalSidrepNoticeSection`
 *
 * El aviso SIDREP cuelga de `isHazardous`, no de una lectura propia: su texto dice
 * "Al ser categoría RESPEL…". La pantalla para un lote NO peligroso es otro nodo,
 * todavía pendiente.
 *
 * El header NO repite el rótulo del botón que trae acá: el nodo `3765:38866`
 * dice "Solicitudes de retiro — Residuos", no "Nueva solicitud". El título de la
 * pantalla es el `<h2>` del cuerpo (`3765:38872`, "Nueva Solicitud de Retiro"),
 * igual que en "Nueva recepción a bodega".
 *
 * El padding y el gap del cuerpo se derivan del árbol: el encabezado arranca en
 * `x=28` sobre un contenedor de 1060 (28 por lado) y en `y=20`, mide 48 de alto y
 * la tarjeta siguiente empieza en `y=84`, de donde salen los 16px de separación.
 * Son las mismas medidas que "Nueva recepción a bodega" (`3564:1312`), no las del
 * listado de retiros, que va con `px-[22px]`.
 *
 * LA BARRA DE ACCIONES NO SCROLLEA. En el nodo es hermana del Main Content y
 * queda al pie de la columna (`y=656` de 720); acá el cuerpo es el único que se
 * desplaza (`flex-1 overflow-y-auto`), igual que en `WarehouseIntakeFormPage`. Con
 * la barra viajando dentro del contenido, "Cancelar retiro" se iría de pantalla en
 * cuanto el formulario crezca.
 *
 * `pb-[22px]` NO sale de este nodo y no puede salir: el contenido termina en
 * `y=218` sobre un Main Content de 600, así que Figma no declara ningún padding
 * inferior. Se toma el de `3564:1312`, donde SÍ está derivado, para que el cuerpo
 * no quede pegado a la barra cuando el scroll llegue al final.
 */

/** Texto del nodo `3765:38866`. El guion es largo (—), con espacios a los lados. */
export const WASTE_WITHDRAWAL_FORM_TITLE = 'Solicitudes de retiro — Residuos';

export function WasteWithdrawalFormPage() {
  const navigate = useNavigate();
  /**
   * `new Date()` es impuro en render: se resuelve una sola vez al montar, igual
   * que en el resto del módulo. Alimenta las fechas de ingreso de los lotes.
   */
  const [today] = useState(() => new Date());
  /**
   * Estado de UI puro: si el modal está abierto y qué lote quedó elegido. Va en
   * `useState` y no en Zustand porque no lo comparte nadie más —es lo mismo que
   * hace `WarehouseIntakeFormPage` con su formulario—.
   */
  const [pickerOpen, setPickerOpen] = useState(false);
  const [values, setValues] = useState<WasteWithdrawalFormValues>(createWasteWithdrawalFormValues);
  const setDraft = useWasteWithdrawalDraftStore((state) => state.setDraft);

  const lots = useMemo(() => buildWasteWithdrawableLots(today), [today]);
  const canContinue = isWasteWithdrawalFormComplete(values);

  function updateValue<TField extends keyof WasteWithdrawalFormValues>(
    field: TField,
    value: WasteWithdrawalFormValues[TField],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /**
   * Cambiar de lote LIMPIA la cantidad. Sin esto queda tecleada una cantidad
   * válida para el saldo anterior contra un lote que puede tener menos
   * disponible, y el botón habilitado sobre una solicitud que la API rechazaría.
   * Es el mismo criterio que `handleCategoryChange` en el formulario de ingreso.
   */
  function handleLotConfirm(lot: WasteWithdrawableLot) {
    setValues((current) => (current.lot?.id === lot.id ? current : { ...current, lot, quantity: '' }));
    setPickerOpen(false);
  }

  /**
   * Avanza al paso 1 del flujo SIDREP.
   *
   * Guarda el borrador ANTES de navegar: la pantalla siguiente es otra ruta, así
   * que este `useState` se desmonta y sin el store perdería el lote, la cantidad y
   * el transportista que su tarjeta de resumen necesita mostrar.
   */
  function handleContinueToSidrep() {
    setDraft(values);
    navigate('/waste/solicitud-retiro/nueva/sidrep');
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Nueva solicitud">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={WASTE_WITHDRAWAL_FORM_TITLE} />}
        content={
          /* El header de 56px queda fuera del scroll, igual que en el resto del módulo. */
          <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-white" data-name="Main Content">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex w-full flex-col items-start gap-[16px] px-[28px] pb-[22px] pt-[20px]">
                <WasteWithdrawalFormIntro />
                <WasteWithdrawalWasteSection
                  selectedLot={values.lot}
                  onSelect={() => setPickerOpen(true)}
                />
                {values.lot ? (
                  <WasteWithdrawalSelectedLotSection
                    lot={values.lot}
                    quantity={values.quantity}
                    onQuantityChange={(value) => updateValue('quantity', value)}
                    carrier={values.carrier}
                    onCarrierChange={(value) => updateValue('carrier', value)}
                  />
                ) : null}
                {/*
                  La tarjeta SIDREP cuelga de `isHazardous` y no de una
                  interpretación: su propio texto dice "Al ser categoría RESPEL…".
                  La pantalla para un lote NO peligroso es otro nodo, todavía
                  pendiente, así que acá simplemente no se muestra.
                */}
                {values.lot?.isHazardous ? (
                  <WasteWithdrawalSidrepNoticeSection
                    canContinue={canContinue}
                    onContinue={handleContinueToSidrep}
                  />
                ) : null}
              </div>
            </div>
            <WasteWithdrawalFormActions onCancel={() => navigate('/waste/solicitud-retiro')} />
            <WasteWithdrawalLotPickerModal
              open={pickerOpen}
              lots={lots}
              selectedLotId={values.lot?.id ?? null}
              onClose={() => setPickerOpen(false)}
              onConfirm={handleLotConfirm}
            />
          </div>
        }
      />
    </div>
  );
}
