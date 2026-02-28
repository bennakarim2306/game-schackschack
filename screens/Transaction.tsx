import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import type { TransactionData } from "../types/transaction.types";
import ScreenBackground from '../utils/ScreenBackground';

const Transaction = () => {
    const route = useRoute();
    const { transaction } = route.params as { transaction: TransactionData };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return '#4caf50';
            case 'pending':
                return '#ff9800';
            case 'cancelled':
                return '#f44336';
            case 'confirmed':
                return '#2196f3';
            case 'rejected':
                return '#9c27b0';
            default:
                return '#2196f3';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    const statusLabel = transaction.status || 'UNKNOWN';
    const statusColor = getStatusColor(statusLabel);

    return (
        <ScreenBackground>
            <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#333' }}>Transaction</Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: '700',
                                    color: '#fff',
                                    backgroundColor: statusColor,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                }}
                            >
                                {statusLabel}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Transaction ID</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 }}>
                            {transaction.id}
                        </Text>

                        {transaction.itemId ? (
                            <>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Item ID</Text>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 }}>
                                    {transaction.itemId}
                                </Text>
                            </>
                        ) : null}

                        {transaction.buyerName ? (
                            <>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Buyer</Text>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 }}>
                                    {transaction.buyerName}{transaction.buyerEmail ? ` (${transaction.buyerEmail})` : ''}
                                </Text>
                            </>
                        ) : null}

                        {transaction.sellerName ? (
                            <>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Seller</Text>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 }}>
                                    {transaction.sellerName}{transaction.sellerEmail ? ` (${transaction.sellerEmail})` : ''}
                                </Text>
                            </>
                        ) : null}

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Quantity</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                                    {transaction.quantityOrdered ?? '-'} {transaction.unit ?? ''}
                                </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Total Price</Text>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#2196F3' }}>
                                    {transaction.totalPrice != null ? `€${transaction.totalPrice}` : '-'}
                                </Text>
                            </View>
                        </View>

                        {transaction.notes ? (
                            <>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Notes</Text>
                                <Text style={{ fontSize: 14, color: '#333', marginBottom: 12 }}>
                                    {transaction.notes}
                                </Text>
                            </>
                        ) : null}

                        <Text style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Created</Text>
                        <Text style={{ fontSize: 14, color: '#333', marginBottom: 12 }}>
                            {transaction.createdAt ? formatDate(transaction.createdAt) : '-'}
                        </Text>

                        {transaction.updatedAt ? (
                            <>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Last Updated</Text>
                                <Text style={{ fontSize: 14, color: '#333' }}>
                                    {formatDate(transaction.updatedAt)}
                                </Text>
                            </>
                        ) : null}
                    </View>
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

export default Transaction;
