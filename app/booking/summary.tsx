import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingSteps } from '@/components/booking/BookingSteps';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { formatDate } from '@/lib/booking/display';
import { useCreateBooking } from '@/lib/booking/hooks';
import type { CreateBookingRequest, Urgency } from '@/lib/booking/types';
import { artisanPhotoSource, formatNaira } from '@/lib/catalogue/assets';
import { useArtisan } from '@/lib/catalogue/hooks';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
      <Text className="mb-2 text-[12px] font-bold uppercase tracking-wide text-gray-400">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between py-1">
      <Text className="text-[13px] text-gray-500">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-[13px] font-medium text-gray-900">
        {value}
      </Text>
    </View>
  );
}

export default function BookingSummary() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    service?: string;
    artisanId?: string;
    categorySlug?: string;
    open?: string;
    description?: string;
    date?: string;
    time?: string;
    urgency?: string;
    instructions?: string;
    addressText?: string;
    lat?: string;
    lng?: string;
    photos?: string;
  }>();

  // Open request: no artisan chosen — any matching artisan can claim it, and there's
  // no up-front payment (the price is quoted after inspection). We post it here.
  const isOpen = params.open === '1';

  const { data: artisan, isLoading: artisanLoading } = useArtisan(
    isOpen ? undefined : params.artisanId,
  );

  const serviceName = params.service ?? 'Service Request';
  const categorySlug = isOpen ? params.categorySlug : artisan?.categorySlugs?.[0];
  const inspectionFee = artisan?.inspectionFeeNaira;
  const photoCount = (() => {
    try {
      return params.photos ? (JSON.parse(params.photos) as string[]).length : 0;
    } catch {
      return 0;
    }
  })();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { mutateAsync: createBooking } = useCreateBooking();

  const canProceed =
    !!categorySlug && !!params.addressText && (isOpen || !artisanLoading);

  const handleProceed = async () => {
    if (!categorySlug) return;

    // Pre-selected artisan → continue to the payment step (call-out fee / escrow).
    if (!isOpen) {
      router.push({
        pathname: '/booking/payment',
        params: {
          ...params,
          categorySlug,
          serviceName,
          artisanName: artisan?.fullName ?? '',
          amount: inspectionFee != null ? String(inspectionFee) : '',
        },
      });
      return;
    }

    // Open request → post it now (no artisan, no payment) and go to success.
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const body: CreateBookingRequest = {
        categorySlug,
        artisanId: null,
        description: params.description ?? '',
        preferredDate: params.date ?? new Date().toISOString(),
        preferredTimeSlot: params.time ?? '',
        urgency: (params.urgency === 'urgent' ? 'urgent' : 'standard') as Urgency,
        addressText: params.addressText ?? '',
        locationLat: params.lat ? Number(params.lat) : null,
        locationLng: params.lng ? Number(params.lng) : null,
        locationInstructions: params.instructions || null,
      };
      const booking = await createBooking(body);
      router.replace({
        pathname: '/booking/success',
        params: {
          bookingId: booking.id,
          serviceName: booking.serviceName,
          date: booking.preferredDate,
          time: booking.preferredTimeSlot,
          open: '1',
        },
      });
    } catch (err) {
      setErrorMsg(authErrorMessage(err, 'Could not post your request.'));
    } finally {
      setSubmitting(false);
    }
  };

  const avatar = artisan ? artisanPhotoSource(artisan.photoUrl, artisan.imageKey) : undefined;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View className="items-center">
          <Text className="text-[17px] font-bold text-gray-900">
            Booking Summary
          </Text>
          <Text className="text-[12px] text-gray-500">{serviceName}</Text>
        </View>
      </View>

      {/* Steps */}
      <View className="px-5 py-4">
        <BookingSteps current={3} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 24 }}
      >
        {/* Open request banner (no artisan chosen) */}
        {isOpen ? (
          <View className="flex-row items-center rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="megaphone-outline" size={22} color={colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[15px] font-bold text-gray-900">Open request</Text>
              <Text className="text-[12px] leading-4 text-gray-500">
                We&apos;ll match you with a verified {serviceName.toLowerCase()} pro nearby — the
                first to accept takes the job.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Artisan */}
        {artisan ? (
          <View className="flex-row items-center rounded-2xl border border-gray-100 bg-white p-4">
            {avatar ? (
              <Image
                source={avatar}
                style={{ width: 48, height: 48, borderRadius: 24 }}
                contentFit="cover"
              />
            ) : (
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
            )}
            <View className="ml-3 flex-1">
              <Text className="text-[15px] font-bold text-gray-900">
                {artisan.fullName}
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={13} color={colors.primary} />
                <Text className="text-[12px] text-gray-600">
                  {artisan.rating.toFixed(1)} ({artisan.reviewCount} reviews)
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Job */}
        <Section title="Job">
          <Row label="Service" value={serviceName} />
          {params.description ? (
            <Text className="mt-1 text-[13px] leading-5 text-gray-700">
              {params.description}
            </Text>
          ) : null}
          {photoCount > 0 ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Ionicons name="images-outline" size={14} color={colors.textMuted} />
              <Text className="text-[12px] text-gray-500">
                {photoCount} photo{photoCount > 1 ? 's' : ''} attached
              </Text>
            </View>
          ) : null}
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <Row label="Date" value={formatDate(params.date) || 'Not set'} />
          <Row label="Time" value={params.time || 'Not set'} />
          <Row
            label="Urgency"
            value={
              params.urgency === 'urgent'
                ? 'Urgent (2–4h)'
                : 'Standard (24–48h)'
            }
          />
        </Section>

        {/* Location */}
        <Section title="Location">
          <Text className="text-[13px] leading-5 text-gray-900">
            {params.addressText ?? 'No address provided'}
          </Text>
          {params.instructions ? (
            <Text className="mt-1 text-[12px] leading-4 text-gray-500">
              {params.instructions}
            </Text>
          ) : null}
        </Section>

        {/* Pricing */}
        <Section title="Pricing">
          {!isOpen && inspectionFee != null ? (
            <Row
              label="Call-out / inspection fee"
              value={formatNaira(inspectionFee)}
            />
          ) : null}
          <Text className="mt-1 text-[12px] leading-4 text-gray-500">
            {isOpen
              ? 'No payment now. The artisan quotes the price after inspecting the job, and you pay securely through Servika.'
              : 'Final price is quoted after the artisan inspects the job. You only pay the call-out fee now.'}
          </Text>
        </Section>

        {errorMsg ? (
          <View className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3">
            <Text className="text-[13px] text-red-600">{errorMsg}</Text>
          </View>
        ) : null}

        {/* Proceed */}
        <View className="mt-6">
          <Button
            label={isOpen ? 'Post Request' : 'Proceed to Payment'}
            loading={submitting || (!isOpen && artisanLoading)}
            disabled={!canProceed}
            onPress={handleProceed}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
