import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { fonts } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center gap-4 bg-white p-5">
        <AppText weight="semibold" className="text-xl text-gray-900">
          This screen doesn&apos;t exist.
        </AppText>
        {/* Link renders its own Text, so the family has to be set on it
            directly — className carries no font-family. */}
        <Link
          href="/"
          style={{ fontFamily: fonts.semibold }}
          className="text-[15px] text-primary"
        >
          Go to home screen
        </Link>
      </View>
    </>
  );
}
