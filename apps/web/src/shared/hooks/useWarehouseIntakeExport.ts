import { useMutation } from '@tanstack/react-query';
import {
  buildWarehouseIntakeExportRequest,
  type WarehouseIntakeView,
} from '../../modules/waste/warehouseIntakeExport';
import { downloadWarehouseIntakeExport } from '../services/waste-warehouse-export.service';

/**
 * Exporta la vista "Ingresos a bodega" a Excel.
 *
 * Igual que `useWarehouseControlExport`: va como `useMutation` y no como
 * `useQuery` porque no hay estado del servidor que cachear ni revalidar, es una
 * acción del usuario. Aporta `isPending` y `error` para el estado del botón, y
 * no invalida nada porque exportar no modifica datos.
 */
export function useWarehouseIntakeExport() {
  return useMutation({
    mutationFn: (view: WarehouseIntakeView) => downloadWarehouseIntakeExport(buildWarehouseIntakeExportRequest(view)),
  });
}
