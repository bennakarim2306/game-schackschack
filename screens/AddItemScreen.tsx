import React, { useState, useLayoutEffect, useRef, useContext } from "react";
import { ScrollView, Text, TextInput, Button, Alert, Image, TouchableOpacity, View, ActivityIndicator, Switch, Modal, FlatList, Platform, KeyboardAvoidingView } from "react-native";
import ScreenBackground from "../utils/ScreenBackground";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import configs from "../config/AppConfig";
import Logger from "../config/Logger";
import { MapView, Marker } from '../utils/MapImports';
import { authenticatedFetch, authenticatedFetchWithErrorHandling } from '../utils/AuthenticatedFetch';
import { getFileExtensionFromUri, getMimeTypeFromExtension } from '../utils/FileUploadHelper';
import AuthContext from "../Contexts/AuthContext";

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
    const authContext = useContext(AuthContext);

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
    const [availableTo, setAvailableTo] = useState<Date>(new Date(Date.now())); // Default to 7 days from now
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Label state
    const [labelInput, setLabelInput] = useState("");
    const [labels, setLabels] = useState<string[]>([]);

    // Autofill switch and loading state
    const [autofillAddressSwitch, setAutofillAddressSwitch] = useState(false);
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Address search state
    const [addressInput, setAddressInput] = useState("");
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [loadingPosition, setLoadingPosition] = useState(false);
    const [lat, setLat] = useState(0);
    const [lng, setLng] = useState(0);
    const [backendAddressAvailable, setBackendAddressAvailable] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Autofill address from authContext when switch is turned on
    const handleAutofillSwitch = async (value: boolean) => {
        setAutofillAddressSwitch(value);
        if (value) {
            setLoadingAddress(true);
            try {
                const currentUser = authContext?.getCurrentUser();
                Logger.info('ADDRESS', 'Attempting to load address from authContext');
                
                if (!currentUser || !currentUser.address || !currentUser.address.street || !currentUser.address.city || !currentUser.address.zip) {
                    Logger.info('ADDRESS', 'No address available in authContext - showing error');
                    setBackendAddressAvailable(false);
                    setAutofillAddressSwitch(false);
                    Alert.alert(
                        "No Address Available",
                        "No address is available for this account. Please select or search for an address below. You'll be asked if you want to save it as your default address.",
                        [{ text: "OK" }]
                    );
                } else {
                    const addressData = currentUser.address;
                    Logger.success('ADDRESS', `Address loaded from authContext: ${addressData.street}, ${addressData.city} ${addressData.zip}`);
                    setStreet(addressData.street || "");
                    setCity(addressData.city || "");
                    setZip(addressData.zip || "");
                    setLat(addressData.lat || 0);
                    setLng(addressData.lng || 0);
                    setBackendAddressAvailable(true);
                }
            } catch (e) {
                Logger.error('ADDRESS', 'Exception loading address from authContext', e);
                Alert.alert("Error", "Could not load your address.");
                setAutofillAddressSwitch(false);
            } finally {
                setLoadingAddress(false);
            }
        }
    };

    // Save address to backend and update authContext
    const saveAddressToBackend = async (street: string, city: string, zip: string, lat: number, lng: number) => {
        try {
            const url = configs.USER_AUTH_BASE_URL + configs.ACCOUNT_SET_ADDRESS_BY_EMAIL_PATH;
            const addressData = {
                street,
                city,
                zip,
                lat,
                lng
            };
            
            Logger.info('ADDRESS', `Saving address to backend: ${street}, ${city} ${zip} (${lat}, ${lng})`);
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
                Logger.error('ADDRESS', 'Failed to save address to backend');
                throw new Error("Could not save address");
            }
            
            Logger.success('ADDRESS', 'Address saved to backend successfully');
            
            // Update authContext with new address
            try {
                await authContext?.updateUserProfile({
                    address: { street, city, zip, lat, lng }
                });
                Logger.success('ADDRESS', 'Address updated in authContext');
            } catch (e) {
                Logger.error('ADDRESS', 'Failed to update authContext', e);
            }
            
            return true;
        } catch (e) {
            Logger.error('ADDRESS', 'Exception saving address', e);
            return false;
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
            setLat(latitude);
            setLng(longitude);

            // Reverse geocode to get address name
            try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${configs.MAPS_API_KEY}`;
                Logger.request(url, 'GET');
                
                const response = await fetch(url);
                const data = await response.json();
                
                Logger.response(url, response.status);
                
                if (data.results && data.results.length > 0) {
                    const addressName = data.results[0].formatted_address;
                    const cityName = data.results[0].address_components.find((comp: any) => comp.types.includes("locality"))?.long_name || "";
                    const zipCode = data.results[0].address_components.find((comp: any) => comp.types.includes("postal_code"))?.long_name || "";
                    Logger.success('GEOCODING', `Reverse geocoded: ${addressName}`);
                    setAddressInput(addressName);
                    setStreet(addressName);
                    setCity(cityName);
                    setZip(zipCode);
                    setAddressSuggestions([]);
                    
                    // Always ask user if they want to save this address as default
                    Alert.alert(
                        "Save as Default Address",
                        "Do you want to save this location as your default account address?",
                        [
                            {
                                text: "No",
                                onPress: () => {
                                    Logger.info('ADDRESS', 'User chose not to save current location as default');
                                },
                                style: "cancel"
                            },
                            {
                                text: "Yes",
                                onPress: async () => {
                                    Logger.info('ADDRESS', 'User chose to save current location as default');
                                    const saved = await saveAddressToBackend(addressName, cityName, zipCode, latitude, longitude);
                                    if (saved) {
                                        setBackendAddressAvailable(true);
                                        Logger.success('ADDRESS', 'Location saved successfully as default address');
                                    } else {
                                        Logger.error('ADDRESS', 'Failed to save location as default address');
                                        Alert.alert("Error", "Could not save your location.");
                                    }
                                }
                            }
                        ]
                    );
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
                const addressName = data.result.formatted_address || description;
                const cityName = data.result.address_components?.find((comp: any) => comp.types.includes("locality"))?.long_name || "";
                const zipCode = data.result.address_components?.find((comp: any) => comp.types.includes("postal_code"))?.long_name || "";
                Logger.success('PLACES_API', `Got coordinates: (${lat}, ${lng})`);
                setLat(lat);
                setLng(lng);
                setCity(cityName);
                setZip(zipCode);
                setStreet(addressName);
                
                // Always ask user if they want to save this address as default
                Alert.alert(
                    "Save as Default Address",
                    "Do you want to save this address as your default account address?",
                    [
                        {
                            text: "No",
                            onPress: () => {
                                Logger.info('ADDRESS', 'User chose not to save address as default');
                            },
                            style: "cancel"
                        },
                        {
                            text: "Yes",
                            onPress: async () => {
                                Logger.info('ADDRESS', 'User chose to save address as default');
                                const saved = await saveAddressToBackend(addressName, cityName, zipCode, lat, lng);
                                if (saved) {
                                    setBackendAddressAvailable(true);
                                    Logger.success('ADDRESS', 'Address saved as default');
                                } else {
                                    Logger.error('ADDRESS', 'Failed to save address as default');
                                    Alert.alert("Error", "Could not save your address.");
                                }
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            Logger.error('PLACES_API', 'Exception getting place details', error);
        }
    };

    // Handle map press to set marker and reverse geocode
    const handleMapPress = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        
        Logger.info('MAP', `Map pressed at: (${latitude}, ${longitude})`);
        setLat(latitude);
        setLng(longitude);
        
        // Reverse geocode to get address
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${configs.MAPS_API_KEY}`;
            Logger.request(url, 'GET');
            
            const response = await fetch(url);
            const data = await response.json();
            
            Logger.response(url, response.status);
            
            if (data.results && data.results.length > 0) {
                const addressName = data.results[0].formatted_address;
                const cityName = data.results[0].address_components?.find((comp: any) => comp.types.includes("locality"))?.long_name || "";
                const zipCode = data.results[0].address_components?.find((comp: any) => comp.types.includes("postal_code"))?.long_name || "";
                Logger.success('MAP', `Reverse geocoded: ${addressName}`);
                setAddressInput(addressName);
                setStreet(addressName);
                setCity(cityName);
                setZip(zipCode);
                
                // Always ask user if they want to save this address as default
                Alert.alert(
                    "Save as Default Address",
                    "Do you want to save this location as your default account address?",
                    [
                        {
                            text: "No",
                            onPress: () => {
                                Logger.info('ADDRESS', 'User chose not to save map location as default');
                            },
                            style: "cancel"
                        },
                        {
                            text: "Yes",
                            onPress: async () => {
                                Logger.info('ADDRESS', 'User chose to save map location as default');
                                const saved = await saveAddressToBackend(addressName, cityName, zipCode, latitude, longitude);
                                if (saved) {
                                    setBackendAddressAvailable(true);
                                    Logger.success('ADDRESS', 'Map location saved successfully as default address');
                                } else {
                                    Logger.error('ADDRESS', 'Failed to save map location as default address');
                                    Alert.alert("Error", "Could not save your location.");
                                }
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            Logger.error('MAP', 'Exception reverse geocoding map location', error);
        }
    };

    const handleDatePicker = () => {
        setShowDatePicker(true);
        Logger.info('DATE', 'Date picker opened');
    };

    const handleDateChange = (event: any, selectedDate: Date | undefined) => {
        if (selectedDate) {
            setAvailableTo(selectedDate);
            Logger.info('DATE', `Date changed: ${selectedDate.toISOString().split('T')[0]}`);
        }
        setShowDatePicker(false);
    };

    const handleAddOffer = async () => {
        // Collect missing field details
        const missingFields: string[] = [];
        if (!name) missingFields.push("• Item name");
        if (!type) missingFields.push("• Type of food");
        if (!price) missingFields.push("• Price");
        if (!quantity) missingFields.push("• Quantity");
        if (!unit) missingFields.push("• Unit");
        if (!image) missingFields.push("• Image");
        if (!availableTo) missingFields.push("• Available until date");
        if (!street || !city || !zip || !lat || !lng) {
            if (!lat || !lng) missingFields.push("• Location on map (press 'Use Current Position' or click the map)");
        }

        if (missingFields.length > 0) {
            const missingMessage = missingFields.join("\n");
            Logger.debug('OFFER', `Validation failed - Missing fields: ${JSON.stringify(missingFields)}`);
            Alert.alert(
                "Missing Required Fields",
                `Please complete the following before submitting:\n\n${missingMessage}`,
                [{ text: "OK" }]
            );
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
                availableTo: availableTo.toISOString().split('T')[0], // Format as yyyy-MM-dd
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
        setAvailableTo(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
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
        <ScreenBackground>
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
                    <Text style={{ alignSelf: "flex-start", marginBottom: 8 }}>Item available until:</Text>
                    <TouchableOpacity
                        onPress={handleDatePicker}
                        style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            borderRadius: 6,
                            padding: 12,
                            marginBottom: 12,
                            width: "100%",
                            backgroundColor: "#fff",
                            justifyContent: "center"
                        }}
                    >
                        <Text style={{ fontSize: 16, color: "#333" }}>
                            {availableTo.toISOString().split('T')[0]}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={availableTo}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                        />
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 12 }}>
                        <Text style={{ marginRight: 8 }}>Use my address</Text>
                        <Switch
                            value={autofillAddressSwitch}
                            onValueChange={handleAutofillSwitch}
                            disabled={loadingAddress}
                        />
                        {loadingAddress && <ActivityIndicator size="small" color="#2196F3" style={{ marginLeft: 8 }} />}
                    </View>
                    {(!autofillAddressSwitch || (autofillAddressSwitch && !backendAddressAvailable)) && (
                        <>
                            <Text style={{ alignSelf: "flex-start", fontWeight: "bold", marginBottom: 8 }}>Address:</Text>
                            
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
                                <MapView
                                    style={{ flex: 1 }}
                                    region={{
                                        latitude: lat || 37.78825,
                                        longitude: lng || -122.4324,
                                        latitudeDelta: 0.0922,
                                        longitudeDelta: 0.0421,
                                    }}
                                    onPress={handleMapPress}
                                >
                                    {lat !== 0 && lng !== 0 && (
                                        <Marker
                                            coordinate={{ latitude: lat, longitude: lng }}
                                            title="Selected Location"
                                            description={street || "Tap on map to set location"}
                                        />
                                    )}
                                </MapView>
                            </View>
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
                    <TouchableOpacity
                        onPress={handleAddOffer}
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
                                Add Offer
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenBackground>
    );
};

export default AddItemScreen;