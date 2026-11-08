import { useEffect, useId, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, View, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { PEBBLE_ART, type Mood } from '@/pebble/art';

const MOOD_LABEL: Record<Mood, string> = {
  default: 'Pebble the otter, holding his rock',
  celebrating: 'Pebble cheering with his rock in the air',
  judging: 'Pebble raising an eyebrow',
  predicting: 'Pebble thinking, paw on chin',
  sleepy: 'Pebble asleep in a nightcap',
  rainy: 'Pebble under a rain cloud',
};

type Props = { mood: Mood; size: number; style?: ViewStyle; still?: boolean };

/** Pebble at any size, gently bobbing like on the mood page. */
export function PebbleArt({ mood, size, style, still }: Props) {
  // Gradient ids must be unique per drawing: on web, two Pebbles on the page (or one on a hidden
  // tab) would otherwise point at each other's gradients and lose their colors.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const xml = useMemo(
    () => PEBBLE_ART[mood].replace(/id="([^"]+)"/g, `id="$1-${uid}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-${uid})`),
    [mood, uid],
  );
  const bob = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (still) return;
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduced) => {
        if (reduced || cancelled) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(bob, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(bob, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        );
        loop.start();
      });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [bob, still]);

  // A little hop when he celebrates.
  useEffect(() => {
    if (mood !== 'celebrating') return;
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [mood, hop]);

  const translateY = Animated.add(
    bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.02] }),
    hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.12] }),
  );

  return (
    <View style={[{ width: size, height: size * (270 / 240) }, style]} accessibilityRole="image" accessibilityLabel={MOOD_LABEL[mood]}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <SvgXml xml={xml} width={size} height={size * (270 / 240)} />
      </Animated.View>
    </View>
  );
}
