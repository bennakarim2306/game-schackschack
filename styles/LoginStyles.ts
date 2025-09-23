import { Platform, StatusBar, StyleSheet } from "react-native";


const loginStyles = StyleSheet.create({
    loginViewStyle: {
        backgroundColor: 'white',
        width: "100%",
        height: "100%",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        justifyContent: "space-around"
    },
    textInputStyle: {
        alignSelf: "center"
    },
    textStyle: {
        alignSelf: "center",
        color: "#18B76C",
        fontSize: 26,
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
    }
})

export default loginStyles;