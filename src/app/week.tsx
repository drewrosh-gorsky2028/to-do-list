import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PebbleArt } from '@/components/pebble-art';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { colors, eyebrow, fonts, MAX_WIDTH, WIDE } from '@/theme';

// Placeholder until step 2 (Week view and repeating tasks).
export default function WeekScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + (wide ? 36 : 18), paddingBottom: (wide ? 0 : TAB_BAR_HEIGHT + insets.bottom) + 40 },
      ]}>
      <View style={styles.column}>
        <Text style={eyebrow}>Coming next</Text>
        <Text style={styles.title}>Week</Text>
        <View style={styles.card}>
          <View style={styles.spot}>
            <PebbleArt mood="sleepy" size={120} />
          </View>
          <Text style={styles.body}>
            The week view is still being built. For now, everything due later shows under Coming up on Today.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  scroll: { paddingHorizontal: 18, alignItems: 'center' },
  column: { width: '100%', maxWidth: MAX_WIDTH, gap: 4 },
  title: { fontFamily: fonts.heading, fontSize: 38, lineHeight: 44, color: colors.wetStone, marginBottom: 14 },
  card: { backgroundColor: colors.card, borderRadius: 26, padding: 22, gap: 16, alignItems: 'center' },
  spot: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.body, textAlign: 'center' },
});
