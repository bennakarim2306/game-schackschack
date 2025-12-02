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
        fontSize: 50,
        fontWeight: "600",
        color: "#18B76C"
    },
    textStyle: {
        alignSelf: "center",
        color: "#036839ff",
        fontSize: 50,
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
})

export default loginStyles;