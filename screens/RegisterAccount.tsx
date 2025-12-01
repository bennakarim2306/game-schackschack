import { Button, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, TextInputProps, TouchableWithoutFeedback, View, ActivityIndicator } from "react-native";
import registerAccountStyles from "../styles/RegisterAccountStyles";
import { useContext, useState } from "react";
import AuthContext from "../Contexts/AuthContext";
import loginStyles from "../styles/LoginStyles";

type RegisterData = {
    email: string;
    password: string;
};

const RegisterAccount = () => {
    const auth = useContext(AuthContext);
    if (!auth) {
        throw new Error("AuthContext is null. Make sure you are within an AuthProvider.");
    }
    const { signUp } = auth as { signUp: (data: RegisterData) => void };
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    function validateEmail(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePassword(password: string) {
        return password.length >= 6;
    }

    const handleEmailChange = (text: string) => {
        setEmail(text);
        setEmailError(validateEmail(text) ? "" : "Invalid email address");
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        setPasswordError(validatePassword(text) ? "" : "Password must be at least 6 characters");
    };

    const handleRegister = async () => {
        // Trim all input values before validation and submission
        const trimmedEmail = email.trim();
        const trimmedPassword = password; // Passwords usually shouldn't be trimmed

        const emailValid = validateEmail(trimmedEmail);
        const passwordValid = validatePassword(trimmedPassword);

        setEmailError(emailValid ? "" : "Invalid email address");
        setPasswordError(passwordValid ? "" : "Password must be at least 6 characters");

        if (emailValid && passwordValid) {
            setIsRegistering(true);
            try {
                // Use the RegisterData type for signUp
                await signUp({
                    email: trimmedEmail,
                    password: trimmedPassword
                });
            } finally {
                setIsRegistering(false);
            }
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={registerAccountStyles.registerViewStyle}>
                    <View >
                        <Text style={registerAccountStyles.titleStyle}>Account</Text>
                        <Text style={registerAccountStyles.titleStyle}> registration</Text>
                    </View>

                    <Text style={registerAccountStyles.textStyle}>
                        Email
                    </Text>
                    <TextInput
                        style={[
                            registerAccountStyles.textInputStyle,
                            { borderColor: '#666', backgroundColor: '#fff', padding: 12, borderRadius: 6 }
                        ]}
                        onChangeText={handleEmailChange}
                        value={email}
                        placeholder="type your email"
                        placeholderTextColor="#999"
                        accessibilityLabel="Email input"
                        returnKeyType="next"
                        textContentType="emailAddress"
                        autoCapitalize="none"
                        autoComplete="email"
                        inputMode="email"
                        keyboardType="email-address"
                    />
                    {emailError ? (
                        <Text style={registerAccountStyles.validationErrorText} accessibilityLiveRegion="polite">{emailError}</Text>
                    ) : null}

                    <Text style={registerAccountStyles.textStyle}>
                        Password
                    </Text>
                    <View style={[
                        registerAccountStyles.rowInputContainer,
                        {borderColor: '#666', backgroundColor: '#fff', borderRadius: 6 }
                    ]}>
                        <TextInput
                            style={{ flex: 1, padding: 12, fontSize: 16 }}
                            onChangeText={handlePasswordChange}
                            value={password}
                            secureTextEntry={!showPassword}
                            placeholder="type your password"
                            placeholderTextColor="#999"
                            accessibilityLabel="Password input"
                            returnKeyType="done"
                            textContentType="password"
                            autoCapitalize="none"
                            autoComplete="password"
                        />
                        <Pressable
                            onPress={() => setShowPassword((prev) => !prev)}
                            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                            style={registerAccountStyles.showPasswordButton}
                        >
                            <Text style={registerAccountStyles.showPasswordText}>
                                {showPassword ? "Hide" : "Show"}
                            </Text>
                        </Pressable>
                    </View>
                    {passwordError ? (
                        <Text style={registerAccountStyles.validationErrorText} accessibilityLiveRegion="polite">{passwordError}</Text>
                    ) : null}

                    <View style={registerAccountStyles.buttonStyle}>
                        <Pressable
                            onPress={handleRegister}
                            disabled={
                                isRegistering ||
                                !email ||
                                !password ||
                                !!emailError ||
                                !!passwordError
                            }
                            style={({ pressed }) => ([
                                {
                                    backgroundColor: (isRegistering || !email || !password || !!emailError || !!passwordError) ? '#ccc' : '#2196F3',
                                    padding: 16,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    opacity: pressed && !isRegistering ? 0.7 : 1
                                }
                            ])}
                        >
                            {isRegistering ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Register new account</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

export default RegisterAccount;