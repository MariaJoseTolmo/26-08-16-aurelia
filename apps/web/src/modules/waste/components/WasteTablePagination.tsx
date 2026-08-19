import { WarehouseCaretDownIcon } from '../icons/WarehouseControlIcons';
import { WarehousePageNextIcon, WarehousePagePrevIcon } from '../icons/WarehouseIntakeIcons';

/**
 * Pie de paginación de las tablas del módulo de residuos — nodos `3734:28523`
 * ("Ingresos a bodega") y `3817:55609` ("Solicitud de retiro"), que son el mismo
 * componente: se comparó el design context de los dos y no difieren en nada.
 *
 *   pie      bg white · border-t #e3e3e3 · h-[53px]
 *            flex items-center justify-between · px-[16px] pt-[11px] pb-[10px]
 *   conteo   Inter Regular 12px #646464
 *   navegar  botones 32 × 32 · rounded-[6px] · border #e3e3e3 · iconos 12.5 × 10
 *   página   bg #c8a064 · border #c8a064 · Inter Semi Bold 12px #001e39
 *   filas    "Filas por página" + dropdown 51 × 32 · border #d1d1d1
 *
 * Los botones de navegación del nodo vienen con `opacity-35` porque en el diseño
 * hay una sola página. Acá esa opacidad se ata al estado `disabled`, que es lo
 * que la produce.
 */
interface WasteTablePaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  /** Filas del conjunto COMPLETO, no de esta página. */
  totalRows: number;
  onPageChange?: (page: number) => void;
}

export function WasteTablePagination({
  page,
  totalPages,
  pageSize,
  totalRows,
  onPageChange,
}: WasteTablePaginationProps) {
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  /*
   * El último es el fin de la PÁGINA acotado por el total, no `first + totalRows`:
   * con 11 filas y 10 por página el nodo `3817:55609` dice "Mostrando 1–10 de 11
   * datos", y sumar el total daba "1–11 de 11".
   */
  const lastRow = totalRows === 0 ? 0 : Math.min(firstRow + pageSize - 1, totalRows);
  const navButtonClass =
    'flex size-[32px] min-w-[32px] shrink-0 items-center justify-center rounded-[6px] border border-solid border-[#e3e3e3] bg-white px-[9px] py-px transition-opacity disabled:opacity-35';

  return (
    <div className="flex h-[53px] w-full items-center justify-between border-t border-solid border-[#e3e3e3] bg-white px-[16px] pb-[10px] pt-[11px]">
      <p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]">
        {/* Guion largo (–) como en los nodos `3734:28525` y `3817:55611`, no guion corto. */}
        Mostrando {firstRow}–{lastRow} de {totalRows} datos
      </p>
      <div className="flex items-center gap-[4px]">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className={navButtonClass}
        >
          <WarehousePagePrevIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#646464]" />
        </button>
        <button
          type="button"
          aria-current="page"
          className="flex size-[32px] min-w-[32px] shrink-0 items-center justify-center rounded-[6px] border border-solid border-[#c8a064] bg-[#c8a064] px-[9px] py-px text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#001e39]"
        >
          {page}
        </button>
        <button
          type="button"
          aria-label="Página siguiente"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          className={navButtonClass}
        >
          <WarehousePageNextIcon className="block h-[10px] w-[12.5px] shrink-0 text-[#646464]" />
        </button>
      </div>
      <div className="flex items-center gap-[8px]">
        <p className="whitespace-nowrap font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[normal] text-[#646464]">
          Filas por página
        </p>
        {/*
          Selector presentacional, como en el nodo. El caret va posicionado
          —left-[31.75px] top-[11.5px] en `3734:28540` y `3817:55626`— porque vive
          fuera de la caja del dropdown, que reserva su lugar con pr-[25px].
        */}
        <div className="relative shrink-0">
          <div className="flex h-[32px] w-[51px] items-center rounded-[6px] border border-solid border-[#d1d1d1] bg-white py-px pl-[11px] pr-[25px]">
            <span className="whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#646464]">
              {pageSize}
            </span>
          </div>
          {/* Mismo caret que el botón "Exportar" (`3817:58614`), en la caja de 11.25 × 9 del nodo `3734:28540`. */}
          <WarehouseCaretDownIcon className="absolute left-[31.75px] top-[11.5px] block h-[9px] w-[11.25px] text-[#131313]" />
        </div>
      </div>
    </div>
  );
}
