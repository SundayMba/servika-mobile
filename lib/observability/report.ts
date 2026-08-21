/**
 * The single place a crash or a swallowed failure is reported from.
 *
 * There is no crash reporter wired up yet — that needs a Sentry DSN and a
 * native rebuild, which is an account decision rather than a code one. What
 * this file buys in the meantime is the seam: every call site already routes
 * through `reportError`, so turning reporting on is a change in one function
 * rather than a hunt through the app.
 *
 * To enable Sentry later:
 *   npx expo install @sentry/react-native
 *   set EXPO_PUBLIC_SENTRY_DSN per profile in eas.json
 * then init in app/_layout.tsx and replace the body of `reportError` with
 * `Sentry.captureException(error, { extra: context })`. Upload source maps in
 * the EAS build so the stacks come back symbolicated.
 */

export type ErrorContext = Record<string, unknown>;

export function reportError(error: unknown, context?: ErrorContext): void {
  // In development the red screen and the Metro log already carry the stack;
  // logging again just doubles it.
  if (__DEV__) {
    console.error('[servika]', error, context ?? '');
    return;
  }

  // Release: no reporter yet, so at least keep it in the device log where
  // `adb logcat` / Xcode can retrieve it from a user's phone.
  console.error(
    '[servika]',
    error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error),
    context ? JSON.stringify(context) : '',
  );
}
