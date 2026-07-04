import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';

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
}: {
  onGetHelp?: () => void;
  /** When true, drop the rounded orange card so the hero sits flush on an
   *  already-orange canopy and bleeds to the screen edges. */
  bare?: boolean;
  /** Override the hero height (default 210). Thinner reads sleeker on the canopy. */
  height?: number;
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
  }, [phase, sub, index]);

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
    // Flat brand-orange surface that matches the artisan images' solid #F97316
    // background exactly, so each image dissolves seamlessly into the card.
    // `bare` drops the card chrome so it merges into the orange canopy.
    <View
      style={{
        height,
        overflow: 'hidden',
        ...(bare
          ? null
          : { borderRadius: 26, backgroundColor: colors.primary }),
      }}
    >
      {/* ── Rotating working-artisan images (right side, bleeds to edge) ──
          Each artisan owns a permanent layer (source never swaps) positioned
          off a single, monotonic `pos` value that eases toward `step`. At every
          step boundary the interpolations evaluate to the exact same pixels, so
          nothing is ever reset and the on-screen image never snaps — no flicker.
          It's a pure left → right conveyor: enter from far left, exit to the
          right, both clipped to the lane. */}
      <View
        pointerEvents="none"
        onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}
        style={{ position: 'absolute', right: -8, top: 0, bottom: 0, width: '56%', overflow: 'hidden' }}
      >
        {WORKING_ARTISANS.map((artisan, i) => {
          // Default: parked just off the right edge (fully clipped, hidden).
          let translateX: Animated.AnimatedInterpolation<number> | number = boxW;
          let opacity = 0;

          if (i === entering) {
            // Glide from far left to centre as pos: step-1 → step.
            translateX = pos.interpolate({
              inputRange: [step - 1, step],
              outputRange: [-boxW, 0],
              extrapolate: 'clamp',
            });
            opacity = 1;
          } else if (step > 0 && i === leaving) {
            // Glide from centre out to the right over the same interval.
            translateX = pos.interpolate({
              inputRange: [step - 1, step],
              outputRange: [0, boxW],
              extrapolate: 'clamp',
            });
            opacity = 1;
          }

          return (
            <Animated.View
              key={artisan.id}
              style={{ position: 'absolute', inset: 0, opacity, transform: [{ translateX }] }}
            >
              <Image
                source={artisan.image}
                contentFit="contain"
                contentPosition="bottom right"
                cachePolicy="memory-disk"
                transition={0}
                style={{ flex: 1 }}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* ── Text content (left side) ── */}
      <View className="flex-1 justify-center p-5" style={{ width: '62%' }}>
        <View className="mb-2.5 flex-row">
          <View
            className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              backgroundColor: 'rgba(255,255,255,0.22)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.4)',
            }}
          >
            <View style={{ width: 7, height: 7, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                  transform: [
                    { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) },
                  ],
                }}
              />
              <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: '#FFFFFF' }} />
            </View>
            <Text className="text-[11px] font-semibold text-white">24/7 Available</Text>
          </View>
        </View>

        <Text className="text-[23px] font-extrabold leading-7 text-white">
          Emergency{'\n'}
          {sub}
          <Animated.Text style={{ opacity: cursor }}>|</Animated.Text>
        </Text>

        <Text className="mt-1.5 text-[12px] text-white/90">
          Fast help when you need it most.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onGetHelp}
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3,
          }}
          className="mt-3.5 self-start rounded-xl bg-white px-4 py-2.5"
        >
          <Text className="text-[13px] font-bold text-primary">Get Help Now</Text>
        </TouchableOpacity>
      </View>

      {/* ── Progress dots ── */}
      <View className="absolute bottom-3.5 right-4 flex-row items-center gap-1.5">
        {WORKING_ARTISANS.map((artisan, i) => (
          <View
            key={artisan.id}
            className={
              i === index ? 'h-1.5 w-4 rounded-full bg-white' : 'h-1.5 w-1.5 rounded-full bg-white/40'
            }
          />
        ))}
      </View>
    </View>
  );
}
