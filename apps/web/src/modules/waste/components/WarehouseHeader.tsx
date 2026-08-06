/**
 * Header de las vistas de bodega del módulo de residuos.
 *
 * Traducción del nodo Figma `3686:24645` (data-name="Header") del archivo
 * Medio-Ambiente-Core. "Ingresos a bodega" repite el nodo con la misma geometría
 * y el mismo título (`3729:27736` / `3729:27738`), así que ambas vistas comparten
 * este componente en lugar de duplicarlo.
 *
 * Valores tomados del design context, no de la imagen:
 *
 *   contenedor  h-[56px] · bg white · border-b #e3e3e3 · flex items-center
 *               px-[22px] · pb-px · w-full
 *   título      Inter Semi Bold · 15px · #131313 · leading-[normal]
 *               not-italic · whitespace-nowrap
 *
 * Dos desvíos deliberados respecto del design context:
 *
 * 1. El nodo padre (`3686:24644`) trae `w-[1060px]`. Se reemplaza por `w-full`
 *    porque el brief prohíbe anchos fijos para layout; el posicionamiento lo
 *    aporta `DashboardFrameShell`, que ya resuelve `left-[220px] right-0`.
 * 2. El texto viene como `<p>`, pero el nodo se llama "Heading 1" y es el
 *    título de la página: se emite como `<h1>` por accesibilidad, con estilos
 *    idénticos.
 *
 * Los colores van en hex —los mismos que Figma entrega como fallback de sus
 * variables— porque `src/styles/index.css` no está importado en la app y sus
 * tokens no resuelven. Es la convención vigente en `SprPage` y `AppSidebar`.
 */

/** Texto del nodo `3686:24647`. Se usa como default hasta que la vista consuma la bodega real desde la API. */
export const DEFAULT_WAREHOUSE_TITLE = 'Bodega de acopio - Plataforma 18';

interface WarehouseHeaderProps {
  title?: string;
}

export function WarehouseHeader({ title = DEFAULT_WAREHOUSE_TITLE }: WarehouseHeaderProps) {
  return (
    <div
      className="flex h-[56px] w-full shrink-0 items-center border-b border-solid border-[#e3e3e3] bg-white px-[22px] pb-px"
      data-name="Header"
    >
      <div className="shrink-0" data-name="Heading 1">
        <div className="flex flex-col items-start">
          <h1 className="font-['Inter:Semi_Bold',sans-serif] text-[15px] font-semibold not-italic leading-[normal] whitespace-nowrap text-[#131313]">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}
