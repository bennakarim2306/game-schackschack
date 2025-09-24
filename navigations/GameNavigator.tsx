import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Profile from "../screens/Profile";
import GameStart from "../screens/GameStart";
import FriendsList from "../screens/ContactsList";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { Alert, BackHandler, Image, View, Animated } from "react-native";
import GameContext from "../Contexts/GameContext";
import InGameNavigator from "./InGameNavigator";
import ChatNavigator from "./ChatNavigator";
import CoreBusinessNavigator from "./CoreBusinessNavigator";

const GameBottomNavigator = createBottomTabNavigator();


const GameNavigator = ({ route, navigation }) => {

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
            dispatch({ type: 'GAME_STOPPED', gameId: null, gameStarted: false })
        },
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
                { text: 'YES', onPress: () => BackHandler.exitApp() },
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
                initialRouteName="CoreBusinessNavigator"
                backBehavior="history"
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarIcon: ({ focused, color, size }) => {
                        // Animated value for scaling
                        const scaleAnim = React.useRef(new Animated.Value(focused ? 1.2 : 1)).current;

                        useEffect(() => {
                            Animated.spring(scaleAnim, {
                                toValue: focused ? 1.2 : 1,
                                useNativeDriver: true,
                                friction: 5
                            }).start();
                        }, [focused]);

                        let iconSource;
                        if (route.name === 'Profile') {
                            iconSource = require('../assets/BottomTabBarIcons/profile.png');
                        } else if (route.name === 'CoreBusinessNavigator') {
                            iconSource = require('../assets/BottomTabBarIcons/food.png');
                        } else {
                            iconSource = require('../assets/BottomTabBarIcons/chat.png');
                        }

                        return (
                            <View>
                                <Animated.Image
                                    source={iconSource}
                                    fadeDuration={0}
                                    style={{
                                        width: focused ? 60 : 40,
                                        height: focused ? 60 : 40,
                                        transform: [{ scale: scaleAnim }]
                                    }}
                                />
                            </View>
                        );
                    },
                    tabBarActiveTintColor: 'tomato',
                    tabBarInactiveTintColor: 'white',
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        height: '10%'
                    }
                })}
            >
                <GameBottomNavigator.Screen name="Profile" component={Profile} />
                <GameBottomNavigator.Screen name="CoreBusinessNavigator" component={CoreBusinessNavigator} />
                <GameBottomNavigator.Screen name="ChatNavigator" component={ChatNavigator} />
            </GameBottomNavigator.Navigator>
                : <InGameNavigator />}
        </GameContext.Provider>
    );
}

export default GameNavigator;