import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, Text, ScrollView, ImageBackground, Image, ActivityIndicator, Alert, TouchableOpacity, StyleSheet } from "react-native";
import { useRoute, useNavigation, NavigationProp } from "@react-navigation/native";
import { MapView, Marker } from '../utils/MapImports';
import { Ionicons } from "@expo/vector-icons";
import configs from "../config/AppConfig";
import Logger from "../config/Logger";
import { authenticatedFetch } from '../utils/AuthenticatedFetch';

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
    sellerName: string;
    sellerEmail: string;
    imageUrl?: string;
}

type OfferStackParamList = {
    Offer: { itemId: string; offer: ItemOffer };
    TransactionsScreen: { itemId: string };
};

const Offer = () => {
    const route = useRoute();
    const navigation = useNavigation<NavigationProp<OfferStackParamList>>();
    const { itemId, offer } = route.params as { itemId: string; offer: ItemOffer };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate("TransactionsScreen", { itemId })}
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
        Logger.info('OFFER_DETAIL', `Displaying offer: ${offer.name} (ID: ${itemId})`);
    }, [itemId, offer]);

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

    if (!offer) {
        return (
            <ImageBackground
                source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, color: '#666' }}>Offer not found</Text>
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
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>{offer.sellerName}</Text>
                    </View>

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
            </View>
        </ImageBackground>
    );
};

export default Offer;
