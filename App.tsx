import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainStackNavigator from './navigations/MainStackNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <MainStackNavigator />
    </SafeAreaProvider>
  );
}