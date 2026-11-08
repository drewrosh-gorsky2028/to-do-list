import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RockIcon } from '@/components/icons';
import { PebbleCorner } from '@/components/pebble-corner';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { TaskRow } from '@/components/task-row';
import { longDay } from '@/lib/dates';
import { finishLine, idleLine, moodFor } from '@/lib/pebble';
import { totalShells } from '@/lib/progress';
import type { Category, Task } from '@/lib/types';
import { useAddSheet, useTasks } from '@/store/tasks';
import { categoryColors, colors, eyebrow, fonts, MAX_WIDTH, WIDE } from '@/theme';

const SETTLE_MS = 1500;
const CELEBRATE_MS = 4500;

const byDue = (a: Task, b: Task) =>
  (a.due ?? '9999').localeCompare(b.due ?? '9999') ||
  (a.time ?? '99').localeCompare(b.time ?? '99') ||
  a.createdAt.localeCompare(b.createdAt);

export default function TodayScreen() {
  const { tasks, loaded, today, finishTask, unfinishTask } = useTasks();
  const { open: openAdd } = useAddSheet();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;

  // Tasks that were just finished stay in place for a moment so the splash can play.
  const [settling, setSettling] = useState<Record<string, boolean>>({});
  const [celebration, setCelebration] = useState<string | null>(null);
  const [rockBanner, setRockBanner] = useState<Category | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [lineSeed, setLineSeed] = useState(() => Math.floor(Math.random() * 100));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shellPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const sections = useMemo(() => {
    const open = tasks.filter((t) => !t.doneAt || t.id in settling).sort(byDue);
    const isOverdue = (t: Task) => (t.id in settling ? settling[t.id] : !!t.due && t.due < today);
    return {
      overdue: open.filter(isOverdue),
      today: open.filter((t) => !isOverdue(t) && (!t.due || t.due === today)),
      upcoming: open.filter((t) => !isOverdue(t) && !!t.due && t.due > today),
      doneToday: tasks
        .filter((t) => t.doneAt && !(t.id in settling) && isSameLocalDay(t.doneAt, today))
        .sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? '')),
    };
  }, [tasks, settling, today]);

  const shells = totalShells(tasks);
  const shellsToday = sections.doneToday.reduce((s, t) => s + (t.shellsEarned ?? 0), 0);
  const notSettling = (t: Task) => !(t.id in settling);
  const todayLeft = sections.today.filter(notSettling).length;

  const situation = {
    hour: new Date().getHours(),
    overdue: sections.overdue.filter(notSettling).length,
    left: sections.overdue.filter(notSettling).length + todayLeft,
    doneToday: sections.doneToday.length,
  };
  const mood = celebration ? 'celebrating' : moodFor(situation);
  const line = celebration ?? idleLine(situation, lineSeed, sections.overdue[0]?.title);

  const onFinish = useCallback(
    (task: Task) => {
      const wasOverdue = !!task.due && task.due < today;
      const result = finishTask(task.id);
      if (!result) return;
      setSettling((s) => ({ ...s, [task.id]: wasOverdue }));
      setCelebration(finishLine(task, wasOverdue, Date.now()));
      if (result.newRock) setRockBanner(result.newRock);

      shellPulse.setValue(0);
      Animated.sequence([
        Animated.timing(shellPulse, { toValue: 1, duration: 160, useNativeDriver: false }),
        Animated.delay(900),
        Animated.timing(shellPulse, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();

      later(() => {
        if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSettling((s) => {
          const { [task.id]: _, ...rest } = s;
          return rest;
        });
      }, SETTLE_MS);
      later(() => setCelebration((c) => (c ? null : c)), CELEBRATE_MS);
      if (result.newRock) later(() => setRockBanner(null), 6000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finishTask, today, shellPulse],
  );

  const bottomBar = wide ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const empty = loaded && tasks.filter((t) => !t.doneAt).length === 0 && sections.doneToday.length === 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (wide ? 36 : 18), paddingBottom: bottomBar + 150 },
        ]}>
        <View style={styles.column}>
          <View style={styles.header}>
            <View>
              <Text style={eyebrow}>{longDay(today)}</Text>
              <Text style={styles.title}>Today</Text>
            </View>
            <Animated.View
              style={[
                styles.shells,
                { backgroundColor: shellPulse.interpolate({ inputRange: [0, 1], outputRange: [colors.sand, colors.river] }) },
              ]}
              accessibilityLabel={`${shells} shells`}>
              <Animated.Text
                style={[
                  styles.shellsText,
                  { color: shellPulse.interpolate({ inputRange: [0, 1], outputRange: [colors.wetStone, '#FFFFFF'] }) },
                ]}>
                {shells} {shells === 1 ? 'shell' : 'shells'}
              </Animated.Text>
            </Animated.View>
          </View>

          {rockBanner && (
            <View style={styles.rockBanner} accessibilityLiveRegion="polite">
              <View style={styles.rockChip}>
                <RockIcon color={categoryColors[rockBanner]} size={34} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rockTitle}>New {rockBanner} rock!</Text>
                <Text style={styles.rockSub}>It's on your shelf in the Pebble tab</Text>
              </View>
            </View>
          )}

          {sections.overdue.length > 0 && (
            <Section label="Overdue">
              {sections.overdue.map((t) => (
                <TaskRow key={t.id} task={t} today={today} overdue onFinish={onFinish} />
              ))}
            </Section>
          )}

          {(sections.today.length > 0 || !empty) && (
            <Section label={`Today · ${todayLeft} left`}>
              {sections.today.length === 0 ? (
                <Text style={styles.quiet}>Nothing due today.</Text>
              ) : (
                sections.today.map((t) => <TaskRow key={t.id} task={t} today={today} onFinish={onFinish} />)
              )}
            </Section>
          )}

          {sections.upcoming.length > 0 && (
            <Section label="Coming up">
              {sections.upcoming.map((t) => (
                <TaskRow key={t.id} task={t} today={today} onFinish={onFinish} />
              ))}
            </Section>
          )}

          {empty && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing on the list yet</Text>
              <Text style={styles.emptyBody}>Type something like "essay due friday, big" and Pebble sorts out the rest.</Text>
              <Pressable onPress={openAdd} accessibilityRole="button" style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Add your first task</Text>
              </Pressable>
            </View>
          )}

          {sections.doneToday.length > 0 && (
            <View style={styles.doneWrap}>
              <Pressable onPress={() => setShowDone((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: showDone }} hitSlop={8}>
                <Text style={styles.doneSummary}>
                  {sections.doneToday.length} done today · +{shellsToday} {shellsToday === 1 ? 'shell' : 'shells'}
                  <Text style={styles.doneToggle}>{showDone ? '  Hide' : '  Show'}</Text>
                </Text>
              </Pressable>
              {showDone && (
                <View style={styles.list}>
                  {sections.doneToday.map((t) => (
                    <TaskRow key={t.id} task={t} today={today} onUndo={(task) => unfinishTask(task.id)} />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {loaded && (
        <PebbleCorner mood={mood} line={line} bottom={bottomBar + 14} onPress={() => setLineSeed((s) => s + 1)} />
      )}
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={eyebrow}>{label}</Text>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

function isSameLocalDay(iso: string, today: string): boolean {
  const d = new Date(iso);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return key === today;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  scroll: { paddingHorizontal: 18, alignItems: 'center' },
  column: { width: '100%', maxWidth: MAX_WIDTH, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { fontFamily: fonts.heading, fontSize: 38, lineHeight: 44, color: colors.wetStone },
  shells: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, marginBottom: 8 },
  shellsText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  section: { gap: 8 },
  list: { gap: 8 },
  quiet: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, paddingVertical: 4 },
  rockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.wetStone,
  },
  rockChip: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sand },
  rockTitle: { fontFamily: fonts.headingBold, fontSize: 17, color: '#FFFFFF' },
  rockSub: { fontFamily: fonts.body, fontSize: 13, color: '#D5DDE2' },
  empty: { gap: 10, padding: 20, borderRadius: 22, backgroundColor: colors.card, alignItems: 'flex-start' },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.wetStone },
  emptyBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.body },
  emptyButton: {
    marginTop: 4,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.river,
    justifyContent: 'center',
  },
  emptyButtonText: { fontFamily: fonts.headingBold, fontSize: 16, color: '#FFFFFF' },
  doneWrap: { gap: 10 },
  doneSummary: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  doneToggle: { color: colors.river },
});
