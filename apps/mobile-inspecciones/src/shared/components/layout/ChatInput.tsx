import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize } from '../../theme/tokens';
import { PaperPlaneMark } from '../icons/PaperPlaneMark';

interface Props {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, placeholder = 'Escribe aquí o usa los controles…', disabled = false }: Props) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  function handleSubmit(_: NativeSyntheticEvent<TextInputSubmitEditingEventData>) {
    handleSend();
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + spacing.xs }]}> 
      <View style={styles.row}>
        <TouchableOpacity style={styles.voiceBtn} activeOpacity={0.7}>
          <FontAwesome5 name="microphone" size={16} color={colors.muted} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          blurOnSubmit
          returnKeyType="send"
          editable={!disabled}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          style={[styles.sendBtn, (!text.trim() || disabled) && styles.sendBtnDisabled]}
          activeOpacity={0.8}
        >
          <PaperPlaneMark size={15} color={colors.navy} />
        </TouchableOpacity>
      </View>
      <View style={styles.homeIndicatorBar}>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  voiceBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    borderRadius: 20,
    fontFamily: 'System',
    fontSize: fontSize.base,
    lineHeight: 18,
    color: colors.primary,
    backgroundColor: colors.surface,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.5 },
  homeIndicatorBar: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIndicator: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderMid,
  },
});
