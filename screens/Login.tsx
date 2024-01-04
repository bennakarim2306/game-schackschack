import { useContext, useState } from "react";
import { View, Button, Text, TextInput, SafeAreaView, TouchableWithoutFeedback, Keyboard } from "react-native";
import loginStyles from "../styles/LoginStyles";
import AuthContext from "../Contexts/AuthContext";


// here will come the props for the Login View
const loginProps = {}

const Login = ({route, navigation}) => {
    const { signIn } = useContext(AuthContext)
    const [userName, setUserName] = useState("nothing")
    const [Password, setPassword] = useState("no password")
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={loginStyles.loginViewStyle}>
                <Text
                    style={loginStyles.textStyle}>
                    User name
                </Text>
                <TextInput
                    style={loginStyles.textInputStyle}
                    onChangeText={(text) => setUserName(text)}
                    placeholder="type something here"
                // defaultValue="text input for userName"
                >
                </TextInput>
                <Text
                    style={loginStyles.textStyle}>
                    Password
                </Text>
                <TextInput
                    style={loginStyles.textInputStyle}
                    onChangeText={(text) => setUserName(text)}
                    placeholder="type something here"
                // defaultValue="text input for password"
                >
                </TextInput>
                <View
                    style={loginStyles.buttonStyle}>
                    <Button
                        title="Login here"
                        onPress={() => signIn({userName, Password})}
                        disabled={false}
                    />
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

export default Login;