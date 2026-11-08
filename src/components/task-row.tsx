import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { daysBetween, formatTime, relativeDay } from '@/lib/dates';
import { SHELLS, SIZE_SHORT, type Task } from '@/lib/types';
import { categoryColors, colors, fonts } from '@/theme';

import { CheckIcon, CloudIcon, SunIcon } from './icons';

type Props = {
  task: Task;
  today: string;
  overdue?: boolean;
  /** Called the moment the finish button is tapped. */
  onFinish?: (task: Task) => void;
  /** Called when a finished task's check is tapped again. */
  onUndo?: (task: Task) => void;
};

const RINGS = [0, 1, 2];
const DROPS = [-70, -35, 0, 35, 70].map((deg) => (deg * Math.PI) / 180);

function meta(task: Task, today: string, overdue?: boolean): string {
  const parts: string[] = [];
  if (task.doneAt) parts.push('Done');
  else if (overdue && task.due) {
    const late = daysBetween(task.due, today);
    parts.push(late === 1 ? '1 day late' : `${late} days late`);
  } else if (task.due && task.due !== today) parts.push(`Due ${relativeDay(task.due, today)}`);
  if (!task.doneAt && task.time) parts.push(formatTime(task.time));
  parts.push(task.category, SIZE_SHORT[task.size]);
  return parts.join(' · ');
}

/**
 * One task. Finishing it plays the stone splash: the circle fills, rings ripple out
 * like a stone dropped in the river, and the shells it earned pop up. Visual only, no sound.
 */
export function TaskRow({ task, today, overdue, onFinish, onUndo }: Props) {
  const [splashing, setSplashing] = useState(false);
  const done = !!task.doneAt || splashing;
  const accent = categoryColors[task.category];

  const ripple = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(task.doneAt ? 1 : 0)).current;
  const pill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!splashing) return;
    ripple.setValue(0);
    pill.setValue(0);
    Animated.parallel([
      Animated.timing(fill, { toValue: 1, duration: 180, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.timing(ripple, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(120),
        Animated.spring(pill, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
      ]),
    ]).start();
  }, [splashing, fill, ripple, pill]);

  const finish = () => {
    if (done) return;
    setSplashing(true);
    onFinish?.(task);
  };

  const label = done ? `Undo finishing ${task.title}` : `Finish ${task.title}`;
  const sunny = overdue && done;

  return (
    <View style={[styles.row, overdue && styles.overdueRow, sunny && styles.sunnyRow]}>
      <View style={styles.buttonWrap}>
        {splashing &&
          RINGS.map((i) => {
            const start = i * 0.12;
            const progress = ripple.interpolate({
              inputRange: [0, start, 1],
              outputRange: [0, 0, 1],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={[
                  styles.ring,
                  {
                    width: 36 + i * 30,
                    height: 36 + i * 30,
                    borderRadius: 18 + i * 15,
                    marginLeft: -(18 + i * 15),
                    marginTop: -(18 + i * 15),
                    borderWidth: 3 - i * 0.7,
                    borderColor: i === 0 ? colors.splash : i === 1 ? '#C9DDEC' : '#E1ECF4',
                    opacity: progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                    transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.6] }) }],
                  },
                ]}
              />
            );
          })}
        {splashing &&
          DROPS.map((angle, i) => {
            const dist = 34 + (i % 2) * 10;
            return (
              <Animated.View
                key={`d${i}`}
                pointerEvents="none"
                style={[
                  styles.drop,
                  {
                    opacity: ripple.interpolate({ inputRange: [0, 0.1, 0.6], outputRange: [0, 1, 0], extrapolate: 'clamp' }),
                    transform: [
                      { translateX: ripple.interpolate({ inputRange: [0, 0.6], outputRange: [0, Math.sin(angle) * dist], extrapolate: 'clamp' }) },
                      {
                        translateY: ripple.interpolate({
                          inputRange: [0, 0.3, 0.6],
                          outputRange: [0, -Math.cos(angle) * dist, -Math.cos(angle) * dist + 14],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              />
            );
          })}
        <Pressable
          onPress={done ? () => onUndo?.(task) : finish}
          disabled={splashing}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={label}
          hitSlop={8}
          style={styles.button}>
          {overdue ? (
            done ? <SunIcon /> : <CloudIcon />
          ) : (
            <View style={[styles.circle, { borderColor: accent }]}>
              <Animated.View
                style={[
                  styles.circleFill,
                  { backgroundColor: accent, opacity: fill, transform: [{ scale: fill.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] },
                ]}>
                <CheckIcon />
              </Animated.View>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.text}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.meta}>{splashing ? meta({ ...task, doneAt: 'now' }, today) : meta(task, today, overdue)}</Text>
      </View>

      {splashing && (
        <Animated.View style={[styles.pill, { opacity: pill, transform: [{ scale: pill.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]}>
          <Text style={styles.pillText}>+{SHELLS[task.size]} {SHELLS[task.size] === 1 ? 'shell' : 'shells'}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.card,
    overflow: 'visible',
  },
  overdueRow: { backgroundColor: colors.overdue },
  sunnyRow: { backgroundColor: colors.sunTint },
  buttonWrap: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', margin: -7 },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleFill: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', left: '50%', top: '50%' },
  drop: { position: 'absolute', width: 6, height: 8, borderRadius: 4, backgroundColor: '#5AA8E0' },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.headingBold, fontSize: 18, lineHeight: 22, color: colors.wetStone },
  titleDone: { color: colors.muted, textDecorationLine: 'line-through' },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.body },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.sand },
  pillText: { fontFamily: fonts.heading, fontSize: 15, color: colors.wetStone },
});
