import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { authErrorMessage, becomeArtisan } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  useSaveArtisanProfile,
  useSubmitKyc,
} from '@/lib/artisan/onboardingHooks';
import type { KycIdType } from '@/lib/artisan/profileTypes';
import { useCategories } from '@/lib/catalogue/hooks';

type Shot = { uri: string; base64: string } | null;

const ID_TYPES: { value: KycIdType; label: string }[] = [
  { value: 'Nin', label: 'NIN' },
  { value: 'VotersCard', label: "Voter's Card" },
  { value: 'DriversLicense', label: "Driver's Licence" },
  { value: 'Passport', label: 'Passport' },
];

const STEPS = ['Your work', 'Identity', 'Review'];

async function pick(fromCamera: boolean): Promise<Shot> {
  const perm = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow access to add your photo.');
    return null;
  }
  const res = fromCamera
    ? await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        quality: 0.6,
        base64: true,
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        base64: true,
      });
  if (res.canceled) return null;
  const asset = res.assets[0];

  // Shrink hard before upload — KYC images only need to be legible, and a full
  // 12–108MP photo as base64 can blow past the request-size limit. Fall back to
  // the raw image if the compressor isn't available in this build.
  try {
    const shrunk = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 900 } }],
      { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return { uri: shrunk.uri, base64: shrunk.base64 ?? asset.base64 ?? '' };
  } catch {
    return { uri: asset.uri, base64: asset.base64 ?? '' };
  }
}

export default function GetVerified() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const { data: categories } = useCategories();
  const saveProfile = useSaveArtisanProfile();
  const submitKyc = useSubmitKyc();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — work / profile
  const [specialty, setSpecialty] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');
  const [location, setLocation] = useState('');
  const [about, setAbout] = useState('');
  const [servicesText, setServicesText] = useState('');

  // Step 2 — identity
  const [idType, setIdType] = useState<KycIdType>('Nin');
  const [idNumber, setIdNumber] = useState('');
  const [idDoc, setIdDoc] = useState<Shot>(null);
  const [selfie, setSelfie] = useState<Shot>(null);

  const services = useMemo(
    () =>
      servicesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [servicesText],
  );

  const toggleCategory = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const step1Valid =
    specialty.trim().length > 1 &&
    selected.size > 0 &&
    Number(fee) > 0 &&
    location.trim().length > 1;
  const step2Valid = !!idDoc?.base64 && !!selfie?.base64;

  const submitting = saveProfile.isPending || submitKyc.isPending;

  const next = () => {
    setError(null);
    if (step === 0 && !step1Valid) {
      setError('Add your specialty, at least one category, your fee and location.');
      return;
    }
    if (step === 1 && !step2Valid) {
      setError('Add a photo of your ID and a selfie.');
      return;
    }
    setStep((s) => Math.min(2, s + 1));
  };

  const back = () => {
    setError(null);
    if (step === 0) router.back();
    else setStep((s) => s - 1);
  };

  const submit = async () => {
    setError(null);
    let stage = 'upgrade';
    try {
      // "Become a Pro": a customer must be upgraded to Artisan before the
      // artisan-only endpoints will authorize. Idempotent for existing artisans.
      if (user?.role !== 'Artisan') {
        const session = await becomeArtisan();
        await signIn(session);
      }
      stage = 'profile';
      await saveProfile.mutateAsync({
        specialty: specialty.trim(),
        categorySlugs: [...selected],
        services,
        about: about.trim(),
        experienceYears: Number(experience) || 0,
        location: location.trim(),
        inspectionFeeNaira: Number(fee) || 0,
        latitude: null,
        longitude: null,
        imageKey: null,
      });
      stage = 'kyc';
      await submitKyc.mutateAsync({
        idType,
        idNumber: idNumber.trim() || null,
        selfieBase64: selfie!.base64,
        idImageBase64: idDoc!.base64,
      });
      router.replace('/pro');
    } catch (e) {
      // Diagnostic: which call failed, the HTTP status, and the upload size — so
      // we can tell a 413 (too big) / 403 (role) / timeout apart at a glance.
      const kb = Math.round(
        ((selfie?.base64.length ?? 0) + (idDoc?.base64.length ?? 0)) / 1024,
      );
      const err = e as { response?: { status?: number }; code?: string; message?: string };
      const status = err?.response?.status ?? err?.code ?? 'no-response';
      setError(
        `${authErrorMessage(e, 'Could not submit.')}\n[debug: ${stage} failed · ${status} · payload ~${kb}KB]`,
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header + progress */}
      <View className="px-5 pb-3 pt-1">
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            onPress={back}
            className="h-10 w-10 items-center justify-center rounded-full bg-background"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text className="text-[15px] font-bold text-gray-900">
            Get Verified
          </Text>
          <Text className="text-[13px] font-semibold text-gray-400">
            {step + 1}/3
          </Text>
        </View>
        <View className="mt-3 flex-row gap-1.5">
          {STEPS.map((_, i) => (
            <View
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{ backgroundColor: i <= step ? colors.primary : '#E5E7EB' }}
            />
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 }}
      >
        {step === 0 ? (
          <Animated.View entering={FadeIn.duration(250)}>
            <Text className="text-[20px] font-extrabold text-gray-900">
              Tell us about your work
            </Text>
            <Text className="mb-5 mt-1 text-[13px] text-gray-500">
              This is what customers see on your profile.
            </Text>

            <Field label="Specialty" value={specialty} onChangeText={setSpecialty} placeholder="e.g. Electrical Specialist" />

            <Text className="mb-2 mt-1 text-[12px] font-medium text-gray-500">
              Services you offer
            </Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {(categories ?? []).map((c) => {
                const on = selected.has(c.slug);
                return (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => toggleCategory(c.slug)}
                    className="rounded-full border px-3.5 py-2"
                    style={{
                      backgroundColor: on ? colors.primary : '#FFFFFF',
                      borderColor: on ? colors.primary : '#E5E7EB',
                    }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: on ? '#FFFFFF' : colors.textSecondary }}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  label="Years of experience"
                  value={experience}
                  onChangeText={(t) => setExperience(t.replace(/[^0-9]/g, ''))}
                  placeholder="5"
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <Field
                  label="Call-out fee (₦)"
                  value={fee}
                  onChangeText={(t) => setFee(t.replace(/[^0-9]/g, ''))}
                  placeholder="5000"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Field label="Location (area, city)" value={location} onChangeText={setLocation} placeholder="Lekki, Lagos" />
            <Field
              label="Specific services (comma separated)"
              value={servicesText}
              onChangeText={setServicesText}
              placeholder="Installation, Repair, Maintenance"
            />
            <Field
              label="About you"
              value={about}
              onChangeText={setAbout}
              placeholder="A short intro customers will read"
              multiline
            />
          </Animated.View>
        ) : step === 1 ? (
          <Animated.View entering={FadeIn.duration(250)}>
            <Text className="text-[20px] font-extrabold text-gray-900">
              Verify your identity
            </Text>
            <Text className="mb-5 mt-1 text-[13px] leading-5 text-gray-500">
              A quick check keeps Servika safe for everyone. Any one government ID
              works.
            </Text>

            <Text className="mb-2 text-[12px] font-medium text-gray-500">ID type</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {ID_TYPES.map((t) => {
                const on = idType === t.value;
                return (
                  <Pressable
                    key={t.value}
                    accessibilityRole="button"
                    onPress={() => setIdType(t.value)}
                    className="rounded-full border px-3.5 py-2"
                    style={{
                      backgroundColor: on ? colors.primary : '#FFFFFF',
                      borderColor: on ? colors.primary : '#E5E7EB',
                    }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: on ? '#FFFFFF' : colors.textSecondary }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Field
              label="ID number (optional)"
              value={idNumber}
              onChangeText={setIdNumber}
              placeholder="e.g. NIN number"
            />

            <UploadTile
              label="Photo of your ID"
              hint="Clear photo, all corners visible"
              icon="card-outline"
              shot={idDoc}
              onPress={async () => setIdDoc((await pick(false)) ?? idDoc)}
            />
            <UploadTile
              label="Selfie"
              hint="Face clearly visible, good lighting"
              icon="camera-outline"
              shot={selfie}
              onPress={async () => setSelfie((await pick(true)) ?? selfie)}
            />

            <View className="mt-2 flex-row items-start gap-2 rounded-2xl bg-background p-3.5">
              <Ionicons name="lock-closed" size={15} color={colors.textMuted} />
              <Text className="flex-1 text-[12px] leading-4 text-gray-500">
                Your documents are used only for verification and are never shown
                to customers.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(250)}>
            <Text className="text-[20px] font-extrabold text-gray-900">
              Review & submit
            </Text>
            <Text className="mb-5 mt-1 text-[13px] text-gray-500">
              Confirm your details before submitting for verification.
            </Text>

            <ReviewRow label="Specialty" value={specialty} />
            <ReviewRow
              label="Services"
              value={[...selected]
                .map((s) => categories?.find((c) => c.slug === s)?.name ?? s)
                .join(', ')}
            />
            <ReviewRow label="Experience" value={experience ? `${experience} yrs` : '—'} />
            <ReviewRow label="Call-out fee" value={`₦${Number(fee || 0).toLocaleString('en-NG')}`} />
            <ReviewRow label="Location" value={location} />
            <ReviewRow label="ID type" value={ID_TYPES.find((t) => t.value === idType)?.label ?? idType} />

            <View className="mt-3 flex-row gap-3">
              {idDoc ? (
                <Image source={{ uri: idDoc.uri }} style={{ flex: 1, height: 90, borderRadius: 14 }} contentFit="cover" />
              ) : null}
              {selfie ? (
                <Image source={{ uri: selfie.uri }} style={{ flex: 1, height: 90, borderRadius: 14 }} contentFit="cover" />
              ) : null}
            </View>
          </Animated.View>
        )}

        {error ? (
          <Text className="mt-4 text-[13px] font-medium text-red-500">{error}</Text>
        ) : null}
      </ScrollView>

      {/* Sticky action */}
      <View className="border-t border-gray-100 px-5 pb-5 pt-3">
        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={step === 2 ? submit : next}
          className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
          style={submitting ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-[16px] font-bold text-white">
            {submitting
              ? 'Submitting…'
              : step === 2
                ? 'Submit for verification'
                : 'Continue'}
          </Text>
          {!submitting && step < 2 ? (
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          ) : null}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Field({
  label,
  multiline,
  ...inputProps
}: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[12px] font-medium text-gray-500">{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] text-gray-900"
        style={multiline ? { minHeight: 88, textAlignVertical: 'top' } : undefined}
        {...inputProps}
      />
    </View>
  );
}

function UploadTile({
  label,
  hint,
  icon,
  shot,
  onPress,
}: {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  shot: Shot;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-2xl border border-dashed p-3"
      style={{ borderColor: shot ? colors.primary : '#D1D5DB', backgroundColor: shot ? '#FFF4EC' : '#FFFFFF' }}
    >
      {shot ? (
        <Image source={{ uri: shot.uri }} style={{ width: 52, height: 52, borderRadius: 12 }} contentFit="cover" />
      ) : (
        <View className="h-[52px] w-[52px] items-center justify-center rounded-xl bg-background">
          <Ionicons name={icon} size={22} color={colors.textMuted} />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-gray-900">{label}</Text>
        <Text className="mt-0.5 text-[12px] text-gray-400">{shot ? 'Tap to retake' : hint}</Text>
      </View>
      <Ionicons
        name={shot ? 'checkmark-circle' : 'add-circle-outline'}
        size={22}
        color={shot ? '#16A34A' : colors.primary}
      />
    </Pressable>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 py-3">
      <Text className="text-[13px] text-gray-500">{label}</Text>
      <Text className="max-w-[60%] text-right text-[14px] font-semibold text-gray-900">
        {value || '—'}
      </Text>
    </View>
  );
}
