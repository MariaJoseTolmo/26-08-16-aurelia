import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { useWeighingTicketAnalysis, useWithdrawalTransportValidation } from '../../shared/hooks/useWasteWithdrawalValidation';
import type { ValidateWithdrawalTransportRequest } from '../../shared/services/waste-withdrawal-validation.service';
import { useWasteWithdrawalDraftStore } from '../../shared/stores/waste-withdrawal-draft.store';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WasteSidrepDocumentsIntro } from './components/WasteSidrepDocumentsIntro';
import { WasteSidrepFormActions } from './components/WasteSidrepFormActions';
import { WasteSidrepSummaryCard } from './components/WasteSidrepSummaryCard';
import { WasteSidrepTransportSection } from './components/WasteSidrepTransportSection';
import { WasteSidrepWeightSection } from './components/WasteSidrepWeightSection';
import { WASTE_WITHDRAWAL_FORM_TITLE } from './WasteWithdrawalFormPage';
import type { WasteWithdrawableLot } from './wasteWithdrawableLots';
import {
  createWasteSidrepFormValues,
  formatTransportRejectionMessage,
  formatTransportValidationMessage,
  isWasteSidrepStepOneComplete,
  type WasteSidrepFormValues,
} from './wasteSidrepForm';
import type { WasteWithdrawalFormValues } from './wasteWithdrawalForm';

/**
 * Paso 1 del flujo SIDREP, "Datos del traslado" — nodos Figma `3765:39262` (sin
 * validar) y `4085:77186` (validado). La columna derecha es `3765:39360`. Se llega
 * desde el botón "Continuar a documentos SIDREP" (`3765:39068`).
 *
 *   `3765:39361`  Header, h-56          → `WarehouseHeader`, mismo título
 *   `3765:39364`  Main Content
 *     `3765:39366`  encabezado          → `WasteSidrepDocumentsIntro`
 *     `3765:39372`  resumen + stepper   → `WasteSidrepSummaryCard`
 *     `3765:39414`  "Datos del traslado"→ `WasteSidrepTransportSection`
 *     `4230:10640`  "Peso del residuo"  → `WasteSidrepWeightSection`
 *   `3765:39458`  barra de acciones     → `WasteSidrepFormActions`
 *
 * El cuerpo repite la geometría de las otras dos pantallas de formulario:
 * `px-[28px] pt-[20px]` con `gap-[16px]` entre tarjetas —el encabezado arranca en
 * `x=28, y=20`, el resumen en `y=84` (48 + 16), "Datos del traslado" en `y=257`
 * (84 + 157 + 16) y "Peso del residuo" en `y=419` (257 + 146 + 16)—.
 *
 * EL FRAME MIDE 805 DE ALTO —869.25 en el estado validado— y no 720: el contenido
 * desborda la ventana de diseño. Eso confirma que el cuerpo scrollea y la barra de
 * acciones queda fija, igual que en las otras dos.
 *
 * DOS VALIDACIONES CONTRA LA API, que es lo que distingue el estado `4085:77186`:
 *
 *   patente + residuo  `useWithdrawalTransportValidation` → aviso verde `4085:77266`
 *   ticket de pesaje   `useWeighingTicketAnalysis`        → los tres pesos `4085:77290`
 *
 * Ninguno de los dos endpoints existe todavía; ver la nota de
 * `waste-withdrawal-validation.service.ts`. Hasta que se implementen, las dos
 * tarjetas muestran su estado de error con "Reintentar", que es lo correcto: el
 * front no finge una validación que el servidor no dio.
 */
export function WasteSidrepDocumentsPage() {
  const draft = useWasteWithdrawalDraftStore((state) => state.draft);

  /*
   * El guard vive en un componente aparte del formulario a propósito. Los hooks de
   * TanStack Query no pueden ir detrás de un `return` condicional —las reglas de
   * hooks exigen que se llamen siempre y en el mismo orden—, así que la decisión
   * "hay borrador o no" se toma acá y el formulario ya se monta con el lote seguro.
   *
   * `replace` para que esta URL no quede en el historial y el botón "atrás" no
   * rebote entre las dos pantallas.
   */
  if (!draft?.lot) return <Navigate to="/waste/solicitud-retiro/nueva" replace />;

  return <WasteSidrepDocumentsForm draft={draft} lot={draft.lot} />;
}

function WasteSidrepDocumentsForm({
  draft,
  lot,
}: {
  draft: WasteWithdrawalFormValues;
  lot: WasteWithdrawableLot;
}) {
  const navigate = useNavigate();
  const setSidrep = useWasteWithdrawalDraftStore((state) => state.setSidrep);
  const setWeights = useWasteWithdrawalDraftStore((state) => state.setWeights);
  const [values, setValues] = useState<WasteSidrepFormValues>(createWasteSidrepFormValues);

  /**
   * La validación se pide recién cuando hay algo que validar. Con el input en
   * `null` la query queda deshabilitada, así que no se dispara un pedido por cada
   * tecla ni uno que el backend rechazaría por incompleto.
   *
   * Va en `useMemo` porque es la `queryKey`: un objeto nuevo en cada render haría
   * que TanStack Query lo tome como otra consulta y refetchee sin parar.
   */
  const transportInput = useMemo<ValidateWithdrawalTransportRequest | null>(() => {
    if (!values.plate.trim() || !values.driver.trim() || !values.disposalSite || !draft.carrier) {
      return null;
    }
    return {
      plate: values.plate.trim(),
      driverName: values.driver.trim(),
      carrierId: draft.carrier,
      disposalSiteId: values.disposalSite,
      lotId: lot.id,
    };
  }, [values.plate, values.driver, values.disposalSite, draft.carrier, lot.id]);

  const transportQuery = useWithdrawalTransportValidation(transportInput);
  const ticketMutation = useWeighingTicketAnalysis();

  const transportValidation = transportQuery.data ?? null;
  const weights = ticketMutation.data ?? null;

  const canContinue = isWasteSidrepStepOneComplete(values, {
    transportValid: transportValidation?.valid === true,
    weights,
  });

  function updateValue<TField extends keyof WasteSidrepFormValues>(
    field: TField,
    value: WasteSidrepFormValues[TField],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /**
   * Elegir archivo dispara el análisis; quitarlo descarta el resultado anterior.
   *
   * El `reset()` no es opcional: sin él, quitar el ticket dejaría los tres pesos
   * en pantalla y el paso habilitado sobre un archivo que ya no está.
   */
  function handleTicketChange(file: File | null) {
    updateValue('weighingTicket', file);
    ticketMutation.reset();
    if (file) ticketMutation.mutate(file);
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Solicitud de retiro peligroso">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={WASTE_WITHDRAWAL_FORM_TITLE} />}
        content={
          <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-white" data-name="Main Content">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex w-full flex-col items-start gap-[16px] px-[28px] pb-[22px] pt-[20px]">
                <WasteSidrepDocumentsIntro />
                <WasteSidrepSummaryCard
                  lot={lot}
                  quantity={draft.quantity}
                  carrier={draft.carrier}
                  carrierLabel={draft.carrierLabel ?? null}
                  sector={draft.sector ?? null}
                  currentStep={1}
                />
                <WasteSidrepTransportSection
                  plate={values.plate}
                  onPlateChange={(value) => updateValue('plate', value)}
                  driver={values.driver}
                  onDriverChange={(value) => updateValue('driver', value)}
                  disposalSite={values.disposalSite}
                  onDisposalSiteChange={(value) => updateValue('disposalSite', value)}
                  validation={{
                    isLoading: transportQuery.isFetching,
                    isError: transportQuery.isError,
                    onRetry: () => void transportQuery.refetch(),
                    /*
                     * El aviso verde solo aparece con `valid: true`. Un
                     * `valid: false` es una respuesta correcta que dice que la
                     * patente NO está autorizada, así que va como rechazo.
                     */
                    message:
                      transportValidation?.valid === true
                        ? formatTransportValidationMessage(transportValidation)
                        : null,
                    rejectedMessage:
                      transportValidation && !transportValidation.valid
                        ? formatTransportRejectionMessage(transportValidation)
                        : null,
                  }}
                />
                <WasteSidrepWeightSection
                  ticket={values.weighingTicket}
                  onTicketChange={handleTicketChange}
                  weights={weights}
                  isAnalyzing={ticketMutation.isPending}
                  isError={ticketMutation.isError}
                  onRetry={() => {
                    if (values.weighingTicket) ticketMutation.mutate(values.weighingTicket);
                  }}
                />
              </div>
            </div>
            <WasteSidrepFormActions
              canContinue={canContinue}
              /*
               * "Volver" tiene que devolver a la pantalla de la que se VINO, y son
               * dos: `/nueva` elige el residuo de un lote recepcionado, `/nueva/sector`
               * lo describe partiendo del sector. Un destino fijo mandaría al
               * retirador a la pantalla del otro flujo, que es la misma trampa que el
               * guard de arriba.
               *
               * El sector en el borrador es lo que distingue los dos caminos: solo el
               * del retirador lo escribe.
               */
              onBack={() =>
                navigate(draft.sector ? '/waste/solicitud-retiro/nueva/sector' : '/waste/solicitud-retiro/nueva')
              }
              onContinue={() => {
                /*
                 * Guarda antes de navegar, igual que el paso anterior: el paso 2 es
                 * otra ruta y este `useState` se desmonta. El lugar de disposición es
                 * lo que la fila temporal del listado muestra como DESTINATARIO.
                 */
                setSidrep(values);
                /*
                 * Los pesos van al store junto con el paso: vienen de una
                 * `useMutation`, que no cachea por clave, así que sin esto el paso 3
                 * no tendría de dónde sacar el peso neto que muestra su tarjeta.
                 */
                setWeights(weights);
                navigate('/waste/solicitud-retiro/nueva/sidrep/respaldos');
              }}
            />
          </div>
        }
      />
    </div>
  );
}
