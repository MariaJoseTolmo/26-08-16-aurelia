import { useMutation } from '@tanstack/react-query';
import {
  buildWarehouseControlExportRequest,
  type WarehouseControlView,
} from '../../modules/waste/warehouseControlExport';
import {
  downloadWarehouseControlExport,
  type WarehouseControlExportFormat,
} from '../services/waste-warehouse-export.service';

interface WarehouseControlExportInput {
  format: WarehouseControlExportFormat;
  view: WarehouseControlView;
}

/**
 * Exporta la vista "Control de bodega" a PDF o Excel.
 *
 * Va como `useMutation` y no como `useQuery`: no hay estado del servidor que
 * cachear ni revalidar, es una acción disparada por el usuario. El hook aporta
 * `isPending` y `error`, que el botón usa para su estado de carga y de fallo.
 * No invalida nada porque la exportación no modifica datos.
 */
export function useWarehouseControlExport() {
  return useMutation({
    mutationFn: ({ format, view }: WarehouseControlExportInput) =>
      downloadWarehouseControlExport(format, buildWarehouseControlExportRequest(view)),
  });
}
