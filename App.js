import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import MainStackNavigator from './navigations/MainStackNavigator'

export default function App() {
  return (
    // SafeArea works only for IOS
    //<SafeAreaView style={styles.container}>
      <MainStackNavigator styles={styles}></MainStackNavigator>
    //</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
