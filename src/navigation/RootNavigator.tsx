import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HealthScreen } from '@/features/health/HealthScreen';
import { DailyQuestsScreen } from '@/features/quests/DailyQuestsScreen';
import { DomainDetailScreen } from '@/features/stats/DomainDetailScreen';
import { HomeScreen } from '@/features/stats/HomeScreen';
import { colors } from '@/ui/theme';

export type HomeStackParamList = {
  Home: undefined;
  DomainDetail: { domainId: string };
  DailyQuests: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  Health: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Screens themselves take plain callback props (`onSelectDomain`, `onBack`) rather
 * than React Navigation's `navigation`/`route` types directly, so they stay
 * testable without a NavigationContainer. This is the one place that wires them up.
 */
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home">
        {({ navigation }) => (
          <HomeScreen
            onSelectDomain={(domainId) => navigation.navigate('DomainDetail', { domainId })}
            onOpenDailyQuests={() => navigation.navigate('DailyQuests')}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="DomainDetail">
        {({ navigation, route }) => (
          <DomainDetailScreen domainId={route.params.domainId} onBack={() => navigation.goBack()} />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="DailyQuests">
        {({ navigation }) => <DailyQuestsScreen onBack={() => navigation.goBack()} />}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.gold,
            tabBarInactiveTintColor: colors.inkSoft,
            tabBarStyle: { backgroundColor: colors.parchmentLight },
          }}
        >
          <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
          <Tab.Screen name="Health" component={HealthScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
