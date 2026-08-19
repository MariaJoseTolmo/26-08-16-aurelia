import { StatusBar } from 'expo-status-bar';
import { InspectionType } from '@aurelia/contracts';
import { InspectionFormScreen } from './screens/InspectionFormScreen';

export default function App() {
  // Ejemplo de consumo de un enum compartido desde @aurelia/contracts.
  const defaultType = InspectionType.ROUTINE;

  return (
    <>
      <StatusBar style="auto" />
      <InspectionFormScreen defaultType={defaultType} />
    </>
  );
}
