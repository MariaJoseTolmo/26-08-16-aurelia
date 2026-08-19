import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IncidentRiskLevel } from '@aurelia/contracts';

interface IncidentFormScreenProps {
  defaultRisk: IncidentRiskLevel;
}

export function IncidentFormScreen({ defaultRisk }: IncidentFormScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro de incidente</Text>
      <Text style={styles.label}>Nivel de riesgo por defecto: {defaultRisk}</Text>
      <View style={styles.placeholder}>
        <Text>Formulario, captura de foto y GPS (pendiente).</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 64, gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  label: { fontSize: 14, color: '#475569' },
  placeholder: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
});
