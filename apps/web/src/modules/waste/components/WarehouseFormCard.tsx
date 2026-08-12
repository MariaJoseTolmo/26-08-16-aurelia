import type { ReactNode } from 'react';

/**
 * Tarjeta de sección del formulario "Registrar ingreso a Bodega".
 *
 * Las cuatro secciones del nodo `3564:1787` —`3713:26885`, `3713:26849`,
 * `3564:1361` y `3564:1378`— declaran EXACTAMENTE la misma caja, así que va una
 * sola vez acá:
 *
 *   bg white · border #e3e3e3 · rounded-[10px] · px-[25px] py-[21px]
 *   Heading 3   flex gap-[8px] items-center · icono 16.875 × 13.5
 *               texto Inter Bold 13.5px #131313
 *   Paragraph   pt-[3px] · Inter Regular 11.5px #646464
 *
 * Los altos del nodo (144, 211, 116, 156) NO se fijan: salen de sumar este
 * padding con el contenido. Por eso el `pt` que separa el cuerpo del encabezado
 * lo pone cada sección —16px cuando hay párrafo, 3px en "Origen del ingreso",
 * que no lo tiene— en vez de vivir acá.
 *
 * Un desvío deliberado: el nodo marca los párrafos `whitespace-nowrap` con un
 * ancho fijo de 994px. Se descarta. Es el ancho de la caja de texto en Figma, no
 * una restricción de layout, y con `nowrap` la descripción desbordaría la
 * tarjeta en un viewport angosto. Mismo criterio que en `WarehouseIntakeFormIntro`.
 */

/**
 * Paletas de la tarjeta. `default` son las cuatro secciones de campos;
 * `info` es "Qué pasa después de registrar" (nodo `3713:27413`), que usa el
 * mismo azul que la pastilla "No peligroso" de las tablas (`#e6f3ff`/`#0d3862`);
 * `warning` es "Este retiro requiere el flujo completo SIDREP" (nodo
 * `3765:39060`), en `#fff0e6` con borde `#f5c4a0` y texto `#6b3a1f`; `success` es
 * "Este retiro no requiere aprobación" (nodo `3785:44731`), en `#e0ffd3` con borde
 * `#a8dfa8` y texto `#2a5c16`.
 *
 * `success` NO ES UN VERDE NUEVO: `#e0ffd3`/`#2a5c16` es el mismo par que SPR ya usa
 * para sus filas "Completado" en `SprProcessStatusSection`. El borde `#a8dfa8` sí lo
 * aporta este nodo, que es el primero que dibuja la tarjeta entera en verde.
 *
 * OJO con `warning`: el icono de su encabezado NO va del color del título. El
 * nodo `3765:39062` viene en `#E8720C` y el texto en `#6b3a1f`, así que el color
 * del icono lo pone quien lo pasa y no esta tabla. En `success` en cambio el icono
 * SÍ va del color del título (`3785:44733` y `3785:44735` son los dos `#2a5c16`),
 * pero se sigue pasando desde afuera para no partir la convención.
 */
type WarehouseFormCardTone = 'default' | 'info' | 'warning' | 'success';

const CARD_TONE: Record<WarehouseFormCardTone, { shell: string; title: string; description: string }> = {
  default: { shell: 'border-[#e3e3e3] bg-white', title: 'text-[#131313]', description: 'text-[#646464]' },
  info: { shell: 'border-[#c5d8f0] bg-[#e6f3ff]', title: 'text-[#0d3862]', description: 'text-[#0d3862]' },
  warning: { shell: 'border-[#f5c4a0] bg-[#fff0e6]', title: 'text-[#6b3a1f]', description: 'text-[#6b3a1f]' },
  success: { shell: 'border-[#a8dfa8] bg-[#e0ffd3]', title: 'text-[#2a5c16]', description: 'text-[#2a5c16]' },
};

interface WarehouseFormCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  tone?: WarehouseFormCardTone;
  /**
   * Separación entre el encabezado y el cuerpo cuando la tarjeta NO tiene
   * párrafo. El nodo `3765:39024` ("Lote seleccionado") la declara como
   * `gap-[8px]` en la tarjeta; las secciones con párrafo la ponen ellas con su
   * propio `pt`.
   */
  bodyGap?: boolean;
  children?: ReactNode;
}

export function WarehouseFormCard({
  icon,
  title,
  description,
  tone = 'default',
  bodyGap = false,
  children,
}: WarehouseFormCardProps) {
  const palette = CARD_TONE[tone];

  return (
    <section
      className={`flex w-full flex-col items-start rounded-[10px] border border-solid px-[25px] py-[21px] ${palette.shell} ${bodyGap ? 'gap-[8px]' : ''}`}
    >
      <div className="flex w-full items-center gap-[8px]">
        {icon}
        <h3
          className={`whitespace-nowrap font-['Inter:Bold',sans-serif] text-[13.5px] font-bold not-italic leading-[normal] ${palette.title}`}
        >
          {title}
        </h3>
      </div>
      {description ? (
        <div className="w-full pt-[3px]">
          <p
            className={`font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] ${palette.description}`}
          >
            {description}
          </p>
        </div>
      ) : null}
      {children}
    </section>
  );
}
