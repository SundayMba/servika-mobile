import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { BookingSteps } from '@/components/booking/BookingSteps';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { formatDate } from '@/lib/booking/display';
import { useCreateBooking } from '@/lib/booking/hooks';
import { bookingMedia } from '@/lib/booking/mediaStore';
import type { CreateBookingRequest, Urgency } from '@/lib/booking/types';
import { artisanPhotoSource, formatNaira } from '@/lib/catalogue/assets';
import { useFeeSchedule } from '@/lib/payments/fees';
import { useArtisan } from '@/lib/catalogue/hooks';
import { startBookingPayment } from '@/lib/payments/checkout';
import { usePhoneGate } from '@/lib/phone/PhoneGate';
import { appAlert } from '@/components/ui/AppAlert';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
      <AppText weight="semibold" className="mb-2 text-[12px] uppercase tracking-wide text-gray-400">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const SAFETY_TERMS_URL = 'https://servika.com.ng/terms#safety';

const SAFETY_POINTS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'wallet-outline', text: 'Put cash, jewellery and small valuables away.' },
  { icon: 'people-outline', text: 'Have an adult at home while the artisan is there.' },
  { icon: 'person-circle-outline', text: 'Check the person at the door is the one shown in the app.' },
  { icon: 'card-outline', text: 'Keep payment in the app.' },
  { icon: 'flag-outline', text: 'Report anything wrong in the app, or call 112 in an emergency.' },
  { icon: 'information-circle-outline', text: 'Servika connects you with independent artisans and does not insure your property.' },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between py-1">
      <AppText className="text-[13px] text-gray-500">{label}</AppText>
      <AppText weight="medium" className="ml-4 flex-1 text-right text-[13px] text-gray-900">
        {value}
      </AppText>
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
    artisanServiceId?: string;
    fixedPrice?: string;
    description?: string;
    date?: string;
    time?: string;
    urgency?: string;
    instructions?: string;
    addressText?: string;
    lat?: string;
    lng?: string;
    photos?: string;
    bookingCode?: string;
    rebook?: string;
    /** A job from Servika's price book: booked at Servika's price and paid here, upfront. */
    priceBookItemId?: string;
    /** From a category screen: "diagnosis" (not sure what's wrong) or "custom". */
    mode?: string;
    customItemId?: string;
  }>();

  // Open request: no artisan chosen — any matching artisan can claim/bid.
  // Direct request: a pre-selected artisan reviews it and sends a quote.
  // Fixed-price: a published service booked at its listed price (paid on accept).
  // Booking itself is always free — nothing is charged now.
  const isOpen = params.open === '1';
  const fixedPrice = params.fixedPrice ? Number(params.fixedPrice) : null;
  const isFixed = !!params.artisanServiceId && fixedPrice != null;
  // A Servika price-book job is paid now; the job is offered to an artisan once the money lands.
  const isPriceBook = !!params.priceBookItemId && fixedPrice != null;
  const feeSchedule = useFeeSchedule();
  // "Not sure what's wrong?": a diagnosis visit at Servika's fee, paid now and credited against the repairs.
  const diagnosisFee = feeSchedule.data?.diagnosisFeeNaira ?? 0;
  const isDiagnosis = params.mode === 'diagnosis' && !isPriceBook && diagnosisFee > 0;
  // "Something else": a paid visit, then an itemised quote the customer accepts or not.
  const isCustom = params.mode === 'custom' && !isPriceBook && diagnosisFee > 0;
  const paysUpfront = isPriceBook || isDiagnosis || isCustom;
  const upfrontAmount = isPriceBook ? fixedPrice! : diagnosisFee;

  const { data: artisan, isLoading: artisanLoading } = useArtisan(
    isOpen ? undefined : params.artisanId,
  );

  const serviceName = params.service ?? 'Service Request';
  // Direct request: the category of the service picked on the request step when
  // it is one of this artisan's, else the artisan's first category.
  const categorySlug = isOpen
    ? params.categorySlug
    : params.categorySlug && artisan?.categorySlugs?.includes(params.categorySlug)
      ? params.categorySlug
      : artisan?.categorySlugs?.[0];
  const photoCount = (() => {
    try {
      return params.photos ? (JSON.parse(params.photos) as string[]).length : 0;
    } catch {
      return 0;
    }
  })();

  const usersBearFees = feeSchedule.data?.usersBearFees === true;

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // The customer agrees to their part in keeping the home safe before anything is sent.
  const [safetyAck, setSafetyAck] = useState(false);
  const [safetyInfo, setSafetyInfo] = useState(false);
  const { mutateAsync: createBooking } = useCreateBooking();
  const phoneGate = usePhoneGate();

  const canProceed =
    !!categorySlug && !!params.addressText && (isOpen || !artisanLoading);

  const handleProceed = async () => {
    if (!categorySlug || !safetyAck) return;

    // Post the request now — open (broadcast) or direct (to the chosen artisan).
    // No payment step: the price is agreed via a quote first, paid after accept.
    setErrorMsg(null);
    setSubmitting(true);
    try {
      // Encoded here rather than on the photos screen, so the string exists for
      // the length of one request instead of three screens (see mediaStore).
      const videoBase64 = await bookingMedia.readVideoBase64();
      const body: CreateBookingRequest = {
        categorySlug,
        artisanId: isOpen ? null : (params.artisanId ?? null),
        description: params.description ?? '',
        preferredDate: params.date ?? new Date().toISOString(),
        preferredTimeSlot: params.time ?? '',
        urgency: (params.urgency === 'urgent' ? 'urgent' : 'standard') as Urgency,
        addressText: params.addressText ?? '',
        locationLat: params.lat ? Number(params.lat) : null,
        locationLng: params.lng ? Number(params.lng) : null,
        locationInstructions: params.instructions || null,
        // A published fixed-price service books at its listed price (server reads
        // the price from the listing — never trusts the client's `fixedPrice`).
        artisanServiceId: params.artisanServiceId ?? null,
        // A personal booking code or a Book-again request; the server records the source.
        bookingCode: params.bookingCode || null,
        rebook: params.rebook === '1',
        priceBookItemId: params.priceBookItemId ?? null,
        diagnosis: isDiagnosis,
        customQuote: isCustom,
        customPriceBookItemId: isCustom ? (params.customItemId ?? null) : null,
        // Job media + pricing mode from the photos step (module store — the
        // base64 blobs are too big for route params).
        assessmentMode: bookingMedia.get().assessment,
        mediaBase64: bookingMedia.get().photosBase64,
        videoBase64,
        safetyAcknowledged: true,
      };
      const booking = await createBooking(body);
      bookingMedia.reset();

      if (paysUpfront) {
        // Leave the form steps behind: the booking is the place to come back to whatever happens at
        // the gateway (paid, cancelled, or still confirming).
        router.dismissAll();
        router.push({ pathname: '/booking/[id]', params: { id: booking.id } });
        let started: Awaited<ReturnType<typeof startBookingPayment>>;
        try {
          started = await startBookingPayment(booking.id);
        } catch (payErr) {
          // The booking exists and waits on its own screen with a Pay button.
          appAlert('Payment did not open', authErrorMessage(payErr, 'Your booking is saved. Tap Pay on it to try again.'));
          return;
        }
        const { init, hosted } = started;
        if (hosted) {
          router.push({
            pathname: '/payment/checkout',
            params: {
              url: init.authorizationUrl as string,
              reference: init.reference,
              bookingId: booking.id,
              amount: String(init.amountNaira),
              fee: String(init.serviceFeeNaira ?? 0),
            },
          });
        } else {
          appAlert(
            'Payment started',
            __DEV__
              ? 'This test build has no gateway page. The payment settles when the test webhook fires.'
              : 'We will update your booking once the payment is confirmed.',
          );
        }
        return;
      }

      router.replace({
        pathname: '/booking/success',
        params: {
          bookingId: booking.id,
          serviceName: booking.serviceName,
          artisanName: isOpen ? '' : (artisan?.fullName ?? ''),
          artisanId: isOpen ? '' : (params.artisanId ?? ''),
          date: booking.preferredDate,
          time: booking.preferredTimeSlot,
          open: isOpen ? '1' : '',
          mode: booking.assessmentMode,
          fixed: isFixed ? '1' : '',
        },
      });
    } catch (err) {
      // Server may require a verified phone first — prompt, then retry the post.
      if (phoneGate.handle(err, handleProceed)) return;
      setErrorMsg(authErrorMessage(err, paysUpfront ? 'Could not book this job.' : 'Could not post your request.'));
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
          <AppText weight="semibold" className="text-[17px] text-gray-900">
            Booking Summary
          </AppText>
          <AppText className="text-[12px] text-gray-500">{serviceName}</AppText>
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
        {/* A Servika job or a diagnosis visit: one price, paid now. */}
        {paysUpfront ? (
          <View className="flex-row items-center rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <AppText weight="semibold" className="text-[15px] text-gray-900">
                {isDiagnosis ? 'An artisan finds the fault' : isCustom ? 'An artisan comes to see the job' : 'Servika sends the artisan'}
              </AppText>
              <AppText className="text-[12px] leading-4 text-gray-500">
                {isCustom
                  ? 'Pay the visit. The artisan sends an itemised quote, and nothing is done until you accept.'
                  : isDiagnosis
                  ? 'Pay the visit. The artisan prices the repairs, and nothing is done until you approve.'
                  : 'Once you pay, Servika offers the job to a checked artisan near you.'}
              </AppText>
            </View>
          </View>
        ) : isOpen ? (
          <View className="flex-row items-center rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="megaphone-outline" size={22} color={colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <AppText weight="semibold" className="text-[15px] text-gray-900">Open request</AppText>
              <AppText className="text-[12px] leading-4 text-gray-500">
                Artisans nearby send prices or offer to visit first. You pick one.
              </AppText>
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
              <AppText weight="semibold" className="text-[15px] text-gray-900">
                {artisan.fullName}
              </AppText>
              <View className="flex-row items-center gap-1">
                <Ionicons name="shield-checkmark" size={13} color={colors.onlineInk} />
                <AppText className="text-[12px] text-gray-600">
                  {(artisan.completedJobs ?? 0) > 0 ? `ID checked · ${artisan.completedJobs} jobs on Servika` : 'ID checked · new on Servika'}
                </AppText>
              </View>
            </View>
          </View>
        ) : null}

        {/* Job */}
        <Section title="Job">
          <Row label="Service" value={serviceName} />
          {params.description ? (
            <AppText className="mt-1 text-[13px] leading-5 text-gray-700">
              {params.description}
            </AppText>
          ) : null}
          {photoCount > 0 ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Ionicons name="images-outline" size={14} color={colors.textMuted} />
              <AppText className="text-[12px] text-gray-500">
                {photoCount} photo{photoCount > 1 ? 's' : ''} attached
              </AppText>
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
          <AppText className="text-[13px] leading-5 text-gray-900">
            {params.addressText ?? 'No address provided'}
          </AppText>
          {params.instructions ? (
            <AppText className="mt-1 text-[12px] leading-4 text-gray-500">
              {params.instructions}
            </AppText>
          ) : null}
        </Section>

        {/* Pricing — a fixed service shows its price; quote-based shows free */}
        <Section title="Pricing">
          {isCustom ? (
            <>
              <Row label="Visit" value={formatNaira(diagnosisFee)} />
              <AppText className="mt-1 text-[12px] leading-4 text-gray-500">
                You pay {formatNaira(diagnosisFee)}
                {usersBearFees ? ' plus a small payment fee' : ''} now. It comes off the quote if you accept.
              </AppText>
            </>
          ) : isDiagnosis ? (
            <>
              <Row label="Diagnosis visit" value={formatNaira(diagnosisFee)} />
              <AppText className="mt-1 text-[12px] leading-4 text-gray-500">
                You pay {formatNaira(diagnosisFee)}
                {usersBearFees ? ' plus a small payment fee' : ''} now. It comes off the repairs if you go ahead.
              </AppText>
            </>
          ) : isPriceBook ? (
            <>
              <Row label="Servika price" value={formatNaira(fixedPrice!)} />
              <AppText className="mt-1 text-[12px] leading-4 text-gray-500">
                You pay {formatNaira(fixedPrice!)}
                {usersBearFees ? ' plus a small payment fee' : ''} now, held until you confirm the job is done.
                Cancel before they arrive for a full refund.
              </AppText>
            </>
          ) : isFixed ? (
            <>
              <Row label="Fixed price" value={formatNaira(fixedPrice!)} />
              <AppText className="mt-1 text-[12px] leading-4 text-gray-500">
                Pay {formatNaira(fixedPrice!)}
                {usersBearFees ? ' plus a small payment fee' : ''} after {artisan?.fullName ?? 'the artisan'} accepts.
                Held until the job is done.
              </AppText>
            </>
          ) : (
            <>
              <View className="flex-row items-center gap-2">
                <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
                <AppText weight="semibold" className="text-[14px] text-gray-900">
                  Nothing to pay now
                </AppText>
              </View>
              <AppText className="mt-1 text-[12px] leading-4 text-gray-500">
                {isOpen
                  ? 'Pay only after you pick an offer. Held until the job is done.'
                  : 'Pay only after you accept a price. Held until the job is done.'}
              </AppText>
            </>
          )}
        </Section>

        {errorMsg ? (
          <View className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3">
            <AppText className="text-[13px] text-red-600">{errorMsg}</AppText>
          </View>
        ) : null}

        {/* Home safety: the customer's part, agreed before the request goes out. */}
        <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: safetyAck }}
            onPress={() => setSafetyAck((v) => !v)}
            className="flex-row items-center"
          >
            <View
              className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
                safetyAck ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
              }`}
            >
              {safetyAck ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
            </View>
            <AppText weight="medium" className="ml-3 flex-1 text-[14px] leading-5 text-gray-900">
              I&apos;ll keep my home safe while the artisan is there
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => setSafetyInfo(true)}
            className="ml-9 mt-1 self-start"
          >
            <AppText weight="semibold" className="text-[13px] text-primary">
              What this means
            </AppText>
          </Pressable>
        </View>

        {/* Proceed */}
        <View className="mt-6">
          <Button
            label={paysUpfront ? `Pay ${formatNaira(upfrontAmount)}` : isOpen ? 'Post Request' : 'Send Request'}
            loading={submitting || (!isOpen && artisanLoading)}
            disabled={!canProceed || !safetyAck}
            onPress={handleProceed}
          />
          {!safetyAck ? (
            <AppText className="mt-2 text-center text-[12px] text-gray-500">
              Tick the box to continue.
            </AppText>
          ) : null}
        </View>
      </ScrollView>

      <BottomSheet visible={safetyInfo} onClose={() => setSafetyInfo(false)} estimatedHeight={480}>
        <AppText weight="semibold" className="text-[18px] text-gray-900">
          Keeping your home safe
        </AppText>
        <View className="mt-4 gap-3">
          {SAFETY_POINTS.map((p) => (
            <View key={p.text} className="flex-row items-start">
              <Ionicons name={p.icon} size={18} color={colors.primary} />
              <AppText className="ml-3 flex-1 text-[14px] leading-5 text-gray-700">{p.text}</AppText>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => Linking.openURL(SAFETY_TERMS_URL).catch(() => {})}
          className="mt-5 flex-row items-center self-start"
        >
          <AppText weight="semibold" className="text-[13px] text-primary">
            Read the safety terms
          </AppText>
          <Ionicons name="open-outline" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
        </Pressable>
        <View className="mt-5">
          <Button label="Got it" onPress={() => setSafetyInfo(false)} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
