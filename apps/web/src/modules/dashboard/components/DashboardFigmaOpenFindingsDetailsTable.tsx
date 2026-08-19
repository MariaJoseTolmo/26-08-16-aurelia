import { useState } from 'react';
import type { InspectionDashboardOpenFindingRowResponse } from '@aurelia/contracts';

type DashboardFigmaOpenFindingsDetailsTableProps = {
  rows: InspectionDashboardOpenFindingRowResponse[];
  severeOpenFindings: number;
  openInspections: string;
  sortIconPath: string;
  expandIconPath: string;
  isLoading?: boolean;
  isError?: boolean;
};

type SortIconProps = {
  path: string;
  color?: string;
};

type ExpandIconProps = {
  path: string;
  expanded?: boolean;
};

type HeaderCellProps = {
  label: string;
  sortIconPath?: string;
  accent?: boolean;
  center?: boolean;
};

type SeveritySummaryCardProps = {
  count: number;
  label: string;
  badgeClass: string;
  textClass: string;
};

const tableColumns = '86px minmax(180px,1fr) minmax(180px,1fr) 121.5px 127.5px 122px';

function SortIcon({ path, color = 'white' }: SortIconProps) {
  return (
    <div className="h-[10px] relative shrink-0 w-[12.5px]" data-name="Image">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 10.001">
        <path d={path} fill={color} fillOpacity={color === 'white' ? 0.7 : 1} />
      </svg>
    </div>
  );
}

function ExpandIcon({ path, expanded = false }: ExpandIconProps) {
  return (
    <div className="h-[10px] relative shrink-0 w-[12.5px]" data-name="Image" style={{ transform: expanded ? 'scaleY(-1)' : undefined }}>
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5 10">
        <path d={path} fill="#131313" />
      </svg>
    </div>
  );
}

function HeaderCell({ label, sortIconPath, accent = false, center = false }: HeaderCellProps) {
  return (
    <div className="bg-[#001e39] min-w-0 relative h-[32px] border-r border-[#122e47] border-solid">
      <div className={`flex h-full items-center gap-[3px] px-[12px] py-[9.5px] ${center ? 'justify-center' : ''}`}>
        <p className={`font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold leading-[normal] tracking-[0.44px] uppercase whitespace-nowrap ${accent ? 'text-[#c8a064]' : 'text-[rgba(255,255,255,0.7)]'}`}>{label}</p>
        {sortIconPath ? <SortIcon path={sortIconPath} color={accent ? '#c8a064' : 'white'} /> : null}
      </div>
    </div>
  );
}

function SeveritySummaryCard({ count, label, badgeClass, textClass }: SeveritySummaryCardProps) {
  return (
    <div className="bg-white border border-[#e3e3e3] border-solid flex h-[72px] min-w-[98px] flex-col gap-[6px] items-start justify-center overflow-hidden px-[13px] py-[8px] relative rounded-[8px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05)] shrink-0" data-name="Container">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] text-[#131313] text-[18px] whitespace-nowrap">{count} obs</p>
      <div className={`${badgeClass} relative rounded-[6px] shrink-0`} data-name="Text">
        <div className="flex items-center px-[8px] py-[2px] relative size-full">
          <p className={`font-['Inter:Bold',sans-serif] font-bold leading-[normal] text-[10px] whitespace-nowrap ${textClass}`}>{label}</p>
        </div>
      </div>
      <div className="absolute bg-[#570b1d] h-full left-0 top-0 w-[3px]" data-name="Text" />
    </div>
  );
}

function getAgeTextClass(row: InspectionDashboardOpenFindingRowResponse) {
  if (row.hasSevereOpenFindings) return 'text-[#570b1d]';
  if (row.ageDays >= 10) return 'text-[#463100]';
  return 'text-[#2a5c16]';
}

function rowBackground(row: InspectionDashboardOpenFindingRowResponse, expanded: boolean) {
  if (expanded) return 'bg-[#ffeab8]';
  return row.hasSevereOpenFindings ? 'bg-[#ffd0db]' : 'bg-white';
}

function rowBorder(row: InspectionDashboardOpenFindingRowResponse, expanded: boolean) {
  return row.hasSevereOpenFindings && !expanded ? 'border-[#570b1d]' : 'border-[#e3e3e3]';
}

export function DashboardFigmaOpenFindingsDetailsTable({ rows, severeOpenFindings, openInspections, sortIconPath, expandIconPath, isLoading = false, isError = false }: DashboardFigmaOpenFindingsDetailsTableProps) {
  const [expandedInspectionId, setExpandedInspectionId] = useState<string | null>(null);

  function toggleRow(inspectionId: string) {
    setExpandedInspectionId((current) => (current === inspectionId ? null : inspectionId));
  }

  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-hidden px-[19px] py-[17px] relative rounded-[inherit] size-full">
        <div className="relative shrink-0 w-full border-b border-[#e3e3e3] border-solid">
          <div className="flex flex-row items-center justify-between pb-[15px] pt-[14px] px-[18px] relative size-full">
            <div className="relative shrink-0 w-[267.82px]" data-name="Container">
              <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] text-[#131313] text-[13px] whitespace-nowrap">Detalle de observaciones abiertas</p>
              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] text-[#646464] text-[11px] whitespace-nowrap">Ordenadas por días abierto · seguimiento prioritario</p>
            </div>
            <div className="flex gap-[12px] items-center relative shrink-0">
              <div className="bg-[#ffd0db] inline-flex items-center justify-center rounded-[6px] shrink-0 px-[10px] py-[4px]">
                <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] text-[#570b1d] text-[11px] whitespace-nowrap">{severeOpenFindings} tienen observaciones en estado grave</p>
              </div>
              <div className="bg-[#e6f3ff] inline-flex items-center justify-center rounded-[6px] shrink-0 px-[10px] py-[4px]">
                <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] text-[#24588b] text-[11px] whitespace-nowrap">{openInspections} inspecciones abiertas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[920px] w-full">
            <div className="grid" style={{ gridTemplateColumns: tableColumns }}>
              <HeaderCell label="Nº" sortIconPath={sortIconPath} />
              <HeaderCell label="Empresa" sortIconPath={sortIconPath} />
              <HeaderCell label="Área" sortIconPath={sortIconPath} />
              <HeaderCell label="Días abierto" sortIconPath={sortIconPath} accent center />
              <HeaderCell label="Obs. abiertas" sortIconPath={sortIconPath} center />
              <HeaderCell label="Desplegar fila" center />
            </div>

            {isLoading ? (
              <div className="h-[66px] flex items-center justify-center text-[12px] text-[#646464] border-b border-[#e3e3e3] border-solid">Cargando detalle de observaciones...</div>
            ) : isError ? (
              <div className="h-[66px] flex items-center justify-center text-[12px] text-[#570b1d] border-b border-[#e3e3e3] border-solid">Error al cargar detalle de observaciones.</div>
            ) : rows.length === 0 ? (
              <div className="h-[66px] flex items-center justify-center text-[12px] text-[#646464] border-b border-[#e3e3e3] border-solid">Sin observaciones abiertas</div>
            ) : (
              rows.map((row) => {
                const isExpanded = expandedInspectionId === row.inspectionId;
                const bgClass = rowBackground(row, isExpanded);
                const borderClass = rowBorder(row, isExpanded);

                return (
                  <div key={row.inspectionId}>
                    <div className="grid h-[33px]" style={{ gridTemplateColumns: tableColumns }}>
                      <div className={`${bgClass} border-b border-r ${borderClass} border-solid flex items-center px-[12px]`}>
                        <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] text-[#24588b] text-[12px] whitespace-nowrap">{row.inspectionNumber}</p>
                      </div>
                      <div className={`${bgClass} border-b border-r ${borderClass} border-solid flex items-center px-[12px] min-w-0`}>
                        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] text-[#131313] text-[12px] truncate">{row.company}</p>
                      </div>
                      <div className={`${bgClass} border-b border-r ${borderClass} border-solid flex items-center px-[12px] min-w-0`}>
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] text-[#333] text-[12px] truncate">{row.area}</p>
                      </div>
                      <div className={`${bgClass} border-b border-r ${borderClass} border-solid flex items-center justify-center px-[12px]`}>
                        <p className={`font-['Inter:Bold',sans-serif] font-bold leading-[normal] text-[12px] whitespace-nowrap ${getAgeTextClass(row)}`}>{row.ageDays}</p>
                      </div>
                      <div className={`${bgClass} border-b border-r ${borderClass} border-solid flex items-center justify-center px-[12px]`}>
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] text-[#333] text-[12px] whitespace-nowrap">{row.openFindings}</p>
                      </div>
                      <button className={`${bgClass} border-b border-r ${borderClass} border-solid flex items-center justify-center px-[12px] cursor-pointer`} type="button" onClick={() => toggleRow(row.inspectionId)}>
                        <ExpandIcon path={expandIconPath} expanded={isExpanded} />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="bg-[#fff8e9] h-[122px] overflow-hidden relative w-full border-b border-[#e3e3e3] border-solid">
                        <div className="absolute left-[18px] right-[18px] top-[20px] flex items-start justify-between gap-[16px]">
                          <div className="flex gap-[12px] items-start shrink-0">
                            <SeveritySummaryCard count={row.severityCounts.severe} label="Grave" badgeClass="bg-[#ffd0db]" textClass="text-[#570b1d]" />
                            <SeveritySummaryCard count={row.severityCounts.moderate} label="Moderado" badgeClass="bg-[#ffe1cd]" textClass="text-[#532a0e]" />
                            <SeveritySummaryCard count={row.severityCounts.minor} label="Menor" badgeClass="bg-[#e0ffd3]" textClass="text-[#2a5c16]" />
                          </div>
                          <a className="bg-[#c8a064] flex items-center px-[16px] py-[10.5px] rounded-[6px] shrink-0 mt-[16px]" href="/inspections">
                            <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] text-[12px] text-center text-white whitespace-nowrap">Ir a esta inspección</p>
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <div aria-hidden className="absolute border border-[#e3e3e3] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
