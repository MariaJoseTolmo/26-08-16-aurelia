import { useMemo, useState } from 'react';
import {
  useWasteSinaderExport,
  useWasteSinaderPeriod,
  useWasteSinaderPeriods,
} from '../../shared/hooks/useWasteSinaderReport';
import type {
  WasteSinaderPeriodDetailResponse,
  WasteSinaderPeriodResponse,
} from '../../shared/services/waste-sinader.service';
import type { WasteExportFormat } from '../../shared/services/waste-warehouse-export.service';
import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import {
  WarehouseExportButton,
  type WarehouseExportOption,
} from './components/WarehouseExportButton';
import { WarehouseHeader } from './components/WarehouseHeader';
import { WarehouseMonthFilterField } from './components/WarehouseMonthFilterField';
import { WasteKpiRow, type WasteKpi } from './components/WasteKpiCard';
import { WasteNoticeBanner } from './components/WasteNoticeBanner';
import { WastePill } from './components/WastePill';
import { WastePrimaryActionButton } from './components/WastePrimaryActionButton';
import {
  WASTE_SUMMARY_CELL_CLASS,
  WASTE_SUMMARY_CELL_CLASS_STRONG,
  WASTE_SUMMARY_TOTAL_CELL_CLASS,
  WasteSummaryTable,
  type WasteSummaryTableColumn,
} from './components/WasteSummaryTable';
import {
  WasteSinaderDeclareModal,
  type WasteSinaderDeclareSubmit,
} from './components/WasteSinaderDeclareModal';
import { WasteViewFooterBar } from './components/WasteViewFooterBar';
import { WasteViewIntro } from './components/WasteViewIntro';
import { WastePerformanceNormalIcon } from './icons/WasteCompanyPerformanceIcons';
import {
  WasteSinaderMarkDeclaredIcon,
  WasteSinaderNoticeInfoIcon,
} from './icons/WasteSinaderReportIcons';
import { formatIsoMonthLabel, parseIsoMonth, toIsoMonth } from './wasteMonthFilter';
import {
  WASTE_SINADER_DECLARED_DESCRIPTION,
  WASTE_SINADER_OVERDUE_TITLE,
  buildWasteSinaderDeclaredFooterNote,
  buildWasteSinaderDeclaredNotice,
  buildWasteSinaderExportRequest,
  buildWasteSinaderKpis,
  buildWasteSinaderOverdueNotice,
  buildWasteSinaderRows,
  formatWasteQuantity,
  formatWasteSinaderMonthName,
  formatWasteSinaderNextMonthName,
  formatWasteSinaderUpdatedAt,
  isWasteSinaderPeriodOpen,
  isWasteSinaderPeriodOverdue,
  resolveWasteSinaderDeclareState,
  type WasteSinaderDeclareState,
  type WasteSinaderRow,
} from './wasteSinaderReport';

/**
 * "Reporte SINADER" — nodo Figma `3830:65385` del archivo Medio-Ambiente-Core.
 * Se llega desde el rol `WASTE_ENV_APPROVER`, ítem "Reporte SINADER" del sidebar
 * (`3830:65484`, que en el nodo es el ítem ACTIVO).
 *
 * Los cuatro bloques del cuerpo (`3830:65601`) están integrados, con los
 * `gap-[16px]` del nodo:
 *
 *   `3830:65602`  intro + selector de período
 *   `3830:65735`  banner "el período sigue en curso"
 *   `3830:65741`  KPIs (4 tarjetas)
 *   `3830:65642`  tabla del consolidado
 *
 * Más la barra `3830:65721`, que va FUERA del área desplazable: es la barra de
 * acciones de la pantalla, no el final del contenido.
 *
 * Repite el patrón de composición del resto del módulo: el shell de la app no
 * incluye sidebar (`app/App.tsx` es sólo un `<Outlet/>`), así que la página monta
 * `AppSidebar` y `DashboardFrameShell` por su cuenta.
 *
 * A DIFERENCIA DE "Histórico de retiros", ACÁ NO HAY MAQUETA: los dos endpoints ya
 * existen (`GET /waste/sinader/periods` y `/waste/sinader/periods/:id`), así que
 * los datos salen de TanStack Query y los cuatro estados de UI son reales.
 *
 * El estado —qué mes se está mirando— y las dos queries viven en UN contenedor
 * (`WasteSinaderReportContent`) y bajan por props al cuerpo y al pie. El pie
 * necesita el mismo período que el cuerpo (la hora de última actualización y si se
 * puede declarar salen de ahí), y montarlas dos veces sería pedir dos veces lo
 * mismo.
 */

/** Texto del nodo `3830:65599`, el `<h1>` del header. */
export const WASTE_SINADER_TITLE = 'Reporte SINADER';

/** Texto del nodo `3830:65607`. */
export const WASTE_SINADER_DESCRIPTION =
  'El período aún está en curso — este total se sigue actualizando en vivo con cada nuevo movimiento no peligroso registrado. No es definitivo hasta que termine el mes.';

/**
 * Descripción de un período ya cerrado.
 *
 * El nodo sólo dibuja la de arriba, que habla en presente de un mes en curso. Con
 * el selector apuntando a un mes cerrado esa frase sería falsa, así que el párrafo
 * cambia. PENDIENTE DE CONFIRMAR la copy con negocio.
 */
const WASTE_SINADER_CLOSED_DESCRIPTION =
  'El período está cerrado — este consolidado ya no cambia y es el que corresponde declarar en SINADER.';

/**
 * Texto del banner `3830:65735`, con el mes que se está mirando y el mes en que se
 * habilita la declaración.
 *
 * El nodo dice "aparecerá recién el 1° de agosto" porque está dibujado sobre
 * julio. La fecha se DERIVA en vez de escribirse: es el 1° del mes siguiente al
 * del período, que es exactamente la condición que evalúa
 * `hasWasteSinaderPeriodEnded`. Así la promesa del banner y el estado del botón no
 * pueden decir cosas distintas.
 */
function buildNotice(monthName: string, nextMonthName: string): string {
  return `${monthName} aún no termina — este consolidado se sigue sumando en tiempo real. El botón para marcar como declarado se habilita el 1° de ${nextMonthName.toLowerCase()}, cuando el período quede cerrado y el total sea definitivo.`;
}

/**
 * Los dos formatos del menú `4304:31205`, en su orden.
 *
 * Es la única exportación del módulo que ofrece los dos: el PDF se archiva como
 * respaldo de lo declarado y el Excel se filtra y se suma antes de cargar la
 * declaración en SINADER. Los rótulos los pone `WarehouseExportButton` desde el
 * nodo.
 */
const EXPORT_OPTIONS: WarehouseExportOption[] = [{ format: 'xlsx' }, { format: 'pdf' }];

/** El detalle del fallo vive en la consola; acá va lo accionable. */
const EXPORT_ERROR_MESSAGE = 'No se pudo generar el archivo. Vuelve a intentarlo.';

/**
 * Columnas del nodo `3830:65642`, con sus anchos como porcentaje de los 1044px del
 * cuerpo: 437, 86, 157, 242 y 122.
 */
const COLUMNS: WasteSummaryTableColumn[] = [
  { key: 'waste', label: 'Residuo (código SINADER)', width: '41.858%' },
  { key: 'quantity', label: 'Cantidad', width: '8.238%' },
  { key: 'treatment', label: 'Tipo de tratamiento', width: '15.038%' },
  { key: 'destination', label: 'Destino', width: '23.180%' },
  { key: 'transport', label: 'Transportista', width: '11.686%' },
];

/** Suma de los anchos del nodo. Es un MÍNIMO, no un ancho fijo. */
const TABLE_MIN_WIDTH = 1044;

/** Rótulos de las cuatro tarjetas, para que el estado de carga las dibuje en su sitio. */
const KPI_LABELS = [
  'Estado del período',
  'Total a declarar',
  'Categorías con movimiento',
  'Movimientos incluidos',
] as const;

/**
 * Todo lo derivado —rótulos, KPIs y filas— se calcula UNA vez en el contenedor y
 * baja por props. El cuerpo lo dibuja y el pie lo exporta: si cada uno lo
 * recalculara, el archivo podría decir algo distinto de lo que está en pantalla,
 * que es exactamente lo que este flujo no puede permitirse.
 */
interface WasteSinaderView {
  isOpen: boolean;
  /** Período ya declarado: la vista pasa a ser un respaldo de solo lectura. */
  isDeclared: boolean;
  /** Plazo vencido: se puede declarar igual, pero la vista lo reclama. */
  isOverdue: boolean;
  /** Por qué se puede o no declarar. `undefined` mientras no haya período. */
  declareState?: WasteSinaderDeclareState;
  /** Frase del banner verde, en tres partes para poder destacar el folio. */
  declaredNotice?: { before: string; folio: string | null; after: string };
  monthLabel: string;
  heading: string;
  description: string;
  /** Texto del banner. `undefined` con el período cerrado. */
  notice?: string;
  totalLabel: string;
  /** `undefined` mientras no haya detalle del que sacar la hora. */
  updatedAtLabel?: string;
  kpis: WasteKpi[];
  rows: WasteSinaderRow[];
}

interface WasteSinaderReportBodyProps {
  today: Date;
  isoMonth: string;
  onIsoMonthChange: (isoMonth: string) => void;
  period: WasteSinaderPeriodResponse | undefined;
  view: WasteSinaderView;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function WasteSinaderReportBody({
  today,
  isoMonth,
  onIsoMonthChange,
  period,
  view,
  isLoading,
  isError,
  onRetry,
}: WasteSinaderReportBodyProps) {
  const { monthLabel, kpis, rows } = view;

  return (
    /*
     * Cuerpo del nodo `3830:65601`: `px-[28px] pt-[20px] pb-[40px]` sobre
     * `--gray/100_surf` (#f7f7f7), que es el fondo que declara `3830:65600` —esta
     * vista NO va sobre blanco, a diferencia del histórico—. El `min-w-[1100px]` es
     * un MÍNIMO, no un ancho fijo: el cuerpo sigue creciendo con el viewport, y lo
     * necesita para que todos los bloques compartan ancho al desbordar.
     */
    <div className="flex w-full min-w-[1100px] flex-col items-start gap-[16px] bg-[#f7f7f7] px-[28px] pb-[40px] pt-[20px]">
      <WasteViewIntro
        heading={view.heading}
        description={view.description}
        action={
          /*
           * Nodo `3830:65608`. Los 175px son el ancho del CONTROL, no del layout:
           * el brief prohíbe anchos fijos para la maqueta principal, no para un
           * campo, y es el mismo criterio con el que el histórico fija el ancho de
           * las tarjetas de empresa.
           *
           * Volver a elegir el mes aplicado devuelve `null` —así funciona el
           * selector en las tablas, donde eso limpia el filtro—. Acá no hay
           * "ningún período", así que se cae al mes en curso.
           */
          <WarehouseMonthFilterField
            value={isoMonth}
            onChange={(value) => onIsoMonthChange(value ?? toIsoMonth(today))}
            today={today}
            label="Período del reporte"
            markCurrentMonth
            align="right"
            className="w-[175px]"
          />
        }
      />

      {/*
        Banner `3830:65735`. Sólo con el período abierto: es lo que explica. La
        frase nombra el mes que se está mirando, no siempre julio.
      */}
      {view.notice ? (
        <WasteNoticeBanner
          icon={
            <WasteSinaderNoticeInfoIcon className="block h-[11.5px] w-[13.508px] shrink-0 text-[#24588b]" />
          }
        >
          {view.notice}
        </WasteNoticeBanner>
      ) : null}

      {/*
        Recuadro de plazo vencido `4304:31891`. Ocupa el MISMO lugar que el banner
        azul —x=28, y=103 en `4304:31540`— porque los dos explican en qué punto del
        ciclo está el período, y nunca son ciertos a la vez: o el mes sigue
        corriendo, o ya se pasó el plazo para declararlo.

        El "⚠" va como carácter y no como icono, igual que en el correo: así lo
        dibuja el nodo (`4304:31893` es un texto de 15px).
      */}
      {view.isOverdue ? (
        <WasteNoticeBanner
          tone="danger"
          title={WASTE_SINADER_OVERDUE_TITLE}
          icon={
            <span className="block w-[16px] font-['Inter:Regular',sans-serif] text-[15px] leading-[23.25px] text-[#570b1d]">
              ⚠
            </span>
          }
        >
          {buildWasteSinaderOverdueNotice()}
        </WasteNoticeBanner>
      ) : null}

      {/*
        Banner del período declarado `3830:66117`. El tilde en círculo es el mismo
        glifo que la pastilla "Normal" de desempeño por empresa —verificado por
        firma normalizada por escala—, así que se reutiliza su componente.
      */}
      {view.declaredNotice ? (
        <WasteNoticeBanner
          tone="success"
          icon={
            <WastePerformanceNormalIcon className="block h-[11.5px] w-[14.375px] shrink-0 text-[#2a5c16]" />
          }
        >
          {view.declaredNotice.before}
          {view.declaredNotice.folio ? (
            <span className="font-['Inter:Bold',sans-serif] font-bold">
              {view.declaredNotice.folio}
            </span>
          ) : null}
          {view.declaredNotice.after}
        </WasteNoticeBanner>
      ) : null}

      {isLoading ? <WasteSinaderLoadingState /> : null}

      {!isLoading && isError ? <WasteSinaderErrorState onRetry={onRetry} /> : null}

      {!isLoading && !isError && !period ? <WasteSinaderEmptyState monthLabel={monthLabel} /> : null}

      {!isLoading && !isError && period ? (
        <>
          <WasteKpiRow kpis={kpis} />
          <WasteSummaryTable
            caption={`Consolidado SINADER de ${monthLabel}`}
            columns={COLUMNS}
            minWidth={TABLE_MIN_WIDTH}
            rows={rows}
            getRowKey={(row) => row.id}
            renderRow={(row) => (
              <>
                <td className={WASTE_SUMMARY_CELL_CLASS}>
                  {/*
                    Primera columna del nodo `3830:65647`: pastilla de categoría
                    arriba y residuo abajo, con `gap-[10px]`. De ahí salen los 71px
                    de alto de la fila, sin fijarlos.
                  */}
                  <span className="flex flex-col items-start gap-[10px]">
                    <WastePill tone="blue" shape="pill">
                      {row.categoryLabel}
                    </WastePill>
                    <span>{row.wasteLabel}</span>
                  </span>
                </td>
                <td className={WASTE_SUMMARY_CELL_CLASS_STRONG}>{row.quantityLabel}</td>
                <td className={WASTE_SUMMARY_CELL_CLASS}>{row.treatmentLabel}</td>
                <td className={WASTE_SUMMARY_CELL_CLASS}>{row.destinationLabel}</td>
                <td className={WASTE_SUMMARY_CELL_CLASS}>{row.transportLabel}</td>
              </>
            )}
            renderTotalRow={() => (
              <>
                <th scope="row" className={`${WASTE_SUMMARY_TOTAL_CELL_CLASS} text-left`}>
                  {view.totalLabel}
                </th>
                <td className={WASTE_SUMMARY_TOTAL_CELL_CLASS}>
                  {`${formatWasteQuantity(period.totalQuantityKg)} kg`}
                </td>
                {/*
                  Las tres últimas celdas de la fila de totales van VACÍAS en el
                  nodo (`3830:65692`, `65706` y `65720` traen sólo un espacio). No
                  se suman tratamientos, destinos ni transportistas: no son
                  magnitudes.
                */}
                <td className={WASTE_SUMMARY_TOTAL_CELL_CLASS} />
                <td className={WASTE_SUMMARY_TOTAL_CELL_CLASS} />
                <td className={WASTE_SUMMARY_TOTAL_CELL_CLASS} />
              </>
            )}
            emptyMessage={`No hay movimientos no peligrosos consolidados en ${monthLabel}.`}
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * ESTADOS QUE EL DISEÑO NO DIBUJA. El nodo sólo muestra el caso con datos; los
 * otros tres los exige `UI_UX_GUIDELINES.md`.
 *
 * La carga mantiene la fila de KPIs con sus cuatro cajas y el armazón de la tabla
 * en su sitio, para que la pantalla no salte cuando llega la respuesta.
 */
function WasteSinaderLoadingState() {
  return (
    <div className="flex w-full flex-col gap-[16px]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando el consolidado SINADER del período…</span>
      <div className="grid w-full grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        {KPI_LABELS.map((label) => (
          <div
            key={label}
            className="flex flex-col items-start rounded-[10px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[17px]"
          >
            <p className="w-full whitespace-nowrap font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold not-italic leading-[normal] text-[#646464]">
              {label}
            </p>
            {/*
              El bloque ocupa el alto exacto de la fila del valor (`h-[29.5px]`) más
              su `pt-[6px]`, así que la tarjeta no cambia de alto al llegar el dato.
              Mismo criterio que `WasteDashboardKpisSection`.
            */}
            <div className="w-full pt-[6px]">
              <div className="h-[29.5px] w-[72px] animate-pulse rounded-[6px] bg-[#ededed]" />
            </div>
          </div>
        ))}
      </div>
      {/* 279px es el alto de la tabla del nodo con sus tres filas y su total. */}
      <div className="h-[279px] w-full animate-pulse rounded-[8px] border border-solid border-[#e3e3e3] bg-white" />
    </div>
  );
}

/**
 * Error de cualquiera de las dos lecturas. Va UN mensaje y no dos: las dos salen
 * del mismo período, así que para quien mira la pantalla fallan juntas.
 */
function WasteSinaderErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex w-full flex-col items-start gap-[8px] rounded-[8px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[17px]">
      <p
        role="alert"
        className="font-['Inter:Semi_Bold',sans-serif] text-[12.5px] font-semibold not-italic leading-[normal] text-[#bd3b5b]"
      >
        No se pudo cargar el consolidado SINADER del período.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] text-[#131313] underline underline-offset-2"
      >
        Reintentar
      </button>
    </div>
  );
}

/**
 * Vacío REAL de esta vista: el mes elegido no tiene período consolidado. No es lo
 * mismo que un período con cero líneas —ése existe y lo dibuja la tabla con su
 * propio mensaje—, así que la copy no promete un total de cero.
 */
function WasteSinaderEmptyState({ monthLabel }: { monthLabel: string }) {
  return (
    <div className="flex w-full flex-col items-start gap-[4px] rounded-[8px] border border-solid border-[#e3e3e3] bg-white px-[19px] py-[17px]">
      <p className="font-['Inter:Semi_Bold',sans-serif] text-[12.5px] font-semibold not-italic leading-[normal] text-[#131313]">
        {`No hay un período SINADER para ${monthLabel}.`}
      </p>
      <p className="font-['Inter:Regular',sans-serif] text-[12px] font-normal not-italic leading-[18px] text-[#646464]">
        El período se crea con el primer movimiento no peligroso del mes. Elige otro período en el
        selector de arriba.
      </p>
    </div>
  );
}

/**
 * Barra inferior `3830:65721`.
 *
 * "Marcar como declarado" va DESHABILITADO mientras el período siga en curso, que
 * es el único estado que dibuja el nodo y el que explica el banner. Todavía no
 * dispara nada: la mutación que declararía el período no existe en la API
 * —`waste.controller.ts` sólo expone las dos lecturas—, así que se entrega el
 * control sin acción antes que un botón que prometa algo que el servidor no puede
 * hacer. Es lo siguiente de esta pantalla.
 */
/**
 * Motivo del bloqueo de "Marcar como declarado", como `title` del botón.
 *
 * Los tres casos dicen cosas distintas a propósito: "todavía no se puede", "ya
 * está hecho" y "no hay nada que declarar" son situaciones diferentes, y un único
 * mensaje genérico dejaría al aprobador sin saber si tiene que esperar, si alguien
 * se le adelantó o si el consolidado no llegó.
 */
function resolveDeclareHint(
  detail: WasteSinaderPeriodDetailResponse | undefined,
  declareState: WasteSinaderDeclareState | undefined,
): string | undefined {
  if (!detail || !declareState) return 'Todavía no hay un período consolidado para declarar';
  if (declareState === 'period_open') {
    return 'El período sigue en curso: se habilita el 1° del mes siguiente, cuando el total sea definitivo';
  }
  if (declareState === 'already_declared') {
    return detail.declaredFolio
      ? `El período ya fue declarado (folio ${detail.declaredFolio})`
      : 'El período ya fue declarado';
  }
  return undefined;
}

interface WasteSinaderFooterProps {
  detail: WasteSinaderPeriodDetailResponse | undefined;
  view: WasteSinaderView;
  onExport: (format: WasteExportFormat) => void;
  /** Formato en curso, para bloquear el botón mientras la API renderiza. */
  exporting: WasteExportFormat | null;
  exportError: string | null;
  /** Abre el modal `4319:34781`. */
  onDeclare: () => void;
}

function WasteSinaderFooter({
  detail,
  view,
  onExport,
  exporting,
  exportError,
  onDeclare,
}: WasteSinaderFooterProps) {
  return (
    <WasteViewFooterBar
      note={
        view.updatedAtLabel ? (
          <>
            {view.updatedAtLabel}
            {/*
              El error va pegado a la nota y no como un toast: es la respuesta al
              click del botón que está al lado, y `role="alert"` hace que el lector
              de pantalla lo anuncie sin robar el foco.
            */}
            {exportError ? (
              <span role="alert" className="block pt-[2px] text-[#bd3b5b]">
                {exportError}
              </span>
            ) : null}
          </>
        ) : undefined
      }
    >
      <WarehouseExportButton
        options={EXPORT_OPTIONS}
        onExport={onExport}
        exporting={exporting}
        placement="up"
        disabled={!detail || detail.lines.length === 0}
        disabledHint="No hay movimientos consolidados que exportar en este período"
      />
      {/*
        Con el período ya declarado el botón NO se dibuja deshabilitado: desaparece.
        Es lo que hace el nodo `3830:66227`, y es lo correcto — un control muerto
        que promete una acción ya cumplida es ruido, y el banner verde de arriba ya
        cuenta que el período se cerró y con qué folio.
      */}
      {view.isDeclared ? null : (
        <WastePrimaryActionButton
          label="Marcar como declarado"
          icon={(className) => <WasteSinaderMarkDeclaredIcon className={className} />}
          onClick={onDeclare}
          disabled={!detail || view.declareState !== 'declarable'}
          disabledHint={resolveDeclareHint(detail, view.declareState)}
        />
      )}
    </WasteViewFooterBar>
  );
}

function WasteSinaderReportContent() {
  /*
   * "Hoy" se resuelve una vez al montar con la inicialización lazy de `useState`:
   * `new Date()` es impuro en render, y de esa fecha salen tanto el mes inicial
   * como los años que ofrece el selector.
   */
  const [today] = useState(() => new Date());
  /*
   * El período arranca en el mes en curso, que es lo que muestra el nodo: "Julio
   * 2026 (Actual)". Es estado de UI —qué mes está mirando el aprobador—, así que
   * vive en el componente y no en TanStack Query.
   */
  const [isoMonth, setIsoMonth] = useState(() => toIsoMonth(today));

  const parsedMonth = parseIsoMonth(isoMonth);
  const periodsQuery = useWasteSinaderPeriods({
    year: parsedMonth?.year,
    // `period_month` es 1–12 en la base, no un índice base 0.
    month: parsedMonth ? parsedMonth.monthIndex + 1 : undefined,
  });

  /*
   * El listado trae como mucho un período por unidad de negocio y mes —la tabla
   * tiene un único constraint sobre (unidad, año, mes)—. Mientras la web no tenga
   * contexto de unidad de negocio se toma el primero; cuando exista, el
   * `businessUnitId` entra como filtro del servidor y esto deja de ser una
   * elección.
   */
  const period = periodsQuery.data?.[0];
  const detailQuery = useWasteSinaderPeriod(period?.id);
  const detail = detailQuery.data;

  const isLoading = periodsQuery.isLoading || (period !== undefined && detailQuery.isLoading);
  const isError = periodsQuery.isError || detailQuery.isError;

  const view = useMemo<WasteSinaderView>(() => {
    const isOpen = period ? isWasteSinaderPeriodOpen(period, today) : false;
    const isDeclared = period?.status === 'declared';
    const isOverdue = period ? isWasteSinaderPeriodOverdue(period, today) : false;
    const monthLabel = formatIsoMonthLabel(isoMonth) ?? isoMonth;
    const monthName = formatWasteSinaderMonthName(isoMonth);

    /*
     * El pie dice tres cosas distintas según el estado, y ninguna sirve para las
     * otras dos: un período declarado no "se recalcula con cada movimiento" —está
     * cerrado— y uno abierto todavía no tiene fecha de declaración.
     */
    const updatedAtLabel = (() => {
      if (isDeclared && period) return buildWasteSinaderDeclaredFooterNote(period);
      if (!detail) return undefined;
      return `Última actualización: ${formatWasteSinaderUpdatedAt(detail.updatedAt)} — se recalcula automáticamente con cada nuevo movimiento del mes.`;
    })();

    return {
      isOpen,
      isDeclared,
      isOverdue,
      monthLabel,
      heading: `${WASTE_SINADER_TITLE} — ${monthLabel}`,
      description: isDeclared
        ? WASTE_SINADER_DECLARED_DESCRIPTION
        : isOpen
          ? WASTE_SINADER_DESCRIPTION
          : WASTE_SINADER_CLOSED_DESCRIPTION,
      notice: isOpen ? buildNotice(monthName, formatWasteSinaderNextMonthName(isoMonth)) : undefined,
      declaredNotice:
        isDeclared && period ? buildWasteSinaderDeclaredNotice(period) : undefined,
      /* El nodo `3830:66210` rotula la fila de totales "Total del período": ya no hay un "hasta hoy". */
      totalLabel: isDeclared ? 'Total del período' : isOpen ? 'Total acumulado hasta hoy' : 'Total acumulado',
      updatedAtLabel,
      declareState: period ? resolveWasteSinaderDeclareState(period, today) : undefined,
      kpis: period ? buildWasteSinaderKpis(period, today) : [],
      rows: detail ? buildWasteSinaderRows(detail) : [],
    };
  }, [period, detail, isoMonth, today]);

  const exportMutation = useWasteSinaderExport();
  /*
   * Abierto/cerrado del modal `4319:34781`. Es estado de UI puro y no viaja a
   * TanStack Query ni a la URL: el modal es un paso de una acción, no un lugar al
   * que se pueda volver con el historial.
   */
  const [declareOpen, setDeclareOpen] = useState(false);
  const [declareError, setDeclareError] = useState<string | null>(null);

  function handleRetry() {
    void periodsQuery.refetch();
    if (period) void detailQuery.refetch();
  }

  /*
   * Confirmar la declaración TODAVÍA NO HACE NADA, y el modal lo dice en vez de
   * simularlo.
   *
   * `waste.controller.ts` sólo expone las dos lecturas de SINADER: no hay ningún
   * endpoint que grabe el folio, la fecha ni el cambio a `declared`. Cerrar el
   * modal como si hubiera funcionado dejaría al aprobador creyendo que declaró un
   * período que sigue abierto en la base, que es el peor final posible para este
   * flujo. Cuando exista la mutación, esto pasa a un `useMutation` y el mensaje se
   * borra junto con esta rama.
   */
  function handleDeclare(input: WasteSinaderDeclareSubmit) {
    setDeclareError(
      `Todavía no se puede confirmar: esta acción aún no está habilitada. Se registrarían el folio ${input.folio} y la fecha ${input.declaredOn}.`,
    );
  }

  function handleExport(format: WasteExportFormat) {
    /*
     * El botón ya viene deshabilitado sin período, así que esto no debería
     * dispararse. Va igual porque `period` es opcional en el tipo y armar el
     * payload sin él sería mentirle al contrato.
     */
    if (!period) return;

    exportMutation.mutate({
      format,
      payload: buildWasteSinaderExportRequest({
        period,
        kpis: view.kpis,
        rows: view.rows,
        title: view.heading,
        description: view.description,
        periodLabel: view.monthLabel,
        notice: view.notice,
        totalLabel: view.totalLabel,
        updatedAtLabel: view.updatedAtLabel ?? '',
      }),
    });
  }

  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col">
      {/* `min-h-0` deja que el hijo desplazable se encoja: sin eso el flex le da su alto natural y el pie se va de cuadro. */}
      <div className="min-h-0 w-full flex-1 overflow-auto">
        <WasteSinaderReportBody
          today={today}
          isoMonth={isoMonth}
          onIsoMonthChange={setIsoMonth}
          period={period}
          view={view}
          isLoading={isLoading}
          isError={isError}
          onRetry={handleRetry}
        />
      </div>
      <WasteSinaderFooter
        detail={detail}
        view={view}
        onExport={handleExport}
        exporting={exportMutation.isPending ? (exportMutation.variables?.format ?? null) : null}
        exportError={exportMutation.isError ? EXPORT_ERROR_MESSAGE : null}
        onDeclare={() => setDeclareOpen(true)}
      />

      {/*
        El modal se monta con el período resuelto, no antes: sus tres datos —período,
        total y movimientos— salen de ahí, y abrirlo sin ellos mostraría una
        confirmación en blanco.
      */}
      {period ? (
        <WasteSinaderDeclareModal
          open={declareOpen}
          periodLabel={view.heading}
          totalQuantity={`${formatWasteQuantity(period.totalQuantityKg)} kg`}
          movementCount={period.movementCount}
          onClose={() => {
            setDeclareOpen(false);
            setDeclareError(null);
          }}
          onConfirm={handleDeclare}
          errorMessage={declareError}
        />
      ) : null}
    </div>
  );
}

export function WasteSinaderReportPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Residuos - Reporte SINADER">
      <AppSidebar />
      <DashboardFrameShell
        header={<WarehouseHeader title={WASTE_SINADER_TITLE} />}
        content={<WasteSinaderReportContent />}
      />
    </div>
  );
}
