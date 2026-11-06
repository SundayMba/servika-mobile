import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

/** "Can't find what you want?" A way to ask for a service Servika does not offer yet. */
export function CantFindCard({ onPress, style }: { onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, style]}>
      <View style={styles.icon}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.accentDeep} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText weight="semibold" style={styles.title}>Can&apos;t find what you want?</AppText>
        <AppText style={styles.sub}>Tell us the service you need.</AppText>
      </View>
      <Ionicons name="arrow-forward" size={18} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentTint },
  title: { fontSize: 14.5, color: colors.ink },
  sub: { fontSize: 12.5, lineHeight: 17, color: colors.inkMuted },
});
