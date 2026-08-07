import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useOriginSectors,
  useWasteCategories,
  useWasteTypes,
  useWasteUnits,
} from '../../shared/hooks/useWasteCatalogs';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WarehouseIntakeAfterRegisterCard } from './components/WarehouseIntakeAfterRegisterCard';
import { WarehouseIntakeCategorySection } from './components/WarehouseIntakeCategorySection';
import { WarehouseIntakeEvidenceSection } from './components/WarehouseIntakeEvidenceSection';
import { WarehouseIntakeFormActions } from './components/WarehouseIntakeFormActions';
import { WarehouseIntakeFormIntro } from './components/WarehouseIntakeFormIntro';
import { WarehouseIntakeLotSection } from './components/WarehouseIntakeLotSection';
import { WarehouseIntakeOriginSection } from './components/WarehouseIntakeOriginSection';
import type { WarehouseFormCatalogState } from './components/WarehouseFormControls';
import {
  createWarehouseIntakeFormValues,
  isWarehouseIntakeFormComplete,
  toCategoryOptions,
  toSectorOptions,
  toUnitOptions,
  toWasteTypeOptions,
  type WarehouseIntakeFormValues,
} from './warehouseIntakeForm';

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
 *         `3713:26885` "Categoría y residuo específico"
 *         `3713:26849` "Datos del lote"
 *         `3564:1361`  "Origen del ingreso"
 *         `3564:1378`  "Respaldo"
 *       `3564:1403`  barra inferior de acciones, h-65
 *
 * El padding y el gap del cuerpo se derivan del árbol: los hijos arrancan en
 * `x=28` sobre un contenedor de 1100 (28 por lado), el primero en `y=20`, y entre
 * cada tarjeta hay 16px. La última termina en 778 sobre un contenedor de 800, de
 * donde sale el `pb-[22px]`.
 *
 * LA BARRA DE ACCIONES NO SCROLLEA. En el nodo está al pie del Main Content, y
 * acá el cuerpo es el único que se desplaza (`flex-1 overflow-y-auto`): un
 * formulario de cinco secciones deja "Registrar ingreso" fuera de pantalla si la
 * barra viaja con el contenido.
 *
 * ESTADO: los cuatro selectores leen catálogos REALES vía TanStack Query
 * (`useWasteCatalogs`), no datos de muestra. Los cuatro estados de UI viven en
 * `WarehouseFormControls`: "Cargando…" mientras la query corre, "No disponible"
 * + "Reintentar" si falla, "Sin alternativas" si el maestro está vacío, y las
 * opciones cuando llega el dato. Zustand no participa: el formulario es estado
 * local de esta pantalla y no lo comparte con nadie.
 *
 * PENDIENTE: el envío. `waste.controller.ts` solo expone lecturas; no hay
 * `POST /waste/receipts`, así que el botón primario avisa en vez de fingir que
 * guardó. También sigue pendiente el grupo derecho del header (`3564:1163` chip
 * de empresa + `3564:1167` avatar), que `WarehouseHeader` todavía no tiene.
 */
export const WAREHOUSE_INTAKE_FORM_TITLE = 'Nueva recepción a bodega';

const SUBMIT_PENDING_NOTICE =
  'El envío se conecta en la próxima iteración: la API de residuos todavía no expone la creación de recepciones.';

export function WarehouseIntakeFormPage() {
  const navigate = useNavigate();
  /**
   * `new Date()` es impuro en render: se resuelve una sola vez al montar, igual
   * que en `WarehouseIntakePage`. Alimenta la fecha inicial del formulario.
   */
  const [today] = useState(() => new Date());
  const [values, setValues] = useState<WarehouseIntakeFormValues>(() =>
    createWarehouseIntakeFormValues(today),
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const categoriesQuery = useWasteCategories();
  const wasteTypesQuery = useWasteTypes(values.categoryId);
  const unitsQuery = useWasteUnits();
  const sectorsQuery = useOriginSectors();

  const categories = useMemo<WarehouseFormCatalogState>(
    () => ({
      options: toCategoryOptions(categoriesQuery.data ?? []),
      isLoading: categoriesQuery.isLoading,
      isError: categoriesQuery.isError,
      onRetry: () => void categoriesQuery.refetch(),
    }),
    [categoriesQuery],
  );

  const wasteTypes = useMemo<WarehouseFormCatalogState>(
    () => ({
      options: toWasteTypeOptions(wasteTypesQuery.data ?? []),
      /*
       * `isLoading` de una query deshabilitada es `true` en TanStack Query v5
       * (nunca hubo fetch), así que sin este `&&` el selector diría "Cargando…"
       * para siempre mientras no haya categoría. El estado correcto ahí es
       * `waitingFor`.
       */
      isLoading: values.categoryId !== null && wasteTypesQuery.isLoading,
      isError: wasteTypesQuery.isError,
      onRetry: () => void wasteTypesQuery.refetch(),
      waitingFor: values.categoryId === null ? 'Elija una categoría' : undefined,
    }),
    [values.categoryId, wasteTypesQuery],
  );

  /**
   * Si la categoría elegida clasifica el lote como peligroso, para el aviso del
   * nodo `3713:27422`.
   *
   * Sale de `defaultHazardous`, que es la columna que la base ya tiene para esto
   * (`waste_operational_categories.default_hazardous`). NO se compara el rótulo
   * contra "RESPEL": el rótulo es copy y ya cambió dos veces esta semana; la
   * bandera es el dato.
   */
  const hazardousCategory = useMemo(
    () => (categoriesQuery.data ?? []).some((c) => c.id === values.categoryId && c.defaultHazardous),
    [categoriesQuery.data, values.categoryId],
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

  const sectors = useMemo<WarehouseFormCatalogState>(
    () => ({
      options: toSectorOptions(sectorsQuery.data ?? []),
      isLoading: sectorsQuery.isLoading,
      isError: sectorsQuery.isError,
      onRetry: () => void sectorsQuery.refetch(),
    }),
    [sectorsQuery],
  );

  function updateValue<TField extends keyof WarehouseIntakeFormValues>(
    field: TField,
    value: WarehouseIntakeFormValues[TField],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /**
   * Cambiar la categoría LIMPIA el residuo elegido. Sin esto queda un residuo de
   * la categoría anterior seleccionado mientras el selector ya muestra otro
   * catálogo: un registro que la base rechazaría por incoherente.
   */
  function handleCategoryChange(categoryId: string | null) {
    setValues((current) => ({ ...current, categoryId, wasteTypeId: null }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
  }

  /*
   * La foto pasa a ser requisito con categoría peligrosa, que es cuando el nodo
   * `3713:27341` rotula la tarjeta como "Respaldo (Obligatorio)".
   */
  const canSubmit = isWarehouseIntakeFormComplete(values, {
    photoRequired: hazardousCategory,
    hasPhoto: photo !== null,
  });

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
                <WarehouseIntakeCategorySection
                  categoryId={values.categoryId}
                  onCategoryChange={handleCategoryChange}
                  categories={categories}
                  wasteTypeId={values.wasteTypeId}
                  onWasteTypeChange={(value) => updateValue('wasteTypeId', value)}
                  wasteTypes={wasteTypes}
                  hazardous={hazardousCategory}
                />
                <WarehouseIntakeLotSection
                  entryDate={values.entryDate}
                  onEntryDateChange={(value) => updateValue('entryDate', value)}
                  quantity={values.quantity}
                  onQuantityChange={(value) => updateValue('quantity', value)}
                  unitId={values.unitId}
                  onUnitChange={(value) => updateValue('unitId', value)}
                  units={units}
                  originSectorId={values.originSectorId}
                  onOriginSectorChange={(value) => updateValue('originSectorId', value)}
                  sectors={sectors}
                />
                <WarehouseIntakeOriginSection
                  plate={values.plate}
                  onPlateChange={(value) => updateValue('plate', value)}
                  driver={values.driver}
                  onDriverChange={(value) => updateValue('driver', value)}
                />
                <WarehouseIntakeEvidenceSection
                  photo={photo}
                  onPhotoChange={setPhoto}
                  required={hazardousCategory}
                />
                {/*
                  Nodo `3713:27413`. Cuelga de la MISMA condición que el aviso
                  rosado de la primera tarjeta: los dos son el par peligroso del
                  nodo `3713:27249`, y mostrar uno sin el otro dejaría la pantalla
                  contando la mitad de la historia.
                */}
                {hazardousCategory ? <WarehouseIntakeAfterRegisterCard /> : null}
              </div>
            </div>
            <WarehouseIntakeFormActions
              canSubmit={canSubmit}
              onCancel={() => navigate('/waste/ingresos-bodega')}
              notice={submitAttempted ? SUBMIT_PENDING_NOTICE : null}
            />
          </form>
        }
      />
    </div>
  );
}
