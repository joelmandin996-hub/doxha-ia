import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupsListScreen from '../screens/GroupsListScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import GroupFormScreen from '../screens/GroupFormScreen';
import MemberPickerScreen from '../screens/MemberPickerScreen';
import { detailScreenOptions, modalFormOptions, stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function GroupsNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="GroupsList" component={GroupsListScreen} options={{ title: 'Groupes' }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ ...detailScreenOptions, title: 'Groupe' }} />
      <Stack.Screen name="GroupForm" component={GroupFormScreen} options={modalFormOptions} />
      <Stack.Screen name="MemberPicker" component={MemberPickerScreen} options={{ ...detailScreenOptions, title: 'Choisir un membre' }} />
    </Stack.Navigator>
  );
}
