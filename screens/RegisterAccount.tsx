import { Keyboard, Text, TextInput, TextInputProps, View } from "react-native";
import registerAccountStyles from "../styles/RegisterAccountStyles";
import { useState } from "react";


const RegisterAccount = () => {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    return (
        <View style={registerAccountStyles.registerViewStyle}>
            <View >
            <Text style={registerAccountStyles.titleStyle}>Account</Text>
            <Text style={registerAccountStyles.titleStyle}> registration</Text>
            </View>

            <Text style={registerAccountStyles.textStyle}>
                Firstname
            </Text>
            <TextInput
                style={registerAccountStyles.textInputStyle}
                onChangeText={(text) => setFirstName(text)}
                placeholder="type something here"
                // defaultValue="text input for userName"
            />
            <Text style={registerAccountStyles.textStyle}>
                Lastname
            </Text>
            <TextInput
                style={registerAccountStyles.textInputStyle}
                onChangeText={(text) => setLastName(text)}
                placeholder="type something here"
                // defaultValue="text input for userName"
                />
            <Text style={registerAccountStyles.textStyle}>
                Password
            </Text>
            <TextInput
                style={registerAccountStyles.textInputStyle}
                onChangeText={(text) => setEmail(text)}
                placeholder="type something here"
                // defaultValue="text input for userName"
                />
            <Text style={registerAccountStyles.textStyle}>
                Email
            </Text>
            <TextInput
                style={registerAccountStyles.textInputStyle}
                onChangeText={(text) => setPassword(text)}
                placeholder="type something here"
                // defaultValue="text input for userName"
                />
        </View>
    );
}

export default RegisterAccount;