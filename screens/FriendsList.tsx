import { useEffect, useMemo, useReducer, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import friendsContext from "../Contexts/FriendsContext";
import FriendsContext from "../Contexts/FriendsContext";

const FriendsList = ({userName}) => {
    // TODO implement a better typings
    const [state, dispatch] = useReducer((prevState, action: { type: 'FRIEND_ADDED' | 'FRIEND_REMOVED' | 'FRIENDS_LIST_GATHERED', friend?: { userName: string }, friendsList?: [] }) => {
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
        const getFriendsList = async (data) => {
            await fetch('http://192.168.1.21:8080/api/v1/account/friendsList', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.userName
                }),
            })
                .then(async response => {
                    console.log(`received response from server ${JSON.stringify(response)}`)
                    if (response.status !== 200) {
                        Alert.alert(
                            'issue with the friends list',
                            'We are sorry but something went wrong with \n the friends list call to backend.. please try it later!',
                            [{ text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel' }])
                    }
                    else {
                        const jsonResponse = await response.json();
                        console.log("received data from server for friends list: " + JSON.stringify(jsonResponse))
                        dispatch({ type: 'FRIENDS_LIST_GATHERED', friendsList: jsonResponse.friendsList });
                    }
                })
                .catch(e => {
                    Alert.alert(
                        'Registration issue',
                        'We are sorry but something went wrong with \n the registration.. please try it later!',
                        [{ text: 'Ok', onPress: () => console.log('Cancel Pressed'), style: 'cancel' }])
                    console.error(`some error occured while registration request${e}`)
                })
        }
        getFriendsList({userName});
        
    })

    const friendsContext = useMemo(() => {
        
    }, [])
    useEffect(() => {

    })
    
    return (
        <FriendsContext.Provider value={friendsContext}>
            <FlatList
                data={state.friendsList}
                renderItem={({item}) => (
                <TouchableOpacity>
                    <Text>
                        {item.userNmame}
                    </Text>
                </TouchableOpacity>)}>
                <TouchableOpacity>
                    <Text>
                        here is the new view
                    </Text>
                </TouchableOpacity>
            </FlatList>
        </FriendsContext.Provider>

    );
}

export default FriendsList;