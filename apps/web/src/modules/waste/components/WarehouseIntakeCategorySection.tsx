import { WarehouseFormCategoryIcon } from '../icons/WarehouseIntakeFormIcons';
import { WarehouseFormCard } from './WarehouseFormCard';
import { WarehouseFormSelect, type WarehouseFormCatalogState } from './WarehouseFormControls';

/**
 * Tarjeta "Categoría y residuo específico" — nodo `3713:26885`.
 *
 * Los dos selectores están ENCADENADOS: elegir categoría acota el catálogo de
 * residuos y limpia el residuo elegido. Es lo que enuncia el propio párrafo de
 * la tarjeta ("La categoría operativa determina automáticamente si el residuo es
 * peligroso"): la peligrosidad es propiedad del residuo, y un residuo de otra
 * categoría dejaría el registro incoherente.
 *
 * El nodo declara `grid-cols` de dos columnas iguales con gap de 14px sobre 994
 * de ancho. Se implementa con `grid-cols-2` fraccionario en vez de 490px fijos,
 * y colapsa a una columna bajo `md` para no romper en viewports angostos.
 */

export const WAREHOUSE_INTAKE_CATEGORY_TITLE = 'Categoría y residuo específico';

export const WAREHOUSE_INTAKE_CATEGORY_DESCRIPTION =
  'La categoría operativa determina automáticamente si el residuo es peligroso y si aplica el seguimiento de 6 meses.';

interface WarehouseIntakeCategorySectionProps {
  categoryId: string | null;
  onCategoryChange: (value: string | null) => void;
  categories: WarehouseFormCatalogState;
  wasteTypeId: string | null;
  onWasteTypeChange: (value: string | null) => void;
  wasteTypes: WarehouseFormCatalogState;
}

export function WarehouseIntakeCategorySection({
  categoryId,
  onCategoryChange,
  categories,
  wasteTypeId,
  onWasteTypeChange,
  wasteTypes,
}: WarehouseIntakeCategorySectionProps) {
  return (
    <WarehouseFormCard
      icon={<WarehouseFormCategoryIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={WAREHOUSE_INTAKE_CATEGORY_TITLE}
      description={WAREHOUSE_INTAKE_CATEGORY_DESCRIPTION}
    >
      <div className="w-full pt-[16px]">
        <div className="grid w-full grid-cols-1 items-start gap-[14px] md:grid-cols-2">
          <WarehouseFormSelect
            label="Categoría operativa"
            value={categoryId}
            onChange={onCategoryChange}
            state={categories}
          />
          <WarehouseFormSelect
            label="Residuo específico"
            value={wasteTypeId}
            onChange={onWasteTypeChange}
            state={wasteTypes}
          />
        </div>
      </div>
    </WarehouseFormCard>
  );
}
