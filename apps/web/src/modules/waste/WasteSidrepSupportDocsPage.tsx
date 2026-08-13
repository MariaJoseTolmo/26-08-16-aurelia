import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { useWasteWithdrawalDraftStore } from '../../shared/stores/waste-withdrawal-draft.store';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WasteSidrepDocumentsIntro } from './components/WasteSidrepDocumentsIntro';
import { WasteSidrepFormActions } from './components/WasteSidrepFormActions';
import { WasteSidrepRequiredDocsSection } from './components/WasteSidrepRequiredDocsSection';
import { WasteSidrepSummaryCard } from './components/WasteSidrepSummaryCard';
import { WasteSidrepVehiclePhotosSection } from './components/WasteSidrepVehiclePhotosSection';
import { WASTE_WITHDRAWAL_FORM_TITLE } from './WasteWithdrawalFormPage';
import {
  createWasteSidrepSupportDocsValues,
  isWasteSidrepSupportDocsComplete,
  type SidrepRequiredDocKey,
  type SidrepVehicleViewKey,
  type WasteSidrepSupportDocsValues,
} from './wasteSidrepSupportDocs';

/**
 * Paso 2 del flujo SIDREP, "Documentos de respaldo" — nodo Figma `3765:39693`, cuya
 * columna derecha es `3765:39791`. Se llega desde "Continuar" del paso 1.
 *
 *   `3765:39792`  Header, h-56             → `WarehouseHeader`, mismo título
 *   `3765:39795`  Main Content
 *     `3765:39797`  encabezado             → `WasteSidrepDocumentsIntro` (mismos textos que el paso 1)
 *     `3765:39803`  resumen + stepper      → `WasteSidrepSummaryCard`, `currentStep={2}`
 *     `3765:39845`  "Documentos obligatorios" → `WasteSidrepRequiredDocsSection`
 *     `3765:39875`  "Fotografías del vehículo" → `WasteSidrepVehiclePhotosSection`
 *   `4278:21344`  barra de acciones        → `WasteSidrepFormActions`
 *
 * El cuerpo repite la geometría del paso 1 (`px-[28px] pt-[20px]`, `gap-[16px]`):
 * el encabezado en `y=20`, el resumen en `y=84`, los documentos en `y=257`
 * (84 + 157 + 16) y las fotos en `y=429` (257 + 156 + 16).
 *
 * EL FRAME MIDE 921 DE ALTO. Sigue el mismo patrón: cuerpo con scroll y barra fija.
 *
 * EN ESTE PASO EL PRIMARIO ESTÁ DIBUJADO HABILITADO (`4278:21348`: `bg #c8a064`,
 * texto blanco), a diferencia del paso 1. Aun así se ata a la completitud: los seis
 * archivos son obligatorios —lo dice el nombre de la tarjeta y el párrafo de las
 * fotos—, y habilitarlo sin ellos dejaría avanzar una solicitud que Medio Ambiente
 * va a rechazar.
 *
 * LOS SEIS ARCHIVOS NO SE SUBEN TODAVÍA. No hay endpoint de respaldos; quedan en el
 * borrador, igual que el resto del flujo, y se envían cuando exista.
 */
export function WasteSidrepSupportDocsPage() {
  const navigate = useNavigate();
  const draft = useWasteWithdrawalDraftStore((state) => state.draft);
  const setSupport = useWasteWithdrawalDraftStore((state) => state.setSupport);
  const [values, setValues] = useState<WasteSidrepSupportDocsValues>(
    createWasteSidrepSupportDocsValues,
  );

  /* Sin borrador no hay resumen que mostrar: se vuelve al inicio del flujo. */
  if (!draft?.lot) return <Navigate to="/waste/solicitud-retiro/nueva" replace />;

  const canContinue = isWasteSidrepSupportDocsComplete(values);

  function handleDocChange(key: SidrepRequiredDocKey, file: File | null) {
    setValues((current) => ({ ...current, docs: { ...current.docs, [key]: file } }));
  }

  function handlePhotoChange(key: SidrepVehicleViewKey, file: File | null) {
    setValues((current) => ({ ...current, photos: { ...current.photos, [key]: file } }));
  }

  /**
   * Avanza al paso 3, "Revisión y envío" (nodo `3765:35418`).
   *
   * ACÁ YA NO SE ENVÍA. El envío vivía provisoriamente en este botón —con su nota
   * diciendo que se movería cuando existiera el nodo del paso 3—; ahora existe, y
   * `submitDraft` pasó a `WasteSidrepReviewPage` sin cambios.
   *
   * GUARDAR ES UN REQUISITO, no una optimización: el paso 3 lista los seis adjuntos
   * en su tarjeta "Documentos adjuntos" y es otra ruta, así que este `useState` se
   * desmonta. Mismo motivo que el `setSidrep` del paso 1.
   */
  function handleContinue() {
    setSupport(values);
    navigate('/waste/solicitud-retiro/nueva/sidrep/revision');
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Documentos de respaldo">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={WASTE_WITHDRAWAL_FORM_TITLE} />}
        content={
          <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-white" data-name="Main Content">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex w-full flex-col items-start gap-[16px] px-[28px] pb-[22px] pt-[20px]">
                <WasteSidrepDocumentsIntro />
                <WasteSidrepSummaryCard
                  lot={draft.lot}
                  quantity={draft.quantity}
                  carrier={draft.carrier}
                  carrierLabel={draft.carrierLabel ?? null}
                  /* El resumen es el mismo en los tres pasos: si el paso 1 muestra
                     "Sector", el 2 también. */
                  sector={draft.sector ?? null}
                  currentStep={2}
                />
                <WasteSidrepRequiredDocsSection docs={values.docs} onDocChange={handleDocChange} />
                <WasteSidrepVehiclePhotosSection
                  photos={values.photos}
                  onPhotoChange={handlePhotoChange}
                />
              </div>
            </div>
            {/*
              "Volver a selección de residuo" es el rótulo del nodo `4278:21347`, así
              que vuelve al inicio del flujo y no al paso 1.
            */}
            <WasteSidrepFormActions
              canContinue={canContinue}
              /* Mismo criterio que el paso 1: "Volver a selección de residuo" es
                 `/nueva/sector` para el retirador y `/nueva` para el resto. */
              onBack={() =>
                navigate(draft.sector ? '/waste/solicitud-retiro/nueva/sector' : '/waste/solicitud-retiro/nueva')
              }
              onContinue={handleContinue}
            />
          </div>
        }
      />
    </div>
  );
}
