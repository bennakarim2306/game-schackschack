import { StyleSheet } from "react-native";

const ContactsListStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'rgba(217, 242, 217, 0.85)'
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#2196F3",
        marginBottom: 16,
        alignSelf: "center"
    },
    contactCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 16,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    avatar: {
        backgroundColor: "#e3f2fd",
        borderRadius: 25,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },
    avatarText: {
        fontSize: 18,
        color: "#2196F3",
        fontWeight: "bold"
    },
    contactEmail: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333"
    },
    contactUserName: {
        fontSize: 13,
        color: "#888"
    },
    unreadBadge: {
        backgroundColor: "#ff5252",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8
    },
    unreadBadgeText: {
        color: "#fff",
        fontSize: 13
    },
    emptyText: {
        color: "#888",
        alignSelf: "center",
        marginTop: 32
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center"
    },
    modalContainer: {
        backgroundColor: "#fff",
        padding: 28,
        borderRadius: 16,
        width: "85%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2196F3",
        marginBottom: 16
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "#bdbdbd",
        borderRadius: 8,
        padding: 10,
        width: "100%",
        marginBottom: 14,
        fontSize: 16,
        backgroundColor: "#f5f5f5"
    },
    modalError: {
        color: "#ff5252",
        marginBottom: 8
    },
    modalButtonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%"
    }
});

export default ContactsListStyles;