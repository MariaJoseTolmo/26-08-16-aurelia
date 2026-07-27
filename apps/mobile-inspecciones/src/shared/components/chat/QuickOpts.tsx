import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme/tokens';
import { ChatDateWidget } from './ChatDateWidget';

export type QuickOptVariant = 'default' | 'selected' | 'teal' | 'disabled';
type QuickIcon = 'search' | 'clipboard-check' | 'plus' | 'arrow-right' | 'list' | 'check' | 'pen';

interface QuickOptProps {
  label: string;
  icon?: string;
  variant?: QuickOptVariant;
  fullWidth?: boolean;
  onPress?: () => void;
}

function getIconColor(variant: QuickOptVariant) {
  if (variant === 'selected' || variant === 'teal') return colors.white;
  if (variant === 'disabled') return colors.muted;
  return colors.blueLink;
}

function iconName(icon: string | undefined, label: string): QuickIcon | null {
  const normalizedLabel = label.toLowerCase();
  if (icon === 'clipboard-check' || normalizedLabel.includes('checklist')) return 'clipboard-check';
  if (icon === 'plus' || normalizedLabel.includes('agregar')) return 'plus';
  if (icon === 'arrow-right' || normalizedLabel.includes('continuar') || normalizedLabel.includes('pasar')) return 'arrow-right';
  if (icon === 'list' || normalizedLabel.includes('otra')) return 'list';
  if (icon === 'check' || normalizedLabel.includes('confirmar') || normalizedLabel.includes('aceptar')) return 'check';
  if (icon === 'pen' || normalizedLabel.includes('editar') || normalizedLabel.includes('modificar')) return 'pen';
  if (icon || normalizedLabel.includes('hallazgo') || normalizedLabel.includes('condición')) return 'search';
  return null;
}

export function QuickOpt({ label, icon, variant = 'default', fullWidth = false, onPress }: QuickOptProps) {
  const name = iconName(icon, label);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={variant === 'selected' || variant === 'disabled'}
      style={[styles.opt, fullWidth && styles.optFullWidth, optVariantStyle[variant]]}
      activeOpacity={0.7}
    >
      {name ? <FontAwesome5 name={name} size={fullWidth ? 11 : 10} color={getIconColor(variant)} /> : null}
      <Text style={[styles.label, fullWidth && styles.labelFullWidth, optTextVariantStyle[variant]]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface QuickOptsProps {
  options: Array<{ label: string; icon?: string; value: string }>;
  selected?: string | null;
  onSelect?: (value: string) => void;
}

function isInspectionTypeSelector(options: QuickOptsProps['options']) {
  const labels = options.map((option) => option.label.trim().toLowerCase());
  return labels.includes('hallazgo') && labels.includes('checklist normativo');
}

function isDateSelector(options: QuickOptsProps['options']) {
  return options.length > 0 && options.every((option) => /^\d{2}-\d{2}-\d{4}$/.test(option.value));
}

export function QuickOpts({ options, selected, onSelect }: QuickOptsProps) {
  if (isDateSelector(options)) {
    return (
      <ChatDateWidget
        value={selected ?? options[0]?.value ?? ''}
        resolved={Boolean(selected)}
        onSelect={(value) => onSelect?.(value)}
      />
    );
  }

  const fullWidth = isInspectionTypeSelector(options);

  return (
    <View style={[styles.container, fullWidth && styles.containerFullWidth]}>
      {options.map((opt) => {
        const isSelected = selected === opt.value || selected === opt.label;
        return (
          <QuickOpt
            key={opt.value}
            label={opt.label}
            icon={opt.icon}
            variant={isSelected ? 'selected' : 'default'}
            fullWidth={fullWidth}
            onPress={() => onSelect?.(opt.value)}
          />
        );
      })}
    </View>
  );
}

const optVariantStyle: Record<QuickOptVariant, object> = {
  default: { borderColor: colors.borderMid, backgroundColor: colors.white },
  selected: { borderColor: colors.navyDark, backgroundColor: colors.navyDark },
  teal: { borderColor: colors.teal, backgroundColor: colors.teal },
  disabled: { borderColor: colors.borderMid, backgroundColor: colors.white, opacity: 0.45 },
};

const optTextVariantStyle: Record<QuickOptVariant, object> = {
  default: { color: colors.blueLink },
  selected: { color: colors.white },
  teal: { color: colors.white },
  disabled: { color: colors.muted },
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    marginLeft: 33,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'flex-start',
  },
  containerFullWidth: {
    marginRight: spacing.md,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
  },
  opt: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  optFullWidth: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: 34,
  },
  label: {
    fontSize: fontSize.lg,
    lineHeight: 18,
    fontWeight: fontWeight.bold,
  },
  labelFullWidth: {
    fontSize: fontSize.base,
    lineHeight: 16,
    fontWeight: fontWeight.semibold,
  },
});