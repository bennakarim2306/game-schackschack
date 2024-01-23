import { useContext, useState } from "react";
import { View, Button, Text, TextInput, SafeAreaView, TouchableWithoutFeedback, Keyboard } from "react-native";
import loginStyles from "../styles/LoginStyles";
import AuthContext from "../Contexts/AuthContext";


// here will come the props for the Login View
const loginProps = {}

const Login = ({route, navigation}) => {
    const { signIn } = useContext(AuthContext)
    const [email, setEmail] = useState("nothing")
    const [password, setPassword] = useState("no password")
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={loginStyles.loginViewStyle}>
                <Text
                    style={loginStyles.textStyle}>
                    Email
                </Text>
                <TextInput
                    style={loginStyles.textInputStyle}
                    onChangeText={(text) => setEmail(text)}
                    placeholder="type something here"
                    autoComplete="email"
                // defaultValue="text input for userName"
                >
                </TextInput>
                <Text
                    style={loginStyles.textStyle}>
                    Password
                </Text>
                <TextInput
                    style={loginStyles.textInputStyle}
                    onChangeText={(text) => setPassword(text)}
                    placeholder="type something here"
                    autoComplete="password"
                    inputMode="email"
                // defaultValue="text input for password"
                >
                </TextInput>
                <View
                    style={loginStyles.buttonStyle}>
                    <Button
                        title="Login here"
                        onPress={() => signIn({email, password})}
                        disabled={false}
                    />
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

export default Login;