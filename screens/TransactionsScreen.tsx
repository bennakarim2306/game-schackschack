import React, { useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRoute, useNavigation, NavigationProp } from "@react-navigation/native";
import configs from "../config/AppConfig";
import Logger from "../config/Logger";
import { authenticatedFetch } from '../utils/AuthenticatedFetch';
import { getCurrentUserEmail } from '../utils/UserHelper';
import type { TransactionData } from '../types/transaction.types';
import ScreenBackground from '../utils/ScreenBackground';

type OfferStackParamList = {
    TransactionsScreen: { itemId: string };
    TransactionDetails: { transaction: TransactionData };
};

const STATUS_FILTERS = ["ALL", "PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"]; 

const TransactionsScreen = () => {
    const route = useRoute();
    Logger.debug('TRANSACTIONS_SCREEN', `Route params: ${JSON.stringify(route.params)}`); // Debug log for screen load

    const navigation = useNavigation<NavigationProp<OfferStackParamList>>();
    const itemId = (route.params as any)?.itemId || '';
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [isSeller, setIsSeller] = useState(false);

    useEffect(() => {
        if (!itemId) {
            Logger.error('TRANSACTIONS_SCREEN', 'No itemId provided');
            setError('Invalid item ID');
            setLoading(false);
            return;
        }

        const loadUserAndTransactions = async () => {
            try {
                const email = await getCurrentUserEmail();
                setCurrentUserEmail(email);
                await fetchTransactions(email);
            } catch (err) {
                Logger.error('TRANSACTIONS_SCREEN', 'Failed to load user email', err);
                await fetchTransactions(null);
            }
        };
        loadUserAndTransactions();
    }, [itemId]);

    const fetchTransactions = async (userEmail: string | null) => {
        setLoading(true);
        setError(null);
        try {
            if (!userEmail) {
                throw new Error('User email not available');
            }

            // First, fetch the item to check if current user is the seller
            const itemUrl = `${configs.USER_AUTH_BASE_URL}/api/v1/items/${itemId}`;
            let sellerEmail = '';
            
            try {
                const itemResponse = await authenticatedFetch(itemUrl, {
                    method: 'GET',
                    headers: { Accept: 'application/json' }
                });
                if (itemResponse.ok) {
                    const itemData = await itemResponse.json();
                    sellerEmail = itemData.seller?.email || itemData.sellerEmail || '';
                }
            } catch (err) {
                Logger.debug('TRANSACTIONS_SCREEN', 'Could not fetch item details');
            }

            const isUserSeller = userEmail === sellerEmail;
            setIsSeller(isUserSeller);

            // Use role-specific endpoint that already filters by itemId
            let url: string;
            if (isUserSeller) {
                url = `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_SELLER_MY_SALES_FOR_ITEM_PATH(itemId)}`;
            } else {
                url = `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_CUSTOMER_MY_ORDERS_FOR_ITEM_PATH(itemId)}`;
            }

            Logger.info('TRANSACTIONS', `Fetching transactions for item: ${itemId}, isSeller: ${isUserSeller}`);
            Logger.request(url, 'GET');

            const response = await authenticatedFetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            Logger.response(url, response.status);

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const data = await response.json();
            const rawTransactions = Array.isArray(data)
                ? data
                : data.items || data.transactions || data.content || [];
            Logger.success('TRANSACTIONS', `Found ${rawTransactions.length} transactions`);

            const normalized = rawTransactions.map((entry: any): TransactionData => ({
                id: String(entry.id ?? entry.transactionId ?? ''),
                itemId: entry.itemId ?? entry.item?.id,
                buyerName: entry.customerName ?? entry.buyerName ?? entry.buyer?.name,
                buyerEmail: entry.customerEmail ?? entry.buyerEmail ?? entry.buyer?.email,
                sellerName: entry.sellerName ?? entry.seller?.name,
                sellerEmail: entry.sellerEmail ?? entry.seller?.email,
                quantityOrdered: entry.quantityOrdered ?? entry.quantity ?? entry.amount,
                unit: entry.unit ?? entry.item?.unit,
                totalPrice: entry.totalPrice ?? entry.total ?? entry.totalAmount,
                status: entry.status ?? 'UNKNOWN',
                notes: entry.notes ?? entry.note,
                createdAt: entry.createdAt ?? entry.createdDate ?? entry.created,
                updatedAt: entry.updatedAt ?? entry.updatedDate ?? entry.updated,
            }));

            setTransactions(normalized);
        } catch (error: any) {
            Logger.error('TRANSACTIONS', `Exception fetching transactions: ${error.message}`, error);
            setError(error.message || 'Failed to load transactions');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        if (statusFilter === "ALL") return transactions;
        return transactions.filter((transaction) => (transaction.status || '').toUpperCase() === statusFilter);
    }, [transactions, statusFilter]);

    const handleTransactionPress = (transaction: TransactionData) => {
        navigation.navigate('TransactionDetails', { transaction });
    };

    if (loading) {
        return (
            <ScreenBackground>
                <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground>
            <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
                {transactions.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#666', marginBottom: 8 }}>No Transactions Yet</Text>
                        <Text style={{ fontSize: 14, color: '#999' }}>This item hasn't had any transactions so far.</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>
                            Transactions ({filteredTransactions.length})
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            {STATUS_FILTERS.map((status) => {
                                const isActive = statusFilter === status;
                                return (
                                    <TouchableOpacity
                                        key={status}
                                        onPress={() => setStatusFilter(status)}
                                        style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            backgroundColor: isActive ? '#2196F3' : '#e0e0e0',
                                            borderRadius: 16,
                                            marginRight: 8,
                                        }}
                                    >
                                        <Text style={{ color: isActive ? '#fff' : '#333', fontWeight: '600', fontSize: 12 }}>
                                            {status}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {filteredTransactions.map((transaction) => (
                            <TouchableOpacity
                                key={transaction.id}
                                onPress={() => handleTransactionPress(transaction)}
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 8,
                                    padding: 12,
                                    marginBottom: 12,
                                    borderLeftWidth: 4,
                                    borderLeftColor: '#2196F3',
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', flex: 1 }}>
                                        {transaction.buyerName || 'Customer'}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: '600',
                                            color: '#fff',
                                            backgroundColor: '#2196F3',
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 4,
                                        }}
                                    >
                                        {transaction.status || 'UNKNOWN'}
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>
                                    Quantity: <Text style={{ fontWeight: '600', color: '#333' }}>{transaction.quantityOrdered ?? '-'} {transaction.unit ?? ''}</Text>
                                </Text>
                                <Text style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>
                                    Total Price: <Text style={{ fontWeight: '600', color: '#2196F3', fontSize: 16 }}>{transaction.totalPrice != null ? `€${transaction.totalPrice}` : '-'}</Text>
                                </Text>
                                <Text style={{ fontSize: 12, color: '#999' }}>
                                    {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </ScreenBackground>
    );
};

export default TransactionsScreen;
