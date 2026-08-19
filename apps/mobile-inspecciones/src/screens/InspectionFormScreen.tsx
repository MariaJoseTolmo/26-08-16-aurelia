import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { InspectionType } from '@aurelia/contracts';

interface InspectionFormScreenProps {
  defaultType: InspectionType;
}

export function InspectionFormScreen({ defaultType }: InspectionFormScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro de inspección</Text>
      <Text style={styles.label}>Tipo por defecto: {defaultType}</Text>
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
