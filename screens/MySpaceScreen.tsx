import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MyOrdersScreen from "./MyOrdersScreen";
import MyOffersScreen from "./MyOffersScreen";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const MySpaceScreen = () => (
    <Tab.Navigator
        initialRouteName="My orders"
        screenOptions={({ route }) => ({
            headerShown: true,
            tabBarIcon: ({ color, size }) => {
                if (route.name === "My orders") {
                    return <Ionicons name="list" size={size} color={color} />;
                }
                if (route.name === "My offers") {
                    return <Ionicons name="pricetag" size={size} color={color} />;
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
            name="My orders"
            component={MyOrdersScreen}
            options={{ tabBarLabel: "" }}
        />
        <Tab.Screen
            name="My offers"
            component={MyOffersScreen}
            options={{ tabBarLabel: "" }}
        />
    </Tab.Navigator>
);

export default MySpaceScreen;