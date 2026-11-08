import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCalendar } from '@/store/calendar';
import { colors, fonts, MAX_WIDTH } from '@/theme';

import { WeekIcon } from './icons';

const COPY: Record<string, { title: string; body: string }> = {
  unavailable: {
    title: 'Calendar works on the web for now',
    body: 'Open Pebble in your browser to connect Google Calendar. The phone app gets it later.',
  },
  'not-set-up': {
    title: "Calendar isn't set up yet",
    body: 'Pebble needs its Google key first. Once it has one, you can connect here.',
  },
  off: {
    title: 'Connect Google Calendar',
    body: "Your events show up on Today, and any task you switch on goes onto your calendar. Move it there and Pebble moves it too. Only tasks you choose ever go to Google.",
  },
  connecting: { title: 'Connecting…', body: 'Finish signing in with Google in the window that opened.' },
  'needs-tap': {
    title: 'Calendar needs a tap',
    body: 'Google wants you to confirm before Pebble reads your calendar again.',
  },
  on: { title: 'Google Calendar is connected', body: 'Pebble checks for changes every few minutes and when you come back to the app.' },
};

export function CalendarSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { status, error, connect, disconnect, refresh } = useCalendar();
  const insets = useSafeAreaInsets();
  const copy = COPY[status];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.icon}>
              <WeekIcon color={colors.river} size={26} />
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" style={styles.close}>
              <Text style={styles.link}>Done</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          {error && status !== 'on' ? <Text style={styles.error}>{error}</Text> : null}

          {(status === 'off' || status === 'needs-tap') && (
            <Pressable onPress={connect} accessibilityRole="button" style={styles.primary}>
              <Text style={styles.primaryText}>{status === 'off' ? 'Connect Google Calendar' : 'Reconnect'}</Text>
            </Pressable>
          )}
          {status === 'on' && (
            <View style={styles.row}>
              <Pressable onPress={refresh} accessibilityRole="button" style={styles.secondary}>
                <Text style={styles.secondaryText}>Check now</Text>
              </Pressable>
              <Pressable onPress={disconnect} accessibilityRole="button" style={styles.secondary}>
                <Text style={styles.secondaryText}>Disconnect</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(31, 42, 51, 0.45)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    backgroundColor: colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 10,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 999, backgroundColor: '#C9D3D9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.riverTint, alignItems: 'center', justifyContent: 'center' },
  close: { padding: 10, marginRight: -10 },
  link: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.river },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, color: colors.wetStone },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.body },
  error: { fontFamily: fonts.bodySemi, fontSize: 14, color: '#B23A3A' },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primary: { marginTop: 6, minHeight: 52, borderRadius: 999, backgroundColor: colors.river, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: fonts.heading, fontSize: 17, color: '#FFFFFF' },
  secondary: { flex: 1, minHeight: 48, borderRadius: 999, backgroundColor: colors.mist, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.headingBold, fontSize: 16, color: colors.wetStone },
});
