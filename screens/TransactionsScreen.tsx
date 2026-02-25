import React, { useState, useEffect } from "react";
import { View, Text, ImageBackground, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import configs from "../config/AppConfig";
import Logger from "../config/Logger";
import { authenticatedFetch } from '../utils/AuthenticatedFetch';
import Transaction from './Transaction';

interface TransactionData {
    id: string;
    itemId: string;
    buyerName: string;
    quantity: number;
    unit: string;
    totalPrice: number;
    status: string;
    createdAt: string;
}

const TransactionsScreen = () => {
    const route = useRoute();
    const { itemId } = route.params as { itemId: string };

    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTransactions();
    }, [itemId]);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `${configs.USER_AUTH_BASE_URL}api/v1/items/${itemId}/transactions`;
            Logger.info('TRANSACTIONS', `Fetching transactions for item: ${itemId}`);
            Logger.request(url, 'GET');

            const response = await authenticatedFetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            Logger.response(url, response.status);

            if (response.status === 204 || response.status === 404) {
                // No transactions found
                Logger.info('TRANSACTIONS', 'No transactions found for this item');
                setTransactions([]);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const data = await response.json();
            Logger.success('TRANSACTIONS', `Found ${Array.isArray(data) ? data.length : data.transactions?.length || 0} transactions`);
            setTransactions(Array.isArray(data) ? data : data.transactions || []);
        } catch (error: any) {
            Logger.error('TRANSACTIONS', `Exception fetching transactions: ${error.message}`, error);
            setError(error.message || 'Failed to load transactions');
            // Don't alert on error for empty state, just log
            Logger.info('TRANSACTIONS', 'Treating as no transactions found');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ImageBackground
                source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground
            source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
                {transactions.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#666', marginBottom: 8 }}>No Transactions Yet</Text>
                        <Text style={{ fontSize: 14, color: '#999' }}>This item hasn't had any transactions so far.</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>
                            Transactions ({transactions.length})
                        </Text>
                        {transactions.map((transaction) => (
                            <Transaction key={transaction.id} transaction={transaction} />
                        ))}
                    </ScrollView>
                )}
            </View>
        </ImageBackground>
    );
};

export default TransactionsScreen;
