import { useState, type ReactNode } from 'react';
import {
  InspectionDetailApproveIcon,
  InspectionDetailAssignIcon,
  InspectionDetailCameraIcon,
  InspectionDetailCaretDownIcon,
  InspectionDetailChecklistListIcon,
  InspectionDetailChecklistNoIcon,
  InspectionDetailChecklistYesIcon,
  InspectionDetailCloseIcon,
  InspectionDetailFollowupIcon,
  InspectionDetailImageIcon,
  InspectionDetailListIcon,
  InspectionDetailLocationIcon,
  InspectionDetailPdfIcon,
  InspectionDetailPersonIcon,
  InspectionDetailRejectIcon,
  InspectionDetailStatusChipIcon,
  InspectionDetailStatusRowIcon,
  type InspectionDetailIconStatus,
} from './InspectionDetailIcons';

export type InspectionDetailModalKind = 'finding' | 'checklist';

export type InspectionDetailModalRecord = {
  id: string;
  title: string;
  kind: InspectionDetailModalKind;
  metadataLine1: string;
  metadataLine2?: string;
  progressPercent?: number;
  counts?: Partial<Record<'executed' | 'open' | 'closed' | 'rejected', number>>;
};

type InspectionDetailModalProps = {
  open: boolean;
  record: InspectionDetailModalRecord | null;
  onClose: () => void;
};

type StatusKey = InspectionDetailIconStatus;
type DetailTab = 'observations' | 'result' | 'followups' | 'general';
type ChecklistResultStatus = 'yes' | 'no' | 'na';

type StatusConfig = {
  key: StatusKey;
  label: string;
  chipLabel: string;
  itemLabel: string;
  textClass: string;
  chipClass: string;
};

type OpenFindingObservation = {
  idLabel: string;
  severityLabel: string;
  severityClassName: string;
};

type TabConfig = {
  id: DetailTab;
  label: string;
};

type FollowupStep = {
  title: string;
  date: string;
  summary?: string;
  bullets?: string[];
  completed: boolean;
};

type GeneralInfoRow = {
  label: string;
  value: string;
  mono?: boolean;
};

type GeneralObservationSummary = {
  idLabel: string;
  severityLabel: string;
  severityClassName: string;
};

type Responsible = {
  initials: string;
  name: string;
  role: string;
  avatarClassName: string;
  current?: boolean;
};

type ReassignOption = {
  id: string;
  initials: string;
  name: string;
  area: string;
  avatarClassName: string;
};

type ChecklistResultItem = {
  number: number;
  question: string;
  status: ChecklistResultStatus;
  comment?: boolean;
};

const statusConfigByKey: Record<StatusKey, StatusConfig> = {
  executed: { key: 'executed', label: 'Ejecutadas', chipLabel: 'Ejecutada', itemLabel: 'Ejecutado', textClass: 'text-[#570b1d]', chipClass: 'bg-[#ffd0db] text-[#570b1d]' },
  open: { key: 'open', label: 'Abiertas', chipLabel: 'Abiertas', itemLabel: 'Abierto', textClass: 'text-[#463100]', chipClass: 'bg-[#ffeab8] text-[#463100]' },
  closed: { key: 'closed', label: 'Cerradas', chipLabel: 'Cerrada', itemLabel: 'Cerrado', textClass: 'text-[#2a5c16]', chipClass: 'bg-[#e0ffd3] text-[#2a5c16]' },
  rejected: { key: 'rejected', label: 'Rechazadas', chipLabel: 'Rechazada', itemLabel: 'Rechazado', textClass: 'text-[#646464]', chipClass: 'bg-[#f7f7f7] text-[#646464]' },
};

const statusConfigs = Object.values(statusConfigByKey);
const openFindingObservations: OpenFindingObservation[] = [
  { idLabel: 'Obs. 2', severityLabel: 'Moderado', severityClassName: 'bg-[#fbe1d0] text-[#69462e]' },
  { idLabel: 'Obs. 3', severityLabel: 'Menor', severityClassName: 'bg-[#e0ffd3] text-[#2a5c16]' },
];
const followupSteps: FollowupStep[] = [
  { title: 'Inspección inicial', date: '03-06-2026', summary: '5 observaciones detectadas', completed: true },
  { title: 'Seguimiento 1', date: '[dd-mm-aaaa (Fecha de primer seguimiento)]', bullets: ['Observaciones cerradas: 1 obs / 20%', 'Observaciones pendientes: 4 obs / 80%'], completed: true },
  { title: 'Seguimiento 2', date: '—', completed: false },
  { title: 'Seguimiento 3', date: '—', completed: false },
];
const findingInspectorRows: GeneralInfoRow[] = [
  { label: 'Nombre', value: 'Karen Opazo S.' },
  { label: 'Empresa', value: 'Gold Fields' },
];
const findingLocationRows: GeneralInfoRow[] = [
  { label: 'Área · Sector', value: 'Mina · Sector Norte' },
  { label: 'Fecha', value: '10-06-2026' },
  { label: 'Tipo', value: 'Hallazgo' },
  { label: 'Ubicación UTM', value: '19H 351376E 6295754N', mono: true },
];
const checklistLocationRows: GeneralInfoRow[] = [
  { label: 'Área · Sector', value: 'Mina · Sector Norte' },
  { label: 'Fecha', value: '10-06-2026' },
  { label: 'Tipo', value: 'Checklist normativo' },
  { label: 'Plantilla', value: 'SUSPEL – General' },
  { label: 'Código', value: 'FR-00007' },
  { label: 'Ubicación UTM', value: '19H 351376E 6295754N', mono: true },
];
const findingObservationSummaries: GeneralObservationSummary[] = [
  { idLabel: 'Obs. 1', severityLabel: 'Crítico', severityClassName: 'bg-[#ffd0db] text-[#570b1d]' },
  { idLabel: 'Obs. 2', severityLabel: 'Alto', severityClassName: 'bg-[#ffe1cd] text-[#532a0e]' },
  { idLabel: 'Obs. 3', severityLabel: 'Alto', severityClassName: 'bg-[#ffe1cd] text-[#532a0e]' },
  { idLabel: 'Obs. 4', severityLabel: 'Alto', severityClassName: 'bg-[#ffe1cd] text-[#532a0e]' },
];
const checklistObservationSummaries: GeneralObservationSummary[] = [
  { idLabel: 'Ítem. Nº1', severityLabel: 'Alto', severityClassName: 'bg-[#ffe1cd] text-[#532a0e]' },
];
const findingResponsibles: Responsible[] = [
  { initials: 'NA', name: '[Nombre y apellido usuario 1]', role: 'Coordinador', avatarClassName: 'bg-[#c8a064] text-[#001e39]', current: true },
  { initials: 'NA', name: '[Nombre y apellido usuario 1]', role: 'Inspector', avatarClassName: 'bg-[#24588b] text-white' },
];
const reassignOptions: ReassignOption[] = [
  { id: 'miguel-pizarro', initials: 'MP', name: 'Miguel Pizarro', area: 'Planta Procesos', avatarClassName: 'bg-[#c8a064] text-[#001e39]' },
  { id: 'roberto-gonzalez', initials: 'RG', name: 'Roberto González', area: 'Planta Procesos', avatarClassName: 'bg-[#24588b] text-white' },
  { id: 'carlos-lopez', initials: 'CL', name: 'Carlos López', area: 'Mantención', avatarClassName: 'bg-[#00b398] text-white' },
  { id: 'patricia-soto', initials: 'PS', name: 'Patricia Soto', area: 'Servicios Generales', avatarClassName: 'bg-[#532a0e] text-white' },
];
const checklistResultItems: ChecklistResultItem[] = [
  { number: 1, question: '¿El almacenamiento se realiza en lugar protegido, techado?', status: 'yes', comment: true },
  { number: 2, question: '¿Tiene acceso con candado y señaliza encargado?', status: 'yes' },
  { number: 3, question: '¿Está alejado más de 5 metros de fuentes inflamables?', status: 'yes' },
  { number: 4, question: '¿Tiene señalética NCh 382:2021 y NCh 2190:2019?', status: 'yes', comment: true },
  { number: 5, question: '¿SUSPEL almacenadas según clase, tipo y peligrosidad?', status: 'yes', comment: true },
  { number: 6, question: '¿Los envases son adecuados e impiden pérdidas?', status: 'yes' },
  { number: 7, question: '¿Tiene visible el rombo NFPA 704 y NCh 1411:2000?', status: 'no' },
  { number: 8, question: '¿Los envases están rotulados con contenido y peligrosidad?', status: 'yes' },
  { number: 9, question: '¿Tiene señalética "NO FUMAR" y "ÁREA RESTRINGIDA"?', status: 'yes' },
  { number: 10, question: '¿Posee sistema de extinción según la carga de fuego?', status: 'yes' },
  { number: 11, question: '¿El lugar tiene al menos 1 metro libre hasta el techo?', status: 'yes' },
  { number: 12, question: '¿Posee contención de derrames de 1,1 veces el total?', status: 'no' },
  { number: 13, question: '¿Tiene disponibles las HDS según NCh2245:2021?', status: 'yes' },
  { number: 14, question: '¿Mantiene orden y limpieza en el lugar?', status: 'yes' },
  { number: 15, question: '¿Existe inventario actualizado con nombre y proveedor?', status: 'yes' },
  { number: 16, question: '¿El personal está capacitado en manejo de SUSPEL?', status: 'yes' },
  { number: 17, question: '¿Los recipientes están en buen estado sin deterioro?', status: 'yes' },
  { number: 18, question: '¿Productos incompatibles con separación adecuada?', status: 'yes' },
  { number: 19, question: '¿Existe registro de ingresos y egresos actualizado?', status: 'na' },
  { number: 20, question: '¿El área tiene ventilación que evita acumulación de vapores?', status: 'no' },
  { number: 21, question: '¿Los derrames anteriores fueron reportados formalmente?', status: 'yes' },
  { number: 22, question: '¿El sistema eléctrico es antiexplosión o certificado ATEX?', status: 'na' },
  { number: 23, question: '¿Existe señalética de EPP requerido visible en el acceso?', status: 'yes' },
  { number: 24, question: '¿Existe ducha de emergencia y lavaojos a menos de 10m?', status: 'yes' },
  { number: 25, question: '¿Los residuos de SUSPEL se gestionan como RESPEL?', status: 'yes' },
];

function getTabs(kind: InspectionDetailModalKind): TabConfig[] {
  if (kind === 'checklist') return [{ id: 'observations', label: 'Ítems No' }, { id: 'result', label: 'Resultado completo' }, { id: 'followups', label: 'Seguimientos' }, { id: 'general', label: 'Datos generales' }];
  return [{ id: 'observations', label: 'Observaciones' }, { id: 'followups', label: 'Seguimientos' }, { id: 'general', label: 'Datos generales' }];
}

function StatusChip({ status, count }: { status: StatusKey; count: number }) {
  const config = statusConfigByKey[status];
  return <span className={`inline-flex h-[16px] items-center gap-[3px] rounded-[5px] px-[7px] py-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold leading-none ${config.chipClass}`}><InspectionDetailStatusChipIcon status={status} />{count} {config.chipLabel}</span>;
}

function ProgressSummary({ counts, progressPercent }: { counts: Record<StatusKey, number>; progressPercent: number }) {
  return (
    <div className="flex shrink-0 flex-col items-start bg-[#143049] px-[14px] py-[10px] text-white">
      <div className="flex h-[12px] w-full items-start justify-between"><p className="font-['Inter:Regular',sans-serif] text-[10px] font-normal leading-none text-[rgba(255,255,255,0.5)]">Progreso de observaciones</p><p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-none text-white">{progressPercent}%</p></div>
      <div className="w-full pt-[5px]"><div className="h-[5px] w-full overflow-hidden rounded-[3px] bg-[rgba(255,255,255,0.15)]"><div className="h-[5px] rounded-[3px] bg-[#e0ffd3]" style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} /></div></div>
      <div className="flex w-full flex-wrap gap-[5px] pt-[6px]">{statusConfigs.map((item) => <StatusChip key={item.key} status={item.key} count={counts[item.key]} />)}</div>
    </div>
  );
}

function Tabs({ kind, activeTab, onChange }: { kind: InspectionDetailModalKind; activeTab: DetailTab; onChange: (tab: DetailTab) => void }) {
  const tabs = getTabs(kind);
  return <div className="grid shrink-0 border-b-2 border-[#e3e3e3] bg-[#f7f7f7]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`flex h-[37px] items-center justify-center border-b-2 px-[6px] pb-[2px] text-center font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold leading-[14px] ${tab.id === activeTab ? 'border-[#c8a064] text-[#8e6e3e]' : 'border-transparent text-[#646464]'}`}>{tab.label}</button>)}</div>;
}

function StatusRow({ config, count, expanded, onToggle }: { config: StatusConfig; count: number; expanded: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="flex h-[56px] w-full shrink-0 items-center justify-between border-b border-[#e3e3e3] bg-white px-[14px] py-[16px]" onClick={onToggle} aria-expanded={expanded}>
      <div className="flex items-center gap-[10px]"><InspectionDetailStatusRowIcon status={config.key} /><p className={`font-['Inter:Bold',sans-serif] text-[11px] font-bold uppercase leading-[13px] tracking-[0.66px] ${config.textClass}`}>{config.label}</p><span className={`flex h-[14px] min-w-[19px] items-center justify-center rounded-[8px] px-[7px] font-['Inter:Bold',sans-serif] text-[10px] font-bold leading-[12px] tracking-[0.6px] ${config.chipClass}`}>{count}</span></div>
      <InspectionDetailCaretDownIcon className={expanded ? 'size-[16px] rotate-180' : 'size-[16px]'} />
    </button>
  );
}

function FindingPill({ children, className }: { children: string; className: string }) {
  return <span className={`inline-flex h-[19px] items-center rounded-[6px] px-[8px] text-[11px] font-bold leading-none ${className}`}>{children}</span>;
}

function FindingTextBlock({ title, children, bordered = false }: { title: string; children: string; bordered?: boolean }) {
  return (
    <div className={`flex w-full flex-col items-start rounded-[8px] bg-white px-[10px] py-[8px] ${bordered ? 'border border-[#e3e3e3]' : ''}`}>
      <p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-[#646464]">{title}</p>
      <p className="pt-[3px] text-[12px] font-normal leading-[16.8px] text-[#131313]">{children}</p>
    </div>
  );
}

function EvidencePreview({ title, children, afterClosed = false }: { title: string; children: ReactNode; afterClosed?: boolean }) {
  return (
    <div className="flex h-[91px] min-w-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-[#e3e3e3] bg-white p-px">
      <div className="flex h-[20px] items-center bg-[#001e39] px-[8px] py-[4px]"><p className="text-[9px] font-bold uppercase leading-none text-[rgba(255,255,255,0.7)]">{title}</p></div>
      <div className={`flex min-h-0 flex-1 items-center justify-center ${afterClosed ? 'bg-[#dafccb]' : 'bg-gradient-to-br from-[#e8f4fd] to-[#c8e6f0]'}`}>{children}</div>
    </div>
  );
}

function ExecutedFindingObservationCard() {
  const config = statusConfigByKey.executed;
  return (
    <div className="rounded-[10px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] p-[13.5px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">Obs. 1</FindingPill><FindingPill className="bg-[#ffd0db] text-[#570b1d]">Grave</FindingPill></div>
        <span className={`inline-flex h-[19px] items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[10px] font-bold leading-none ${config.chipClass}`}><InspectionDetailStatusChipIcon status="executed" />{config.itemLabel}</span>
      </div>
      <div className="flex flex-col gap-[4px] pt-[12px]">
        <FindingTextBlock title="Condición detectada" bordered>[Descripción realizada por el usuario que levanta la inspección]</FindingTextBlock>
        <FindingTextBlock title="Medida correctiva propuesta">[Medida correctiva que recomienda el usuario que tomó la inspección]</FindingTextBlock>
        <FindingTextBlock title="Descripción de la acción tomada">[Acción que realizó el usuario al momento de ejecutar el hallazgo]</FindingTextBlock>
        <div className="flex gap-[4px] pt-[8px]"><EvidencePreview title="Antes"><InspectionDetailImageIcon tone="#24588b" /></EvidencePreview><EvidencePreview title="Después" afterClosed><InspectionDetailImageIcon tone="#2a5c16" /></EvidencePreview></div>
        <div className="mt-[4px] flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</p><div className="flex items-center gap-[3px]"><InspectionDetailStatusRowIcon status="executed" className="h-[9px] w-[11.25px]" /><p className="text-[11px] font-bold leading-none text-[#570b1d]">XX días</p></div></div>
        <div className="flex items-center gap-[8px] rounded-[8px] bg-white px-[12px] py-[9px]"><button type="button" className="flex h-[40px] items-center justify-center gap-[5px] rounded-[9px] border-2 border-[#c4365a] bg-white px-[16px] py-[2px] text-[12px] font-bold text-[#570b1d]"><InspectionDetailRejectIcon />Rechazar</button><button type="button" className="flex h-[40px] min-w-0 flex-1 items-center justify-center gap-[5px] rounded-[9px] bg-[#3a9b3a] px-[12px] text-[12px] font-bold text-white"><InspectionDetailApproveIcon />Aprobar cierre</button></div>
      </div>
    </div>
  );
}

function OpenFindingObservationCard({ observation }: { observation: OpenFindingObservation }) {
  const config = statusConfigByKey.open;
  return (
    <div className="rounded-[10px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] p-[13.5px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">{observation.idLabel}</FindingPill><FindingPill className={observation.severityClassName}>{observation.severityLabel}</FindingPill></div>
        <span className="inline-flex h-[19px] items-center gap-[4px] rounded-[6px] bg-[#fbe9be] px-[8px] py-[4px] text-[10px] font-bold leading-none text-[#5e4c22]"><InspectionDetailStatusChipIcon status="open" />{config.itemLabel}</span>
      </div>
      <div className="flex flex-col gap-[4px] pt-[12px]">
        <FindingTextBlock title="Condición detectada" bordered>[Descripción realizada por el usuario que levanta la inspección]</FindingTextBlock>
        <FindingTextBlock title="Medida correctiva propuesta">[Medida correctiva que recomienda el usuario que tomó la inspección]</FindingTextBlock>
        <div className="flex gap-[4px] pt-[8px]"><EvidencePreview title="Antes"><InspectionDetailImageIcon tone="#24588b" /></EvidencePreview><EvidencePreview title="Después"><p className="text-[11px] font-normal leading-none text-[#acacac]">Pendiente EECC</p></EvidencePreview></div>
        <div className="mt-[4px] flex min-h-[64px] items-center justify-between rounded-[10px] border-[1.5px] border-[#d1d1d1] bg-[#f7f7f7] p-[15.5px]"><div><p className="w-[78px] text-[9px] font-bold uppercase leading-none tracking-[0.63px] text-[#333]">SLA calculado</p><p className="pt-[2px] text-[20px] font-bold leading-[20px] text-[#532a0e]">X Días</p></div><button type="button" className="flex h-[40px] items-center justify-center rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[15.5px] py-[1.5px] text-[13px] font-semibold text-[#333]">Reasignar SLA</button></div>
        <button type="button" className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#c8a064] px-[12px] text-[15px] font-bold text-white shadow-[0px_2px_5px_rgba(200,160,100,0.3)]">Ejecutar observación</button>
      </div>
    </div>
  );
}

function ClosedFindingObservationCard() {
  const config = statusConfigByKey.closed;
  return (
    <div className="rounded-[10px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] p-[13.5px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">Obs. 4</FindingPill><FindingPill className="bg-[#fbe1d0] text-[#69462e]">Moderado</FindingPill></div>
        <span className={`inline-flex h-[19px] items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[10px] font-bold leading-none ${config.chipClass}`}><InspectionDetailStatusChipIcon status="closed" />{config.itemLabel}</span>
      </div>
      <div className="flex flex-col gap-[4px] pt-[12px]">
        <FindingTextBlock title="Condición detectada" bordered>[Descripción realizada por el usuario que levanta la inspección]</FindingTextBlock>
        <FindingTextBlock title="Medida correctiva propuesta">[Medida correctiva que recomienda el usuario que tomó la inspección]</FindingTextBlock>
        <FindingTextBlock title="Descripción de la acción tomada">[Acción que realizó el usuario al momento de ejecutar el hallazgo]</FindingTextBlock>
        <div className="flex gap-[4px] pt-[8px]"><EvidencePreview title="Antes"><InspectionDetailImageIcon tone="#24588b" /></EvidencePreview><EvidencePreview title="Después" afterClosed><InspectionDetailImageIcon tone="#2a5c16" /></EvidencePreview></div>
        <div className="mt-[4px] flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SLA cerrado</p><div className="flex items-center gap-[3px]"><InspectionDetailStatusRowIcon status="open" className="h-[9px] w-[11.25px]" /><p className="text-[11px] font-bold leading-none text-[#532a0e]">XX días</p></div></div>
        <div className="flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">Fecha de cierre</p><p className="text-right text-[11px] font-bold leading-none text-[#646464]">dd/mm/aaaa</p></div>
      </div>
    </div>
  );
}

function RejectedFindingObservationCard() {
  const config = statusConfigByKey.executed;
  return (
    <div className="rounded-[10px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] p-[13.5px] shadow-[0px_1px_1.5px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">Obs. 1</FindingPill><FindingPill className="bg-[#ffd0db] text-[#570b1d]">Grave</FindingPill></div>
        <span className={`inline-flex h-[19px] items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[10px] font-bold leading-none ${config.chipClass}`}><InspectionDetailStatusChipIcon status="executed" />{config.itemLabel}</span>
      </div>
      <div className="flex flex-col gap-[4px] pt-[12px]">
        <FindingTextBlock title="Condición detectada" bordered>[Descripción realizada por el usuario que levanta la inspección]</FindingTextBlock>
        <FindingTextBlock title="Medida correctiva propuesta">[Medida correctiva que recomienda el usuario que tomó la inspección]</FindingTextBlock>
        <FindingTextBlock title="Descripción de la acción tomada">[Acción que realizó el usuario al momento de ejecutar el hallazgo]</FindingTextBlock>
        <FindingTextBlock title="Motivo de rechazo">[Motivo ingresado por usuario que rechazó la observación]</FindingTextBlock>
        <div className="flex gap-[4px] pt-[8px]"><EvidencePreview title="Antes"><InspectionDetailImageIcon tone="#24588b" /></EvidencePreview><EvidencePreview title="Después" afterClosed><InspectionDetailImageIcon tone="#2a5c16" /></EvidencePreview></div>
        <div className="mt-[4px] flex h-[33px] items-center justify-between rounded-[8px] bg-white px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</p><div className="flex items-center gap-[3px]"><InspectionDetailStatusRowIcon status="executed" className="h-[9px] w-[11.25px]" /><p className="text-[11px] font-bold leading-none text-[#570b1d]">XX días</p></div></div>
        <button type="button" className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#c8a064] px-[12px] text-[15px] font-bold text-white shadow-[0px_2px_5px_rgba(200,160,100,0.3)]">Ejecutar observación rechazada</button>
      </div>
    </div>
  );
}

function ExecutedFindingObservationsPanel() {
  return <div className="flex shrink-0 flex-col bg-white px-[14px] pb-[24px] pt-[14px]"><ExecutedFindingObservationCard /></div>;
}

function OpenFindingObservationsPanel() {
  return <div className="flex shrink-0 flex-col gap-[24px] bg-white px-[14px] pb-[24px] pt-[14px]">{openFindingObservations.map((observation) => <OpenFindingObservationCard key={observation.idLabel} observation={observation} />)}</div>;
}

function ClosedFindingObservationsPanel() {
  return <div className="flex shrink-0 flex-col bg-white px-[14px] pb-[24px] pt-[14px]"><ClosedFindingObservationCard /></div>;
}

function RejectedFindingObservationsPanel() {
  return <div className="flex shrink-0 flex-col bg-white px-[14px] pb-[24px] pt-[14px]"><RejectedFindingObservationCard /></div>;
}

function DetailRows({ counts }: { counts: Record<StatusKey, number> }) {
  const [expandedStatus, setExpandedStatus] = useState<StatusKey | null>('open');
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white">
      {statusConfigs.map((config) => {
        const expanded = expandedStatus === config.key;
        const panel = config.key === 'executed' && expanded ? <ExecutedFindingObservationsPanel /> : config.key === 'open' && expanded ? <OpenFindingObservationsPanel /> : config.key === 'closed' && expanded ? <ClosedFindingObservationsPanel /> : config.key === 'rejected' && expanded ? <RejectedFindingObservationsPanel /> : null;
        return <div key={config.key}><StatusRow config={config} count={counts[config.key]} expanded={expanded} onToggle={() => setExpandedStatus((current) => current === config.key ? null : config.key)} />{panel}</div>;
      })}
    </div>
  );
}

function ChecklistResultMetric({ value, label, tone, icon }: { value: string; label: string; tone: string; icon?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-[2px]">
      <p className={`text-[18px] font-bold leading-[22px] ${tone}`}>{value}</p>
      <div className="flex h-[15px] items-center justify-center gap-[3px]">{icon ? <span className="flex h-[9px] w-[11.25px] items-center justify-center">{icon}</span> : null}<span className={`text-[11px] font-normal leading-none ${tone}`}>{label}</span></div>
    </div>
  );
}

function ChecklistResultSummary() {
  return (
    <div className="flex h-[71px] shrink-0 items-start gap-[8px] border-b border-[#e3e3e3] bg-white px-[14px] pb-[13px] pt-[12px]">
      <ChecklistResultMetric value="20" label="SÍ" tone="text-[#2a5c16]" icon={<InspectionDetailChecklistYesIcon />} />
      <div className="h-full w-px shrink-0 bg-[#e3e3e3]" />
      <ChecklistResultMetric value="5" label="NO" tone="text-[#570b1d]" icon={<InspectionDetailChecklistNoIcon />} />
      <div className="h-full w-px shrink-0 bg-[#e3e3e3]" />
      <ChecklistResultMetric value="2" label="N/A" tone="text-[#646464]" />
    </div>
  );
}

function ChecklistResultStatusBadge({ status }: { status: ChecklistResultStatus }) {
  if (status === 'no') return <span className="inline-flex h-[16px] items-center rounded-[6px] bg-[#ffd0db] px-[8px] py-[2px] text-[10px] font-bold leading-none text-[#570b1d]">NO</span>;
  if (status === 'na') return <span className="inline-flex h-[16px] items-center rounded-[6px] bg-[#f7f7f7] px-[8px] py-[2px] text-[10px] font-bold leading-none text-[#646464]">N/A</span>;
  return <span className="inline-flex h-[16px] items-center rounded-[6px] bg-[#e0ffd3] px-[8px] py-[2px] text-[10px] font-bold leading-none text-[#2a5c16]">SÍ</span>;
}

function ChecklistResultItemRow({ item, isLast }: { item: ChecklistResultItem; isLast: boolean }) {
  const isNo = item.status === 'no';
  return (
    <div className={`flex gap-[10px] px-[12px] pb-[10px] pt-[9px] ${isNo ? 'bg-[#ffd0db]' : 'bg-white'} ${isLast ? '' : 'border-b border-[#e3e3e3]'}`}>
      <p className={`shrink-0 pt-px text-[10px] font-bold leading-none ${isNo ? 'text-[#bd3b5b]' : 'text-[#acacac]'}`}>{item.number}</p>
      <div className="min-w-0 flex-1">
        <p className={`text-[12px] leading-[16.8px] ${isNo ? 'font-semibold text-[#570b1d]' : 'font-normal text-[#333]'}`}>{item.question}</p>
        {item.comment ? <p className="pt-[8px] text-[12px] font-semibold leading-[16.8px] text-[#333]">Comentario:<br />[Comentario a considerar ingresado por el inspector al momento de realizar la inspección]</p> : null}
      </div>
      <div className="shrink-0 pt-px"><ChecklistResultStatusBadge status={item.status} /></div>
    </div>
  );
}

function ChecklistResultItemsSection() {
  return (
    <div className="shrink-0 bg-white py-[20px]">
      <div className="flex items-center gap-[6px] px-[14px]"><InspectionDetailChecklistListIcon /><p className="text-[11px] font-bold uppercase leading-none tracking-[0.55px] text-[#646464]">Detalle ítem a ítem</p></div>
      <div className="pt-[10px]"><div className="overflow-hidden border border-[#e3e3e3] bg-white">{checklistResultItems.map((item, index) => <ChecklistResultItemRow key={item.number} item={item} isLast={index === checklistResultItems.length - 1} />)}</div></div>
    </div>
  );
}

function ChecklistResultPanel() {
  return <div className="min-h-0 flex-1 overflow-y-auto bg-white"><ChecklistResultSummary /><ChecklistResultItemsSection /></div>;
}

function FollowupTimelineMarker({ completed }: { completed: boolean }) {
  return <div className={`flex size-[24px] shrink-0 items-center justify-center rounded-[12px] text-[10px] font-normal leading-none ${completed ? 'bg-[#6cc24a] text-white' : 'bg-[#e3e3e3] text-[#acacac]'}`}>{completed ? '✓' : '○'}</div>;
}

function FollowupTimelineItem({ step, isLast }: { step: FollowupStep; isLast: boolean }) {
  return (
    <div className={`relative flex w-full gap-[12px] ${isLast ? '' : 'pb-[16px]'}`}>
      <FollowupTimelineMarker completed={step.completed} />
      {!isLast ? <div className={`absolute left-[11px] top-[24px] w-[2px] bg-[#e3e3e3] ${step.bullets ? 'h-[38px]' : 'h-[23px]'}`} /> : null}
      <div className="min-w-0 flex-1 pt-[2px]">
        <p className="text-[12px] font-bold leading-none text-[#131313]">{step.title}</p>
        <p className="pt-[4px] text-[11px] font-normal leading-none text-[#646464]">{step.date}</p>
        {step.summary ? <p className="pt-[5px] text-[11px] font-normal leading-none text-[#646464]">{step.summary}</p> : null}
        {step.bullets ? <ul className="list-disc pt-[4px] pl-[20px] text-[11px] font-normal leading-[14px] text-[#646464]">{step.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
      </div>
    </div>
  );
}

function FollowupsPanel() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] py-[20px]">
      <div className="flex items-center gap-[6px]"><InspectionDetailFollowupIcon /><p className="text-[11px] font-bold uppercase leading-none tracking-[0.55px] text-[#646464]">Historial de seguimientos</p></div>
      <div className="pt-[10px]">{followupSteps.map((step, index) => <FollowupTimelineItem key={step.title} step={step} isLast={index === followupSteps.length - 1} />)}</div>
    </div>
  );
}

function GeneralSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="w-full overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex h-[29px] items-center gap-[6px] border-b border-[#e3e3e3] bg-[#f7f7f7] px-[12px]"><span className="flex h-[10px] w-[12.5px] items-center justify-center">{icon}</span><p className="text-[10px] font-bold uppercase leading-none tracking-[0.5px] text-[#646464]">{title}</p></div>
      {children}
    </section>
  );
}

function GeneralInfoRows({ rows }: { rows: GeneralInfoRow[] }) {
  return <div>{rows.map((row, index) => <div key={row.label} className={`flex items-center justify-between px-[12px] py-[9px] ${index < rows.length - 1 ? 'border-b border-[#e3e3e3]' : ''}`}><p className="text-[12px] font-medium leading-none text-[#646464]">{row.label}</p><p className={`text-right text-[12px] font-bold leading-none text-[#131313] ${row.mono ? "font-['Cousine:Bold',monospace] text-[11px]" : ''}`}>{row.value}</p></div>)}</div>;
}

function GeneralPhotoSection() {
  return (
    <GeneralSection icon={<InspectionDetailCameraIcon />} title="Fotografía general de la inspección">
      <div className="px-[12px] py-[9px]">
        <div className="relative h-[80px] overflow-hidden rounded-[8px] bg-[linear-gradient(165deg,#1e3050_0%,#0f1f35_100%)]">
          <div className="absolute left-[8px] top-[6px] rounded-[4px] bg-[rgba(0,0,0,0.55)] px-[7px] py-[2px]"><p className="text-[9px] font-bold uppercase leading-none tracking-[1.5px] text-white">Foto general</p></div>
          <div className="absolute bottom-[6px] right-[8px] rounded-[4px] bg-[rgba(0,0,0,0.5)] px-[6px] py-[2px]"><p className="text-[9px] font-normal leading-none text-[rgba(255,255,255,0.8)]">dd-mm-aaaa · 00:00</p></div>
        </div>
      </div>
    </GeneralSection>
  );
}

function GeneralObservationSummaryItem({ observation, isLast }: { observation: GeneralObservationSummary; isLast: boolean }) {
  return (
    <div className={`flex flex-col gap-[8px] px-[12px] py-[10px] ${isLast ? '' : 'border-b border-[#e3e3e3]'}`}>
      <div className="flex items-center gap-[8px]"><FindingPill className="bg-[#e6f3ff] text-[#24588b]">{observation.idLabel}</FindingPill><FindingPill className={observation.severityClassName}>{observation.severityLabel}</FindingPill></div>
      <p className="text-[12px] font-normal leading-[16.8px] text-[#131313]">[Descripción realizada por el usuario que levanta la inspección]</p>
      <div className="flex items-center justify-between border-t border-[#e3e3e3] pt-[10px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SLA calculado</p><p className="text-right text-[12px] font-bold leading-none text-[#131313]">xx días hábiles</p></div>
    </div>
  );
}

function GeneralObservationsSection({ title, observations }: { title: string; observations: GeneralObservationSummary[] }) {
  return (
    <GeneralSection icon={<InspectionDetailListIcon />} title={title}>
      <div>{observations.map((observation, index) => <GeneralObservationSummaryItem key={observation.idLabel} observation={observation} isLast={index === observations.length - 1} />)}</div>
    </GeneralSection>
  );
}

function ChecklistGeneralResultSection() {
  return (
    <GeneralSection icon={<InspectionDetailChecklistListIcon className="h-[10px] w-[12.5px]" />} title="Resultado · 25 ítems">
      <div>
        <div className="flex items-center justify-between border-b border-[#e3e3e3] px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">SÍ</p><div className="flex items-center gap-[5px]"><InspectionDetailChecklistYesIcon className="h-[10px] w-[12.5px]" /><p className="text-right text-[12px] font-bold leading-none text-[#2a5c16]">20 ítems conformes</p></div></div>
        <div className="flex items-center justify-between border-b border-[#e3e3e3] px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">NO</p><div className="flex items-center gap-[5px]"><InspectionDetailChecklistNoIcon className="h-[10px] w-[12.5px]" /><p className="text-right text-[12px] font-bold leading-none text-[#570b1d]">1 · obs. registradas</p></div></div>
        <div className="flex items-center justify-between px-[12px] py-[9px]"><p className="text-[12px] font-medium leading-none text-[#646464]">N/A</p><p className="text-right text-[12px] font-bold leading-none text-[#646464]">2 ítems</p></div>
      </div>
    </GeneralSection>
  );
}

function ResponsibleRow({ responsible, isLast }: { responsible: Responsible; isLast: boolean }) {
  return (
    <div className={`flex items-center gap-[10px] px-[12px] py-[10px] ${isLast ? '' : 'border-b border-[#e3e3e3]'}`}>
      <div className={`flex size-[32px] shrink-0 items-center justify-center rounded-[16px] text-[12px] font-bold leading-none ${responsible.avatarClassName}`}>{responsible.initials}</div>
      <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold leading-none text-[#131313]">{responsible.name}</p><p className="pt-[4px] text-[11px] font-normal leading-none text-[#646464]">{responsible.role}</p></div>
      {responsible.current ? <span className="inline-flex h-[16px] items-center rounded-[5px] bg-[#c5fff6] px-[7px] text-[10px] font-bold leading-none text-[#00b398]">Tú</span> : null}
    </div>
  );
}

function GeneralResponsiblesSection({ onReassignClick }: { onReassignClick: () => void }) {
  return (
    <GeneralSection icon={<InspectionDetailPersonIcon />} title="Responsables">
      <GeneralInfoRows rows={[{ label: 'EECC', value: 'GARDE CORPS' }]} />
      <div className="border-t border-[#e3e3e3]">{findingResponsibles.map((responsible, index) => <ResponsibleRow key={`${responsible.name}-${responsible.role}`} responsible={responsible} isLast={index === findingResponsibles.length - 1} />)}</div>
      <div className="border-t border-[#e3e3e3] px-[12px] py-[9px]"><button type="button" onClick={onReassignClick} className="flex h-[42px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-dashed border-[#d1d1d1] bg-[#f7f7f7] px-[2px] text-[12px] font-semibold leading-none text-[#24588b]"><InspectionDetailAssignIcon />Reasignar a otro compañero SOMACOR</button></div>
    </GeneralSection>
  );
}

function FindingGeneralDataPanel({ onReassignClick }: { onReassignClick: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] pt-[14px] pb-[20px]">
      <div className="flex flex-col gap-[12px]">
        <GeneralSection icon={<InspectionDetailPersonIcon />} title="Quién realizó la inspección"><GeneralInfoRows rows={findingInspectorRows} /></GeneralSection>
        <GeneralSection icon={<InspectionDetailLocationIcon />} title="Donde y cuándo"><GeneralInfoRows rows={findingLocationRows} /></GeneralSection>
        <GeneralPhotoSection />
        <GeneralObservationsSection title="Observaciones (4)" observations={findingObservationSummaries} />
        <GeneralResponsiblesSection onReassignClick={onReassignClick} />
      </div>
    </div>
  );
}

function ChecklistGeneralDataPanel({ onReassignClick }: { onReassignClick: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] pt-[14px] pb-[20px]">
      <div className="flex flex-col gap-[12px]">
        <GeneralSection icon={<InspectionDetailPersonIcon />} title="Quién realizó la inspección"><GeneralInfoRows rows={findingInspectorRows} /></GeneralSection>
        <GeneralSection icon={<InspectionDetailLocationIcon />} title="Donde y cuándo"><GeneralInfoRows rows={checklistLocationRows} /></GeneralSection>
        <GeneralPhotoSection />
        <ChecklistGeneralResultSection />
        <GeneralObservationsSection title="Observaciones (1)" observations={checklistObservationSummaries} />
        <GeneralResponsiblesSection onReassignClick={onReassignClick} />
      </div>
    </div>
  );
}

function ReassignSelectionControl({ selected }: { selected: boolean }) {
  if (selected) return <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[11px] border-2 border-[#00b398] bg-[#00b398] text-[12px] font-bold leading-none text-white">✓</span>;
  return <span className="size-[22px] shrink-0 rounded-[11px] border-2 border-[#d1d1d1] bg-white" />;
}

function ReassignOptionRow({ option, selected, isLast, onToggle }: { option: ReassignOption; selected: boolean; isLast: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`flex w-full items-center gap-[10px] px-[16px] py-[12px] text-left ${isLast ? '' : 'border-b border-[#e3e3e3]'}`} onClick={onToggle} aria-pressed={selected}>
      <div className={`flex size-[36px] shrink-0 items-center justify-center rounded-[18px] text-[13px] font-bold leading-none ${option.avatarClassName}`}>{option.initials}</div>
      <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold leading-none text-[#131313]">{option.name}</p><p className="pt-[4px] text-[11px] font-normal leading-none text-[#646464]">{option.area}</p></div>
      <ReassignSelectionControl selected={selected} />
    </button>
  );
}

function ReassignPrompt({ open, selectedIds, onToggle, onCancel, onConfirm }: { open: boolean; selectedIds: string[]; onToggle: (id: string) => void; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-[14px]" role="presentation">
      <div className="w-[332px] max-w-full overflow-hidden rounded-[16px] bg-white px-[14px] pb-[24px] pt-[12px] shadow-[0_4px_14px_rgba(19,19,19,0.24)]" role="dialog" aria-modal="true" aria-labelledby="reassign-title">
        <p id="reassign-title" className="text-[14px] font-bold leading-none text-[#131313]">Reasignar hallazgo · GARDE CORPS</p>
        <div className="mt-[24px] flex max-h-[280px] flex-col overflow-hidden">
          {reassignOptions.map((option, index) => <ReassignOptionRow key={option.id} option={option} selected={selectedIds.includes(option.id)} isLast={index === reassignOptions.length - 1} onToggle={() => onToggle(option.id)} />)}
        </div>
        <div className="mt-[24px] flex gap-[8px]">
          <button type="button" className="flex h-[44px] min-w-0 flex-1 items-center justify-center rounded-[14px] border-2 border-[#c8a064] bg-white px-[20px] py-[2px] text-[13px] font-bold leading-none text-[#c8a064]" onClick={onCancel}>Cancelar</button>
          <button type="button" className="flex h-[44px] min-w-0 flex-1 items-center justify-center rounded-[14px] bg-[#c8a064] px-[12px] py-[13px] text-[15px] font-bold leading-none text-white shadow-[0_2px_5px_rgba(200,160,100,0.3)]" onClick={onConfirm}>Reasignar</button>
        </div>
      </div>
    </div>
  );
}

function EmptyDetailPanel() {
  return <div className="min-h-0 flex-1 bg-white" />;
}

function DetailContent({ activeTab, counts, kind, onReassignClick }: { activeTab: DetailTab; counts: Record<StatusKey, number>; kind: InspectionDetailModalKind; onReassignClick: () => void }) {
  if (activeTab === 'followups') return <FollowupsPanel />;
  if (activeTab === 'general' && kind === 'finding') return <FindingGeneralDataPanel onReassignClick={onReassignClick} />;
  if (activeTab === 'general' && kind === 'checklist') return <ChecklistGeneralDataPanel onReassignClick={onReassignClick} />;
  if (activeTab === 'result' && kind === 'checklist') return <ChecklistResultPanel />;
  if (activeTab === 'observations') return <DetailRows counts={counts} />;
  return <EmptyDetailPanel />;
}

function DownloadPdfButton() {
  return <div className="shrink-0 border-t border-[#e3e3e3] bg-white px-[20px] pb-[14px] pt-[15px]"><button type="button" className="flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[15.5px] py-[1.5px] font-['Inter:Semi_Bold',sans-serif] text-[13px] font-semibold leading-none text-[#333]"><InspectionDetailPdfIcon />Descargar PDF</button></div>;
}

function metadataFor(record: InspectionDetailModalRecord) {
  if (record.metadataLine2) return <div className="font-['Inter:Bold',sans-serif] text-[11px] font-bold leading-none text-[#646464]"><p>{record.metadataLine1}</p><p className="mt-[3px]">{record.metadataLine2}</p></div>;
  return <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold leading-none text-[#646464]">{record.metadataLine1}</p>;
}

function buildDetailMockCounts(record: InspectionDetailModalRecord): Record<StatusKey, number> {
  return {
    executed: Math.max(record.counts?.executed ?? 0, 1),
    open: Math.max(record.counts?.open ?? 0, 2),
    closed: Math.max(record.counts?.closed ?? 0, 1),
    rejected: Math.max(record.counts?.rejected ?? 0, 1),
  };
}

export function InspectionDetailModal({ open, record, onClose }: InspectionDetailModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('observations');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedReassignIds, setSelectedReassignIds] = useState<string[]>(['miguel-pizarro', 'roberto-gonzalez']);
  if (!open || !record) return null;
  const counts: Record<StatusKey, number> = buildDetailMockCounts(record);
  const progressPercent = record.progressPercent ?? 20;
  const toggleReassignOption = (id: string) => setSelectedReassignIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const closeReassignPrompt = () => setReassignOpen(false);

  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.68)]">
      <div className="flex h-full w-full items-center justify-end px-[20px] py-[16px]">
        <section className="relative flex h-[calc(100vh-32px)] max-h-[692px] w-[360px] max-w-[calc(100vw-40px)] flex-col justify-between overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]" role="dialog" aria-modal="true" aria-labelledby="inspection-detail-title">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 rounded-t-[16px] bg-white px-[14px] py-[12px]"><div className="flex items-center gap-[12px]"><div className="min-w-0 flex-1 font-['Inter:Bold',sans-serif] font-bold"><p className="whitespace-nowrap text-[13px] leading-none text-[#001e39]">{record.id}</p><h2 id="inspection-detail-title" className="mt-[5px] text-[16px] font-bold leading-[22px] tracking-[0.32px] text-[#2a2a2a]">{record.title}</h2><div className="mt-[4px]">{metadataFor(record)}</div></div><button type="button" className="flex size-[32px] shrink-0 items-center justify-center" onClick={onClose} aria-label="Cerrar detalle"><InspectionDetailCloseIcon /></button></div></div>
            <ProgressSummary counts={counts} progressPercent={progressPercent} />
            <Tabs kind={record.kind} activeTab={activeTab} onChange={setActiveTab} />
            <DetailContent activeTab={activeTab} counts={counts} kind={record.kind} onReassignClick={() => setReassignOpen(true)} />
          </div>
          <DownloadPdfButton />
          <ReassignPrompt open={reassignOpen} selectedIds={selectedReassignIds} onToggle={toggleReassignOption} onCancel={closeReassignPrompt} onConfirm={closeReassignPrompt} />
        </section>
      </div>
    </div>
  );
}
