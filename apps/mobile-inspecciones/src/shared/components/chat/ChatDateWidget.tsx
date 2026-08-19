import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight, spacing } from '../../theme/tokens';

interface ChatDateWidgetProps {
  value: string;
  resolved: boolean;
  onSelect: (value: string) => void;
}

interface ChatDateCalendarSheetProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}

function formatDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${value.getFullYear()}`;
}

function parseDateLabel(value: string): Date | null {
  const parts = value.split(/[/-]/).map((part) => Number(part));
  const [day, month, year] = parts;
  if (
    parts.length !== 3 ||
    day === undefined ||
    month === undefined ||
    year === undefined ||
    parts.some((part) => Number.isNaN(part))
  ) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;
  return date;
}

function displayDate(value: string): string {
  return value ? value.replace(/-/g, '/') : '';
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDateInput(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;
  return formatDate(date);
}

function monthLabel(value: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function calendarDays(viewDate: Date): Date[] {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1 - offset);
  return Array.from(
    { length: 42 },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

function ChatDateCalendarSheet({ visible, value, onClose, onSelect }: ChatDateCalendarSheetProps) {
  const insets = useSafeAreaInsets();
  const initialDate = parseDateLabel(value) ?? new Date();
  const [viewDate, setViewDate] = React.useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [dateText, setDateText] = React.useState(() => displayDate(value));
  const [calendarValue, setCalendarValue] = React.useState(value);

  React.useEffect(() => {
    if (!visible) return;
    const selected = parseDateLabel(value) ?? new Date();
    setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setDateText(displayDate(value));
    setCalendarValue(value);
  }, [value, visible]);

  const days = React.useMemo(() => calendarDays(viewDate), [viewDate]);
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  function selectDate(date: Date) {
    const formatted = formatDate(date);
    setDateText(displayDate(formatted));
    setCalendarValue(formatted);
    onSelect(formatted);
    onClose();
  }

  function changeDateText(nextValue: string) {
    const nextText = formatDateInput(nextValue);
    setDateText(nextText);

    const parsedValue = parseDateInput(nextText);
    if (!parsedValue) return;

    const parsedDate = parseDateLabel(parsedValue);
    if (parsedDate) {
      setViewDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
    }
    setCalendarValue(parsedValue);
    onSelect(parsedValue);
    onClose();
  }

  function blurDateText() {
    if (!dateText) return;
    if (parseDateInput(dateText)) return;
    setDateText(displayDate(calendarValue || value));
  }

  function clearDateText() {
    setDateText('');
    setCalendarValue('');
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Fecha</Text>
            <View style={styles.dateInputBox}>
              <TextInput
                keyboardType="number-pad"
                maxLength={10}
                onBlur={blurDateText}
                onChangeText={changeDateText}
                placeholder="dd/mm/aaaa"
                placeholderTextColor="#757575"
                selectionColor={colors.blueLink}
                style={styles.dateInput}
                value={dateText}
              />
              <FontAwesome5 name="calendar-alt" size={16} color={colors.primary} />
            </View>
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.monthHeader}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
                style={styles.monthButton}
              >
                <Text style={styles.monthText}>{monthLabel(viewDate)}</Text>
                <Text style={styles.monthCaret}>▼</Text>
              </TouchableOpacity>

              <View style={styles.monthArrows}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
                  style={styles.arrowButton}
                >
                  <Text style={styles.arrowText}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
                  style={styles.arrowButton}
                >
                  <Text style={styles.arrowText}>↓</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.weekRow}>
              {weekDays.map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((date) => {
                const formatted = formatDate(date);
                const selected = Boolean(calendarValue) && formatted === calendarValue;
                const currentMonth = date.getMonth() === viewDate.getMonth();

                return (
                  <View key={date.toISOString()} style={styles.dayCell}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => selectDate(date)}
                      style={[styles.dayButton, selected && styles.dayButtonSelected]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !currentMonth && styles.dayTextOutside,
                          selected && styles.dayTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity activeOpacity={0.7} onPress={clearDateText}>
                <Text style={styles.calendarActionText}>Borrar</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => selectDate(new Date())}>
                <Text style={styles.calendarActionText}>Hoy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ChatDateWidget({ value, resolved, onSelect }: ChatDateWidgetProps) {
  const [open, setOpen] = React.useState(!resolved);

  React.useEffect(() => {
    if (!resolved) setOpen(true);
    else setOpen(false);
  }, [resolved]);

  return (
    <View style={styles.widget}>
      <Text style={styles.widgetLabel}>Fecha</Text>
      <TouchableOpacity
        activeOpacity={0.75}
        disabled={resolved}
        onPress={() => setOpen(true)}
        style={[styles.widgetButton, resolved && styles.widgetButtonResolved]}
      >
        <Text style={styles.widgetValue}>{displayDate(value) || 'dd/mm/aaaa'}</Text>
        <FontAwesome5 name="calendar-alt" size={16} color={colors.primary} />
      </TouchableOpacity>
      <ChatDateCalendarSheet
        onClose={() => setOpen(false)}
        onSelect={onSelect}
        value={value}
        visible={open && !resolved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    marginBottom: 10,
    marginLeft: 33,
    marginRight: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
  },
  widgetLabel: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  widgetButton: {
    height: 44,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6FAFF',
    borderColor: colors.blueLink,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  widgetButtonResolved: {
    opacity: 0.8,
  },
  widgetValue: {
    color: colors.primary,
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '92%',
    paddingHorizontal: 14,
    paddingTop: 14,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    lineHeight: 14,
  },
  dateInputBox: {
    height: 50,
    paddingHorizontal: 15.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6FAFF',
    borderColor: colors.blueLink,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  dateInput: {
    minWidth: 0,
    flex: 1,
    padding: 0,
    color: colors.primary,
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  calendarCard: {
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderColor: colors.borderMid,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  monthHeader: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthText: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: 16,
  },
  monthCaret: {
    color: colors.primary,
    fontSize: fontSize.xs,
  },
  monthArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  arrowButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: colors.primary,
    fontSize: 20,
    lineHeight: 22,
  },
  weekRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  weekDay: {
    width: '14.285714%',
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: 16,
    textAlign: 'center',
  },
  daysGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285714%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  dayButtonSelected: {
    width: 32,
    height: 32,
    backgroundColor: '#0B84FF',
    borderColor: '#006FE6',
    borderWidth: 2,
    shadowColor: '#006FE6',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  dayText: {
    color: colors.primary,
    fontSize: 15,
    lineHeight: 18,
  },
  dayTextOutside: {
    color: '#888888',
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  calendarActions: {
    marginTop: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarActionText: {
    color: '#0B84FF',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
  },
});
