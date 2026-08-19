import { useState } from 'react';
import {
  SprExcelFileIcon,
  SprFooterInfoIcon,
  SprPdfFileIcon,
  SprWarningTriangleIcon,
} from '../icons/SprIcons';
import {
  SPR_CONSOLIDATED_REPORT,
  SPR_MOCK_ATTACHMENTS,
} from '../spr.constants';
import { SprDiscrepancyCorrectionSummary } from './SprDiscrepancyCorrectionSummary';

const copy = SPR_CONSOLIDATED_REPORT.validacionDiscrepancia;
const attachments = Array.from(SPR_MOCK_ATTACHMENTS);

type DetailTabId = 'parameters' | 'discrepancy' | 'files';

function AttachmentIcon({ type }: { type: 'pdf' | 'excel' }) {
  if (type === 'pdf') return <SprPdfFileIcon className="h-[11px] w-[13.75px] text-[#24588b]" />;
  return <SprExcelFileIcon className="h-[11px] w-[13.75px] text-[#24588b]" />;
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[5px]">
      <p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]">{label}</p>
      <div className="rounded-[8px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] px-[13px] py-[10px]">
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464]">{value}</p>
      </div>
    </div>
  );
}

// Figma 1760:24680 — detalle del formulario del responsable (vista especialista, solo lectura).
export function SprConsolidatedDiscrepancyDetailView({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<DetailTabId>('discrepancy');

  const tabs: { id: DetailTabId; label: string }[] = [
    { id: 'parameters', label: copy.detailTabParameters },
    { id: 'discrepancy', label: copy.detailTabDiscrepancy },
    { id: 'files', label: copy.detailTabFiles },
  ];

  return (
    <div className="flex min-h-[560px] overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
      <aside className="w-[220px] shrink-0 border-r border-[#e3e3e3] bg-[#f7f7f7]">
        <button
          type="button"
          className="w-full border-b border-[#e3e3e3] bg-[#e6f3ff] px-[12px] py-[10px] text-left"
        >
          <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.5px] text-[#0d3862]">
            {copy.areaServiciosLabel}
          </p>
          <p className="pt-[2px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#570b1d]">
            {copy.areaListDiscrepancyLabel}
          </p>
        </button>
        <div className="px-[12px] py-[10px]">
          <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.5px] text-[#acacac]">
            {copy.areaOptimizacionLabel}
          </p>
          <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">
            {copy.areaListNoCasesLabel}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-[#fafbfc]">
        <div className="min-h-0 flex-1 overflow-y-auto p-[18px]">
          <button
            type="button"
            onClick={onBack}
            className="mb-[12px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#24588b] hover:underline"
          >
            {copy.detailBackLabel}
          </button>

          <div className="overflow-hidden rounded-[9px] border border-[#e3e3e3] bg-white">
            <div className="bg-[#001e39] px-[16px] py-[10px]">
              <p className="font-['Inter:Bold',sans-serif] text-[11px] font-bold uppercase tracking-[0.55px] text-white">
                {copy.detailAreaBanner}
              </p>
            </div>

            <div className="border-b border-[#e3e3e3] px-[16px] py-[12px]">
              <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#001e39]">
                {copy.detailGeneralInfoTitle}
              </p>
              <p className="pt-[4px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                {copy.detailMetaLabel}
              </p>
            </div>

            <div className="flex border-b border-[#e3e3e3]">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-[16px] py-[10px] font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold ${
                      isActive ? 'text-[#001e39]' : 'text-[#646464]'
                    }`}
                  >
                    {tab.label}
                    {isActive ? (
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-[#c8a064]" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="p-[16px]">
              {activeTab === 'parameters' ? (
                <div className="flex flex-col gap-[14px]">
                  <div>
                    <p className="font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold text-[#acacac]">
                      {copy.detailParameterSectionLabel}
                    </p>
                    <h2 className="pt-[3px] font-['Inter:Bold',sans-serif] text-[17px] font-bold text-[#001e39]">
                      {copy.detailParameterName}
                    </h2>
                    <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                      {copy.detailParameterSubtitle}
                    </p>
                  </div>
                  <div className="flex flex-col gap-[5px]">
                    <p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]">
                      {copy.detailValueLabel}
                    </p>
                    <div className="flex items-center gap-[8px]">
                      <div className="h-[38px] flex-1 rounded-[8px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] px-[13px]">
                        <p className="pt-[9px] font-['Inter:Semi_Bold',sans-serif] text-[13px] font-semibold text-[#131313]">
                          {copy.detailValue}
                        </p>
                      </div>
                      <span className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464]">
                        {copy.detailValueUnit}
                      </span>
                    </div>
                  </div>
                  <ReadonlyField label={copy.detailSourceLabel} value={copy.detailSourceValue} />
                  <ReadonlyField label={copy.detailNoteLabel} value={copy.detailNoteValue} />
                </div>
              ) : null}

              {activeTab === 'discrepancy' ? (
                <div className="flex flex-col gap-[14px]">
                  <div className="flex items-center gap-[7px]">
                    <SprWarningTriangleIcon className="h-[12px] w-[15px] shrink-0 text-[#bd3b5b]" />
                    <p className="font-['Inter:Bold',sans-serif] text-[12px] font-bold text-[#001e39]">
                      {copy.detailSectionTitle}
                    </p>
                  </div>

                  <SprDiscrepancyCorrectionSummary />

                  <div className="flex flex-col gap-[14px] rounded-[8px] border border-[#e3e3e3] bg-white p-[14px]">
                    <div>
                      <p className="font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold text-[#acacac]">
                        {copy.detailParameterSectionLabel}
                      </p>
                      <h2 className="pt-[3px] font-['Inter:Bold',sans-serif] text-[17px] font-bold text-[#001e39]">
                        {copy.detailParameterName}
                      </h2>
                      <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">
                        {copy.detailParameterSubtitle}
                      </p>
                    </div>
                    <div className="flex flex-col gap-[5px]">
                      <p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]">
                        {copy.detailValueLabel}
                      </p>
                      <div className="flex items-center gap-[8px]">
                        <div className="h-[38px] flex-1 rounded-[8px] border-[1.5px] border-[#e3e3e3] bg-[#f7f7f7] px-[13px]">
                          <p className="pt-[9px] font-['Inter:Semi_Bold',sans-serif] text-[13px] font-semibold text-[#131313]">
                            {copy.detailValue}
                          </p>
                        </div>
                        <span className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464]">
                          {copy.detailValueUnit}
                        </span>
                      </div>
                    </div>
                    <ReadonlyField label={copy.detailSourceLabel} value={copy.detailSourceValue} />
                    <ReadonlyField label={copy.detailNoteLabel} value={copy.detailNoteValue} />
                  </div>
                </div>
              ) : null}

              {activeTab === 'files' ? (
                <div className="flex flex-col gap-[8px]">
                  {attachments.length === 0 ? (
                    <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#acacac]">
                      {copy.detailFilesEmpty}
                    </p>
                  ) : (
                    attachments.map((attachment) => (
                      <div
                        key={attachment.name}
                        className="flex items-center gap-[10px] rounded-[8px] border border-[#e3e3e3] bg-[#f9fafb] px-[12px] py-[10px]"
                      >
                        <div className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] bg-[#e6f3ff]">
                          <AttachmentIcon type={attachment.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#131313]">
                            {attachment.name}
                          </p>
                          <p className="pt-px font-['Inter:Regular',sans-serif] text-[9.5px] text-[#646464]">
                            {attachment.size}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-[6px] border-t border-[#e3e3e3] bg-white px-[18px] py-[12px]">
          <SprFooterInfoIcon className="h-[11px] w-[13.75px] shrink-0 text-[#646464]" />
          <p className="font-['Inter:Regular',sans-serif] text-[10.5px] text-[#646464]">{copy.detailFooterNotice}</p>
        </div>
      </div>
    </div>
  );
}
