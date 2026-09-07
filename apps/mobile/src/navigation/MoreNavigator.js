import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import EventsListScreen from '../screens/EventsListScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import EventFormScreen from '../screens/EventFormScreen';
import DonationsListScreen from '../screens/DonationsListScreen';
import DonationFormScreen from '../screens/DonationFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MemberPickerScreen from '../screens/MemberPickerScreen';
import { detailScreenOptions, modalFormOptions, stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function MoreNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="More" component={MoreScreen} options={{ title: 'Plus' }} />
      <Stack.Screen name="Events" component={EventsListScreen} options={{ title: 'Événements' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ ...detailScreenOptions, title: 'Événement' }} />
      <Stack.Screen name="EventForm" component={EventFormScreen} options={modalFormOptions} />
      <Stack.Screen name="Donations" component={DonationsListScreen} options={{ title: 'Dons' }} />
      <Stack.Screen name="DonationForm" component={DonationFormScreen} options={modalFormOptions} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ ...detailScreenOptions, title: 'Paramètres' }} />
      <Stack.Screen name="MemberPicker" component={MemberPickerScreen} options={{ ...detailScreenOptions, title: 'Choisir un membre' }} />
    </Stack.Navigator>
  );
}
