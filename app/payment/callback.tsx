import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Landing route for the gateway's callback deep link (servika://payment/callback).
 * The in-app checkout intercepts this link before the OS ever sees it; this route
 * runs only when the app was killed mid-payment and a bank app returned via the
 * link. The booking screen re-fetches and shows the settled state (the server
 * settles from the webhook, or from the next verify).
 */
export default function PaymentCallback() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  if (bookingId) return <Redirect href={{ pathname: '/booking/[id]', params: { id: bookingId } }} />;
  return <Redirect href="/home" />;
}
