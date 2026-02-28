import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import MyOrdersScreen from "./MyOrdersScreen";
import MySellsScreen from "./MySellsScreen";
import ScreenBackground from '../utils/ScreenBackground';

const TopTab = createMaterialTopTabNavigator();

const MySpaceScreen = () => (
    <ScreenBackground>
        <TopTab.Navigator
            initialRouteName="MyOrdersScreen"
            screenOptions={{
                tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
                tabBarStyle: { backgroundColor: "#fff", height: 48 },
                tabBarIndicatorStyle: { backgroundColor: "#2196F3", height: 3 },
            }}
        >
            <TopTab.Screen
                name="MyOrdersScreen"
                component={MyOrdersScreen}
                options={{ tabBarLabel: "My Orders" }}
            />
            <TopTab.Screen
                name="MySellsScreen"
                component={MySellsScreen}
                options={{ tabBarLabel: "My Sells" }}
            />
        </TopTab.Navigator>
    </ScreenBackground>
);

export default MySpaceScreen;