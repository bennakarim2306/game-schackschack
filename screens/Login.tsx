import { useContext, useState } from "react";
import { View, Button, Text, TextInput, SafeAreaView, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Pressable } from "react-native";
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
    const [showPassword, setShowPassword] = useState(false);

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
        const trimmedEmail = email.trim();
        const passwordValue = password; // Don't trim password
        const emailValid = validateEmail(trimmedEmail);
        const passwordValid = validatePassword(passwordValue);
        setEmailError(emailValid ? "" : "Invalid email address");
        setPasswordError(passwordValid ? "" : "Password must be at least 6 characters");
        if (emailValid && passwordValid) {
            signIn({ email: trimmedEmail, password: passwordValue });
        }
    };

    const isDisabled =
        !email ||
        !password ||
        !!emailError ||
        !!passwordError;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <SafeAreaView style={loginStyles.loginViewStyle}>
                    <Text style={loginStyles.textStyle}>
                        Email
                    </Text>
                    <TextInput
                        style={loginStyles.textInputStyle}
                        onChangeText={handleEmailChange}
                        value={email}
                        placeholder="type your email"
                        accessibilityLabel="Email input"
                        returnKeyType="next"
                        textContentType="emailAddress"
                        autoCapitalize="none"
                        autoComplete="email"
                        inputMode="email"
                        keyboardType="email-address"
                    />
                    {emailError ? (
                        <Text style={loginStyles.validationErrorText} accessibilityLiveRegion="polite">{emailError}</Text>
                    ) : null}
                    <Text style={loginStyles.textStyle}>
                        Password
                    </Text>
                    <View style={loginStyles.rowInputContainer}>
                        <TextInput
                            onChangeText={handlePasswordChange}
                            value={password}
                            placeholder="type your password"
                            accessibilityLabel="Password input"
                            returnKeyType="done"
                            textContentType="password"
                            autoCapitalize="none"
                            autoComplete="password"
                            secureTextEntry={!showPassword}
                        />
                        <Pressable
                            onPress={() => setShowPassword((prev) => !prev)}
                            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                            style={loginStyles.showPasswordButton}
                        >
                            <Text style={loginStyles.showPasswordText}>
                                {showPassword ? "Hide" : "Show"}
                            </Text>
                        </Pressable>
                    </View>
                    {passwordError ? (
                        <Text style={loginStyles.validationErrorText} accessibilityLiveRegion="polite">{passwordError}</Text>
                    ) : null}
                    <View style={loginStyles.buttonStyle}>
                        <Pressable
                            onPress={handleLogin}
                            disabled={isDisabled}
                            style={({ pressed }) => [
                                loginStyles.loginButton,
                                isDisabled
                                    ? loginStyles.loginButtonDisabled
                                    : loginStyles.loginButtonEnabled,
                                pressed && !isDisabled && { opacity: 0.7 }
                            ]}
                        >
                            <Text style={loginStyles.loginButtonText}>
                                Login here
                            </Text>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

export default Login;