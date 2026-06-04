import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center gap-4 bg-white p-5">
        <Text className="text-xl font-bold text-gray-900">
          This screen doesn&apos;t exist.
        </Text>
        <Link href="/" className="text-[15px] font-semibold text-primary">
          Go to home screen
        </Link>
      </View>
    </>
  );
}
