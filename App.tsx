import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MainStackNavigator from './navigations/MainStackNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#D9F2D9' }}>
        <MainStackNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}