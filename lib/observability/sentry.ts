import * as Sentry from '@sentry/react-native';

/**
 * Crash and error reporting. Switched on by EXPO_PUBLIC_SENTRY_DSN (set per
 * profile on EAS); with no DSN, or in development, nothing is sent anywhere.
 * Source maps upload during the EAS build when SENTRY_AUTH_TOKEN is set, so
 * stacks come back readable instead of minified.
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const sentryEnabled = !!DSN && !__DEV__;

export function initSentry(): void {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn: DSN,
    // No emails, IPs or request bodies: a user id is all that is attached.
    sendDefaultPii: false,
    // Light performance sampling; errors are always sent.
    tracesSampleRate: 0.1,
    maxBreadcrumbs: 60,
    // One screenshot at the moment of the error (free; text is whatever was on screen).
    attachScreenshot: true,
    // Local console noise does not belong in breadcrumbs.
    beforeBreadcrumb(crumb) {
      return crumb.category === 'console' ? null : crumb;
    },
  });
}

/** Tie errors to an account id (never the name or email) so one tester's reports group together. */
export function setReportingUser(id: string | null): void {
  if (!sentryEnabled) return;
  Sentry.setUser(id ? { id } : null);
}

/** Wraps the root component so navigation and touch breadcrumbs are recorded. */
export function withSentry<T>(component: T): T {
  return sentryEnabled ? (Sentry.wrap(component as never) as T) : component;
}

export { Sentry };
