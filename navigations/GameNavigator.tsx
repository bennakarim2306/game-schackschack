import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Profile from "../screens/Profile";
import GameStart from "../screens/GameStart";
import FriendsList from "../screens/FriendsList";
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { Alert, BackHandler, Image, View } from "react-native";
import GameContext from "../Contexts/GameContext";
import InGameNavigator from "./InGameNavigator";

const GameBottomNavigator = createBottomTabNavigator();


const GameNavigator = () => {

    const [state, dispatch] = useReducer((prevState, action) => {
        switch (action.type) {
            case 'GAME_STARTED':
                return {
                  ...prevState,
                  gameStarted: action.gameStarted,
                  gameId: action.gameId
                };
            case 'GAME_STOPPED':
                return {
                    ...prevState,
                    gameStarted: action.gameStarted,
                    gameId: action.gameId
                }
        }
    }, {
        gameStarted: false,
        gameId: null
    })
    const gameContext = useMemo(() => ({
        startGame: async (data) => {
          // here will come the logic for starting the game
          // for now we will just passby the gameId
          dispatch({ type: 'GAME_STARTED', gameId: 'dummy-game-id', gameStarted: true })
        },
        stopGame: async (data) => {
            dispatch({ type: 'GAME_STOPPED', gameId: null, gameStarted: false})
        }
      }), 
      []
    );
    useEffect(() => {
        const backAction = () => {
          Alert.alert('Hold on!', 'Are you sure you want to leave the application?', [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {text: 'YES', onPress: () => BackHandler.exitApp()},
          ]);
          return true;
        };
    
        const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          backAction,
        );
    
        return () => backHandler.remove();
      }, []);
    return (
        <GameContext.Provider value={gameContext}>
            {state.gameStarted === false ? <GameBottomNavigator.Navigator
                initialRouteName="GameStart"
                backBehavior="history"
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        if (route.name === 'Profile') {
                            return <View >
                                <Image
                                    source={require('../assets/BottomTabBarIcons/user.png')}
                                    fadeDuration={0}
                                    style={focused ? { width: 50, height: 50 } : {width: 40, height: 40}}
                                />
                            </View>;
                            const userIcon = '../assets/BottomTabBarIcons/user.png'
                        } else if (route.name === 'GameStart') {
                            return <View >
                                <Image
                                    source={require('../assets/BottomTabBarIcons/board-game.png')}
                                    fadeDuration={0}
                                    style={focused ? { width: 50, height: 50 } : {width: 40, height: 40}}
                                />
                            </View>;
                        } else {
                            return <View >
                                <Image
                                    source={require('../assets/BottomTabBarIcons/friends.png')}
                                    fadeDuration={0}
                                    style={focused ? { width: 50, height: 50 } : {width: 40, height: 40}}
                                />
                            </View>;
                        }

                        // You can return any component that you like here!

                    },
                    tabBarActiveTintColor: 'tomato',
                    tabBarInactiveTintColor: 'white',
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        height: '10%'
                    }
                })}
            >
                <GameBottomNavigator.Screen name="Profile" component={Profile}>
                </GameBottomNavigator.Screen>
                <GameBottomNavigator.Screen name="GameStart" component={GameStart}>
                </GameBottomNavigator.Screen>
                <GameBottomNavigator.Screen name="FriendsList" component={FriendsList}>
                </GameBottomNavigator.Screen>

            </GameBottomNavigator.Navigator>
            : <InGameNavigator />}
        </GameContext.Provider>
    );
}

export default GameNavigator;