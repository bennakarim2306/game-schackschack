import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QueryFoodScreen from "../screens/QueryFoodScreen";
import AddItemScreen from "../screens/AddItemScreen";
import Results from "../screens/Results";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const QueryFoodStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="QueryFood" component={QueryFoodScreen} />
        <Stack.Screen name="Results" component={Results} />
    </Stack.Navigator>
);

const CoreBusinessNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="QueryFood"
            screenOptions={({ route }) => ({
                headerShown: false, // Hide the header/title bar
                tabBarIcon: ({ color, size }) => {
                    if (route.name === "QueryFood") {
                        return <Ionicons name="search" size={size} color={color} />;
                    }
                    if (route.name === "AddItem") {
                        return <Ionicons name="add-circle" size={size} color={color} />;
                    }
                    return null;
                },
                tabBarLabelStyle: {
                    display: "none" // Hide tabBarLabels
                },
                tabBarStyle: {
                    height: 64, // Make tab bar taller
                    paddingBottom: 8 // Add space at the bottom
                }
            })}
        >
            <Tab.Screen
                name="QueryFood"
                component={QueryFoodStack}
                options={{ tabBarLabel: "" }} // Remove label
            />
            <Tab.Screen
                name="AddItem"
                component={AddItemScreen}
                options={{ tabBarLabel: "" }} // Remove label
            />
        </Tab.Navigator>
    );
};

export default CoreBusinessNavigator;