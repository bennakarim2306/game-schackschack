import { useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Alert, Button, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import FriendsContext from "../Contexts/FriendsContext";
import * as SecureStore from 'expo-secure-store'
import io from "socket.io-client";

const FriendsList = () => {
    // TODO implement a better typings
    const socket = useRef();
    const [contactToAdd, setContactToAdd] = useState("");
    
    
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
        friendsList: []
    });

    useEffect(() => {
        console.log("USE EFFECT USE EFFECT |||||||||||||||||")
        const getFriendsList = async () => {
            const token = await SecureStore.getItemAsync("userToken");
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
        socket.current.emit("message", contactToAdd)
    }

    return (
        <FriendsContext.Provider value={friendsContext}>
            <FlatList
                data={state.friendsList}
                renderItem={({ item }) => (
                    <TouchableOpacity>
                        <Text>
                            {item.email}
                        </Text>
                    </TouchableOpacity>)}>
                <TouchableOpacity>
                    <Text>
                        here is the new view
                    </Text>
                </TouchableOpacity>
            </FlatList>
            <TextInput
                style={{}}
                onChangeText={(text) => setContactToAdd(text)}
                placeholder="type something here"
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