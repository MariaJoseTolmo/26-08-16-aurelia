import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InspectionType } from '@aurelia/contracts';
import { colors, fontWeight, radius } from '../../theme/tokens';
import { useMobileInspectionAssignmentScope } from '../../stores/mobileInspectionAssignmentScope.store';
import { useManualInspectionDraft } from '../../../modules/inspection/manualInspection.store';
import { SparklesMark } from '../icons/SparklesMark';
import { SavedObservationCard } from './SlaConfirmWidget';

interface Props {
  text: string;
  html?: boolean;
  time?: string;
}

interface AssistantCopyContext {
  inspectorName: string;
  areaName: string | null;
  sectorName: string | null;
  inspectionType: InspectionType;
  findingCompanyName: string | null;
}

interface FindingDecisionSnapshot {
  observationId: string;
  savedCount: number;
}

const findingDecisionPrompt = '¿Deseas agregar otra observación o continuar con empresa y personal?';

function canonicalAssistantText(text: string, context: AssistantCopyContext): string {
  const normalized = text.trim();
  const area = context.areaName ?? 'el área';
  const location = [context.areaName, context.sectorName].filter(Boolean).join(' · ');
  const itemCount = normalized.match(/^Responderemos (\d+) ítems\.$/)?.[1];

  if (normalized === 'Hola, soy AurelIA. ¿En qué área estás hoy?') {
    return `¡Hola, **${context.inspectorName}**! 👋 Soy AurelIA. Voy a ayudarte a registrar esta inspección de forma rápida. ¿En qué **área** estás hoy?`;
  }
  if (normalized === 'Selecciona el sector.') {
    return `Perfecto, **${area}** ✓. Ahora el sector — ¿en cuál específicamente?`;
  }
  if (normalized === 'Selecciona el tipo de inspección.') {
    return `**${location || 'Área · sector'} ✓**. ¿Qué tipo de inspección es?`;
  }
  if (normalized === 'Selecciona la fecha de inspección.') return 'Selecciona la **fecha de inspección**.';
  if (normalized === 'Capturemos la ubicación obligatoria.') return 'Capturemos la **ubicación obligatoria**.';
  if (normalized === 'Selecciona el tipo de hallazgo.') return 'Selecciona el **tipo de hallazgo**.';

  if (normalized === 'Te sugiero esta plantilla normativa.') return 'Te sugiero esta **plantilla normativa**.';
  if (normalized === 'Elige una plantilla.') return 'Elige una **plantilla normativa**.';
  if (normalized === 'Adjunta la foto general obligatoria.') return 'Adjunta la **foto general obligatoria**.';
  if (itemCount) return `Responderemos **${itemCount} ítems**.`;
  if (normalized === 'Describe la condición detectada.' && context.inspectionType === InspectionType.REGULATORY) {
    return 'Describe la **condición detectada**.';
  }
  if (normalized === 'Indica la medida correctiva propuesta.') return 'Indica la **medida correctiva propuesta**.';
  if (normalized === 'Adjunta foto para este hallazgo.') return 'Adjunta una **foto para este hallazgo**.';
  if (normalized === 'Checklist completo sin hallazgos. Se cerrará automáticamente al guardar.') {
    return 'Checklist completo **sin hallazgos**. Se cerrará automáticamente al guardar.';
  }
  if (normalized === 'Hay ítems no conformes. Debemos asignar empresa y responsables.') {
    return 'Hay **ítems no conformes**. Debemos asignar empresa y responsables.';
  }
  if (normalized === 'Selecciona empresa responsable de los hallazgos.') {
    if (context.inspectionType === InspectionType.REGULATORY) {
      return 'Te sugiero una **empresa responsable** según el área, sector y empresas disponibles.';
    }
    return 'Selecciona la **empresa responsable de los hallazgos**.';
  }
  if (normalized === 'Te sugiero una empresa responsable según el área, sector y empresas disponibles.') {
    return 'Te sugiero una **empresa responsable** según el área, sector y empresas disponibles.';
  }

  if (normalized === 'Describe la condición detectada.' && context.inspectionType === InspectionType.ENVIRONMENTAL) {
    return `Cuéntame la condición subestándar que detectaste en **${location || 'el área inspeccionada'}**.`;
  }
  if (normalized === 'Adjunta fotografía del hallazgo.') return 'Entendido. Adjunta una foto del hallazgo:';
  if (normalized === 'Analicé el contexto del hallazgo. Te propongo una medida correctiva.') {
    return `Foto recibida ✓. Analicé el historial de **${area}** y te propongo una medida correctiva.`;
  }
  if (normalized === 'Definamos la criticidad del hallazgo.') return 'Definamos la **criticidad del hallazgo**.';
  if (normalized === 'Confirma el SLA para esta observación.') return 'Confirma el **SLA para esta observación**.';
  if (normalized === findingDecisionPrompt) {
    return '¿Agregar otra observación o continuamos con la empresa?';
  }
  if (normalized === 'Te sugiero una empresa responsable para este hallazgo.') {
    return `Basándome en el historial de **${location || area}**, te propongo:`;
  }
  if (normalized.startsWith('Para ') && normalized.includes('sugiero este personal. Selecciona uno o más:')) {
    return `Para **${context.findingCompanyName ?? 'la empresa seleccionada'}**, sugiero este personal. Selecciona uno o más:`;
  }
  if (normalized === 'Revisa el resumen antes de guardar.') return '¡Listo! Revisa el **resumen** antes de guardar:';
  if (normalized === '¡Listo! Revisa el resumen antes de guardar:') return '¡Listo! Revisa el **resumen** antes de guardar:';

  return text;
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  return (
    <Text style={styles.text}>
      {parts.map((part, index) => {
        const strong = part.startsWith('**') && part.endsWith('**');
        const value = strong ? part.slice(2, -2) : part;
        return <Text key={`${index}-${value}`} style={strong ? styles.strong : undefined}>{value}</Text>;
      })}
    </Text>
  );
}

function AssistantBubble({ text, time }: { text: string; time: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}><SparklesMark size={10} color={colors.navy} /></View>
      <View style={styles.bubble}>
        <FormattedText text={text} />
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

export function BotBubble({ text, time }: Props) {
  const canSelectCompany = useMobileInspectionAssignmentScope((state) => state.canSelectCompany);
  const inspectorName = useManualInspectionDraft((state) => state.inspectorName);
  const areaName = useManualInspectionDraft((state) => state.areaName);
  const sectorName = useManualInspectionDraft((state) => state.sectorName);
  const inspectionType = useManualInspectionDraft((state) => state.inspectionType);
  const findingCompanyName = useManualInspectionDraft((state) => state.findingCompanyName);
  const findingObservations = useManualInspectionDraft((state) => state.findingObservations);
  const decisionSnapshot = React.useRef<FindingDecisionSnapshot | null>(null);
  const normalized = text.trim();
  const isFindingDecision = normalized === findingDecisionPrompt;
  const hiddenForAssignedCompany = !canSelectCompany && [
    'Te sugiero una empresa responsable para este hallazgo.',
    'Te sugiero una empresa responsable según el área, sector y empresas disponibles.',
    'Selecciona empresa responsable de los hallazgos.',
    'Selecciona empresa responsable.',
  ].includes(normalized);
  const displayText = canonicalAssistantText(text, {
    inspectorName,
    areaName,
    sectorName,
    inspectionType,
    findingCompanyName,
  });
  const now = new Date();
  const timeStr = time ?? `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (isFindingDecision && !decisionSnapshot.current) {
    const savedObservations = findingObservations.filter((item) => item.saved);
    const latest = savedObservations[savedObservations.length - 1];
    if (latest) {
      decisionSnapshot.current = {
        observationId: latest.id,
        savedCount: savedObservations.length,
      };
    }
  }

  if (hiddenForAssignedCompany) return null;

  if (isFindingDecision && decisionSnapshot.current) {
    const { observationId, savedCount } = decisionSnapshot.current;
    const countLabel = savedCount === 1 ? 'observación' : 'observaciones';
    return (
      <>
        <AssistantBubble
          text={`Llevas **${savedCount} ${countLabel}**. Revisa antes de continuar:`}
          time={timeStr}
        />
        <SavedObservationCard observationId={observationId} />
        <AssistantBubble text={displayText} time={timeStr} />
      </>
    );
  }

  return <AssistantBubble text={displayText} time={timeStr} />;
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    maxWidth: '100%',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: 286,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  text: {
    fontSize: 15,
    color: '#131313',
    lineHeight: 22,
    fontWeight: fontWeight.regular,
  },
  strong: { fontWeight: fontWeight.bold },
  time: {
    fontSize: 12,
    color: '#ACACAC',
    marginTop: 7,
    lineHeight: 13,
  },
});