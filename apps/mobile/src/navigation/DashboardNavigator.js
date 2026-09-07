import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import { stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function DashboardNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
