import React, { useState, useLayoutEffect, useRef } from "react";
import { ScrollView, Text, TextInput, Button, Alert, Image, TouchableOpacity, View, ActivityIndicator, Switch, Modal, ImageBackground, FlatList } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import configs from "../config/AppConfig";
import { KeyboardAvoidingView, Platform } from 'react-native';
import Logger from "../config/Logger";
import { MapView, Marker } from '../utils/MapImports';
import { authenticatedFetch, authenticatedFetchWithErrorHandling } from '../utils/AuthenticatedFetch';
import { getFileExtensionFromUri, getMimeTypeFromExtension } from '../utils/FileUploadHelper';

const foodTypes = [
    "Vegetables", "Fruits", "Dairy", "Meat", "Bakery", "Other"
];
const units = ["kg", "g", "l", "pcs", "box"];

// Generate unique filename using timestamp and random number (React Native compatible)
const generateUniqueFilename = (extension: string): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    return `${timestamp}-${random}.${extension}`;
};

type RootStackParamList = {
    AddItemScreen: undefined;
    MyOffersScreen: undefined;
};

const AddItemScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const [name, setName] = useState("");
    const [type, setType] = useState(foodTypes[0]);
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState(units[0]);
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [zip, setZip] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

    // Label state
    const [labelInput, setLabelInput] = useState("");
    const [labels, setLabels] = useState<string[]>([]);

    // Autofill switch and loading state
    const [autofillAddressSwitch, setAutofillAddressSwitch] = useState(false);
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Modal state for entering address if not found
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [modalAddress, setModalAddress] = useState("");
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [selectedAddressCoords, setSelectedAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedAddressText, setSelectedAddressText] = useState("");
    const [loadingPosition, setLoadingPosition] = useState(false);
    const [lat, setLat] = useState(0);
    const [lng, setLng] = useState(0);
    const [savingAddress, setSavingAddress] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Autofill address from backend when switch is turned on
    const handleAutofillSwitch = async (value: boolean) => {
        setAutofillAddressSwitch(value);
        if (value) {
            setLoadingAddress(true);
            let token: string | null = null;
            try {
                token = await SecureStore.getItemAsync("userToken");
            } catch (e) {
                Logger.error('ADDRESS', 'Failed to read token from SecureStore', e);
            }
            try {
                const url = configs.USER_AUTH_BASE_URL + configs.ACCOUNT_GET_ADDRESS_BY_EMAIL_PATH;
                Logger.info('ADDRESS', 'Fetching saved address for autofill');
                Logger.request(url, 'GET');
                
                const response = await authenticatedFetchWithErrorHandling(url, {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    }
                });
                
                Logger.response(url, response.status);
                
                if (response.status === 204) {
                    Logger.info('ADDRESS', 'No saved address found - prompting user');
                    // No address found, prompt user to enter and save
                    setShowAddressModal(true);
                } else if (!response.ok) {
                    Logger.error('ADDRESS', 'Failed to fetch address');
                    throw new Error("Could not fetch address");
                } else {
                    const data = await response.json();
                    if (data && (data.street || data.city || data.zip)) {
                        Logger.success('ADDRESS', `Address autofilled: ${data.street}, ${data.city} ${data.zip}`);
                        setStreet(data.street || "");
                        setCity(data.city || "");
                        setZip(data.zip || "");
                    } else {
                        Logger.info('ADDRESS', 'Empty address data - showing modal');
                        setShowAddressModal(true);
                    }
                }
            } catch (e) {
                Logger.error('ADDRESS', 'Exception fetching address', e);
                Alert.alert("Error", "Could not fetch your address from the backend.");
                setAutofillAddressSwitch(false);
            } finally {
                setLoadingAddress(false);
            }
        }
    };

    // Save address to backend from modal
    const handleSaveAddress = async () => {
        if (!selectedAddressCoords || !selectedAddressText) {
            Alert.alert("Missing address", "Please select an address first.");
            return;
        }
        setSavingAddress(true);
        try {
            const url = configs.USER_AUTH_BASE_URL + configs.ACCOUNT_SET_ADDRESS_BY_EMAIL_PATH;
            const addressData = {
                street: selectedAddressText,
                city: "",
                zip: ""
            };
            
            Logger.info('ADDRESS', `Saving address: ${selectedAddressText}`);
            Logger.request(url, 'POST', addressData);
            
            const response = await authenticatedFetchWithErrorHandling(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(addressData)
            });
            
            Logger.response(url, response.status);
            
            if (!response.ok) {
                Logger.error('ADDRESS', 'Failed to save address');
                throw new Error("Could not save address");
            }
            
            Logger.success('ADDRESS', 'Address saved successfully');
            setStreet(selectedAddressText);
            setCity("");
            setZip("");
            setLat(selectedAddressCoords.lat);
            setLng(selectedAddressCoords.lng);
            setShowAddressModal(false);
            resetAddressModal();
            Alert.alert("Success", "Address saved and autofilled.");
        } catch (e) {
            Logger.error('ADDRESS', 'Exception saving address', e);
            Alert.alert("Error", "Could not save your address to the backend.");
        } finally {
            setSavingAddress(false);
        }
    };

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
                    setModalAddress(addressName);
                    setSelectedAddressText(addressName);
                    setSelectedAddressCoords({ lat: latitude, lng: longitude });
                    setAddressSuggestions([]);
                } else {
                    Logger.warning('GEOCODING', 'No address found for coordinates');
                    setSelectedAddressCoords({ lat: latitude, lng: longitude });
                }
            } catch (error) {
                Logger.error('GEOCODING', 'Exception reverse geocoding', error);
                setSelectedAddressCoords({ lat: latitude, lng: longitude });
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
        setModalAddress(description);
        setAddressSuggestions([]);
        
        try {
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry&key=${configs.MAPS_API_KEY}`;
            
            Logger.info('PLACES_API', `Getting details for place: ${place_id}`);
            Logger.request(url, 'GET');
            
            const response = await fetch(url);
            const data = await response.json();
            
            Logger.response(url, response.status);
            
            if (data.result && data.result.geometry) {
                const { lat, lng } = data.result.geometry.location;
                Logger.success('PLACES_API', `Got coordinates: (${lat}, ${lng})`);
                setSelectedAddressCoords({ lat, lng });
                setSelectedAddressText(description);
            }
        } catch (error) {
            Logger.error('PLACES_API', 'Exception getting place details', error);
        }
    };

    // Reset address modal state
    const resetAddressModal = () => {
        setModalAddress("");
        setAddressSuggestions([]);
        setSelectedAddressCoords(null);
        setSelectedAddressText("");
    };

    const handleAddOffer = async () => {
        if (!name || !price || !quantity || !image ||
            (!autofillAddressSwitch && (!street || !city || !zip || !lat || !lng))) {
            Logger.debug('OFFER', `Validation failed - name: ${!!name}, price: ${!!price}, quantity: ${!!quantity}, image: ${!!image}, autofillAddressSwitch: ${autofillAddressSwitch}, street: ${!!street}, city: ${!!city}, zip: ${!!zip}, lat: ${!!lat}, lng: ${!!lng}`);
            Alert.alert("Missing fields", "Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            const itemData = {
                name,
                type,
                price,
                quantity,
                unit,
                street,
                city,
                zip,
                lat,
                lng,
                description,
            };

            const formData = new FormData();
            formData.append("item", JSON.stringify(itemData));
            Logger.debug('OFFER', `Item JSON appended: ${JSON.stringify(itemData)}`);

            let fileName = '';
            let mimeType = '';

            // Append image file if present
            if (image) {
                const fileExtension = getFileExtensionFromUri(image.uri);
                const inferredMimeType = getMimeTypeFromExtension(fileExtension);
                mimeType = image.mimeType || inferredMimeType || 'image/jpeg';
                fileName = image.fileName || generateUniqueFilename(fileExtension);

                try {
                    formData.append("image", {
                        uri: image.uri,
                        name: fileName,
                        type: mimeType,
                    });
                    Logger.info('OFFER', `FormData ready - Item + Image (${mimeType})`);
                } catch (fileError) {
                    Logger.error('OFFER', 'Failed to append image to FormData', fileError);
                    Alert.alert("Error", "Failed to process image file");
                    return;
                }
            }

            const url = configs.USER_AUTH_BASE_URL + configs.ITEM_ADD_WITH_IMAGE_PATH;
            Logger.info('OFFER', `Adding offer: ${name} (${type}), image: ${image ? 'yes' : 'no'}`);
            Logger.debug('OFFER', `POST ${url}`);
            Logger.debug('OFFER', `FormData parts: item=${name}, image=${fileName}`);
            Logger.request(url, 'POST', { formData });

            // DO NOT set Content-Type header for FormData - let the native fetch set it automatically
            // React Native will automatically set Content-Type: multipart/form-data with boundary
            // Add 5 second timeout using AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                Logger.warning('OFFER', 'Request timeout - aborting after 5 seconds');
                controller.abort();
            }, 10000);
            
            try {
                Logger.info('OFFER', 'Starting fetch request');
                const response = await authenticatedFetch(url, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                Logger.response(url, response.status);
                Logger.info('OFFER', `Got response with status: ${response.status}`);

                if (!response.ok) {
                    Logger.error('OFFER', 'Failed to add offer');
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                Logger.success('OFFER', `Offer added successfully: ${name}`);
                Alert.alert("Offer Added", `Your offer for ${name} has been added!`, [{ text: "OK" }]);
                resetForm();
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                Logger.error('OFFER', `Fetch error caught: ${fetchError.name} - ${fetchError.message}`, fetchError);
                if (fetchError.name === 'AbortError') {
                    Logger.error('OFFER', 'Request timeout - backend did not respond within 5 seconds');
                    Alert.alert("Timeout", "The request took too long. Please check your connection and try again.");
                } else {
                    throw fetchError;
                }
            }
        } catch (error: any) {
            Logger.error('OFFER', `Exception adding offer: ${error.message}`, error);
            Alert.alert("Error", "There was an error adding your offer. Please try again.");
        } finally {
            Logger.info('OFFER', 'Finally block - resetting isSubmitting');
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setName("");
        setType(foodTypes[0]);
        setPrice("");
        setQuantity("");
        setUnit(units[0]);
        setStreet("");
        setCity("");
        setZip("");
        setDescription("");
        setImage(null);
        setLabels([]);
        setAutofillAddressSwitch(false);
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission required", "Camera roll permission is required!");
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0]);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate("MyOffersScreen")}
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
                    <Ionicons name="pricetag" size={22} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>My Offers</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const handleAddLabel = () => {
        const trimmed = labelInput.trim();
        if (trimmed && labels.length < 5 && !labels.includes(trimmed)) {
            setLabels([...labels, trimmed]);
            setLabelInput("");
        }
    };

    const handleRemoveLabel = (labelToRemove: string) => {
        setLabels(labels.filter(label => label !== labelToRemove));
    };

    return (
        <ImageBackground
            source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(217, 242, 217, 0.85)' }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
                >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start", alignItems: "center", padding: 24, paddingBottom: 80, marginTop: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 16, width: "100%" }}>
                        {/* Labels input and list */}
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Labels (max 5):</Text>
                            <View style={{ flexDirection: "row", marginBottom: 8 }}>
                            <TextInput
                                placeholder="Add label"
                                value={labelInput}
                                onChangeText={setLabelInput}
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#666",
                                    borderRadius: 6,
                                    padding: 12,
                                    flex: 1,
                                    marginRight: 8,
                                    backgroundColor: "#fff",
                                    fontSize: 16
                                }}
                                onSubmitEditing={handleAddLabel}
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                onPress={handleAddLabel}
                                disabled={!labelInput.trim() || labels.length >= 5}
                                style={{
                                    backgroundColor: (!labelInput.trim() || labels.length >= 5) ? '#ccc' : '#2196F3',
                                    borderRadius: 25,
                                    width: 50,
                                    height: 50,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Add</Text>
                            </TouchableOpacity>
                        </View>
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                {labels.map(label => (
                                    <View
                                        key={label}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            backgroundColor: "#e0e0e0",
                                            borderRadius: 16,
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                            marginRight: 6,
                                            marginBottom: 6,
                                        }}
                                    >
                                        <Text style={{ marginRight: 4 }}>{label}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveLabel(label)}>
                                            <Ionicons name="close" size={16} color="#888" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                        {/* Image picker */}
                        <TouchableOpacity onPress={pickImage} style={{ marginBottom: 0 }}>
                            {image ? (
                                <Image source={{ uri: image.uri }} style={{ width: 120, height: 90, borderRadius: 8 }} />
                            ) : (
                                <View style={{ width: 120, height: 90, borderRadius: 8, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" }}>
                                    <Text style={{ color: "#888" }}>Tap to upload image</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        placeholder="Item name"
                        value={name}
                        onChangeText={setName}
                        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                    />
                    <Text style={{ alignSelf: "flex-start" }}>Type of food:</Text>
                    <Picker
                        selectedValue={type}
                        style={{ height: 50, width: "100%", marginBottom: 12 }}
                        onValueChange={setType}
                    >
                        {foodTypes.map(t => (
                            <Picker.Item key={t} label={t} value={t} />
                        ))}
                    </Picker>
                    <TextInput
                        placeholder="Price (€)"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                    />
                    <TextInput
                        placeholder="Quantity"
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                    />
                    <Text style={{ alignSelf: "flex-start" }}>Unit:</Text>
                    <Picker
                        selectedValue={unit}
                        style={{ height: 50, width: "100%", marginBottom: 12 }}
                        onValueChange={setUnit}
                        itemStyle={{ fontSize: 16, color: "#000" }}
                    >
                        {units.map(u => (
                            <Picker.Item key={u} label={u} value={u} />
                        ))}
                    </Picker>
                    <View style={{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 12 }}>
                        <Text style={{ marginRight: 8 }}>Use my address</Text>
                        <Switch
                            value={autofillAddressSwitch}
                            onValueChange={handleAutofillSwitch}
                            disabled={loadingAddress}
                        />
                        {loadingAddress && <ActivityIndicator size="small" color="#2196F3" style={{ marginLeft: 8 }} />}
                    </View>
                    {!autofillAddressSwitch && (
                        <>
                            <TextInput
                                placeholder="Street"
                                value={street}
                                onChangeText={setStreet}
                                style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                            />
                            <TextInput
                                placeholder="City"
                                placeholderTextColor="#999"
                                value={city}
                                onChangeText={setCity}
                                style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                            />
                            <TextInput
                                placeholder="ZIP"
                                placeholderTextColor="#999"
                                value={zip}
                                onChangeText={setZip}
                                style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                            />
                        </>
                    )}
                    <TextInput
                        placeholder="Description (optional)"
                        placeholderTextColor="#999"
                        value={description}
                        onChangeText={setDescription}
                        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                    />
                </ScrollView>
                <View style={{ padding: 16, paddingBottom: 16 }}>
                    <Button 
                        title={isSubmitting ? "Adding..." : "Add Offer"} 
                        onPress={handleAddOffer} 
                        disabled={isSubmitting} 
                        color="#2196F3" 
                    />
                    {isSubmitting && (
                        <ActivityIndicator 
                            size="small" 
                            color="#2196F3" 
                            style={{ marginTop: 8 }} 
                        />
                    )}
                </View>
                {/* Address Modal */}
                <Modal
                    visible={showAddressModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => {
                        setShowAddressModal(false);
                        resetAddressModal();
                    }}
                >
                    <View style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingVertical: 20
                    }}>
                        <View style={{
                            backgroundColor: "#fff",
                            borderRadius: 12,
                            padding: 24,
                            width: "90%",
                            maxHeight: "90%",
                            alignItems: "center"
                        }}>
                            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 16 }}>Enter your address</Text>
                            
                            {/* Address Input with Current Position Button */}
                            <View style={{ width: "100%", marginBottom: 12 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TextInput
                                        placeholder="Search address..."
                                        value={modalAddress}
                                        onChangeText={(text) => {
                                            setModalAddress(text);
                                            fetchAddressSuggestions(text);
                                        }}
                                        style={{
                                            flex: 1,
                                            borderWidth: 1,
                                            borderColor: "#ccc",
                                            borderRadius: 6,
                                            padding: 12,
                                            fontSize: 16,
                                            marginRight: 8
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
                                        marginTop: -1,
                                        backgroundColor: "#fff",
                                        maxHeight: 200
                                    }}>
                                        <FlatList
                                            data={addressSuggestions}
                                            keyExtractor={(item) => item.place_id}
                                            scrollEnabled={true}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
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
                                            )}
                                        />
                                    </View>
                                )}
                                {loadingSuggestions && (
                                    <ActivityIndicator size="small" color="#2196F3" style={{ marginTop: 8 }} />
                                )}
                            </View>

                            {/* Map Display */}
                            {selectedAddressCoords && (
                                <>
                                    <Text style={{ color: "green", marginBottom: 8, fontWeight: "600" }}>Address confirmed!</Text>
                                    {Platform.OS !== 'web' && (
                                        <MapView
                                            style={{ width: "100%", height: 200, marginBottom: 12, borderRadius: 8 }}
                                            initialRegion={{
                                                latitude: selectedAddressCoords.lat,
                                                longitude: selectedAddressCoords.lng,
                                                latitudeDelta: 0.015,
                                                longitudeDelta: 0.015,
                                            }}
                                            region={{
                                                latitude: selectedAddressCoords.lat,
                                                longitude: selectedAddressCoords.lng,
                                                latitudeDelta: 0.015,
                                                longitudeDelta: 0.015,
                                            }}
                                            pointerEvents="none"
                                        >
                                            <Marker coordinate={{ 
                                                latitude: selectedAddressCoords.lat, 
                                                longitude: selectedAddressCoords.lng 
                                            }} />
                                        </MapView>
                                    )}
                                    {Platform.OS === 'web' && (
                                        <View style={{ width: "100%", height: 200, marginBottom: 12, borderRadius: 8, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 12 }}>Map preview</Text>
                                            <Text style={{ fontSize: 10, marginTop: 4 }}>{selectedAddressCoords.lat.toFixed(4)}, {selectedAddressCoords.lng.toFixed(4)}</Text>
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Action Buttons */}
                            <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%", marginTop: 12 }}>
                                <TouchableOpacity
                                    onPress={handleSaveAddress}
                                    disabled={!selectedAddressCoords || savingAddress}
                                    style={{
                                        flex: 1,
                                        backgroundColor: selectedAddressCoords && !savingAddress ? "#2196F3" : "#ccc",
                                        borderRadius: 6,
                                        padding: 12,
                                        alignItems: "center",
                                        marginRight: 8
                                    }}
                                >
                                    {savingAddress ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Save</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowAddressModal(false);
                                        resetAddressModal();
                                    }}
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#888",
                                        borderRadius: 6,
                                        padding: 12,
                                        alignItems: "center"
                                    }}
                                >
                                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
            </View>
        </ImageBackground>
    );
};

export default AddItemScreen;