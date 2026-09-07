import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardNavigator from './DashboardNavigator';
import MembersNavigator from './MembersNavigator';
import GroupsNavigator from './GroupsNavigator';
import SuivisNavigator from './SuivisNavigator';
import MoreNavigator from './MoreNavigator';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: 'home',
  Members: 'people',
  Groups: 'people-circle',
  Suivis: 'git-branch',
  More: 'menu',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name] || 'ellipse'} size={size} color={color} />
        ),
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
