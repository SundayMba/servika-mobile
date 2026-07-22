import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingSteps } from '@/components/booking/BookingSteps';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { useArtisan, useCategories } from '@/lib/catalogue/hooks';
import { formatDate } from '@/lib/booking/display';

// Quick-pick arrival windows; "Any time" suits customers who just want it done.
const TIME_PRESETS: {
  label: string;
  range: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: 'Morning', range: '8am – 12pm', value: 'Morning (8am - 12pm)', icon: 'sunny-outline' },
  { label: 'Afternoon', range: '12pm – 4pm', value: 'Afternoon (12pm - 4pm)', icon: 'partly-sunny-outline' },
  { label: 'Evening', range: '4pm – 8pm', value: 'Evening (4pm - 8pm)', icon: 'moon-outline' },
  { label: 'Any time', range: "I'm flexible", value: 'Any time (flexible)', icon: 'time-outline' },
];

/** "9:30 AM" — how the custom window renders into the booking's time slot. */
function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">
      {children}
    </Text>
  );
}

/** A read-only field that looks like a dropdown / picker trigger. */
function SelectField({
  value,
  placeholder,
  icon = 'chevron-down',
  onPress,
}: {
  value?: string;
  placeholder: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4"
    >
      <Text
        className={
          value ? 'text-[15px] text-gray-900' : 'text-[15px] text-gray-400'
        }
      >
        {value ?? placeholder}
      </Text>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function UrgencyOption({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={
        selected
          ? 'flex-1 rounded-2xl border-2 border-primary bg-primary/5 p-3.5'
          : 'flex-1 rounded-2xl border border-gray-200 bg-white p-3.5'
      }
    >
      <View className="flex-row items-center gap-2">
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={18}
          color={selected ? colors.primary : colors.textMuted}
        />
        <Text className="text-[14px] font-semibold text-gray-900">{title}</Text>
      </View>
      <Text className="mt-1 text-[12px] text-gray-500">{subtitle}</Text>
    </Pressable>
  );
}

export default function BookingRequest() {
  const router = useRouter();
  const { service, artisanId, categorySlug, open, artisanServiceId, fixedPrice } =
    useLocalSearchParams<{
      service?: string;
      artisanId?: string;
      categorySlug?: string;
      open?: string;
      artisanServiceId?: string;
      fixedPrice?: string;
    }>();

  const [description, setDescription] = useState('');
  // `date` holds an ISO datetime; the field shows it formatted.
  const [date, setDate] = useState<string | undefined>(undefined);
  const [urgency, setUrgency] = useState<'standard' | 'urgent'>('standard');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // "Service needed" is a real dropdown: booking a specific artisan offers THAT
  // artisan's services; an open request offers the service categories (changing
  // one also retargets which artisans see the post, via the category slug).
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false);
  const [serviceChoice, setServiceChoice] = useState<{
    label: string;
    slug?: string;
  } | null>(null);

  const { data: artisan } = useArtisan(artisanId || undefined);
  const { data: categories } = useCategories();
  const serviceOptions: { label: string; slug?: string }[] = artisanId
    ? [...new Set([artisan?.specialty, ...(artisan?.services ?? [])])]
        .filter((s): s is string => !!s)
        .map((label) => ({ label }))
    : (categories ?? []).map((c) => ({ label: c.name, slug: c.slug }));

  // Preferred time: a quick-pick preset OR a custom From–To window (the custom
  // window wins once both ends are set; picking either clears the other mode).
  const [preset, setPreset] = useState<string | undefined>(undefined);
  const [fromTime, setFromTime] = useState<Date | null>(null);
  const [toTime, setToTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<'from' | 'to' | null>(null);

  const customTime =
    fromTime && toTime ? `${fmtTime(fromTime)} – ${fmtTime(toTime)}` : undefined;
  const time = customTime ?? preset;

  const serviceName = serviceChoice?.label ?? service ?? 'Service Request';
  // An open request re-files under the newly chosen category's slug.
  const effectiveCategorySlug = serviceChoice?.slug ?? categorySlug;
  const canContinue = description.trim().length > 0 && !!date && !!time;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const onChangeDate = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) setDate(selected.toISOString());
  };

  const pickPreset = (value: string) => {
    setPreset(value);
    setFromTime(null);
    setToTime(null);
  };

  const onChangeTime = (event: DateTimePickerEvent, selected?: Date) => {
    const which = showTimePicker;
    setShowTimePicker(null);
    if (event.type !== 'set' || !selected || !which) return;
    setPreset(undefined);
    if (which === 'from') {
      setFromTime(selected);
      // Keep the window valid — default/bump the end to 2h after the start.
      if (!toTime || toTime <= selected) {
        setToTime(new Date(selected.getTime() + 2 * 60 * 60 * 1000));
      }
    } else {
      if (fromTime && selected <= fromTime) {
        setToTime(new Date(fromTime.getTime() + 60 * 60 * 1000));
      } else {
        setToTime(selected);
        // Picking an end first still forms a window — start 2h before it.
        if (!fromTime) setFromTime(new Date(selected.getTime() - 2 * 60 * 60 * 1000));
      }
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: '/booking/photos',
      params: {
        service: serviceName,
        artisanId,
        categorySlug: effectiveCategorySlug,
        open,
        artisanServiceId,
        fixedPrice,
        description: description.trim(),
        date,
        time,
        urgency,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View className="items-center">
          <Text className="text-[17px] font-bold text-gray-900">
            Request Service
          </Text>
          <Text className="text-[12px] text-gray-500">{serviceName}</Text>
        </View>
      </View>

      {/* Steps */}
      <View className="px-5 py-4">
        <BookingSteps current={1} />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            paddingTop: 4,
            paddingBottom: 24,
          }}
        >
          {/* Service needed */}
          <FieldLabel>Service needed</FieldLabel>
          <SelectField
            value={serviceName}
            placeholder="Select a service"
            onPress={
              serviceOptions.length > 0
                ? () => setServiceSheetOpen(true)
                : undefined
            }
          />

          {/* Describe the job */}
          <View className="mt-4">
            <FieldLabel>Describe the job</FieldLabel>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell the artisan what you need done..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              className="min-h-[96px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
            />
          </View>

          {/* Preferred date */}
          <View className="mt-4">
            <FieldLabel>Preferred date</FieldLabel>
            <SelectField
              value={date ? formatDate(date) : undefined}
              placeholder="Select date"
              icon="calendar-outline"
              onPress={() => setShowDatePicker(true)}
            />
            {showDatePicker ? (
              <DateTimePicker
                value={date ? new Date(date) : today}
                mode="date"
                minimumDate={today}
                onChange={onChangeDate}
              />
            ) : null}
          </View>

          {/* Preferred time — quick-pick windows, or an exact From–To range */}
          <View className="mt-4">
            <FieldLabel>Preferred time</FieldLabel>
            <View className="flex-row flex-wrap justify-between" style={{ rowGap: 10 }}>
              {TIME_PRESETS.map((p) => {
                const selected = preset === p.value && !customTime;
                return (
                  <Pressable
                    key={p.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${p.label}, ${p.range}`}
                    onPress={() => pickPreset(p.value)}
                    className={
                      selected
                        ? 'w-[48.5%] flex-row items-center gap-2.5 rounded-2xl border-2 border-primary bg-primary/5 px-3 py-3'
                        : 'w-[48.5%] flex-row items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-3'
                    }
                  >
                    <View
                      className={
                        selected
                          ? 'h-9 w-9 items-center justify-center rounded-full bg-primary'
                          : 'h-9 w-9 items-center justify-center rounded-full bg-background'
                      }
                    >
                      <Ionicons
                        name={p.icon}
                        size={17}
                        color={selected ? colors.white : colors.textSecondary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className={
                          selected
                            ? 'text-[13px] font-bold text-gray-900'
                            : 'text-[13px] font-semibold text-gray-800'
                        }
                      >
                        {p.label}
                      </Text>
                      <Text numberOfLines={1} className="text-[11px] text-gray-400">
                        {p.range}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Exact window */}
            <View className="my-3 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-gray-200" />
              <Text className="text-[11px] font-medium text-gray-400">
                OR CHOOSE AN EXACT WINDOW
              </Text>
              <View className="h-px flex-1 bg-gray-200" />
            </View>
            <View className="flex-row items-center gap-2.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Earliest arrival time"
                onPress={() => setShowTimePicker('from')}
                className={
                  customTime
                    ? 'h-14 flex-1 justify-center rounded-2xl border-2 border-primary bg-primary/5 px-4'
                    : 'h-14 flex-1 justify-center rounded-2xl border border-gray-200 bg-white px-4'
                }
              >
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  From
                </Text>
                <Text
                  className={
                    fromTime ? 'text-[15px] font-semibold text-gray-900' : 'text-[15px] text-gray-400'
                  }
                >
                  {fromTime ? fmtTime(fromTime) : 'e.g. 9:00 AM'}
                </Text>
              </Pressable>
              <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Latest arrival time"
                onPress={() => setShowTimePicker('to')}
                className={
                  customTime
                    ? 'h-14 flex-1 justify-center rounded-2xl border-2 border-primary bg-primary/5 px-4'
                    : 'h-14 flex-1 justify-center rounded-2xl border border-gray-200 bg-white px-4'
                }
              >
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  To
                </Text>
                <Text
                  className={
                    toTime ? 'text-[15px] font-semibold text-gray-900' : 'text-[15px] text-gray-400'
                  }
                >
                  {toTime ? fmtTime(toTime) : 'e.g. 11:00 AM'}
                </Text>
              </Pressable>
            </View>
            {showTimePicker ? (
              <DateTimePicker
                value={
                  (showTimePicker === 'from' ? fromTime : toTime) ??
                  fromTime ??
                  new Date()
                }
                mode="time"
                minuteInterval={15}
                onChange={onChangeTime}
              />
            ) : null}
          </View>

          {/* Urgency */}
          <View className="mt-4">
            <FieldLabel>Urgency</FieldLabel>
            <View className="flex-row gap-3">
              <UrgencyOption
                title="Standard"
                subtitle="Within 24-48h"
                selected={urgency === 'standard'}
                onPress={() => setUrgency('standard')}
              />
              <UrgencyOption
                title="Urgent"
                subtitle="Within 2-4h"
                selected={urgency === 'urgent'}
                onPress={() => setUrgency('urgent')}
              />
            </View>
          </View>

          {/* Continue */}
          <View className="mt-7">
            <Button
              label="Continue"
              disabled={!canContinue}
              onPress={handleContinue}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Service dropdown — the artisan's services, or (open request) the
          service categories ── */}
      <BottomSheet
        visible={serviceSheetOpen}
        onClose={() => setServiceSheetOpen(false)}
      >
        <Text className="mb-1 text-[18px] font-bold text-gray-900">
          Select a service
        </Text>
        <Text className="mb-4 text-[13px] text-gray-500">
          {artisanId
            ? `What ${artisan?.fullName ?? 'this artisan'} can help you with.`
            : 'Your request goes to artisans in this category.'}
        </Text>
        <ScrollView
          style={{ maxHeight: 380 }}
          showsVerticalScrollIndicator={false}
        >
          {serviceOptions.map((option) => {
            const selected = option.label === serviceName;
            return (
              <Pressable
                key={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  setServiceChoice(option);
                  setServiceSheetOpen(false);
                }}
                className="flex-row items-center justify-between border-b border-gray-100 py-3.5"
              >
                <Text
                  className={
                    selected
                      ? 'text-[15px] font-semibold text-primary'
                      : 'text-[15px] text-gray-800'
                  }
                >
                  {option.label}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
