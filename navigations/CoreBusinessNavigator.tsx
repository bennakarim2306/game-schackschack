import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QueryFoodScreen from "../screens/QueryFoodScreen";
import Results from "../screens/Results";
import { Ionicons } from "@expo/vector-icons";
import ItemNavigator from "./ItemNavigator";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const QueryFoodStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="QueryFoodScreen" component={QueryFoodScreen} />
        <Stack.Screen name="Results" component={Results} />
    </Stack.Navigator>
);

const CoreBusinessNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="Find Food"
            screenOptions={({ route }) => ({
                headerShown: true,
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
                    height: 64,
                    paddingBottom: 8
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