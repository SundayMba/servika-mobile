import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { reportError } from '@/lib/observability/report';

/**
 * What the customer sees instead of a blank window when a render throws.
 *
 * expo-router picks this up from the `ErrorBoundary` export in
 * app/_layout.tsx, so it wraps the whole route tree. Without it a throw during
 * render unmounts everything: the red screen in development, and in a release
 * build a white void the user can only force-quit out of — mid-booking, with
 * no record that it happened.
 *
 * `retry` re-renders the route rather than restarting the app, which is enough
 * for the common case of a transient bad payload. The stack is shown only in
 * development; in release the customer gets an apology and a button, and the
 * detail goes to `reportError`.
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    reportError(error, { boundary: 'root' });
  }, [error]);

  return (
    // Deliberately a plain View, not SafeAreaView: the boundary renders in
    // place of the tree that just threw, and reaching for another context here
    // is one more thing that can fail while handling a failure. Generous
    // vertical padding clears both notch and gesture bar.
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <AppText weight="semibold" style={styles.badgeMark}>
            !
          </AppText>
        </View>

        <AppText weight="semibold" style={styles.title}>
          Something broke on this screen
        </AppText>
        <AppText style={styles.body}>
          Sorry — that is on us, not on you. Nothing you have booked or paid for is
          affected. Try the screen again, and if it keeps happening go back and come
          at it from the home tab.
        </AppText>

        <Pressable
          accessibilityRole="button"
          android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
          onPress={() => {
            setRetrying(true);
            // retry() resolves once the route has remounted; if it throws again
            // the boundary simply catches the new error.
            void Promise.resolve(retry()).finally(() => setRetrying(false));
          }}
          style={styles.cta}
        >
          <AppText weight="semibold" numberOfLines={1} style={styles.ctaLabel}>
            {retrying ? 'Retrying…' : 'Try again'}
          </AppText>
        </Pressable>
        {__DEV__ ? (
          <View style={styles.detail}>
            <AppText style={styles.detailText}>
              {error.name}: {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 72,
    gap: 14,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentDeep,
  },
  badgeMark: {
    fontSize: 22,
    lineHeight: 26,
    color: colors.white,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  detail: {
    // Sits BELOW the retry button, so a long dev stack never pushes the only
    // actionable control off screen. Hidden entirely in release.
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(20,23,27,0.04)',
  },
  detailText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.inkSubtle,
  },
  cta: {
    marginTop: 10,
    height: 50,
    alignSelf: 'flex-start',
    // 'stretch' + a centred label: Android clips the final glyph of a
    // shrink-wrapped text box, so the label fills the button instead.
    alignItems: 'stretch',
    justifyContent: 'center',
    minWidth: 160,
    paddingHorizontal: 22,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  ctaLabel: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.white,
  },
});
