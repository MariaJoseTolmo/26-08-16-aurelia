import { WarehouseFormInfoIcon } from '../icons/WarehouseIntakeFormIcons';
import { WarehouseFormCard } from './WarehouseFormCard';

/**
 * Tarjeta "Qué pasa después de registrar" — nodo `3713:27413`.
 *
 * Aparece al pie del formulario, después de "Respaldo", cuando la categoría
 * elegida es peligrosa. Es el par del aviso rosado de arriba: aquel dice QUÉ se
 * clasifica, este dice qué va a pasar con el lote una vez registrado.
 *
 * Es la misma caja que las otras cuatro secciones —`rounded-[10px]`,
 * `px-[25px] py-[21px]`, encabezado de 13.5px con icono de 16.875 × 13.5— con la
 * paleta azul del nodo, así que reutiliza `WarehouseFormCard` con `tone="info"`
 * en vez de repetir el shell.
 *
 * DOS DESVÍOS DEL NODO, los dos deliberados:
 *
 * 1. El nodo mide 1040 de ancho y las otras cuatro tarjetas 1044. Se descarta:
 *    en una pila vertical de cinco tarjetas, una 4px más angosta se ve
 *    desalineada, y no hay nada en el diseño que justifique el escalón. Va
 *    `w-full` como el resto. Si el escalón fuera intencional, avisar.
 * 2. El párrafo declara `w-[990px]`. Es el ancho de la caja de texto en Figma,
 *    no una restricción de layout; el brief prohíbe anchos fijos. Mismo criterio
 *    que en `WarehouseFormCard`.
 *
 * El icono se reutiliza: es el mismo glifo que `WarehouseFormInfoIcon` (nodo
 * `3564:1405`, el del pie) escalado ×1.227 — 6.875 × 1.227 = 8.4375 y
 * 8.33369 × 1.227 = 10.2277, que son las coordenadas del asset de este nodo. Su
 * `viewBox` de 13.75 × 11 escala solo a la caja de 16.875 × 13.5.
 *
 * El `fill` original del icono es `#24588B`, un azul más saturado que el
 * `#0d3862` del texto. No es el mismo color: van por separado.
 */

export const WAREHOUSE_INTAKE_AFTER_REGISTER_TITLE = 'Qué pasa después de registrar';

export const WAREHOUSE_INTAKE_AFTER_REGISTER_DESCRIPTION =
  'Este lote queda visible en el Dashboard con su conteo de días en bodega. Recibirás una alerta a los 5 meses (preventiva) y a los 6 meses (vencido) si aún no se ha retirado por completo. La cantidad se irá descontando automáticamente a medida que se generen solicitudes de retiro asociadas a este lote.';

export function WarehouseIntakeAfterRegisterCard() {
  return (
    <WarehouseFormCard
      tone="info"
      icon={<WarehouseFormInfoIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#24588b]" />}
      title={WAREHOUSE_INTAKE_AFTER_REGISTER_TITLE}
      description={WAREHOUSE_INTAKE_AFTER_REGISTER_DESCRIPTION}
    />
  );
}
