import { Keyboard, Text, TouchableWithoutFeedback, View, TextInput, Switch, ActivityIndicator, Pressable, ImageBackground, Modal } from "react-native";
import ProfileStyles from "../styles/ProfileStyles";
import React, { useState, useContext } from "react";
import AuthContext from '../Contexts/AuthContext';
import MapView, { Marker, Region } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import configs from "../config/AppConfig";

const Profile = () => {
    const [username, setUsername] = useState("myName");
    const [email] = useState("myemail@example.com");
    const [registrationDate] = useState("dd/mm/yyyy");
    const [address, setAddress] = useState("123 Main St, City");
    const [selectedAddress, setSelectedAddress] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<Region>({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
    });
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isEditUsernameOpen, setIsEditUsernameOpen] = useState(false);
    const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);

    const authContext = useContext(AuthContext);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save logic here (API call, local storage, etc.)
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert("Profile updated!");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            if (authContext && authContext.signOut) {
                await authContext.signOut();
            }
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/20251202_1542_Smiling Fruit Faces_remix_01kbfr2sr9enx805fare783vsa.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={[ProfileStyles.profileViewStyle, { backgroundColor: 'white' }]}>
                <Text style={ProfileStyles.profileHeaderStyle}>Profile Settings</Text>

                <Text style={ProfileStyles.profileKeyStyle}>Username</Text>
                <Text style={ProfileStyles.profileValueStyle}>{username}</Text>

                <Text style={ProfileStyles.profileKeyStyle}>Email</Text>
                <Text style={ProfileStyles.profileValueStyle}>{email}</Text>

                <Text style={ProfileStyles.profileKeyStyle}>Registration date</Text>
                <Text style={ProfileStyles.profileValueStyle}>{registrationDate}</Text>

                <Text style={ProfileStyles.profileKeyStyle}>Address</Text>
                <Text style={ProfileStyles.profileValueStyle}>{address}</Text>

                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 12 }}>
                    <Text style={ProfileStyles.profileKeyStyle}>Enable Notifications</Text>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        style={{ marginLeft: 12 }}
                    />
                </View>

                <Pressable
                    onPress={() => setIsEditModalVisible(true)}
                    style={({ pressed }) => ([
                        {
                            backgroundColor: '#2196F3',
                            padding: 16,
                            borderRadius: 8,
                            alignItems: 'center',
                            marginVertical: 12,
                            opacity: pressed ? 0.7 : 1
                        }
                    ])}
                >
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Edit Profile</Text>
                </Pressable>

                <Pressable
                    onPress={handleLogout}
                    disabled={isLoggingOut}
                    style={({ pressed }) => ([
                        {
                            backgroundColor: isLoggingOut ? '#ccc' : '#d9534f',
                            padding: 16,
                            borderRadius: 8,
                            alignItems: 'center',
                            marginTop: 12,
                            opacity: pressed && !isLoggingOut ? 0.7 : 1
                        }
                    ])}
                >
                    {isLoggingOut ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Log Out</Text>
                    )}
                </Pressable>
            </View>
            </TouchableWithoutFeedback>
            <Modal
                visible={isEditModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
                            <Text style={[ProfileStyles.profileHeaderStyle, { marginBottom: 12 }]}>Edit Profile</Text>

                            <Pressable
                                onPress={() => setIsEditUsernameOpen(prev => !prev)}
                                style={({ pressed }) => ([
                                    {
                                        backgroundColor: '#f1f1f1',
                                        padding: 12,
                                        borderRadius: 8,
                                        marginBottom: 10,
                                        opacity: pressed ? 0.8 : 1
                                    }
                                ])}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600' }}>Edit Username</Text>
                            </Pressable>
                            {isEditUsernameOpen && (
                                <View style={{ marginBottom: 12 }}>
                                    <Text style={ProfileStyles.profileKeyStyle}>New Username</Text>
                                    <TextInput
                                        style={ProfileStyles.profileInputStyle}
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                            )}

                            <Pressable
                                onPress={() => setIsEditAddressOpen(prev => !prev)}
                                style={({ pressed }) => ([
                                    {
                                        backgroundColor: '#f1f1f1',
                                        padding: 12,
                                        borderRadius: 8,
                                        marginBottom: 10,
                                        opacity: pressed ? 0.8 : 1
                                    }
                                ])}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600' }}>Edit Address</Text>
                            </Pressable>
                            {isEditAddressOpen && (
                                <View style={{ marginBottom: 12 }}>
                                    <Text style={ProfileStyles.profileKeyStyle}>Address</Text>
                                    <GooglePlacesAutocomplete
                                        placeholder="Search address"
                                        onPress={(data, details = null) => {
                                            const newAddress = data.description || '';
                                            setSelectedAddress(newAddress);
                                            setAddress(newAddress);
                                            if (details?.geometry?.location) {
                                                const { lat, lng } = details.geometry.location;
                                                setSelectedRegion({
                                                    latitude: lat,
                                                    longitude: lng,
                                                    latitudeDelta: 0.01,
                                                    longitudeDelta: 0.01
                                                });
                                            }
                                        }}
                                        fetchDetails
                                        query={{
                                            key: configs.MAPS_API_KEY,
                                            language: "pt"
                                        }}
                                        styles={{
                                            textInput: ProfileStyles.profileInputStyle as any,
                                            container: { flex: 0 }
                                        }}
                                    />
                                    <MapView
                                        style={{ height: 180, borderRadius: 8, marginTop: 12 }}
                                        region={selectedRegion}
                                    >
                                        <Marker
                                            coordinate={{
                                                latitude: selectedRegion.latitude,
                                                longitude: selectedRegion.longitude
                                            }}
                                        />
                                    </MapView>
                                </View>
                            )}

                            <Pressable
                                onPress={handleSave}
                                disabled={isSaving}
                                style={({ pressed }) => ([
                                    {
                                        backgroundColor: isSaving ? '#ccc' : '#2196F3',
                                        padding: 12,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        marginBottom: 10,
                                        opacity: pressed && !isSaving ? 0.7 : 1
                                    }
                                ])}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Save Changes</Text>
                                )}
                            </Pressable>

                            <Pressable
                                onPress={() => setIsEditModalVisible(false)}
                                style={({ pressed }) => ([
                                    {
                                        backgroundColor: '#e0e0e0',
                                        padding: 12,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        opacity: pressed ? 0.7 : 1
                                    }
                                ])}
                            >
                                <Text style={{ color: '#333', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ImageBackground>
    );
};

export default Profile;