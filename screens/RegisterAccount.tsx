import { Button, Keyboard, KeyboardAvoidingView, Pressable, Text, TextInput, TextInputProps, TouchableWithoutFeedback, View } from "react-native";
import registerAccountStyles from "../styles/RegisterAccountStyles";
import { useContext, useState } from "react";
import AuthContext from "../Contexts/AuthContext";
import loginStyles from "../styles/LoginStyles";

type RegisterData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

const RegisterAccount = () => {
    const auth = useContext(AuthContext);
    if (!auth) {
        throw new Error("AuthContext is null. Make sure you are within an AuthProvider.");
    }
    const { signUp } = auth as { signUp: (data: RegisterData) => void };
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [firstNameError, setFirstNameError] = useState("")
    const [lastNameError, setLastNameError] = useState("")
    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [showPassword, setShowPassword] = useState(false);

    function validateFirstName(name: string) {
        return name.trim().length > 0;
    }

    function validateLastName(name: string) {
        return name.trim().length > 0;
    }

    function validateEmail(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePassword(password: string) {
        return password.length >= 6;
    }

    const handleFirstNameChange = (text: string) => {
        setFirstName(text);
        setFirstNameError(validateFirstName(text) ? "" : "First name is required");
    };

    const handleLastNameChange = (text: string) => {
        setLastName(text);
        setLastNameError(validateLastName(text) ? "" : "Last name is required");
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        setEmailError(validateEmail(text) ? "" : "Invalid email address");
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        setPasswordError(validatePassword(text) ? "" : "Password must be at least 6 characters");
    };

    const handleRegister = () => {
        // Trim all input values before validation and submission
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedEmail = email.trim();
        const trimmedPassword = password; // Passwords usually shouldn't be trimmed

        const firstNameValid = validateFirstName(trimmedFirstName);
        const lastNameValid = validateLastName(trimmedLastName);
        const emailValid = validateEmail(trimmedEmail);
        const passwordValid = validatePassword(trimmedPassword);

        setFirstNameError(firstNameValid ? "" : "First name is required");
        setLastNameError(lastNameValid ? "" : "Last name is required");
        setEmailError(emailValid ? "" : "Invalid email address");
        setPasswordError(passwordValid ? "" : "Password must be at least 6 characters");

        if (firstNameValid && lastNameValid && emailValid && passwordValid) {
            // Use the RegisterData type for signUp
            signUp({
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                email: trimmedEmail,
                password: trimmedPassword
            });
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
                        onChangeText={handleFirstNameChange}
                        value={firstName}
                        placeholder="type your first name"
                        accessibilityLabel="First name input"
                        returnKeyType="next"
                        textContentType="givenName"
                        autoCapitalize="words"
                    />
                    {firstNameError ? (
                        <Text style={registerAccountStyles.validationErrorText} accessibilityLiveRegion="polite">{firstNameError}</Text>
                    ) : null}

                    <Text style={registerAccountStyles.textStyle}>
                        Lastname
                    </Text>
                    <TextInput
                        style={registerAccountStyles.textInputStyle}
                        onChangeText={handleLastNameChange}
                        value={lastName}
                        placeholder="type your last name"
                        accessibilityLabel="Last name input"
                        returnKeyType="next"
                        textContentType="familyName"
                        autoCapitalize="words"
                    />
                    {lastNameError ? (
                        <Text style={registerAccountStyles.validationErrorText} accessibilityLiveRegion="polite">{lastNameError}</Text>
                    ) : null}

                    <Text style={registerAccountStyles.textStyle}>
                        Email
                    </Text>
                    <TextInput
                        style={registerAccountStyles.textInputStyle}
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
                        <Text style={registerAccountStyles.validationErrorText} accessibilityLiveRegion="polite">{emailError}</Text>
                    ) : null}

                    <Text style={registerAccountStyles.textStyle}>
                        Password
                    </Text>
                    <View style={registerAccountStyles.rowInputContainer}>
                        <TextInput
                            onChangeText={handlePasswordChange}
                            value={password}
                            secureTextEntry={!showPassword}
                            placeholder="type your password"
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
                        <Button
                            title='Register new account'
                            onPress={handleRegister}
                            disabled={
                                !firstName ||
                                !lastName ||
                                !email ||
                                !password ||
                                !!firstNameError ||
                                !!lastNameError ||
                                !!emailError ||
                                !!passwordError
                            }
                        />
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

export default RegisterAccount;