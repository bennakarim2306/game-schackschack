import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Offer from "../screens/Offer";
import TransactionsScreen from "../screens/TransactionsScreen";

type OfferStackParamList = {
    Offer: { itemId: string; offer: any };
    TransactionsScreen: { itemId: string };
};

const Stack = createNativeStackNavigator<OfferStackParamList>();

const OfferStackNavigator = ({ route }: any) => {
    const { itemId, offer } = route.params;

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#D9F2D9'
                },
                headerTintColor: '#333',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerShown: true,
            }}
        >
            <Stack.Screen
                name="Offer"
                component={Offer}
                initialParams={{ itemId, offer }}
                options={{ title: 'Item Details' }}
            />
            <Stack.Screen
                name="TransactionsScreen"
                component={TransactionsScreen}
                options={{ title: 'Transactions' }}
            />
        </Stack.Navigator>
    );
};

export default OfferStackNavigator;
