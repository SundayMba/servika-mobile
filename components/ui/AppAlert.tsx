import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

/**
 * The app's own alert, replacing React Native's `Alert.alert`.
 *
 * The system dialog is drawn by the platform, so it carries the platform's
 * type, radii and accent — Roboto and a Material blue on Android, SF and iOS
 * blue on iPhone — none of which is Servika. Every other surface runs
 * Instrument Sans on sand with the deep-orange accent; the moment the app asks
 * whether to cancel a booking should not be the one moment it looks like a
 * different app.
 *
 * The call signature is deliberately identical to `Alert.alert`, so call sites
 * only swap the import: title, optional message, optional buttons, optional
 * `{ cancelable, onDismiss }`.
 *
 * Two behaviours of the native API are reproduced because screens depend on
 * them: alerts QUEUE rather than replace each other (settings.tsx opens its
 * second delete confirmation from the first one's handler), and a button's
 * `onPress` runs only once the dialog has actually gone, so a handler that
 * navigates does not race the dismissal.
 */

export type AppAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AppAlertOptions = {
  /** Tapping the scrim or pressing Android back dismisses. Default true. */
  cancelable?: boolean;
  onDismiss?: () => void;
};

type Request = {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  options: AppAlertOptions;
};

// ── Imperative queue ────────────────────────────────────────────────────────
// A module-level queue rather than context, so the API can be called from
// anywhere — mutation callbacks, non-component helpers — exactly like
// Alert.alert. The host below subscribes; if none is mounted yet the request
// waits in the queue and shows as soon as one is.

const queue: Request[] = [];
let notify: (() => void) | null = null;

const DEFAULT_BUTTONS: AppAlertButton[] = [{ text: 'OK' }];

export function appAlert(
  title: string,
  message?: string,
  buttons?: AppAlertButton[],
  options?: AppAlertOptions,
): void {
  queue.push({
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS,
    options: options ?? {},
  });
  notify?.();
}

/** Promise form, for the common "are you sure?" shape. Resolves true on confirm. */
export function appConfirm(
  title: string,
  message?: string,
  {
    confirmText = 'Continue',
    cancelText = 'Cancel',
    destructive = false,
  }: { confirmText?: string; cancelText?: string; destructive?: boolean } = {},
): Promise<boolean> {
  return new Promise((resolve) => {
    appAlert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { onDismiss: () => resolve(false) },
    );
  });
}

// ── Host ────────────────────────────────────────────────────────────────────

const IN_MS = 180;
const OUT_MS = 130;

/** Combined label length a two-button row can hold at the narrowest phone
 *  width before either label has to be truncated. */
const SIDE_BY_SIDE_CHARS = 22;

const totalLabelLength = (buttons: AppAlertButton[]) =>
  buttons.reduce((n, b) => n + b.text.length, 0);

export function AppAlertHost() {
  const [current, setCurrent] = useState<Request | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  // Set while the dialog animates out, so a second tap on a button — or on the
  // scrim behind it — cannot fire a handler twice.
  const closing = useRef(false);

  const pump = useCallback(() => {
    if (closing.current) return;
    setCurrent((c) => c ?? queue.shift() ?? null);
  }, []);

  useEffect(() => {
    notify = pump;
    pump(); // anything queued before the host mounted
    return () => {
      notify = null;
    };
  }, [pump]);

  useEffect(() => {
    if (!current) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [current, anim]);

  const dismiss = useCallback(
    (after?: () => void) => {
      if (closing.current) return;
      closing.current = true;
      Animated.timing(anim, {
        toValue: 0,
        duration: OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setCurrent(null);
        closing.current = false;
        // The handler runs with the dialog already gone, so a navigation or a
        // follow-up alert inside it behaves. Anything it enqueues is picked up
        // on the next line.
        after?.();
        setCurrent(queue.shift() ?? null);
      });
    },
    [anim],
  );

  const onScrim = useCallback(() => {
    if (!current || current.options.cancelable === false) return;
    dismiss(current.options.onDismiss);
  }, [current, dismiss]);

  // Android hardware back closes a cancelable dialog rather than leaving the
  // screen underneath — what the system dialog does.
  useEffect(() => {
    if (!current) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (current.options.cancelable === false) return true;
      dismiss(current.options.onDismiss);
      return true;
    });
    return () => sub.remove();
  }, [current, dismiss]);

  if (!current) return null;

  const { title, message, buttons } = current;
  // Two SHORT buttons sit side by side, the way a confirm reads. Anything
  // longer stacks: at 360dp a row of two gives each label about eleven
  // characters, so "Keep my account" / "Delete forever" came out as
  // "Keep my a…" / "Delete fore…". Three or more always stack.
  const side = buttons.length === 2 && totalLabelLength(buttons) <= SIDE_BY_SIDE_CHARS;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={onScrim}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
          <Pressable accessibilityLabel="Dismiss" onPress={onScrim} style={styles.scrim} />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              opacity: anim,
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.copy}>
            <AppText weight="semibold" style={styles.title}>
              {title}
            </AppText>
            {message ? <AppText style={styles.message}>{message}</AppText> : null}
          </View>

          <View style={[styles.actions, side ? styles.actionsRow : styles.actionsColumn]}>
            {buttons.map((b, i) => (
              <Pressable
                key={`${b.text}-${i}`}
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(20,23,27,0.08)' }}
                onPress={() => dismiss(b.onPress)}
                style={[
                  styles.button,
                  b.style === 'cancel' ? styles.buttonQuiet : styles.buttonSolid,
                  b.style === 'destructive' ? styles.buttonDanger : null,
                  side ? styles.buttonSide : null,
                ]}
              >
                <AppText
                  weight="semibold"
                  numberOfLines={1}
                  style={[
                    styles.buttonLabel,
                    b.style === 'cancel' ? styles.buttonLabelQuiet : styles.buttonLabelLoud,
                  ]}
                >
                  {b.text}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(20,23,27,0.44)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 22,
    gap: 20,
  },
  copy: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  actions: {
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  button: {
    height: 46,
    justifyContent: 'center',
    // 'stretch', so the label fills the button's content box rather than
    // shrink-wrapping to its measured width — Android clips whatever overflows
    // a shrink-wrapped text box, which is what eats the final glyph.
    alignItems: 'stretch',
    paddingHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonSide: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  buttonSolid: {
    backgroundColor: colors.accentDeep,
  },
  buttonDanger: {
    backgroundColor: '#C42B1C',
  },
  buttonQuiet: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  buttonLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonLabelLoud: {
    color: colors.white,
  },
  buttonLabelQuiet: {
    color: colors.ink,
  },
});
