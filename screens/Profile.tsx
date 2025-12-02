import { Keyboard, Text, TouchableWithoutFeedback, View, TextInput, Button, Switch, ActivityIndicator, Pressable, ImageBackground } from "react-native";
import ProfileStyles from "../styles/ProfileStyles";
import React, { useState, useContext } from "react";
import AuthContext from '../Contexts/AuthContext';

const Profile = () => {
    const [username, setUsername] = useState("myName");
    const [email, setEmail] = useState("myemail@example.com");
    const [registrationDate] = useState("dd/mm/yyyy");
    const [password, setPassword] = useState("*******");
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
                <View style={[ProfileStyles.profileViewStyle, { backgroundColor: 'rgba(217, 242, 217, 0.85)' }]}>
                <Text style={ProfileStyles.profileHeaderStyle}>Profile Settings</Text>

                <Text style={ProfileStyles.profileKeyStyle}>Username</Text>
                <TextInput
                    style={ProfileStyles.profileInputStyle}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <Text style={ProfileStyles.profileKeyStyle}>Email</Text>
                <TextInput
                    style={ProfileStyles.profileInputStyle}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={ProfileStyles.profileKeyStyle}>Registration date</Text>
                <Text style={ProfileStyles.profileValueStyle}>{registrationDate}</Text>

                <Text style={ProfileStyles.profileKeyStyle}>Password</Text>
                <TextInput
                    style={ProfileStyles.profileInputStyle}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 12 }}>
                    <Text style={ProfileStyles.profileKeyStyle}>Enable Notifications</Text>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        style={{ marginLeft: 12 }}
                    />
                </View>

                <Pressable
                    onPress={handleSave}
                    disabled={isSaving}
                    style={({ pressed }) => ([
                        {
                            backgroundColor: isSaving ? '#ccc' : '#2196F3',
                            padding: 16,
                            borderRadius: 8,
                            alignItems: 'center',
                            marginVertical: 12,
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
        </ImageBackground>
    );
};

export default Profile;