import { StatusBar } from 'expo-status-bar';
import { IncidentRiskLevel } from '@aurelia/contracts';
import { IncidentFormScreen } from './screens/IncidentFormScreen';

export default function App() {
  // Ejemplo de consumo de un enum compartido desde @aurelia/contracts.
  const defaultRisk = IncidentRiskLevel.MEDIUM;

  return (
    <>
      <StatusBar style="auto" />
      <IncidentFormScreen defaultRisk={defaultRisk} />
    </>
  );
}
