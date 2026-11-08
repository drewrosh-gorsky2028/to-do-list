import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RockIcon } from '@/components/icons';
import { PebbleArt } from '@/components/pebble-art';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { rocksFor, SHELLS_PER_ROCK, shellsByCategory, totalShells } from '@/lib/progress';
import { CATEGORIES } from '@/lib/types';
import { useTasks } from '@/store/tasks';
import { categoryColors, colors, eyebrow, fonts, MAX_WIDTH, WIDE } from '@/theme';

// Step 1 shows Pebble's rock shelf. The den, shop and outfits arrive in step 3.
export default function PebbleScreen() {
  const { tasks } = useTasks();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  const byCat = shellsByCategory(tasks);
  const total = totalShells(tasks);
  const rocks = CATEGORIES.reduce((n, c) => n + rocksFor(byCat[c]), 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + (wide ? 36 : 18), paddingBottom: (wide ? 0 : TAB_BAR_HEIGHT + insets.bottom) + 40 },
      ]}>
      <View style={styles.column}>
        <View style={styles.hero}>
          <View style={styles.heroSpot}>
            <PebbleArt mood={total > 0 ? 'default' : 'predicting'} size={150} />
          </View>
          <Text style={styles.title}>Pebble</Text>
          <Text style={styles.stats}>
            {total} {total === 1 ? 'shell' : 'shells'} · {rocks} {rocks === 1 ? 'rock' : 'rocks'}
          </Text>
        </View>

        <Text style={eyebrow}>Rock shelf</Text>
        <Text style={styles.help}>Every {SHELLS_PER_ROCK} shells in a category earns a rock for that category.</Text>
        <View style={styles.shelf}>
          {CATEGORIES.map((c) => {
            const shells = byCat[c];
            const count = rocksFor(shells);
            const toNext = shells % SHELLS_PER_ROCK;
            return (
              <View key={c} style={styles.row}>
                <View style={[styles.rockSpot, count === 0 && styles.rockLocked]}>
                  <RockIcon color={count > 0 ? categoryColors[c] : '#C9D3D9'} size={36} />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.cat}>{c}</Text>
                    <Text style={styles.count}>{count > 0 ? `× ${count}` : 'Not yet'}</Text>
                  </View>
                  <View
                    style={styles.track}
                    accessibilityRole="progressbar"
                    accessibilityLabel={`${c}: ${toNext} of ${SHELLS_PER_ROCK} shells to the next rock`}
                    accessibilityValue={{ min: 0, max: SHELLS_PER_ROCK, now: toNext }}>
                    <View style={[styles.fill, { width: `${(toNext / SHELLS_PER_ROCK) * 100}%`, backgroundColor: categoryColors[c] }]} />
                  </View>
                  <Text style={styles.next}>
                    {toNext} of {SHELLS_PER_ROCK} shells to the next one
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        <Text style={styles.soon}>The den, shop and outfits are coming in a later step.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  scroll: { paddingHorizontal: 18, alignItems: 'center' },
  column: { width: '100%', maxWidth: MAX_WIDTH, gap: 10 },
  hero: { alignItems: 'center', gap: 2, marginBottom: 12 },
  heroSpot: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  title: { fontFamily: fonts.heading, fontSize: 34, lineHeight: 40, color: colors.wetStone, marginTop: 8 },
  stats: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.muted },
  help: { fontFamily: fonts.body, fontSize: 14, color: colors.body },
  shelf: { backgroundColor: colors.card, borderRadius: 24, padding: 16, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rockSpot: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.sandLight, alignItems: 'center', justifyContent: 'center' },
  rockLocked: { backgroundColor: colors.mist },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cat: { fontFamily: fonts.headingBold, fontSize: 17, color: colors.wetStone },
  count: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.muted },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.mist, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  next: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  soon: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 10 },
});
