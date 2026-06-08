import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Categories() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-base font-medium text-gray-400">
          Categories screen — coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}
