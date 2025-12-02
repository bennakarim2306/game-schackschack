import { Platform, StatusBar, StyleSheet } from "react-native";


const loginStyles = StyleSheet.create({
    loginViewStyle: {
        // backgroundColor: '#D9F2D9',
        width: "100%",
        height: "100%",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        justifyContent: "space-around"
    },
    textInputStyle: {
        alignSelf: "center"
    },
    titleStyle: {
        alignSelf: "center",
        fontSize: 70,
        fontFamily: "sans‑serif‑medium",
        fontWeight: "bold",
        color: "#1c1d1cff",
        textShadowColor: '#18B76C',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 1,
    },
    textStyle: {
        alignSelf: "center",
        color: "#036839ff",
        fontSize: 30,
        fontFamily: "sans-serif-condensed",
        fontWeight: "bold"
    },
    buttonStyle: {
        margin: "10%"
    },
    validationErrorText: {
        alignSelf: "center",
        marginBottom: 8,
        color: "red"
    },
    showPasswordButton: {
        marginLeft: 8,
        padding: 4
    },
    showPasswordText: {
        color: "#007AFF",
        flex: 3
    },
    rowInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center"
    },
    loginButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    loginButtonEnabled: {
        backgroundColor: "#007AFF",
    },
    loginButtonDisabled: {
        backgroundColor: "#cccccc",
    },
    loginButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    inputBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
})

export default loginStyles;