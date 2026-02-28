import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, Platform, ScrollView, Pressable, ActivityIndicator, FlatList, TouchableOpacity } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import configs from "../config/AppConfig";
import Logger from "../config/Logger";
import { MapView, Marker, Circle } from "../utils/MapImports";
import { authenticatedFetch } from '../utils/AuthenticatedFetch';
import ScreenBackground from '../utils/ScreenBackground';

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Address search state
    const [addressInput, setAddressInput] = useState("");
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [loadingPosition, setLoadingPosition] = useState(false);

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

    // Fetch autocomplete suggestions from Google Places API
    const fetchAddressSuggestions = async (input: string) => {
        if (input.length < 3) {
            setAddressSuggestions([]);
            return;
        }
        
        setLoadingSuggestions(true);
        try {
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${configs.MAPS_API_KEY}`;
            
            Logger.info('PLACES_API', `Fetching autocomplete suggestions for: ${input}`);
            Logger.request(url, 'GET');
            
            const response = await fetch(url);
            const data = await response.json();
            
            Logger.response(url, response.status);
            
            if (data.predictions) {
                Logger.info('PLACES_API', `Got ${data.predictions.length} suggestions`);
                setAddressSuggestions(data.predictions);
            } else {
                setAddressSuggestions([]);
            }
        } catch (error) {
            Logger.error('PLACES_API', 'Exception fetching suggestions', error);
            setAddressSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    // Get current device location
    const handleUseCurrentPosition = async () => {
        setLoadingPosition(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Logger.error('LOCATION', 'Location permission denied');
                Alert.alert("Permission Denied", "Location permission is required to use this feature.");
                return;
            }

            Logger.info('LOCATION', 'Requesting current location');
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            
            Logger.success('LOCATION', `Got location: (${latitude}, ${longitude})`);
            setSearchCenter({ lat: latitude, lng: longitude });
            
            // Reverse geocode to get address name
            try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${configs.MAPS_API_KEY}`;
                Logger.request(url, 'GET');
                
                const response = await fetch(url);
                const data = await response.json();
                
                Logger.response(url, response.status);
                
                if (data.results && data.results.length > 0) {
                    const addressName = data.results[0].formatted_address;
                    Logger.success('GEOCODING', `Reverse geocoded: ${addressName}`);
                    setAddressInput(addressName);
                    setAddressSuggestions([]);
                }
            } catch (error) {
                Logger.error('GEOCODING', 'Exception reverse geocoding', error);
            }
        } catch (error) {
            Logger.error('LOCATION', 'Exception getting location', error);
            Alert.alert("Error", "Could not get your current location.");
        } finally {
            setLoadingPosition(false);
        }
    };

    // Handle address suggestion selection
    const handleSelectSuggestion = async (suggestion: any) => {
        const { place_id, description } = suggestion;
        setAddressInput(description);
        setAddressSuggestions([]);
        
        try {
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry,formatted_address,address_components&key=${configs.MAPS_API_KEY}`;
            
            Logger.info('PLACES_API', `Getting details for place: ${place_id}`);
            Logger.request(url, 'GET');
            
            const response = await fetch(url);
            const data = await response.json();
            
            Logger.response(url, response.status);
            
            if (data.result && data.result.geometry) {
                const { lat, lng } = data.result.geometry.location;
                Logger.success('PLACES_API', `Got coordinates: (${lat}, ${lng})`);
                setSearchCenter({ lat, lng });
            }
        } catch (error) {
            Logger.error('PLACES_API', 'Exception getting place details', error);
        }
    };

    // Handle map press to set marker and reverse geocode
    const handleMapPress = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        
        Logger.info('MAP', `Map pressed at: (${latitude}, ${longitude})`);
        setSearchCenter({ lat: latitude, lng: longitude });
        
        // Reverse geocode to get address
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${configs.MAPS_API_KEY}`;
            Logger.request(url, 'GET');
            
            const response = await fetch(url);
            const data = await response.json();
            
            Logger.response(url, response.status);
            
            if (data.results && data.results.length > 0) {
                const addressName = data.results[0].formatted_address;
                Logger.success('MAP', `Reverse geocoded: ${addressName}`);
                setAddressInput(addressName);
            }
        } catch (error) {
            Logger.error('MAP', 'Exception reverse geocoding map location', error);
        }
    };

    const handleSearch = async () => {
        setIsSubmitting(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm.trim()) params.append("name", searchTerm.trim());
            if (selectedType !== "All") params.append("type", selectedType);
            params.append("lat", String(searchCenter.lat));
            params.append("lng", String(searchCenter.lng));
            params.append("distanceKm", String(distance));
            
            const url = `${configs.USER_AUTH_BASE_URL}${configs.ITEM_FILTER_PATH}?${params.toString()}`;
            Logger.info('SEARCH', `Searching with params: type=${selectedType}, distance=${distance}km, center=(${searchCenter.lat}, ${searchCenter.lng})`);
            Logger.request(url, 'GET', { params: params.toString() });
            
            const response = await authenticatedFetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
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
            setIsSubmitting(false);
        }
    };

    return (
        <ScreenBackground>
            <View style={{ flex: 1 }}>
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
            <Text style={{ marginBottom: 8 }}>Search location:</Text>
            
            {/* Address Search Input */}
            <View style={{ width: "100%", marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <TextInput
                        placeholder="Search address or location..."
                        value={addressInput}
                        onChangeText={(text) => {
                            setAddressInput(text);
                            fetchAddressSuggestions(text);
                        }}
                        style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: "#ccc",
                            borderRadius: 6,
                            padding: 12,
                            fontSize: 16,
                            marginRight: 8,
                            backgroundColor: "#fff"
                        }}
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                        onPress={handleUseCurrentPosition}
                        disabled={loadingPosition}
                        style={{
                            backgroundColor: loadingPosition ? "#ccc" : "#2196F3",
                            borderRadius: 6,
                            padding: 12,
                            justifyContent: "center",
                            alignItems: "center"
                        }}
                    >
                        {loadingPosition ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Ionicons name="location" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
                
                {/* Autocomplete Suggestions */}
                {addressSuggestions.length > 0 && (
                    <View style={{
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderTopWidth: 0,
                        borderBottomLeftRadius: 6,
                        borderBottomRightRadius: 6,
                        backgroundColor: "#fff",
                        maxHeight: 200
                    }}>
                        {addressSuggestions.map((item) => (
                            <TouchableOpacity
                                key={item.place_id}
                                onPress={() => handleSelectSuggestion(item)}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    borderBottomWidth: 1,
                                    borderBottomColor: "#eee"
                                }}
                            >
                                <Text style={{ fontSize: 14, color: "#333" }}>
                                    {item.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                {loadingSuggestions && (
                    <ActivityIndicator size="small" color="#2196F3" style={{ marginTop: 8 }} />
                )}
            </View>

            {/* Interactive Map */}
            <View style={{ width: "100%", height: 300, marginBottom: 12, borderRadius: 8, overflow: "hidden" }}>
                {Platform.OS !== 'web' ? (
                    <MapView
                        style={{ flex: 1 }}
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
                            title="Search Center"
                            description={addressInput || "Tap on map to set location"}
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
                        flex: 1,
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
            </View>


            <Text style={{ marginBottom: 8 }}>Maximum distance (km): {distance}</Text>
            <Slider
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={distance}
                onValueChange={setDistance}
                style={{ marginBottom: 80 }}
            />
            </ScrollView>
            <View style={{ padding: 16, paddingBottom: 16 }}>
                <TouchableOpacity
                    onPress={handleSearch}
                    disabled={isSubmitting}
                    style={{
                        backgroundColor: isSubmitting ? "#b0c4de" : "#2196F3",
                        borderRadius: 6,
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 48
                    }}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                            Search
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
            </View>
        </ScreenBackground>
    );
};

export default QueryFoodScreen;