import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

/**
 * The gateway checkout, inside the app. Paystack's page renders in a WebView we
 * own, so when the payer hops out to OPay, a bank app or a USSD dialer and comes
 * back, they land here, not in Chrome. Three things make it robust:
 *
 * 1. External schemes (opay://, intent://, bank apps) are opened with the OS, not
 *    loaded in the WebView, and the page keeps its state.
 * 2. Every return to the foreground asks OUR server to verify the payment with
 *    the provider, so the result shows the moment the money moved, without
 *    waiting for the webhook. The client never tells the server the outcome.
 * 3. The callback link the gateway redirects to is intercepted here and treated
 *    as "go and verify", never as proof of payment.
 */

export type PaymentStatusInfo = {
  paymentId: string;
  reference: string;
  status: 'Pending' | 'Succeeded' | 'Failed' | 'Refunded' | string;
  amountNaira: number;
  serviceFeeNaira: number;
  totalNaira: number;
  bookingId: string | null;
  bookingPaymentState: string | null;
  settledNow: boolean;
};

export type CheckoutResult =
  | { status: 'paid'; info: PaymentStatusInfo }
  | { status: 'failed'; info: PaymentStatusInfo | null }
  | { status: 'cancelled' }
  | { status: 'pending'; info: PaymentStatusInfo | null };

type Props = {
  url: string;
  reference: string;
  /** The app's return link the gateway redirects to (e.g. servika://payment/callback). */
  returnScheme: string;
  title?: string;
  /** Asks the server where the payment stands; the server asks the provider. */
  verify: (reference: string) => Promise<PaymentStatusInfo>;
  onResult: (result: CheckoutResult) => void;
  /** Starts a fresh payment after a failure; returns the new url + reference. */
  onRetry?: () => Promise<{ url: string; reference: string } | null>;
};

const POLL_MS = 4000;
const POLL_LIMIT = 45; // 3 minutes of "the bank is still confirming"

type Phase = 'checkout' | 'checking' | 'waiting' | 'failed' | 'timeout';

export function PaystackCheckout({ url, reference, returnScheme, title = 'Secure payment', verify, onResult, onRetry }: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('checkout');
  const [pageLoading, setPageLoading] = useState(true);
  const [current, setCurrent] = useState({ url, reference });
  const [retrying, setRetrying] = useState(false);
  const done = useRef(false);
  const polls = useRef(0);
  const leftApp = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(
    (result: CheckoutResult) => {
      if (done.current) return;
      done.current = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
      onResult(result);
    },
    [onResult],
  );

  /** One verify round trip. Settles the screen when the provider has an answer. */
  const check = useCallback(
    async (reason: 'return' | 'callback' | 'poll' | 'manual'): Promise<'paid' | 'failed' | 'pending' | 'error'> => {
      if (done.current) return 'pending';
      try {
        const info = await verify(current.reference);
        if (info.status === 'Succeeded') {
          finish({ status: 'paid', info });
          return 'paid';
        }
        if (info.status === 'Failed') {
          setPhase('failed');
          return 'failed';
        }
        return 'pending';
      } catch {
        // Network blip: not a verdict. The poll or the next return tries again.
        return reason === 'manual' ? 'error' : 'pending';
      }
    },
    [current.reference, finish, verify],
  );

  /** Polls while the bank confirms a transfer, then hands over to a timeout state. */
  const startPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    polls.current = 0;
    setPhase('waiting');
    const tick = async () => {
      if (done.current) return;
      polls.current += 1;
      const r = await check('poll');
      if (r === 'paid' || r === 'failed') return;
      if (polls.current >= POLL_LIMIT) {
        setPhase('timeout');
        return;
      }
      pollTimer.current = setTimeout(tick, POLL_MS);
    };
    pollTimer.current = setTimeout(tick, POLL_MS);
  }, [check]);

  // Coming back from OPay / a bank app: ask the server straight away.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && state !== 'inactive') leftApp.current = true;
      if (state === 'active' && leftApp.current && !done.current) {
        leftApp.current = false;
        setPhase((p) => (p === 'checkout' ? 'checking' : p));
        void check('return').then((r) => {
          if (r === 'pending') startPolling();
        });
      }
    });
    return () => {
      sub.remove();
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [check, startPolling]);

  const onShouldStart = useCallback(
    (req: WebViewNavigation) => {
      const target = req.url ?? '';
      if (target.startsWith(returnScheme)) {
        // The gateway says it is done (or the payer pressed its Cancel). Verify;
        // never trust the link itself.
        const cancelled = /[?&]cancelled=1/.test(target);
        setPhase('checking');
        void check('callback').then((r) => {
          if (r === 'pending') {
            if (cancelled) finish({ status: 'cancelled' });
            else startPolling();
          }
        });
        return false;
      }
      if (!/^https?:/i.test(target)) {
        // OPay, bank apps, USSD dialers: hand the link to the OS and keep our page.
        void openExternal(target);
        return false;
      }
      return true;
    },
    [check, finish, returnScheme, startPolling],
  );

  const leave = () => {
    Alert.alert('Leave this payment?', 'Nothing is charged unless you complete it. You can start again from the booking.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => finish({ status: 'cancelled' }) },
    ]);
  };

  const retry = async () => {
    if (!onRetry) return finish({ status: 'failed', info: null });
    setRetrying(true);
    try {
      const next = await onRetry();
      if (!next) return finish({ status: 'failed', info: null });
      done.current = false;
      polls.current = 0;
      setCurrent(next);
      setPageLoading(true);
      setPhase('checkout');
    } catch {
      Alert.alert('Could not start again', 'Check your connection and try once more.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close payment" onPress={leave} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color="#0B1220" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={11} color="#0E9E70" />
            <Text style={styles.secure}>Encrypted checkout by Paystack</Text>
          </View>
        </View>
        {phase === 'waiting' || phase === 'checking' ? <ActivityIndicator color="#E4620A" /> : null}
      </View>

      {phase === 'failed' ? (
        <StateCard
          icon="close-circle"
          tint="#B3261E"
          title="The payment did not go through"
          body="Your bank or wallet declined it, or the payment was abandoned. Nothing was charged. You can try again or pay another way."
          primary={{ label: retrying ? 'Starting again' : 'Try again', onPress: retry, disabled: retrying }}
          secondary={{ label: 'Back', onPress: () => finish({ status: 'failed', info: null }) }}
          bottom={insets.bottom}
        />
      ) : phase === 'timeout' ? (
        <StateCard
          icon="time"
          tint="#C2560B"
          title="Still waiting for the bank"
          body="Transfers sometimes take a few minutes to confirm. Your money is safe: the moment the bank confirms, the payment completes on its own and you get a notification."
          primary={{ label: 'Check again', onPress: () => void check('manual').then((r) => r === 'pending' && startPolling()) }}
          secondary={{ label: 'I will wait for the notification', onPress: () => finish({ status: 'pending', info: null }) }}
          bottom={insets.bottom}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {phase === 'waiting' ? (
            <View style={styles.strip}>
              <ActivityIndicator size="small" color="#C2560B" />
              <Text style={styles.stripText}>Waiting for the bank to confirm. This completes on its own.</Text>
            </View>
          ) : null}
          <WebView
            key={current.reference}
            source={{ uri: current.url }}
            style={{ flex: 1, backgroundColor: '#F2F4F8' }}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={onShouldStart}
            onLoadStart={() => setPageLoading(true)}
            onLoadEnd={() => setPageLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={false}
            mixedContentMode="always"
            allowsBackForwardNavigationGestures={false}
            startInLoadingState={false}
          />
          {pageLoading ? (
            <View style={styles.loader} pointerEvents="none">
              <ActivityIndicator size="large" color="#E4620A" />
              <Text style={styles.loaderText}>Opening secure checkout</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

/** Opens a non-web link with the OS: opay://, bank apps, tel:, and Android intent:// URLs. */
async function openExternal(target: string) {
  try {
    if (target.startsWith('intent://')) {
      // intent://host/path#Intent;scheme=opay;package=team.opay.pay;S.browser_fallback_url=...;end
      const fragment = target.split('#Intent;')[1] ?? '';
      const parts = Object.fromEntries(fragment.replace(/;end$/, '').split(';').map((kv) => kv.split('=') as [string, string]));
      const scheme = parts.scheme;
      const pkg = parts.package;
      const fallback = parts['S.browser_fallback_url'] ? decodeURIComponent(parts['S.browser_fallback_url']) : null;
      if (scheme) {
        const schemeUrl = target.replace(/^intent:\/\//, `${scheme}://`).split('#Intent;')[0];
        if (await Linking.canOpenURL(schemeUrl).catch(() => false)) return void Linking.openURL(schemeUrl);
      }
      if (fallback) return void Linking.openURL(fallback);
      if (pkg && Platform.OS === 'android') return void Linking.openURL(`market://details?id=${pkg}`);
      return;
    }
    await Linking.openURL(target);
  } catch {
    Alert.alert('Could not open the app', 'Finish the payment in your bank or wallet app, then come back here. We check automatically.');
  }
}

function StateCard({ icon, tint, title, body, primary, secondary, bottom }: {
  icon: keyof typeof Ionicons.glyphMap; tint: string; title: string; body: string;
  primary: { label: string; onPress: () => void; disabled?: boolean };
  secondary: { label: string; onPress: () => void };
  bottom: number;
}) {
  return (
    <View style={[styles.state, { paddingBottom: bottom + 24 }]}>
      <View style={[styles.stateIcon, { backgroundColor: `${tint}14` }]}>
        <Ionicons name={icon} size={36} color={tint} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      <View style={{ flex: 1 }} />
      <Pressable accessibilityRole="button" disabled={primary.disabled} onPress={primary.onPress} style={[styles.primary, primary.disabled && { opacity: 0.6 }]}>
        <Text style={styles.primaryText}>{primary.label}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={secondary.onPress} style={styles.secondary}>
        <Text style={styles.secondaryText}>{secondary.label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4F8' },
  title: { fontSize: 16, fontWeight: '600', color: '#0B1220' },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  secure: { fontSize: 11.5, color: '#0E9E70' },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF3E8', borderBottomWidth: 1, borderBottomColor: '#FBD9BE' },
  stripText: { flex: 1, fontSize: 13, color: '#C2560B' },
  loader: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', gap: 12 },
  loaderText: { fontSize: 13.5, color: '#6B7280' },
  state: { flex: 1, paddingHorizontal: 24, paddingTop: 48, alignItems: 'center' },
  stateIcon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { marginTop: 20, fontSize: 22, fontWeight: '600', color: '#0B1220', textAlign: 'center' },
  stateBody: { marginTop: 10, fontSize: 14.5, lineHeight: 21, color: '#4B5563', textAlign: 'center' },
  primary: { alignSelf: 'stretch', height: 56, borderRadius: 16, backgroundColor: '#E4620A', alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 15.5, fontWeight: '600', color: '#FFF6EE' },
  secondary: { alignSelf: 'stretch', height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  secondaryText: { fontSize: 14.5, fontWeight: '500', color: '#4B5563' },
});
