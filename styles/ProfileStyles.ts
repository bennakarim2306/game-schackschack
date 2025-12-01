import { StyleSheet } from "react-native";

const ProfileStyles = StyleSheet.create({
    profileViewStyle: {
        flex: 1,
        backgroundColor: "#D9F2D9",
        paddingHorizontal: 24,
        paddingTop: 32,
        alignItems: "center"
    },
    profileHeaderStyle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#009966",
        marginBottom: 24,
        alignSelf: "center"
    },
    profileKeyStyle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#009966",
        marginTop: 16,
        marginBottom: 4,
        alignSelf: "flex-start"
    },
    profileValueStyle: {
        fontSize: 15,
        color: "#333",
        marginBottom: 8,
        alignSelf: "flex-start"
    },
    profileInputStyle: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        marginBottom: 4,
        backgroundColor: "#f8f8f8"
    }
});

export default ProfileStyles;