import { IncidentRiskLevel } from '@aurelia/contracts';
import { Placeholder } from '../../shared/components/Placeholder';

const riskLevels = Object.values(IncidentRiskLevel);

export function IncidentsPage() {
  return (
    <div>
      <Placeholder title="Incidentes" description="Registro y seguimiento de incidentes ambientales." />
      <ul>
        {riskLevels.map((level) => (
          <li key={level}>{level}</li>
        ))}
      </ul>
    </div>
  );
}
