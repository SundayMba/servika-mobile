import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { useRecordInterest } from '@/lib/home/hooks';
import { useSelectedArea, useSelectedCoords } from '@/lib/location/areaStore';

/**
 * "Tell us what you need" (Business Model v1.4, section 15). For a coming-soon service, or an area
 * Servika does not cover yet. Records demand so supply follows it; promises nothing else.
 */
export function InterestSheet({
  visible,
  onClose,
  category,
  reason = 'service',
}: {
  visible: boolean;
  onClose: () => void;
  /** The coming-soon category, if one was tapped. */
  category?: { slug: string; name: string } | null;
  reason?: 'service' | 'area';
}) {
  const area = useSelectedArea();
  const coords = useSelectedCoords();
  const record = useRecordInterest();
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setNote('');
      setSent(false);
      setError(null);
    }
  }, [visible, category?.slug]);

  const title = reason === 'area' ? 'Not in your area yet' : category ? `${category.name} is coming soon` : 'What service do you need?';
  const lede =
    reason === 'area'
      ? `Tell us you are in ${area || 'your area'}.`
      : category
        ? 'Tell us what you need.'
        : 'Tell us the service you are looking for.';

  const send = () => {
    if (!category && !note.trim()) {
      setError('Say what you need.');
      return;
    }
    setError(null);
    record.mutate(
      {
        categorySlug: category?.slug ?? null,
        note: note.trim() || null,
        areaLabel: area || null,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      },
      { onSuccess: () => setSent(true), onError: (e) => setError(authErrorMessage(e, 'Could not send. Try again.')) },
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} estimatedHeight={380}>
      <View style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 18, gap: 12 }}>
        {sent ? (
          <>
            <View style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F5EE' }}>
              <Ionicons name="checkmark" size={26} color={colors.onlineInk} />
            </View>
            <AppText weight="semibold" style={{ fontSize: 21, color: colors.ink }}>Thanks, we got it.</AppText>
            <Button label="Done" onPress={onClose} />
          </>
        ) : (
          <>
            <AppText weight="semibold" style={{ fontSize: 21, color: colors.ink }}>{title}</AppText>
            <AppText style={{ fontSize: 14.5, lineHeight: 21, color: colors.inkMuted }}>{lede}</AppText>
            <TextInput
              value={note}
              onChangeText={(t) => setNote(t.slice(0, 300))}
              placeholder={reason === 'area' ? 'Anything we should know (optional)' : category ? 'What needs doing? (optional)' : 'e.g. Pest control, roof repair, CCTV installation'}
              placeholderTextColor={colors.inkSubtle}
              multiline
              style={{ minHeight: 84, borderRadius: 16, borderWidth: 1, borderColor: colors.hairlineStrong, backgroundColor: colors.white, padding: 14, fontSize: 15, color: colors.ink, textAlignVertical: 'top' }}
            />
            {error ? <AppText style={{ fontSize: 13, color: '#B91C1C' }}>{error}</AppText> : null}
            <Button label={record.isPending ? 'Sending…' : 'Send'} onPress={send} />
          </>
        )}
      </View>
    </BottomSheet>
  );
}
