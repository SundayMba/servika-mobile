import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { PaystackCheckout, type CheckoutResult } from '@/components/payments/PaystackCheckout';
import { initializePayment, verifyPayment } from '@/lib/api/payments';
import { PAYMENT_RETURN_URL } from '@/lib/payments/checkout';

/**
 * In-app gateway checkout for a booking. Paid → the receipt screen; failed and
 * retried here; cancelled → back to the booking; still confirming → back to the
 * booking with a notification to follow (the webhook or the next open settles it).
 */
export default function PaymentCheckout() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url: string; reference: string; bookingId: string; amount?: string; fee?: string }>();

  const back = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/booking/[id]', params: { id: params.bookingId } });
  }, [params.bookingId, router]);

  const onResult = useCallback(
    (result: CheckoutResult) => {
      if (result.status === 'paid') {
        router.replace({
          pathname: '/payment/success',
          params: {
            bookingId: params.bookingId,
            amount: String(result.info.amountNaira),
            fee: String(result.info.serviceFeeNaira ?? 0),
            reference: result.info.reference,
          },
        });
        return;
      }
      if (result.status === 'pending') {
        Alert.alert('Still confirming', 'The bank has not confirmed yet. Your money is safe; the booking updates and you get a notification the moment it lands.');
      }
      back();
    },
    [back, params.bookingId, router],
  );

  const onRetry = useCallback(async () => {
    const init = await initializePayment(params.bookingId);
    if (!init.authorizationUrl || !/^https?:/i.test(init.authorizationUrl)) return null;
    return { url: init.authorizationUrl, reference: init.reference };
  }, [params.bookingId]);

  if (!params.url || !params.reference) {
    back();
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <PaystackCheckout
        url={params.url}
        reference={params.reference}
        returnScheme={PAYMENT_RETURN_URL}
        title={params.amount ? `Pay ₦${Number(params.amount).toLocaleString('en-NG')}${params.fee && Number(params.fee) > 0 ? ` + ₦${Number(params.fee).toLocaleString('en-NG')} fee` : ''}` : 'Secure payment'}
        verify={verifyPayment}
        onResult={onResult}
        onRetry={onRetry}
      />
    </>
  );
}
