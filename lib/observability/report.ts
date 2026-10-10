import { Sentry, sentryEnabled } from '@/lib/observability/sentry';

/**
 * The single place a crash or a swallowed failure is reported from. Every call
 * site routes through `reportError`, so where reports go is decided here once.
 * With a Sentry DSN in the build they go to Sentry; otherwise they stay in the
 * device log, where `adb logcat` can retrieve them.
 */

export type ErrorContext = Record<string, unknown>;

export function reportError(error: unknown, context?: ErrorContext): void {
  // In development the red screen and the Metro log already carry the stack;
  // logging again just doubles it.
  if (__DEV__) {
    console.error('[servika]', error, context ?? '');
    return;
  }

  if (sentryEnabled) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      extra: context,
    });
    return;
  }

  console.error(
    '[servika]',
    error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error),
    context ? JSON.stringify(context) : '',
  );
}
