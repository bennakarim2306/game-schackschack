import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import MainStackNavigator from './navigations/MainStackNavigator';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'fredoka-regular': require('./assets/fonts/Fredoka-Regular.ttf'),
          'fredoka-bold': require('./assets/fonts/Fredoka-Bold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue anyway
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Or return a splash screen
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#D9F2D9' }}>
        <MainStackNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}