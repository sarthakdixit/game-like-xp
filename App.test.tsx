import { render, screen } from '@testing-library/react-native';

import App from './App';

test('renders the Chronicle placeholder screen', async () => {
  await render(<App />);
  expect(screen.getByText('Chronicle')).toBeTruthy();
});
