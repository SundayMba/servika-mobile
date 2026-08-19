# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Building on Windows: one extra step

`npx expo run:android` fails on Windows without a newer ninja:

```
ninja: error: Stat(...RNKCKeyboardBackgroundViewShadowNode.cpp.o):
Filename longer than 260 characters
```

CMake mirrors each source file's absolute path inside the object directory, so the
Fabric codegen objects land at ~425 characters. The ninja bundled with Android SDK
cmake 3.22.1 is 1.10, which refuses anything past 260. Fix it once per machine:

```bash
pip install ninja          # 1.11+ uses the Windows long-path APIs
cp "$(python -c 'import ninja,os;print(os.path.join(os.path.dirname(ninja.__file__),"data","bin","ninja.exe"))')" .tools/ninja.exe
```

`plugins/withWindowsNinja.js` then points CMake at it — via `NINJA_PATH`, or
`.tools/ninja.exe`, or whatever `ninja` is on your PATH. It is a no-op on macOS,
Linux and EAS Build. Because the fix lives in a config plugin, `expo prebuild`
reapplies it and `android/` stays disposable.

Note that three things people usually try do **not** work here, so don't spend time
on them: the `LongPathsEnabled` registry key (ninja 1.10 never uses the `\\?\`
prefix), moving the project to a short path (the invariant part of that path is 290
characters on its own), and `-DCMAKE_OBJECT_PATH_MAX` (only the Makefile generators
honour it, not Ninja).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
