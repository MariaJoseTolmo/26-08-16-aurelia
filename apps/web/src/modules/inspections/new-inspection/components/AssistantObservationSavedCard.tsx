import type { NewInspectionFindingObservationDraft } from '../state/newInspectionDraft.store';

interface AssistantObservationSavedCardProps {
  observation: NewInspectionFindingObservationDraft | null;
  index: number;
  onRemove: () => void;
}

function parseDays(label: string | null | undefined) {
  return label?.match(/(\d+)/)?.[1] ?? '7';
}

export function AssistantObservationSavedCard({ observation, index, onRemove }: AssistantObservationSavedCardProps) {
  if (!observation) return null;
  return (
    <div className="assistant-observation-card">
      <div className="assistant-observation-card__body">
        <span className="assistant-observation-card__badge">Obs. {index}</span>
        <div className="assistant-observation-card__content">
          <p className="assistant-observation-card__title">{observation.detectedCondition || 'Observación registrada'}</p>
          <div className="assistant-observation-card__meta">
            <span className="assistant-observation-card__severity">{observation.severityLabel ?? 'Manual'} · {parseDays(observation.severityClosureTimeLabel)}d</span>
            <span className="assistant-observation-card__source">Manual</span>
            {observation.evidence ? <span className="assistant-observation-card__evidence">▣ ✓</span> : null}
          </div>
        </div>
        <button type="button" className="assistant-observation-card__remove" onClick={onRemove} aria-label="Eliminar observación">⌫</button>
      </div>
    </div>
  );
}
