import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import Slider from "@react-native-community/slider";
// Import mockedItems.json
import mockedItems from "../assets/mockedItems.json";

const foodTypes = [
    "All",
    "Vegetables",
    "Fruits",
    "Dairy",
    "Meat",
    "Bakery",
    "Other"
];

type RootStackParamList = {
    Results: {
        searchTerm: string;
        selectedType: string;
        distance: number;
        items: any[];
    };
    // other screens...
};

const QueryFoodScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("All");
    const [distance, setDistance] = useState(10);

    // Example location for search center (could be user's location)
    const searchCenter = { lat: 37.0194, lng: -7.9304 }; // Faro, Algarve

    // Helper to calculate distance between two lat/lng points (Haversine formula)
    function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    const handleSearch = () => {
        // Filter mockedItems based on searchTerm, selectedType, and distance
        const filteredItems = mockedItems.filter((item: any) => {
            const matchesType = selectedType === "All" || item.type === selectedType;
            const matchesTerm =
                searchTerm.trim() === "" ||
                item.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.trim().toLowerCase());
            const itemDistance = getDistanceKm(
                searchCenter.lat,
                searchCenter.lng,
                item.address.lat,
                item.address.lng
            );
            const matchesDistance = itemDistance <= distance;
            
            const result = matchesType && matchesTerm && matchesDistance;
            if (result) {
                console.log("Matched item:", item);
            }
            return result;
        });

        navigation.navigate("Results", {
            searchTerm,
            selectedType,
            distance,
            items: filteredItems
        });
    };

    return (
        <View style={{ flex: 1, padding: 24, marginTop: 32 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
                Query for food in the area
            </Text>
            <TextInput
                style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 6,
                    padding: 8,
                    marginBottom: 16
                }}
                placeholder="Search for food items..."
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <Text style={{ marginBottom: 8 }}>Type of food:</Text>
            <Picker
                selectedValue={selectedType}
                style={{ height: 50, marginBottom: 16 }}
                onValueChange={(itemValue) => setSelectedType(itemValue)}
            >
                {foodTypes.map(type => (
                    <Picker.Item key={type} label={type} value={type} />
                ))}
            </Picker>
            <Text style={{ marginBottom: 8 }}>Maximum distance (km): {distance}</Text>
            <Slider
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={distance}
                onValueChange={setDistance}
                style={{ marginBottom: 24 }}
            />
            <Button title="Search" onPress={handleSearch} />
        </View>
    );
};

export default QueryFoodScreen;