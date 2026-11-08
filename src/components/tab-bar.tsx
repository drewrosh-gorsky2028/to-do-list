import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddSheetProvider } from '@/store/tasks';
import { colors, fonts, WIDE } from '@/theme';

import { AddSheet } from './add-sheet';
import { PebbleArt } from './pebble-art';
import { PlusIcon, StoneIcon, TodayIcon, WeekIcon } from './icons';

/** Height of the phone bottom bar above the safe area. Screens use it to keep Pebble clear of it. */
export const TAB_BAR_HEIGHT = 76;

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: (color: string) => ReactNode; wide: boolean };

function TabButton({ label, icon, wide, isFocused, ref, ...props }: TabButtonProps) {
  const color = isFocused ? colors.river : colors.muted;
  return (
    <Pressable
      // expo-router's slot ref type is narrower than Pressable's; the runtime value is a plain view ref.
      ref={ref as never}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={StyleSheet.flatten([wide ? styles.sideButton : styles.tabButton, wide && isFocused && styles.sideButtonActive])}>
      {icon(color)}
      <Text style={[styles.tabLabel, { color }, wide && styles.sideLabel]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Today · Week · + · Pebble. A bottom bar on phones, a left sidebar on wide web screens.
 * The + opens the Add sheet over whatever screen is showing.
 */
export function AppTabs() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= WIDE;
  const [adding, setAdding] = useState(false);

  const addButton = (
    <Pressable
      onPress={() => setAdding(true)}
      accessibilityRole="button"
      accessibilityLabel="Add task"
      style={({ pressed }) => [wide ? styles.sideAdd : styles.add, pressed && { transform: [{ scale: 0.94 }] }]}>
      <PlusIcon size={wide ? 22 : 28} />
      {wide && <Text style={styles.sideAddText}>Add task</Text>}
    </Pressable>
  );

  const triggers = (
    <>
      <TabTrigger name="index" href="/" asChild>
        <TabButton label="Today" wide={wide} icon={(c) => <TodayIcon color={c} />} />
      </TabTrigger>
      <TabTrigger name="week" href="/week" asChild>
        <TabButton label="Week" wide={wide} icon={(c) => <WeekIcon color={c} />} />
      </TabTrigger>
      {!wide && addButton}
      <TabTrigger name="pebble" href="/pebble" asChild>
        <TabButton label="Pebble" wide={wide} icon={(c) => <StoneIcon color={c} />} />
      </TabTrigger>
    </>
  );

  return (
    <AddSheetProvider value={{ open: () => setAdding(true) }}>
      <Tabs style={StyleSheet.flatten([styles.root, wide && styles.rootWide])}>
        {wide ? (
          <TabList asChild>
            <View style={styles.sidebar}>
              <View style={styles.brand}>
                <View style={styles.brandSpot}>
                  <PebbleArt mood="default" size={44} still />
                </View>
                <Text style={styles.brandText}>Pebble</Text>
              </View>
              {addButton}
              {triggers}
            </View>
          </TabList>
        ) : null}
        <TabSlot style={styles.slot} />
        {!wide ? (
          <TabList asChild>
            <View style={StyleSheet.flatten([styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }])}>{triggers}</View>
          </TabList>
        ) : null}
      </Tabs>
      <AddSheet visible={adding} onClose={() => setAdding(false)} />
    </AddSheetProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mist },
  rootWide: { flexDirection: 'row' },
  slot: { flex: 1 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#1F2A33',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tabButton: { minWidth: 64, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontFamily: fonts.headingBold, fontSize: 14 },
  add: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.river,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    shadowColor: colors.river,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sidebar: {
    // TabList lays its children out in a row by default; the sidebar stacks them.
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    width: 232,
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 6,
    backgroundColor: colors.card,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, paddingHorizontal: 6 },
  brandSpot: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  brandText: { fontFamily: fonts.heading, fontSize: 26, color: colors.wetStone },
  sideAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.river,
    marginBottom: 14,
  },
  sideAddText: { fontFamily: fonts.heading, fontSize: 17, color: '#FFFFFF' },
  sideButton: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 14, borderRadius: 16 },
  sideButtonActive: { backgroundColor: colors.riverTint },
  sideLabel: { fontSize: 17 },
});
