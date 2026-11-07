import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { useNewDoorCode } from '@/lib/booking/hooks';
import { useArtisan } from '@/lib/catalogue/hooks';
import type { BookingDetail } from '@/lib/booking/types';
import { appAlert } from '@/components/ui/AppAlert';

/** True while the door-code card has something to say (the artisan has arrived and a code exists). */
export function hasDoorCode(booking?: BookingDetail | null): boolean {
  return !!booking && booking.status === 'Arrived' && (!!booking.doorCodeRequired || !!booking.doorCodeConfirmedAtUtc);
}

/**
 * The check at the door. The customer compares the face with the artisan's photo just above (tap it for
 * full size) and reads the code out; the artisan types it into Servika Pro. Green once they have, red after too many wrong
 * tries, with a new code one tap away.
 */
export function DoorCodeCard({
  booking,
  artisanName,
  compact = false,
}: {
  booking: BookingDetail;
  artisanName?: string | null;
  /** Tighter spacing for the map screen. */
  compact?: boolean;
}) {
  const newCode = useNewDoorCode();
  // Shares the cache with the other artisan reads on the screen.
  const { data: artisan } = useArtisan(hasDoorCode(booking) ? (booking.artisanId ?? undefined) : undefined);
  if (!hasDoorCode(booking)) return null;

  const first = (artisanName || artisan?.fullName || booking.artisanName)?.trim().split(/\s+/)[0] || 'the artisan';
  const confirmed = !!booking.doorCodeConfirmedAtUtc;
  const locked = !!booking.doorCodeLocked;

  const showNewCode = () =>
    newCode.mutate(booking.id, {
      onError: (e) => appAlert('Could not make a new code', authErrorMessage(e, 'Try again.')),
    });

  if (confirmed) {
    return (
      <View style={[styles.card, styles.ok, compact && styles.compact]}>
        <View style={styles.row}>
          <View style={styles.okIcon}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" style={styles.okTitle}>Code confirmed</AppText>
            <AppText style={styles.okBody}>{first} entered your code. It is them at your door.</AppText>
          </View>
        </View>
      </View>
    );
  }

  if (locked) {
    return (
      <View style={[styles.card, styles.bad, compact && styles.compact]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" style={styles.badTitle}>Wrong code too many times</AppText>
            <AppText style={styles.badBody}>Don&apos;t open up until you are sure it is {first}.</AppText>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={showNewCode} disabled={newCode.isPending} style={styles.badButton}>
          <AppText weight="semibold" style={styles.badButtonLabel}>{newCode.isPending ? 'Making a new code…' : 'Show a new code'}</AppText>
        </Pressable>
      </View>
    );
  }

  const left = booking.doorCodeAttemptsLeft ?? 5;
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <AppText weight="semibold" style={styles.title}>Check it is {first}, then give this code</AppText>
          <AppText style={styles.body}>{first} types it into their app before coming in.</AppText>
        </View>
      </View>
      <View style={styles.digits} accessible accessibilityLabel={`Door code ${(booking.doorCode ?? '').split('').join(' ')}`}>
        {(booking.doorCode ?? '····').split('').map((d, i) => (
          <View key={i} style={styles.digit}>
            <AppText weight="semibold" style={styles.digitText}>{d}</AppText>
          </View>
        ))}
      </View>
      {left < 5 ? (
        <AppText style={styles.tries}>
          {5 - left} wrong {5 - left === 1 ? 'try' : 'tries'} so far. Only give the code to {first}.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#FFF7F0', padding: 14, gap: 12 },
  compact: { padding: 12, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 14.5, lineHeight: 19, color: colors.ink },
  body: { marginTop: 2, fontSize: 12.5, lineHeight: 17, color: colors.inkMuted },
  digits: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  digit: {
    width: 56, height: 64, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3D2B8',
    alignItems: 'center', justifyContent: 'center',
  },
  digitText: { fontSize: 32, color: colors.ink, letterSpacing: 0 },
  tries: { textAlign: 'center', fontSize: 12, color: '#B45309' },
  ok: { borderColor: '#16A34A', backgroundColor: '#EEF9F1' },
  okIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  okTitle: { fontSize: 14.5, color: '#14532D' },
  okBody: { marginTop: 2, fontSize: 12.5, lineHeight: 17, color: '#166534' },
  bad: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  badTitle: { fontSize: 14.5, color: '#7F1D1D' },
  badBody: { marginTop: 2, fontSize: 12.5, lineHeight: 17, color: '#991B1B' },
  badButton: { height: 46, borderRadius: 14, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  badButtonLabel: { fontSize: 14.5, color: '#FFFFFF' },
});
