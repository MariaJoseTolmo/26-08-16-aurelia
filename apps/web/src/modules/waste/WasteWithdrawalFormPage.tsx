import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { useWasteWithdrawalDraftStore } from '../../shared/stores/waste-withdrawal-draft.store';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WasteWithdrawalDirectRegistrationSection } from './components/WasteWithdrawalDirectRegistrationSection';
import { WasteWithdrawalFormActions } from './components/WasteWithdrawalFormActions';
import { WasteWithdrawalFormIntro } from './components/WasteWithdrawalFormIntro';
import { WasteWithdrawalLotPickerModal } from './components/WasteWithdrawalLotPickerModal';
import { WasteWithdrawalSelectedLotSection } from './components/WasteWithdrawalSelectedLotSection';
import { WasteWithdrawalSidrepNoticeSection } from './components/WasteWithdrawalSidrepNoticeSection';
import { WasteWithdrawalWasteSection } from './components/WasteWithdrawalWasteSection';
import { resolveDisposalSiteLabel } from './wasteSidrepForm';
import { buildWasteWithdrawableLots, type WasteWithdrawableLot } from './wasteWithdrawableLots';
import {
  createWasteWithdrawalDirectValues,
  isWasteWithdrawalDirectComplete,
  type WasteWithdrawalDirectValues,
} from './wasteWithdrawalDirectForm';
import {
  createWasteWithdrawalFormValues,
  isWasteWithdrawalFormComplete,
  type WasteWithdrawalFormValues,
} from './wasteWithdrawalForm';
import { createWithdrawalRowFromLot } from './wasteWithdrawalRows';

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
 * CON UN LOTE NO PELIGROSO ELEGIDO la pantalla es el nodo `3785:44514`, que repite
 * las dos primeras tarjetas y cambia la tercera:
 *
 *   `3785:44731`  "Este retiro no requiere aprobación" → `WasteWithdrawalDirectRegistrationSection`
 *
 * LAS DOS TERCERAS TARJETAS SON EXCLUYENTES y cuelgan de `isHazardous`, no de una
 * lectura propia: una dice "Al ser categoría RESPEL…" y la otra "Al no ser categoría
 * RESPEL…". La condición está en el copy.
 *
 * Y NO SON EL MISMO PASO. La peligrosa CONTINÚA a tres pantallas de documentos SIDREP;
 * la no peligrosa TERMINA acá, registrando el retiro. Por eso el primario de la no
 * peligrosa vive dentro de su tarjeta y la barra de acciones sigue trayendo solo
 * "Cancelar retiro" en las dos variantes (nodos `3765:38885` y `3785:44708`).
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
  /**
   * Campos del retiro NO peligroso. Van en su propio `useState` y no en `values` por
   * lo que explica `wasteWithdrawalDirectForm`: son de esta variante y el flujo SIDREP
   * no los conoce.
   */
  const [directValues, setDirectValues] = useState<WasteWithdrawalDirectValues>(
    createWasteWithdrawalDirectValues,
  );
  const setDraft = useWasteWithdrawalDraftStore((state) => state.setDraft);
  const registerWithdrawal = useWasteWithdrawalDraftStore((state) => state.registerWithdrawal);

  const lots = useMemo(() => buildWasteWithdrawableLots(today), [today]);
  /** Tronco común: lote, cantidad dentro del saldo y transportista. */
  const isFormComplete = isWasteWithdrawalFormComplete(values);
  const canContinue = isFormComplete;
  /**
   * "Registrar retiro" pide el tronco común MÁS los dos campos de su tarjeta. No
   * alcanza con la patente y el lugar: registrar un retiro sin cantidad ni
   * transportista es una fila que no dice nada.
   */
  const canRegister = isFormComplete && isWasteWithdrawalDirectComplete(directValues);

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

  /**
   * Cierra el retiro NO peligroso — nodo `3785:44731`.
   *
   * NO GUARDA BORRADOR. Este camino no cambia de ruta: registra y vuelve al histórico,
   * así que el lote y la cantidad no tienen que sobrevivir a nada. Llamar a `setDraft`
   * acá dejaría además un borrador huérfano que haría aparecer el aviso "Formulario
   * inconcluso" de una solicitud que ya se registró.
   *
   * El DESTINATARIO de la fila es el lugar de disposición final, igual que en el camino
   * peligroso: es a quién se le entrega el residuo.
   */
  function handleRegister() {
    if (!values.lot) return;

    registerWithdrawal(
      createWithdrawalRowFromLot({
        lot: values.lot,
        quantity: values.quantity,
        recipient: resolveDisposalSiteLabel(directValues.disposalSite),
        /* Registrado de una: informativo y sin folio, como manda la tabla. */
        status: 'informational',
        today,
      }),
    );
    navigate('/waste/solicitud-retiro');
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
                  Las dos terceras tarjetas son EXCLUYENTES y la condición está en su
                  propio copy: "Al ser categoría RESPEL…" contra "Al no ser categoría
                  RESPEL…". Sin lote todavía no se muestra ninguna.
                */}
                {values.lot ? (
                  values.lot.isHazardous ? (
                    <WasteWithdrawalSidrepNoticeSection
                      canContinue={canContinue}
                      onContinue={handleContinueToSidrep}
                    />
                  ) : (
                    <WasteWithdrawalDirectRegistrationSection
                      plate={directValues.plate}
                      onPlateChange={(value) =>
                        setDirectValues((current) => ({ ...current, plate: value }))
                      }
                      disposalSite={directValues.disposalSite}
                      onDisposalSiteChange={(value) =>
                        setDirectValues((current) => ({ ...current, disposalSite: value }))
                      }
                      canRegister={canRegister}
                      onRegister={handleRegister}
                    />
                  )
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
