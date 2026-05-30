import { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { C } from '@/constants/colors';

type Props = {
  label: string;
  value: string;          // YYYY-MM-DD
  onChange: (iso: string) => void;
  error?: string;
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + i - 5);

function toDDMMYYYY(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

function Column({
  items,
  selected,
  onSelect,
  renderLabel,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  renderLabel?: (v: number) => string;
}) {
  return (
    <FlatList
      data={items}
      keyExtractor={String}
      style={styles.col}
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, i) => ({ length: 44, offset: 44 * i, index: i })}
      initialScrollIndex={Math.max(0, items.indexOf(selected))}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.colItem, item === selected && styles.colItemSelected]}
          onPress={() => onSelect(item)}
        >
          <Text style={[styles.colText, item === selected && styles.colTextSelected]}>
            {renderLabel ? renderLabel(item) : String(item).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

export function DateInput({ label, value, onChange, error }: Props) {
  const today = new Date();
  const initial = value
    ? (() => { const [y, m, d] = value.split('-').map(Number); return { d, m, y }; })()
    : { d: today.getDate(), m: today.getMonth() + 1, y: today.getFullYear() };

  const [show, setShow] = useState(false);
  const [day, setDay] = useState(initial.d);
  const [month, setMonth] = useState(initial.m);
  const [year, setYear] = useState(initial.y);

  const confirm = () => {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(iso);
    setShow(false);
  };

  const cancel = () => {
    // reset to current value
    setDay(initial.d); setMonth(initial.m); setYear(initial.y);
    setShow(false);
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.field, error ? styles.fieldError : null]}
        onPress={() => setShow(true)}
        activeOpacity={0.75}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? toDDMMYYYY(value) : 'DD-MM-YYYY'}
        </Text>
        <Text style={styles.calIcon}>📅</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={show} transparent animationType="slide" onRequestClose={cancel}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Toolbar */}
            <View style={styles.toolbar}>
              <TouchableOpacity onPress={cancel} style={styles.toolBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.toolTitle}>Select Date</Text>
              <TouchableOpacity onPress={confirm} style={styles.toolBtn}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Column headers */}
            <View style={styles.headers}>
              <Text style={styles.header}>Day</Text>
              <Text style={styles.header}>Month</Text>
              <Text style={styles.header}>Year</Text>
            </View>

            {/* Three scroll columns */}
            <View style={styles.cols}>
              <Column items={DAYS} selected={day} onSelect={setDay} />
              <Column
                items={Array.from({ length: 12 }, (_, i) => i + 1)}
                selected={month}
                onSelect={setMonth}
                renderLabel={v => MONTHS[v - 1]}
              />
              <Column items={YEARS} selected={year} onSelect={setYear}
                renderLabel={v => String(v)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 6, letterSpacing: 0.2 },
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 13, paddingVertical: 11,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border, borderRadius: 8,
  },
  fieldError: { borderColor: C.error },
  fieldText: { fontSize: 14, color: C.text },
  placeholder: { color: '#c0c7d3' },
  calIcon: { fontSize: 16 },
  errorText: { fontSize: 11, color: C.error, marginTop: 3 },

  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 32 },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  toolBtn: { minWidth: 60 },
  toolTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  cancelText: { fontSize: 15, color: C.textMuted },
  doneText: { fontSize: 15, color: C.primary, fontWeight: '700', textAlign: 'right' },

  // Column header row
  headers: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 10, paddingBottom: 4 },
  header: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase' },

  // Columns
  cols: { flexDirection: 'row', height: 220, paddingHorizontal: 8 },
  col: { flex: 1 },
  colItem: {
    height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  colItemSelected: { backgroundColor: `${C.primary}18` },
  colText: { fontSize: 15, color: C.textMuted },
  colTextSelected: { fontSize: 16, fontWeight: '700', color: C.primary },
});
