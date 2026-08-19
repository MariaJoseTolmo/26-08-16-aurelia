import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../shared/stores/session.store';
import { SprDiscrepancyCorrectionSummary } from './components/SprDiscrepancyCorrectionSummary';
import { SprReopenProcessAlertBanner } from './components/SprReopenProcessAlertBanner';
import { SprSubmitModal } from './components/SprSubmitModal';
import {
  SprAttachDocumentIcon,
  SprExcelFileIcon,
  SprFooterInfoIcon,
  SprInfoCircleIcon,
  SprPdfFileIcon,
  SprSaveDraftIcon,
  SprSoxShieldIcon,
  SprSubmitIcon,
  SprTraceabilityIcon,
} from './icons/SprIcons';
import {
  SPR_ACTIVE_CYCLE,
  SPR_DISCREPANCY_CORRECTION,
  SPR_MOCK_ATTACHMENTS,
} from './spr.constants';
import { SPR_CYCLE_TRACEABILITY_ROUTE } from './sprCycleTraceability.constants';
import { getSprFormDataSourcesForArea, SPR_FORM_FLOW_COPY } from './sprFormFlow.constants';

const copy = SPR_DISCREPANCY_CORRECTION;
const parameter = copy.parameterToEdit;

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="font-['Inter:Bold',sans-serif] text-[10px] font-bold text-[#131313]">
      {children}
      {required ? <span className="text-[#bd3b5b]"> *</span> : null}
    </p>
  );
}

function AttachmentIcon({ type }: { type: 'pdf' | 'excel' }) {
  if (type === 'pdf') return <SprPdfFileIcon className="h-[11px] w-[13.75px] text-[#24588b]" />;
  return <SprExcelFileIcon className="h-[11px] w-[13.75px] text-[#24588b]" />;
}

// Vista de corrección tras reapertura por discrepancia (Figma 1760:27773).
export function SprDiscrepancyCorrectionView() {
  const navigate = useNavigate();
  const areaName = useSessionStore((state) => state.user?.areaName ?? null);
  const dataSources = useMemo(() => getSprFormDataSourcesForArea(areaName), [areaName]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [value, setValue] = useState('');
  const [notApplicable, setNotApplicable] = useState(false);
  const [source, setSource] = useState<string>(parameter.defaultSource);
  const [note, setNote] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isComplete = useMemo(
    () => notApplicable || (value.trim() !== '' && source.trim() !== ''),
    [notApplicable, source, value],
  );

  const footerMessage = saveMessage
    ? saveMessage
    : isComplete
      ? copy.footerReady
      : copy.footerIncomplete;

  function handleSaveDraft() {
    setIsSaving(true);
    setSaveMessage(null);
    window.setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Borrador guardado localmente (demo).');
    }, 400);
  }

  async function handleConfirmSubmit() {
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      navigate(SPR_DISCREPANCY_CORRECTION.submittedDemoHref);
    } finally {
      setIsSubmitting(false);
      setSubmitModalOpen(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-[#f7f7f7]">
      {!bannerDismissed ? <SprReopenProcessAlertBanner onDismiss={() => setBannerDismissed(true)} /> : null}

      <div className="flex items-center justify-between border-b border-[#e3e3e3] bg-white px-[20px] py-[10px]">
        <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#001e39]">
          {copy.toolbarTitle(SPR_ACTIVE_CYCLE.label)}
          <span className="font-['Inter:Regular',sans-serif] text-[#acacac]"> {copy.toolbarRequiredHint}</span>
        </p>
        <button
          type="button"
          onClick={() => navigate(SPR_CYCLE_TRACEABILITY_ROUTE)}
          className="flex h-[26px] items-center gap-[5px] rounded-[6px] border border-[#e3e3e3] bg-white px-[11px] font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#24588b] hover:bg-[#fafafa]"
        >
          <SprTraceabilityIcon className="h-[11px] w-[13.75px] shrink-0" />
          Ver trazabilidad
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(240px,268px)_1fr]">
        <aside className="flex min-h-0 flex-col overflow-y-auto border-b border-[#e3e3e3] bg-white lg:border-b-0 lg:border-r">
          <div className="flex flex-col justify-between px-[12px] py-[14px]">
            <div>
              <p className="font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
                {copy.parametersTitle}
              </p>
              <div className="mt-[8px] flex items-center gap-[7px] rounded-[7px] border border-[#bd3b5b] bg-[#f6faff] p-[9px]">
                <span className="mt-[2px] size-[8px] shrink-0 rounded-[4px] bg-[#bd3b5b]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-['Inter:Semi_Bold',sans-serif] text-[10.5px] font-semibold text-[#131313]">
                    {copy.kpiToCorrect.name}
                  </p>
                  <p className="pt-px font-['Inter:Regular',sans-serif] text-[9.5px] text-[#646464]">
                    {copy.kpiToCorrect.valueLabel}
                  </p>
                </div>
                <span className="shrink-0 rounded-[3px] bg-[#ffeab8] px-[5px] py-px font-['Inter:Bold',sans-serif] text-[8px] font-bold text-[#8e6e3e]">
                  SOX
                </span>
              </div>
            </div>

            <div className="pt-[8px]">
              <div className="flex items-start gap-[8px] rounded-[8px] border border-[#f0d080] bg-[#fff8e1] px-[14px] py-[11px]">
                <SprInfoCircleIcon className="mt-px size-[16px] shrink-0 text-[#5c3c00]" />
                <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#5c3c00]">
                  {copy.uploadTip}
                </p>
              </div>

              <p className="pt-[12px] font-['Inter:Bold',sans-serif] text-[9px] font-bold uppercase tracking-[0.72px] text-[#acacac]">
                Documentación adjunta
              </p>
              <ul className="flex flex-col">
                {SPR_MOCK_ATTACHMENTS.map((attachment, index) => (
                  <li key={attachment.name} className={index === 0 ? 'pt-[7px]' : 'pt-[4px]'}>
                    <div className="flex items-center gap-[7px] rounded-[6px] bg-[#f9fafb] px-[8px] py-[6px]">
                      <div className="flex size-[24px] shrink-0 items-center justify-center rounded-[5px] bg-[#e6f3ff]">
                        <AttachmentIcon type={attachment.type} />
                      </div>
                      <span className="min-w-0 flex-1 truncate font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#131313]">
                        {attachment.name}
                      </span>
                      <span className="shrink-0 font-['Inter:Regular',sans-serif] text-[9px] text-[#acacac]">
                        {attachment.size}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="mt-[4px] flex w-full flex-col items-center rounded-[7px] border-[1.5px] border-dashed border-[#d1d1d1] p-[11.5px] text-center transition-colors hover:border-[#acacac] hover:bg-[#fafafa]"
                title="Pendiente de integración con evidencias"
              >
                <SprAttachDocumentIcon className="h-[16px] w-[20px] shrink-0 text-[#acacac]" />
                <p className="pt-[4px] font-['Inter:Semi_Bold',sans-serif] text-[10px] font-semibold text-[#646464]">
                  Adjuntar documento
                </p>
                <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[9.5px] text-[#acacac]">
                  PDF, Excel, Word · Máx. 10 MB
                </p>
              </button>
            </div>
          </div>
        </aside>

        <section className="min-h-0 overflow-y-auto bg-[#fafbfc]">
          <div className="flex flex-col gap-[14px] px-[22px] py-[18px]">
            <SprDiscrepancyCorrectionSummary />

            <div className="flex flex-col gap-[14px]">
              <div>
                <p className="font-['Inter:Semi_Bold',sans-serif] text-[9.5px] font-semibold text-[#acacac]">
                  Parámetro seleccionado
                </p>
                <h2 className="pt-[3px] font-['Inter:Bold',sans-serif] text-[17px] font-bold text-[#001e39]">
                  {parameter.name}
                </h2>
                <p className="pt-[2px] font-['Inter:Regular',sans-serif] text-[10px] text-[#646464]">{parameter.subtitle}</p>
              </div>

              <div className="flex flex-col gap-[5px]">
                <FieldLabel required>Valor reportado</FieldLabel>
                <div className="flex items-center gap-[8px]">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    disabled={notApplicable}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder={parameter.valuePlaceholder}
                    className="h-[38px] flex-1 rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-[#e6f3ff] px-[13.5px] font-['Inter:Semi_Bold',sans-serif] text-[13px] font-semibold text-[#131313] outline-none placeholder:font-normal placeholder:text-[#acacac] focus:border-[#24588b] disabled:bg-[#f2f2f2] disabled:text-[#acacac]"
                  />
                  <span className="min-w-[40px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464]">
                    {parameter.unit}
                  </span>
                </div>
                <p className="font-['Inter:Regular',sans-serif] text-[10px] text-[#acacac]">
                  Ingresa el valor numérico o texto como &quot;0&quot;, &quot;No aplica&quot;, &quot;Sin consumo&quot;
                </p>
              </div>

              <label className="flex items-center gap-[8px] rounded-[8px] border border-[#e3e3e3] bg-[#f7f7f7] px-[13px] py-[10px]">
                <input
                  type="checkbox"
                  checked={notApplicable}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setNotApplicable(checked);
                    if (checked) {
                      setValue('');
                      setSource('');
                    }
                  }}
                  className="size-[16px] shrink-0 rounded-[4px] border-[1.5px] border-[#d1d1d1]"
                />
                <span className="flex flex-col">
                  <span className="font-['Inter:Semi_Bold',sans-serif] text-[11px] font-semibold text-[#646464]">
                    Sin consumo / No aplica en este período
                  </span>
                  <span className="font-['Inter:Regular',sans-serif] text-[9.5px] text-[#acacac]">
                    {SPR_FORM_FLOW_COPY.noAplicaHelper}
                  </span>
                </span>
              </label>

              {!notApplicable ? (
                <div className="flex flex-col gap-[5px]">
                  <FieldLabel required>Fuente del dato</FieldLabel>
                  <select
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className="h-[36px] w-full rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[11px] font-['Inter:Regular',sans-serif] text-[12px] text-[#131313] outline-none focus:border-[#24588b]"
                  >
                    <option value="">Selecciona una fuente…</option>
                    {dataSources.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="flex flex-col gap-[5px]">
                <FieldLabel>{SPR_FORM_FLOW_COPY.notesLabel}</FieldLabel>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder={SPR_FORM_FLOW_COPY.notesPlaceholder}
                  className="w-full resize-none rounded-[8px] border-[1.5px] border-[#d1d1d1] bg-white px-[13.5px] py-[10.5px] font-['Inter:Regular',sans-serif] text-[12px] text-[#131313] outline-none focus:border-[#24588b]"
                />
              </div>

              <div className="flex items-start gap-[8px] rounded-[8px] border border-[#f0d080] bg-[#fff8e1] px-[14px] py-[11px]">
                <SprSoxShieldIcon className="mt-[1px] size-[16px] shrink-0 text-[#5c3c00]" />
                <p className="font-['Inter:Regular',sans-serif] text-[10.5px] leading-[15.75px] text-[#5c3c00]">
                  {copy.soxNotice}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[#e3e3e3] bg-white px-[22px] py-[12px]">
        <div className="flex items-center gap-[6px]">
          <SprFooterInfoIcon className="h-[11px] w-[13.75px] shrink-0 text-[#646464]" />
          <p className={`font-['Inter:Regular',sans-serif] text-[11px] ${saveMessage ? 'text-[#24588b]' : 'text-[#646464]'}`}>
            {footerMessage}
          </p>
        </div>
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex h-[36px] items-center gap-[6px] rounded-[8px] border-[1.5px] border-[#e3e3e3] bg-white px-[19.5px] font-['Inter:Semi_Bold',sans-serif] text-[12px] font-semibold text-[#646464] transition-colors hover:bg-[#fafafa] disabled:opacity-50"
          >
            <SprSaveDraftIcon className="h-[12px] w-[15px] shrink-0 text-[#646464]" />
            {isSaving ? 'Guardando…' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            onClick={() => isComplete && setSubmitModalOpen(true)}
            disabled={!isComplete || isSubmitting}
            className={`flex h-[36px] items-center gap-[6px] rounded-[8px] px-[22px] font-['Inter:Bold',sans-serif] text-[12px] font-bold transition-colors ${
              isComplete
                ? 'bg-[#c8a064] text-[#001e39] hover:bg-[#b89158]'
                : 'cursor-not-allowed bg-[#e3e3e3] text-[#acacac]'
            }`}
          >
            <SprSubmitIcon className={`h-[13px] w-[16.25px] shrink-0 ${isComplete ? 'text-[#001e39]' : 'text-[#acacac]'}`} />
            {isSubmitting ? 'Enviando…' : 'Firmar y enviar'}
          </button>
        </div>
      </div>

      <SprSubmitModal
        open={submitModalOpen}
        variant="correction"
        summary={{
          completedCount: isComplete ? 1 : 0,
          totalCount: 1,
          attachmentCount: SPR_MOCK_ATTACHMENTS.length,
          soxParameterCount: 1,
        }}
        isSubmitting={isSubmitting}
        onClose={() => setSubmitModalOpen(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}
