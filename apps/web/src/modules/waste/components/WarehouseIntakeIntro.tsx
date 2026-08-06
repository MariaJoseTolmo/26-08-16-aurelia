/**
 * Párrafo introductorio de "Ingresos a bodega" — nodos `3734:28289` / `3734:28293`
 * / `3734:28294`.
 *
 *   fila     flex items-center justify-between w-full
 *   caja     w-[806px] · interior flex flex-col items-start pt-[4px]
 *   texto    Inter Regular 12.5px · leading-[18.75px] · #646464
 *
 * Un solo desvío: los 806px del nodo se expresan como `max-w-[806px]` sobre una
 * caja flexible. El brief prohíbe anchos fijos de layout y el nodo no tiene nada
 * a su derecha con lo que competir, así que el texto sigue cortando en la misma
 * medida hasta 806px y no desborda en viewports angostos.
 *
 * A diferencia de "Control de bodega", acá el botón "Exportar" NO vive en esta
 * fila: pertenece a la barra de filtros activos (`WarehouseIntakeToolbar`).
 */
export const WAREHOUSE_INTAKE_DESCRIPTION =
  'Vista consolidada de todos los ingresos, tanto de residuos peligrosos y no peligrosos.';

interface WarehouseIntakeIntroProps {
  description?: string;
}

export function WarehouseIntakeIntro({ description = WAREHOUSE_INTAKE_DESCRIPTION }: WarehouseIntakeIntroProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex max-w-[806px] flex-1 flex-col items-start self-stretch pt-[4px]">
        <p className="w-full font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[18.75px] text-[#646464]">
          {description}
        </p>
      </div>
    </div>
  );
}
