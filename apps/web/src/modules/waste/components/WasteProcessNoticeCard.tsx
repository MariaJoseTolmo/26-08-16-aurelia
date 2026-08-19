import type { ReactNode } from 'react';
import processNotificationsBellIcon from '../icons/figma-4278-18187-process-notifications-bell.svg';

/**
 * Tarjeta "Notificaciones del proceso" de la vista de histórico — el CASCARÓN que
 * comparten los avisos de los nodos `4278:15644` (formulario inconcluso), `4278:17632`
 * y `4278:18184` (solicitudes rechazadas).
 *
 * SE EXTRAJO CUANDO APARECIÓ EL SEGUNDO USO, no antes. Con el aviso de borrador solo, el
 * cascarón era una parte de ese componente; con el de rechazadas los dos nodos declaran la
 * misma cosa —encabezado de campana, tarjeta de dos columnas, divisor a los 219px y punto
 * rojo centrado sobre él— y sólo cambia el contenido. Los dos nodos coinciden VALOR POR
 * VALOR en la geometría del cascarón; se compararon:
 *
 *   sección       rounded-[9px] · border #e3e3e3 · bg white
 *   encabezado    border-b #e3e3e3 · px-[14px] pt-[10px] pb-[11px] · campana 15 × 12
 *   cuerpo        px-[14px] py-[10px]
 *   tarjeta       rounded-[12px] · border #e3e3e3 · bg white · overflow-hidden
 *   columna izq   w-[219px] · p-[14px] · centrada vertical
 *   fila          border-l-[1.5px] · pl-[15.5px] pr-[14px] py-[14px] · gap-[12px]
 *   punto         #c4365a · 16 × 16 · centrado sobre el divisor
 *
 * ES EL MISMO CASCARÓN QUE `SprProcessStatusSection`, que sigue con su copia por una
 * diferencia de 1px —SPR usa `py-[10px]` en el encabezado y estos nodos `pt-[10px]
 * pb-[11px]`—: unificarlos mueve una pantalla de SPR que nadie pidió tocar. Queda anotado,
 * como estaba anotado antes de esta extracción.
 *
 * LA TARJETA ES EL BOTÓN CUANDO HAY A DÓNDE IR, y no un control aparte: ninguno de los dos
 * nodos dibuja uno. El de borrador lleva al paso que falta —su chevrón es la señal de que
 * la fila va a algún lado— y el de rechazadas NO LLEVA A NINGUNA PARTE: no tiene chevrón y
 * su texto manda a mirar una columna de la tabla de abajo. Por eso `onAction` es opcional:
 * sin él la tarjeta es un bloque de lectura, con él es un botón. Un `<button>` que no
 * navega anuncia una acción que no existe.
 *
 * EL PUNTO ROJO VA CENTRADO SOBRE EL DIVISOR. Los dos nodos lo ponen en `x=211` con 16px
 * de ancho y el divisor está en 219: 211 + 8 = 219, o sea el centro del punto cae sobre la
 * línea. Se escribe como tal —`-right-[8px]`, la mitad de sus 16px— y no con el número
 * crudo, que el borde de 1px de la tarjeta corre un píxel y que cualquier cambio de ancho
 * de la columna dejaría flotando.
 *
 * El punto es decorativo: `aria-hidden`. Lo que tiene que anunciar el lector de pantalla es
 * el contenido del aviso, y eso lo trae cada consumidor.
 */

/** Encabezado de los nodos `4278:15649`, `4278:17637` y `4278:18185`. */
export const WASTE_PROCESS_NOTICE_HEADING = 'Notificaciones del proceso';

interface WasteProcessNoticeCardProps {
  /**
   * Columna izquierda de 219px: qué es este aviso. Va centrada vertical, así que recibe
   * los textos y no una caja con alto propio.
   */
  aside: ReactNode;
  /** La fila del proceso: icono, textos y lo que cada aviso agregue a la derecha. */
  children: ReactNode;
  /**
   * Destino de la tarjeta, cuando lleva a alguna parte. Sin él la tarjeta no es un control.
   *
   * `actionLabel` viaja con él y no aparte: es el `aria-label` del botón, y un botón cuyo
   * contenido son cuatro textos sueltos necesita que alguien diga qué hace.
   */
  onAction?: () => void;
  actionLabel?: string;
}

export function WasteProcessNoticeCard({
  aside,
  children,
  onAction,
  actionLabel,
}: WasteProcessNoticeCardProps) {
  /*
   * `overflow-hidden` porque la columna derecha lleva fondo blanco y llega al borde: sin
   * recorte, sus esquinas cuadradas se asoman por fuera del `rounded-[12px]`. Es el
   * `overflow-clip` de los nodos.
   *
   * Los `var()` llevan el valor de Figma como fallback porque `styles/index.css` todavía
   * no forma parte del entrypoint de la app. Así el componente consume el token cuando
   * esté disponible y no cae al `currentColor` negro del borde mientras tanto.
   */
  const cardClassName =
    'relative flex w-full items-stretch overflow-hidden rounded-[12px] border border-solid border-[color:var(--waste-notice-border,#e3e3e3)] bg-[var(--waste-notice-surface,#fff)] text-left';

  const card = (
    <>
      <div className="relative flex w-[219px] shrink-0 flex-col justify-center p-[14px]">
        {aside}

        {/* Punto de los nodos `4278:15673`, `4278:17661` y `4278:18204`. */}
        <span
          aria-hidden="true"
          className="absolute -right-[8px] top-[11.4px] size-[16px] rounded-[8px] bg-[var(--waste-notice-marker,#c4365a)]"
        />
      </div>

      <div className="relative flex min-w-px flex-1 items-center gap-[12px] border-l-[1.5px] border-solid border-[color:var(--waste-notice-border,#e3e3e3)] bg-[var(--waste-notice-surface,#fff)] py-[14px] pl-[15.5px] pr-[14px] drop-shadow-[0px_1px_2px_rgba(0,0,0,0.06)]">
        {children}
      </div>
    </>
  );

  return (
    <section
      className="w-full rounded-[9px] border border-solid border-[color:var(--waste-notice-border,#e3e3e3)] bg-[var(--waste-notice-surface,#fff)]"
      data-name="Notificaciones del proceso"
    >
      {/*
        SIN `p-px`, aunque el design-context lo declare. El nodo del borrador mide 150.5 de
        alto y sus hijos arrancan en `y=1`: 1 + 36 + 112.5 + 1 = 150.5. O sea el único inset
        es el borde, que Figma dibuja HACIA ADENTRO. En Tailwind `border` ya lo aporta;
        sumarle `p-px` mete un segundo píxel por lado.
      */}
      <div className="w-full border-b border-solid border-[color:var(--waste-notice-border,#e3e3e3)] px-[14px] pb-[11px] pt-[10px]">
        <div className="flex items-center gap-[7px]">
          <img
            src={processNotificationsBellIcon}
            alt=""
            aria-hidden="true"
            className="block h-[12px] w-[15px] shrink-0"
          />
          <p className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[var(--waste-notice-heading,#001e39)]">
            {WASTE_PROCESS_NOTICE_HEADING}
          </p>
        </div>
      </div>

      <div className="flex w-full items-center px-[14px] py-[10px]">
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            /*
             * `hover:bg-[#fafcff]` no está en el nodo —Figma no dibuja el hover— y es el
             * mismo tono con el que `SprProcessStatusSection` marca sus filas accionables.
             * Un bloque que navega y no responde al puntero no se lee como clickeable.
             */
            className={`${cardClassName} hover:bg-[var(--waste-notice-action-hover,#fafcff)]`}
            aria-label={actionLabel}
          >
            {card}
          </button>
        ) : (
          <div className={cardClassName}>{card}</div>
        )}
      </div>
    </section>
  );
}

/**
 * Cuadrado de 44px con el glifo del aviso — nodos `4278:15659` y `4278:18057`.
 *
 * LOS DOS NODOS LE DAN LA MISMA CAJA AL GLIFO: 22.5 × 18 dentro del cuadrado de 44, con el
 * dibujo de 16 × 16 centrado y aire a los costados. No es una medida por icono, es la del
 * componente del UI Kit, así que vive acá y no en cada aviso.
 *
 * EL TONO LO TRAE CADA AVISO porque es lo que los distingue: ámbar el borrador
 * (`#ffeab8` / `#463100`), rosa las rechazadas (`#ffd0db` / `#570b1d`). Son los pares del
 * sistema de diseño, verificados sobre el render de los nodos.
 */
export function WasteProcessNoticeIcon({
  background,
  children,
}: {
  /** Clase del fondo del cuadrado, ya con el tono del aviso. */
  background: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`flex size-[44px] shrink-0 items-center justify-center rounded-[10px] ${background}`}
    >
      <span className="flex h-[18px] w-[22.5px] items-center justify-center">{children}</span>
    </span>
  );
}
