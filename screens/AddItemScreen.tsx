import React, { useState, useLayoutEffect, useRef } from "react";
import { ScrollView, Text, TextInput, Button, Alert, Image, TouchableOpacity, View, ActivityIndicator, Switch, Modal } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import configs from "../config/AppConfig";
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import Logger from "../config/Logger";

// Conditionally import MapView only on native platforms
let MapView: any, Marker: any;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
}

const foodTypes = [
    "Vegetables", "Fruits", "Dairy", "Meat", "Bakery", "Other"
];
const units = ["kg", "g", "l", "pcs", "box"];

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
    const [imageUri, setImageUri] = useState<string | null>(null);

    // Label state
    const [labelInput, setLabelInput] = useState("");
    const [labels, setLabels] = useState<string[]>([]);

    // Autofill switch and loading state
    const [autofillAddressSwitch, setAutofillAddressSwitch] = useState(false);
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Modal state for entering address if not found
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [modalStreet, setModalStreet] = useState("");
    const [modalCity, setModalCity] = useState("");
    const [modalZip, setModalZip] = useState("");
    const [savingAddress, setSavingAddress] = useState(false);

    // Address validation state
    const [addressValid, setAddressValid] = useState<boolean | null>(null);
    const [verifyingAddress, setVerifyingAddress] = useState(false);
    const lastValidatedAddress = useRef({ street: "", city: "", zip: "" });
    const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);

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
                
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        if (!modalStreet || !modalCity || !modalZip) {
            Alert.alert("Missing fields", "Please fill in all address fields.");
            return;
        }
        setSavingAddress(true);
        let token: string | null = null;
        try {
            token = await SecureStore.getItemAsync("userToken");
        } catch (e) {
            Logger.error('ADDRESS', 'Failed to read token from SecureStore', e);
        }
        try {
            const url = configs.USER_AUTH_BASE_URL + configs.ACCOUNT_SET_ADDRESS_BY_EMAIL_PATH;
            const addressData = {
                street: modalStreet,
                city: modalCity,
                zip: modalZip
            };
            
            Logger.info('ADDRESS', `Saving address: ${modalStreet}, ${modalCity} ${modalZip}`);
            Logger.request(url, 'POST', addressData);
            
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
            setStreet(modalStreet);
            setCity(modalCity);
            setZip(modalZip);
            setShowAddressModal(false);
            Alert.alert("Success", "Address saved and autofilled.");
        } catch (e) {
            Logger.error('ADDRESS', 'Exception saving address', e);
            Alert.alert("Error", "Could not save your address to the backend.");
        } finally {
            setSavingAddress(false);
        }
    };

    const handleAddOffer = async () => {
        if (!name || !price || !quantity || !description || !imageUri ||
            (!autofillAddressSwitch && (!street || !city || !zip))) {
            Alert.alert("Missing fields", "Please fill in all required fields.");
            return;
        }

        let token: string | null = null;
        try {
            token = await SecureStore.getItemAsync("userToken");
        } catch (e) {
            Logger.error('OFFER', 'Failed to read token from SecureStore', e);
        }

        const itemData = {
            name,
            type,
            price,
            quantity,
            unit,
            street,
            city,
            zip,
            description,
        };

        const formData = new FormData();
        formData.append("item", JSON.stringify(itemData));
        formData.append("image", {
            uri: imageUri,
            name: 'image.jpg',
            type: 'image/jpeg',
        } as any);

        try {
            const url = 'YOUR_API_ENDPOINT_HERE';
            Logger.info('OFFER', `Adding offer: ${name} (${type})`);
            Logger.request(url, 'POST', { item: itemData });
            
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            Logger.response(url, response.status);
            
            if (!response.ok) {
                Logger.error('OFFER', 'Failed to add offer');
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            Logger.success('OFFER', `Offer added successfully: ${name}`);
            Alert.alert("Offer Added", `Your offer for ${name} has been added!`, [{ text: "OK" }]);
            resetForm();
        } catch (error) {
            Logger.error('OFFER', 'Exception adding offer', error);
            Alert.alert("Error", "There was an error adding your offer. Please try again.");
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
        setImageUri(null);
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
            setImageUri(result.assets[0].uri);
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

    // Google Maps address validation
    const validateAddress = async () => {
        if (!modalStreet || !modalCity || !modalZip) {
            setAddressValid(null);
            setAddressCoords(null);
            return;
        }
        // Prevent unnecessary validation if address hasn't changed
        if (
            lastValidatedAddress.current.street === modalStreet &&
            lastValidatedAddress.current.city === modalCity &&
            lastValidatedAddress.current.zip === modalZip
        ) {
            return;
        }
        setVerifyingAddress(true);
        setAddressValid(null);
        setAddressCoords(null);
        try {
            const addressString = encodeURIComponent(`${modalStreet}, ${modalZip} ${modalCity}`);
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${addressString}&key=${configs.MAPS_API_KEY}`;
            
            Logger.info('GEOCODING', `Validating address: ${modalStreet}, ${modalZip} ${modalCity}`);
            Logger.request(url, 'GET');
            
            const res = await fetch(url);
            const data = await res.json();
            
            Logger.response(url, res.status, `Status: ${data.status}`);
            
            if (
                data.status === "OK" &&
                Array.isArray(data.results) &&
                data.results.length > 0
            ) {
                const location = data.results[0].geometry.location;
                Logger.success('GEOCODING', `Address validated - Coords: (${location.lat}, ${location.lng})`);
                setAddressValid(true);
                setAddressCoords({ lat: location.lat, lng: location.lng });
            } else {
                Logger.warning('GEOCODING', `Address validation failed - Status: ${data.status}`);
                setAddressValid(false);
                setAddressCoords(null);
            }
            lastValidatedAddress.current = {
                street: modalStreet,
                city: modalCity,
                zip: modalZip,
            };
        } catch (error) {
            Logger.error('GEOCODING', 'Exception validating address', error);
            setAddressValid(false);
            setAddressCoords(null);
        } finally {
            setVerifyingAddress(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start", alignItems: "center", padding: 24, marginTop: 0 }}>
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
                                        borderColor: "#ccc",
                                        borderRadius: 6,
                                        padding: 8,
                                        flex: 1,
                                        marginRight: 8,
                                    }}
                                    onSubmitEditing={handleAddLabel}
                                    returnKeyType="done"
                                />
                                <Button
                                    title="Add"
                                    onPress={handleAddLabel}
                                    disabled={!labelInput.trim() || labels.length >= 5}
                                />
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
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={{ width: 120, height: 90, borderRadius: 8 }} />
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
                                value={city}
                                onChangeText={setCity}
                                style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                            />
                            <TextInput
                                placeholder="ZIP"
                                value={zip}
                                onChangeText={setZip}
                                style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                            />
                        </>
                    )}
                    <TextInput
                        placeholder="Description (optional)"
                        value={description}
                        onChangeText={setDescription}
                        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                    />
                    <Button title="Add Offer" onPress={handleAddOffer} />
                </ScrollView>
                {/* Address Modal */}
                <Modal
                    visible={showAddressModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowAddressModal(false)}
                >
                    <View style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <View style={{
                            backgroundColor: "#fff",
                            borderRadius: 12,
                            padding: 24,
                            width: "85%",
                            alignItems: "center"
                        }}>
                            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 16 }}>Enter your address</Text>
                            <TextInput
                                placeholder="Street"
                                value={modalStreet}
                                onChangeText={text => {
                                    setModalStreet(text);
                                    setAddressValid(null);
                                    setAddressCoords(null);
                                }}
                                onBlur={() => { setAddressValid(null); setAddressCoords(null); }}
                                style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                            />
                            <TextInput
                                placeholder="City"
                                value={modalCity}
                                onChangeText={text => {
                                    setModalCity(text);
                                    setAddressValid(null);
                                    setAddressCoords(null);
                                }}
                                onBlur={() => { setAddressValid(null); setAddressCoords(null); }}
                                style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                            />
                            <TextInput
                                placeholder="ZIP"
                                value={modalZip}
                                onChangeText={text => {
                                    setModalZip(text);
                                    setAddressValid(null);
                                    setAddressCoords(null);
                                }}
                                onBlur={() => { setAddressValid(null); setAddressCoords(null); }}
                                style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
                            />
                            <Button title="Verify Address" onPress={validateAddress} disabled={verifyingAddress} />
                            {verifyingAddress && <ActivityIndicator size="small" color="#2196F3" style={{ marginVertical: 8 }} />}
                            {addressValid === true && (
                                <>
                                    <Text style={{ color: "green", marginBottom: 8 }}>Address is valid!</Text>
                                    {addressCoords && Platform.OS !== 'web' && (
                                        <MapView
                                            style={{ width: 220, height: 120, marginBottom: 12, borderRadius: 8 }}
                                            initialRegion={{
                                                latitude: addressCoords.lat,
                                                longitude: addressCoords.lng,
                                                latitudeDelta: 0.01,
                                                longitudeDelta: 0.01,
                                            }}
                                            region={{
                                                latitude: addressCoords.lat,
                                                longitude: addressCoords.lng,
                                                latitudeDelta: 0.01,
                                                longitudeDelta: 0.01,
                                            }}
                                            pointerEvents="none"
                                        >
                                            <Marker coordinate={{ latitude: addressCoords.lat, longitude: addressCoords.lng }} />
                                        </MapView>
                                    )}
                                    {addressCoords && Platform.OS === 'web' && (
                                        <View style={{ width: 220, height: 120, marginBottom: 12, borderRadius: 8, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 12 }}>Map preview</Text>
                                            <Text style={{ fontSize: 10, marginTop: 4 }}>{addressCoords.lat.toFixed(4)}, {addressCoords.lng.toFixed(4)}</Text>
                                        </View>
                                    )}
                                    <Button
                                        title={savingAddress ? "Saving..." : "Save"}
                                        onPress={handleSaveAddress}
                                        disabled={savingAddress}
                                    />
                                </>
                            )}
                            {addressValid === false && <Text style={{ color: "red", marginBottom: 8 }}>Address not found. Please check your input.</Text>}
                            <Button title="Cancel" color="#888" onPress={() => setShowAddressModal(false)} />
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddItemScreen;