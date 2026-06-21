import { Image } from 'expo-image';
import { Pressable, Text, View, type ImageSourcePropType } from 'react-native';

/** Minimal shape a tile needs — works for both static and API-backed data. */
export type ServiceTileItem = {
  label: string;
  image?: ImageSourcePropType;
};

export function ServiceTile({
  service,
  onPress,
}: {
  service: ServiceTileItem;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={service.label}
      onPress={onPress}
      className="w-1/4 items-center"
    >
      <View className="h-[68px] w-[68px] items-center justify-center rounded-2xl bg-background">
        <Image
          source={service.image}
          contentFit="contain"
          style={{ height: 60, width: 60 }}
        />
      </View>
      <Text
        numberOfLines={1}
        className="mt-2 text-[11px] font-medium text-gray-600"
      >
        {service.label}
      </Text>
    </Pressable>
  );
}
