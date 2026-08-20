import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { WORKING_ARTISANS } from '@/constants/home-data';

// One state machine drives both the headline typewriter and the image
// crossfade so they stay in lockstep: type the service word, hold, delete it,
// then advance to the next artisan (image fades in as the next word types).
const TYPE_MS = 70; // per-char while typing — relaxed, readable cadence
const DELETE_MS = 38; // per-char while deleting — a touch quicker
const HOLD_MS = 1300; // dwell once the word is fully typed
const GAP_MS = 320; // beat after the word clears, before the next image
const SLIDE_MS = 900; // image slide-in duration (left → right) — slow & smooth

const HERO_HEIGHT = 210;

type Phase = 'typing' | 'holding' | 'deleting';

export function HeroCarousel({
  onGetHelp,
  bare = false,
  height = HERO_HEIGHT,
  paused = false,
}: {
  onGetHelp?: () => void;
  /** When true, drop the rounded orange card so the hero sits flush on an
   *  already-orange canopy and bleeds to the screen edges. */
  bare?: boolean;
  /** Override the hero height (default 210). Thinner reads sleeker on the canopy. */
  height?: number;
  /** Freeze the typewriter/conveyor (e.g. while the parent scrolls) — its
   *  ~14–26 setState ticks per second otherwise compete with the scroll. */
  paused?: boolean;
}) {
  const len = WORKING_ARTISANS.length;
  const [step, setStep] = useState(0); // monotonic counter — only ever increments
  const [sub, setSub] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  const [boxW, setBoxW] = useState(0); // measured image-lane width, for the slide

  const index = step % len; // active artisan
  const pos = useRef(new Animated.Value(0)).current; // continuous slide position (tracks step)
  const cursor = useRef(new Animated.Value(1)).current; // blinking caret
  const pulse = useRef(new Animated.Value(0)).current; // live badge dot

  // ── Typewriter state machine (also the carousel clock) ──
  useEffect(() => {
    if (paused) return; // frozen mid-word; the effect re-runs on unpause
    const full = WORKING_ARTISANS[index].service;
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (sub.length < full.length) {
        timer = setTimeout(() => setSub(full.slice(0, sub.length + 1)), TYPE_MS);
      } else {
        timer = setTimeout(() => setPhase('holding'), HOLD_MS);
      }
    } else if (phase === 'holding') {
      timer = setTimeout(() => setPhase('deleting'), 0);
    } else {
      if (sub.length > 0) {
        timer = setTimeout(() => setSub(full.slice(0, sub.length - 1)), DELETE_MS);
      } else {
        timer = setTimeout(() => {
          // Just advance the monotonic counter — the slide position eases
          // toward it. Nothing is reset, so the on-screen image never snaps.
          setStep((s) => s + 1);
          setPhase('typing');
        }, GAP_MS);
      }
    }

    return () => clearTimeout(timer);
  }, [phase, sub, index, paused]);

  // ── Glide the slide position toward the current step (left → right) ──
  useEffect(() => {
    Animated.timing(pos, {
      toValue: step,
      duration: SLIDE_MS,
      easing: Easing.inOut(Easing.cubic), // ease in and out for a gliding feel
      useNativeDriver: true,
    }).start();
  }, [step, pos]);

  // ── Blinking caret ──
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 0, duration: 480, useNativeDriver: true }),
        Animated.timing(cursor, { toValue: 1, duration: 480, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cursor]);

  // ── Slow pulse on the "live" badge dot ──
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const entering = step % len; // artisan gliding in this cycle
  const leaving = (step - 1 + len) % len; // artisan gliding out this cycle

  return (
    // The card surface is the parent's now: the hero artwork is cut out of its
    // baked-in orange (tools/build-hero-art.mjs), so it composites over whatever
    // colour the card is rather than requiring an exact match.
    <View
      style={[
        styles.root,
        { height },
        bare ? null : styles.card,
      ]}
    >
      {/* ── Rotating working-artisan images (right side, bleeds to edge) ──
          Each artisan owns a permanent layer (source never swaps) positioned
          off a single, monotonic `pos` value that eases toward `step`. At every
          step boundary the interpolations evaluate to the exact same pixels, so
          nothing is ever reset and the on-screen image never snaps — no flicker.
          It's a pure right → left conveyor: enter from far right, exit to the
          left, both clipped to the lane. */}
      <View
        pointerEvents="none"
        onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}
        style={styles.lane}
      >
        {WORKING_ARTISANS.map((artisan, i) => {
          // Only the two active layers stay mounted — the parked ones would
          // hold big decoded textures for nothing (expo-image's memory cache
          // makes the remount on their next turn effectively free).
          if (i !== entering && !(step > 0 && i === leaving)) return null;

          // Default: parked just off the left edge (fully clipped, hidden).
          let translateX: Animated.AnimatedInterpolation<number> | number = -boxW;
          let opacity = 0;

          if (i === entering) {
            // Glide from far right to centre as pos: step-1 → step.
            translateX = pos.interpolate({
              inputRange: [step - 1, step],
              outputRange: [boxW, 0],
              extrapolate: 'clamp',
            });
            opacity = 1;
          } else if (step > 0 && i === leaving) {
            // Glide from centre out to the left over the same interval.
            translateX = pos.interpolate({
              inputRange: [step - 1, step],
              outputRange: [0, -boxW],
              extrapolate: 'clamp',
            });
            opacity = 1;
          }

          return (
            <Animated.View
              key={artisan.id}
              style={[StyleSheet.absoluteFill, { opacity, transform: [{ translateX }] }]}
            >
              <Image
                source={artisan.image}
                contentFit="contain"
                contentPosition="bottom right"
                cachePolicy="memory-disk"
                transition={0}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* ── Text content (left side) ── */}
      <View style={styles.content}>
        <View style={styles.pill}>
          <View style={styles.pillDotBox}>
            <Animated.View
              style={[
                styles.pillPulse,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                  transform: [
                    { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) },
                  ],
                },
              ]}
            />
            <View style={styles.pillDot} />
          </View>
          <AppText weight="semibold" numberOfLines={1} style={styles.pillLabel}>
            24/7 Available
          </AppText>
        </View>

        <AppText weight="semibold" maxFontSizeMultiplier={1} style={styles.title}>
          Emergency{'\n'}
          {sub}
          <Animated.Text style={{ opacity: cursor }}>|</Animated.Text>
        </AppText>

        <Pressable
          onPress={onGetHelp}
          accessibilityRole="button"
          accessibilityLabel="Get emergency help now"
          android_ripple={{ color: 'rgba(20,23,27,0.08)' }}
          style={styles.cta}
        >
          <AppText weight="semibold" numberOfLines={1} style={styles.ctaLabel}>
            Get help now
          </AppText>
        </Pressable>
      </View>

      {/* ── Progress rail, bottom-left as in the design ── */}
      <View style={styles.dots}>
        {WORKING_ARTISANS.map((artisan, i) => (
          <View
            key={artisan.id}
            style={[styles.dot, i === index ? styles.dotActive : styles.dotIdle]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  card: {
    borderRadius: 26,
    backgroundColor: colors.accentDeep,
  },
  lane: {
    position: 'absolute',
    right: -18,
    top: 0,
    bottom: 0,
    width: '58%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    // The progress rail is absolutely positioned along the bottom; without this
    // the CTA sits right on top of it.
    paddingTop: 14,
    paddingBottom: 30,
    // The art occupies the right of the card, so the copy keeps to the left —
    // wide enough that "24/7 Available" and "Get help now" both fit on one line.
    width: '72%',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 0,
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pillDotBox: {
    width: 5,
    height: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillPulse: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  pillLabel: {
    fontSize: 11.5,
    // A hair of positive tracking, not negative: Android lays a tightly-tracked
    // run out short and clips the final glyph. 0.2pt is invisible and gives it
    // somewhere to land.
    color: colors.white,
  },
  title: {
    fontSize: 26,
    lineHeight: 27,
    letterSpacing: -1.04,
    color: colors.white,
  },
  cta: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    height: 40,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  ctaLabel: {
    fontSize: 13.5,
    // No negative tracking on a 13.5pt label: combined with this face's short
    // advance on Android it clips the final glyph ("Get help no|w"). The 26pt
    // headline below keeps its tracking, where there is room for it.
    color: colors.accentDeep,
  },
  dots: {
    position: 'absolute',
    left: 20,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 3,
    borderRadius: 99,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.white,
  },
  dotIdle: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
