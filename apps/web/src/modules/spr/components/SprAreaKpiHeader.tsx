import { ClockIcon } from '../../../shared/components/icons/ClockIcon';
import { SPR_ACTIVE_CYCLE, SPR_AREA_REVIEW } from '../spr.constants';

interface SprAreaKpiHeaderProps {
  completedParameterCount: number;
  totalParameterCount: number;
  receivedDateLabel: string;
  responsibleLabel: string;
  signedDateTimeLabel: string;
}

function KpiColumn({
  label,
  value,
  helper,
  valueClassName = 'text-[#131313]',
  withDivider = true,
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  valueClassName?: string;
  withDivider?: boolean;
}) {
  return (
    <div className={`flex flex-col ${withDivider ? 'border-r border-[#e3e3e3] pr-[21px]' : ''}`}>
      <p className="pb-[3px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.63px] text-[#acacac]">
        {label}
      </p>
      <div className={`font-['Inter:Bold',sans-serif] text-[12px] font-bold ${valueClassName}`}>{value}</div>
      <p className="pt-px font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{helper}</p>
    </div>
  );
}

// Barra KPI del gerente (Figma 1395:12112).
export function SprAreaKpiHeader({
  completedParameterCount,
  totalParameterCount,
  receivedDateLabel,
  responsibleLabel,
  signedDateTimeLabel,
}: SprAreaKpiHeaderProps) {
  const allCompleted = totalParameterCount > 0 && completedParameterCount >= totalParameterCount;

  return (
    <div className="w-full border-b border-[#e3e3e3] bg-white px-[20px] py-[10px]">
      <div className="flex flex-wrap items-stretch gap-y-[10px]">
        <KpiColumn
          label="Ciclo activo"
          value={SPR_ACTIVE_CYCLE.label}
          helper={SPR_ACTIVE_CYCLE.rangeLabel}
        />
        <div className="pl-[20px]">
          <KpiColumn
            label="Fecha límite"
            value={SPR_ACTIVE_CYCLE.deadlineLabel}
            helper={SPR_ACTIVE_CYCLE.deadlineHelper}
            valueClassName="text-[#e8a820]"
          />
        </div>
        <div className="pl-[20px]">
          <KpiColumn
            label="Estado del área"
            value={
              <span className="inline-flex items-center gap-[5px]">
                <ClockIcon className="h-[11px] w-[13.75px] shrink-0 text-[#463100]" />
                {SPR_AREA_REVIEW.areaStatusLabel}
              </span>
            }
            helper={`Formulario recibido el ${receivedDateLabel}`}
            valueClassName="text-[#463100]"
          />
        </div>
        <div className="pl-[20px]">
          <KpiColumn
            label="Responsable de Área"
            value={responsibleLabel}
            helper={`Firmó el ${signedDateTimeLabel}`}
          />
        </div>
        <div className="flex flex-1 justify-end pl-[20px]">
          <KpiColumn
            label="Parámetros reportados"
            value={`${completedParameterCount} / ${totalParameterCount}`}
            helper={allCompleted ? 'Todos completados' : 'En revisión'}
            valueClassName={allCompleted ? 'text-[#3a9b3a]' : 'text-[#131313]'}
            withDivider={false}
          />
        </div>
      </div>
    </div>
  );
}
