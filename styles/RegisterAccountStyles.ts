import { Platform, StatusBar, StyleSheet } from "react-native";

const registerAccountStyles = StyleSheet.create({
    registerViewStyle:{
        backgroundColor: 'white',
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
        fontSize: 26,
        fontFamily: "sans-serif-condensed",
        fontWeight: "bold"
    },
    buttonStyle: {
        margin: "10%"
    },
    titleStyle: {
        alignSelf: "center",
        fontSize: 50,
        fontWeight: "600",
        color: "#18B76C"
    },
    validationErrorText: {
        alignSelf: "center",
        marginBottom: 8,
        color: "red"
    }
})

export default registerAccountStyles;