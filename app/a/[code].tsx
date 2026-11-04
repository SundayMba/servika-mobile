import { Redirect, useLocalSearchParams } from 'expo-router';

/** `servika://a/EMEKA42` (the artisan's shared link): straight into booking by code. */
export default function BookingLinkRedirect() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <Redirect href={{ pathname: '/book-by-code', params: { code: code ?? '' } }} />;
}
