import { Platform, StatusBar, StyleSheet } from "react-native";

const welcomeStyles = StyleSheet.create({
    welcomeContainerStyle: {
        backgroundColor: 'white',
        width: "100%",
        height: "100%",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: "50%"
    },
    buttonStyle: {
        width: "65%",
    },
    textStyle: {
        fontSize: 50,
        alignSelf: "center",
        color: "#18B76C",
        fontWeight: "800"
    }
})

export default welcomeStyles;