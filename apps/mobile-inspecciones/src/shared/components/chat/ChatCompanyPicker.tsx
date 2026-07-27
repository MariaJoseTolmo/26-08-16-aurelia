import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontWeight } from '../../theme/tokens';

interface ChatCompanyPickerProps {
  companies: string[];
  selected?: string | null;
  onSelect: (companyName: string) => void;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function ChatCompanyPicker({ companies, selected = null, onSelect }: ChatCompanyPickerProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = React.useState(!selected);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!selected) setOpen(true);
    else setOpen(false);
  }, [selected]);

  React.useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const filteredCompanies = React.useMemo(() => {
    const value = normalizeText(query);
    if (!value) return companies;
    return companies.filter((company) => normalizeText(company).includes(value));
  }, [companies, query]);

  function choose(companyName: string) {
    setOpen(false);
    onSelect(companyName);
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.label}>Empresa responsable</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={Boolean(selected)}
          onPress={() => setOpen(true)}
          style={[styles.field, selected && styles.fieldResolved]}
        >
          <Text numberOfLines={1} style={styles.fieldText}>{selected ?? 'Seleccione la empresa'}</Text>
          <Text style={styles.caret}>⌄</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
        transparent
        visible={open && !selected}
      >
        <Pressable onPress={() => setOpen(false)} style={styles.overlay}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>Seleccione la empresa</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setQuery}
              placeholder="Ingrese nombre de la empresa"
              placeholderTextColor="#131313"
              selectionColor="#24588B"
              style={styles.search}
              value={query}
            />
            <FlatList
              data={filteredCompanies}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>No hay empresas disponibles</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => choose(item)}
                  style={[styles.option, item === selected && styles.optionSelected]}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
              style={styles.list}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    marginLeft: 33,
    marginRight: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: {
    color: '#131313',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  field: {
    height: 50,
    marginTop: 8,
    paddingHorizontal: 15.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6FAFF',
    borderColor: '#24588B',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  fieldResolved: {
    opacity: 0.8,
  },
  fieldText: {
    minWidth: 0,
    flex: 1,
    color: '#131313',
    fontSize: 13,
    lineHeight: 20,
  },
  caret: {
    marginLeft: 8,
    color: '#131313',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(19,19,19,0.75)',
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    height: '88%',
    paddingHorizontal: 14,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -12 },
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    marginTop: 10,
    marginBottom: 24,
    alignSelf: 'center',
    backgroundColor: '#D1D1D1',
    borderRadius: 2,
  },
  title: {
    color: '#131313',
    fontSize: 18,
    fontWeight: fontWeight.bold,
    lineHeight: 22,
  },
  search: {
    width: '100%',
    height: 50,
    marginTop: 12,
    paddingHorizontal: 15.5,
    color: '#131313',
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: '#F6FAFF',
    borderColor: '#24588B',
    borderRadius: 10,
    borderWidth: 1.5,
  },
  list: {
    minHeight: 0,
    marginTop: 12,
    flex: 1,
    padding: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  option: {
    minHeight: 47,
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: '#F6FAFF',
  },
  optionText: {
    color: '#131313',
    fontSize: 14,
    fontWeight: fontWeight.regular,
    lineHeight: 23,
    letterSpacing: 0.28,
  },
  empty: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    color: '#646464',
    fontSize: 14,
    lineHeight: 23,
  },
});