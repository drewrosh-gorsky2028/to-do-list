import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addDays, formatTime, fromKey, relativeDay, shortDate, WEEKDAYS } from '@/lib/dates';
import { parseTask } from '@/lib/parse';
import { addLine } from '@/lib/pebble';
import { CATEGORIES, SHELLS, SIZE_LABEL, type Category, type Size, type TaskDraft } from '@/lib/types';
import { useTasks } from '@/store/tasks';
import { categoryColors, colors, eyebrow, fonts, MAX_WIDTH } from '@/theme';

import { PebbleArt } from './pebble-art';

type Props = { visible: boolean; onClose: () => void };

/** Fields picked by hand. `null` means "picked none" (for example, no due date). */
type Manual = {
  title?: string;
  category?: Category;
  size?: Size;
  due?: string | null;
  time?: string | null;
};

type Picker = 'category' | 'size' | 'due' | 'time' | null;

const TIME_CHOICES: { label: string; value: string | null }[] = [
  { label: 'Any time', value: null },
  { label: 'Morning', value: '09:00' },
  { label: 'Noon', value: '12:00' },
  { label: 'Afternoon', value: '15:00' },
  { label: 'Evening', value: '19:00' },
  { label: 'Night', value: '21:00' },
];

export function AddSheet({ visible, onClose }: Props) {
  const { tasks, today, addTask } = useTasks();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'sentence' | 'form'>('sentence');
  const [text, setText] = useState('');
  const [manual, setManual] = useState<Manual>({});
  const [picker, setPicker] = useState<Picker>(null);

  useEffect(() => {
    if (!visible) return;
    setText('');
    setManual({});
    setPicker(null);
    setMode('sentence');
  }, [visible]);

  const lastCategory = useMemo(() => {
    const latest = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return latest?.category ?? 'Chores';
  }, [tasks]);

  const parsed = useMemo(() => parseTask(text, today), [text, today]);

  const draft: TaskDraft & { guessedCategory: boolean } = {
    title: manual.title ?? parsed.title,
    category: manual.category ?? parsed.category ?? lastCategory,
    guessedCategory: !manual.category && !parsed.category,
    size: manual.size ?? parsed.size ?? 'medium',
    due: manual.due === null ? undefined : (manual.due ?? parsed.due),
    time: manual.time === null ? undefined : (manual.time ?? parsed.time),
  };

  const set = (patch: Manual) => setManual((m) => ({ ...m, ...patch }));
  const canAdd = draft.title.trim().length > 0;

  const submit = () => {
    if (!canAdd) return;
    addTask(draft);
    onClose();
  };

  const switchMode = () => {
    if (mode === 'sentence') {
      // Carry everything over so the form starts filled in.
      setManual({
        title: draft.title,
        category: draft.category,
        size: draft.size,
        due: draft.due ?? null,
        time: draft.time ?? null,
      });
      setMode('form');
    } else {
      setMode('sentence');
      setManual((m) => ({ ...m, title: undefined }));
      setText(draft.title);
    }
    setPicker(null);
  };

  const dueChoices = useMemo(() => {
    const days = [0, 1, 2, 3, 4, 5, 6].map((n) => addDays(today, n));
    return [{ label: 'No date', value: null as string | null }].concat(
      days.map((d) => ({ label: relativeDay(d, today), value: d })),
      [{ label: `Next ${WEEKDAYS[fromKey(addDays(today, 7)).getDay()].slice(0, 3)}`, value: addDays(today, 7) }],
    );
  }, [today]);

  const categoryPicker = (
    <View style={styles.choiceRow}>
      {CATEGORIES.map((c) => (
        <Choice key={c} selected={draft.category === c && !draft.guessedCategory} onPress={() => { set({ category: c }); setPicker(null); }}>
          <View style={[styles.dot, { backgroundColor: categoryColors[c] }]} />
          <Text style={styles.choiceText}>{c}</Text>
        </Choice>
      ))}
    </View>
  );
  const sizePicker = (
    <View style={styles.choiceRow}>
      {(['small', 'medium', 'big'] as Size[]).map((s) => (
        <Choice key={s} selected={draft.size === s} onPress={() => { set({ size: s }); setPicker(null); }}>
          <Text style={styles.choiceText}>
            {SIZE_LABEL[s]} · {SHELLS[s]} {SHELLS[s] === 1 ? 'shell' : 'shells'}
          </Text>
        </Choice>
      ))}
    </View>
  );
  const duePicker = (
    <View style={styles.choiceRow}>
      {dueChoices.map((d) => (
        <Choice key={d.label} selected={(draft.due ?? null) === d.value} onPress={() => { set({ due: d.value }); setPicker(null); }}>
          <Text style={styles.choiceText}>{d.label}</Text>
        </Choice>
      ))}
    </View>
  );
  const timePicker = (
    <View style={styles.choiceRow}>
      {TIME_CHOICES.map((t) => (
        <Choice key={t.label} selected={(draft.time ?? null) === t.value} onPress={() => { set({ time: t.value }); setPicker(null); }}>
          <Text style={styles.choiceText}>{t.value ? `${t.label} · ${formatTime(t.value)}` : t.label}</Text>
        </Choice>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoid} pointerEvents="box-none">
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.heading}>New task</Text>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" style={styles.cancel}>
                <Text style={styles.link}>Cancel</Text>
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              {mode === 'sentence' ? (
                <>
                  <View style={styles.field}>
                    <Text style={eyebrow} nativeID="quickLabel">Just type it</Text>
                    <TextInput
                      autoFocus
                      value={text}
                      onChangeText={setText}
                      onSubmitEditing={submit}
                      placeholder="essay due friday, big"
                      placeholderTextColor="#8A98A3"
                      returnKeyType="done"
                      accessibilityLabelledBy="quickLabel"
                      accessibilityLabel="Just type it"
                      style={styles.bigInput}
                    />
                  </View>

                  {text.trim().length > 0 && (
                    <View style={styles.field}>
                      <Text style={eyebrow}>I got this. Tap anything to fix it.</Text>
                      <View style={styles.choiceRow}>
                        <Chip active={picker === 'category'} dashed={draft.guessedCategory} onPress={() => setPicker(picker === 'category' ? null : 'category')}>
                          <View style={[styles.dot, { backgroundColor: categoryColors[draft.category] }]} />
                          <Text style={styles.choiceText}>{draft.guessedCategory ? `${draft.category}?` : draft.category}</Text>
                        </Chip>
                        <Chip active={picker === 'size'} tint={draft.size === 'big'} onPress={() => setPicker(picker === 'size' ? null : 'size')}>
                          <Text style={styles.choiceText}>
                            {SIZE_LABEL[draft.size]} · {SHELLS[draft.size]} {SHELLS[draft.size] === 1 ? 'shell' : 'shells'}
                          </Text>
                        </Chip>
                        <Chip active={picker === 'due'} onPress={() => setPicker(picker === 'due' ? null : 'due')}>
                          <Text style={[styles.choiceText, !draft.due && styles.mutedText]}>
                            {draft.due ? `Due ${shortDate(draft.due)}` : 'No due date'}
                          </Text>
                        </Chip>
                        {draft.due && (
                          <Chip active={picker === 'time'} onPress={() => setPicker(picker === 'time' ? null : 'time')}>
                            <Text style={[styles.choiceText, !draft.time && styles.mutedText]}>
                              {draft.time ? formatTime(draft.time) : 'Any time'}
                            </Text>
                          </Chip>
                        )}
                      </View>
                      {picker === 'category' && categoryPicker}
                      {picker === 'size' && sizePicker}
                      {picker === 'due' && duePicker}
                      {picker === 'time' && timePicker}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.field}>
                    <Text style={eyebrow} nativeID="nameLabel">Task</Text>
                    <TextInput
                      autoFocus
                      value={draft.title}
                      onChangeText={(title) => set({ title })}
                      onSubmitEditing={submit}
                      placeholder="Finish history essay"
                      placeholderTextColor="#8A98A3"
                      accessibilityLabelledBy="nameLabel"
                      accessibilityLabel="Task"
                      style={styles.bigInput}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={eyebrow}>Category</Text>
                    {categoryPicker}
                  </View>
                  <View style={styles.field}>
                    <Text style={eyebrow}>Size</Text>
                    {sizePicker}
                  </View>
                  <View style={styles.field}>
                    <Text style={eyebrow}>Due</Text>
                    {duePicker}
                  </View>
                  {draft.due && (
                    <View style={styles.field}>
                      <Text style={eyebrow}>Time</Text>
                      {timePicker}
                    </View>
                  )}
                </>
              )}

              {canAdd && (
                <View style={styles.pebbleCard}>
                  <View style={styles.pebbleSpot}>
                    <PebbleArt mood="predicting" size={60} still />
                  </View>
                  <Text style={styles.pebbleText}>{addLine(draft, today)}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={submit}
                disabled={!canAdd}
                accessibilityRole="button"
                style={({ pressed }) => [styles.addButton, !canAdd && styles.addDisabled, pressed && { opacity: 0.85 }]}>
                <Text style={styles.addText}>Add task</Text>
              </Pressable>
              <Pressable onPress={switchMode} accessibilityRole="button" hitSlop={8} style={styles.switch}>
                <Text style={styles.link}>{mode === 'sentence' ? 'Use the form instead' : 'Just type it instead'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Chip({
  children,
  onPress,
  active,
  dashed,
  tint,
}: {
  children: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  dashed?: boolean;
  tint?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: active }}
      style={[styles.chip, tint && { backgroundColor: colors.riverTint }, dashed && styles.dashed, active && styles.chipActive]}>
      {children}
    </Pressable>
  );
}

function Choice({ children, onPress, selected }: { children: React.ReactNode; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.choiceSelected]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(31, 42, 51, 0.45)', justifyContent: 'flex-end' },
  avoid: { width: '100%', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    maxHeight: '92%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 999, backgroundColor: '#C9D3D9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  heading: { fontFamily: fonts.heading, fontSize: 28, color: colors.wetStone },
  cancel: { padding: 10, marginRight: -10 },
  link: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.river },
  body: { gap: 18, paddingVertical: 12 },
  field: { gap: 8 },
  bigInput: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    color: colors.wetStone,
    backgroundColor: colors.mist,
    borderWidth: 2,
    borderColor: colors.river,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.mist,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: { borderColor: colors.river },
  dashed: { borderColor: '#B9CFDF', borderStyle: 'dashed' },
  choiceSelected: { backgroundColor: colors.riverTint, borderColor: colors.river },
  choiceText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.wetStone },
  mutedText: { color: colors.muted },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pebbleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.sandLight,
  },
  pebbleSpot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  pebbleText: { flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.wetStone },
  footer: { gap: 6, paddingTop: 8 },
  addButton: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: colors.river,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDisabled: { backgroundColor: '#9DB8CC' },
  addText: { fontFamily: fonts.heading, fontSize: 19, color: '#FFFFFF' },
  switch: { alignSelf: 'center', padding: 10 },
});
