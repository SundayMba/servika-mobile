import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Landing route for the gateway's callback deep link (servika://payment/callback).
 * Normally the auth-session sheet catches this URL and closes before the router
 * ever sees it; this route only runs when the OS opens the link directly (the
 * app was killed mid-payment, or a bank app returned via the link). Send the
 * customer to the booking, whose detail screen shows the settled state.
 */
export default function PaymentCallback() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  if (bookingId) return <Redirect href={{ pathname: '/booking/[id]', params: { id: bookingId } }} />;
  return <Redirect href="/home" />;
}
