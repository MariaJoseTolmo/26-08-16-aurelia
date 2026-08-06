import type { WarehouseControlExportFormat } from '../../../shared/services/waste-warehouse-export.service';
import { WarehouseExportButton, type WarehouseExportOption } from './WarehouseExportButton';

/**
 * Párrafo introductorio y botón "Exportar" — nodos `3686:25704` / `3686:25705`
 * y `3817:58610`.
 *
 *   fila     flex gap-[24px] items-center pt-[4px] w-full
 *   texto    Inter Regular 12.5px · leading-[18.75px] · #646464
 *
 * El botón y su menú de formatos viven en `WarehouseExportButton`, compartido
 * con "Ingresos a bodega". Acá queda lo propio de esta vista: el párrafo y el
 * mensaje de error, que va debajo del texto y no del botón.
 */
export const WAREHOUSE_CONTROL_DESCRIPTION =
  'Gestiona los lotes de residuos almacenados transitoriamente. Los residuos peligrosos tienen un plazo máximo de 6 meses de almacenamiento.';

interface WarehouseControlIntroProps {
  description?: string;
  /** Dispara la exportación. El caret del diseño abre el menú de formatos. */
  onExport?: (format: WarehouseControlExportFormat) => void;
  /** Formato en curso, para bloquear el botón mientras la API renderiza. */
  exporting?: WarehouseControlExportFormat | null;
  /** Mensaje de error de la última exportación fallida. */
  exportError?: string | null;
}

const FORMAT_OPTIONS: WarehouseExportOption[] = [
  { format: 'pdf', label: 'Descargar PDF (A4)' },
  { format: 'xlsx', label: 'Descargar Excel' },
];

export function WarehouseControlIntro({
  description = WAREHOUSE_CONTROL_DESCRIPTION,
  onExport,
  exporting = null,
  exportError = null,
}: WarehouseControlIntroProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-[24px] pt-[4px]">
      <div className="min-w-0 flex-1">
        <p className="font-['Inter:Regular',sans-serif] text-[12.5px] font-normal not-italic leading-[18.75px] text-[#646464]">
          {description}
        </p>
        {exportError ? (
          <p role="alert" className="pt-[4px] font-['Inter:Regular',sans-serif] text-[11.5px] font-normal text-[#bd3b5b]">
            {exportError}
          </p>
        ) : null}
      </div>

      <WarehouseExportButton options={FORMAT_OPTIONS} onExport={onExport} exporting={exporting} />
    </div>
  );
}
