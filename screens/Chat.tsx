import { useContext, useEffect, useReducer, useRef, useState } from "react";
import ChatContext from "../Contexts/ChatContext";
import { Button, FlatList, Text, TextInput, TouchableOpacity } from "react-native";
import * as SecureStore from 'expo-secure-store'

const Chat = ({ navigation, route }) => {
    // console.log(`Rendering Chat with messages ${JSON.stringify(route.params.messages)}`)
    const { updateChat, getSocket } = useContext(ChatContext)
    const socket = useRef()
    const [messageToSend, setMessageToSend] = useState("")
    const [token, setToken] = useState("")
    const [state, dispatch] = useReducer((prevState, action) => {
        switch (action.type) {
            case 'ADD_MESSAGE':
                const messages = prevState.messages
                console.log(`messages are from prevState: ${JSON.stringify(prevState.messages)}`)
                if(action.isSent === true) {
                    console.log(`Sending message to ${action.contact} with content: ${action.message}`)
                    socket.current.emit("private-message", {token: token, to: action.contact, message: action.message})
                }
                messages.push({
                    isSent: action.isSent,
                    message: action.message
                })
                return {
                    messages: messages
                }
        }
    },
    {messages: route.params.messages})

    useEffect(() => {
        const getFriendsList = async () => {
            const token = await SecureStore.getItemAsync("userToken");
            setToken(token)
            socket.current = getSocket()
            console.log(`Socket in Chat is: ${socket.current}`)
            socket.current.on("private-message-from-server", message => {
                console.log(`Received private message from ${message.from.sub} with content: ${message.message}`)
                dispatch({ type: "ADD_MESSAGE", message: message.from.sub + ": " + message.message, contact: message.from.sub, isSent: false })
            })
        }
        getFriendsList()
    }, [])



    const submitMessage = () => {
        console.log(`Submitting message for contact: ${route.params.contact} and content: ${messageToSend}`)
        // TODO check why this update of the state of stack nav is creating weired effects
        //updateChat({isSent: true, contact: route.params.contact, message: messageToSend})
        dispatch({ type: 'ADD_MESSAGE',isSent: true, contact: route.params.contact, message: messageToSend})
        setMessageToSend("")
    }
    return (
        <>
            <FlatList
                data={state.messages}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        key={item.message}
                        onPress={event => {}}>
                        <Text>
                            {item.message}
                        </Text>
                    </TouchableOpacity>)}>
            </FlatList>
            <TextInput
                style={{}}
                onChangeText={(text) => setMessageToSend(text)}
                placeholder="type something here"
                value={messageToSend}
            // defaultValue="text input for userName"
            />
            <Button
                title="Send"
                onPress={() => submitMessage()}
                disabled={false}
            />
        </>
    );
}

export default Chat;