import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WarehouseIntakeFormActions } from './components/WarehouseIntakeFormActions';
import { WarehouseIntakeFormIntro } from './components/WarehouseIntakeFormIntro';

/**
 * Vista "Nueva recepción a bodega" del módulo de residuos. Se llega desde el
 * botón `3817:57823` de "Ingresos a bodega".
 *
 * La pantalla completa es el nodo `3564:1895` (1320 × 921), compuesto por:
 *
 *   `3564:1788`  sidebar, 220 × 720   → lo cubre `AppSidebar`
 *   `3564:1787`  resto, 1100 de ancho
 *     `3564:1158`  Header, h-56       → lo cubre `WarehouseHeader`
 *     `3564:1311`  Main Content
 *       `3564:1312`  cuerpo, px-[28px] pt-[20px], hijos separados por 16px
 *         `3564:1323`  encabezado                → `WarehouseIntakeFormIntro`
 *       `3564:1403`  barra inferior de acciones, h-65
 *
 * El padding y el gap del cuerpo se derivan del árbol: los hijos arrancan en
 * `x=28` sobre un contenedor de 1100 (28 por lado), el primero en `y=20`, y entre
 * cada tarjeta hay 16px. La última termina en 778 sobre un contenedor de 800, de
 * donde sale el `pb-[22px]`.
 *
 * LA BARRA DE ACCIONES NO SCROLLEA. En el nodo está al pie del Main Content, y
 * acá el cuerpo es el único que se desplaza (`flex-1 overflow-y-auto`): un
 * formulario de varias secciones deja "Registrar ingreso" fuera de pantalla si
 * la barra viaja con el contenido.
 *
 * PENDIENTE: las tarjetas de campos y el envío. `waste.controller.ts` solo
 * expone lecturas; no hay `POST /waste/receipts`, así que el botón primario
 * avisa en vez de fingir que guardó. También sigue pendiente el grupo derecho
 * del header (`3564:1163` chip de empresa + `3564:1167` avatar), que
 * `WarehouseHeader` todavía no tiene.
 */
export const WAREHOUSE_INTAKE_FORM_TITLE = 'Nueva recepción a bodega';

const SUBMIT_PENDING_NOTICE =
  'El envío se conecta en la próxima iteración: la API de residuos todavía no expone la creación de recepciones.';

export function WarehouseIntakeFormPage() {
  const navigate = useNavigate();
  const [submitAttempted, setSubmitAttempted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Nueva recepción a bodega">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={WAREHOUSE_INTAKE_FORM_TITLE} />}
        content={
          /* El header de 56px queda fuera del scroll, igual que en las otras dos vistas de bodega. */
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex h-[calc(100vh-56px)] w-full flex-col bg-white"
            data-name="Main Content"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div
                className="flex w-full flex-col items-start gap-[16px] px-[28px] pb-[22px] pt-[20px]"
                data-name="Container"
              >
                <WarehouseIntakeFormIntro />
              </div>
            </div>
            {/*
              Sin campos todavía no hay nada que enviar, así que el botón primario
              queda deshabilitado. Es el estado que el nodo `3565:3031` dibuja.
            */}
            <WarehouseIntakeFormActions
              canSubmit={false}
              onCancel={() => navigate('/waste/ingresos-bodega')}
              notice={submitAttempted ? SUBMIT_PENDING_NOTICE : null}
            />
          </form>
        }
      />
    </div>
  );
}
