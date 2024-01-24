import { useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Alert, Button, FlatList, GestureResponderEvent, Text, TextInput, TouchableOpacity, View } from "react-native";
import FriendsContext from "../Contexts/FriendsContext";
import * as SecureStore from 'expo-secure-store'
import io from "socket.io-client";

const FriendsList = () => {
    // TODO implement a better typings
    const socket = useRef();
    const [contactToAdd, setContactToAdd] = useState("");
    const [contactToMessage, setContactToMesage] = useState("")
    const [messageToSend, setMessageToSend] = useState("")
    const [token, setToken] = useState("")
    const [messageReceived,setMessageReceived] = useState("")
     
    
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
            case 'SET_PRIVATE_MESSAGE': {
                return {
                    ...prevState,
                    message: prevState.message == null ? action.message : prevState.message + "\n" + action.message
                }
            }

        }
    }, {
        friendsList: [],
        message: null
    });

    useEffect(() => {
        console.log("USE EFFECT USE EFFECT |||||||||||||||||")
        const getFriendsList = async () => {
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
                    socket.current = io("http://192.168.1.21:3000")
                    socket.current.on("response from server", message => console.log("Received socket message from backend " + message))
                    socket.current.on("private-message-from-server", message => {
                        dispatch({type: "SET_PRIVATE_MESSAGE", message: message.from.sub + ": " + message.message})
                    })
                    socket.current.emit("register-client", {token: token})
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

    const submitMessage = () => {
        // socket.on("response from server", message => console.log("Received socket message from backend " + message))
        socket.current.emit("private-message", {token: token, to: contactToMessage, message: messageToSend})
        setMessageToSend("")
    }

    return (
        <FriendsContext.Provider value={friendsContext}>
            <FlatList
                data={state.friendsList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        key={item.email}
                        onPress={event => {
                            console.log(`selected contact ${item.email}`)
                            setContactToMesage(item.email)
                        }}>
                        <Text>
                            {item.email}
                        </Text>
                    </TouchableOpacity>)}>
            </FlatList>
            <Text>
                    {state.message}
                </Text>
            <TextInput
                style={{}}
                onChangeText={(text) => setMessageToSend(text)}
                placeholder="type something here"
                value={messageToSend}
            // defaultValue="text input for userName"
            />
            <Button
                        title="Add a friend"
                        onPress={() => submitMessage()}
                        disabled={false}
                    />
        </FriendsContext.Provider>

    );
}

export default FriendsList;