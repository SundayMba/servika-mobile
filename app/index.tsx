import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Entry point. Branches on the rehydrated auth session:
 * - while the session is loading, render nothing (the splash already showed);
 * - any signed-in user goes straight to Home (and never sees onboarding again);
 * - everyone else starts in the onboarding welcome flow.
 *
 * The artisan surface is the separate "Servika Pro" app (worqli-artisan) — an
 * Artisan-role account signing in here is just treated as a customer (artisans
 * can browse and book too); their work tools live in the Pro app.
 */
export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') return null;
  if (status === 'authenticated') return <Redirect href="/home" />;
  return <Redirect href="/welcome" />;
}
