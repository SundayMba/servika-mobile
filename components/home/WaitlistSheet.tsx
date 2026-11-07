import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { joinWaitlist } from '@/lib/home/waitlist';
import { useSelectedArea } from '@/lib/location/areaStore';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Join the waitlist without leaving the app: an email (prefilled when signed in), sent to the same
 * list as the website, with the area the customer is looking from.
 */
export function WaitlistSheet({
  visible,
  onClose,
  reason,
}: {
  visible: boolean;
  onClose: () => void;
  /** "paused": no services open anywhere yet. "area": nobody within reach of this area yet. */
  reason: 'paused' | 'area';
}) {
  const { user } = useAuth();
  const area = useSelectedArea();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | { existing: boolean }>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEmail(user?.email ?? '');
      setDone(null);
      setError(null);
    }
  }, [visible, user?.email]);

  const submit = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setSending(true);
    try {
      setDone(await joinWaitlist(value, area || null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add you. Try again.');
    } finally {
      setSending(false);
    }
  };

  const place = area ? area.split(',')[0] : '';

  return (
    <BottomSheet visible={visible} onClose={onClose} estimatedHeight={360}>
      <View style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 18, gap: 12 }}>
        {done ? (
          <>
            <View style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F5EE' }}>
              <Ionicons name="checkmark" size={26} color={colors.onlineInk} />
            </View>
            <AppText weight="semibold" style={{ fontSize: 21, color: colors.ink }}>
              {done.existing ? "You're already on the list" : "You're on the list"}
            </AppText>
            <AppText style={{ fontSize: 14.5, lineHeight: 21, color: colors.inkMuted }}>
              {reason === 'paused'
                ? "We'll email you the day you can book."
                : `We'll email you when an artisan near ${place || 'you'} joins.`}
            </AppText>
            <Button label="Done" onPress={onClose} />
          </>
        ) : (
          <>
            <AppText weight="semibold" style={{ fontSize: 21, color: colors.ink }}>Join the waitlist</AppText>
            <AppText style={{ fontSize: 14.5, lineHeight: 21, color: colors.inkMuted }}>
              {reason === 'paused'
                ? "One email the day bookings open. Nothing else."
                : `One email when an artisan near ${place || 'you'} joins. Nothing else.`}
            </AppText>
            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              placeholderTextColor={colors.inkSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={submit}
              style={{ height: 52, borderRadius: 16, borderWidth: 1, borderColor: error ? '#FCA5A5' : colors.hairlineStrong, backgroundColor: colors.white, paddingHorizontal: 14, fontSize: 16, color: colors.ink }}
            />
            {error ? <AppText style={{ fontSize: 13, color: '#B91C1C' }}>{error}</AppText> : null}
            <Button label="Join the waitlist" loading={sending} onPress={submit} />
          </>
        )}
      </View>
    </BottomSheet>
  );
}
