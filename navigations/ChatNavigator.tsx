import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MutableRefObject, useMemo, useReducer, useRef, useState } from "react";
import ChatContext from "../Contexts/ChatContext";
import FriendsList from "../screens/FriendsList";
import Chat from "../screens/Chat";
import * as SecureStore from 'expo-secure-store'
import { Socket, io } from "socket.io-client";
import { useNavigation } from "@react-navigation/native";

const ChatStackNavigator = createNativeStackNavigator();

const ChatNavigator = () => {
    const navigation = useNavigation(ChatStackNavigator)
    const socket: MutableRefObject<Socket<any> | undefined> = useRef();
    const [token, setToken] = useState("");
    const [state, dispatch] = useReducer((prevState, action) => {
        switch (action.type) {
            case 'ADD_MESSAGE_TO_CHAT_STORAGE': {
                if(prevState.chat.filter(e => e.contact === action.contact).length == 0) {
                    console.log(`Adding a chat with contact: ${action.contact} to the state`)
                    prevState.chat.push({
                        contact: action.contact,
                        messages: []
                    })
                }
                const currentChat = prevState.chat.filter(e => e.contact === action.contact)[0]
                currentChat.messages.push({
                    isSent: action.isSent,
                    message: action.message
                })
                console.log(`Returning state ${JSON.stringify(prevState)}`)
                return {
                    ...prevState
                }
            }
        }
    }, {
        chat: []
    })

    const chatContext = useMemo(() => ({
        updateChat: ({isSent, contact, message}) => {
            dispatch({ type: 'ADD_MESSAGE_TO_CHAT_STORAGE', isSent:isSent, contact: contact, message:message })
        },
        initSocket: async () => {
            if(token && socket) return
            const token = await SecureStore.getItemAsync("userToken");
            setToken(token)
            socket.current = io("http://192.168.1.21:3000")
            socket.current.on("response from server", message => console.log("Received socket message from backend " + message))
            socket.current.on("private-message-from-server", message => {
                console.log(`Received private message from ${message.from.sub} with content: ${message.message}`)
                dispatch({ type: "ADD_MESSAGE", message: message.from.sub + ": " + message.message, contact: message.from.sub, isSent: false })
            })
            socket.current.emit("register-client", { token: token })
        },
        getSocket: () => {
            return socket.current
        },
        getChatWithContact: (contact) => {
            const chat = state.chat.filter(e => e.contact === contact)[0]
            console.log(`getChatWithContact returning ${JSON.stringify(chat)}`)
            if (chat != null && chat != undefined && chat.messages.length > 0) {
                return {
                    messages: chat.messages,
                    contact: contact
                }
            } else {
                return {
                    contact: contact,
                    messages: []
                }
            }
        },
        stateChat: () => state.chat
    }),
        []);
    
    return (
        <ChatContext.Provider value={chatContext}>
            <ChatStackNavigator.Navigator
                initialRouteName="FriendsList"
                screenOptions={{
                    headerBackTitleVisible: true
                }}
                >
                <ChatStackNavigator.Screen name="FriendsList" component={FriendsList}></ChatStackNavigator.Screen>
                <ChatStackNavigator.Screen name="Chat" component={Chat} options={({route}) => ({title: route.params.title})}></ChatStackNavigator.Screen>
            </ChatStackNavigator.Navigator>
        </ChatContext.Provider>

    );
}

export default ChatNavigator;