import { render, screen } from '@testing-library/react-native';

import { ProgressBar } from './ProgressBar';

function widthPercent(view: ReturnType<typeof screen.getByTestId>): number {
  const style = Array.isArray(view.props.style)
    ? Object.assign({}, ...view.props.style)
    : view.props.style;
  return Number(String(style.width).replace('%', ''));
}

describe('ProgressBar', () => {
  it('fills proportionally to value/maxValue', async () => {
    await render(<ProgressBar testID="bar" value={50} maxValue={100} />);
    expect(widthPercent(screen.getByTestId('bar-fill'))).toBe(50);
  });

  it('fills fully at maxValue', async () => {
    await render(<ProgressBar testID="bar" value={100} maxValue={100} />);
    expect(widthPercent(screen.getByTestId('bar-fill'))).toBe(100);
  });

  it('clamps a value above maxValue to 100%', async () => {
    await render(<ProgressBar testID="bar" value={999} maxValue={100} />);
    expect(widthPercent(screen.getByTestId('bar-fill'))).toBe(100);
  });

  it('clamps a negative value to 0%', async () => {
    await render(<ProgressBar testID="bar" value={-20} maxValue={100} />);
    expect(widthPercent(screen.getByTestId('bar-fill'))).toBe(0);
  });

  it('handles a maxValue of 0 without dividing by zero', async () => {
    await render(<ProgressBar testID="bar" value={10} maxValue={0} />);
    expect(widthPercent(screen.getByTestId('bar-fill'))).toBe(0);
  });
});
