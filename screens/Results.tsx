import React, { useState, useRef } from "react";
import { View, Text, Button, FlatList, TouchableOpacity, Image, Modal, TextInput, ImageBackground, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import configs from "../config/AppConfig";
import { authenticatedFetch } from "../utils/AuthenticatedFetch";
import type { TransactionData } from "../types/transaction.types";
import Logger from "../config/Logger";
import ScreenBackground from "../utils/ScreenBackground";

// Helper to calculate distance between two lat/lng points (Haversine formula)
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

type FoodOffer = {
    id: string;
    name: string;
    type: string;
    price: number;
    quantity: number;
    unit: string;
    address: {
        street: string;
        city: string;
        zip: string;
        lat: number;
        lng: number;
    };
    seller: {
        id: string;
        name: string;
        contact: string;
    };
    availableFrom: string;
    availableTo: string;
    description: string;
    imageUrl: string;
};

type ResultsParams = {
    searchTerm?: string;
    selectedType?: string;
    distance?: number;
    items?: FoodOffer[];
    searchCenter?: { lat: number; lng: number };
};

const Results = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { searchTerm, selectedType, distance, items = [], searchCenter } = (route.params as ResultsParams) || {};

    const [selectedItem, setSelectedItem] = useState<FoodOffer | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [orderQuantity, setOrderQuantity] = useState("");
    const [orderError, setOrderError] = useState("");
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const addedContactsRef = useRef<Set<string>>(new Set());

    const handleItemPress = (item: FoodOffer) => {
        Logger.debug('RESULTS', `Item selected, navigating to OfferStackNavigator: ${item.id}`);
        navigation.navigate('OfferStackNavigator' as any, {
            itemId: item.id,
            offer: item
        });
    };

    const handleCancelOrder = () => {
        setModalVisible(false);
        setSelectedItem(null);
        setOrderQuantity("");
        setOrderError("");
    };

    const addSellerAsContact = async (email: string) => {
        if (!email) return;

        // Check if we've already added this contact in this session
        if (addedContactsRef.current.has(email)) {
            Logger.info('CONTACTS', `Contact ${email} already added in this session, skipping`);
            return;
        }

        try {
            const url = `${configs.USER_AUTH_BASE_URL}${configs.USER_AUTH_ADD_CONTACT_PATH}?email=${encodeURIComponent(email)}`;
            Logger.info('CONTACTS', `Auto-adding contact: ${email}`);
            Logger.request(url, 'POST');

            const response = await authenticatedFetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            Logger.response(url, response.status);
            
            // Mark this contact as added
            if (response.ok) {
                addedContactsRef.current.add(email);
            }
        } catch (error) {
            Logger.error('CONTACTS', 'Failed to auto-add contact', error);
        }
    };

    const createTransaction = async (item: FoodOffer, quantityOrdered: number): Promise<TransactionData | null> => {
        try {
            const url = `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_BASE_PATH}`;
            Logger.info('TRANSACTION', `Creating transaction for item ${item.id}`);
            Logger.request(url, 'POST', { itemId: item.id, quantityOrdered });

            const response = await authenticatedFetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    itemId: item.id,
                    quantityOrdered
                })
            });

            Logger.response(url, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                Logger.error('TRANSACTION', 'Create transaction failed', errorText);
                return null;
            }

            const data = await response.json();
            const transaction = data.transaction ?? data;

            return {
                id: String(transaction.id ?? transaction.transactionId ?? ''),
                itemId: transaction.itemId ?? item.id,
                buyerName: transaction.buyerName ?? transaction.customerName,
                buyerEmail: transaction.buyerEmail ?? transaction.customerEmail,
                quantityOrdered: transaction.quantityOrdered ?? transaction.quantity,
                unit: transaction.unit ?? item.unit,
                totalPrice: transaction.totalPrice ?? transaction.totalAmount,
                status: transaction.status ?? 'PENDING',
                notes: transaction.notes ?? transaction.note,
                createdAt: transaction.createdAt ?? transaction.createdDate,
                updatedAt: transaction.updatedAt ?? transaction.updatedDate
            } as TransactionData;
        } catch (error) {
            Logger.error('TRANSACTION', 'Create transaction exception', error);
            return null;
        }
    };

    const handleConfirmOrder = async () => {
        const qty = parseFloat(orderQuantity);
        if (isNaN(qty) || qty <= 0 || qty > (selectedItem?.quantity ?? 0)) {
            setOrderError(`Enter a valid quantity (max ${selectedItem?.quantity})`);
            return;
        }

        if (!selectedItem) {
            return;
        }

        setIsSubmittingOrder(true);
        const transaction = await createTransaction(selectedItem, qty);
        setIsSubmittingOrder(false);

        if (!transaction) {
            Alert.alert('Order failed', 'Could not create your transaction. Please try again.');
            return;
        }

        const sellerEmail = selectedItem.seller?.contact;
        if (sellerEmail) {
            await addSellerAsContact(sellerEmail);
        }

        setModalVisible(false);
        setSelectedItem(null);
        setOrderQuantity("");
        setOrderError("");

        if (sellerEmail) {
            navigation.navigate('Chat', {
                screen: 'Chat',
                params: {
                    contact: sellerEmail,
                    transaction,
                    transactionRole: 'buyer'
                }
            });
        } else {
            Alert.alert('Order created', 'Your transaction was created successfully.');
        }
    };

    return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <View style={{ flex: 1, padding: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
                    Results
                </Text>
            <FlatList
                data={items}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                    let itemDistance = null;
                    if (searchCenter && item.address?.lat && item.address?.lng) {
                        itemDistance = getDistanceKm(
                            searchCenter.lat,
                            searchCenter.lng,
                            item.address.lat,
                            item.address.lng
                        );
                    }
                    return (
                        <TouchableOpacity
                            onPress={() => handleItemPress(item)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                padding: 12,
                                marginVertical: 6,
                                backgroundColor: "#f2f2f2",
                                borderRadius: 8
                            }}
                        >
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.name}</Text>
                                <Text>
                                    {item.type} • {item.price}€/{item.unit}
                                </Text>
                                <Text numberOfLines={1} style={{ color: "#555" }}>
                                    {item.description}
                                </Text>
                                <Text style={{ fontSize: 12, color: "#888" }}>
                                    {item.address.city}, {item.address.street}
                                </Text>
                                {itemDistance !== null && (
                                    <Text style={{ fontSize: 12, color: "#009966" }}>
                                        Distance: {itemDistance.toFixed(2)} km
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <Text style={{ marginTop: 24, color: "#888" }}>No items found.</Text>
                }
            />
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, padding: 12, backgroundColor: "#2196F3", borderRadius: 8 }}>
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 }}>Back to Search</Text>
            </TouchableOpacity>
        </View>
        </View>
);
};

export default Results;