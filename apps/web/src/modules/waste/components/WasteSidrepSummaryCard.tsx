import { formatQuantity } from '../wasteFilterPrimitives';
import { resolveCarrierLabel } from '../wasteWithdrawalForm';
import type { WasteWithdrawableLot } from '../wasteWithdrawableLots';
import { WarehouseFormReadOnlyField } from './WarehouseFormControls';
import { WasteSidrepStepper } from './WasteSidrepStepper';

/**
 * Tarjeta de resumen del flujo SIDREP — nodo `3765:39372`.
 *
 * Son dos bloques dentro de una tarjeta SIN borde (el nodo solo declara
 * `bg white` y `rounded-[10px]`; el único trazo es el `border-t` que separa el
 * stepper):
 *
 *   `3765:39373`  resumen  px-[24px] py-[20px] · rounded-t-[10px]
 *                          fila `pt-[3px]` con tres campos `flex gap-[14px]`
 *   `3765:39394`  stepper  → `WasteSidrepStepper`
 *
 * NO usa `WarehouseFormCard`: esa tarjeta lleva borde completo, `px-[25px] py-[21px]`
 * y un encabezado con icono. Esta no tiene encabezado, usa otro padding y su borde
 * es una sola línea interior. Son dos cajas distintas del sistema de diseño.
 *
 * Los tres campos son `WarehouseFormReadOnlyField` con `surface="plain"`: acá el
 * nodo `3765:39379` los pinta BLANCOS con borde `#e3e3e3`, mientras la tarjeta
 * "Lote seleccionado" de la pantalla anterior (`3765:39035`) los pinta `#f7f7f7`.
 * Misma caja, distinta superficie.
 *
 * El campo "Residuo" lleva la pastilla de categoría DENTRO de la caja
 * (nodo `3765:39381`), que es para lo que existe la prop `trailing`.
 *
 * SON TRES CAMPOS O CUATRO, SEGÚN DE DÓNDE VENGA LA SOLICITUD. El nodo
 * `4085:77576` —la misma tarjeta en el camino del retirador— antepone un campo
 * "Sector" (`4223:8680`) y reparte los cuatro en 228.5 cada uno, contra los 308.67
 * de tres. No se fija ninguno de los dos anchos: la fila es `flex gap-[14px]` con
 * campos `flex-1`, así que el reparto sale solo y las dos variantes coinciden con
 * su nodo.
 */
interface WasteSidrepSummaryCardProps {
  lot: WasteWithdrawableLot;
  /** Cantidad a retirar confirmada en el paso anterior. */
  quantity: string;
  /** Valor del transportista elegido; se resuelve a su rótulo para mostrarlo. */
  carrier: string | null;
  /**
   * Rótulo ya resuelto del transportista, cuando no sale de las opciones de
   * muestra. Ver `WasteWithdrawalFormValues.carrierLabel`.
   */
  carrierLabel?: string | null;
  /**
   * Rótulo del sector, o `null` cuando la solicitud no viene del camino del
   * retirador. Con `null` la tarjeta dibuja los tres campos de siempre.
   */
  sector?: string | null;
  /** Paso en curso del stepper, base 1. */
  currentStep: number;
}

export function WasteSidrepSummaryCard({
  lot,
  quantity,
  carrier,
  carrierLabel = null,
  sector = null,
  currentStep,
}: WasteSidrepSummaryCardProps) {
  const badgeSurface = lot.isHazardous ? 'bg-[#ffd0db]' : 'bg-[#e6f3ff]';
  const badgeText = lot.isHazardous ? 'text-[#570b1d]' : 'text-[#0d3862]';

  return (
    <section className="flex w-full flex-col items-start rounded-[10px] bg-white">
      <div className="flex w-full flex-col items-start rounded-t-[10px] px-[24px] py-[20px]">
        <div className="w-full pt-[3px]">
          <div className="flex w-full items-start gap-[14px]">
            {sector ? <WarehouseFormReadOnlyField surface="plain" label="Sector" value={sector} /> : null}
            <WarehouseFormReadOnlyField
              surface="plain"
              label="Residuo"
              value={lot.wasteType}
              trailing={
                <span
                  className={`flex items-center rounded-[20px] px-[8px] py-[2px] ${badgeSurface} whitespace-nowrap font-['Inter:Bold',sans-serif] text-[9.5px] font-bold not-italic leading-[normal] ${badgeText}`}
                >
                  {lot.categoryCode}
                </span>
              }
            />
            {/*
              "2 de 4 contenedores" (nodo `3765:39388`): el campo muestra lo pedido
              CONTRA el saldo, no solo lo pedido. Es lo que deja verificar de un
              vistazo que el retiro no se pasa del lote.

              SIN SALDO SE CAE EL "de N" y queda "2 contenedores". El camino del
              retirador no parte de un lote recepcionado —describe el residuo en vez
              de elegirlo de una lista—, así que no hay disponible contra el cual
              comparar. Escribir "2 de 2" para llenar el hueco diría que el retiro
              agota un saldo que nadie midió.
            */}
            <WarehouseFormReadOnlyField
              surface="plain"
              label="Cantidad a retirar"
              value={
                lot.availableQuantity
                  ? `${formatQuantity(quantity)} de ${formatQuantity(lot.availableQuantity)} ${lot.unitLabel}`
                  : `${formatQuantity(quantity)} ${lot.unitLabel}`
              }
            />
            <WarehouseFormReadOnlyField
              surface="plain"
              label="Empresa transportista"
              value={carrierLabel ?? resolveCarrierLabel(carrier)}
            />
          </div>
        </div>
      </div>
      <WasteSidrepStepper current={currentStep} />
    </section>
  );
}
