import React, { useState, useEffect, useFocusEffect } from "react";
import { View, Text, ImageBackground, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert } from "react-native";
import { useNavigation, NavigationProp, useFocusEffect as useRNFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import configs from "../config/AppConfig";
import Logger from "../config/Logger";
import { authenticatedFetch } from "../utils/AuthenticatedFetch";

interface OfferItem {
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

type RootStackParamList = {
    OfferStackNavigator: { itemId: string; offer: OfferItem };
};

const MyOffersScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [offers, setOffers] = useState<OfferItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch offers when screen is focused
    useRNFocusEffect(
        React.useCallback(() => {
            fetchMyOffers();
        }, [])
    );

    const fetchMyOffers = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `${configs.USER_AUTH_BASE_URL}${configs.ITEM_GET_MY_OFFERS_PATH}`;
            Logger.info('MY_OFFERS', 'Fetching user offers');
            Logger.request(url, 'GET');

            const response = await authenticatedFetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            Logger.response(url, response.status);

            if (!response.ok) {
                throw new Error('Failed to fetch offers');
            }

            const data = await response.json();
            Logger.success('MY_OFFERS', `Found ${Array.isArray(data) ? data.length : data.items?.length || 0} offers`);
            
            // Handle both array and object with items property
            const offersList = Array.isArray(data) ? data : data.items || [];
            setOffers(offersList);
        } catch (error: any) {
            Logger.error('MY_OFFERS', `Exception fetching offers: ${error.message}`, error);
            setError(error.message || 'Failed to load offers');
            Alert.alert('Error', 'Could not load your offers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOfferPress = (offer: OfferItem) => {
        Logger.info('MY_OFFERS', `Navigating to offer: ${offer.id} - ${offer.name}`);
        navigation.navigate('OfferStackNavigator', { itemId: offer.id, offer });
    };

    if (loading && offers.length === 0) {
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
            <View style={{ flex: 1, backgroundColor: 'rgba(217, 242, 217, 0.85)' }}>
                {offers.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="box-outline" size={64} color="#ccc" style={{ marginBottom: 16 }} />
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#666', marginBottom: 8 }}>No Offers Yet</Text>
                        <Text style={{ fontSize: 14, color: '#999' }}>Create an offer to get started</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>
                            My Offers ({offers.length})
                        </Text>
                        {offers.map((offer) => (
                            <TouchableOpacity
                                key={offer.id}
                                onPress={() => handleOfferPress(offer)}
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    marginBottom: 12,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 3,
                                }}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    {/* Image */}
                                    {offer.imageUrl ? (
                                        <Image
                                            source={{ uri: offer.imageUrl }}
                                            style={{ width: 100, height: 100 }}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View
                                            style={{
                                                width: 100,
                                                height: 100,
                                                backgroundColor: '#f0f0f0',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons name="image-outline" size={40} color="#ccc" />
                                        </View>
                                    )}

                                    {/* Details */}
                                    <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                                        <View>
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 }}>
                                                {offer.name}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                                {offer.type}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2196F3' }}>
                                                €{offer.price}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: '#999' }}>
                                                {offer.quantity} {offer.unit}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Expiry Info */}
                                    <View
                                        style={{
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingHorizontal: 12,
                                            backgroundColor: '#f9f9f9',
                                            borderLeftWidth: 1,
                                            borderLeftColor: '#eee',
                                        }}
                                    >
                                        <Ionicons name="calendar-outline" size={20} color="#d32f2f" />
                                        <Text style={{ fontSize: 10, color: '#d32f2f', marginTop: 4, maxWidth: 50, textAlign: 'center' }}>
                                            Until {offer.availableTo}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
                {loading && offers.length > 0 && (
                    <View style={{ paddingVertical: 12, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#2196F3" />
                    </View>
                )}
            </View>
        </ImageBackground>
    );
};

export default MyOffersScreen;