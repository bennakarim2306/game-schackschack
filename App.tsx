import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ErrorUtils } from 'react-native';
import MainStackNavigator from './navigations/MainStackNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <MainStackNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}