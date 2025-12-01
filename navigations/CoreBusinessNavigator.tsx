import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QueryFoodScreen from "../screens/QueryFoodScreen";
import Results from "../screens/Results";
import Profile from "../screens/Profile";
import { Ionicons } from "@expo/vector-icons";
import ItemNavigator from "./ItemNavigator";
import ChatNavigator from "./ChatNavigator";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logger from "../config/Logger";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TopTab = createMaterialTopTabNavigator();

const QueryFoodStack = () => (
    <TopTab.Navigator initialRouteName="QueryFoodScreen">
        <TopTab.Screen name="QueryFoodScreen" component={QueryFoodScreen} options={{ tabBarLabel: "Find Food" }} />
        <TopTab.Screen name="Results" component={Results} options={{ tabBarLabel: "Results" }} />
    </TopTab.Navigator>
);

const CoreBusinessNavigator = () => {
    const insets = useSafeAreaInsets();
    
    Logger.info('NAVIGATOR', `SafeAreaInsets - top: ${insets.top}, bottom: ${insets.bottom}, left: ${insets.left}, right: ${insets.right}`);
    
    return (
        <Tab.Navigator
            initialRouteName="Find Food"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    const iconSize = 32;
                    if (route.name === "Find Food") {
                        return <Ionicons name="search" size={iconSize} color={color} />;
                    }
                    if (route.name === "Create an offer") {
                        return <Ionicons name="add-circle" size={iconSize} color={color} />;
                    }
                    if (route.name === "Profile") {
                        return <Ionicons name="person" size={iconSize} color={color} />;
                    }
                    if (route.name === "Chat") {
                        return <Ionicons name="chatbubbles" size={iconSize} color={color} />;
                    }
                    return null;
                },
                tabBarLabelStyle: {
                    display: "none"
                },
                tabBarStyle: {
                    height: insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 10
                }
            })}
        >
            <Tab.Screen
                name="Find Food"
                component={QueryFoodStack}
                options={{ tabBarLabel: "" }}
            />
            <Tab.Screen
                name="Create an offer"
                component={ItemNavigator}
                options={{ headerShown: false, tabBarLabel: "" }}
            />
            <Tab.Screen
                name="Profile"
                component={Profile}
                options={{ headerShown: false, tabBarLabel: "" }}
            />
            <Tab.Screen
                name="Chat"
                component={ChatNavigator}
                options={{ headerShown: false, tabBarLabel: "" }}
            />
        </Tab.Navigator>
    );
};

export default CoreBusinessNavigator;