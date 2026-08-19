import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { useWasteWithdrawalDraftStore } from '../../shared/stores/waste-withdrawal-draft.store';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WasteRejectedBanner } from './components/WasteRejectedBanner';
import {
  WasteSidrepAttachedDocsSection,
  type SidrepAttachedDoc,
} from './components/WasteSidrepAttachedDocsSection';
import { WasteSidrepAfterSubmitNotice } from './components/WasteSidrepAfterSubmitNotice';
import { WasteSidrepDocumentsIntro } from './components/WasteSidrepDocumentsIntro';
import { WasteSidrepFormActions } from './components/WasteSidrepFormActions';
import { WasteSidrepReviewTransportSection } from './components/WasteSidrepReviewTransportSection';
import { WasteSidrepReviewWeightSection } from './components/WasteSidrepReviewWeightSection';
import { WasteSidrepSummaryCard } from './components/WasteSidrepSummaryCard';
import { WasteSidrepSendIcon } from './icons/WasteSidrepDocumentsIcons';
import { WASTE_WITHDRAWAL_FORM_TITLE } from './WasteWithdrawalFormPage';
import { resolveDisposalSiteLabel } from './wasteSidrepForm';
import { pendingRequestRejectionQuote } from './wasteSidrepPendingFolios';
import { SIDREP_REQUIRED_DOCS, SIDREP_VEHICLE_VIEWS } from './wasteSidrepSupportDocs';
import {
  createWithdrawalRowFromLot,
  wasteWithdrawalCorrectionHeading,
  WASTE_WITHDRAWAL_REJECTION_FALLBACK_REASON,
} from './wasteWithdrawalRows';

/**
 * Paso 3 del flujo SIDREP, "Revisión y envío" — nodo Figma `3765:35418`, cuya
 * columna derecha es `3765:35516`. Se llega desde "Continuar" del paso 2.
 *
 *   `3765:35517`  Header, h-56           → `WarehouseHeader`, mismo título
 *   `3765:35520`  Main Content
 *     `3765:35522`  encabezado           → `WasteSidrepDocumentsIntro` (mismos textos que 1 y 2)
 *     `3765:35528`  resumen + stepper    → `WasteSidrepSummaryCard`, `currentStep={3}`
 *     `3765:35692`  "Datos del residuo y transporte" → `WasteSidrepReviewTransportSection`
 *     `3765:35729`  "Peso del residuo"   → `WasteSidrepReviewWeightSection`
 *     `3765:35743`  "Documentos adjuntos"→ `WasteSidrepAttachedDocsSection`
 *     `3765:35804`  "Qué pasa después"   → `WasteSidrepAfterSubmitNotice`
 *   `4278:21416`  barra de acciones      → `WasteSidrepFormActions` con el primario
 *                                          en "Enviar solicitud"
 *
 * El cuerpo repite la geometría de los otros dos pasos (`px-[28px] pt-[20px]`,
 * `gap-[16px]`): encabezado en `y=20`, resumen en `y=84`, y las cuatro tarjetas en
 * `y=257`, `366`, `504` y `808`, cada una a 16px de la anterior.
 *
 * EL FRAME MIDE 1044 DE ALTO. Mismo patrón que los otros dos: el cuerpo scrollea y
 * la barra de acciones queda fija.
 *
 * ESTA PANTALLA NO EDITA NADA. Es la última mirada antes de firmar, así que todo lo
 * que muestra sale del store y no tiene estado propio más allá del envío.
 *
 * ACÁ VUELVE A SU LUGAR EL ENVÍO. Estaba provisoriamente en el "Continuar" del paso
 * 2 —con su nota diciendo que se movía cuando existiera este nodo—: `submitDraft` y
 * `createWithdrawalRowFromLot` no cambiaron, solo cambió quién los llama.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A CONFIRMAR CON DISEÑO: DOS DE LOS SEIS ADJUNTOS NO TIENEN DE DÓNDE SALIR
 *
 * El nodo lista seis filas y cuatro se arman con lo que el flujo ya tiene. Las dos
 * "Resolución sanitaria" no:
 *
 *   vehículo     el nodo dice "vigente · Resiter S.A.". El transportista y la
 *                vigencia los devuelve `validate-transport`, que NO está
 *                implementado —hoy responde un mock—, y su resultado no viaja
 *                hasta acá. Se muestra la EECC del borrador, que es el dato real
 *                que sí existe.
 *   destinatario el nodo dice "vigente · Hidronor Chile S.A.". El nombre sale del
 *                lugar de disposición elegido; la VIGENCIA no la devuelve ningún
 *                endpoint, así que no se escribe. Afirmar "vigente" sobre una
 *                resolución sanitaria que nadie verificó es exactamente el tipo de
 *                dato que no se inventa en un formulario que va a Medio Ambiente.
 * ─────────────────────────────────────────────────────────────────────────────
 */
/** Rótulo del nodo `4278:21431`. */
export const SIDREP_SUBMIT_LABEL = 'Enviar solicitud';

export function WasteSidrepReviewPage() {
  const draft = useWasteWithdrawalDraftStore((state) => state.draft);
  const sidrep = useWasteWithdrawalDraftStore((state) => state.sidrep);
  const support = useWasteWithdrawalDraftStore((state) => state.support);
  const weights = useWasteWithdrawalDraftStore((state) => state.weights);
  const correction = useWasteWithdrawalDraftStore((state) => state.correction);
  const submitDraft = useWasteWithdrawalDraftStore((state) => state.submitDraft);
  const navigate = useNavigate();
  /** Ver la nota de `handleSubmit`: el guard es el que redirige después de enviar. */
  const [submitted, setSubmitted] = useState(false);
  /**
   * `new Date()` es impuro en render: se resuelve una sola vez al montar, igual que
   * en el resto del módulo. Fecha del retiro de la fila temporal.
   */
  const [today] = useState(() => new Date());

  /*
   * El guard pide el paso 1 completo además del lote: sin `sidrep` no hay patente,
   * conductor ni destinatario que revisar, y esta pantalla no los puede pedir.
   * `replace` para que la URL no quede en el historial.
   */
  if (submitted || !draft?.lot || !sidrep) {
    return <Navigate to={submitted ? '/waste/solicitud-retiro' : '/waste/solicitud-retiro/nueva/sidrep'} replace />;
  }

  const lot = draft.lot;
  const recipient = resolveDisposalSiteLabel(sidrep.disposalSite);
  const carrierName = draft.carrierLabel ?? '—';

  const attachedDocs: SidrepAttachedDoc[] = [
    { label: 'Ticket de pesaje', detail: sidrep.weighingTicket?.name ?? 'Adjuntado en el paso 1' },
    ...SIDREP_REQUIRED_DOCS.map(({ key, label }) => ({
      label,
      detail: support?.docs[key]?.name ?? 'Adjuntado en el paso 2',
    })),
    { label: 'Resolución sanitaria — vehículo', detail: carrierName },
    { label: 'Resolución sanitaria — destinatario', detail: recipient },
    {
      label: `${SIDREP_VEHICLE_VIEWS.length} fotografías del vehículo`,
      detail: 'frontal, posterior, ambos laterales',
    },
  ];

  /**
   * Cierra el envío y vuelve al histórico, donde aparecen la fila temporal y el
   * aviso (nodo `3765:40905`).
   *
   * El DESTINATARIO de la fila es el lugar de disposición final, igual que en el
   * resto del módulo: es a quién se le entrega el residuo.
   */
  function handleSubmit() {
    submitDraft(
      createWithdrawalRowFromLot({
        lot,
        quantity: draft?.quantity ?? '',
        recipient,
        /* Enviada a Medio ambiente: queda esperando aprobación. */
        status: 'pending',
        today,
      }),
    );
    /* La redirección la hace el guard de arriba, no un `navigate` acá. */
    setSubmitted(true);
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Revisión y envío">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={WASTE_WITHDRAWAL_FORM_TITLE} />}
        content={
          <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-white" data-name="Main Content">
            {correction ? (
              <WasteRejectedBanner
                heading={wasteWithdrawalCorrectionHeading(correction)}
                reason={pendingRequestRejectionQuote(
                  correction.rejectionReason ?? WASTE_WITHDRAWAL_REJECTION_FALLBACK_REASON,
                )}
              />
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex w-full flex-col items-start gap-[16px] px-[28px] pb-[22px] pt-[20px]">
                <WasteSidrepDocumentsIntro />
                <WasteSidrepSummaryCard
                  lot={lot}
                  quantity={draft.quantity}
                  carrier={draft.carrier}
                  carrierLabel={draft.carrierLabel ?? null}
                  sector={draft.sector ?? null}
                  currentStep={3}
                />
                <WasteSidrepReviewTransportSection
                  plate={sidrep.plate}
                  driver={sidrep.driver}
                  recipient={recipient}
                />
                {/*
                  Los tres pesos los transcribió el backend en el paso 1. Sin ellos la
                  tarjeta NO se dibuja en vez de mostrar ceros: un peso neto en 0 kg en
                  una solicitud SIDREP es un dato falso, no un estado vacío.
                */}
                {weights ? (
                  <WasteSidrepReviewWeightSection
                    grossWeightKg={weights.grossWeightKg}
                    tareWeightKg={weights.tareWeightKg}
                    netWeightKg={weights.netWeightKg}
                  />
                ) : null}
                <WasteSidrepAttachedDocsSection docs={attachedDocs} />
                <WasteSidrepAfterSubmitNotice />
              </div>
            </div>
            <WasteSidrepFormActions
              /*
               * El nodo `4278:21430` dibuja el primario HABILITADO. Corresponde: para
               * llegar acá el paso 2 ya exigió sus seis archivos y el 1 sus tres
               * validaciones, así que no queda nada por completar.
               */
              canContinue
              continueLabel={SIDREP_SUBMIT_LABEL}
              continueIcon={(className) => <WasteSidrepSendIcon className={className} />}
              /* Mismo criterio que los pasos 1 y 2: el sector distingue los dos caminos. */
              onBack={() =>
                navigate(draft?.sector ? '/waste/solicitud-retiro/nueva/sector' : '/waste/solicitud-retiro/nueva')
              }
              onContinue={handleSubmit}
            />
          </div>
        }
      />
    </div>
  );
}
