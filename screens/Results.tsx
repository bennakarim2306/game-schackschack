import React, { useState } from "react";
import { View, Text, Button, FlatList, TouchableOpacity, Image, Modal, TextInput, ImageBackground } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

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
    const navigation = useNavigation();
    const route = useRoute();
    const { searchTerm, selectedType, distance, items = [], searchCenter } = (route.params as ResultsParams) || {};

    const [selectedItem, setSelectedItem] = useState<FoodOffer | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [orderQuantity, setOrderQuantity] = useState("");
    const [orderError, setOrderError] = useState("");

    const handleItemPress = (item: FoodOffer) => {
        setSelectedItem(item);
        setOrderQuantity("");
        setOrderError("");
        setModalVisible(true);
    };

    const handleCancelOrder = () => {
        setModalVisible(false);
        setSelectedItem(null);
        setOrderQuantity("");
        setOrderError("");
    };

    const handleConfirmOrder = () => {
        const qty = parseFloat(orderQuantity);
        if (isNaN(qty) || qty <= 0 || qty > (selectedItem?.quantity ?? 0)) {
            setOrderError(`Enter a valid quantity (max ${selectedItem?.quantity})`);
            return;
        }
        setModalVisible(false);
        alert(`Order confirmed!\n${qty} ${selectedItem?.unit} of ${selectedItem?.name} for ${(selectedItem?.price ?? 0) * qty}€`);
        setSelectedItem(null);
        setOrderQuantity("");
        setOrderError("");
    };

    return (
        <ImageBackground
            source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
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
            <Button title="Back to Search" onPress={() => navigation.goBack()} />

            {/* Modal for item details and order */}
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
                        {selectedItem && (
                            <>
                                <Image
                                    source={{ uri: selectedItem.imageUrl }}
                                    style={{ width: 120, height: 120, borderRadius: 12, marginBottom: 16 }}
                                />
                                <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
                                    {selectedItem.name}
                                </Text>
                                <Text style={{ fontSize: 16, marginBottom: 4 }}>
                                    {selectedItem.type} • {selectedItem.price}€/{selectedItem.unit}
                                </Text>
                                <Text style={{ color: "#555", marginBottom: 8 }}>
                                    {selectedItem.description}
                                </Text>
                                <Text style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                                    Seller: {selectedItem.seller.name} ({selectedItem.seller.contact})
                                </Text>
                                <Text style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                                    Address: {selectedItem.address.city}, {selectedItem.address.street}
                                </Text>
                                <Text style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                                    Available: {selectedItem.availableFrom} - {selectedItem.availableTo}
                                </Text>
                                <TextInput
                                    placeholder={`Quantity (max ${selectedItem.quantity})`}
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
                                        Total: {((selectedItem.price) * (parseFloat(orderQuantity) || 0)).toFixed(2)}€
                                    </Text>
                                )}
                                {orderError ? (
                                    <Text style={{ color: "red", marginBottom: 8 }}>{orderError}</Text>
                                ) : null}
                                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                                    <Button title="Cancel" color="#888" onPress={handleCancelOrder} />
                                    <View style={{ width: 16 }} />
                                    <Button title="Confirm Order" color="#009966" onPress={handleConfirmOrder} />
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
            </View>
            </View>
        </ImageBackground>
    );
};

export default Results;