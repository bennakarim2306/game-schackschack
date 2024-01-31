import { MutableRefObject, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Alert, Button, FlatList, GestureResponderEvent, Text, TextInput, TouchableOpacity, View } from "react-native";
import FriendsContext from "../Contexts/FriendsContext";
import * as SecureStore from 'expo-secure-store'
import friendsListStyle from "../styles/FriendsListStyles";
import FriendsListStyles from "../styles/FriendsListStyles";

const FriendsList = ({ navigation, route }) => {
    // TODO implement a better typings
    const [contactToAdd, setContactToAdd] = useState("");
    const [token, setToken] = useState("")


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
            await fetch('http://192.168.1.21:8080/api/v1/account/friendsList', {
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


    return (
        <FriendsContext.Provider value={friendsContext}>
            <FlatList
                data={state.friendsList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        key={item.email}
                        onPress={event => {
                            // socket.current?.removeListener("private-message-from-server", socketPrivateMessageCB)
                            navigation.navigate("Chat", { messages: state.chat[item.email]?.messages, title: `Chat with ${item.email}`, contact: item.email })
                            //navigation.navigate("Chat", {contact: item.email, title: `Chat with ${item.email}`})
                        }}
                        style={FriendsListStyles.friendBox}>
                        <Text>
                            {item.email}
                        </Text>
                    </TouchableOpacity>)}>
            </FlatList>
            <Button
                title="Add a friend"
                onPress={() => { }}
                disabled={false}
            />
        </FriendsContext.Provider>

    );
}

export default FriendsList;