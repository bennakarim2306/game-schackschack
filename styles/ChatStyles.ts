import { StyleSheet } from "react-native";


const ChatStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        padding: 12
    },
    chatList: {
        flex: 1,
        marginBottom: 8
    },
    chatTextBox: {
        marginVertical: 6,
        maxWidth: "80%",
        borderRadius: 12,
        padding: 10,
        alignSelf: "flex-start",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    sentBox: {
        backgroundColor: "#e3fcec",
        alignSelf: "flex-end"
    },
    receivedBox: {
        backgroundColor: "#fff",
        alignSelf: "flex-start"
    },
    chatText: {
        fontSize: 16,
        paddingVertical: 2
    },
    sentText: {
        color: "#2196F3"
    },
    receivedText: {
        color: "#333"
    },
    chatTimetext: {
        fontSize: 12,
        color: "#888",
        marginBottom: 2,
        alignSelf: "flex-end"
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderTopWidth: 1,
        borderColor: "#e0e0e0",
        backgroundColor: "#fff"
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#bdbdbd",
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginRight: 8,
        backgroundColor: "#f5f5f5"
    },
    emptyText: {
        color: "#888",
        alignSelf: "center",
        marginTop: 32
    }
});

export default ChatStyles;