import { Button, Keyboard, Text, TextInput, TextInputProps, View } from "react-native";
import registerAccountStyles from "../styles/RegisterAccountStyles";
import { useContext, useState } from "react";
import AuthContext from "../Contexts/AuthContext";


const RegisterAccount = () => {
    const { signUp } = useContext(AuthContext)
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
                Email
            </Text>
            <TextInput
                style={registerAccountStyles.textInputStyle}
                onChangeText={(text) => setEmail(text)}
                placeholder="type something here"
                autoComplete="email"
                inputMode="email"
            // defaultValue="text input for userName"
            />
            <Text style={registerAccountStyles.textStyle}>
                Password
            </Text>
            <TextInput
                style={{...registerAccountStyles.textInputStyle}}
                onChangeText={(text) => setPassword(text)}
                secureTextEntry={true}
                placeholder="type something here"
                autoComplete="password"
            // defaultValue="text input for userName"
            />
            <View style={registerAccountStyles.buttonStyle}>
                <Button
                title='Register new account'
                onPress={() => signUp({ firstName, lastName, email, password })} />
            </View>
        </View>
    );
}

export default RegisterAccount;