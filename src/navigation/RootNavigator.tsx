import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DomainDetailScreen } from '@/features/stats/DomainDetailScreen';
import { HomeScreen } from '@/features/stats/HomeScreen';

export type RootStackParamList = {
  Home: undefined;
  DomainDetail: { domainId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Screens themselves take plain callback props (`onSelectDomain`, `onBack`) rather
 * than React Navigation's `navigation`/`route` types directly, so they stay
 * testable without a NavigationContainer. This is the one place that wires them up.
 */
export function RootNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home">
            {({ navigation }) => (
              <HomeScreen
                onSelectDomain={(domainId) => navigation.navigate('DomainDetail', { domainId })}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="DomainDetail">
            {({ navigation, route }) => (
              <DomainDetailScreen
                domainId={route.params.domainId}
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
