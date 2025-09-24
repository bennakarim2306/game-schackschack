import { createDrawerNavigator, DrawerToggleButton } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Profile from "../screens/Profile";
import GameStart from "../screens/GameStart";
import FriendsList from "../screens/ContactsList";
import React, { useEffect, useMemo, useReducer } from "react";
import { Alert, BackHandler } from "react-native";
import GameContext from "../Contexts/GameContext";
import InGameNavigator from "./InGameNavigator";
import ChatNavigator from "./ChatNavigator";
import CoreBusinessNavigator from "./CoreBusinessNavigator";

// Dummy screens for demonstration
import MySpaceScreen from "../screens/MySpaceScreen";

const GameDrawerNavigator = createDrawerNavigator();
const MySpaceStack = createNativeStackNavigator();


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
    });

    const gameContext = useMemo(() => ({
        startGame: async (data) => {
            dispatch({ type: 'GAME_STARTED', gameId: 'dummy-game-id', gameStarted: true })
        },
        stopGame: async (data) => {
            dispatch({ type: 'GAME_STOPPED', gameId: null, gameStarted: false })
        },
    }), []);

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
            {state.gameStarted === false ? (
                <GameDrawerNavigator.Navigator
                    initialRouteName="CoreBusinessNavigator"
                    screenOptions={{
                        headerShown: true,
                        headerLeft: () => <DrawerToggleButton />,
                    }}
                >
                    <GameDrawerNavigator.Screen
                        name="Profile"
                        component={Profile}
                    />
                    <GameDrawerNavigator.Screen
                        name="MySpace"
                        component={MySpaceScreen}
                        options={{ title: "My space" }}
                    />
                    <GameDrawerNavigator.Screen
                        name="CoreBusinessNavigator"
                        component={CoreBusinessNavigator}
                        options={{ title: "Market place" }}
                    />
                    <GameDrawerNavigator.Screen
                        name="ChatNavigator"
                        component={ChatNavigator}
                        options={{ title: "Chat" }}
                    />
                </GameDrawerNavigator.Navigator>
            ) : (
                <InGameNavigator />
            )}
        </GameContext.Provider>
    );
}

export default GameNavigator;