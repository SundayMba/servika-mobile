import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';

const STEPS = ['Details', 'Location', 'Confirm'];

/**
 * Three-step progress header for the booking flow, centered as a group.
 * `current` is 1-based (1 = Details, 2 = Location, 3 = Confirm).
 */
export function BookingSteps({ current }: { current: number }) {
  const currentStep = Math.max(1, Math.min(current, STEPS.length));

  return (
    <View className="flex-row items-start justify-center">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < currentStep;
        const active = step === currentStep;
        const isLast = index === STEPS.length - 1;

        return (
          <Fragment key={label}>
            <View className="items-center" style={{ width: 64 }}>
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

            {/* Fixed-width connectors keep the whole group symmetric/centred. */}
            {!isLast ? (
              <View
                className={
                  done ? 'mt-3.5 h-0.5 w-9 bg-primary' : 'mt-3.5 h-0.5 w-9 bg-gray-200'
                }
              />
            ) : null}
          </Fragment>
        );
      })}
    </View>
  );
}
