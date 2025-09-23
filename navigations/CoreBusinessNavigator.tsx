import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import QueryFoodScreen from "../screens/QueryFoodScreen";
import AddItemScreen from "../screens/AddItemScreen";
import Results from "../screens/Results";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Make sure expo/vector-icons is installed

const Tab = createBottomTabNavigator();

const CoreBusinessNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="QueryFood"
            screenOptions={({ route }) => ({
                headerShown: true,
                tabBarIcon: ({ color, size }) => {
                    if (route.name === "QueryFood") {
                        return <Ionicons name="search" size={size} color={color} />;
                    }
                    if (route.name === "AddItem") {
                        return <Ionicons name="add-circle" size={size} color={color} />;
                    }
                    return null;
                },
            })}
        >
            <Tab.Screen
                name="QueryFood"
                component={QueryFoodScreen}
                options={{ tabBarLabel: "Query for food in the area" }}
            />
            <Tab.Screen
                name="AddItem"
                component={AddItemScreen}
                options={{ tabBarLabel: "Add an item to sell" }}
            />
            <Tab.Screen
                name="Results"
                component={Results}
                options={{ tabBarLabel: "View search results" }}
            />
        </Tab.Navigator>
    );
};

export default CoreBusinessNavigator;