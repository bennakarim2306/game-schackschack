import { useContext, useState } from "react";
import { View, Button, Text, TextInput, SafeAreaView, TouchableWithoutFeedback, Keyboard } from "react-native";
import loginStyles from "../styles/LoginStyles";
import AuthContext from "../Contexts/AuthContext";


// here will come the props for the Login View
const loginProps = {}

function Login({ route, navigation }) {
    const { signIn } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    function validateEmail(email) {
        // Simple email regex for demonstration
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePassword(password) {
        // Example: password must be at least 6 characters
        return password.length >= 6;
    }

    const handleEmailChange = (text) => {
        setEmail(text);
        setEmailError(validateEmail(text) ? "" : "Invalid email address");
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        setPasswordError(validatePassword(text) ? "" : "Password must be at least 6 characters");
    };

    const handleLogin = () => {
        const emailValid = validateEmail(email);
        const passwordValid = validatePassword(password);
        setEmailError(emailValid ? "" : "Invalid email address");
        setPasswordError(passwordValid ? "" : "Password must be at least 6 characters");
        if (emailValid && passwordValid) {
            signIn({ email, password });
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={loginStyles.loginViewStyle}>
                <Text
                    style={loginStyles.textStyle}>
                    Email
                </Text>
                <TextInput
                    style={loginStyles.textInputStyle}
                    onChangeText={handleEmailChange}
                    value={email}
                    placeholder="type something here"
                    autoComplete="email"
                    inputMode="email"
                />
                {emailError ? (
                    <Text style={loginStyles.validationErrorText}>{emailError}</Text>
                ) : null}
                <Text
                    style={loginStyles.textStyle}>
                    Password
                </Text>
                <TextInput
                    style={loginStyles.textInputStyle}
                    onChangeText={handlePasswordChange}
                    value={password}
                    placeholder="type something here"
                    autoComplete="password"
                    inputMode="text"
                    secureTextEntry
                />
                {passwordError ? (
                    <Text style={loginStyles.validationErrorText}>{passwordError}</Text>
                ) : null}
                <View
                    style={loginStyles.buttonStyle}>
                    <Button
                        title="Login here"
                        onPress={() => signIn({ email, password })}
                        disabled={false} />
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

export default Login;