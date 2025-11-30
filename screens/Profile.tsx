import { Keyboard, Text, TouchableWithoutFeedback, View, TextInput, Button, Switch } from "react-native";
import ProfileStyles from "../styles/ProfileStyles";
import React, { useState, useContext } from "react";
import AuthContext from '../Contexts/AuthContext';

const Profile = () => {
    const [username, setUsername] = useState("myName");
    const [email, setEmail] = useState("myemail@example.com");
    const [registrationDate] = useState("dd/mm/yyyy");
    const [password, setPassword] = useState("*******");
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const authContext = useContext(AuthContext);

    const handleSave = () => {
        // Save logic here (API call, local storage, etc.)
        alert("Profile updated!");
    };

    const handleLogout = () => {
        if (authContext && authContext.signOut) {
            authContext.signOut();
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={ProfileStyles.profileViewStyle}>
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

                <Button title="Save Changes" onPress={handleSave} />

                <View style={{ marginTop: 24 }}>
                    <Button title="Log Out" color="#d9534f" onPress={handleLogout} />
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default Profile;