import type { ReactNode } from 'react';

/**
 * Banner de aviso a ancho completo del módulo de residuos — nodo `3830:65735`
 * ("Julio aún no termina…", vista Reporte SINADER).
 *
 * Geometría del design context:
 *
 *   caja    bg #e6f3ff · border #c5d8f0 · rounded-[8px] · w-full
 *           interior flex gap-[10px] items-start px-[17px] py-[12px]
 *   icono   caja 13.508 × 11.5 dentro de un wrapper con `pt-[1px]`
 *   texto   flex-[1_0_0] min-w-px · Inter Regular 11.5px / 17.25px · #0d3862
 *
 * El `pt-[1px]` del icono es del nodo `3830:65736` y NO es decorativo: alinea el
 * glifo con la primera línea del párrafo, que arranca 1px más abajo por su
 * `leading-[17.25px]` sobre 11.5px de cuerpo. Con `items-start` sin ese píxel el
 * icono queda pegado al borde superior de la caja de texto.
 *
 * Es un componente propio y no una variante de las tarjetas de aviso que ya tiene
 * el módulo. `WasteSidrepValidationNotice`, `WasteWithdrawalDraftNotice` y
 * `WasteSidrepAfterSubmitNotice` son BLOQUES de contenido —traen título, lista y a
 * veces acciones— mientras que esto es una sola frase a ancho completo. Compartir
 * el mismo archivo obligaría a un componente con la mitad de las props apagadas.
 *
 * NACIÓ CON UN SOLO TONO a propósito —el azul informativo— y los otros dos
 * entraron cuando el diseño los dibujó, no antes:
 *
 *   `info`    `3830:65735`  bg #e6f3ff · borde #c5d8f0 · texto #0d3862
 *   `success` `3830:66117`  bg #e0ffd3 · borde #a8dfa8 · texto #2a5c16
 *   `danger`  `4304:31891`  bg #ffd0db · borde #f0a0b0 · texto #570b1d
 *
 * `success` es el banner del período ya declarado y `danger` el del plazo vencido.
 * Ninguno de los dos pares es un color nuevo: el verde es el de la pastilla
 * "Normal" de desempeño por empresa y el rojo el del recuadro de motivo del correo
 * de rechazo de inspecciones.
 *
 * EL TONO TRAE SUS MEDIDAS, y no es un capricho: `danger` viene de un nodo
 * distinto y difiere de verdad —`px-[15px] py-[13px]` con texto de 13/20.15,
 * contra `px-[17px] py-[12px]` con 11.5/17.25 en los otros dos—. Se preserva en
 * vez de unificar por cuenta propia, igual que las medidas de los correos: son dos
 * especificaciones que conviven, no un error.
 */

export type WasteNoticeBannerTone = 'info' | 'success' | 'danger';

interface WasteNoticeBannerStyles {
  box: string;
  text: string;
  padding: string;
  typography: string;
}

const TONE_STYLES: Record<WasteNoticeBannerTone, WasteNoticeBannerStyles> = {
  info: {
    box: 'border-[#c5d8f0] bg-[#e6f3ff]',
    text: 'text-[#0d3862]',
    padding: 'px-[17px] py-[12px]',
    typography: 'text-[11.5px] leading-[17.25px]',
  },
  success: {
    box: 'border-[#a8dfa8] bg-[#e0ffd3]',
    text: 'text-[#2a5c16]',
    padding: 'px-[17px] py-[12px]',
    typography: 'text-[11.5px] leading-[17.25px]',
  },
  danger: {
    box: 'border-[#f0a0b0] bg-[#ffd0db]',
    text: 'text-[#570b1d]',
    padding: 'px-[15px] py-[13px]',
    typography: 'text-[13px] leading-[20.15px]',
  },
};

interface WasteNoticeBannerProps {
  /** Por defecto `info`, que es el tono con el que nació el componente. */
  tone?: WasteNoticeBannerTone;
  /**
   * Glifo de la izquierda, ya con su caja. Recibe el color por `currentColor`, así
   * que el `className` con las dimensiones y el tono lo pone quien lo pasa: el
   * nodo lo dibuja en #24588B, que NO es el color del texto (#0d3862).
   */
  icon: ReactNode;
  /**
   * Primera línea en negrita — el "SLA vencido" de `4304:31895`.
   *
   * Va como prop y no dentro de `children` para que el `<strong>` no dependa de que
   * cada uso se acuerde de ponerlo, y para que el salto entre título y cuerpo sea
   * el `<br>` que dibuja el nodo y no un párrafo aparte con su propio margen.
   */
  title?: string;
  children: ReactNode;
}

export function WasteNoticeBanner({
  tone = 'info',
  icon,
  title,
  children,
}: WasteNoticeBannerProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div className={`w-full rounded-[8px] border border-solid ${styles.box}`}>
      <div className={`flex w-full items-start gap-[10px] ${styles.padding}`}>
        <span className="flex shrink-0 items-start pt-px">{icon}</span>
        <p
          className={`min-w-px flex-1 font-['Inter:Regular',sans-serif] font-normal not-italic ${styles.typography} ${styles.text}`}
        >
          {title ? (
            <>
              <strong className="font-['Inter:Bold',sans-serif] font-bold">{title}</strong>
              <br />
            </>
          ) : null}
          {children}
        </p>
      </div>
    </div>
  );
}
