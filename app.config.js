// Dynamic Expo config. Extends the static app.json and injects native secrets
// from the environment so they're never committed. Expo loads .env (via @expo/env)
// before evaluating this file, so EXPO_PUBLIC_* vars are available on process.env.
//
// EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY — the Maps SDK for Android key that
// react-native-maps needs to render the map on Android. (iOS uses Apple Maps, no
// key.) After changing it you must rebuild the native app.
const { withGradleProperties } = require('@expo/config-plugins');

// Windows-only: makes the Android C++ build use a ninja that can handle the long
// Fabric-codegen object paths. No-op elsewhere, including on EAS.
const withWindowsNinja = require('./plugins/withWindowsNinja');

// Ship only the arm64-v8a native libraries. The default universal APK bundles
// four ABIs (arm64-v8a, armeabi-v7a, x86, x86_64) — x86/x86_64 are emulator-only
// and armeabi-v7a is legacy 32-bit, together ~53MB of dead weight for real users.
// arm64-v8a covers essentially every phone from ~2017 on. (The Play Store release
// ships an AAB, which delivers every architecture per-device anyway.)
function withArm64Only(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const set = (key, value) => {
      const found = props.find((p) => p.type === 'property' && p.key === key);
      if (found) found.value = value;
      else props.push({ type: 'property', key, value });
    };
    // EAS production builds (the Play Store bundle) also carry armeabi-v7a so
    // 32-bit-only phones, still common at the cheap end in Nigeria, can install.
    // Play serves each device only the ABI it needs, so this costs users nothing.
    const abis =
      process.env.EAS_BUILD_PROFILE === 'production' ? 'arm64-v8a,armeabi-v7a' : 'arm64-v8a';
    set('reactNativeArchitectures', abis);
    return cfg;
  });
}

// Google Sign-In on iPhones needs Google's iOS client: its reversed id goes in as the URL scheme, and the
// plugin refuses to build iOS without it. Until GOOGLE_IOS_URL_SCHEME is set, iOS builds leave the plugin out
// (the app hides Google on iPhones and offers Sign in with Apple); Android keeps it unchanged.
const GOOGLE_SIGNIN = '@react-native-google-signin/google-signin';
function withGoogleSignInConfig(config) {
  const scheme = process.env.GOOGLE_IOS_URL_SCHEME;
  const plugins = (config.plugins ?? []).flatMap((p) => {
    const name = Array.isArray(p) ? p[0] : p;
    if (name !== GOOGLE_SIGNIN) return [p];
    if (scheme) return [[GOOGLE_SIGNIN, { iosUrlScheme: scheme }]];
    return process.env.EAS_BUILD_PLATFORM === 'ios' ? [] : [p];
  });
  return { ...config, plugins };
}

module.exports = ({ config }) =>
  withWindowsNinja(
    withArm64Only({
      ...withGoogleSignInConfig(config),
      android: {
        ...config.android,
        config: {
          ...config.android?.config,
          googleMaps: {
            apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY ?? '',
          },
        },
      },
    }),
  );
