import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { colors } from './theme';

export interface FloatingBackButtonProps {
  onPress?: () => void;
  testID?: string;
}

const BUTTON_SIZE = 40;

/** A circular, safe-area-aware back button that floats over scroll content. */
export function FloatingBackButton({
  onPress,
  testID = 'floating-back-button',
}: FloatingBackButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      hitSlop={8}
      style={({ pressed }) => [styles.button, { top: insets.top + 12 }, pressed && styles.pressed]}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path
          d="M15 18l-6-6 6-6"
          fill="none"
          stroke={colors.goldBright}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: 16,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: colors.leather,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});
