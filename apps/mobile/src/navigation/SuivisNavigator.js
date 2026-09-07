import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SuivisListScreen from '../screens/SuivisListScreen';
import SuiviDetailScreen from '../screens/SuiviDetailScreen';
import SuiviFormScreen from '../screens/SuiviFormScreen';
import MemberPickerScreen from '../screens/MemberPickerScreen';
import { detailScreenOptions, modalFormOptions, stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function SuivisNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="SuivisList" component={SuivisListScreen} options={{ title: 'Suivis' }} />
      <Stack.Screen name="SuiviDetail" component={SuiviDetailScreen} options={{ ...detailScreenOptions, title: 'Suivi' }} />
      <Stack.Screen name="SuiviForm" component={SuiviFormScreen} options={modalFormOptions} />
      <Stack.Screen name="MemberPicker" component={MemberPickerScreen} options={{ ...detailScreenOptions, title: 'Choisir un membre' }} />
    </Stack.Navigator>
  );
}
