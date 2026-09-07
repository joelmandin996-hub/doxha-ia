import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { PeekMenuProvider } from './src/contexts/PeekMenuContext';
import RootNavigator from './src/navigation/RootNavigator';

// Keep the native splash up until RootNavigator knows whether we're logged
// in, so the app goes straight from splash to Login/Dashboard with no
// spinner flash in between.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PeekMenuProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </PeekMenuProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
