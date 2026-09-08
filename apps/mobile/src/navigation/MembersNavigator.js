import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MembersListScreen from '../screens/MembersListScreen';
import MemberDetailScreen from '../screens/MemberDetailScreen';
import MemberFormScreen from '../screens/MemberFormScreen';
import MemberPickerScreen from '../screens/MemberPickerScreen';
import SmsComposeScreen from '../screens/SmsComposeScreen';
import { detailScreenOptions, modalFormOptions, stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function MembersNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="MembersList" component={MembersListScreen} options={{ title: 'Membres' }} />
      <Stack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ ...detailScreenOptions, title: 'Membre' }} />
      <Stack.Screen name="MemberForm" component={MemberFormScreen} options={modalFormOptions} />
      <Stack.Screen name="MemberPicker" component={MemberPickerScreen} options={{ ...detailScreenOptions, title: 'Choisir un membre' }} />
      <Stack.Screen name="SmsCompose" component={SmsComposeScreen} options={modalFormOptions} />
    </Stack.Navigator>
  );
}
