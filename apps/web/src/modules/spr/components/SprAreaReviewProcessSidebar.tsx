import { SPR_AREA_REVIEW } from '../spr.constants';

interface SprAreaReviewProcessSidebarProps {
  completedParameterCount: number;
  totalParameterCount: number;
  attachmentCount: number;
  signedDateTimeLabel: string;
}

function ProcessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f4f6f9] py-[5px]">
      <p className="font-['Inter:Medium',sans-serif] text-[10px] font-medium text-[#646464]">{label}</p>
      <p className="font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#131313]">{value}</p>
    </div>
  );
}

// Mini tarjeta "Estado del proceso" en columna izquierda (Figma 1395:12112).
export function SprAreaReviewProcessSidebar({
  completedParameterCount,
  totalParameterCount,
  attachmentCount,
  signedDateTimeLabel,
}: SprAreaReviewProcessSidebarProps) {
  return (
    <div className="px-[13px] pt-[14px]">
      <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
        Estado del proceso
      </p>
      <div className="pt-[7px]">
        <ProcessRow label="Estado" value={SPR_AREA_REVIEW.processStatusLabel} />
        <ProcessRow label="Enviado por responsable" value={signedDateTimeLabel} />
        <ProcessRow
          label="Parámetros completados"
          value={SPR_AREA_REVIEW.parametersCompletedLabel(completedParameterCount, totalParameterCount)}
        />
        <ProcessRow label="Documentos adjuntos" value={SPR_AREA_REVIEW.attachmentsCountLabel(attachmentCount)} />
      </div>
    </div>
  );
}
