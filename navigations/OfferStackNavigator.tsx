import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Offer from "../screens/Offer";
import TransactionsScreen from "../screens/TransactionsScreen";
import Transaction from "../screens/Transaction";
import type { TransactionData } from "../types/transaction.types";

type OfferStackParamList = {
    Offer: { itemId: string; offer: any };
    TransactionsScreen: { itemId: string };
    TransactionDetails: { transaction: TransactionData };
};

const Stack = createNativeStackNavigator<OfferStackParamList>();

const OfferStackNavigator = ({ route }: any) => {
    const { itemId, offer } = route.params || {};

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
            <Stack.Screen
                name="TransactionDetails"
                component={Transaction}
                options={{ title: 'Transaction Details' }}
            />
        </Stack.Navigator>
    );
};

export default OfferStackNavigator;
