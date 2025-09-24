import React, { useState } from "react";
import { ScrollView, Text, TextInput, Button, Alert, Image, TouchableOpacity, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";

const foodTypes = [
    "Vegetables",
    "Fruits",
    "Dairy",
    "Meat",
    "Bakery",
    "Other"
];

const units = ["kg", "g", "l", "pcs", "box"];

const AddItemScreen = () => {
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
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission required", "Camera roll permission is required!");
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images", // <-- fixed here
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start", alignItems: "center", padding: 24, marginTop: 0 }}>
            <TouchableOpacity onPress={pickImage} style={{ marginBottom: 16 }}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={{ width: 120, height: 90, borderRadius: 8 }} />
                ) : (
                    <View style={{ width: 120, height: 90, borderRadius: 8, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#888" }}>Tap to upload image</Text>
                    </View>
                )}
            </TouchableOpacity>
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