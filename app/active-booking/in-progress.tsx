import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { JOB_CHECKLIST, MOCK_ARTISAN } from '@/lib/active-booking/mock';
import { artisanAvatar } from '@/lib/catalogue/assets';

const COMPLETED = JOB_CHECKLIST.filter((i) => i.state === 'done').length;
const PROGRESS = Math.round((COMPLETED / JOB_CHECKLIST.length) * 100);

export default function JobInProgress() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; serviceName?: string }>();
  const serviceName = params.serviceName || 'Electrical Installation';
  const avatar = artisanAvatar(MOCK_ARTISAN.imageKey);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <View>
          <Text className="text-[22px] font-bold text-gray-900">Job in Progress</Text>
          <Text className="text-[13px] text-gray-500">
            Track your job status in real time
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
      >
        {/* Gradient status card */}
        <LinearGradient
          colors={['#F97316', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 18 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <Ionicons name="flash" size={22} color={colors.white} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[16px] font-bold text-white">{serviceName}</Text>
              <View className="mt-0.5 flex-row items-center gap-1">
                <View className="rounded-full bg-white/25 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-white">In Progress</Text>
                </View>
              </View>
            </View>
            {avatar ? (
              <Image
                source={avatar}
                style={{ width: 36, height: 36, borderRadius: 18 }}
                contentFit="cover"
              />
            ) : null}
          </View>

          <View className="mt-4 flex-row justify-between">
            <View>
              <Text className="text-[11px] text-white/70">Started At</Text>
              <Text className="text-[13px] font-semibold text-white">Today, 10:30 AM</Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] text-white/70">Est. Completion</Text>
              <Text className="text-[13px] font-semibold text-white">Today, 02:30 PM</Text>
            </View>
          </View>

          <View className="mt-4">
            <View className="h-2 overflow-hidden rounded-full bg-white/25">
              <View className="h-2 rounded-full bg-white" style={{ width: `${PROGRESS}%` }} />
            </View>
            <Text className="mt-1.5 text-[11px] text-white/80">{PROGRESS}% complete</Text>
          </View>
        </LinearGradient>

        {/* Checklist */}
        <View className="mt-4 rounded-3xl border border-gray-100 bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-gray-900">Job Checklist</Text>
            <Text className="text-[12px] text-gray-400">
              {COMPLETED} of {JOB_CHECKLIST.length} completed
            </Text>
          </View>

          <View className="mt-3">
            {JOB_CHECKLIST.map((item, idx) => {
              const done = item.state === 'done';
              const current = item.state === 'current';
              return (
                <View key={item.id} className="flex-row">
                  <View className="items-center">
                    <View
                      className={
                        done
                          ? 'h-6 w-6 items-center justify-center rounded-full bg-green-500'
                          : current
                            ? 'h-6 w-6 items-center justify-center rounded-full bg-primary'
                            : 'h-6 w-6 items-center justify-center rounded-full border-2 border-gray-200 bg-white'
                      }
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={13} color={colors.white} />
                      ) : (
                        <Text
                          className={
                            current
                              ? 'text-[11px] font-bold text-white'
                              : 'text-[11px] font-bold text-gray-400'
                          }
                        >
                          {idx + 1}
                        </Text>
                      )}
                    </View>
                    {idx < JOB_CHECKLIST.length - 1 ? (
                      <View className="my-0.5 w-0.5 flex-1 bg-gray-200" />
                    ) : null}
                  </View>
                  <View className="mb-3 ml-3 flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[14px] font-semibold text-gray-900">
                        {item.title}
                      </Text>
                      {item.time ? (
                        <Text className="text-[11px] text-gray-400">{item.time}</Text>
                      ) : current ? (
                        <Text className="text-[11px] font-semibold text-primary">
                          In Progress
                        </Text>
                      ) : (
                        <Text className="text-[11px] text-gray-400">Pending</Text>
                      )}
                    </View>
                    <Text className="text-[12px] text-gray-500">{item.detail}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Support */}
        <View className="mt-4 flex-row items-center rounded-2xl bg-primary/5 p-3.5">
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <View className="ml-2 flex-1">
            <Text className="text-[13px] font-bold text-gray-900">Need help?</Text>
            <Text className="text-[11px] text-gray-500">
              Our support team is available 24/7.
            </Text>
          </View>
          <Pressable className="rounded-full border border-gray-200 bg-white px-3 py-1.5">
            <Text className="text-[12px] font-semibold text-gray-700">Contact</Text>
          </Pressable>
        </View>

        {/* Actions */}
        <View className="mt-5">
          <Button
            label="Mark as Completed"
            onPress={() =>
              router.push({
                pathname: '/active-booking/completion',
                params: { id: params.id || 'demo', name: params.name, serviceName },
              })
            }
          />
        </View>
        <Pressable
          onPress={() => router.push('/report-issue')}
          className="mt-4 flex-row items-center justify-center gap-1.5"
        >
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text className="text-[14px] font-semibold text-red-600">Report an Issue</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
