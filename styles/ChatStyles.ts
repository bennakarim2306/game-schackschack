import { StyleSheet } from "react-native";


const chatStyles = StyleSheet.create({
    chatTextBox: {
        
    },
    chatTimetext: {
        alignSelf: 'flex-end',
        width: "70%"
    },
    chatText: {
        alignSelf: 'flex-end',
        borderWidth: 1,
        flexWrap: "wrap",
        backgroundColor: "white",
        width: "70%",
        borderRadius: 4,
        padding: 10,
        margin: 1
    }
})

export default chatStyles;