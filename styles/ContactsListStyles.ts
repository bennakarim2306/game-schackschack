import { StyleSheet } from "react-native";

const friendsListStyle = StyleSheet.create({
    friendBox: {
        height: 50,
        width: "99%",
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#90ee90',
        margin: 1,
        borderWidth: 1,
        borderRadius: 4,
        flexDirection: 'row'
    },
    friendBoxText: {

    },
    unreadMessagesNumber: {
        backgroundColor: 'red',
        textAlign: 'center',
        marginEnd: '2%',
        borderWidth: 1,
        borderRadius: 4,
        flex: 1
    },
    contactEmailStyle: {
        marginLeft: '25%',
        flex: 10
    }
});

export default friendsListStyle;