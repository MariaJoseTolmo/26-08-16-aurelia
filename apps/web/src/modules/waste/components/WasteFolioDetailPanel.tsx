import type { ReactNode } from 'react';

/**
 * Panel de detalle de un folio SIDREP — nodo `3083:10959`, la columna derecha de
 * la vista "Folios SIDREP".
 *
 * Es el DETALLE del maestro-detalle: muestra el folio que se eligió en
 * `WasteFolioListCard`. La tarjeta sólo aporta el armazón —cuatro franjas
 * separadas por líneas— y recibe el contenido por `slot`, porque las tres
 * pestañas de la vista (pendientes, abiertos, cerrados) van a llenar las mismas
 * franjas con bloques distintos.
 *
 * Geometría del design context:
 *
 *   tarjeta  bg white · border var(--gray/300, #e3e3e3) · rounded-[10px]
 *   aviso    `3083:10960`  px-[20px] pt-[14px] · sin línea
 *   cabecera `3083:10965`  px-[20px] pt-[18px] pb-[19px] · border-b #e3e3e3
 *            título   `3083:10968` Inter Bold 14.5px · #131313 · pb-[3px]
 *            subtítulo `3440:3378` pt-[5px] · Inter Regular 11.5px · #646464
 *            pastilla `3083:10971` arriba a la derecha, alineada al título
 *   cuerpo   `3083:10973`  px-[20px] py-[18px] · gap-[16px]
 *   pie      `3083:11031`  px-[20px] pt-[15px] pb-[14px] · border-t #e3e3e3
 *
 * LA PASTILLA VA EN LA FILA DEL TÍTULO, no de todo el bloque de texto, y eso NO es
 * una interpretación: el nodo la pone en `y=18` con 18px de alto, exactamente el
 * alto y la posición del título, mientras el subtítulo corre POR DEBAJO a lo ancho
 * del panel. En Figma se ve como un `justify-between` de todo el bloque porque el
 * texto del subtítulo (376px) se desborda de su caja declarada (235px) — un
 * desprolijo de la maqueta. Modelado como fila de título + subtítulo a ancho
 * completo sale igual y además el subtítulo no choca con la pastilla al crecer.
 *
 * El `p-px` del nodo no se reproduce: es el borde que Figma dibuja hacia adentro.
 *
 * El aviso y el pie son OPCIONALES porque el diseño los usa condicionalmente: el
 * recuadro de diferencia de peso sólo aparece en el folio que la tiene, y el pie
 * sólo cuando hay una acción que ofrecer. Sin ellos la tarjeta no deja franjas
 * vacías ni líneas huérfanas.
 *
 * Sale como `<section>` con el título en `<h3>` —debajo del `<h1>` del header y del
 * `<h2>` del cuerpo de la vista— para que el panel sea una región navegable y no
 * cuatro `div` sueltos.
 */

interface WasteFolioDetailPanelProps {
  /**
   * Recuadro de alerta arriba de la cabecera — `WasteWeightDifferenceNotice` en el
   * nodo. Sin esto la cabecera arranca pegada al borde de la tarjeta.
   */
  notice?: ReactNode;
  /** Tipo de residuo del folio: "Baterías de plomo-ácido". */
  title: string;
  /** Folio, residuo y transportista: "Folio SIDREP 2026-SD-04812 · …". */
  subtitle: string;
  /** Pastilla de estado, ya construida —`WastePill`— para no fijar acá su tono. */
  status: ReactNode;
  /** Bloques del cuerpo. La tarjeta los separa con el `gap-[16px]` del nodo. */
  children: ReactNode;
  /** Acción de la franja inferior — "Ver respaldo completo" en el nodo. */
  footer?: ReactNode;
}

export function WasteFolioDetailPanel({
  notice,
  title,
  subtitle,
  status,
  children,
  footer,
}: WasteFolioDetailPanelProps) {
  return (
    <section
      className="flex w-full flex-col items-start rounded-[10px] border border-solid border-[#e3e3e3] bg-white"
      data-name="Container"
    >
      {notice ? (
        <div className="w-full px-[20px] pt-[14px]" data-name="Container:margin">
          {notice}
        </div>
      ) : null}

      <div
        className="flex w-full flex-col items-start border-b border-solid border-[#e3e3e3] px-[20px] pb-[19px] pt-[18px]"
        data-name="Container"
      >
        <div className="flex w-full items-start justify-between gap-[12px] pb-[3px]">
          <h3 className="min-w-px font-['Inter:Bold',sans-serif] text-[14.5px] font-bold not-italic leading-[normal] text-[#131313]">
            {title}
          </h3>
          {/*
            `flex` y no un `div` suelto: la pastilla es un `inline-flex`, y en una
            caja en flujo normal la caja de línea suma el `line-height` de 24px que
            hereda del `body`, con lo que la fila del título medía 25px en vez de
            los 21 del nodo. Con el contenedor en flex no hay caja de línea que
            sumar y la pastilla aporta sólo su propia altura.
          */}
          <div className="flex shrink-0">{status}</div>
        </div>
        <p className="w-full pt-[5px] font-['Inter:Regular',sans-serif] text-[11.5px] font-normal not-italic leading-[normal] text-[#646464]">
          {subtitle}
        </p>
      </div>

      <div
        className="flex w-full flex-col items-start gap-[16px] px-[20px] py-[18px]"
        data-name="Container"
      >
        {children}
      </div>

      {footer ? (
        <div
          className="flex w-full items-start border-t border-solid border-[#e3e3e3] px-[20px] pb-[14px] pt-[15px]"
          data-name="Container"
        >
          {footer}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Línea que separa dos bloques DENTRO del cuerpo del panel — nodo `3083:11005`,
 * entre la grilla de datos y "Documentos de cierre".
 *
 * Va acá y no como una clase repetida en cada consumidor porque es parte del
 * armazón del panel: el nodo la declara como un contenedor de 1px con `border-t`
 * #e3e3e3 a ancho completo, y el `gap-[16px]` del cuerpo la separa de sus vecinos.
 *
 * No es el `Separator` de shadcn: el módulo dibuja sus líneas con el hex del token
 * porque `src/styles/index.css` no está importado y sus variables no resuelven.
 */
export function WasteFolioDetailDivider() {
  return (
    <div
      aria-hidden
      className="h-px w-full border-t border-solid border-[#e3e3e3]"
      data-name="Container"
    />
  );
}
