// react-native-safe-area-context needs a real native layout event to resolve
// insets, which never fires under Jest — its own recommended mock supplies
// sane zero-inset defaults instead so components using useSafeAreaInsets()
// don't hang waiting for a SafeAreaProvider to measure a real frame.
jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});
