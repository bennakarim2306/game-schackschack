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
            const response = await fetch(configs.USER_AUTH_BASE_URL + configs.USER_AUTH_SIGN_IN_PATH, {
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
                throw new Error("Login failed");
            } else {
                const jsonResponse = await response.json();
                await SecureStore.setItemAsync('userToken', jsonResponse.token);
                dispatch({ type: 'SIGN_IN', token: jsonResponse.token });
            }
        } catch (e) {
            throw e;
        }
      },
      signOut: async () => {
        await SecureStore.deleteItemAsync('userToken');
        dispatch({ type: 'SIGN_OUT' });
      },
      signUp: async (data) => {
        try {
          const response = await fetch(configs.USER_AUTH_BASE_URL + configs.USER_AUTH_SIGN_UP_PATH, {
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
          });

          if (response.status !== 200) {
            Alert.alert(
              'Registration issue',
              'We are sorry but something went wrong with \n the registration.. please try it later!',
              [{text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel'}]
            );
          } else {
            const jsonResponse = await response.json();
            await SecureStore.setItemAsync('userToken', jsonResponse.token);
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
          initialRouteName={state.userToken != null ? "GameNavigator" : "LoginStackNavigator"}
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