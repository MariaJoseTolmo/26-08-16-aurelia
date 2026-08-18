import { formatQuantity } from '../wasteFilterPrimitives';
import {
  formatIsoAsDdMmYy,
  type WasteWithdrawalFilterKey,
  type WasteWithdrawalFilterOptions,
  type WasteWithdrawalFilters,
  type WasteWithdrawalSelectFilterKey,
} from '../wasteWithdrawalFilters';
import {
  WASTE_WITHDRAWAL_CORRECTION_ACTION_LABEL,
  WASTE_WITHDRAWAL_FOLIO_PENDING_LABEL,
  WASTE_WITHDRAWAL_FOLIO_REJECTED_LABEL,
  type WasteWithdrawalRow,
} from '../wasteWithdrawalRows';
import { WarehouseMonthFilterField } from './WarehouseMonthFilterField';
import { WarehouseSelectFilterField } from './WarehouseSelectFilterField';
import { WarehouseTextFilterField } from './WarehouseTextFilterField';
import {
  WasteDataTable,
  WASTE_TABLE_CELL_CLASS,
  WASTE_TABLE_CELL_COLOR,
  WASTE_TABLE_FIRST_CELL_COLOR,
} from './WasteDataTable';
import { WasteTablePagination } from './WasteTablePagination';
import { WasteWithdrawalPill, WasteWithdrawalStatusBadge } from './WasteWithdrawalStatusBadge';

/**
 * Tabla de "Solicitud de retiro" — nodo Figma `3817:55311` (columnas en
 * `3817:55312`, pie de paginación en `3817:55609`).
 *
 * El armazón —contenedor, encabezado oscuro, fila de filtros, celda y estado
 * vacío— es `WasteDataTable`, compartido con las otras tres tablas del módulo;
 * ahí está anotada la geometría y por qué se transpone a filas. Acá queda lo
 * propio de esta tabla: sus nueve columnas, su control de filtro y su fila.
 *
 *   anchos  121.5 · 180.5 · 180.5 · 162.5 · 158 · 161 · 174 · 122 · 100.5 px, total 1360.5
 *   filtros control bg white · border #d1d1d1 · rounded-[8px] · px-[8px] py-[5px]
 *           texto Inter Regular 13px #131313 · placeholder #acacac
 *   pie     `WasteTablePagination`, compartido con "Ingresos a bodega"
 *
 * LA NOVENA COLUMNA ES "ACCIONES" y llegó con el nodo `4278:18063`, el de la solicitud
 * rechazada: antes eran ocho y sumaban 1240. Los anchos de arriba son los de ese nodo.
 *
 * Las 9 columnas suman 1360.5px contra los 1016px del contenedor, así que en Figma
 * la tabla se recorta con `overflow-clip`. Acá el desplazamiento horizontal lo
 * toma la propia tabla (`overflow="self"`), igual que en "Ingresos a bodega": el
 * desborde es de ~345px y arrastrar toda la página dejaría la intro y la barra de
 * acciones fuera de cuadro. El pie queda fuera del área que scrollea, como en el
 * nodo, donde es hermano de las columnas y no hijo.
 *
 * UN DESVÍO PROPIO:
 *
 * - El placeholder del filtro de folio viene con DOS espacios en el nodo
 *    (`3817:55540`: "Busca por  Nº de folio", con `whitespace-pre`). Se emite con
 *    uno solo: es un typo del archivo, y HTML colapsaría el segundo igual.
 *
 * DOS COLUMNAS CON CELDA PROPIA, que es lo que distingue esta tabla:
 *
 * - "FOLIO SIDREP" tiene dos estilos de celda según el dato. Con folio va Inter
 *   Regular 12px #131313 (`3817:55550`); sin folio, "No aplica" en Inter Regular
 *   11.5px #646464 (`3817:55544`). El nodo centra ambas.
 * - "ESTADO" dibuja `WasteWithdrawalStatusBadge`, que NO es la pastilla de
 *   peligrosidad con otros colores. Ver la nota de ese archivo.
 *
 * El nodo `3765:40905` agrega el estado `pending`, que toca las DOS columnas: el
 * estado muestra "Pendiente" y el folio pasa a la pastilla "A espera de aprobación"
 * en vez de "No aplica".
 *
 * Y EL NODO `4278:18063` AGREGA LA SOLICITUD RECHAZADA, que toca las TRES: el folio pasa a
 * la pastilla roja "Rechazado", el estado SIGUE en "Pendiente" —volvió con observaciones,
 * pero sigue esperando aprobación— y la columna de acciones estrena su link "Corregir". Es
 * también el nodo que reescribió "Informativo" como "Retiro registrado"; ver
 * `WASTE_WITHDRAWAL_STATUS_LABELS`.
 */

interface WasteWithdrawalColumnBase {
  /**
   * `'actions'` no es un campo de la fila: es la columna del nodo `4278:18525`, que no
   * muestra un dato sino el link "Corregir". Se nombra en la unión en vez de relajar el
   * tipo a `string` para que las otras ocho sigan atadas al modelo.
   */
  key: keyof WasteWithdrawalRow | 'actions';
  label: string;
  /** Porcentaje del ancho total, derivado de los anchos del nodo. */
  width: string;
  /** Folio y estado centran su contenido; el resto alinea a la izquierda. */
  centered?: boolean;
}

/**
 * Unión discriminada por `filter`, no un objeto con todo opcional: así el tipo
 * garantiza que una columna con selector SIEMPRE trae su `filterKey` y su
 * etiqueta de valor vacío, y el render no necesita castear ni chequear en
 * runtime. Es el mismo patrón de `WarehouseIntakeTable`.
 */
type WasteWithdrawalColumn = WasteWithdrawalColumnBase &
  (
    | { filter: 'month'; filterKey: 'period' }
    | { filter: 'select'; filterKey: WasteWithdrawalSelectFilterKey; filterLabel: string }
    | { filter: 'number'; filterKey: 'quantity'; filterLabel: string }
    | { filter: 'text'; filterKey: 'sidrepFolio'; filterLabel: string }
    | { filter: 'none' }
  );

/*
 * ANCHOS RECALCULADOS SOBRE EL NODO `4278:18063`, que agrega la novena columna: sus
 * columnas miden 121.5 · 180.5 · 180.5 · 162.5 · 158 · 161 · 174 · 122 · 100.5 y suman
 * 1360.5. Los porcentajes son esos anchos sobre ese total —no los de ocho columnas con uno
 * más encajado—, así que la proporción entre las ocho viejas también cambió.
 */
const COLUMNS: WasteWithdrawalColumn[] = [
  // El período no lleva `filterLabel`: su control es el selector de meses, que
  // muestra "May 2026" y resuelve su propio texto vacío.
  { key: 'withdrawalDate', label: 'Periodo', width: '8.9305%', filter: 'month', filterKey: 'period' },
  { key: 'category', label: 'Categoría operativa', width: '13.2672%', filter: 'select', filterKey: 'category', filterLabel: 'Todas' },
  { key: 'wasteType', label: 'Residuo específico', width: '13.2672%', filter: 'select', filterKey: 'wasteType', filterLabel: 'Todos' },
  { key: 'quantity', label: 'Cantidad retirada', width: '11.9441%', filter: 'number', filterKey: 'quantity', filterLabel: '#' },
  { key: 'unit', label: 'Unidad de medida', width: '11.6134%', filter: 'select', filterKey: 'unit', filterLabel: 'Todas' },
  { key: 'recipient', label: 'Destinatario', width: '11.8339%', filter: 'select', filterKey: 'recipient', filterLabel: 'Todos' },
  { key: 'sidrepFolio', label: 'Folio SIDREP', width: '12.7894%', filter: 'text', filterKey: 'sidrepFolio', filterLabel: 'Busca por Nº de folio', centered: true },
  { key: 'status', label: 'Estado', width: '8.9673%', filter: 'select', filterKey: 'status', filterLabel: 'Todos', centered: true },
  /*
   * ACCIONES no se filtra: el nodo dibuja su encabezado como los demás —con el icono de
   * ordenar del template— pero deja la celda de filtros VACÍA, porque no hay nada que
   * buscar en una columna que no tiene dato. Es la misma `filter: 'none'` que la columna
   * "Respaldo" del histórico.
   */
  { key: 'actions', label: 'Acciones', width: '7.3870%', filter: 'none', centered: true },
];

/**
 * La primera columna del nodo pinta su texto en #333 (`3817:55330`) y las demás
 * en #131313 (`--gray/900_txt`). Se respeta la diferencia tal como viene del
 * diseño, igual que en "Ingresos a bodega".
 */
const CELL_CLASS = WASTE_TABLE_CELL_CLASS;
const FIRST_CELL_COLOR = WASTE_TABLE_FIRST_CELL_COLOR;
const CELL_COLOR = WASTE_TABLE_CELL_COLOR;

interface WasteWithdrawalTableProps {
  /** Filas ya filtradas: la tabla no filtra, solo dibuja lo que recibe. */
  rows: WasteWithdrawalRow[];
  /**
   * Filtros aplicados. Es el MISMO estado que muestran las pastillas de "Filtros
   * activos": los controles de columna y las pastillas son dos vistas del mismo
   * dato, no dos juegos de filtros.
   */
  filters: WasteWithdrawalFilters;
  options: WasteWithdrawalFilterOptions;
  onFilterChange: (key: WasteWithdrawalFilterKey, value: string | null) => void;
  /** Lectura única de "hoy" de la vista, para los años que ofrece el selector de meses. */
  today: Date;
  page?: number;
  totalPages?: number;
  pageSize?: number;
  /**
   * Filas del conjunto COMPLETO, no de esta página. El pie las necesita para decir
   * "Mostrando 1–10 de 11 datos"; `rows` ya viene recortada a la página.
   */
  totalRows?: number;
  onPageChange?: (page: number) => void;
  /**
   * Qué hace "Corregir" en la fila rechazada — nodo `4278:18538`.
   *
   * OPCIONAL PORQUE EL DESTINO ES DE LA VISTA, no de la tabla: depende del borrador que
   * haya en curso, y la tabla no lo conoce. Sin él el control se dibuja deshabilitado.
   */
  onCorrect?: (row: WasteWithdrawalRow) => void;
}

export function WasteWithdrawalTable({
  rows,
  filters,
  options,
  onFilterChange,
  today,
  page = 1,
  totalPages = 1,
  pageSize = 10,
  totalRows,
  onPageChange,
  onCorrect,
}: WasteWithdrawalTableProps) {
  return (
    <WasteDataTable
      caption="Histórico de retiros de residuos"
      columns={COLUMNS}
      minWidth={1360}
      rows={rows}
      getRowKey={(row) => row.id}
      renderRow={(row) => <WasteWithdrawalTableCells row={row} onCorrect={onCorrect} />}
      renderFilter={(column) => (
        <WasteWithdrawalFilterControl
          column={column}
          filters={filters}
          options={options}
          onFilterChange={onFilterChange}
          today={today}
        />
      )}
      emptyMessage="No hay retiros para los filtros aplicados"
      footer={
        <WasteTablePagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalRows={totalRows ?? rows.length}
          onPageChange={onPageChange}
        />
      }
    />
  );
}

function WasteWithdrawalFilterControl({
  column,
  filters,
  options,
  onFilterChange,
  today,
}: {
  column: WasteWithdrawalColumn;
  filters: WasteWithdrawalFilters;
  options: WasteWithdrawalFilterOptions;
  onFilterChange: (key: WasteWithdrawalFilterKey, value: string | null) => void;
  today: Date;
}) {
  /* La columna de acciones no tiene control: su celda de filtros va vacía en el nodo. */
  if (column.filter === 'none') return null;

  if (column.filter === 'month') {
    return (
      <WarehouseMonthFilterField
        className="w-full"
        label={column.label}
        value={filters.period}
        today={today}
        onChange={(value) => onFilterChange('period', value)}
      />
    );
  }

  if (column.filter === 'select') {
    return (
      <WarehouseSelectFilterField
        label={column.label}
        emptyOptionLabel={column.filterLabel}
        options={options[column.filterKey]}
        value={filters[column.filterKey]}
        onChange={(value) => onFilterChange(column.filterKey, value)}
      />
    );
  }

  return (
    <WarehouseTextFilterField
      kind={column.filter === 'number' ? 'number' : 'search'}
      label={column.label}
      placeholder={column.filterLabel}
      value={filters[column.filterKey]}
      onChange={(value) => onFilterChange(column.filterKey, value)}
    />
  );
}

/** Celdas de la fila; el `<tr>` de 46px lo aporta `WasteDataTable`. */
function WasteWithdrawalTableCells({
  row,
  onCorrect,
}: {
  row: WasteWithdrawalRow;
  onCorrect?: (row: WasteWithdrawalRow) => void;
}) {
  return (
    <>
      <td className={`${CELL_CLASS} ${FIRST_CELL_COLOR}`}>{formatIsoAsDdMmYy(row.withdrawalDate)}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.category}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.wasteType}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{formatQuantity(row.quantity)}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.unit}</td>
      <td className={`${CELL_CLASS} ${CELL_COLOR}`}>{row.recipient}</td>
      {/*
        Los dos estados de la celda de folio salen de los nodos `3817:55550` y
        `3817:55544`, que NO comparten tipografía: el folio va en 12px #131313 y
        el "No aplica" en 11.5px #646464.
      */}
      <td className={`${CELL_CLASS} ${CELL_COLOR} text-center`}>
        {/*
          TRES estados, no dos. Con folio se muestra el folio; en `pending` va la
          pastilla ámbar del nodo `3817:55964`, porque todavía no hay folio pero
          tampoco es que no aplique; y recién si no es ninguno de los dos aparece
          el "No aplica" de `3817:55544`.
        */}
        {row.sidrepFolio ? (
          row.sidrepFolio
        ) : row.rejected ? (
          /*
           * LA RECHAZADA SE PREGUNTA ANTES QUE LA PENDIENTE, y el orden no es un detalle:
           * en el nodo `4278:18063` la fila rechazada TAMBIÉN está en `pending` —su columna
           * ESTADO dice "Pendiente"—, así que con el orden invertido nunca se dibujaría la
           * pastilla roja.
           */
          <WasteWithdrawalPill tone="red">{WASTE_WITHDRAWAL_FOLIO_REJECTED_LABEL}</WasteWithdrawalPill>
        ) : row.status === 'pending' ? (
          <WasteWithdrawalPill tone="amber">{WASTE_WITHDRAWAL_FOLIO_PENDING_LABEL}</WasteWithdrawalPill>
        ) : (
          <span className="text-[11.5px] text-[#646464]">No aplica</span>
        )}
      </td>
      <td className={`${CELL_CLASS} ${CELL_COLOR} text-center`}>
        <WasteWithdrawalStatusBadge status={row.status} />
      </td>
      {/*
        Columna ACCIONES `4278:18525`. Sólo la fila rechazada trae control; las demás
        quedan vacías, igual que la columna "Respaldo" del histórico.

        ES UN `<button>` Y NO UN `<a>`: el nodo lo dibuja como texto subrayado, pero lo que
        hace es NAVEGAR DENTRO de la aplicación, y el destino lo decide la vista según el
        borrador que haya. Un `<a href="#">` habría sido un link que no lleva a ninguna
        parte —lo que sí es el "Respaldo" del histórico, que apunta a un documento que
        todavía no existe—.
      */}
      <td className={`${CELL_CLASS} ${CELL_COLOR} text-center`}>
        {row.rejected ? (
          <button
            type="button"
            onClick={() => onCorrect?.(row)}
            /*
             * Deshabilitado cuando la vista no pasó a dónde ir: un control que dice
             * "Corregir" y no corrige engaña más que uno apagado. Es el mismo criterio del
             * botón "Exportar" de esta pantalla.
             */
            disabled={onCorrect === undefined}
            className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold not-italic leading-[normal] text-[#8e6e3e] underline decoration-solid underline-offset-2 hover:text-[#6f5530] disabled:cursor-not-allowed disabled:text-[#acacac] disabled:no-underline"
          >
            {WASTE_WITHDRAWAL_CORRECTION_ACTION_LABEL}
          </button>
        ) : null}
      </td>
    </>
  );
}
