import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Entry point. Branches on the rehydrated auth session:
 * - while the session is loading, render nothing (the splash already showed);
 * - a signed-in user goes straight to Home and never sees onboarding again;
 * - everyone else starts in the onboarding welcome flow.
 */
export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') return null;
  if (status === 'authenticated') return <Redirect href="/home" />;
  return <Redirect href="/welcome" />;
}
