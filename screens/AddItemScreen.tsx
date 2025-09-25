import React, { useState, useLayoutEffect } from "react";
import { ScrollView, Text, TextInput, Button, Alert, Image, TouchableOpacity, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";

const foodTypes = [
    "Vegetables",
    "Fruits",
    "Dairy",
    "Meat",
    "Bakery",
    "Other"
];

const units = ["kg", "g", "l", "pcs", "box"];

type RootStackParamList = {
    AddItemScreen: undefined;
    MyOffersScreen: undefined;
    // add other screens here if needed
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

    const handleAddOffer = () => {
        if (!name || !price || !quantity || !street || !city || !zip) {
            Alert.alert("Missing fields", "Please fill in all required fields.");
            return;
        }
        // Here you would send the offer to your backend or update local state
        Alert.alert(
            "Offer Added",
            `Your offer for ${name} has been added!`,
            [{ text: "OK" }]
        );
        // Optionally reset form
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

    // Add label handler
    const handleAddLabel = () => {
        const trimmed = labelInput.trim();
        if (trimmed && labels.length < 5 && !labels.includes(trimmed)) {
            setLabels([...labels, trimmed]);
            setLabelInput("");
        }
    };

    // Remove label handler
    const handleRemoveLabel = (labelToRemove: string) => {
        setLabels(labels.filter(label => label !== labelToRemove));
    };

    return (
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
            <TextInput
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12, width: "100%" }}
            />
            <Button title="Add Offer" onPress={handleAddOffer} />
        </ScrollView>
    );
};

export default AddItemScreen;