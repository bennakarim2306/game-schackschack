import { Platform, StatusBar, StyleSheet } from "react-native";

const registerAccountStyles = StyleSheet.create({
    registerViewStyle: {
        // backgroundColor: '#D9F2D9',
        width: "100%",
        height: "100%",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        justifyContent: "space-around"
    },
    rowInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center"
    },
    textInputStyle: {
        alignSelf: "center"
    },
    textStyle: {
        alignSelf: "center",
        color: "#18B76C",
        fontSize: 35,
        fontFamily: "sans-serif-condensed",
        fontWeight: "bold"
    },
    buttonStyle: {
        margin: "10%"
    },
    titleStyle: {
        paddingTop: 20,
        alignSelf: "center",
        fontSize: 50,
        fontFamily: "sans‑serif‑medium",
        fontWeight: "bold",
        color: "#1c1d1cff",
        textShadowColor: '#18B76C',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 1,
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
    }
})

export default registerAccountStyles;