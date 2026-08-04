import { StyleSheet, View } from 'react-native';

import { colors } from './theme';

export interface ProgressBarProps {
  value: number;
  maxValue?: number;
  color?: string;
  testID?: string;
}

/** A simple clamped horizontal progress bar, purely derived from props. */
export function ProgressBar({
  value,
  maxValue = 100,
  color = colors.gold,
  testID,
}: ProgressBarProps) {
  const clamped = Math.min(maxValue, Math.max(0, value));
  const percent = maxValue === 0 ? 0 : (clamped / maxValue) * 100;

  return (
    <View testID={testID} style={styles.track}>
      <View
        testID={testID ? `${testID}-fill` : undefined}
        style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
