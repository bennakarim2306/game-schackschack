import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QueryFoodScreen from "../screens/QueryFoodScreen";
import Results from "../screens/Results";
import { Ionicons } from "@expo/vector-icons";
import ItemNavigator from "./ItemNavigator";
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
                    if (route.name === "Find Food") {
                        return <Ionicons name="search" size={size} color={color} />;
                    }
                    if (route.name === "Create an offer") {
                        return <Ionicons name="add-circle" size={size} color={color} />;
                    }
                    return null;
                },
                tabBarLabelStyle: {
                    display: "none"
                },
                tabBarStyle: {
                    height: insets.bottom,
                    paddingBottom: insets.bottom
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
                options={{ headerShown: false, tabBarLabel: "" }} // Hide parent header
            />
        </Tab.Navigator>
    );
};

export default CoreBusinessNavigator;