import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Mood } from '@/pebble/art';
import { colors, fonts } from '@/theme';

import { PebbleArt } from './pebble-art';

type Props = { mood: Mood; line: string; onPress: () => void; bottom: number };

/** Pebble on his sand spot in the corner of Today, with a speech bubble. Tap him for another line. */
export function PebbleCorner({ mood, line, onPress, bottom }: Props) {
  const celebrating = mood === 'celebrating';
  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={[styles.bubble, celebrating && styles.bubbleCelebrate]} accessibilityLiveRegion="polite">
        <Text style={styles.bubbleText}>{line}</Text>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Pebble. Tap for something else to say."
        style={({ pressed }) => [styles.spot, celebrating && styles.spotCelebrate, pressed && { transform: [{ scale: 0.95 }] }]}>
        <PebbleArt mood={mood} size={136} style={styles.art} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: 370,
  },
  bubble: {
    flexShrink: 1,
    maxWidth: 210,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    backgroundColor: colors.wetStone,
    marginBottom: 24,
  },
  bubbleCelebrate: { backgroundColor: colors.river },
  bubbleText: { color: '#FFFFFF', fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  spot: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  spotCelebrate: { backgroundColor: colors.sun },
  art: { marginBottom: -6 },
});
