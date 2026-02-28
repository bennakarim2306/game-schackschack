import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import AddItemScreen from "../screens/AddItemScreen";
import MyOffersScreen from "../screens/MyOffersScreen";

const TopTab = createMaterialTopTabNavigator();

const ItemNavigator = () => (
    <TopTab.Navigator
            initialRouteName="AddItemScreen"
            screenOptions={{
                tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
                tabBarStyle: { backgroundColor: "white", height: 48 },
                tabBarIndicatorStyle: { backgroundColor: "#2196F3", height: 3 },
            }}
        >
            <TopTab.Screen
                name="AddItemScreen"
                component={AddItemScreen}
                options={{ tabBarLabel: "Create an offer", tabBarLabelStyle: { fontSize: 20, fontFamily: "Arial", fontWeight: "bold" } }}
            />
            <TopTab.Screen
                name="MyOffersScreen"
                component={MyOffersScreen}
                options={{ tabBarLabel: "My Offers", tabBarLabelStyle: { fontSize: 20, fontFamily: "Arial", fontWeight: "bold"}}}
            />
        </TopTab.Navigator>
);

export default ItemNavigator;