import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';

const STEPS = ['Details', 'Location', 'Confirm'];

/**
 * Three-step progress header for the booking flow.
 * `current` is 1-based (1 = Details, 2 = Location, 3 = Confirm).
 */
export function BookingSteps({ current }: { current: number }) {
  const currentStep = Math.max(1, Math.min(current, STEPS.length));

  return (
    <View className="flex-row items-start px-2">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < currentStep;
        const active = step === currentStep;
        const isLast = index === STEPS.length - 1;

        return (
          <View key={label} className="flex-1 flex-row items-start">
            <View className="items-center" style={{ width: 56 }}>
              <View
                className={
                  active || done
                    ? 'h-7 w-7 items-center justify-center rounded-full bg-primary'
                    : 'h-7 w-7 items-center justify-center rounded-full bg-gray-200'
                }
              >
                {done ? (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                ) : (
                  <Text
                    className={
                      active
                        ? 'text-[12px] font-bold text-white'
                        : 'text-[12px] font-bold text-gray-500'
                    }
                  >
                    {step}
                  </Text>
                )}
              </View>
              <Text
                className={
                  active
                    ? 'mt-1 text-[11px] font-semibold text-gray-900'
                    : 'mt-1 text-[11px] font-medium text-gray-400'
                }
              >
                {label}
              </Text>
            </View>

            {!isLast ? (
              <View
                className={
                  done
                    ? 'mt-3.5 h-0.5 flex-1 bg-primary'
                    : 'mt-3.5 h-0.5 flex-1 bg-gray-200'
                }
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
