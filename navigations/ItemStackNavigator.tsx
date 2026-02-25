import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ItemNavigator from "./ItemNavigator";
import OfferStackNavigator from "./OfferStackNavigator";

type ItemStackParamList = {
    ItemNavigator: undefined;
    OfferStackNavigator: { itemId: string };
};

const Stack = createNativeStackNavigator<ItemStackParamList>();

const ItemStackNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
            initialRouteName="ItemNavigator"
        >
            <Stack.Screen
                name="ItemNavigator"
                component={ItemNavigator}
            />
            <Stack.Screen
                name="OfferStackNavigator"
                component={OfferStackNavigator}
            />
        </Stack.Navigator>
    );
};

export default ItemStackNavigator;
