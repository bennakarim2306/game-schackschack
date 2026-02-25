import React from "react";
import { View, Text } from "react-native";

interface TransactionProps {
    transaction: {
        id: string;
        itemId: string;
        buyerName: string;
        quantity: number;
        unit: string;
        totalPrice: number;
        status: string;
        createdAt: string;
    };
}

const Transaction: React.FC<TransactionProps> = ({ transaction }) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return '#4caf50';
            case 'pending':
                return '#ff9800';
            case 'cancelled':
                return '#f44336';
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

    return (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: getStatusColor(transaction.status),
            }}
        >
            {/* Header: Buyer Name and Status */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', flex: 1 }}>
                    {transaction.buyerName}
                </Text>
                <Text
                    style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#fff',
                        backgroundColor: getStatusColor(transaction.status),
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                    }}
                >
                    {transaction.status}
                </Text>
            </View>

            {/* Quantity and Unit */}
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>
                Quantity: <Text style={{ fontWeight: '600', color: '#333' }}>{transaction.quantity} {transaction.unit}</Text>
            </Text>

            {/* Price */}
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>
                Total Price: <Text style={{ fontWeight: '600', color: '#2196F3', fontSize: 16 }}>€{transaction.totalPrice}</Text>
            </Text>

            {/* Date */}
            <Text style={{ fontSize: 12, color: '#999' }}>
                {formatDate(transaction.createdAt)}
            </Text>
        </View>
    );
};

export default Transaction;
