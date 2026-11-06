import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCategories } from '@/lib/catalogue/hooks';
import { useSubmitEstateEnquiry } from '@/lib/home/hooks';
import { useSelectedArea } from '@/lib/location/areaStore';

const GUTTER = 20;
const FREQUENCIES = ['One-off', 'Monthly', 'Quarterly', 'Twice a year', 'On call'];

function Field({ label, hint, ...input }: { label: string; hint?: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <AppText weight="semibold" style={styles.label}>{label}</AppText>
      <TextInput placeholderTextColor={colors.inkFaint} style={[styles.input, input.multiline && styles.multiline]} {...input} />
      {hint ? <AppText style={styles.hint}>{hint}</AppText> : null}
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      {on ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
      <AppText weight="medium" style={[styles.chipLabel, on && { color: colors.white }]}>{label}</AppText>
    </Pressable>
  );
}

/**
 * Estates, offices and facility managers: they say what the property needs and how often, and the
 * Servika team calls back to plan the visits and the artisans. Nothing is booked or paid here.
 */
export default function EstateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const area = useSelectedArea();
  const categories = useCategories();
  const submit = useSubmitEstateEnquiry();

  const [org, setOrg] = useState('');
  const [contact, setContact] = useState(user?.fullName ?? '');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [location, setLocation] = useState(area ?? '');
  const [units, setUnits] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const toggle = (slug: string) => setServices((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
  const ready = org.trim() && contact.trim() && phone.replace(/\D/g, '').length >= 10 && location.trim() && services.length > 0 && frequency;

  const send = () => {
    setError(null);
    submit.mutate(
      {
        organisationName: org.trim(),
        contactName: contact.trim(),
        contactRole: role.trim() || null,
        phone: phone.trim(),
        email: email.trim() || null,
        location: location.trim(),
        unitCount: units ? Number(units) : null,
        servicesWanted: services,
        frequency: frequency!,
        notes: notes.trim() || null,
      },
      { onSuccess: () => setSent(true), onError: (e) => setError(authErrorMessage(e, 'Could not send. Please try again.')) },
    );
  };

  if (sent) {
    return (
      <View style={[styles.screen, styles.done, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <StatusBar style="dark" />
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark" size={36} color={colors.white} />
        </View>
        <AppText weight="semibold" style={styles.doneTitle}>Thanks, we have it</AppText>
        <AppText style={styles.doneBody}>
          Someone from the Servika team will call {phone.trim()} to plan the visits for {org.trim()}.
        </AppText>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={[styles.submit, { alignSelf: 'stretch', marginTop: 'auto' }]}>
          <AppText weight="semibold" style={styles.submitLabel}>Back to Home</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <AppText weight="semibold" style={styles.title}>Estates and offices</AppText>
      </View>

      <KeyboardAwareScrollView bottomOffset={24} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 18 }}>
        <View style={styles.intro}>
          <Ionicons name="business-outline" size={22} color={colors.orangeOnDark} />
          <AppText style={styles.introText}>
            Tell us what the property needs and we&apos;ll call you back.
          </AppText>
        </View>

        <Field label="Estate or company name" value={org} onChangeText={setOrg} placeholder="e.g. Ikate Gardens Estate" maxLength={120} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Your name" value={contact} onChangeText={setContact} maxLength={120} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Your role" value={role} onChangeText={setRole} placeholder="Estate manager" maxLength={120} />
          </View>
        </View>
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0803 000 0000" maxLength={20} hint="Only the Servika team sees this." />
        <Field label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={160} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 2 }}>
            <Field label="Where" value={location} onChangeText={setLocation} placeholder="Area, e.g. Lekki Phase 1" maxLength={160} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Units" value={units} onChangeText={(t) => setUnits(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="48" maxLength={6} />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <AppText weight="semibold" style={styles.label}>What do you need?</AppText>
          <View style={styles.chips}>
            {(categories.data ?? []).map((c) => (
              <Chip key={c.slug} label={c.name} on={services.includes(c.slug)} onPress={() => toggle(c.slug)} />
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <AppText weight="semibold" style={styles.label}>How often?</AppText>
          <View style={styles.chips}>
            {FREQUENCIES.map((f) => (
              <Chip key={f} label={f} on={frequency === f} onPress={() => setFrequency(f)} />
            ))}
          </View>
        </View>

        <Field
          label="Anything else (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={1000}
          placeholder="e.g. Quarterly AC servicing for all units, generator checks every month."
        />

        {error ? <AppText weight="medium" style={styles.error}>{error}</AppText> : null}
        <Pressable accessibilityRole="button" disabled={!ready || submit.isPending} onPress={send} style={[styles.submit, (!ready || submit.isPending) && { opacity: 0.5 }]}>
          <AppText weight="semibold" style={styles.submitLabel}>{submit.isPending ? 'Sending…' : 'Send to the Servika team'}</AppText>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: GUTTER, paddingBottom: 14 },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  title: { fontSize: 22, letterSpacing: -0.5, color: colors.ink },
  intro: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 20, backgroundColor: '#14171B' },
  introText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: 'rgba(255,255,255,0.82)' },
  label: { fontSize: 13.5, color: colors.ink },
  input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.hairlineStrong, backgroundColor: colors.white, fontSize: 15, color: colors.ink },
  multiline: { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: colors.inkSubtle },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 38, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipLabel: { fontSize: 13, color: colors.ink },
  error: { fontSize: 13, color: '#B91C1C' },
  submit: { height: 54, borderRadius: 16, alignItems: 'stretch', justifyContent: 'center', backgroundColor: colors.accentDeep },
  submitLabel: { fontSize: 15.5, textAlign: 'center', color: colors.white },
  done: { alignItems: 'center', paddingHorizontal: 28 },
  doneIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.onlineInk },
  doneTitle: { marginTop: 20, fontSize: 22, color: colors.ink },
  doneBody: { marginTop: 8, fontSize: 14, lineHeight: 20, textAlign: 'center', color: colors.inkMuted },
});
