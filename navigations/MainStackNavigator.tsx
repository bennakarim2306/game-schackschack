import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Screen } from 'react-native-screens';
import GameNavigator from './GameNavigator';
import LoginStackNavigator from './LoginStackNavigator'
import { createContext, useEffect, useMemo, useReducer, useState } from 'react';
import * as SecureStore from 'expo-secure-store'
import AuthContext from '../Contexts/AuthContext';
import GameContext from '../Contexts/GameContext';
import InGameNavigator from './InGameNavigator';
import { Alert } from 'react-native';

const Stack = createNativeStackNavigator();

const MainStackNavigator = () => {
  const [state, dispatch] = useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      gameStarted: false,
      gameId: null
    }
  );

  useEffect(() => {
    // Fetch the token from storage then navigate to our appropriate place
    const bootstrapAsync = async () => {
      let userToken;

      try {
        userToken = null;
      } catch (e) {
        // Restoring token failed
      }

      // After restoring token, we may need to validate it in production apps

      // This will switch to the App screen or Auth screen and this loading
      // screen will be unmounted and thrown away.
      dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };

    bootstrapAsync();
  }, []);

  const authContext = useMemo(
    () => ({
      getUserToken: () => state.userToken,
      signIn: async (data) => {
        // In a production app, we need to send some data (usually username, password) to server and get a token
        // We will also need to handle errors if sign in failed
        // After getting token, we need to persist the token using `SecureStore`
        // In the example, we'll use a dummy token
        await fetch('http://192.168.1.21:8080/api/v1/auth/authenticate', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        })
        .then(async response => {
          console.log(`received response from server ${JSON.stringify(response)}`)
          if(response.status !== 200) {
            Alert.alert(
            'Registration issue',
            'We are sorry but something went wrong with \n the registration.. please try it later!',
            [{text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'}])
          }
          else {
            const jsonResponse = await response.json();
            console.log("received data from server for login: " + JSON.stringify(jsonResponse.token))
            await SecureStore.setItemAsync('userToken', jsonResponse.token)
            dispatch({ type: 'SIGN_IN', token: jsonResponse.token });
          }
        })
        .catch(e => {
          Alert.alert(
            'Registration issue',
            'We are sorry but something went wrong with \n the registration.. please try it later!',
            [{text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'}])
          console.error(`some error occured while registration request${e}`)
        })
      },
      signOut: () => dispatch({ type: 'SIGN_OUT' }),
      signUp: async (data) => {
        console.log(`sending registration request with data: ${JSON.stringify(data)}`)
        // In a production app, we need to send user data to server and get a token
        // We will also need to handle errors if sign up failed
        // After getting token, we need to persist the token using `SecureStore`
        // In the example, we'll use a dummy token
        await fetch('http://192.168.1.21:8080/api/v1/auth/register', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstname: data.firstName,
            lastname: data.lastName,
            email: data.email,
            password: data.password,
          }),
        })
        .then(async response => {
          console.log(`received response from server ${JSON.stringify(response)}`)
          if(response.status !== 200) {
            Alert.alert(
            'Registration issue',
            'We are sorry but something went wrong with \n the registration.. please try it later!',
            [{text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'}])
          }
          else {
            const jsonResponse = await response.json();
            console.log("received data from server for registration: " + JSON.stringify(jsonResponse))
            dispatch({ type: 'SIGN_IN', token: jsonResponse.token });
          }
        })
        .catch(e => {
          Alert.alert(
            'Registration issue',
            'We are sorry but something went wrong with \n the registration.. please try it later!',
            [{text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'}])
          console.error(`some error occured while registration request${e}`)
        })
      },
    }),
    []
  );



  return (
    <NavigationContainer>
      <AuthContext.Provider value={authContext}>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerShown: false
          }}>
          {state.userToken != null ?
            <Stack.Screen name="GameNavigator" component={GameNavigator} /> :
            <Stack.Screen name="LoginStackNavigator" component={LoginStackNavigator} />}
        </Stack.Navigator>
      </AuthContext.Provider>
    </NavigationContainer>
  );
}

export default MainStackNavigator;