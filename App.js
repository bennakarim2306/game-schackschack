import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainStackNavigator from './navigations/MainStackNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <MainStackNavigator></MainStackNavigator>
    </SafeAreaProvider>
  );
}