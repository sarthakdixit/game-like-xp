import { StatusBar } from 'expo-status-bar';

import { HomeScreen } from '@/features/stats/HomeScreen';

export default function App() {
  return (
    <>
      <HomeScreen />
      <StatusBar style="auto" />
    </>
  );
}
