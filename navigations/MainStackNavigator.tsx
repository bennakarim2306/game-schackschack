import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Screen } from 'react-native-screens';
import GameNavigator from './GameNavigator';
import LoginStackNavigator from './LoginStackNavigator'
import { createContext, useEffect, useMemo, useReducer, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AuthContext from '../Contexts/AuthContext';
import GameContext from '../Contexts/GameContext';
import InGameNavigator from './InGameNavigator';
import { Alert } from 'react-native';
import configs from '../config/AppConfig';
import Logger from '../config/Logger';
import CoreBusinessNavigator from './CoreBusinessNavigator';

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
        try {
            const url = configs.USER_AUTH_BASE_URL + configs.USER_AUTH_SIGN_IN_PATH;
            
            Logger.info('AUTH', `Attempting login for: ${data.email}`);
            Logger.request(url, 'POST', { email: data.email, password: '***' });
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                }),
            });

            if (response.status !== 200) {
                const errorText = await response.text();
                Logger.response(url, response.status, errorText);
                Logger.error('AUTH', 'Login failed', errorText);
                throw new Error("Login failed");
            } else {
                const jsonResponse = await response.json();
                Logger.response(url, response.status);
                Logger.success('AUTH', 'Login successful - Token received');
                await SecureStore.setItemAsync('userToken', jsonResponse.token);
                await SecureStore.setItemAsync('refreshToken', jsonResponse.refreshToken);
                await SecureStore.setItemAsync('userEmail', data.email);
                dispatch({ type: 'SIGN_IN', token: jsonResponse.token });
            }
        } catch (e) {
            Logger.error('AUTH', 'Login exception', e);
            throw e;
        }
      },
      signOut: async () => {
        Logger.info('AUTH', 'User signing out');
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('userEmail');
        dispatch({ type: 'SIGN_OUT' });
        Logger.success('AUTH', 'User signed out successfully');
      },
      signUp: async (data) => {
        try {
          const url = configs.USER_AUTH_BASE_URL + configs.USER_AUTH_SIGN_UP_PATH;
          
          Logger.info('AUTH', `Attempting registration for: ${data.email}`);
          Logger.request(url, 'POST', { email: data.email });
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.email,
              password: data.password,
            }),
          });

          if (response.status !== 200) {
            const errorText = await response.text();
            Logger.response(url, response.status, errorText);
            Logger.error('AUTH', 'Registration failed', errorText);
            Alert.alert(
              'Registration issue',
              'We are sorry but something went wrong with \n the registration.. please try it later!',
              [{text: 'Ok', onPress: () => Logger.debug('AUTH', 'Alert dismissed'), style: 'cancel'}]
            );
          } else {
            const jsonResponse = await response.json();
            Logger.response(url, response.status);
            Logger.success('AUTH', 'Registration successful - Token received');
            await SecureStore.setItemAsync('userToken', jsonResponse.token);
            await SecureStore.setItemAsync('refreshToken', jsonResponse.refreshToken);
            await SecureStore.setItemAsync('userEmail', data.email);
            dispatch({ type: 'SIGN_IN', token: jsonResponse.token });
          }
        } catch (e) {
          Alert.alert(
            'Registration issue',
            'We are sorry but something went wrong with \n the registration.. please try it later!',
            [{text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'}]
          );
          console.error(`some error occured while registration request${e}`);
        }
      },
    }),
    [state.userToken]
  );



  return (
    <NavigationContainer>
      <AuthContext.Provider value={authContext}>
        <Stack.Navigator
          initialRouteName={state.userToken != null ? "CoreBusinessNavigator" : "LoginStackNavigator"}
          screenOptions={{
            headerShown: false
          }}>
          {state.userToken != null ?
            <Stack.Screen name="CoreBusinessNavigator" component={CoreBusinessNavigator} /> :
            <Stack.Screen name="LoginStackNavigator" component={LoginStackNavigator} />}
        </Stack.Navigator>
      </AuthContext.Provider>
    </NavigationContainer>
  );
}

export default MainStackNavigator;