import { Redirect } from 'expo-router';

// Entry point. Later this will branch on auth/onboarding state; for now it
// always sends the user into the onboarding welcome flow.
export default function Index() {
  return <Redirect href="/welcome" />;
}
