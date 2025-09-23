import React from "react";
import { View, Text, Button, FlatList, TouchableOpacity, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

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
};

const Results = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { searchTerm, selectedType, distance, items = [] } = (route.params as ResultsParams) || {};

    const handleItemPress = (item: FoodOffer) => {
        // You can navigate to a detail screen or show more info here
        alert(`Selected: ${item.name}\n${item.description}`);
    };

    return (
        <View style={{ flex: 1, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
                Results
            </Text>
            <Text>Search term: {searchTerm}</Text>
            <Text>Type: {selectedType}</Text>
            <Text>Distance: {distance} km</Text>
            <FlatList
                data={items}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
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
                            <Text>{item.type} • {item.price}€/{item.unit}</Text>
                            <Text numberOfLines={1} style={{ color: "#555" }}>{item.description}</Text>
                            <Text style={{ fontSize: 12, color: "#888" }}>
                                {item.address.city}, {item.address.street}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text style={{ marginTop: 24, color: "#888" }}>No items found.</Text>
                }
            />
            <Button title="Back to Search" onPress={() => navigation.goBack()} />
        </View>
    );
};

export default Results;