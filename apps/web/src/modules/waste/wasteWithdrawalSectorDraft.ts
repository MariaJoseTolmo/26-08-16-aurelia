import type { LoginResponse } from '@aurelia/contracts';
import { SIMULATED_WASTE_WITHDRAWER_COMPANY } from '../../shared/auth/simulated-role';
import type { WasteWithdrawalFormValues } from './wasteWithdrawalForm';
import type { WasteWithdrawableLot } from './wasteWithdrawableLots';

/**
 * Lo que la solicitud del retirador le deja al flujo SIDREP.
 *
 * Los DOS sectores terminan escribiendo el mismo `WasteWithdrawalFormValues` en
 * `waste-withdrawal-draft.store`, pero llegan con materia prima distinta:
 *
 *   bodega     un `WasteWithdrawableLot` REAL, elegido del modal `3765:40585`
 *   truckshop  cuatro ids de catálogo, que hay que traducir a un lote sintético
 *
 * Lo común —de dónde sale la empresa transportista— vive acá para que las dos
 * ramas no lo resuelvan cada una a su manera.
 */

export interface WithdrawerCompany {
  id: string;
  name: string;
}

/**
 * Empresa contratista del retirador, que en este flujo ES el transportista.
 *
 * El nodo `4085:77594` no dibuja un selector sino "[Nombre de la EECC]": el dato
 * sale del usuario logueado. El fallback simulado entra SOLO si la sesión no trae
 * empresa, y no es cosmético — sin transportista el paso 1 de SIDREP no arma su
 * `ValidateWithdrawalTransportRequest`, la validación nunca corre y su "Continuar"
 * no se habilita jamás.
 */
export function resolveWithdrawerCompany(user: LoginResponse['user'] | null): WithdrawerCompany {
  if (user?.companyId && user.companyName) return { id: user.companyId, name: user.companyName };
  return { ...SIMULATED_WASTE_WITHDRAWER_COMPANY };
}

interface WarehouseDraftInput {
  lot: WasteWithdrawableLot;
  quantity: string;
  sectorLabel: string;
  company: WithdrawerCompany;
}

/**
 * Borrador del retiro que sale de BODEGA — nodo `3748:32500`.
 *
 * Acá no hay nada que traducir: el lote se eligió del modal y viene completo, con
 * su saldo, su fecha de ingreso y su origen. Es la diferencia de fondo con
 * `createTruckshopWithdrawalDraft`, que tiene que fabricar un lote sintético con
 * tres campos vacíos porque su residuo nunca pasó por una recepción.
 *
 * Eso también responde por el resumen del paso 1: por este camino "Cantidad a
 * retirar" SÍ puede decir "2 de 4 contenedores", porque el 4 existe.
 */
export function createWarehouseWithdrawalDraft({
  lot,
  quantity,
  sectorLabel,
  company,
}: WarehouseDraftInput): WasteWithdrawalFormValues {
  return {
    lot,
    quantity,
    carrier: company.id,
    carrierLabel: company.name,
    sector: sectorLabel,
  };
}
