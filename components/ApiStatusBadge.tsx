import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useHealthCheck } from '@/lib/api/health';
import { config } from '@/lib/config';

/**
 * Dev-only badge that shows whether the app can reach the Servika API.
 * Rendered only when __DEV__ is true, so it never ships to production.
 * This is the Slice 0 "connect + test" proof; remove once real screens
 * exercise the API.
 */
export function ApiStatusBadge() {
  const { data, isLoading, isError } = useHealthCheck();

  if (!__DEV__) return null;

  const { label, color } = isLoading
    ? { label: 'API…', color: '#9CA3AF' }
    : isError
      ? { label: 'API offline', color: '#EF4444' }
      : { label: `API ${data ?? 'ok'}`, color: '#16A34A' };

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        // Pinned to the top: at the bottom it covered the primary CTA on every
        // screen, in the app and in captured screenshots alike.
        top: 8,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(17,24,39,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        zIndex: 1000,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <AppText style={{ color: 'white', fontSize: 11 }}>
        {label} · {config.apiBaseUrl.replace(/^https?:\/\//, '')}
      </AppText>
    </View>
  );
}
