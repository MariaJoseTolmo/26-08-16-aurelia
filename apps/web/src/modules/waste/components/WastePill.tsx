import type { ReactNode } from 'react';

/**
 * Pastilla de texto del módulo de residuos: la caja común de todas las etiquetas
 * pequeñas de estado, categoría y clasificación.
 *
 * Sale de `WasteWithdrawalStatusBadge`, donde vivía como `WasteWithdrawalPill`.
 * Se extrajo cuando "Reporte SINADER" (`3830:65385`) necesitó las DOS formas en
 * la misma pantalla —la chip del KPI "Estado del período" y la píldora de
 * categoría de la tabla— y ninguna de las dos habla de un retiro. Aquel
 * componente sigue existiendo con su nombre y su API intactos, delegando acá.
 *
 * Geometría común, verificada contra los nodos de las tres vistas:
 *
 *   caja    px-[9px] py-[3px] · texto Inter Bold 10px · leading normal
 *   chip    rounded-[5px]   `3817:55580` (retiros) · `3830:65747` (SINADER)
 *   píldora rounded-[20px]  `3830:65648` (SINADER, categoría del residuo)
 *
 * `WasteHazardBadge` NO usa este componente aunque comparta el radio de 20px:
 * lleva icono y `gap-[5px]`, así que es otra caja del sistema de diseño.
 *
 * Los anchos fijos de los nodos no se reproducen: son la caja de texto de Figma.
 * Con `px-[9px]` el ancho lo da el contenido, sale la misma medida y además
 * tolera rótulos más largos.
 */

/**
 * Tonos dibujados por el diseño. Cada par sale de un nodo concreto, no de una
 * escala inventada:
 *
 *   `neutral` `3817:55580` "Informativo"        bg #f7f7f7 · borde #e3e3e3 · #acacac
 *   `teal`    `3817:55589` "Cerrado"            bg #c5fff6 · sin borde     · #006153
 *   `amber`   `3817:56001` "Pendiente"          bg #fff0e6 · sin borde     · #6b3a1f
 *   `blue`    `3830:65747` "En curso"           bg #e6f3ff · sin borde     · #0d3862
 *             `3830:65648` "CHATARRA" (categoría del residuo, mismo par)
 *
 * `blue` es el MISMO par que `WasteHazardBadge` usa para "No peligroso" y que el
 * banner informativo de SINADER usa de fondo: es el azul de superficie del
 * módulo, no un color nuevo.
 */
export type WastePillTone = 'neutral' | 'teal' | 'amber' | 'blue';

const PILL_TONE: Record<WastePillTone, string> = {
  neutral: 'border border-solid border-[#e3e3e3] bg-[#f7f7f7] text-[#acacac]',
  teal: 'bg-[#c5fff6] text-[#006153]',
  amber: 'bg-[#fff0e6] text-[#6b3a1f]',
  blue: 'bg-[#e6f3ff] text-[#0d3862]',
};

/** `chip` es el rectángulo redondeado; `pill` la cápsula. Nada más cambia. */
export type WastePillShape = 'chip' | 'pill';

const PILL_SHAPE: Record<WastePillShape, string> = {
  chip: 'rounded-[5px]',
  pill: 'rounded-[20px]',
};

interface WastePillProps {
  tone: WastePillTone;
  /** Por defecto `chip`, que es la forma mayoritaria en el módulo. */
  shape?: WastePillShape;
  children: ReactNode;
}

export function WastePill({ tone, shape = 'chip', children }: WastePillProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-[9px] py-[3px] font-['Inter:Bold',sans-serif] text-[10px] font-bold not-italic leading-[normal] ${PILL_SHAPE[shape]} ${PILL_TONE[tone]}`}
    >
      {children}
    </span>
  );
}
