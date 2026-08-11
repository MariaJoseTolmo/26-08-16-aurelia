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
 * estado local del paso, igual que el resto del flujo, y se envían cuando exista.
 */
export function WasteSidrepSupportDocsPage() {
  const navigate = useNavigate();
  const draft = useWasteWithdrawalDraftStore((state) => state.draft);
  const [values, setValues] = useState<WasteSidrepSupportDocsValues>(
    createWasteSidrepSupportDocsValues,
  );

  /* Mismo guard que el paso 1: sin borrador no hay resumen que mostrar. */
  if (!draft?.lot) return <Navigate to="/waste/solicitud-retiro/nueva" replace />;

  const canContinue = isWasteSidrepSupportDocsComplete(values);

  function handleDocChange(key: SidrepRequiredDocKey, file: File | null) {
    setValues((current) => ({ ...current, docs: { ...current.docs, [key]: file } }));
  }

  function handlePhotoChange(key: SidrepVehicleViewKey, file: File | null) {
    setValues((current) => ({ ...current, photos: { ...current.photos, [key]: file } }));
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
              "Continuar" queda SIN handler: el paso 3 ("Revisión y envío") es otro
              nodo, todavía pendiente. "Volver a selección de residuo" es el rótulo
              del nodo `4278:21347`, así que vuelve al inicio del flujo y no al paso 1.
            */}
            <WasteSidrepFormActions
              canContinue={canContinue}
              onBack={() => navigate('/waste/solicitud-retiro/nueva')}
            />
          </div>
        }
      />
    </div>
  );
}
