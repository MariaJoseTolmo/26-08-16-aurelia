import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontWeight } from '../../theme/tokens';
import { SparklesMark } from '../icons/SparklesMark';

interface AiProposalCardProps {
  suggestion: string;
  fallback?: boolean;
  onAccept: () => void;
  onEdit: () => void;
  accepted?: boolean;
}

export function AiProposalCard({
  suggestion,
  onAccept,
  onEdit,
  accepted = false,
}: AiProposalCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SparklesMark size={11} color="#8E6E3E" />
        <Text style={styles.headerTitle}>Medida correctiva sugerida</Text>
      </View>

      <Text style={styles.suggestion}>{suggestion}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={accepted}
          onPress={onAccept}
          style={[styles.acceptButton, accepted && styles.disabled]}
        >
          <Text style={styles.acceptText}>Aceptar medida</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={accepted}
          onPress={onEdit}
          style={[styles.editButton, accepted && styles.disabled]}
        >
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    marginLeft: 33,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderColor: '#C8A064',
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#C8A064',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAE8C8',
    borderBottomColor: 'rgba(200,160,100,0.25)',
    borderBottomWidth: 1,
  },
  headerTitle: {
    color: '#8E6E3E',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingTop: 12,
    color: '#131313',
    fontSize: 13,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    height: 38,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B398',
    borderColor: '#00B398',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  acceptText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  editButton: {
    height: 38,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderColor: '#C8A064',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  editText: {
    color: '#8E6E3E',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  disabled: {
    opacity: 0.55,
  },
});