import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, ScrollView, ImageBackground, Image, ActivityIndicator, Alert, TouchableOpacity, StyleSheet, Modal, TextInput, Button } from "react-native";
import { useRoute, useNavigation, NavigationProp } from "@react-navigation/native";
import { MapView, Marker } from '../utils/MapImports';
import { Ionicons } from "@expo/vector-icons";
import configs from "../config/AppConfig";
import Logger from "../config/Logger";
import { authenticatedFetch } from '../utils/AuthenticatedFetch';
import { getCurrentUserEmail } from '../utils/UserHelper';
import type { TransactionData } from "../types/transaction.types";

interface ItemOffer {
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
    }
    description: string;
    availableFrom: string;
    availableTo: string;
    seller: {
        name: string;
        contact: string
    }
    imageUrl?: string;
}

type OfferStackParamList = {
    Offer: { itemId: string; offer: ItemOffer };
    TransactionsScreen: { itemId: string };
};

const Offer = () => {
    const route = useRoute();
    const navigation = useNavigation<NavigationProp<OfferStackParamList>>();
    const { itemId, offer: rawOffer } = route.params as { itemId: string; offer: any };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [isSeller, setIsSeller] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [orderQuantity, setOrderQuantity] = useState("");
    const [orderError, setOrderError] = useState("");
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [offer, setOffer] = useState<ItemOffer | null>(null);

    // Normalize the offer data from FoodOffer to ItemOffer
    useEffect(() => {
        if (rawOffer) {
            const normalizedOffer: ItemOffer = {
                ...rawOffer,
                sellerName: rawOffer.sellerName || rawOffer.seller?.name || 'Unknown',
                sellerEmail: rawOffer.sellerEmail || '', // Will be fetched if needed
            };
            setOffer(normalizedOffer);
        }
    }, [rawOffer]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => {
                        Logger.info('OFFER_DETAIL', `Navigating to TransactionsScreen for itemId: ${itemId}`);
                        navigation.navigate("TransactionsScreen", { itemId })
                    }}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#2196F3",
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 20,
                        marginRight: 16,
                    }}
                >
                    <Ionicons name="swap-horizontal" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>Transactions</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, itemId]);

    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const email = await getCurrentUserEmail();
                setCurrentUserEmail(email);
                if (offer) {
                    setIsSeller(email === offer.seller.contact);
                    Logger.info('OFFER_DETAIL', `Current user: ${email}, Item seller: ${offer.seller.contact}, Is seller: ${email === offer.seller.contact}`);
                }
            } catch (err) {
                Logger.error('OFFER_DETAIL', 'Failed to load current user', err);
            }
        };

        if (offer) {
            loadCurrentUser();
            Logger.info('OFFER_DETAIL', `Displaying offer: ${offer.name} (ID: ${itemId})`);
        }
    }, [itemId, offer]);

    const createTransaction = async (quantityOrdered: number) => {
        if (!offer) {
            throw new Error('Offer data not available');
        }
        try {
            const url = `${configs.USER_AUTH_BASE_URL}${configs.TRANSACTIONS_BASE_PATH}`;
            const payload = {
                itemId: offer.id,
                quantityOrdered: quantityOrdered
            };

            Logger.info('TRANSACTION', `Creating transaction: ${JSON.stringify(payload)}`);
            Logger.request(url, 'POST', payload);

            const response = await authenticatedFetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const jsonResponse = await response.json();
            Logger.response(url, response.status, jsonResponse);

            if (response.status !== 201) {
                Logger.error('TRANSACTION', 'Failed to create transaction', jsonResponse);
                throw new Error(jsonResponse.error || 'Failed to create transaction');
            }

            Logger.success('TRANSACTION', 'Transaction created successfully');
            return jsonResponse;
        } catch (error) {
            Logger.error('TRANSACTION', 'Transaction creation error', error);
            throw error;
        }
    };

    const addSellerAsContact = async (email: string) => {
        if (!email) return;

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
        } catch (error) {
            Logger.error('CONTACTS', 'Failed to auto-add contact', error);
        }
    };

    const handleConfirmOrder = async () => {
        if (!offer) {
            setOrderError("Offer data not available");
            return;
        }

        if (!orderQuantity || isNaN(parseFloat(orderQuantity))) {
            setOrderError("Please enter a valid quantity");
            return;
        }

        const quantity = parseFloat(orderQuantity);
        if (quantity <= 0 || quantity > offer.quantity) {
            setOrderError(`Quantity must be between 1 and ${offer.quantity}`);
            return;
        }

        setIsSubmittingOrder(true);
        setOrderError("");

        try {
            const transaction = await createTransaction(quantity);
            await addSellerAsContact(offer.seller.contact);

            setModalVisible(false);
            setOrderQuantity("");
            setOrderError("");

            // Navigate to Chat tab with the transaction
            navigation.getParent()?.navigate('Chat', {
                screen: 'ContactsList',
                params: {
                    autoOpenContact: offer.seller.contact,
                    transaction: transaction
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
            setOrderError(errorMessage);
            Logger.error('OFFER', 'Order confirmation error', error);
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const handleCancelOrder = () => {
        setModalVisible(false);
        setOrderQuantity("");
        setOrderError("");
    };

    const handleBuyPress = () => {
        setOrderQuantity("");
        setOrderError("");
        setModalVisible(true);
    };

    if (loading || !offer) {
        return (
            <ImageBackground
                source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)', justifyContent: 'center', alignItems: 'center' }}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#2196F3" />
                    ) : (
                        <Text style={{ fontSize: 18, color: '#666' }}>Offer not found</Text>
                    )}
                </View>
            </ImageBackground>
        );
    }

    const formattedAddress = `${offer.address.street}, ${offer.address.city} ${offer.address.zip}`;

    return (
        <ImageBackground
            source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                    {/* Item Image */}
                    {offer.imageUrl && (
                        <Image
                            source={{ uri: offer.imageUrl }}
                            style={{ width: '100%', height: 250, borderRadius: 12, marginBottom: 16 }}
                            resizeMode="cover"
                        />
                    )}

                    {/* Item Name and Type */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                            {offer.name}
                        </Text>
                        <Text style={{ fontSize: 16, color: '#666', backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', borderRadius: 6 }}>
                            {offer.type}
                        </Text>
                    </View>

                    {/* Price and Quantity */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                        <View>
                            <Text style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Price</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2196F3' }}>€{offer.price}</Text>
                        </View>
                        <View style={{ borderLeftWidth: 1, borderLeftColor: '#ddd', paddingLeft: 16 }}>
                            <Text style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Quantity</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>
                                {offer.quantity} {offer.unit}
                            </Text>
                        </View>
                    </View>

                    {/* Availability Dates */}
                    <View style={{ marginBottom: 16, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>Availability</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>From</Text>
                                <Text style={{ fontSize: 14, color: '#333' }}>{offer.availableFrom}</Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>To</Text>
                                <Text style={{ fontSize: 14, color: '#d32f2f', fontWeight: '600' }}>{offer.availableTo}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Seller Information */}
                    <View style={{ marginBottom: 16, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Seller</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>{offer.seller.contact}</Text>
                        {!isSeller && (
                            <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Email: {offer.seller.contact}</Text>
                        )}
                    </View>

                    {/* Seller Details Card - Show for non-sellers */}
                    {!isSeller && currentUserEmail && (
                        <View style={{ marginBottom: 16, backgroundColor: '#e8f5e9', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#4caf50' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>View seller details</Text>
                                <Ionicons name="chevron-forward" size={20} color="#4caf50" />
                            </View>
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                See all products from {offer.seller.contact} and your transaction history with them
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={handleBuyPress}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#4caf50',
                                        paddingVertical: 10,
                                        borderRadius: 6,
                                        alignItems: 'center'
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Buy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => navigation.getParent()?.navigate('Chat', {
                                        screen: 'ContactsList',
                                        params: { autoOpenContact: offer.seller.contact }
                                    })}
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#2196F3',
                                        paddingVertical: 10,
                                        borderRadius: 6,
                                        alignItems: 'center'
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Chat</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Address */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>Location</Text>
                        <Text style={{ fontSize: 14, color: '#666', marginBottom: 12, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                            {formattedAddress}
                        </Text>
                    </View>

                    {/* Map */}
                    <View style={{ width: '100%', height: 250, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                        <MapView
                            style={{ flex: 1 }}
                            region={{
                                latitude: offer.address.lat,
                                longitude: offer.address.lng,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }}
                        >
                            <Marker
                                coordinate={{ latitude: offer.address.lat, longitude: offer.address.lng }}
                                title={offer.name}
                                description={formattedAddress}
                            />
                        </MapView>
                    </View>

                    {/* Description */}
                    {offer.description && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>Description</Text>
                            <Text style={{ fontSize: 14, color: '#666', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, lineHeight: 20 }}>
                                {offer.description}
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Order Modal */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={handleCancelOrder}
                >
                    <View style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0,0,0,0.3)"
                    }}>
                        <View style={{
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            padding: 24,
                            width: "85%",
                            alignItems: "center"
                        }}>
                            <Image
                                source={{ uri: offer.imageUrl || 'default' }}
                                style={{ width: 120, height: 120, borderRadius: 12, marginBottom: 16 }}
                            />
                            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
                                {offer.name}
                            </Text>
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>
                                {offer.type} • €{offer.price}/{offer.unit}
                            </Text>
                            <Text style={{ color: "#555", marginBottom: 8 }}>
                                {offer.description}
                            </Text>
                            <Text style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                                Seller: {offer.seller.name} ({offer.seller.contact})
                            </Text>
                            <Text style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                                Address: {offer.address.city}, {offer.address.street}
                            </Text>
                            <Text style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                                Available: {offer.availableFrom} - {offer.availableTo}
                            </Text>
                            <TextInput
                                placeholder={`Quantity (max ${offer.quantity})`}
                                value={orderQuantity}
                                onChangeText={setOrderQuantity}
                                keyboardType="numeric"
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#ccc",
                                    borderRadius: 8,
                                    padding: 10,
                                    fontSize: 16,
                                    width: "100%",
                                    marginBottom: 8
                                }}
                            />
                            {orderQuantity && !isNaN(parseFloat(orderQuantity)) && (
                                <Text style={{ fontSize: 16, marginBottom: 8 }}>
                                    Total: €{((offer.price) * (parseFloat(orderQuantity) || 0)).toFixed(2)}
                                </Text>
                            )}
                            {orderError ? (
                                <Text style={{ color: "red", marginBottom: 8 }}>{orderError}</Text>
                            ) : null}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                                <Button title="Cancel" color="#888" onPress={handleCancelOrder} />
                                <View style={{ width: 16 }} />
                                <Button title="Confirm Order" color="#4caf50" onPress={handleConfirmOrder} disabled={isSubmittingOrder} />
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </ImageBackground>
    );
};

export default Offer;

