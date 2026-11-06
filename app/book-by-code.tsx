import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { artisanPhotoSource } from '@/lib/catalogue/assets';
import { useArtisanByCode } from '@/lib/catalogue/hooks';

/**
 * Book an artisan by their personal code or link (Business Model v1.4, section 15). The code
 * reveals one artisan and nothing to browse; the request goes to them first, then opens for bids.
 */
export default function BookByCode() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState((params.code ?? '').toUpperCase());
  const clean = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const [lookup, setLookup] = useState<string | undefined>(clean.length >= 3 ? clean : undefined);
  const { data: artisan, isFetching, isError } = useArtisanByCode(lookup);
  const { guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();

  useEffect(() => {
    if (params.code) setLookup(params.code.replace(/[^A-Z0-9]/gi, '').toUpperCase());
  }, [params.code]);

  const check = () => setLookup(clean.length >= 3 ? clean : undefined);
  const book = () => {
    if (!artisan) return;
    guard(() =>
      router.push({
        pathname: '/booking/request',
        params: { service: artisan.specialty, artisanId: artisan.id, bookingCode: artisan.bookingCode },
      }),
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-row items-center gap-3 px-5 pt-2">
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} className="h-10 w-10 items-center justify-center rounded-full bg-white">
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <AppText weight="semibold" className="text-[18px] text-gray-900">Book with a code</AppText>
        </View>

        <View className="px-5 pt-6">
          <AppText className="text-[14px] leading-5 text-gray-500">
            Type or scan the code an artisan gave you.
          </AppText>
          <View className="mt-4 flex-row items-center gap-2">
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              onSubmitEditing={check}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="EMEKA42"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[20px] tracking-[4px] text-gray-900"
            />
            <Pressable accessibilityRole="button" onPress={check} disabled={clean.length < 3} className={`h-[54px] items-center justify-center rounded-2xl px-4 ${clean.length < 3 ? 'bg-gray-200' : 'bg-gray-900'}`}>
              <AppText weight="semibold" className="text-[14px] text-white">Find</AppText>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/scan-code')}
            className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white"
          >
            <Ionicons name="qr-code-outline" size={18} color={colors.textPrimary} />
            <AppText weight="semibold" className="text-[14px] text-gray-900">Scan their QR instead</AppText>
          </Pressable>

          {isFetching ? (
            <View className="mt-8 items-center"><ActivityIndicator color={colors.accentDeep} /></View>
          ) : isError && lookup ? (
            <View className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4">
              <AppText weight="semibold" className="text-[14px] text-red-700">No artisan has the code {lookup}</AppText>
              <AppText className="mt-1 text-[13px] leading-[18px] text-red-700/80">Check the letters and numbers with the artisan. Codes look like EMEKA42.</AppText>
            </View>
          ) : artisan ? (
            <View className="mt-6 rounded-2xl border border-gray-100 bg-white p-4">
              <View className="flex-row items-center gap-3">
                <Image source={artisanPhotoSource(artisan.photoUrl, '')} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EEE' }} contentFit="cover" />
                <View className="flex-1">
                  <AppText weight="semibold" className="text-[17px] text-gray-900">{artisan.fullName}</AppText>
                  <AppText className="mt-0.5 text-[13px] text-gray-500">{artisan.specialty}{artisan.location ? ` · ${artisan.location.split(',')[0]}` : ''}</AppText>
                  <View className="mt-1 flex-row items-center gap-1">
                    <Ionicons name="shield-checkmark" size={13} color={colors.onlineInk} />
                    <AppText className="text-[12px] text-gray-600">
                      ID checked{artisan.completedJobs > 0 ? ` · ${artisan.completedJobs} job${artisan.completedJobs === 1 ? '' : 's'} done on Servika` : ''}
                    </AppText>
                  </View>
                </View>
              </View>
              {artisan.isAway ? (
                <View className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5">
                  <AppText className="text-[12.5px] leading-4 text-amber-800">{artisan.firstName} is away right now. You can still send the request; if they cannot take it, your job opens to other artisans to price.</AppText>
                </View>
              ) : null}
              <View className="mt-4">
                <Button label={`Book ${artisan.firstName}`} onPress={book} />
              </View>
              <AppText className="mt-2 text-center text-[12px] text-gray-400">Goes to {artisan.firstName} first. You pay in the app, after a price is agreed.</AppText>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
      <AuthPromptSheet visible={promptVisible} onClose={hidePrompt} onSignedIn={onSignedIn} reason="book" />
    </SafeAreaView>
  );
}
