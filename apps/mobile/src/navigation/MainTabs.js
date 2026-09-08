import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DashboardNavigator from './DashboardNavigator';
import MembersNavigator from './MembersNavigator';
import GroupsNavigator from './GroupsNavigator';
import SuivisNavigator from './SuivisNavigator';
import MoreNavigator from './MoreNavigator';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: ['home-outline', 'home'],
  Members: ['people-outline', 'people'],
  Groups: ['people-circle-outline', 'people-circle'],
  Suivis: ['git-branch-outline', 'git-branch'],
  More: ['ellipsis-horizontal-circle-outline', 'ellipsis-horizontal-circle'],
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tertiaryLabel,
        tabBarStyle: styles.tabBar,
        tabBarBackground:
          Platform.OS === 'ios'
            ? () => <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            : undefined,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const [outline, filled] = ICONS[route.name] || ['ellipse-outline', 'ellipse'];
          return <Ionicons name={focused ? filled : outline} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardNavigator} options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="Members" component={MembersNavigator} options={{ tabBarLabel: 'Membres' }} />
      <Tab.Screen name="Groups" component={GroupsNavigator} options={{ tabBarLabel: 'Groupes' }} />
      <Tab.Screen name="Suivis" component={SuivisNavigator} options={{ tabBarLabel: 'Suivis' }} />
      <Tab.Screen name="More" component={MoreNavigator} options={{ tabBarLabel: 'Plus' }} />
    </Tab.Navigator>
  );
}

// Exported so screens that hide the tab bar (e.g. ChatThreadScreen, via
// navigation.getParent().setOptions({ tabBarStyle })) can restore the exact
// same style on the way out, instead of resetting to RN's unstyled default.
export const defaultTabBarStyle = {
  borderTopWidth: 0.5,
  borderTopColor: colors.separator,
  elevation: 0,
  backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.card,
};

const styles = StyleSheet.create({
  tabBar: defaultTabBarStyle,
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
