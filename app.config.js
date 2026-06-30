// Dynamic Expo config. Extends the static app.json and injects native secrets
// from the environment so they're never committed. Expo loads .env (via @expo/env)
// before evaluating this file, so EXPO_PUBLIC_* vars are available on process.env.
//
// EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY — the Maps SDK for Android key that
// react-native-maps needs to render the map on Android. (iOS uses Apple Maps, no
// key.) After changing it you must rebuild the native app: `npx expo run:android`.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY ?? '',
      },
    },
  },
});
