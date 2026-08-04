import { fireEvent, render, screen } from '@testing-library/react-native';

import { FloatingBackButton } from './FloatingBackButton';

describe('FloatingBackButton', () => {
  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<FloatingBackButton onPress={onPress} />);

    fireEvent.press(screen.getByTestId('floating-back-button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports a custom testID', async () => {
    await render(<FloatingBackButton testID="custom-back" />);

    expect(screen.getByTestId('custom-back')).toBeTruthy();
  });
});
