import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image } from "react-native";
import QueryFoodScreen from "../screens/QueryFoodScreen";
import Results from "../screens/Results";
import Profile from "../screens/Profile";
import ItemStackNavigator from "./ItemStackNavigator";
import ChatNavigator from "./ChatNavigator";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logger from "../config/Logger";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TopTab = createMaterialTopTabNavigator();

const QueryFoodStack = () => (
    <TopTab.Navigator
        initialRouteName="QueryFoodScreen"
        screenOptions={{
            tabBarStyle: { backgroundColor: "#D9F2D9" }
        }}
    >
        <TopTab.Screen name="QueryFoodScreen" component={QueryFoodScreen} options={{ tabBarLabel: "Search", tabBarLabelStyle: { fontSize: 20, fontFamily: "Arial", fontWeight: "bold" } }} />
        <TopTab.Screen name="Results" component={Results} options={{ tabBarLabel: "Results", tabBarLabelStyle: { fontSize: 20, fontFamily: "Arial", fontWeight: "bold" }}} />
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
                tabBarIcon: ({ color, size, focused }) => {
                    const iconSize = 70; // Larger size
                    const iconStyle = {
                        width: iconSize,
                        height: iconSize,
                        borderRadius: iconSize / 2,
                        opacity: focused ? 1 : 0.5
                    };
                    if (route.name === "Find Food") {
                        return (
                            <Image
                                source={require('../assets/WhatsApp_Image_2026-02-05_at_16.14.47__5_-removebg-preview.png')}
                                style={iconStyle}
                            />
                        );
                    }
                    if (route.name === "Create an offer") {
                        return (
                            <Image
                                source={require('../assets/WhatsApp_Image_2026-02-05_at_16.14.47__3_-removebg-preview.png')}
                                style={iconStyle}
                            />
                        );
                    }
                    if (route.name === "Profile") {
                        return (
                            <Image
                                source={require('../assets/WhatsApp_Image_2026-02-05_at_16.14.47__2_-removebg-preview.png')}
                                style={iconStyle}
                            />
                        );
                    }
                    if (route.name === "Chat") {
                        return (
                            <Image
                                source={require('../assets/ChatGPT Image 5. Feb. 2026, 16_43_15.png')}
                                style={iconStyle}
                            />
                        );
                    }
                    return null;
                },
                tabBarLabelStyle: {
                    display: "none"
                },
                tabBarStyle: {
                    backgroundColor: '#D9F2D9',
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
                component={ItemStackNavigator}
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