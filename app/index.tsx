import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Entry point. Branches on the rehydrated auth session:
 * - while the session is loading, render nothing (the splash already showed);
 * - a signed-in Artisan lands in the "Servika Pro" provider app;
 * - any other signed-in user goes straight to Home (and never sees onboarding again);
 * - everyone else starts in the onboarding welcome flow.
 *
 * Role is a property of the account, not a toggle — the same backend serves both
 * surfaces, and `user.role` (from the JWT/login) decides which UI renders.
 */
export default function Index() {
  const { status, user } = useAuth();

  if (status === 'loading') return null;
  if (status === 'authenticated') {
    // The Pro gate routes by onboarding/verification state.
    if (user?.role === 'Artisan') return <Redirect href="/pro" />;
    return <Redirect href="/home" />;
  }
  return <Redirect href="/welcome" />;
}
