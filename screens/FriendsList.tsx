import { MutableRefObject, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Alert, Button, FlatList, GestureResponderEvent, Text, TextInput, TouchableOpacity, View } from "react-native";
import FriendsContext from "../Contexts/FriendsContext";
import * as SecureStore from 'expo-secure-store'
import FriendsListStyles from "../styles/FriendsListStyles";
import configs from "../config/AppConfig";
import { ChatContext, useChatContext } from "../Contexts/ChatContext";
import friendsListStyle from "../styles/FriendsListStyles";
import { useChatDispatchContext } from "../Contexts/ChatDisptachContext";

const FriendsList = ({ navigation, route }) => {
    // TODO implement a better typings
    const [contactToAdd, setContactToAdd] = useState("");
    const [token, setToken] = useState("")
    const chatState = useChatContext();
    const chatDispatch = useChatDispatchContext();

    // works but keeps reconnecting const socket = io("http://192.168.1.21:3000")
    const [state, dispatch] = useReducer((prevState, action) => {
        switch (action.type) {
            case 'FRIEND_ADDED':
                return {
                    ...prevState,
                    friendsList: prevState.friendsList.push(action.friend)
                }
            case 'FRIEND_REMOVED':
                return {
                    ...prevState,
                    friendsList: prevState.friendsList.filter(e => { e.userName != action.friend?.userName })
                }
            case 'FRIENDS_LIST_GATHERED':
                return {
                    ...prevState,
                    friendsList: action.friendsList
                }
        }
    }, {
        friendsList: [],
        message: null,
        chat: []
    });

    useEffect(() => {
        const getFriendsList = async () => {
            console.log(`FriendsList getFriendsList called`)
            const token = await SecureStore.getItemAsync("userToken");
            setToken(token)
            console.log(`Sending request to get friendsList with token ${JSON.stringify(token)}`)
            await fetch(configs.USER_AUTH_BASE_URL + configs.USER_AUTH_FRIENDS_LIST_PATH, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token
                },
                body: null,
            })
                .then(async response => {
                    const jsonResponse = await response.json();
                    console.log(`received response from server ${JSON.stringify(jsonResponse)}`)
                    // setSocket(io("http://192.168.1.21:3000"))
                    if (response.status !== 200) {
                        Alert.alert(
                            'issue with the friends list',
                            'We are sorry but something went wrong with \n the friends list call to backend.. please try it later!',
                            [{ text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel' }])
                    }
                    else {
                        console.log("received data from server for friends list: " + JSON.stringify(jsonResponse))
                        dispatch({ type: 'FRIENDS_LIST_GATHERED', friendsList: jsonResponse.friends });
                    }
                    console.log(`Calling socket IO`)

                })
                .catch(e => {
                    Alert.alert(
                        'Registration issue',
                        'We are sorry but something went wrong with \n the registration.. please try it later!',
                        [{ text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel' }])
                    console.error(`some error occured while calling friendsList request${e}`)
                })
        }
        getFriendsList()
    }, [])

    const friendsContext = useMemo(() => {

    }, [])

    const handleAddFriend = () => {
        Alert.prompt(
            "Add a friend",
            "send an invitation to a friend by email",
            [{text: 'Send', onPress:() =>  sendAFriendRequest()},
             {text: 'Cancel', onPress: () => null, style: 'cancel'}])
    }

    const sendAFriendRequest = () => {
        // TODO here a request needs to be sent to the server to add a friend
        console.log("FriendsList -- sendAFriendRequest -- a request to add a friend is sent")
    }

    const getNumberOfUnreadMessagesByChat = (chat) => {
        console.debug("FriendsList -- getNumberOfUnreadMessagesByChat -- for: " + JSON.stringify(chat))
        if (chat == null || chat.length == 0) {
            return 0
        }
        else {
            const unreadMessages = chat[0].messages.filter(e => e.read == false)
            return unreadMessages.length
        }
    }

    const setMessagesToRead = (email) => {
        console.debug("FriendsList -- setMessagesToRead -- " + email)
        chatDispatch({type: 'SET_MESSAGES_TO_READ', email: email})
    }

    return (
        <FriendsContext.Provider value={friendsContext}>
            <FlatList
                data={state.friendsList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        key={item.email}
                        onPress={event => {
                            // socket.current?.removeListener("private-message-from-server", socketPrivateMessageCB)
                            setMessagesToRead(item.email)
                            navigation.navigate("Chat", { title: `Chat with ${item.email}`, contact: item.email })
                            //navigation.navigate("Chat", {contact: item.email, title: `Chat with ${item.email}`})
                        }}
                        style={FriendsListStyles.friendBox}>
                        <Text
                            style={friendsListStyle.contactEmailStyle}>
                            {item.email}
                        </Text>
                        {getNumberOfUnreadMessagesByChat(chatState.chat.filter(e => e.contact == item.email)) == 0 ? 
                        null : <Text
                        style={friendsListStyle.unreadMessagesNumber}>
                        {getNumberOfUnreadMessagesByChat(chatState.chat.filter(e => e.contact == item.email))}
                    </Text>}
                        
                    </TouchableOpacity>)}>
            </FlatList>
            <Button
                title="Add a friend"
                onPress={() => handleAddFriend()}
                disabled={false}
            />
        </FriendsContext.Provider>

    );
}

export default FriendsList;