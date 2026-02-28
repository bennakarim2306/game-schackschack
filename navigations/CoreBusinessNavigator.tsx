import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image } from "react-native";
import QueryFoodScreen from "../screens/QueryFoodScreen";
import Results from "../screens/Results";
import Profile from "../screens/Profile";
import ItemStackNavigator from "./ItemStackNavigator";
import ChatNavigator from "./ChatNavigator";
import OfferStackNavigator from "./OfferStackNavigator";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logger from "../config/Logger";
const TabRoutes = {
    FindFood: "FindFood",
    CreateOffer: "CreateOffer",
    Profile: "Profile",
    Chat: "Chat",
} as const;

const TabLabels = {
    FindFood: "Find Food",
    CreateOffer: "Create an offer",
    Profile: "Profile",
    Chat: "Chat",
} as const;

type CoreTabParamList = {
    [TabRoutes.FindFood]: undefined;
    [TabRoutes.CreateOffer]: undefined;
    [TabRoutes.Profile]: undefined;
    [TabRoutes.Chat]: { screen?: string; params?: any } | undefined;
};

const Tab = createBottomTabNavigator<CoreTabParamList>();

const TopTab = createMaterialTopTabNavigator();

const Stack = createNativeStackNavigator();

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

// Find Food Stack with proper navigation structure
const FindFoodStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
        }}
    >
        <Stack.Screen 
            name="QueryFoodTab" 
            component={QueryFoodStack}
        />
        <Stack.Screen 
            name="OfferStackNavigator"
            component={OfferStackNavigator}
            options={{
                headerShown: false,
            }}
        />
    </Stack.Navigator>
);

const CoreBusinessNavigator = () => {
    const insets = useSafeAreaInsets();
    
    Logger.info('NAVIGATOR', `SafeAreaInsets - top: ${insets.top}, bottom: ${insets.bottom}, left: ${insets.left}, right: ${insets.right}`);
    
    return (
        <Tab.Navigator
            initialRouteName={TabRoutes.FindFood}
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
                    if (route.name === TabRoutes.FindFood) {
                        return (
                            <Image
                                source={require('../assets/WhatsApp_Image_2026-02-05_at_16.14.47__5_-removebg-preview.png')}
                                style={iconStyle}
                            />
                        );
                    }
                    if (route.name === TabRoutes.CreateOffer) {
                        return (
                            <Image
                                source={require('../assets/WhatsApp_Image_2026-02-05_at_16.14.47__3_-removebg-preview.png')}
                                style={iconStyle}
                            />
                        );
                    }
                    if (route.name === TabRoutes.Profile) {
                        return (
                            <Image
                                source={require('../assets/WhatsApp_Image_2026-02-05_at_16.14.47__2_-removebg-preview.png')}
                                style={iconStyle}
                            />
                        );
                    }
                    if (route.name === TabRoutes.Chat) {
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
                name={TabRoutes.FindFood}
                component={FindFoodStack}
                options={{ tabBarLabel: TabLabels.FindFood }}
            />
            <Tab.Screen
                name={TabRoutes.CreateOffer}
                component={ItemStackNavigator}
                options={{ headerShown: false, tabBarLabel: TabLabels.CreateOffer }}
            />
            <Tab.Screen
                name={TabRoutes.Profile}
                component={Profile}
                options={{ headerShown: false, tabBarLabel: TabLabels.Profile }}
            />
                <Tab.Screen
                name={TabRoutes.Chat}
                    component={ChatNavigator}
                options={{ headerShown: false, tabBarLabel: TabLabels.Chat }}
                    listeners={({ navigation }) => ({
                        tabPress: () => {
                            navigation.navigate(TabRoutes.Chat, { screen: "ContactsList" });
                        }
                    })}
            />
        </Tab.Navigator>
    );
};

export default CoreBusinessNavigator;