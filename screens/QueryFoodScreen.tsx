import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, Platform, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import Slider from "@react-native-community/slider";
import * as SecureStore from "expo-secure-store";
import configs from "../config/AppConfig";
import Logger from "../config/Logger";
import { MapView, Marker, Circle } from "../utils/MapImports";

type MapPressEvent = any;

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
        searchCenter: { lat: number; lng: number };
    };
    // other screens...
};

const DEFAULT_CENTER = { lat: 37.0194, lng: -7.9304 }; // Faro, Algarve

const QueryFoodScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("All");
    const [distance, setDistance] = useState(10);
    const [searchCenter, setSearchCenter] = useState(DEFAULT_CENTER);
    const [isSearching, setIsSearching] = useState(false);

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

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const token = await SecureStore.getItemAsync("userToken");
            const params = new URLSearchParams();
            if (searchTerm.trim()) params.append("name", searchTerm.trim());
            if (selectedType !== "All") params.append("type", selectedType);
            params.append("lat", String(searchCenter.lat));
            params.append("lng", String(searchCenter.lng));
            params.append("distanceKm", String(distance));
            
            const url = `${configs.USER_AUTH_BASE_URL}${configs.ITEM_FILTER_PATH}?${params.toString()}`;
            Logger.info('SEARCH', `Searching with params: type=${selectedType}, distance=${distance}km, center=(${searchCenter.lat}, ${searchCenter.lng})`);
            Logger.request(url, 'GET', { params: params.toString() });
            
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (response.status === 200) {
                const items = await response.json();
                Logger.response(url, response.status, `Found ${items.length} items`);
                Logger.success('SEARCH', `Query successful - ${items.length} items found`);
                navigation.navigate("Results", {
                    searchTerm,
                    selectedType,
                    distance,
                    items,
                    searchCenter,
                });
            } else {
                Logger.response(url, response.status);
                Logger.error('SEARCH', 'Search failed with non-200 status');
                Alert.alert("Search Error", "Could not fetch items. Please try again.");
            }
        } catch (error) {
            Logger.error('SEARCH', 'Search exception', error);
            Alert.alert("Search Error", "An error occurred while searching.");
        } finally {
            setIsSearching(false);
        }
    };

    // Handle user selecting a new center on the map
    const handleMapPress = (event: MapPressEvent) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setSearchCenter({ lat: latitude, lng: longitude });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#D9F2D9' }}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
                Query for food in the area
            </Text>
            <TextInput
                style={{
                    borderWidth: 1,
                    borderColor: "#666",
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 16,
                    backgroundColor: "#fff",
                    fontSize: 16
                }}
                placeholder="Search for food items..."
                placeholderTextColor="#7a7878ff"
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <Text style={{ marginBottom: 8 }}>Type of food:</Text>
            <View style={{
                borderWidth: 1,
                borderColor: "#666",
                borderRadius: 6,
                backgroundColor: "#fff",
                marginBottom: 16
            }}>
                <Picker
                    selectedValue={selectedType}
                    style={{ height: 50 }}
                    onValueChange={(itemValue) => setSelectedType(itemValue)}
                    itemStyle={{ fontSize: 16, color: "#000" }}
                >
                    {foodTypes.map(type => (
                        <Picker.Item key={type} label={type} value={type} color="#000" />
                    ))}
                </Picker>
            </View>
            <Text style={{ marginBottom: 8 }}>Select search area:</Text>
            {Platform.OS !== 'web' ? (
                <MapView
                    style={{ width: "100%", height: 220, marginBottom: 16, borderRadius: 12 }}
                    initialRegion={{
                        latitude: searchCenter.lat,
                        longitude: searchCenter.lng,
                        latitudeDelta: 0.09,
                        longitudeDelta: 0.09,
                    }}
                    region={{
                        latitude: searchCenter.lat,
                        longitude: searchCenter.lng,
                        latitudeDelta: 0.09,
                        longitudeDelta: 0.09,
                    }}
                    onPress={handleMapPress}
                >
                    <Marker
                        coordinate={{ latitude: searchCenter.lat, longitude: searchCenter.lng }}
                        draggable
                        onDragEnd={e =>
                            setSearchCenter({
                                lat: e.nativeEvent.coordinate.latitude,
                                lng: e.nativeEvent.coordinate.longitude
                            })
                        }
                    />
                    <Circle
                        center={{ latitude: searchCenter.lat, longitude: searchCenter.lng }}
                        radius={distance * 1000}
                        strokeColor="#009966"
                        fillColor="rgba(0,153,102,0.2)"
                    />
                </MapView>
            ) : (
                <View style={{ 
                    width: "100%", 
                    height: 220, 
                    marginBottom: 16, 
                    borderRadius: 12,
                    backgroundColor: '#e0e0e0',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Text>Map not available on web</Text>
                    <Text style={{ fontSize: 12, marginTop: 8 }}>
                        Location: {searchCenter.lat.toFixed(4)}, {searchCenter.lng.toFixed(4)}
                    </Text>
                </View>
            )}
            <Text style={{ marginBottom: 8 }}>Maximum distance (km): {distance}</Text>
            <Slider
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={distance}
                onValueChange={setDistance}
                style={{ marginBottom: 24 }}
            />
            <Pressable
                onPress={handleSearch}
                disabled={isSearching}
                style={({ pressed }) => ([
                    {
                        backgroundColor: isSearching ? '#ccc' : '#2196F3',
                        padding: 16,
                        borderRadius: 8,
                        alignItems: 'center',
                        opacity: pressed && !isSearching ? 0.7 : 1
                    }
                ])}
            >
                {isSearching ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Search</Text>
                )}
            </Pressable>
            </ScrollView>
        </View>
    );
};

export default QueryFoodScreen;